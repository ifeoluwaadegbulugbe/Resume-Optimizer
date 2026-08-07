import { randomUUID } from "crypto";
import type {
  ResumeData,
  JobDescriptionAnalysis,
  OptimizedResume,
  PipelineStage,
  ResumeTemplate,
  KeywordMatchResult,
  ScoreGateResult,
} from "@/types/resume";
import { analyzeJobDescription } from "./stages/analyzeJobDescription";
import { scoreExperienceRelevance, type RelevanceAnalysis } from "./stages/scoreRelevance";
import { optimizeResumeForJob, type OptimizeOutput } from "./stages/optimizeResume";
import { scoreATS, type ATSResult } from "./stages/scoreATS";
import { scoreRecruiter, type RecruiterResult } from "./stages/scoreRecruiter";
import { checkHallucinations } from "./stages/checkHallucinations";
import { validateResumeLocally, hasBlockingIssues } from "@/lib/validation/validateResume";
import { countWords } from "./normalize";

export interface PipelineInput {
  resumeData: ResumeData;
  jobDescription: {
    rawText: string;
    companyName: string;
    jobTitle: string;
    jobLocation: string;
    companyWebsite?: string;
    companyValues?: string;
  };
  template?: ResumeTemplate;
}

const ATS_WEIGHT = 0.45;
const RECRUITER_WEIGHT = 0.55;
const SCORE_TARGET = 90;
const MAX_ITERATIONS = 3; // initial pass + up to 2 truthful refinement passes
const PLATEAU_THRESHOLD = 1.5; // min combined-score improvement to justify another pass

export function weakestAreas(ats: ATSResult, recruiter: RecruiterResult): string[] {
  const rows = [
    { label: "ATS — Keyword Match", ...ats.breakdown.keywordMatch },
    { label: "ATS — Required Qualifications", ...ats.breakdown.requiredQualifications },
    { label: "ATS — Skills Match", ...ats.breakdown.skillsMatch },
    { label: "ATS — Responsibility Alignment", ...ats.breakdown.responsibilityAlignment },
    { label: "ATS — Structure", ...ats.breakdown.atsStructure },
    { label: "ATS — Semantic Relevance", ...ats.breakdown.semanticRelevance },
    { label: "Recruiter — Relevance", ...recruiter.breakdown.relevance },
    { label: "Recruiter — Achievement Strength", ...recruiter.breakdown.achievementStrength },
    { label: "Recruiter — Experience Quality", ...recruiter.breakdown.experienceQuality },
    { label: "Recruiter — Clarity", ...recruiter.breakdown.clarity },
    { label: "Recruiter — Career Narrative", ...recruiter.breakdown.careerNarrative },
    { label: "Recruiter — Culture Fit", ...recruiter.breakdown.cultureFit },
    { label: "Recruiter — Credibility", ...recruiter.breakdown.credibility },
    { label: "Recruiter — Professional Presentation", ...recruiter.breakdown.professionalPresentation },
  ];
  return rows
    .filter((r) => r.score / r.max < 0.85)
    .sort((a, b) => b.max - b.score - (a.max - a.score))
    .slice(0, 6)
    .map((r) => `${r.label}: ${r.score}/${r.max} — ${r.explanation}`);
}

export function bucketKeywords(ats: ATSResult) {
  const bucket = (status: KeywordMatchResult["status"]) => ats.keywordCoverage.filter((k) => k.status === status);
  return {
    matched: bucket("matched"),
    partial: bucket("partial"),
    missing: bucket("missing"),
    unsupported: bucket("unsupported"),
  };
}

export function keywordMatchPercent(ats: ATSResult): number {
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 } as const;
  const totalWeight = ats.keywordCoverage.reduce((s, k) => s + priorityWeight[k.priority], 0) || 1;
  const matchedWeight = ats.keywordCoverage
    .filter((k) => k.status === "matched")
    .reduce((s, k) => s + priorityWeight[k.priority], 0);
  return Math.round((matchedWeight / totalWeight) * 100);
}

export function assembleScores(
  ats: ATSResult,
  recruiter: RecruiterResult,
  carryOver: { requiredSkillsPct: number; experienceRelevancePct: number }
) {
  const overall = Math.round(ats.breakdown.total * ATS_WEIGHT + recruiter.breakdown.total * RECRUITER_WEIGHT);
  return {
    ats: ats.breakdown,
    recruiter: recruiter.breakdown,
    overall,
    jobMatch: overall,
    keywordMatchPct: keywordMatchPercent(ats),
    requiredSkillsPct: carryOver.requiredSkillsPct,
    experienceRelevancePct: carryOver.experienceRelevancePct,
    cultureFitPct: recruiter.cultureFitPct,
    achievementStrengthPct: recruiter.achievementStrengthPct,
    atsCompatibilityPct: Math.round((ats.breakdown.atsStructure.score / ats.breakdown.atsStructure.max) * 100),
    resumeReadabilityPct: recruiter.readabilityPct,
  };
}

export function missingCriticalKeywords(ats: ATSResult): string[] {
  return ats.keywordCoverage
    .filter((k) => k.status === "missing" && (k.priority === "critical" || k.priority === "high"))
    .map((k) => k.keyword);
}

/** `relevance` is optional — a quick rescore (e.g. after a chat edit) skips
 * re-running experience-relevance scoring, so it can only report keyword-level
 * limiting factors, not requirement-gap ones. */
export function computeLimitingFactors(
  ats: ATSResult,
  jd: JobDescriptionAnalysis,
  relevance?: RelevanceAnalysis
): string[] {
  const factors: string[] = [];

  for (const k of ats.keywordCoverage) {
    if (k.status === "unsupported" && (k.priority === "critical" || k.priority === "high")) {
      factors.push(`"${k.keyword}" is important to this role but isn't supported by your resume — ${k.whyItMatters}`);
    }
  }

  if (relevance) {
    const requiredTexts = new Set(jd.requiredQualifications.map((r) => r.text));
    for (const g of relevance.requirementGaps) {
      if (!g.hasEvidence && requiredTexts.has(g.requirement)) {
        factors.push(`Required qualification "${g.requirement}" has no evidence in your resume.`);
      }
    }
  }

  return factors.slice(0, 8);
}

export async function runOptimizationPipeline(
  input: PipelineInput,
  onProgress: (stage: PipelineStage, iteration?: number) => void
): Promise<{ optimized: OptimizedResume; jobAnalysis: JobDescriptionAnalysis }> {
  onProgress("parsing_resume");
  const original = input.resumeData;

  onProgress("analyzing_job");
  const jobAnalysis = await analyzeJobDescription(input.jobDescription);

  onProgress("identifying_requirements");
  // Requirement classification is produced as part of analyzeJobDescription's
  // single structured call (required vs preferred are already split there) —
  // no extra model call needed, this stage exists for UI progress clarity.

  onProgress("matching_experience");
  const relevance = await scoreExperienceRelevance(original, jobAnalysis);

  let optimizeResult: OptimizeOutput | null = null;
  let atsResult: ATSResult | null = null;
  let recruiterResult: RecruiterResult | null = null;
  let allIssues: ReturnType<typeof validateResumeLocally> = [];
  const scoreHistory: ScoreGateResult["scoreHistory"] = [];
  let reached90 = false;
  let iterations = 0;

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    iterations = i;
    onProgress("optimizing_achievements", i);
    optimizeResult = await optimizeResumeForJob(
      original,
      jobAnalysis,
      relevance,
      i === 1 || !optimizeResult || !atsResult || !recruiterResult
        ? undefined
        : {
            iteration: i,
            previousDraft: optimizeResult.resumeData,
            atsTotal: atsResult.breakdown.total,
            recruiterTotal: recruiterResult.breakdown.total,
            weakestAreas: weakestAreas(atsResult, recruiterResult),
            missingCriticalKeywords: missingCriticalKeywords(atsResult),
          }
    );

    onProgress("checking_ats", i);
    atsResult = await scoreATS(optimizeResult.resumeData, jobAnalysis);

    onProgress("simulating_recruiter", i);
    recruiterResult = await scoreRecruiter(original, optimizeResult.resumeData, jobAnalysis);

    onProgress("validating", i);
    const localIssues = validateResumeLocally(optimizeResult.resumeData);
    const hallucinationIssues = await checkHallucinations(original, optimizeResult.resumeData);
    allIssues = [...localIssues, ...hallucinationIssues];

    const previousCombined =
      scoreHistory.length > 0
        ? scoreHistory[scoreHistory.length - 1].ats + scoreHistory[scoreHistory.length - 1].recruiter
        : null;
    scoreHistory.push({ iteration: i, ats: atsResult.breakdown.total, recruiter: recruiterResult.breakdown.total });

    reached90 = atsResult.breakdown.total >= SCORE_TARGET && recruiterResult.breakdown.total >= SCORE_TARGET;

    if (reached90 && !hasBlockingIssues(allIssues)) break;
    if (i === MAX_ITERATIONS) break;

    const combined = atsResult.breakdown.total + recruiterResult.breakdown.total;
    const plateaued = previousCombined !== null && combined - previousCombined < PLATEAU_THRESHOLD;
    if (plateaued && !hasBlockingIssues(allIssues)) break;
  }

  if (!optimizeResult || !atsResult || !recruiterResult) {
    throw new Error("Optimization pipeline failed to produce a result.");
  }

  const requiredTotal = jobAnalysis.requiredQualifications.length || 1;
  const requiredEvidenced = relevance.requirementGaps.filter(
    (g) => g.hasEvidence && jobAnalysis.requiredQualifications.some((r) => r.text === g.requirement)
  ).length;
  const requiredSkillsPct = Math.round((requiredEvidenced / requiredTotal) * 100);

  const experienceRelevancePct = Math.round(
    relevance.experienceRelevance.reduce((s, r) => s + r.relevanceScore, 0) /
      (relevance.experienceRelevance.length || 1)
  );

  const scoreGate: ScoreGateResult = {
    reached90,
    iterations,
    scoreHistory,
    limitingFactors: reached90 ? [] : computeLimitingFactors(atsResult, jobAnalysis, relevance),
  };

  const optimized: OptimizedResume = {
    id: randomUUID(),
    resumeData: optimizeResult.resumeData,
    wordCount: countWords(optimizeResult.resumeData),
    template: input.template ?? "classic",
    scores: assembleScores(atsResult, recruiterResult, { requiredSkillsPct, experienceRelevancePct }),
    keywordCoverage: bucketKeywords(atsResult),
    recruiterFirstImpression: recruiterResult.firstImpression,
    bulletComparisons: recruiterResult.bulletComparisons,
    improvementSuggestions: optimizeResult.improvementSuggestions,
    validationIssues: allIssues,
    whatImproved: optimizeResult.whatImproved,
    scoreGate,
  };

  return { optimized, jobAnalysis };
}
