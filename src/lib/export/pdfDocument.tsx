import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { ResumeData, ResumeTemplate } from "@/types/resume";
import { plainContactParts, contactLinks, joinTitled } from "./contactLine";

const TEMPLATE_ACCENT: Record<ResumeTemplate, string> = {
  classic: "#111111",
  modern: "#c2185b",
  minimal: "#374151",
  professional: "#1f2937",
  technical: "#0f172a",
};

// Resumes must fit on a single page. Rather than guess a font size up front,
// the export route renders at density=1 first and re-renders at
// progressively tighter densities (see DENSITY_TIERS) only if the result
// overflows to a second page — so most resumes keep full-size, readable
// type, and only dense ones get compressed.
function makeStyles(template: ResumeTemplate, density: number) {
  const accent = TEMPLATE_ACCENT[template];
  const f = (n: number) => n * density;
  return StyleSheet.create({
    page: {
      paddingVertical: f(34),
      paddingHorizontal: f(40),
      fontSize: f(10),
      fontFamily: "Helvetica",
      color: "#1a1a1a",
    },
    name: { fontSize: f(20), fontFamily: "Helvetica-Bold", marginBottom: f(2), color: accent },
    contactRow: { fontSize: f(9), color: "#444444", marginBottom: f(10) },
    sectionTitle: {
      fontSize: f(10.5),
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: accent,
      borderBottomWidth: 1,
      borderBottomColor: accent,
      paddingBottom: f(2),
      marginTop: f(12),
      marginBottom: f(6),
    },
    summary: { fontSize: f(10), lineHeight: 1.4, marginBottom: f(2) },
    skillGroup: { flexDirection: "row", fontSize: f(9.5), marginBottom: f(2) },
    skillLabel: { fontFamily: "Helvetica-Bold", marginRight: f(4) },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: f(6) },
    entryTitle: { fontSize: f(10.5), fontFamily: "Helvetica-Bold" },
    entrySub: { fontSize: f(9.5), color: "#333333" },
    entryDates: { fontSize: f(9), color: "#555555" },
    bulletRow: { flexDirection: "row", marginTop: f(2), paddingLeft: f(8) },
    bulletDot: { width: f(8), fontSize: f(9.5) },
    bulletText: { flex: 1, fontSize: f(9.5), lineHeight: 1.35 },
  });
}

export const DENSITY_TIERS = [1, 0.93, 0.86, 0.8, 0.74];

export function ResumePdfDocument({
  data,
  template,
  density = 1,
}: {
  data: ResumeData;
  template: ResumeTemplate;
  density?: number;
}) {
  const s = makeStyles(template, density);
  const contactParts = plainContactParts(data.contact);
  const links = contactLinks(data.contact);

  return (
    <Document title={`${data.contact.fullName} Resume`}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{data.contact.fullName}</Text>
        <Text style={s.contactRow}>
          {contactParts.join("  |  ")}
          {links.map((l, i) => (
            <Text key={l.label}>
              {i > 0 || contactParts.length > 0 ? "  |  " : ""}
              <Link src={l.href}>{l.label}</Link>
            </Text>
          ))}
        </Text>

        {data.summary && (
          <View>
            <Text style={s.sectionTitle}>Professional Summary</Text>
            <Text style={s.summary}>{data.summary}</Text>
          </View>
        )}

        {data.skillGroups.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Skills</Text>
            {data.skillGroups.map((g) => (
              <View key={g.id} style={s.skillGroup}>
                <Text style={s.skillLabel}>{g.label}:</Text>
                <Text>{g.skills.join(", ")}</Text>
              </View>
            ))}
          </View>
        )}

        {data.experience.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Professional Experience</Text>
            {data.experience.map((e) => (
              <View key={e.id} wrap={false}>
                <View style={s.entryHeader}>
                  <Text style={s.entryTitle}>{joinTitled(e.title, e.company)}</Text>
                  <Text style={s.entryDates}>
                    {e.startDate} – {e.endDate}
                  </Text>
                </View>
                {e.location && <Text style={s.entrySub}>{e.location}</Text>}
                {e.bullets.map((b) => (
                  <View key={b.id} style={s.bulletRow}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{b.text}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {data.projects.filter((p) => p.include).length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Projects</Text>
            {data.projects
              .filter((p) => p.include)
              .map((p) => (
                <View key={p.id} wrap={false}>
                  <Text style={s.entryTitle}>
                    {p.name}
                    {p.technologies.length > 0 ? ` (${p.technologies.join(", ")})` : ""}
                  </Text>
                  {p.link && <Link src={p.link} style={s.entrySub}>{p.link}</Link>}
                  {p.description && <Text style={s.summary}>{p.description}</Text>}
                  {p.bullets.map((b) => (
                    <View key={b.id} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b.text}</Text>
                    </View>
                  ))}
                </View>
              ))}
          </View>
        )}

        {data.education.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Education</Text>
            {data.education.map((ed) => (
              <View key={ed.id} style={s.entryHeader}>
                <Text style={s.entryTitle}>
                  {joinTitled(ed.institution, ed.degree)}
                  {ed.includeGpa && ed.gpa ? ` (GPA: ${ed.gpa})` : ""}
                </Text>
                <Text style={s.entryDates}>
                  {ed.startDate} – {ed.endDate}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.certifications.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Certifications</Text>
            {data.certifications.map((c) => (
              <Text key={c.id} style={s.summary}>
                {joinTitled(c.name, c.issuer)} ({c.date})
              </Text>
            ))}
          </View>
        )}

        {(data.awards.length > 0 || data.leadership.length > 0 || data.volunteer.length > 0) && (
          <View>
            <Text style={s.sectionTitle}>Additional</Text>
            {[...data.awards, ...data.leadership, ...data.volunteer].map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
