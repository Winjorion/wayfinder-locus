import {
  CONFLICT_REGISTER as CORE_CONFLICTS,
  UNRESOLVED_SPEC_DECISIONS,
} from '../config/assessmentConfig';

export interface ConflictRecord {
  id: string;
  topic: string;
  sourceA: string;
  sourceB: string;
  currentSafeHandling: string;
}

export interface OwnerDecisionRecord {
  id: string;
  title: string;
  status: 'UNRESOLVED_CONFIGURABLE' | 'PROVISIONAL_DEFAULT';
  defaultConfiguredValue: string;
  impact: string;
}

export const CONFLICT_REGISTER: ConflictRecord[] = CORE_CONFLICTS.map((c) => ({
  id: c.id,
  topic: c.title,
  sourceA: c.sourcesInConflict,
  sourceB: c.description,
  currentSafeHandling: c.activeSettingSummary,
}));

export const OWNER_DECISIONS: OwnerDecisionRecord[] = UNRESOLVED_SPEC_DECISIONS.map((d) => ({
  id: d.id,
  title: d.title,
  status: 'UNRESOLVED_CONFIGURABLE',
  defaultConfiguredValue: d.currentConfigurableDefault,
  impact: d.ownerActionRequired,
}));
