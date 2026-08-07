import { generateStructured } from "../gemini";
import { optimizeResultSchema } from "../schemas";
import { withIds, type RawResumeData } from "../normalize";
import type { ResumeData, JobDescriptionAnalysis, ImprovementSuggestion } from "@/types/resume";
import type { RelevanceAnalysis } from "./scoreRelevance";
import { TRUTHFULNESS_GUARDRAIL, XYZ_FRAMEWORK_GUIDANCE, KEYWORD_GUIDANCE } from "../prompts";
import { randomUUID } from "crypto";

interface OptimizeRawResult {
  resumeData: RawResumeData;
  whatImproved: string[];
  improvementSuggestions: Array<Omit<ImprovementSuggestion, "id">>;
}

export interface OptimizeOutput {
  resumeData: ResumeData;
  whatImproved: string[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface RefinementContext {
  iteration: number;
  previousDraft: ResumeData;
  atsTotal: number;
  recruiterTotal: number;
  weakestAreas: string[]; // e.g. "ATS keyword match: 18/30 — ...", human-readable
  missingCriticalKeywords: string[];
}

export async function optimizeResumeForJob(
  original: ResumeData,
  jd: JobDescriptionAnalysis,
  relevance: RelevanceAnalysis,
  refinement?: RefinementContext
): Promise<OptimizeOutput> {
  const criticalKeywords = jd.keywordMap.filter((k) => k.priority === "critical" || k.priority === "high");

  const refinementBlock = refinement
    ? `
THIS IS A REFINEMENT PASS (iteration ${refinement.iteration}) — the goal is >=90/100 on both ATS and recruiter
scores, truthfully. The previous draft below scored ATS ${refinement.atsTotal}/100 and Recruiter
${refinement.recruiterTotal}/100. Revise that draft (don't start over) to specifically address:

${refinement.weakestAreas.map((a) => `- ${a}`).join("\n")}
${
  refinement.missingCriticalKeywords.length
    ? `\nCritical/high-priority keywords still missing (add ONLY where truthfully supported by the original resume — never fabricate):\n${refinement.missingCriticalKeywords.map((k) => `- ${k}`).join("\n")}`
    : ""
}

PREVIOUS DRAFT TO REVISE
${JSON.stringify(refinement.previousDraft, null, 2)}
`
    : "";

  const raw = await generateStructured<OptimizeRawResult>({
    stage: "optimizing_achievements",
    systemInstruction: `You are an expert resume writer and career coach producing a job-specific, ATS-optimized,
recruiter-compelling resume. ${TRUTHFULNESS_GUARDRAIL}

${XYZ_FRAMEWORK_GUIDANCE}

${KEYWORD_GUIDANCE}

Culture-fit optimization: the job's inferred culture signals should be demonstrated through evidence already
present in the candidate's real experience (ownership, collaboration, customer focus, etc.) — never state
"excellent culture fit" directly.

Structure and prioritization:
- The professional summary must be 2-4 lines, job-specific, evidence-based, and avoid generic filler
  ("hardworking professional seeking...").
- Group skills intelligently (e.g. Languages, Frameworks, Tools) and prioritize skills that appear in the job
  description, but only include skills the candidate actually has.
- Order experience reverse-chronologically. The most relevant experience (per the relevance scores provided)
  should get the strongest, most detailed bullets (up to 5) and highest keyword coverage; less relevant
  experience should be compressed to 2-3 bullets rather than consuming space.
- Include projects only when they strengthen candidacy for this specific role.
- The entire resume's total word count (summary + skills + experience + included projects + education +
  certifications + awards/leadership/volunteer) must land between 450 and 600 words, targeting ~525-550.
  Do not pad with filler to hit the count, and do not cut real evidence just to go lower.
- Preserve contact information exactly as given.`,
    prompt: `TARGET JOB
Title: ${jd.jobTitle}
Company: ${jd.companyName}
Required qualifications: ${jd.requiredQualifications.map((r) => r.text).join("; ")}
Preferred qualifications: ${jd.preferredQualifications.map((r) => r.text).join("; ")}
Responsibilities: ${jd.responsibilities.join("; ")}
Culture signals (inferred): ${jd.cultureSignals.map((c) => `${c.label} (evidence: "${c.evidence}")`).join("; ")}
Critical/high-priority keywords to weave in naturally where truthful: ${criticalKeywords
      .map((k) => k.keyword)
      .join(", ")}

EXPERIENCE RELEVANCE (use to prioritize space/strength per role)
${relevance.experienceRelevance
  .map((r) => `- ${r.title} at ${r.company}: ${r.relevanceScore}/100 — ${r.reasoning}`)
  .join("\n")}

REQUIREMENT GAPS (do not fabricate evidence for gaps with hasEvidence=false)
${relevance.requirementGaps.map((g) => `- ${g.requirement}: ${g.hasEvidence ? "evidenced" : "NOT evidenced"}`).join("\n")}

CANDIDATE'S ORIGINAL RESUME (ground truth — do not introduce facts beyond this, even during refinement)
${JSON.stringify(original, null, 2)}
${refinementBlock}
Produce the optimized resumeData, a whatImproved list (short factual bullets like "23 relevant keywords added
naturally", "7 bullets rewritten around achievements"), and a ranked improvementSuggestions list of further
changes the candidate could make (e.g. adding a metric, adding evidence of a specific skill) — never promise a
guaranteed score increase, phrase estimatedScoreChange as an approximate range.`,
    schema: optimizeResultSchema,
    temperature: 0.5,
  });

  return {
    resumeData: withIds(raw.resumeData),
    whatImproved: raw.whatImproved,
    improvementSuggestions: raw.improvementSuggestions.map((s) => ({ id: randomUUID(), ...s })),
  };
}
