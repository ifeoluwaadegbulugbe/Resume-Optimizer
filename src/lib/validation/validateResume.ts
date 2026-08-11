import type { ResumeData, ValidationIssue } from "@/types/resume";
import { countWords } from "@/lib/ai/normalize";

const REQUIRED_METRIC_PLACEHOLDER = /\[[^\]]+\]/;

const WEAK_OPENERS = /^(responsible for|worked on|duties included|tasked with)\b/i;

const GENERIC_PHRASES = [
  "results-driven",
  "hardworking",
  "team player",
  "detail-oriented",
  "go-getter",
  "dynamic professional",
  "proven track record",
  "seeking an opportunity",
];

const AI_SPEAK_VERBS = ["leverage", "leveraged", "spearheaded", "orchestrated", "revolutionized", "championed"];

/** All bullet-bearing text in a resume, tagged with where it came from. */
function allTextBlocks(data: ResumeData): { text: string; location: string }[] {
  const blocks: { text: string; location: string }[] = [];
  if (data.summary) blocks.push({ text: data.summary, location: "summary" });
  for (const e of data.experience) {
    for (const b of e.bullets) blocks.push({ text: b.text, location: `experience:${e.id}` });
  }
  for (const p of data.projects) {
    for (const b of p.bullets) blocks.push({ text: b.text, location: `projects:${p.id}` });
  }
  return blocks;
}

/** Local (non-AI), deterministic structural validation. Runs fast and cheap
 * before/after the AI hallucination check so obvious issues are always caught. */
export function validateResumeLocally(data: ResumeData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const wordCount = countWords(data);
  if (wordCount < 450) {
    issues.push({
      type: "word_count",
      severity: "warning",
      message: `Resume is ${wordCount} words, below the 450-word minimum.`,
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

  const blocks = allTextBlocks(data);

  for (const { text, location } of blocks) {
    if (text.includes("—")) {
      issues.push({
        type: "formatting",
        severity: "warning",
        message: `Contains an em dash, which reads as AI-generated: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
        location,
      });
    }
  }

  for (const entry of data.experience) {
    for (const bullet of entry.bullets) {
      if (WEAK_OPENERS.test(bullet.text.trim())) {
        issues.push({
          type: "grammar",
          severity: "warning",
          message: `Bullet under ${entry.company} opens with a responsibility phrase instead of an action verb: "${bullet.text.slice(0, 60)}${bullet.text.length > 60 ? "…" : ""}"`,
          location: `experience:${entry.id}`,
        });
      }
    }
  }

  for (const { text, location } of blocks) {
    const lower = text.toLowerCase();
    for (const phrase of GENERIC_PHRASES) {
      if (lower.includes(phrase)) {
        issues.push({
          type: "grammar",
          severity: "warning",
          message: `Contains generic filler ("${phrase}") that isn't specific evidence: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
          location,
        });
      }
    }
    for (const verb of AI_SPEAK_VERBS) {
      if (new RegExp(`\\b${verb}\\b`, "i").test(text)) {
        issues.push({
          type: "grammar",
          severity: "warning",
          message: `Uses an overused AI-sounding verb ("${verb}"): "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
          location,
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
