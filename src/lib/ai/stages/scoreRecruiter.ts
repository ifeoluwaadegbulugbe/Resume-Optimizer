import { generateStructured } from "../gemini";
import { recruiterResultSchema } from "../schemas";
import type {
  ResumeData,
  JobDescriptionAnalysis,
  RecruiterScoreBreakdown,
  RecruiterFirstImpression,
  BulletComparison,
} from "@/types/resume";
import { randomUUID } from "crypto";

export interface RecruiterResult {
  breakdown: RecruiterScoreBreakdown;
  firstImpression: RecruiterFirstImpression;
  bulletComparisons: BulletComparison[];
  cultureFitPct: number;
  achievementStrengthPct: number;
  readabilityPct: number;
}

export async function scoreRecruiter(
  original: ResumeData,
  optimized: ResumeData,
  jd: JobDescriptionAnalysis
): Promise<RecruiterResult> {
  const raw = await generateStructured<{
    breakdown: RecruiterScoreBreakdown;
    strongSignals: string[];
    weakSignals: string[];
    shortlistDecision: "Yes" | "Maybe" | "No";
    shortlistReason: string;
    bulletComparisons: Array<Omit<BulletComparison, "bulletId">>;
    cultureFitPct: number;
    achievementStrengthPct: number;
    readabilityPct: number;
  }>({
    stage: "simulating_recruiter",
    systemInstruction: `You are a senior recruiter simulating a real resume screen for this role. Score 0-100
across: relevance (20 — does it immediately communicate relevance to this role), achievementStrength (20 — are
accomplishments clear and measurable), experienceQuality (15), clarity (10 — can a recruiter understand the
candidate quickly), careerNarrative (10 — coherent professional story), cultureFit (10 — demonstrated, not
claimed, behavioral fit with the inferred culture signals), credibility (10 — does it read as realistic and
evidence-based, not embellished), professionalPresentation (5). "total" must equal the sum. Then simulate what a
recruiter notices in the first 6-10 seconds: 3-5 strong signals and 2-4 weak signals, and give a shortlist
decision of Yes/Maybe/No with a one-sentence reason. Finally, pick up to 6 of the most improved bullets and show
original vs optimized with what keywords were added and why the new version is stronger.`,
    prompt: `Job: ${jd.jobTitle} at ${jd.companyName}
Culture signals (inferred): ${jd.cultureSignals.map((c) => c.label).join(", ")}

ORIGINAL resume (for before/after comparison only):
${JSON.stringify(original, null, 2)}

OPTIMIZED resume being scored:
${JSON.stringify(optimized, null, 2)}`,
    schema: recruiterResultSchema,
    temperature: 0.3,
  });

  return {
    breakdown: raw.breakdown,
    firstImpression: {
      strongSignals: raw.strongSignals,
      weakSignals: raw.weakSignals,
      shortlistDecision: raw.shortlistDecision,
      shortlistReason: raw.shortlistReason,
    },
    bulletComparisons: raw.bulletComparisons.map((b) => ({ bulletId: randomUUID(), ...b })),
    cultureFitPct: raw.cultureFitPct,
    achievementStrengthPct: raw.achievementStrengthPct,
    readabilityPct: raw.readabilityPct,
  };
}
