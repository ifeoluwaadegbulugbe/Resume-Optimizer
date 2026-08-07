-- Resume Optimizer schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) after creating your project.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- users (profile row, 1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- resumes (a user's master resume + any uploaded source resumes)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Untitled Resume',
  is_master boolean not null default false,
  source_file_name text,
  source_file_type text, -- pdf | docx | txt | pasted
  raw_text text,
  resume_data jsonb not null, -- ResumeData shape (see src/types/resume.ts)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- job_descriptions (saved JDs, can be reused across resumes)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  job_location text,
  company_website text,
  company_values text,
  raw_text text not null,
  analysis jsonb, -- JobDescriptionAnalysis shape, cached so we don't re-run AI needlessly
  analysis_hash text, -- hash of raw_text used to invalidate cache
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- resume_versions (a resume optimized for a specific job_description)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  master_resume_id uuid not null references public.resumes(id) on delete cascade,
  job_description_id uuid not null references public.job_descriptions(id) on delete cascade,
  label text not null, -- e.g. "Frontend Developer @ Stripe"
  template text not null default 'classic',
  resume_data jsonb not null, -- optimized ResumeData
  word_count integer not null default 0,
  status text not null default 'draft', -- draft | final
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- resume_analyses (pipeline run metadata + intermediate stage outputs)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  experience_relevance jsonb,
  gap_analysis jsonb,
  hallucination_flags jsonb,
  what_improved jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- keyword_matches (per resume_version keyword coverage)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.keyword_matches (
  id uuid primary key default gen_random_uuid(),
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  keyword text not null,
  priority text not null, -- critical | high | medium | low
  status text not null, -- matched | partial | missing | unsupported
  why_it_matters text,
  where_it_fits text,
  found_in text
);

-- ─────────────────────────────────────────────────────────────────────────
-- resume_scores (ATS / recruiter / overall scores per version)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.resume_scores (
  id uuid primary key default gen_random_uuid(),
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  ats_score integer not null,
  ats_breakdown jsonb not null,
  recruiter_score integer not null,
  recruiter_breakdown jsonb not null,
  overall_score integer not null,
  job_match_pct integer not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- experience_entries (denormalized, queryable view of experience per master resume)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.experience_entries (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  company text not null,
  title text not null,
  location text,
  start_date text,
  end_date text,
  bullets jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

-- ─────────────────────────────────────────────────────────────────────────
-- resume_changes (audit trail of edits/regenerations for undo + "what improved")
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.resume_changes (
  id uuid primary key default gen_random_uuid(),
  resume_version_id uuid not null references public.resume_versions(id) on delete cascade,
  change_type text not null, -- edit | regenerate | accept | reject | lock | unlock
  target_path text not null, -- e.g. "experience[0].bullets[2]"
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- applications (job application tracker)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  job_description_id uuid references public.job_descriptions(id) on delete set null,
  company text not null,
  position text not null,
  date_applied date,
  status text not null default 'saved', -- saved | applied | screening | interview | final_round | offer | rejected
  interview_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- subscriptions (plan/billing state)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — every table is private to its owning user.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.resumes enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.resume_versions enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.keyword_matches enable row level security;
alter table public.resume_scores enable row level security;
alter table public.experience_entries enable row level security;
alter table public.resume_changes enable row level security;
alter table public.applications enable row level security;
alter table public.subscriptions enable row level security;

create policy "users can view own row" on public.users for select using (auth.uid() = id);
create policy "users can update own row" on public.users for update using (auth.uid() = id);
create policy "users can insert own row" on public.users for insert with check (auth.uid() = id);

create policy "own resumes" on public.resumes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own job descriptions" on public.job_descriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own resume versions" on public.resume_versions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own resume analyses" on public.resume_analyses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own keyword matches" on public.keyword_matches for all
  using (exists (
    select 1 from public.resume_versions rv
    where rv.id = keyword_matches.resume_version_id and rv.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.resume_versions rv
    where rv.id = keyword_matches.resume_version_id and rv.user_id = auth.uid()
  ));

create policy "own resume scores" on public.resume_scores for all
  using (exists (
    select 1 from public.resume_versions rv
    where rv.id = resume_scores.resume_version_id and rv.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.resume_versions rv
    where rv.id = resume_scores.resume_version_id and rv.user_id = auth.uid()
  ));

create policy "own experience entries" on public.experience_entries for all
  using (exists (
    select 1 from public.resumes r
    where r.id = experience_entries.resume_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.resumes r
    where r.id = experience_entries.resume_id and r.user_id = auth.uid()
  ));

create policy "own resume changes" on public.resume_changes for all
  using (exists (
    select 1 from public.resume_versions rv
    where rv.id = resume_changes.resume_version_id and rv.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.resume_versions rv
    where rv.id = resume_changes.resume_version_id and rv.user_id = auth.uid()
  ));

create policy "own applications" on public.applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own subscriptions" on public.subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Auto-create a public.users row whenever a new auth user signs up.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
