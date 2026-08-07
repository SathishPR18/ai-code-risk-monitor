import type {
  ScoringInput,
  ScoringResult,
  PRScoringResult,
  RiskTier,
  Signal,
  RiskConfig,
} from "./signals.js";
import { PATH_DETECTORS } from "./path-detectors.js";
import { AST_DETECTORS } from "./ast-analyzer.js";

// ─── Tier Classification ──────────────────────────────────────────────────────

function classifyTier(score: number, config: RiskConfig): RiskTier {
  if (score >= config.tiers.high.min) return "high";
  if (score >= config.tiers.medium.min) return "medium";
  return "low";
}

const TIER_RANK: Record<RiskTier, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

// ─── Score a Single File ──────────────────────────────────────────────────────

/**
 * Pure function: given a file's diff + config, returns a risk score.
 * No side effects, no GitHub knowledge, no DB access.
 */
export function scoreFile(input: ScoringInput): ScoringResult {
  const { filePath, config } = input;
  const triggeredSignals: Signal[] = [];

  // ── Layer 1: Path/pattern detectors ────────────────────────────────────────
  for (const detector of PATH_DETECTORS) {
    // Skip if this signal is disabled in config
    if (config.disabledSignals.includes(detector.signal)) continue;

    if (detector.detect(input)) {
      const weight = config.weights[detector.signal] ?? 0;
      triggeredSignals.push({
        name: detector.signal,
        weight,
        reason: detector.reason,
      });
    }
  }

  // ── Layer 2: Code-Level detectors ──────────────────────────────────────────
  for (const detector of AST_DETECTORS) {
    if (config.disabledSignals.includes(detector.signal)) continue;

    // Avoid double-counting: skip if already triggered by path detector
    const alreadyTriggered = triggeredSignals.some(
      (s) => s.name === detector.signal
    );
    if (alreadyTriggered) continue;

    if (detector.detect(input)) {
      const weight = config.weights[detector.signal] ?? 0;
      triggeredSignals.push({
        name: detector.signal,
        weight,
        reason: detector.reason,
      });
    }
  }

  // ── Accumulate score ────────────────────────────────────────────────────────
  const rawScore = triggeredSignals.reduce((sum, s) => sum + s.weight, 0);

  // Clamp to 0–100
  const score = Math.min(100, Math.max(0, rawScore));

  const tier = classifyTier(score, config);

  // ── Build human-readable reasons ────────────────────────────────────────────
  const reasons = triggeredSignals.map((s) => {
    const sign = s.weight >= 0 ? "+" : "";
    return `${s.reason} (${sign}${s.weight})`;
  });

  return {
    filePath,
    score,
    tier,
    reasons,
    triggeredSignals,
  };
}

// ─── Score a Full PR (all files) ──────────────────────────────────────────────

/**
 * Score every file in the PR, then roll up to a PR-level tier.
 * Rollup rule: WORST CASE wins. One high-risk file = high-risk PR.
 */
export function scorePR(
  files: Array<{ filePath: string; patch: string; status: string }>,
  allChangedPaths: string[],
  config: RiskConfig
): PRScoringResult {
  const fileResults: ScoringResult[] = files.map((file) =>
    scoreFile({
      filePath: file.filePath,
      patch: file.patch,
      status: file.status,
      allChangedPaths,
      config,
    })
  );

  // Worst-case rollup
  const prTier = fileResults.reduce<RiskTier>((worst, result) => {
    return TIER_RANK[result.tier] > TIER_RANK[worst] ? result.tier : worst;
  }, "low");

  return {
    prTier,
    fileResults,
    totalFilesScored: fileResults.length,
    highRiskFiles: fileResults.filter((r) => r.tier === "high"),
    mediumRiskFiles: fileResults.filter((r) => r.tier === "medium"),
    lowRiskFiles: fileResults.filter((r) => r.tier === "low"),
  };
}
