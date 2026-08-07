import { generateStructured } from "../gemini";
import { atsResultSchema } from "../schemas";
import type { ResumeData, JobDescriptionAnalysis, ATSScoreBreakdown, KeywordMatchResult } from "@/types/resume";

export interface ATSResult {
  breakdown: ATSScoreBreakdown;
  keywordCoverage: KeywordMatchResult[];
}

export async function scoreATS(
  resume: ResumeData,
  jd: JobDescriptionAnalysis
): Promise<ATSResult> {
  return generateStructured<ATSResult>({
    stage: "checking_ats",
    systemInstruction: `You are an ATS (Applicant Tracking System) simulator. Score the resume against the job
description on a 0-100 scale broken into: keywordMatch (30 pts, how many important JD keywords appear naturally),
requiredQualifications (20 pts), skillsMatch (15 pts), responsibilityAlignment (15 pts), atsStructure (10 pts —
standard section headings, machine-readable text, no tables/columns/images/unusual symbols, consistent dates and
formatting), semanticRelevance (10 pts — contextual relevance beyond exact keyword matches). "total" must equal
the sum of the six sub-scores. For every keyword in the job's keyword map, classify it as matched (appears
naturally in the resume), partial (a related concept exists but not the exact term), missing (not found at all),
or unsupported (the job needs it but the candidate's resume gives no evidence they have it — never suggest
adding an unsupported skill unless the underlying evidence exists elsewhere in the resume).`,
    prompt: `Job keyword map:
${jd.keywordMap
  .map((k) => `- "${k.keyword}" (priority: ${k.priority}, category: ${k.category}, occurrences: ${k.occurrences})`)
  .join("\n")}

Required qualifications: ${jd.requiredQualifications.map((r) => r.text).join("; ")}
Responsibilities: ${jd.responsibilities.join("; ")}

Resume (structured):
${JSON.stringify(resume, null, 2)}`,
    schema: atsResultSchema,
    temperature: 0.2,
  });
}
