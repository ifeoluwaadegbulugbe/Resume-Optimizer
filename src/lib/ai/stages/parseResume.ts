import { generateStructured } from "../gemini";
import { resumeDataSchema } from "../schemas";
import type { ResumeData } from "@/types/resume";
import { withIds } from "../normalize";

export async function parseResumeText(rawText: string): Promise<ResumeData> {
  const raw = await generateStructured<Omit<ResumeData, "experience" | "projects"> & {
    experience: Array<Omit<ResumeData["experience"][number], "id" | "bullets" | "relevanceScore" | "isLocked"> & { bullets: string[] }>;
    projects: Array<Omit<ResumeData["projects"][number], "id" | "bullets" | "include"> & { bullets: string[] }>;
  }>({
    stage: "parsing_resume",
    systemInstruction:
      "You are a precise resume parser. Extract structured information from the raw resume text exactly as written, without adding, inferring, or embellishing anything. If a field is not present, use an empty string or empty array. Preserve the original wording of bullets — do not rewrite them at this stage. Do not extract an 'Objective' statement into the summary field, and do not extract a 'References available upon request' line anywhere — these are outdated conventions the rest of the pipeline should never see.",
    prompt: `Extract structured resume data from the following raw resume text.\n\n---\n${rawText}\n---`,
    schema: resumeDataSchema,
    temperature: 0.1,
  });

  return withIds(raw);
}
