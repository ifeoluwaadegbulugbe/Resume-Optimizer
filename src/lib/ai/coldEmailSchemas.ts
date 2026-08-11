import { S } from "./schemas";

export const EMAIL_STRATEGY_VALUES = [
  "insight_led",
  "give_first",
  "problem_led",
  "social_proof_led",
  "connection_led",
  "story_led",
] as const;

export const subjectLineSchema = S.obj(
  { text: S.str(), score: S.int("0-100"), reasoning: S.str() },
  ["text", "score", "reasoning"]
);

export const scoreExplanation = (max: number) =>
  S.obj({ score: S.int(`0-${max}`), max: S.int(), explanation: S.str() }, ["score", "max", "explanation"]);

export const coldEmailScoreSchema = S.obj(
  {
    total: S.int("0-100"),
    relevance: scoreExplanation(20),
    personalizationQuality: scoreExplanation(15),
    value: scoreExplanation(15),
    credibility: scoreExplanation(10),
    clarity: scoreExplanation(10),
    brevity: scoreExplanation(10),
    ctaFriction: scoreExplanation(10),
    humanQuality: scoreExplanation(5),
    trust: scoreExplanation(5),
  },
  [
    "total",
    "relevance",
    "personalizationQuality",
    "value",
    "credibility",
    "clarity",
    "brevity",
    "ctaFriction",
    "humanQuality",
    "trust",
  ]
);

export const detectedProblemSchema = S.obj(
  { issue: S.str(), detail: S.str(), recommendation: S.str() },
  ["issue", "detail", "recommendation"]
);

export const variantSchema = S.obj(
  {
    strategy: S.enum([...EMAIL_STRATEGY_VALUES]),
    subjectLines: S.arr(subjectLineSchema),
    body: S.str(),
  },
  ["strategy", "subjectLines", "body"]
);

export const generateResultSchema = S.obj(
  {
    sufficient: S.bool("false if there isn't enough real information to write a genuinely personalized email"),
    insufficientReason: S.str("empty string if sufficient=true"),
    questionsToAsk: S.arr(S.str("empty array if sufficient=true")),
    variants: S.arr(variantSchema),
  },
  ["sufficient", "insufficientReason", "questionsToAsk", "variants"]
);

// All variants are scored in a single call (rather than one call per
// variant) to keep this feature's Gemini usage modest — free-tier request
// quotas are tight, and this pipeline already needs several calls.
export const scoreAllResultSchema = S.obj(
  {
    results: S.arr(
      S.obj(
        {
          strategy: S.enum([...EMAIL_STRATEGY_VALUES]),
          breakdown: coldEmailScoreSchema,
          problems: S.arr(detectedProblemSchema),
        },
        ["strategy", "breakdown", "problems"]
      )
    ),
  },
  ["results"]
);

export const refineVariantSchema = S.obj(
  { subjectLines: S.arr(subjectLineSchema), body: S.str() },
  ["subjectLines", "body"]
);

export const followUpSchema = S.obj(
  {
    angle: S.enum(["additional_observation", "useful_resource", "specific_example", "breakup"]),
    subject: S.str(),
    body: S.str(),
  },
  ["angle", "subject", "body"]
);
