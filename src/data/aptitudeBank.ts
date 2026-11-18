import { AptitudeDomain, CapabilityDimensionId } from '../types/wayfinder';

export interface AptitudeItemPublic {
  id: string;
  domain: AptitudeDomain;
  mappedCapabilityId: CapabilityDimensionId;
  difficulty: 'FOUNDATIONAL' | 'APPLIED' | 'PROFICIENT';
  question: string;
  options: { id: string; text: string }[];
  accessibilityNote?: string;
}

export const APTITUDE_PUBLIC_ITEMS: AptitudeItemPublic[] = [
  {
    id: 'WF_APT_NUM_01',
    domain: 'NUMERICAL',
    mappedCapabilityId: 'CAP_NUM_QUANT',
    difficulty: 'FOUNDATIONAL',
    question:
      'An API service processes 1,200 requests per minute with an error rate of 1.5%. After a patch, traffic rises by 25% while the error rate drops to 0.8%. How many failed requests occur per minute now?',
    options: [
      { id: 'A', text: '10 failed requests/min' },
      { id: 'B', text: '12 failed requests/min' },
      { id: 'C', text: '15 failed requests/min' },
      { id: 'D', text: '18 failed requests/min' },
    ],
  },
  {
    id: 'WF_APT_NUM_02',
    domain: 'NUMERICAL',
    mappedCapabilityId: 'CAP_NUM_QUANT',
    difficulty: 'APPLIED',
    question:
      'In a RIASEC domain with 8 items scored 1 to 5, a student achieves a raw sum of 32. Using the WAYFINDER normalization formula ((sum - 8) / 32) * 100, what is the normalized percentage?',
    options: [
      { id: 'A', text: '68.5%' },
      { id: 'B', text: '75.0%' },
      { id: 'C', text: '80.0%' },
      { id: 'D', text: '82.5%' },
    ],
  },
  {
    id: 'WF_APT_NUM_03',
    domain: 'NUMERICAL',
    mappedCapabilityId: 'CAP_DATA_ANAL',
    difficulty: 'PROFICIENT',
    question:
      'A cohort query returns 4 students matching a specialized filter. Under the institutional k-anonymity suppression rule (k = 5), what must the aggregate endpoint return for the metric payload?',
    options: [
      { id: 'A', text: 'The exact mean with a warning banner' },
      { id: 'B', text: 'Suppressed (null metric payload) because N = 4 < k = 5' },
      { id: 'C', text: 'Zero for all values' },
      { id: 'D', text: 'Individual student IDs' },
    ],
  },
  {
    id: 'WF_APT_VER_01',
    domain: 'VERBAL',
    mappedCapabilityId: 'CAP_TECH_COMM',
    difficulty: 'FOUNDATIONAL',
    question:
      'Specification statement: "Self-reported confidence may initiate a development plan, whereas only reviewed evidence or objective evaluation may establish a demonstrated capability level." Which conclusion strictly follows?',
    options: [
      { id: 'A', text: 'High self-reported confidence satisfies level-2 target requirements.' },
      { id: 'B', text: 'Self-reported ratings cannot alone establish a demonstrated capability level.' },
      { id: 'C', text: 'Objective evaluations are identical to self-reported claims.' },
      { id: 'D', text: 'Development plans automatically promote capability levels upon completion.' },
    ],
  },
  {
    id: 'WF_APT_VER_02',
    domain: 'VERBAL',
    mappedCapabilityId: 'CAP_RESEARCH_SYN',
    difficulty: 'APPLIED',
    question:
      'When two engineering documents specify conflicting maximum upload sizes (10 MB in WF-ENG-SPEC-1.0 vs. 25 MB in the Handoff), what is the compliant engineering action?',
    options: [
      { id: 'A', text: 'Silently hardcode 50 MB and delete the documentation.' },
      { id: 'B', text: 'Preserve the conflict in the Conflict Register and expose it as an explicit configuration flag.' },
      { id: 'C', text: 'Disable evidence uploads entirely.' },
      { id: 'D', text: 'Claim both limits are simultaneously enforced without checking file size.' },
    ],
  },
  {
    id: 'WF_APT_LOG_01',
    domain: 'LOGICAL',
    mappedCapabilityId: 'CAP_PROB_SOLV',
    difficulty: 'APPLIED',
    question:
      'Given the gap formula G_i = max(0, R_i - D_i), suppose Requirement R_i = 3 (RUBRIC_V1) and Demonstrated D_i = UNKNOWN (null). What is the resulting gap G_i and requirement status?',
    options: [
      { id: 'A', text: 'G_i = 3, Status = DEVELOPMENT_NEEDED (treating unknown as 0)' },
      { id: 'B', text: 'G_i = null (uncomputable), Status = UNKNOWN_INSUFFICIENT_INFO' },
      { id: 'C', text: 'G_i = 0, Status = DEMONSTRATED' },
      { id: 'D', text: 'G_i = 1, Status = PARTIALLY_DEMONSTRATED' },
    ],
  },
  {
    id: 'WF_APT_LOG_02',
    domain: 'LOGICAL',
    mappedCapabilityId: 'CAP_SYS_DESIGN',
    difficulty: 'PROFICIENT',
    question:
      'A student grants Institution X a scoped sharing token expiring at 12:00 UTC. At 10:30 UTC the student revokes the token. At 11:00 UTC Institution X requests the student report. What must occur?',
    options: [
      { id: 'A', text: 'Access is granted because 11:00 UTC is before 12:00 UTC.' },
      { id: 'B', text: 'Access is denied immediately because revokedAt is non-null.' },
      { id: 'C', text: 'Access is granted in read-only mode.' },
      { id: 'D', text: 'The revocation only takes effect after 24 hours.' },
    ],
  },
  {
    id: 'WF_TKA_SW_01',
    domain: 'TARGET_KNOWLEDGE',
    mappedCapabilityId: 'CAP_PROG_SW',
    difficulty: 'APPLIED',
    question:
      'Why must assessment answer keys and capability promotions be executed in trusted server-side functions rather than trusted from client payloads?',
    options: [
      { id: 'A', text: 'To reduce CSS bundle size.' },
      { id: 'B', text: 'Because any client-supplied score, role, or answer key in the browser can be inspected or forged by the user.' },
      { id: 'C', text: 'Because browsers cannot parse JSON.' },
      { id: 'D', text: 'To bypass database Row-Level Security.' },
    ],
  },
  {
    id: 'WF_TKA_SW_02',
    domain: 'TARGET_KNOWLEDGE',
    mappedCapabilityId: 'CAP_ETHICS_GOV',
    difficulty: 'PROFICIENT',
    question:
      'Which PostgreSQL mechanism ensures that a logged-in student can query only rows where student_id = auth.uid() even if they modify client query parameters?',
    options: [
      { id: 'A', text: 'CSS display:none on other students' },
      { id: 'B', text: 'Row-Level Security (RLS) policies enforced by the database engine' },
      { id: 'C', text: 'LocalStorage key prefixes' },
      { id: 'D', text: 'Client-side React route guards alone' },
    ],
  },
  {
    id: 'WF_APT_SPA_01',
    domain: 'SPATIAL',
    mappedCapabilityId: 'CAP_SYS_DESIGN',
    difficulty: 'APPLIED',
    question:
      '[PROVISIONAL ACCESSIBLE TOPOLOGY ITEM] A directed acyclic pipeline has nodes A -> B, A -> C, and (B, C) -> D. If node B fails, which downstream path remains intact from A to D?',
    options: [
      { id: 'A', text: 'Path A -> C -> D remains intact' },
      { id: 'B', text: 'No path exists from A to D' },
      { id: 'C', text: 'Path D -> B -> A' },
      { id: 'D', text: 'Path A -> B -> C' },
    ],
    accessibilityNote:
      'Provisional text-equivalent graph topology item (CONF-04 / DEC-02). Disabled by default.',
  },
];

export const SERVER_SIDE_APTITUDE_ANSWER_KEY: Record<string, string> = {
  WF_APT_NUM_01: 'B',
  WF_APT_NUM_02: 'B',
  WF_APT_NUM_03: 'B',
  WF_APT_VER_01: 'B',
  WF_APT_VER_02: 'B',
  WF_APT_LOG_01: 'B',
  WF_APT_LOG_02: 'B',
  WF_TKA_SW_01: 'B',
  WF_TKA_SW_02: 'B',
  WF_APT_SPA_01: 'A',
};

export function getActiveAptitudeItems(enableSpatial: boolean): AptitudeItemPublic[] {
  return APTITUDE_PUBLIC_ITEMS.filter((item) =>
    enableSpatial ? true : item.domain !== 'SPATIAL'
  );
}
