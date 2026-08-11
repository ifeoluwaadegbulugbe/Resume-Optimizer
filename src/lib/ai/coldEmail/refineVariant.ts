import { generateStructured } from "../gemini";
import { refineVariantSchema } from "../coldEmailSchemas";
import {
  COLD_EMAIL_TRUTHFULNESS_GUARDRAIL,
  CTA_GUIDANCE,
  STRUCTURE_GUIDANCE,
  LENGTH_GUIDANCE,
  SUBJECT_LINE_GUIDANCE,
  COLD_EMAIL_LANGUAGE_GUARDRAIL,
} from "./prompts";
import type { ColdEmailInput, DetectedProblem, SubjectLineScore } from "@/types/coldEmail";
import type { RawVariant } from "./generateVariants";

export interface RefineResult {
  subjectLines: SubjectLineScore[];
  body: string;
}

export async function refineColdEmailVariant(opts: {
  input: ColdEmailInput;
  variant: RawVariant;
  currentScore: number;
  weakAreas: string[];
  problems: DetectedProblem[];
}): Promise<RefineResult> {
  return generateStructured<RefineResult>({
    stage: "optimizing",
    systemInstruction: `You are revising a single cold email variant to raise its reply-probability score,
without changing its core strategy (${opts.variant.strategy}). ${COLD_EMAIL_TRUTHFULNESS_GUARDRAIL}

${STRUCTURE_GUIDANCE}

${CTA_GUIDANCE}

${LENGTH_GUIDANCE}

${SUBJECT_LINE_GUIDANCE}

${COLD_EMAIL_LANGUAGE_GUARDRAIL}`,
    prompt: `This variant currently scores ${opts.currentScore}/100. Revise it (don't start over) to
specifically address:

${opts.weakAreas.map((a) => `- ${a}`).join("\n")}

${opts.problems.length ? `Detected problems:\n${opts.problems.map((p) => `- ${p.issue}: ${p.detail} -> ${p.recommendation}`).join("\n")}` : ""}

CURRENT SUBJECT LINES: ${opts.variant.subjectLines.map((s) => `"${s.text}"`).join(", ")}
CURRENT BODY:
${opts.variant.body}

CONTEXT (do not introduce facts beyond this, even during refinement)
Recipient: ${opts.input.recipientName}, ${opts.input.recipientRole} at ${opts.input.recipientCompany}
What sender offers: ${opts.input.whatSenderOffers}
What sender wants: ${opts.input.whatSenderWants}
Relevant proof: ${opts.input.relevantProof || "(none supplied)"}
Approved signals: ${opts.input.signals
      .filter((s) => s.approved)
      .map((s) => s.text)
      .join("; ") || "(none)"}`,
    schema: refineVariantSchema,
    temperature: 0.5,
  });
}
