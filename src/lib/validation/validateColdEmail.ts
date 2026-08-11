import type { SubjectLineScore } from "@/types/coldEmail";

export interface ColdEmailLocalIssue {
  severity: "error" | "warning";
  message: string;
}

const BANNED_OPENERS = [
  "hope you're doing well",
  "hope you are doing well",
  "i hope this email finds you well",
  "my name is",
  "i'm reaching out because",
  "i am reaching out because",
  "i wanted to introduce myself",
  "just checking in",
  "happy monday",
];

const SPAM_TRIGGER_WORDS = [
  "free!!!",
  "act now",
  "urgent",
  "limited time",
  "guaranteed",
  "amazing",
  "revolutionary",
  "game-changing",
  "game changing",
  "cutting-edge",
  "cutting edge",
  "transformative solution",
];

const AI_SOUNDING_PHRASES = [
  "given your impressive",
  "your remarkable journey",
  "your innovative company",
  "leveraging cutting-edge",
];

export function validateColdEmailBody(body: string): ColdEmailLocalIssue[] {
  const issues: ColdEmailLocalIssue[] = [];
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount > 125) {
    issues.push({ severity: "warning", message: `Body is ${wordCount} words — over the 125-word ceiling.` });
  } else if (wordCount > 100) {
    issues.push({
      severity: "warning",
      message: `Body is ${wordCount} words — above the 50-100 target range (still under the 125 ceiling).`,
    });
  } else if (wordCount < 50) {
    issues.push({ severity: "warning", message: `Body is ${wordCount} words — under the 50-word target.` });
  }

  if (body.includes("—")) {
    issues.push({ severity: "warning", message: "Contains an em dash, which reads as AI-generated." });
  }

  const lower = body.toLowerCase();
  for (const opener of BANNED_OPENERS) {
    if (lower.trimStart().startsWith(opener)) {
      issues.push({ severity: "warning", message: `Opens with a generic phrase: "${opener}".` });
    }
  }
  for (const word of SPAM_TRIGGER_WORDS) {
    if (lower.includes(word)) {
      issues.push({ severity: "warning", message: `Contains a spam-flagged phrase: "${word}".` });
    }
  }
  for (const phrase of AI_SOUNDING_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push({ severity: "warning", message: `Contains an AI-sounding phrase: "${phrase}".` });
    }
  }

  const allCapsWords = body.match(/\b[A-Z]{4,}\b/g) ?? [];
  if (allCapsWords.length > 0) {
    issues.push({ severity: "warning", message: `Contains shouty all-caps text: ${allCapsWords.join(", ")}.` });
  }

  return issues;
}

export function validateSubjectLine(subject: SubjectLineScore): ColdEmailLocalIssue[] {
  const issues: ColdEmailLocalIssue[] = [];
  const wordCount = subject.text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 6) {
    issues.push({ severity: "warning", message: `Subject "${subject.text}" is ${wordCount} words — aim for 1-4.` });
  }
  if (/^re:/i.test(subject.text.trim())) {
    issues.push({
      severity: "warning",
      message: `Subject "${subject.text}" starts with "Re:" — only valid if there's a real prior thread.`,
    });
  }
  if (subject.text === subject.text.toUpperCase() && /[a-z]/i.test(subject.text)) {
    issues.push({ severity: "warning", message: `Subject "${subject.text}" is in all caps.` });
  }
  return issues;
}
