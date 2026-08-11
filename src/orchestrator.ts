import {
  getPRFiles,
  postOrUpdateComment,
  postStatusCheck,
  postPRLabel,
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
import { sendHighRiskAlert } from "./notifications/alert-service.js";
import type { NewRiskScore } from "./db/schema.js";

function isIgnored(filePath: string, ignorePatterns: string[]): boolean {
  return ignorePatterns.some((pattern) => {
    if (!pattern) return false;
    const cleanPattern = pattern.replace(/^\//, "").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
    const regex = new RegExp(`^${cleanPattern}$`, "i");
    return regex.test(filePath) || filePath.toLowerCase().includes(pattern.replace(/\*/g, "").toLowerCase());
  });
}

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
  const rawPrFiles = await getPRFiles(installationId, owner, repo, prNumber);
  const allChangedPaths = rawPrFiles.map((f) => f.filename);

  console.log(
    `[orchestrator] Fetched ${rawPrFiles.length} changed files for PR #${prNumber}`
  );

  // ── Step 2: Detect stack ──────────────────────────────────────────────────
  let stack = detectStackFromPaths(allChangedPaths);

  if (stack === "generic") {
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
  const config = await loadConfig(configContent, stack);

  // Filter out ignored files (lockfiles, dist, vendor)
  const ignorePatterns = config.ignorePaths ?? [];
  const prFiles = rawPrFiles.filter((f) => !isIgnored(f.filename, ignorePatterns));

  console.log(
    `[orchestrator] Processing ${prFiles.length} active files after ignoring ${rawPrFiles.length - prFiles.length} files`
  );

  // ── Step 4: Layer 1 Rule Engine Scoring ──────────────────────────────────
  const scoringFiles = prFiles.map((f) => ({
    filePath: f.filename,
    patch: f.patch ?? "",
    status: f.status,
  }));

  // Cross-File Symbol Matcher: Check if removed export in File A is still used in File B
  const fileExportsMap = new Map<string, string[]>();
  const truncatedFiles: string[] = [];

  for (const f of scoringFiles) {
    if (f.patch) {
      const patchLines = f.patch.split("\n");
      if (patchLines.length > 500 || f.patch.length > 30000) {
        truncatedFiles.push(f.filePath);
      }
      const { extractRemovedExports } = await import("./scoring/ast-analyzer.js");
      const removedExports = extractRemovedExports(f.patch);
      if (removedExports.length > 0) {
        fileExportsMap.set(f.filePath, removedExports);
      }
    }
  }

  const ruleResult = scorePR(scoringFiles, allChangedPaths, config);

  // Inject cross_file_broken_reference signal if removed export is found in another changed file
  for (const [sourceFile, removedExports] of fileExportsMap.entries()) {
    for (const exp of removedExports) {
      const regex = new RegExp(`\\b${exp}\\b`);
      for (const res of ruleResult.fileResults) {
        if (res.filePath !== sourceFile) {
          const targetPatch = scoringFiles.find((s) => s.filePath === res.filePath)?.patch ?? "";
          if (regex.test(targetPatch)) {
            res.score = Math.min(100, res.score + 45);
            if (res.score >= 60) res.tier = "high";
            else if (res.score >= 30) res.tier = "medium";
            res.reasons.push(`Exported symbol '${exp}' removed in ${sourceFile} but still referenced (+45)`);
          }
        }
      }
    }
  }

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
      businessLogicAnalysis: finalResult.aiAnalysis?.intentAnalysis ?? null,
      aiSummary: finalResult.aiAnalysis?.summary ?? null,
      stack,
      headSha,
    }));

    await logRiskScores(scoreRecords);
  } catch (dbErr) {
    console.error("[orchestrator] DB logging failed:", dbErr);
  }

  // ── Step 8: Post comment + status check + auto-label ──────────────────────
  const commentBody = formatComment(finalResult, prTitle, truncatedFiles);
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
    postPRLabel(installationId, owner, repo, prNumber, finalResult.prTier),
  ]);

  // ── Step 9: Send High Risk Alert if needed ────────────────────────────────
  if (finalResult.prTier === "high") {
    sendHighRiskAlert({
      prTitle,
      prNumber,
      repoFullName,
      score: finalResult.highRiskFiles[0]?.score ?? 60,
      highRiskFileCount: finalResult.highRiskFiles.length,
    }).catch((err) => console.error("[orchestrator] High risk alert failed:", err));
  }

  console.log(
    `[orchestrator] ✅ Done — PR #${prNumber} comment + status check + label posted (${finalResult.prTier.toUpperCase()})`
  );
}
