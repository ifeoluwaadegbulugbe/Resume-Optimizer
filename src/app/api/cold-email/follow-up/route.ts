import { NextRequest, NextResponse } from "next/server";
import { generateFollowUp } from "@/lib/ai/coldEmail/followUp";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { ColdEmailInput, FollowUpMessage } from "@/types/coldEmail";

export const runtime = "nodejs";

interface Body {
  input: ColdEmailInput;
  originalSubject: string;
  originalBody: string;
  previousFollowUps: FollowUpMessage[];
  recipientReply?: string;
}

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;
    const followUp = await generateFollowUp(body);
    return NextResponse.json({ followUp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate follow-up.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
