import { GoogleGenAI } from "@google/genai";
import {
  SYSTEM_SECURITY_PROMPT,
  buildUserPrompt,
  type AiAnalysisPromptInput,
} from "./prompts.js";
import { parseJsonFromAi } from "./json-parser.js";

export interface IntentGap {
  issue: string;
  affectedFile: string;
  recommendation: string;
}

export interface IntentAnalysis {
  hasMismatch: boolean;
  explanation: string;
  gaps: IntentGap[];
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
  intentAnalysis: IntentAnalysis;
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

    const candidateModels = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
    ];

    // Enforce guaranteed 5-second timeout via Promise.race
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<string | null>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error("Gemini API call timed out after 5000ms"));
      }, 5000);
    });

    const callApi = async (): Promise<string | null> => {
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: SYSTEM_SECURITY_PROMPT,
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          });
          if (response.text) {
            return response.text;
          }
        } catch (modelErr) {
          console.warn(`[gemini-client] Model ${model} failed, trying next candidate...`, (modelErr as Error).message);
        }
      }
      return null;
    };

    let rawResponseText: string | null = null;
    try {
      rawResponseText = await Promise.race([callApi(), timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }

    if (!rawResponseText) {
      console.warn("[gemini-client] All Gemini candidate models failed or returned empty text");
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
