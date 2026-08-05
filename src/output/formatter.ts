import type { PRScoringResult, ScoringResult, RiskTier } from "../scoring/signals.js";

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

// ─── PR Comment ───────────────────────────────────────────────────────────────

/**
 * Format the full PR comment markdown from scoring results.
 */
export function formatComment(result: PRScoringResult, prTitle: string): string {
  const { prTier, totalFilesScored } = result;
  const emoji = TIER_EMOJI[prTier];
  const label = TIER_LABEL[prTier];

  const lines: string[] = [
    `## ${emoji} Risk Check: **${label}**`,
    "",
    `> **PR:** ${prTitle}`,
    `> **Files scored:** ${totalFilesScored} | **Highest risk tier:** ${emoji} ${label}`,
    "",
  ];

  // ── High risk files first ────────────────────────────────────────────────
  if (result.highRiskFiles.length > 0) {
    lines.push("### 🔴 High Risk Files");
    lines.push("");
    lines.push(...formatFileTable(result.highRiskFiles));
    lines.push("");
  }

  // ── Medium risk files ────────────────────────────────────────────────────
  if (result.mediumRiskFiles.length > 0) {
    lines.push("### 🟡 Medium Risk Files");
    lines.push("");
    lines.push(...formatFileTable(result.mediumRiskFiles));
    lines.push("");
  }

  // ── Low risk files (collapsed) ───────────────────────────────────────────
  if (result.lowRiskFiles.length > 0) {
    lines.push("<details>");
    lines.push(
      `<summary>🟢 Low Risk Files (${result.lowRiskFiles.length})</summary>`
    );
    lines.push("");
    lines.push(...formatFileTable(result.lowRiskFiles));
    lines.push("</details>");
    lines.push("");
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  lines.push("---");
  lines.push(
    "*Powered by [AI Code Risk Monitor](https://github.com) • " +
      `Scored ${totalFilesScored} file${totalFilesScored !== 1 ? "s" : ""} • ` +
      `Add \`.riskcheck/config.yml\` to customize rules*`
  );

  return lines.join("\n");
}

function formatFileTable(files: ScoringResult[]): string[] {
  const rows: string[] = [
    "| File | Score | Tier | Risk Signals |",
    "|---|---|---|---|",
  ];

  for (const file of files) {
    const emoji = TIER_EMOJI[file.tier];
    const reasonsText =
      file.reasons.length > 0
        ? file.reasons.join("<br>")
        : "_No specific signals_";

    // Truncate long file paths for readability
    const displayPath =
      file.filePath.length > 60
        ? `...${file.filePath.slice(-57)}`
        : file.filePath;

    rows.push(
      `| \`${displayPath}\` | ${file.score} | ${emoji} ${TIER_LABEL[file.tier]} | ${reasonsText} |`
    );
  }

  return rows;
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
