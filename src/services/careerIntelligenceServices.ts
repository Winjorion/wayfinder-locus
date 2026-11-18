import {
  CapabilityDimensionRecord,
  EvidenceSubmission,
  FieldCategory,
  OpportunityTarget,
  Role,
  SkillCatalogueEntry,
  StudentPortfolioRecord,
  StudentSkillProficiencyRecord,
} from '../types/wayfinder';
import {
  AdminMarketResearchMetrics,
  AdminResearchConfiguration,
  AdminResearchExecutionRecord,
  CandidateReviewStatus,
  JobMarketFilterCriteria,
  JobMarketOpportunity,
  LinkedInCompletenessReport,
  LinkedInWayfinderDiscrepancy,
  ManualLinkedInProfile,
  MarketAndSkillUpdateItem,
  MarketDemandTrendSignal,
  ResumeCompletenessIssue,
  ResumeCompletenessReport,
  ResumeOpportunityTailoringReport,
  ResumeSkillProvenance,
  ResumeSkillSelection,
  ResumeVersionRecord,
  SavedApplicationStatus,
  SavedMarketOpportunityRecord,
  SkillCandidateClassification,
  SkillLibraryCandidateProposal,
  SkillTrendClassification,
  SkillTrendRecord,
  StudentUpdatePreferences,
  UpdateCategory,
} from '../types/marketSkillsCareer';
import {
  INITIAL_ADMIN_EXECUTION_HISTORY,
  INITIAL_ADMIN_RESEARCH_CONFIG,
  INITIAL_JOB_MARKET_OPPORTUNITIES,
  INITIAL_MARKET_DEMAND_TRENDS,
  INITIAL_SKILL_CANDIDATE_PROPOSALS,
  INITIAL_SKILL_TREND_RECORDS,
  INITIAL_STUDENT_MARKET_UPDATES,
} from '../data/marketSkillsMockData';
import { getCapabilityDimensionName } from '../data/capabilityDimensions';

/**
 * WAYFINDER — SERVICE ADAPTER LAYER (Section 11)
 *
 * Implements the 6 required service layers:
 * 1. JobMarketService
 * 2. SkillIntelligenceService
 * 3. ResumeService
 * 4. ProfessionalProfileService
 * 5. StudentUpdatesService
 * 6. AdminResearchService
 *
 * Uses a clean adapter pattern so mock services can later be replaced with Supabase-backed
 * persistence without modifying UI components.
 */

const STORAGE_KEYS = {
  SAVED_OPPORTUNITIES: 'wf_career_saved_opportunities_v1',
  CANDIDATE_PROPOSALS: 'wf_career_skill_candidates_v1',
  RESUME_VERSIONS: 'wf_career_resume_versions_v1',
  LINKEDIN_PROFILE: 'wf_career_linkedin_profile_v1',
  UPDATE_PREFS: 'wf_career_update_prefs_v1',
  ADMIN_CONFIG: 'wf_career_admin_config_v1',
};

function readStorageJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorageJson<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / iframe restrictions
  }
}

// =============================================================================
// 1. JOB MARKET SERVICE
// =============================================================================

export interface IJobMarketService {
  getAllOpportunities(): JobMarketOpportunity[];
  getOpportunityById(id: string): JobMarketOpportunity | undefined;
  filterOpportunities(criteria: Partial<JobMarketFilterCriteria>): JobMarketOpportunity[];
  getMarketDemandTrends(fieldId?: string): MarketDemandTrendSignal[];
  convertMarketOpportunityToTarget(opp: JobMarketOpportunity): OpportunityTarget;
  getSavedOpportunities(): SavedMarketOpportunityRecord[];
  saveOrUpdateOpportunityTracking(
    opportunityId: string,
    status: SavedApplicationStatus,
    personalNotes?: string,
    applicationDate?: string | null,
    reminderDeadline?: string | null
  ): SavedMarketOpportunityRecord[];
  removeSavedOpportunity(opportunityId: string): SavedMarketOpportunityRecord[];
}

class MockJobMarketServiceAdapter implements IJobMarketService {
  private opportunities: JobMarketOpportunity[] = [...INITIAL_JOB_MARKET_OPPORTUNITIES];
  private demandTrends: MarketDemandTrendSignal[] = [...INITIAL_MARKET_DEMAND_TRENDS];
  private savedRecords: SavedMarketOpportunityRecord[] = readStorageJson(
    STORAGE_KEYS.SAVED_OPPORTUNITIES,
    []
  );

  getAllOpportunities(): JobMarketOpportunity[] {
    return this.opportunities;
  }

  getOpportunityById(id: string): JobMarketOpportunity | undefined {
    return this.opportunities.find((o) => o.id === id);
  }

  filterOpportunities(criteria: Partial<JobMarketFilterCriteria>): JobMarketOpportunity[] {
    return this.opportunities.filter((opp) => {
      if (criteria.fieldId && criteria.fieldId !== 'ALL' && opp.fieldId !== criteria.fieldId) {
        return false;
      }
      if (
        criteria.specialization &&
        criteria.specialization !== 'ALL' &&
        opp.specialization !== criteria.specialization
      ) {
        return false;
      }
      if (criteria.category && criteria.category !== 'ALL' && opp.category !== criteria.category) {
        return false;
      }
      if (
        criteria.workArrangement &&
        criteria.workArrangement !== 'ALL' &&
        opp.workArrangement !== criteria.workArrangement
      ) {
        return false;
      }
      if (
        criteria.experienceLevel &&
        criteria.experienceLevel !== 'ALL' &&
        opp.experienceLevel !== criteria.experienceLevel
      ) {
        return false;
      }
      if (
        criteria.employmentType &&
        criteria.employmentType !== 'ALL' &&
        opp.employmentType !== criteria.employmentType
      ) {
        return false;
      }
      if (
        criteria.requiredSkillId &&
        criteria.requiredSkillId !== 'ALL' &&
        !opp.requiredSkillIds.includes(criteria.requiredSkillId) &&
        !opp.preferredSkillIds.includes(criteria.requiredSkillId)
      ) {
        return false;
      }
      if (criteria.location && criteria.location.trim()) {
        const locQuery = criteria.location.trim().toLowerCase();
        if (!opp.location.toLowerCase().includes(locQuery)) return false;
      }
      if (criteria.educationEligibility && criteria.educationEligibility.trim()) {
        const eduQuery = criteria.educationEligibility.trim().toLowerCase();
        if (!opp.educationEligibility.toLowerCase().includes(eduQuery)) return false;
      }
      if (criteria.deadlineFilter && criteria.deadlineFilter !== 'ALL') {
        if (criteria.deadlineFilter === 'ACTIVE_ONLY') {
          if (opp.listingStatus === 'EXPIRED' || opp.listingStatus === 'CLOSED') return false;
        } else if (criteria.deadlineFilter === 'EXPIRING_SOON') {
          if (opp.listingStatus !== 'EXPIRING_SOON') return false;
        }
      }
      if (criteria.searchQuery && criteria.searchQuery.trim()) {
        const q = criteria.searchQuery.trim().toLowerCase();
        const matchesText =
          opp.title.toLowerCase().includes(q) ||
          opp.employerName.toLowerCase().includes(q) ||
          opp.industry.toLowerCase().includes(q) ||
          opp.overview.toLowerCase().includes(q) ||
          opp.specialization.toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      return true;
    });
  }

  getMarketDemandTrends(fieldId?: string): MarketDemandTrendSignal[] {
    if (!fieldId || fieldId === 'ALL') return this.demandTrends;
    return this.demandTrends.filter((t) => t.fieldId === fieldId);
  }

  convertMarketOpportunityToTarget(opp: JobMarketOpportunity): OpportunityTarget {
    const isExpired = opp.listingStatus === 'EXPIRED' || opp.listingStatus === 'CLOSED';
    return {
      id: opp.id,
      title: opp.title,
      category:
        opp.category === 'INTERNSHIP' || opp.category === 'JOB_OPPORTUNITY' || opp.category === 'ENTRY_LEVEL'
          ? 'INTERNSHIP_JOB'
          : 'CAREER_PATHWAY',
      organizationLabel: opp.employerName,
      isSampleData: opp.isSampleData,
      version: '2026.1-SAMPLE',
      rubricVersion: 'RUBRIC_V1',
      summary: opp.overview,
      fieldId: opp.fieldId,
      sourceUrl: opp.sourceUrl,
      applicationUrl: opp.sourceUrl,
      applicationDeadline: opp.applicationDeadline,
      relevantRiasecDomains: opp.relevantRiasecDomains,
      verification: {
        organizerIdentityStatus: 'NOT_VERIFIED',
        opportunitySourceStatus: opp.sourceUrl ? 'NOT_VERIFIED' : 'UNAVAILABLE',
        requirementsExtractedStatus: 'VERIFIED',
        capabilitiesMappedStatus: 'VERIFIED',
        applicationLinkStatus: opp.sourceUrl ? 'NOT_VERIFIED' : 'UNAVAILABLE',
        deadlineStatus: isExpired ? 'EXPIRED' : opp.applicationDeadline ? 'NOT_VERIFIED' : 'UNAVAILABLE',
        lastVerifiedAt: opp.lastVerificationDate,
        overallStatus: isExpired ? 'EXPIRED' : 'NOT_VERIFIED',
        statusExplanation:
          'SAMPLE DATA DEMONSTRATION LISTING: Required capabilities are mapped to the canonical 10-dimension rubric for readiness benchmarking; external employer vacancy is simulated.',
      },
      mandatoryConditions: opp.mandatoryConditions,
      requirements: opp.requiredCapabilities,
    };
  }

  getSavedOpportunities(): SavedMarketOpportunityRecord[] {
    return this.savedRecords;
  }

  saveOrUpdateOpportunityTracking(
    opportunityId: string,
    status: SavedApplicationStatus,
    personalNotes?: string,
    applicationDate?: string | null,
    reminderDeadline?: string | null
  ): SavedMarketOpportunityRecord[] {
    const now = new Date().toISOString();
    const existingIdx = this.savedRecords.findIndex((r) => r.opportunityId === opportunityId);
    const opp = this.getOpportunityById(opportunityId);

    if (existingIdx >= 0) {
      const current = this.savedRecords[existingIdx];
      const updated: SavedMarketOpportunityRecord = {
        ...current,
        applicationStatus: status,
        personalNotes: personalNotes !== undefined ? personalNotes : current.personalNotes,
        applicationDate: applicationDate !== undefined ? applicationDate : current.applicationDate,
        reminderDeadline:
          reminderDeadline !== undefined ? reminderDeadline : current.reminderDeadline,
        updatedAt: now,
      };
      this.savedRecords = [
        ...this.savedRecords.slice(0, existingIdx),
        updated,
        ...this.savedRecords.slice(existingIdx + 1),
      ];
    } else {
      const created: SavedMarketOpportunityRecord = {
        opportunityId,
        savedAt: now,
        applicationStatus: status,
        personalNotes: personalNotes || '',
        applicationDate: applicationDate || null,
        reminderDeadline: reminderDeadline ?? opp?.applicationDeadline ?? null,
        updatedAt: now,
      };
      this.savedRecords = [created, ...this.savedRecords];
    }
    writeStorageJson(STORAGE_KEYS.SAVED_OPPORTUNITIES, this.savedRecords);
    return this.savedRecords;
  }

  removeSavedOpportunity(opportunityId: string): SavedMarketOpportunityRecord[] {
    this.savedRecords = this.savedRecords.filter((r) => r.opportunityId !== opportunityId);
    writeStorageJson(STORAGE_KEYS.SAVED_OPPORTUNITIES, this.savedRecords);
    return this.savedRecords;
  }
}

// =============================================================================
// 2. SKILL INTELLIGENCE SERVICE
// =============================================================================

export interface ISkillIntelligenceService {
  getAllSkillTrends(): SkillTrendRecord[];
  filterSkillTrends(params: {
    fieldId?: string;
    specialization?: string;
    trendClassification?: SkillTrendClassification | 'ALL';
    sectionType?: string;
    searchQuery?: string;
  }): SkillTrendRecord[];
  getSkillTrendById(id: string): SkillTrendRecord | undefined;
  getCandidateProposals(): SkillLibraryCandidateProposal[];
  submitCandidateProposal(proposal: {
    proposedSkillName: string;
    fieldId: string;
    specialization: string;
    mappedCapabilityId: CapabilityDimensionRecord['dimensionId'];
    candidateClassification: SkillCandidateClassification;
    targetExistingSkillId: string | null;
    proposedDescription: string;
    rationale: string;
    trendClassification: SkillTrendClassification;
  }): SkillLibraryCandidateProposal;
  reviewCandidateProposal(
    proposalId: string,
    decision: CandidateReviewStatus,
    editedDescription: string,
    reviewerNotes: string,
    actorRole: Role
  ): SkillLibraryCandidateProposal[];
}

class MockSkillIntelligenceServiceAdapter implements ISkillIntelligenceService {
  private trends: SkillTrendRecord[] = [...INITIAL_SKILL_TREND_RECORDS];
  private proposals: SkillLibraryCandidateProposal[] = readStorageJson(
    STORAGE_KEYS.CANDIDATE_PROPOSALS,
    INITIAL_SKILL_CANDIDATE_PROPOSALS
  );

  getAllSkillTrends(): SkillTrendRecord[] {
    return this.trends;
  }

  filterSkillTrends(params: {
    fieldId?: string;
    specialization?: string;
    trendClassification?: SkillTrendClassification | 'ALL';
    sectionType?: string;
    searchQuery?: string;
  }): SkillTrendRecord[] {
    return this.trends.filter((t) => {
      if (params.fieldId && params.fieldId !== 'ALL' && t.fieldId !== params.fieldId) {
        return false;
      }
      if (
        params.specialization &&
        params.specialization !== 'ALL' &&
        t.specialization !== params.specialization
      ) {
        return false;
      }
      if (
        params.trendClassification &&
        params.trendClassification !== 'ALL' &&
        t.trendClassification !== params.trendClassification
      ) {
        return false;
      }
      if (
        params.sectionType &&
        params.sectionType !== 'ALL' &&
        t.sectionType !== params.sectionType
      ) {
        return false;
      }
      if (params.searchQuery && params.searchQuery.trim()) {
        const q = params.searchQuery.trim().toLowerCase();
        const matches =
          t.skillName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.industryRelevance.toLowerCase().includes(q) ||
          t.relatedJobRoles.some((r) => r.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }

  getSkillTrendById(id: string): SkillTrendRecord | undefined {
    return this.trends.find((t) => t.id === id);
  }

  getCandidateProposals(): SkillLibraryCandidateProposal[] {
    return this.proposals;
  }

  submitCandidateProposal(proposal: {
    proposedSkillName: string;
    fieldId: string;
    specialization: string;
    mappedCapabilityId: CapabilityDimensionRecord['dimensionId'];
    candidateClassification: SkillCandidateClassification;
    targetExistingSkillId: string | null;
    proposedDescription: string;
    rationale: string;
    trendClassification: SkillTrendClassification;
  }): SkillLibraryCandidateProposal {
    const newProposal: SkillLibraryCandidateProposal = {
      id: `CAND_PROP_${Date.now()}`,
      proposedSkillName: proposal.proposedSkillName.trim(),
      fieldId: proposal.fieldId,
      specialization: proposal.specialization.trim() || 'General',
      mappedCapabilityId: proposal.mappedCapabilityId,
      candidateClassification: proposal.candidateClassification,
      targetExistingSkillId: proposal.targetExistingSkillId,
      proposedDescription: proposal.proposedDescription.trim(),
      rationale: proposal.rationale.trim(),
      trendClassification: proposal.trendClassification,
      supportingSources: [
        {
          id: `SRC_USER_${Date.now()}`,
          title: 'User-Submitted Skill Candidate Proposal (Awaiting Curator Verification)',
          publisherOrBody: 'WAYFINDER Proposed-Update Queue',
          publicationDate: new Date().toISOString().slice(0, 10),
          sourceType: 'SAMPLE_BENCHMARK',
          url: null,
          isSampleCitation: true,
        },
      ],
      evidenceStrength: 'PRELIMINARY_OBSERVATION',
      confidenceLevel: 'MODERATE_CONFIDENCE',
      reviewStatus: 'PENDING_REVIEW',
      reviewerNotes:
        'Submitted via proposed-update workflow. Not automatically published to the official Skill Library.',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedByRole: null,
      isSampleData: true,
    };
    this.proposals = [newProposal, ...this.proposals];
    writeStorageJson(STORAGE_KEYS.CANDIDATE_PROPOSALS, this.proposals);
    return newProposal;
  }

  reviewCandidateProposal(
    proposalId: string,
    decision: CandidateReviewStatus,
    editedDescription: string,
    reviewerNotes: string,
    actorRole: Role
  ): SkillLibraryCandidateProposal[] {
    this.proposals = this.proposals.map((p) => {
      if (p.id !== proposalId) return p;
      return {
        ...p,
        proposedDescription: editedDescription.trim() || p.proposedDescription,
        reviewStatus: decision,
        reviewerNotes: reviewerNotes.trim() || p.reviewerNotes,
        reviewedAt: new Date().toISOString(),
        reviewedByRole: actorRole,
      };
    });
    writeStorageJson(STORAGE_KEYS.CANDIDATE_PROPOSALS, this.proposals);
    return this.proposals;
  }
}

// =============================================================================
// 3. RESUME SERVICE
// =============================================================================

export interface IResumeService {
  getResumeVersions(): ResumeVersionRecord[];
  createEmptyResumeVersion(versionName?: string): ResumeVersionRecord;
  saveResumeVersion(record: ResumeVersionRecord): ResumeVersionRecord[];
  deleteResumeVersion(versionId: string): ResumeVersionRecord[];
  deriveSkillProvenanceFromWayfinder(
    skill: SkillCatalogueEntry,
    capabilityRecords: CapabilityDimensionRecord[],
    studentSkillRecords: StudentSkillProficiencyRecord[],
    evidenceSubmissions: EvidenceSubmission[]
  ): { provenance: ResumeSkillProvenance; level: CapabilityDimensionRecord['demonstratedLevel'] };
  evaluateResumeCompleteness(resume: ResumeVersionRecord): ResumeCompletenessReport;
  compareResumeWithOpportunity(
    resume: ResumeVersionRecord,
    opportunity: JobMarketOpportunity,
    skillsCatalogue: SkillCatalogueEntry[],
    capabilityRecords: CapabilityDimensionRecord[]
  ): ResumeOpportunityTailoringReport;
  generatePrintableResumeHtml(resume: ResumeVersionRecord): string;
}

function createInitialBlankResume(versionName = 'Primary Resume Draft v1'): ResumeVersionRecord {
  return {
    id: `RES_VER_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    versionName,
    templateId: 'ATS_FRIENDLY',
    tailoredOpportunityId: null,
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      professionalProfileUrl: '',
      portfolioUrl: '',
      githubUrl: '',
    },
    professionalSummary: '',
    education: [],
    skills: [],
    experience: [],
    projects: [],
    certifications: [],
    updatedAt: new Date().toISOString(),
  };
}

class MockResumeServiceAdapter implements IResumeService {
  private versions: ResumeVersionRecord[] = readStorageJson(STORAGE_KEYS.RESUME_VERSIONS, [
    createInitialBlankResume('Primary Resume Draft v1'),
  ]);

  getResumeVersions(): ResumeVersionRecord[] {
    if (this.versions.length === 0) {
      this.versions = [createInitialBlankResume('Primary Resume Draft v1')];
    }
    return this.versions;
  }

  createEmptyResumeVersion(versionName = 'New Resume Version'): ResumeVersionRecord {
    const created = createInitialBlankResume(versionName);
    this.versions = [created, ...this.versions];
    writeStorageJson(STORAGE_KEYS.RESUME_VERSIONS, this.versions);
    return created;
  }

  saveResumeVersion(record: ResumeVersionRecord): ResumeVersionRecord[] {
    const updatedRecord: ResumeVersionRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    const exists = this.versions.some((v) => v.id === record.id);
    this.versions = exists
      ? this.versions.map((v) => (v.id === record.id ? updatedRecord : v))
      : [updatedRecord, ...this.versions];
    writeStorageJson(STORAGE_KEYS.RESUME_VERSIONS, this.versions);
    return this.versions;
  }

  deleteResumeVersion(versionId: string): ResumeVersionRecord[] {
    this.versions = this.versions.filter((v) => v.id !== versionId);
    if (this.versions.length === 0) {
      this.versions = [createInitialBlankResume('Primary Resume Draft v1')];
    }
    writeStorageJson(STORAGE_KEYS.RESUME_VERSIONS, this.versions);
    return this.versions;
  }

  deriveSkillProvenanceFromWayfinder(
    skill: SkillCatalogueEntry,
    capabilityRecords: CapabilityDimensionRecord[],
    studentSkillRecords: StudentSkillProficiencyRecord[],
    evidenceSubmissions: EvidenceSubmission[]
  ): { provenance: ResumeSkillProvenance; level: CapabilityDimensionRecord['demonstratedLevel'] } {
    const skillRec = studentSkillRecords.find((r) => r.skillId === skill.id);
    const capRec = capabilityRecords.find((c) => c.dimensionId === skill.mappedCapabilityId);
    const hasAcceptedEvidence = evidenceSubmissions.some(
      (ev) =>
        ev.status === 'ACCEPTED' &&
        (ev.linkedSkillId === skill.id || ev.linkedDimensionId === skill.mappedCapabilityId)
    );

    if (
      hasAcceptedEvidence ||
      (capRec?.verifiedEvidenceLevel !== null && capRec?.verifiedEvidenceLevel !== undefined)
    ) {
      return {
        provenance: 'VERIFIED_CAPABILITY',
        level: skillRec?.demonstratedLevel ?? capRec?.verifiedEvidenceLevel ?? capRec?.demonstratedLevel ?? 2,
      };
    }

    if (skillRec?.assessedLevel !== null && skillRec?.assessedLevel !== undefined) {
      return {
        provenance: 'ASSESSED',
        level: skillRec.assessedLevel,
      };
    }

    if (capRec?.objectiveScoreLevel !== null && capRec?.objectiveScoreLevel !== undefined) {
      return {
        provenance: 'DEMONSTRATED',
        level: capRec.demonstratedLevel,
      };
    }

    return {
      provenance: 'SELF_REPORTED',
      level: skillRec?.selfReportedLevel ?? capRec?.selfReportedLevel ?? null,
    };
  }

  evaluateResumeCompleteness(resume: ResumeVersionRecord): ResumeCompletenessReport {
    const issues: ResumeCompletenessIssue[] = [];
    const totalChecks = 8;

    // 1. Missing contact details
    const missingContacts: string[] = [];
    if (!resume.personalInfo.fullName.trim()) missingContacts.push('Full Name');
    if (!resume.personalInfo.email.trim()) missingContacts.push('Email');
    if (!resume.personalInfo.phone.trim()) missingContacts.push('Phone');
    if (!resume.personalInfo.location.trim()) missingContacts.push('Location');
    if (missingContacts.length > 0) {
      issues.push({
        id: 'CHK_CONTACT',
        category: 'MISSING_CONTACT',
        severity: 'REQUIRED',
        sectionLabel: 'Step 1 — Personal Information',
        message: `Missing essential contact details: ${missingContacts.join(', ')}.`,
        remediationTip: 'Supply your name, email, phone number, and city/region in Step 1.',
      });
    }

    // 2. Missing education details
    if (resume.education.length === 0) {
      issues.push({
        id: 'CHK_EDU_EMPTY',
        category: 'MISSING_EDUCATION',
        severity: 'REQUIRED',
        sectionLabel: 'Step 3 — Education',
        message: 'No education entries have been added yet.',
        remediationTip: 'Add your institution, degree, specialisation, and expected graduation date.',
      });
    } else {
      const incompleteEdu = resume.education.some(
        (e) => !e.institution.trim() || !e.degree.trim()
      );
      if (incompleteEdu) {
        issues.push({
          id: 'CHK_EDU_FIELDS',
          category: 'MISSING_EDUCATION',
          severity: 'REQUIRED',
          sectionLabel: 'Step 3 — Education',
          message: 'One or more education entries are missing institution or degree names.',
          remediationTip: 'Complete all institution and degree fields in Step 3.',
        });
      }
    }

    // 3. Empty sections check
    const emptyCoreSections: string[] = [];
    if (!resume.professionalSummary.trim()) emptyCoreSections.push('Professional Summary');
    if (resume.skills.length === 0) emptyCoreSections.push('Skills');
    if (resume.experience.length === 0 && resume.projects.length === 0) {
      emptyCoreSections.push('Experience or Projects');
    }
    if (emptyCoreSections.length > 0) {
      issues.push({
        id: 'CHK_EMPTY_SECTIONS',
        category: 'EMPTY_SECTION',
        severity: 'REQUIRED',
        sectionLabel: 'Core Resume Sections',
        message: `The following key sections are currently empty: ${emptyCoreSections.join(', ')}.`,
        remediationTip:
          'Complete your summary, select skills from your WAYFINDER profile, and include at least one project or experience entry.',
      });
    }

    // 4. Missing dates
    const eduMissingDates = resume.education.some(
      (e) => !e.startDate.trim() || !e.endDateOrExpected.trim()
    );
    const expMissingDates = resume.experience.some(
      (x) => !x.startDate.trim() || !x.endDate.trim()
    );
    if (eduMissingDates || expMissingDates) {
      issues.push({
        id: 'CHK_MISSING_DATES',
        category: 'MISSING_DATES',
        severity: 'RECOMMENDATION',
        sectionLabel: 'Education & Experience Timelines',
        message: 'One or more education or experience entries are missing start or end dates.',
        remediationTip: 'Include clear start and end (or "Expected YYYY-MM") dates for ATS parsing.',
      });
    }

    // 5. Unclear descriptions
    const shortSummary =
      resume.professionalSummary.trim().length > 0 &&
      resume.professionalSummary.trim().length < 45;
    const shortProjectDesc = resume.projects.some(
      (p) => p.description.trim().length < 30
    );
    const shortExpDesc = resume.experience.some(
      (x) => x.responsibilities.trim().length < 30
    );
    if (shortSummary || shortProjectDesc || shortExpDesc) {
      issues.push({
        id: 'CHK_UNCLEAR_DESC',
        category: 'UNCLEAR_DESCRIPTION',
        severity: 'RECOMMENDATION',
        sectionLabel: 'Descriptions & Responsibilities',
        message:
          'Some summary, experience, or project descriptions are very brief (< 30–45 characters).',
        remediationTip:
          'Describe the concrete problem addressed, methods/tools used, and verifiable deliverable produced.',
      });
    }

    // 6. Potential formatting issues
    const hasAllCapsSummary =
      resume.professionalSummary.length > 20 &&
      resume.professionalSummary === resume.professionalSummary.toUpperCase();
    if (hasAllCapsSummary) {
      issues.push({
        id: 'CHK_FORMATTING',
        category: 'FORMATTING_ISSUE',
        severity: 'RECOMMENDATION',
        sectionLabel: 'Typography & ATS Formatting',
        message: 'Professional summary is written in ALL CAPS, which reduces readability.',
        remediationTip: 'Use standard sentence case and clean punctuation.',
      });
    }

    // 7. Unsupported claims check (Self-reported skills without project/experience backing)
    const selfReportedOnlyCount = resume.skills.filter(
      (s) => s.provenance === 'SELF_REPORTED'
    ).length;
    if (selfReportedOnlyCount > 0 && resume.projects.length === 0) {
      issues.push({
        id: 'CHK_UNSUPPORTED_CLAIMS',
        category: 'UNSUPPORTED_CLAIM',
        severity: 'RECOMMENDATION',
        sectionLabel: 'Step 4 & Step 6 — Claim vs Proof Alignment',
        message: `${selfReportedOnlyCount} skill(s) on this resume are currently Self-Reported only and no supporting projects are listed.`,
        remediationTip:
          'Take a WAYFINDER Skill Assessment or add a project with an artifact link to substantiate self-reported claims.',
      });
    }

    // 8. Missing links
    const hasProfileOrPortfolioLink =
      Boolean(resume.personalInfo.professionalProfileUrl.trim()) ||
      Boolean(resume.personalInfo.portfolioUrl.trim()) ||
      Boolean(resume.personalInfo.githubUrl.trim());
    const projectsMissingLinks = resume.projects.some(
      (p) => !p.projectUrl.trim() && !p.evidenceOrPortfolioLink.trim()
    );
    if (!hasProfileOrPortfolioLink || projectsMissingLinks) {
      issues.push({
        id: 'CHK_MISSING_LINKS',
        category: 'MISSING_LINKS',
        severity: 'RECOMMENDATION',
        sectionLabel: 'Profile & Evidence Links',
        message:
          'Missing professional profile/portfolio URL or project evidence link.',
        remediationTip:
          'Add your portfolio/LinkedIn URL in Step 1 and attach artifact/repository links to your projects in Step 6.',
      });
    }

    const passedChecks = Math.max(0, totalChecks - issues.length);
    return {
      totalChecks,
      passedChecks,
      issues,
    };
  }

  compareResumeWithOpportunity(
    resume: ResumeVersionRecord,
    opportunity: JobMarketOpportunity,
    skillsCatalogue: SkillCatalogueEntry[],
    capabilityRecords: CapabilityDimensionRecord[]
  ): ResumeOpportunityTailoringReport {
    const requiredSkillNames = opportunity.requiredSkillIds.map(
      (id) => skillsCatalogue.find((s) => s.id === id)?.name || id
    );
    const preferredSkillNames = opportunity.preferredSkillIds.map(
      (id) => skillsCatalogue.find((s) => s.id === id)?.name || id
    );

    const relevantExistingExperience = resume.experience
      .filter((exp) => {
        const text = `${exp.roleTitle} ${exp.responsibilities}`.toLowerCase();
        return (
          text.includes(opportunity.specialization.toLowerCase().split(' ')[0]) ||
          opportunity.requiredSkillIds.some((sid) => {
            const sName = skillsCatalogue.find((s) => s.id === sid)?.name.toLowerCase() || '';
            return sName.split(' ').some((w) => w.length > 3 && text.includes(w));
          })
        );
      })
      .map((e) => `${e.roleTitle} at ${e.organization}`);

    const relevantProjects = resume.projects
      .filter((proj) => {
        const text = `${proj.projectName} ${proj.description} ${proj.technologiesOrSkills.join(' ')}`.toLowerCase();
        return (
          text.includes(opportunity.specialization.toLowerCase().split(' ')[0]) ||
          opportunity.requiredSkillIds.some((sid) => {
            const sName = skillsCatalogue.find((s) => s.id === sid)?.name.toLowerCase() || '';
            return sName.split(' ').some((w) => w.length > 3 && text.includes(w));
          })
        );
      })
      .map((p) => p.projectName);

    const relevantDemonstratedOrAssessedSkills = resume.skills
      .filter(
        (s) =>
          (opportunity.requiredSkillIds.includes(s.skillId) ||
            opportunity.preferredSkillIds.includes(s.skillId)) &&
          s.provenance !== 'SELF_REPORTED'
      )
      .map((s) => `${s.skillName} (${s.provenance.replace(/_/g, ' ')})`);

    const missingInformationInResume: string[] = [];
    if (!resume.personalInfo.fullName.trim() || !resume.personalInfo.email.trim()) {
      missingInformationInResume.push('Complete contact details in Step 1');
    }
    if (resume.education.length === 0) {
      missingInformationInResume.push(
        `Education entry confirming eligibility (${opportunity.educationEligibility})`
      );
    }
    if (relevantProjects.length === 0) {
      missingInformationInResume.push(
        `Project entry demonstrating ${opportunity.specialization} deliverables`
      );
    }

    // Accurate keywords that describe ONLY capabilities the student has actually demonstrated or assessed
    const accurateCapabilityKeywords: string[] = [];
    for (const cap of capabilityRecords) {
      if (cap.demonstratedLevel !== null && cap.demonstratedLevel >= 1) {
        accurateCapabilityKeywords.push(
          `${getCapabilityDimensionName(cap.dimensionId)} (Demonstrated Level ${cap.demonstratedLevel})`
        );
      }
    }
    for (const sk of resume.skills) {
      if (sk.provenance !== 'SELF_REPORTED') {
        accurateCapabilityKeywords.push(sk.skillName);
      }
    }

    const areasNeedingFurtherDevelopment: string[] = [];
    for (const req of opportunity.requiredCapabilities) {
      const studentCap = capabilityRecords.find((c) => c.dimensionId === req.dimensionId);
      const demLevel = studentCap?.demonstratedLevel ?? null;
      if (demLevel === null) {
        areasNeedingFurtherDevelopment.push(
          `${getCapabilityDimensionName(req.dimensionId)}: Not yet assessed in WAYFINDER (Required Level ${req.requiredLevel})`
        );
      } else if (demLevel < req.requiredLevel) {
        areasNeedingFurtherDevelopment.push(
          `${getCapabilityDimensionName(req.dimensionId)}: Demonstrated Level ${demLevel} vs Required Level ${req.requiredLevel}`
        );
      }
    }
    for (const reqSkillName of [...requiredSkillNames, ...preferredSkillNames]) {
      const inResume = resume.skills.some(
        (s) => s.skillName.toLowerCase() === reqSkillName.toLowerCase()
      );
      if (!inResume) {
        areasNeedingFurtherDevelopment.push(
          `Skill "${reqSkillName}" is requested by this opportunity but not yet in your resume skill list.`
        );
      }
    }

    return {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      employerName: opportunity.employerName,
      relevantExistingExperience,
      relevantProjects,
      relevantDemonstratedOrAssessedSkills,
      missingInformationInResume,
      accurateCapabilityKeywords: Array.from(new Set(accurateCapabilityKeywords)),
      areasNeedingFurtherDevelopment,
      ethicalTailoringNotice:
        'ETHICAL TAILORING RULE: WAYFINDER never inserts a skill into your resume merely because a job description requests it. You must review and explicitly approve every modification.',
    };
  }

  generatePrintableResumeHtml(resume: ResumeVersionRecord): string {
    const esc = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const contactParts = [
      resume.personalInfo.email,
      resume.personalInfo.phone,
      resume.personalInfo.location,
      resume.personalInfo.professionalProfileUrl,
      resume.personalInfo.portfolioUrl,
      resume.personalInfo.githubUrl,
    ]
      .map((x) => x.trim())
      .filter(Boolean)
      .map(esc);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(resume.personalInfo.fullName || resume.versionName)} — WAYFINDER Resume</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #0B2E56; line-height: 1.5; max-width: 800px; margin: 32px auto; padding: 0 24px; }
    h1 { font-size: 24px; margin: 0 0 4px 0; color: #0B2E56; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #075FC7; border-bottom: 1.5px solid #8DBDFF; padding-bottom: 4px; margin-top: 20px; margin-bottom: 8px; }
    .contact { font-size: 12px; color: #123B63; margin-bottom: 16px; }
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; }
    .entry-sub { font-size: 12px; color: #315A7D; margin-bottom: 4px; }
    p, li { font-size: 12.5px; color: #123B63; margin: 4px 0; }
    .skill-chip { display: inline-block; font-size: 11px; padding: 2px 8px; margin: 2px 4px 2px 0; border: 1px solid #8DBDFF; border-radius: 4px; background: #F4FAFF; }
  </style>
</head>
<body>
  <h1>${esc(resume.personalInfo.fullName || 'Student Name Not Yet Supplied')}</h1>
  <div class="contact">${contactParts.join(' • ') || 'Contact information not yet supplied'}</div>

  ${
    resume.professionalSummary.trim()
      ? `<h2>Professional Summary</h2><p>${esc(resume.professionalSummary)}</p>`
      : ''
  }

  ${
    resume.education.length > 0
      ? `<h2>Education</h2>` +
        resume.education
          .map(
            (e) => `<div class="entry">
              <div class="entry-header"><span>${esc(e.degree)} — ${esc(e.specialization)}</span><span>${esc(e.startDate)} – ${esc(e.endDateOrExpected)}</span></div>
              <div class="entry-sub">${esc(e.institution)}</div>
              ${e.academicAchievements.trim() ? `<p>${esc(e.academicAchievements)}</p>` : ''}
            </div>`
          )
          .join('')
      : ''
  }

  ${
    resume.skills.length > 0
      ? `<h2>Skills &amp; Provenance Attribution (CLAIM ≠ CAPABILITY ≠ PROOF)</h2><div>` +
        resume.skills
          .map(
            (s) =>
              `<span class="skill-chip"><strong>${esc(s.skillName)}</strong> [${esc(
                s.provenance.replace(/_/g, ' ')
              )}${s.rubricLevel !== null ? ` • L${s.rubricLevel}` : ''}]</span>`
          )
          .join('') +
        `</div>`
      : ''
  }

  ${
    resume.experience.length > 0
      ? `<h2>Experience</h2>` +
        resume.experience
          .map(
            (x) => `<div class="entry">
              <div class="entry-header"><span>${esc(x.roleTitle)} — ${esc(x.organization)}</span><span>${esc(x.startDate)} – ${esc(x.endDate)}</span></div>
              <div class="entry-sub">${esc(x.experienceType)} • ${esc(x.location)}</div>
              <p>${esc(x.responsibilities)}</p>
            </div>`
          )
          .join('')
      : ''
  }

  ${
    resume.projects.length > 0
      ? `<h2>Projects &amp; Verifiable Artifacts</h2>` +
        resume.projects
          .map(
            (p) => `<div class="entry">
              <div class="entry-header"><span>${esc(p.projectName)} (${esc(p.role)})</span><span>${esc(p.technologiesOrSkills.join(', '))}</span></div>
              <p>${esc(p.description)}</p>
              ${
                p.projectUrl || p.evidenceOrPortfolioLink
                  ? `<div class="entry-sub">Links: ${esc(p.projectUrl)} ${esc(p.evidenceOrPortfolioLink)}</div>`
                  : ''
              }
            </div>`
          )
          .join('')
      : ''
  }

  ${
    resume.certifications.length > 0
      ? `<h2>Certifications &amp; Achievements</h2>` +
        resume.certifications
          .map(
            (c) => `<div class="entry">
              <div class="entry-header"><span>${esc(c.title)} (${esc(c.category)})</span><span>${esc(c.dateIssued)}</span></div>
              <div class="entry-sub">${esc(c.issuerOrVenue)} ${c.credentialUrl ? `• ${esc(c.credentialUrl)}` : ''}</div>
            </div>`
          )
          .join('')
      : ''
  }
</body>
</html>`;
  }
}

// =============================================================================
// 4. PROFESSIONAL PROFILE SERVICE (MANUAL LINKEDIN PROFILE SUPPORT)
// =============================================================================

export interface IProfessionalProfileService {
  getLinkedInProfile(): ManualLinkedInProfile;
  saveLinkedInProfile(profile: ManualLinkedInProfile): ManualLinkedInProfile;
  importFromResumeVersion(resume: ResumeVersionRecord): ManualLinkedInProfile;
  evaluateProfileCompleteness(
    profile: ManualLinkedInProfile,
    skillsCatalogue: SkillCatalogueEntry[],
    studentSkillRecords: StudentSkillProficiencyRecord[],
    portfolioRecords: StudentPortfolioRecord[]
  ): LinkedInCompletenessReport;
  compareWithWayfinderProfile(
    profile: ManualLinkedInProfile,
    skillsCatalogue: SkillCatalogueEntry[],
    studentSkillRecords: StudentSkillProficiencyRecord[],
    capabilityRecords: CapabilityDimensionRecord[],
    portfolioRecords: StudentPortfolioRecord[],
    evidenceSubmissions: EvidenceSubmission[]
  ): LinkedInWayfinderDiscrepancy[];
}

const INITIAL_EMPTY_LINKEDIN_PROFILE: ManualLinkedInProfile = {
  profileUrl: '',
  headline: '',
  aboutSection: '',
  educationSummary: '',
  experienceSummary: '',
  listedSkillNames: [],
  certificationsSummary: '',
  projectsSummary: '',
  portfolioLinks: [],
  provenance: 'USER_PROVIDED',
  lastUpdatedAt: null,
};

class MockProfessionalProfileServiceAdapter implements IProfessionalProfileService {
  private profile: ManualLinkedInProfile = readStorageJson(
    STORAGE_KEYS.LINKEDIN_PROFILE,
    INITIAL_EMPTY_LINKEDIN_PROFILE
  );

  getLinkedInProfile(): ManualLinkedInProfile {
    return this.profile;
  }

  saveLinkedInProfile(profile: ManualLinkedInProfile): ManualLinkedInProfile {
    this.profile = {
      ...profile,
      lastUpdatedAt: new Date().toISOString(),
    };
    writeStorageJson(STORAGE_KEYS.LINKEDIN_PROFILE, this.profile);
    return this.profile;
  }

  importFromResumeVersion(resume: ResumeVersionRecord): ManualLinkedInProfile {
    const imported: ManualLinkedInProfile = {
      profileUrl:
        resume.personalInfo.professionalProfileUrl.trim() || this.profile.profileUrl,
      headline:
        resume.education[0]
          ? `${resume.education[0].degree} (${resume.education[0].specialization}) Candidate`
          : this.profile.headline,
      aboutSection: resume.professionalSummary.trim() || this.profile.aboutSection,
      educationSummary:
        resume.education
          .map((e) => `${e.degree} in ${e.specialization}, ${e.institution} (${e.startDate}–${e.endDateOrExpected})`)
          .join('\n') || this.profile.educationSummary,
      experienceSummary:
        resume.experience
          .map((x) => `${x.roleTitle} at ${x.organization}: ${x.responsibilities}`)
          .join('\n') || this.profile.experienceSummary,
      listedSkillNames:
        resume.skills.length > 0
          ? resume.skills.map((s) => s.skillName)
          : this.profile.listedSkillNames,
      certificationsSummary:
        resume.certifications.map((c) => `${c.title} (${c.issuerOrVenue})`).join('\n') ||
        this.profile.certificationsSummary,
      projectsSummary:
        resume.projects.map((p) => `${p.projectName} (${p.role}): ${p.description}`).join('\n') ||
        this.profile.projectsSummary,
      portfolioLinks: [
        resume.personalInfo.portfolioUrl,
        resume.personalInfo.githubUrl,
        ...resume.projects.map((p) => p.evidenceOrPortfolioLink || p.projectUrl),
      ]
        .map((u) => u.trim())
        .filter(Boolean),
      provenance: 'IMPORTED_BY_USER',
      lastUpdatedAt: new Date().toISOString(),
    };
    this.profile = imported;
    writeStorageJson(STORAGE_KEYS.LINKEDIN_PROFILE, this.profile);
    return this.profile;
  }

  evaluateProfileCompleteness(
    profile: ManualLinkedInProfile,
    skillsCatalogue: SkillCatalogueEntry[],
    studentSkillRecords: StudentSkillProficiencyRecord[],
    portfolioRecords: StudentPortfolioRecord[]
  ): LinkedInCompletenessReport {
    const totalSectionsCount = 9;
    const missingInformation: string[] = [];
    const incompleteSections: string[] = [];

    if (!profile.profileUrl.trim()) missingInformation.push('LinkedIn Profile URL');
    if (!profile.headline.trim()) missingInformation.push('Professional Headline');
    if (!profile.aboutSection.trim()) missingInformation.push('About Section');
    if (!profile.educationSummary.trim()) missingInformation.push('Education Summary');
    if (!profile.experienceSummary.trim()) incompleteSections.push('Experience Section');
    if (profile.listedSkillNames.length === 0) missingInformation.push('Skills List');
    if (!profile.certificationsSummary.trim()) incompleteSections.push('Certifications Section');
    if (!profile.projectsSummary.trim()) incompleteSections.push('Projects Section');
    if (profile.portfolioLinks.length === 0) incompleteSections.push('External Portfolio / Evidence Links');

    const completedSectionsCount = Math.max(
      0,
      totalSectionsCount - missingInformation.length - incompleteSections.length
    );

    const lowerListed = new Set(profile.listedSkillNames.map((s) => s.toLowerCase()));
    const relevantWayfinderSkillsNotIncluded: string[] = [];
    for (const rec of studentSkillRecords) {
      if (rec.assessedLevel !== null || rec.demonstratedLevel !== null) {
        const sk = skillsCatalogue.find((s) => s.id === rec.skillId);
        if (sk && !lowerListed.has(sk.name.toLowerCase())) {
          relevantWayfinderSkillsNotIncluded.push(sk.name);
        }
      }
    }

    const wayfinderProjectsToPresent = portfolioRecords
      .filter((pr) => !profile.projectsSummary.toLowerCase().includes(pr.title.toLowerCase()))
      .map((pr) => `${pr.title} (${pr.recordType})`);

    const experienceImprovementSuggestions: string[] = [];
    if (profile.aboutSection.trim().length > 0 && profile.aboutSection.trim().length < 50) {
      experienceImprovementSuggestions.push(
        'Expand your About section to state your academic specialisation, assessed capabilities, and target career direction.'
      );
    }
    if (profile.experienceSummary.trim().length > 0 && profile.experienceSummary.trim().length < 60) {
      experienceImprovementSuggestions.push(
        'Include specific deliverables, tools used, and links to verified project outcomes in your Experience summary.'
      );
    }
    if (profile.portfolioLinks.length === 0) {
      experienceImprovementSuggestions.push(
        'Add links to your GitHub repositories or WAYFINDER Evidence Ledger artifacts so reviewers can inspect your proof.'
      );
    }

    return {
      completedSectionsCount,
      totalSectionsCount,
      missingInformation,
      incompleteSections,
      relevantWayfinderSkillsNotIncluded,
      wayfinderProjectsToPresent,
      experienceImprovementSuggestions,
    };
  }

  compareWithWayfinderProfile(
    profile: ManualLinkedInProfile,
    skillsCatalogue: SkillCatalogueEntry[],
    studentSkillRecords: StudentSkillProficiencyRecord[],
    capabilityRecords: CapabilityDimensionRecord[],
    portfolioRecords: StudentPortfolioRecord[],
    evidenceSubmissions: EvidenceSubmission[]
  ): LinkedInWayfinderDiscrepancy[] {
    const discrepancies: LinkedInWayfinderDiscrepancy[] = [];
    const lowerListed = profile.listedSkillNames.map((s) => s.toLowerCase().trim());

    // 1. Skill claimed on LinkedIn but not assessed in WAYFINDER
    for (const listedName of profile.listedSkillNames) {
      const matchedCatalogSkill = skillsCatalogue.find(
        (s) =>
          s.name.toLowerCase().includes(listedName.toLowerCase()) ||
          listedName.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
      );
      const studentRec = matchedCatalogSkill
        ? studentSkillRecords.find((r) => r.skillId === matchedCatalogSkill.id)
        : undefined;
      const capRec = matchedCatalogSkill
        ? capabilityRecords.find((c) => c.dimensionId === matchedCatalogSkill.mappedCapabilityId)
        : undefined;

      const isAssessed =
        (studentRec?.assessedLevel !== null && studentRec?.assessedLevel !== undefined) ||
        (capRec?.demonstratedLevel !== null && capRec?.demonstratedLevel !== undefined);

      if (!isAssessed) {
        discrepancies.push({
          id: `DISC_CLAIM_${listedName}`,
          discrepancyType: 'CLAIMED_ON_LINKEDIN_NOT_ASSESSED_IN_WAYFINDER',
          itemTitle: listedName,
          linkedInStateLabel: profile.provenance,
          wayfinderStateLabel: 'UNASSESSED_IN_WAYFINDER',
          explanation: `"${listedName}" is listed on your manual LinkedIn profile (${profile.provenance}), but has not yet been assessed or verified in WAYFINDER.`,
          recommendedAction:
            'Take the corresponding Skill Assessment or submit work evidence in WAYFINDER to turn this claim into demonstrated capability.',
        });
      }
    }

    // 2. Skill assessed in WAYFINDER but not mentioned in the profile
    for (const rec of studentSkillRecords) {
      if (rec.assessedLevel !== null || rec.demonstratedLevel !== null) {
        const sk = skillsCatalogue.find((s) => s.id === rec.skillId);
        if (sk) {
          const isMentioned = lowerListed.some(
            (l) => sk.name.toLowerCase().includes(l) || l.includes(sk.name.toLowerCase().split(' ')[0])
          );
          if (!isMentioned) {
            discrepancies.push({
              id: `DISC_ASSESSED_${sk.id}`,
              discrepancyType: 'ASSESSED_IN_WAYFINDER_MISSING_FROM_PROFILE',
              itemTitle: sk.name,
              linkedInStateLabel: 'NOT_LISTED_ON_PROFILE',
              wayfinderStateLabel: 'ASSESSED_BY_WAYFINDER',
              explanation: `You achieved Level ${rec.demonstratedLevel ?? rec.assessedLevel} in "${sk.name}" in WAYFINDER, but it is not listed in your LinkedIn skills section.`,
              recommendedAction: 'Add this assessed skill to your LinkedIn Skills section.',
            });
          }
        }
      }
    }

    // 3. Project recorded in WAYFINDER but missing from the profile
    for (const proj of portfolioRecords) {
      if (!profile.projectsSummary.toLowerCase().includes(proj.title.toLowerCase())) {
        discrepancies.push({
          id: `DISC_PROJ_${proj.id}`,
          discrepancyType: 'PROJECT_IN_WAYFINDER_MISSING_FROM_PROFILE',
          itemTitle: proj.title,
          linkedInStateLabel: 'NOT_LISTED_ON_PROFILE',
          wayfinderStateLabel:
            proj.verificationState === 'EVIDENCE_SUBMITTED' ? 'EVIDENCE_SUBMITTED' : 'USER_PROVIDED',
          explanation: `Project/record "${proj.title}" is recorded in your WAYFINDER Capability Passport but is not mentioned in your LinkedIn Projects summary.`,
          recommendedAction: 'Include this project in your LinkedIn Featured or Projects section.',
        });
      }
    }

    // 4. Evidence available in WAYFINDER but not linked externally
    for (const ev of evidenceSubmissions) {
      const linkedUrl = ev.url?.trim();
      if (linkedUrl && !profile.portfolioLinks.some((l) => l.trim() === linkedUrl)) {
        discrepancies.push({
          id: `DISC_EVID_${ev.id}`,
          discrepancyType: 'EVIDENCE_IN_WAYFINDER_NOT_LINKED_EXTERNALLY',
          itemTitle: ev.title,
          linkedInStateLabel: 'NOT_LISTED_ON_PROFILE',
          wayfinderStateLabel: ev.status === 'ACCEPTED' ? 'VERIFIED' : 'EVIDENCE_SUBMITTED',
          explanation: `Evidence submission "${ev.title}" (${ev.status}) has artifact link ${linkedUrl} in WAYFINDER, which is not yet listed in your LinkedIn portfolio links.`,
          recommendedAction: 'Add the artifact link to your LinkedIn profile so external reviewers can inspect your proof.',
        });
      }
    }

    return discrepancies;
  }
}

// =============================================================================
// 5. STUDENT UPDATES SERVICE
// =============================================================================

export interface IStudentUpdatesService {
  getAllUpdates(): MarketAndSkillUpdateItem[];
  getPreferences(): StudentUpdatePreferences;
  toggleFollowField(fieldId: string): StudentUpdatePreferences;
  toggleFollowSpecialization(spec: string): StudentUpdatePreferences;
  toggleFollowSkill(skillId: string): StudentUpdatePreferences;
  toggleSaveTrend(trendId: string): StudentUpdatePreferences;
  toggleSaveUpdate(updateId: string): StudentUpdatePreferences;
  toggleReadUpdate(updateId: string): StudentUpdatePreferences;
  toggleCategoryPreference(category: UpdateCategory): StudentUpdatePreferences;
}

const DEFAULT_UPDATE_PREFERENCES: StudentUpdatePreferences = {
  followedFieldIds: ['FIELD_CS_SW', 'FIELD_PSYCH_BEHAV', 'FIELD_COMMERCE_FIN'],
  followedSpecializations: [
    'Database Systems & SQL',
    'Research Methods & Psychometrics',
    'Financial Analysis & Valuation',
    'Professional & Career Communication',
  ],
  followedSkillIds: ['SKL_CS_SQL', 'SKL_CAREER_RESUME_BUILDING'],
  savedTrendIds: [],
  savedUpdateIds: [],
  readUpdateIds: [],
  enabledCategories: [
    'JOB_UPDATE',
    'INTERNSHIP_UPDATE',
    'EMERGING_SKILL_UPDATE',
    'INDUSTRY_CHANGE',
    'LEARNING_OPPORTUNITY',
    'APPLICATION_DEADLINE',
    'PROFESSIONAL_DEVELOPMENT',
  ],
};

class MockStudentUpdatesServiceAdapter implements IStudentUpdatesService {
  private updates: MarketAndSkillUpdateItem[] = [...INITIAL_STUDENT_MARKET_UPDATES];
  private prefs: StudentUpdatePreferences = readStorageJson(
    STORAGE_KEYS.UPDATE_PREFS,
    DEFAULT_UPDATE_PREFERENCES
  );

  getAllUpdates(): MarketAndSkillUpdateItem[] {
    return this.updates;
  }

  getPreferences(): StudentUpdatePreferences {
    return this.prefs;
  }

  private updateToggleList(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  toggleFollowField(fieldId: string): StudentUpdatePreferences {
    this.prefs = {
      ...this.prefs,
      followedFieldIds: this.updateToggleList(this.prefs.followedFieldIds, fieldId),
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }

  toggleFollowSpecialization(spec: string): StudentUpdatePreferences {
    this.prefs = {
      ...this.prefs,
      followedSpecializations: this.updateToggleList(this.prefs.followedSpecializations, spec),
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }

  toggleFollowSkill(skillId: string): StudentUpdatePreferences {
    this.prefs = {
      ...this.prefs,
      followedSkillIds: this.updateToggleList(this.prefs.followedSkillIds, skillId),
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }

  toggleSaveTrend(trendId: string): StudentUpdatePreferences {
    this.prefs = {
      ...this.prefs,
      savedTrendIds: this.updateToggleList(this.prefs.savedTrendIds, trendId),
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }

  toggleSaveUpdate(updateId: string): StudentUpdatePreferences {
    this.prefs = {
      ...this.prefs,
      savedUpdateIds: this.updateToggleList(this.prefs.savedUpdateIds, updateId),
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }

  toggleReadUpdate(updateId: string): StudentUpdatePreferences {
    this.prefs = {
      ...this.prefs,
      readUpdateIds: this.updateToggleList(this.prefs.readUpdateIds, updateId),
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }

  toggleCategoryPreference(category: UpdateCategory): StudentUpdatePreferences {
    const exists = this.prefs.enabledCategories.includes(category);
    this.prefs = {
      ...this.prefs,
      enabledCategories: exists
        ? this.prefs.enabledCategories.filter((c) => c !== category)
        : [...this.prefs.enabledCategories, category],
    };
    writeStorageJson(STORAGE_KEYS.UPDATE_PREFS, this.prefs);
    return this.prefs;
  }
}

// =============================================================================
// 6. ADMIN RESEARCH SERVICE
// =============================================================================

export interface IAdminResearchService {
  getMarketResearchMetrics(
    fields: FieldCategory[],
    opportunities: JobMarketOpportunity[],
    trends: SkillTrendRecord[]
  ): AdminMarketResearchMetrics;
  getExecutionHistory(): AdminResearchExecutionRecord[];
  getResearchConfig(): AdminResearchConfiguration;
  updateResearchConfig(partial: Partial<AdminResearchConfiguration>): AdminResearchConfiguration;
}

class MockAdminResearchServiceAdapter implements IAdminResearchService {
  private executionHistory: AdminResearchExecutionRecord[] = [...INITIAL_ADMIN_EXECUTION_HISTORY];
  private config: AdminResearchConfiguration = readStorageJson(
    STORAGE_KEYS.ADMIN_CONFIG,
    INITIAL_ADMIN_RESEARCH_CONFIG
  );

  getMarketResearchMetrics(
    fields: FieldCategory[],
    opportunities: JobMarketOpportunity[],
    trends: SkillTrendRecord[]
  ): AdminMarketResearchMetrics {
    const verifiedOpportunities = opportunities.filter(
      (o) => o.listingStatus === 'VERIFIED_ACTIVE' || o.listingStatus === 'EXPIRING_SOON'
    ).length;
    const pendingValidation = opportunities.filter(
      (o) => o.listingStatus === 'VALIDATION_PENDING' || o.listingStatus === 'DISCOVERED'
    ).length;
    const expiredListings = opportunities.filter(
      (o) => o.listingStatus === 'EXPIRED' || o.listingStatus === 'CLOSED'
    ).length;

    const fieldDistribution = fields.map((f) => ({
      fieldId: f.id,
      fieldName: f.shortName,
      opportunityCount: opportunities.filter((o) => o.fieldId === f.id).length,
      skillTrendCount: trends.filter((t) => t.fieldId === f.id).length,
    }));

    return {
      totalDiscoveredOpportunities: opportunities.length,
      verifiedOpportunities,
      pendingValidation,
      expiredListings,
      totalResearchRecords: opportunities.length + trends.length,
      sourceDistribution: [
        { sourceType: 'WAYFINDER Structured Demonstration Feeds (Sample)', count: 5 },
        { sourceType: 'Academic Fellowship & Research Sample Registry', count: 2 },
        { sourceType: 'Historical Archive Sample Records', count: 1 },
      ],
      fieldDistribution,
      isDemonstrationMetrics: true,
    };
  }

  getExecutionHistory(): AdminResearchExecutionRecord[] {
    return this.executionHistory;
  }

  getResearchConfig(): AdminResearchConfiguration {
    return this.config;
  }

  updateResearchConfig(partial: Partial<AdminResearchConfiguration>): AdminResearchConfiguration {
    this.config = {
      ...this.config,
      ...partial,
      backendConnectionStatus: 'NOT_YET_CONNECTED',
    };
    writeStorageJson(STORAGE_KEYS.ADMIN_CONFIG, this.config);
    return this.config;
  }
}

// =============================================================================
// SINGLETON SERVICE INSTANCES (Exported for components & automated tests)
// =============================================================================

export const JobMarketService: IJobMarketService = new MockJobMarketServiceAdapter();
export const SkillIntelligenceService: ISkillIntelligenceService =
  new MockSkillIntelligenceServiceAdapter();
export const ResumeService: IResumeService = new MockResumeServiceAdapter();
export const ProfessionalProfileService: IProfessionalProfileService =
  new MockProfessionalProfileServiceAdapter();
export const StudentUpdatesService: IStudentUpdatesService =
  new MockStudentUpdatesServiceAdapter();
export const AdminResearchService: IAdminResearchService =
  new MockAdminResearchServiceAdapter();
