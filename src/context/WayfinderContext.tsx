import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActivityStatus,
  AptitudeAttemptResult,
  AptitudeDomain,
  AuditEvent,
  CapabilityDimensionId,
  CapabilityDimensionRecord,
  ContentReviewHistoryEntry,
  DevelopmentActivity,
  EditorialQualityStatus,
  EvidenceReviewDimensions,
  EvidenceSubmission,
  FeatureFlagsConfig,
  FieldCategory,
  HistoricalSnapshot,
  InstitutionCohortRecord,
  LearningResource,
  OpportunityTarget,
  PublicationStatus,
  ResourceIssueReport,
  RiasecAssessmentResult,
  Role,
  RubricLevel,
  ScreenId,
  SharingAuthorisation,
  SkillAssessmentAttempt,
  SkillAssessmentDefinition,
  SkillCatalogueEntry,
  StudentPortfolioRecord,
  StudentResourceProgress,
  StudentResourceProgressState,
  StudentSkillProficiencyRecord,
  UserProfile,
} from '../types/wayfinder';
import { CANONICAL_CAPABILITY_DIMENSIONS } from '../data/capabilityDimensions';
import { getActiveAptitudeItems } from '../data/aptitudeBank';
import {
  INITIAL_FIELD_CATEGORIES,
  INITIAL_SKILL_CATALOGUE,
} from '../data/fieldAndSkillLibrary';
import { INITIAL_SKILL_ASSESSMENTS } from '../data/skillAssessmentBank';
import { INITIAL_LEARNING_RESOURCES } from '../data/learningHubCatalogue';
import {
  buildGapDevelopmentActivity,
  computeTargetReadinessReport,
  RequirementEvaluationItem,
  scoreAptitudeAttemptServerSide,
  scoreRiasecInventory,
  scoreSkillAssessmentAttemptServerSide,
} from '../engine/readinessEngine';
import {
  AuthActionResult,
  deletePortfolioRecordFromSupabase,
  fetchHydratedUserStateFromSupabase,
  getActiveSupabaseSession,
  insertDevelopmentActivityInSupabase,
  insertPortfolioRecordInSupabase,
  insertReadinessSnapshotInSupabase,
  insertResourceQualityReportInSupabase,
  insertRiasecProfileInSupabase,
  isSupabaseEnvConfigured,
  sendPasswordRecoveryWithSupabase,
  signInWithSupabase,
  signOutFromSupabase,
  signUpWithSupabase,
  submitAptitudeAttemptViaBackend,
  submitEvidenceToSupabase,
  submitReviewerDecisionViaBackend,
  submitSkillAssessmentViaBackend,
  updateDevelopmentActivityInSupabase,
  updateProfileInSupabase,
  upsertLearningProgressInSupabase,
  upsertSelfReportedCapabilityInSupabase,
  upsertSharingConsentInSupabase,
} from '../services/supabaseBoundary';

export type DataLayerState = 'UNCONFIGURED' | 'LOADING' | 'EMPTY' | 'READY' | 'ERROR';

export interface WayfinderAppState {
  currentScreen: ScreenId;
  activeRole: Role;
  currentUser: UserProfile | null;
  featureFlags: FeatureFlagsConfig;
  riasecResult: RiasecAssessmentResult | null;
  aptitudeAttempts: AptitudeAttemptResult[];
  skillAssessmentAttempts: SkillAssessmentAttempt[];
  selectedSkillAssessmentId: string;
  fieldsCatalogue: FieldCategory[];
  skillsCatalogue: SkillCatalogueEntry[];
  skillAssessments: SkillAssessmentDefinition[];
  learningResources: LearningResource[];
  studentSkillRecords: StudentSkillProficiencyRecord[];
  resourceProgress: StudentResourceProgress[];
  resourceIssueReports: ResourceIssueReport[];
  contentReviewHistory: ContentReviewHistoryEntry[];
  capabilityRecords: CapabilityDimensionRecord[];
  portfolioRecords: StudentPortfolioRecord[];
  targets: OpportunityTarget[];
  selectedTargetId: string;
  activities: DevelopmentActivity[];
  evidenceSubmissions: EvidenceSubmission[];
  snapshots: HistoricalSnapshot[];
  sharingAuthorisations: SharingAuthorisation[];
  institutionCohorts: InstitutionCohortRecord[];
  auditEvents: AuditEvent[];
  supabaseConfigured: boolean;
  dataState: DataLayerState;
  dataErrorMessage: string | null;
}

const LEGACY_DEMO_KEYS = [
  'WAYFINDER_SIH26044_STATE_V2',
  'wayfinder_dev_competencies_v2',
  'wayfinder_dev_evidence_v2',
  'wayfinder_dev_activities_v2',
  'wayfinder_dev_snapshots_v2',
  'wayfinder_dev_shares_v2',
  'wayfinder_dev_audit_v2',
  'wayfinder_dev_riasec_v2',
  'wayfinder_dev_aptitude_v2',
  'wayfinder_dev_eligibility_v2',
];

export const SCREEN_TO_HASH: Record<ScreenId, string> = {
  '01_LANDING': '#overview',
  '02_REGISTER': '#register',
  '03_LOGIN': '#login',
  '04_ONBOARDING_CONSENT': '#onboarding',
  '05_STUDENT_DASHBOARD': '#dashboard',
  '06_ASSESSMENT_HUB': '#assessments',
  '07_RIASEC_ASSESSMENT': '#assessments/riasec',
  '08_APTITUDE_ASSESSMENT': '#assessments/aptitude',
  '09_SKILL_RUBRIC_ASSESSMENT': '#assessments/skills',
  '10_ASSESSMENT_RESULTS': '#assessments/results',
  '11_CAPABILITY_PASSPORT': '#passport',
  '12_OPPORTUNITY_DISCOVERY': '#opportunities',
  '13_OPPORTUNITY_DETAIL': '#opportunities/detail',
  '14_READINESS_GAP_ANALYSIS': '#readiness-gaps',
  '15_LEARNING_CENTRE': '#learning',
  '16_ACTIVITY_WORKSPACE': '#learning/workspace',
  '17_EVIDENCE_LEDGER': '#evidence',
  '18_REVIEWER_WORKSPACE': '#reviewer',
  '19_HISTORICAL_SNAPSHOTS': '#history',
  '20_PRIVACY_SHARING': '#privacy',
  '21_INSTITUTION_DASHBOARD': '#institution',
  '22_EDGE_STATES': '#governance',
  '23_JOB_MARKET_INTELLIGENCE': '#market-intelligence',
  '24_SKILL_INTELLIGENCE': '#skill-intelligence',
  '25_RESUME_BUILDER': '#resume-builder',
  '26_LINKEDIN_SUPPORT': '#linkedin-support',
  '27_STUDENT_UPDATES': '#market-updates',
  '28_ADMIN_INTELLIGENCE': '#admin-intelligence',
};

export const HASH_TO_SCREEN: Record<string, ScreenId> = Object.entries(
  SCREEN_TO_HASH
).reduce(
  (acc, [screenId, hash]) => {
    acc[hash.toLowerCase()] = screenId as ScreenId;
    acc[`#/${hash.slice(1).toLowerCase()}`] = screenId as ScreenId;
    acc[`#${screenId.toLowerCase()}`] = screenId as ScreenId;
    return acc;
  },
  {} as Record<string, ScreenId>
);

export function resolveScreenFromHash(rawHash: string): ScreenId {
  if (!rawHash) return '01_LANDING';
  const normalized = rawHash.trim().toLowerCase();
  if ( normalized === '#' || normalized === '#/' ) return '01_LANDING';
  return HASH_TO_SCREEN[normalized] || '01_LANDING';
}

export function createCleanInitialState(): WayfinderAppState {
  const configured = isSupabaseEnvConfigured();
  const initialScreen: ScreenId =
    typeof window !== 'undefined' && window.location?.hash
      ? resolveScreenFromHash(window.location.hash)
      : '01_LANDING';

  const emptyCapabilityRecords: CapabilityDimensionRecord[] =
    CANONICAL_CAPABILITY_DIMENSIONS.map((dim) => ({
      dimensionId: dim.id,
      rubricVersion: 'RUBRIC_V1',
      selfReportedLevel: null,
      selfReportedUpdatedAt: null,
      objectiveScoreLevel: null,
      verifiedEvidenceLevel: null,
      demonstratedLevel: null,
      evidenceSource: 'UNASSESSED',
      lastUpdatedAt: '',
    }));

  return {
    currentScreen: initialScreen,
    activeRole: 'ANONYMOUS',
    currentUser: null,
    featureFlags: {
      enableSpatialReasoning: false,
      uploadPolicyMode: 'ENG_SPEC_10MB',
      skillSelfReportScaleMode: 'BEHAVIORAL_0_4',
      aptitudeCooldownHours: 24,
      institutionSuppressionThresholdK: 5,
      maxShareExpiryDays: 90,
    },
    riasecResult: null,
    aptitudeAttempts: [],
    skillAssessmentAttempts: [],
    selectedSkillAssessmentId: 'ASM_SKL_SQL_V1',
    fieldsCatalogue: INITIAL_FIELD_CATEGORIES,
    skillsCatalogue: INITIAL_SKILL_CATALOGUE,
    skillAssessments: INITIAL_SKILL_ASSESSMENTS,
    learningResources: INITIAL_LEARNING_RESOURCES,
    studentSkillRecords: [],
    resourceProgress: [],
    resourceIssueReports: [],
    contentReviewHistory: [],
    capabilityRecords: emptyCapabilityRecords,
    portfolioRecords: [],
    targets: [],
    selectedTargetId: '',
    activities: [],
    evidenceSubmissions: [],
    snapshots: [],
    sharingAuthorisations: [],
    institutionCohorts: [],
    auditEvents: [],
    supabaseConfigured: configured,
    dataState: configured ? 'EMPTY' : 'UNCONFIGURED',
    dataErrorMessage: null,
  };
}

interface WayfinderContextValue {
  state: WayfinderAppState;
  navigateTo: (screen: ScreenId) => void;
  switchRole: (role: Role) => void;
  updateFeatureFlags: (partial: Partial<FeatureFlagsConfig>) => void;
  signUpAccount: (data: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<AuthActionResult>;
  signInAccount: (data: { email: string; password: string }) => Promise<AuthActionResult>;
  requestPasswordRecovery: (email: string) => Promise<AuthActionResult>;
  logout: () => void;
  updateOnboardingConsent: (consent: {
    acceptedDataProcessing: boolean;
    acceptedAssessmentTerms: boolean;
    acceptedEvidenceReviewTerms: boolean;
  }) => void;
  verifyEligibilityStatus: (eligibility: {
    enrolledStudentVerified: boolean;
    minimumAcademicStandingVerified: boolean;
  }) => void;
  updateStudentPersonalInfo: (info: {
    fullName: string;
    email: string;
    institutionName: string;
    program: string;
    statedCareerGoal: string;
  }) => void;
  addStudentPortfolioRecord: (
    record: Omit<StudentPortfolioRecord, 'id' | 'createdAt' | 'verificationState'>
  ) => void;
  removeStudentPortfolioRecord: (recordId: string) => void;
  promotePortfolioRecordToEvidence: (recordId: string, claimedLevel: RubricLevel) => void;
  submitRiasecResponses: (responses: Record<string, number>) => void;
  submitAptitudeDomainAttempt: (
    domain: AptitudeDomain,
    selectedOptions: Record<string, string>
  ) => void;
  selectSkillAssessment: (assessmentId: string) => void;
  submitSkillAssessmentAttempt: (
    assessmentId: string,
    responses: Record<string, string | string[]>
  ) => SkillAssessmentAttempt | null;
  updateResourceProgress: (
    resourceId: string,
    status: StudentResourceProgressState,
    notes?: string
  ) => void;
  reportLearningResourceIssue: (
    resourceId: string,
    reason: ResourceIssueReport['reason'],
    details: string
  ) => void;
  addCustomFieldCategory: (
    field: Omit<FieldCategory, 'version' | 'publicationStatus'>
  ) => void;
  addCustomSkillToCatalogue: (
    skill: Omit<SkillCatalogueEntry, 'version' | 'publicationStatus'>
  ) => void;
  addCustomLearningResource: (
    resource: Omit<
      LearningResource,
      'id' | 'lastCheckedAt' | 'linkVerificationStatus' | 'editorialStatus'
    >
  ) => void;
  updateSkillPublicationStatus: (
    skillId: string,
    nextStatus: PublicationStatus,
    reviewNotes: string
  ) => boolean;
  updateResourceEditorialStatus: (
    resourceId: string,
    nextStatus: EditorialQualityStatus,
    reviewNotes: string
  ) => boolean;
  updateSelfReportedSkill: (
    dimensionId: CapabilityDimensionId,
    level: RubricLevel | null
  ) => void;
  selectTarget: (targetId: string) => void;
  createCustomTarget: (target: OpportunityTarget) => void;
  addGapDevelopmentPlanActivity: (
    target: OpportunityTarget,
    evaluation: RequirementEvaluationItem
  ) => void;
  updateActivityProgress: (
    activityId: string,
    status: ActivityStatus,
    progressPercent: number,
    reflectionNotes: string
  ) => void;
  submitEvidence: (submission: {
    title: string;
    description: string;
    linkedDimensionId: CapabilityDimensionId;
    linkedTargetId?: string;
    claimedRubricLevel: RubricLevel;
    evidenceType: 'FILE' | 'URL';
    fileName?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    url?: string;
  }) => void;
  submitReviewerDecision: (
    evidenceId: string,
    decision: 'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED',
    verifiedLevel: RubricLevel | null,
    dimensions: EvidenceReviewDimensions,
    rationale: string
  ) => void;
  createManualSnapshot: (note: string) => void;
  createSharingAuthorisation: (
    recipientInstitution: string,
    scopeTargetId: string,
    includeEvidenceMetadata: boolean,
    durationDays: number
  ) => void;
  revokeSharingAuthorisation: (shareId: string) => void;
  clearSessionState: () => void;
}

const WayfinderContext = createContext<WayfinderContextValue | undefined>(undefined);

export const WayfinderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WayfinderAppState>(() => createCleanInitialState());

  // Purge any previously stored demo/seed records from browser localStorage on mount
  useEffect(() => {
    try {
      for (const key of LEGACY_DEMO_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage access errors in restricted frames
    }
  }, []);

  // Hydrate authenticated user state from Supabase PostgreSQL when a session token is active
  const hydrateFromSupabaseBackend = async (userId: string, accessToken?: string | null) => {
    if (!isSupabaseEnvConfigured()) return;
    try {
      const hydrated = await fetchHydratedUserStateFromSupabase(userId, accessToken);
      if (!hydrated) return;

      setState((prev) => ({
        ...prev,
        currentUser: hydrated.profile || prev.currentUser,
        activeRole: hydrated.profile?.role || prev.activeRole,
        capabilityRecords:
          hydrated.capabilityRecords.length === 10
            ? hydrated.capabilityRecords
            : prev.capabilityRecords,
        riasecResult: hydrated.riasecResult || prev.riasecResult,
        aptitudeAttempts:
          hydrated.aptitudeAttempts.length > 0
            ? hydrated.aptitudeAttempts
            : prev.aptitudeAttempts,
        skillAssessmentAttempts:
          hydrated.skillAssessmentAttempts.length > 0
            ? hydrated.skillAssessmentAttempts
            : prev.skillAssessmentAttempts,
        studentSkillRecords:
          hydrated.studentSkillRecords.length > 0
            ? hydrated.studentSkillRecords
            : prev.studentSkillRecords,
        evidenceSubmissions:
          hydrated.evidenceSubmissions.length > 0
            ? hydrated.evidenceSubmissions
            : prev.evidenceSubmissions,
        portfolioRecords:
          hydrated.portfolioRecords.length > 0
            ? hydrated.portfolioRecords
            : prev.portfolioRecords,
        activities:
          hydrated.activities.length > 0 ? hydrated.activities : prev.activities,
        resourceProgress:
          hydrated.resourceProgress.length > 0
            ? hydrated.resourceProgress
            : prev.resourceProgress,
        snapshots:
          hydrated.snapshots.length > 0 ? hydrated.snapshots : prev.snapshots,
        sharingAuthorisations:
          hydrated.sharingAuthorisations.length > 0
            ? hydrated.sharingAuthorisations
            : prev.sharingAuthorisations,
        auditEvents:
          hydrated.auditEvents.length > 0
            ? [...hydrated.auditEvents, ...prev.auditEvents]
            : prev.auditEvents,
        dataState: 'READY',
        dataErrorMessage: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        dataState: 'ERROR',
        dataErrorMessage:
          err instanceof Error ? err.message : 'Unable to hydrate records from Supabase.',
      }));
    }
  };

  // Restore active Supabase session on mount if configured
  useEffect(() => {
    if (!isSupabaseEnvConfigured()) return;
    const { accessToken, userId } = getActiveSupabaseSession();
    if (accessToken && userId) {
      void hydrateFromSupabaseBackend(userId, accessToken);
    }
  }, []);

  // Synchronize browser history (Back/Forward buttons & URL hash refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHash = SCREEN_TO_HASH[state.currentScreen];
    if (!window.location.hash && state.currentScreen === '01_LANDING') {
      window.history.replaceState({ screen: state.currentScreen }, '', initialHash);
    }

    const handleLocationSync = () => {
      const targetScreen = resolveScreenFromHash(window.location.hash);
      setState((prev) =>
        prev.currentScreen === targetScreen ? prev : { ...prev, currentScreen: targetScreen }
      );
    };

    window.addEventListener('popstate', handleLocationSync);
    window.addEventListener('hashchange', handleLocationSync);
    return () => {
      window.removeEventListener('popstate', handleLocationSync);
      window.removeEventListener('hashchange', handleLocationSync);
    };
  }, []);

  const appendAudit = (
    prevState: WayfinderAppState,
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ): AuditEvent[] => {
    const newEvent: AuditEvent = {
      id: `AUD_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: prevState.currentUser?.id || 'ANONYMOUS',
      actorRole: prevState.activeRole,
      action,
      entityType,
      entityId,
      details,
    };
    return [newEvent, ...prevState.auditEvents];
  };

  const navigateTo = (screen: ScreenId) => {
    setState((prev) => ({ ...prev, currentScreen: screen }));
    if (typeof window !== 'undefined') {
      const targetHash = SCREEN_TO_HASH[screen] || '#overview';
      if (window.location.hash !== targetHash) {
        window.history.pushState({ screen }, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const switchRole = (role: Role) => {
    setState((prev) => ({
      ...prev,
      activeRole: role,
    }));
  };

  const updateFeatureFlags = (partial: Partial<FeatureFlagsConfig>) => {
    setState((prev) => ({
      ...prev,
      featureFlags: { ...prev.featureFlags, ...partial },
      auditEvents: appendAudit(
        prev,
        'CONFIG_FLAG_UPDATED',
        'FEATURE_FLAGS',
        'GLOBAL',
        `Updated configuration flags: ${JSON.stringify(partial)}`
      ),
    }));
  };

  const signUpAccount = async (data: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const res = await signUpWithSupabase(data);
    if (res.ok && res.status === 'SUCCESS' && res.user) {
      const nextScreen: ScreenId = '04_ONBOARDING_CONSENT';
      if (typeof window !== 'undefined') {
        window.history.pushState({ screen: nextScreen }, '', SCREEN_TO_HASH[nextScreen]);
      }
      setState((prev) => ({
        ...prev,
        currentUser: res.user!,
        activeRole: res.user!.role,
        currentScreen: nextScreen,
        dataState: 'READY',
        dataErrorMessage: null,
        auditEvents: appendAudit(
          prev,
          'USER_REGISTERED',
          'USER_PROFILE',
          res.user!.id,
          `Registered authenticated account (${res.user!.email}).`
        ),
      }));
      void hydrateFromSupabaseBackend(res.user.id, res.accessToken);
    }
    return res;
  };

  const signInAccount = async (data: {
    email: string;
    password: string;
  }): Promise<AuthActionResult> => {
    const res = await signInWithSupabase(data);
    if (res.ok && res.user) {
      const nextScreen: ScreenId =
        res.user.role === 'REVIEWER'
          ? '18_REVIEWER_WORKSPACE'
          : res.user.role === 'INSTITUTION'
          ? '21_INSTITUTION_DASHBOARD'
          : '05_STUDENT_DASHBOARD';

      if (typeof window !== 'undefined') {
        window.history.pushState({ screen: nextScreen }, '', SCREEN_TO_HASH[nextScreen]);
      }

      setState((prev) => ({
        ...prev,
        currentUser: res.user!,
        activeRole: res.user!.role,
        currentScreen: nextScreen,
        dataState: 'LOADING',
        dataErrorMessage: null,
        auditEvents: appendAudit(
          prev,
          'USER_LOGIN',
          'SESSION',
          res.user!.id,
          `Authenticated session for ${res.user!.email} (${res.user!.role}).`
        ),
      }));
      void hydrateFromSupabaseBackend(res.user.id, res.accessToken);
    }
    return res;
  };

  const requestPasswordRecovery = async (email: string): Promise<AuthActionResult> => {
    return sendPasswordRecoveryWithSupabase(email);
  };

  const logout = () => {
    void signOutFromSupabase();
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: '01_LANDING' }, '', SCREEN_TO_HASH['01_LANDING']);
    }
    setState({
      ...createCleanInitialState(),
      currentScreen: '01_LANDING',
    });
  };

  const updateOnboardingConsent = (consent: {
    acceptedDataProcessing: boolean;
    acceptedAssessmentTerms: boolean;
    acceptedEvidenceReviewTerms: boolean;
  }) => {
    const allAccepted =
      consent.acceptedDataProcessing &&
      consent.acceptedAssessmentTerms &&
      consent.acceptedEvidenceReviewTerms;

    if (state.currentUser?.id) {
      void updateProfileInSupabase(state.currentUser.id, {
        onboardingCompleted: allAccepted,
        cohortAggregationOptIn: consent.acceptedDataProcessing,
      });
      void upsertSharingConsentInSupabase(state.currentUser.id, {
        allowAnonymisedCohort: consent.acceptedDataProcessing,
      });
    }

    setState((prev) => {
      const baseUser: UserProfile = prev.currentUser || {
        id: 'SESSION_UNAUTHENTICATED',
        fullName: '',
        email: '',
        role: prev.activeRole,
        institutionId: '',
        institutionName: '',
        program: '',
        consent: {
          acceptedDataProcessing: false,
          acceptedAssessmentTerms: false,
          acceptedEvidenceReviewTerms: false,
          consentTimestamp: null,
          consentVersion: 'WF-CONSENT-2025.1',
        },
        eligibility: {
          enrolledStudentVerified: false,
          minimumAcademicStandingVerified: false,
          customEligibilityFlags: {},
        },
        isDevelopmentSeed: false,
      };

      const updatedUser: UserProfile = {
        ...baseUser,
        consent: {
          ...baseUser.consent,
          ...consent,
          consentTimestamp: allAccepted ? new Date().toISOString() : null,
        },
      };

      return {
        ...prev,
        currentUser: prev.currentUser ? updatedUser : null,
        auditEvents: appendAudit(
          prev,
          'CONSENT_UPDATED',
          'USER_PROFILE',
          updatedUser.id,
          `Updated platform consent flags (Note: Platform consent never auto-satisfies target eligibility conditions).`
        ),
      };
    });
  };

  const verifyEligibilityStatus = (eligibility: {
    enrolledStudentVerified: boolean;
    minimumAcademicStandingVerified: boolean;
  }) => {
    setState((prev) => {
      if (!prev.currentUser) {
        return {
          ...prev,
          auditEvents: appendAudit(
            prev,
            'ELIGIBILITY_FACTS_CHECKED',
            'SESSION',
            'UNAUTHENTICATED',
            `Checked independent eligibility facts: Enrolled=${eligibility.enrolledStudentVerified}, Standing=${eligibility.minimumAcademicStandingVerified}`
          ),
        };
      }
      const updatedUser: UserProfile = {
        ...prev.currentUser,
        eligibility: {
          ...prev.currentUser.eligibility,
          ...eligibility,
        },
      };
      return {
        ...prev,
        currentUser: updatedUser,
        auditEvents: appendAudit(
          prev,
          'ELIGIBILITY_FACTS_UPDATED',
          'USER_PROFILE',
          updatedUser.id,
          `Updated independent eligibility facts: Enrolled=${eligibility.enrolledStudentVerified}, Standing=${eligibility.minimumAcademicStandingVerified}`
        ),
      };
    });
  };

  const updateStudentPersonalInfo = (info: {
    fullName: string;
    email: string;
    institutionName: string;
    program: string;
    statedCareerGoal: string;
  }) => {
    if (state.currentUser?.id) {
      void updateProfileInSupabase(state.currentUser.id, {
        fullName: info.fullName.trim(),
        institutionName: info.institutionName.trim(),
        program: info.program.trim(),
      });
    }

    setState((prev) => {
      const baseUser: UserProfile = prev.currentUser || {
        id: 'STUDENT_LOCAL_PROFILE',
        fullName: info.fullName.trim(),
        email: info.email.trim(),
        role: prev.activeRole === 'ANONYMOUS' ? 'STUDENT' : prev.activeRole,
        institutionId: '',
        institutionName: info.institutionName.trim(),
        program: info.program.trim(),
        statedCareerGoal: info.statedCareerGoal.trim(),
        consent: {
          acceptedDataProcessing: false,
          acceptedAssessmentTerms: false,
          acceptedEvidenceReviewTerms: false,
          consentTimestamp: null,
          consentVersion: 'WF-CONSENT-2025.1',
        },
        eligibility: {
          enrolledStudentVerified: false,
          minimumAcademicStandingVerified: false,
          customEligibilityFlags: {},
        },
        isDevelopmentSeed: false,
      };

      const updatedUser: UserProfile = {
        ...baseUser,
        fullName: info.fullName.trim(),
        email: info.email.trim(),
        institutionName: info.institutionName.trim(),
        program: info.program.trim(),
        statedCareerGoal: info.statedCareerGoal.trim(),
      };

      return {
        ...prev,
        currentUser: updatedUser,
        activeRole: prev.activeRole === 'ANONYMOUS' ? 'STUDENT' : prev.activeRole,
        auditEvents: appendAudit(
          prev,
          'STUDENT_PROFILE_UPDATED',
          'USER_PROFILE',
          updatedUser.id,
          `Student updated personal profile and stated career goal ("${updatedUser.statedCareerGoal || 'Not specified'}").`
        ),
      };
    });
  };

  const addStudentPortfolioRecord = (
    record: Omit<StudentPortfolioRecord, 'id' | 'createdAt' | 'verificationState'>
  ) => {
    const newRecord: StudentPortfolioRecord = {
      ...record,
      id: `PORT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      verificationState: 'UNVERIFIED_CLAIM',
      createdAt: new Date().toISOString(),
    };

    if (state.currentUser?.id) {
      void insertPortfolioRecordInSupabase(state.currentUser.id, newRecord);
    }

    setState((prev) => ({
      ...prev,
      portfolioRecords: [newRecord, ...prev.portfolioRecords],
      auditEvents: appendAudit(
        prev,
        'PORTFOLIO_CLAIM_RECORDED',
        'STUDENT_PORTFOLIO',
        newRecord.id,
        `Recorded ${newRecord.recordType} "${newRecord.title}" as an unverified claim linked to ${newRecord.linkedDimensionId} (Demonstrated skill level unchanged until verified).`
      ),
    }));
  };

  const removeStudentPortfolioRecord = (recordId: string) => {
    if (state.currentUser?.id) {
      void deletePortfolioRecordFromSupabase(recordId);
    }

    setState((prev) => ({
      ...prev,
      portfolioRecords: prev.portfolioRecords.filter((r) => r.id !== recordId),
      auditEvents: appendAudit(
        prev,
        'PORTFOLIO_CLAIM_REMOVED',
        'STUDENT_PORTFOLIO',
        recordId,
        `Removed student portfolio record ${recordId}.`
      ),
    }));
  };

  const promotePortfolioRecordToEvidence = (recordId: string, claimedLevel: RubricLevel) => {
    const found = state.portfolioRecords.find((r) => r.id === recordId);
    if (!found) return;

    const newEv: EvidenceSubmission = {
      id: `EVID_${Date.now()}`,
      studentId: state.currentUser?.id || 'UNAUTHENTICATED_USER',
      title: `${found.recordType}: ${found.title}`,
      description: `${found.description} (Organization/Issuer: ${found.organizationOrIssuer}, Completed: ${found.completedDate})`,
      linkedDimensionId: found.linkedDimensionId,
      claimedRubricLevel: claimedLevel,
      evidenceType: 'URL',
      url: found.artifactUrl || 'https://example.org/portfolio-artifact',
      simulatedClientHash: '',
      status: 'SUBMITTED',
      technicalValidation: {
        sizeValid: true,
        mimeValid: true,
        malwareScanStatus: 'NOT_CONFIGURED_IN_DEV',
        validationNotes:
          'Portfolio record submitted to Evidence Ledger. Awaiting reviewer verification before updating demonstrated capability.',
      },
      assignedReviewerId: null,
      reviewDecision: null,
      submittedAt: new Date().toISOString(),
    };

    if (state.currentUser?.id) {
      void submitEvidenceToSupabase(state.currentUser.id, newEv, null);
    }

    setState((prev) => {
      const updatedPortfolio = prev.portfolioRecords.map((r) =>
        r.id === recordId ? { ...r, verificationState: 'EVIDENCE_SUBMITTED' as const } : r
      );

      return {
        ...prev,
        portfolioRecords: updatedPortfolio,
        evidenceSubmissions: [newEv, ...prev.evidenceSubmissions],
        auditEvents: appendAudit(
          prev,
          'PORTFOLIO_SUBMITTED_FOR_REVIEW',
          'EVIDENCE_SUBMISSION',
          newEv.id,
          `Submitted portfolio record "${found.title}" to Evidence Ledger for reviewer verification at Level ${claimedLevel}.`
        ),
      };
    });
  };

  const submitRiasecResponses = (responses: Record<string, number>) => {
    const result = scoreRiasecInventory(responses);
    if (state.currentUser?.id && result.isComplete48) {
      void insertRiasecProfileInSupabase(state.currentUser.id, result);
    }

    setState((prev) => ({
      ...prev,
      riasecResult: result,
      auditEvents: appendAudit(
        prev,
        'RIASEC_COMPLETED',
        'ASSESSMENT_ATTEMPT',
        result.attemptId,
        `Completed 48-item RIASEC inventory. Top-3 Holland code: ${result.topThreeCode} (Interest only; capability levels unchanged).`
      ),
    }));
  };

  const submitAptitudeDomainAttempt = (
    domain: AptitudeDomain,
    selectedOptions: Record<string, string>
  ) => {
    // Dispatch to trusted server authority (netlify/functions/wayfinder-api.ts) to persist
    // immutable aptitude_attempts and update capability_records.objective_score_level in Supabase
    void submitAptitudeAttemptViaBackend(
      domain,
      selectedOptions,
      state.featureFlags.enableSpatialReasoning
    );

    setState((prev) => {
      const activeItems = getActiveAptitudeItems(
        prev.featureFlags.enableSpatialReasoning
      ).filter((i) => i.domain === domain);
      const scored = scoreAptitudeAttemptServerSide(activeItems, selectedOptions);

      const newAttempt: AptitudeAttemptResult = {
        id: `APT_${domain}_${Date.now()}`,
        domain,
        completedAt: new Date().toISOString(),
        totalItems: scored.totalItems,
        correctCount: scored.correctCount,
        percentage: scored.percentage,
        mappedRubricLevel: scored.mappedRubricLevel,
        rubricVersion: 'RUBRIC_V1',
      };

      const mappedDimensionMap: Record<AptitudeDomain, CapabilityDimensionId> = {
        NUMERICAL: 'CAP_NUM_QUANT',
        VERBAL: 'CAP_TECH_COMM',
        LOGICAL: 'CAP_PROB_SOLV',
        TARGET_KNOWLEDGE: 'CAP_PROG_SW',
        SPATIAL: 'CAP_SYS_DESIGN',
      };
      const targetDim = mappedDimensionMap[domain];

      const updatedCaps = prev.capabilityRecords.map((rec) => {
        if (rec.dimensionId !== targetDim) return rec;
        const nextObj = scored.mappedRubricLevel;
        const nextDem =
          rec.verifiedEvidenceLevel !== null
            ? Math.max(rec.verifiedEvidenceLevel, nextObj)
            : nextObj;
        return {
          ...rec,
          objectiveScoreLevel: nextObj,
          demonstratedLevel: nextDem as RubricLevel,
          evidenceSource:
            rec.verifiedEvidenceLevel !== null
              ? ('COMBINED_VERIFIED' as const)
              : ('OBJECTIVE_ASSESSMENT' as const),
          lastUpdatedAt: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        aptitudeAttempts: [newAttempt, ...prev.aptitudeAttempts],
        capabilityRecords: updatedCaps,
        auditEvents: appendAudit(
          prev,
          'OBJECTIVE_ASSESSMENT_SCORED',
          'ASSESSMENT_ATTEMPT',
          newAttempt.id,
          `Scored ${domain} attempt (${scored.correctCount}/${scored.totalItems} = ${scored.percentage}%). Mapped ${targetDim} objective level to ${scored.mappedRubricLevel}.`
        ),
      };
    });
  };

  const updateSelfReportedSkill = (
    dimensionId: CapabilityDimensionId,
    level: RubricLevel | null
  ) => {
    if (state.currentUser?.id) {
      void upsertSelfReportedCapabilityInSupabase(
        state.currentUser.id,
        dimensionId,
        level
      );
    }

    setState((prev) => {
      const updatedCaps = prev.capabilityRecords.map((rec) => {
        if (rec.dimensionId !== dimensionId) return rec;
        return {
          ...rec,
          selfReportedLevel: level,
          selfReportedUpdatedAt: new Date().toISOString(),
          evidenceSource:
            rec.demonstratedLevel !== null
              ? rec.evidenceSource
              : level !== null
              ? ('SELF_REPORT_ONLY' as const)
              : ('UNASSESSED' as const),
        };
      });
      return {
        ...prev,
        capabilityRecords: updatedCaps,
        auditEvents: appendAudit(
          prev,
          'SELF_REPORT_CLAIM_UPDATED',
          'CAPABILITY_RECORD',
          dimensionId,
          `Updated self-reported skill rating to ${
            level === null ? 'Not tried yet' : `Level ${level}`
          }. Demonstrated skill level remained unchanged.`
        ),
      };
    });
  };

  const selectTarget = (targetId: string) => {
    setState((prev) => ({ ...prev, selectedTargetId: targetId }));
  };

  const createCustomTarget = (target: OpportunityTarget) => {
    setState((prev) => ({
      ...prev,
      targets: [target, ...prev.targets],
      selectedTargetId: target.id,
      auditEvents: appendAudit(
        prev,
        'CUSTOM_TARGET_CREATED',
        'OPPORTUNITY_TARGET',
        target.id,
        `Added target opportunity "${target.title}" (${target.version}).`
      ),
    }));
  };

  const addGapDevelopmentPlanActivity = (
    target: OpportunityTarget,
    evaluation: RequirementEvaluationItem
  ) => {
    const existing = state.activities.find(
      (a) =>
        a.linkedTargetId === target.id &&
        a.linkedRequirementId === evaluation.requirement.id
    );
    if (existing) return;

    const newActivity = buildGapDevelopmentActivity(target, evaluation);
    if (state.currentUser?.id) {
      void insertDevelopmentActivityInSupabase(state.currentUser.id, newActivity);
    }

    setState((prev) => ({
      ...prev,
      activities: [newActivity, ...prev.activities],
      auditEvents: appendAudit(
        prev,
        'GAP_DEVELOPMENT_ACTIVITY_ADDED',
        'DEVELOPMENT_ACTIVITY',
        newActivity.id,
        `Created development activity for "${evaluation.dimensionName}" (Target Level ${evaluation.requiredLevel}) linked to "${target.title}".`
      ),
    }));
  };

  const updateActivityProgress = (
    activityId: string,
    status: ActivityStatus,
    progressPercent: number,
    reflectionNotes: string
  ) => {
    if (state.currentUser?.id) {
      void updateDevelopmentActivityInSupabase(activityId, status);
    }

    setState((prev) => {
      const updated = prev.activities.map((act) => {
        if (act.id !== activityId) return act;
        return {
          ...act,
          status,
          progressPercent,
          reflectionNotes,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : act.completedAt,
        };
      });
      return {
        ...prev,
        activities: updated,
        auditEvents: appendAudit(
          prev,
          'ACTIVITY_PROGRESS_UPDATED',
          'DEVELOPMENT_ACTIVITY',
          activityId,
          `Updated learning activity progress (${progressPercent}%). Demonstrated skill levels update after evidence verification.`
        ),
      };
    });
  };

  const submitEvidence = (submission: {
    title: string;
    description: string;
    linkedDimensionId: CapabilityDimensionId;
    linkedTargetId?: string;
    claimedRubricLevel: RubricLevel;
    evidenceType: 'FILE' | 'URL';
    fileName?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    url?: string;
  }) => {
    const maxLimitMB = state.featureFlags.uploadPolicyMode === 'ENG_SPEC_10MB' ? 10 : 25;
    const maxBytes = maxLimitMB * 1024 * 1024;
    const allowedMimes =
      state.featureFlags.uploadPolicyMode === 'ENG_SPEC_10MB'
        ? ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'application/zip']
        : [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'text/plain',
            'application/zip',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
          ];

    const sizeValid =
      submission.evidenceType === 'URL' ||
      (submission.fileSizeBytes ?? 0) <= maxBytes;
    const mimeValid =
      submission.evidenceType === 'URL' ||
      allowedMimes.includes(submission.mimeType || 'application/pdf');

    const passedTech = sizeValid && mimeValid;

    const newEv: EvidenceSubmission = {
      id: `EVID_${Date.now()}`,
      studentId: state.currentUser?.id || 'UNAUTHENTICATED_USER',
      title: submission.title,
      description: submission.description,
      linkedDimensionId: submission.linkedDimensionId,
      linkedTargetId: submission.linkedTargetId,
      claimedRubricLevel: submission.claimedRubricLevel,
      evidenceType: submission.evidenceType,
      fileName: submission.fileName,
      fileSizeBytes: submission.fileSizeBytes,
      mimeType: submission.mimeType,
      url: submission.url,
      simulatedClientHash: '',
      status: passedTech ? 'SUBMITTED' : 'TECHNICAL_VALIDATION_FAILED',
      technicalValidation: {
        sizeValid,
        mimeValid,
        malwareScanStatus: 'NOT_CONFIGURED_IN_DEV',
        validationNotes: passedTech
          ? `File format and size verified (up to ${maxLimitMB} MB). Ready for reviewer assignment and evaluation.`
          : `Upload check failed: please ensure your file is a supported format and under ${maxLimitMB} MB.`,
      },
      assignedReviewerId: null,
      reviewDecision: null,
      submittedAt: new Date().toISOString(),
    };

    if (state.currentUser?.id && passedTech) {
      void submitEvidenceToSupabase(state.currentUser.id, newEv, null);
    }

    setState((prev) => ({
      ...prev,
      evidenceSubmissions: [newEv, ...prev.evidenceSubmissions],
      auditEvents: appendAudit(
        prev,
        'EVIDENCE_SUBMITTED',
        'EVIDENCE_SUBMISSION',
        newEv.id,
        `Submitted evidence "${newEv.title}" for reviewer verification.`
      ),
    }));
  };

  const submitReviewerDecision = (
    evidenceId: string,
    decision: 'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED',
    verifiedLevel: RubricLevel | null,
    dimensions: EvidenceReviewDimensions,
    rationale: string
  ) => {
    // Dispatch authoritative review decision through trusted server authority
    void submitReviewerDecisionViaBackend({
      evidenceId,
      decision,
      verifiedLevel,
      dimensions,
      rationale,
    });

    setState((prev) => {
      if (!prev.currentUser || prev.currentUser.role !== 'REVIEWER') {
        return prev;
      }

      let targetDimension: CapabilityDimensionId | null = null;

      const updatedSubmissions = prev.evidenceSubmissions.map((ev) => {
        if (ev.id !== evidenceId) return ev;
        targetDimension = ev.linkedDimensionId;
        return {
          ...ev,
          status: decision,
          reviewDecision: {
            reviewId: `REV_${Date.now()}`,
            reviewerId: prev.currentUser!.id,
            reviewerName: prev.currentUser!.fullName,
            reviewedAt: new Date().toISOString(),
            rubricVersion: 'RUBRIC_V1',
            decision,
            verifiedRubricLevel: decision === 'ACCEPTED' ? verifiedLevel : null,
            dimensions,
            rationale,
          },
        };
      });

      const updatedCaps = prev.capabilityRecords.map((rec) => {
        if (
          decision === 'ACCEPTED' &&
          verifiedLevel !== null &&
          targetDimension &&
          rec.dimensionId === targetDimension
        ) {
          const nextDem =
            rec.objectiveScoreLevel !== null
              ? (Math.max(rec.objectiveScoreLevel, verifiedLevel) as RubricLevel)
              : verifiedLevel;
          return {
            ...rec,
            verifiedEvidenceLevel: verifiedLevel,
            demonstratedLevel: nextDem,
            evidenceSource:
              rec.objectiveScoreLevel !== null
                ? ('COMBINED_VERIFIED' as const)
                : ('REVIEWED_EVIDENCE' as const),
            lastUpdatedAt: new Date().toISOString(),
          };
        }
        return rec;
      });

      return {
        ...prev,
        evidenceSubmissions: updatedSubmissions,
        capabilityRecords: updatedCaps,
        auditEvents: appendAudit(
          prev,
          `EVIDENCE_REVIEW_${decision}`,
          'EVIDENCE_SUBMISSION',
          evidenceId,
          `Reviewer recorded ${decision} (Level: ${verifiedLevel ?? 'N/A'}) with 6-dimension rubric evaluation.`
        ),
      };
    });
  };

  const createManualSnapshot = (note: string) => {
    const currentTarget =
      state.targets.find((t) => t.id === state.selectedTargetId) || state.targets[0];
    if (!currentTarget) return;

    const report = computeTargetReadinessReport(
      currentTarget,
      state.capabilityRecords,
      state.evidenceSubmissions,
      state.currentUser
    );
    const capMap: Record<CapabilityDimensionId, RubricLevel | null> = {
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
    state.capabilityRecords.forEach((c) => {
      capMap[c.dimensionId] = c.demonstratedLevel;
    });

    const snap: HistoricalSnapshot = {
      id: `SNAP_${Date.now()}`,
      createdAt: new Date().toISOString(),
      actorId: state.currentUser?.id || 'ANONYMOUS',
      triggerType: 'MANUAL_RECALCULATION',
      targetId: currentTarget.id,
      targetTitle: currentTarget.title,
      targetVersion: currentTarget.version,
      rubricVersion: currentTarget.rubricVersion,
      summaryNote: note || 'Manual readiness snapshot saved.',
      statusCounts: report.counts,
      capabilitySnapshot: capMap,
    };

    if (state.currentUser?.id) {
      void insertReadinessSnapshotInSupabase(state.currentUser.id, snap);
    }

    setState((prev) => ({
      ...prev,
      snapshots: [snap, ...prev.snapshots],
      auditEvents: appendAudit(
        prev,
        'SNAPSHOT_CREATED',
        'HISTORICAL_SNAPSHOT',
        snap.id,
        `Created historical readiness snapshot for target ${currentTarget.title} (${currentTarget.version}).`
      ),
    }));
  };

  const createSharingAuthorisation = (
    recipientInstitution: string,
    scopeTargetId: string,
    includeEvidenceMetadata: boolean,
    durationDays: number
  ) => {
    if (!scopeTargetId || !recipientInstitution.trim()) return;
    if (state.currentUser?.id) {
      void upsertSharingConsentInSupabase(state.currentUser.id, {
        shareWithInstitution: true,
        shareWithEmployers: includeEvidenceMetadata,
      });
    }

    setState((prev) => {
      const clampedDays = Math.min(
        Math.max(1, durationDays),
        prev.featureFlags.maxShareExpiryDays
      );
      const expires = new Date(
        Date.now() + clampedDays * 24 * 60 * 60 * 1000
      ).toISOString();
      const newShare: SharingAuthorisation = {
        id: `SHARE_${Date.now()}`,
        studentId: prev.currentUser?.id || 'ANONYMOUS',
        recipientInstitution: recipientInstitution.trim(),
        scopeTargetId,
        includeEvidenceMetadata,
        createdAt: new Date().toISOString(),
        expiresAt: expires,
        revokedAt: null,
      };
      return {
        ...prev,
        sharingAuthorisations: [newShare, ...prev.sharingAuthorisations],
        auditEvents: appendAudit(
          prev,
          'SHARING_AUTHORISATION_CREATED',
          'SHARING_AUTHORISATION',
          newShare.id,
          `Granted scoped sharing authorisation to "${recipientInstitution.trim()}" for ${clampedDays} days.`
        ),
      };
    });
  };

  const revokeSharingAuthorisation = (shareId: string) => {
    if (state.currentUser?.id) {
      void upsertSharingConsentInSupabase(state.currentUser.id, {
        shareWithInstitution: false,
        shareWithEmployers: false,
      });
    }

    setState((prev) => {
      const updated = prev.sharingAuthorisations.map((s) =>
        s.id === shareId ? { ...s, revokedAt: new Date().toISOString() } : s
      );
      return {
        ...prev,
        sharingAuthorisations: updated,
        auditEvents: appendAudit(
          prev,
          'SHARING_AUTHORISATION_REVOKED',
          'SHARING_AUTHORISATION',
          shareId,
          `Immediately revoked scoped sharing authorisation ${shareId}.`
        ),
      };
    });
  };

  const selectSkillAssessment = (assessmentId: string) => {
    setState((prev) => ({
      ...prev,
      selectedSkillAssessmentId: assessmentId,
    }));
  };

  const submitSkillAssessmentAttempt = (
    assessmentId: string,
    responses: Record<string, string | string[]>
  ): SkillAssessmentAttempt | null => {
    const foundAssessment = state.skillAssessments.find((a) => a.id === assessmentId);
    if (!foundAssessment) return null;

    const studentId = state.currentUser?.id || 'UNAUTHENTICATED_USER';
    const attemptResult = scoreSkillAssessmentAttemptServerSide(
      foundAssessment,
      responses,
      studentId,
      state.learningResources
    );

    if (attemptResult.completionStatus === 'COMPLETED_SCORED') {
      void submitSkillAssessmentViaBackend(studentId, assessmentId, responses);
    }

    setState((prev) => {
      if (attemptResult.completionStatus === 'INCOMPLETE_VALIDATION_ERROR') {
        return {
          ...prev,
          auditEvents: appendAudit(
            prev,
            'SKILL_ASSESSMENT_VALIDATION_FAILED',
            'SKILL_ASSESSMENT_ATTEMPT',
            attemptResult.id,
            `Incomplete response submission rejected for "${foundAssessment.title}" (${foundAssessment.version}).`
          ),
        };
      }

      if (attemptResult.completionStatus === 'SUBMITTED_FOR_HUMAN_REVIEW') {
        const deliverableUrl =
          typeof responses['DELIVERABLE_URL'] === 'string'
            ? responses['DELIVERABLE_URL'].trim()
            : '';
        const rationale =
          typeof responses['DELIVERABLE_RATIONALE'] === 'string'
            ? responses['DELIVERABLE_RATIONALE'].trim()
            : '';

        const reviewSubmission: EvidenceSubmission = {
          id: `EVID_ASM_${Date.now()}`,
          studentId,
          title: `Assessment Submission: ${foundAssessment.title}`,
          description: `Submitted via Skill Assessment Engine (${foundAssessment.id} v${foundAssessment.version}). Summary: ${rationale}`,
          linkedDimensionId: foundAssessment.mappedCapabilityId,
          linkedSkillId: foundAssessment.skillId,
          claimedRubricLevel: foundAssessment.targetProficiencyLevel,
          evidenceType: 'URL',
          url: deliverableUrl,
          simulatedClientHash: '',
          status: 'SUBMITTED',
          technicalValidation: {
            sizeValid: true,
            mimeValid: true,
            malwareScanStatus: 'NOT_CONFIGURED_IN_DEV',
            validationNotes:
              'Portfolio / project assessment submitted for human reviewer rubric evaluation.',
          },
          assignedReviewerId: null,
          reviewDecision: null,
          submittedAt: new Date().toISOString(),
        };

        if (prev.currentUser?.id) {
          void submitEvidenceToSupabase(prev.currentUser.id, reviewSubmission, null);
        }

        return {
          ...prev,
          skillAssessmentAttempts: [attemptResult, ...prev.skillAssessmentAttempts],
          evidenceSubmissions: [reviewSubmission, ...prev.evidenceSubmissions],
          auditEvents: appendAudit(
            prev,
            'SKILL_ASSESSMENT_QUEUED_FOR_REVIEW',
            'SKILL_ASSESSMENT_ATTEMPT',
            attemptResult.id,
            `Queued "${foundAssessment.title}" (${foundAssessment.version}) in Evidence Ledger (${reviewSubmission.id}) for human reviewer evaluation.`
          ),
        };
      }

      const awarded = attemptResult.awardedRubricLevel ?? 0;

      // Update canonical capability record deterministically
      const updatedCaps = prev.capabilityRecords.map((rec) => {
        if (rec.dimensionId !== foundAssessment.mappedCapabilityId) return rec;
        const bestObjective =
          rec.objectiveScoreLevel !== null
            ? (Math.max(rec.objectiveScoreLevel, awarded) as RubricLevel)
            : awarded;
        const nextDem =
          rec.verifiedEvidenceLevel !== null
            ? (Math.max(rec.verifiedEvidenceLevel, bestObjective) as RubricLevel)
            : bestObjective;

        return {
          ...rec,
          objectiveScoreLevel: bestObjective,
          demonstratedLevel: nextDem,
          evidenceSource:
            rec.verifiedEvidenceLevel !== null
              ? ('COMBINED_VERIFIED' as const)
              : ('OBJECTIVE_ASSESSMENT' as const),
          lastUpdatedAt: new Date().toISOString(),
        };
      });

      // Update student-specific skill proficiency record
      const existingSkillRec = prev.studentSkillRecords.find(
        (sr) => sr.skillId === foundAssessment.skillId
      );
      const nextSkillRecord: StudentSkillProficiencyRecord = existingSkillRec
        ? {
            ...existingSkillRec,
            assessedLevel:
              existingSkillRec.assessedLevel !== null
                ? (Math.max(existingSkillRec.assessedLevel, awarded) as RubricLevel)
                : awarded,
            demonstratedLevel:
              existingSkillRec.verifiedEvidenceLevel !== null
                ? (Math.max(existingSkillRec.verifiedEvidenceLevel, awarded) as RubricLevel)
                : awarded,
            lastAssessedAt: attemptResult.completedAt,
            assessmentVersion: foundAssessment.version,
          }
        : {
            skillId: foundAssessment.skillId,
            mappedCapabilityId: foundAssessment.mappedCapabilityId,
            selfReportedLevel: null,
            assessedLevel: awarded,
            verifiedEvidenceLevel: null,
            demonstratedLevel: awarded,
            lastAssessedAt: attemptResult.completedAt,
            assessmentVersion: foundAssessment.version,
          };

      const updatedSkillRecords = existingSkillRec
        ? prev.studentSkillRecords.map((sr) =>
            sr.skillId === foundAssessment.skillId ? nextSkillRecord : sr
          )
        : [nextSkillRecord, ...prev.studentSkillRecords];

      return {
        ...prev,
        skillAssessmentAttempts: [attemptResult, ...prev.skillAssessmentAttempts],
        capabilityRecords: updatedCaps,
        studentSkillRecords: updatedSkillRecords,
        auditEvents: appendAudit(
          prev,
          'SKILL_ASSESSMENT_SCORED',
          'SKILL_ASSESSMENT_ATTEMPT',
          attemptResult.id,
          `Scored "${foundAssessment.title}" v${foundAssessment.version} (${attemptResult.correctCount}/${attemptResult.totalItems} = ${attemptResult.scorePercentage}%). Awarded Level ${awarded} for skill ${foundAssessment.skillId} (${foundAssessment.mappedCapabilityId}).`
        ),
      };
    });

    return attemptResult;
  };

  const updateResourceProgress = (
    resourceId: string,
    status: StudentResourceProgressState,
    notes = ''
  ) => {
    if (state.currentUser?.id) {
      void upsertLearningProgressInSupabase(
        state.currentUser.id,
        resourceId,
        status,
        notes
      );
    }

    setState((prev) => {
      const studentId = prev.currentUser?.id || 'UNAUTHENTICATED_USER';
      const existing = prev.resourceProgress.find((p) => p.resourceId === resourceId);
      const updatedRecord: StudentResourceProgress = {
        resourceId,
        studentId,
        status,
        notes: notes || existing?.notes || '',
        updatedAt: new Date().toISOString(),
      };
      const nextProgress = existing
        ? prev.resourceProgress.map((p) => (p.resourceId === resourceId ? updatedRecord : p))
        : [updatedRecord, ...prev.resourceProgress];

      return {
        ...prev,
        resourceProgress: nextProgress,
        auditEvents: appendAudit(
          prev,
          'LEARNING_RESOURCE_PROGRESS_UPDATED',
          'LEARNING_RESOURCE',
          resourceId,
          `Marked learning resource ${resourceId} as ${status} (Self-study progress only; demonstrated capability levels remain unchanged until assessed or verified via evidence).`
        ),
      };
    });
  };

  const reportLearningResourceIssue = (
    resourceId: string,
    reason: ResourceIssueReport['reason'],
    details: string
  ) => {
    if (state.currentUser?.id) {
      void insertResourceQualityReportInSupabase(
        state.currentUser.id,
        resourceId,
        reason,
        details.trim() || `Reported ${reason}`
      );
    }

    setState((prev) => {
      const resource = prev.learningResources.find((r) => r.id === resourceId);
      if (!resource) return prev;

      const report: ResourceIssueReport = {
        id: `REP_${Date.now()}`,
        resourceId,
        resourceTitle: resource.title,
        reportedBy: prev.currentUser?.id || 'ANONYMOUS',
        reason,
        details: details.trim() || `Reported ${reason}`,
        reportedAt: new Date().toISOString(),
        resolutionStatus: 'OPEN',
      };

      const updatedResources = prev.learningResources.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              linkVerificationStatus: 'REPORTED_ISSUE' as const,
              editorialStatus: 'FLAGGED_FOR_CHECK' as const,
            }
          : r
      );

      return {
        ...prev,
        learningResources: updatedResources,
        resourceIssueReports: [report, ...prev.resourceIssueReports],
        auditEvents: appendAudit(
          prev,
          'LEARNING_RESOURCE_ISSUE_REPORTED',
          'LEARNING_RESOURCE',
          resourceId,
          `Reported ${reason} on "${resource.title}". Marked resource as REPORTED_ISSUE / FLAGGED_FOR_CHECK.`
        ),
      };
    });
  };

  const addCustomFieldCategory = (
    field: Omit<FieldCategory, 'version' | 'publicationStatus'>
  ) => {
    setState((prev) => {
      const isAuthorised = prev.activeRole === 'ADMIN' || prev.currentUser?.role === 'ADMIN';
      const initialStatus: PublicationStatus = isAuthorised ? 'PUBLISHED' : 'DRAFT_REVIEW';
      const newField: FieldCategory = {
        ...field,
        version: '2026.2-CURATED',
        publicationStatus: initialStatus,
      };
      const reviewEntry: ContentReviewHistoryEntry = {
        id: `CRH_${Date.now()}_FLD`,
        entityType: 'FIELD',
        entityId: newField.id,
        entityTitle: newField.name,
        previousStatus: 'NONE',
        newStatus: initialStatus,
        version: newField.version,
        actorId: prev.currentUser?.id || 'ANONYMOUS',
        actorRole: prev.activeRole,
        reviewNotes: isAuthorised
          ? 'Published directly by authorised administrator.'
          : 'Submitted as draft for editorial and subject-matter review.',
        timestamp: new Date().toISOString(),
      };
      return {
        ...prev,
        fieldsCatalogue: [...prev.fieldsCatalogue, newField],
        contentReviewHistory: [reviewEntry, ...prev.contentReviewHistory],
        auditEvents: appendAudit(
          prev,
          'FIELD_CATEGORY_ADDED',
          'FIELD_CATALOGUE',
          newField.id,
          `Added field "${newField.name}" (${newField.id}) with status ${initialStatus}.`
        ),
      };
    });
  };

  const addCustomSkillToCatalogue = (
    skill: Omit<SkillCatalogueEntry, 'version' | 'publicationStatus'>
  ) => {
    setState((prev) => {
      const isAuthorised = prev.activeRole === 'ADMIN' || prev.currentUser?.role === 'ADMIN';
      const initialStatus: PublicationStatus = isAuthorised ? 'PUBLISHED' : 'DRAFT_REVIEW';
      const newSkill: SkillCatalogueEntry = {
        ...skill,
        version: '1.0.0-CURATED',
        publicationStatus: initialStatus,
      };
      const reviewEntry: ContentReviewHistoryEntry = {
        id: `CRH_${Date.now()}_SKL`,
        entityType: 'SKILL',
        entityId: newSkill.id,
        entityTitle: newSkill.name,
        previousStatus: 'NONE',
        newStatus: initialStatus,
        version: newSkill.version,
        actorId: prev.currentUser?.id || 'ANONYMOUS',
        actorRole: prev.activeRole,
        reviewNotes: isAuthorised
          ? 'Approved and published by administrator.'
          : 'Registered in DRAFT_REVIEW status pending subject-matter validation.',
        timestamp: new Date().toISOString(),
      };
      return {
        ...prev,
        skillsCatalogue: [newSkill, ...prev.skillsCatalogue],
        contentReviewHistory: [reviewEntry, ...prev.contentReviewHistory],
        auditEvents: appendAudit(
          prev,
          'SKILL_CATALOGUE_ADDED',
          'SKILL_CATALOGUE',
          newSkill.id,
          `Added skill "${newSkill.name}" (${newSkill.id}) under field ${newSkill.fieldId} with status ${initialStatus}.`
        ),
      };
    });
  };

  const addCustomLearningResource = (
    resource: Omit<
      LearningResource,
      'id' | 'lastCheckedAt' | 'linkVerificationStatus' | 'editorialStatus'
    >
  ) => {
    setState((prev) => {
      const isAuthorised = prev.activeRole === 'ADMIN' || prev.currentUser?.role === 'ADMIN';
      const initialEditorial: EditorialQualityStatus = isAuthorised
        ? 'APPROVED_CATALOGUE'
        : 'PENDING_EDITORIAL_REVIEW';
      const newRes: LearningResource = {
        ...resource,
        id: `RES_CUR_${Date.now()}`,
        lastCheckedAt: isAuthorised ? new Date().toISOString().slice(0, 10) : null,
        linkVerificationStatus: isAuthorised
          ? 'VERIFIED_OFFICIAL_SOURCE'
          : 'USER_CURATED_UNVERIFIED',
        editorialStatus: initialEditorial,
      };
      const reviewEntry: ContentReviewHistoryEntry = {
        id: `CRH_${Date.now()}_RES`,
        entityType: 'LEARNING_RESOURCE',
        entityId: newRes.id,
        entityTitle: newRes.title,
        previousStatus: 'NONE',
        newStatus: initialEditorial,
        version: '1.0',
        actorId: prev.currentUser?.id || 'ANONYMOUS',
        actorRole: prev.activeRole,
        reviewNotes: isAuthorised
          ? 'Approved and verified for official Learning Hub catalogue.'
          : 'Submitted by user; marked PENDING_EDITORIAL_REVIEW until verified.',
        timestamp: new Date().toISOString(),
      };
      return {
        ...prev,
        learningResources: [newRes, ...prev.learningResources],
        contentReviewHistory: [reviewEntry, ...prev.contentReviewHistory],
        auditEvents: appendAudit(
          prev,
          'LEARNING_RESOURCE_CURATED',
          'LEARNING_RESOURCE',
          newRes.id,
          `Submitted learning resource "${newRes.title}" (${newRes.resourceType}) as ${newRes.linkVerificationStatus} / ${initialEditorial}.`
        ),
      };
    });
  };

  const updateSkillPublicationStatus = (
    skillId: string,
    nextStatus: PublicationStatus,
    reviewNotes: string
  ): boolean => {
    let updatedOk = false;
    setState((prev) => {
      const canReview =
        prev.activeRole === 'ADMIN' ||
        prev.activeRole === 'REVIEWER' ||
        prev.currentUser?.role === 'ADMIN' ||
        prev.currentUser?.role === 'REVIEWER';
      if (!canReview) return prev;

      const targetSkill = prev.skillsCatalogue.find((s) => s.id === skillId);
      if (!targetSkill) return prev;
      updatedOk = true;

      const nextVersion =
        nextStatus === 'PUBLISHED' && targetSkill.version.endsWith('-CURATED')
          ? '1.1.0-APPROVED'
          : targetSkill.version;

      const nextSkills = prev.skillsCatalogue.map((s) =>
        s.id === skillId
          ? { ...s, publicationStatus: nextStatus, version: nextVersion }
          : s
      );

      const reviewEntry: ContentReviewHistoryEntry = {
        id: `CRH_${Date.now()}_SKL_UPD`,
        entityType: 'SKILL',
        entityId: targetSkill.id,
        entityTitle: targetSkill.name,
        previousStatus: targetSkill.publicationStatus,
        newStatus: nextStatus,
        version: nextVersion,
        actorId: prev.currentUser?.id || prev.activeRole,
        actorRole: prev.activeRole,
        reviewNotes: reviewNotes.trim() || `Updated publication status to ${nextStatus}.`,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        skillsCatalogue: nextSkills,
        contentReviewHistory: [reviewEntry, ...prev.contentReviewHistory],
        auditEvents: appendAudit(
          prev,
          'SKILL_PUBLICATION_STATUS_UPDATED',
          'SKILL_CATALOGUE',
          skillId,
          `Updated skill "${targetSkill.name}" from ${targetSkill.publicationStatus} to ${nextStatus} (${nextVersion}).`
        ),
      };
    });
    return updatedOk;
  };

  const updateResourceEditorialStatus = (
    resourceId: string,
    nextStatus: EditorialQualityStatus,
    reviewNotes: string
  ): boolean => {
    let updatedOk = false;
    setState((prev) => {
      const canReview =
        prev.activeRole === 'ADMIN' ||
        prev.activeRole === 'REVIEWER' ||
        prev.currentUser?.role === 'ADMIN' ||
        prev.currentUser?.role === 'REVIEWER';
      if (!canReview) return prev;

      const targetRes = prev.learningResources.find((r) => r.id === resourceId);
      if (!targetRes) return prev;
      updatedOk = true;

      const nextResources = prev.learningResources.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              editorialStatus: nextStatus,
              linkVerificationStatus:
                nextStatus === 'APPROVED_CATALOGUE'
                  ? ('VERIFIED_OFFICIAL_SOURCE' as const)
                  : nextStatus === 'RETIRED'
                  ? ('UNAVAILABLE' as const)
                  : r.linkVerificationStatus,
              lastCheckedAt: new Date().toISOString().slice(0, 10),
            }
          : r
      );

      const reviewEntry: ContentReviewHistoryEntry = {
        id: `CRH_${Date.now()}_RES_UPD`,
        entityType: 'LEARNING_RESOURCE',
        entityId: targetRes.id,
        entityTitle: targetRes.title,
        previousStatus: targetRes.editorialStatus,
        newStatus: nextStatus,
        version: '1.1',
        actorId: prev.currentUser?.id || prev.activeRole,
        actorRole: prev.activeRole,
        reviewNotes: reviewNotes.trim() || `Updated editorial status to ${nextStatus}.`,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        learningResources: nextResources,
        contentReviewHistory: [reviewEntry, ...prev.contentReviewHistory],
        auditEvents: appendAudit(
          prev,
          'RESOURCE_EDITORIAL_STATUS_UPDATED',
          'LEARNING_RESOURCE',
          resourceId,
          `Updated resource "${targetRes.title}" from ${targetRes.editorialStatus} to ${nextStatus}.`
        ),
      };
    });
    return updatedOk;
  };

  const clearSessionState = () => {
    setState(createCleanInitialState());
  };

  return (
    <WayfinderContext.Provider
      value={{
        state,
        navigateTo,
        switchRole,
        updateFeatureFlags,
        signUpAccount,
        signInAccount,
        requestPasswordRecovery,
        logout,
        updateOnboardingConsent,
        verifyEligibilityStatus,
        updateStudentPersonalInfo,
        addStudentPortfolioRecord,
        removeStudentPortfolioRecord,
        promotePortfolioRecordToEvidence,
        submitRiasecResponses,
        submitAptitudeDomainAttempt,
        selectSkillAssessment,
        submitSkillAssessmentAttempt,
        updateResourceProgress,
        reportLearningResourceIssue,
        addCustomFieldCategory,
        addCustomSkillToCatalogue,
        addCustomLearningResource,
        updateSkillPublicationStatus,
        updateResourceEditorialStatus,
        updateSelfReportedSkill,
        selectTarget,
        createCustomTarget,
        addGapDevelopmentPlanActivity,
        updateActivityProgress,
        submitEvidence,
        submitReviewerDecision,
        createManualSnapshot,
        createSharingAuthorisation,
        revokeSharingAuthorisation,
        clearSessionState,
      }}
    >
      {children}
    </WayfinderContext.Provider>
  );
};

export function useWayfinder(): WayfinderContextValue {
  const ctx = useContext(WayfinderContext);
  if (!ctx) {
    throw new Error('useWayfinder must be used within a WayfinderProvider');
  }
  return ctx;
}
