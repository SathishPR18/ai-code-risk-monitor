import { GoogleGenAI } from "@google/genai";
import {
  SYSTEM_SECURITY_PROMPT,
  buildUserPrompt,
  type AiAnalysisPromptInput,
} from "./prompts.js";
import { parseJsonFromAi } from "./json-parser.js";

export interface BusinessLogicGap {
  issue: string;
  affectedFile: string;
  recommendation: string;
}

export interface BusinessLogicAnalysis {
  hasMismatch: boolean;
  explanation: string;
  gaps: BusinessLogicGap[];
}

export interface AiFileAnalysis {
  filePath: string;
  score: number;
  tier: "high" | "medium" | "low";
  findings: string[];
}

export interface AiAnalysisResult {
  intentMatch: boolean;
  score: number;
  tier: "high" | "medium" | "low";
  summary: string;
  businessLogicAnalysis: BusinessLogicAnalysis;
  fileAnalysis: AiFileAnalysis[];
  isFallback?: boolean;
}

/**
 * Execute Gemini AI Analysis with a 5-second timeout & graceful fallback.
 * Returns null if GEMINI_API_KEY is not set or if call fails/times out.
 */
export async function analyzePrWithGemini(
  input: AiAnalysisPromptInput
): Promise<AiAnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("[gemini-client] GEMINI_API_KEY not configured — skipping AI analysis");
    return null;
  }

  // If no changed files, return early
  if (!input.changedFiles || input.changedFiles.length === 0) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = buildUserPrompt(input);

    // Enforce 5-second timeout to prevent slowing down GitHub webhook response pipeline
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_SECURITY_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for deterministic analysis
      },
    });

    clearTimeout(timeoutId);

    const rawResponseText = response.text;
    if (!rawResponseText) {
      console.warn("[gemini-client] Empty response received from Gemini API");
      return null;
    }

    const result = parseJsonFromAi<AiAnalysisResult>(rawResponseText);
    if (!result || typeof result.score !== "number") {
      console.warn("[gemini-client] Failed to parse valid JSON from Gemini output");
      return null;
    }

    return result;
  } catch (err: unknown) {
    console.error("[gemini-client] Gemini API call failed or timed out:", err);
    return null;
  }
}
