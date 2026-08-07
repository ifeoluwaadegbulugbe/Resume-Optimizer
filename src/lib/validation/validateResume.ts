import type { ResumeData, ValidationIssue } from "@/types/resume";
import { countWords } from "@/lib/ai/normalize";

const REQUIRED_METRIC_PLACEHOLDER = /\[[^\]]+\]/;

/** Local (non-AI), deterministic structural validation. Runs fast and cheap
 * before/after the AI hallucination check so obvious issues are always caught. */
export function validateResumeLocally(data: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const wordCount = countWords(data);
  if (wordCount < 475) {
    issues.push({
      type: "word_count",
      severity: "warning",
      message: `Resume is ${wordCount} words, below the 475-word minimum.`,
      location: "overall",
    });
  } else if (wordCount > 600) {
    issues.push({
      type: "word_count",
      severity: "warning",
      message: `Resume is ${wordCount} words, above the 600-word maximum.`,
      location: "overall",
    });
  }

  if (!data.contact.fullName || !data.contact.email) {
    issues.push({
      type: "missing_contact",
      severity: "error",
      message: "Contact information (name and/or email) is missing.",
      location: "header",
    });
  }

  if (!data.summary || data.summary.trim().length === 0) {
    issues.push({
      type: "missing_section",
      severity: "warning",
      message: "Professional summary is missing.",
      location: "summary",
    });
  }

  if (data.experience.length === 0) {
    issues.push({
      type: "missing_section",
      severity: "warning",
      message: "No work experience found.",
      location: "experience",
    });
  }

  const allBullets = data.experience.flatMap((e) => e.bullets.map((b) => b.text.trim().toLowerCase()));
  const seen = new Set<string>();
  for (const b of allBullets) {
    if (seen.has(b)) {
      issues.push({
        type: "duplicate_bullet",
        severity: "warning",
        message: `Duplicate bullet detected: "${b.slice(0, 60)}${b.length > 60 ? "…" : ""}"`,
        location: "experience",
      });
    }
    seen.add(b);
  }

  for (const entry of data.experience) {
    for (const bullet of entry.bullets) {
      const wordsInBullet = bullet.text.split(/\s+/).filter(Boolean);
      const uniqueWords = new Set(wordsInBullet.map((w) => w.toLowerCase()));
      if (wordsInBullet.length > 8 && uniqueWords.size / wordsInBullet.length < 0.55) {
        issues.push({
          type: "keyword_stuffing",
          severity: "warning",
          message: `Bullet under ${entry.company} may be over-stuffed with repeated terms.`,
          location: `experience:${entry.id}`,
        });
      }
    }
  }

  return issues;
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export { REQUIRED_METRIC_PLACEHOLDER };
