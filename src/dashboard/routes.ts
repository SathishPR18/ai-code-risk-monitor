import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getGitHubOAuthUrl,
  exchangeCodeForToken,
  fetchGitHubUserProfile,
  createSessionToken,
  verifySessionToken,
} from "./auth-service.js";
import { renderLoginView, renderDashboardView } from "./views.js";
import { db } from "../db/client.js";
import { riskScores, repos } from "../db/schema.js";
import { desc, inArray } from "drizzle-orm";
import type { UserSession, DashboardStatsResult, PRAuditItem, RiskyHotspot } from "./types.js";

const COOKIE_NAME = "ai_risk_session";

function getSessionFromRequest(req: FastifyRequest): UserSession | null {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

export async function registerDashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // ── 1. GET /login ────────────────────────────────────────────────────────
  fastify.get("/login", async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.type("text/html").send(renderLoginView());
  });

  // ── 2. GET /auth/github ──────────────────────────────────────────────────
  fastify.get("/auth/github", async (req: FastifyRequest, reply: FastifyReply) => {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "ai-code-risk-monitor.onrender.com";
    const redirectUri = `${protocol}://${host}/auth/github/callback`;
    const oauthUrl = getGitHubOAuthUrl(redirectUri);
    reply.redirect(oauthUrl);
  });

  // ── 3. GET /auth/github/callback ─────────────────────────────────────────
  fastify.get("/auth/github/callback", async (req: FastifyRequest, reply: FastifyReply) => {
    const { code } = req.query as { code?: string };

    if (!code) {
      return reply.redirect("/login?error=no_code");
    }

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "ai-code-risk-monitor.onrender.com";
    const redirectUri = `${protocol}://${host}/auth/github/callback`;

    const token = await exchangeCodeForToken(code, redirectUri);
    if (!token) {
      return reply.redirect("/login?error=token_failed");
    }

    const profile = await fetchGitHubUserProfile(token);
    if (!profile) {
      return reply.redirect("/login?error=profile_failed");
    }

    const session: UserSession = {
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      userRepos: profile.userRepos,
    };

    const sessionToken = createSessionToken(session);

    reply.setCookie(COOKIE_NAME, sessionToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    reply.redirect("/dashboard");
  });

  // ── 4. GET /auth/logout ──────────────────────────────────────────────────
  fastify.get("/auth/logout", async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    reply.redirect("/login");
  });

  // ── 5. GET /dashboard ────────────────────────────────────────────────────
  fastify.get("/dashboard", async (req: FastifyRequest, reply: FastifyReply) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      return reply.redirect("/login");
    }

    reply.type("text/html").send(renderDashboardView(session));
  });

  // ── 6. GET /api/dashboard/stats ──────────────────────────────────────────
  fastify.get("/api/dashboard/stats", async (req: FastifyRequest, reply: FastifyReply) => {
    const session = getSessionFromRequest(req);
    if (!session) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      // 1. Data Isolation: Query DB for repos matching user's authenticated GitHub repository full names
      const allowedReposInDb =
        session.userRepos.length > 0
          ? await db
              .select({ id: repos.id, githubRepoFullName: repos.githubRepoFullName })
              .from(repos)
              .where(inArray(repos.githubRepoFullName, session.userRepos))
          : [];

      const allowedRepoIds = allowedReposInDb.map((r) => r.id);

      // If user has zero connected repos in database yet, return empty stats
      if (allowedRepoIds.length === 0) {
        const emptyResult: DashboardStatsResult = {
          totalPRsScored: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          aiCoveragePercentage: 100,
          hotspots: [],
          auditLogs: [],
          availableRepos: session.userRepos,
        };
        return reply.send(emptyResult);
      }

      // 2. Query risk_scores WHERE repo_id belongs to the logged-in user's authenticated repos
      const scores = await db
        .select()
        .from(riskScores)
        .where(inArray(riskScores.repoId, allowedRepoIds))
        .orderBy(desc(riskScores.createdAt))
        .limit(500);

      const repoMap = new Map<number, string>(allowedReposInDb.map((r) => [r.id, r.githubRepoFullName]));

      // 3. Group file scores by PR Number to calculate UNIQUE PR metrics
      const prGroupMap = new Map<number, { title: string; repoFullName: string; stack: string; worstTier: "high" | "medium" | "low"; maxScore: number; summary: string; createdAt: Date }>();

      for (const s of scores) {
        const repoName = repoMap.get(s.repoId) || (session.userRepos[0] ?? "repo");
        const existing = prGroupMap.get(s.prNumber);
        const currentTier = s.riskTier as "high" | "medium" | "low";

        if (existing) {
          if (s.score > existing.maxScore) {
            existing.maxScore = s.score;
            existing.worstTier = currentTier;
          }
          if (s.aiSummary) existing.summary = s.aiSummary;
        } else {
          prGroupMap.set(s.prNumber, {
            title: s.prTitle || `PR #${s.prNumber}`,
            repoFullName: repoName,
            stack: s.stack || "nextjs",
            worstTier: currentTier,
            maxScore: s.score,
            summary: s.aiSummary || "Rule Engine Audit Scan",
            createdAt: s.createdAt,
          });
        }
      }

      // Calculate aggregate stats based on UNIQUE PULL REQUESTS
      const uniquePRs = Array.from(prGroupMap.values());
      const totalPRsScored = uniquePRs.length;
      const highRiskCount = uniquePRs.filter((p) => p.worstTier === "high").length;
      const mediumRiskCount = uniquePRs.filter((p) => p.worstTier === "medium").length;
      const lowRiskCount = uniquePRs.filter((p) => p.worstTier === "low").length;

      const aiScannedCount = scores.filter((s) => s.aiSummary !== null).length;
      const aiCoveragePercentage = scores.length > 0 ? Math.round((aiScannedCount / scores.length) * 100) : 100;

      // Compute risky hotspots (top 10 flagged files)
      const hotspotMap = new Map<string, { count: number; maxScore: number; tier: "high" | "medium" | "low" }>();
      for (const s of scores) {
        const existing = hotspotMap.get(s.filePath);
        if (existing) {
          existing.count += 1;
          if (s.score > existing.maxScore) {
            existing.maxScore = s.score;
            existing.tier = s.riskTier as "high" | "medium" | "low";
          }
        } else {
          hotspotMap.set(s.filePath, {
            count: 1,
            maxScore: s.score,
            tier: s.riskTier as "high" | "medium" | "low",
          });
        }
      }

      const hotspots: RiskyHotspot[] = Array.from(hotspotMap.entries())
        .map(([filePath, data]) => ({
          filePath,
          scanCount: data.count,
          maxScore: data.maxScore,
          highestTier: data.tier,
        }))
        .sort((a, b) => b.maxScore - a.maxScore)
        .slice(0, 10);

      // Build PR audit logs list
      const auditLogs: PRAuditItem[] = Array.from(prGroupMap.entries()).map(([prNumber, prData]) => ({
        prNumber,
        prTitle: prData.title,
        repoFullName: prData.repoFullName,
        stack: prData.stack,
        score: prData.maxScore,
        tier: prData.worstTier,
        summary: prData.summary,
        scannedAt: prData.createdAt.toISOString(),
        reasons: [],
      }));

      const result: DashboardStatsResult = {
        totalPRsScored,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        aiCoveragePercentage,
        hotspots,
        auditLogs,
        availableRepos: session.userRepos,
      };

      return reply.send(result);
    } catch (err) {
      console.error("[Dashboard Routes] Failed to fetch stats:", err);
      return reply.status(500).send({ error: "Failed to fetch dashboard stats" });
    }
  });
}
