// Cold Email Intelligence Engine — types.
//
// No live web browsing is wired into this app's AI calls, so "research" here
// means facts the user already knows and supplies themselves (a LinkedIn
// post they saw, a launch they read about, etc.), not an automated crawl.
// The system never fabricates a signal, proof point, or urgency reason that
// wasn't supplied.

export type OutreachPurpose =
  | "job_opportunity"
  | "sales"
  | "partnership"
  | "networking"
  | "freelance"
  | "investor_outreach"
  | "collaboration"
  | "introduction"
  | "other";

export type OutreachTone = "direct" | "warm" | "professional" | "casual" | "confident" | "curious" | "concise";

export type RecipientType = "founder" | "recruiter" | "hiring_manager" | "executive" | "potential_client" | "other";

export interface PersonalizationSignal {
  id: string;
  text: string; // e.g. "Posted about their onboarding redesign last week"
  source: string; // where the user got this, e.g. "Their LinkedIn post", "Job posting"
  approved: boolean; // user approve/reject before it's used
}

export interface ColdEmailInput {
  recipientName: string;
  recipientRole: string;
  recipientCompany: string;
  recipientLinkedIn?: string;
  recipientType: RecipientType;
  senderName: string;
  senderRole: string;
  senderCompany?: string;
  purpose: OutreachPurpose;
  whatSenderWants: string; // the ask, e.g. "15 minutes to discuss the frontend role"
  whatSenderOffers: string; // value/offer, e.g. "a short teardown of their onboarding flow"
  relevantProof: string; // real, specific proof — named client, metric, project
  mutualConnection?: string;
  previousInteraction?: string;
  jobPosting?: string; // pasted job posting text, for job_opportunity purpose
  specificReason?: string; // explicit "why I'm reaching out now"
  signals: PersonalizationSignal[];
  tone: OutreachTone;
  personalizationDepth: "light" | "standard" | "deep";
}

export type EmailStrategy = "insight_led" | "give_first" | "problem_led" | "social_proof_led" | "connection_led";

export const STRATEGY_LABELS: Record<EmailStrategy, string> = {
  insight_led: "Insight-led",
  give_first: "Give-first",
  problem_led: "Problem-led",
  social_proof_led: "Social-proof-led",
  connection_led: "Connection-led",
};

export interface SubjectLineScore {
  text: string;
  score: number; // 0-100
  reasoning: string;
}

export interface ColdEmailScoreBreakdown {
  total: number; // 0-100
  relevance: { score: number; max: number; explanation: string }; // 20
  personalizationQuality: { score: number; max: number; explanation: string }; // 15
  value: { score: number; max: number; explanation: string }; // 15
  credibility: { score: number; max: number; explanation: string }; // 10
  clarity: { score: number; max: number; explanation: string }; // 10
  brevity: { score: number; max: number; explanation: string }; // 10
  ctaFriction: { score: number; max: number; explanation: string }; // 10
  humanQuality: { score: number; max: number; explanation: string }; // 5
  trust: { score: number; max: number; explanation: string }; // 5
}

export interface DetectedProblem {
  issue: string;
  detail: string;
  recommendation: string;
}

export interface ColdEmailVariant {
  id: string;
  strategy: EmailStrategy;
  subjectLines: SubjectLineScore[];
  body: string;
  wordCount: number;
  score: ColdEmailScoreBreakdown;
  problems: DetectedProblem[];
}

export interface ColdEmailScoreGateResult {
  reached90: boolean;
  iterations: number;
  scoreHistory: { iteration: number; bestScore: number }[];
  limitingFactors: string[];
}

export interface ColdEmailResult {
  id: string;
  variants: ColdEmailVariant[];
  recommendedVariantId: string;
  recommendationReason: string;
  scoreGate: ColdEmailScoreGateResult;
  insufficientInfo?: {
    reason: string;
    questionsToAsk: string[];
  };
}

export type FollowUpAngle = "additional_observation" | "useful_resource" | "specific_example" | "breakup";

export interface FollowUpMessage {
  id: string;
  angle: FollowUpAngle;
  subject: string;
  body: string;
  createdAt: string;
}

export type ReplyClassification =
  | "interested"
  | "curious"
  | "not_now"
  | "objection"
  | "referral"
  | "positive"
  | "negative"
  | "needs_more_info"
  | "wants_pricing"
  | "wants_meeting"
  | "wrong_person";

export const PIPELINE_STAGE_LABELS_COLD_EMAIL = {
  checking_sufficiency: "Checking you've given enough to work with",
  generating_variants: "Drafting strategic variants",
  scoring_variants: "Scoring for reply probability",
  optimizing: "Improving the weakest variant",
  validating: "Final validation",
} as const;

export type ColdEmailPipelineStage = keyof typeof PIPELINE_STAGE_LABELS_COLD_EMAIL;
