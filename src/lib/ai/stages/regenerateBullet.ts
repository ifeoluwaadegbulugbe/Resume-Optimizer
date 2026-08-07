import { generateStructured } from "../gemini";
import { S } from "../schemas";
import { TRUTHFULNESS_GUARDRAIL, XYZ_FRAMEWORK_GUIDANCE } from "../prompts";
import type { JobDescriptionAnalysis } from "@/types/resume";

export interface BulletAlternative {
  focus: "achievement" | "technical" | "impact";
  text: string;
}

const schema = S.obj(
  {
    alternatives: S.arr(
      S.obj(
        { focus: S.enum(["achievement", "technical", "impact"]), text: S.str() },
        ["focus", "text"]
      )
    ),
  },
  ["alternatives"]
);

export async function regenerateBullet(opts: {
  originalBullet: string;
  currentBullet: string;
  roleContext: string; // e.g. "Marketing Manager at Barcode Studio"
  jd: JobDescriptionAnalysis;
}): Promise<BulletAlternative[]> {
  const { alternatives } = await generateStructured<{ alternatives: BulletAlternative[] }>({
    stage: "regenerate_bullet",
    systemInstruction: `You rewrite a single resume bullet three different ways, all truthful and all grounded
in the same underlying fact. ${TRUTHFULNESS_GUARDRAIL} ${XYZ_FRAMEWORK_GUIDANCE}
Produce exactly 3 alternatives:
1. focus="achievement" — leads with the outcome/result.
2. focus="technical" — emphasizes the tools/technologies/methods used.
3. focus="impact" — emphasizes scale, audience, or business impact.
All three must describe the same real event as the original bullet — do not introduce new facts.`,
    prompt: `Role context: ${opts.roleContext}
Target job: ${opts.jd.jobTitle} at ${opts.jd.companyName}
Relevant keywords to weave in only if truthful: ${opts.jd.keywordMap
      .slice(0, 20)
      .map((k) => k.keyword)
      .join(", ")}

Original bullet (ground truth — do not add facts beyond this): "${opts.originalBullet}"
Current bullet text: "${opts.currentBullet}"`,
    schema,
    temperature: 0.6,
  });
  return alternatives;
}
