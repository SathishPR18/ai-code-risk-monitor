import {
  getPRFiles,
  postOrUpdateComment,
  postStatusCheck,
  getFileContent,
} from "./webhook/github-client.js";
import {
  detectStackFromPaths,
  detectStackFromPackageJson,
} from "./detector/stack-detector.js";
import { loadConfig } from "./detector/config-loader.js";
import { scorePR } from "./scoring/engine.js";
import { formatComment, formatStatusCheck } from "./output/formatter.js";
import { upsertOrg, upsertRepo, logRiskScores } from "./db/risk-log.js";
import type { NewRiskScore } from "./db/schema.js";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface OrchestrateInput {
  installationId: number;
  owner: string;
  repo: string;
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  headSha: string;
  orgName: string;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * The main pipeline. Called asynchronously after the webhook responds 202.
 *
 * Steps:
 *  1. Fetch PR files + diffs
 *  2. Detect stack
 *  3. Load config (user's .riskcheck/config.yml merged with defaults)
 *  4. Score all files
 *  5. Log results to DB
 *  6. Post comment + status check to GitHub
 */
export async function orchestrate(input: OrchestrateInput): Promise<void> {
  const {
    installationId,
    owner,
    repo,
    repoFullName,
    prNumber,
    prTitle,
    headSha,
    orgName,
  } = input;

  console.log(
    `[orchestrator] Starting PR #${prNumber} — ${repoFullName}`
  );

  // ── Step 1: Fetch PR files ────────────────────────────────────────────────
  const prFiles = await getPRFiles(installationId, owner, repo, prNumber);
  const allChangedPaths = prFiles.map((f) => f.filename);

  console.log(
    `[orchestrator] Fetched ${prFiles.length} changed files for PR #${prNumber}`
  );

  // ── Step 2: Detect stack ──────────────────────────────────────────────────
  let stack = detectStackFromPaths(allChangedPaths);

  if (stack === "unknown") {
    // Fallback: fetch package.json and check deps
    const packageJson = await getFileContent(
      installationId,
      owner,
      repo,
      "package.json"
    );
    if (packageJson) {
      stack = detectStackFromPackageJson(packageJson);
    }
  }

  console.log(`[orchestrator] Stack detected: ${stack}`);

  // ── Step 3: Load config ───────────────────────────────────────────────────
  const configContent = await getFileContent(
    installationId,
    owner,
    repo,
    ".riskcheck/config.yml"
  );
  const config = await loadConfig(configContent);

  console.log(
    `[orchestrator] Config loaded (custom: ${configContent !== null})`
  );

  // ── Step 4: Score files ───────────────────────────────────────────────────
  const scoringFiles = prFiles.map((f) => ({
    filePath: f.filename,
    patch: f.patch ?? "",
    status: f.status,
  }));

  const prResult = scorePR(scoringFiles, allChangedPaths, config);

  console.log(
    `[orchestrator] Scored ${prResult.totalFilesScored} files — PR tier: ${prResult.prTier.toUpperCase()}`
  );

  // ── Step 5: Log to DB ─────────────────────────────────────────────────────
  try {
    const orgId = await upsertOrg(orgName);
    const repoId = await upsertRepo(orgId, repoFullName, stack);

    const scoreRecords: NewRiskScore[] = prResult.fileResults.map((r) => ({
      orgId,
      repoId,
      prNumber,
      prTitle,
      filePath: r.filePath,
      score: r.score,
      riskTier: r.tier,
      reasons: r.reasons,
      stack,
      headSha,
    }));

    await logRiskScores(scoreRecords);

    console.log(
      `[orchestrator] Logged ${scoreRecords.length} score records to DB`
    );
  } catch (dbErr) {
    // DB failure should NOT prevent the comment from being posted
    console.error("[orchestrator] DB logging failed:", dbErr);
  }

  // ── Step 6: Post comment + status check ──────────────────────────────────
  const commentBody = formatComment(prResult, prTitle);
  const statusPayload = formatStatusCheck(prResult);

  await Promise.all([
    postOrUpdateComment(installationId, {
      owner,
      repo,
      prNumber,
      body: commentBody,
    }),
    postStatusCheck(installationId, {
      owner,
      repo,
      sha: headSha,
      state: statusPayload.state,
      description: statusPayload.description,
      context: statusPayload.context,
    }),
  ]);

  console.log(
    `[orchestrator] ✅ Done — PR #${prNumber} comment + status check posted (${prResult.prTier.toUpperCase()})`
  );
}
