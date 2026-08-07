import { NextRequest, NextResponse } from "next/server";
import { regenerateBullet } from "@/lib/ai/stages/regenerateBullet";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { JobDescriptionAnalysis } from "@/types/resume";

export const runtime = "nodejs";

interface Body {
  originalBullet: string;
  currentBullet: string;
  roleContext: string;
  jd: JobDescriptionAnalysis;
}

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;
    const alternatives = await regenerateBullet(body);
    return NextResponse.json({ alternatives });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to regenerate bullet.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
