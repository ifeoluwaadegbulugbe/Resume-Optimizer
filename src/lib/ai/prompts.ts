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
ATS systems will search for. If the job description repeats a specific term, named methodology, or proprietary
tool two or more times, treat it as a signature term the employer is explicitly screening for — use that exact
phrase (not a paraphrase) anywhere the candidate genuinely has a truthful basis for it.
`.trim();

export const BULLET_CRAFT_GUIDANCE = `
Every bullet: [strong past-tense action verb] + [what you did] + [quantified result or concrete scope] +
[how you measured it, if relevant]. Never start a bullet with "Responsible for," "Worked on," "Duties
included," or "Tasked with" — those describe a job posting, not an accomplishment. Cut any bullet that only
describes a responsibility with no outcome attached; a task is not an achievement.
Cap each role at 3-4 bullets for the most relevant experience, 1-3 for less relevant experience — more than
that dilutes the strongest ones. Do not start more than two bullets in a row (within the same role) with the
same opening word or the same grammatical structure; recruiters skim, and identical formulas read as
templated and get skipped rather than read.
Across the resume, at least half of all bullets should describe a concrete output — what was actually built,
shipped, designed, or delivered — rather than only the process around it (research conducted, meetings
facilitated, reports written). Process-only bullets read as a coordinator, not a practitioner.
`.trim();

export const LANGUAGE_QUALITY_GUARDRAIL = `
Never use an em dash (—) anywhere in the generated resume text. Avoid generic filler that isn't backed by
specific evidence in the same sentence: "results-driven," "hardworking," "team player," "detail-oriented,"
"go-getter," "dynamic professional," "proven track record," "passionate," "seeking an opportunity." Avoid
overused, AI-sounding verbs unless the achievement genuinely earns them and you use them sparingly:
"leverage(d)," "spearheaded," "orchestrated," "revolutionized," "seamless(ly)," "championed." Prefer clear,
varied, specific verbs — the resume should read like it was written by a highly competent human, not
generated from a template.
`.trim();

export const SUMMARY_STRUCTURE_GUIDANCE = `
The professional summary is 2-3 sentences with a specific job: (1) who the candidate is — title, degree, or
years of experience, (2) their single strongest, most relevant proof point (a real number or named
achievement from their history), (3) one line connecting that directly to what this specific role needs.
Every clause must be evidence, not adjective — if a sentence could apply to any candidate, cut it.
`.trim();

export const EXCLUSIONS_GUIDANCE = `
Never include an "Objective" statement, "References available upon request," or personal details (age,
marital status, photo) — these are outdated and reduce both ATS and recruiter quality. Only include education
GPA when it's already present in the source and strengthens the application.
`.trim();
