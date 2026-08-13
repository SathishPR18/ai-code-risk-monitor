import type { PRScoringResult, ScoringResult, RiskTier } from "./signals.js";
import type { AiAnalysisResult } from "../ai/gemini-client.js";

const TIER_RANK: Record<RiskTier, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function classifyTier(score: number): RiskTier {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export interface HybridScoringResult extends PRScoringResult {
  aiAnalysis: AiAnalysisResult | null;
  aiUsed: boolean;
}

/**
 * Merges Layer 1 deterministic rule scores with Layer 2 Gemini AI analysis.
 * Formula: FinalScore = Max(Layer1_Score, Layer2_AI_Score)
 * Guardrail: AI can only ELEVATE risk tier, NEVER lower it.
 */
export function combineScores(
  ruleResult: PRScoringResult,
  aiResult: AiAnalysisResult | null
): HybridScoringResult {
  if (!aiResult) {
    return {
      ...ruleResult,
      aiAnalysis: null,
      aiUsed: false,
    };
  }

  const updatedFileResults: ScoringResult[] = ruleResult.fileResults.map((fileRes) => {
    const aiFileMatch = aiResult.fileAnalysis?.find(
      (f) => f.filePath.toLowerCase() === fileRes.filePath.toLowerCase()
    );

    if (!aiFileMatch) return fileRes;

    // Apply Max(Layer1, Layer2) math
    const combinedScore = Math.max(fileRes.score, aiFileMatch.score);

    // Enforce guardrail: Risk tier cannot be lower than Layer 1 rule tier
    const rawTier = classifyTier(combinedScore);
    const finalTier = TIER_RANK[rawTier] >= TIER_RANK[fileRes.tier] ? rawTier : fileRes.tier;

    // Merge reasons
    const mergedReasons = [...fileRes.reasons];
    if (aiFileMatch.findings && aiFileMatch.findings.length > 0) {
      aiFileMatch.findings.forEach((finding) => {
        if (!mergedReasons.some((r) => r.includes(finding))) {
          mergedReasons.push(`AI Insight: ${finding}`);
        }
      });
    }

    return {
      ...fileRes,
      score: combinedScore,
      tier: finalTier,
      reasons: mergedReasons,
    };
  });

  // Calculate overall PR Tier: Max(Rule PR Tier, AI Overall Tier)
  const aiPRTier = aiResult.tier || classifyTier(aiResult.score || 0);
  const finalPRTier = TIER_RANK[aiPRTier] >= TIER_RANK[ruleResult.prTier]
    ? aiPRTier
    : ruleResult.prTier;

  return {
    prTier: finalPRTier,
    fileResults: updatedFileResults,
    totalFilesScored: updatedFileResults.length,
    highRiskFiles: updatedFileResults.filter((r) => r.tier === "high"),
    mediumRiskFiles: updatedFileResults.filter((r) => r.tier === "medium"),
    lowRiskFiles: updatedFileResults.filter((r) => r.tier === "low"),
    aiAnalysis: aiResult,
    aiUsed: true,
  };
}
