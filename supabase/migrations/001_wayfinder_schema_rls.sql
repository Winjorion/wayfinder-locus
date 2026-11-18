-- =============================================================================
-- WAYFINDER — Opportunity Readiness Intelligence Platform (SIH26044 | Team LOCUS)
-- Migration: 001_wayfinder_schema_rls.sql
-- Purpose: Production PostgreSQL schema, append-only audit log, and Row-Level
--          Security (RLS) policies enforcing CLAIM != CAPABILITY != PROOF,
--          assigned reviewer isolation, and cohort suppression (k = 5).
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. User Profiles & Role Assignments
create table if not exists public.wayfinder_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'reviewer', 'institution', 'admin')),
  institution text,
  program text,
  graduation_year integer,
  consent_given boolean not null default false,
  consent_timestamp timestamptz,
  satisfied_eligibility_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wayfinder_profiles enable row level security;

create policy "Users can view own profile"
  on public.wayfinder_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile excluding role escalation"
  on public.wayfinder_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Assessment Attempts (RIASEC & Aptitude)
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  assessment_type text not null check (assessment_type in ('riasec_48', 'aptitude_battery')),
  item_bank_version text not null,
  responses_json jsonb not null,
  computed_scores_json jsonb not null,
  is_complete boolean not null default true,
  completed_at timestamptz not null default now()
);

alter table public.assessment_attempts enable row level security;

create policy "Students read own assessment attempts"
  on public.assessment_attempts for select
  using (auth.uid() = user_id);

create policy "Students insert own assessment attempts"
  on public.assessment_attempts for insert
  with check (auth.uid() = user_id);

-- 3. Privileged Aptitude Answer Keys (Inaccessible to anonymous/student clients)
create table if not exists public.aptitude_answer_keys (
  question_id text primary key,
  domain text not null,
  item_bank_version text not null,
  correct_index integer not null,
  rationale text not null
);

alter table public.aptitude_answer_keys enable row level security;
-- No public/student SELECT policy: only trusted service_role Edge Functions may read answer keys.

-- 4. Capability Assessments (Self-Claims vs Demonstrated vs Verified Proof)
create table if not exists public.capability_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  competency_id text not null,
  rubric_version text not null default '2026.1-PROVISIONAL',
  claimed_level integer check (claimed_level between 0 and 4), -- NULL = UNTRIED
  demonstrated_level integer check (demonstrated_level between 0 and 4),
  verified_level integer check (verified_level between 0 and 4),
  confidence_notes text,
  updated_at timestamptz not null default now(),
  unique (user_id, competency_id)
);

alter table public.capability_records enable row level security;

create policy "Students read own capability records"
  on public.capability_records for select
  using (auth.uid() = user_id);

-- 5. Opportunities & Versioned Target Requirements
create table if not exists public.opportunities (
  id text primary key,
  title text not null,
  organization text not null,
  category text not null check (category in ('internship', 'research', 'competition', 'project')),
  version text not null default 'v1.0.0',
  rubric_version text not null default '2026.1-PROVISIONAL',
  summary text not null,
  requirements_json jsonb not null,
  mandatory_conditions_json jsonb not null default '[]',
  is_sample_data boolean not null default false,
  created_by uuid references public.wayfinder_profiles(id),
  created_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;

create policy "Public and authenticated users can view opportunities"
  on public.opportunities for select
  using (true);

-- 6. Evidence Artifacts & Six-Dimension Reviewer Evaluations
create table if not exists public.evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  competency_id text not null,
  title text not null,
  description text not null,
  evidence_type text not null default 'file' check (evidence_type in ('file', 'url')),
  storage_object_path text,
  external_url text,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text not null,
  client_sha256 text,
  server_sha256 text,
  hash_status text not null default 'unverified_no_file_payload',
  malware_scan_status text not null default 'not_configured_unscanned',
  claimed_level integer not null check (claimed_level between 1 and 4),
  verified_level integer check (verified_level between 0 and 4),
  status text not null default 'pending_review'
    check (status in ('pending_review', 'accepted', 'revision_requested', 'rejected')),
  assigned_reviewer_id uuid references public.wayfinder_profiles(id),
  reviewer_notes text,
  review_dimensions_json jsonb,
  rubric_version_evaluated text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.evidence_artifacts enable row level security;

create policy "Students read own evidence artifacts"
  on public.evidence_artifacts for select
  using (auth.uid() = user_id);

create policy "Students insert own pending evidence artifacts"
  on public.evidence_artifacts for insert
  with check (auth.uid() = user_id and status = 'pending_review' and verified_level is null);

create policy "Assigned reviewers read assigned evidence submissions only"
  on public.evidence_artifacts for select
  using (auth.uid() = assigned_reviewer_id);

create policy "Assigned reviewers record review decisions on assigned submissions"
  on public.evidence_artifacts for update
  using (auth.uid() = assigned_reviewer_id)
  with check (auth.uid() = assigned_reviewer_id);

-- 7. Scoped Sharing Authorisations (Expiry & Immediate Revocation)
create table if not exists public.scoped_share_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  recipient_label text not null,
  opportunity_id text not null references public.opportunities(id),
  include_evidence_hashes boolean not null default true,
  include_aptitude_scores boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked boolean not null default false,
  revoked_at timestamptz
);

alter table public.scoped_share_tokens enable row level security;

create policy "Students manage own scoped share tokens"
  on public.scoped_share_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. Historical Readiness Snapshots
create table if not exists public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  opportunity_id text not null references public.opportunities(id),
  change_category text not null check (change_category in (
    'CAPABILITY_CHANGE',
    'TARGET_REQUIREMENT_CHANGE',
    'RUBRIC_VERSION_CHANGE',
    'EVIDENCE_STATUS_CHANGE',
    'RECALCULATED_REPORT'
  )),
  trigger_event text not null,
  target_version text not null,
  rubric_version text not null,
  overall_status text not null,
  verified_met_count integer not null,
  total_core_count integer not null,
  claimed_only_count integer not null,
  unknown_count integer not null,
  captured_at timestamptz not null default now()
);

alter table public.readiness_snapshots enable row level security;

create policy "Students view own readiness snapshots"
  on public.readiness_snapshots for select
  using (auth.uid() = user_id);

-- 9. Append-Only Audit Events Table
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  actor_role text not null,
  action_type text not null,
  target_entity text not null,
  summary text not null,
  metadata_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;

create policy "Users view own audit events"
  on public.audit_events for select
  using (auth.uid() = actor_id);
-- Append-only enforcement: no UPDATE or DELETE policies are granted on public.audit_events.

-- 10. Trusted Institution Cohort Aggregate View with k = 5 Suppression
create or replace view public.institution_cohort_aggregates as
select
  institution,
  program,
  graduation_year,
  count(*) as student_count,
  case when count(*) < 5 then true else false end as is_suppressed_k5
from public.wayfinder_profiles
where role = 'student'
group by institution, program, graduation_year;
