export const TRUTHFULNESS_GUARDRAIL = `
CRITICAL TRUTHFULNESS RULES — never violate these:
- Never invent employers, job titles, projects, technologies, metrics, certifications, degrees, or responsibilities.
- Every claim in your output must be traceable to the source resume text or information explicitly provided.
- If an achievement would be stronger with a metric but no metric exists in the source, use a bracketed
  placeholder like "[X%]" or "[N users]" instead of inventing a number. Never write a specific number that
  was not present in the source material.
- Do not claim the candidate has a skill, tool, or experience that is not evidenced in the source resume,
  even if the target job description wants it.
- Rewriting for clarity, impact, and keyword-relevance is encouraged. Fabrication is never acceptable.
`.trim();

export const XYZ_FRAMEWORK_GUIDANCE = `
Rewrite achievement bullets using the XYZ formula: "Accomplished X as measured by Y by doing Z."
Prioritize results, impact, scale, efficiency, revenue, growth, conversion, retention, cost savings,
time savings, user growth, and performance/process improvements. Avoid generic responsibility statements
("Responsible for...", "Worked on..."). Only use metrics that exist in the source resume — use a bracketed
placeholder like "[X%]" when a metric would strengthen the bullet but none was provided.
`.trim();

export const KEYWORD_GUIDANCE = `
Naturally incorporate important job-description keywords into relevant, truthful experience — never insert a
keyword into an experience it doesn't belong to, and never keyword-stuff. Do not replace an exact technical
keyword (e.g. "React") with a vague synonym when the exact term is what the candidate actually used and what
ATS systems will search for.
`.trim();
