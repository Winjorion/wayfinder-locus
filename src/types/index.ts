/**
 * WAYFINDER — Core Type Definitions (Master Implementation Directive | SIH26044 | Team LOCUS)
 * Central Principle: CLAIM ≠ CAPABILITY ≠ PROOF
 * Rule: Unknown is NOT zero. Simulated development data is explicitly labeled.
 */

export type UserRole =
  | 'anonymous'
  | 'student'
  | 'reviewer'
  | 'institution'
  | 'admin';

export type DataOrigin = 'simulated_seed' | 'local_dev_session' | 'verified_backend';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  institution?: string;
  institutionCohortId?: string;
  consentGiven: boolean;
  consentDate?: string;
  isSimulatedPersona: boolean;
  dataOrigin: DataOrigin;
}

// Assessment: RIASEC Interest Types
export type RiasecDomain = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RiasecItem {
  id: number;
  code: string; // e.g., 'RIASEC-R-01'
  domain: RiasecDomain;
  domainName: 'Realistic' | 'Investigative' | 'Artistic' | 'Social' | 'Enterprising' | 'Conventional';
  statement: string;
}

export interface RiasecResult {
  completedAt: string;
  answeredCount: number;
  totalItems: number;
  isCompleteProfile?: boolean;
  scores: Record<RiasecDomain, number>; // Raw sum: 8-40 per domain when all 8 answered
  meanScores: Record<RiasecDomain, number>; // 1.00 - 5.00
  normalizedScores: Record<RiasecDomain, number>; // 0 - 100 scale: ((Raw - 8) / 32) * 100
  primaryCode: string; // e.g. "IRC" (top 3)
  tieBreakingPolicyUsed?: 'alphabetical' | 'canonical_riasec';
  hasTies: boolean;
  tieNotes?: string;
  disclaimer: string;
  dataOrigin: DataOrigin;
}

// Aptitude & Target Knowledge
export type AptitudeDomain = 'quantitative' | 'logical' | 'systems' | 'domain_knowledge' | 'spatial';

export interface AptitudeQuestion {
  id: string;
  namespaceCode: string; // e.g. 'APT-NUM-01', 'APT-SPA-01'
  domain: AptitudeDomain;
  domainTitle: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface AptitudeDomainScore {
  answered: number;
  correct: number;
  total: number;
  percentage: number | null; // null if unassessed or disabled! Unknown is NOT zero.
}

export interface AptitudeResult {
  completedAt: string;
  scoresByDomain: Record<AptitudeDomain, AptitudeDomainScore>;
  diagnosticBand: 'Foundational' | 'Intermediate' | 'Proficient' | 'Advanced' | 'Insufficient Data';
  spatialIncluded: boolean;
  answerKeyVersion?: string;
  dataOrigin: DataOrigin;
}

// Competency Rubric (10 Canonical Dimensions)
export type CompetencyLevel = 1 | 2 | 3 | 4 | 5;

export interface RubricLevelDescriptor {
  level: CompetencyLevel;
  name: string;
  description: string;
  observableBehaviors: string[];
}

export interface CompetencyDefinition {
  id: string;
  code: string;
  title: string;
  category: 'Technical' | 'Analytical' | 'Domain Practice' | 'Collaboration';
  levels: Record<CompetencyLevel, RubricLevelDescriptor>;
  version: string;
}

// Student Capability Profile (Claim vs Verified; preserves UNTRIED as null)
export interface StudentCompetencyRecord {
  competencyId: string;
  claimedLevel?: CompetencyLevel | null; // null = explicitly UNTRIED (Unknown, never 0)
  isUntried?: boolean;
  claimedAt?: string;
  claimNotes?: string;
  claimedRubricVersion?: string;
  demonstratedLevel?: CompetencyLevel | null;
  demonstratedRubricVersion?: string;
  verifiedAt?: string;
  verifiedByReviewerId?: string;
  reviewerNotes?: string;
  evidenceId?: string;
  isSimulatedVerification?: boolean;
  dataOrigin: DataOrigin;
}

// Mandatory / Prerequisite Eligibility Record (Decoupled from Onboarding Consent!)
export type EligibilityVerificationStatus =
  | 'unknown'
  | 'self_declared_unverified'
  | 'verified_eligible'
  | 'explicitly_not_met';

export interface StudentEligibilityRecord {
  requirementId: string;
  status: EligibilityVerificationStatus;
  updatedAt: string;
  notes?: string;
  isSimulatedStatus: boolean;
}

// Opportunity Targets
export type OpportunityCategory =
  | 'career_pathway'
  | 'internship_job'
  | 'competition'
  | 'practical_challenge';

export type RequirementType = 'mandatory' | 'competency_level' | 'prerequisite_credential' | 'desirable';

// Canonical Eight Requirement Statuses (WF-DOC-08 v2.0 & Master Directive Sec. 8)
export type CanonicalRequirementStatus =
  | 'DEMONSTRATED'
  | 'PARTIALLY_DEMONSTRATED'
  | 'DEVELOPMENT_NEEDED'
  | 'EVIDENCE_MISSING'
  | 'EVIDENCE_PENDING_REVIEW'
  | 'MANDATORY_CONDITION_NOT_MET'
  | 'UNKNOWN_INSUFFICIENT_INFO'
  | 'NOT_APPLICABLE';

export type ReadinessRequirementStatus =
  | 'demonstrated'
  | 'partially_demonstrated'
  | 'development_needed'
  | 'evidence_missing'
  | 'evidence_pending_review'
  | 'mandatory_condition_not_met'
  | 'unknown_insufficient_information'
  | 'not_applicable';

export interface OpportunityRequirement {
  id: string;
  title: string;
  type: RequirementType;
  competencyId?: string;
  requiredLevel?: CompetencyLevel;
  requiredRubricVersion?: string;
  mandatory: boolean;
  description: string;
  verificationMethod: 'Reviewer Rubric' | 'Automated Diagnostic' | 'Prerequisite Verification';
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  categoryLabel: string;
  version?: string;
  isSampleData?: boolean;
  isCustomTarget?: boolean;
  shortSummary: string;
  description: string;
  location: string;
  timeCommitment: string;
  deadline?: string;
  prerequisites: string[];
  requirements: OpportunityRequirement[];
}

// Evidence Ledger & Six Review Dimensions
export type EvidenceStatus = 'submitted' | 'under_review' | 'verified' | 'revision_requested' | 'rejected';

export interface AutomatedFileCheck {
  mimeTypeValid: boolean;
  fileSizeWithinLimits: boolean;
  malwareScanStatus: 'not_configured_unscanned'; // Never claim malware-scanned when no scanner is connected
  digestMethod: 'web_crypto_sha256_client_only' | 'url_reference_only' | 'none_simulated_metadata';
  timestamp: string;
  notes: string;
}

export type ReviewDimensionRating = 'satisfactory' | 'needs_improvement' | 'insufficient';

export interface SixDimensionReviewRecord {
  relevance: ReviewDimensionRating;
  authenticityAndAttribution: ReviewDimensionRating;
  sufficiency: ReviewDimensionRating;
  quality: ReviewDimensionRating;
  currency: ReviewDimensionRating;
  context: ReviewDimensionRating;
  evaluatedRubricVersion: string;
}

export interface EvidenceItem {
  id: string;
  studentId: string;
  studentName: string;
  targetOpportunityId: string;
  targetOpportunityTitle: string;
  competencyId: string;
  competencyTitle: string;
  claimedLevel: CompetencyLevel;
  claimStatement: string;
  evidenceType?: 'file' | 'url';
  evidenceUrl?: string;
  fileName: string;
  fileSizeKb: number;
  fileMime: string;
  fileSha256: string | null; // Null for simulated metadata-only or URL entries; real SHA-256 only when computed from actual File bytes
  uploadedAt: string;
  revisionCount?: number;
  status: EvidenceStatus;
  automatedCheck: AutomatedFileCheck;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reviewerScoreLevel?: CompetencyLevel;
  reviewerFeedback?: string;
  sixDimensionReview?: SixDimensionReviewRecord;
  reviewedAt?: string;
  isSimulatedRecord: boolean;
  reviewOrigin?: 'simulated_dev_review' | 'seed_sample_review';
}

// Learning Activities
export type ActivityProgressStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

export interface LearningActivity {
  id: string;
  title: string;
  provider: string;
  duration: string;
  format: 'Self-paced Module' | 'Guided Project' | 'Hands-on Lab' | 'Peer Review Study';
  targetCompetencyId: string;
  targetCompetencyTitle: string;
  targetLevel: CompetencyLevel;
  summary: string;
  prerequisites: string[];
  deliverablePrompt: string;
  externalResourceUrl?: string;
  enrolled: boolean;
  completed: boolean;
  status?: ActivityProgressStatus;
  progressPercent?: number;
  reflectionNotes?: string;
}

// Historical Snapshot (Distinguishes Capability Change, Target Change, Rubric Change, Evidence Status, Recalculated Report)
export type SnapshotChangeCategory =
  | 'CAPABILITY_CHANGE'
  | 'TARGET_REQUIREMENT_CHANGE'
  | 'RUBRIC_VERSION_CHANGE'
  | 'EVIDENCE_STATUS_CHANGE'
  | 'RECALCULATED_REPORT';

export interface CapabilitySnapshot {
  id: string;
  timestamp: string;
  triggerEvent:
    | 'Initial Diagnostic'
    | 'RIASEC Completed'
    | 'Evidence Approved'
    | 'Reassessment Calibration'
    | 'Target Requirement Updated'
    | 'Rubric Version Updated';
  changeCategory?: SnapshotChangeCategory;
  actorId?: string;
  targetOpportunityId?: string;
  targetOpportunityTitle?: string;
  targetVersion?: string;
  rubricVersion?: string;
  metrics: {
    knownRequirementsCount: number;
    demonstratedRequirementsCount: number;
    gapsCount: number;
    pendingReviewsCount: number;
    unknownCount: number;
  };
  notes: string;
  isSimulatedSnapshot: boolean;
}

// Append-Only Audit Event
export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: UserRole;
  actionType:
    | 'ASSESSMENT_SUBMITTED'
    | 'SELF_CLAIM_UPDATED'
    | 'EVIDENCE_SUBMITTED'
    | 'EVIDENCE_RESUBMITTED'
    | 'REVIEW_DECISION_RECORDED'
    | 'TARGET_VERSION_UPDATED'
    | 'CUSTOM_TARGET_CREATED'
    | 'SHARE_TOKEN_CREATED'
    | 'SHARE_TOKEN_REVOKED'
    | 'SNAPSHOT_RECORDED';
  entityId: string;
  summary: string;
  rubricVersion?: string;
  targetVersion?: string;
  beforeState?: string;
  afterState?: string;
}

// Privacy & Scoped Sharing
export interface ScopedShareToken {
  id: string;
  recipientLabel: string;
  scope: 'full_passport' | 'verified_only' | 'anonymous_gap_summary';
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  accessCount: number;
  tokenString: string;
  isSimulatedToken: boolean;
}

// Institution Cohort Metrics
export interface InstitutionCohortMetric {
  cohortId: string;
  cohortName: string;
  program: string;
  studentCount: number; // Enforces minimum cohort suppression rule (suppressed if < 5)
  topTargetPathways: { pathway: string; studentInterestCount: number }[];
  competencyReadinessDistribution: {
    competencyTitle: string;
    demonstratedPct: number;
    gapPct: number;
    unknownPct: number;
  }[];
  isSimulatedCohort: boolean;
}
