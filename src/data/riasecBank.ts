import { RiasecDomain } from '../types/wayfinder';

export interface RiasecItem {
  id: string;
  domain: RiasecDomain;
  prompt: string;
}

export const RIASEC_DOMAIN_LABELS: Record<RiasecDomain, string> = {
  R: 'Realistic (Practical, Hands-On, Tool & System Building)',
  I: 'Investigative (Analytical, Scientific, Research & Root-Cause)',
  A: 'Artistic (Design, Expressive, Conceptual & UX Synthesis)',
  S: 'Social (Collaborative, Mentoring, Human-Centred Support)',
  E: 'Enterprising (Initiative, Product Strategy & Leadership)',
  C: 'Conventional (Structured, Quality Assurance, Data & Governance)',
};

export const RIASEC_ITEMS: RiasecItem[] = [
  // Realistic (R) — 8 items
  { id: 'WF_RIA_R01', domain: 'R', prompt: 'Configure, test, and troubleshoot physical hardware or cloud server infrastructure.' },
  { id: 'WF_RIA_R02', domain: 'R', prompt: 'Build working prototypes, embedded devices, or automated deployment pipelines.' },
  { id: 'WF_RIA_R03', domain: 'R', prompt: 'Operate precision instruments, diagnostic tools, or laboratory equipment.' },
  { id: 'WF_RIA_R04', domain: 'R', prompt: 'Assemble and benchmark network systems or industrial sensors under load.' },
  { id: 'WF_RIA_R05', domain: 'R', prompt: 'Perform hands-on root-cause repair of mechanical, electrical, or computing systems.' },
  { id: 'WF_RIA_R06', domain: 'R', prompt: 'Construct reproducible field test rigs and measure real-world performance metrics.' },
  { id: 'WF_RIA_R07', domain: 'R', prompt: 'Optimize low-level system resources, memory usage, or hardware throughput.' },
  { id: 'WF_RIA_R08', domain: 'R', prompt: 'Maintain operational reliability of production machinery or distributed servers.' },

  // Investigative (I) — 8 items
  { id: 'WF_RIA_I01', domain: 'I', prompt: 'Analyze complex datasets to uncover statistical anomalies and causal patterns.' },
  { id: 'WF_RIA_I02', domain: 'I', prompt: 'Formulate and test formal hypotheses to solve algorithmic or scientific problems.' },
  { id: 'WF_RIA_I03', domain: 'I', prompt: 'Read peer-reviewed technical literature to synthesize state-of-the-art methods.' },
  { id: 'WF_RIA_I04', domain: 'I', prompt: 'Design controlled experiments to evaluate model accuracy and system edge cases.' },
  { id: 'WF_RIA_I05', domain: 'I', prompt: 'Investigate security vulnerabilities, mathematical proofs, or failure modes.' },
  { id: 'WF_RIA_I06', domain: 'I', prompt: 'Develop computational simulations to model complex real-world phenomena.' },
  { id: 'WF_RIA_I07', domain: 'I', prompt: 'Evaluate trade-offs between competing algorithmic complexities and architectures.' },
  { id: 'WF_RIA_I08', domain: 'I', prompt: 'Conduct deep diagnostic investigations into non-obvious software or data defects.' },

  // Artistic (A) — 8 items
  { id: 'WF_RIA_A01', domain: 'A', prompt: 'Design intuitive user interfaces, visual systems, and interactive digital experiences.' },
  { id: 'WF_RIA_A02', domain: 'A', prompt: 'Create original conceptual frameworks, narratives, or multimedia presentations.' },
  { id: 'WF_RIA_A03', domain: 'A', prompt: 'Translate abstract human needs into expressive architectural or product concepts.' },
  { id: 'WF_RIA_A04', domain: 'A', prompt: 'Craft clear, compelling visual data stories and information graphics.' },
  { id: 'WF_RIA_A05', domain: 'A', prompt: 'Experiment with novel interaction paradigms, motion design, or creative coding.' },
  { id: 'WF_RIA_A06', domain: 'A', prompt: 'Write original technical articles, documentation narratives, or design essays.' },
  { id: 'WF_RIA_A07', domain: 'A', prompt: 'Reimagine legacy workflows into clean, accessible, human-centered experiences.' },
  { id: 'WF_RIA_A08', domain: 'A', prompt: 'Synthesize diverse aesthetic and functional perspectives into a cohesive design.' },

  // Social (S) — 8 items
  { id: 'WF_RIA_S01', domain: 'S', prompt: 'Mentor peers through technical roadblocks and explain complex concepts clearly.' },
  { id: 'WF_RIA_S02', domain: 'S', prompt: 'Facilitate collaborative workshops, retrospectives, or cross-functional team reviews.' },
  { id: 'WF_RIA_S03', domain: 'S', prompt: 'Conduct empathetic user interviews to understand accessibility and community needs.' },
  { id: 'WF_RIA_S04', domain: 'S', prompt: 'Provide constructive, rubric-aligned feedback to help others build their capabilities.' },
  { id: 'WF_RIA_S05', domain: 'S', prompt: 'Coordinate inclusive learning communities, study groups, or open-source onboarding.' },
  { id: 'WF_RIA_S06', domain: 'S', prompt: 'Bridge communication gaps between technical engineers and non-technical stakeholders.' },
  { id: 'WF_RIA_S07', domain: 'S', prompt: 'Support teammates during high-pressure project milestones and resolve interpersonal friction.' },
  { id: 'WF_RIA_S08', domain: 'S', prompt: 'Design educational guides or training modules that empower learners to succeed.' },

  // Enterprising (E) — 8 items
  { id: 'WF_RIA_E01', domain: 'E', prompt: 'Lead project roadmaps, prioritize deliverables, and align teams around strategic goals.' },
  { id: 'WF_RIA_E02', domain: 'E', prompt: 'Pitch technical proposals, research initiatives, or product visions to decision-makers.' },
  { id: 'WF_RIA_E03', domain: 'E', prompt: 'Identify high-impact market or institutional opportunities and mobilize resources.' },
  { id: 'WF_RIA_E04', domain: 'E', prompt: 'Negotiate scope, timelines, and risk mitigation plans across multiple stakeholders.' },
  { id: 'WF_RIA_E05', domain: 'E', prompt: 'Drive adoption of new engineering standards, tools, or organizational processes.' },
  { id: 'WF_RIA_E06', domain: 'E', prompt: 'Organize hackathons, technical competitions, or cross-departmental initiatives.' },
  { id: 'WF_RIA_E07', domain: 'E', prompt: 'Make decisive trade-off calls under ambiguity to deliver measurable outcomes.' },
  { id: 'WF_RIA_E08', domain: 'E', prompt: 'Build strategic partnerships with external organizations, mentors, or sponsors.' },

  // Conventional (C) — 8 items
  { id: 'WF_RIA_C01', domain: 'C', prompt: 'Establish rigorous quality assurance checklists, audit trails, and compliance protocols.' },
  { id: 'WF_RIA_C02', domain: 'C', prompt: 'Maintain structured databases, versioned schemas, and reproducible configuration files.' },
  { id: 'WF_RIA_C03', domain: 'C', prompt: 'Verify that submitted artifacts and documentation strictly satisfy rubric criteria.' },
  { id: 'WF_RIA_C04', domain: 'C', prompt: 'Organize project budgets, schedules, and dependency tracking with high precision.' },
  { id: 'WF_RIA_C05', domain: 'C', prompt: 'Standardize API contracts, naming conventions, and automated regression test suites.' },
  { id: 'WF_RIA_C06', domain: 'C', prompt: 'Audit data pipelines and access logs to ensure privacy and governance compliance.' },
  { id: 'WF_RIA_C07', domain: 'C', prompt: 'Catalog and version-control institutional records, rubrics, and release notes.' },
  { id: 'WF_RIA_C08', domain: 'C', prompt: 'Execute systematic verification procedures to prevent defects before deployment.' },
];
