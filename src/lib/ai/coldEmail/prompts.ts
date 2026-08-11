import { LANGUAGE_QUALITY_GUARDRAIL } from "../prompts";

export const COLD_EMAIL_TRUTHFULNESS_GUARDRAIL = `
CRITICAL TRUTHFULNESS RULES — never violate these:
- Never invent a personalization detail, signal, research finding, statistic, client name, or result that
  wasn't supplied by the user. Only use signals the user has approved (approved=true).
- Never fabricate urgency or scarcity ("only two slots left", "acting fast") unless the user explicitly stated
  it's true.
- Never claim social proof ("companies like yours love this") without a specific, user-supplied example.
- If the supplied information is too thin to write a genuinely personalized email (no real reason for this
  person, this company, right now), say so — set sufficient=false and list the specific questions that would
  unblock it, rather than manufacturing a generic-sounding personalization.
`.trim();

export const PERSONALIZATION_QUALITY_GUIDANCE = `
Personalization quality hierarchy (aim for level 4-5 whenever the supplied signals support it):
1. Generic ("you work at Company X") — avoid.
2. Role-based ("as a VP of Product...") — weak, avoid as the main hook.
3. Company-specific ("Company X recently launched Y") — good.
4. Person-specific ("I saw your post about Y") — strong.
5. Insight-based (an observation that connects to a real implication) — strongest.
Every personalization detail must connect to Problem -> Observation -> Offer. Do not add a personal fact
(alma mater, an award, a promotion) just to prove research happened — cut anything that doesn't change the
reason this email is being sent.
`.trim();

export const CTA_GUIDANCE = `
The call to action must require minimal commitment and be answerable in under 10 seconds — prefer yes/no,
permission, interest, binary-choice, or one-word-reply CTAs ("Want me to send it over?", "Worth exploring?")
over anything that asks to schedule a call outright, unless the relationship is already warm. When there's a
concrete offer available (a teardown, an observation, a resource), lead the CTA with offering to send it, not
with asking for a meeting.
`.trim();

export const STRUCTURE_GUIDANCE = `
Structure (don't force the exact wording, but hit these beats): a relevant hook grounded in a real supplied
signal, the insight or problem it points to, a brief credible reason the sender is positioned to raise it, a
specific low-friction offer, and a simple CTA. Never open with "Hope you're doing well", "I hope this email
finds you well", "My name is...", "I'm reaching out because...", "I wanted to introduce myself", "Just
checking in", or "Happy Monday" — start with relevance instead. Never list more than one problem and one
offer — no feature dumps. The sender's self-introduction should be one short clause, not a biography: target
roughly 70-80% of the email being about the recipient's context and 20-30% about the sender.
`.trim();

export const LENGTH_GUIDANCE = `
Target 50-100 words (never pad to hit a minimum; only exceed 125 words if the message genuinely requires the
extra context). 3-5 short paragraphs, 3-4 sentences is a strong default. Write at roughly a grade 3-7 reading
level — prefer "noticed", "built", "helped", "tested", "send", "see", "try" over "leveraged", "facilitated",
"operationalized", "synergized", "endeavored".
`.trim();

export const SUBJECT_LINE_GUIDANCE = `
Generate 3 subject line options per variant, 1-4 words, favoring specificity/relevance/natural language over
cleverness. Avoid ALL CAPS, exclamation points, "URGENT", "IMPORTANT", "Amazing opportunity", "Revolutionary
solution", and never use "Re:" unless there's a real prior thread. Score each subject line 0-100 on relevance,
specificity, natural tone, and spam risk.
`.trim();

export const COLD_EMAIL_LANGUAGE_GUARDRAIL = LANGUAGE_QUALITY_GUARDRAIL;
