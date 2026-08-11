import { generateStructured } from "../gemini";
import { S, resumeDataSchema } from "../schemas";
import { withIds, type RawResumeData } from "../normalize";
import { TRUTHFULNESS_GUARDRAIL, BULLET_CRAFT_GUIDANCE, LANGUAGE_QUALITY_GUARDRAIL } from "../prompts";
import type { ResumeData, JobDescriptionAnalysis, ChatMessage } from "@/types/resume";

const chatResultSchema = S.obj(
  {
    reply: S.str("Conversational reply to the user, 1-4 sentences."),
    madeChanges: S.bool(),
    changesSummary: S.arr(S.str()),
    resumeData: resumeDataSchema,
  },
  ["reply", "madeChanges", "changesSummary", "resumeData"]
);

interface ChatRawResult {
  reply: string;
  madeChanges: boolean;
  changesSummary: string[];
  resumeData: RawResumeData;
}

export interface ChatRefineResult {
  reply: string;
  madeChanges: boolean;
  changesSummary: string[];
  resumeData: ResumeData;
}

export async function chatRefineResume(opts: {
  originalResumeData: ResumeData;
  currentResumeData: ResumeData;
  jd: JobDescriptionAnalysis;
  history: ChatMessage[];
  userMessage: string;
}): Promise<ChatRefineResult> {
  const historyText = opts.history
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const raw = await generateStructured<ChatRawResult>({
    stage: "chat_refine",
    systemInstruction: `You are a resume-editing assistant having a conversation with a candidate about their
job-specific resume. ${TRUTHFULNESS_GUARDRAIL}

You may rewrite, reorganize, re-emphasize, tighten, or restructure any part of the resume the user asks about,
as long as every claim remains traceable to their ORIGINAL resume provided below. If the user asks you to add a
skill, technology, employer, metric, or achievement that is not supported by their original resume, do NOT add
it — explain in your reply why you won't, and suggest a truthful alternative if one exists (e.g. emphasizing a
related real skill instead). Keep the resume within 450-600 words after any edit.

${BULLET_CRAFT_GUIDANCE}

${LANGUAGE_QUALITY_GUARDRAIL}

If the request is just a question and doesn't require an edit, set madeChanges to false and return resumeData
unchanged.`,
    prompt: `TARGET JOB: ${opts.jd.jobTitle} at ${opts.jd.companyName}

CANDIDATE'S ORIGINAL RESUME (ground truth — never introduce facts beyond this)
${JSON.stringify(opts.originalResumeData, null, 2)}

CURRENT OPTIMIZED DRAFT (what the user is looking at right now)
${JSON.stringify(opts.currentResumeData, null, 2)}

CONVERSATION SO FAR
${historyText || "(no prior messages)"}

User's new message: "${opts.userMessage}"

Reply conversationally, then return the (possibly updated) full resumeData.`,
    schema: chatResultSchema,
    temperature: 0.4,
  });

  return {
    reply: raw.reply,
    madeChanges: raw.madeChanges,
    changesSummary: raw.changesSummary,
    resumeData: raw.madeChanges ? withIds(raw.resumeData) : opts.currentResumeData,
  };
}
