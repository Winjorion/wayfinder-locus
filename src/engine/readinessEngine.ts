import {
  CapabilityDimensionId,
  CapabilityDimensionRecord,
  DevelopmentActivity,
  EvidenceSubmission,
  InstitutionCohortRecord,
  LearningResource,
  OpportunityTarget,
  OpportunityVerificationMetadata,
  RequirementStatus,
  RiasecAssessmentResult,
  RiasecDomain,
  RubricLevel,
  SkillAssessmentAttempt,
  SkillAssessmentDefinition,
  SkillAssessmentItemFeedback,
  SkillCatalogueEntry,
  TargetRequirement,
  UserProfile,
} from '../types/wayfinder';
import { RIASEC_ITEMS, RIASEC_DOMAIN_LABELS } from '../data/riasecBank';
import { SERVER_SIDE_APTITUDE_ANSWER_KEY, APTITUDE_PUBLIC_ITEMS } from '../data/aptitudeBank';
import { getCapabilityDimensionName, RUBRIC_V1_ANCHORS } from '../data/capabilityDimensions';
import {
  INITIAL_SKILL_ASSESSMENTS,
  SERVER_SIDE_SKILL_ASSESSMENT_KEYS,
  mapPercentageToSkillRubricLevel,
  validateSkillAssessmentResponses,
} from '../data/skillAssessmentBank';
import { INITIAL_SKILL_CATALOGUE, getSkillById } from '../data/fieldAndSkillLibrary';
import { INITIAL_LEARNING_RESOURCES } from '../data/learningHubCatalogue';

const DIMENSION_ACCEPTABLE_EVIDENCE_GUIDE: Record<CapabilityDimensionId, string> = {
  CAP_NUM_QUANT:
    'Quantitative analysis report, statistical notebook, spreadsheet model with documented formulas, or completed Numerical Aptitude assessment.',
  CAP_TECH_COMM:
    'Technical specification document, architecture brief, structured user guide, or completed Verbal Comprehension assessment.',
  CAP_SYS_DESIGN:
    'System architecture diagram, component Trade-off Analysis, interface specification, or reviewed design document.',
  CAP_PROG_SW:
    'Source code repository link with commit history and automated tests, verified project build, or completed Software Foundations assessment.',
  CAP_DATA_ANAL:
    'Exploratory data analysis notebook, reproducible dataset pipeline, SQL/query verification log, or validated metrics report.',
  CAP_PROB_SOLV:
    'Root-cause debugging report, algorithmic trade-off write-up, competition solution repository, or completed Logical Analysis assessment.',
  CAP_TEAM_COLLAB:
    'Peer-reviewed pull request history, collaborative project retrospective with attribution, or supervisor-verified team contribution log.',
  CAP_PROJ_EXEC:
    'Project delivery milestone log, scope-and-risk register, sprint execution artifact, or verified internship completion record.',
  CAP_ETHICS_GOV:
    'Privacy & security impact assessment, data governance compliance checklist, or ethical risk mitigation analysis.',
  CAP_RESEARCH_SYN:
    'Literature synthesis review, comparative benchmark study, or structured experimental findings report with citations.',
};

export function scoreRiasecInventory(
  responses: Record<string, number>,
  attemptId = `RIASEC_${Date.now()}`
): RiasecAssessmentResult {
  const domains: RiasecDomain[] = ['R', 'I', 'A', 'S', 'E', 'C'];
  const rawDomainSums: Record<RiasecDomain, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const normalizedPercentage: Record<RiasecDomain, number> = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };

  let answeredCount = 0;
  for (const item of RIASEC_ITEMS) {
    const val = responses[item.id];
    if (typeof val === 'number' && val >= 1 && val <= 5) {
      rawDomainSums[item.domain] += val;
      answeredCount++;
    }
  }

  const isComplete48 = answeredCount === 48;

  for (const d of domains) {
    if (isComplete48) {
      const pct = ((rawDomainSums[d] - 8) / 32) * 100;
      normalizedPercentage[d] = Math.round(pct * 100) / 100;
    } else {
      normalizedPercentage[d] = 0;
    }
  }

  let tieBreakApplied = false;
  const sortedDomains = [...domains].sort((a, b) => {
    const diff = rawDomainSums[b] - rawDomainSums[a];
    if (diff !== 0) return diff;
    tieBreakApplied = true;
    return a.localeCompare(b);
  });

  const topThreeCode = isComplete48 ? sortedDomains.slice(0, 3).join('') : 'INCOMPLETE';

  return {
    attemptId,
    completedAt: new Date().toISOString(),
    itemResponses: { ...responses },
    rawDomainSums,
    normalizedPercentage,
    topThreeCode,
    tieBreakApplied,
    isComplete48,
  };
}

export function scoreAptitudeAttemptServerSide(
  domainItems: { id: string }[],
  selectedOptions: Record<string, string>
): {
  totalItems: number;
  correctCount: number;
  percentage: number;
  mappedRubricLevel: RubricLevel;
} {
  const totalItems = domainItems.length;
  if (totalItems === 0) {
    return { totalItems: 0, correctCount: 0, percentage: 0, mappedRubricLevel: 0 };
  }

  let correctCount = 0;
  for (const item of domainItems) {
    const expected = SERVER_SIDE_APTITUDE_ANSWER_KEY[item.id];
    const actual = selectedOptions[item.id];
    if (expected && actual && expected === actual) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / totalItems) * 100);
  let mappedRubricLevel: RubricLevel = 0;
  if (percentage >= 90) mappedRubricLevel = 3;
  else if (percentage >= 65) mappedRubricLevel = 2;
  else if (percentage >= 35) mappedRubricLevel = 1;
  else mappedRubricLevel = 0;

  return {
    totalItems,
    correctCount,
    percentage,
    mappedRubricLevel,
  };
}

export function calculateNumericGap(
  requiredLevel: RubricLevel | null | undefined,
  demonstratedLevel: RubricLevel | null | undefined,
  requiredRubricVersion: string,
  capabilityRubricVersion: string
): number | null {
  if (requiredLevel === null || requiredLevel === undefined) return null;
  if (demonstratedLevel === null || demonstratedLevel === undefined) return null;
  if (requiredRubricVersion !== capabilityRubricVersion) return null;
  return Math.max(0, requiredLevel - demonstratedLevel);
}

/**
 * Opportunity Verification Layer:
 * Evaluates all 8 verification fields honestly without fabricating checkmarks or unexplained trust scores.
 */
export function resolveOpportunityVerification(
  target: OpportunityTarget
): OpportunityVerificationMetadata {
  if (target.verification) {
    // Check if deadline is now expired relative to current time
    if (target.applicationDeadline) {
      const parsed = Date.parse(target.applicationDeadline);
      if (!Number.isNaN(parsed) && parsed < Date.now()) {
        return {
          ...target.verification,
          deadlineStatus: 'EXPIRED',
          overallStatus: 'EXPIRED',
          statusExplanation:
            'The recorded application deadline for this opportunity has passed.',
        };
      }
    }
    return target.verification;
  }

  const hasRequirements = target.requirements.length > 0;
  const hasSourceUrl = Boolean(target.sourceUrl && target.sourceUrl.trim());
  const hasAppUrl = Boolean(target.applicationUrl && target.applicationUrl.trim());

  let deadlineStatus: OpportunityVerificationMetadata['deadlineStatus'] = 'UNAVAILABLE';
  if (target.applicationDeadline && target.applicationDeadline.trim()) {
    const parsed = Date.parse(target.applicationDeadline);
    if (!Number.isNaN(parsed) && parsed < Date.now()) {
      deadlineStatus = 'EXPIRED';
    } else {
      deadlineStatus = 'NOT_VERIFIED';
    }
  }

  return {
    organizerIdentityStatus: 'NOT_VERIFIED',
    opportunitySourceStatus: hasSourceUrl ? 'NOT_VERIFIED' : 'UNAVAILABLE',
    requirementsExtractedStatus: hasRequirements ? 'NOT_VERIFIED' : 'UNAVAILABLE',
    capabilitiesMappedStatus: hasRequirements ? 'VERIFIED' : 'UNAVAILABLE',
    applicationLinkStatus: hasAppUrl ? 'NOT_VERIFIED' : 'UNAVAILABLE',
    deadlineStatus,
    lastVerifiedAt: null,
    overallStatus: deadlineStatus === 'EXPIRED' ? 'EXPIRED' : 'NOT_VERIFIED',
    statusExplanation:
      deadlineStatus === 'EXPIRED'
        ? 'The application deadline entered for this target has passed.'
        : 'Capability requirements are mapped to the 10-dimension rubric, but organizer identity, external source, application link, and deadline have not been independently verified by an external verification provider.',
  };
}

export interface InterestRelevanceEvaluation {
  hasCompletedRiasec: boolean;
  topThreeCode: string | null;
  matchingDomains: { code: RiasecDomain; label: string }[];
  statedCareerGoal: string | null;
  relevanceSummary: string;
  separationPrincipleNote: string;
}

export function evaluateOpportunityInterestRelevance(
  target: OpportunityTarget,
  riasecResult: RiasecAssessmentResult | null,
  studentProfile: UserProfile | null
): InterestRelevanceEvaluation {
  const statedCareerGoal = studentProfile?.statedCareerGoal?.trim() || null;
  const hasCompletedRiasec = Boolean(riasecResult && riasecResult.isComplete48);
  const topThreeCode = hasCompletedRiasec ? riasecResult!.topThreeCode : null;

  const targetDomains: RiasecDomain[] =
    target.relevantRiasecDomains && target.relevantRiasecDomains.length > 0
      ? target.relevantRiasecDomains
      : ['I', 'R', 'E'];

  const studentTopDomains = topThreeCode ? (topThreeCode.split('') as RiasecDomain[]) : [];
  const matchingDomains = targetDomains
    .filter((d) => studentTopDomains.includes(d))
    .map((code) => ({ code, label: RIASEC_DOMAIN_LABELS[code] }));

  let relevanceSummary = '';
  if (!hasCompletedRiasec && !statedCareerGoal) {
    relevanceSummary =
      'Complete the 48-item Career Interest Inventory (RIASEC) or record your stated career goal in your Capability Passport to see how this opportunity aligns with your personal interests.';
  } else {
    const parts: string[] = [];
    if (hasCompletedRiasec) {
      if (matchingDomains.length > 0) {
        parts.push(
          `Your RIASEC interest profile (${topThreeCode}) overlaps with this opportunity in ${matchingDomains
            .map((m) => `${m.label} (${m.code})`)
            .join(', ')}.`
        );
      } else {
        parts.push(
          `Your top RIASEC interest code (${topThreeCode}) focuses on different work environments than the primary interest themes (${targetDomains.join(
            ', '
          )}) associated with this opportunity.`
        );
      }
    }
    if (statedCareerGoal) {
      parts.push(`Your stated career direction is "${statedCareerGoal}".`);
    }
    relevanceSummary = parts.join(' ');
  }

  return {
    hasCompletedRiasec,
    topThreeCode,
    matchingDomains,
    statedCareerGoal,
    relevanceSummary,
    separationPrincipleNote:
      'Interest alignment explains why an opportunity may appeal to you for exploration—it never substitutes for demonstrated capability, mandatory eligibility, or verified evidence.',
  };
}

export interface RequirementEvaluationItem {
  requirement: TargetRequirement;
  dimensionName: string;
  requiredLevel: RubricLevel;
  demonstratedLevel: RubricLevel | null;
  selfReportedClaimLevel: RubricLevel | null;
  numericGap: number | null;
  status: RequirementStatus;
  hasAcceptedEvidence: boolean;
  hasPendingEvidence: boolean;
  acceptableEvidenceGuide: string;
  developmentActionSteps: string[];
  explanation: string;
  recommendedNextAction: string;
}

export interface TargetReadinessReport {
  targetId: string;
  targetTitle: string;
  targetVersion: string;
  rubricVersion: string;
  calculatedAt: string;
  mandatoryConditionResults: {
    id: string;
    label: string;
    conditionType: string;
    isMet: boolean;
  }[];
  allMandatoryConditionsMet: boolean;
  unmetMandatoryConditionsCount: number;
  requirementEvaluations: RequirementEvaluationItem[];
  counts: Record<RequirementStatus, number>;
  totalRequirements: number;
  knownDemonstratedCount: number;
  numericGapSum: number;
}

export function computeTargetReadinessReport(
  target: OpportunityTarget,
  capabilityRecords: CapabilityDimensionRecord[],
  evidenceSubmissions: EvidenceSubmission[],
  studentProfile: UserProfile | null
): TargetReadinessReport {
  const counts: Record<RequirementStatus, number> = {
    DEMONSTRATED: 0,
    PARTIALLY_DEMONSTRATED: 0,
    DEVELOPMENT_NEEDED: 0,
    EVIDENCE_MISSING: 0,
    EVIDENCE_PENDING_REVIEW: 0,
    MANDATORY_CONDITION_NOT_MET: 0,
    UNKNOWN_INSUFFICIENT_INFO: 0,
    NOT_APPLICABLE: 0,
  };

  const mandatoryConditionResults = target.mandatoryConditions.map((cond) => {
    let isMet = cond.isMet;
    if (studentProfile) {
      if (cond.conditionType === 'ENROLLED_STUDENT') {
        isMet = studentProfile.eligibility.enrolledStudentVerified;
      } else if (cond.conditionType === 'ACADEMIC_STANDING') {
        isMet = studentProfile.eligibility.minimumAcademicStandingVerified;
      } else if (cond.conditionType === 'CUSTOM_PREREQUISITE') {
        isMet = Boolean(studentProfile.eligibility.customEligibilityFlags[cond.id] ?? cond.isMet);
      }
    }
    return {
      id: cond.id,
      label: cond.label,
      conditionType: cond.conditionType,
      isMet,
    };
  });

  const unmetMandatoryConditionsCount = mandatoryConditionResults.filter((c) => !c.isMet).length;
  const allMandatoryConditionsMet = unmetMandatoryConditionsCount === 0;
  if (!allMandatoryConditionsMet) {
    counts.MANDATORY_CONDITION_NOT_MET = unmetMandatoryConditionsCount;
  }

  let knownDemonstratedCount = 0;
  let numericGapSum = 0;

  const requirementEvaluations: RequirementEvaluationItem[] = target.requirements.map((req) => {
    const capRecord = capabilityRecords.find((r) => r.dimensionId === req.dimensionId);
    const dimensionName = getCapabilityDimensionName(req.dimensionId);
    const targetAnchor = RUBRIC_V1_ANCHORS[req.requiredLevel];

    const relatedEvidence = evidenceSubmissions.filter(
      (ev) => ev.linkedDimensionId === req.dimensionId
    );
    const acceptedEvidence = relatedEvidence.filter(
      (ev) =>
        ev.status === 'ACCEPTED' &&
        ev.reviewDecision?.decision === 'ACCEPTED' &&
        ev.reviewDecision.verifiedRubricLevel !== null &&
        ev.reviewDecision.verifiedRubricLevel >= req.requiredLevel
    );
    const pendingEvidence = relatedEvidence.filter((ev) =>
      ['SUBMITTED', 'TECHNICAL_VALIDATION_PASSED', 'ASSIGNED_FOR_REVIEW', 'UNDER_REVIEW'].includes(
        ev.status
      )
    );

    const hasAcceptedEvidence = acceptedEvidence.length > 0;
    const hasPendingEvidence = pendingEvidence.length > 0;

    const demonstratedLevel = capRecord ? capRecord.demonstratedLevel : null;
    const selfReportedClaimLevel = capRecord ? capRecord.selfReportedLevel : null;
    const capRubricVersion = capRecord ? capRecord.rubricVersion : req.rubricVersion;

    const numericGap = calculateNumericGap(
      req.requiredLevel,
      demonstratedLevel,
      req.rubricVersion,
      capRubricVersion
    );

    if (numericGap !== null) {
      numericGapSum += numericGap;
    }
    if (demonstratedLevel !== null) {
      knownDemonstratedCount++;
    }

    const acceptableEvidenceGuide =
      req.acceptableEvidenceTypes?.trim() ||
      DIMENSION_ACCEPTABLE_EVIDENCE_GUIDE[req.dimensionId] ||
      `Verifiable work artifact demonstrating ${dimensionName} at Level ${req.requiredLevel} (${targetAnchor.label}).`;

    let status: RequirementStatus = 'UNKNOWN_INSUFFICIENT_INFO';
    let explanation = '';
    let recommendedNextAction = '';
    let developmentActionSteps: string[] = [];

    if (!capRecord || req.rubricVersion !== capRubricVersion) {
      status = 'UNKNOWN_INSUFFICIENT_INFO';
      explanation =
        'This skill has not been assessed on the current rubric yet. Unassessed skills are shown as needing more information—never as zero.';
      recommendedNextAction =
        'Complete a skill assessment or submit work for review to establish your current level.';
      developmentActionSteps = [
        `Complete an objective assessment or rubric check for ${dimensionName} to establish a baseline level.`,
        `Build a project or work artifact demonstrating Level ${req.requiredLevel} (${targetAnchor.label}).`,
        `Submit your artifact to the Evidence Ledger for reviewer verification.`,
      ];
    } else if (demonstratedLevel === null) {
      if (hasPendingEvidence) {
        status = 'EVIDENCE_PENDING_REVIEW';
        explanation = `Your submitted work for ${dimensionName} is awaiting review.`;
        recommendedNextAction =
          'Wait for your assigned reviewer to evaluate your submission, or check its progress in the Evidence Ledger.';
        developmentActionSteps = [
          `Track reviewer feedback on your pending ${dimensionName} submission in the Evidence Ledger.`,
          `If revisions are requested, refine your artifact to clearly demonstrate Level ${req.requiredLevel} (${targetAnchor.label}).`,
        ];
      } else if (selfReportedClaimLevel !== null) {
        status = 'EVIDENCE_MISSING';
        explanation = `You self-reported Level ${selfReportedClaimLevel}, which is recorded as an unverified claim. An objective assessment or reviewed evidence is needed to confirm this capability.`;
        recommendedNextAction =
          'Complete an aptitude assessment or upload supporting work to verify your level.';
        developmentActionSteps = [
          `Convert your Level ${selfReportedClaimLevel} self-reported claim into demonstrated capability by completing an objective assessment or producing a verifiable deliverable.`,
          `Prepare evidence: ${acceptableEvidenceGuide}`,
          `Submit the evidence for reviewer verification and reassess readiness once accepted.`,
        ];
      } else {
        status = 'UNKNOWN_INSUFFICIENT_INFO';
        explanation = `${dimensionName} has not been assessed yet. Unassessed skills are shown as needing more information rather than zero.`;
        recommendedNextAction =
          'Start with an assessment to establish your baseline capability level.';
        developmentActionSteps = [
          `Take an objective assessment in the Assessment Hub to establish your baseline for ${dimensionName}.`,
          `Complete a practical challenge targeting Level ${req.requiredLevel} (${targetAnchor.label}: ${targetAnchor.description}).`,
          `Submit the resulting artifact to the Evidence Ledger for review.`,
        ];
      }
    } else {
      const gap = numericGap ?? Math.max(0, req.requiredLevel - demonstratedLevel);
      if (gap === 0) {
        if (req.evidenceRequired && !hasAcceptedEvidence) {
          if (hasPendingEvidence) {
            status = 'EVIDENCE_PENDING_REVIEW';
            explanation = `Your assessed skill level meets Level ${req.requiredLevel}, and your supporting evidence is currently awaiting review.`;
            recommendedNextAction = 'Wait for reviewer verification of your submitted work.';
            developmentActionSteps = [
              `Await reviewer evaluation of your submitted ${dimensionName} evidence.`,
              `Re-check this requirement once the review decision is recorded.`,
            ];
          } else {
            status = 'EVIDENCE_MISSING';
            explanation = `Your assessed level (Level ${demonstratedLevel}) meets the target Level ${req.requiredLevel}, but this requirement also calls for verified work and no reviewed evidence is linked yet.`;
            recommendedNextAction = `Submit a project, portfolio item, or repository link for ${dimensionName} in the Evidence Ledger.`;
            developmentActionSteps = [
              `Package an existing or new deliverable showing ${dimensionName} at Level ${req.requiredLevel} (${targetAnchor.label}).`,
              `Recommended proof: ${acceptableEvidenceGuide}`,
              `Upload or link the artifact in the Evidence Ledger for reviewer sign-off.`,
            ];
          }
        } else {
          status = 'DEMONSTRATED';
          explanation = `Your demonstrated level (Level ${demonstratedLevel}) meets or exceeds the required Level ${req.requiredLevel}${
            req.evidenceRequired ? ' with verified supporting evidence.' : '.'
          }`;
          recommendedNextAction =
            'Requirement met. Keep your supporting work up to date as you progress.';
          developmentActionSteps = [
            `Requirement satisfied at Level ${demonstratedLevel}. Maintain current evidence in your Capability Passport.`,
          ];
        }
      } else if (gap === 1 && demonstratedLevel > 0) {
        status = 'PARTIALLY_DEMONSTRATED';
        explanation = `Your demonstrated level is Level ${demonstratedLevel}, compared with the target Level ${req.requiredLevel} (1 level below target).`;
        recommendedNextAction = `Complete a Level ${req.requiredLevel} learning activity and submit your work for review.`;
        developmentActionSteps = [
          `Practise ${dimensionName} from Level ${demonstratedLevel} to Level ${req.requiredLevel} (${targetAnchor.label}: ${targetAnchor.description}).`,
          `Complete a hands-on project or structured task that produces: ${acceptableEvidenceGuide}`,
          `Submit the artifact to the Evidence Ledger and reassess after reviewer acceptance.`,
        ];
      } else {
        status = 'DEVELOPMENT_NEEDED';
        explanation = `Your demonstrated level is Level ${demonstratedLevel}, compared with the target Level ${req.requiredLevel} (${gap} levels below target). Focused skill building is recommended.`;
        recommendedNextAction = `Complete targeted learning activities for ${dimensionName} before reassessing.`;
        developmentActionSteps = [
          `Build foundational and applied competence in ${dimensionName} toward Level ${req.requiredLevel} (${targetAnchor.label}).`,
          `Complete an applied project or structured challenge producing: ${acceptableEvidenceGuide}`,
          `Submit your deliverable to the Evidence Ledger for reviewer evaluation and reassess your gap.`,
        ];
      }
    }

    counts[status] = (counts[status] || 0) + 1;

    return {
      requirement: req,
      dimensionName,
      requiredLevel: req.requiredLevel,
      demonstratedLevel,
      selfReportedClaimLevel,
      numericGap,
      status,
      hasAcceptedEvidence,
      hasPendingEvidence,
      acceptableEvidenceGuide,
      developmentActionSteps,
      explanation,
      recommendedNextAction,
    };
  });

  return {
    targetId: target.id,
    targetTitle: target.title,
    targetVersion: target.version,
    rubricVersion: target.rubricVersion,
    calculatedAt: new Date().toISOString(),
    mandatoryConditionResults,
    allMandatoryConditionsMet,
    unmetMandatoryConditionsCount,
    requirementEvaluations,
    counts,
    totalRequirements: target.requirements.length,
    knownDemonstratedCount,
    numericGapSum,
  };
}

/**
 * Generates a concrete, requirement-linked DevelopmentActivity to close an identified capability/evidence gap.
 */
export function buildGapDevelopmentActivity(
  target: OpportunityTarget,
  evaluation: RequirementEvaluationItem
): DevelopmentActivity {
  const anchor = RUBRIC_V1_ANCHORS[evaluation.requiredLevel];
  return {
    id: `ACT_GAP_${target.id}_${evaluation.requirement.id}_${Date.now()}`,
    title: `Close Gap: ${evaluation.dimensionName} (Target Level ${evaluation.requiredLevel} — ${anchor.label})`,
    linkedDimensionId: evaluation.requirement.dimensionId,
    linkedTargetId: target.id,
    linkedTargetTitle: target.title,
    linkedRequirementId: evaluation.requirement.id,
    targetRubricLevel: evaluation.requiredLevel,
    objective: `Address the ${evaluation.dimensionName} requirement for "${target.title}" by demonstrating Level ${evaluation.requiredLevel} (${anchor.label}: ${anchor.description}).`,
    instructions: evaluation.developmentActionSteps.join(' '),
    expectedOutputArtifact: evaluation.acceptableEvidenceGuide,
    externalResourceLabel: `Target Requirement: ${target.title} (${target.version})`,
    status: 'NOT_STARTED',
    progressPercent: 0,
    reflectionNotes: '',
    completedAt: null,
  };
}

declare module '../types/wayfinder' {
  interface CapabilityDimensionRecord {
    RubricMismatch?: (a: string, b: string) => boolean;
  }
}

export function evaluateInstitutionCohortSuppression(
  cohorts: InstitutionCohortRecord[],
  thresholdK = 5
): InstitutionCohortRecord[] {
  return cohorts.map((c) => {
    if (c.studentCount < thresholdK) {
      return {
        ...c,
        isSuppressed: true,
        aggregateMetrics: null,
      };
    }
    return {
      ...c,
      isSuppressed: false,
    };
  });
}

export { APTITUDE_PUBLIC_ITEMS };

// =============================================================================
// STAGE B: SKILL ASSESSMENT ENGINE DETERMINISTIC & REVIEWER-WORKFLOW SCORING
// =============================================================================

export function scoreSkillAssessmentAttemptServerSide(
  assessment: SkillAssessmentDefinition,
  responses: Record<string, string | string[]>,
  studentId = 'UNAUTHENTICATED_USER',
  catalogueResources: LearningResource[] = INITIAL_LEARNING_RESOURCES
): SkillAssessmentAttempt {
  const validation = validateSkillAssessmentResponses(assessment, responses);

  const relatedResources = catalogueResources.filter(
    (r) =>
      r.editorialStatus !== 'RETIRED' &&
      r.linkVerificationStatus !== 'UNAVAILABLE' &&
      (r.associatedSkillIds.includes(assessment.skillId) ||
        r.mappedCapabilityId === assessment.mappedCapabilityId)
  );
  const recommendedResourceIds = relatedResources.map((r) => r.id);

  if (!validation.valid) {
    return {
      id: `SKL_ATT_INC_${assessment.id}_${Date.now()}`,
      studentId,
      assessmentId: assessment.id,
      assessmentVersion: assessment.version,
      assessmentTitle: assessment.title,
      skillId: assessment.skillId,
      fieldId: assessment.fieldId,
      mappedCapabilityId: assessment.mappedCapabilityId,
      completedAt: new Date().toISOString(),
      completionStatus: 'INCOMPLETE_VALIDATION_ERROR',
      evaluationMethod: assessment.requiresHumanReview
        ? 'HUMAN_REVIEWER_RUBRIC'
        : 'DETERMINISTIC_ANSWER_KEY',
      totalItems: assessment.items.length,
      correctCount: 0,
      scorePercentage: null,
      awardedRubricLevel: null,
      demonstratedStrengths: [],
      areasNeedingDevelopment: [
        validation.errorMessage || 'All required assessment questions must be completed.',
      ],
      itemFeedback: [],
      recommendedResourceIds,
      limitationsExplanation: assessment.limitationsNotice,
      recommendedNextSteps: [
        'Complete all required items and resubmit to generate a valid assessment result.',
      ],
    };
  }

  if (assessment.requiresHumanReview) {
    return {
      id: `SKL_ATT_REV_${assessment.id}_${Date.now()}`,
      studentId,
      assessmentId: assessment.id,
      assessmentVersion: assessment.version,
      assessmentTitle: assessment.title,
      skillId: assessment.skillId,
      fieldId: assessment.fieldId,
      mappedCapabilityId: assessment.mappedCapabilityId,
      completedAt: new Date().toISOString(),
      completionStatus: 'SUBMITTED_FOR_HUMAN_REVIEW',
      evaluationMethod: 'HUMAN_REVIEWER_RUBRIC',
      totalItems: 1,
      correctCount: 0,
      scorePercentage: null,
      awardedRubricLevel: null,
      demonstratedStrengths: [
        'Submitted portfolio / practical project deliverable for structured 6-dimension human review.',
      ],
      areasNeedingDevelopment: [
        'Awaiting assigned reviewer evaluation. No automated score is fabricated for portfolio or project submissions.',
      ],
      itemFeedback: [],
      recommendedResourceIds,
      limitationsExplanation: assessment.limitationsNotice,
      recommendedNextSteps: [
        'Track your submission status in the Evidence Ledger.',
        'Once an authorized reviewer accepts the submission, your demonstrated capability level will update automatically.',
      ],
    };
  }

  const keyMap = SERVER_SIDE_SKILL_ASSESSMENT_KEYS[assessment.id] || {};
  let correctCount = 0;
  const demonstratedStrengths: string[] = [];
  const areasNeedingDevelopment: string[] = [];
  const itemFeedback: SkillAssessmentItemFeedback[] = [];

  for (const item of assessment.items) {
    const keyEntry = keyMap[item.id];
    const rawResp = responses[item.id];
    let isCorrect = false;

    if (keyEntry) {
      if (
        item.questionType === 'MULTIPLE_CHOICE' ||
        item.questionType === 'SCENARIO_ANALYSIS'
      ) {
        isCorrect = typeof rawResp === 'string' && rawResp.trim() === keyEntry.correctOptionId;
      } else if (item.questionType === 'MULTIPLE_SELECT') {
        const expected = [...(keyEntry.correctOptionIds || [])].sort();
        const actual = Array.isArray(rawResp) ? [...rawResp].sort() : [];
        isCorrect =
          expected.length === actual.length &&
          expected.every((val, idx) => val === actual[idx]);
      } else if (item.questionType === 'NUMERICAL_PROBLEM') {
        const parsed = typeof rawResp === 'string' ? Number(rawResp.trim()) : NaN;
        const target = keyEntry.correctNumericValue ?? NaN;
        const tol = keyEntry.numericTolerance ?? 0;
        isCorrect = !Number.isNaN(parsed) && Math.abs(parsed - target) <= tol;
      }
    }

    if (isCorrect) {
      correctCount++;
      demonstratedStrengths.push(`${item.subtopic} (Target Level ${item.targetLevel})`);
    } else {
      areasNeedingDevelopment.push(`${item.subtopic} — review ${keyEntry?.explanation || 'core concepts'}`);
    }

    itemFeedback.push({
      itemId: item.id,
      subtopic: item.subtopic,
      isCorrect,
      feedbackSummary: keyEntry?.explanation || 'Evaluated against assessment key.',
    });
  }

  const totalItems = assessment.items.length;
  const scorePercentage =
    totalItems > 0 ? Math.round(((correctCount / totalItems) * 100) * 10) / 10 : 0;
  const awardedRubricLevel = mapPercentageToSkillRubricLevel(
    scorePercentage,
    assessment.targetProficiencyLevel
  );

  const recommendedNextSteps: string[] = [];
  if (areasNeedingDevelopment.length > 0) {
    recommendedNextSteps.push(
      `Review the recommended learning resources for ${areasNeedingDevelopment.length} area(s) needing development.`
    );
  }
  recommendedNextSteps.push(
    `Complete a practical project or deliverable for ${getCapabilityDimensionName(
      assessment.mappedCapabilityId
    )} and submit it to the Evidence Ledger to pair your assessment result with verified proof.`
  );

  return {
    id: `SKL_ATT_${assessment.id}_${Date.now()}`,
    studentId,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    assessmentTitle: assessment.title,
    skillId: assessment.skillId,
    fieldId: assessment.fieldId,
    mappedCapabilityId: assessment.mappedCapabilityId,
    completedAt: new Date().toISOString(),
    completionStatus: 'COMPLETED_SCORED',
    evaluationMethod: 'DETERMINISTIC_ANSWER_KEY',
    totalItems,
    correctCount,
    scorePercentage,
    awardedRubricLevel,
    demonstratedStrengths,
    areasNeedingDevelopment,
    itemFeedback,
    recommendedResourceIds,
    limitationsExplanation: assessment.limitationsNotice,
    recommendedNextSteps,
  };
}

// =============================================================================
// STAGE D & E: LEARNING RECOMMENDATION ENGINE LINKED TO READINESS GAPS
// =============================================================================

export interface OpportunityGapLearningRecommendation {
  requirementId: string;
  dimensionId: CapabilityDimensionId;
  dimensionName: string;
  requiredLevel: RubricLevel;
  currentDemonstratedLevel: RubricLevel | null;
  requirementStatus: RequirementStatus;
  gapExplanation: string;
  matchedSkills: SkillCatalogueEntry[];
  recommendedResources: LearningResource[];
  availableAssessments: SkillAssessmentDefinition[];
  suggestedPathwaySteps: string[];
  acceptableEvidenceToSubmit: string;
  hasCatalogueResources: boolean;
  emptyCatalogueExplanation: string | null;
}

export function recommendLearningForOpportunityGaps(
  target: OpportunityTarget,
  readinessReport: TargetReadinessReport,
  skillsCatalogue: SkillCatalogueEntry[] = INITIAL_SKILL_CATALOGUE,
  resourcesCatalogue: LearningResource[] = INITIAL_LEARNING_RESOURCES,
  assessmentsCatalogue: SkillAssessmentDefinition[] = INITIAL_SKILL_ASSESSMENTS
): OpportunityGapLearningRecommendation[] {
  const gapEvaluations = readinessReport.requirementEvaluations.filter(
    (ev) => ev.status !== 'DEMONSTRATED' && ev.status !== 'NOT_APPLICABLE'
  );

  return gapEvaluations.map((ev) => {
    const matchedSkills = skillsCatalogue.filter((sk) => {
      if (sk.publicationStatus === 'RETIRED') return false;
      if (ev.requirement.requiredSkillId) {
        return sk.id === ev.requirement.requiredSkillId;
      }
      return sk.mappedCapabilityId === ev.requirement.dimensionId;
    });

    const matchedSkillIds = new Set(matchedSkills.map((s) => s.id));

    const recommendedResources = resourcesCatalogue
      .filter((res) => {
        if (res.editorialStatus === 'RETIRED') return false;
        if (res.linkVerificationStatus === 'UNAVAILABLE') return false;
        const matchesSkill = res.associatedSkillIds.some((id) => matchedSkillIds.has(id));
        const matchesCapability = res.mappedCapabilityId === ev.requirement.dimensionId;
        return matchesSkill || matchesCapability;
      })
      .sort((a, b) => {
        const targetLvl = ev.requiredLevel;
        return (
          Math.abs(a.suggestedProficiencyLevel - targetLvl) -
          Math.abs(b.suggestedProficiencyLevel - targetLvl)
        );
      });

    const availableAssessments = assessmentsCatalogue.filter(
      (asm) =>
        asm.publicationStatus === 'PUBLISHED' &&
        asm.supportState !== 'UNSUPPORTED_IN_CURRENT_RUNTIME' &&
        (matchedSkillIds.has(asm.skillId) || asm.mappedCapabilityId === ev.requirement.dimensionId)
    );

    const primarySkill = matchedSkills[0];
    const suggestedPathwaySteps: string[] = [];

    if (ev.status === 'UNKNOWN_INSUFFICIENT_INFO') {
      if (availableAssessments.length > 0) {
        suggestedPathwaySteps.push(
          `1. Establish Baseline: Complete the "${availableAssessments[0].title}" assessment to determine your starting proficiency level.`
        );
      } else {
        suggestedPathwaySteps.push(
          `1. Establish Baseline: Review the rubric criteria for ${ev.dimensionName} (Target Level ${ev.requiredLevel}).`
        );
      }
    } else {
      suggestedPathwaySteps.push(
        `1. Focus on Identified Gap: Move from ${
          ev.demonstratedLevel !== null ? `Level ${ev.demonstratedLevel}` : 'unverified claim'
        } toward Required Level ${ev.requiredLevel} in ${
          primarySkill ? primarySkill.name : ev.dimensionName
        }.`
      );
    }

    if (recommendedResources.length > 0) {
      suggestedPathwaySteps.push(
        `2. Study & Practise: Work through "${recommendedResources[0].title}" (${recommendedResources[0].providerOrCreator}).`
      );
    } else {
      suggestedPathwaySteps.push(
        `2. Study & Practise: Consult authoritative documentation or coursework for ${ev.dimensionName}.`
      );
    }

    suggestedPathwaySteps.push(
      `3. Produce Verifiable Work: Complete a practical task or project that produces: ${ev.acceptableEvidenceGuide}`
    );
    suggestedPathwaySteps.push(
      `4. Submit & Reassess: Upload your deliverable to the Evidence Ledger for reviewer evaluation${
        availableAssessments.length > 0
          ? ` or complete "${availableAssessments[0].title}"`
          : ''
      }.`
    );

    return {
      requirementId: ev.requirement.id,
      dimensionId: ev.requirement.dimensionId,
      dimensionName: ev.dimensionName,
      requiredLevel: ev.requiredLevel,
      currentDemonstratedLevel: ev.demonstratedLevel,
      requirementStatus: ev.status,
      gapExplanation: `Addresses the "${target.title}" requirement for ${ev.dimensionName} (Target Level ${ev.requiredLevel}). Current status: ${ev.explanation}`,
      matchedSkills,
      recommendedResources,
      availableAssessments,
      suggestedPathwaySteps,
      acceptableEvidenceToSubmit: ev.acceptableEvidenceGuide,
      hasCatalogueResources: recommendedResources.length > 0,
      emptyCatalogueExplanation:
        recommendedResources.length === 0
          ? `No curated learning resources are currently linked to ${ev.dimensionName} in the catalogue. An administrator or curator can add verified resources for this skill.`
          : null,
    };
  });
}

