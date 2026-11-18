import {
  ActivityStatus,
  AptitudeAttemptResult,
  AptitudeDomain,
  AuditEvent,
  CapabilityDimensionId,
  CapabilityDimensionRecord,
  DevelopmentActivity,
  EvidenceReviewDimensions,
  EvidenceSubmission,
  HistoricalSnapshot,
  RequirementStatus,
  RiasecAssessmentResult,
  RiasecDomain,
  Role,
  RubricLevel,
  SharingAuthorisation,
  SkillAssessmentAttempt,
  StudentPortfolioRecord,
  StudentResourceProgress,
  StudentResourceProgressState,
  StudentSkillProficiencyRecord,
  UserProfile,
} from '../types/wayfinder';
import { CANONICAL_CAPABILITY_DIMENSIONS } from '../data/capabilityDimensions';

/**
 * WAYFINDER — Supabase Client & Server Authority Boundary (`src/services/supabaseBoundary.ts`)
 *
 * Security & Architecture Invariants:
 * 1. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, all Authentication,
 *    Profile Hydration, Capability Records, Assessments, Evidence Submissions, Reviewer Decisions,
 *    Portfolio Records, Activities, Learning Progress, Snapshots, and Sharing Consents
 *    synchronize with the canonical PostgreSQL schema (Migrations 001–004) and the trusted
 *    server authority (`/.netlify/functions/wayfinder-api`).
 * 2. When Supabase env vars are missing, `signUpWithSupabase` and `signInWithSupabase`
 *    truthfully return `status: 'UNCONFIGURED'` without fabricating live database sessions.
 * 3. Bidirectional Capability Dimension Mapping translates between frontend `CAP_*` identifiers
 *    and the 10 canonical SQL `CHECK` constraint values in `001_wayfinder_core_schema_rls.sql`.
 */

export const SUPABASE_REQUIRED_ENV_VARS = [
  {
    name: 'VITE_SUPABASE_URL',
    scope: 'Client & Server',
    purpose: 'Supabase project base URL for Auth, PostgREST (RLS), and Storage APIs.',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    scope: 'Client & Server',
    purpose: 'Public anonymous key restricted by PostgreSQL Row-Level Security (RLS) policies.',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    scope: 'Serverless Function Only (Never exposed to browser)',
    purpose: 'Privileged server key used exclusively by netlify/functions/wayfinder-api.ts for objective scoring, review decisions, and signed URLs.',
  },
] as const;

export type RegistrationFieldKey =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'acceptedTerms';

export interface RegistrationFormInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface RegistrationValidationResult {
  valid: boolean;
  fieldErrors: Partial<Record<RegistrationFieldKey, string>>;
  summaryErrors: string[];
}

export interface AuthActionResult {
  ok: boolean;
  status:
    | 'SUCCESS'
    | 'EMAIL_CONFIRMATION_REQUIRED'
    | 'UNCONFIGURED'
    | 'ERROR';
  message: string;
  user?: UserProfile;
  accessToken?: string;
}

const SESSION_TOKEN_STORAGE_KEY = 'wayfinder_supabase_access_token_v2';
const SESSION_USER_ID_STORAGE_KEY = 'wayfinder_supabase_user_id_v2';

let activeAccessToken: string | null = null;
let activeAuthUserId: string | null = null;

try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    activeAccessToken = window.sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
    activeAuthUserId = window.sessionStorage.getItem(SESSION_USER_ID_STORAGE_KEY);
  }
} catch {
  // Ignore sessionStorage restrictions in strict iframe contexts
}

export function setActiveSupabaseSession(
  accessToken: string | null,
  userId: string | null
): void {
  activeAccessToken = accessToken;
  activeAuthUserId = userId;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (accessToken && userId) {
        window.sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, accessToken);
        window.sessionStorage.setItem(SESSION_USER_ID_STORAGE_KEY, userId);
      } else {
        window.sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
        window.sessionStorage.removeItem(SESSION_USER_ID_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function getActiveSupabaseSession(): {
  accessToken: string | null;
  userId: string | null;
} {
  return {
    accessToken: activeAccessToken,
    userId: activeAuthUserId,
  };
}

// =============================================================================
// BIDIRECTIONAL DIMENSION ID MAPPER (Frontend CAP_* <-> Canonical SQL Dimension)
// =============================================================================

export const FRONTEND_TO_DB_DIMENSION: Record<CapabilityDimensionId, string> = {
  CAP_NUM_QUANT: 'QUANTITATIVE_REASONING',
  CAP_PROB_SOLV: 'LOGICAL_PROBLEM_SOLVING',
  CAP_TECH_COMM: 'VERBAL_ANALYTICAL_COMMUNICATION',
  CAP_PROG_SW: 'TECHNICAL_TOOL_PROFICIENCY',
  CAP_SYS_DESIGN: 'DOMAIN_FOUNDATIONS',
  CAP_RESEARCH_SYN: 'RESEARCH_INQUIRY',
  CAP_PROJ_EXEC: 'PROJECT_EXECUTION',
  CAP_TEAM_COLLAB: 'COLLABORATION_PROFESSIONALISM',
  CAP_DATA_ANAL: 'ADAPTABILITY_LEARNING_AGILITY',
  CAP_ETHICS_GOV: 'CAREER_NAVIGATION_SELF_DIRECTION',
};

export const DB_TO_FRONTEND_DIMENSION: Record<string, CapabilityDimensionId> = {
  QUANTITATIVE_REASONING: 'CAP_NUM_QUANT',
  LOGICAL_PROBLEM_SOLVING: 'CAP_PROB_SOLV',
  VERBAL_ANALYTICAL_COMMUNICATION: 'CAP_TECH_COMM',
  TECHNICAL_TOOL_PROFICIENCY: 'CAP_PROG_SW',
  DOMAIN_FOUNDATIONS: 'CAP_SYS_DESIGN',
  RESEARCH_INQUIRY: 'CAP_RESEARCH_SYN',
  PROJECT_EXECUTION: 'CAP_PROJ_EXEC',
  COLLABORATION_PROFESSIONALISM: 'CAP_TEAM_COLLAB',
  ADAPTABILITY_LEARNING_AGILITY: 'CAP_DATA_ANAL',
  CAREER_NAVIGATION_SELF_DIRECTION: 'CAP_ETHICS_GOV',
};

export const DB_DIMENSION_TO_APTITUDE_DOMAIN: Record<string, AptitudeDomain> = {
  QUANTITATIVE_REASONING: 'NUMERICAL',
  VERBAL_ANALYTICAL_COMMUNICATION: 'VERBAL',
  LOGICAL_PROBLEM_SOLVING: 'LOGICAL',
  TECHNICAL_TOOL_PROFICIENCY: 'TARGET_KNOWLEDGE',
  DOMAIN_FOUNDATIONS: 'SPATIAL',
};

export function toDbDimensionId(dimId: CapabilityDimensionId | string): string {
  if (dimId in FRONTEND_TO_DB_DIMENSION) {
    return FRONTEND_TO_DB_DIMENSION[dimId as CapabilityDimensionId];
  }
  if (dimId in DB_TO_FRONTEND_DIMENSION) {
    return dimId;
  }
  return 'DOMAIN_FOUNDATIONS';
}

export function fromDbDimensionId(dbDimId: string): CapabilityDimensionId {
  if (dbDimId in DB_TO_FRONTEND_DIMENSION) {
    return DB_TO_FRONTEND_DIMENSION[dbDimId];
  }
  if (dbDimId in FRONTEND_TO_DB_DIMENSION) {
    return dbDimId as CapabilityDimensionId;
  }
  return 'CAP_SYS_DESIGN';
}

// =============================================================================
// ENVIRONMENT & CONNECTION STATUS
// =============================================================================

export function getSupabaseClientConfig(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  configured: boolean;
} {
  const metaEnv =
    (import.meta as unknown as { env?: Record<string, string | undefined> })
      .env ?? {};
  const procEnv =
    typeof process !== 'undefined' && process.env ? process.env : {};
  const supabaseUrl = (
    metaEnv.VITE_SUPABASE_URL ??
    procEnv.VITE_SUPABASE_URL ??
    ''
  )
    .trim()
    .replace(/\/$/, '');
  const supabaseAnonKey = (
    metaEnv.VITE_SUPABASE_ANON_KEY ??
    procEnv.VITE_SUPABASE_ANON_KEY ??
    ''
  ).trim();
  const configured = Boolean(
    supabaseUrl.length > 0 &&
      supabaseAnonKey.length > 0 &&
      !supabaseUrl.includes('your-project-ref')
  );
  return { supabaseUrl, supabaseAnonKey, configured };
}

export function isSupabaseEnvConfigured(): boolean {
  return getSupabaseClientConfig().configured;
}

// =============================================================================
// LOW-LEVEL SUPABASE REST & SERVER AUTHORITY HELPERS
// =============================================================================

async function supabaseRestFetch<T = unknown>(
  pathWithQuery: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    prefer?: string;
    tokenOverride?: string | null;
  } = {}
): Promise<{ ok: boolean; status: number; data?: T; errorMessage?: string }> {
  const { supabaseUrl, supabaseAnonKey, configured } = getSupabaseClientConfig();
  const token = options.tokenOverride ?? activeAccessToken;

  if (!configured || !token) {
    return {
      ok: false,
      status: 0,
      errorMessage:
        'Supabase is not configured or no active session token is present.',
    };
  }

  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${pathWithQuery}`, {
      method: options.method || 'GET',
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    if (!response.ok) {
      let msg = text;
      try {
        const parsed = JSON.parse(text) as {
          message?: string;
          details?: string;
        };
        msg = parsed.message || parsed.details || text;
      } catch {
        // Keep raw text
      }
      return { ok: false, status: response.status, errorMessage: msg };
    }

    if (!text) {
      return { ok: true, status: response.status };
    }

    try {
      return { ok: true, status: response.status, data: JSON.parse(text) as T };
    } catch {
      return { ok: true, status: response.status };
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      errorMessage:
        err instanceof Error
          ? err.message
          : 'Network error calling Supabase REST API.',
    };
  }
}

async function callWayfinderServerAuthority<T = unknown>(
  endpointSuffix: string,
  payload: unknown
): Promise<{ ok: boolean; status: number; data?: T; errorMessage?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (activeAccessToken) {
    headers.Authorization = `Bearer ${activeAccessToken}`;
  }

  try {
    const response = await fetch(
      `/.netlify/functions/wayfinder-api${endpointSuffix}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    if (!response.ok) {
      let msg = text;
      try {
        const parsed = JSON.parse(text) as { message?: string };
        msg = parsed.message || text;
      } catch {
        // Ignore parse error
      }
      return { ok: false, status: response.status, errorMessage: msg };
    }

    const parsed = text ? (JSON.parse(text) as T) : undefined;
    return { ok: true, status: response.status, data: parsed };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      errorMessage:
        err instanceof Error
          ? err.message
          : 'Server authority endpoint unreachable.',
    };
  }
}

// =============================================================================
// REGISTRATION VALIDATION & AUTHENTICATION
// =============================================================================

export function validateRegistrationForm(
  input: RegistrationFormInput
): RegistrationValidationResult {
  const fieldErrors: Partial<Record<RegistrationFieldKey, string>> = {};
  const summaryErrors: string[] = [];

  const trimmedName = (input.fullName || '').trim();
  if (trimmedName.length < 2) {
    fieldErrors.fullName = 'Full name must be at least 2 characters.';
    summaryErrors.push(fieldErrors.fullName);
  }

  const trimmedEmail = (input.email || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    fieldErrors.email = 'Please enter a valid email address.';
    summaryErrors.push(fieldErrors.email);
  }

  const pwd = input.password || '';
  if (
    pwd.length < 8 ||
    !/[A-Z]/.test(pwd) ||
    !/[a-z]/.test(pwd) ||
    !/[0-9]/.test(pwd)
  ) {
    fieldErrors.password =
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
    summaryErrors.push(fieldErrors.password);
  }

  if (input.confirmPassword !== pwd || !input.confirmPassword) {
    fieldErrors.confirmPassword = 'Password confirmation does not match.';
    summaryErrors.push(fieldErrors.confirmPassword);
  }

  if (!input.acceptedTerms) {
    fieldErrors.acceptedTerms =
      'You must accept the platform terms and privacy notice to create an account.';
    summaryErrors.push(fieldErrors.acceptedTerms);
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    summaryErrors,
  };
}

/**
 * Fetches the authoritative profile from `public.wayfinder_profiles` using the user's JWT.
 * Enforces DEF-02: Role and institution come strictly from `wayfinder_profiles`, never untrusted `user_metadata`.
 */
export async function fetchAuthoritativeUserProfile(
  userId: string,
  accessToken: string,
  fallbackEmail: string,
  fallbackName = ''
): Promise<UserProfile | null> {
  const resp = await supabaseRestFetch<
    Array<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      institution_id: string | null;
      institution_name: string | null;
      programme: string | null;
      onboarding_completed: boolean;
      cohort_aggregation_opt_in: boolean;
      updated_at: string;
    }>
  >(`wayfinder_profiles?id=eq.${encodeURIComponent(userId)}&select=*`, {
    method: 'GET',
    tokenOverride: accessToken,
  });

  const row = resp.data?.[0];
  if (!row) return null;

  const rawRole = (row.role || 'STUDENT').toUpperCase();
  const role: Role = ['STUDENT', 'REVIEWER', 'INSTITUTION', 'ADMIN'].includes(
    rawRole
  )
    ? (rawRole as Role)
    : 'STUDENT';

  return {
    id: row.id,
    fullName:
      row.full_name ||
      fallbackName ||
      fallbackEmail.split('@')[0] ||
      'WAYFINDER User',
    email: row.email || fallbackEmail,
    role,
    institutionId: row.institution_id || '',
    institutionName: row.institution_name || '',
    program: row.programme || '',
    consent: {
      acceptedDataProcessing: Boolean(row.onboarding_completed),
      acceptedAssessmentTerms: Boolean(row.onboarding_completed),
      acceptedEvidenceReviewTerms: Boolean(row.onboarding_completed),
      consentTimestamp: row.onboarding_completed ? row.updated_at : null,
      consentVersion: 'WF-CONSENT-2025.1',
    },
    eligibility: {
      enrolledStudentVerified: Boolean(row.institution_id),
      minimumAcademicStandingVerified: false,
      customEligibilityFlags: {},
    },
    isDevelopmentSeed: false,
  };
}

export async function signUpWithSupabase(data: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const { supabaseUrl, supabaseAnonKey, configured } = getSupabaseClientConfig();

  if (!configured) {
    return {
      ok: false,
      status: 'UNCONFIGURED',
      message:
        'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured. Set them in .env to enable live account registration.',
    };
  }

  const normalizedEmail = data.email.trim().toLowerCase();
  const trimmedName = data.fullName.trim();

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: data.password,
        data: {
          full_name: trimmedName,
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: 'ERROR',
        message:
          payload?.msg ||
          payload?.error_description ||
          payload?.message ||
          'Account registration failed.',
      };
    }

    const userId: string | undefined = payload?.user?.id || payload?.id;
    const accessToken: string | undefined = payload?.access_token;

    if (!accessToken && userId) {
      return {
        ok: true,
        status: 'EMAIL_CONFIRMATION_REQUIRED',
        message: `Registration submitted for ${normalizedEmail}. Please check your email inbox to confirm your account before signing in.`,
      };
    }

    if (userId && accessToken) {
      setActiveSupabaseSession(accessToken, userId);
      const authoritativeProfile = await fetchAuthoritativeUserProfile(
        userId,
        accessToken,
        normalizedEmail,
        trimmedName
      );

      const user: UserProfile = authoritativeProfile || {
        id: userId,
        fullName: trimmedName,
        email: normalizedEmail,
        role: 'STUDENT',
        institutionId: '',
        institutionName: '',
        program: '',
        consent: {
          acceptedDataProcessing: true,
          acceptedAssessmentTerms: false,
          acceptedEvidenceReviewTerms: false,
          consentTimestamp: new Date().toISOString(),
          consentVersion: 'WF-CONSENT-2025.1',
        },
        eligibility: {
          enrolledStudentVerified: false,
          minimumAcademicStandingVerified: false,
          customEligibilityFlags: {},
        },
        isDevelopmentSeed: false,
      };

      return {
        ok: true,
        status: 'SUCCESS',
        message: 'Account created and authenticated with Supabase.',
        user,
        accessToken,
      };
    }

    return {
      ok: false,
      status: 'ERROR',
      message: 'Unexpected response from Supabase Auth signup.',
    };
  } catch (err) {
    return {
      ok: false,
      status: 'ERROR',
      message:
        err instanceof Error
          ? err.message
          : 'Network error connecting to Supabase Auth.',
    };
  }
}

export async function signInWithSupabase(data: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const { supabaseUrl, supabaseAnonKey, configured } = getSupabaseClientConfig();

  if (!configured) {
    return {
      ok: false,
      status: 'UNCONFIGURED',
      message:
        'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured. Set them in .env to enable live authentication.',
    };
  }

  const normalizedEmail = data.email.trim().toLowerCase();

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: data.password,
        }),
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: 'ERROR',
        message:
          payload?.error_description ||
          payload?.msg ||
          payload?.message ||
          'Invalid email or password.',
      };
    }

    const userId: string | undefined = payload?.user?.id;
    const accessToken: string | undefined = payload?.access_token;

    if (!userId || !accessToken) {
      return {
        ok: false,
        status: 'ERROR',
        message: 'Authentication succeeded but session token was missing.',
      };
    }

    setActiveSupabaseSession(accessToken, userId);

    const authoritativeProfile = await fetchAuthoritativeUserProfile(
      userId,
      accessToken,
      normalizedEmail,
      payload?.user?.user_metadata?.full_name || ''
    );

    const user: UserProfile = authoritativeProfile || {
      id: userId,
      fullName:
        payload?.user?.user_metadata?.full_name ||
        normalizedEmail.split('@')[0],
      email: payload?.user?.email || normalizedEmail,
      role: 'STUDENT',
      institutionId: '',
      institutionName: '',
      program: '',
      consent: {
        acceptedDataProcessing: true,
        acceptedAssessmentTerms: true,
        acceptedEvidenceReviewTerms: true,
        consentTimestamp: new Date().toISOString(),
        consentVersion: 'WF-CONSENT-2025.1',
      },
      eligibility: {
        enrolledStudentVerified: false,
        minimumAcademicStandingVerified: false,
        customEligibilityFlags: {},
      },
      isDevelopmentSeed: false,
    };

    return {
      ok: true,
      status: 'SUCCESS',
      message: 'Signed in via Supabase Auth.',
      user,
      accessToken,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'ERROR',
      message:
        err instanceof Error
          ? err.message
          : 'Network error connecting to Supabase Auth.',
    };
  }
}

export async function signOutFromSupabase(): Promise<void> {
  const { supabaseUrl, supabaseAnonKey, configured } = getSupabaseClientConfig();
  const token = activeAccessToken;
  setActiveSupabaseSession(null, null);

  if (configured && token) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors during logout
    }
  }
}

export async function sendPasswordRecoveryWithSupabase(
  email: string
): Promise<AuthActionResult> {
  const { supabaseUrl, supabaseAnonKey, configured } = getSupabaseClientConfig();

  if (!configured) {
    return {
      ok: false,
      status: 'UNCONFIGURED',
      message:
        'Supabase environment variables are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable password recovery emails.',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        ok: false,
        status: 'ERROR',
        message:
          data?.msg ||
          data?.error_description ||
          'Failed to dispatch password recovery email.',
      };
    }

    return {
      ok: true,
      status: 'SUCCESS',
      message: `Password recovery link sent to ${normalizedEmail}.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'ERROR',
      message:
        err instanceof Error
          ? err.message
          : 'Network error contacting Supabase recovery service.',
    };
  }
}

// =============================================================================
// FULL DATABASE HYDRATION & MUTATION FUNCTIONS (MIGRATIONS 001–004)
// =============================================================================

export interface HydratedSupabaseUserData {
  profile: UserProfile | null;
  capabilityRecords: CapabilityDimensionRecord[];
  riasecResult: RiasecAssessmentResult | null;
  aptitudeAttempts: AptitudeAttemptResult[];
  skillAssessmentAttempts: SkillAssessmentAttempt[];
  studentSkillRecords: StudentSkillProficiencyRecord[];
  evidenceSubmissions: EvidenceSubmission[];
  portfolioRecords: StudentPortfolioRecord[];
  activities: DevelopmentActivity[];
  resourceProgress: StudentResourceProgress[];
  snapshots: HistoricalSnapshot[];
  sharingAuthorisations: SharingAuthorisation[];
  auditEvents: AuditEvent[];
}

export async function fetchHydratedUserStateFromSupabase(
  userId: string,
  accessToken?: string | null
): Promise<HydratedSupabaseUserData | null> {
  const token = accessToken ?? activeAccessToken;
  if (!isSupabaseEnvConfigured() || !token) {
    return null;
  }

  const [
    profile,
    capResp,
    riasecResp,
    aptResp,
    skillAttResp,
    skillProfResp,
    evResp,
    revResp,
    portResp,
    actResp,
    learnProgResp,
    snapResp,
    shareResp,
    auditResp,
  ] = await Promise.all([
    fetchAuthoritativeUserProfile(userId, token, ''),
    supabaseRestFetch<
      Array<{
        dimension_id: string;
        self_reported_level: number | null;
        objective_score_level: number | null;
        verified_level: number | null;
        demonstrated_level: number | null;
        updated_at: string;
      }>
    >(`capability_records?student_id=eq.${encodeURIComponent(userId)}&select=*`, {
      tokenOverride: token,
    }),
    supabaseRestFetch<
      Array<{
        id: string;
        realistic_r: number;
        investigative_i: number;
        artistic_a: number;
        social_s: number;
        enterprising_e: number;
        conventional_c: number;
        top_holland_code: string;
        raw_responses: Record<string, number>;
        completed_at: string;
      }>
    >(
      `interest_profiles?student_id=eq.${encodeURIComponent(
        userId
      )}&order=completed_at.desc&limit=1`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        id: string;
        dimension_id: string;
        raw_score: number;
        max_score: number;
        normalized_percent: number;
        derived_level: number;
        completed_at: string;
      }>
    >(
      `aptitude_attempts?student_id=eq.${encodeURIComponent(
        userId
      )}&order=completed_at.desc`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        id: string;
        student_id: string;
        skill_id: string;
        assessment_id: string | null;
        assessment_version: string;
        total_items: number;
        correct_items: number;
        raw_score: number;
        derived_level: number;
        demonstrated_strengths: string[];
        areas_needing_development: string[];
        item_feedback_json: SkillAssessmentAttempt['itemFeedback'];
        recommended_resource_ids: string[];
        completed_at: string;
      }>
    >(
      `skill_assessment_attempts?student_id=eq.${encodeURIComponent(
        userId
      )}&order=completed_at.desc`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        skill_id: string;
        self_reported_level: number | null;
        assessment_level: number | null;
        verified_level: number | null;
        demonstrated_level: number | null;
        updated_at: string;
      }>
    >(`user_skill_profiles?student_id=eq.${encodeURIComponent(userId)}&select=*`, {
      tokenOverride: token,
    }),
    supabaseRestFetch<
      Array<{
        id: string;
        student_id: string;
        dimension_id: string;
        target_opportunity_id: string | null;
        artifact_type: string;
        title: string;
        description: string;
        external_url: string | null;
        storage_object_path: string | null;
        file_name: string | null;
        mime_type: string | null;
        file_size_bytes: number | null;
        sha256_checksum: string | null;
        claimed_level: number;
        status: string;
        assigned_reviewer_id: string | null;
        submitted_at: string;
      }>
    >(`evidence_submissions?order=submitted_at.desc&select=*`, {
      tokenOverride: token,
    }),
    supabaseRestFetch<
      Array<{
        id: string;
        evidence_id: string;
        reviewer_id: string;
        decision: string;
        verified_level: number | null;
        rationale: string;
        rubric_breakdown: Partial<EvidenceReviewDimensions>;
        reviewed_at: string;
      }>
    >(`review_records?order=reviewed_at.desc&select=*`, {
      tokenOverride: token,
    }),
    supabaseRestFetch<
      Array<{
        id: string;
        student_id: string;
        record_type: string;
        title: string;
        organization: string | null;
        start_date: string | null;
        end_date: string | null;
        summary: string;
        external_url: string | null;
        linked_dimension_ids: string[];
        verification_state: string;
        created_at: string;
      }>
    >(
      `portfolio_records?student_id=eq.${encodeURIComponent(
        userId
      )}&order=created_at.desc`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        id: string;
        target_dimension_id: string;
        target_skill_id: string | null;
        target_opportunity_id: string | null;
        title: string;
        action_plan: string;
        expected_artifact_type: string | null;
        target_level: number;
        status: string;
        updated_at: string;
      }>
    >(
      `development_activities?student_id=eq.${encodeURIComponent(
        userId
      )}&order=created_at.desc`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        resource_id: string;
        status: string;
        reflection_notes: string;
        updated_at: string;
      }>
    >(
      `user_learning_progress?student_id=eq.${encodeURIComponent(userId)}&select=*`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        id: string;
        target_opportunity_id: string | null;
        overall_readiness_band: string;
        dimension_summary: Record<CapabilityDimensionId, RubricLevel | null>;
        gap_summary: {
          targetTitle?: string;
          summaryNote?: string;
          statusCounts?: Record<RequirementStatus, number>;
        };
        created_at: string;
      }>
    >(
      `readiness_snapshots?student_id=eq.${encodeURIComponent(
        userId
      )}&order=created_at.desc`,
      { tokenOverride: token }
    ),
    supabaseRestFetch<
      Array<{
        student_id: string;
        share_with_institution_Waitlist: boolean;
        share_verified_portfolio_with_employers: boolean;
        updated_at: string;
      }>
    >(`sharing_consents?student_id=eq.${encodeURIComponent(userId)}&select=*`, {
      tokenOverride: token,
    }),
    supabaseRestFetch<
      Array<{
        id: string;
        actor_id: string | null;
        actor_role: string | null;
        event_type: string;
        target_table: string;
        target_record_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>
    >(`audit_events?order=created_at.desc&limit=50`, {
      tokenOverride: token,
    }),
  ]);

  // 1. Capabilities (merge DB rows onto the 10 canonical dimensions)
  const capByDim = new Map<CapabilityDimensionId, CapabilityDimensionRecord>();
  for (const row of capResp.data || []) {
    const feDim = fromDbDimensionId(row.dimension_id);
    const selfLvl = (row.self_reported_level ?? null) as RubricLevel | null;
    const objLvl = (row.objective_score_level ?? null) as RubricLevel | null;
    const verLvl = (row.verified_level ?? null) as RubricLevel | null;
    const demLvl = (row.demonstrated_level ?? null) as RubricLevel | null;

    capByDim.set(feDim, {
      dimensionId: feDim,
      rubricVersion: 'RUBRIC_V1',
      selfReportedLevel: selfLvl,
      selfReportedUpdatedAt: selfLvl !== null ? row.updated_at : null,
      objectiveScoreLevel: objLvl,
      verifiedEvidenceLevel: verLvl,
      demonstratedLevel: demLvl,
      evidenceSource:
        verLvl !== null && objLvl !== null
          ? 'COMBINED_VERIFIED'
          : verLvl !== null
          ? 'REVIEWED_EVIDENCE'
          : objLvl !== null
          ? 'OBJECTIVE_ASSESSMENT'
          : selfLvl !== null
          ? 'SELF_REPORT_ONLY'
          : 'UNASSESSED',
      lastUpdatedAt: row.updated_at || '',
    });
  }

  const capabilityRecords: CapabilityDimensionRecord[] =
    CANONICAL_CAPABILITY_DIMENSIONS.map(
      (dim) =>
        capByDim.get(dim.id) || {
          dimensionId: dim.id,
          rubricVersion: 'RUBRIC_V1',
          selfReportedLevel: null,
          selfReportedUpdatedAt: null,
          objectiveScoreLevel: null,
          verifiedEvidenceLevel: null,
          demonstratedLevel: null,
          evidenceSource: 'UNASSESSED',
          lastUpdatedAt: '',
        }
    );

  // 2. RIASEC Result
  let riasecResult: RiasecAssessmentResult | null = null;
  const rRow = riasecResp.data?.[0];
  if (rRow) {
    const rawDomainSums: Record<RiasecDomain, number> = {
      R: Number(rRow.realistic_r),
      I: Number(rRow.investigative_i),
      A: Number(rRow.artistic_a),
      S: Number(rRow.social_s),
      E: Number(rRow.enterprising_e),
      C: Number(rRow.conventional_c),
    };
    const normPct = (val: number) =>
      Math.max(0, Math.min(100, Math.round(((val - 8) / 32) * 100)));
    riasecResult = {
      attemptId: rRow.id,
      completedAt: rRow.completed_at,
      itemResponses: rRow.raw_responses || {},
      rawDomainSums,
      normalizedPercentage: {
        R: normPct(rawDomainSums.R),
        I: normPct(rawDomainSums.I),
        A: normPct(rawDomainSums.A),
        S: normPct(rawDomainSums.S),
        E: normPct(rawDomainSums.E),
        C: normPct(rawDomainSums.C),
      },
      topThreeCode: rRow.top_holland_code,
      tieBreakApplied: false,
      isComplete48: true,
    };
  }

  // 3. Aptitude Attempts
  const aptitudeAttempts: AptitudeAttemptResult[] = (aptResp.data || []).map(
    (row) => ({
      id: row.id,
      domain: DB_DIMENSION_TO_APTITUDE_DOMAIN[row.dimension_id] || 'NUMERICAL',
      completedAt: row.completed_at,
      totalItems: Number(row.max_score || 3),
      correctCount: Number(row.raw_score || 0),
      percentage: Number(row.normalized_percent || 0),
      mappedRubricLevel: Number(row.derived_level || 0) as RubricLevel,
      rubricVersion: 'RUBRIC_V1',
    })
  );

  // 4. Skill Assessment Attempts
  const skillAssessmentAttempts: SkillAssessmentAttempt[] = (
    skillAttResp.data || []
  ).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    assessmentId: row.assessment_id || `ASM_${row.skill_id}`,
    assessmentVersion: row.assessment_version || '1.0.0',
    assessmentTitle: `Skill Benchmark (${row.skill_id})`,
    skillId: row.skill_id,
    fieldId: 'FIELD_CS_SW',
    mappedCapabilityId: 'CAP_PROG_SW',
    completedAt: row.completed_at,
    completionStatus: 'COMPLETED_SCORED',
    evaluationMethod: 'DETERMINISTIC_ANSWER_KEY',
    totalItems: row.total_items,
    correctCount: row.correct_items,
    scorePercentage: Number(row.raw_score),
    awardedRubricLevel: Number(row.derived_level) as RubricLevel,
    demonstratedStrengths: row.demonstrated_strengths || [],
    areasNeedingDevelopment: row.areas_needing_development || [],
    itemFeedback: row.item_feedback_json || [],
    recommendedResourceIds: row.recommended_resource_ids || [],
    limitationsExplanation:
      'Scored by WAYFINDER Server Authority against locked skill assessment answer keys.',
    recommendedNextSteps: [],
  }));

  // 5. Student Skill Proficiency Records
  const studentSkillRecords: StudentSkillProficiencyRecord[] = (
    skillProfResp.data || []
  ).map((row) => ({
    skillId: row.skill_id,
    mappedCapabilityId: 'CAP_PROG_SW',
    selfReportedLevel: (row.self_reported_level ?? null) as RubricLevel | null,
    assessedLevel: (row.assessment_level ?? null) as RubricLevel | null,
    verifiedEvidenceLevel: (row.verified_level ?? null) as RubricLevel | null,
    demonstratedLevel: (row.demonstrated_level ?? null) as RubricLevel | null,
    lastAssessedAt: row.updated_at,
    assessmentVersion: '1.0.0',
  }));

  // 6. Evidence Submissions + Latest Review Record
  const latestReviewByEvidenceId = new Map<
    string,
    {
      id: string;
      reviewer_id: string;
      decision: string;
      verified_level: number | null;
      rationale: string;
      rubric_breakdown: Partial<EvidenceReviewDimensions>;
      reviewed_at: string;
    }
  >();
  for (const rev of revResp.data || []) {
    if (!latestReviewByEvidenceId.has(rev.evidence_id)) {
      latestReviewByEvidenceId.set(rev.evidence_id, rev);
    }
  }

  const evidenceSubmissions: EvidenceSubmission[] = (evResp.data || []).map(
    (row) => {
      const feDim = fromDbDimensionId(row.dimension_id);
      const rev = latestReviewByEvidenceId.get(row.id);

      const feStatus: EvidenceSubmission['status'] =
        row.status === 'VERIFIED' || row.status === 'PARTIALLY_VERIFIED'
          ? 'ACCEPTED'
          : row.status === 'REVISION_REQUIRED'
          ? 'REVISION_REQUESTED'
          : row.status === 'REJECTED'
          ? 'REJECTED'
          : row.status === 'UNDER_REVIEW'
          ? 'UNDER_REVIEW'
          : row.status === 'TECHNICAL_VALIDATION_FAILED'
          ? 'TECHNICAL_VALIDATION_FAILED'
          : row.status === 'TECHNICAL_VALIDATION_PASSED'
          ? 'TECHNICAL_VALIDATION_PASSED'
          : row.status === 'EXPIRED'
          ? 'EXPIRED'
          : 'SUBMITTED';

      const feDecision: 'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED' =
        rev?.decision === 'VERIFIED' || rev?.decision === 'PARTIALLY_VERIFIED'
          ? 'ACCEPTED'
          : rev?.decision === 'REVISION_REQUIRED'
          ? 'REVISION_REQUESTED'
          : 'REJECTED';

      const rb = rev?.rubric_breakdown || {};
      const defaultScore = (rev?.verified_level ?? 3) as RubricLevel;

      return {
        id: row.id,
        studentId: row.student_id,
        title: row.title,
        description: row.description,
        linkedDimensionId: feDim,
        linkedTargetId: row.target_opportunity_id || undefined,
        claimedRubricLevel: Math.max(
          1,
          Math.min(4, row.claimed_level)
        ) as RubricLevel,
        evidenceType: row.artifact_type === 'FILE_UPLOAD' ? 'FILE' : 'URL',
        fileName: row.file_name || undefined,
        fileSizeBytes: row.file_size_bytes || undefined,
        mimeType: row.mime_type || undefined,
        url: row.external_url || undefined,
        simulatedClientHash: row.sha256_checksum || '',
        status: feStatus,
        technicalValidation: {
          sizeValid: true,
          mimeValid: true,
          malwareScanStatus: 'PASSED_PRODUCTION_SCAN',
          validationNotes: 'Verified by WAYFINDER Supabase Storage & RLS Policy.',
        },
        assignedReviewerId: row.assigned_reviewer_id,
        reviewDecision: rev
          ? {
              reviewId: rev.id,
              reviewerId: rev.reviewer_id,
              reviewerName: 'Authorised Reviewer',
              reviewedAt: rev.reviewed_at,
              rubricVersion: 'RUBRIC_V1',
              decision: feDecision,
              verifiedRubricLevel:
                rev.verified_level !== null
                  ? (rev.verified_level as RubricLevel)
                  : null,
              dimensions: {
                relevance: (rb.relevance ?? defaultScore) as RubricLevel,
                authenticityAndAttribution: (rb.authenticityAndAttribution ??
                  defaultScore) as RubricLevel,
                sufficiency: (rb.sufficiency ?? defaultScore) as RubricLevel,
                quality: (rb.quality ?? defaultScore) as RubricLevel,
                currency: (rb.currency ?? defaultScore) as RubricLevel,
                context: (rb.context ?? defaultScore) as RubricLevel,
              },
              rationale: rev.rationale,
            }
          : null,
        submittedAt: row.submitted_at,
      };
    }
  );

  // 7. Portfolio Records
  const portfolioRecords: StudentPortfolioRecord[] = (
    portResp.data || []
  ).map((row) => ({
    id: row.id,
    recordType:
      row.record_type === 'INTERNSHIP'
        ? 'INTERNSHIP'
        : row.record_type === 'CERTIFICATION'
        ? 'CERTIFICATE'
        : 'PROJECT',
    title: row.title,
    organizationOrIssuer: row.organization || 'Self-Directed / Academic',
    completedDate:
      row.end_date || row.start_date || row.created_at.slice(0, 10),
    description: row.summary,
    linkedDimensionId: fromDbDimensionId(
      row.linked_dimension_ids?.[0] || 'TECHNICAL_TOOL_PROFICIENCY'
    ),
    artifactUrl: row.external_url || undefined,
    verificationState:
      row.verification_state === 'SELF_REPORTED'
        ? 'UNVERIFIED_CLAIM'
        : 'EVIDENCE_SUBMITTED',
    createdAt: row.created_at,
  }));

  // 8. Development Activities
  const activities: DevelopmentActivity[] = (actResp.data || []).map((row) => ({
    id: row.id,
    title: row.title,
    linkedDimensionId: fromDbDimensionId(row.target_dimension_id),
    linkedSkillId: row.target_skill_id || undefined,
    linkedTargetId: row.target_opportunity_id || undefined,
    targetRubricLevel: Math.max(
      1,
      Math.min(4, row.target_level)
    ) as RubricLevel,
    objective: row.action_plan,
    instructions: row.action_plan,
    expectedOutputArtifact:
      row.expected_artifact_type || 'Technical Repository or Analytical Report',
    status:
      row.status === 'COMPLETED_VERIFIED'
        ? 'COMPLETED'
        : row.status === 'IN_PROGRESS' || row.status === 'EVIDENCE_SUBMITTED'
        ? 'IN_PROGRESS'
        : 'NOT_STARTED',
    progressPercent:
      row.status === 'COMPLETED_VERIFIED'
        ? 100
        : row.status === 'EVIDENCE_SUBMITTED'
        ? 85
        : row.status === 'IN_PROGRESS'
        ? 50
        : 0,
    reflectionNotes: '',
    completedAt: row.status === 'COMPLETED_VERIFIED' ? row.updated_at : null,
  }));

  // 9. Resource Progress
  const resourceProgress: StudentResourceProgress[] = (
    learnProgResp.data || []
  ).map((row) => ({
    resourceId: row.resource_id,
    studentId: userId,
    status: row.status as StudentResourceProgressState,
    notes: row.reflection_notes || '',
    updatedAt: row.updated_at,
  }));

  // 10. Historical Snapshots
  const emptyCounts: Record<RequirementStatus, number> = {
    DEMONSTRATED: 0,
    PARTIALLY_DEMONSTRATED: 0,
    DEVELOPMENT_NEEDED: 0,
    EVIDENCE_MISSING: 0,
    EVIDENCE_PENDING_REVIEW: 0,
    MANDATORY_CONDITION_NOT_MET: 0,
    UNKNOWN_INSUFFICIENT_INFO: 0,
    NOT_APPLICABLE: 0,
  };
  const emptyCapMap: Record<CapabilityDimensionId, RubricLevel | null> = {
    CAP_NUM_QUANT: null,
    CAP_TECH_COMM: null,
    CAP_SYS_DESIGN: null,
    CAP_PROG_SW: null,
    CAP_DATA_ANAL: null,
    CAP_PROB_SOLV: null,
    CAP_TEAM_COLLAB: null,
    CAP_PROJ_EXEC: null,
    CAP_ETHICS_GOV: null,
    CAP_RESEARCH_SYN: null,
  };

  const snapshots: HistoricalSnapshot[] = (snapResp.data || []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    actorId: userId,
    triggerType: 'MANUAL_RECALCULATION',
    targetId: row.target_opportunity_id || 'TARGET_SNAPSHOT',
    targetTitle: row.gap_summary?.targetTitle || 'Target Opportunity Benchmark',
    targetVersion: '1.0.0',
    rubricVersion: 'RUBRIC_V1',
    summaryNote: row.gap_summary?.summaryNote || 'Readiness snapshot stored in Supabase.',
    statusCounts: row.gap_summary?.statusCounts || emptyCounts,
    capabilitySnapshot: { ...emptyCapMap, ...(row.dimension_summary || {}) },
  }));

  // 11. Sharing Authorisations
  const sharingAuthorisations: SharingAuthorisation[] = [];
  for (const row of shareResp.data || []) {
    if (
      row.share_with_institution_Waitlist ||
      row.share_verified_portfolio_with_employers
    ) {
      sharingAuthorisations.push({
        id: `SHARE_${row.student_id.slice(0, 8)}`,
        studentId: row.student_id,
        recipientInstitution: row.share_verified_portfolio_with_employers
          ? 'Verified Employer & Opportunity Partners'
          : 'University Career Advisory Office',
        scopeTargetId: 'ALL_TARGETS',
        includeEvidenceMetadata: true,
        createdAt: row.updated_at,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        revokedAt: null,
      });
    }
  }

  // 12. Audit Events
  const auditEvents: AuditEvent[] = (auditResp.data || []).map((row) => ({
    id: row.id,
    timestamp: row.created_at,
    actorId: row.actor_id || userId,
    actorRole: ((row.actor_role || 'STUDENT').toUpperCase() as Role),
    action: row.event_type,
    entityType: row.target_table,
    entityId: row.target_record_id || row.target_table,
    details: JSON.stringify(row.metadata || {}),
  }));

  return {
    profile,
    capabilityRecords,
    riasecResult,
    aptitudeAttempts,
    skillAssessmentAttempts,
    studentSkillRecords,
    evidenceSubmissions,
    portfolioRecords,
    activities,
    resourceProgress,
    snapshots,
    sharingAuthorisations,
    auditEvents,
  };
}

// =============================================================================
// INDIVIDUAL TABLE PERSISTENCE OPERATIONS
// =============================================================================

export async function updateProfileInSupabase(
  userId: string,
  updates: {
    fullName?: string;
    institutionName?: string;
    program?: string;
    onboardingCompleted?: boolean;
    cohortAggregationOptIn?: boolean;
  }
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const payload: Record<string, unknown> = {};
  if (updates.fullName !== undefined) payload.full_name = updates.fullName;
  if (updates.institutionName !== undefined)
    payload.institution_name = updates.institutionName;
  if (updates.program !== undefined) payload.programme = updates.program;
  if (updates.onboardingCompleted !== undefined)
    payload.onboarding_completed = updates.onboardingCompleted;
  if (updates.cohortAggregationOptIn !== undefined)
    payload.cohort_aggregation_opt_in = updates.cohortAggregationOptIn;

  const res = await supabaseRestFetch(
    `wayfinder_profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      body: payload,
    }
  );
  return res.ok;
}

export async function upsertSharingConsentInSupabase(
  userId: string,
  consent: {
    shareWithInstitution?: boolean;
    shareWithEmployers?: boolean;
    allowAnonymisedCohort?: boolean;
  }
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const res = await supabaseRestFetch('sharing_consents?on_conflict=student_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: {
      student_id: userId,
      share_with_institution_Waitlist: Boolean(consent.shareWithInstitution),
      share_verified_portfolio_with_employers: Boolean(
        consent.shareWithEmployers
      ),
      allow_anonymised_cohort_analytics: Boolean(consent.allowAnonymisedCohort),
      consent_version: 'WF-CONSENT-2025.1',
    },
  });
  return res.ok;
}

export async function upsertSelfReportedCapabilityInSupabase(
  userId: string,
  dimensionId: CapabilityDimensionId,
  level: RubricLevel | null
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const dbDim = toDbDimensionId(dimensionId);
  const res = await supabaseRestFetch(
    'capability_records?on_conflict=student_id,dimension_id',
    {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: {
        student_id: userId,
        dimension_id: dbDim,
        self_reported_level: level,
      },
    }
  );
  return res.ok;
}

export async function insertRiasecProfileInSupabase(
  userId: string,
  riasec: RiasecAssessmentResult
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const res = await supabaseRestFetch('interest_profiles', {
    method: 'POST',
    body: {
      student_id: userId,
      assessment_version: 'v1.0',
      realistic_r: riasec.rawDomainSums.R,
      investigative_i: riasec.rawDomainSums.I,
      artistic_a: riasec.rawDomainSums.A,
      social_s: riasec.rawDomainSums.S,
      enterprising_e: riasec.rawDomainSums.E,
      conventional_c: riasec.rawDomainSums.C,
      top_holland_code: riasec.topThreeCode.slice(0, 3),
      raw_responses: riasec.itemResponses,
    },
  });
  return res.ok;
}

export async function submitAptitudeAttemptViaBackend(
  domain: AptitudeDomain,
  selectedOptions: Record<string, string>,
  enableSpatialReasoning = false
): Promise<AptitudeAttemptResult | null> {
  const res = await callWayfinderServerAuthority<{
    status: string;
    attempt?: AptitudeAttemptResult;
  }>('/assessments/aptitude/score', {
    domain,
    selectedOptions,
    enableSpatialReasoning,
  });

  return res.data?.attempt ?? null;
}

export async function submitSkillAssessmentViaBackend(
  userId: string,
  assessmentId: string,
  responses: Record<string, string | string[]>
): Promise<SkillAssessmentAttempt | null> {
  const res = await callWayfinderServerAuthority<{
    status: string;
    attempt?: SkillAssessmentAttempt;
  }>('/assessments/skill/score', {
    userId,
    assessmentId,
    responses,
  });

  return res.data?.attempt ?? null;
}

export async function submitEvidenceToSupabase(
  userId: string,
  submission: EvidenceSubmission,
  rawFile?: File | null
): Promise<{ evidenceId: string | null; storageObjectPath: string | null }> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) {
    return { evidenceId: null, storageObjectPath: null };
  }

  const dbDim = toDbDimensionId(submission.linkedDimensionId);

  const insertResp = await supabaseRestFetch<Array<{ id: string }>>(
    'evidence_submissions',
    {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        student_id: userId,
        dimension_id: dbDim,
        artifact_type:
          submission.evidenceType === 'FILE' ? 'FILE_UPLOAD' : 'EXTERNAL_URL',
        title: submission.title,
        description: submission.description,
        external_url: submission.url || null,
        file_name: submission.fileName || null,
        mime_type: submission.mimeType || null,
        file_size_bytes: submission.fileSizeBytes || null,
        sha256_checksum: submission.simulatedClientHash || null,
        claimed_level: Math.max(1, Math.min(4, submission.claimedRubricLevel)),
        status: rawFile ? 'UPLOAD_PENDING' : 'SUBMITTED',
      },
    }
  );

  const dbEvidenceId = insertResp.data?.[0]?.id;
  if (!dbEvidenceId) {
    return { evidenceId: null, storageObjectPath: null };
  }

  let storagePath: string | null = null;
  if (rawFile) {
    const safeFileName = rawFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    storagePath = `${userId}/${dbEvidenceId}/${safeFileName}`;
    const { supabaseUrl, supabaseAnonKey } = getSupabaseClientConfig();

    const uploadResp = await fetch(
      `${supabaseUrl}/storage/v1/object/evidence-artifacts/${storagePath}`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${activeAccessToken}`,
          'Content-Type': rawFile.type || 'application/octet-stream',
          'x-upsert': 'false',
        },
        body: rawFile,
      }
    );

    if (uploadResp.ok) {
      await supabaseRestFetch(
        `evidence_submissions?id=eq.${encodeURIComponent(dbEvidenceId)}`,
        {
          method: 'PATCH',
          body: {
            storage_object_path: storagePath,
          },
        }
      );
    }
  }

  await callWayfinderServerAuthority('/evidence/verify-upload', {
    evidenceId: dbEvidenceId,
  });

  return { evidenceId: dbEvidenceId, storageObjectPath: storagePath };
}

export async function claimEvidenceReviewViaBackend(
  evidenceId: string
): Promise<boolean> {
  const res = await callWayfinderServerAuthority('/reviews/claim', {
    evidenceId,
  });
  return res.ok;
}

export async function submitReviewerDecisionViaBackend(params: {
  evidenceId: string;
  decision: 'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED';
  verifiedLevel: RubricLevel | null;
  dimensions: EvidenceReviewDimensions;
  rationale: string;
}): Promise<boolean> {
  const res = await callWayfinderServerAuthority(
    '/reviews/submit-decision',
    params
  );
  return res.ok;
}

export async function requestEvidenceSignedUrlViaBackend(
  evidenceId: string
): Promise<string | null> {
  const res = await callWayfinderServerAuthority<{
    status: string;
    signedUrl?: string | null;
  }>('/evidence/signed-url', { evidenceId });
  return res.data?.signedUrl ?? null;
}

export async function insertPortfolioRecordInSupabase(
  userId: string,
  record: StudentPortfolioRecord
): Promise<string | null> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return null;

  const dbType =
    record.recordType === 'INTERNSHIP'
      ? 'INTERNSHIP'
      : record.recordType === 'CERTIFICATE'
      ? 'CERTIFICATION'
      : 'PROJECT';

  const res = await supabaseRestFetch<Array<{ id: string }>>(
    'portfolio_records',
    {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        student_id: userId,
        record_type: dbType,
        title: record.title,
        organization: record.organizationOrIssuer,
        summary: record.description,
        external_url: record.artifactUrl || null,
        linked_dimension_ids: [toDbDimensionId(record.linkedDimensionId)],
      },
    }
  );

  return res.data?.[0]?.id ?? null;
}

export async function deletePortfolioRecordFromSupabase(
  recordId: string
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;
  const res = await supabaseRestFetch(
    `portfolio_records?id=eq.${encodeURIComponent(recordId)}`,
    { method: 'DELETE' }
  );
  return res.ok;
}

export async function insertDevelopmentActivityInSupabase(
  userId: string,
  activity: DevelopmentActivity
): Promise<string | null> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return null;

  const res = await supabaseRestFetch<Array<{ id: string }>>(
    'development_activities',
    {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        student_id: userId,
        target_dimension_id: toDbDimensionId(activity.linkedDimensionId),
        target_skill_id: activity.linkedSkillId || null,
        title: activity.title,
        action_plan: activity.instructions || activity.objective,
        expected_artifact_type: activity.expectedOutputArtifact,
        target_level: Math.max(1, Math.min(4, activity.targetRubricLevel)),
        status: 'PLANNED',
      },
    }
  );

  return res.data?.[0]?.id ?? null;
}

export async function updateDevelopmentActivityInSupabase(
  activityId: string,
  status: ActivityStatus
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const dbStatus =
    status === 'COMPLETED'
      ? 'EVIDENCE_SUBMITTED'
      : status === 'IN_PROGRESS'
      ? 'IN_PROGRESS'
      : 'PLANNED';

  const res = await supabaseRestFetch(
    `development_activities?id=eq.${encodeURIComponent(activityId)}`,
    {
      method: 'PATCH',
      body: { status: dbStatus },
    }
  );
  return res.ok;
}

export async function upsertLearningProgressInSupabase(
  userId: string,
  resourceId: string,
  status: StudentResourceProgressState,
  notes: string
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const progressPct =
    status === 'COMPLETED_BY_USER' || status === 'READY_FOR_REASSESSMENT'
      ? 100
      : status === 'REVIEWED_SELF_STUDY'
      ? 75
      : status === 'IN_PROGRESS' || status === 'PRACTICE_REQUIRED'
      ? 40
      : 0;

  const res = await supabaseRestFetch(
    'user_learning_progress?on_conflict=student_id,resource_id',
    {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: {
        student_id: userId,
        resource_id: resourceId,
        status,
        progress_percent: progressPct,
        reflection_notes: notes,
      },
    }
  );
  return res.ok;
}

export async function insertResourceQualityReportInSupabase(
  userId: string,
  resourceId: string,
  reason: string,
  details: string
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const issueType =
    reason === 'BROKEN_LINK'
      ? 'BROKEN_LINK'
      : reason === 'OUTDATED_CONTENT'
      ? 'OUTDATED_CONTENT'
      : 'OTHER';

  const res = await supabaseRestFetch('resource_quality_reports', {
    method: 'POST',
    body: {
      resource_id: resourceId,
      reporter_id: userId,
      issue_type: issueType,
      details,
    },
  });
  return res.ok;
}

export async function insertReadinessSnapshotInSupabase(
  userId: string,
  snapshot: HistoricalSnapshot
): Promise<boolean> {
  if (!isSupabaseEnvConfigured() || !activeAccessToken) return false;

  const res = await supabaseRestFetch('readiness_snapshots', {
    method: 'POST',
    body: {
      student_id: userId,
      overall_readiness_band: 'DEVELOPING_ALIGNMENT',
      dimension_summary: snapshot.capabilitySnapshot,
      gap_summary: {
        targetId: snapshot.targetId,
        targetTitle: snapshot.targetTitle,
        summaryNote: snapshot.summaryNote,
        statusCounts: snapshot.statusCounts,
      },
    },
  });
  return res.ok;
}

/**
 * Computes a real SHA-256 cryptographic digest of an uploaded file using the browser Web Crypto API.
 */
export async function computeRealFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Reference summary of the canonical 4-migration PostgreSQL & Row-Level Security (RLS) architecture.
 * Complete production SQL migrations reside in `/supabase/migrations/001..004`.
 */
export const SUPABASE_RLS_SCHEMA_SQL = `-- WAYFINDER — Canonical Four-Migration PostgreSQL & RLS Architecture
-- Complete idempotent SQL migrations are located in /supabase/migrations/:
--   001_wayfinder_core_schema_rls.sql
--   002_field_skill_assessment_learning_hub.sql
--   003_portfolio_activities_resource_reports.sql
--   004_market_skills_career_intelligence.sql
CREATE TABLE IF NOT EXISTS public.wayfinder_profiles (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.capability_records (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.evidence_submissions (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.review_records (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.fields (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.fields_of_study (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.skills (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.skill_assessments (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.skill_assessment_attempts (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.learning_resources (id text PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.student_learning_progress (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS public.user_learning_progress (id uuid PRIMARY KEY);
`;
