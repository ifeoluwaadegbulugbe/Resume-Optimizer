import { generateStructured } from "../gemini";
import { jdAnalysisSchema } from "../schemas";
import type { JobDescriptionAnalysis, CultureSignal } from "@/types/resume";

interface AnalyzeInput {
  rawText: string;
  companyName: string;
  jobTitle: string;
  jobLocation: string;
  companyWebsite?: string;
  companyValues?: string;
}

type RawJDResult = Omit<JobDescriptionAnalysis,
  | "companyName"
  | "jobTitle"
  | "jobLocation"
  | "companyWebsite"
  | "companyValues"
  | "rawText"
  | "cultureSignals"
> & { cultureSignals: Array<{ label: string; evidence: string }> };

export async function analyzeJobDescription(input: AnalyzeInput): Promise<JobDescriptionAnalysis> {
  const raw = await generateStructured<RawJDResult>({
    stage: "analyzing_job",
    systemInstruction: `You are an expert technical recruiter and job-description analyst. Analyze the job description
thoroughly and extract required vs preferred qualifications, technical skills, soft skills, responsibilities,
behavioral verbs (own, lead, collaborate, build, analyze, optimize, communicate, manage, deliver, etc.), and
build a keyword map covering exact keywords, variations/acronyms, tools, certifications, job titles, and domain
terminology. Classify every keyword's priority (critical/high/medium/low) based on how central it is to the role
and how often/prominently it appears. Distinguish exact-match keywords from semantic equivalents and related concepts.
Also infer likely company-culture signals (e.g. "fast-paced", "ownership-oriented", "customer obsessed") from the
language used — these are inferences, not facts, so ground each in a direct quote/phrase from the JD as evidence.`,
    prompt: `Company: ${input.companyName}
Job Title: ${input.jobTitle}
Location: ${input.jobLocation}
${input.companyWebsite ? `Company website: ${input.companyWebsite}` : ""}
${input.companyValues ? `Known company values/culture info: ${input.companyValues}` : ""}

Job description:
---
${input.rawText}
---`,
    schema: jdAnalysisSchema,
    temperature: 0.2,
  });

  const cultureSignals: CultureSignal[] = raw.cultureSignals.map((c) => ({
    label: c.label,
    evidence: c.evidence,
    isInferred: true as const,
  }));

  return {
    companyName: input.companyName,
    jobTitle: input.jobTitle,
    jobLocation: input.jobLocation,
    companyWebsite: input.companyWebsite,
    companyValues: input.companyValues,
    rawText: input.rawText,
    requiredQualifications: raw.requiredQualifications,
    preferredQualifications: raw.preferredQualifications,
    technicalSkills: raw.technicalSkills,
    softSkills: raw.softSkills,
    responsibilities: raw.responsibilities,
    behavioralVerbs: raw.behavioralVerbs,
    cultureSignals,
    keywordMap: raw.keywordMap,
  };
}
