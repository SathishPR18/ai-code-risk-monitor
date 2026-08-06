import { describe, it, expect } from "vitest";
import { parseJsonFromAi } from "../../src/ai/json-parser.js";

describe("json-parser — parseJsonFromAi", () => {
  it("parses clean JSON string", () => {
    const raw = '{"score": 80, "tier": "high", "summary": "High risk"}';
    const result = parseJsonFromAi<{ score: number }>(raw);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(80);
  });

  it("extracts JSON from markdown code fences", () => {
    const raw = `
Here is your analysis:
\`\`\`json
{
  "score": 45,
  "tier": "medium"
}
\`\`\`
Hope this helps!
`.trim();

    const result = parseJsonFromAi<{ score: number; tier: string }>(raw);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(45);
    expect(result?.tier).toBe("medium");
  });

  it("handles JSON with trailing commas and whitespace", () => {
    const raw = `
{
  "score": 10,
  "tier": "low",
}
`;
    const result = parseJsonFromAi<{ score: number }>(raw);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(10);
  });

  it("returns null on completely unparseable string", () => {
    const raw = "This is not JSON at all";
    const result = parseJsonFromAi(raw);
    expect(result).toBeNull();
  });
});
