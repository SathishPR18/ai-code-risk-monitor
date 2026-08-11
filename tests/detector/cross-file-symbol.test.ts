import { describe, it, expect } from "vitest";
import { extractRemovedExports } from "../../src/scoring/ast-analyzer.js";
import { formatComment } from "../../src/output/formatter.js";
import type { PRScoringResult } from "../../src/scoring/signals.js";

describe("Cross-File Symbol Matcher & Truncation Alerts", () => {
  it("extracts removed export functions from diff patch", () => {
    const patch = `
@@ -1,4 +1,3 @@
-export function checkUserSession(token: string) {
 export function verifyUserSession(token: string) {
   return true;
 }
`;
    const exports = extractRemovedExports(patch);
    expect(exports).toContain("checkUserSession");
    expect(exports).not.toContain("verifyUserSession");
  });

  it("does not flag symbol if it was re-added in added lines", () => {
    const patch = `
@@ -1,4 +1,4 @@
-export function checkUserSession(token: string) {
+export function checkUserSession(token: string, options?: any) {
   return true;
 }
`;
    const exports = extractRemovedExports(patch);
    expect(exports).toHaveLength(0);
  });

  it("formats comment with truncation warning alert when files are truncated", () => {
    const mockResult: PRScoringResult = {
      prTier: "medium",
      totalFilesScored: 1,
      highRiskFiles: [],
      mediumRiskFiles: [],
      lowRiskFiles: [],
      fileResults: [
        {
          filePath: "database/schema.ts",
          score: 45,
          tier: "medium",
          reasons: ["Data fetching changed (+20)"],
          triggeredSignals: [],
        },
      ],
    };

    const comment = formatComment(mockResult, "feat: update schema", ["database/schema.ts"]);
    expect(comment).toContain("Notice:");
    expect(comment).toContain("database/schema.ts");
    expect(comment).toContain("exceeded 500 lines and was truncated for AI audit");
  });
});
