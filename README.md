# Forma — AI Job-Specific ATS Resume Optimizer

Upload a resume, paste a job description, and get an ATS-optimized, recruiter-scored, achievement-focused
resume tailored to that specific role — with an editor, keyword coverage report, recruiter simulation, and
PDF/DOCX export.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) + **Tailwind v4** + **shadcn/ui**
- **Gemini API** (`gemini-2.5-flash`) for the AI pipeline, via structured JSON outputs
- **Supabase** (Postgres + Auth) — schema and RLS policies are ready in `supabase/migrations/`
- `pdf-parse` / `mammoth` for resume file parsing, `@react-pdf/renderer` / `docx` for export

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in the keys below
npm run dev
```

Open http://localhost:3000. The app is fully clickable without any keys — it runs in **guest mode**
(data stored in `localStorage`) and will show a clear banner instead of crashing wherever a key is missing.

### 1. Gemini API key (required for the AI pipeline)

Get a free key (no credit card) at **https://aistudio.google.com/apikey**, then set:

```
GEMINI_API_KEY=your-key-here
```

Without this, resume parsing and the analyze/optimize pipeline will return a friendly "not configured" error
instead of running.

### 2. Supabase (optional — enables real accounts + cross-device sync)

1. Create a free project at **https://supabase.com**.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` — it creates all tables (`users`, `resumes`,
   `job_descriptions`, `resume_versions`, `resume_analyses`, `keyword_matches`, `resume_scores`,
   `experience_entries`, `resume_changes`, `applications`, `subscriptions`) with row-level security so each
   user only ever sees their own data.
3. Copy Project Settings → API into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. To enable "Continue with Google", turn on the Google provider under Supabase Auth → Providers, and add
   `http://localhost:3000/auth/callback` (and your production URL) as a redirect URL.

**Current state of Supabase wiring:** auth (email/password + Google OAuth) is fully wired — sign in/up works
once the env vars above are set. Application *data* (resumes, versions, applications) currently persists to
`localStorage` in both guest mode and when signed in; the schema, RLS, and Supabase client are all in place
to swap the data layer in `src/lib/data/store.ts` for real Postgres reads/writes without touching any UI code.

## How the AI pipeline works

`src/lib/ai/pipeline.ts` runs 8 stages (each shown live in the analysis screen), calling Gemini with a strict
JSON schema at each step so output is always structured and validated — never a single freeform prompt:

1. Parse resume → structured `ResumeData`
2. Analyze job description → requirements, keyword map (critical/high/medium/low), culture signals
3. Requirement classification (part of stage 2's output)
4. Score experience relevance + identify requirement gaps
5. Optimize resume — XYZ-framework bullets, culture-fit evidence, word count target 525–550
6. ATS scorer — keyword/requirement/skills/structure/semantic scoring + keyword coverage buckets
7. Recruiter scorer — first-impression simulation, shortlist decision, before/after bullet comparisons
8. Validation — local structural checks + an AI hallucination check comparing optimized vs. original; a
   failed validation automatically re-runs the optimizer once before accepting the result

Every prompt includes an explicit truthfulness guardrail: no invented employers, titles, metrics,
technologies, or certifications. Missing metrics become bracketed placeholders (`[X%]`), never fabricated
numbers.

## Project layout

```
src/lib/ai/            Gemini client, schemas, prompts, and the 8-stage pipeline
src/lib/parsing/        PDF/DOCX/TXT text extraction
src/lib/validation/     Local (non-AI) structural resume validation
src/lib/export/         PDF (react-pdf), DOCX (docx), and plain-text export
src/lib/data/           Zustand + localStorage data layer (guest mode)
src/lib/supabase/       Browser/server Supabase clients + auth middleware
supabase/migrations/    SQL schema + RLS policies
src/app/api/            parse-resume, analyze (streaming NDJSON), regenerate-bullet, export/pdf, export/docx
src/app/(dashboard)/    dashboard, resumes, resumes/[versionId] (editor+scores), applications, settings
src/app/(auth)/         login, signup
src/components/         upload, jd, analysis, scoring, editor, layout, auth
```

## Notes

- The primary brand color is pink, themed via CSS variables in `src/app/globals.css` (light + dark mode).
- `src/lib/data/store.ts` is the single source of truth for resumes/job descriptions/versions/applications —
  swap its localStorage backing for Supabase queries there when you're ready to wire real sync.
