import { generateStructured } from "../gemini";
import { relevanceAnalysisSchema } from "../schemas";
import type { ResumeData, JobDescriptionAnalysis } from "@/types/resume";

export interface ExperienceRelevance {
  company: string;
  title: string;
  relevanceScore: number;
  reasoning: string;
}

export interface RequirementGap {
  requirement: string;
  hasEvidence: boolean;
  evidenceSummary: string;
}

export interface RelevanceAnalysis {
  experienceRelevance: ExperienceRelevance[];
  requirementGaps: RequirementGap[];
}

export async function scoreExperienceRelevance(
  resume: ResumeData,
  jd: JobDescriptionAnalysis
): Promise<RelevanceAnalysis> {
  return generateStructured<RelevanceAnalysis>({
    stage: "matching_experience",
    systemInstruction: `You compare a candidate's work experience against a target job's requirements. For each
experience entry, score 0-100 how relevant it is to the target role and briefly explain why. Then, for each
required/preferred qualification in the job, determine whether the candidate's resume provides real evidence of
it (hasEvidence) and summarize that evidence — or explain that it's missing. Be honest: do not claim evidence
exists if it doesn't.`,
    prompt: `Job: ${jd.jobTitle} at ${jd.companyName}

Required qualifications:
${jd.requiredQualifications.map((r) => `- ${r.text}`).join("\n")}

Preferred qualifications:
${jd.preferredQualifications.map((r) => `- ${r.text}`).join("\n")}

Responsibilities:
${jd.responsibilities.map((r) => `- ${r}`).join("\n")}

Candidate experience:
${resume.experience
  .map(
    (e) =>
      `${e.title} at ${e.company} (${e.startDate} - ${e.endDate}):\n${e.bullets
        .map((b) => `  - ${b.text}`)
        .join("\n")}`
  )
  .join("\n\n")}

Candidate projects:
${resume.projects
  .map((p) => `${p.name}: ${p.description}\n${p.bullets.map((b) => `  - ${b.text}`).join("\n")}`)
  .join("\n\n")}
`,
    schema: relevanceAnalysisSchema,
    temperature: 0.2,
  });
}
