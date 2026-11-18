export type ScreenId =
  | '01_LANDING'
  | '02_REGISTER'
  | '03_LOGIN'
  | '04_ONBOARDING_CONSENT'
  | '05_STUDENT_DASHBOARD'
  | '06_ASSESSMENT_HUB'
  | '07_RIASEC_ASSESSMENT'
  | '08_APTITUDE_ASSESSMENT'
  | '09_SKILL_RUBRIC_ASSESSMENT'
  | '10_ASSESSMENT_RESULTS'
  | '11_CAPABILITY_PASSPORT'
  | '12_OPPORTUNITY_DISCOVERY'
  | '13_OPPORTUNITY_DETAIL'
  | '14_READINESS_GAP_ANALYSIS'
  | '15_LEARNING_CENTRE'
  | '16_ACTIVITY_WORKSPACE'
  | '17_EVIDENCE_LEDGER'
  | '18_REVIEWER_WORKSPACE'
  | '19_HISTORICAL_SNAPSHOTS'
  | '20_PRIVACY_SHARING'
  | '21_INSTITUTION_DASHBOARD'
  | '22_EDGE_STATES'
  | '23_JOB_MARKET_INTELLIGENCE'
  | '24_SKILL_INTELLIGENCE'
  | '25_RESUME_BUILDER'
  | '26_LINKEDIN_SUPPORT'
  | '27_STUDENT_UPDATES'
  | '28_ADMIN_INTELLIGENCE';

export type Role = 'ANONYMOUS' | 'STUDENT' | 'REVIEWER' | 'INSTITUTION' | 'ADMIN';

export type RiasecDomain = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export type AptitudeDomain =
  | 'NUMERICAL'
  | 'VERBAL'
  | 'LOGICAL'
  | 'TARGET_KNOWLEDGE'
  | 'SPATIAL';

export type CapabilityDimensionId =
  | 'CAP_NUM_QUANT'
  | 'CAP_TECH_COMM'
  | 'CAP_SYS_DESIGN'
  | 'CAP_PROG_SW'
  | 'CAP_DATA_ANAL'
  | 'CAP_PROB_SOLV'
  | 'CAP_TEAM_COLLAB'
  | 'CAP_PROJ_EXEC'
  | 'CAP_ETHICS_GOV'
  | 'CAP_RESEARCH_SYN';

export type RubricLevel = 0 | 1 | 2 | 3 | 4;

export type RequirementStatus =
  | 'DEMONSTRATED'
  | 'PARTIALLY_DEMONSTRATED'
  | 'DEVELOPMENT_NEEDED'
  | 'EVIDENCE_MISSING'
  | 'EVIDENCE_PENDING_REVIEW'
  | 'MANDATORY_CONDITION_NOT_MET'
  | 'UNKNOWN_INSUFFICIENT_INFO'
  | 'NOT_APPLICABLE';

export type EvidenceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TECHNICAL_VALIDATION_PASSED'
  | 'TECHNICAL_VALIDATION_FAILED'
  | 'ASSIGNED_FOR_REVIEW'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'EXPIRED';

export type TargetCategory =
  | 'CAREER_PATHWAY'
  | 'INTERNSHIP_JOB'
  | 'COMPETITION'
  | 'PROJECT_CHALLENGE';

export type ActivityStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

export interface UserConsentState {
  acceptedDataProcessing: boolean;
  acceptedAssessmentTerms: boolean;
  acceptedEvidenceReviewTerms: boolean;
  consentTimestamp: string | null;
  consentVersion: string;
}

export interface StudentEligibilityFacts {
  enrolledStudentVerified: boolean;
  minimumAcademicStandingVerified: boolean;
  customEligibilityFlags: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  institutionId: string;
  institutionName: string;
  program: string;
  statedCareerGoal?: string;
  consent: UserConsentState;
  eligibility: StudentEligibilityFacts;
  isDevelopmentSeed: boolean;
}

export type StudentRecordCategory = 'PROJECT' | 'INTERNSHIP' | 'CERTIFICATE';

export interface StudentPortfolioRecord {
  id: string;
  recordType: StudentRecordCategory;
  title: string;
  organizationOrIssuer: string;
  completedDate: string;
  description: string;
  linkedDimensionId: CapabilityDimensionId;
  artifactUrl?: string;
  verificationState: 'UNVERIFIED_CLAIM' | 'EVIDENCE_SUBMITTED';
  createdAt: string;
}

export interface RiasecAssessmentResult {
  attemptId: string;
  completedAt: string;
  itemResponses: Record<string, number>;
  rawDomainSums: Record<RiasecDomain, number>;
  normalizedPercentage: Record<RiasecDomain, number>;
  topThreeCode: string;
  tieBreakApplied: boolean;
  isComplete48: boolean;
}

export interface AptitudeAttemptResult {
  id: string;
  domain: AptitudeDomain;
  completedAt: string;
  totalItems: number;
  correctCount: number;
  percentage: number;
  mappedRubricLevel: RubricLevel;
  rubricVersion: string;
}

export interface CapabilityDimensionRecord {
  dimensionId: CapabilityDimensionId;
  rubricVersion: string;
  selfReportedLevel: RubricLevel | null;
  selfReportedUpdatedAt: string | null;
  objectiveScoreLevel: RubricLevel | null;
  verifiedEvidenceLevel: RubricLevel | null;
  demonstratedLevel: RubricLevel | null;
  evidenceSource:
    | 'UNASSESSED'
    | 'SELF_REPORT_ONLY'
    | 'OBJECTIVE_ASSESSMENT'
    | 'REVIEWED_EVIDENCE'
    | 'COMBINED_VERIFIED';
  lastUpdatedAt: string;
}

export interface MandatoryEligibilityCondition {
  id: string;
  label: string;
  conditionType: 'ENROLLED_STUDENT' | 'ACADEMIC_STANDING' | 'CUSTOM_PREREQUISITE';
  isMet: boolean;
  verificationSource: 'INSTITUTION_ATTESTATION' | 'USER_ATTESTATION' | 'UNVERIFIED';
}

export interface TargetRequirement {
  id: string;
  dimensionId: CapabilityDimensionId;
  requiredSkillId?: string;
  requiredLevel: RubricLevel;
  rubricVersion: string;
  isMandatory: boolean;
  evidenceRequired: boolean;
  rationale: string;
  acceptableEvidenceTypes?: string;
}

export type OpportunityVerificationStatus =
  | 'VERIFIED'
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'UNAVAILABLE'
  | 'EXPIRED';

export interface OpportunityVerificationMetadata {
  organizerIdentityStatus: OpportunityVerificationStatus;
  opportunitySourceStatus: OpportunityVerificationStatus;
  requirementsExtractedStatus: OpportunityVerificationStatus;
  capabilitiesMappedStatus: OpportunityVerificationStatus;
  applicationLinkStatus: OpportunityVerificationStatus;
  deadlineStatus: OpportunityVerificationStatus;
  lastVerifiedAt: string | null;
  overallStatus: OpportunityVerificationStatus;
  statusExplanation: string;
}

export interface OpportunityTarget {
  id: string;
  title: string;
  category: TargetCategory;
  organizationLabel: string;
  isSampleData: boolean;
  version: string;
  rubricVersion: string;
  summary: string;
  fieldId?: string;
  sourceUrl?: string | null;
  applicationUrl?: string | null;
  applicationDeadline?: string | null;
  relevantRiasecDomains?: RiasecDomain[];
  verification?: OpportunityVerificationMetadata;
  mandatoryConditions: MandatoryEligibilityCondition[];
  requirements: TargetRequirement[];
}

export interface DevelopmentActivity {
  id: string;
  title: string;
  linkedDimensionId: CapabilityDimensionId;
  linkedSkillId?: string;
  linkedTargetId?: string;
  linkedTargetTitle?: string;
  linkedRequirementId?: string;
  targetRubricLevel: RubricLevel;
  objective: string;
  instructions: string;
  expectedOutputArtifact: string;
  externalResourceLabel?: string;
  externalResourceUrl?: string;
  status: ActivityStatus;
  progressPercent: number;
  reflectionNotes: string;
  completedAt: string | null;
}

export interface EvidenceReviewDimensions {
  relevance: RubricLevel;
  authenticityAndAttribution: RubricLevel;
  sufficiency: RubricLevel;
  quality: RubricLevel;
  currency: RubricLevel;
  context: RubricLevel;
}

export interface EvidenceReviewRecord {
  reviewId: string;
  reviewerId: string;
  reviewerName: string;
  reviewedAt: string;
  rubricVersion: string;
  decision: 'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED';
  verifiedRubricLevel: RubricLevel | null;
  dimensions: EvidenceReviewDimensions;
  rationale: string;
}

export interface EvidenceSubmission {
  id: string;
  studentId: string;
  title: string;
  description: string;
  linkedDimensionId: CapabilityDimensionId;
  linkedSkillId?: string;
  linkedTargetId?: string;
  claimedRubricLevel: RubricLevel;
  evidenceType: 'FILE' | 'URL';
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  url?: string;
  simulatedClientHash?: string;
  status: EvidenceStatus;
  technicalValidation: {
    sizeValid: boolean;
    mimeValid: boolean;
    malwareScanStatus: 'NOT_CONFIGURED_IN_DEV' | 'PASSED_PRODUCTION_SCAN' | 'FAILED';
    validationNotes: string;
  };
  assignedReviewerId: string | null;
  reviewDecision: EvidenceReviewRecord | null;
  submittedAt: string;
}

export interface HistoricalSnapshot {
  id: string;
  createdAt: string;
  actorId: string;
  triggerType:
    | 'CAPABILITY_CHANGE'
    | 'TARGET_REQUIREMENT_CHANGE'
    | 'RUBRIC_VERSION_CHANGE'
    | 'EVIDENCE_STATUS_CHANGE'
    | 'MANUAL_RECALCULATION';
  targetId: string;
  targetTitle: string;
  targetVersion: string;
  rubricVersion: string;
  summaryNote: string;
  statusCounts: Record<RequirementStatus, number>;
  capabilitySnapshot: Record<CapabilityDimensionId, RubricLevel | null>;
}

export interface SharingAuthorisation {
  id: string;
  studentId: string;
  recipientInstitution: string;
  scopeTargetId: string;
  includeEvidenceMetadata: boolean;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export interface FeatureFlagsConfig {
  enableSpatialReasoning: boolean;
  uploadPolicyMode: 'ENG_SPEC_10MB' | 'HANDOFF_25MB';
  skillSelfReportScaleMode: 'BEHAVIORAL_0_4' | 'CONFIDENCE_1_5_WITH_UNTRIED';
  aptitudeCooldownHours: number;
  institutionSuppressionThresholdK: number;
  maxShareExpiryDays: number;
}

export interface InstitutionCohortRecord {
  cohortId: string;
  cohortName: string;
  studentCount: number;
  isSuppressed: boolean;
  aggregateMetrics: {
    avgDemonstratedCount: number;
    avgGapCount: number;
    evidenceMissingPercent: number;
    unknownDimensionPercent: number;
  } | null;
}

// =============================================================================
// STAGE A: FIELD & SKILL LIBRARY DATA MODELS
// =============================================================================

export type PublicationStatus = 'PUBLISHED' | 'DRAFT_REVIEW' | 'RETIRED';

export type SkillCategoryType =
  | 'TECHNICAL_KNOWLEDGE'
  | 'CONCEPTUAL_UNDERSTANDING'
  | 'ANALYTICAL_REASONING'
  | 'COMMUNICATION'
  | 'PRACTICAL_EXECUTION'
  | 'CREATIVE_WORK'
  | 'ETHICS_AND_GOVERNANCE';

export type SkillAssessmentMethod =
  | 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE'
  | 'SCENARIO_AND_REVIEWED_EVIDENCE'
  | 'PORTFOLIO_OR_PROJECT_REVIEW_ONLY'
  | 'PRACTICAL_DEMONSTRATION_REQUIRED';

export interface FieldCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  specializations: string[];
  catalogueCoverageNote: string;
  version: string;
  publicationStatus: PublicationStatus;
}

export interface SkillCatalogueEntry {
  id: string;
  name: string;
  description: string;
  fieldId: string;
  specialization: string;
  skillCategory: SkillCategoryType;
  mappedCapabilityId: CapabilityDimensionId;
  relevantProficiencyLevels: RubricLevel[];
  prerequisiteSkillIds: string[];
  assessmentAvailable: boolean;
  assessmentMethod: SkillAssessmentMethod;
  assessmentMethodExplanation: string;
  associatedResourceIds: string[];
  evidenceRequirements: string;
  relatedOpportunityNotes: string;
  version: string;
  publicationStatus: PublicationStatus;
}

export interface StudentSkillProficiencyRecord {
  skillId: string;
  mappedCapabilityId: CapabilityDimensionId;
  selfReportedLevel: RubricLevel | null;
  assessedLevel: RubricLevel | null;
  verifiedEvidenceLevel: RubricLevel | null;
  demonstratedLevel: RubricLevel | null;
  lastAssessedAt: string | null;
  assessmentVersion: string | null;
}

// =============================================================================
// STAGE B: SKILL ASSESSMENT ENGINE DATA MODELS
// =============================================================================

export type SkillAssessmentType =
  | 'MULTIPLE_CHOICE'
  | 'MULTIPLE_SELECT'
  | 'NUMERICAL_PROBLEM'
  | 'SCENARIO_ANALYSIS'
  | 'SHORT_WRITTEN_RESPONSE'
  | 'CODING_OR_TECHNICAL_EXERCISE'
  | 'PRACTICAL_PROJECT_SUBMISSION'
  | 'PORTFOLIO_ASSESSMENT'
  | 'SIMULATION_DEMONSTRATION';

export type AssessmentSupportState =
  | 'SUPPORTED_DETERMINISTIC'
  | 'SUPPORTED_REVIEWER_WORKFLOW'
  | 'UNSUPPORTED_IN_CURRENT_RUNTIME';

export interface SkillAssessmentPublicItem {
  id: string;
  questionType:
    | 'MULTIPLE_CHOICE'
    | 'MULTIPLE_SELECT'
    | 'NUMERICAL_PROBLEM'
    | 'SCENARIO_ANALYSIS';
  prompt: string;
  scenarioContext?: string;
  subtopic: string;
  targetLevel: RubricLevel;
  options?: { id: string; text: string }[];
  numericalUnitLabel?: string;
  accessibilityNote?: string;
}

export interface SkillAssessmentDefinition {
  id: string;
  version: string;
  title: string;
  skillId: string;
  fieldId: string;
  mappedCapabilityId: CapabilityDimensionId;
  targetProficiencyLevel: RubricLevel;
  assessmentType: SkillAssessmentType;
  supportState: AssessmentSupportState;
  measurementObjective: string;
  instructions: string;
  estimatedDurationMinutes: number;
  prerequisiteSkillIds: string[];
  scoringRulesSummary: string;
  limitationsNotice: string;
  accessibilityConsiderations: string;
  requiresHumanReview: boolean;
  publicationStatus: PublicationStatus;
  items: SkillAssessmentPublicItem[];
  reviewerTaskPrompt?: string;
  expectedDeliverableGuide?: string;
}

export interface SkillAssessmentItemFeedback {
  itemId: string;
  subtopic: string;
  isCorrect: boolean;
  feedbackSummary: string;
}

export interface SkillAssessmentAttempt {
  id: string;
  studentId: string;
  assessmentId: string;
  assessmentVersion: string;
  assessmentTitle: string;
  skillId: string;
  fieldId: string;
  mappedCapabilityId: CapabilityDimensionId;
  completedAt: string;
  completionStatus: 'COMPLETED_SCORED' | 'SUBMITTED_FOR_HUMAN_REVIEW' | 'INCOMPLETE_VALIDATION_ERROR';
  evaluationMethod: 'DETERMINISTIC_ANSWER_KEY' | 'HUMAN_REVIEWER_RUBRIC';
  totalItems: number;
  correctCount: number;
  scorePercentage: number | null;
  awardedRubricLevel: RubricLevel | null;
  demonstratedStrengths: string[];
  areasNeedingDevelopment: string[];
  itemFeedback: SkillAssessmentItemFeedback[];
  recommendedResourceIds: string[];
  limitationsExplanation: string;
  recommendedNextSteps: string[];
}

// =============================================================================
// STAGE C & D: LEARNING HUB & RECOMMENDATION ENGINE DATA MODELS
// =============================================================================

export type LearningResourceType =
  | 'YOUTUBE_VIDEO'
  | 'YOUTUBE_PLAYLIST'
  | 'ONLINE_COURSE'
  | 'UNIVERSITY_OER'
  | 'OFFICIAL_DOCUMENTATION'
  | 'TECHNICAL_REFERENCE'
  | 'TUTORIAL_ARTICLE'
  | 'PRACTICE_EXERCISE'
  | 'PRACTICAL_PROJECT'
  | 'OPEN_TEXTBOOK'
  | 'STANDARD_GUIDANCE';

export type ResourceLinkVerificationStatus =
  | 'VERIFIED_OFFICIAL_SOURCE'
  | 'USER_CURATED_UNVERIFIED'
  | 'REPORTED_ISSUE'
  | 'UNAVAILABLE';

export type EditorialQualityStatus =
  | 'APPROVED_CATALOGUE'
  | 'PENDING_EDITORIAL_REVIEW'
  | 'FLAGGED_FOR_CHECK'
  | 'RETIRED';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  originalUrl: string;
  youtubeEmbedUrl?: string | null;
  resourceType: LearningResourceType;
  providerOrCreator: string;
  fieldId: string;
  specialization: string;
  associatedSkillIds: string[];
  mappedCapabilityId: CapabilityDimensionId;
  suggestedProficiencyLevel: RubricLevel;
  language: string;
  estimatedDuration: string | null;
  costInfo: 'FREE_OPEN_ACCESS' | 'FREE_TO_AUDIT' | 'PAID_SUBSCRIPTION' | null;
  prerequisites: string | null;
  certificateAvailable: boolean | null;
  publicationOrReviewedDate: string | null;
  linkVerificationStatus: ResourceLinkVerificationStatus;
  lastCheckedAt: string | null;
  editorialStatus: EditorialQualityStatus;
  accessibilityNotes: string | null;
  learningObjective: string;
}

export type StudentResourceProgressState =
  | 'NOT_STARTED'
  | 'BOOKMARKED'
  | 'SAVED'
  | 'IN_PROGRESS'
  | 'REVIEWED_SELF_STUDY'
  | 'COMPLETED_BY_USER'
  | 'PRACTICE_REQUIRED'
  | 'READY_FOR_REASSESSMENT';

export interface StudentResourceProgress {
  resourceId: string;
  studentId: string;
  status: StudentResourceProgressState;
  notes: string;
  updatedAt: string;
}

export interface ResourceIssueReport {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reportedBy: string;
  reason: 'BROKEN_LINK' | 'OUTDATED_CONTENT' | 'INACCURATE_MAPPING' | 'INACCESSIBLE';
  details: string;
  reportedAt: string;
  resolutionStatus: 'OPEN' | 'RESOLVED' | 'RETIRED';
}

export interface ContentReviewHistoryEntry {
  id: string;
  entityType: 'FIELD' | 'SKILL' | 'ASSESSMENT' | 'LEARNING_RESOURCE';
  entityId: string;
  entityTitle: string;
  previousStatus: string;
  newStatus: string;
  version: string;
  actorId: string;
  actorRole: Role;
  reviewNotes: string;
  timestamp: string;
}


