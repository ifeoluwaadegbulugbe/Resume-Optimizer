import { generateStructured } from "../gemini";
import { followUpSchema } from "../coldEmailSchemas";
import { COLD_EMAIL_TRUTHFULNESS_GUARDRAIL, LENGTH_GUIDANCE, COLD_EMAIL_LANGUAGE_GUARDRAIL } from "./prompts";
import type { ColdEmailInput, FollowUpAngle, FollowUpMessage } from "@/types/coldEmail";
import { randomUUID } from "crypto";

export async function generateFollowUp(opts: {
  input: ColdEmailInput;
  originalSubject: string;
  originalBody: string;
  previousFollowUps: FollowUpMessage[];
  recipientReply?: string;
}): Promise<FollowUpMessage> {
  const nextAngleIndex = opts.previousFollowUps.length;
  const angleOrder: FollowUpAngle[] = ["additional_observation", "useful_resource", "specific_example", "breakup"];
  const suggestedAngle = angleOrder[Math.min(nextAngleIndex, angleOrder.length - 1)];

  const raw = await generateStructured<{ angle: FollowUpAngle; subject: string; body: string }>({
    stage: "follow_up",
    systemInstruction: `You write cold-email follow-ups. ${COLD_EMAIL_TRUTHFULNESS_GUARDRAIL}
A follow-up must never just say "just following up" or repeat the original pitch — every follow-up adds
something new: an additional observation, a useful resource, a specific example, or (only as the genuine final
touch) a simple breakup line like "Should I close the loop on this?". Suggested angle for this follow-up:
${suggestedAngle} — use it unless the recipient's reply below clearly calls for a different response.
${LENGTH_GUIDANCE}
${COLD_EMAIL_LANGUAGE_GUARDRAIL}`,
    prompt: `ORIGINAL EMAIL
Subject: ${opts.originalSubject}
${opts.originalBody}

PREVIOUS FOLLOW-UPS SENT (never repeat these)
${opts.previousFollowUps.length ? opts.previousFollowUps.map((f) => `[${f.angle}] ${f.subject}: ${f.body}`).join("\n\n") : "(none yet)"}

${opts.recipientReply ? `RECIPIENT'S REPLY (respond appropriately to this instead of a generic follow-up if it changes the situation):\n${opts.recipientReply}` : "(no reply received yet)"}

CONTEXT (do not introduce facts beyond this)
What sender offers: ${opts.input.whatSenderOffers}
Relevant proof: ${opts.input.relevantProof || "(none supplied)"}`,
    schema: followUpSchema,
    temperature: 0.6,
  });

  return { id: randomUUID(), angle: raw.angle, subject: raw.subject, body: raw.body, createdAt: new Date().toISOString() };
}
