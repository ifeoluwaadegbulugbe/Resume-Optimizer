import { NextRequest, NextResponse } from "next/server";
import { scoreATS } from "@/lib/ai/stages/scoreATS";
import { scoreRecruiter } from "@/lib/ai/stages/scoreRecruiter";
import { checkHallucinations } from "@/lib/ai/stages/checkHallucinations";
import { validateResumeLocally } from "@/lib/validation/validateResume";
import { assembleScores, bucketKeywords, computeLimitingFactors } from "@/lib/ai/pipeline";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import type { ResumeData, JobDescriptionAnalysis, OptimizedResume, ScoreGateResult } from "@/types/resume";

export const runtime = "nodejs";

const SCORE_TARGET = 90;

interface Body {
  originalResumeData: ResumeData;
  currentResumeData: ResumeData;
  jobAnalysis: JobDescriptionAnalysis;
  previous: OptimizedResume;
}

/** Re-scores the resume as it currently stands (e.g. after a chat edit) without
 * re-running the full multi-pass optimization loop — one ATS + one recruiter
 * call, reusing the same scoring rubric and assembly logic as the pipeline. */
export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  }

  try {
    const body = (await req.json()) as Body;
    const { originalResumeData, currentResumeData, jobAnalysis, previous } = body;

    const [atsResult, recruiterResult] = await Promise.all([
      scoreATS(currentResumeData, jobAnalysis),
      scoreRecruiter(originalResumeData, currentResumeData, jobAnalysis),
    ]);

    const localIssues = validateResumeLocally(currentResumeData);
    const hallucinationIssues = await checkHallucinations(originalResumeData, currentResumeData);
    const validationIssues = [...localIssues, ...hallucinationIssues];

    const reached90 = atsResult.breakdown.total >= SCORE_TARGET && recruiterResult.breakdown.total >= SCORE_TARGET;
    const priorIterations = previous.scoreGate?.iterations ?? 1;
    const scoreGate: ScoreGateResult = {
      reached90,
      iterations: priorIterations,
      scoreHistory: [
        ...(previous.scoreGate?.scoreHistory ?? []),
        { iteration: priorIterations + 1, ats: atsResult.breakdown.total, recruiter: recruiterResult.breakdown.total },
      ],
      limitingFactors: reached90 ? [] : computeLimitingFactors(atsResult, jobAnalysis),
    };

    const optimized: OptimizedResume = {
      ...previous,
      resumeData: currentResumeData,
      scores: assembleScores(atsResult, recruiterResult, {
        requiredSkillsPct: previous.scores.requiredSkillsPct,
        experienceRelevancePct: previous.scores.experienceRelevancePct,
      }),
      keywordCoverage: bucketKeywords(atsResult),
      recruiterFirstImpression: recruiterResult.firstImpression,
      bulletComparisons: recruiterResult.bulletComparisons,
      validationIssues,
      scoreGate,
    };

    return NextResponse.json({ optimized });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rescore failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
