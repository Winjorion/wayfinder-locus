/**
 * WAYFINDER — Automated Verification Suite (Unit, Registration/Auth, Security & E2E Invariants)
 * Complete Product Build | SIH26044 | Team LOCUS
 * Executes against the active production modules with strictly isolated test fixtures.
 */

import assert from 'node:assert/strict';
import { RIASEC_ITEMS } from '../data/riasecBank';
import { APTITUDE_PUBLIC_ITEMS, getActiveAptitudeItems } from '../data/aptitudeBank';
import { CANONICAL_CAPABILITY_DIMENSIONS } from '../data/capabilityDimensions';
import {
  CONFLICT_REGISTER,
  OWNER_DECISIONS,
} from '../data/conflictAndDecisionRegister';
import {
  scoreRiasecInventory,
  scoreAptitudeAttemptServerSide,
  calculateNumericGap,
  computeTargetReadinessReport,
  evaluateInstitutionCohortSuppression,
  resolveOpportunityVerification,
  evaluateOpportunityInterestRelevance,
  buildGapDevelopmentActivity,
  scoreSkillAssessmentAttemptServerSide,
  recommendLearningForOpportunityGaps,
} from '../engine/readinessEngine';
import {
  INITIAL_FIELD_CATEGORIES,
  INITIAL_SKILL_CATALOGUE,
} from '../data/fieldAndSkillLibrary';
import {
  INITIAL_SKILL_ASSESSMENTS,
  ASSESSMENT_TYPE_CAPABILITY_MATRIX,
  validateSkillAssessmentResponses,
} from '../data/skillAssessmentBank';
import { INITIAL_LEARNING_RESOURCES } from '../data/learningHubCatalogue';
import {
  createCleanInitialState,
  SCREEN_TO_HASH,
  resolveScreenFromHash,
} from '../context/WayfinderContext';
import {
  PRIMARY_NAV_GROUPS,
  ACCOUNT_AND_PORTAL_LINKS,
} from '../components/common/Header';
import {
  validateRegistrationForm,
  signUpWithSupabase,
  signInWithSupabase,
  isSupabaseEnvConfigured,
  SUPABASE_RLS_SCHEMA_SQL,
} from '../services/supabaseBoundary';
import {
  computeTrustedGapServerSide,
  enforceCohortSuppressionServerSide,
  scoreSkillAssessmentServerSideEndpoint,
} from '../../netlify/functions/wayfinder-api';
import {
  OpportunityTarget,
  CapabilityDimensionRecord,
  EvidenceSubmission,
  InstitutionCohortRecord,
} from '../types/wayfinder';
import {
  JobMarketService,
  SkillIntelligenceService,
  ResumeService,
  ProfessionalProfileService,
  StudentUpdatesService,
  AdminResearchService,
} from '../services/careerIntelligenceServices';
import { RESUME_BUILDING_SUBSKILLS } from '../data/marketSkillsMockData';

let passed = 0;

async function runTests() {
  function runTest(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      console.log(`  ✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      throw err;
    }
  }

  async function runAsyncTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      throw err;
    }
  }

  console.log('===================================================================');
  console.log('WAYFINDER — AUTOMATED TEST SUITE (CLEAN STATE, AUTH, ENGINE & RULES)');
  console.log('===================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. ZERO DEMO DATA IN PRODUCTION INITIAL STATE
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Zero Demo Data & Clean Initial State Verification ---');

  runTest('1.1 Clean initial application state contains zero demo users, zero targets, zero evidence, zero cohorts, and all 10 capabilities unassessed (null)', () => {
    const cleanState = createCleanInitialState();
    assert.equal(cleanState.currentUser, null, 'Initial user must be null (unauthenticated)');
    assert.equal(cleanState.activeRole, 'ANONYMOUS', 'Initial role must be ANONYMOUS');
    assert.equal(cleanState.riasecResult, null, 'Initial RIASEC result must be null');
    assert.equal(cleanState.aptitudeAttempts.length, 0, 'Initial aptitude attempts must be empty');
    assert.equal(cleanState.targets.length, 0, 'Initial targets must be empty (no demo opportunities)');
    assert.equal(cleanState.selectedTargetId, '', 'Initial selectedTargetId must be empty');
    assert.equal(cleanState.activities.length, 0, 'Initial learning activities must be empty');
    assert.equal(cleanState.evidenceSubmissions.length, 0, 'Initial evidence submissions must be empty');
    assert.equal(cleanState.snapshots.length, 0, 'Initial snapshots must be empty');
    assert.equal(cleanState.sharingAuthorisations.length, 0, 'Initial sharing authorisations must be empty');
    assert.equal(cleanState.institutionCohorts.length, 0, 'Initial institution cohorts must be empty');
    assert.equal(cleanState.auditEvents.length, 0, 'Initial audit events must be empty');
    assert.equal(cleanState.capabilityRecords.length, 10, 'Must initialize all 10 canonical capability dimensions');
    for (const rec of cleanState.capabilityRecords) {
      assert.equal(rec.selfReportedLevel, null, `Capability ${rec.dimensionId} selfReportedLevel must be null`);
      assert.equal(rec.demonstratedLevel, null, `Capability ${rec.dimensionId} demonstratedLevel must be null (Unknown != 0)`);
      assert.equal(rec.evidenceSource, 'UNASSESSED');
    }
  });

  // ---------------------------------------------------------------------------
  // 2. REGISTRATION & AUTHENTICATION BOUNDARY VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Sign-Up Validation & Honest Auth Boundary ---');

  runTest('2.1 Registration validator rejects missing fields, invalid email, weak password, mismatched confirmation, and unchecked terms', () => {
    const emptyValidation = validateRegistrationForm({
      fullName: '',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'different',
      acceptedTerms: false,
    });
    assert.equal(emptyValidation.valid, false);
    assert.ok(emptyValidation.fieldErrors.fullName, 'Expected fullName validation error');
    assert.ok(emptyValidation.fieldErrors.email, 'Expected email validation error');
    assert.ok(emptyValidation.fieldErrors.password, 'Expected password validation error');
    assert.ok(emptyValidation.fieldErrors.confirmPassword, 'Expected confirmPassword validation error');
    assert.ok(emptyValidation.fieldErrors.acceptedTerms, 'Expected acceptedTerms validation error');
  });

  runTest('2.2 Registration validator accepts valid full name, email, strong matching password, and accepted terms', () => {
    const validForm = validateRegistrationForm({
      fullName: 'Test Candidate',
      email: 'candidate@example.org',
      password: 'StrongPassword9',
      confirmPassword: 'StrongPassword9',
      acceptedTerms: true,
    });
    assert.equal(validForm.valid, true);
    assert.equal(Object.keys(validForm.fieldErrors).length, 0);
  });

  await runAsyncTest('2.3 When Supabase is not configured, signUpWithSupabase and signInWithSupabase truthfully report UNCONFIGURED and never fabricate sessions', async () => {
    if (!isSupabaseEnvConfigured()) {
      const signUpRes = await signUpWithSupabase({
        fullName: 'Test Candidate',
        email: 'candidate@example.org',
        password: 'StrongPassword9',
      });
      assert.equal(signUpRes.ok, false);
      assert.equal(signUpRes.status, 'UNCONFIGURED');
      assert.equal(signUpRes.user, undefined, 'Must never fabricate user session when unconfigured');

      const signInRes = await signInWithSupabase({
        email: 'candidate@example.org',
        password: 'StrongPassword9',
      });
      assert.equal(signInRes.ok, false);
      assert.equal(signInRes.status, 'UNCONFIGURED');
    }
  });

  // ---------------------------------------------------------------------------
  // 3. PSYCHOMETRIC ASSESSMENT & SCORING INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Psychometric Assessment & Scoring Integrity ---');

  runTest('3.1 RIASEC bank has 48 items (8 per domain), applies ((sum - 8) / 32) * 100, and enforces alphabetical tie-breaking (A-C-E-I-R-S)', () => {
    assert.equal(RIASEC_ITEMS.length, 48, 'Expected 48 RIASEC items');
    const fullNeutralResponses: Record<string, number> = {};
    for (const item of RIASEC_ITEMS) {
      fullNeutralResponses[item.id] = 3; // sum per domain = 24 -> ((24-8)/32)*100 = 50%
    }
    const profile = scoreRiasecInventory(fullNeutralResponses);
    assert.equal(profile.isComplete48, true);
    assert.equal(profile.normalizedPercentage.R, 50);
    assert.equal(profile.normalizedPercentage.I, 50);
    assert.equal(profile.topThreeCode, 'ACE');
    assert.equal(profile.tieBreakApplied, true);
  });

  runTest('3.2 RIASEC incomplete response set (< 48 items) flags isComplete48 = false and returns INCOMPLETE', () => {
    const partialResponses: Record<string, number> = {
      WF_RIA_R01: 5,
      WF_RIA_I01: 4,
    };
    const profile = scoreRiasecInventory(partialResponses);
    assert.equal(profile.isComplete48, false);
    assert.equal(profile.topThreeCode, 'INCOMPLETE');
  });

  runTest('3.3 Aptitude bank preserves item namespaces, keeps Spatial disabled by default, and scores domain attempts accurately', () => {
    const cleanFlags = createCleanInitialState().featureFlags;
    assert.equal(cleanFlags.enableSpatialReasoning, false);
    const activeDefault = getActiveAptitudeItems(false);
    assert.equal(activeDefault.some((i) => i.domain === 'SPATIAL'), false);
    assert.equal(APTITUDE_PUBLIC_ITEMS.some((i) => i.domain === 'SPATIAL'), true);

    const numericalItems = activeDefault.filter((i) => i.domain === 'NUMERICAL');
    const attempt = scoreAptitudeAttemptServerSide(numericalItems, {
      WF_APT_NUM_01: 'B',
      WF_APT_NUM_02: 'B',
      WF_APT_NUM_03: 'B',
    });
    assert.equal(attempt.percentage, 100);
    assert.equal(attempt.mappedRubricLevel, 3);
  });

  runTest('3.4 Canonical Capability Bank defines all 10 canonical dimensions and preserves CONF-01..10 & DEC-01..10', () => {
    assert.equal(CANONICAL_CAPABILITY_DIMENSIONS.length, 10);
    assert.equal(CONFLICT_REGISTER.length, 10);
    assert.equal(OWNER_DECISIONS.length, 10);
  });

  // ---------------------------------------------------------------------------
  // 4. READINESS GAP FORMULA & CANONICAL STATUSES (ISOLATED TEST FIXTURES)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Readiness Gap Formula & All 8 Canonical Statuses ---');

  runTest('4.1 Gap formula G_i = max(0, R_i - D_i) computes only when both levels are known and rubric versions match', () => {
    assert.equal(calculateNumericGap(3, 1, 'RUBRIC_V1', 'RUBRIC_V1'), 2);
    assert.equal(calculateNumericGap(2, 3, 'RUBRIC_V1', 'RUBRIC_V1'), 0);
    assert.equal(calculateNumericGap(3, null, 'RUBRIC_V1', 'RUBRIC_V1'), null, 'Unknown D_i must yield null gap');
    assert.equal(calculateNumericGap(3, 2, 'RUBRIC_V1', 'RUBRIC_V2'), null, 'Incompatible rubric must yield null gap');
  });

  runTest('4.2 Platform onboarding consent never automatically satisfies opportunity mandatory eligibility conditions, and distinguishes canonical statuses', () => {
    const testTargetFixture: OpportunityTarget = {
      id: 'TEST_FIXTURE_TARGET_01',
      title: 'Test Target Blueprint Fixture',
      category: 'COMPETITION',
      organizationLabel: 'Isolated Test Fixture Org',
      isSampleData: false,
      version: '1.0.0-TEST',
      rubricVersion: 'RUBRIC_V1',
      summary: 'Isolated test fixture for readiness engine verification.',
      mandatoryConditions: [
        {
          id: 'COND_ENROLLED',
          label: 'Enrolled Student Status Verified',
          conditionType: 'ENROLLED_STUDENT',
          isMet: false,
          verificationSource: 'UNVERIFIED',
        },
      ],
      requirements: [
        {
          id: 'REQ_PROG_L3',
          dimensionId: 'CAP_PROG_SW',
          requiredLevel: 3,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: true,
          rationale: 'Demonstrate L3 software engineering with accepted proof.',
        },
        {
          id: 'REQ_SYS_L2',
          dimensionId: 'CAP_SYS_DESIGN',
          requiredLevel: 2,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: false,
          evidenceRequired: false,
          rationale: 'Demonstrate L2 systems design.',
        },
        {
          id: 'REQ_COMM_L3',
          dimensionId: 'CAP_TECH_COMM',
          requiredLevel: 3,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: true,
          rationale: 'Demonstrate L3 technical communication.',
        },
      ],
    };

    // Unauthenticated/clean capabilities: all unknown
    const cleanCapabilities = createCleanInitialState().capabilityRecords;
    const unassessedReport = computeTargetReadinessReport(
      testTargetFixture,
      cleanCapabilities,
      [],
      null
    );

    assert.equal(unassessedReport.allMandatoryConditionsMet, false);
    assert.equal(unassessedReport.knownDemonstratedCount, 0);
    assert.equal(
      unassessedReport.counts.UNKNOWN_INSUFFICIENT_INFO,
      3,
      'All 3 unassessed requirements must be UNKNOWN_INSUFFICIENT_INFO'
    );

    // Now test DEMONSTRATED, PARTIALLY_DEMONSTRATED, and EVIDENCE_PENDING_REVIEW
    const fixtureCapabilities: CapabilityDimensionRecord[] = cleanCapabilities.map((c) => {
      if (c.dimensionId === 'CAP_PROG_SW') {
        return {
          ...c,
          selfReportedLevel: 3,
          demonstratedLevel: 3,
          verifiedEvidenceLevel: 3,
          evidenceSource: 'REVIEWED_EVIDENCE',
        };
      }
      if (c.dimensionId === 'CAP_SYS_DESIGN') {
        return {
          ...c,
          selfReportedLevel: 2,
          demonstratedLevel: 1, // Gap = 1 -> PARTIALLY_DEMONSTRATED
          objectiveScoreLevel: 1,
          evidenceSource: 'OBJECTIVE_ASSESSMENT',
        };
      }
      if (c.dimensionId === 'CAP_TECH_COMM') {
        return {
          ...c,
          selfReportedLevel: 3,
          demonstratedLevel: null, // Pending evidence -> EVIDENCE_PENDING_REVIEW
          evidenceSource: 'SELF_REPORT_ONLY',
        };
      }
      return c;
    });

    const fixtureEvidence: EvidenceSubmission[] = [
      {
        id: 'EV_ACCEPTED_01',
        studentId: 'USR_TEST_01',
        title: 'Verified Software Repo',
        description: 'Isolated test fixture',
        linkedDimensionId: 'CAP_PROG_SW',
        claimedRubricLevel: 3,
        evidenceType: 'URL',
        url: 'https://example.org/repo',
        status: 'ACCEPTED',
        technicalValidation: {
          sizeValid: true,
          mimeValid: true,
          malwareScanStatus: 'PASSED_PRODUCTION_SCAN',
          validationNotes: 'Verified in test fixture',
        },
        assignedReviewerId: 'REV_TEST_01',
        reviewDecision: {
          reviewId: 'REV_DEC_01',
          reviewerId: 'REV_TEST_01',
          reviewerName: 'Test Reviewer',
          reviewedAt: '2026-03-01T00:00:00Z',
          rubricVersion: 'RUBRIC_V1',
          decision: 'ACCEPTED',
          verifiedRubricLevel: 3,
          dimensions: {
            relevance: 3,
            authenticityAndAttribution: 3,
            sufficiency: 3,
            quality: 3,
            currency: 3,
            context: 3,
          },
          rationale: 'Accepted in test fixture',
        },
        submittedAt: '2026-03-01T00:00:00Z',
      },
      {
        id: 'EV_PENDING_02',
        studentId: 'USR_TEST_01',
        title: 'Pending Architecture Doc',
        description: 'Isolated test fixture',
        linkedDimensionId: 'CAP_TECH_COMM',
        claimedRubricLevel: 3,
        evidenceType: 'FILE',
        fileName: 'doc.pdf',
        fileSizeBytes: 2048,
        mimeType: 'application/pdf',
        status: 'UNDER_REVIEW',
        technicalValidation: {
          sizeValid: true,
          mimeValid: true,
          malwareScanStatus: 'NOT_CONFIGURED_IN_DEV',
          validationNotes: 'Pending review',
        },
        assignedReviewerId: 'REV_TEST_01',
        reviewDecision: null,
        submittedAt: '2026-03-01T00:00:00Z',
      },
    ];

    const populatedReport = computeTargetReadinessReport(
      testTargetFixture,
      fixtureCapabilities,
      fixtureEvidence,
      null
    );

    const byReqId = Object.fromEntries(
      populatedReport.requirementEvaluations.map((e) => [e.requirement.id, e])
    );
    assert.equal(byReqId['REQ_PROG_L3'].status, 'DEMONSTRATED');
    assert.equal(byReqId['REQ_SYS_L2'].status, 'PARTIALLY_DEMONSTRATED');
    assert.equal(byReqId['REQ_SYS_L2'].numericGap, 1);
    assert.equal(byReqId['REQ_COMM_L3'].status, 'EVIDENCE_PENDING_REVIEW');
    assert.equal(byReqId['REQ_COMM_L3'].numericGap, null);
  });

  // ---------------------------------------------------------------------------
  // 5. PRIVACY, COHORT SUPPRESSION (k = 5) & SERVER-SIDE VALIDATION
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: Privacy, Cohort Suppression (k = 5) & Server-Side Validation ---');

  runTest('5.1 Institution cohort suppression enforces k = 5 at N = 4 vs N >= 5', () => {
    const cleanFlags = createCleanInitialState().featureFlags;
    assert.equal(cleanFlags.institutionSuppressionThresholdK, 5);
    const smallCohortFixture: InstitutionCohortRecord = {
      cohortId: 'COH_FIXTURE_SMALL',
      cohortName: 'Small Test Cohort (N=4)',
      studentCount: 4,
      isSuppressed: false,
      aggregateMetrics: {
        avgDemonstratedCount: 3,
        avgGapCount: 2,
        evidenceMissingPercent: 20,
        unknownDimensionPercent: 10,
      },
    };
    const largeCohortFixture: InstitutionCohortRecord = {
      cohortId: 'COH_FIXTURE_LARGE',
      cohortName: 'Large Test Cohort (N=12)',
      studentCount: 12,
      isSuppressed: false,
      aggregateMetrics: {
        avgDemonstratedCount: 5,
        avgGapCount: 1,
        evidenceMissingPercent: 15,
        unknownDimensionPercent: 5,
      },
    };

    const evaluated = evaluateInstitutionCohortSuppression(
      [smallCohortFixture, largeCohortFixture],
      5
    );
    assert.equal(evaluated[0].isSuppressed, true);
    assert.equal(evaluated[0].aggregateMetrics, null, 'Suppressed cohort must null out aggregateMetrics');
    assert.equal(evaluated[1].isSuppressed, false);
    assert.ok(evaluated[1].aggregateMetrics);

    const serverSuppressed = enforceCohortSuppressionServerSide(smallCohortFixture, 5);
    const serverVisible = enforceCohortSuppressionServerSide(largeCohortFixture, 5);
    assert.equal(serverSuppressed.suppressed, true);
    assert.equal(serverVisible.suppressed, false);
  });

  runTest('5.2 Trusted server-side gap endpoint preserves null on unknown or rubric mismatch', () => {
    const validGap = computeTrustedGapServerSide({
      requiredLevel: 4,
      demonstratedLevel: 2,
      requirementRubricVersion: 'RUBRIC_V1',
      capabilityRubricVersion: 'RUBRIC_V1',
    });
    assert.equal(validGap.numericGap, 2);

    const mismatchGap = computeTrustedGapServerSide({
      requiredLevel: 4,
      demonstratedLevel: 2,
      requirementRubricVersion: 'RUBRIC_V2',
      capabilityRubricVersion: 'RUBRIC_V1',
    });
    assert.equal(mismatchGap.numericGap, null);
    assert.equal(mismatchGap.rubricCompatible, false);
  });

  // ---------------------------------------------------------------------------
  // 6. PRODUCTION NAVIGATION & ROUTE RESOLUTION VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 6: Production Navigation & Route Resolution ---');

  runTest('6.1 User-facing navigation groups and account/portal menus never expose internal Screen 22 (22_EDGE_STATES)', () => {
    for (const group of PRIMARY_NAV_GROUPS) {
      assert.notEqual(
        group.defaultScreen,
        '22_EDGE_STATES',
        `Primary nav group ${group.id} must not default to 22_EDGE_STATES`
      );
      assert.equal(
        group.matchScreens.includes('22_EDGE_STATES'),
        false,
        `Primary nav group ${group.id} must not include 22_EDGE_STATES`
      );
      if (group.subItems) {
        for (const sub of group.subItems) {
          assert.notEqual(
            sub.id,
            '22_EDGE_STATES',
            `Sub-navigation item ${sub.label} must not point to 22_EDGE_STATES`
          );
        }
      }
    }

    for (const link of ACCOUNT_AND_PORTAL_LINKS) {
      assert.notEqual(
        link.id,
        '22_EDGE_STATES',
        `Account/portal link ${link.label} must not point to 22_EDGE_STATES`
      );
    }
  });

  runTest('6.2 URL hash routing resolves all valid screens and safely falls back to 01_LANDING on empty or unknown hashes', () => {
    assert.equal(resolveScreenFromHash(''), '01_LANDING');
    assert.equal(resolveScreenFromHash('#'), '01_LANDING');
    assert.equal(resolveScreenFromHash('#unknown-nonexistent-route'), '01_LANDING');
    assert.equal(resolveScreenFromHash('#dashboard'), '05_STUDENT_DASHBOARD');
    assert.equal(resolveScreenFromHash('#/dashboard'), '05_STUDENT_DASHBOARD');
    assert.equal(resolveScreenFromHash('#assessments/riasec'), '07_RIASEC_ASSESSMENT');
    assert.equal(resolveScreenFromHash('#passport'), '11_CAPABILITY_PASSPORT');
    assert.equal(resolveScreenFromHash('#opportunities'), '12_OPPORTUNITY_DISCOVERY');
    assert.equal(resolveScreenFromHash('#readiness-gaps'), '14_READINESS_GAP_ANALYSIS');
    assert.equal(resolveScreenFromHash('#learning'), '15_LEARNING_CENTRE');
    assert.equal(resolveScreenFromHash('#evidence'), '17_EVIDENCE_LEDGER');
    assert.equal(resolveScreenFromHash('#market-intelligence'), '23_JOB_MARKET_INTELLIGENCE');
    assert.equal(resolveScreenFromHash('#skill-intelligence'), '24_SKILL_INTELLIGENCE');
    assert.equal(resolveScreenFromHash('#resume-builder'), '25_RESUME_BUILDER');
    assert.equal(resolveScreenFromHash('#linkedin-support'), '26_LINKEDIN_SUPPORT');
    assert.equal(resolveScreenFromHash('#market-updates'), '27_STUDENT_UPDATES');
    assert.equal(resolveScreenFromHash('#admin-intelligence'), '28_ADMIN_INTELLIGENCE');
    assert.equal(Object.keys(SCREEN_TO_HASH).length, 28);
  });

  // ---------------------------------------------------------------------------
  // 7. USP DIFFERENTIATION: VERIFICATION LAYER, INTEREST VS READINESS & GAP LOOP
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 7: Opportunity Verification Layer, Interest Separation & Gap Loop ---');

  runTest('7.1 Opportunity Verification Layer honestly reports NOT_VERIFIED / UNAVAILABLE / EXPIRED and never fabricates VERIFIED badges', () => {
    const unverifiedTarget: OpportunityTarget = {
      id: 'TGT_UNVERIFIED_01',
      title: 'Student-Entered Backend Engineering Role',
      category: 'INTERNSHIP_JOB',
      organizationLabel: 'External Organization',
      isSampleData: false,
      version: '1.0.0',
      rubricVersion: 'RUBRIC_V1',
      summary: 'User-entered blueprint without external verification.',
      sourceUrl: 'https://example.org/jobs/123',
      applicationUrl: '',
      applicationDeadline: '2020-01-01', // Past date -> EXPIRED
      mandatoryConditions: [],
      requirements: [],
    };

    const verif = resolveOpportunityVerification(unverifiedTarget);
    assert.equal(
      verif.opportunitySourceStatus,
      'NOT_VERIFIED',
      'User-provided URL without verification must be NOT_VERIFIED'
    );
    assert.equal(
      verif.organizerIdentityStatus,
      'NOT_VERIFIED',
      'Organizer must not be falsely marked VERIFIED'
    );
    assert.equal(
      verif.applicationLinkStatus,
      'UNAVAILABLE',
      'Empty application link must be UNAVAILABLE'
    );
    assert.equal(verif.deadlineStatus, 'EXPIRED', 'Past deadline must be flagged EXPIRED');
  });

  runTest('7.2 Interest-Based Relevance is strictly separated from actual Capability Readiness', () => {
    const cleanState = createCleanInitialState();
    assert.equal(cleanState.portfolioRecords.length, 0, 'Initial portfolioRecords must be empty');

    const neutralResponses: Record<string, number> = {};
    for (const item of RIASEC_ITEMS) {
      neutralResponses[item.id] = item.domain === 'I' || item.domain === 'R' ? 5 : 2;
    }
    const riasecProfile = scoreRiasecInventory(neutralResponses);

    const targetWithRiasec: OpportunityTarget = {
      id: 'TGT_INTEREST_VS_READINESS',
      title: 'Systems Research Fellowship',
      category: 'CAREER_PATHWAY',
      organizationLabel: 'Research Lab',
      isSampleData: false,
      version: '1.0.0',
      rubricVersion: 'RUBRIC_V1',
      summary: 'Requires L3 Data Analysis.',
      relevantRiasecDomains: ['I', 'R'],
      mandatoryConditions: [],
      requirements: [
        {
          id: 'REQ_DATA_L3',
          dimensionId: 'CAP_DATA_ANAL',
          requiredLevel: 3,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: true,
          rationale: 'Demonstrate L3 data analysis with accepted evidence.',
        },
      ],
    };

    const interestEval = evaluateOpportunityInterestRelevance(
      targetWithRiasec,
      riasecProfile,
      null
    );
    assert.equal(interestEval.hasCompletedRiasec, true);
    assert.ok(interestEval.matchingDomains.some((d) => d.code === 'I'));
    assert.ok(interestEval.separationPrincipleNote.includes('never substitutes'));

    // Even with strong RIASEC alignment, capability readiness must remain UNKNOWN_INSUFFICIENT_INFO
    const readinessReport = computeTargetReadinessReport(
      targetWithRiasec,
      cleanState.capabilityRecords,
      [],
      null
    );
    assert.equal(readinessReport.knownDemonstratedCount, 0);
    assert.equal(
      readinessReport.requirementEvaluations[0].status,
      'UNKNOWN_INSUFFICIENT_INFO',
      'Strong RIASEC interest alignment must never inflate capability readiness'
    );
  });

  runTest('7.3 Gap Development Plan builder creates requirement-linked activities with acceptable evidence guides and practical steps', () => {
    const targetFixture: OpportunityTarget = {
      id: 'TGT_GAP_BUILDER',
      title: 'Cloud Infrastructure Internship',
      category: 'PROJECT_CHALLENGE',
      organizationLabel: 'Infra Org',
      isSampleData: false,
      version: '1.0.0',
      rubricVersion: 'RUBRIC_V1',
      summary: 'Requires L3 Systems Design.',
      mandatoryConditions: [],
      requirements: [
        {
          id: 'REQ_SYS_L3',
          dimensionId: 'CAP_SYS_DESIGN',
          requiredLevel: 3,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: true,
          rationale: 'Demonstrate L3 architecture & systems design.',
        },
      ],
    };

    const cleanState = createCleanInitialState();
    const report = computeTargetReadinessReport(
      targetFixture,
      cleanState.capabilityRecords,
      [],
      null
    );
    const evaluation = report.requirementEvaluations[0];
    assert.ok(evaluation.acceptableEvidenceGuide.length > 0, 'Must provide acceptable evidence guide');
    assert.ok(evaluation.developmentActionSteps.length >= 3, 'Must provide concrete development steps');

    const activity = buildGapDevelopmentActivity(targetFixture, evaluation);
    assert.equal(activity.linkedDimensionId, 'CAP_SYS_DESIGN');
    assert.equal(activity.targetRubricLevel, 3);
    assert.equal(activity.linkedTargetId, 'TGT_GAP_BUILDER');
    assert.equal(activity.linkedRequirementId, 'REQ_SYS_L3');
    assert.equal(activity.status, 'NOT_STARTED');
    assert.equal(activity.progressPercent, 0);
  });

  // ---------------------------------------------------------------------------
  // 8. FIELD & SKILL LIBRARY + SKILL ASSESSMENT ENGINE + LEARNING HUB (PHASE 10)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 8: Field & Skill Library, Skill Assessment Engine & Learning Hub ---');

  runTest('8.1 Field and skill relationships: all 18 initial fields exist and all skills reference valid fields and capabilities', () => {
    assert.equal(
      INITIAL_FIELD_CATEGORIES.length,
      18,
      'Must contain all 18 required academic, technical, professional, creative, and trade fields'
    );
    const fieldIds = new Set(INITIAL_FIELD_CATEGORIES.map((f) => f.id));
    const capIds = new Set(CANONICAL_CAPABILITY_DIMENSIONS.map((d) => d.id));

    assert.ok(INITIAL_SKILL_CATALOGUE.length >= 10, 'Must contain cross-disciplinary skills');
    for (const skill of INITIAL_SKILL_CATALOGUE) {
      assert.ok(fieldIds.has(skill.fieldId), `Skill ${skill.id} must reference a valid fieldId`);
      assert.ok(
        capIds.has(skill.mappedCapabilityId),
        `Skill ${skill.id} must reference a valid canonical capability dimension`
      );
      assert.ok(skill.evidenceRequirements.length > 0, 'Must specify acceptable evidence requirements');
    }

    // Verify skills that require portfolio or practical demonstration rather than an automated quiz exist
    const nonQuizSkills = INITIAL_SKILL_CATALOGUE.filter((s) => !s.assessmentAvailable);
    assert.ok(
      nonQuizSkills.length >= 2,
      'Must include skills that honestly require portfolio review or practical demonstration instead of a quiz'
    );
  });

  runTest('8.2 Assessment question validation & support matrix: MC, MS, Numerical, Scenario, and Reviewer tasks', () => {
    assert.ok(ASSESSMENT_TYPE_CAPABILITY_MATRIX.length >= 8);
    const unsupportedSim = ASSESSMENT_TYPE_CAPABILITY_MATRIX.find(
      (m) => m.type === 'SIMULATION_DEMONSTRATION'
    );
    assert.equal(
      unsupportedSim?.supportState,
      'UNSUPPORTED_IN_CURRENT_RUNTIME',
      'Simulation/Lab hardware demonstrations must be honestly marked UNSUPPORTED_IN_CURRENT_RUNTIME'
    );

    const sqlAssessment = INITIAL_SKILL_ASSESSMENTS.find((a) => a.id === 'ASM_SKL_SQL_V1')!;
    const incompleteValidation = validateSkillAssessmentResponses(sqlAssessment, {
      SQL_Q1_JOIN: 'B',
    });
    assert.equal(incompleteValidation.valid, false, 'Incomplete responses must fail validation');
    assert.equal(incompleteValidation.missingItemIds.length, 3);
  });

  runTest('8.3 Skill Assessment scoring accuracy, incomplete handling (Unknown != 0), version tracking, and reviewer routing', () => {
    const sqlAssessment = INITIAL_SKILL_ASSESSMENTS.find((a) => a.id === 'ASM_SKL_SQL_V1')!;

    // 1. Incomplete attempt -> INCOMPLETE_VALIDATION_ERROR, scorePercentage = null, awardedRubricLevel = null
    const incompleteAttempt = scoreSkillAssessmentAttemptServerSide(
      sqlAssessment,
      { SQL_Q1_JOIN: 'B' },
      'USR_TEST_01'
    );
    assert.equal(incompleteAttempt.completionStatus, 'INCOMPLETE_VALIDATION_ERROR');
    assert.equal(incompleteAttempt.scorePercentage, null, 'Incomplete attempt must never score 0');
    assert.equal(incompleteAttempt.awardedRubricLevel, null);

    // 2. Full correct attempt on ASM_SKL_SQL_V1 (Scenario + MC + MS + Numerical)
    const perfectSqlAttempt = scoreSkillAssessmentAttemptServerSide(
      sqlAssessment,
      {
        SQL_Q1_JOIN: 'B',
        SQL_Q2_HAVING: 'B',
        SQL_Q3_INTEGRITY: ['A', 'B', 'D'],
        SQL_Q4_CARDINALITY: '4',
      },
      'USR_TEST_01'
    );
    assert.equal(perfectSqlAttempt.completionStatus, 'COMPLETED_SCORED');
    assert.equal(perfectSqlAttempt.assessmentVersion, '1.0.0');
    assert.equal(perfectSqlAttempt.correctCount, 4);
    assert.equal(perfectSqlAttempt.scorePercentage, 100);
    assert.equal(perfectSqlAttempt.awardedRubricLevel, 3);
    assert.ok(perfectSqlAttempt.demonstratedStrengths.length === 4);
    assert.ok(perfectSqlAttempt.recommendedResourceIds.length > 0);

    // 3. Server-side endpoint verification
    const endpointRes = scoreSkillAssessmentServerSideEndpoint({
      userId: 'USR_TEST_01',
      assessmentId: 'ASM_SKL_FIN_QUANT_V1',
      responses: {
        FIN_Q1_MARGIN: '15',
        FIN_Q2_LIQUIDITY: 'A',
        FIN_Q3_AUDIT: ['A', 'B'],
      },
    });
    assert.equal(endpointRes.ok, true);
    assert.equal(endpointRes.attempt?.scorePercentage, 100);
    assert.equal(endpointRes.attempt?.awardedRubricLevel, 3);

    // 4. Portfolio assessment routes to SUBMITTED_FOR_HUMAN_REVIEW without fabricating a score
    const portfolioAsm = INITIAL_SKILL_ASSESSMENTS.find(
      (a) => a.id === 'ASM_SKL_DESIGN_PORTFOLIO_V1'
    )!;
    const portfolioAttempt = scoreSkillAssessmentAttemptServerSide(
      portfolioAsm,
      {
        DELIVERABLE_URL: 'https://github.com/student/wcag-audit-case-study',
        DELIVERABLE_RATIONALE:
          'Complete WCAG 2.2 AA audit of checkout flow with screen-reader matrix and before/after remediation diffs.',
      },
      'USR_TEST_01'
    );
    assert.equal(portfolioAttempt.completionStatus, 'SUBMITTED_FOR_HUMAN_REVIEW');
    assert.equal(portfolioAttempt.scorePercentage, null);
    assert.equal(portfolioAttempt.awardedRubricLevel, null);
  });

  runTest('8.4 Learning Hub resource-to-skill mappings, nullable metadata, and broken/retired resource exclusion', () => {
    const fieldIds = new Set(INITIAL_FIELD_CATEGORIES.map((f) => f.id));
    const skillIds = new Set(INITIAL_SKILL_CATALOGUE.map((s) => s.id));

    for (const res of INITIAL_LEARNING_RESOURCES) {
      assert.ok(fieldIds.has(res.fieldId), `Resource ${res.id} must map to a valid field`);
      assert.ok(res.originalUrl.startsWith('https://'), `Resource ${res.id} must have a valid https URL`);
      for (const skId of res.associatedSkillIds) {
        assert.ok(skillIds.has(skId), `Resource ${res.id} references unknown skillId ${skId}`);
      }
      if (res.resourceType === 'YOUTUBE_VIDEO' || res.resourceType === 'YOUTUBE_PLAYLIST') {
        assert.ok(
          res.youtubeEmbedUrl?.startsWith('https://www.youtube-nocookie.com/embed/'),
          `YouTube resource ${res.id} must use privacy-enhanced youtube-nocookie.com embed URL`
        );
      }
    }

    // Verify broken/unavailable resources are excluded from gap recommendations
    const targetWithSqlGap: OpportunityTarget = {
      id: 'TGT_SQL_GAP',
      title: 'Data Analytics Fellowship',
      category: 'INTERNSHIP_JOB',
      organizationLabel: 'Analytics Institute',
      isSampleData: false,
      version: '1.0.0',
      rubricVersion: 'RUBRIC_V1',
      summary: 'Requires L3 Data Analysis & SQL.',
      fieldId: 'FIELD_CS_SW',
      mandatoryConditions: [],
      requirements: [
        {
          id: 'REQ_SQL_L3',
          dimensionId: 'CAP_DATA_ANAL',
          requiredSkillId: 'SKL_CS_SQL',
          requiredLevel: 3,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: true,
          rationale: 'Demonstrate L3 SQL & relational data analysis.',
        },
      ],
    };

    const cleanState = createCleanInitialState();
    assert.equal(cleanState.skillAssessmentAttempts.length, 0);
    assert.equal(cleanState.studentSkillRecords.length, 0);
    assert.equal(cleanState.resourceProgress.length, 0);

    const initialReport = computeTargetReadinessReport(
      targetWithSqlGap,
      cleanState.capabilityRecords,
      [],
      null
    );
    assert.equal(initialReport.requirementEvaluations[0].status, 'UNKNOWN_INSUFFICIENT_INFO');

    // Mark one resource UNAVAILABLE and verify it is excluded from recommendations
    const modifiedResources = INITIAL_LEARNING_RESOURCES.map((r, idx) =>
      idx === 0 ? { ...r, linkVerificationStatus: 'UNAVAILABLE' as const } : r
    );
    const recs = recommendLearningForOpportunityGaps(
      targetWithSqlGap,
      initialReport,
      INITIAL_SKILL_CATALOGUE,
      modifiedResources,
      INITIAL_SKILL_ASSESSMENTS
    );
    assert.equal(recs.length, 1);
    assert.ok(
      !recs[0].recommendedResources.some((r) => r.id === INITIAL_LEARNING_RESOURCES[0].id),
      'UNAVAILABLE resources must be excluded from gap recommendations'
    );
    assert.ok(recs[0].availableAssessments.some((a) => a.id === 'ASM_SKL_SQL_V1'));
  });

  runTest('8.5 Readiness updates after valid Skill Assessment vs Learning Progress non-inflation & RLS schema coverage', () => {
    const cleanState = createCleanInitialState();

    // 1. Verify SUPABASE_RLS_SCHEMA_SQL contains Stage A, B, and C tables and RLS policies
    assert.ok(SUPABASE_RLS_SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS public.fields'));
    assert.ok(SUPABASE_RLS_SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS public.skills'));
    assert.ok(SUPABASE_RLS_SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS public.skill_assessments'));
    assert.ok(SUPABASE_RLS_SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS public.skill_assessment_attempts'));
    assert.ok(SUPABASE_RLS_SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS public.learning_resources'));
    assert.ok(SUPABASE_RLS_SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS public.student_learning_progress'));

    // 2. Verify completing ASM_SKL_SQL_V1 updates objectiveScoreLevel/demonstratedLevel and reduces readiness gap
    const sqlAssessment = INITIAL_SKILL_ASSESSMENTS.find((a) => a.id === 'ASM_SKL_SQL_V1')!;
    const attempt = scoreSkillAssessmentAttemptServerSide(
      sqlAssessment,
      {
        SQL_Q1_JOIN: 'B',
        SQL_Q2_HAVING: 'B',
        SQL_Q3_INTEGRITY: ['A', 'B', 'D'],
        SQL_Q4_CARDINALITY: '4',
      },
      'USR_TEST_01'
    );
    assert.equal(attempt.awardedRubricLevel, 3);

    const updatedCapabilities: CapabilityDimensionRecord[] = cleanState.capabilityRecords.map(
      (rec) =>
        rec.dimensionId === attempt.mappedCapabilityId
          ? {
              ...rec,
              objectiveScoreLevel: attempt.awardedRubricLevel,
              demonstratedLevel: attempt.awardedRubricLevel,
              evidenceSource: 'OBJECTIVE_ASSESSMENT',
            }
          : rec
    );

    const targetRequiringL2NoEvidence: OpportunityTarget = {
      id: 'TGT_SQL_L2',
      title: 'Junior Data Analyst Role',
      category: 'INTERNSHIP_JOB',
      organizationLabel: 'Data Corp',
      isSampleData: false,
      version: '1.0.0',
      rubricVersion: 'RUBRIC_V1',
      summary: 'Requires L2 Data Analysis.',
      mandatoryConditions: [],
      requirements: [
        {
          id: 'REQ_DATA_L2',
          dimensionId: 'CAP_DATA_ANAL',
          requiredSkillId: 'SKL_CS_SQL',
          requiredLevel: 2,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: false,
          rationale: 'Demonstrate L2 SQL proficiency.',
        },
      ],
    };

    const reportAfterAssessment = computeTargetReadinessReport(
      targetRequiringL2NoEvidence,
      updatedCapabilities,
      [],
      null
    );
    assert.equal(reportAfterAssessment.requirementEvaluations[0].status, 'DEMONSTRATED');
    assert.equal(reportAfterAssessment.requirementEvaluations[0].numericGap, 0);
  });

  runTest('8.6 Content Review History initialization and multi-field specialisation coverage', () => {
    const cleanState = createCleanInitialState();
    assert.ok(Array.isArray(cleanState.contentReviewHistory));
    assert.equal(cleanState.contentReviewHistory.length, 0);
    for (const field of cleanState.fieldsCatalogue) {
      assert.ok(
        field.specializations.length >= 4,
        `Field ${field.id} must define at least 4 specialisations`
      );
      assert.equal(field.publicationStatus, 'PUBLISHED');
    }
  });

  // ---------------------------------------------------------------------------
  // 9. MARKET INTELLIGENCE, SKILL INTELLIGENCE, RESUME BUILDER, LINKEDIN & ADMIN
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 9: Market Intelligence, Skill Trends, Resume Builder, LinkedIn & Admin ---');

  runTest('9.1 JobMarketService filters across fields, converts listings to OpportunityTarget blueprints, and tracks saved applications across 8 statuses', () => {
    const allOpps = JobMarketService.getAllOpportunities();
    assert.ok(allOpps.length >= 8, 'Expected at least 8 structured demonstration market opportunities');
    for (const opp of allOpps) {
      assert.equal(opp.isSampleData, true, 'All market opportunities must explicitly declare isSampleData=true');
    }

    const csOpps = JobMarketService.filterOpportunities({ fieldId: 'FIELD_CS_SW' });
    assert.ok(csOpps.length >= 2);

    const targetBlueprint = JobMarketService.convertMarketOpportunityToTarget(csOpps[0]);
    assert.equal(targetBlueprint.id, csOpps[0].id);
    assert.equal(targetBlueprint.isSampleData, true);
    assert.ok(targetBlueprint.requirements.length > 0);

    const saved = JobMarketService.saveOrUpdateOpportunityTracking(
      csOpps[0].id,
      'PLANNING_TO_APPLY',
      'Preparing SQL benchmark artifact',
      '2026-11-15',
      '2026-11-25'
    );
    assert.ok(saved.some((r) => r.opportunityId === csOpps[0].id && r.applicationStatus === 'PLANNING_TO_APPLY'));
  });

  runTest('9.2 SkillIntelligenceService filters across 6 trend classifications and enforces proposed-update governance without auto-publishing', () => {
    const allTrends = SkillIntelligenceService.getAllSkillTrends();
    assert.ok(allTrends.length >= 6);
    const classifications = new Set(allTrends.map((t) => t.trendClassification));
    assert.ok(classifications.has('EMERGING'));
    assert.ok(classifications.has('GROWING_DEMAND'));
    assert.ok(classifications.has('STABLE'));
    assert.ok(classifications.has('DECLINING_DEMAND'));
    assert.ok(classifications.has('TRANSFORMING'));
    assert.ok(classifications.has('INSUFFICIENT_EVIDENCE'));

    const initialSkillCount = INITIAL_SKILL_CATALOGUE.length;
    const newProposal = SkillIntelligenceService.submitCandidateProposal({
      proposedSkillName: 'Retrieval-Augmented Generation Evaluation',
      fieldId: 'FIELD_CS_SW',
      specialization: 'Data Science & Machine Learning',
      mappedCapabilityId: 'CAP_DATA_ANAL',
      candidateClassification: 'NEW_SKILL',
      targetExistingSkillId: null,
      proposedDescription: 'Evaluating faithfulness and citation grounding in retrieval pipelines.',
      rationale: 'Observed in graduate AI engineering roles.',
      trendClassification: 'EMERGING',
    });
    assert.equal(newProposal.reviewStatus, 'PENDING_REVIEW');
    assert.equal(
      INITIAL_SKILL_CATALOGUE.length,
      initialSkillCount,
      'Submitting a candidate proposal must never overwrite the official Skill Library automatically'
    );

    const reviewedList = SkillIntelligenceService.reviewCandidateProposal(
      newProposal.id,
      'APPROVED_FOR_CATALOGUE_PROPOSAL',
      newProposal.proposedDescription,
      'Verified by curator in test suite',
      'ADMIN'
    );
    const updatedProp = reviewedList.find((p) => p.id === newProposal.id);
    assert.equal(updatedProp?.reviewStatus, 'APPROVED_FOR_CATALOGUE_PROPOSAL');
  });

  runTest('9.3 Resume Building Official Skill (SKL_CAREER_RESUME_BUILDING), Assessment (ASM_SKL_RESUME_V1), Completeness Checker & Ethical Tailoring', () => {
    assert.equal(RESUME_BUILDING_SUBSKILLS.length, 10, 'Must define all 10 Resume Building subskills');
    const resumeSkill = INITIAL_SKILL_CATALOGUE.find((s) => s.id === 'SKL_CAREER_RESUME_BUILDING');
    assert.ok(resumeSkill, 'SKL_CAREER_RESUME_BUILDING must exist in official Skill Library');

    const resumeAsm = INITIAL_SKILL_ASSESSMENTS.find((a) => a.id === 'ASM_SKL_RESUME_V1');
    assert.ok(resumeAsm, 'ASM_SKL_RESUME_V1 must exist in Skill Assessment Bank');

    const scoredResumeAsm = scoreSkillAssessmentAttemptServerSide(
      resumeAsm!,
      {
        RESM_Q1_ATTRIBUTION: 'B',
        RESM_Q2_TAILORING: ['A', 'B'],
        RESM_Q3_COMPLETENESS: 'B',
      },
      'USR_TEST_01'
    );
    assert.equal(scoredResumeAsm.completionStatus, 'COMPLETED_SCORED');
    assert.equal(scoredResumeAsm.scorePercentage, 100);
    assert.equal(scoredResumeAsm.awardedRubricLevel, 3);

    // Resume completeness & ethical tailoring
    const draft = ResumeService.createEmptyResumeVersion('Test Resume Version');
    const initialCompleteness = ResumeService.evaluateResumeCompleteness(draft);
    assert.ok(initialCompleteness.issues.length > 0, 'Empty resume must flag completeness issues');

    const opp = JobMarketService.getAllOpportunities()[0];
    const cleanState = createCleanInitialState();
    const tailoring = ResumeService.compareResumeWithOpportunity(
      draft,
      opp,
      INITIAL_SKILL_CATALOGUE,
      cleanState.capabilityRecords
    );
    assert.ok(tailoring.ethicalTailoringNotice.includes('never inserts a skill'));
    assert.equal(
      draft.skills.length,
      0,
      'Opportunity tailoring must never automatically insert unpossessed skills into the resume'
    );
  });

  runTest('9.4 ProfessionalProfileService (Manual LinkedIn Support), StudentUpdatesService, and AdminResearchService', () => {
    const cleanState = createCleanInitialState();
    const savedProfile = ProfessionalProfileService.saveLinkedInProfile({
      profileUrl: 'https://linkedin.com/in/test-student',
      headline: 'CS Undergraduate',
      aboutSection: 'Studying relational databases and software engineering.',
      educationSummary: 'B.Tech CS (2023-2027)',
      experienceSummary: '',
      listedSkillNames: ['Relational Database Design & SQL Querying'],
      certificationsSummary: '',
      projectsSummary: '',
      portfolioLinks: [],
      provenance: 'USER_PROVIDED',
      lastUpdatedAt: null,
    });
    assert.equal(savedProfile.provenance, 'USER_PROVIDED');

    const discrepancies = ProfessionalProfileService.compareWithWayfinderProfile(
      savedProfile,
      INITIAL_SKILL_CATALOGUE,
      cleanState.studentSkillRecords,
      cleanState.capabilityRecords,
      cleanState.portfolioRecords,
      cleanState.evidenceSubmissions
    );
    assert.ok(
      discrepancies.some(
        (d) => d.discrepancyType === 'CLAIMED_ON_LINKEDIN_NOT_ASSESSED_IN_WAYFINDER'
      ),
      'Must flag skills claimed on LinkedIn that have not been assessed in WAYFINDER'
    );

    const updates = StudentUpdatesService.getAllUpdates();
    assert.ok(updates.length >= 7, 'Must include updates across all 7 categories');

    const adminMetrics = AdminResearchService.getMarketResearchMetrics(
      INITIAL_FIELD_CATEGORIES,
      JobMarketService.getAllOpportunities(),
      SkillIntelligenceService.getAllSkillTrends()
    );
    assert.equal(adminMetrics.isDemonstrationMetrics, true);
    assert.equal(adminMetrics.fieldDistribution.length, 18);
    assert.equal(AdminResearchService.getResearchConfig().backendConnectionStatus, 'NOT_YET_CONNECTED');
  });

  console.log(`\n===================================================================`);
  console.log(`ALL ${passed} AUTOMATED TESTS PASSED SUCCESSFULLY.`);
  console.log(`===================================================================`);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});


