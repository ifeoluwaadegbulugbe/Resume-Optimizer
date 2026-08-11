import { generateStructured } from "../gemini";
import { scoreAllResultSchema } from "../coldEmailSchemas";
import type { ColdEmailInput, ColdEmailScoreBreakdown, DetectedProblem, EmailStrategy } from "@/types/coldEmail";
import type { RawVariant } from "./generateVariants";

export interface ScoredVariantRaw {
  strategy: EmailStrategy;
  breakdown: ColdEmailScoreBreakdown;
  problems: DetectedProblem[];
}

export async function scoreColdEmailVariants(
  input: ColdEmailInput,
  variants: RawVariant[]
): Promise<ScoredVariantRaw[]> {
  const { results } = await generateStructured<{ results: ScoredVariantRaw[] }>({
    stage: "scoring_variants",
    systemInstruction: `You are a strict cold-email quality scorer optimizing purely for reply probability.
Score each variant 0-100 across: relevance (20 — does it clearly relate to this specific person),
personalizationQuality (15 — specific and meaningful, not generic), value (15 — is there a compelling,
concrete reason to respond), credibility (10 — is the evidence legitimate), clarity (10 — understandable in
one quick scan: why emailed, what was noticed, what's offered, what to do), brevity (10 — dense with real
specifics and free of filler; do NOT dock a story_led variant or a give_first variant describing genuinely
completed work just for running longer than a typical cold email — real high-performing examples of both run
150-250 words, so judge brevity by "does every sentence earn its place", not raw word count), ctaFriction (10
— full points only if the ask is answerable in under 10 seconds), humanQuality (5 — sounds like a real person,
not a template/AI), trust (5 — no manipulation, no fabricated claims, no fake urgency or scarcity). "total"
must equal the sum. Then list concrete problems (e.g. sender talks about themselves too much, CTA requires too
much commitment, personalization is generic, subject risks looking like spam) with a specific recommendation
for each — only report real issues.`,
    prompt: `Purpose: ${input.purpose}. Recipient type: ${input.recipientType}. Recipient: ${input.recipientName}, ${input.recipientRole} at ${input.recipientCompany}.

${variants
  .map(
    (v, i) =>
      `VARIANT ${i + 1} — strategy: ${v.strategy}
Subject options: ${v.subjectLines.map((s) => `"${s.text}"`).join(", ")}
Body:
${v.body}`
  )
  .join("\n\n")}`,
    schema: scoreAllResultSchema,
    temperature: 0.2,
  });
  return results;
}
