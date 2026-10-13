import { describe, it, expect } from "vitest";
import { buildUserPrompt, truncatePatch } from "../../src/ai/prompts.js";

describe("AI Prompts — buildUserPrompt & Layer 1 injection", () => {
  it("formats user prompt without layer1Findings cleanly", () => {
    const prompt = buildUserPrompt({
      prTitle: "feat: add user profile page",
      prDescription: "Adds user profile details",
      changedFiles: [
        {
          filePath: "app/profile/page.tsx",
          patch: "+export default function Profile() { return <div>User</div>; }",
        },
      ],
    });

    expect(prompt).toContain("<title>feat: add user profile page</title>");
    expect(prompt).toContain('<file path="app/profile/page.tsx">');
    expect(prompt).not.toContain("<layer1_rule_findings>");
  });

  it("injects layer1_rule_findings when provided with flagged signals", () => {
    const prompt = buildUserPrompt({
      prTitle: "fix: update auth flow",
      prDescription: "Adjusts auth logic",
      changedFiles: [
        {
          filePath: "auth.config.ts",
          patch: "-export const auth = false;\n+export const auth = true;",
        },
      ],
      layer1Findings: [
        {
          filePath: "auth.config.ts",
          score: 70,
          tier: "high",
          reasons: ["Auth config changed (+40)", "No test file changed (+15)"],
        },
      ],
    });

    expect(prompt).toContain("<layer1_rule_findings>");
    expect(prompt).toContain("The static rule engine pre-screened these changes");
    expect(prompt).toContain("auth.config.ts (Score: 70, Tier: HIGH)");
    expect(prompt).toContain("Auth config changed (+40)");
  });

  it("truncates patches that exceed 500 lines or 30000 chars", () => {
    const largePatch = Array.from({ length: 600 }, (_, i) => `+line ${i}`).join("\n");
    const truncated = truncatePatch(largePatch);

    expect(truncated).toContain("[... diff truncated due to length limits ...]");
    expect(truncated.split("\n").length).toBeLessThanOrEqual(505);
  });
});
