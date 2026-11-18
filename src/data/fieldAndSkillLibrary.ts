import { FieldCategory, SkillCatalogueEntry } from '../types/wayfinder';

/**
 * STAGE A — FIELD & SKILL LIBRARY
 * Supports all 18 required initial academic, technical, professional, creative, and trade categories.
 * Clearly distinguishes categories with initial populated skills/assessments from extensible categories awaiting curation.
 */

export const INITIAL_FIELD_CATEGORIES: FieldCategory[] = [
  {
    id: 'FIELD_CS_SW',
    name: 'Computer Science and Software Development',
    shortName: 'CS & Software',
    description:
      'Computer Science, Information Technology, Artificial Intelligence, Data Science, Cybersecurity, and full-stack software engineering.',
    specializations: [
      'Computer Science',
      'Information Technology',
      'Artificial Intelligence',
      'Data Science',
      'Cybersecurity',
      'Backend & API Engineering',
      'Database Systems & SQL',
      'Frontend & Web Architecture',
    ],
    catalogueCoverageNote:
      'Initial validated skills, objective assessments, and curated learning resources populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_ENG_TECH',
    name: 'Engineering and Technology',
    shortName: 'Engineering & Tech',
    description:
      'Systems engineering, Robotics, Mechatronics, Biotechnology, Chemical Engineering, and applied industrial workflows.',
    specializations: [
      'Systems Engineering',
      'Robotics',
      'Mechatronics',
      'Biotechnology',
      'Chemical Engineering',
      'Quality & Reliability Analysis',
      'Industrial Automation',
      'Technical Project Delivery',
    ],
    catalogueCoverageNote:
      'Initial systems design and quantitative reliability skills populated; extensible for specialized branches.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_EEE',
    name: 'Electronics and Electrical Engineering',
    shortName: 'Electrical & Electronics',
    description:
      'Electronics and Communication Engineering (ECE), Electrical and Electronics Engineering (EEE), embedded systems, and power systems.',
    specializations: [
      'Electronics and Communication Engineering',
      'Electrical and Electronics Engineering',
      'Embedded Systems & Firmware',
      'Circuit & Signal Analysis',
      'Power & Control Systems',
      'VLSI & Digital Logic',
    ],
    catalogueCoverageNote:
      'Initial digital logic & embedded systems skill mapped; additional laboratory assessments require curator expansion.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_MECH_CIVIL',
    name: 'Mechanical and Civil Engineering',
    shortName: 'Mechanical & Civil',
    description:
      'Mechanical Engineering, Civil Engineering, Automobile Engineering, structural mechanics, thermodynamics, and CAD/CAE modelling.',
    specializations: [
      'Mechanical Engineering',
      'Civil Engineering',
      'Automobile Engineering',
      'Structural & Geotechnical Analysis',
      'Thermal & Fluid Systems',
      'CAD & Manufacturing Design',
      'Construction & Project Management',
    ],
    catalogueCoverageNote:
      'Taxonomy and structural/CAD portfolio skill defined; domain-specific simulation assessments are not yet configured.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_PSYCH_BEHAV',
    name: 'Psychology and Behavioural Sciences',
    shortName: 'Psychology & Behavioural',
    description:
      'General, Clinical, Counselling, Organisational, Educational, and Research Psychology, Behavioural Science, Neuroscience, Social Work, and Sociology.',
    specializations: [
      'General Psychology',
      'Clinical Psychology',
      'Counselling Psychology',
      'Organisational Psychology',
      'Educational Psychology',
      'Research Psychology',
      'Behavioural Science',
      'Neuroscience',
      'Social Work',
      'Sociology',
      'Research Methods & Psychometrics',
    ],
    catalogueCoverageNote:
      'Initial research methodology, psychometrics, and behavioural ethics skills and assessments populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_COMMERCE_FIN',
    name: 'Commerce, Accounting, and Finance',
    shortName: 'Commerce & Finance',
    description:
      'Finance, Accounting, Economics, financial statement analysis, managerial accounting, quantitative risk modelling, and audit compliance.',
    specializations: [
      'Finance',
      'Accounting',
      'Economics',
      'Financial Analysis & Valuation',
      'Accounting & Audit Controls',
      'Quantitative Finance',
      'Taxation & Regulatory Compliance',
    ],
    catalogueCoverageNote:
      'Initial financial ratio & quantitative analysis skill, assessment, and open textbooks populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_BUS_MGMT',
    name: 'Business, Management, and Entrepreneurship',
    shortName: 'Business & Management',
    description:
      'Business Administration, Marketing, Digital Marketing, Human Resources, Entrepreneurship, Business Analytics, and Operations & Supply Chain.',
    specializations: [
      'Business Administration',
      'Marketing',
      'Digital Marketing',
      'Human Resources',
      'Entrepreneurship',
      'Business Analytics',
      'Operations and Supply Chain',
      'Project & Operations Management',
      'Professional & Career Communication',
    ],
    catalogueCoverageNote:
      'Initial project execution and structured business communication skills populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_MED_HEALTH',
    name: 'Medicine and Healthcare',
    shortName: 'Medicine & Healthcare',
    description:
      'Medicine, Nursing, Pharmacy, Physiotherapy, Public Health, Medical Laboratory Science, Nutrition, Biotechnology, and Healthcare Administration.',
    specializations: [
      'Medicine',
      'Nursing',
      'Pharmacy',
      'Physiotherapy',
      'Public Health',
      'Medical Laboratory Science',
      'Nutrition',
      'Biotechnology',
      'Healthcare Administration',
      'Clinical Research & Biostatistics',
    ],
    catalogueCoverageNote:
      'Biostatistics & clinical evidence synthesis skill mapped; clinical licensing exams are outside platform scope.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_LAW_LEGAL',
    name: 'Law and Legal Studies',
    shortName: 'Law & Legal Studies',
    description:
      'Statutory interpretation, regulatory & privacy compliance, legal research synthesis, and structured argumentation.',
    specializations: [
      'Law',
      'Technology & Data Privacy Law',
      'Legal Research & Brief Writing',
      'Corporate & Contract Governance',
      'Constitutional & Administrative Law',
    ],
    catalogueCoverageNote:
      'Initial data governance, privacy compliance, and structured legal synthesis skills populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_ARTS_HUM',
    name: 'Arts, Humanities, and Languages',
    shortName: 'Arts & Humanities',
    description:
      'Critical textual analysis, Music and Performing Arts, historical & archival research, comparative linguistics, and editorial writing.',
    specializations: [
      'Music and Performing Arts',
      'Critical Analysis & Rhetoric',
      'Archival & Historical Research',
      'Applied Linguistics & Translation',
      'Philosophy & Ethics',
    ],
    catalogueCoverageNote:
      'Taxonomy and critical synthesis skill defined; evaluated primarily through reviewed writing portfolios.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_MEDIA_COMM',
    name: 'Media, Communication, and Journalism',
    shortName: 'Media & Journalism',
    description:
      'Journalism, Content Writing, Advertising, Filmmaking, Photography, investigative fact-checking, and technical & public communication.',
    specializations: [
      'Journalism',
      'Content Writing',
      'Advertising',
      'Filmmaking',
      'Photography',
      'Technical & Science Communication',
      'Investigative Fact-Checking',
    ],
    catalogueCoverageNote:
      'Initial structured technical & public communication skill and assessment populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_DESIGN_ARCH',
    name: 'Design, Architecture, and Creative Disciplines',
    shortName: 'Design & Architecture',
    description:
      'Graphic Design, UI/UX Design, Animation, Game Design, Architecture, accessibility standards (WCAG), and portfolio curation.',
    specializations: [
      'Graphic Design',
      'UI/UX Design',
      'Animation',
      'Game Design',
      'Architecture',
      'UI/UX & Accessible Interaction Design',
      'Industrial & Product Design',
    ],
    catalogueCoverageNote:
      'Initial accessible interaction design and portfolio review workflow populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_AGRI_ENV',
    name: 'Agriculture and Environmental Sciences',
    shortName: 'Agriculture & Environment',
    description:
      'Agriculture, Environmental Science, environmental data monitoring, sustainable agronomy, ecological modelling, and resource conservation.',
    specializations: [
      'Agriculture',
      'Environmental Science',
      'Environmental Data & GIS Analysis',
      'Sustainable Agronomy',
      'Climate & Ecological Modelling',
      'Water & Soil Resource Management',
    ],
    catalogueCoverageNote:
      'Initial environmental dataset analysis skill mapped; specialized field-work rubrics awaiting curation.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_EDU_TEACH',
    name: 'Education and Teaching',
    shortName: 'Education & Teaching',
    description:
      'Education, Vocational Education, instructional design, rubric-based assessment design, inclusive pedagogy, and learning analytics.',
    specializations: [
      'Education',
      'Vocational Education',
      'Curriculum & Instructional Design',
      'Educational Assessment & Rubrics',
      'Accessible & Inclusive Pedagogy',
      'Educational Technology',
    ],
    catalogueCoverageNote:
      'Instructional & rubric design skill mapped; evaluated via lesson-plan and rubric portfolio review.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_HOSP_TOUR',
    name: 'Hospitality and Tourism',
    shortName: 'Hospitality & Tourism',
    description:
      'Hospitality, Tourism, service operations planning, event logistics, quality assurance, and sustainable tourism management.',
    specializations: [
      'Hospitality',
      'Tourism',
      'Service Operations & Logistics',
      'Hospitality Financial Controls',
      'Event & Venue Coordination',
      'Sustainable Tourism Operations',
    ],
    catalogueCoverageNote:
      'Taxonomy category registered; awaiting domain-specific skill and resource curation.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_TRADES_TECH',
    name: 'Skilled Trades and Technical Occupations',
    shortName: 'Skilled Trades & Technical',
    description:
      'Skilled Trades, Vocational Education, diagnostic troubleshooting, safety & regulatory compliance, precision measurement, and technical schematics.',
    specializations: [
      'Skilled Trades',
      'Vocational Education',
      'Diagnostic Troubleshooting & Maintenance',
      'Safety Protocols & Regulatory Compliance',
      'Technical Schematics & Blueprint Reading',
      'Instrumentation & Calibration',
    ],
    catalogueCoverageNote:
      'Initial diagnostic troubleshooting skill mapped; hands-on practical verification requires workplace/lab attestation.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_RESEARCH_ACAD',
    name: 'Research and Academic Careers',
    shortName: 'Research & Academia',
    description:
      'Research, literature synthesis, reproducible methodology, peer-review standards, and statistical hypothesis testing.',
    specializations: [
      'Research',
      'Literature Synthesis & Systematic Review',
      'Experimental & Empirical Methodology',
      'Reproducible Data & Code Publishing',
      'Academic Writing & Peer Review',
    ],
    catalogueCoverageNote:
      'Initial research synthesis and empirical methodology skills, assessments, and OER resources populated.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'FIELD_PUBLIC_SERV',
    name: 'Public Service and Other Professional Pathways',
    shortName: 'Public Service & Policy',
    description:
      'Public Administration, policy evaluation, civic data governance, program auditing, and ethical administrative standards.',
    specializations: [
      'Public Administration',
      'Policy Analysis & Program Evaluation',
      'Public Sector Data & Privacy Governance',
      'Civic Service Delivery',
      'Regulatory Impact Assessment',
    ],
    catalogueCoverageNote:
      'Initial policy evaluation and privacy governance skill mapped; extensible for civil-service tracks.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
];

export const INITIAL_SKILL_CATALOGUE: SkillCatalogueEntry[] = [
  {
    id: 'SKL_CS_SQL',
    name: 'Relational Data Modelling & SQL Querying',
    description:
      'Writing accurate SELECT queries, filtering, joins, aggregations (GROUP BY / HAVING), and enforcing relational integrity constraints.',
    fieldId: 'FIELD_CS_SW',
    specialization: 'Database Systems & SQL',
    skillCategory: 'TECHNICAL_KNOWLEDGE',
    mappedCapabilityId: 'CAP_DATA_ANAL',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE',
    assessmentMethodExplanation:
      'Foundational and applied knowledge (Levels 1–3) can be assessed via deterministic SQL & schema questions; production readiness requires a verified schema/query repository in the Evidence Ledger.',
    associatedResourceIds: ['RES_PG_DOCS_SQL', 'RES_CS50_SQL_YT', 'RES_SQL_PRACTICE_PROJ'],
    evidenceRequirements:
      'SQL schema migration script, documented query benchmarks, or analytical notebook with test dataset results.',
    relatedOpportunityNotes:
      'Frequently required for data analyst internships, backend engineering roles, and empirical research fellowships.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_CS_API_SW',
    name: 'Defensive Software & API Implementation',
    description:
      'Designing type-safe modules, validating untrusted inputs at server boundaries, handling failure states deterministically, and writing automated unit tests.',
    fieldId: 'FIELD_CS_SW',
    specialization: 'Backend & API Engineering',
    skillCategory: 'PRACTICAL_EXECUTION',
    mappedCapabilityId: 'CAP_PROG_SW',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE',
    assessmentMethodExplanation:
      'Objective assessment measures defensive engineering concepts and boundary validation; higher proficiency levels require an audited code repository with passing tests.',
    associatedResourceIds: ['RES_MDN_HTTP_API', 'RES_OWASP_TOP10', 'RES_MIT_MISSING_SEMESTER_YT'],
    evidenceRequirements:
      'Source repository link containing clean TypeScript/Python/Java implementation, input validation, and automated test suite.',
    relatedOpportunityNotes:
      'Core requirement for software engineering internships, open-source fellowships, and technical competitions.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_ENG_SYS_ARCH',
    name: 'Systems Decomposition & Fault-Tolerant Architecture',
    description:
      'Decomposing complex socio-technical workflows into modular boundaries, identifying single points of failure, and documenting architecture decision records (ADRs).',
    fieldId: 'FIELD_ENG_TECH',
    specialization: 'Systems Engineering',
    skillCategory: 'CONCEPTUAL_UNDERSTANDING',
    mappedCapabilityId: 'CAP_SYS_DESIGN',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: ['SKL_CS_API_SW'],
    assessmentAvailable: true,
    assessmentMethod: 'SCENARIO_AND_REVIEWED_EVIDENCE',
    assessmentMethodExplanation:
      'Scenario assessment checks failure-mode reasoning; full Level 3–4 demonstration requires a reviewer-verified Architecture Decision Record (ADR) and system diagram.',
    associatedResourceIds: ['RES_NIST_SYS_ENG', 'RES_ADR_GITHUB_GUIDE'],
    evidenceRequirements:
      'Architecture Decision Record (ADR), component boundary specification, and failure-mode mitigation matrix.',
    relatedOpportunityNotes:
      'Required for systems engineering roles, cloud architecture pathways, and senior capstone projects.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_FIN_QUANT_ANAL',
    name: 'Quantitative Financial & Ratio Analysis',
    description:
      'Calculating liquidity, margin, and return ratios, interpreting cash-flow sustainability, and evaluating sensitivity under conservative assumptions.',
    fieldId: 'FIELD_COMMERCE_FIN',
    specialization: 'Financial Analysis & Valuation',
    skillCategory: 'ANALYTICAL_REASONING',
    mappedCapabilityId: 'CAP_NUM_QUANT',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE',
    assessmentMethodExplanation:
      'Numerical & scenario assessment verifies quantitative calculation accuracy; practical demonstration requires an audited financial model or valuation memo.',
    associatedResourceIds: ['RES_OPENSTAX_FINANCE', 'RES_MIT_FINANCE_THEORY_YT'],
    evidenceRequirements:
      'Reproducible financial model or accounting analysis report with explicit assumptions and sensitivity tables.',
    relatedOpportunityNotes:
      'Core requirement for finance internships, commerce analyst roles, and venture case competitions.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_PSYCH_RES_ETHICS',
    name: 'Empirical Research Design, Psychometrics & Ethics',
    description:
      'Formulating falsifiable hypotheses, evaluating construct validity and reliability, protecting participant privacy (k-anonymity / informed consent), and avoiding p-hacking.',
    fieldId: 'FIELD_PSYCH_BEHAV',
    specialization: 'Research Methods & Psychometrics',
    skillCategory: 'ETHICS_AND_GOVERNANCE',
    mappedCapabilityId: 'CAP_RESEARCH_SYN',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE',
    assessmentMethodExplanation:
      'Objective scenario & multi-select assessment evaluates research design and ethical safeguards; full demonstration requires a reviewed study protocol or literature synthesis.',
    associatedResourceIds: ['RES_OPENSTAX_PSYCH_RES', 'RES_STAT_QUEST_STATS_YT'],
    evidenceRequirements:
      'Pre-registered study protocol, psychometric validation report, or systematic literature synthesis with methodology rubric.',
    relatedOpportunityNotes:
      'Essential for psychology labs, behavioural science fellowships, UX research roles, and academic tracks.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_COMM_TECH_SPEC',
    name: 'Structured Technical & Professional Specification Writing',
    description:
      'Authoring clear, unambiguous specifications, policy briefs, and analytical reports that separate verified facts from unverified claims.',
    fieldId: 'FIELD_MEDIA_COMM',
    specialization: 'Technical & Science Communication',
    skillCategory: 'COMMUNICATION',
    mappedCapabilityId: 'CAP_TECH_COMM',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'SCENARIO_AND_REVIEWED_EVIDENCE',
    assessmentMethodExplanation:
      'Objective assessment tests precision and claim-vs-proof reasoning; higher proficiency requires human review of an authored specification or briefing document.',
    associatedResourceIds: ['RES_GOOGLE_TECH_WRITING', 'RES_PLAIN_LANGUAGE_GOV'],
    evidenceRequirements:
      'Authored technical specification, research brief, or policy memorandum evaluated against clarity, attribution, and evidence standards.',
    relatedOpportunityNotes:
      'Applicable across engineering, journalism, law, public policy, and consulting opportunities.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_DESIGN_WCAG_UX',
    name: 'Accessible Interaction Design & Portfolio Curation',
    description:
      'Designing user interfaces that meet WCAG AA contrast, keyboard navigation, and non-visual accessibility requirements, backed by user-flow rationale.',
    fieldId: 'FIELD_DESIGN_ARCH',
    specialization: 'UI/UX & Accessible Interaction Design',
    skillCategory: 'CREATIVE_WORK',
    mappedCapabilityId: 'CAP_PROJ_EXEC',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'PORTFOLIO_OR_PROJECT_REVIEW_ONLY',
    assessmentMethodExplanation:
      'Creative and interaction design quality cannot be validly reduced to a multiple-choice quiz alone; requires a structured portfolio/project submission evaluated by a human reviewer.',
    associatedResourceIds: ['RES_W3C_WCAG_GUIDE', 'RES_DESIGN_ACCESSIBILITY_PROJ'],
    evidenceRequirements:
      'Interactive prototype or design case study documenting problem statement, accessibility contrast/keyboard audit, and iteration outcomes.',
    relatedOpportunityNotes:
      'Required for product design internships, frontend UI engineering roles, and architecture/creative showcases.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_LAW_PRIVACY_GOV',
    name: 'Data Protection, Privacy Law & Institutional Governance',
    description:
      'Applying purpose limitation, revocable consent, k-anonymity cohort suppression, and access-control auditing in digital and institutional systems.',
    fieldId: 'FIELD_LAW_LEGAL',
    specialization: 'Technology & Data Privacy Law',
    skillCategory: 'ETHICS_AND_GOVERNANCE',
    mappedCapabilityId: 'CAP_ETHICS_GOV',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE',
    assessmentMethodExplanation:
      'Scenario and multiple-select assessment evaluates privacy and governance rules; Level 3+ requires a reviewed Data Protection Impact Assessment (DPIA) or compliance audit.',
    associatedResourceIds: ['RES_NIST_PRIVACY_FRAMEWORK'],
    evidenceRequirements:
      'Data Protection Impact Assessment (DPIA), access-control matrix, or regulatory compliance memo.',
    relatedOpportunityNotes:
      'Relevant to legal tech fellowships, public policy internships, healthcare informatics, and cybersecurity governance.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_EEE_DIGITAL_EMBEDDED',
    name: 'Digital Logic & Embedded System Diagnostics',
    description:
      'Analysing combinational/sequential logic, microcontroller I/O timing, and fault isolation in hardware-software interfaces.',
    fieldId: 'FIELD_EEE',
    specialization: 'Embedded Systems & Firmware',
    skillCategory: 'TECHNICAL_KNOWLEDGE',
    mappedCapabilityId: 'CAP_PROB_SOLV',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: false,
    assessmentMethod: 'PRACTICAL_DEMONSTRATION_REQUIRED',
    assessmentMethodExplanation:
      'Validated hardware/firmware assessment items are not yet published in this catalogue version; demonstrate capability by submitting lab schematics, logic-analyzer captures, or firmware repositories to the Evidence Ledger.',
    associatedResourceIds: ['RES_MIT_CIRCUITS_OER'],
    evidenceRequirements:
      'Firmware source code, circuit schematic, oscilloscope/logic-analyzer capture, or lab verification report.',
    relatedOpportunityNotes:
      'Relevant to embedded engineering internships, robotics competitions, and hardware R&D roles.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_TRADES_DIAGNOSTICS',
    name: 'Systematic Fault Isolation & Safety Compliance',
    description:
      'Following lockout/tagout and diagnostic isolation trees to identify root causes in technical equipment without violating safety protocols.',
    fieldId: 'FIELD_TRADES_TECH',
    specialization: 'Diagnostic Troubleshooting & Maintenance',
    skillCategory: 'PRACTICAL_EXECUTION',
    mappedCapabilityId: 'CAP_PROB_SOLV',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: false,
    assessmentMethod: 'PRACTICAL_DEMONSTRATION_REQUIRED',
    assessmentMethodExplanation:
      'Hands-on trade and equipment safety skills cannot be certified by an online quiz; requires supervised workshop verification or logged diagnostic reports in the Evidence Ledger.',
    associatedResourceIds: [],
    evidenceRequirements:
      'Signed workshop inspection log, diagnostic root-cause report, or accredited trade safety attestation.',
    relatedOpportunityNotes:
      'Relevant to technical apprenticeships, industrial maintenance roles, and field engineering pathways.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
  {
    id: 'SKL_CAREER_RESUME_BUILDING',
    name: 'Professional Resume Architecture, Evidence Attribution & Opportunity Tailoring',
    description:
      'Structuring truthful, ATS-friendly professional resumes across 10 core subskills: (1) understanding resume structure, (2) professional summary writing, (3) education presentation, (4) experience documentation, (5) skills presentation distinguishing claims vs assessed vs verified capabilities, (6) achievement writing, (7) project description with artifact links, (8) ATS-friendly formatting, (9) opportunity-specific tailoring without fabricating unpossessed skills, and (10) proofreading and quality checking.',
    fieldId: 'FIELD_BUS_MGMT',
    specialization: 'Professional & Career Communication',
    skillCategory: 'COMMUNICATION',
    mappedCapabilityId: 'CAP_TECH_COMM',
    relevantProficiencyLevels: [1, 2, 3, 4],
    prerequisiteSkillIds: [],
    assessmentAvailable: true,
    assessmentMethod: 'OBJECTIVE_ASSESSMENT_AND_EVIDENCE',
    assessmentMethodExplanation:
      'Objective scenario & multi-select assessment evaluates resume structure, truthful skill attribution (CLAIM != CAPABILITY != PROOF), ATS formatting, and ethical opportunity tailoring; full demonstration is supported by completing a verified resume draft in the WAYFINDER Resume Builder.',
    associatedResourceIds: ['RES_RESUME_HARVARD_GUIDE', 'RES_RESUME_ATS_PROJECT'],
    evidenceRequirements:
      'Completed, completeness-checked professional resume with verifiable project/evidence links and truthful capability attribution.',
    relatedOpportunityNotes:
      'Foundational across all internships, graduate programmes, fellowships, research roles, and entry-level applications.',
    version: '1.0.0',
    publicationStatus: 'PUBLISHED',
  },
];

export function getFieldById(
  fieldId: string,
  fields: FieldCategory[] = INITIAL_FIELD_CATEGORIES
): FieldCategory | undefined {
  return fields.find((f) => f.id === fieldId);
}

export function getSkillById(
  skillId: string,
  skills: SkillCatalogueEntry[] = INITIAL_SKILL_CATALOGUE
): SkillCatalogueEntry | undefined {
  return skills.find((s) => s.id === skillId);
}
