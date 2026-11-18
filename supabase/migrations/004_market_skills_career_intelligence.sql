-- =============================================================================
-- WAYFINDER — Opportunity Readiness Intelligence Platform
-- Migration 004: 004_market_skills_career_intelligence.sql
--
-- Purpose:
--   1. Job Market Roles & Industry Hiring Trends (`job_market_roles`,
--      `industry_hiring_trends`).
--   2. Skill Trend Records & High-Impact Skill Combinations (`skill_trend_records`,
--      `skill_combinations`).
--   3. Student Resume Versions & LinkedIn Profile Readiness (`resume_versions`,
--      `linkedin_profiles`) keeping CLAIM <> CAPABILITY <> PROOF explicit.
--   4. Market Skill Updates & Student Saved Updates (`market_skill_updates`,
--      `user_saved_updates`).
--   5. Research Source Governance & Pipeline Runs (`research_source_configs`,
--      `research_job_runs`) restricted to ADMIN.
-- =============================================================================

-- =============================================================================
-- 1. JOB MARKET ROLES & INDUSTRY HIRING TRENDS
-- =============================================================================

create table if not exists public.job_market_roles (
  id text primary key,
  title text not null,
  field_id text references public.fields_of_study(id) on delete set null,
  role_family text not null,
  experience_band text not null check (experience_band in (
    'INTERNSHIP',
    'ENTRY_LEVEL_GRADUATE',
    'EARLY_CAREER_1_3_YRS'
  )),
  demand_signal text not null check (demand_signal in (
    'GROWING',
    'STABLE',
    'SELECTIVE',
    'EMERGING'
  )),
  required_dimensions jsonb not null default '[]'::jsonb,
  core_skill_ids text[] not null default '{}',
  differentiating_skill_ids text[] not null default '{}',
  typical_proof_artifacts text[] not null default '{}',
  source_citation text not null,
  last_researched_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.job_market_roles enable row level security;

drop policy if exists "job_market_roles_select_authenticated" on public.job_market_roles;
create policy "job_market_roles_select_authenticated"
  on public.job_market_roles for select
  to authenticated
  using (is_published = true or public.current_user_role() = 'ADMIN');

create table if not exists public.industry_hiring_trends (
  id text primary key,
  industry_sector text not null,
  field_id text references public.fields_of_study(id) on delete set null,
  reporting_period text not null,
  hiring_velocity_signal text not null check (hiring_velocity_signal in (
    'HIGH_EXPANSION',
    'MODERATE_GROWTH',
    'REPLACEMENT_SELECTIVE',
    'CONTRACTING'
  )),
  summary_findings text not null,
  verification_emphasis_note text not null,
  source_name text not null,
  source_url text,
  published_at timestamptz not null default now()
);

alter table public.industry_hiring_trends enable row level security;

drop policy if exists "industry_hiring_trends_select_authenticated" on public.industry_hiring_trends;
create policy "industry_hiring_trends_select_authenticated"
  on public.industry_hiring_trends for select
  to authenticated
  using (true);

-- =============================================================================
-- 2. SKILL TREND RECORDS & SKILL COMBINATIONS
-- =============================================================================

create table if not exists public.skill_trend_records (
  id uuid primary key default gen_random_uuid(),
  skill_id text not null references public.skills(id) on delete restrict,
  field_id text references public.fields_of_study(id) on delete set null,
  trend_classification text not null check (trend_classification in (
    'RISING_CORE',
    'EMERGING_DIFFERENTIATOR',
    'BASELINE_EXPECTED',
    'DECLINING_LEGACY'
  )),
  adoption_momentum_score numeric(5,2) not null check (adoption_momentum_score between 0 and 100),
  employer_proof_expectation text not null,
  observation_window text not null,
  source_citation text not null,
  updated_at timestamptz not null default now()
);

alter table public.skill_trend_records enable row level security;

drop policy if exists "skill_trend_records_select_authenticated" on public.skill_trend_records;
create policy "skill_trend_records_select_authenticated"
  on public.skill_trend_records for select
  to authenticated
  using (true);

create table if not exists public.skill_combinations (
  id text primary key,
  name text not null,
  field_id text references public.fields_of_study(id) on delete set null,
  component_skill_ids text[] not null,
  synergy_rationale text not null,
  target_role_ids text[] not null default '{}',
  recommended_capstone_proof text not null,
  created_at timestamptz not null default now()
);

alter table public.skill_combinations enable row level security;

drop policy if exists "skill_combinations_select_authenticated" on public.skill_combinations;
create policy "skill_combinations_select_authenticated"
  on public.skill_combinations for select
  to authenticated
  using (true);

-- =============================================================================
-- 3. STUDENT RESUME VERSIONS & LINKEDIN PROFILES
-- =============================================================================

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  version_label text not null,
  target_role_id text references public.job_market_roles(id) on delete set null,
  target_opportunity_id text references public.opportunities(id) on delete set null,
  structured_sections jsonb not null default '{}'::jsonb,
  claimed_skill_ids text[] not null default '{}',
  verified_backing_evidence_ids uuid[] not null default '{}',
  unverified_claim_count integer not null default 0 check (unverified_claim_count >= 0),
  verified_claim_count integer not null default 0 check (verified_claim_count >= 0),
  audit_feedback_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resume_versions_student
  on public.resume_versions(student_id, created_at desc);

alter table public.resume_versions enable row level security;

drop policy if exists "resume_versions_student_all" on public.resume_versions;
create policy "resume_versions_student_all"
  on public.resume_versions for all
  to authenticated
  using (student_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (student_id = auth.uid());

create table if not exists public.linkedin_profiles (
  student_id uuid primary key references public.wayfinder_profiles(id) on delete cascade,
  profile_url text,
  headline_draft text not null default '',
  about_summary_draft text not null default '',
  featured_evidence_ids uuid[] not null default '{}',
  highlighted_skill_ids text[] not null default '{}',
  proof_alignment_notes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.linkedin_profiles enable row level security;

drop policy if exists "linkedin_profiles_student_all" on public.linkedin_profiles;
create policy "linkedin_profiles_student_all"
  on public.linkedin_profiles for all
  to authenticated
  using (student_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (student_id = auth.uid());

-- =============================================================================
-- 4. MARKET SKILL UPDATES & STUDENT SAVED UPDATES
-- =============================================================================

create table if not exists public.market_skill_updates (
  id text primary key,
  title text not null,
  field_id text references public.fields_of_study(id) on delete set null,
  update_category text not null check (update_category in (
    'BENCHMARK_SHIFT',
    'NEW_TOOLING_STANDARD',
    'EMPLOYER_PROOF_EXPECTATION',
    'REGULATORY_OR_DOMAIN_CHANGE'
  )),
  summary text not null,
  affected_skill_ids text[] not null default '{}',
  affected_dimension_ids text[] not null default '{}',
  recommended_student_action text not null,
  source_citation text not null,
  published_at timestamptz not null default now(),
  is_active boolean not null default true
);

alter table public.market_skill_updates enable row level security;

drop policy if exists "market_skill_updates_select_authenticated" on public.market_skill_updates;
create policy "market_skill_updates_select_authenticated"
  on public.market_skill_updates for select
  to authenticated
  using (is_active = true or public.current_user_role() = 'ADMIN');

create table if not exists public.user_saved_updates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  update_id text not null references public.market_skill_updates(id) on delete cascade,
  action_note text not null default '',
  saved_at timestamptz not null default now(),
  unique (student_id, update_id)
);

alter table public.user_saved_updates enable row level security;

drop policy if exists "user_saved_updates_student_all" on public.user_saved_updates;
create policy "user_saved_updates_student_all"
  on public.user_saved_updates for all
  to authenticated
  using (student_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (student_id = auth.uid());

-- =============================================================================
-- 5. RESEARCH SOURCE CONFIGS & RESEARCH JOB RUNS (ADMIN ONLY)
-- =============================================================================

create table if not exists public.research_source_configs (
  id text primary key,
  source_name text not null,
  source_type text not null check (source_type in (
    'LABOUR_MARKET_INDEX',
    'ACADEMIC_CURRICULUM_STANDARD',
    'EMPLOYER_COMPETENCY_FRAMEWORK',
    'INDUSTRY_SURVEY'
  )),
  base_url text,
  refresh_cadence_days integer not null default 30 check (refresh_cadence_days > 0),
  reliability_tier text not null check (reliability_tier in ('PRIMARY_AUTHORITATIVE', 'SECONDARY_VETTED')),
  is_enabled boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.research_source_configs enable row level security;

drop policy if exists "research_source_configs_admin_all" on public.research_source_configs;
create policy "research_source_configs_admin_all"
  on public.research_source_configs for all
  to authenticated
  using (public.current_user_role() = 'ADMIN')
  with check (public.current_user_role() = 'ADMIN');

create table if not exists public.research_job_runs (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.research_source_configs(id) on delete cascade,
  triggered_by uuid references public.wayfinder_profiles(id) on delete set null,
  status text not null check (status in ('RUNNING', 'COMPLETED', 'FAILED')),
  records_processed integer not null default 0 check (records_processed >= 0),
  summary_log text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.research_job_runs enable row level security;

drop policy if exists "research_job_runs_admin_all" on public.research_job_runs;
create policy "research_job_runs_admin_all"
  on public.research_job_runs for all
  to authenticated
  using (public.current_user_role() = 'ADMIN')
  with check (public.current_user_role() = 'ADMIN');
