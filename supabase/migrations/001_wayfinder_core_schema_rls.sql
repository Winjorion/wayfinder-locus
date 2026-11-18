-- =============================================================================
-- WAYFINDER — MIGRATION 001: CORE SCHEMA, AUTH LIFECYCLE, STORAGE & HARDENED RLS
-- File: supabase/migrations/001_wayfinder_core_schema_rls.sql
--
-- Core Principle: CLAIM != CAPABILITY != PROOF
--
-- Scope of Migration 001 (100% Self-Contained):
--   1. Schema hardening & extensions (pgcrypto, REVOKE CREATE ON SCHEMA public).
--   2. Trusted execution context helper (SECURITY INVOKER role verification;
--      zero reliance on spoofable custom GUCs).
--   3. Core user & institutional profile table (public.wayfinder_profiles).
--   4. Auth lifecycle triggers:
--      - Automatic STUDENT profile + 10 NULL capability rows + sharing consent
--        creation on auth.users signup (ignores signup metadata role claims).
--      - Automatic email synchronization on auth.users email update.
--   5. 10-Dimension Capability Matrix (public.capability_records) with strict
--      separation of self_reported_level, objective_score_level,
--      verified_evidence_level, and demonstrated_level (Unknown = NULL != 0).
--   6. Exploratory Interest Profiles (public.interest_profiles — RIASEC).
--   7. Macro Aptitude Answer Keys (service_role only) & Attempts
--      (scored exclusively by Netlify Function wayfinder-api.ts).
--   8. Evidence Submissions & Reviewer Assignment state machine
--      (DRAFT, SUBMITTED, TECHNICAL_VALIDATION_PASSED, TECHNICAL_VALIDATION_FAILED,
--       ASSIGNED_FOR_REVIEW, UNDER_REVIEW, ACCEPTED, REVISION_REQUESTED,
--       REJECTED, EXPIRED, REVOKED).
--   9. Immutable Append-Only Review History (public.review_records) with
--      database-enforced reviewer role, active assignment, self-review
--      prohibition, and same-evidence superseding review constraints
--      (DEF-25, DEF-26, DEF-27).
--  10. Curated Opportunities & Versioned Requirement Matrices
--      (created without field_id; field_id FK is added in Migration 002).
--  11. Student Selected Targets & Deterministic Readiness Snapshots.
--  12. Granular Sharing Consents & Append-Only Audit Events.
--  13. Concurrency-Safe Cohort Rate Limiter & Institution-Isolated Cohort
--      Aggregation RPC (k >= 5, independent demonstrated/verified suppression,
--      marginal complement & small-sibling axis suppression — DEF-09, DEF-14,
--      DEF-20, DEF-21, DEF-23).
--  14. Private Storage Bucket ('evidence-artifacts', 50 MB limit, MIME allowlist)
--      with exact path-matched student policies and signed-URL-only reviewer/admin
--      access.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONS & SCHEMA PRIVILEGE HARDENING
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Prevent untrusted roles from creating shadow tables, functions, or operators
-- in the public schema (Consistency Check #3).
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 1. CORE SECURITY & TIMESTAMP HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- 1.1 Kernel-Enforced Trusted Role Check (DEF-01, DEF-10)
-- Declared SECURITY INVOKER so that inside any BEFORE trigger on a table,
-- current_user reflects the role executing the INSERT/UPDATE/DELETE statement:
--   • Direct PostgREST client request: current_user is 'authenticated' or 'anon' -> FALSE
--   • Netlify Function using SUPABASE_SERVICE_ROLE_KEY: current_user is 'service_role' -> TRUE
--   • Internal SECURITY DEFINER trigger owned by postgres: current_user is 'postgres' -> TRUE
-- Cannot be spoofed via set_config() or custom GUCs.
CREATE OR REPLACE FUNCTION public.is_trusted_execution_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT current_user IN ('postgres', 'supabase_admin', 'service_role');
$$;

REVOKE ALL ON FUNCTION public.is_trusted_execution_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trusted_execution_role() TO authenticated, service_role;

-- 1.2 Generic updated_at Maintenance Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;

-- 1.3 Generic Append-Only Immutability Guard (DEF-25)
-- Blocks UPDATE and DELETE even by privileged application roles (service_role).
CREATE OR REPLACE FUNCTION public.guard_append_only_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_RECORD_VIOLATION: Table %.% is strictly append-only; % operations are prohibited.',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_append_only_table() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_append_only_table() TO service_role;

-- -----------------------------------------------------------------------------
-- 2. CORE USER & INSTITUTIONAL PROFILES (public.wayfinder_profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wayfinder_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (pg_catalog.char_length(pg_catalog.btrim(full_name)) >= 1),
  role TEXT NOT NULL DEFAULT 'STUDENT'
    CHECK (role IN ('STUDENT', 'REVIEWER', 'INSTITUTION', 'ADMIN')),
  institution_name TEXT NOT NULL DEFAULT 'Unspecified Institution',
  -- institution_id remains NULL until explicitly assigned by an ADMIN (never inferred from email domain)
  institution_id UUID NULL,
  programme TEXT NOT NULL DEFAULT 'General Undergraduate',
  year_of_study TEXT NOT NULL DEFAULT '1st Year',
  graduation_year SMALLINT NULL
    CHECK (graduation_year IS NULL OR (graduation_year BETWEEN 2020 AND 2040)),
  geographic_preference TEXT NOT NULL DEFAULT 'India (Flexible / Remote)',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_wayfinder_profiles_role
  ON public.wayfinder_profiles(role);
CREATE INDEX IF NOT EXISTS idx_wayfinder_profiles_institution_id
  ON public.wayfinder_profiles(institution_id)
  WHERE institution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wayfinder_profiles_cohort_lookup
  ON public.wayfinder_profiles(institution_id, programme, graduation_year)
  WHERE role = 'STUDENT' AND institution_id IS NOT NULL;

-- 2.1 Role & Institution Lookup Helpers (SECURITY DEFINER with locked search_path)
CREATE OR REPLACE FUNCTION public.current_wayfinder_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT wp.role
  FROM public.wayfinder_profiles wp
  WHERE wp.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_wayfinder_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_wayfinder_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_wayfinder_institution()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT wp.institution_id
  FROM public.wayfinder_profiles wp
  WHERE wp.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_wayfinder_institution() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_wayfinder_institution() TO authenticated, service_role;

-- 2.2 Profile Column Guard Trigger (Prevents Role Escalation, Tenant Spoofing & Client Email Edits)
CREATE OR REPLACE FUNCTION public.guard_wayfinder_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Direct client inserts into wayfinder_profiles are blocked; rows are created
    -- by the auth.users signup trigger or service_role only.
    IF NOT public.is_trusted_execution_role() THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Profiles can only be provisioned by the authentication lifecycle trigger.';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NOT public.is_trusted_execution_role() THEN
      -- Non-trusted caller (authenticated client via PostgREST)
      IF public.current_wayfinder_role() IS DISTINCT FROM 'ADMIN' THEN
        IF NEW.id IS DISTINCT FROM OLD.id THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: Profile primary key cannot be modified.';
        END IF;
        IF NEW.role IS DISTINCT FROM OLD.role THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: Users cannot modify their own role.';
        END IF;
        IF NEW.institution_id IS DISTINCT FROM OLD.institution_id THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: Users cannot modify institution_id.';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: Email is synchronized exclusively from Supabase Auth.';
        END IF;
        IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: created_at cannot be modified.';
        END IF;
      ELSE
        -- Authenticated ADMIN can assign role and institution_id, but still cannot
        -- desynchronize email or alter id/created_at directly.
        IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: Immutable profile identity fields cannot be modified.';
        END IF;
        IF NEW.email IS DISTINCT FROM OLD.email THEN
          RAISE EXCEPTION 'SECURITY_VIOLATION: Email is synchronized exclusively from Supabase Auth.';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_wayfinder_profile_columns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_wayfinder_profile_columns() TO service_role;

DROP TRIGGER IF EXISTS trg_01_guard_wayfinder_profile_columns ON public.wayfinder_profiles;
CREATE TRIGGER trg_01_guard_wayfinder_profile_columns
  BEFORE INSERT OR UPDATE ON public.wayfinder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_wayfinder_profile_columns();

DROP TRIGGER IF EXISTS trg_02_wayfinder_profiles_updated_at ON public.wayfinder_profiles;
CREATE TRIGGER trg_02_wayfinder_profiles_updated_at
  BEFORE UPDATE ON public.wayfinder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. CAPABILITY RECORDS (public.capability_records)
--    10 Canonical Dimensions | Unknown = NULL != 0 | Self-Reported != Verified
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capability_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  dimension_id TEXT NOT NULL
    CHECK (dimension_id IN (
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
  self_reported_level SMALLINT NULL
    CHECK (self_reported_level IS NULL OR (self_reported_level BETWEEN 0 AND 4)),
  objective_score_level SMALLINT NULL
    CHECK (objective_score_level IS NULL OR (objective_score_level BETWEEN 0 AND 4)),
  verified_evidence_level SMALLINT NULL
    CHECK (verified_evidence_level IS NULL OR (verified_evidence_level BETWEEN 0 AND 4)),
  demonstrated_level SMALLINT NULL
    CHECK (demonstrated_level IS NULL OR (demonstrated_level BETWEEN 0 AND 4)),
  evidence_source TEXT NOT NULL DEFAULT 'UNASSESSED'
    CHECK (evidence_source IN (
      'UNASSESSED',
      'SELF_REPORT_ONLY',
      'OBJECTIVE_ASSESSMENT',
      'VERIFIED_EVIDENCE',
      'OBJECTIVE_AND_VERIFIED'
    )),
  self_reported_updated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_capability_records_student_dimension UNIQUE (student_id, dimension_id)
);

CREATE INDEX IF NOT EXISTS idx_capability_records_student_id
  ON public.capability_records(student_id);
CREATE INDEX IF NOT EXISTS idx_capability_records_dimension_id
  ON public.capability_records(dimension_id);

-- 3.1 Capability Record Column Guard & Deterministic Demonstrated-Level Calculator
CREATE OR REPLACE FUNCTION public.guard_capability_record_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_trusted_execution_role() THEN
      -- Ordinary authenticated student inserting a capability row can only set self_reported_level
      IF NEW.student_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Cannot insert capability records for another user.';
      END IF;
      IF NEW.objective_score_level IS NOT NULL OR NEW.verified_evidence_level IS NOT NULL THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Clients cannot set objective or verified capability levels.';
      END IF;
      IF NEW.self_reported_level IS NOT NULL THEN
        NEW.self_reported_updated_at := pg_catalog.now();
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT public.is_trusted_execution_role() THEN
      IF NEW.student_id IS DISTINCT FROM OLD.student_id
         OR NEW.dimension_id IS DISTINCT FROM OLD.dimension_id THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Cannot alter student_id or dimension_id on capability_records.';
      END IF;
      IF NEW.objective_score_level IS DISTINCT FROM OLD.objective_score_level THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Students cannot modify objective_score_level.';
      END IF;
      IF NEW.verified_evidence_level IS DISTINCT FROM OLD.verified_evidence_level THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Students cannot modify verified_evidence_level.';
      END IF;
      IF NEW.self_reported_level IS DISTINCT FROM OLD.self_reported_level THEN
        NEW.self_reported_updated_at := pg_catalog.now();
      END IF;
    END IF;
  END IF;

  -- Invariant 1 & 2: Unknown remains NULL (never 0), and self_reported_level NEVER
  -- contributes to demonstrated_level.
  IF NEW.objective_score_level IS NULL AND NEW.verified_evidence_level IS NULL THEN
    NEW.demonstrated_level := NULL;
    IF NEW.self_reported_level IS NOT NULL THEN
      NEW.evidence_source := 'SELF_REPORT_ONLY';
    ELSE
      NEW.evidence_source := 'UNASSESSED';
    END IF;
  ELSIF NEW.objective_score_level IS NOT NULL AND NEW.verified_evidence_level IS NOT NULL THEN
    NEW.demonstrated_level := pg_catalog.greatest(NEW.objective_score_level, NEW.verified_evidence_level);
    NEW.evidence_source := 'OBJECTIVE_AND_VERIFIED';
  ELSIF NEW.verified_evidence_level IS NOT NULL THEN
    NEW.demonstrated_level := NEW.verified_evidence_level;
    NEW.evidence_source := 'VERIFIED_EVIDENCE';
  ELSE
    NEW.demonstrated_level := NEW.objective_score_level;
    NEW.evidence_source := 'OBJECTIVE_ASSESSMENT';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_capability_record_writes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_capability_record_writes() TO service_role;

DROP TRIGGER IF EXISTS trg_01_guard_capability_record_writes ON public.capability_records;
CREATE TRIGGER trg_01_guard_capability_record_writes
  BEFORE INSERT OR UPDATE ON public.capability_records
  FOR EACH ROW EXECUTE FUNCTION public.guard_capability_record_writes();

DROP TRIGGER IF EXISTS trg_02_capability_records_updated_at ON public.capability_records;
CREATE TRIGGER trg_02_capability_records_updated_at
  BEFORE UPDATE ON public.capability_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. SHARING CONSENTS & AUDIT EVENTS FOUNDATIONS
--    (Created before auth trigger so signup can initialize sharing_consents)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sharing_consents (
  student_id UUID PRIMARY KEY REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  share_readiness_with_institution BOOLEAN NOT NULL DEFAULT FALSE,
  share_verified_passport_with_employers BOOLEAN NOT NULL DEFAULT FALSE,
  allow_anonymized_cohort_analytics BOOLEAN NOT NULL DEFAULT TRUE,
  public_passport_token TEXT NOT NULL UNIQUE
    DEFAULT ('wf-pass-' || pg_catalog.encode(extensions.gen_random_bytes(12), 'hex')),
  passport_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE OR REPLACE FUNCTION public.set_sharing_consents_last_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.last_updated := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_sharing_consents_last_updated() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_sharing_consents_last_updated() TO service_role;

DROP TRIGGER IF EXISTS trg_01_sharing_consents_last_updated ON public.sharing_consents;
CREATE TRIGGER trg_01_sharing_consents_last_updated
  BEFORE UPDATE ON public.sharing_consents
  FOR EACH ROW EXECUTE FUNCTION public.set_sharing_consents_last_updated();

-- 4.2 Append-Only Audit Events (public.audit_events)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NULL REFERENCES public.wayfinder_profiles(id) ON DELETE SET NULL,
  actor_name TEXT NULL,
  actor_role TEXT NULL,
  action TEXT NOT NULL CHECK (pg_catalog.char_length(pg_catalog.btrim(action)) >= 2),
  target_entity TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id_created_at
  ON public.audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_action_created_at
  ON public.audit_events(action, created_at DESC);

DROP TRIGGER IF EXISTS trg_01_guard_audit_events_append_only ON public.audit_events;
CREATE TRIGGER trg_01_guard_audit_events_append_only
  BEFORE UPDATE OR DELETE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_append_only_table();

-- -----------------------------------------------------------------------------
-- 5. AUTHENTICATION SIGNUP & EMAIL SYNCHRONIZATION TRIGGERS
-- -----------------------------------------------------------------------------

-- 5.1 Automatic STUDENT Profile + 10 NULL Capabilities + Sharing Consents on Signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_dim TEXT;
  v_email TEXT;
  v_full_name TEXT;
  v_institution_name TEXT;
  v_programme TEXT;
  v_year_of_study TEXT;
  v_grad_year_raw TEXT;
  v_grad_year SMALLINT := NULL;
  v_dimensions TEXT[] := ARRAY[
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
  ];
BEGIN
  v_email := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.email), ''),
    'pending-' || NEW.id::text || '@wayfinder.local'
  );

  v_full_name := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(pg_catalog.split_part(v_email, '@', 1), ''),
    'Wayfinder Student'
  );

  v_institution_name := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'institution_name'), ''),
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'institution'), ''),
    'Unspecified Institution'
  );

  v_programme := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'programme'), ''),
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'degreeProgram'), ''),
    'General Undergraduate'
  );

  v_year_of_study := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'year_of_study'), ''),
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'yearOfStudy'), ''),
    '1st Year'
  );

  v_grad_year_raw := NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'graduation_year'), '');
  IF v_grad_year_raw IS NOT NULL AND v_grad_year_raw ~ '^[0-9]{4}$' THEN
    IF (v_grad_year_raw::INTEGER BETWEEN 2020 AND 2040) THEN
      v_grad_year := v_grad_year_raw::SMALLINT;
    END IF;
  END IF;

  -- 1. Create canonical profile.
  -- SECURITY RULE: role is unconditionally 'STUDENT' and institution_id is
  -- unconditionally NULL. Signup metadata can NEVER escalate privileges.
  INSERT INTO public.wayfinder_profiles (
    id,
    email,
    full_name,
    role,
    institution_name,
    institution_id,
    programme,
    year_of_study,
    graduation_year,
    onboarding_completed
  ) VALUES (
    NEW.id,
    v_email,
    v_full_name,
    'STUDENT',
    v_institution_name,
    NULL,
    v_programme,
    v_year_of_study,
    v_grad_year,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Initialize all 10 canonical capability dimensions with NULL levels (Unknown != 0)
  FOREACH v_dim IN ARRAY v_dimensions LOOP
    INSERT INTO public.capability_records (
      student_id,
      dimension_id,
      self_reported_level,
      objective_score_level,
      verified_evidence_level,
      demonstrated_level,
      evidence_source
    ) VALUES (
      NEW.id,
      v_dim,
      NULL,
      NULL,
      NULL,
      NULL,
      'UNASSESSED'
    )
    ON CONFLICT (student_id, dimension_id) DO NOTHING;
  END LOOP;

  -- 3. Initialize default privacy & sharing consents
  INSERT INTO public.sharing_consents (
    student_id,
    share_readiness_with_institution,
    share_verified_passport_with_employers,
    allow_anonymized_cohort_analytics
  ) VALUES (
    NEW.id,
    FALSE,
    FALSE,
    TRUE
  )
  ON CONFLICT (student_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5.2 Email Synchronization Trigger (DEF-04)
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    UPDATE public.wayfinder_profiles
    SET email = pg_catalog.btrim(NEW.email),
        updated_at = pg_catalog.now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_auth_user_email_update() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_auth_user_email_update() TO service_role;

DROP TRIGGER IF EXISTS trg_on_auth_user_email_updated ON auth.users;
CREATE TRIGGER trg_on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_email_update();

-- -----------------------------------------------------------------------------
-- 6. INTEREST PROFILES (public.interest_profiles)
--    Keeps RIASEC exploratory interest profiles strictly separate from skills
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  top_codes TEXT[] NOT NULL
    CHECK (pg_catalog.cardinality(top_codes) BETWEEN 1 AND 6),
  recommended_clusters TEXT[] NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT chk_interest_profiles_scores_object
    CHECK (pg_catalog.jsonb_typeof(scores) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_interest_profiles_student_completed
  ON public.interest_profiles(student_id, completed_at DESC);

-- -----------------------------------------------------------------------------
-- 7. MACRO APTITUDE ANSWER KEYS & ATTEMPTS
--    Sole Scoring Authority: netlify/functions/wayfinder-api.ts
--    Answer keys are strictly locked to service_role (zero client access)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aptitude_answer_keys (
  question_id TEXT PRIMARY KEY,
  dimension_id TEXT NOT NULL
    CHECK (dimension_id IN (
      'QUANTITATIVE_REASONING',
      'LOGICAL_PROBLEM_SOLVING',
      'VERBAL_ANALYTICAL_COMMUNICATION',
      'PROJECT_EXECUTION',
      'DOMAIN_FOUNDATIONS'
    )),
  correct_option_index SMALLINT NOT NULL CHECK (correct_option_index BETWEEN 0 AND 10),
  difficulty_weight SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty_weight BETWEEN 1 AND 4),
  scoring_rationale TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE IF NOT EXISTS public.aptitude_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  numerical_score SMALLINT NOT NULL CHECK (numerical_score BETWEEN 0 AND 100),
  logical_score SMALLINT NOT NULL CHECK (logical_score BETWEEN 0 AND 100),
  verbal_score SMALLINT NOT NULL CHECK (verbal_score BETWEEN 0 AND 100),
  execution_score SMALLINT NOT NULL CHECK (execution_score BETWEEN 0 AND 100),
  domain_score SMALLINT NOT NULL CHECK (domain_score BETWEEN 0 AND 100),
  overall_level SMALLINT NOT NULL CHECK (overall_level BETWEEN 0 AND 4),
  question_count SMALLINT NOT NULL CHECK (question_count > 0),
  elapsed_seconds INTEGER NOT NULL CHECK (elapsed_seconds >= 0),
  rapid_guess_flag BOOLEAN NOT NULL DEFAULT FALSE,
  raw_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_aptitude_attempts_student_completed
  ON public.aptitude_attempts(student_id, completed_at DESC);

-- -----------------------------------------------------------------------------
-- 8. EVIDENCE SUBMISSIONS & IMMUTABLE REVIEW HISTORY
--    (DEF-11, DEF-25, DEF-26, DEF-27)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE RESTRICT,
  student_name TEXT NOT NULL,
  title TEXT NOT NULL CHECK (pg_catalog.char_length(pg_catalog.btrim(title)) >= 3),
  evidence_type TEXT NOT NULL
    CHECK (evidence_type IN (
      'GITHUB_REPOSITORY',
      'PROJECT_REPORT_PDF',
      'VERIFIED_CERTIFICATE',
      'COMPETITION_SUBMISSION',
      'PORTFOLIO_CASE_STUDY',
      'INTERNSHIP_ARTIFACT',
      'RESEARCH_PAPER'
    )),
  description TEXT NOT NULL,
  claimed_dimensions TEXT[] NOT NULL
    CHECK (
      pg_catalog.cardinality(claimed_dimensions) >= 1
      AND claimed_dimensions <@ ARRAY[
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
      ]::TEXT[]
    ),
  claimed_skill_ids TEXT[] NOT NULL DEFAULT '{}',
  claimed_level SMALLINT NOT NULL CHECK (claimed_level BETWEEN 1 AND 4),
  artifact_url_or_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'evidence-artifacts'
    CHECK (storage_bucket = 'evidence-artifacts'),
  storage_object_path TEXT NULL,
  mime_type TEXT NULL
    CHECK (
      mime_type IS NULL OR mime_type IN (
        'application/pdf',
        'image/png',
        'image/jpeg',
        'application/zip',
        'text/markdown',
        'text/plain'
      )
    ),
  file_size_bytes BIGINT NULL
    CHECK (file_size_bytes IS NULL OR (file_size_bytes > 0 AND file_size_bytes <= 52428800)),
  sha256_hash TEXT NOT NULL
    CHECK (sha256_hash ~ '^[a-fA-F0-9]{64}$'),
  self_declaration_confirmed BOOLEAN NOT NULL DEFAULT TRUE
    CHECK (self_declaration_confirmed = TRUE),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT',
      'SUBMITTED',
      'TECHNICAL_VALIDATION_PASSED',
      'TECHNICAL_VALIDATION_FAILED',
      'ASSIGNED_FOR_REVIEW',
      'UNDER_REVIEW',
      'ACCEPTED',
      'REVISION_REQUESTED',
      'REJECTED',
      'EXPIRED',
      'REVOKED'
    )),
  verified_level SMALLINT NULL
    CHECK (verified_level IS NULL OR (verified_level BETWEEN 1 AND 4)),
  assigned_reviewer_id UUID NULL REFERENCES public.wayfinder_profiles(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NULL,
  review_decision JSONB NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  reviewed_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  revoked_at TIMESTAMPTZ NULL,
  revocation_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  -- Enforce non-self-assignment at the table constraint level
  CONSTRAINT chk_evidence_no_self_assignment
    CHECK (assigned_reviewer_id IS NULL OR assigned_reviewer_id <> student_id),
  -- Enforce exact user-folder and evidence_id storage path format when storage_object_path is present
  CONSTRAINT chk_evidence_storage_path_format
    CHECK (
      storage_object_path IS NULL
      OR (
        pg_catalog.split_part(storage_object_path, '/', 1) = student_id::text
        AND pg_catalog.split_part(storage_object_path, '/', 2) = id::text
        AND pg_catalog.char_length(pg_catalog.split_part(storage_object_path, '/', 3)) >= 1
        AND pg_catalog.split_part(storage_object_path, '/', 4) = ''
      )
    ),
  -- Verified level can only be non-null when status is ACCEPTED
  CONSTRAINT chk_evidence_verified_level_consistency
    CHECK (
      (status = 'ACCEPTED' AND verified_level BETWEEN 1 AND 4)
      OR (status <> 'ACCEPTED' AND verified_level IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_evidence_submissions_student_status
  ON public.evidence_submissions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_assigned_reviewer
  ON public.evidence_submissions(assigned_reviewer_id, status)
  WHERE assigned_reviewer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_storage_path
  ON public.evidence_submissions(storage_object_path)
  WHERE storage_object_path IS NOT NULL;

-- 8.1 Evidence Submission State-Machine & Column Guard Trigger (DEF-03, DEF-11)
CREATE OR REPLACE FUNCTION public.guard_evidence_submission_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_trusted_execution_role() THEN
      -- Ordinary authenticated student inserting a new submission
      IF public.current_wayfinder_role() IS DISTINCT FROM 'STUDENT' THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Only students may create evidence submissions.';
      END IF;
      IF NEW.student_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Cannot submit evidence on behalf of another student.';
      END IF;
      IF NEW.status NOT IN ('DRAFT', 'SUBMITTED') THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Initial student evidence status must be DRAFT or SUBMITTED.';
      END IF;
      IF NEW.verified_level IS NOT NULL
         OR NEW.assigned_reviewer_id IS NOT NULL
         OR NEW.assigned_at IS NOT NULL
         OR NEW.review_decision IS NOT NULL
         OR NEW.reviewed_at IS NOT NULL
         OR NEW.revoked_at IS NOT NULL
         OR NEW.revocation_reason IS NOT NULL THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Students cannot populate review, assignment, or verification fields.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Immutable identity fields cannot be changed by anyone
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Evidence identity fields (id, student_id, created_at) are immutable.';
    END IF;

    IF NOT public.is_trusted_execution_role() THEN
      -- Direct client requests via PostgREST:
      -- Reviewers and Admins are NOT allowed to update evidence_submissions directly from the browser;
      -- all validation, assignment, review, expiration, and revocation mutations run via trusted server/triggers.
      IF auth.uid() IS DISTINCT FROM OLD.student_id THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Direct client modification of evidence_submissions by non-owners is prohibited.';
      END IF;

      -- Student owner can only edit while in DRAFT, REVISION_REQUESTED, or TECHNICAL_VALIDATION_FAILED
      IF OLD.status NOT IN ('DRAFT', 'REVISION_REQUESTED', 'TECHNICAL_VALIDATION_FAILED') THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Evidence in status % is locked and cannot be edited by the student.', OLD.status;
      END IF;

      -- Student can only transition to DRAFT (if currently DRAFT) or SUBMITTED
      IF OLD.status = 'DRAFT' AND NEW.status NOT IN ('DRAFT', 'SUBMITTED') THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Invalid student status transition from DRAFT to %.', NEW.status;
      END IF;
      IF OLD.status IN ('REVISION_REQUESTED', 'TECHNICAL_VALIDATION_FAILED') AND NEW.status <> 'SUBMITTED' THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Resubmitted evidence from % must transition to SUBMITTED.', OLD.status;
      END IF;

      -- Student cannot touch privileged review/verification/assignment columns
      IF NEW.verified_level IS NOT NULL
         OR NEW.assigned_reviewer_id IS DISTINCT FROM OLD.assigned_reviewer_id
         OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at
         OR NEW.review_decision IS DISTINCT FROM OLD.review_decision
         OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
         OR NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
         OR NEW.revocation_reason IS DISTINCT FROM OLD.revocation_reason THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Students cannot modify assignment, review, or verification fields.';
      END IF;

      IF NEW.status = 'SUBMITTED' THEN
        NEW.submitted_at := pg_catalog.now();
      END IF;
    ELSE
      -- Trusted execution role (service_role or postgres trigger):
      -- Validate controlled state transitions for terminal/accepted evidence
      IF OLD.status = 'ACCEPTED' AND NEW.status NOT IN ('ACCEPTED', 'EXPIRED', 'REVOKED', 'REVISION_REQUESTED', 'REJECTED') THEN
        RAISE EXCEPTION 'INVALID_STATE_TRANSITION: Accepted evidence cannot transition back to %.', NEW.status;
      END IF;
      IF NEW.status = 'REVOKED' THEN
        NEW.verified_level := NULL;
        NEW.revoked_at := COALESCE(NEW.revoked_at, pg_catalog.now());
      ELSIF NEW.status = 'EXPIRED' THEN
        NEW.verified_level := NULL;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_evidence_submission_writes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_evidence_submission_writes() TO service_role;

-- 8.2 Evidence Deletion Guard Trigger (DEF-11: Only DRAFT evidence can be physically deleted)
CREATE OR REPLACE FUNCTION public.guard_evidence_submission_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF OLD.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'IMMUTABLE_EVIDENCE_VIOLATION: Evidence submission % is in status % and cannot be deleted. Use EXPIRED or REVOKED for invalidation.',
      OLD.id, OLD.status;
  END IF;

  IF NOT public.is_trusted_execution_role() AND OLD.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Cannot delete another student''s draft evidence.';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_evidence_submission_delete() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_evidence_submission_delete() TO service_role;

DROP TRIGGER IF EXISTS trg_01_guard_evidence_submission_writes ON public.evidence_submissions;
CREATE TRIGGER trg_01_guard_evidence_submission_writes
  BEFORE INSERT OR UPDATE ON public.evidence_submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_evidence_submission_writes();

DROP TRIGGER IF EXISTS trg_02_guard_evidence_submission_delete ON public.evidence_submissions;
CREATE TRIGGER trg_02_guard_evidence_submission_delete
  BEFORE DELETE ON public.evidence_submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_evidence_submission_delete();

DROP TRIGGER IF EXISTS trg_03_evidence_submissions_updated_at ON public.evidence_submissions;
CREATE TRIGGER trg_03_evidence_submissions_updated_at
  BEFORE UPDATE ON public.evidence_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8.3 Immutable Review History Table (public.review_records — DEF-25, DEF-26, DEF-27)
-- Uses ON DELETE RESTRICT on evidence_id so review history can NEVER be cascade-deleted.
CREATE TABLE IF NOT EXISTS public.review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence_submissions(id) ON DELETE RESTRICT,
  reviewer_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE RESTRICT,
  reviewer_name TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK (decision IN ('ACCEPT', 'REQUEST_REVISION', 'REJECT')),
  verified_level SMALLINT NULL
    CHECK (verified_level IS NULL OR (verified_level BETWEEN 1 AND 4)),
  authenticity_score SMALLINT NOT NULL CHECK (authenticity_score BETWEEN 0 AND 4),
  technical_depth_score SMALLINT NOT NULL CHECK (technical_depth_score BETWEEN 0 AND 4),
  execution_quality_score SMALLINT NOT NULL CHECK (execution_quality_score BETWEEN 0 AND 4),
  requirement_alignment_score SMALLINT NOT NULL CHECK (requirement_alignment_score BETWEEN 0 AND 4),
  rationale TEXT NOT NULL
    CHECK (pg_catalog.char_length(pg_catalog.btrim(rationale)) >= 20),
  is_superseding_correction BOOLEAN NOT NULL DEFAULT FALSE,
  supersedes_review_id UUID NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  -- Composite uniqueness keys enabling same-evidence superseding FK and Migration 002 review_skill_decisions FK
  CONSTRAINT uq_review_records_id_evidence UNIQUE (id, evidence_id),
  CONSTRAINT uq_review_records_id_evidence_reviewer UNIQUE (id, evidence_id, reviewer_id),
  -- DEF-26: Composite FK uses ON DELETE RESTRICT (never SET NULL on NOT NULL evidence_id)
  CONSTRAINT fk_review_records_supersedes_same_evidence
    FOREIGN KEY (supersedes_review_id, evidence_id)
    REFERENCES public.review_records(id, evidence_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_review_records_verified_level_on_accept
    CHECK (
      (decision = 'ACCEPT' AND verified_level BETWEEN 1 AND 4)
      OR (decision IN ('REQUEST_REVISION', 'REJECT') AND verified_level IS NULL)
    ),
  CONSTRAINT chk_review_records_superseding_consistency
    CHECK (
      (is_superseding_correction = FALSE AND supersedes_review_id IS NULL)
      OR (is_superseding_correction = TRUE AND supersedes_review_id IS NOT NULL AND supersedes_review_id <> id)
    )
);

CREATE INDEX IF NOT EXISTS idx_review_records_evidence_decided
  ON public.review_records(evidence_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_records_reviewer_decided
  ON public.review_records(reviewer_id, decided_at DESC);

-- DEF-25: Enforce strict append-only immutability on review_records (no UPDATE or DELETE ever)
DROP TRIGGER IF EXISTS trg_01_guard_review_records_append_only ON public.review_records;
CREATE TRIGGER trg_01_guard_review_records_append_only
  BEFORE UPDATE OR DELETE ON public.review_records
  FOR EACH ROW EXECUTE FUNCTION public.guard_append_only_table();

-- 8.4 Authoritative Capability Recalculation Function (Migration 001 Self-Contained — DEF-12)
-- Computes verified_evidence_level strictly across active ACCEPTED evidence_submissions.
-- Does NOT reference any Migration 002 tables.
CREATE OR REPLACE FUNCTION public.recalculate_student_verified_capabilities(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.is_trusted_execution_role() THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: recalculate_student_verified_capabilities requires trusted execution context.';
  END IF;

  IF p_student_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.capability_records cr
  SET verified_evidence_level = (
        SELECT MAX(es.verified_level)
        FROM public.evidence_submissions es
        WHERE es.student_id = p_student_id
          AND es.status = 'ACCEPTED'
          AND es.verified_level IS NOT NULL
          AND cr.dimension_id = ANY(es.claimed_dimensions)
      ),
      updated_at = pg_catalog.now()
  WHERE cr.student_id = p_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_student_verified_capabilities(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_student_verified_capabilities(UUID) TO service_role;

-- 8.5 Database-Level Reviewer Authorization & Decision Application Trigger (DEF-27)
CREATE OR REPLACE FUNCTION public.trg_fn_validate_and_apply_review_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_reviewer_role TEXT;
  v_student_id UUID;
  v_current_status TEXT;
  v_assigned_reviewer_id UUID;
  v_mapped_status TEXT;
BEGIN
  -- 1. Verify insert comes from trusted execution context (service_role)
  IF NOT public.is_trusted_execution_role() THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Review decisions must be submitted through the authoritative server endpoint.';
  END IF;

  -- 2. Validate reviewer role in wayfinder_profiles (DEF-27)
  SELECT wp.role
    INTO v_reviewer_role
  FROM public.wayfinder_profiles wp
  WHERE wp.id = NEW.reviewer_id;

  IF v_reviewer_role IS NULL OR v_reviewer_role NOT IN ('REVIEWER', 'ADMIN') THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: User % does not hold REVIEWER or ADMIN role.', NEW.reviewer_id;
  END IF;

  -- 3. Lock target evidence submission row & fetch ownership/assignment state
  SELECT es.student_id, es.status, es.assigned_reviewer_id
    INTO v_student_id, v_current_status, v_assigned_reviewer_id
  FROM public.evidence_submissions es
  WHERE es.id = NEW.evidence_id
  FOR UPDATE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Evidence submission % does not exist.', NEW.evidence_id;
  END IF;

  -- 4. Strict Self-Review Prohibition (DEF-27)
  IF v_student_id = NEW.reviewer_id THEN
    RAISE EXCEPTION 'SECURITY_VIOLATION: Self-review is strictly prohibited (reviewer_id = student_id).';
  END IF;

  -- 5. Validate Active Assignment & Evidence Status vs Superseding Correction (DEF-27)
  IF NEW.is_superseding_correction = FALSE THEN
    IF v_current_status NOT IN ('ASSIGNED_FOR_REVIEW', 'UNDER_REVIEW') THEN
      RAISE EXCEPTION 'INVALID_EVIDENCE_STATE: Evidence % must be in ASSIGNED_FOR_REVIEW or UNDER_REVIEW for initial review (current: %).',
        NEW.evidence_id, v_current_status;
    END IF;
    IF v_assigned_reviewer_id IS DISTINCT FROM NEW.reviewer_id AND v_reviewer_role <> 'ADMIN' THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Reviewer % is not the assigned reviewer for evidence %.',
        NEW.reviewer_id, NEW.evidence_id;
    END IF;
  ELSE
    -- Superseding correction review requires ADMIN role (or assigned reviewer on a prior decision)
    IF v_reviewer_role <> 'ADMIN' AND v_assigned_reviewer_id IS DISTINCT FROM NEW.reviewer_id THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Only ADMIN or the assigned reviewer may record a superseding review correction.';
    END IF;
    IF v_current_status NOT IN ('ACCEPTED', 'REVISION_REQUESTED', 'REJECTED') THEN
      RAISE EXCEPTION 'INVALID_EVIDENCE_STATE: Superseding review requires evidence in ACCEPTED, REVISION_REQUESTED, or REJECTED state (current: %).',
        v_current_status;
    END IF;
  END IF;

  -- 6. Map decision to canonical evidence_submissions status
  v_mapped_status := CASE NEW.decision
    WHEN 'ACCEPT' THEN 'ACCEPTED'
    WHEN 'REQUEST_REVISION' THEN 'REVISION_REQUESTED'
    WHEN 'REJECT' THEN 'REJECTED'
  END;

  -- 7. Update parent evidence_submissions row
  UPDATE public.evidence_submissions
  SET status = v_mapped_status,
      verified_level = CASE WHEN NEW.decision = 'ACCEPT' THEN NEW.verified_level ELSE NULL END,
      assigned_reviewer_id = COALESCE(assigned_reviewer_id, NEW.reviewer_id),
      reviewed_at = NEW.decided_at,
      review_decision = pg_catalog.jsonb_build_object(
        'reviewId', NEW.id,
        'reviewerId', NEW.reviewer_id,
        'reviewerName', NEW.reviewer_name,
        'decision', NEW.decision,
        'verifiedLevel', NEW.verified_level,
        'rubricScores', pg_catalog.jsonb_build_object(
          'authenticity', NEW.authenticity_score,
          'technicalDepth', NEW.technical_depth_score,
          'executionQuality', NEW.execution_quality_score,
          'requirementAlignment', NEW.requirement_alignment_score
        ),
        'rationale', NEW.rationale,
        'isSupersedingCorrection', NEW.is_superseding_correction,
        'supersedesReviewId', NEW.supersedes_review_id,
        'decidedAt', NEW.decided_at
      ),
      updated_at = pg_catalog.now()
  WHERE id = NEW.evidence_id;

  -- 8. Recalculate student's verified capability levels
  PERFORM public.recalculate_student_verified_capabilities(v_student_id);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_validate_and_apply_review_decision() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_validate_and_apply_review_decision() TO service_role;

DROP TRIGGER IF EXISTS trg_02_validate_and_apply_review_decision ON public.review_records;
CREATE TRIGGER trg_02_validate_and_apply_review_decision
  AFTER INSERT ON public.review_records
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_validate_and_apply_review_decision();

-- 8.6 Trigger on evidence_submissions to recalculate capabilities on status/level changes
--     (Handles ACCEPTED -> EXPIRED, ACCEPTED -> REVOKED, etc.)
CREATE OR REPLACE FUNCTION public.trg_fn_recalc_capabilities_on_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_student_id UUID := COALESCE(NEW.student_id, OLD.student_id);
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_student_verified_capabilities(v_student_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'ACCEPTED' THEN
      PERFORM public.recalculate_student_verified_capabilities(v_student_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status
       OR OLD.verified_level IS DISTINCT FROM NEW.verified_level
       OR OLD.claimed_dimensions IS DISTINCT FROM NEW.claimed_dimensions THEN
      PERFORM public.recalculate_student_verified_capabilities(v_student_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_recalc_capabilities_on_evidence() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_recalc_capabilities_on_evidence() TO service_role;

DROP TRIGGER IF EXISTS trg_04_recalc_capabilities_on_evidence ON public.evidence_submissions;
CREATE TRIGGER trg_04_recalc_capabilities_on_evidence
  AFTER INSERT OR UPDATE OR DELETE ON public.evidence_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_recalc_capabilities_on_evidence();

-- -----------------------------------------------------------------------------
-- 9. OPPORTUNITIES, VERSIONED REQUIREMENTS, TARGETS & READINESS SNAPSHOTS
--    (Created WITHOUT field_id in Migration 001; field_id FK added in Migration 002)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NULL,
  title TEXT NOT NULL CHECK (pg_catalog.char_length(pg_catalog.btrim(title)) >= 3),
  organization TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN (
      'CAREER_PATHWAY',
      'INTERNSHIP_JOB',
      'COMPETITION',
      'PROJECT_CHALLENGE'
    )),
  location TEXT NOT NULL DEFAULT 'India',
  mode TEXT NOT NULL DEFAULT 'Hybrid'
    CHECK (mode IN ('Remote', 'Hybrid', 'On-site')),
  stipend_or_compensation TEXT NOT NULL DEFAULT 'Competitive',
  deadline DATE NOT NULL,
  version_label TEXT NOT NULL DEFAULT '1.0',
  current_version_id UUID NULL,
  summary TEXT NOT NULL,
  expected_outputs TEXT[] NOT NULL DEFAULT '{}',
  eligibility_criteria TEXT[] NOT NULL DEFAULT '{}',
  recommended_clusters TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NULL REFERENCES public.wayfinder_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_category_active
  ON public.opportunities(category, is_active);

DROP TRIGGER IF EXISTS trg_01_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER trg_01_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.opportunity_requirement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  version_label TEXT NOT NULL DEFAULT '1.0',
  requirements JSONB NOT NULL
    CHECK (pg_catalog.jsonb_typeof(requirements) = 'array'),
  change_summary TEXT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_opportunity_requirement_version UNIQUE (opportunity_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_req_versions_opp_id
  ON public.opportunity_requirement_versions(opportunity_id, version_number DESC);

-- Two-Step Idempotent FK Repair for opportunities.current_version_id (DEF-03)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conname = 'fk_opportunities_current_version'
      AND conrelid = 'public.opportunities'::regclass
  ) THEN
    ALTER TABLE public.opportunities
      ADD CONSTRAINT fk_opportunities_current_version
      FOREIGN KEY (current_version_id)
      REFERENCES public.opportunity_requirement_versions(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 9.2 Student Selected Targets (public.student_selected_targets)
CREATE TABLE IF NOT EXISTS public.student_selected_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  pinned_requirement_version_id UUID NOT NULL
    REFERENCES public.opportunity_requirement_versions(id) ON DELETE RESTRICT,
  priority_rank SMALLINT NOT NULL DEFAULT 1
    CHECK (priority_rank BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_student_selected_target UNIQUE (student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_student_selected_targets_student_active
  ON public.student_selected_targets(student_id, is_active);

-- 9.3 Deterministic Readiness Snapshots (public.readiness_snapshots)
CREATE TABLE IF NOT EXISTS public.readiness_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  requirement_version_id UUID NOT NULL
    REFERENCES public.opportunity_requirement_versions(id) ON DELETE RESTRICT,
  category TEXT NOT NULL
    CHECK (category IN (
      'READY_NOW',
      'NEAR_READY',
      'DEVELOPING',
      'EARLY_STAGE',
      'INSUFFICIENT_DATA'
    )),
  overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  confidence TEXT NOT NULL
    CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT')),
  mandatory_met BOOLEAN NOT NULL,
  blocking_reasons TEXT[] NOT NULL DEFAULT '{}',
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (pg_catalog.jsonb_typeof(gaps) = 'array'),
  strengths TEXT[] NOT NULL DEFAULT '{}',
  unknown_dimensions TEXT[] NOT NULL DEFAULT '{}',
  next_best_actions TEXT[] NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_student_opp_evaluated
  ON public.readiness_snapshots(student_id, opportunity_id, evaluated_at DESC);

-- Readiness snapshots are immutable historical records
DROP TRIGGER IF EXISTS trg_01_guard_readiness_snapshots_append_only ON public.readiness_snapshots;
CREATE TRIGGER trg_01_guard_readiness_snapshots_append_only
  BEFORE UPDATE OR DELETE ON public.readiness_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.guard_append_only_table();

-- -----------------------------------------------------------------------------
-- 10. COHORT RATE LIMITING & INSTITUTION-ISOLATED COHORT AGGREGATES
--     (DEF-09, DEF-14, DEF-19, DEF-20, DEF-21, DEF-23)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cohort_query_rate_limits (
  actor_id UUID PRIMARY KEY REFERENCES public.wayfinder_profiles(id) ON DELETE CASCADE,
  request_timestamps TIMESTAMPTZ[] NOT NULL DEFAULT '{}',
  total_permitted_count BIGINT NOT NULL DEFAULT 0,
  total_rejected_count BIGINT NOT NULL DEFAULT 0,
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  last_rejected_at TIMESTAMPTZ NULL
);

-- Note on Advisory Lock Semantics (DEF-20):
-- pg_advisory_xact_lock serializes concurrent transactions per actor_id so that
-- parallel requests cannot read the same stale timestamp array simultaneously.
-- PostgreSQL lock wait queues guarantee mutual exclusion per actor, not strict
-- arrival-time FIFO ordering across OS threads.
--
-- Note on Suppression Semantics (DEF-21 & DEF-23):
-- 1. Demonstrated and Verified capability averages are evaluated and suppressed
--    independently per dimension.
-- 2. When a filtered query (p_programme or p_graduation_year) is suppressed due
--    to small-sibling axis protection (SMALL_SIBLING_AXIS_SUPPRESSED), this
--    function returns NULL metrics for that filtered query; it does NOT
--    automatically substitute an unfiltered institution-wide aggregate unless
--    the caller explicitly passes (p_programme = NULL, p_graduation_year = NULL).
-- 3. Deterministic 5-student floor banding and 0.25-step rounding are applied;
--    formal epsilon-differential privacy is not claimed.
CREATE OR REPLACE FUNCTION public.get_institution_cohort_aggregates(
  p_programme TEXT DEFAULT NULL,
  p_graduation_year SMALLINT DEFAULT NULL,
  p_target_institution_id UUID DEFAULT NULL
)
RETURNS TABLE (
  institution_id UUID,
  programme_filter TEXT,
  graduation_year_filter SMALLINT,
  dimension_id TEXT,
  cohort_size_band INTEGER,
  assessed_dem_count_band INTEGER,
  avg_demonstrated_level NUMERIC(4,2),
  is_dem_suppressed BOOLEAN,
  dem_suppression_reason TEXT,
  assessed_ver_count_band INTEGER,
  avg_verified_level NUMERIC(4,2),
  is_ver_suppressed BOOLEAN,
  ver_suppression_reason TEXT,
  is_cell_suppressed BOOLEAN,
  cell_suppression_reason TEXT,
  is_rate_limited BOOLEAN
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_caller_uid UUID := auth.uid();
  v_caller_role TEXT;
  v_inst_id UUID;
  v_clean_prog TEXT := NULLIF(pg_catalog.btrim(p_programme), '');
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
  v_window_start TIMESTAMPTZ := v_now - INTERVAL '10 minutes';
  v_active_timestamps TIMESTAMPTZ[];
  v_n_inst INTEGER := 0;
  v_n_prog INTEGER := 0;
  v_n_year INTEGER := 0;
  v_n_cell INTEGER := 0;
  v_has_small_prog_sibling BOOLEAN := FALSE;
  v_has_small_year_sibling BOOLEAN := FALSE;
  v_has_small_cell_in_prog BOOLEAN := FALSE;
  v_has_small_cell_in_year BOOLEAN := FALSE;
  v_cell_suppress BOOLEAN := FALSE;
  v_cell_reason TEXT := 'OK';
BEGIN
  -- 1. Authentication & Role Check
  IF v_caller_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required for cohort analytics.';
  END IF;

  v_caller_role := public.current_wayfinder_role();
  IF v_caller_role NOT IN ('INSTITUTION', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN: Role % is not permitted to access cohort aggregates.', COALESCE(v_caller_role, 'NONE');
  END IF;

  -- 2. Strict Cross-Institution Isolation
  IF v_caller_role = 'INSTITUTION' THEN
    v_inst_id := public.current_wayfinder_institution();
    IF v_inst_id IS NULL THEN
      RAISE EXCEPTION 'FORBIDDEN: Institution account has no assigned institution_id.';
    END IF;
    IF p_target_institution_id IS NOT NULL AND p_target_institution_id <> v_inst_id THEN
      RAISE EXCEPTION 'FORBIDDEN: Cross-institution query rejected.';
    END IF;
  ELSE
    v_inst_id := COALESCE(p_target_institution_id, public.current_wayfinder_institution());
    IF v_inst_id IS NULL THEN
      RAISE EXCEPTION 'BAD_REQUEST: Admin must specify p_target_institution_id.';
    END IF;
  END IF;

  -- 3. Concurrency-Safe Per-Actor Rate Limiter (Max 20 permitted queries per rolling 10-minute window)
  PERFORM pg_catalog.pg_advisory_xact_lock(202611, pg_catalog.hashtext(v_caller_uid::text));

  INSERT INTO public.cohort_query_rate_limits (actor_id, request_timestamps, last_request_at)
  VALUES (v_caller_uid, '{}', v_now)
  ON CONFLICT (actor_id) DO NOTHING;

  SELECT ARRAY(
    SELECT ts
    FROM pg_catalog.unnest(rl.request_timestamps) AS ts
    WHERE ts >= v_window_start
    ORDER BY ts ASC
  )
  INTO v_active_timestamps
  FROM public.cohort_query_rate_limits rl
  WHERE rl.actor_id = v_caller_uid
  FOR UPDATE;

  IF COALESCE(pg_catalog.cardinality(v_active_timestamps), 0) >= 20 THEN
    -- Durably record rejected attempt without raising an exception that would roll back the transaction
    UPDATE public.cohort_query_rate_limits
    SET request_timestamps = v_active_timestamps,
        total_rejected_count = total_rejected_count + 1,
        last_rejected_at = v_now
    WHERE actor_id = v_caller_uid;

    INSERT INTO public.audit_events (
      actor_id, actor_role, action, target_entity, details, metadata
    ) VALUES (
      v_caller_uid,
      v_caller_role,
      'COHORT_AGGREGATE_RATE_LIMITED',
      'institution_cohort_aggregates',
      'Rejected: rolling 10-minute limit of 20 cohort queries exceeded',
      pg_catalog.jsonb_build_object(
        'institution_id', v_inst_id,
        'programme_filter', v_clean_prog,
        'graduation_year_filter', p_graduation_year,
        'window_count', pg_catalog.cardinality(v_active_timestamps)
      )
    );

    RETURN QUERY
    SELECT
      v_inst_id,
      v_clean_prog,
      p_graduation_year,
      d.dim_id,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::NUMERIC(4,2),
      TRUE,
      'RATE_LIMIT_EXCEEDED'::TEXT,
      NULL::INTEGER,
      NULL::NUMERIC(4,2),
      TRUE,
      'RATE_LIMIT_EXCEEDED'::TEXT,
      TRUE,
      'RATE_LIMIT_EXCEEDED'::TEXT,
      TRUE
    FROM (
      SELECT pg_catalog.unnest(ARRAY[
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
      ]) AS dim_id
    ) d
    ORDER BY d.dim_id;
    RETURN;
  END IF;

  UPDATE public.cohort_query_rate_limits
  SET request_timestamps = pg_catalog.array_append(v_active_timestamps, v_now),
      total_permitted_count = total_permitted_count + 1,
      last_request_at = v_now
  WHERE actor_id = v_caller_uid;

  -- 4. Compute Institution, Marginal, Cell, and Small-Sibling Counts
  WITH eligible_students AS (
    SELECT
      wp.id AS student_id,
      wp.programme,
      wp.graduation_year
    FROM public.wayfinder_profiles wp
    JOIN public.sharing_consents sc
      ON sc.student_id = wp.id
     AND sc.allow_anonymized_cohort_analytics = TRUE
     AND sc.share_readiness_with_institution = TRUE
    WHERE wp.role = 'STUDENT'
      AND wp.institution_id = v_inst_id
  ),
  prog_counts AS (
    SELECT programme, COUNT(*) AS cnt FROM eligible_students GROUP BY programme
  ),
  year_counts AS (
    SELECT graduation_year, COUNT(*) AS cnt FROM eligible_students GROUP BY graduation_year
  ),
  cell_counts AS (
    SELECT programme, graduation_year, COUNT(*) AS cnt
    FROM eligible_students
    GROUP BY programme, graduation_year
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM eligible_students),
    (SELECT COUNT(*)::INTEGER FROM eligible_students WHERE v_clean_prog IS NULL OR programme = v_clean_prog),
    (SELECT COUNT(*)::INTEGER FROM eligible_students WHERE p_graduation_year IS NULL OR graduation_year = p_graduation_year),
    (SELECT COUNT(*)::INTEGER FROM eligible_students
      WHERE (v_clean_prog IS NULL OR programme = v_clean_prog)
        AND (p_graduation_year IS NULL OR graduation_year = p_graduation_year)),
    EXISTS (SELECT 1 FROM prog_counts WHERE cnt BETWEEN 1 AND 4),
    EXISTS (SELECT 1 FROM year_counts WHERE cnt BETWEEN 1 AND 4),
    EXISTS (SELECT 1 FROM cell_counts WHERE v_clean_prog IS NOT NULL AND programme = v_clean_prog AND cnt BETWEEN 1 AND 4),
    EXISTS (SELECT 1 FROM cell_counts WHERE p_graduation_year IS NOT NULL AND graduation_year = p_graduation_year AND cnt BETWEEN 1 AND 4)
  INTO
    v_n_inst, v_n_prog, v_n_year, v_n_cell,
    v_has_small_prog_sibling, v_has_small_year_sibling,
    v_has_small_cell_in_prog, v_has_small_cell_in_year;

  -- 5. Evaluate Cell-Level Suppression (DEF-09 explicit parentheses + DEF-14 small-sibling axis suppression)
  IF (v_n_cell < 5) THEN
    v_cell_suppress := TRUE;
    v_cell_reason := 'DIRECT_CELL_BELOW_5';
  ELSIF (
    (v_clean_prog IS NOT NULL OR p_graduation_year IS NOT NULL)
    AND ((v_n_inst - v_n_cell) BETWEEN 1 AND 4)
  ) THEN
    v_cell_suppress := TRUE;
    v_cell_reason := 'INSTITUTION_COMPLEMENT_BELOW_5';
  ELSIF (
    (v_clean_prog IS NOT NULL AND p_graduation_year IS NOT NULL)
    AND (
      ((v_n_prog - v_n_cell) BETWEEN 1 AND 4)
      OR ((v_n_year - v_n_cell) BETWEEN 1 AND 4)
    )
  ) THEN
    v_cell_suppress := TRUE;
    v_cell_reason := 'MARGINAL_COMPLEMENT_BELOW_5';
  ELSIF (
    (v_clean_prog IS NOT NULL AND p_graduation_year IS NULL AND v_has_small_prog_sibling)
    OR (v_clean_prog IS NULL AND p_graduation_year IS NOT NULL AND v_has_small_year_sibling)
    OR (v_clean_prog IS NOT NULL AND p_graduation_year IS NOT NULL AND (v_has_small_cell_in_prog OR v_has_small_cell_in_year))
  ) THEN
    v_cell_suppress := TRUE;
    v_cell_reason := 'SMALL_SIBLING_AXIS_SUPPRESSED';
  END IF;

  -- 6. Audit Log Permitted Query
  INSERT INTO public.audit_events (
    actor_id, actor_role, action, target_entity, details, metadata
  ) VALUES (
    v_caller_uid,
    v_caller_role,
    'COHORT_AGGREGATE_QUERY',
    'institution_cohort_aggregates',
    CASE WHEN v_cell_suppress THEN 'Cell suppressed (' || v_cell_reason || ')' ELSE 'Evaluated per-dimension cohort metrics' END,
    pg_catalog.jsonb_build_object(
      'institution_id', v_inst_id,
      'programme_filter', v_clean_prog,
      'graduation_year_filter', p_graduation_year,
      'cell_suppressed', v_cell_suppress,
      'cell_reason', v_cell_reason
    )
  );

  -- 7. Return Independent Demonstrated & Verified Suppression per Dimension (DEF-21)
  RETURN QUERY
  WITH canonical_dims AS (
    SELECT pg_catalog.unnest(ARRAY[
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
    ]) AS dim_id
  ),
  cell_students AS (
    SELECT wp.id AS student_id
    FROM public.wayfinder_profiles wp
    JOIN public.sharing_consents sc
      ON sc.student_id = wp.id
     AND sc.allow_anonymized_cohort_analytics = TRUE
     AND sc.share_readiness_with_institution = TRUE
    WHERE wp.role = 'STUDENT'
      AND wp.institution_id = v_inst_id
      AND (v_clean_prog IS NULL OR wp.programme = v_clean_prog)
      AND (p_graduation_year IS NULL OR wp.graduation_year = p_graduation_year)
  ),
  dim_stats AS (
    SELECT
      cd.dim_id,
      COUNT(cr.demonstrated_level)::INTEGER AS dem_n,
      COUNT(cr.verified_evidence_level)::INTEGER AS ver_n,
      AVG(cr.demonstrated_level) AS raw_dem_avg,
      AVG(cr.verified_evidence_level) AS raw_ver_avg
    FROM canonical_dims cd
    LEFT JOIN public.capability_records cr
      ON cr.dimension_id = cd.dim_id
     AND cr.student_id IN (SELECT student_id FROM cell_students)
    GROUP BY cd.dim_id
  ),
  evaluated_dims AS (
    SELECT
      ds.dim_id,
      ds.dem_n,
      ds.ver_n,
      ds.raw_dem_avg,
      ds.raw_ver_avg,
      (
        v_cell_suppress
        OR ds.dem_n < 5
        OR ((v_n_cell - ds.dem_n) BETWEEN 1 AND 4)
      ) AS dem_suppressed,
      CASE
        WHEN v_cell_suppress THEN v_cell_reason
        WHEN ds.dem_n < 5 THEN 'DEMONSTRATED_COUNT_BELOW_5'
        WHEN ((v_n_cell - ds.dem_n) BETWEEN 1 AND 4) THEN 'DEMONSTRATED_UNASSESSED_COMPLEMENT_BELOW_5'
        ELSE 'OK'
      END AS dem_reason,
      (
        v_cell_suppress
        OR ds.ver_n < 5
        OR ((v_n_cell - ds.ver_n) BETWEEN 1 AND 4)
      ) AS ver_suppressed,
      CASE
        WHEN v_cell_suppress THEN v_cell_reason
        WHEN ds.ver_n < 5 THEN 'VERIFIED_COUNT_BELOW_5'
        WHEN ((v_n_cell - ds.ver_n) BETWEEN 1 AND 4) THEN 'VERIFIED_UNVERIFIED_COMPLEMENT_BELOW_5'
        ELSE 'OK'
      END AS ver_reason
    FROM dim_stats ds
  )
  SELECT
    v_inst_id AS institution_id,
    v_clean_prog AS programme_filter,
    p_graduation_year AS graduation_year_filter,
    ed.dim_id AS dimension_id,
    CASE WHEN v_cell_suppress THEN NULL ELSE ((v_n_cell / 5) * 5)::INTEGER END AS cohort_size_band,
    CASE WHEN ed.dem_suppressed THEN NULL ELSE ((ed.dem_n / 5) * 5)::INTEGER END AS assessed_dem_count_band,
    CASE WHEN ed.dem_suppressed THEN NULL ELSE pg_catalog.round(pg_catalog.round(ed.raw_dem_avg * 4.0) / 4.0, 2) END AS avg_demonstrated_level,
    ed.dem_suppressed AS is_dem_suppressed,
    ed.dem_reason AS dem_suppression_reason,
    CASE WHEN ed.ver_suppressed THEN NULL ELSE ((ed.ver_n / 5) * 5)::INTEGER END AS assessed_ver_count_band,
    CASE WHEN ed.ver_suppressed THEN NULL ELSE pg_catalog.round(pg_catalog.round(ed.raw_ver_avg * 4.0) / 4.0, 2) END AS avg_verified_level,
    ed.ver_suppressed AS is_ver_suppressed,
    ed.ver_reason AS ver_suppression_reason,
    v_cell_suppress AS is_cell_suppressed,
    v_cell_reason AS cell_suppression_reason,
    FALSE AS is_rate_limited
  FROM evaluated_dims ed
  ORDER BY ed.dim_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_institution_cohort_aggregates(TEXT, SMALLINT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_cohort_aggregates(TEXT, SMALLINT, UUID) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS), FORCE RLS & EXPLICIT TABLE PRIVILEGES
-- -----------------------------------------------------------------------------

-- Enable & Force RLS on all 13 Migration 001 tables
ALTER TABLE public.wayfinder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wayfinder_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.capability_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capability_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.interest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.aptitude_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_answer_keys FORCE ROW LEVEL SECURITY;

ALTER TABLE public.aptitude_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_attempts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.evidence_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_submissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities FORCE ROW LEVEL SECURITY;

ALTER TABLE public.opportunity_requirement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_requirement_versions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.student_selected_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_selected_targets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.readiness_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_snapshots FORCE ROW LEVEL SECURITY;

ALTER TABLE public.sharing_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_consents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cohort_query_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_query_rate_limits FORCE ROW LEVEL SECURITY;

-- Revoke all default PUBLIC and anon privileges across all Migration 001 tables
REVOKE ALL PRIVILEGES ON TABLE
  public.wayfinder_profiles,
  public.capability_records,
  public.interest_profiles,
  public.aptitude_answer_keys,
  public.aptitude_attempts,
  public.evidence_submissions,
  public.review_records,
  public.opportunities,
  public.opportunity_requirement_versions,
  public.student_selected_targets,
  public.readiness_snapshots,
  public.sharing_consents,
  public.audit_events,
  public.cohort_query_rate_limits
FROM PUBLIC, anon, authenticated;

-- Grant full table access to service_role (subject to append-only triggers on review_records/audit_events/readiness_snapshots)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.wayfinder_profiles,
  public.capability_records,
  public.interest_profiles,
  public.aptitude_answer_keys,
  public.aptitude_attempts,
  public.evidence_submissions,
  public.opportunities,
  public.opportunity_requirement_versions,
  public.student_selected_targets,
  public.sharing_consents,
  public.cohort_query_rate_limits
TO service_role;

GRANT SELECT, INSERT ON TABLE
  public.review_records,
  public.readiness_snapshots,
  public.audit_events
TO service_role;

-- Grant least-privilege table operations to authenticated role (governed by RLS + column-guard triggers)
-- Note: aptitude_answer_keys and cohort_query_rate_limits receive ZERO grants to authenticated.
GRANT SELECT, UPDATE ON TABLE public.wayfinder_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.capability_records TO authenticated;
GRANT SELECT, INSERT ON TABLE public.interest_profiles TO authenticated;
GRANT SELECT ON TABLE public.aptitude_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evidence_submissions TO authenticated;
GRANT SELECT ON TABLE public.review_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.opportunity_requirement_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_selected_targets TO authenticated;
GRANT SELECT ON TABLE public.readiness_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sharing_consents TO authenticated;
GRANT SELECT ON TABLE public.audit_events TO authenticated;

-- 11.1 Policies for public.wayfinder_profiles
DROP POLICY IF EXISTS wayfinder_profiles_select ON public.wayfinder_profiles;
CREATE POLICY wayfinder_profiles_select
  ON public.wayfinder_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
    OR (
      -- Reviewers can view minimal profile identity only for students whose evidence is actively assigned to them
      public.current_wayfinder_role() = 'REVIEWER'
      AND EXISTS (
        SELECT 1
        FROM public.evidence_submissions es
        WHERE es.student_id = public.wayfinder_profiles.id
          AND es.assigned_reviewer_id = auth.uid()
          AND es.status IN ('ASSIGNED_FOR_REVIEW', 'UNDER_REVIEW')
      )
    )
  );

DROP POLICY IF EXISTS wayfinder_profiles_update ON public.wayfinder_profiles;
CREATE POLICY wayfinder_profiles_update
  ON public.wayfinder_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  )
  WITH CHECK (
    id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

-- 11.2 Policies for public.capability_records
DROP POLICY IF EXISTS capability_records_select ON public.capability_records;
CREATE POLICY capability_records_select
  ON public.capability_records
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
    OR (
      public.current_wayfinder_role() = 'REVIEWER'
      AND EXISTS (
        SELECT 1
        FROM public.evidence_submissions es
        WHERE es.student_id = public.capability_records.student_id
          AND es.assigned_reviewer_id = auth.uid()
          AND es.status IN ('ASSIGNED_FOR_REVIEW', 'UNDER_REVIEW')
      )
    )
  );

DROP POLICY IF EXISTS capability_records_insert_own ON public.capability_records;
CREATE POLICY capability_records_insert_own
  ON public.capability_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
    AND objective_score_level IS NULL
    AND verified_evidence_level IS NULL
  );

DROP POLICY IF EXISTS capability_records_update_own ON public.capability_records;
CREATE POLICY capability_records_update_own
  ON public.capability_records
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
  )
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
  );

-- 11.3 Policies for public.interest_profiles
DROP POLICY IF EXISTS interest_profiles_select ON public.interest_profiles;
CREATE POLICY interest_profiles_select
  ON public.interest_profiles
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

DROP POLICY IF EXISTS interest_profiles_insert_own ON public.interest_profiles;
CREATE POLICY interest_profiles_insert_own
  ON public.interest_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
  );

-- 11.4 Policies for public.aptitude_answer_keys
-- INTENTIONALLY ZERO POLICIES: Only service_role can read aptitude_answer_keys.

-- 11.5 Policies for public.aptitude_attempts
DROP POLICY IF EXISTS aptitude_attempts_select ON public.aptitude_attempts;
CREATE POLICY aptitude_attempts_select
  ON public.aptitude_attempts
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

-- 11.6 Policies for public.evidence_submissions
-- Strictly enforces that reviewers can ONLY read evidence assigned to them through
-- an active assignment (status IN ('ASSIGNED_FOR_REVIEW', 'UNDER_REVIEW')).
DROP POLICY IF EXISTS evidence_submissions_select ON public.evidence_submissions;
CREATE POLICY evidence_submissions_select
  ON public.evidence_submissions
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
    OR (
      public.current_wayfinder_role() = 'REVIEWER'
      AND student_id <> auth.uid()
      AND assigned_reviewer_id = auth.uid()
      AND status IN ('ASSIGNED_FOR_REVIEW', 'UNDER_REVIEW')
    )
  );

DROP POLICY IF EXISTS evidence_submissions_insert_student ON public.evidence_submissions;
CREATE POLICY evidence_submissions_insert_student
  ON public.evidence_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
    AND status IN ('DRAFT', 'SUBMITTED')
    AND verified_level IS NULL
    AND assigned_reviewer_id IS NULL
    AND review_decision IS NULL
    AND reviewed_at IS NULL
  );

DROP POLICY IF EXISTS evidence_submissions_update_student ON public.evidence_submissions;
CREATE POLICY evidence_submissions_update_student
  ON public.evidence_submissions
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
    AND status IN ('DRAFT', 'REVISION_REQUESTED', 'TECHNICAL_VALIDATION_FAILED')
  )
  WITH CHECK (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
    AND status IN ('DRAFT', 'SUBMITTED')
    AND verified_level IS NULL
  );

DROP POLICY IF EXISTS evidence_submissions_delete_draft ON public.evidence_submissions;
CREATE POLICY evidence_submissions_delete_draft
  ON public.evidence_submissions
  FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
    AND public.current_wayfinder_role() = 'STUDENT'
    AND status = 'DRAFT'
  );

-- 11.7 Policies for public.review_records (Read-Only to authenticated; Inserted by service_role)
DROP POLICY IF EXISTS review_records_select ON public.review_records;
CREATE POLICY review_records_select
  ON public.review_records
  FOR SELECT
  TO authenticated
  USING (
    public.current_wayfinder_role() = 'ADMIN'
    OR reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.evidence_submissions es
      WHERE es.id = public.review_records.evidence_id
        AND es.student_id = auth.uid()
    )
  );

-- 11.8 Policies for public.opportunities & public.opportunity_requirement_versions
DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
CREATE POLICY opportunities_select
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    OR public.current_wayfinder_role() = 'ADMIN'
  );

DROP POLICY IF EXISTS opportunities_admin_write ON public.opportunities;
CREATE POLICY opportunities_admin_write
  ON public.opportunities
  FOR ALL
  TO authenticated
  USING (public.current_wayfinder_role() = 'ADMIN')
  WITH CHECK (public.current_wayfinder_role() = 'ADMIN');

DROP POLICY IF EXISTS opportunity_req_versions_select ON public.opportunity_requirement_versions;
CREATE POLICY opportunity_req_versions_select
  ON public.opportunity_requirement_versions
  FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS opportunity_req_versions_admin_write ON public.opportunity_requirement_versions;
CREATE POLICY opportunity_req_versions_admin_write
  ON public.opportunity_requirement_versions
  FOR ALL
  TO authenticated
  USING (public.current_wayfinder_role() = 'ADMIN')
  WITH CHECK (public.current_wayfinder_role() = 'ADMIN');

-- 11.9 Policies for public.student_selected_targets
DROP POLICY IF EXISTS student_selected_targets_own ON public.student_selected_targets;
CREATE POLICY student_selected_targets_own
  ON public.student_selected_targets
  FOR ALL
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  )
  WITH CHECK (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

-- 11.10 Policies for public.readiness_snapshots
DROP POLICY IF EXISTS readiness_snapshots_select ON public.readiness_snapshots;
CREATE POLICY readiness_snapshots_select
  ON public.readiness_snapshots
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

-- 11.11 Policies for public.sharing_consents
DROP POLICY IF EXISTS sharing_consents_own ON public.sharing_consents;
CREATE POLICY sharing_consents_own
  ON public.sharing_consents
  FOR ALL
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  )
  WITH CHECK (
    student_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

-- 11.12 Policies for public.audit_events
DROP POLICY IF EXISTS audit_events_select ON public.audit_events;
CREATE POLICY audit_events_select
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (
    actor_id = auth.uid()
    OR public.current_wayfinder_role() = 'ADMIN'
  );

-- -----------------------------------------------------------------------------
-- 12. PRIVATE STORAGE BUCKET ('evidence-artifacts') & STORAGE OBJECT POLICIES
--     - Private bucket (public = FALSE)
--     - 50 MB limit (52,428,800 bytes)
--     - Approved MIME types only
--     - Exact user-folder ownership + exact DB storage_object_path match
--     - Reviewer & Admin file access uses server-generated signed URLs ONLY
--       (zero direct Reviewer/Admin storage.objects policies)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-artifacts',
  'evidence-artifacts',
  FALSE,
  52428800,
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/zip',
    'text/markdown',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 12.1 Student Read Own Evidence Object (bound to own folder and existing DB record)
DROP POLICY IF EXISTS evidence_storage_student_select ON storage.objects;
CREATE POLICY evidence_storage_student_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'evidence-artifacts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.evidence_submissions es
      WHERE es.id::text = (storage.foldername(name))[2]
        AND es.student_id = auth.uid()
        AND es.storage_object_path = storage.objects.name
    )
  );

-- 12.2 Student Upload Evidence Object (only while linked DB record is in editable state)
DROP POLICY IF EXISTS evidence_storage_student_insert ON storage.objects;
CREATE POLICY evidence_storage_student_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'evidence-artifacts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.evidence_submissions es
      WHERE es.id::text = (storage.foldername(name))[2]
        AND es.student_id = auth.uid()
        AND es.storage_object_path = storage.objects.name
        AND es.status IN ('DRAFT', 'REVISION_REQUESTED', 'TECHNICAL_VALIDATION_FAILED')
    )
  );

-- 12.3 Student Replace Evidence Object (only while linked DB record is in editable state)
DROP POLICY IF EXISTS evidence_storage_student_update ON storage.objects;
CREATE POLICY evidence_storage_student_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'evidence-artifacts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.evidence_submissions es
      WHERE es.id::text = (storage.foldername(name))[2]
        AND es.student_id = auth.uid()
        AND es.storage_object_path = storage.objects.name
        AND es.status IN ('DRAFT', 'REVISION_REQUESTED', 'TECHNICAL_VALIDATION_FAILED')
    )
  )
  WITH CHECK (
    bucket_id = 'evidence-artifacts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.evidence_submissions es
      WHERE es.id::text = (storage.foldername(name))[2]
        AND es.student_id = auth.uid()
        AND es.storage_object_path = storage.objects.name
        AND es.status IN ('DRAFT', 'REVISION_REQUESTED', 'TECHNICAL_VALIDATION_FAILED')
    )
  );

-- 12.4 Student Delete Evidence Object (only while linked DB record is in DRAFT or TECHNICAL_VALIDATION_FAILED)
DROP POLICY IF EXISTS evidence_storage_student_delete ON storage.objects;
CREATE POLICY evidence_storage_student_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'evidence-artifacts'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.evidence_submissions es
      WHERE es.id::text = (storage.foldername(name))[2]
        AND es.student_id = auth.uid()
        AND es.storage_object_path = storage.objects.name
        AND es.status IN ('DRAFT', 'TECHNICAL_VALIDATION_FAILED')
    )
  );

-- -----------------------------------------------------------------------------
-- 13. SERVER-ONLY MACRO APTITUDE ANSWER KEY SEED DATA
--     (Accessible exclusively to service_role via netlify/functions/wayfinder-api.ts)
-- -----------------------------------------------------------------------------
INSERT INTO public.aptitude_answer_keys (question_id, dimension_id, correct_option_index, difficulty_weight, scoring_rationale)
VALUES
  ('apt-q1',  'QUANTITATIVE_REASONING',          1, 2, 'Compound growth & ratio normalization'),
  ('apt-q2',  'QUANTITATIVE_REASONING',          2, 3, 'Conditional probability & Bayes update'),
  ('apt-q3',  'LOGICAL_PROBLEM_SOLVING',         0, 2, 'Constraint satisfaction & dependency ordering'),
  ('apt-q4',  'LOGICAL_PROBLEM_SOLVING',         2, 3, ' Necessary vs sufficient condition deduction'),
  ('apt-q5',  'VERBAL_ANALYTICAL_COMMUNICATION', 1, 2, 'Identifying unstated premise in technical memo'),
  ('apt-q6',  'VERBAL_ANALYTICAL_COMMUNICATION', 3, 3, 'Synthesizing conflicting stakeholder trade-offs'),
  ('apt-q7',  'PROJECT_EXECUTION',               1, 2, 'Critical-path bottleneck triage under deadline'),
  ('apt-q8',  'PROJECT_EXECUTION',               0, 3, 'Scope-quality-risk trade-off governance'),
  ('apt-q9',  'DOMAIN_FOUNDATIONS',              2, 2, 'Algorithmic time/space complexity trade-off'),
  ('apt-q10', 'DOMAIN_FOUNDATIONS',              1, 3, 'Distributed system failure isolation')
ON CONFLICT (question_id) DO UPDATE
SET dimension_id = EXCLUDED.dimension_id,
    correct_option_index = EXCLUDED.correct_option_index,
    difficulty_weight = EXCLUDED.difficulty_weight,
    scoring_rationale = EXCLUDED.scoring_rationale;

COMMIT;
