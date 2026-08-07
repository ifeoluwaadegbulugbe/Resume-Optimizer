import { NextRequest, NextResponse } from "next/server";
import { chatRefineResume } from "@/lib/ai/stages/chatRefine";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { ResumeData, JobDescriptionAnalysis, ChatMessage } from "@/types/resume";

export const runtime = "nodejs";

interface Body {
  originalResumeData: ResumeData;
  currentResumeData: ResumeData;
  jd: JobDescriptionAnalysis;
  history: ChatMessage[];
  userMessage: string;
}

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;
    const result = await chatRefineResume(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
