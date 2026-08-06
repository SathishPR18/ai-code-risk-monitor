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
import { combineScores } from "./scoring/hybrid-engine.js";
import { analyzePrWithGemini } from "./ai/gemini-client.js";
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
  prDescription?: string;
  headSha: string;
  orgName: string;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * The main pipeline. Called asynchronously after the webhook responds 202.
 *
 * Steps:
 *  1. Fetch PR files + diffs
 *  2. Detect stack (Universal: Next.js, Node/Express, Python, Java, Go, PHP, or Generic)
 *  3. Load config (.riskcheck/config.yml)
 *  4. Layer 1: Score files with Rule Engine
 *  5. Layer 2: Perform Gemini AI Deep Analysis (with 5s timeout & fail-safe fallback)
 *  6. Combine scores with Max(L1, L2) math & non-demotion rule
 *  7. Log results to Neon DB
 *  8. Post PR comment & commit status check to GitHub
 */
export async function orchestrate(input: OrchestrateInput): Promise<void> {
  const {
    installationId,
    owner,
    repo,
    repoFullName,
    prNumber,
    prTitle,
    prDescription = "",
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

  if (stack === "generic") {
    // Fallback: fetch package.json and check deps if available
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

  // ── Step 4: Layer 1 Rule Engine Scoring ──────────────────────────────────
  const scoringFiles = prFiles.map((f) => ({
    filePath: f.filename,
    patch: f.patch ?? "",
    status: f.status,
  }));

  const ruleResult = scorePR(scoringFiles, allChangedPaths, config);

  // ── Step 5: Layer 2 Gemini AI Deep Analysis ──────────────────────────────
  console.log(`[orchestrator] Running Gemini AI Deep Analysis...`);
  const aiResult = await analyzePrWithGemini({
    prTitle,
    prDescription,
    changedFiles: scoringFiles,
  });

  // ── Step 6: Combine Layer 1 & Layer 2 Scores ─────────────────────────────
  const finalResult = combineScores(ruleResult, aiResult);

  console.log(
    `[orchestrator] Scored ${finalResult.totalFilesScored} files (AI Used: ${finalResult.aiUsed}) — Final PR tier: ${finalResult.prTier.toUpperCase()}`
  );

  // ── Step 7: Log to DB ─────────────────────────────────────────────────────
  try {
    const orgId = await upsertOrg(orgName);
    const repoId = await upsertRepo(orgId, repoFullName, stack);

    const scoreRecords: NewRiskScore[] = finalResult.fileResults.map((r) => ({
      orgId,
      repoId,
      prNumber,
      prTitle,
      filePath: r.filePath,
      score: r.score,
      riskTier: r.tier,
      reasons: r.reasons,
      businessLogicAnalysis: finalResult.aiAnalysis?.businessLogicAnalysis ?? null,
      aiSummary: finalResult.aiAnalysis?.summary ?? null,
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

  // ── Step 8: Post comment + status check ──────────────────────────────────
  const commentBody = formatComment(finalResult, prTitle);
  const statusPayload = formatStatusCheck(finalResult);

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
    `[orchestrator] ✅ Done — PR #${prNumber} comment + status check posted (${finalResult.prTier.toUpperCase()})`
  );
}
