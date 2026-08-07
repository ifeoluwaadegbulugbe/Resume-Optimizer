import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { ResumeData, ResumeTemplate } from "@/types/resume";

const TEMPLATE_ACCENT: Record<ResumeTemplate, string> = {
  classic: "#111111",
  modern: "#c2185b",
  minimal: "#374151",
  professional: "#1f2937",
  technical: "#0f172a",
};

function makeStyles(template: ResumeTemplate) {
  const accent = TEMPLATE_ACCENT[template];
  return StyleSheet.create({
    page: { paddingVertical: 34, paddingHorizontal: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
    name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2, color: accent },
    contactRow: { fontSize: 9, color: "#444444", marginBottom: 10 },
    sectionTitle: {
      fontSize: 10.5,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: accent,
      borderBottomWidth: 1,
      borderBottomColor: accent,
      paddingBottom: 2,
      marginTop: 12,
      marginBottom: 6,
    },
    summary: { fontSize: 10, lineHeight: 1.4, marginBottom: 2 },
    skillGroup: { flexDirection: "row", fontSize: 9.5, marginBottom: 2 },
    skillLabel: { fontFamily: "Helvetica-Bold", marginRight: 4 },
    entryHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    entryTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
    entrySub: { fontSize: 9.5, color: "#333333" },
    entryDates: { fontSize: 9, color: "#555555" },
    bulletRow: { flexDirection: "row", marginTop: 2, paddingLeft: 8 },
    bulletDot: { width: 8, fontSize: 9.5 },
    bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.35 },
  });
}

export function ResumePdfDocument({ data, template }: { data: ResumeData; template: ResumeTemplate }) {
  const s = makeStyles(template);
  const contactParts = [
    data.contact.location,
    data.contact.phone,
    data.contact.email,
    data.contact.linkedin,
    data.contact.portfolio,
    data.contact.github,
  ].filter(Boolean);

  return (
    <Document title={`${data.contact.fullName} Resume`}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{data.contact.fullName}</Text>
        <Text style={s.contactRow}>{contactParts.join("  |  ")}</Text>

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
                  <Text style={s.entryTitle}>
                    {e.title} — {e.company}
                  </Text>
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
                  {ed.institution} — {ed.degree}
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
                {c.name} — {c.issuer} ({c.date})
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
