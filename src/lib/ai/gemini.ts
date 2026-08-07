import { GoogleGenAI } from "@google/genai";

// "-latest" alias so this keeps working as Google retires dated model
// versions (gemini-2.5-flash was cut off for new API keys shortly after
// launch — see the note in README about verifying with /api/debug-models
// if generation ever starts failing with a 404 model error).
export const GEMINI_MODEL = "gemini-flash-latest";

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
