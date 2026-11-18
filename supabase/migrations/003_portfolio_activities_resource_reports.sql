-- =============================================================================
-- WAYFINDER — Opportunity Readiness Intelligence Platform
-- Migration 003: 003_portfolio_activities_resource_reports.sql
--
-- Purpose:
--   1. Student Portfolio Records (`portfolio_records`) with server-derived
--      verification state synchronized from linked `evidence_submissions`
--      and protected against student self-verification.
--   2. Gap Development Plan & Activity Tracker (`development_activities`)
--      linking target dimensions, skills, opportunities, and proof submissions.
--   3. Learning Resource Quality & Broken-Link Reports (`resource_quality_reports`).
-- =============================================================================

-- =============================================================================
-- 1. PORTFOLIO RECORDS & VERIFICATION-STATE GUARD
-- =============================================================================

create table if not exists public.portfolio_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  record_type text not null check (record_type in (
    'PROJECT',
    'INTERNSHIP',
    'COMPETITION',
    'RESEARCH',
    'CERTIFICATION',
    'EXTRACURRICULAR',
    'COURSEWORK'
  )),
  title text not null,
  organization text,
  start_date date,
  end_date date,
  summary text not null default '',
  external_url text,
  linked_dimension_ids text[] not null default '{}',
  linked_skill_ids text[] not null default '{}',
  linked_evidence_id uuid references public.evidence_submissions(id) on delete set null,
  verification_state text not null default 'SELF_REPORTED' check (verification_state in (
    'SELF_REPORTED',
    'EVIDENCE_LINKED',
    'EVIDENCE_VERIFIED'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portfolio_records_student
  on public.portfolio_records(student_id, created_at desc);

create index if not exists idx_portfolio_records_linked_evidence
  on public.portfolio_records(linked_evidence_id);

-- Guard trigger: derive verification_state from linked_evidence_id and prevent client spoofing
create or replace function public.trg_fn_guard_portfolio_record_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_evidence_student_id uuid;
  v_evidence_status text;
  v_evidence_superseded uuid;
  v_evidence_expires timestamptz;
begin
  if not public.is_trusted_execution_role() then
    if tg_op = 'INSERT' and new.student_id is distinct from auth.uid() then
      raise exception 'WAYFINDER_SECURITY_VIOLATION: Cannot create portfolio record for another student.';
    elsif tg_op = 'UPDATE' and new.student_id is distinct from old.student_id then
      raise exception 'WAYFINDER_SECURITY_VIOLATION: Cannot reassign portfolio record owner.';
    end if;
  end if;

  if new.linked_evidence_id is null then
    new.verification_state := 'SELF_REPORTED';
  else
    select es.student_id, es.status, es.superseded_by_evidence_id, es.expires_at
      into v_evidence_student_id, v_evidence_status, v_evidence_superseded, v_evidence_expires
      from public.evidence_submissions es
     where es.id = new.linked_evidence_id;

    if not found then
      raise exception 'WAYFINDER_NOT_FOUND: Linked evidence submission % does not exist.', new.linked_evidence_id;
    end if;

    if v_evidence_student_id is distinct from new.student_id then
      raise exception 'WAYFINDER_SECURITY_VIOLATION: Cannot link portfolio record to another student''s evidence submission.';
    end if;

    if v_evidence_status in ('VERIFIED', 'PARTIALLY_VERIFIED')
       and v_evidence_superseded is null
       and (v_evidence_expires is null or v_evidence_expires > now()) then
      new.verification_state := 'EVIDENCE_VERIFIED';
    else
      new.verification_state := 'EVIDENCE_LINKED';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_portfolio_record_verification on public.portfolio_records;
create trigger trg_guard_portfolio_record_verification
  before insert or update on public.portfolio_records
  for each row execute function public.trg_fn_guard_portfolio_record_verification();

-- Automatically synchronize linked portfolio_records when evidence_submissions status changes
create or replace function public.trg_fn_sync_portfolio_on_evidence_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_new_portfolio_state text;
begin
  if tg_op = 'DELETE' then
    update public.portfolio_records
       set linked_evidence_id = null,
           verification_state = 'SELF_REPORTED',
           updated_at = now()
     where linked_evidence_id = old.id;
    return old;
  end if;

  if (old.status is distinct from new.status)
     or (old.superseded_by_evidence_id is distinct from new.superseded_by_evidence_id)
     or (old.expires_at is distinct from new.expires_at) then
    if new.status in ('VERIFIED', 'PARTIALLY_VERIFIED')
       and new.superseded_by_evidence_id is null
       and (new.expires_at is null or new.expires_at > now()) then
      v_new_portfolio_state := 'EVIDENCE_VERIFIED';
    else
      v_new_portfolio_state := 'EVIDENCE_LINKED';
    end if;

    update public.portfolio_records
       set verification_state = v_new_portfolio_state,
           updated_at = now()
     where linked_evidence_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_portfolio_on_evidence_change on public.evidence_submissions;
create trigger trg_sync_portfolio_on_evidence_change
  after update or delete on public.evidence_submissions
  for each row execute function public.trg_fn_sync_portfolio_on_evidence_change();

alter table public.portfolio_records enable row level security;

drop policy if exists "portfolio_records_select" on public.portfolio_records;
create policy "portfolio_records_select"
  on public.portfolio_records for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.current_user_role() in ('REVIEWER', 'ADMIN')
  );

drop policy if exists "portfolio_records_student_insert" on public.portfolio_records;
create policy "portfolio_records_student_insert"
  on public.portfolio_records for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

drop policy if exists "portfolio_records_student_update" on public.portfolio_records;
create policy "portfolio_records_student_update"
  on public.portfolio_records for update
  to authenticated
  using (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  )
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

drop policy if exists "portfolio_records_student_delete" on public.portfolio_records;
create policy "portfolio_records_student_delete"
  on public.portfolio_records for delete
  to authenticated
  using (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

-- =============================================================================
-- 2. DEVELOPMENT ACTIVITIES (GAP DEVELOPMENT PLAN & ACTIVITY TRACKER)
-- =============================================================================

create table if not exists public.development_activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  target_dimension_id text not null check (target_dimension_id in (
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
  target_skill_id text references public.skills(id) on delete set null,
  target_opportunity_id text references public.opportunities(id) on delete set null,
  title text not null,
  action_plan text not null default '',
  expected_artifact_type text,
  target_level integer not null default 2 check (target_level between 1 and 4),
  due_date date,
  status text not null default 'PLANNED' check (status in (
    'PLANNED',
    'IN_PROGRESS',
    'EVIDENCE_SUBMITTED',
    'COMPLETED_VERIFIED',
    'ARCHIVED'
  )),
  linked_evidence_id uuid references public.evidence_submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_development_activities_student
  on public.development_activities(student_id, created_at desc);

-- Guard trigger: prevent client from setting COMPLETED_VERIFIED unless linked_evidence_id is genuinely VERIFIED
create or replace function public.trg_fn_guard_development_activity_status()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_evidence_student_id uuid;
  v_evidence_status text;
  v_evidence_superseded uuid;
begin
  if not public.is_trusted_execution_role() then
    if tg_op = 'INSERT' and new.student_id is distinct from auth.uid() then
      raise exception 'WAYFINDER_SECURITY_VIOLATION: Cannot create development activity for another student.';
    elsif tg_op = 'UPDATE' and new.student_id is distinct from old.student_id then
      raise exception 'WAYFINDER_SECURITY_VIOLATION: Cannot reassign development activity owner.';
    end if;

    if new.status = 'COMPLETED_VERIFIED' then
      if new.linked_evidence_id is null then
        raise exception 'WAYFINDER_PROOF_REQUIRED: Activity cannot be COMPLETED_VERIFIED without a verified evidence submission.';
      end if;

      select es.student_id, es.status, es.superseded_by_evidence_id
        into v_evidence_student_id, v_evidence_status, v_evidence_superseded
        from public.evidence_submissions es
       where es.id = new.linked_evidence_id;

      if not found
         or v_evidence_student_id is distinct from new.student_id
         or v_evidence_status not in ('VERIFIED', 'PARTIALLY_VERIFIED')
         or v_evidence_superseded is not null then
        raise exception 'WAYFINDER_PROOF_REQUIRED: Linked evidence submission is not active and verified.';
      end if;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_development_activity_status on public.development_activities;
create trigger trg_guard_development_activity_status
  before insert or update on public.development_activities
  for each row execute function public.trg_fn_guard_development_activity_status();

alter table public.development_activities enable row level security;

drop policy if exists "development_activities_select" on public.development_activities;
create policy "development_activities_select"
  on public.development_activities for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.current_user_role() in ('REVIEWER', 'ADMIN')
  );

drop policy if exists "development_activities_student_insert" on public.development_activities;
create policy "development_activities_student_insert"
  on public.development_activities for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

drop policy if exists "development_activities_student_update" on public.development_activities;
create policy "development_activities_student_update"
  on public.development_activities for update
  to authenticated
  using (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  )
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

drop policy if exists "development_activities_student_delete" on public.development_activities;
create policy "development_activities_student_delete"
  on public.development_activities for delete
  to authenticated
  using (
    student_id = auth.uid()
    and public.current_user_role() = 'STUDENT'
  );

-- =============================================================================
-- 3. LEARNING RESOURCE QUALITY & ISSUE REPORTS
-- =============================================================================

create table if not exists public.resource_quality_reports (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null references public.learning_resources(id) on delete cascade,
  reporter_id uuid not null references public.wayfinder_profiles(id) on delete cascade,
  issue_type text not null check (issue_type in (
    'BROKEN_LINK',
    'OUTDATED_CONTENT',
    'PAYWALL_CHANGE',
    'LEVEL_MISMATCH',
    'OTHER'
  )),
  details text not null,
  status text not null default 'OPEN' check (status in (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED'
  )),
  resolved_by uuid references public.wayfinder_profiles(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_resource_quality_reports_resource
  on public.resource_quality_reports(resource_id, status);

alter table public.resource_quality_reports enable row level security;

drop policy if exists "resource_quality_reports_select" on public.resource_quality_reports;
create policy "resource_quality_reports_select"
  on public.resource_quality_reports for select
  to authenticated
  using (
    reporter_id = auth.uid()
    or public.current_user_role() in ('REVIEWER', 'ADMIN')
  );

drop policy if exists "resource_quality_reports_insert" on public.resource_quality_reports;
create policy "resource_quality_reports_insert"
  on public.resource_quality_reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and status = 'OPEN'
    and resolved_by is null
  );
