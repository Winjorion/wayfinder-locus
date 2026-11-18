import {
  AssessmentSupportState,
  RubricLevel,
  SkillAssessmentDefinition,
  SkillAssessmentType,
} from '../types/wayfinder';

/**
 * STAGE B — SKILL ASSESSMENT ENGINE CATALOGUE & SERVER-SIDE ANSWER KEYS
 *
 * Separate from the 48-item RIASEC Career Interest Inventory.
 * Supports:
 *  - MULTIPLE_CHOICE (Deterministic single-option key)
 *  - MULTIPLE_SELECT (Deterministic exact option-set key)
 *  - NUMERICAL_PROBLEM (Deterministic numeric key with tolerance)
 *  - SCENARIO_ANALYSIS (Deterministic structured case evaluation)
 *  - PRACTICAL_PROJECT_SUBMISSION / PORTFOLIO_ASSESSMENT (Human reviewer workflow — never claims fake automated grading)
 *  - Explicitly identifies unsupported types (e.g., live hardware/software simulation sandboxes) honestly.
 */

export interface AssessmentTypeSupportMeta {
  type: SkillAssessmentType;
  label: string;
  supportState: AssessmentSupportState;
  explanation: string;
}

export const ASSESSMENT_TYPE_CAPABILITY_MATRIX: AssessmentTypeSupportMeta[] = [
  {
    type: 'MULTIPLE_CHOICE',
    label: 'Multiple-Choice Knowledge & Analytical Test',
    supportState: 'SUPPORTED_DETERMINISTIC',
    explanation: 'Scored deterministically against a versioned server-side answer key.',
  },
  {
    type: 'MULTIPLE_SELECT',
    label: 'Multiple-Select Diagnostic Questions',
    supportState: 'SUPPORTED_DETERMINISTIC',
    explanation:
      'Requires selecting all valid conditions and zero invalid distractors; scored deterministically.',
  },
  {
    type: 'NUMERICAL_PROBLEM',
    label: 'Numerical & Quantitative Problem-Solving',
    supportState: 'SUPPORTED_DETERMINISTIC',
    explanation:
      'Validates numeric calculations against exact values or documented rounding tolerances.',
  },
  {
    type: 'SCENARIO_ANALYSIS',
    label: 'Scenario-Based Case Evaluation',
    supportState: 'SUPPORTED_DETERMINISTIC',
    explanation:
      'Evaluates applied decision-making across realistic technical, financial, research, and governance scenarios.',
  },
  {
    type: 'PRACTICAL_PROJECT_SUBMISSION',
    label: 'Practical Project & Deliverable Assessment',
    supportState: 'SUPPORTED_REVIEWER_WORKFLOW',
    explanation:
      'Routes project deliverables directly into the Evidence Ledger & Reviewer Workspace for 6-dimension human rubric evaluation. Automated grading is not claimed.',
  },
  {
    type: 'PORTFOLIO_ASSESSMENT',
    label: 'Portfolio & Case-Study Assessment',
    supportState: 'SUPPORTED_REVIEWER_WORKFLOW',
    explanation:
      'Evaluates creative, architectural, or written portfolios via human reviewer rubric rather than a quiz.',
  },
  {
    type: 'SHORT_WRITTEN_RESPONSE',
    label: 'Short Written / Specification Response',
    supportState: 'SUPPORTED_REVIEWER_WORKFLOW',
    explanation:
      'Submitted written specifications are queued for human reviewer evaluation; WAYFINDER does not use unvalidated automated essay scoring.',
  },
  {
    type: 'CODING_OR_TECHNICAL_EXERCISE',
    label: 'Coding & Technical Repository Exercise',
    supportState: 'SUPPORTED_REVIEWER_WORKFLOW',
    explanation:
      'Students submit a repository or script artifact for reviewer verification alongside deterministic conceptual checks.',
  },
  {
    type: 'SIMULATION_DEMONSTRATION',
    label: 'Interactive Laboratory / Hardware Simulation',
    supportState: 'UNSUPPORTED_IN_CURRENT_RUNTIME',
    explanation:
      'Not currently operational: live hardware/laboratory simulation environments are not configured in this deployment.',
  },
];

export const INITIAL_SKILL_ASSESSMENTS: SkillAssessmentDefinition[] = [
  {
    id: 'ASM_SKL_SQL_V1',
    version: '1.0.0',
    title: 'Relational Data Modelling & SQL Querying Assessment',
    skillId: 'SKL_CS_SQL',
    fieldId: 'FIELD_CS_SW',
    mappedCapabilityId: 'CAP_DATA_ANAL',
    targetProficiencyLevel: 3,
    assessmentType: 'SCENARIO_ANALYSIS',
    supportState: 'SUPPORTED_DETERMINISTIC',
    measurementObjective:
      'Measures conceptual and applied proficiency in SQL filtering, aggregation (GROUP BY / HAVING), JOIN semantics, and relational integrity.',
    instructions:
      'Answer all 4 questions (including single-choice, multiple-select, and numerical calculation items). All items must be answered before submission.',
    estimatedDurationMinutes: 12,
    prerequisiteSkillIds: [],
    scoringRulesSummary:
      'Deterministic scoring across 4 items: 100% (4/4) maps to Level 3 (Proficient), 75% (3/4) maps to Level 2 (Applied), 50% (2/4) maps to Level 1 (Foundational), and <50% maps to Level 0.',
    limitationsNotice:
      'This assessment measures analytical SQL reasoning on structured problems. It does not by itself prove production database migration or performance-tuning competence without reviewed project evidence.',
    accessibilityConsiderations:
      'All schemas and tables are described in plain text and accessible semantic markup; no visual-only diagrams are required.',
    requiresHumanReview: false,
    publicationStatus: 'PUBLISHED',
    items: [
      {
        id: 'SQL_Q1_JOIN',
        questionType: 'SCENARIO_ANALYSIS',
        subtopic: 'LEFT JOIN & NULL Filtering Semantics',
        targetLevel: 2,
        scenarioContext:
          'Table students(id, full_name) has 100 rows. Table evidence_submissions(id, student_id, status) has records for 65 distinct students. You need a query returning ONLY the 35 students who have submitted zero evidence records.',
        prompt: 'Which SQL query structure accurately returns those 35 students?',
        options: [
          {
            id: 'A',
            text: 'SELECT s.id, s.full_name FROM students s INNER JOIN evidence_submissions e ON s.id = e.student_id WHERE e.id IS NULL;',
          },
          {
            id: 'B',
            text: 'SELECT s.id, s.full_name FROM students s LEFT JOIN evidence_submissions e ON s.id = e.student_id WHERE e.id IS NULL;',
          },
          {
            id: 'C',
            text: 'SELECT s.id, s.full_name FROM students s CROSS JOIN evidence_submissions e;',
          },
          {
            id: 'D',
            text: 'SELECT s.id, s.full_name FROM students s WHERE s.id = NULL;',
          },
        ],
      },
      {
        id: 'SQL_Q2_HAVING',
        questionType: 'MULTIPLE_CHOICE',
        subtopic: 'Aggregation & Cohort Suppression Filtering',
        targetLevel: 2,
        prompt:
          'To enforce institutional privacy suppression (k = 5), an analyst must return cohort_id and average gap count ONLY for cohorts with at least 5 students. Which clause filters aggregated group counts after GROUP BY cohort_id?',
        options: [
          { id: 'A', text: 'WHERE COUNT(student_id) >= 5 before GROUP BY' },
          { id: 'B', text: 'HAVING COUNT(DISTINCT student_id) >= 5 after GROUP BY cohort_id' },
          { id: 'C', text: 'ORDER BY COUNT(student_id) >= 5' },
          { id: 'D', text: 'LIMIT 5' },
        ],
      },
      {
        id: 'SQL_Q3_INTEGRITY',
        questionType: 'MULTIPLE_SELECT',
        subtopic: 'Relational Schema & Data Integrity Constraints',
        targetLevel: 3,
        prompt:
          'Select ALL valid PostgreSQL schema constraints that prevent invalid capability levels (outside 0..4) or orphaned student records:',
        options: [
          {
            id: 'A',
            text: 'CHECK (demonstrated_level BETWEEN 0 AND 4) on capability_records',
          },
          {
            id: 'B',
            text: 'FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE',
          },
          {
            id: 'C',
            text: 'Storing all numeric levels as unconstrained free-text comments',
          },
          {
            id: 'D',
            text: 'UNIQUE (student_id, dimension_id, rubric_version) to prevent duplicate capability rows',
          },
        ],
      },
      {
        id: 'SQL_Q4_CARDINALITY',
        questionType: 'NUMERICAL_PROBLEM',
        subtopic: 'Query Result Cardinality Calculation',
        targetLevel: 2,
        prompt:
          'A cohort table has 6 cohorts. 2 cohorts have 3 students each, and 4 cohorts have 8 students each. How many cohorts will be returned by a query that enforces HAVING student_count >= 5?',
        numericalUnitLabel: 'cohorts',
      },
    ],
  },
  {
    id: 'ASM_SKL_API_SW_V1',
    version: '1.0.0',
    title: 'Defensive Software & Server Boundary Engineering Assessment',
    skillId: 'SKL_CS_API_SW',
    fieldId: 'FIELD_CS_SW',
    mappedCapabilityId: 'CAP_PROG_SW',
    targetProficiencyLevel: 3,
    assessmentType: 'SCENARIO_ANALYSIS',
    supportState: 'SUPPORTED_DETERMINISTIC',
    measurementObjective:
      'Evaluates ability to design secure API boundaries, prevent client-side score/role forgery, and handle missing/unknown values safely.',
    instructions:
      'Complete all 4 items covering API authorization, deterministic gap handling, and defensive boundary checks.',
    estimatedDurationMinutes: 12,
    prerequisiteSkillIds: [],
    scoringRulesSummary:
      'Deterministic scoring across 4 items: 100% -> Level 3, 75% -> Level 2, 50% -> Level 1, <50% -> Level 0.',
    limitationsNotice:
      'Measures software engineering reasoning and security boundary design. Production software competence also requires submitting an executable code repository for reviewer audit.',
    accessibilityConsiderations: 'Text-based code and architectural scenarios; fully keyboard navigable.',
    requiresHumanReview: false,
    publicationStatus: 'PUBLISHED',
    items: [
      {
        id: 'SW_Q1_BOUNDARY',
        questionType: 'SCENARIO_ANALYSIS',
        subtopic: 'Server-Side Trust Boundary',
        targetLevel: 3,
        scenarioContext:
          'A client web application submits { "studentId": "u123", "calculatedScore": 100, "awardedLevel": 4 } to an API endpoint after a user finishes a quiz.',
        prompt: 'What is the correct server-side engineering implementation?',
        options: [
          {
            id: 'A',
            text: 'Trust awardedLevel from the request body to save server CPU cycles.',
          },
          {
            id: 'B',
            text: 'Verify the authenticated user token, accept only raw item responses, and compute the score and rubric level on the server using the protected answer key.',
          },
          {
            id: 'C',
            text: 'Base64-encode the answer key inside the frontend JavaScript bundle.',
          },
          {
            id: 'D',
            text: 'Store the score only in browser URL query parameters.',
          },
        ],
      },
      {
        id: 'SW_Q2_NULL_HANDLING',
        questionType: 'MULTIPLE_CHOICE',
        subtopic: 'Null & Unknown State Preservation',
        targetLevel: 2,
        prompt:
          'In TypeScript, if demonstratedLevel is number | null (where null represents Unknown / Unassessed) and requiredLevel is 3, what happens if a developer mistakenly writes Math.max(0, requiredLevel - Number(demonstratedLevel))?',
        options: [
          {
            id: 'A',
            text: 'Number(null) coerces to 0, falsely computing a gap of 3 and treating an unassessed skill as Level 0.',
          },
          {
            id: 'B',
            text: 'Number(null) throws a compile-time syntax error.',
          },
          {
            id: 'C',
            text: 'It automatically returns null.',
          },
          {
            id: 'D',
            text: 'It marks the requirement as DEMONSTRATED.',
          },
        ],
      },
      {
        id: 'SW_Q3_DEFENSIVE_CHECKS',
        questionType: 'MULTIPLE_SELECT',
        subtopic: 'Defensive File & Evidence Upload Validation',
        targetLevel: 3,
        prompt:
          'Select ALL checks that a defensive upload boundary must perform before accepting a submitted evidence file:',
        options: [
          {
            id: 'A',
            text: 'Verify byte size against the active policy limit (e.g., 10 MB or 25 MB).',
          },
          {
            id: 'B',
            text: 'Validate MIME type / file signature against the allowlist.',
          },
          {
            id: 'C',
            text: 'Record truthful malware scan status (never reporting PASSED_PRODUCTION_SCAN when no scanner is configured).',
          },
          {
            id: 'D',
            text: 'Automatically mark the student capability as Level 4 immediately upon file upload before reviewer inspection.',
          },
        ],
      },
      {
        id: 'SW_Q4_RATE_CALC',
        questionType: 'NUMERICAL_PROBLEM',
        subtopic: 'Service Error-Budget Calculation',
        targetLevel: 2,
        prompt:
          'A backend endpoint handles 2,500 requests in an hour. 2,450 succeed (HTTP 200) and 50 fail (HTTP 500). What is the failure rate as a percentage?',
        numericalUnitLabel: '%',
      },
    ],
  },
  {
    id: 'ASM_SKL_FIN_QUANT_V1',
    version: '1.0.0',
    title: 'Quantitative Financial & Ratio Analysis Assessment',
    skillId: 'SKL_FIN_QUANT_ANAL',
    fieldId: 'FIELD_COMMERCE_FIN',
    mappedCapabilityId: 'CAP_NUM_QUANT',
    targetProficiencyLevel: 3,
    assessmentType: 'NUMERICAL_PROBLEM',
    supportState: 'SUPPORTED_DETERMINISTIC',
    measurementObjective:
      'Measures accuracy in computing liquidity ratios, gross/operating margins, and interpreting working-capital constraints.',
    instructions:
      'Complete all 3 quantitative and scenario items. Enter exact numeric values where prompted.',
    estimatedDurationMinutes: 10,
    prerequisiteSkillIds: [],
    scoringRulesSummary:
      'Deterministic scoring across 3 items: 3/3 (100%) -> Level 3, 2/3 (67%) -> Level 2, 1/3 (33%) -> Level 1, 0/3 -> Level 0.',
    limitationsNotice:
      'Tests foundational financial calculation and interpretation. Complex valuation or audit readiness requires submitting a full financial model or audit workpaper for review.',
    accessibilityConsiderations: 'All financial figures are presented inline in accessible text.',
    requiresHumanReview: false,
    publicationStatus: 'PUBLISHED',
    items: [
      {
        id: 'FIN_Q1_MARGIN',
        questionType: 'NUMERICAL_PROBLEM',
        subtopic: 'Operating Margin Calculation',
        targetLevel: 2,
        prompt:
          'An enterprise reports Annual Revenue of 800,000, Cost of Goods Sold (COGS) of 480,000, and Operating Expenses of 200,000. What is the Operating Income (EBIT) Margin as a percentage of revenue?',
        numericalUnitLabel: '%',
      },
      {
        id: 'FIN_Q2_LIQUIDITY',
        questionType: 'SCENARIO_ANALYSIS',
        subtopic: 'Current Ratio vs. Quick Ratio (Acid-Test)',
        targetLevel: 3,
        scenarioContext:
          'A retail firm has Current Assets of 500,000 (of which 350,000 is slow-moving seasonal inventory and 150,000 is cash/receivables) and Current Liabilities of 250,000 due within 30 days.',
        prompt:
          'Why is the Current Ratio (2.0x) misleading if used alone to judge 30-day solvency?',
        options: [
          {
            id: 'A',
            text: 'Because the Quick Ratio (excluding slow-moving inventory) is only 0.6x (150,000 / 250,000), indicating a near-term cash shortfall.',
          },
          {
            id: 'B',
            text: 'Because Current Liabilities are never paid in cash.',
          },
          {
            id: 'C',
            text: 'Because inventory automatically appreciates by 50% in 30 days.',
          },
          {
            id: 'D',
            text: 'Because a Current Ratio of 2.0x guarantees zero bankruptcy risk.',
          },
        ],
      },
      {
        id: 'FIN_Q3_AUDIT',
        questionType: 'MULTIPLE_SELECT',
        subtopic: 'Financial Model & Audit Verification Standards',
        targetLevel: 3,
        prompt:
          'Select ALL practices required for a credible, review-ready financial analysis submission:',
        options: [
          {
            id: 'A',
            text: 'Explicitly separating historical audited figures from forward-looking assumptions.',
          },
          {
            id: 'B',
            text: 'Including sensitivity analysis across conservative, base, and downside scenarios.',
          },
          {
            id: 'C',
            text: 'Hardcoding unverified revenue growth numbers without citing source filings.',
          },
        ],
      },
    ],
  },
  {
    id: 'ASM_SKL_RES_ETHICS_V1',
    version: '1.0.0',
    title: 'Empirical Research Design, Psychometrics & Governance Assessment',
    skillId: 'SKL_PSYCH_RES_ETHICS',
    fieldId: 'FIELD_PSYCH_BEHAV',
    mappedCapabilityId: 'CAP_RESEARCH_SYN',
    targetProficiencyLevel: 3,
    assessmentType: 'SCENARIO_ANALYSIS',
    supportState: 'SUPPORTED_DETERMINISTIC',
    measurementObjective:
      'Measures understanding of construct validity, interest-vs-competence separation, and cohort privacy protection in empirical studies.',
    instructions: 'Answer all 3 items covering psychometric validity and research governance.',
    estimatedDurationMinutes: 10,
    prerequisiteSkillIds: [],
    scoringRulesSummary:
      'Deterministic scoring across 3 items: 3/3 (100%) -> Level 3, 2/3 (67%) -> Level 2, 1/3 (33%) -> Level 1, 0/3 -> Level 0.',
    limitationsNotice:
      'Measures conceptual research methodology and ethics. Conducting independent human-subjects research requires institutional ethics board (IRB/IEC) approval and reviewed study protocols.',
    accessibilityConsiderations: 'Standard text-only scenarios.',
    requiresHumanReview: false,
    publicationStatus: 'PUBLISHED',
    items: [
      {
        id: 'RES_Q1_VALIDITY',
        questionType: 'SCENARIO_ANALYSIS',
        subtopic: 'Construct Validity & Divergent Measures',
        targetLevel: 3,
        scenarioContext:
          'A university career lab administers a 48-item Vocational Interest Inventory (RIASEC) and finds a student scores 90% on Investigative (I) interests.',
        prompt:
          'Which interpretation is psychometrically valid when evaluating the student for a Data Science Research Fellowship?',
        options: [
          {
            id: 'A',
            text: 'The student is automatically certified at Level 4 in statistical data analysis.',
          },
          {
            id: 'B',
            text: 'The score indicates strong intrinsic interest in investigative/analytical environments, while actual statistical capability must be evaluated separately via skill assessment or verified research artifacts.',
          },
          {
            id: 'C',
            text: 'Interest scores and objective skill scores are interchangeable constructs.',
          },
          {
            id: 'D',
            text: 'The student no longer needs to meet mandatory enrollment prerequisites.',
          },
        ],
      },
      {
        id: 'RES_Q2_PRIVACY',
        questionType: 'MULTIPLE_SELECT',
        subtopic: 'Participant Consent & Cohort De-Identification',
        targetLevel: 3,
        prompt:
          'Select ALL safeguards required when publishing or sharing student readiness research data:',
        options: [
          {
            id: 'A',
            text: 'Withhold aggregate subgroup metrics when subgroup size N is below the minimum threshold k = 5.',
          },
          {
            id: 'B',
            text: 'Enforce immediate revocation when a participant revokes a scoped sharing authorisation.',
          },
          {
            id: 'C',
            text: 'Treat general platform sign-up consent as automatic verification of academic standing.',
          },
        ],
      },
      {
        id: 'RES_Q3_COMPLETION',
        questionType: 'NUMERICAL_PROBLEM',
        subtopic: 'Normalized Scale Scoring',
        targetLevel: 2,
        prompt:
          'An 8-item Likert scale uses responses from 1 to 5 (minimum sum = 8, range = 32). If a participant scores 4 on every item (raw sum = 32), what is the normalized percentage ((32 - 8) / 32) * 100?',
        numericalUnitLabel: '%',
      },
    ],
  },
  {
    id: 'ASM_SKL_DESIGN_PORTFOLIO_V1',
    version: '1.0.0',
    title: 'Accessible Interaction Design Case Study & Portfolio Review',
    skillId: 'SKL_DESIGN_WCAG_UX',
    fieldId: 'FIELD_DESIGN_ARCH',
    mappedCapabilityId: 'CAP_PROJ_EXEC',
    targetProficiencyLevel: 3,
    assessmentType: 'PORTFOLIO_ASSESSMENT',
    supportState: 'SUPPORTED_REVIEWER_WORKFLOW',
    measurementObjective:
      'Evaluates end-to-end interaction design execution, WCAG AA accessibility compliance, and design rationale through human reviewer inspection.',
    instructions:
      'Provide the URL to your design case study, interactive prototype, or accessibility audit report, along with a structured summary of your problem statement, user flow, and contrast/keyboard verification. Submitting queues your work in the Evidence Ledger for human reviewer evaluation.',
    estimatedDurationMinutes: 25,
    prerequisiteSkillIds: [],
    scoringRulesSummary:
      'Evaluated by an assigned human reviewer across 6 rubric dimensions (Relevance, Authenticity & Attribution, Sufficiency, Quality, Currency, Context). No automated score is fabricated.',
    limitationsNotice:
      'Remains in EVIDENCE_PENDING_REVIEW status until an authorized reviewer completes the 6-dimension rubric evaluation.',
    accessibilityConsiderations:
      'Submission form supports keyboard navigation and screen-reader labels.',
    requiresHumanReview: true,
    publicationStatus: 'PUBLISHED',
    items: [],
    reviewerTaskPrompt:
      'Submit a design case study or accessible UI prototype demonstrating WCAG AA contrast (4.5:1 body text), keyboard focus states, and responsive layout integrity.',
    expectedDeliverableGuide:
      'Publicly accessible link (Figma case study, live accessible web prototype, or PDF design specification) + written rationale.',
  },
  {
    id: 'ASM_SKL_RESUME_V1',
    version: '1.0.0',
    title: 'Professional Resume Structure, Attribution & ATS Readiness Assessment',
    skillId: 'SKL_CAREER_RESUME_BUILDING',
    fieldId: 'FIELD_BUS_MGMT',
    mappedCapabilityId: 'CAP_TECH_COMM',
    targetProficiencyLevel: 3,
    assessmentType: 'SCENARIO_ANALYSIS',
    supportState: 'SUPPORTED_DETERMINISTIC',
    measurementObjective:
      'Measures mastery of the 10 Resume Building subskills: resume structure, professional summary writing, education/experience/project documentation, truthful skill provenance attribution (Claim vs Assessed vs Verified), ATS-friendly formatting, ethical opportunity tailoring, and quality checking.',
    instructions:
      'Answer all 3 questions covering truthful skill presentation, opportunity-based tailoring ethics, and ATS-compatible achievement documentation.',
    estimatedDurationMinutes: 10,
    prerequisiteSkillIds: [],
    scoringRulesSummary:
      'Deterministic scoring across 3 items: 100% (3/3) maps to Level 3 (Proficient), 67% (2/3) maps to Level 2 (Applied), and 33% (1/3) maps to Level 1 (Foundational).',
    limitationsNotice:
      'Measures conceptual mastery of professional resume construction and attribution rules; apply these principles directly in the WAYFINDER Resume Builder.',
    accessibilityConsiderations:
      'Fully keyboard and screen-reader accessible.',
    requiresHumanReview: false,
    publicationStatus: 'PUBLISHED',
    items: [
      {
        id: 'RESM_Q1_ATTRIBUTION',
        questionType: 'SCENARIO_ANALYSIS',
        subtopic: 'Skills Presentation & Provenance Integrity',
        targetLevel: 2,
        scenarioContext:
          'A student has self-reported Level 3 in Python, completed a WAYFINDER SQL objective assessment at Level 2, and has one reviewer-accepted Evidence Ledger project in Systems Design.',
        prompt:
          'When presenting skills on a WAYFINDER-aligned resume, which approach maintains truthful professional attribution?',
        options: [
          {
            id: 'A',
            text: 'Label all three skills as "Verified Expert Capabilities" to maximize keyword weight.',
          },
          {
            id: 'B',
            text: 'Distinguish self-reported skills from assessed skills and reviewer-verified project evidence, linking the verified artifact URL where applicable.',
          },
          {
            id: 'C',
            text: 'Omit all skills unless they have a formal university degree attached.',
          },
          {
            id: 'D',
            text: 'Copy the target job description’s required skills verbatim into the Skills section regardless of experience.',
          },
        ],
      },
      {
        id: 'RESM_Q2_TAILORING',
        questionType: 'MULTIPLE_SELECT',
        subtopic: 'Ethical Opportunity Tailoring & ATS Formatting',
        targetLevel: 3,
        prompt:
          'Select ALL valid practices when tailoring a resume to a specific target opportunity and formatting for Applicant Tracking Systems (ATS):',
        options: [
          {
            id: 'A',
            text: 'Prioritize relevant existing projects and experience that directly address the opportunity’s required capabilities.',
          },
          {
            id: 'B',
            text: 'Use standard section headings (Education, Experience, Projects, Skills) and clean chronological dates rather than complex multi-column graphics that break text parsing.',
          },
          {
            id: 'C',
            text: 'Automatically insert missing required skills from the job posting even if the candidate has not yet developed them.',
          },
        ],
      },
      {
        id: 'RESM_Q3_COMPLETENESS',
        questionType: 'MULTIPLE_CHOICE',
        subtopic: 'Project & Achievement Documentation',
        targetLevel: 2,
        prompt:
          'What makes a project or experience bullet verifiable rather than an unsupported claim?',
        options: [
          {
            id: 'A',
            text: 'Using vague adjectives like "hardworking visionary team player" without context.',
          },
          {
            id: 'B',
            text: 'Documenting the specific role, methods/technologies used, concrete deliverable produced, and a verifiable repository or portfolio link.',
          },
          {
            id: 'C',
            text: 'Inventing percentage improvements that were never measured.',
          },
        ],
      },
    ],
  },
];

export interface ServerAnswerKeyEntry {
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'NUMERICAL_PROBLEM' | 'SCENARIO_ANALYSIS';
  correctOptionId?: string;
  correctOptionIds?: string[];
  correctNumericValue?: number;
  numericTolerance?: number;
  explanation: string;
}

export const SERVER_SIDE_SKILL_ASSESSMENT_KEYS: Record<
  string,
  Record<string, ServerAnswerKeyEntry>
> = {
  ASM_SKL_SQL_V1: {
    SQL_Q1_JOIN: {
      questionType: 'SCENARIO_ANALYSIS',
      correctOptionId: 'B',
      explanation:
        'A LEFT JOIN preserves all rows from students and pairs unmatched rows with NULL columns from evidence_submissions; filtering WHERE e.id IS NULL isolates students with zero submissions.',
    },
    SQL_Q2_HAVING: {
      questionType: 'MULTIPLE_CHOICE',
      correctOptionId: 'B',
      explanation:
        'HAVING filters groups after GROUP BY aggregation, whereas WHERE filters individual rows before aggregation.',
    },
    SQL_Q3_INTEGRITY: {
      questionType: 'MULTIPLE_SELECT',
      correctOptionIds: ['A', 'B', 'D'],
      explanation:
        'CHECK constraints enforce valid rubric bounds (0..4), FOREIGN KEY enforces referential integrity, and UNIQUE prevents duplicate capability rows per rubric version.',
    },
    SQL_Q4_CARDINALITY: {
      questionType: 'NUMERICAL_PROBLEM',
      correctNumericValue: 4,
      numericTolerance: 0,
      explanation:
        'Only the 4 cohorts with 8 students satisfy student_count >= 5; the 2 cohorts with 3 students are filtered out.',
    },
  },
  ASM_SKL_API_SW_V1: {
    SW_Q1_BOUNDARY: {
      questionType: 'SCENARIO_ANALYSIS',
      correctOptionId: 'B',
      explanation:
        'Client payloads can be modified by users; all scoring and capability level assignments must be computed on a trusted server boundary using authenticated identity and raw responses.',
    },
    SW_Q2_NULL_HANDLING: {
      questionType: 'MULTIPLE_CHOICE',
      correctOptionId: 'A',
      explanation:
        'In JavaScript/TypeScript, Number(null) evaluates to 0, which violates the rule that Unknown (null) must never be treated as Level 0.',
    },
    SW_Q3_DEFENSIVE_CHECKS: {
      questionType: 'MULTIPLE_SELECT',
      correctOptionIds: ['A', 'B', 'C'],
      explanation:
        'Size validation, MIME allowlist validation, and truthful scanner reporting are required; uploading a file never automatically grants Level 4 without reviewer sign-off.',
    },
    SW_Q4_RATE_CALC: {
      questionType: 'NUMERICAL_PROBLEM',
      correctNumericValue: 2,
      numericTolerance: 0.01,
      explanation: '50 failed requests / 2,500 total requests = 0.02 = 2%.',
    },
  },
  ASM_SKL_FIN_QUANT_V1: {
    FIN_Q1_MARGIN: {
      questionType: 'NUMERICAL_PROBLEM',
      correctNumericValue: 15,
      numericTolerance: 0.01,
      explanation:
        'Operating Income = 800,000 - 480,000 - 200,000 = 120,000. Operating Margin = 120,000 / 800,000 = 15%.',
    },
    FIN_Q2_LIQUIDITY: {
      questionType: 'SCENARIO_ANALYSIS',
      correctOptionId: 'A',
      explanation:
        'Excluding 350,000 of slow-moving seasonal inventory leaves 150,000 in liquid assets against 250,000 of near-term liabilities (Quick Ratio = 0.6x).',
    },
    FIN_Q3_AUDIT: {
      questionType: 'MULTIPLE_SELECT',
      correctOptionIds: ['A', 'B'],
      explanation:
        'Credible financial analysis separates historical audited facts from projections and tests sensitivity across scenarios.',
    },
  },
  ASM_SKL_RES_ETHICS_V1: {
    RES_Q1_VALIDITY: {
      questionType: 'SCENARIO_ANALYSIS',
      correctOptionId: 'B',
      explanation:
        'Vocational interest inventories measure intrinsic preference for work environments, not demonstrated technical competence.',
    },
    RES_Q2_PRIVACY: {
      questionType: 'MULTIPLE_SELECT',
      correctOptionIds: ['A', 'B'],
      explanation:
        'k = 5 cohort suppression and immediate sharing revocation protect participant privacy; platform consent never verifies academic standing.',
    },
    RES_Q3_COMPLETION: {
      questionType: 'NUMERICAL_PROBLEM',
      correctNumericValue: 75,
      numericTolerance: 0.01,
      explanation: '((32 - 8) / 32) * 100 = (24 / 32) * 100 = 75%.',
    },
  },
  ASM_SKL_RESUME_V1: {
    RESM_Q1_ATTRIBUTION: {
      questionType: 'SCENARIO_ANALYSIS',
      correctOptionId: 'B',
      explanation:
        'CLAIM != CAPABILITY != PROOF: self-reported skills, assessed skills, and reviewer-verified evidence must remain truthfully distinguished.',
    },
    RESM_Q2_TAILORING: {
      questionType: 'MULTIPLE_SELECT',
      correctOptionIds: ['A', 'B'],
      explanation:
        'Ethical tailoring highlights genuine relevant experience/projects and uses clean ATS-readable headings without inserting unpossessed skills.',
    },
    RESM_Q3_COMPLETENESS: {
      questionType: 'MULTIPLE_CHOICE',
      correctOptionId: 'B',
      explanation:
        'Credible project and experience descriptions state the specific role, tools used, concrete outcome, and verifiable artifact link.',
    },
  },
};

export interface SkillAssessmentValidationResult {
  valid: boolean;
  missingItemIds: string[];
  errorMessage: string | null;
}

export function validateSkillAssessmentResponses(
  assessment: SkillAssessmentDefinition,
  responses: Record<string, string | string[]>
): SkillAssessmentValidationResult {
  if (assessment.requiresHumanReview) {
    const deliverableUrl = (responses['DELIVERABLE_URL'] as string | undefined)?.trim() || '';
    const rationale = (responses['DELIVERABLE_RATIONALE'] as string | undefined)?.trim() || '';
    const missing: string[] = [];
    if (!deliverableUrl) missing.push('DELIVERABLE_URL');
    if (!rationale || rationale.length < 15) missing.push('DELIVERABLE_RATIONALE');
    return {
      valid: missing.length === 0,
      missingItemIds: missing,
      errorMessage:
        missing.length > 0
          ? 'Please provide both a valid deliverable URL and a clear written summary (at least 15 characters) before submitting for human review.'
          : null,
    };
  }

  const missingItemIds: string[] = [];
  for (const item of assessment.items) {
    const val = responses[item.id];
    if (item.questionType === 'MULTIPLE_SELECT') {
      if (!Array.isArray(val) || val.length === 0) {
        missingItemIds.push(item.id);
      }
    } else if (item.questionType === 'NUMERICAL_PROBLEM') {
      if (typeof val !== 'string' || val.trim() === '' || Number.isNaN(Number(val.trim()))) {
        missingItemIds.push(item.id);
      }
    } else {
      if (typeof val !== 'string' || val.trim() === '') {
        missingItemIds.push(item.id);
      }
    }
  }

  return {
    valid: missingItemIds.length === 0,
    missingItemIds,
    errorMessage:
      missingItemIds.length > 0
        ? `Incomplete assessment: please answer all ${assessment.items.length} questions before submitting (${missingItemIds.length} remaining).`
        : null,
  };
}

export function mapPercentageToSkillRubricLevel(
  percentage: number,
  maxTargetLevel: RubricLevel
): RubricLevel {
  let rawLevel: RubricLevel = 0;
  if (percentage >= 90) rawLevel = 3;
  else if (percentage >= 70) rawLevel = 2;
  else if (percentage >= 45) rawLevel = 1;
  else rawLevel = 0;

  return Math.min(rawLevel, maxTargetLevel) as RubricLevel;
}
