/**
 * Resilient JSON parser for LLM outputs.
 * Extracts clean JSON objects from markdown code fences or raw text.
 */

export function parseJsonFromAi<T>(rawText: string): T | null {
  if (!rawText || typeof rawText !== "string") return null;

  let cleaned = rawText.trim();

  // Strip markdown code block wrappers if present (e.g. ```json ... ``` or ``` ...)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Find first '{' and last '}' to extract valid JSON substring
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt minor recovery: remove trailing commas before closing braces/brackets
    try {
      const recovered = cleaned
        .replace(/,\s*([\}\]])/g, "$1")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // strip control chars
      return JSON.parse(recovered) as T;
    } catch {
      return null;
    }
  }
}
