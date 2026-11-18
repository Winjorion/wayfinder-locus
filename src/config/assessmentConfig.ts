/**
 * WAYFINDER — Assessment, Readiness, Conflict Register & Decision Configuration
 * Complete Product Build | SIH26044 | Team LOCUS
 *
 * Preserves the documented Conflict Register (CONF-01 through CONF-10) and
 * Unresolved Owner Decisions (DEC-01 through DEC-10) as configurable parameters.
 * Provisional settings are never silently converted into approved policies.
 */

import { RiasecDomain } from '../types';

export interface SpecConflictRecord {
  id: string;
  title: string;
  sourcesInConflict: string;
  description: string;
  configurableResolutionKey: string;
  activeSettingSummary: string;
}

export interface UnresolvedSpecDecision {
  id: string;
  area:
    | 'Competency Rubric Scale'
    | 'Aptitude Item Bank'
    | 'RIASEC Tie-Breaking'
    | 'Evidence Malware Scanning'
    | 'Eligibility Verification'
    | 'Upload Constraints'
    | 'Reassessment Cooldown'
    | 'Self-Assessment UNTRIED State'
    | 'Cohort Suppression Policy'
    | 'Share Token Retention';
  title: string;
  conflictDescription: string;
  currentConfigurableDefault: string;
  ownerActionRequired: string;
}

export const ASSESSMENT_CONFIG = {
  // RIASEC Configuration (Documented 48-item bank: 8 items per domain)
  riasec: {
    totalItems: 48,
    itemsPerDomain: 8,
    scaleMin: 1,
    scaleMax: 5,
    domainRawMin: 8,
    domainRawMax: 40,
    // Alphabetical domain order for tie-breaking per WF-DOC-08 v2.0 & Master Directive Sec. 7
    alphabeticalDomainOrder: ['A', 'C', 'E', 'I', 'R', 'S'] as RiasecDomain[],
    canonicalDomainOrder: ['R', 'I', 'A', 'S', 'E', 'C'] as RiasecDomain[],
    tieBreakingPolicy: 'alphabetical' as 'alphabetical' | 'canonical_riasec',
    requireAllItemsForOfficialProfile: true
  },

  // Aptitude & Target Knowledge Configuration
  aptitude: {
    defaultSpatialEnabled: false,
    featureFlagKey: 'FEATURE_ENABLE_SPATIAL_APTITUDE',
    namespaces: {
      quantitative: 'APT-NUM',
      logical: 'APT-LOG',
      systems: 'APT-SYS',
      domain_knowledge: 'TGT-DOM',
      spatial: 'APT-SPA'
    },
    bandThresholdsPct: {
      advanced: 85,
      proficient: 70,
      intermediate: 40
    },
    answerKeySecurityNotice:
      'PROVISIONAL DEV MODE: Answer keys are evaluated in local memory when offline and via trusted server functions when connected. Privileged answer keys must never be exposed in public database policies.'
  },

  // Competency Rubric Scale Configuration (10 Canonical Dimensions)
  rubric: {
    activeVersion: '2026.1-PROVISIONAL',
    canonicalDimensionCount: 10,
    scaleMode: '5-level-1-to-5' as '5-level-1-to-5' | '4-level-1-to-4',
    preserveUntriedAsNull: true,
    allowCrossVersionGapCalculation: false,
    unassessedIsUnknownNotZero: true
  },

  // Evidence Upload & Six-Dimension Review Configuration
  evidence: {
    maxFileSizeMb: 25,
    handoffAltMaxFileSizeMb: 10,
    allowedMimeTypes: [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/json',
      'text/plain',
      'text/markdown',
      'image/png',
      'image/jpeg'
    ],
    allowUrlEvidence: true,
    reviewDimensions: [
      { id: 'relevance', label: 'Relevance', description: 'Alignment with target competency and level descriptors.' },
      { id: 'authenticityAndAttribution', label: 'Authenticity & Attribution', description: 'Verifiable authorship and provenance of the submitted work.' },
      { id: 'sufficiency', label: 'Sufficiency', description: 'Scope and depth of evidence relative to observable behaviors.' },
      { id: 'quality', label: 'Quality', description: 'Technical rigor, correctness, and execution quality.' },
      { id: 'currency', label: 'Currency', description: 'Recency and alignment with current rubric/technology version.' },
      { id: 'context', label: 'Context', description: 'Clarity of problem statement, constraints, and operational environment.' }
    ] as const
  },

  // Reassessment & Snapshot Policy
  reassessment: {
    cooldownHours: 24,
    enforceCooldownInDev: false, // Configurable so testers can test both cooldown-blocked and immediate reassessment
    preserveImmutableHistory: true
  },

  // Institutional Privacy Configuration
  privacy: {
    minimumCohortSizeForAggregation: 5,
    defaultShareExpiryDays: 14,
    maxShareExpiryDays: 60
  }
};

export const CONFLICT_REGISTER: SpecConflictRecord[] = [
  {
    id: 'CONF-01',
    title: 'Competency Rubric Level Cardinality (4-Level vs. 5-Level)',
    sourcesInConflict: 'PRD v1.1 (4-stage progression) vs. WF-ENG-SPEC-1.0 & WF-DOC-08 v2.0 (5-level rubric 1..5)',
    description: 'Early product narrative mentions a 4-stage proficiency ladder, whereas the engineering specification and scoring schema define a 5-level (1..5) rubric.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.rubric.scaleMode',
    activeSettingSummary: '5-level (1..5) active under version 2026.1-PROVISIONAL; cross-version gap calculation blocked.'
  },
  {
    id: 'CONF-02',
    title: 'RIASEC Tie-Breaking Order (Alphabetical vs. Canonical Holland Order)',
    sourcesInConflict: 'WF-DOC-08 v2.0 (Alphabetical A-C-E-I-R-S) vs. Handoff Notes (Canonical R-I-A-S-E-C)',
    description: 'When two or more RIASEC domains share identical raw sums (8..40), documents differ on whether ties resolve alphabetically or in Holland R-I-A-S-E-C sequence.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.riasec.tieBreakingPolicy',
    activeSettingSummary: 'Defaulting to Alphabetical (A-C-E-I-R-S) per Master Directive Sec. 7 while flagging all ties explicitly in UI.'
  },
  {
    id: 'CONF-03',
    title: 'Maximum Evidence File Upload Size (10 MB vs. 25 MB)',
    sourcesInConflict: 'Coding Agent Handoff (10 MB limit) vs. WF-ENG-SPEC-1.0 (25 MB limit)',
    description: 'Upload size limits differ between the handoff summary and the storage specification.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.evidence.maxFileSizeMb',
    activeSettingSummary: 'Configured to 25 MB (25,000 KB) with 10 MB alternative documented in config.'
  },
  {
    id: 'CONF-04',
    title: 'Allowed Evidence MIME Types & URL Evidence Support',
    sourcesInConflict: 'TRD v1.1 (PDF/ZIP/Link) vs. UI Blueprint (PDF/ZIP/JSON/MD/Images/URL)',
    description: 'Specification sections list slightly different subsets of acceptable artifact formats and external repository URLs.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.evidence.allowedMimeTypes',
    activeSettingSummary: 'Supports PDF, ZIP, JSON, Markdown, Plaintext, PNG/JPEG, and validated HTTPS URLs.'
  },
  {
    id: 'CONF-05',
    title: 'Spatial Reasoning Domain Activation Default',
    sourcesInConflict: 'Assessment Questionnaire v1.0 (Includes APT-SPA items) vs. Accessibility Directive (Disabled until non-visual set approved)',
    description: 'Spatial items exist in the v1.0 item bank but require accessible non-visual alternatives before mandatory activation.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.aptitude.defaultSpatialEnabled',
    activeSettingSummary: 'Disabled by default (FEATURE_ENABLE_SPATIAL_APTITUDE = false); spatial score preserved as null/Unknown.'
  },
  {
    id: 'CONF-06',
    title: 'Self-Assessment UNTRIED Response Representation',
    sourcesInConflict: 'UI Mockup (1..5 selector) vs. WF-DOC-08 v2.0 (UNTRIED preserved as null/unknown)',
    description: 'Whether a user who has never attempted a skill selects Level 1 or an explicit UNTRIED option.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.rubric.preserveUntriedAsNull',
    activeSettingSummary: 'Explicit UNTRIED option supported and stored as null/undefined (never converted to 0 or Level 1).'
  },
  {
    id: 'CONF-07',
    title: 'Reassessment Cooldown Window Duration',
    sourcesInConflict: 'PRD v1.1 (7-day reassessment cooldown) vs. Handoff Testing Flow (24-hour / configurable cooldown)',
    description: 'Cooldown interval between consecutive formal assessment attempts varies across operational and testing specs.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.reassessment.cooldownHours',
    activeSettingSummary: 'Configured to 24 hours with a toggleable enforcement gate for interactive testing.'
  },
  {
    id: 'CONF-08',
    title: 'Evidence Retention & Revoked Share Token Audit Window',
    sourcesInConflict: 'Privacy Spec (Immediate deletion on request) vs. Audit Spec (Append-only review ledger)',
    description: 'Balancing GDPR/DPDP right-to-erasure of uploaded files with immutable audit trails of reviewer decisions.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.reassessment.preserveImmutableHistory',
    activeSettingSummary: 'Storage objects can be purged while append-only audit metadata retains anonymized state transitions.'
  },
  {
    id: 'CONF-09',
    title: 'Custom Target Creation Authority (Student vs. Institution/Admin)',
    sourcesInConflict: 'Application Flow (Students can create custom targets) vs. RBAC Matrix (Institution/Admin curated catalog)',
    description: 'Whether students can author custom target profiles for personal benchmarking vs. only selecting catalog targets.',
    configurableResolutionKey: 'CustomTargetCreationPolicy',
    activeSettingSummary: 'Students can create personal custom targets tagged [Custom User Target] without altering the global catalog.'
  },
  {
    id: 'CONF-10',
    title: 'Institution Suppression Boundary Behaviour at N < 5',
    sourcesInConflict: 'UI Spec (Hide distribution bars only) vs. Security Spec (Suppress all cohort breakdowns & pathway counts at k < 5)',
    description: 'Extent of fields suppressed when cohort membership is below k = 5.',
    configurableResolutionKey: 'ASSESSMENT_CONFIG.privacy.minimumCohortSizeForAggregation',
    activeSettingSummary: 'Strict suppression enforced at k < 5 across both server query functions and UI rendering.'
  }
];

export const UNRESOLVED_SPEC_DECISIONS: UnresolvedSpecDecision[] = [
  {
    id: 'DEC-01',
    area: 'Competency Rubric Scale',
    title: 'Competency Rubric Scale Granularity (4-Level vs 5-Level)',
    conflictDescription:
      'Source specification references both a 4-stage proficiency progression and a 5-level (1–5) competency rubric across different sections.',
    currentConfigurableDefault:
      'Configured to 5-level scale (Levels 1–5) under version tag "2026.1-PROVISIONAL". Numeric gap engine enforces strict rubric version compatibility before computing gaps.',
    ownerActionRequired:
      'Confirm canonical rubric scale cardinality (1–4 vs 1–5) and lock production rubric version identifier.'
  },
  {
    id: 'DEC-02',
    area: 'Aptitude Item Bank',
    title: 'Psychometric Calibration & Server-Side Answer Key Isolation',
    conflictDescription:
      'Current build uses the documented diagnostic item namespaces (APT-NUM, APT-LOG, APT-SYS, TGT-DOM, APT-SPA) with provisional items.',
    currentConfigurableDefault:
      'Spatial domain is behind a runtime feature flag (default OFF). Unanswered domains remain Unknown (null) rather than 0%.',
    ownerActionRequired:
      'Supply psychometrically calibrated production item bank and keep answer keys isolated in Supabase/Netlify server environment.'
  },
  {
    id: 'DEC-03',
    area: 'RIASEC Tie-Breaking',
    title: 'Holland 3-Letter Code Tie-Breaking Protocol',
    conflictDescription:
      'When two or more RIASEC domains share identical raw sums (range 8–40), a deterministic rule is required to construct the 3-letter code.',
    currentConfigurableDefault:
      'Uses alphabetical tie-breaking (A-C-E-I-R-S) per WF-DOC-08 v2.0, while explicitly flagging all ties and displaying tied domain groups.',
    ownerActionRequired:
      'Confirm whether tied Holland codes should display hyphenated multi-letter groups alongside the alphabetical 3-letter code.'
  },
  {
    id: 'DEC-04',
    area: 'Evidence Malware Scanning',
    title: 'Asynchronous Antivirus / Malware Scanning Pipeline',
    conflictDescription:
      'Automated file checks (MIME, size, malware scan) must remain distinct from human review. Client-side code cannot perform real malware scanning.',
    currentConfigurableDefault:
      'Client performs real MIME and byte-size checks and computes a real Web Crypto SHA-256 digest when an actual file is selected, while explicitly marking Malware Scan as "NOT_CONFIGURED (Unscanned)".',
    ownerActionRequired:
      'Provision server-side ClamAV / cloud storage malware scanning webhook on the private Supabase Storage bucket.'
  },
  {
    id: 'DEC-05',
    area: 'Eligibility Verification',
    title: 'Mandatory Prerequisite & Eligibility Verification Authority',
    conflictDescription:
      'Mandatory non-competency conditions (e.g. work authorization, accredited STEM enrollment) require an authoritative verification workflow separate from platform onboarding consent.',
    currentConfigurableDefault:
      'Onboarding consent is strictly decoupled from opportunity eligibility. Unverified eligibility conditions remain "UNKNOWN_INSUFFICIENT_INFO" or "MANDATORY_CONDITION_NOT_MET".',
    ownerActionRequired:
      'Define whether eligibility documents are verified by institutional registrars, assigned reviewers, or third-party integrations.'
  },
  {
    id: 'DEC-06',
    area: 'Upload Constraints',
    title: 'Maximum Evidence File Size & Allowed Artifact Formats',
    conflictDescription:
      'Handoff specifies 10 MB while WF-ENG-SPEC-1.0 specifies 25 MB; URL evidence validation rules require domain allowlist policy.',
    currentConfigurableDefault:
      'Enforces configurable 25 MB limit and supports both binary file hashing and HTTPS URL evidence submissions.',
    ownerActionRequired:
      'Lock production file size cap (10 MB vs 25 MB) and approved external repository domains.'
  },
  {
    id: 'DEC-07',
    area: 'Reassessment Cooldown',
    title: 'Formal Assessment Retake Cooldown Interval',
    conflictDescription:
      'PRD references a 7-day cooldown whereas rapid skill sprints require a 24-hour cooldown.',
    currentConfigurableDefault:
      'Configured to 24 hours in ASSESSMENT_CONFIG with an interactive cooldown toggle for testing.',
    ownerActionRequired:
      'Approve production cooldown duration per assessment type (RIASEC vs. Aptitude vs. Rubric).'
  },
  {
    id: 'DEC-08',
    area: 'Self-Assessment UNTRIED State',
    title: 'Handling of Explicit UNTRIED Skill Self-Assessments',
    conflictDescription:
      'Users encountering an unfamiliar competency need an explicit UNTRIED state rather than being forced to pick Level 1.',
    currentConfigurableDefault:
      'Supports explicit UNTRIED selection which stores claimedLevel = null and evaluates to UNKNOWN_INSUFFICIENT_INFO.',
    ownerActionRequired:
      'Confirm whether UNTRIED should trigger foundational learning recommendations automatically.'
  },
  {
    id: 'DEC-09',
    area: 'Cohort Suppression Policy',
    title: 'Small-Cohort Suppression Threshold (k = 5) Across Drill-Downs',
    conflictDescription:
      'Ensuring small cohorts cannot be reconstructed via difference queries or export filters.',
    currentConfigurableDefault:
      'Suppresses all distribution metrics and pathway breakdowns whenever studentCount < 5 in both server functions and UI.',
    ownerActionRequired:
      'Confirm whether complementary suppression is required when multiple cohorts are compared.'
  },
  {
    id: 'DEC-10',
    area: 'Share Token Retention',
    title: 'Maximum Expiry Window & Audit Retention for Scoped Share Links',
    conflictDescription:
      'Determining the maximum lifetime of student-generated share tokens before mandatory renewal.',
    currentConfigurableDefault:
      'Supports 7, 14, 30, and 60-day expiry windows with immediate one-click revocation and access audit logging.',
    ownerActionRequired:
      'Confirm maximum permitted token lifetime for institutional placement cycles.'
  }
];
