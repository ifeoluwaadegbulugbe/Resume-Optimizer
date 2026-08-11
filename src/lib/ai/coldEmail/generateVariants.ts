import { generateStructured } from "../gemini";
import { generateResultSchema } from "../coldEmailSchemas";
import {
  COLD_EMAIL_TRUTHFULNESS_GUARDRAIL,
  PERSONALIZATION_QUALITY_GUIDANCE,
  CTA_GUIDANCE,
  STRUCTURE_GUIDANCE,
  LENGTH_GUIDANCE,
  SUBJECT_LINE_GUIDANCE,
  COLD_EMAIL_LANGUAGE_GUARDRAIL,
  ARTIFACT_LED_GUIDANCE,
  STORY_LED_GUIDANCE,
  OBJECTION_HONESTY_GUIDANCE,
} from "./prompts";
import type { ColdEmailInput, EmailStrategy, SubjectLineScore } from "@/types/coldEmail";
import { randomUUID } from "crypto";

export interface RawVariant {
  strategy: EmailStrategy;
  subjectLines: SubjectLineScore[];
  body: string;
}

export interface GenerateVariantsResult {
  sufficient: boolean;
  insufficientReason: string;
  questionsToAsk: string[];
  variants: RawVariant[];
}

function describeInput(input: ColdEmailInput): string {
  const approvedSignals = input.signals.filter((s) => s.approved);
  return `
RECIPIENT
Name: ${input.recipientName}
Role: ${input.recipientRole}
Company: ${input.recipientCompany}
Type: ${input.recipientType}
${input.recipientLinkedIn ? `LinkedIn: ${input.recipientLinkedIn}` : ""}

SENDER
Name: ${input.senderName}
Role: ${input.senderRole}
${input.senderCompany ? `Company: ${input.senderCompany}` : ""}

PURPOSE: ${input.purpose}
WHAT THE SENDER WANTS: ${input.whatSenderWants}
WHAT THE SENDER OFFERS: ${input.whatSenderOffers}
RELEVANT PROOF (only use this, never invent additional proof): ${input.relevantProof || "(none supplied)"}
${input.mutualConnection ? `MUTUAL CONNECTION: ${input.mutualConnection}` : ""}
${input.previousInteraction ? `PREVIOUS INTERACTION: ${input.previousInteraction}` : ""}
${input.jobPosting ? `JOB POSTING EXCERPT:\n${input.jobPosting}` : ""}
${input.specificReason ? `SPECIFIC REASON FOR CONTACTING NOW: ${input.specificReason}` : ""}
${input.offerAlreadyPrepared ? "\nNOTE: the offer above is something the sender has ALREADY completed, not a future proposal — write it in completed past tense." : ""}
${input.personalStory ? `\nPERSONAL STORY (only for a story_led variant, use verbatim facts only, never embellish): ${input.personalStory}` : ""}
${input.senderCredentialLine ? `\nSENDER CREDENTIALS/SIGNATURE LINE (may append under sign-off if it strengthens a variant): ${input.senderCredentialLine}` : ""}

APPROVED PERSONALIZATION SIGNALS (only these may be used — never use an unapproved or unlisted signal)
${approvedSignals.length ? approvedSignals.map((s) => `- ${s.text} (source: ${s.source})`).join("\n") : "(none approved)"}

TONE: ${input.tone}
PERSONALIZATION DEPTH: ${input.personalizationDepth} (light = 1 detail, standard = 2-3, deep = research-heavy with one specific insight)
`.trim();
}

export async function generateColdEmailVariants(input: ColdEmailInput): Promise<GenerateVariantsResult> {
  const depthCount = input.personalizationDepth === "light" ? 3 : input.personalizationDepth === "deep" ? 5 : 4;

  // story_led is only worth generating when there's a real personal story to
  // tell — otherwise it would just produce a generic bio, which defeats the
  // point. It replaces social_proof_led (the weaker third slot in practice)
  // for the purposes where a mission-driven narrative tends to land: job
  // hunting, networking, introductions.
  const wantsStoryLed =
    Boolean(input.personalStory?.trim()) &&
    (input.purpose === "job_opportunity" || input.purpose === "networking" || input.purpose === "introduction");
  const strategies: EmailStrategy[] = wantsStoryLed
    ? ["insight_led", "give_first", "story_led"]
    : ["insight_led", "give_first", "social_proof_led"];

  const raw = await generateStructured<GenerateVariantsResult>({
    stage: "generating_variants",
    systemInstruction: `You are a cold-outreach strategist. Your only goal is reply probability, not open rate,
persuasion, or brevity for their own sake — an opened email with no reply is not a success. ${COLD_EMAIL_TRUTHFULNESS_GUARDRAIL}

Before writing, silently answer: why this person, why this company, why now, why this sender, why should the
recipient care, what useful thing is being offered, what's the smallest reasonable response? If you genuinely
cannot answer these from the supplied information, set sufficient=false, explain why in insufficientReason,
and list the specific questions in questionsToAsk — do not manufacture personalization to compensate for thin
input. If sufficient, generate exactly 3 variants, one for each of these strategies: ${strategies.join(", ")}.

${PERSONALIZATION_QUALITY_GUIDANCE}

${STRUCTURE_GUIDANCE}

${OBJECTION_HONESTY_GUIDANCE}

${ARTIFACT_LED_GUIDANCE}

${strategies.includes("story_led") ? STORY_LED_GUIDANCE : ""}

${CTA_GUIDANCE}

${LENGTH_GUIDANCE}

${SUBJECT_LINE_GUIDANCE}

${COLD_EMAIL_LANGUAGE_GUARDRAIL}

Recipient-type adaptation: for a founder prioritize speed/specificity/business impact; for a recruiter
prioritize candidate relevance and an easy next step; for a hiring manager prioritize role-specific expertise
and practical value; for an executive prioritize brevity and business priority; for a potential client
prioritize problem, insight, proof, and a low-friction offer.`,
    prompt: describeInput(input) + `\n\nTarget ~${depthCount - 1}-${depthCount} words of personalization density given the requested depth.`,
    schema: generateResultSchema,
    temperature: 0.6,
  });

  return {
    sufficient: raw.sufficient,
    insufficientReason: raw.insufficientReason,
    questionsToAsk: raw.questionsToAsk,
    variants: raw.variants.map((v) => ({ ...v })),
  };
}

export function newVariantId() {
  return randomUUID();
}
