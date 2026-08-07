import type { PRScoringResult, RiskTier } from "../scoring/signals.js";
import type { HybridScoringResult } from "../scoring/hybrid-engine.js";

// ─── Tier Visuals ─────────────────────────────────────────────────────────────

const TIER_EMOJI: Record<RiskTier, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
};

const TIER_LABEL: Record<RiskTier, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const STATUS_STATE: Record<RiskTier, "success" | "failure" | "failure"> = {
  low: "success",
  medium: "failure",
  high: "failure",
};

// ─── Progress Bar Helper (Option 3: HTML + Unicode) ───────────────────────────

function getProgressBar(score: number): string {
  const clamped = Math.min(100, Math.max(0, score));
  const filledCount = Math.round((clamped / 100) * 10);
  const emptyCount = 10 - filledCount;
  const blocks = "█".repeat(filledCount) + "░".repeat(emptyCount);
  return `<progress value="${clamped}" max="100"></progress> \`[${blocks}]\``;
}

// ─── PR Comment ───────────────────────────────────────────────────────────────

/**
 * Format the full PR comment markdown from hybrid scoring results.
 */
export function formatComment(result: HybridScoringResult | PRScoringResult, prTitle: string): string {
  const { prTier, totalFilesScored } = result;
  const emoji = TIER_EMOJI[prTier];
  const label = TIER_LABEL[prTier];
  const hybridResult = "aiAnalysis" in result ? (result as HybridScoringResult) : null;

  const lines: string[] = [
    `## ${emoji} Risk check: **${label.toLowerCase()}**`,
    `${prTitle} · ${totalFilesScored} file${totalFilesScored !== 1 ? "s" : ""} scored`,
    "",
  ];

  // ── AI Summary Section ───────────────────────────────────────────────────
  if (hybridResult?.aiAnalysis?.summary) {
    lines.push(`> 🤖 **AI Summary:** ${hybridResult.aiAnalysis.summary}`);
    lines.push(`> ⚠️ *This is an AI-based summary. Do not trust this fully; it is for validation purposes only. Please check carefully if you get a Red (High) risk tier.*`);
    lines.push("");
  }

  // ── Business Logic Audit Section ─────────────────────────────────────────
  if (hybridResult?.aiAnalysis?.businessLogicAnalysis) {
    const logic = hybridResult.aiAnalysis.businessLogicAnalysis;
    const statusBadge = logic.hasMismatch
      ? "`⚠️ LOGIC MISMATCH / GAP DETECTED`"
      : "`Intent matches implementation`";

    lines.push(`### 🤖 **Business logic audit** &nbsp;&nbsp;&nbsp;&nbsp; ${statusBadge}`);
    lines.push(`> ${logic.explanation}`);
    lines.push("");
  }

  // ── File Cards (Sorted by Score Descending) ──────────────────────────────
  const sortedFiles = [...result.fileResults].sort((a, b) => b.score - a.score);
  const gaps = hybridResult?.aiAnalysis?.businessLogicAnalysis?.gaps ?? [];

  for (const file of sortedFiles) {
    const fileEmoji = TIER_EMOJI[file.tier];
    const fileTierLabel = TIER_LABEL[file.tier];
    const progressBar = getProgressBar(file.score);

    lines.push(`> ### 📄 **${file.filePath}**`);
    lines.push(`> ${progressBar} &nbsp; **Score:** ${file.score}/100 &nbsp;|&nbsp; **Tier:** ${fileEmoji} ${fileTierLabel}`);
    lines.push(`>`);

    // Match business logic gaps for this file
    const matchingGaps = gaps.filter(
      (g) => g.affectedFile.toLowerCase() === file.filePath.toLowerCase()
    );

    if (matchingGaps.length > 0) {
      matchingGaps.forEach((gap) => {
        lines.push(`> **Issue / Gap Found:** ${gap.issue}`);
        lines.push(`> → *${gap.recommendation}*`);
        lines.push(`>`);
      });
    }

    // List risk signals & AI insights
    if (file.reasons.length > 0) {
      lines.push(`> **Risk Signals & Insights:**`);
      file.reasons.forEach((reason) => {
        lines.push(`> • ${reason}`);
      });
      lines.push(`>`);
    }

    lines.push(""); // Spacing between file cards
  }

  // ── Collapsible Scan Details Footer ──────────────────────────────────────
  lines.push("<details>");
  lines.push("<summary><b>🔍 View scan details</b></summary>");
  lines.push("");

  const aiStatusText = hybridResult?.aiUsed
    ? "AI-Powered Deep Analysis Enabled"
    : "Rule Engine Scan (AI Provider Offline/Skipped)";

  lines.push(
    `*Powered by [AI Code Risk Monitor](https://github.com) • ${aiStatusText} • Scored ${totalFilesScored} file${totalFilesScored !== 1 ? "s" : ""}*`
  );
  lines.push("</details>");

  return lines.join("\n");
}

// ─── Status Check ─────────────────────────────────────────────────────────────

export interface FormattedStatus {
  state: "success" | "failure" | "error" | "pending";
  description: string;
  context: string;
}

/**
 * Format the commit status check payload.
 */
export function formatStatusCheck(result: PRScoringResult): FormattedStatus {
  const { prTier, totalFilesScored, highRiskFiles, mediumRiskFiles } = result;

  let description: string;

  if (prTier === "high") {
    description = `High risk — ${highRiskFiles.length} file${highRiskFiles.length !== 1 ? "s" : ""} need${highRiskFiles.length === 1 ? "s" : ""} review`;
  } else if (prTier === "medium") {
    description = `Medium risk — ${mediumRiskFiles.length} file${mediumRiskFiles.length !== 1 ? "s" : ""} worth reviewing`;
  } else {
    description = `Low risk — ${totalFilesScored} file${totalFilesScored !== 1 ? "s" : ""} scored`;
  }

  return {
    state: STATUS_STATE[prTier],
    description,
    context: "AI Code Risk Monitor",
  };
}
