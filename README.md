# Forma — AI Job-Specific ATS Resume Optimizer

Upload a resume, paste a job description, and get an ATS-optimized, recruiter-scored, achievement-focused
resume tailored to that specific role — with an editor, keyword coverage report, recruiter simulation, and
PDF/DOCX export.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) + **Tailwind v4** + **shadcn/ui**
- **Gemini API** (`gemini-flash-latest` alias — see note below) for the AI pipeline, via structured JSON outputs
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

**Free-tier quota:** Google's free tier caps each model at a small number of requests/day (we've seen the
limit hit at 20/day). A single optimization run can use ~6–14 Gemini calls (more when the score-gate loop
below does multiple refinement passes), so a couple of runs can exhaust the daily quota. If you're testing
heavily, either watch usage at https://ai.dev/rate-limit or move to a paid tier.
`GEMINI_MODEL` in `src/lib/ai/gemini.ts` uses the `-latest` alias specifically so it keeps working as Google
retires dated model versions (this already happened once to `gemini-2.5-flash` during development) — if
generation ever starts failing with a model-not-found error, that alias is the first thing to check.

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

`src/lib/ai/pipeline.ts` runs a multi-stage pipeline (each stage shown live in the analysis screen), calling
Gemini with a strict JSON schema at each step so output is always structured and validated — never a single
freeform prompt:

1. Parse resume → structured `ResumeData`
2. Analyze job description → requirements, keyword map (critical/high/medium/low), culture signals
3. Requirement classification (part of stage 2's output)
4. Score experience relevance + identify requirement gaps
5. **Score-gate optimization loop** (up to 3 passes): optimize → ATS score → recruiter score → validate.
   If both ATS and recruiter aren't yet ≥90, the next pass is fed the specific weakest-scoring areas and
   still-missing critical keywords and asked to revise (not restart) the draft. The loop stops early once
   both hit 90, or once a pass stops meaningfully improving the combined score (plateau detection).
6. Validation — local structural checks + an AI hallucination check comparing optimized vs. original.

Every prompt includes an explicit truthfulness guardrail: no invented employers, titles, metrics,
technologies, or certifications. Missing metrics become bracketed placeholders (`[X%]`), never fabricated
numbers. **This holds even when 90+ isn't reachable truthfully** — instead of fabricating experience to hit
the target, the UI shows a "Maximum Truthful Match" banner (`ScoreGateBanner`) that names exactly which
requirements are capping the score and why, per `scoreGate.limitingFactors`.

Two more AI-backed actions, callable any time after the initial generation:

- **Chat** (`/api/optimize/chat`, `chatRefineResume`) — conversational resume edits grounded in the same
  truthfulness rules; if you ask for something unverified it explains why it won't add it rather than adding
  it. Chat edits don't auto-rescore (to save API calls) — the editor shows the last-known scores until you
  click **Rescore**.
- **Rescore** (`/api/optimize/rescore`) — re-runs just the ATS + recruiter scoring (not the full multi-pass
  loop) against whatever the resume currently looks like, so edits made in the chat or the manual editor get
  fresh numbers cheaply.

## Word count and page length

The optimizer targets 450–600 words (525–550 preferred) — enforced via `validateResumeLocally` and shown live
in the editor. PDF export (`/api/export/pdf`) additionally renders at progressively smaller font/spacing
densities (`DENSITY_TIERS` in `src/lib/export/pdfDocument.tsx`) until the result fits one page, verified by
parsing the rendered PDF's actual page count — not just estimated from word count. If content is so long that
even the smallest safe density still overflows, the export still succeeds but the UI shows a warning toast
telling you to trim content, rather than silently shipping a multi-page file.

## Project layout

```
src/lib/ai/            Gemini client, schemas, prompts, and the score-gate pipeline
src/lib/parsing/        PDF/DOCX/TXT text extraction
src/lib/validation/     Local (non-AI) structural resume validation
src/lib/export/         PDF (react-pdf, 1-page shrink logic), DOCX (docx), and plain-text export
src/lib/data/           Zustand + localStorage data layer (guest mode)
src/lib/supabase/       Browser/server Supabase clients + auth middleware
supabase/migrations/    SQL schema + RLS policies
src/app/api/            parse-resume, analyze (streaming NDJSON), optimize/chat, optimize/rescore,
                        optimize/regenerate-bullet, export/pdf, export/docx
src/app/(dashboard)/    dashboard, resumes, resumes/[versionId] (editor+scores+chat), applications, settings
src/app/(auth)/         login, signup
src/components/         upload, jd, analysis, scoring, editor (incl. resume-chat), layout, auth
```

## Notes

- The primary brand color is pink, themed via CSS variables in `src/app/globals.css` (light + dark mode).
- `src/lib/data/store.ts` is the single source of truth for resumes/job descriptions/versions/applications —
  swap its localStorage backing for Supabase queries there when you're ready to wire real sync.
