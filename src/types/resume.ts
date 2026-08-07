// Core domain types shared across parsing, AI pipeline, editor, scoring, and export.

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  github: string;
}

export interface ExperienceBullet {
  id: string;
  text: string;
  originalText: string;
  isEdited: boolean;
  isLocked: boolean;
  keywordsUsed: string[];
  hasUnsupportedClaim: boolean;
  unsupportedReason?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string; // "Present" allowed
  bullets: ExperienceBullet[];
  relevanceScore: number; // 0-100, how relevant to target job
  isLocked: boolean;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  bullets: ExperienceBullet[];
  technologies: string[];
  link?: string;
  include: boolean;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  includeGpa: boolean;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface SkillGroup {
  id: string;
  label: string; // e.g. "Languages", "Frameworks", "Tools"
  skills: string[];
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  skillGroups: SkillGroup[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  awards: string[];
  leadership: string[];
  volunteer: string[];
}

export type KeywordPriority = "critical" | "high" | "medium" | "low";
export type KeywordType = "exact" | "semantic" | "related";

export interface JDKeyword {
  keyword: string;
  variations: string[];
  priority: KeywordPriority;
  type: KeywordType;
  category:
    | "technical_skill"
    | "soft_skill"
    | "tool"
    | "certification"
    | "job_title"
    | "domain_terminology"
    | "behavioral";
  occurrences: number;
}

export interface CultureSignal {
  label: string; // e.g. "Fast-paced", "Ownership-oriented"
  evidence: string; // quote/phrase from JD that implies this
  isInferred: true;
}

export interface JobRequirement {
  text: string;
  isRequired: boolean; // true = required, false = preferred
}

export interface JobDescriptionAnalysis {
  companyName: string;
  jobTitle: string;
  jobLocation: string;
  companyWebsite?: string;
  companyValues?: string;
  rawText: string;
  requiredQualifications: JobRequirement[];
  preferredQualifications: JobRequirement[];
  technicalSkills: string[];
  softSkills: string[];
  responsibilities: string[];
  behavioralVerbs: string[];
  cultureSignals: CultureSignal[];
  keywordMap: JDKeyword[];
}

export type KeywordMatchStatus = "matched" | "partial" | "missing" | "unsupported";

export interface KeywordMatchResult {
  keyword: string;
  priority: KeywordPriority;
  status: KeywordMatchStatus;
  whyItMatters: string;
  whereItFits?: string;
  foundIn?: string; // section where matched
}

export interface ScoreExplanation {
  score: number;
  max: number;
  explanation: string;
}

export interface ATSScoreBreakdown {
  total: number; // 0-100
  keywordMatch: ScoreExplanation; // 30
  requiredQualifications: ScoreExplanation; // 20
  skillsMatch: ScoreExplanation; // 15
  responsibilityAlignment: ScoreExplanation; // 15
  atsStructure: ScoreExplanation; // 10
  semanticRelevance: ScoreExplanation; // 10
}

export interface RecruiterScoreBreakdown {
  total: number; // 0-100
  relevance: ScoreExplanation; // 20
  achievementStrength: ScoreExplanation; // 20
  experienceQuality: ScoreExplanation; // 15
  clarity: ScoreExplanation; // 10
  careerNarrative: ScoreExplanation; // 10
  cultureFit: ScoreExplanation; // 10
  credibility: ScoreExplanation; // 10
  professionalPresentation: ScoreExplanation; // 5
}

export interface RecruiterFirstImpression {
  strongSignals: string[];
  weakSignals: string[];
  shortlistDecision: "Yes" | "Maybe" | "No";
  shortlistReason: string;
}

export interface BulletComparison {
  bulletId: string;
  original: string;
  optimized: string;
  keywordsAdded: string[];
  achievementImprovement: string;
  whyStronger: string;
}

export interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  impact: "highest" | "high" | "medium" | "low";
  estimatedScoreChange: string; // e.g. "+4 to +6 recruiter score"
  targetSection: string;
}

export interface ResumeScores {
  ats: ATSScoreBreakdown;
  recruiter: RecruiterScoreBreakdown;
  overall: number;
  jobMatch: number;
  keywordMatchPct: number;
  requiredSkillsPct: number;
  experienceRelevancePct: number;
  cultureFitPct: number;
  achievementStrengthPct: number;
  atsCompatibilityPct: number;
  resumeReadabilityPct: number;
}

export interface ValidationIssue {
  type:
    | "word_count"
    | "unsupported_claim"
    | "fabricated_metric"
    | "missing_section"
    | "missing_contact"
    | "keyword_stuffing"
    | "duplicate_bullet"
    | "formatting"
    | "grammar";
  severity: "error" | "warning";
  message: string;
  location?: string;
}

export interface OptimizedResume {
  id: string;
  resumeData: ResumeData;
  wordCount: number;
  template: ResumeTemplate;
  scores: ResumeScores;
  keywordCoverage: {
    matched: KeywordMatchResult[];
    partial: KeywordMatchResult[];
    missing: KeywordMatchResult[];
    unsupported: KeywordMatchResult[];
  };
  recruiterFirstImpression: RecruiterFirstImpression;
  bulletComparisons: BulletComparison[];
  improvementSuggestions: ImprovementSuggestion[];
  validationIssues: ValidationIssue[];
  whatImproved: string[];
}

export type ResumeTemplate = "classic" | "modern" | "minimal" | "professional" | "technical";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "final_round"
  | "offer"
  | "rejected";

export interface ApplicationRecord {
  id: string;
  company: string;
  position: string;
  dateApplied?: string;
  resumeVersionId: string;
  atsScore: number;
  recruiterScore: number;
  overallScore: number;
  status: ApplicationStatus;
  interviewStatus?: string;
  notes?: string;
  updatedAt: string;
}

export type PipelineStage =
  | "parsing_resume"
  | "analyzing_job"
  | "identifying_requirements"
  | "matching_experience"
  | "optimizing_achievements"
  | "checking_ats"
  | "simulating_recruiter"
  | "validating";

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  parsing_resume: "Reading resume",
  analyzing_job: "Analyzing job description",
  identifying_requirements: "Identifying critical requirements",
  matching_experience: "Matching experience",
  optimizing_achievements: "Optimizing achievements",
  checking_ats: "Checking ATS compatibility",
  simulating_recruiter: "Simulating recruiter review",
  validating: "Validating final resume",
};
