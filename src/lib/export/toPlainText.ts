import type { ResumeData } from "@/types/resume";
import { formatContactParts, joinTitled } from "./contactLine";

export function resumeToPlainText(data: ResumeData): string {
  const lines: string[] = [];
  const contactParts = formatContactParts(data.contact);

  lines.push(data.contact.fullName);
  lines.push(contactParts.join(" | "));
  lines.push("");

  if (data.summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push(data.summary);
    lines.push("");
  }

  if (data.skillGroups.length) {
    lines.push("SKILLS");
    for (const g of data.skillGroups) lines.push(`${g.label}: ${g.skills.join(", ")}`);
    lines.push("");
  }

  if (data.experience.length) {
    lines.push("PROFESSIONAL EXPERIENCE");
    for (const e of data.experience) {
      lines.push(`${joinTitled(e.title, e.company)} (${e.location})`);
      lines.push(`${e.startDate} – ${e.endDate}`);
      for (const b of e.bullets) lines.push(`• ${b.text}`);
      lines.push("");
    }
  }

  const projects = data.projects.filter((p) => p.include);
  if (projects.length) {
    lines.push("PROJECTS");
    for (const p of projects) {
      lines.push(`${p.name}${p.technologies.length ? ` (${p.technologies.join(", ")})` : ""}`);
      if (p.description) lines.push(p.description);
      for (const b of p.bullets) lines.push(`• ${b.text}`);
      lines.push("");
    }
  }

  if (data.education.length) {
    lines.push("EDUCATION");
    for (const ed of data.education) {
      lines.push(`${joinTitled(ed.institution, ed.degree)}${ed.includeGpa && ed.gpa ? ` (GPA: ${ed.gpa})` : ""}`);
      lines.push(`${ed.startDate} – ${ed.endDate}`);
    }
    lines.push("");
  }

  if (data.certifications.length) {
    lines.push("CERTIFICATIONS");
    for (const c of data.certifications) lines.push(`${joinTitled(c.name, c.issuer)} (${c.date})`);
    lines.push("");
  }

  const additional = [...data.awards, ...data.leadership, ...data.volunteer];
  if (additional.length) {
    lines.push("ADDITIONAL");
    for (const item of additional) lines.push(`• ${item}`);
  }

  return lines.join("\n").trim();
}
