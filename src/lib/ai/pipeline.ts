import { randomUUID } from "crypto";
import type {
  ResumeData,
  JobDescriptionAnalysis,
  OptimizedResume,
  PipelineStage,
  ResumeTemplate,
  KeywordMatchResult,
} from "@/types/resume";
import { analyzeJobDescription } from "./stages/analyzeJobDescription";
import { scoreExperienceRelevance } from "./stages/scoreRelevance";
import { optimizeResumeForJob } from "./stages/optimizeResume";
import { scoreATS } from "./stages/scoreATS";
import { scoreRecruiter } from "./stages/scoreRecruiter";
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

export async function runOptimizationPipeline(
  input: PipelineInput,
  onProgress: (stage: PipelineStage) => void
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

  onProgress("optimizing_achievements");
  let optimizeResult = await optimizeResumeForJob(original, jobAnalysis, relevance);

  onProgress("checking_ats");
  let atsResult = await scoreATS(optimizeResult.resumeData, jobAnalysis);

  onProgress("simulating_recruiter");
  let recruiterResult = await scoreRecruiter(original, optimizeResult.resumeData, jobAnalysis);

  onProgress("validating");
  let localIssues = validateResumeLocally(optimizeResult.resumeData);
  let hallucinationIssues = await checkHallucinations(original, optimizeResult.resumeData);
  let allIssues = [...localIssues, ...hallucinationIssues];

  // Per spec: if validation fails (blocking errors), send back through
  // optimization once, then accept the result either way rather than looping.
  if (hasBlockingIssues(allIssues)) {
    onProgress("optimizing_achievements");
    optimizeResult = await optimizeResumeForJob(original, jobAnalysis, relevance);

    onProgress("checking_ats");
    atsResult = await scoreATS(optimizeResult.resumeData, jobAnalysis);

    onProgress("simulating_recruiter");
    recruiterResult = await scoreRecruiter(original, optimizeResult.resumeData, jobAnalysis);

    onProgress("validating");
    localIssues = validateResumeLocally(optimizeResult.resumeData);
    hallucinationIssues = await checkHallucinations(original, optimizeResult.resumeData);
    allIssues = [...localIssues, ...hallucinationIssues];
  }

  const overall = Math.round(atsResult.breakdown.total * ATS_WEIGHT + recruiterResult.breakdown.total * RECRUITER_WEIGHT);

  const bucket = (status: KeywordMatchResult["status"]) =>
    atsResult.keywordCoverage.filter((k) => k.status === status);

  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 } as const;
  const totalWeight = atsResult.keywordCoverage.reduce((s, k) => s + priorityWeight[k.priority], 0) || 1;
  const matchedWeight = bucket("matched").reduce((s, k) => s + priorityWeight[k.priority], 0);
  const keywordMatchPct = Math.round((matchedWeight / totalWeight) * 100);

  const requiredTotal = jobAnalysis.requiredQualifications.length || 1;
  const requiredEvidenced = relevance.requirementGaps.filter(
    (g) => g.hasEvidence && jobAnalysis.requiredQualifications.some((r) => r.text === g.requirement)
  ).length;
  const requiredSkillsPct = Math.round((requiredEvidenced / requiredTotal) * 100);

  const experienceRelevancePct = Math.round(
    relevance.experienceRelevance.reduce((s, r) => s + r.relevanceScore, 0) /
      (relevance.experienceRelevance.length || 1)
  );

  const optimized: OptimizedResume = {
    id: randomUUID(),
    resumeData: optimizeResult.resumeData,
    wordCount: countWords(optimizeResult.resumeData),
    template: input.template ?? "classic",
    scores: {
      ats: atsResult.breakdown,
      recruiter: recruiterResult.breakdown,
      overall,
      jobMatch: overall,
      keywordMatchPct,
      requiredSkillsPct,
      experienceRelevancePct,
      cultureFitPct: recruiterResult.cultureFitPct,
      achievementStrengthPct: recruiterResult.achievementStrengthPct,
      atsCompatibilityPct: Math.round((atsResult.breakdown.atsStructure.score / atsResult.breakdown.atsStructure.max) * 100),
      resumeReadabilityPct: recruiterResult.readabilityPct,
    },
    keywordCoverage: {
      matched: bucket("matched"),
      partial: bucket("partial"),
      missing: bucket("missing"),
      unsupported: bucket("unsupported"),
    },
    recruiterFirstImpression: recruiterResult.firstImpression,
    bulletComparisons: recruiterResult.bulletComparisons,
    improvementSuggestions: optimizeResult.improvementSuggestions,
    validationIssues: allIssues,
    whatImproved: optimizeResult.whatImproved,
  };

  return { optimized, jobAnalysis };
}
