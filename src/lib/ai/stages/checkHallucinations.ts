import { generateStructured } from "../gemini";
import { hallucinationCheckSchema } from "../schemas";
import type { ResumeData, ValidationIssue } from "@/types/resume";

export async function checkHallucinations(
  original: ResumeData,
  optimized: ResumeData
): Promise<ValidationIssue[]> {
  const { issues } = await generateStructured<{ issues: ValidationIssue[] }>({
    stage: "validating",
    systemInstruction: `You are a strict fact-checker. Compare the OPTIMIZED resume against the ORIGINAL source
resume. Flag any claim in the optimized version that is not supported by the original: fabricated metrics/numbers
that weren't in the original (bracketed placeholders like "[X%]" are fine and should NOT be flagged), invented
employers/titles/projects/technologies/certifications/degrees/responsibilities, or any skill/experience claimed
that the original does not evidence. Only report real issues — do not flag legitimate rewording, reorganizing,
or truthful emphasis changes.`,
    prompt: `ORIGINAL:\n${JSON.stringify(original, null, 2)}\n\nOPTIMIZED:\n${JSON.stringify(optimized, null, 2)}`,
    schema: hallucinationCheckSchema,
    temperature: 0.1,
  });
  return issues;
}
