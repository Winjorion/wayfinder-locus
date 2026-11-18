-- =============================================================================
-- WAYFINDER — Opportunity Readiness Intelligence Platform
-- Migration 002: 002_field_skill_assessment_learning_hub.sql
--
-- Purpose:
--   1. Fields of Study & Specialisations (`fields_of_study`, `field_specialisations`)
--      plus idempotent 2-step `opportunities_field_id_fkey` foreign-key addition.
--   2. Canonical Skill Catalogue (`skills` with ON DELETE RESTRICT, `field_skill_map`,
--      `skill_relationships`, `user_field_selections`).
--   3. Skill Assessments (`assessments`, `assessment_versions`,
--      `skill_assessment_items` without answer keys, locked
--      `skill_assessment_answer_keys`, `skill_assessment_attempts`).
--   4. User Skill Profiles (`user_skill_profiles` with self_reported_level,
--      assessment_level, verified_level, and generated demonstrated_level
--      enforcing CLAIM <> CAPABILITY <> PROOF and Unknown = NULL <> 0).
--   5. Evidence-Skill Links (`evidence_skill_links` locked on non-editable
--      evidence states) & Atomic Append-Only Per-Skill Review Decisions
--      (`review_skill_decisions` with superseding replacement DEF-22/24/25)
--      & Deterministic Verified Skill Recalculation (`recalculate_student_verified_skills()`).
--   6. Learning Resources, Resource-Skill Map, Learning Paths & User Learning Progress
--      (`learning_resources`, `resource_skill_map`, `learning_paths`,
--      `learning_path_items`, `user_learning_progress`, `requirement_skill_mappings`,
--      `content_review_history`).
-- =============================================================================

-- =============================================================================
-- 1. FIELDS OF STUDY, SPECIALISATIONS & TWO-STEP OPPORTUNITIES FK
-- =============================================================================

create table if not exists public.fields_of_study (
  id text primary key,
  name text not null,
  short_name text not null default '',
  description text not null,
  specialisations text[] not null default '{}',
  catalogue_coverage_note text not null default '',
  version text not null default '2026.2',
  is_active boolean not null default true,
  publication_status text not null default 'PUBLISHED'
    check (publication_status in ('DRAFT_REVIEW', 'PUBLISHED', 'RETIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fields_of_study enable row level security;

drop policy if exists "fields_of_study_select_authenticated" on public.fields_of_study;
create policy "fields_of_study_select_authenticated"
  on public.fields_of_study for select
  to authenticated
  using (publication_status = 'PUBLISHED' or public.current_user_role() = 'ADMIN');

create table if not exists public.field_specialisations (
  id text primary key,
  field_id text not null references public.fields_of_study(id) on delete cascade,
  name text not null,
  description text not null default '',
  publication_status text not null default 'PUBLISHED'
    check (publication_status in ('DRAFT_REVIEW', 'PUBLISHED', 'RETIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.field_specialisations enable row level security;

drop policy if exists "field_specialisations_select_authenticated" on public.field_specialisations;
create policy "field_specialisations_select_authenticated"
  on public.field_specialisations for select
  to authenticated
  using (publication_status = 'PUBLISHED' or public.current_user_role() = 'ADMIN');

-- Seed initial canonical fields of study BEFORE validating opportunities.field_id FK
insert into public.fields_of_study (id, name, short_name, description, specialisations, publication_status)
values
  ('FLD_CS_SWE', 'Computer Science & Software Engineering', 'CS & Software', 'Software systems architecture, distributed computing, backend engineering, and formal verification.', array['Backend & Distributed Systems', 'Full-Stack Product Engineering', 'Security & Systems Programming'], 'PUBLISHED'),
  ('FLD_DS_AI', 'Data Science, Analytics & Artificial Intelligence', 'Data & AI', 'Statistical inference, machine learning systems, quantitative analytics, and applied data engineering.', array['Applied Machine Learning', 'Decision & Product Analytics', 'Data Engineering & Pipelines'], 'PUBLISHED'),
  ('FLD_CYBER_SEC', 'Cybersecurity, Network & Information Assurance', 'Cybersecurity', 'Application security, threat modeling, network defense, and cryptographic governance.', array['Application & Cloud Security', 'Security Operations & Incident Response', 'Governance, Risk & Compliance'], 'PUBLISHED'),
  ('FLD_FIN_ECON', 'Quantitative Finance, Economics & Risk Analysis', 'Finance & Econ', 'Financial modeling, econometric analysis, algorithmic risk evaluation, and capital markets.', array['Quantitative Risk & Modeling', 'Corporate Finance & Valuation', 'Economic Policy & Econometrics'], 'PUBLISHED'),
  ('FLD_PROD_UX', 'Product Management, Systems Design & Human-Computer Interaction', 'Product & HCI', 'Technical product discovery, interaction architecture, user research synthesis, and execution leadership.', array['Technical Product Management', 'Interaction & Systems Design', 'User Research & Experimental Design'], 'PUBLISHED'),
  ('FLD_MECH_ELEC_ENG', 'Electrical, Mechanical & Embedded Systems Engineering', 'Core Engineering', 'Control systems, embedded firmware, signal processing, and hardware-software integration.', array['Embedded Systems & Robotics', 'Power & Control Systems', 'Industrial Systems & Instrumentation'], 'PUBLISHED'),
  ('FLD_BIO_HEALTH', 'Biomedical Informatics, Computational Biology & Health Systems', 'Bio & Health Tech', 'Clinical data science, genomics pipelines, biostatistics, and regulated medical software.', array['Biostatistics & Clinical Analytics', 'Bioinformatics & Computational Biology', 'Digital Health Systems'], 'PUBLISHED')
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  specialisations = excluded.specialisations,
  updated_at = now();

-- Clean any orphaned field_id references in opportunities before adding the FK
update public.opportunities o
set field_id = null
where o.field_id is not null
  and not exists (
    select 1 from public.fields_of_study f where f.id = o.field_id
  );

-- Two-Step Idempotent Foreign Key Addition from opportunities.field_id -> fields_of_study(id)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'opportunities_field_id_fkey'
      and t.relname = 'opportunities'
      and n.nspname = 'public'
  ) then
    alter table public.opportunities
      add constraint opportunities_field_id_fkey
      foreign key (field_id)
      references public.fields_of_study(id)
      on delete set null;
  end if;
end;
$$;

-- =============================================================================
-- 2. SKILLS CATALOGUE, FIELD-SKILL MAP & USER FIELD SELECTIONS
-- =============================================================================

create table if not exists public.skills (
  id text primary key,
  name text not null,
  category text not null check (category in (
    'FOUNDATIONAL',
    'TECHNICAL',
    'ANALYTICAL',
    'COMMUNICATION',
    'DOMAIN_SPECIALISED',
    'EXECUTION'
  )),
  field_id text references public.fields_of_study(id) on delete restrict,
  specialisation text not null default 'General',
  mapped_dimension_id text not null check (mapped_dimension_id in (
    'QUANTITATIVE_REASONING',
    'LOGICAL_PROBLEM_SOLVING',
    'VERBAL_ANALYTICAL_COMMUNICATION',
    'TECHNICAL_TOOL_PROFICIENCY',
    'DOMAIN_FOUNDATIONS',
    'RESEARCH_INQUIRY',
    'PROJECT_EXECUTION',
    'COLLABORATION_PROFESSIONALISM',
    'ADAPTABILITY_LEARNING_AGILITY',
    'CAREER_NAVIGATION_SELF_DIRECTION'
  )),
  description text not null,
  relevant_proficiency_levels integer[] not null default '{1,2,3,4}',
  assessment_available boolean not null default true,
  assessment_method text not null default 'OBJECTIVE_AND_EVIDENCE',
  assessment_method_explanation text not null default 'Evaluated through objective item bank and verified artifact review.',
  evidence_requirements text not null default 'Repository, technical specification, analytical report, or verified project artifact.',
  related_opportunity_notes text not null default '',
  version text not null default '1.0',
  is_active boolean not null default true,
  publication_status text not null default 'PUBLISHED'
    check (publication_status in ('DRAFT_REVIEW', 'PUBLISHED', 'RETIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.skills enable row level security;

drop policy if exists "skills_select_authenticated" on public.skills;
create policy "skills_select_authenticated"
  on public.skills for select
  to authenticated
  using (publication_status = 'PUBLISHED' or public.current_user_role() = 'ADMIN');

create table if not exists public.field_skill_map (
  id uuid primary key default gen_random_uuid(),
  field_id text not null references public.fields_of_study(id) on delete cascade,
  specialisation_id text references public.field_specialisations(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  target_level integer not null check (target_level between 1 and 4),
  importance_weight numeric(4,2) not null default 1.00 check (importance_weight > 0 and importance_weight <= 3.00),
  is_core boolean not null default true,
  unique (field_id, specialisation_id, skill_id)
);

alter table public.field_skill_map enable row level security;

drop policy if exists "field_skill_map_select_authenticated" on public.field_skill_map;
create policy "field_skill_map_select_authenticated"
  on public.field_skill_map for select
  to authenticated
  using (true);

create table if not exists public.skill_relationships (
  id uuid primary key default gen_random_uuid(),
  skill_id text not null references public.skills(id) on delete restrict,
  related_skill_id text not null references public.skills(id) on delete restrict,
  relationship_type text not null check (relationship_type in ('PREREQUISITE', 'COMPLEMENTARY', 'SPECIALISATION_OF')),
  created_at timestamptz not null default now(),
  unique (skill_id, related_skill_id, relationship_type)
);

alter table public.skill_relationships enable row level security;

drop policy if exists "skill_relationships_select_authenticated" on public.skill_relationships;
create policy "skill_relationships_select_authenticated"
  on public.skill_relationships for select
  to authenticated
  using (true);

create table if not exists public.user_field_selections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  field_id text not null references public.fields_of_study(id) on delete cascade,
  specialisation_id text references public.field_specialisations(id) on delete set null,
  is_primary boolean not null default true,
  selected_at timestamptz not null default now(),
  unique (student_id, field_id)
);

alter table public.user_field_selections enable row level security;

drop policy if exists "user_field_selections_student_select" on public.user_field_selections;
create policy "user_field_selections_student_select"
  on public.user_field_selections for select
  to authenticated
  using (student_id = auth.uid() or public.current_user_role() = 'ADMIN');

drop policy if exists "user_field_selections_student_insert" on public.user_field_selections;
create policy "user_field_selections_student_insert"
  on public.user_field_selections for insert
  to authenticated
  with check (student_id = auth.uid() and public.current_user_role() = 'STUDENT');

drop policy if exists "user_field_selections_student_update" on public.user_field_selections;
create policy "user_field_selections_student_update"
  on public.user_field_selections for update
  to authenticated
  using (student_id = auth.uid() and public.current_user_role() = 'STUDENT')
  with check (student_id = auth.uid() and public.current_user_role() = 'STUDENT');

drop policy if exists "user_field_selections_student_delete" on public.user_field_selections;
create policy "user_field_selections_student_delete"
  on public.user_field_selections for delete
  to authenticated
  using (student_id = auth.uid() and public.current_user_role() = 'STUDENT');

-- =============================================================================
-- 3. SKILL ASSESSMENTS, PUBLIC ITEMS, LOCKED ANSWER KEYS & ATTEMPTS
-- =============================================================================

create table if not exists public.assessments (
  id text primary key,
  skill_id text not null references public.skills(id) on delete restrict,
  field_id text not null references public.fields_of_study(id) on delete restrict,
  mapped_dimension_id text not null check (mapped_dimension_id in (
    'QUANTITATIVE_REASONING',
    'LOGICAL_PROBLEM_SOLVING',
    'VERBAL_ANALYTICAL_COMMUNICATION',
    'TECHNICAL_TOOL_PROFICIENCY',
    'DOMAIN_FOUNDATIONS',
    'RESEARCH_INQUIRY',
    'PROJECT_EXECUTION',
    'COLLABORATION_PROFESSIONALISM',
    'ADAPTABILITY_LEARNING_AGILITY',
    'CAREER_NAVIGATION_SELF_DIRECTION'
  )),
  title text not null,
  measurement_objective text not null,
  instructions text not null,
  assessment_type text not null default 'STRUCTURED_SKILL_BENCHMARK',
  support_state text not null default 'ACTIVE_SERVER_SCORED',
  target_proficiency_level integer not null check (target_proficiency_level between 1 and 4),
  estimated_duration_minutes integer not null default 15,
  scoring_rules_summary text not null default 'Deterministic server-side item evaluation mapped to rubric levels 0-4.',
  limitations_notice text not null default 'Objective assessment measures structured problem-solving; production proficiency requires verified artifact evidence.',
  requires_human_review boolean not null default false,
  current_version text not null default '1.0.0',
  publication_status text not null default 'PUBLISHED'
    check (publication_status in ('DRAFT_REVIEW', 'PUBLISHED', 'RETIRED')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.assessments enable row level security;

drop policy if exists "assessments_select_authenticated" on public.assessments;
create policy "assessments_select_authenticated"
  on public.assessments for select
  to authenticated
  using (publication_status = 'PUBLISHED' or public.current_user_role() = 'ADMIN');

create table if not exists public.assessment_versions (
  id uuid primary key default gen_random_uuid(),
  assessment_id text not null references public.assessments(id) on delete cascade,
  version text not null,
  change_summary text not null,
  published_by uuid references public.wayfinder_profiles(id) on delete set null,
  published_at timestamptz not null default now(),
  unique (assessment_id, version)
);

alter table public.assessment_versions enable row level security;

drop policy if exists "assessment_versions_select_authenticated" on public.assessment_versions;
create policy "assessment_versions_select_authenticated"
  on public.assessment_versions for select
  to authenticated
  using (true);

-- Public prompt metadata only — NO answer keys or scoring solutions stored here
create table if not exists public.skill_assessment_items (
  id text primary key,
  assessment_id text references public.assessments(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  assessment_version text not null default '1.0.0',
  question_type text not null default 'MULTIPLE_CHOICE' check (question_type in (
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'NUMERICAL_PROBLEM',
    'SCENARIO_ANALYSIS'
  )),
  difficulty_tier integer not null check (difficulty_tier between 1 and 4),
  subtopic text not null default 'Core Concepts',
  prompt_text text not null,
  scenario_context text,
  options_json jsonb not null default '[]'::jsonb,
  numerical_unit_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.skill_assessment_items enable row level security;

drop policy if exists "skill_assessment_items_select_authenticated" on public.skill_assessment_items;
create policy "skill_assessment_items_select_authenticated"
  on public.skill_assessment_items for select
  to authenticated
  using (is_active = true);

-- Server-only answer keys for skill assessments — ZERO client SELECT policies
create table if not exists public.skill_assessment_answer_keys (
  item_id text primary key references public.skill_assessment_items(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  correct_option_id text,
  correct_option_ids text[],
  numeric_min numeric,
  numeric_max numeric,
  weight numeric(4,2) not null default 1.00 check (weight > 0),
  rationale text not null default '',
  remediation_subtopic text not null default 'Core Fundamentals',
  updated_at timestamptz not null default now()
);

alter table public.skill_assessment_answer_keys enable row level security;
revoke all on table public.skill_assessment_answer_keys from anon, authenticated;

-- Append-only server-scored skill assessment attempts
create table if not exists public.skill_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  assessment_id text references public.assessments(id) on delete set null,
  assessment_version text not null default '1.0.0',
  submitted_answers jsonb not null default '{}'::jsonb,
  total_items integer not null default 0 check (total_items >= 0),
  correct_items integer not null default 0 check (correct_items >= 0),
  raw_score numeric(5,2) not null check (raw_score >= 0 and raw_score <= 100),
  derived_level integer not null check (derived_level between 0 and 4),
  confidence_band text not null check (confidence_band in ('LOW', 'MODERATE', 'HIGH')),
  demonstrated_strengths text[] not null default '{}',
  areas_needing_development text[] not null default '{}',
  item_feedback_json jsonb not null default '[]'::jsonb,
  recommended_resource_ids text[] not null default '{}',
  scored_by_server boolean not null default true check (scored_by_server = true),
  completed_at timestamptz not null default now()
);

create index if not exists idx_skill_attempts_student_skill
  on public.skill_assessment_attempts(student_id, skill_id, completed_at desc);

drop trigger if exists trg_guard_skill_assessment_attempts_immutable on public.skill_assessment_attempts;
create trigger trg_guard_skill_assessment_attempts_immutable
  before update or delete on public.skill_assessment_attempts
  for each row execute function public.guard_append_only_table();

alter table public.skill_assessment_attempts enable row level security;
revoke insert, update, delete on table public.skill_assessment_attempts from anon, authenticated;

drop policy if exists "skill_assessment_attempts_select_own_or_staff" on public.skill_assessment_attempts;
create policy "skill_assessment_attempts_select_own_or_staff"
  on public.skill_assessment_attempts for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.current_user_role() in ('REVIEWER', 'ADMIN')
  );

-- =============================================================================
-- 4. USER SKILL PROFILES (CLAIM <> CAPABILITY <> PROOF; UNKNOWN = NULL <> 0)
-- =============================================================================

create table if not exists public.user_skill_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  self_reported_level integer check (self_reported_level between 0 and 4),
  self_reported_rationale text,
  assessment_level integer check (assessment_level between 0 and 4),
  verified_level integer check (verified_level between 0 and 4),
  demonstrated_level integer generated always as (
    case
      when assessment_level is null and verified_level is null then null
      else greatest(coalesce(assessment_level, 0), coalesce(verified_level, 0))
    end
  ) stored,
  verification_state text not null default 'UNVERIFIED' check (verification_state in (
    'UNVERIFIED',
    'SELF_REPORTED_ONLY',
    'OBJECTIVELY_ASSESSED',
    'EVIDENCE_SUBMITTED',
    'EVIDENCE_VERIFIED',
    'FULLY_CORROBORATED'
  )),
  latest_attempt_id uuid references public.skill_assessment_attempts(id) on delete set null,
  latest_review_id uuid references public.review_records(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (student_id, skill_id)
);

create index if not exists idx_user_skill_profiles_student
  on public.user_skill_profiles(student_id);

create or replace function public.trg_fn_guard_user_skill_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_trusted_execution_role() then
    if tg_op = 'INSERT' then
      if new.student_id is distinct from auth.uid() then
        raise exception 'WAYFINDER_SECURITY_VIOLATION: Cannot create skill profile for another student.';
      end if;
      if new.assessment_level is not null
         or new.verified_level is not null
         or new.latest_attempt_id is not null
         or new.latest_review_id is not null
         or new.verification_state not in ('UNVERIFIED', 'SELF_REPORTED_ONLY') then
        raise exception 'WAYFINDER_SECURITY_VIOLATION: Objective and verified skill columns are server-managed.';
      end if;
      new.verification_state := case
        when new.self_reported_level is not null then 'SELF_REPORTED_ONLY'
        else 'UNVERIFIED'
      end;
    elsif tg_op = 'UPDATE' then
      if new.student_id is distinct from old.student_id
         or new.skill_id is distinct from old.skill_id
         or new.assessment_level is distinct from old.assessment_level
         or new.verified_level is distinct from old.verified_level
         or new.latest_attempt_id is distinct from old.latest_attempt_id
         or new.latest_review_id is distinct from old.latest_review_id then
        raise exception 'WAYFINDER_SECURITY_VIOLATION: Objective and verified skill columns cannot be modified by clients.';
      end if;
      if old.verification_state in ('UNVERIFIED', 'SELF_REPORTED_ONLY') then
        new.verification_state := case
          when new.self_reported_level is not null then 'SELF_REPORTED_ONLY'
          else 'UNVERIFIED'
        end;
      else
        new.verification_state := old.verification_state;
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_user_skill_profile_columns on public.user_skill_profiles;
create trigger trg_guard_user_skill_profile_columns
  before insert or update on public.user_skill_profiles
  for each row execute function public.trg_fn_guard_user_skill_profile_columns();

alter table public.user_skill_profiles enable row level security;

drop policy if exists "user_skill_profiles_select" on public.user_skill_profiles;
create policy "user_skill_profiles_select"
  on public.user_skill_profiles for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.current_user_role() in ('REVIEWER', 'ADMIN')
  );

drop policy if exists "user_skill_profiles_student_insert" on public.user_skill_profiles;
create policy "user_skill_profiles_student_insert"
  on public.user_skill_profiles for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

drop policy if exists "user_skill_profiles_student_update" on public.user_skill_profiles;
create policy "user_skill_profiles_student_update"
  on public.user_skill_profiles for update
  to authenticated
  using (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  )
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

-- =============================================================================
-- 5. EVIDENCE-SKILL LINKS, PER-SKILL REVIEW DECISIONS & RECALCULATION
-- =============================================================================

create table if not exists public.evidence_skill_links (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence_submissions(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  claimed_skill_level integer not null check (claimed_skill_level between 1 and 4),
  created_at timestamptz not null default now(),
  unique (evidence_id, skill_id)
);

create index if not exists idx_evidence_skill_links_evidence
  on public.evidence_skill_links(evidence_id);

create index if not exists idx_evidence_skill_links_skill
  on public.evidence_skill_links(skill_id);

-- Guard trigger: prevent adding/modifying/deleting skill claims once evidence is under review or decided
create or replace function public.trg_fn_guard_evidence_skill_link_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_evidence_id uuid;
  v_status text;
  v_student_id uuid;
begin
  v_evidence_id := coalesce(new.evidence_id, old.evidence_id);

  select es.status, es.student_id
    into v_status, v_student_id
    from public.evidence_submissions es
   where es.id = v_evidence_id;

  if not found then
    raise exception 'WAYFINDER_NOT_FOUND: Parent evidence submission % not found.', v_evidence_id;
  end if;

  if not public.is_trusted_execution_role() then
    if v_student_id is distinct from auth.uid() then
      raise exception 'WAYFINDER_SECURITY_VIOLATION: Only the owning student may modify evidence skill links.';
    end if;

    if v_status not in ('SUBMITTED', 'UPLOAD_PENDING', 'REVISION_REQUIRED', 'TECHNICAL_VALIDATION_FAILED') then
      raise exception 'WAYFINDER_STATE_LOCKED: Cannot modify evidence skill links when submission status is %.', v_status;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_evidence_skill_link_mutation on public.evidence_skill_links;
create trigger trg_guard_evidence_skill_link_mutation
  before insert or update or delete on public.evidence_skill_links
  for each row execute function public.trg_fn_guard_evidence_skill_link_mutation();

alter table public.evidence_skill_links enable row level security;

drop policy if exists "evidence_skill_links_select" on public.evidence_skill_links;
create policy "evidence_skill_links_select"
  on public.evidence_skill_links for select
  to authenticated
  using (
    exists (
      select 1 from public.evidence_submissions es
      where es.id = evidence_skill_links.evidence_id
        and (
          es.student_id = auth.uid()
          or public.current_user_role() in ('REVIEWER', 'ADMIN')
        )
    )
  );

drop policy if exists "evidence_skill_links_student_insert" on public.evidence_skill_links;
create policy "evidence_skill_links_student_insert"
  on public.evidence_skill_links for insert
  to authenticated
  with check (
    exists (
      select 1 from public.evidence_submissions es
      where es.id = evidence_skill_links.evidence_id
        and es.student_id = auth.uid()
        and es.status in ('SUBMITTED', 'UPLOAD_PENDING', 'REVISION_REQUIRED', 'TECHNICAL_VALIDATION_FAILED')
    )
  );

drop policy if exists "evidence_skill_links_student_delete" on public.evidence_skill_links;
create policy "evidence_skill_links_student_delete"
  on public.evidence_skill_links for delete
  to authenticated
  using (
    exists (
      select 1 from public.evidence_submissions es
      where es.id = evidence_skill_links.evidence_id
        and es.student_id = auth.uid()
        and es.status in ('SUBMITTED', 'UPLOAD_PENDING', 'REVISION_REQUIRED', 'TECHNICAL_VALIDATION_FAILED')
    )
  );

-- Per-Skill Review Decisions (Append-Only Audit Trail)
create table if not exists public.review_skill_decisions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.review_records(id) on delete cascade,
  evidence_id uuid not null references public.evidence_submissions(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  decision text not null check (decision in (
    'VERIFIED',
    'PARTIALLY_VERIFIED',
    'REJECTED',
    'REVISION_REQUIRED'
  )),
  verified_skill_level integer check (verified_skill_level between 0 and 4),
  rationale text not null default '',
  created_at timestamptz not null default now(),
  unique (review_id, skill_id),
  constraint chk_review_skill_decision_level_consistency check (
    (decision in ('VERIFIED', 'PARTIALLY_VERIFIED') and verified_skill_level is not null and verified_skill_level between 1 and 4)
    or
    (decision in ('REJECTED', 'REVISION_REQUIRED') and verified_skill_level is null)
  )
);

create index if not exists idx_review_skill_decisions_evidence_skill
  on public.review_skill_decisions(evidence_id, skill_id, created_at desc, id desc);

drop trigger if exists trg_guard_review_skill_decisions_immutable on public.review_skill_decisions;
create trigger trg_guard_review_skill_decisions_immutable
  before update or delete on public.review_skill_decisions
  for each row execute function public.guard_append_only_table();

alter table public.review_skill_decisions enable row level security;
revoke insert, update, delete on table public.review_skill_decisions from anon, authenticated;

drop policy if exists "review_skill_decisions_select" on public.review_skill_decisions;
create policy "review_skill_decisions_select"
  on public.review_skill_decisions for select
  to authenticated
  using (
    exists (
      select 1 from public.evidence_submissions es
      where es.id = review_skill_decisions.evidence_id
        and (
          es.student_id = auth.uid()
          or public.current_user_role() in ('REVIEWER', 'ADMIN')
        )
    )
  );

-- Deterministic Recalculation of Student Verified Skill Levels (DEF-22 / DEF-24 / DEF-25)
create or replace function public.recalculate_student_verified_skills(
  p_student_id uuid,
  p_skill_id text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_skill record;
  v_max_verified integer;
  v_latest_review_id uuid;
  v_has_pending_evidence boolean;
  v_current_profile record;
  v_new_state text;
begin
  if not public.is_trusted_execution_role() then
    raise exception 'WAYFINDER_SECURITY_VIOLATION: recalculate_student_verified_skills requires trusted execution context.';
  end if;

  for v_skill in
    select distinct s_id as skill_id
    from (
      select usp.skill_id as s_id
        from public.user_skill_profiles usp
       where usp.student_id = p_student_id
         and (p_skill_id is null or usp.skill_id = p_skill_id)
      union
      select esl.skill_id as s_id
        from public.evidence_skill_links esl
        join public.evidence_submissions es on es.id = esl.evidence_id
       where es.student_id = p_student_id
         and (p_skill_id is null or esl.skill_id = p_skill_id)
      union
      select rsd.skill_id as s_id
        from public.review_skill_decisions rsd
        join public.evidence_submissions es on es.id = rsd.evidence_id
       where es.student_id = p_student_id
         and (p_skill_id is null or rsd.skill_id = p_skill_id)
    ) all_skills
  loop
    -- Only consider active (non-superseded, non-revoked, non-expired) accepted evidence submissions
    -- and take the latest review_skill_decision per active evidence submission
    with latest_decision_per_evidence as (
      select distinct on (es.id)
        es.id as evidence_id,
        rsd.review_id,
        rsd.decision,
        rsd.verified_skill_level,
        rr.reviewed_at,
        rsd.id as rsd_id
      from public.evidence_submissions es
      join public.evidence_skill_links esl
        on esl.evidence_id = es.id
       and esl.skill_id = v_skill.skill_id
      join public.review_records rr
        on rr.evidence_id = es.id
      join public.review_skill_decisions rsd
        on rsd.review_id = rr.id
       and rsd.evidence_id = es.id
       and rsd.skill_id = v_skill.skill_id
      where es.student_id = p_student_id
        and es.status in ('VERIFIED', 'PARTIALLY_VERIFIED')
        and es.superseded_by_evidence_id is null
        and (es.expires_at is null or es.expires_at > now())
      order by es.id, rr.reviewed_at desc, rsd.created_at desc, rsd.id desc
    )
    select
      max(ld.verified_skill_level),
      (
        select ld2.review_id
        from latest_decision_per_evidence ld2
        where ld2.decision in ('VERIFIED', 'PARTIALLY_VERIFIED')
          and ld2.verified_skill_level is not null
        order by ld2.verified_skill_level desc, ld2.reviewed_at desc, ld2.rsd_id desc
        limit 1
      )
    into v_max_verified, v_latest_review_id
    from latest_decision_per_evidence ld
    where ld.decision in ('VERIFIED', 'PARTIALLY_VERIFIED')
      and ld.verified_skill_level is not null;

    select exists (
      select 1
      from public.evidence_submissions es
      join public.evidence_skill_links esl on esl.evidence_id = es.id
      where es.student_id = p_student_id
        and esl.skill_id = v_skill.skill_id
        and es.superseded_by_evidence_id is null
        and es.status in ('SUBMITTED', 'UPLOAD_PENDING', 'TECHNICAL_VALIDATION_PASSED', 'UNDER_REVIEW', 'REVISION_REQUIRED')
    ) into v_has_pending_evidence;

    select *
      into v_current_profile
      from public.user_skill_profiles usp
     where usp.student_id = p_student_id
       and usp.skill_id = v_skill.skill_id
     for update;

    if found then
      v_new_state := case
        when v_max_verified is not null and v_current_profile.assessment_level is not null then 'FULLY_CORROBORATED'
        when v_max_verified is not null then 'EVIDENCE_VERIFIED'
        when v_has_pending_evidence then 'EVIDENCE_SUBMITTED'
        when v_current_profile.assessment_level is not null then 'OBJECTIVELY_ASSESSED'
        when v_current_profile.self_reported_level is not null then 'SELF_REPORTED_ONLY'
        else 'UNVERIFIED'
      end;

      update public.user_skill_profiles
         set verified_level = v_max_verified,
             latest_review_id = v_latest_review_id,
             verification_state = v_new_state,
             updated_at = now()
       where id = v_current_profile.id;
    elsif v_max_verified is not null or v_has_pending_evidence then
      v_new_state := case
        when v_max_verified is not null then 'EVIDENCE_VERIFIED'
        else 'EVIDENCE_SUBMITTED'
      end;

      insert into public.user_skill_profiles (
        student_id,
        skill_id,
        self_reported_level,
        assessment_level,
        verified_level,
        verification_state,
        latest_review_id
      ) values (
        p_student_id,
        v_skill.skill_id,
        null,
        null,
        v_max_verified,
        v_new_state,
        v_latest_review_id
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.recalculate_student_verified_skills(uuid, text) from public, anon, authenticated;

-- Validation and Recalculation Trigger on review_skill_decisions
create or replace function public.trg_fn_validate_and_apply_review_skill_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_review record;
  v_student_id uuid;
begin
  if not public.is_trusted_execution_role() then
    raise exception 'WAYFINDER_SECURITY_VIOLATION: review_skill_decisions can only be inserted by trusted server authority.';
  end if;

  select rr.id, rr.evidence_id, rr.decision
    into v_review
    from public.review_records rr
   where rr.id = new.review_id;

  if not found then
    raise exception 'WAYFINDER_NOT_FOUND: Parent review record % does not exist.', new.review_id;
  end if;

  if v_review.evidence_id is distinct from new.evidence_id then
    raise exception 'WAYFINDER_INTEGRITY_VIOLATION: review_skill_decisions.evidence_id must match parent review_records.evidence_id.';
  end if;

  if not exists (
    select 1
    from public.evidence_skill_links esl
    where esl.evidence_id = new.evidence_id
      and esl.skill_id = new.skill_id
  ) then
    raise exception 'WAYFINDER_INTEGRITY_VIOLATION: Skill % is not linked to evidence submission %.', new.skill_id, new.evidence_id;
  end if;

  if v_review.decision in ('REJECTED', 'REVISION_REQUIRED')
     and new.decision in ('VERIFIED', 'PARTIALLY_VERIFIED') then
    raise exception 'WAYFINDER_DECISION_CONFLICT: Cannot verify a skill under a rejected or revision-required parent review.';
  end if;

  select es.student_id
    into v_student_id
    from public.evidence_submissions es
   where es.id = new.evidence_id;

  return new;
end;
$$;

drop trigger if exists trg_validate_review_skill_decision on public.review_skill_decisions;
create trigger trg_validate_review_skill_decision
  before insert on public.review_skill_decisions
  for each row execute function public.trg_fn_validate_and_apply_review_skill_decision();

create or replace function public.trg_fn_after_review_skill_decision_recalc()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_student_id uuid;
begin
  select es.student_id
    into v_student_id
    from public.evidence_submissions es
   where es.id = new.evidence_id;

  if v_student_id is not null then
    perform public.recalculate_student_verified_skills(v_student_id, new.skill_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_after_review_skill_decision_recalc on public.review_skill_decisions;
create trigger trg_after_review_skill_decision_recalc
  after insert on public.review_skill_decisions
  for each row execute function public.trg_fn_after_review_skill_decision_recalc();

-- Also recalculate verified skills whenever an evidence submission is revoked, expired, or superseded
create or replace function public.trg_fn_recalc_skills_on_evidence_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (old.status is distinct from new.status)
     or (old.superseded_by_evidence_id is distinct from new.superseded_by_evidence_id)
     or (old.expires_at is distinct from new.expires_at) then
    perform public.recalculate_student_verified_skills(new.student_id, null);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recalc_skills_on_evidence_lifecycle on public.evidence_submissions;
create trigger trg_recalc_skills_on_evidence_lifecycle
  after update on public.evidence_submissions
  for each row execute function public.trg_fn_recalc_skills_on_evidence_lifecycle();

-- =============================================================================
-- 6. LEARNING RESOURCES, PATHS, PROGRESS & REQUIREMENT MAPPINGS
-- =============================================================================

create table if not exists public.learning_resources (
  id text primary key,
  title text not null,
  description text not null default '',
  original_url text not null,
  youtube_embed_url text,
  resource_type text not null check (resource_type in (
    'COURSE',
    'DOCUMENTATION',
    'PROJECT_GUIDE',
    'PRACTICE_LAB',
    'READING',
    'VIDEO_LECTURE',
    'INTERACTIVE_TUTORIAL',
    'OPEN_TEXTBOOK'
  )),
  provider_or_creator text not null,
  field_id text references public.fields_of_study(id) on delete set null,
  specialisation text not null default 'General',
  associated_skill_ids text[] not null default '{}',
  mapped_dimension_id text not null check (mapped_dimension_id in (
    'QUANTITATIVE_REASONING',
    'LOGICAL_PROBLEM_SOLVING',
    'VERBAL_ANALYTICAL_COMMUNICATION',
    'TECHNICAL_TOOL_PROFICIENCY',
    'DOMAIN_FOUNDATIONS',
    'RESEARCH_INQUIRY',
    'PROJECT_EXECUTION',
    'COLLABORATION_PROFESSIONALISM',
    'ADAPTABILITY_LEARNING_AGILITY',
    'CAREER_NAVIGATION_SELF_DIRECTION'
  )),
  suggested_proficiency_level integer not null default 2 check (suggested_proficiency_level between 1 and 4),
  language text not null default 'English',
  estimated_duration text,
  estimated_hours numeric(5,1) not null default 2.0 check (estimated_hours > 0),
  cost_info text not null default 'FREE_OPEN_ACCESS'
    check (cost_info in ('FREE_OPEN_ACCESS', 'FREE_TO_AUDIT', 'PAID_SUBSCRIPTION')),
  prerequisites text,
  certificate_available boolean not null default false,
  publication_or_reviewed_date text,
  link_verification_status text not null default 'VERIFIED_OFFICIAL_SOURCE',
  last_checked_at timestamptz,
  editorial_status text not null default 'APPROVED_CATALOGUE'
    check (editorial_status in ('APPROVED_CATALOGUE', 'PENDING_EDITORIAL_REVIEW', 'FLAGGED_FOR_CHECK', 'RETIRED')),
  learning_objective text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.learning_resources enable row level security;

drop policy if exists "learning_resources_select_authenticated" on public.learning_resources;
create policy "learning_resources_select_authenticated"
  on public.learning_resources for select
  to authenticated
  using (editorial_status <> 'RETIRED' or public.current_user_role() = 'ADMIN');

create table if not exists public.resource_skill_map (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null references public.learning_resources(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete restrict,
  target_level_supported integer not null check (target_level_supported between 1 and 4),
  unique (resource_id, skill_id)
);

alter table public.resource_skill_map enable row level security;

drop policy if exists "resource_skill_map_select_authenticated" on public.resource_skill_map;
create policy "resource_skill_map_select_authenticated"
  on public.resource_skill_map for select
  to authenticated
  using (true);

create table if not exists public.learning_paths (
  id text primary key,
  title text not null,
  field_id text not null references public.fields_of_study(id) on delete cascade,
  target_skill_id text not null references public.skills(id) on delete restrict,
  target_proficiency_level integer not null check (target_proficiency_level between 1 and 4),
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.learning_paths enable row level security;

drop policy if exists "learning_paths_select_authenticated" on public.learning_paths;
create policy "learning_paths_select_authenticated"
  on public.learning_paths for select
  to authenticated
  using (true);

create table if not exists public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  learning_path_id text not null references public.learning_paths(id) on delete cascade,
  step_order integer not null,
  resource_id text references public.learning_resources(id) on delete set null,
  assessment_id text references public.assessments(id) on delete set null,
  step_instructions text not null
);

alter table public.learning_path_items enable row level security;

drop policy if exists "learning_path_items_select_authenticated" on public.learning_path_items;
create policy "learning_path_items_select_authenticated"
  on public.learning_path_items for select
  to authenticated
  using (true);

create table if not exists public.user_learning_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  resource_id text not null references public.learning_resources(id) on delete cascade,
  status text not null check (status in (
    'NOT_STARTED',
    'BOOKMARKED',
    'SAVED',
    'IN_PROGRESS',
    'REVIEWED_SELF_STUDY',
    'COMPLETED_BY_USER',
    'COMPLETED_SELF_REPORTED',
    'PRACTICE_REQUIRED',
    'READY_FOR_REASSESSMENT'
  )),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  reflection_notes text not null default '',
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, resource_id)
);

alter table public.user_learning_progress enable row level security;

drop policy if exists "user_learning_progress_student_all" on public.user_learning_progress;
create policy "user_learning_progress_student_all"
  on public.user_learning_progress for all
  to authenticated
  using (student_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (student_id = auth.uid());

create table if not exists public.requirement_skill_mappings (
  id uuid primary key default gen_random_uuid(),
  opportunity_id text not null references public.opportunities(id) on delete cascade,
  requirement_id text not null,
  skill_id text not null references public.skills(id) on delete restrict,
  required_level integer not null check (required_level between 1 and 4),
  is_mandatory boolean not null default true,
  evidence_required boolean not null default false,
  unique (opportunity_id, requirement_id, skill_id)
);

alter table public.requirement_skill_mappings enable row level security;

drop policy if exists "requirement_skill_mappings_select_authenticated" on public.requirement_skill_mappings;
create policy "requirement_skill_mappings_select_authenticated"
  on public.requirement_skill_mappings for select
  to authenticated
  using (true);

create table if not exists public.content_review_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'FIELD',
    'SPECIALISATION',
    'SKILL',
    'ASSESSMENT',
    'LEARNING_RESOURCE',
    'LEARNING_PATH'
  )),
  entity_id text not null,
  previous_status text,
  new_status text not null,
  version text not null default '1.0',
  reviewer_id uuid references public.wayfinder_profiles(id) on delete set null,
  review_notes text not null,
  reviewed_at timestamptz not null default now()
);

alter table public.content_review_history enable row level security;

drop policy if exists "content_review_history_select_authenticated" on public.content_review_history;
create policy "content_review_history_select_authenticated"
  on public.content_review_history for select
  to authenticated
  using (true);
