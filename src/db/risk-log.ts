import { eq, and } from "drizzle-orm";
import { db } from "./client.js";
import { organizations, repos, riskScores } from "./schema.js";
import type { NewRiskScore } from "./schema.js";

// ─── Org ──────────────────────────────────────────────────────────────────────

/**
 * Find or create an organization record by name.
 * Returns the org id.
 */
export async function upsertOrg(name: string): Promise<number> {
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.name, name))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!.id;
  }

  const inserted = await db
    .insert(organizations)
    .values({ name })
    .returning({ id: organizations.id });

  return inserted[0]!.id;
}

// ─── Repo ─────────────────────────────────────────────────────────────────────

/**
 * Find or create a repo record.
 * Returns the repo id.
 */
export async function upsertRepo(
  orgId: number,
  repoFullName: string,
  stack: string
): Promise<number> {
  const existing = await db
    .select({ id: repos.id })
    .from(repos)
    .where(
      and(
        eq(repos.orgId, orgId),
        eq(repos.githubRepoFullName, repoFullName)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!.id;
  }

  const inserted = await db
    .insert(repos)
    .values({ orgId, githubRepoFullName: repoFullName, stack })
    .returning({ id: repos.id });

  return inserted[0]!.id;
}

// ─── Risk Score ───────────────────────────────────────────────────────────────

/**
 * Insert a batch of risk score records (one per file in the PR).
 */
export async function logRiskScores(
  scores: NewRiskScore[]
): Promise<void> {
  if (scores.length === 0) return;
  await db.insert(riskScores).values(scores);
}
