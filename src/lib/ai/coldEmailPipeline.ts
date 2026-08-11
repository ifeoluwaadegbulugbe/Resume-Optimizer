import { randomUUID } from "crypto";
import type {
  ColdEmailInput,
  ColdEmailResult,
  ColdEmailVariant,
  ColdEmailPipelineStage,
  DetectedProblem,
  ColdEmailScoreBreakdown,
} from "@/types/coldEmail";
import { generateColdEmailVariants, type RawVariant } from "./coldEmail/generateVariants";
import { scoreColdEmailVariants, type ScoredVariantRaw } from "./coldEmail/scoreVariants";
import { refineColdEmailVariant } from "./coldEmail/refineVariant";
import { validateColdEmailBody, validateSubjectLine } from "@/lib/validation/validateColdEmail";

const SCORE_TARGET = 90;
const MAX_ITERATIONS = 2;

function localIssuesAsProblems(body: string, subjectLines: RawVariant["subjectLines"]): DetectedProblem[] {
  const problems: DetectedProblem[] = [];
  for (const issue of validateColdEmailBody(body)) {
    problems.push({ issue: "Formatting", detail: issue.message, recommendation: "Rewrite to fix this." });
  }
  for (const s of subjectLines) {
    for (const issue of validateSubjectLine(s)) {
      problems.push({ issue: "Subject line", detail: issue.message, recommendation: "Shorten or rephrase." });
    }
  }
  return problems;
}

function weakAreas(breakdown: ColdEmailScoreBreakdown): string[] {
  const rows = [
    { label: "Relevance", ...breakdown.relevance },
    { label: "Personalization Quality", ...breakdown.personalizationQuality },
    { label: "Value", ...breakdown.value },
    { label: "Credibility", ...breakdown.credibility },
    { label: "Clarity", ...breakdown.clarity },
    { label: "Brevity", ...breakdown.brevity },
    { label: "CTA Friction", ...breakdown.ctaFriction },
    { label: "Human Quality", ...breakdown.humanQuality },
    { label: "Trust", ...breakdown.trust },
  ];
  return rows
    .filter((r) => r.score / r.max < 0.85)
    .sort((a, b) => b.max - b.score - (a.max - a.score))
    .map((r) => `${r.label}: ${r.score}/${r.max} — ${r.explanation}`);
}

function buildVariant(raw: RawVariant, scored: ScoredVariantRaw): ColdEmailVariant {
  const problems = [...scored.problems, ...localIssuesAsProblems(raw.body, raw.subjectLines)];
  return {
    id: randomUUID(),
    strategy: raw.strategy,
    subjectLines: raw.subjectLines,
    body: raw.body,
    wordCount: raw.body.trim().split(/\s+/).filter(Boolean).length,
    score: scored.breakdown,
    problems,
  };
}

export async function runColdEmailPipeline(
  input: ColdEmailInput,
  onProgress: (stage: ColdEmailPipelineStage, iteration?: number) => void
): Promise<ColdEmailResult> {
  onProgress("checking_sufficiency");
  onProgress("generating_variants");
  const generated = await generateColdEmailVariants(input);

  if (!generated.sufficient || generated.variants.length === 0) {
    return {
      id: randomUUID(),
      variants: [],
      recommendedVariantId: "",
      recommendationReason: "",
      scoreGate: { reached90: false, iterations: 0, scoreHistory: [], limitingFactors: [] },
      insufficientInfo: {
        reason: generated.insufficientReason || "Not enough specific information to write a genuinely personalized email.",
        questionsToAsk: generated.questionsToAsk,
      },
    };
  }

  onProgress("scoring_variants");
  let rawVariants = generated.variants;
  let scored = await scoreColdEmailVariants(input, rawVariants);
  let variants = rawVariants.map((v) => buildVariant(v, scored.find((s) => s.strategy === v.strategy)!));

  const scoreHistory: { iteration: number; bestScore: number }[] = [];
  let iterations = 1;
  scoreHistory.push({ iteration: 1, bestScore: Math.max(...variants.map((v) => v.score.total)) });

  while (iterations < MAX_ITERATIONS && Math.max(...variants.map((v) => v.score.total)) < SCORE_TARGET) {
    iterations++;
    onProgress("optimizing", iterations);

    // Refine the single weakest-scoring variant — cheapest path to a 90+ without
    // re-generating everything (and without burning extra API calls on variants
    // that are already strong).
    const worstIdx = variants.reduce(
      (worst, v, i) => (v.score.total < variants[worst].score.total ? i : worst),
      0
    );
    const worstRaw = rawVariants[worstIdx];
    const worstVariant = variants[worstIdx];

    const refined = await refineColdEmailVariant({
      input,
      variant: worstRaw,
      currentScore: worstVariant.score.total,
      weakAreas: weakAreas(worstVariant.score),
      problems: worstVariant.problems,
    });

    rawVariants = rawVariants.map((v, i) =>
      i === worstIdx ? { ...v, subjectLines: refined.subjectLines, body: refined.body } : v
    );

    onProgress("scoring_variants", iterations);
    scored = await scoreColdEmailVariants(input, rawVariants);
    variants = rawVariants.map((v) => buildVariant(v, scored.find((s) => s.strategy === v.strategy)!));

    scoreHistory.push({ iteration: iterations, bestScore: Math.max(...variants.map((v) => v.score.total)) });
  }

  onProgress("validating");

  const best = variants.reduce((a, b) => (b.score.total > a.score.total ? b : a));
  const reached90 = best.score.total >= SCORE_TARGET;

  const limitingFactors = reached90
    ? []
    : best.problems.map((p) => `${p.issue}: ${p.detail}`).slice(0, 6);

  const strongestCategory = (Object.entries(best.score) as [string, unknown][])
    .filter(([k]) => k !== "total")
    .map(([k, v]) => ({ key: k, ...(v as { score: number; max: number }) }))
    .sort((a, b) => b.score / b.max - a.score / a.max)[0];

  return {
    id: randomUUID(),
    variants,
    recommendedVariantId: best.id,
    recommendationReason: `Highest reply-probability score (${best.score.total}/100), strongest on ${strongestCategory?.key ?? "overall quality"}.`,
    scoreGate: { reached90, iterations, scoreHistory, limitingFactors },
  };
}
