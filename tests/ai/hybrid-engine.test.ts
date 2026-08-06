import { describe, it, expect } from "vitest";
import { combineScores } from "../../src/scoring/hybrid-engine.js";
import type { PRScoringResult } from "../../src/scoring/signals.js";
import type { AiAnalysisResult } from "../../src/ai/gemini-client.js";

const mockRuleResult: PRScoringResult = {
  prTier: "high",
  totalFilesScored: 1,
  highRiskFiles: [
    {
      filePath: "auth.config.ts",
      score: 70,
      tier: "high",
      reasons: ["Auth config changed (+40)"],
      triggeredSignals: [],
    },
  ],
  mediumRiskFiles: [],
  lowRiskFiles: [],
  fileResults: [
    {
      filePath: "auth.config.ts",
      score: 70,
      tier: "high",
      reasons: ["Auth config changed (+40)"],
      triggeredSignals: [],
    },
  ],
};

describe("hybrid-engine — combineScores", () => {
  it("returns rule result when AI is null (fallback mode)", () => {
    const result = combineScores(mockRuleResult, null);
    expect(result.aiUsed).toBe(false);
    expect(result.prTier).toBe("high");
    expect(result.fileResults[0].score).toBe(70);
  });

  it("prevents AI from demoting a HIGH risk rule score to LOW", () => {
    const mockAiLow: AiAnalysisResult = {
      intentMatch: true,
      score: 10,
      tier: "low",
      summary: "AI thinks it is safe",
      businessLogicAnalysis: {
        hasMismatch: false,
        explanation: "Matches intent",
        gaps: [],
      },
      fileAnalysis: [
        {
          filePath: "auth.config.ts",
          score: 10,
          tier: "low",
          findings: ["Safe change"],
        },
      ],
    };

    const result = combineScores(mockRuleResult, mockAiLow);
    expect(result.aiUsed).toBe(true);
    // Score remains Max(70, 10) = 70
    expect(result.fileResults[0].score).toBe(70);
    // Tier remains HIGH (non-demotion rule)
    expect(result.fileResults[0].tier).toBe("high");
    expect(result.prTier).toBe("high");
  });

  it("allows AI to elevate a LOW risk rule score to HIGH", () => {
    const mockLowRuleResult: PRScoringResult = {
      prTier: "low",
      totalFilesScored: 1,
      highRiskFiles: [],
      mediumRiskFiles: [],
      lowRiskFiles: [
        {
          filePath: "app/api/users/route.ts",
          score: 10,
          tier: "low",
          reasons: [],
          triggeredSignals: [],
        },
      ],
      fileResults: [
        {
          filePath: "app/api/users/route.ts",
          score: 10,
          tier: "low",
          reasons: [],
          triggeredSignals: [],
        },
      ],
    };

    const mockAiHigh: AiAnalysisResult = {
      intentMatch: false,
      score: 85,
      tier: "high",
      summary: "Critical logic flaw found by AI",
      businessLogicAnalysis: {
        hasMismatch: true,
        explanation: "Missing validation",
        gaps: [
          {
            issue: "No validation",
            affectedFile: "app/api/users/route.ts",
            recommendation: "Add validation",
          },
        ],
      },
      fileAnalysis: [
        {
          filePath: "app/api/users/route.ts",
          score: 85,
          tier: "high",
          findings: ["Missing input validation on backend route"],
        },
      ],
    };

    const result = combineScores(mockLowRuleResult, mockAiHigh);
    expect(result.aiUsed).toBe(true);
    expect(result.fileResults[0].score).toBe(85);
    expect(result.fileResults[0].tier).toBe("high");
    expect(result.prTier).toBe("high");
  });
});
