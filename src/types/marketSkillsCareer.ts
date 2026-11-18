import {
  CapabilityDimensionId,
  MandatoryEligibilityCondition,
  RiasecDomain,
  Role,
  RubricLevel,
  TargetRequirement,
} from './wayfinder';

// =============================================================================
// MODULE 1 — JOB MARKET INTELLIGENCE DATA MODELS
// =============================================================================

export type MarketListingStatus =
  | 'DISCOVERED'
  | 'VALIDATION_PENDING'
  | 'VERIFIED_ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'CLOSED'
  | 'UNVERIFIABLE';

export type MarketOpportunityCategory =
  | 'JOB_OPPORTUNITY'
  | 'INTERNSHIP'
  | 'GRADUATE_PROGRAMME'
  | 'ENTRY_LEVEL'
  | 'APPRENTICESHIP'
  | 'FELLOWSHIP'
  | 'RESEARCH_OPPORTUNITY'
  | 'HIRING_ANNOUNCEMENT';

export type WorkArrangement = 'REMOTE' | 'HYBRID' | 'ON_SITE';

export type EmploymentTypeLabel =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'INTERNSHIP_CONTRACT'
  | 'FELLOWSHIP_STIPEND'
  | 'APPRENTICESHIP_TRAINING'
  | 'RESEARCH_GRANT';

export type ExperienceLevelLabel =
  | 'STUDENT_INTERN'
  | 'FRESH_GRADUATE'
  | 'ENTRY_LEVEL_0_2_YRS'
  | 'RESEARCH_FELLOW'
  | 'APPRENTICE_TRAINEE';

export type SavedApplicationStatus =
  | 'SAVED'
  | 'PLANNING_TO_APPLY'
  | 'APPLICATION_IN_PROGRESS'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER_RECEIVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface EmployerDirectoryRecord {
  id: string;
  name: string;
  industry: string;
  headquarters: string;
  organizationType: 'CORPORATE' | 'RESEARCH_INSTITUTE' | 'PUBLIC_SECTOR' | 'NON_PROFIT' | 'UNIVERSITY_LAB';
  overview: string;
  officialWebsiteUrl: string | null;
  isSampleData: boolean;
}

export interface JobMarketOpportunity {
  id: string;
  title: string;
  employerId: string;
  employerName: string;
  employerOverview: string;
  industry: string;
  fieldId: string;
  specialization: string;
  category: MarketOpportunityCategory;
  location: string;
  workArrangement: WorkArrangement;
  employmentType: EmploymentTypeLabel;
  experienceLevel: ExperienceLevelLabel;
  experienceRequirementsText: string;
  educationEligibility: string;
  requiredSkillIds: string[];
  preferredSkillIds: string[];
  requiredCapabilities: TargetRequirement[];
  preferredCapabilities: {
    dimensionId: CapabilityDimensionId;
    recommendedLevel: RubricLevel;
    rationale: string;
  }[];
  mandatoryConditions: MandatoryEligibilityCondition[];
  overview: string;
  applicationInstructions: string;
  applicationDeadline: string | null;
  sourceName: string;
  sourceUrl: string | null;
  discoveryDate: string;
  lastVerificationDate: string | null;
  listingStatus: MarketListingStatus;
  relevantRiasecDomains: RiasecDomain[];
  isSampleData: boolean;
  dataNotice: string;
}

export interface MarketDemandTrendSignal {
  id: string;
  fieldId: string;
  specialization: string;
  headline: string;
  summary: string;
  observedRoleCategories: string[];
  highlightedSkillIds: string[];
  observationPeriod: string;
  sourceReference: string;
  isSampleData: boolean;
}

export interface SavedMarketOpportunityRecord {
  opportunityId: string;
  savedAt: string;
  applicationStatus: SavedApplicationStatus;
  personalNotes: string;
  applicationDate: string | null;
  reminderDeadline: string | null;
  updatedAt: string;
}

export interface JobMarketFilterCriteria {
  fieldId: string;
  specialization: string;
  searchQuery: string;
  location: string;
  workArrangement: string;
  experienceLevel: string;
  educationEligibility: string;
  employmentType: string;
  requiredSkillId: string;
  deadlineFilter: 'ALL' | 'ACTIVE_ONLY' | 'EXPIRING_SOON' | 'INCLUDE_EXPIRED';
  category: MarketOpportunityCategory | 'ALL';
}

// =============================================================================
// MODULE 2 — SKILL INTELLIGENCE & INDUSTRY TRENDS DATA MODELS
// =============================================================================

export type SkillTrendClassification =
  | 'EMERGING'
  | 'GROWING_DEMAND'
  | 'STABLE'
  | 'DECLINING_DEMAND'
  | 'TRANSFORMING'
  | 'INSUFFICIENT_EVIDENCE';

export type SkillTrendSectionType =
  | 'CORE_SKILL_TREND'
  | 'NEW_TECHNOLOGY'
  | 'PROFESSIONAL_TOOL'
  | 'INTERDISCIPLINARY_SKILL'
  | 'FIELD_SPECIFIC_DEVELOPMENT';

export type EvidenceStrengthLevel =
  | 'MODERATE_MULTI_SOURCE_SAMPLE'
  | 'PRELIMINARY_OBSERVATION'
  | 'INSUFFICIENT_SAMPLE_DATA';

export type ConfidenceRatingLevel = 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_PRELIMINARY';

export type CandidateReviewStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED_FOR_CATALOGUE_PROPOSAL'
  | 'REJECTED'
  | 'FURTHER_RESEARCH_REQUESTED'
  | 'INSUFFICIENT_EVIDENCE_MARKED';

export type SkillCandidateClassification =
  | 'NEW_SKILL'
  | 'UPDATED_DESCRIPTION'
  | 'SYNONYM'
  | 'SUBSKILL'
  | 'SPECIALISATION'
  | 'DUPLICATE'
  | 'POTENTIALLY_OUTDATED';

export interface SupportingResearchSource {
  id: string;
  title: string;
  publisherOrBody: string;
  publicationDate: string;
  sourceType: 'CURRICULUM_STANDARD' | 'INDUSTRY_FRAMEWORK' | 'OPEN_DOCUMENTATION' | 'SAMPLE_BENCHMARK';
  url: string | null;
  isSampleCitation: boolean;
}

export interface SkillTrendRecord {
  id: string;
  skillName: string;
  linkedCatalogueSkillId: string | null;
  fieldId: string;
  specialization: string;
  mappedCapabilityId: CapabilityDimensionId;
  trendClassification: SkillTrendClassification;
  sectionType: SkillTrendSectionType;
  description: string;
  industryRelevance: string;
  relatedJobRoles: string[];
  relatedSkillIds: string[];
  recommendedProficiencyLevel: RubricLevel | null;
  supportingSources: SupportingResearchSource[];
  publicationDatesSummary: string;
  researchDate: string;
  evidenceStrength: EvidenceStrengthLevel;
  confidenceLevel: ConfidenceRatingLevel;
  reviewStatus: CandidateReviewStatus;
  developmentRecommendations: string[];
  relatedOpportunityIds: string[];
  associatedResourceIds: string[];
  isSampleData: boolean;
}

export interface SkillLibraryCandidateProposal {
  id: string;
  proposedSkillName: string;
  fieldId: string;
  specialization: string;
  mappedCapabilityId: CapabilityDimensionId;
  candidateClassification: SkillCandidateClassification;
  targetExistingSkillId: string | null;
  proposedDescription: string;
  rationale: string;
  trendClassification: SkillTrendClassification;
  supportingSources: SupportingResearchSource[];
  evidenceStrength: EvidenceStrengthLevel;
  confidenceLevel: ConfidenceRatingLevel;
  reviewStatus: CandidateReviewStatus;
  reviewerNotes: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedByRole: Role | null;
  isSampleData: boolean;
}

// =============================================================================
// MODULE 3 — RESUME BUILDER DATA MODELS
// =============================================================================

export type ResumeTemplateId =
  | 'MINIMAL_PROFESSIONAL'
  | 'MODERN_GRADUATE'
  | 'ACADEMIC'
  | 'TECHNICAL'
  | 'INTERNSHIP_FOCUSED'
  | 'ATS_FRIENDLY';

export type ResumeSkillProvenance =
  | 'SELF_REPORTED'
  | 'ASSESSED'
  | 'DEMONSTRATED'
  | 'VERIFIED_CAPABILITY';

export interface ResumePersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  professionalProfileUrl: string;
  portfolioUrl: string;
  githubUrl: string;
}

export interface ResumeEducationEntry {
  id: string;
  institution: string;
  degree: string;
  specialization: string;
  startDate: string;
  endDateOrExpected: string;
  academicAchievements: string;
}

export interface ResumeSkillSelection {
  skillId: string;
  skillName: string;
  fieldId: string;
  mappedCapabilityId: CapabilityDimensionId;
  provenance: ResumeSkillProvenance;
  rubricLevel: RubricLevel | null;
}

export interface ResumeExperienceEntry {
  id: string;
  experienceType: 'EMPLOYMENT' | 'INTERNSHIP' | 'VOLUNTEERING' | 'LEADERSHIP';
  roleTitle: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export interface ResumeProjectEntry {
  id: string;
  projectName: string;
  role: string;
  description: string;
  technologiesOrSkills: string[];
  projectUrl: string;
  evidenceOrPortfolioLink: string;
}

export interface ResumeCertificationEntry {
  id: string;
  category: 'CERTIFICATION' | 'AWARD' | 'PUBLICATION' | 'ACHIEVEMENT';
  title: string;
  issuerOrVenue: string;
  dateIssued: string;
  credentialUrl: string;
}

export interface ResumeVersionRecord {
  id: string;
  versionName: string;
  templateId: ResumeTemplateId;
  tailoredOpportunityId: string | null;
  personalInfo: ResumePersonalInfo;
  professionalSummary: string;
  education: ResumeEducationEntry[];
  skills: ResumeSkillSelection[];
  experience: ResumeExperienceEntry[];
  projects: ResumeProjectEntry[];
  certifications: ResumeCertificationEntry[];
  updatedAt: string;
}

export interface ResumeCompletenessIssue {
  id: string;
  category:
    | 'MISSING_CONTACT'
    | 'MISSING_EDUCATION'
    | 'EMPTY_SECTION'
    | 'MISSING_DATES'
    | 'UNCLEAR_DESCRIPTION'
    | 'FORMATTING_ISSUE'
    | 'UNSUPPORTED_CLAIM'
    | 'MISSING_LINKS';
  severity: 'REQUIRED' | 'RECOMMENDATION';
  sectionLabel: string;
  message: string;
  remediationTip: string;
}

export interface ResumeCompletenessReport {
  totalChecks: number;
  passedChecks: number;
  issues: ResumeCompletenessIssue[];
}

export interface ResumeOpportunityTailoringReport {
  opportunityId: string;
  opportunityTitle: string;
  employerName: string;
  relevantExistingExperience: string[];
  relevantProjects: string[];
  relevantDemonstratedOrAssessedSkills: string[];
  missingInformationInResume: string[];
  accurateCapabilityKeywords: string[];
  areasNeedingFurtherDevelopment: string[];
  ethicalTailoringNotice: string;
}

// =============================================================================
// MODULE 4 — MANUAL LINKEDIN PROFILE SUPPORT DATA MODELS
// =============================================================================

export type ProfileProvenanceLabel =
  | 'USER_PROVIDED'
  | 'IMPORTED_BY_USER'
  | 'ASSESSED_BY_WAYFINDER'
  | 'EVIDENCE_SUBMITTED'
  | 'VERIFIED';

export interface ManualLinkedInProfile {
  profileUrl: string;
  headline: string;
  aboutSection: string;
  educationSummary: string;
  experienceSummary: string;
  listedSkillNames: string[];
  certificationsSummary: string;
  projectsSummary: string;
  portfolioLinks: string[];
  provenance: ProfileProvenanceLabel;
  lastUpdatedAt: string | null;
}

export interface LinkedInCompletenessReport {
  completedSectionsCount: number;
  totalSectionsCount: number;
  missingInformation: string[];
  incompleteSections: string[];
  relevantWayfinderSkillsNotIncluded: string[];
  wayfinderProjectsToPresent: string[];
  experienceImprovementSuggestions: string[];
}

export interface LinkedInWayfinderDiscrepancy {
  id: string;
  discrepancyType:
    | 'CLAIMED_ON_LINKEDIN_NOT_ASSESSED_IN_WAYFINDER'
    | 'ASSESSED_IN_WAYFINDER_MISSING_FROM_PROFILE'
    | 'PROJECT_IN_WAYFINDER_MISSING_FROM_PROFILE'
    | 'EVIDENCE_IN_WAYFINDER_NOT_LINKED_EXTERNALLY';
  itemTitle: string;
  linkedInStateLabel: ProfileProvenanceLabel | 'NOT_LISTED_ON_PROFILE';
  wayfinderStateLabel: ProfileProvenanceLabel | 'UNASSESSED_IN_WAYFINDER';
  explanation: string;
  recommendedAction: string;
}

// =============================================================================
// MODULE 5 — PERSONALISED MARKET & SKILL UPDATES DATA MODELS
// =============================================================================

export type UpdateCategory =
  | 'JOB_UPDATE'
  | 'INTERNSHIP_UPDATE'
  | 'EMERGING_SKILL_UPDATE'
  | 'INDUSTRY_CHANGE'
  | 'LEARNING_OPPORTUNITY'
  | 'APPLICATION_DEADLINE'
  | 'PROFESSIONAL_DEVELOPMENT';

export type UpdateVerificationBadge =
  | 'SAMPLE_DATA'
  | 'RECENTLY_DISCOVERED'
  | 'SOURCE_VERIFIED'
  | 'EXPIRED'
  | 'AWAITING_REVIEW';

export interface MarketAndSkillUpdateItem {
  id: string;
  title: string;
  summary: string;
  category: UpdateCategory;
  fieldId: string;
  specialization: string;
  relatedSkillIds: string[];
  relatedOpportunityId: string | null;
  relatedResourceId: string | null;
  publishedAt: string;
  verificationBadge: UpdateVerificationBadge;
  sourceLabel: string;
  isSampleData: boolean;
}

export interface StudentUpdatePreferences {
  followedFieldIds: string[];
  followedSpecializations: string[];
  followedSkillIds: string[];
  savedTrendIds: string[];
  savedUpdateIds: string[];
  readUpdateIds: string[];
  enabledCategories: UpdateCategory[];
}

// =============================================================================
// MODULE 6 — ADMINISTRATIVE INTELLIGENCE WORKSPACE DATA MODELS
// =============================================================================

export interface AdminMarketResearchMetrics {
  totalDiscoveredOpportunities: number;
  verifiedOpportunities: number;
  pendingValidation: number;
  expiredListings: number;
  totalResearchRecords: number;
  sourceDistribution: { sourceType: string; count: number }[];
  fieldDistribution: { fieldId: string; fieldName: string; opportunityCount: number; skillTrendCount: number }[];
  isDemonstrationMetrics: boolean;
}

export interface AdminResearchExecutionRecord {
  id: string;
  executedAt: string;
  scopeFieldId: string;
  category: 'MARKET_OPPORTUNITY_SCAN' | 'SKILL_TREND_SYNTHESIS' | 'LINK_VERIFICATION_CHECK';
  status: 'SIMULATED_SAMPLE_LOG' | 'NOT_YET_CONNECTED';
  recordsInspected: number;
  notes: string;
}

export interface AdminResearchConfiguration {
  enabledFieldIds: string[];
  enabledCategories: MarketOpportunityCategory[];
  sourcePreferences: string[];
  researchFrequency: 'MANUAL_CURATOR_ONLY' | 'WEEKLY_SCHEDULED_DEFERRED' | 'MONTHLY_SCHEDULED_DEFERRED';
  geographicCoverage: string[];
  requireDualSourceValidation: boolean;
  minimumEvidenceStrengthForReview: EvidenceStrengthLevel;
  backendConnectionStatus: 'NOT_YET_CONNECTED';
}
