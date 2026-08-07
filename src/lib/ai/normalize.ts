import { randomUUID } from "crypto";
import type {
  ResumeData,
  ExperienceEntry,
  ExperienceBullet,
  ProjectEntry,
  EducationEntry,
  CertificationEntry,
  SkillGroup,
} from "@/types/resume";

function makeBullet(text: string): ExperienceBullet {
  return {
    id: randomUUID(),
    text,
    originalText: text,
    isEdited: false,
    isLocked: false,
    keywordsUsed: [],
    hasUnsupportedClaim: false,
  };
}

export interface RawResumeData {
  contact: ResumeData["contact"];
  summary: string;
  skillGroups: Array<Omit<SkillGroup, "id">>;
  experience: Array<
    Omit<ExperienceEntry, "id" | "bullets" | "relevanceScore" | "isLocked"> & { bullets: string[] }
  >;
  projects: Array<Omit<ProjectEntry, "id" | "bullets" | "include"> & { bullets: string[] }>;
  education: Array<Omit<EducationEntry, "id" | "includeGpa">>;
  certifications: Array<Omit<CertificationEntry, "id">>;
  awards: string[];
  leadership: string[];
  volunteer: string[];
}

/** Adds stable ids/defaults to a freshly-parsed (AI-returned) ResumeData shape. */
export function withIds(raw: RawResumeData): ResumeData {
  return {
    contact: raw.contact,
    summary: raw.summary,
    skillGroups: raw.skillGroups.map((g) => ({ id: randomUUID(), ...g })),
    experience: raw.experience.map((e) => ({
      id: randomUUID(),
      company: e.company,
      title: e.title,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      bullets: e.bullets.map(makeBullet),
      relevanceScore: 0,
      isLocked: false,
    })),
    projects: raw.projects.map((p) => ({
      id: randomUUID(),
      name: p.name,
      description: p.description,
      bullets: p.bullets.map(makeBullet),
      technologies: p.technologies,
      link: p.link || undefined,
      include: true,
    })),
    education: raw.education.map((ed) => ({ id: randomUUID(), ...ed, includeGpa: Boolean(ed.gpa) })),
    certifications: raw.certifications.map((c) => ({ id: randomUUID(), ...c })),
    awards: raw.awards,
    leadership: raw.leadership,
    volunteer: raw.volunteer,
  };
}

export function cloneResumeData(data: ResumeData): ResumeData {
  return JSON.parse(JSON.stringify(data));
}

export function countWords(data: ResumeData): number {
  const parts: string[] = [
    data.summary,
    ...data.skillGroups.flatMap((g) => g.skills),
    ...data.experience.flatMap((e) => [e.company, e.title, ...e.bullets.map((b) => b.text)]),
    ...data.projects
      .filter((p) => p.include)
      .flatMap((p) => [p.name, p.description, ...p.bullets.map((b) => b.text)]),
    ...data.education.map((e) => `${e.institution} ${e.degree}`),
    ...data.certifications.map((c) => c.name),
    ...data.awards,
    ...data.leadership,
    ...data.volunteer,
  ];
  const text = parts.join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
