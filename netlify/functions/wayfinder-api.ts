import {
  AptitudeAttemptResult,
  AptitudeDomain,
  CapabilityDimensionId,
  EvidenceReviewDimensions,
  InstitutionCohortRecord,
  RubricLevel,
  SkillAssessmentAttempt,
} from '../../src/types/wayfinder';
import { getActiveAptitudeItems } from '../../src/data/aptitudeBank';
import { INITIAL_SKILL_ASSESSMENTS } from '../../src/data/skillAssessmentBank';
import { INITIAL_LEARNING_RESOURCES } from '../../src/data/learningHubCatalogue';
import {
  calculateNumericGap,
  evaluateInstitutionCohortSuppression,
  scoreAptitudeAttemptServerSide,
  scoreSkillAssessmentAttemptServerSide,
} from '../../src/engine/readinessEngine';

/**
 * WAYFINDER — Canonical Server Authority (`netlify/functions/wayfinder-api.ts`)
 *
 * Security & Architecture Invariants:
 * 1. Single scoring & privileged operations authority (`netlify/functions/wayfinder-api.ts`).
 * 2. Never expose `SUPABASE_SERVICE_ROLE_KEY` or assessment answer keys to the browser.
 * 3. Verify caller Bearer JWT against Supabase Auth (`/auth/v1/user`) and load the caller's
 *    authoritative role and institution from `public.wayfinder_profiles` before performing
 *    any `service_role` operation.
 * 4. Enforce `CLAIM !== CAPABILITY !== PROOF` and `Unknown = NULL !== 0`.
 */

export const FRONTEND_TO_DB_DIMENSION_MAP: Record<CapabilityDimensionId, string> = {
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

export const DB_TO_FRONTEND_DIMENSION_MAP: Record<string, CapabilityDimensionId> = {
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

export function toCanonicalDbDimensionId(dimId: string): string {
  if (dimId in FRONTEND_TO_DB_DIMENSION_MAP) {
    return FRONTEND_TO_DB_DIMENSION_MAP[dimId as CapabilityDimensionId];
  }
  if (dimId in DB_TO_FRONTEND_DIMENSION_MAP) {
    return dimId;
  }
  return 'DOMAIN_FOUNDATIONS';
}

export interface ServerGapRequestPayload {
  requiredLevel: RubricLevel | null;
  demonstratedLevel: RubricLevel | null;
  requirementRubricVersion: string;
  capabilityRubricVersion: string;
}

export interface ServerSkillAssessmentScoreRequest {
  userId: string;
  assessmentId: string;
  responses: Record<string, string | string[]>;
}

/**
 * Trusted server-side gap calculation endpoint helper.
 * Preserves null when demonstratedLevel is unknown or rubric versions mismatch.
 */
export function computeTrustedGapServerSide(payload: ServerGapRequestPayload): {
  numericGap: number | null;
  rubricCompatible: boolean;
  authority: string;
} {
  const rubricCompatible =
    payload.requirementRubricVersion === payload.capabilityRubricVersion;
  const numericGap = calculateNumericGap(
    payload.requiredLevel,
    payload.demonstratedLevel,
    payload.requirementRubricVersion,
    payload.capabilityRubricVersion
  );
  return {
    numericGap,
    rubricCompatible,
    authority: 'WAYFINDER_SERVER_ENGINE_V2',
  };
}

/**
 * Trusted server-side cohort k-anonymity suppression helper (k >= 5).
 */
export function enforceCohortSuppressionServerSide(
  cohort: InstitutionCohortRecord,
  thresholdK = 5
): {
  suppressed: boolean;
  thresholdK: number;
  cohort: InstitutionCohortRecord;
} {
  const effectiveK = Math.max(5, thresholdK);
  const [evaluated] = evaluateInstitutionCohortSuppression([cohort], effectiveK);
  return {
    suppressed: evaluated.isSuppressed,
    thresholdK: effectiveK,
    cohort: evaluated,
  };
}

/**
 * Trusted server-side skill assessment scoring authority.
 * Answer keys remain strictly on the server and are never exposed to the client.
 */
export function scoreSkillAssessmentServerSideEndpoint(
  req: ServerSkillAssessmentScoreRequest
): {
  ok: boolean;
  authority: string;
  attempt: SkillAssessmentAttempt | null;
  errorMessage?: string;
} {
  const foundAssessment = INITIAL_SKILL_ASSESSMENTS.find(
    (a) => a.id === req.assessmentId
  );
  if (!foundAssessment) {
    return {
      ok: false,
      authority: 'WAYFINDER_SERVER_ENGINE_V2',
      attempt: null,
      errorMessage: `Skill assessment ${req.assessmentId} not found.`,
    };
  }

  const attempt = scoreSkillAssessmentAttemptServerSide(
    foundAssessment,
    req.responses,
    req.userId || 'AUTHENTICATED_STUDENT',
    INITIAL_LEARNING_RESOURCES
  );

  return {
    ok: attempt.completionStatus !== 'INCOMPLETE_VALIDATION_ERROR',
    authority: 'WAYFINDER_SERVER_ENGINE_V2',
    attempt,
  };
}

interface VerifiedCallerContext {
  userId: string;
  email: string;
  role: 'STUDENT' | 'REVIEWER' | 'INSTITUTION' | 'ADMIN';
  institutionId: string | null;
  accessToken: string;
}

function getServerSupabaseConfig(): {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  isConfigured: boolean;
} {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  const supabaseUrl = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const anonKey = (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return {
    supabaseUrl,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(
      supabaseUrl &&
        anonKey &&
        serviceRoleKey &&
        !supabaseUrl.includes('your-project-ref')
    ),
  };
}

function extractBearerToken(
  headers?: Record<string, string | undefined>
): string | null {
  if (!headers) return null;
  const rawAuth = headers.authorization || headers.Authorization || '';
  if (!rawAuth.toLowerCase().startsWith('bearer ')) return null;
  const token = rawAuth.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function verifyCallerAndLoadProfile(
  headers?: Record<string, string | undefined>
): Promise<{
  caller?: VerifiedCallerContext;
  error?: string;
  statusCode?: number;
}> {
  const config = getServerSupabaseConfig();
  const token = extractBearerToken(headers);

  if (!config.isConfigured) {
    return {
      error:
        'Server Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are not configured.',
      statusCode: 503,
    };
  }

  if (!token) {
    return {
      error: 'Missing Bearer authorization token.',
      statusCode: 401,
    };
  }

  const authResp = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!authResp.ok) {
    return {
      error: 'Invalid or expired Supabase user session token.',
      statusCode: 401,
    };
  }

  const authUser = (await authResp.json()) as { id?: string; email?: string };
  if (!authUser?.id) {
    return {
      error: 'Authenticated user identifier missing from token payload.',
      statusCode: 401,
    };
  }

  const profileResp = await fetch(
    `${config.supabaseUrl}/rest/v1/wayfinder_profiles?id=eq.${encodeURIComponent(
      authUser.id
    )}&select=id,email,role,institution_id`,
    {
      method: 'GET',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Accept: 'application/json',
      },
    }
  );

  if (!profileResp.ok) {
    return {
      error: 'Failed to load authoritative caller profile from wayfinder_profiles.',
      statusCode: 500,
    };
  }

  const rows = (await profileResp.json()) as Array<{
    id: string;
    email: string;
    role: string;
    institution_id: string | null;
  }>;

  const profile = rows[0];
  const normalizedRole = (
    profile?.role || 'STUDENT'
  ).toUpperCase() as VerifiedCallerContext['role'];

  return {
    caller: {
      userId: authUser.id,
      email: profile?.email || authUser.email || '',
      role: ['STUDENT', 'REVIEWER', 'INSTITUTION', 'ADMIN'].includes(
        normalizedRole
      )
        ? normalizedRole
        : 'STUDENT',
      institutionId: profile?.institution_id ?? null,
      accessToken: token,
    },
  };
}

async function serviceRoleRestRequest<T = unknown>(
  pathWithQuery: string,
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    prefer?: string;
  }
): Promise<{ ok: boolean; status: number; data?: T; errorText?: string }> {
  const config = getServerSupabaseConfig();
  const headers: Record<string, string> = {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  const resp = await fetch(`${config.supabaseUrl}/rest/v1/${pathWithQuery}`, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await resp.text();
  if (!resp.ok) {
    return { ok: false, status: resp.status, errorText: text };
  }

  if (!text) {
    return { ok: true, status: resp.status };
  }

  try {
    return { ok: true, status: resp.status, data: JSON.parse(text) as T };
  } catch {
    return { ok: true, status: resp.status };
  }
}

export async function handler(event: {
  httpMethod: string;
  path?: string;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
  body: string | null;
}) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const path = event.path || '';

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // -------------------------------------------------------------------------
    // 1. POST /assessments/aptitude/score — Server-Side Aptitude Scoring + DB Write
    // -------------------------------------------------------------------------
    if (path.endsWith('/assessments/aptitude/score') && event.httpMethod === 'POST') {
      const domain = (body.domain || 'NUMERICAL') as AptitudeDomain;
      const selectedOptions = (body.selectedOptions || {}) as Record<string, string>;
      const enableSpatial = Boolean(body.enableSpatialReasoning);

      const activeItems = getActiveAptitudeItems(enableSpatial).filter(
        (i) => i.domain === domain
      );
      const scored = scoreAptitudeAttemptServerSide(activeItems, selectedOptions);

      const domainToCapabilityMap: Record<AptitudeDomain, CapabilityDimensionId> = {
        NUMERICAL: 'CAP_NUM_QUANT',
        VERBAL: 'CAP_TECH_COMM',
        LOGICAL: 'CAP_PROB_SOLV',
        TARGET_KNOWLEDGE: 'CAP_PROG_SW',
        SPATIAL: 'CAP_SYS_DESIGN',
      };
      const targetCapId = domainToCapabilityMap[domain];
      const dbDimensionId = toCanonicalDbDimensionId(targetCapId);

      let attemptId = `APT_${domain}_${Date.now()}`;

      const config = getServerSupabaseConfig();
      if (config.isConfigured && extractBearerToken(event.headers)) {
        const authCheck = await verifyCallerAndLoadProfile(event.headers);
        if (authCheck.caller) {
          const studentId = authCheck.caller.userId;
          const confidenceBand =
            scored.totalItems >= 3
              ? 'HIGH'
              : scored.totalItems >= 2
              ? 'MODERATE'
              : 'LOW';

          const attemptInsert = await serviceRoleRestRequest<Array<{ id: string }>>(
            'aptitude_attempts',
            {
              method: 'POST',
              prefer: 'return=representation',
              body: {
                student_id: studentId,
                dimension_id: dbDimensionId,
                assessment_version: 'RUBRIC_V1',
                submitted_answers: selectedOptions,
                raw_score: scored.correctCount,
                max_score: Math.max(1, scored.totalItems),
                normalized_percent: scored.percentage,
                derived_level: scored.mappedRubricLevel,
                confidence_band: confidenceBand,
                scored_by_server: true,
              },
            }
          );

          if (attemptInsert.data?.[0]?.id) {
            attemptId = attemptInsert.data[0].id;
          }

          const existingCap = await serviceRoleRestRequest<
            Array<{
              id: string;
              objective_score_level: number | null;
              verified_level: number | null;
            }>
          >(
            `capability_records?student_id=eq.${encodeURIComponent(
              studentId
            )}&dimension_id=eq.${encodeURIComponent(
              dbDimensionId
            )}&select=id,objective_score_level,verified_level`,
            { method: 'GET' }
          );

          const existingRow = existingCap.data?.[0];
          const bestObj =
            existingRow?.objective_score_level !== null &&
            existingRow?.objective_score_level !== undefined
              ? Math.max(existingRow.objective_score_level, scored.mappedRubricLevel)
              : scored.mappedRubricLevel;
          const newVerificationState =
            existingRow?.verified_level !== null &&
            existingRow?.verified_level !== undefined
              ? 'FULLY_CORROBORATED'
              : 'OBJECTIVELY_ASSESSED';

          await serviceRoleRestRequest(
            'capability_records?on_conflict=student_id,dimension_id',
            {
              method: 'POST',
              prefer: 'resolution=merge-duplicates',
              body: {
                student_id: studentId,
                dimension_id: dbDimensionId,
                objective_score_level: bestObj,
                objective_raw_percent: scored.percentage,
                verification_state: newVerificationState,
                latest_aptitude_attempt_id: attemptInsert.data?.[0]?.id ?? null,
              },
            }
          );
        }
      }

      const attemptResult: AptitudeAttemptResult = {
        id: attemptId,
        domain,
        completedAt: new Date().toISOString(),
        totalItems: scored.totalItems,
        correctCount: scored.correctCount,
        percentage: scored.percentage,
        mappedRubricLevel: scored.mappedRubricLevel,
        rubricVersion: 'RUBRIC_V1',
      };

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          authority: 'WAYFINDER_SERVER_ENGINE_V2',
          attempt: attemptResult,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 2. POST /assessments/skill/score — Server-Side Skill Assessment Scoring + DB Write
    // -------------------------------------------------------------------------
    if (path.endsWith('/assessments/skill/score') && event.httpMethod === 'POST') {
      const scoredRes = scoreSkillAssessmentServerSideEndpoint(
        body as ServerSkillAssessmentScoreRequest
      );

      const attempt = scoredRes.attempt;
      const config = getServerSupabaseConfig();

      if (
        attempt &&
        attempt.completionStatus === 'COMPLETED_SCORED' &&
        config.isConfigured &&
        extractBearerToken(event.headers)
      ) {
        const authCheck = await verifyCallerAndLoadProfile(event.headers);
        if (authCheck.caller) {
          const studentId = authCheck.caller.userId;
          const dbDimensionId = toCanonicalDbDimensionId(
            attempt.mappedCapabilityId
          );
          const derivedLevel = (attempt.awardedRubricLevel ?? 0) as RubricLevel;
          const rawScore = attempt.scorePercentage ?? 0;
          const confidenceBand =
            attempt.totalItems >= 4
              ? 'HIGH'
              : attempt.totalItems >= 2
              ? 'MODERATE'
              : 'LOW';

          const skillAttemptInsert = await serviceRoleRestRequest<
            Array<{ id: string }>
          >('skill_assessment_attempts', {
            method: 'POST',
            prefer: 'return=representation',
            body: {
              student_id: studentId,
              skill_id: attempt.skillId,
              assessment_id: attempt.assessmentId,
              assessment_version: attempt.assessmentVersion,
              submitted_answers: body.responses || {},
              total_items: attempt.totalItems,
              correct_items: attempt.correctCount,
              raw_score: rawScore,
              derived_level: derivedLevel,
              confidence_band: confidenceBand,
              demonstrated_strengths: attempt.demonstratedStrengths,
              areas_needing_development: attempt.areasNeedingDevelopment,
              item_feedback_json: attempt.itemFeedback,
              recommended_resource_ids: attempt.recommendedResourceIds,
              scored_by_server: true,
            },
          });

          const insertedAttemptId = skillAttemptInsert.data?.[0]?.id ?? null;

          if (attempt.awardedRubricLevel !== null) {
            const existingSkillProf = await serviceRoleRestRequest<
              Array<{
                id: string;
                assessment_level: number | null;
                verified_level: number | null;
              }>
            >(
              `user_skill_profiles?student_id=eq.${encodeURIComponent(
                studentId
              )}&skill_id=eq.${encodeURIComponent(
                attempt.skillId
              )}&select=id,assessment_level,verified_level`,
              { method: 'GET' }
            );
            const prevSkillObj =
              existingSkillProf.data?.[0]?.assessment_level ?? null;
            const bestSkillObj =
              prevSkillObj === null
                ? derivedLevel
                : Math.max(prevSkillObj, derivedLevel);
            const hasVerified =
              existingSkillProf.data?.[0]?.verified_level !== null &&
              existingSkillProf.data?.[0]?.verified_level !== undefined;

            await serviceRoleRestRequest(
              'user_skill_profiles?on_conflict=student_id,skill_id',
              {
                method: 'POST',
                prefer: 'resolution=merge-duplicates',
                body: {
                  student_id: studentId,
                  skill_id: attempt.skillId,
                  assessment_level: bestSkillObj,
                  verification_state: hasVerified
                    ? 'FULLY_CORROBORATED'
                    : 'OBJECTIVELY_ASSESSED',
                  latest_attempt_id: insertedAttemptId,
                },
              }
            );

            const existingCap = await serviceRoleRestRequest<
              Array<{
                objective_score_level: number | null;
                verified_level: number | null;
              }>
            >(
              `capability_records?student_id=eq.${encodeURIComponent(
                studentId
              )}&dimension_id=eq.${encodeURIComponent(
                dbDimensionId
              )}&select=objective_score_level,verified_level`,
              { method: 'GET' }
            );
            const prevObj =
              existingCap.data?.[0]?.objective_score_level ?? null;
            const prevVer = existingCap.data?.[0]?.verified_level ?? null;
            const bestObj =
              prevObj === null ? derivedLevel : Math.max(prevObj, derivedLevel);

            await serviceRoleRestRequest(
              'capability_records?on_conflict=student_id,dimension_id',
              {
                method: 'POST',
                prefer: 'resolution=merge-duplicates',
                body: {
                  student_id: studentId,
                  dimension_id: dbDimensionId,
                  objective_score_level: bestObj,
                  objective_raw_percent: rawScore,
                  verification_state:
                    prevVer !== null
                      ? 'FULLY_CORROBORATED'
                      : 'OBJECTIVELY_ASSESSED',
                },
              }
            );
          }
        }
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: scoredRes.ok ? 'OK' : 'VALIDATION_ERROR',
          ...scoredRes,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 3. POST /evidence/verify-upload — Technical Validation of Evidence Submission
    // -------------------------------------------------------------------------
    if (path.endsWith('/evidence/verify-upload') && event.httpMethod === 'POST') {
      const authCheck = await verifyCallerAndLoadProfile(event.headers);
      if (!authCheck.caller) {
        return {
          statusCode: authCheck.statusCode || 401,
          headers: corsHeaders,
          body: JSON.stringify({ status: 'ERROR', message: authCheck.error }),
        };
      }

      const evidenceId = String(body.evidenceId || '').trim();
      if (!evidenceId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'evidenceId is required.',
          }),
        };
      }

      const evResp = await serviceRoleRestRequest<
        Array<{
          id: string;
          student_id: string;
          status: string;
          storage_object_path: string | null;
          external_url: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
        }>
      >(
        `evidence_submissions?id=eq.${encodeURIComponent(
          evidenceId
        )}&select=id,student_id,status,storage_object_path,external_url,file_size_bytes,mime_type`,
        { method: 'GET' }
      );

      const ev = evResp.data?.[0];
      if (!ev) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Evidence submission not found.',
          }),
        };
      }

      if (
        ev.student_id !== authCheck.caller.userId &&
        authCheck.caller.role !== 'ADMIN'
      ) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Not authorized to verify this submission.',
          }),
        };
      }

      const allowedMimeTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'text/plain',
        'text/markdown',
        'application/zip',
      ];
      const hasValidReference = Boolean(
        ev.storage_object_path || ev.external_url
      );
      const validSize =
        ev.file_size_bytes === null ||
        (ev.file_size_bytes > 0 && ev.file_size_bytes <= 15728640);
      const validMime =
        ev.mime_type === null || allowedMimeTypes.includes(ev.mime_type);

      const nextStatus =
        hasValidReference && validSize && validMime
          ? 'TECHNICAL_VALIDATION_PASSED'
          : 'TECHNICAL_VALIDATION_FAILED';

      await serviceRoleRestRequest(
        `evidence_submissions?id=eq.${encodeURIComponent(evidenceId)}`,
        {
          method: 'PATCH',
          body: { status: nextStatus },
        }
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          evidenceId,
          validationStatus: nextStatus,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 4. POST /evidence/signed-url — Short-Lived 300s Signed URL + Audit Event
    // -------------------------------------------------------------------------
    if (path.endsWith('/evidence/signed-url') && event.httpMethod === 'POST') {
      const authCheck = await verifyCallerAndLoadProfile(event.headers);
      if (!authCheck.caller) {
        return {
          statusCode: authCheck.statusCode || 401,
          headers: corsHeaders,
          body: JSON.stringify({ status: 'ERROR', message: authCheck.error }),
        };
      }

      const evidenceId = String(body.evidenceId || '').trim();
      const evResp = await serviceRoleRestRequest<
        Array<{
          id: string;
          student_id: string;
          assigned_reviewer_id: string | null;
          storage_bucket: string;
          storage_object_path: string | null;
        }>
      >(
        `evidence_submissions?id=eq.${encodeURIComponent(
          evidenceId
        )}&select=id,student_id,assigned_reviewer_id,storage_bucket,storage_object_path`,
        { method: 'GET' }
      );

      const ev = evResp.data?.[0];
      if (!ev || !ev.storage_object_path) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Evidence file object not found.',
          }),
        };
      }

      const isOwner = ev.student_id === authCheck.caller.userId;
      const isAssignedReviewer =
        authCheck.caller.role === 'REVIEWER' &&
        ev.assigned_reviewer_id === authCheck.caller.userId &&
        ev.student_id !== authCheck.caller.userId;
      const isAdmin = authCheck.caller.role === 'ADMIN';

      if (!isOwner && !isAssignedReviewer && !isAdmin) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message:
              'Access denied: Only the owning student, the actively assigned reviewer, or an Admin may request a signed artifact URL.',
          }),
        };
      }

      const config = getServerSupabaseConfig();
      const signResp = await fetch(
        `${config.supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(
          ev.storage_bucket || 'evidence-artifacts'
        )}/${ev.storage_object_path}`,
        {
          method: 'POST',
          headers: {
            apikey: config.serviceRoleKey,
            Authorization: `Bearer ${config.serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresIn: 300 }),
        }
      );

      if (!signResp.ok) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Failed to issue storage signed URL.',
          }),
        };
      }

      const signJson = (await signResp.json()) as { signedURL?: string };

      await serviceRoleRestRequest('audit_events', {
        method: 'POST',
        body: {
          actor_id: authCheck.caller.userId,
          actor_role: authCheck.caller.role,
          event_type: 'EVIDENCE_FILE_ACCESSED',
          target_table: 'evidence_submissions',
          target_record_id: ev.id,
          metadata: { expires_in_seconds: 300 },
        },
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          signedUrl: signJson.signedURL
            ? `${config.supabaseUrl}/storage/v1${signJson.signedURL}`
            : null,
          expiresInSeconds: 300,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 5. POST /reviews/claim — Reviewer Self-Claim Unassigned Evidence
    // -------------------------------------------------------------------------
    if (path.endsWith('/reviews/claim') && event.httpMethod === 'POST') {
      const authCheck = await verifyCallerAndLoadProfile(event.headers);
      if (!authCheck.caller) {
        return {
          statusCode: authCheck.statusCode || 401,
          headers: corsHeaders,
          body: JSON.stringify({ status: 'ERROR', message: authCheck.error }),
        };
      }

      if (!['REVIEWER', 'ADMIN'].includes(authCheck.caller.role)) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Only REVIEWER or ADMIN may claim evidence submissions.',
          }),
        };
      }

      const evidenceId = String(body.evidenceId || '').trim();
      const targetReviewerId =
        authCheck.caller.role === 'ADMIN' && body.reviewerId
          ? String(body.reviewerId)
          : authCheck.caller.userId;

      const evResp = await serviceRoleRestRequest<
        Array<{
          id: string;
          student_id: string;
          status: string;
          assigned_reviewer_id: string | null;
        }>
      >(
        `evidence_submissions?id=eq.${encodeURIComponent(
          evidenceId
        )}&select=id,student_id,status,assigned_reviewer_id`,
        { method: 'GET' }
      );

      const ev = evResp.data?.[0];
      if (!ev) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Evidence submission not found.',
          }),
        };
      }

      if (ev.student_id === targetReviewerId) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Self-review is prohibited.',
          }),
        };
      }

      if (
        !['TECHNICAL_VALIDATION_PASSED', 'SUBMITTED', 'UNDER_REVIEW'].includes(
          ev.status
        )
      ) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: `Submission in status ${ev.status} cannot be claimed for review.`,
          }),
        };
      }

      if (
        ev.assigned_reviewer_id &&
        ev.assigned_reviewer_id !== targetReviewerId &&
        authCheck.caller.role !== 'ADMIN'
      ) {
        return {
          statusCode: 409,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Submission is already claimed by another reviewer.',
          }),
        };
      }

      await serviceRoleRestRequest(
        `evidence_submissions?id=eq.${encodeURIComponent(evidenceId)}`,
        {
          method: 'PATCH',
          body: {
            assigned_reviewer_id: targetReviewerId,
            status: 'UNDER_REVIEW',
          },
        }
      );

      await serviceRoleRestRequest('audit_events', {
        method: 'POST',
        body: {
          actor_id: authCheck.caller.userId,
          actor_role: authCheck.caller.role,
          event_type: 'EVIDENCE_REVIEW_CLAIMED',
          target_table: 'evidence_submissions',
          target_record_id: evidenceId,
          metadata: { assigned_reviewer_id: targetReviewerId },
        },
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          evidenceId,
          assignedReviewerId: targetReviewerId,
          reviewStatus: 'UNDER_REVIEW',
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 6. POST /reviews/submit-decision — Immutable Review Record + Per-Skill Decisions
    // -------------------------------------------------------------------------
    if (path.endsWith('/reviews/submit-decision') && event.httpMethod === 'POST') {
      const authCheck = await verifyCallerAndLoadProfile(event.headers);
      if (!authCheck.caller) {
        return {
          statusCode: authCheck.statusCode || 401,
          headers: corsHeaders,
          body: JSON.stringify({ status: 'ERROR', message: authCheck.error }),
        };
      }

      if (!['REVIEWER', 'ADMIN'].includes(authCheck.caller.role)) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Only REVIEWER or ADMIN may submit review decisions.',
          }),
        };
      }

      const evidenceId = String(body.evidenceId || '').trim();
      const rawDecision = String(body.decision || '').toUpperCase();
      // Map frontend ACCEPTED / REVISION_REQUESTED / REJECTED to SQL VERIFIED / REVISION_REQUIRED / REJECTED
      const dbDecision =
        rawDecision === 'ACCEPTED' || rawDecision === 'VERIFIED'
          ? 'VERIFIED'
          : rawDecision === 'PARTIALLY_VERIFIED'
          ? 'PARTIALLY_VERIFIED'
          : rawDecision === 'REVISION_REQUESTED' ||
            rawDecision === 'REVISION_REQUIRED'
          ? 'REVISION_REQUIRED'
          : 'REJECTED';

      const verifiedLevelInput =
        body.verifiedLevel !== null && body.verifiedLevel !== undefined
          ? Number(body.verifiedLevel)
          : null;
      const rationale = String(body.rationale || '').trim();
      const dimensions = (body.dimensions || {}) as Partial<EvidenceReviewDimensions>;
      const skillDecisions = Array.isArray(body.skillDecisions)
        ? body.skillDecisions
        : [];

      if (rationale.length < 10) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Reviewer rationale must be at least 10 characters.',
          }),
        };
      }

      const evResp = await serviceRoleRestRequest<
        Array<{
          id: string;
          student_id: string;
          status: string;
          assigned_reviewer_id: string | null;
        }>
      >(
        `evidence_submissions?id=eq.${encodeURIComponent(
          evidenceId
        )}&select=id,student_id,status,assigned_reviewer_id`,
        { method: 'GET' }
      );

      const ev = evResp.data?.[0];
      if (!ev) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Evidence submission not found.',
          }),
        };
      }

      if (ev.student_id === authCheck.caller.userId) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Self-review is prohibited.',
          }),
        };
      }

      // Ensure submission is in UNDER_REVIEW and assigned to the caller before inserting review_records
      if (
        ev.status !== 'UNDER_REVIEW' ||
        ev.assigned_reviewer_id !== authCheck.caller.userId
      ) {
        if (
          ev.assigned_reviewer_id &&
          ev.assigned_reviewer_id !== authCheck.caller.userId &&
          authCheck.caller.role !== 'ADMIN'
        ) {
          return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({
              status: 'ERROR',
              message:
                'This evidence submission is assigned to another reviewer.',
            }),
          };
        }

        await serviceRoleRestRequest(
          `evidence_submissions?id=eq.${encodeURIComponent(evidenceId)}`,
          {
            method: 'PATCH',
            body: {
              assigned_reviewer_id: authCheck.caller.userId,
              status: 'UNDER_REVIEW',
            },
          }
        );
      }

      const verifiedLevelForDb =
        dbDecision === 'VERIFIED' || dbDecision === 'PARTIALLY_VERIFIED'
          ? Math.max(1, Math.min(4, verifiedLevelInput ?? 2))
          : null;

      const reviewInsert = await serviceRoleRestRequest<Array<{ id: string }>>(
        'review_records',
        {
          method: 'POST',
          prefer: 'return=representation',
          body: {
            evidence_id: evidenceId,
            reviewer_id: authCheck.caller.userId,
            decision: dbDecision,
            verified_level: verifiedLevelForDb,
            confidence_level: 'HIGH',
            rationale,
            rubric_breakdown: dimensions,
          },
        }
      );

      if (!reviewInsert.ok || !reviewInsert.data?.[0]?.id) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message:
              reviewInsert.errorText ||
              'Failed to record authoritative review decision.',
          }),
        };
      }

      const reviewId = reviewInsert.data[0].id;

      for (const sd of skillDecisions) {
        if (sd && sd.skillId) {
          const skillDec =
            dbDecision === 'REJECTED' || dbDecision === 'REVISION_REQUIRED'
              ? dbDecision
              : String(sd.decision || dbDecision).toUpperCase();
          const skillLvl =
            skillDec === 'VERIFIED' || skillDec === 'PARTIALLY_VERIFIED'
              ? Math.max(
                  1,
                  Math.min(4, Number(sd.verifiedSkillLevel ?? verifiedLevelForDb ?? 2))
                )
              : null;

          await serviceRoleRestRequest('review_skill_decisions', {
            method: 'POST',
            body: {
              review_id: reviewId,
              evidence_id: evidenceId,
              skill_id: String(sd.skillId),
              decision: skillDec,
              verified_skill_level: skillLvl,
              rationale: String(sd.rationale || rationale),
            },
          });
        }
      }

      await serviceRoleRestRequest('audit_events', {
        method: 'POST',
        body: {
          actor_id: authCheck.caller.userId,
          actor_role: authCheck.caller.role,
          event_type: 'EVIDENCE_REVIEW_DECISION_RECORDED',
          target_table: 'review_records',
          target_record_id: reviewId,
          metadata: {
            evidence_id: evidenceId,
            decision: dbDecision,
            verified_level: verifiedLevelForDb,
          },
        },
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          reviewId,
          evidenceId,
          decision: dbDecision,
          verifiedLevel: verifiedLevelForDb,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 7. POST /evidence/revoke — Administrative Evidence Revocation
    // -------------------------------------------------------------------------
    if (path.endsWith('/evidence/revoke') && event.httpMethod === 'POST') {
      const authCheck = await verifyCallerAndLoadProfile(event.headers);
      if (!authCheck.caller) {
        return {
          statusCode: authCheck.statusCode || 401,
          headers: corsHeaders,
          body: JSON.stringify({ status: 'ERROR', message: authCheck.error }),
        };
      }

      if (authCheck.caller.role !== 'ADMIN') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: 'Only ADMIN may revoke verified evidence.',
          }),
        };
      }

      const evidenceId = String(body.evidenceId || '').trim();
      const reason = String(body.reason || 'Administrative revocation').trim();

      const patchResp = await serviceRoleRestRequest(
        `evidence_submissions?id=eq.${encodeURIComponent(evidenceId)}`,
        {
          method: 'PATCH',
          body: { status: 'REVOKED' },
        }
      );

      if (!patchResp.ok) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: 'ERROR',
            message: patchResp.errorText || 'Revocation failed.',
          }),
        };
      }

      await serviceRoleRestRequest('audit_events', {
        method: 'POST',
        body: {
          actor_id: authCheck.caller.userId,
          actor_role: authCheck.caller.role,
          event_type: 'EVIDENCE_ADMINISTRATIVELY_REVOKED',
          target_table: 'evidence_submissions',
          target_record_id: evidenceId,
          metadata: { reason },
        },
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          evidenceId,
          newStatus: 'REVOKED',
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 8. POST /gap-analysis — Server-Side Gap Calculation
    // -------------------------------------------------------------------------
    if (path.endsWith('/gap-analysis') && event.httpMethod === 'POST') {
      const result = computeTrustedGapServerSide(body as ServerGapRequestPayload);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          computedAt: new Date().toISOString(),
          ...result,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // 9. POST /cohort-intelligence — Cohort Privacy & RPC Proxy
    // -------------------------------------------------------------------------
    if (path.endsWith('/cohort-intelligence') && event.httpMethod === 'POST') {
      const config = getServerSupabaseConfig();
      const token = extractBearerToken(event.headers);

      if (config.isConfigured && token && body.useDatabaseRpc) {
        const rpcResp = await fetch(
          `${config.supabaseUrl}/rest/v1/rpc/get_institution_cohort_aggregates`,
          {
            method: 'POST',
            headers: {
              apikey: config.anonKey,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              p_programme:
                body.programme && body.programme !== 'ALL' ? body.programme : null,
              p_graduation_year:
                body.graduationYear && body.graduationYear !== 'ALL'
                  ? Number(body.graduationYear)
                  : null,
            }),
          }
        );

        if (rpcResp.ok) {
          const rows = await rpcResp.json();
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              status: 'OK',
              authority: 'WAYFINDER_POSTGRES_RPC_COHORT_GUARD',
              rows,
            }),
          };
        }
      }

      const result = enforceCohortSuppressionServerSide(
        body.cohort as InstitutionCohortRecord,
        Number(body.thresholdK || 5)
      );
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'OK',
          authority: 'WAYFINDER_SERVER_PRIVACY_GUARD_V2',
          ...result,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'WAYFINDER_API_ONLINE',
        supabaseConfigured: getServerSupabaseConfig().isConfigured,
        endpoints: [
          'POST /.netlify/functions/wayfinder-api/assessments/aptitude/score',
          'POST /.netlify/functions/wayfinder-api/assessments/skill/score',
          'POST /.netlify/functions/wayfinder-api/evidence/verify-upload',
          'POST /.netlify/functions/wayfinder-api/evidence/signed-url',
          'POST /.netlify/functions/wayfinder-api/reviews/claim',
          'POST /.netlify/functions/wayfinder-api/reviews/submit-decision',
          'POST /.netlify/functions/wayfinder-api/evidence/revoke',
          'POST /.netlify/functions/wayfinder-api/gap-analysis',
          'POST /.netlify/functions/wayfinder-api/cohort-intelligence',
        ],
      }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'ERROR',
        message: err instanceof Error ? err.message : 'Invalid request payload',
      }),
    };
  }
}
