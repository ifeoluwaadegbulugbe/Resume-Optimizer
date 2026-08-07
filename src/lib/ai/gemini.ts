import { GoogleGenAI } from "@google/genai";

// "-lite" tier: newest full "-flash" models launch with very tight free-tier
// daily quotas (as low as 20 requests/day), and one optimization run makes
// ~7 calls. The "-latest" alias keeps this pointed at Google's current
// recommended flash-lite model rather than a dated version that eventually
// gets retired for new API keys.
export const GEMINI_MODEL = "gemini-flash-lite-latest";

let client: GoogleGenAI | null = null;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add a free key from https://aistudio.google.com/apikey to .env.local."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export class AIPipelineError extends Error {
  stage: string;
  constructor(stage: string, message: string) {
    super(message);
    this.name = "AIPipelineError";
    this.stage = stage;
  }
}

/**
 * Calls Gemini with a JSON response schema and returns the parsed object.
 * Every pipeline stage goes through this so schema validation + error
 * handling is consistent.
 */
export async function generateStructured<T>(opts: {
  stage: string;
  systemInstruction: string;
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
}): Promise<T> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: opts.prompt,
      config: {
        systemInstruction: opts.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: opts.schema,
        temperature: opts.temperature ?? 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      throw new AIPipelineError(opts.stage, "Empty response from Gemini.");
    }
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof AIPipelineError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AIPipelineError(opts.stage, `Gemini call failed: ${message}`);
  }
}
