// Gemini structured-output schemas (Google's OpenAPI-subset Schema format).
// Kept as plain objects (not zod-derived) so we have full control over what
// the model is allowed to return.

export const S = {
  obj: (properties: Record<string, unknown>, required: string[] = []) => ({
    type: "OBJECT",
    properties,
    required,
  }),
  arr: (items: unknown) => ({ type: "ARRAY", items }),
  str: (description?: string) => ({ type: "STRING", ...(description ? { description } : {}) }),
  num: (description?: string) => ({ type: "NUMBER", ...(description ? { description } : {}) }),
  int: (description?: string) => ({ type: "INTEGER", ...(description ? { description } : {}) }),
  bool: (description?: string) => ({ type: "BOOLEAN", ...(description ? { description } : {}) }),
  enum: (values: string[], description?: string) => ({
    type: "STRING",
    enum: values,
    ...(description ? { description } : {}),
  }),
};

export const contactSchema = S.obj(
  {
    fullName: S.str(),
    email: S.str(),
    phone: S.str(),
    location: S.str(),
    linkedin: S.str("URL or empty string if not present"),
    portfolio: S.str("URL or empty string if not present"),
    github: S.str("URL or empty string if not present"),
  },
  ["fullName", "email", "phone", "location", "linkedin", "portfolio", "github"]
);

export const bulletSchema = S.str("A single achievement/responsibility bullet, verbatim or lightly cleaned from the source resume");

export const experienceEntrySchema = S.obj(
  {
    company: S.str(),
    title: S.str(),
    location: S.str(),
    startDate: S.str(),
    endDate: S.str('e.g. "Present" if current'),
    bullets: S.arr(bulletSchema),
  },
  ["company", "title", "location", "startDate", "endDate", "bullets"]
);

export const projectEntrySchema = S.obj(
  {
    name: S.str(),
    description: S.str(),
    bullets: S.arr(bulletSchema),
    technologies: S.arr(S.str()),
    link: S.str(),
  },
  ["name", "description", "bullets", "technologies", "link"]
);

export const educationEntrySchema = S.obj(
  {
    institution: S.str(),
    degree: S.str(),
    location: S.str(),
    startDate: S.str(),
    endDate: S.str(),
    gpa: S.str("empty string if not present"),
  },
  ["institution", "degree", "location", "startDate", "endDate", "gpa"]
);

export const certificationEntrySchema = S.obj(
  { name: S.str(), issuer: S.str(), date: S.str() },
  ["name", "issuer", "date"]
);

export const skillGroupSchema = S.obj(
  { label: S.str(), skills: S.arr(S.str()) },
  ["label", "skills"]
);

export const resumeDataSchema = S.obj(
  {
    contact: contactSchema,
    summary: S.str(),
    skillGroups: S.arr(skillGroupSchema),
    experience: S.arr(experienceEntrySchema),
    projects: S.arr(projectEntrySchema),
    education: S.arr(educationEntrySchema),
    certifications: S.arr(certificationEntrySchema),
    awards: S.arr(S.str()),
    leadership: S.arr(S.str()),
    volunteer: S.arr(S.str()),
  },
  [
    "contact",
    "summary",
    "skillGroups",
    "experience",
    "projects",
    "education",
    "certifications",
    "awards",
    "leadership",
    "volunteer",
  ]
);

export const jdKeywordSchema = S.obj(
  {
    keyword: S.str(),
    variations: S.arr(S.str()),
    priority: S.enum(["critical", "high", "medium", "low"]),
    type: S.enum(["exact", "semantic", "related"]),
    category: S.enum([
      "technical_skill",
      "soft_skill",
      "tool",
      "certification",
      "job_title",
      "domain_terminology",
      "behavioral",
    ]),
    occurrences: S.int(),
  },
  ["keyword", "variations", "priority", "type", "category", "occurrences"]
);

export const jobRequirementSchema = S.obj(
  { text: S.str(), isRequired: S.bool() },
  ["text", "isRequired"]
);

export const cultureSignalSchema = S.obj(
  { label: S.str(), evidence: S.str() },
  ["label", "evidence"]
);

export const jdAnalysisSchema = S.obj(
  {
    requiredQualifications: S.arr(jobRequirementSchema),
    preferredQualifications: S.arr(jobRequirementSchema),
    technicalSkills: S.arr(S.str()),
    softSkills: S.arr(S.str()),
    responsibilities: S.arr(S.str()),
    behavioralVerbs: S.arr(S.str()),
    cultureSignals: S.arr(cultureSignalSchema),
    keywordMap: S.arr(jdKeywordSchema),
  },
  [
    "requiredQualifications",
    "preferredQualifications",
    "technicalSkills",
    "softSkills",
    "responsibilities",
    "behavioralVerbs",
    "cultureSignals",
    "keywordMap",
  ]
);

export const relevanceEntrySchema = S.obj(
  {
    company: S.str(),
    title: S.str(),
    relevanceScore: S.int("0-100"),
    reasoning: S.str(),
  },
  ["company", "title", "relevanceScore", "reasoning"]
);

export const gapSchema = S.obj(
  {
    requirement: S.str(),
    hasEvidence: S.bool(),
    evidenceSummary: S.str("empty string if hasEvidence is false"),
  },
  ["requirement", "hasEvidence", "evidenceSummary"]
);

export const relevanceAnalysisSchema = S.obj(
  {
    experienceRelevance: S.arr(relevanceEntrySchema),
    requirementGaps: S.arr(gapSchema),
  },
  ["experienceRelevance", "requirementGaps"]
);

export const scoreExplanationSchema = (max: number) =>
  S.obj(
    { score: S.int(`0-${max}`), max: S.int(), explanation: S.str() },
    ["score", "max", "explanation"]
  );

export const atsScoreSchema = S.obj(
  {
    total: S.int("0-100"),
    keywordMatch: scoreExplanationSchema(30),
    requiredQualifications: scoreExplanationSchema(20),
    skillsMatch: scoreExplanationSchema(15),
    responsibilityAlignment: scoreExplanationSchema(15),
    atsStructure: scoreExplanationSchema(10),
    semanticRelevance: scoreExplanationSchema(10),
  },
  [
    "total",
    "keywordMatch",
    "requiredQualifications",
    "skillsMatch",
    "responsibilityAlignment",
    "atsStructure",
    "semanticRelevance",
  ]
);

export const keywordMatchResultSchema = S.obj(
  {
    keyword: S.str(),
    priority: S.enum(["critical", "high", "medium", "low"]),
    status: S.enum(["matched", "partial", "missing", "unsupported"]),
    whyItMatters: S.str(),
    whereItFits: S.str("empty string if status is matched"),
    foundIn: S.str("empty string if not matched"),
  },
  ["keyword", "priority", "status", "whyItMatters", "whereItFits", "foundIn"]
);

export const atsResultSchema = S.obj(
  {
    breakdown: atsScoreSchema,
    keywordCoverage: S.arr(keywordMatchResultSchema),
  },
  ["breakdown", "keywordCoverage"]
);

export const recruiterScoreSchema = S.obj(
  {
    total: S.int("0-100"),
    relevance: scoreExplanationSchema(20),
    achievementStrength: scoreExplanationSchema(20),
    experienceQuality: scoreExplanationSchema(15),
    clarity: scoreExplanationSchema(10),
    careerNarrative: scoreExplanationSchema(10),
    cultureFit: scoreExplanationSchema(10),
    credibility: scoreExplanationSchema(10),
    professionalPresentation: scoreExplanationSchema(5),
  },
  [
    "total",
    "relevance",
    "achievementStrength",
    "experienceQuality",
    "clarity",
    "careerNarrative",
    "cultureFit",
    "credibility",
    "professionalPresentation",
  ]
);

export const bulletComparisonSchema = S.obj(
  {
    original: S.str(),
    optimized: S.str(),
    keywordsAdded: S.arr(S.str()),
    achievementImprovement: S.str(),
    whyStronger: S.str(),
  },
  ["original", "optimized", "keywordsAdded", "achievementImprovement", "whyStronger"]
);

export const recruiterResultSchema = S.obj(
  {
    breakdown: recruiterScoreSchema,
    strongSignals: S.arr(S.str()),
    weakSignals: S.arr(S.str()),
    shortlistDecision: S.enum(["Yes", "Maybe", "No"]),
    shortlistReason: S.str(),
    bulletComparisons: S.arr(bulletComparisonSchema),
    cultureFitPct: S.int("0-100"),
    achievementStrengthPct: S.int("0-100"),
    readabilityPct: S.int("0-100"),
  },
  [
    "breakdown",
    "strongSignals",
    "weakSignals",
    "shortlistDecision",
    "shortlistReason",
    "bulletComparisons",
    "cultureFitPct",
    "achievementStrengthPct",
    "readabilityPct",
  ]
);

export const validationIssueSchema = S.obj(
  {
    type: S.enum([
      "word_count",
      "unsupported_claim",
      "fabricated_metric",
      "missing_section",
      "missing_contact",
      "keyword_stuffing",
      "duplicate_bullet",
      "formatting",
      "grammar",
    ]),
    severity: S.enum(["error", "warning"]),
    message: S.str(),
    location: S.str(),
  },
  ["type", "severity", "message", "location"]
);

export const hallucinationCheckSchema = S.obj(
  { issues: S.arr(validationIssueSchema) },
  ["issues"]
);

export const optimizeResultSchema = S.obj(
  {
    resumeData: resumeDataSchema,
    whatImproved: S.arr(S.str("short bullet describing an improvement, e.g. '23 relevant keywords added naturally'")),
    improvementSuggestions: S.arr(
      S.obj(
        {
          title: S.str(),
          description: S.str(),
          impact: S.enum(["highest", "high", "medium", "low"]),
          estimatedScoreChange: S.str(),
          targetSection: S.str(),
        },
        ["title", "description", "impact", "estimatedScoreChange", "targetSection"]
      )
    ),
  },
  ["resumeData", "whatImproved", "improvementSuggestions"]
);
