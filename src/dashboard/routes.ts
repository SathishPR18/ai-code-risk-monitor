import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getGitHubOAuthUrl,
  exchangeCodeForToken,
  fetchGitHubUserProfile,
  determineUserRole,
  createSessionToken,
  verifySessionToken,
} from "./auth-service.js";
import { renderLoginView, renderDashboardView } from "./views.js";
import { db } from "../db/client.js";
import { riskScores } from "../db/schema.js";
import { desc } from "drizzle-orm";
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

    const role = determineUserRole(profile.username);
    const session: UserSession = {
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      role,
      userOrgs: profile.orgs,
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
      // 1. Fetch raw risk score records from DB
      const scores = await db.select().from(riskScores).orderBy(desc(riskScores.createdAt)).limit(200);

      // 2. Compute aggregate metrics
      const totalPRsScored = new Set(scores.map((s) => s.prNumber)).size;
      const highRiskCount = scores.filter((s) => s.riskTier === "high").length;
      const mediumRiskCount = scores.filter((s) => s.riskTier === "medium").length;
      const lowRiskCount = scores.filter((s) => s.riskTier === "low").length;
      const aiScannedCount = scores.filter((s) => s.aiSummary !== null).length;
      const aiCoveragePercentage = scores.length > 0 ? Math.round((aiScannedCount / scores.length) * 100) : 100;

      // 3. Compute risky hotspots (top 10 flagged files)
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

      // 4. Group audit logs by PR Number
      const prMap = new Map<number, PRAuditItem>();
      for (const s of scores) {
        if (!prMap.has(s.prNumber)) {
          prMap.set(s.prNumber, {
            prNumber: s.prNumber,
            prTitle: s.prTitle || `PR #${s.prNumber}`,
            repoFullName: session.userOrgs[0] ? `${session.userOrgs[0]}/repo` : "default/repo",
            stack: s.stack || "nextjs",
            score: s.score,
            tier: s.riskTier as "high" | "medium" | "low",
            summary: s.aiSummary || "Rule Engine Audit Scan",
            scannedAt: s.createdAt.toISOString(),
            reasons: s.reasons || [],
          });
        }
      }

      const auditLogs = Array.from(prMap.values());
      const availableRepos = Array.from(new Set(auditLogs.map((a) => a.repoFullName)));

      const result: DashboardStatsResult = {
        totalPRsScored,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        aiCoveragePercentage,
        hotspots,
        auditLogs,
        availableOrgs: session.userOrgs,
        availableRepos,
      };

      return reply.send(result);
    } catch (err) {
      console.error("[Dashboard Routes] Failed to fetch stats:", err);
      return reply.status(500).send({ error: "Failed to fetch dashboard stats" });
    }
  });
}
