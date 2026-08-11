import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ExternalHyperlink,
  BorderStyle,
} from "docx";
import type { ResumeData } from "@/types/resume";
import { plainContactParts, contactLinks, joinTitled } from "./contactLine";

const ACCENT = "C2185B";

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, color: ACCENT, size: 20 })],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text, size: 19 })] });
}

export async function buildResumeDocx(data: ResumeData): Promise<Buffer> {
  const contactParts = plainContactParts(data.contact);
  const links = contactLinks(data.contact);

  const contactLineChildren = [
    new TextRun({ text: contactParts.join("  |  "), size: 18, color: "444444" }),
    ...links.flatMap((l, i) => [
      new TextRun({ text: i > 0 || contactParts.length > 0 ? "  |  " : "", size: 18, color: "444444" }),
      new ExternalHyperlink({
        link: l.href,
        children: [new TextRun({ text: l.label, style: "Hyperlink", size: 18 })],
      }),
    ]),
  ];

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: data.contact.fullName, bold: true, size: 40, color: ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: contactLineChildren,
    }),
  ];

  if (data.summary) {
    children.push(sectionHeading("Professional Summary"));
    children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: data.summary, size: 20 })] }));
  }

  if (data.skillGroups.length > 0) {
    children.push(sectionHeading("Skills"));
    for (const g of data.skillGroups) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${g.label}: `, bold: true, size: 19 }),
            new TextRun({ text: g.skills.join(", "), size: 19 }),
          ],
        })
      );
    }
  }

  if (data.experience.length > 0) {
    children.push(sectionHeading("Professional Experience"));
    for (const e of data.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          tabStops: [{ type: "right", position: 9350 }],
          children: [
            new TextRun({ text: joinTitled(e.title, e.company), bold: true, size: 20 }),
            new TextRun({ text: `\t${e.startDate} – ${e.endDate}`, size: 18, color: "555555" }),
          ],
        })
      );
      if (e.location) {
        children.push(new Paragraph({ children: [new TextRun({ text: e.location, size: 18, color: "333333" })] }));
      }
      for (const b of e.bullets) children.push(bulletParagraph(b.text));
    }
  }

  const includedProjects = data.projects.filter((p) => p.include);
  if (includedProjects.length > 0) {
    children.push(sectionHeading("Projects"));
    for (const p of includedProjects) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: p.name + (p.technologies.length ? ` (${p.technologies.join(", ")})` : ""),
              bold: true,
              size: 20,
            }),
          ],
        })
      );
      if (p.link) {
        children.push(
          new Paragraph({
            children: [
              new ExternalHyperlink({
                link: p.link,
                children: [new TextRun({ text: p.link, style: "Hyperlink", size: 18 })],
              }),
            ],
          })
        );
      }
      if (p.description) {
        children.push(new Paragraph({ children: [new TextRun({ text: p.description, size: 19 })] }));
      }
      for (const b of p.bullets) children.push(bulletParagraph(b.text));
    }
  }

  if (data.education.length > 0) {
    children.push(sectionHeading("Education"));
    for (const ed of data.education) {
      children.push(
        new Paragraph({
          tabStops: [{ type: "right", position: 9350 }],
          children: [
            new TextRun({
              text: `${joinTitled(ed.institution, ed.degree)}${ed.includeGpa && ed.gpa ? ` (GPA: ${ed.gpa})` : ""}`,
              bold: true,
              size: 20,
            }),
            new TextRun({ text: `\t${ed.startDate} – ${ed.endDate}`, size: 18, color: "555555" }),
          ],
        })
      );
    }
  }

  if (data.certifications.length > 0) {
    children.push(sectionHeading("Certifications"));
    for (const c of data.certifications) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `${joinTitled(c.name, c.issuer)} (${c.date})`, size: 19 })] })
      );
    }
  }

  const additional = [...data.awards, ...data.leadership, ...data.volunteer];
  if (additional.length > 0) {
    children.push(sectionHeading("Additional"));
    for (const item of additional) children.push(bulletParagraph(item));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: { default: { document: { run: { font: "Calibri" } } } },
  });

  return Packer.toBuffer(doc);
}
