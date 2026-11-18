import { CapabilityDimensionId, RubricLevel } from '../types/wayfinder';

export interface CapabilityDimensionMeta {
  id: CapabilityDimensionId;
  name: string;
  shortCode: string;
  category: 'Quantitative & Analytical' | 'Technical & Systems' | 'Execution & Governance';
  description: string;
}

export const CANONICAL_CAPABILITY_DIMENSIONS: CapabilityDimensionMeta[] = [
  {
    id: 'CAP_NUM_QUANT',
    name: 'Numerical & Quantitative Analysis',
    shortCode: 'NUM',
    category: 'Quantitative & Analytical',
    description:
      'Interpreting quantitative metrics, statistical distributions, error bounds, and rate calculations.',
  },
  {
    id: 'CAP_TECH_COMM',
    name: 'Technical & Structured Communication',
    shortCode: 'COM',
    category: 'Execution & Governance',
    description:
      'Writing unambiguous specifications, architecture decision records, and evidence-backed technical reports.',
  },
  {
    id: 'CAP_SYS_DESIGN',
    name: 'Systems Thinking & Architecture Design',
    shortCode: 'SYS',
    category: 'Technical & Systems',
    description:
      'Decomposing complex workflows into modular, fault-tolerant, and secure architectural boundaries.',
  },
  {
    id: 'CAP_PROG_SW',
    name: 'Software & Algorithmic Implementation',
    shortCode: 'SW',
    category: 'Technical & Systems',
    description:
      'Implementing maintainable, type-safe software and data structures with automated verification.',
  },
  {
    id: 'CAP_DATA_ANAL',
    name: 'Data Modelling & Empirical Evaluation',
    shortCode: 'DAT',
    category: 'Quantitative & Analytical',
    description:
      'Designing relational schemas, writing analytical queries, and validating data integrity invariants.',
  },
  {
    id: 'CAP_PROB_SOLV',
    name: 'Structured Problem Solving & Debugging',
    shortCode: 'PRB',
    category: 'Quantitative & Analytical',
    description:
      'Isolating root causes, formulating testable hypotheses, and resolving multi-variable defects.',
  },
  {
    id: 'CAP_TEAM_COLLAB',
    name: 'Collaborative Engineering & Code Review',
    shortCode: 'COL',
    category: 'Execution & Governance',
    description:
      'Coordinating across multi-role teams, conducting constructive reviews, and maintaining shared standards.',
  },
  {
    id: 'CAP_PROJ_EXEC',
    name: 'Project Delivery & Milestone Execution',
    shortCode: 'PRJ',
    category: 'Execution & Governance',
    description:
      'Scoping deliverables, tracking risks, and shipping verifiable artifacts under time constraints.',
  },
  {
    id: 'CAP_ETHICS_GOV',
    name: 'Security, Privacy & Ethical Governance',
    shortCode: 'SEC',
    category: 'Execution & Governance',
    description:
      'Enforcing least-privilege access, data minimisation, cohort suppression, and truthful system reporting.',
  },
  {
    id: 'CAP_RESEARCH_SYN',
    name: 'Domain Research & Evidence Synthesis',
    shortCode: 'RES',
    category: 'Quantitative & Analytical',
    description:
      'Synthesising primary specifications, reconciling conflicting requirements, and documenting constraints.',
  },
];

export const RUBRIC_V1_ANCHORS: Record<RubricLevel, { label: string; description: string }> = {
  0: {
    label: 'Level 0 — Novice / Unfamiliar',
    description: 'Has not yet applied concepts in structured tasks; requires full walkthroughs.',
  },
  1: {
    label: 'Level 1 — Foundational',
    description: 'Understands core terminology and executes basic well-defined steps with guidance.',
  },
  2: {
    label: 'Level 2 — Applied Practitioner',
    description:
      'Independently completes standard tasks and debugs routine edge cases using documented patterns.',
  },
  3: {
    label: 'Level 3 — Proficient Contributor',
    description:
      'Designs end-to-end solutions, validates invariants, and produces review-ready evidence artifacts.',
  },
  4: {
    label: 'Level 4 — Advanced / Lead',
    description:
      'Architects complex systems, establishes verification benchmarks, and resolves ambiguous domain trade-offs.',
  },
};

export function getCapabilityDimensionName(id: CapabilityDimensionId): string {
  return CANONICAL_CAPABILITY_DIMENSIONS.find((d) => d.id === id)?.name || id;
}
