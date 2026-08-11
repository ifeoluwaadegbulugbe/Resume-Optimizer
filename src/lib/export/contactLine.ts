import type { ContactInfo } from "@/types/resume";

/** Location/phone/email are self-evident; links are labeled so a recruiter
 * (and an ATS parser) doesn't have to guess what a bare URL points to.
 * Used for plain-text export, where a real hyperlink isn't possible. */
export function formatContactParts(contact: ContactInfo): string[] {
  return [
    contact.location,
    contact.phone,
    contact.email,
    contact.linkedin && `LinkedIn: ${contact.linkedin}`,
    contact.portfolio && `Portfolio: ${contact.portfolio}`,
    contact.github && `GitHub: ${contact.github}`,
  ].filter((v): v is string => Boolean(v));
}

/** Adds a protocol if missing, so PDF/DOCX hyperlink targets are valid URLs
 * even when the source resume just wrote "linkedin.com/in/jane". */
export function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export interface ContactLink {
  label: "LinkedIn" | "Portfolio" | "GitHub";
  href: string;
}

/** The non-link contact parts (location/phone/email), for the plain-text run. */
export function plainContactParts(contact: ContactInfo): string[] {
  return [contact.location, contact.phone, contact.email].filter((v): v is string => Boolean(v));
}

/** The link contact parts, each with visible label text + a normalized href
 * — used by the PDF and DOCX renderers to produce real clickable hyperlinks. */
export function contactLinks(contact: ContactInfo): ContactLink[] {
  const links: ContactLink[] = [];
  if (contact.linkedin) links.push({ label: "LinkedIn", href: normalizeUrl(contact.linkedin) });
  if (contact.portfolio) links.push({ label: "Portfolio", href: normalizeUrl(contact.portfolio) });
  if (contact.github) links.push({ label: "GitHub", href: normalizeUrl(contact.github) });
  return links;
}

/** Joins "Title" and "Company" (or "Institution" and "Degree") without an em
 * dash — generated resume text avoids em dashes entirely, and this join is
 * part of the same visible document. */
export function joinTitled(a: string, b: string): string {
  return `${a}, ${b}`;
}
