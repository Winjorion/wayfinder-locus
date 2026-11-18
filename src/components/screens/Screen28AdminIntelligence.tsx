import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileSearch,
  Lock,
  Settings,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  AdminResearchService,
  JobMarketService,
  SkillIntelligenceService,
} from '../../services/careerIntelligenceServices';
import {
  AdminResearchConfiguration,
  CandidateReviewStatus,
  SkillLibraryCandidateProposal,
} from '../../types/marketSkillsCareer';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';

export const Screen28AdminIntelligence: React.FC = () => {
  const { state } = useWayfinder();

  const [activeTab, setActiveTab] = useState<
    'MARKET_DASHBOARD' | 'SKILL_CANDIDATE_REVIEW' | 'RESEARCH_CONFIG'
  >('MARKET_DASHBOARD');

  const opportunities = useMemo(() => JobMarketService.getAllOpportunities(), []);
  const skillTrends = useMemo(() => SkillIntelligenceService.getAllSkillTrends(), []);

  const metrics = useMemo(() => {
    return AdminResearchService.getMarketResearchMetrics(
      state.fieldsCatalogue,
      opportunities,
      skillTrends
    );
  }, [state.fieldsCatalogue, opportunities, skillTrends]);

  const executionHistory = useMemo(() => AdminResearchService.getExecutionHistory(), []);

  const [proposals, setProposals] = useState<SkillLibraryCandidateProposal[]>(() =>
    SkillIntelligenceService.getCandidateProposals()
  );
  const [selectedProposalId, setSelectedProposalId] = useState<string>(
    () => SkillIntelligenceService.getCandidateProposals()[0]?.id || ''
  );
  const [editedDesc, setEditedDesc] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [config, setConfig] = useState<AdminResearchConfiguration>(() =>
    AdminResearchService.getResearchConfig()
  );

  const activeProposal = useMemo(() => {
    return proposals.find((p) => p.id === selectedProposalId) || proposals[0];
  }, [proposals, selectedProposalId]);

  const handleSelectProposal = (prop: SkillLibraryCandidateProposal) => {
    setSelectedProposalId(prop.id);
    setEditedDesc(prop.proposedDescription);
    setReviewNotes(prop.reviewerNotes);
  };

  const handleReviewDecision = (decision: CandidateReviewStatus) => {
    if (!activeProposal) return;
    const updated = SkillIntelligenceService.reviewCandidateProposal(
      activeProposal.id,
      decision,
      editedDesc || activeProposal.proposedDescription,
      reviewNotes || activeProposal.reviewerNotes,
      state.activeRole
    );
    setProposals([...updated]);
    setStatusNotice(
      `Recorded governance decision "${decision.replace(/_/g, ' ')}" for candidate "${
        activeProposal.proposedSkillName
      }".`
    );
  };

  return (
    <div className="space-y-6">
      {/* Admin Workspace Header */}
      <div className="wf-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="wf-Chip">MODULE 6 — ADMINISTRATIVE INTELLIGENCE WORKSPACE</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                DEMONSTRATION METRICS • BACKEND RESEARCH JOBS NOT YET CONNECTED
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0B2E56]">
              Administrative Market &amp; Skill Intelligence Governance Console
            </h1>
            <p className="text-sm text-[#123B63] mt-1 max-w-3xl">
              Separated from ordinary student navigation. Inspect demonstration market research
              metrics across all 18 fields, review proposed Skill Library candidates, and configure
              future research validation rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'MARKET_DASHBOARD', label: '8A. Market Research Dashboard', icon: BarChart3 },
                {
                  id: 'SKILL_CANDIDATE_REVIEW',
                  label: `8B. Skill Candidate Review (${proposals.length})`,
                  icon: FileSearch,
                },
                { id: 'RESEARCH_CONFIG', label: '8C. Research Configuration', icon: Settings },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#075FC7] text-white shadow-sm'
                      : 'bg-white/80 text-[#0B2E56] border border-[#8DBDFF]/60 hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {statusNotice && (
          <div className="mt-4 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-xs font-semibold flex items-center justify-between">
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="underline font-bold ml-3"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* TAB 8A: MARKET RESEARCH DASHBOARD */}
      {activeTab === 'MARKET_DASHBOARD' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="wf-panel p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#174B80]">
                Total Discovered (Sample)
              </div>
              <div className="text-2xl font-bold text-[#0B2E56] mt-1">
                {metrics.totalDiscoveredOpportunities}
              </div>
              <div className="text-[11px] text-[#315A7D] mt-0.5">Demonstration listings</div>
            </div>
            <div className="wf-panel p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#15803D]">
                Verified Active / Expiring
              </div>
              <div className="text-2xl font-bold text-[#15803D] mt-1">
                {metrics.verifiedOpportunities}
              </div>
              <div className="text-[11px] text-[#315A7D] mt-0.5">Sample verified status</div>
            </div>
            <div className="wf-panel p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
                Pending Validation
              </div>
              <div className="text-2xl font-bold text-[#B45309] mt-1">
                {metrics.pendingValidation}
              </div>
              <div className="text-[11px] text-[#315A7D] mt-0.5">Awaiting curator check</div>
            </div>
            <div className="wf-panel p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C]">
                Expired / Closed
              </div>
              <div className="text-2xl font-bold text-[#B91C1C] mt-1">
                {metrics.expiredListings}
              </div>
              <div className="text-[11px] text-[#315A7D] mt-0.5">Retained for archive</div>
            </div>
            <div className="wf-panel p-4 col-span-2 md:col-span-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7]">
                Total Research Records
              </div>
              <div className="text-2xl font-bold text-[#075FC7] mt-1">
                {metrics.totalResearchRecords}
              </div>
              <div className="text-[11px] text-[#315A7D] mt-0.5">Opportunities + Skill Trends</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Field Distribution across all 18 fields */}
            <div className="lg:col-span-7 wf-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0B2E56]">
                  Field Distribution Across All 18 WAYFINDER Fields (Demonstration Metrics)
                </h2>
                <span className="text-xs font-semibold text-[#075FC7]">
                  {metrics.fieldDistribution.length} Fields Registered
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                {metrics.fieldDistribution.map((fd) => (
                  <div
                    key={fd.fieldId}
                    className="p-2.5 rounded-lg bg-white/80 border border-[#8DBDFF]/40 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#0B2E56]">{fd.fieldName}</span>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-[#E5F2FF] text-[#075FC7] font-semibold">
                        {fd.opportunityCount} Opportunities
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#DDF0FF] text-[#0B2E56] font-semibold">
                        {fd.skillTrendCount} Skill Trends
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Distribution & Execution History */}
            <div className="lg:col-span-5 space-y-5">
              <div className="wf-panel p-5 space-y-3">
                <h2 className="text-base font-bold text-[#0B2E56]">
                  Source Distribution (Demonstration)
                </h2>
                <div className="space-y-2">
                  {metrics.sourceDistribution.map((src) => (
                    <div
                      key={src.sourceType}
                      className="p-2.5 rounded-lg bg-white/80 border border-[#8DBDFF]/40 flex items-center justify-between text-xs"
                    >
                      <span className="text-[#123B63] font-medium">{src.sourceType}</span>
                      <span className="font-bold text-[#075FC7]">{src.count} records</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="wf-panel p-5 space-y-3">
                <h2 className="text-base font-bold text-[#0B2E56]">
                  Research Execution History Log
                </h2>
                <div className="space-y-2">
                  {executionHistory.map((exec) => (
                    <div
                      key={exec.id}
                      className="p-3 rounded-lg bg-white/85 border border-[#8DBDFF]/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0B2E56]">
                          {exec.category.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exec.status === 'NOT_YET_CONNECTED'
                              ? 'bg-[#FEF3C7] text-[#B45309]'
                              : 'bg-[#E5F2FF] text-[#075FC7]'
                          }`}
                        >
                          {exec.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[#123B63]">{exec.notes}</p>
                      <div className="text-[11px] text-[#315A7D]">
                        Timestamp: {exec.executedAt} • Records Inspected: {exec.recordsInspected}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8B: SKILL CANDIDATE REVIEW WORKFLOW */}
      {activeTab === 'SKILL_CANDIDATE_REVIEW' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Candidate List */}
          <div className="xl:col-span-5 wf-panel p-5 space-y-3">
            <h2 className="text-base font-bold text-[#0B2E56]">
              Skill Library Proposed-Update Queue ({proposals.length})
            </h2>
            <p className="text-xs text-[#315A7D]">
              Skill trends and student/curator proposals never overwrite the official Skill Library
              automatically. Select a candidate to inspect sources and record a governance decision.
            </p>
            <div className="space-y-2.5">
              {proposals.map((prop) => {
                const isSelected = activeProposal?.id === prop.id;
                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => handleSelectProposal(prop)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#DDF0FF] border-[#075FC7] shadow-sm'
                        : 'bg-white/80 border-[#8DBDFF]/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#075FC7]">
                        {prop.candidateClassification.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#0B2E56] border border-[#8DBDFF]">
                        {prop.reviewStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#0B2E56] mt-1">
                      {prop.proposedSkillName}
                    </div>
                    <div className="text-[11px] text-[#315A7D] mt-0.5">
                      {prop.specialization} • Mapped to{' '}
                      {getCapabilityDimensionName(prop.mappedCapabilityId)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidate Detail & Governance Actions */}
          <div className="xl:col-span-7 wf-panel p-6 space-y-4">
            {activeProposal ? (
              <>
                <div className="border-b border-[#8DBDFF]/40 pb-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#E5F2FF] text-[#075FC7]">
                      {activeProposal.candidateClassification.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#DDF0FF] text-[#0B2E56]">
                      Status: {activeProposal.reviewStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#FEF3C7] text-[#B45309]">
                      Evidence: {activeProposal.evidenceStrength.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#0B2E56]">
                    {activeProposal.proposedSkillName}
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Field: {activeProposal.fieldId} • Specialisation:{' '}
                    {activeProposal.specialization} • Capability:{' '}
                    {getCapabilityDimensionName(activeProposal.mappedCapabilityId)}
                  </p>
                </div>

                {/* Compare with Existing Skill Library */}
                <div className="p-3.5 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/60 text-xs space-y-1">
                  <div className="font-bold text-[#0B2E56]">
                    Comparison with Existing Official WAYFINDER Skill Library:
                  </div>
                  {activeProposal.targetExistingSkillId ? (
                    <p className="text-[#123B63]">
                      Linked to existing catalogue skill ID{' '}
                      <strong>{activeProposal.targetExistingSkillId}</strong> (
                      {state.skillsCatalogue.find(
                        (s) => s.id === activeProposal.targetExistingSkillId
                      )?.name || 'Catalog Entry'}
                      ).
                    </p>
                  ) : (
                    <p className="text-[#123B63]">
                      Proposed as a net-new skill entry ({activeProposal.candidateClassification}).
                      Does not duplicate existing skill IDs in {activeProposal.fieldId}.
                    </p>
                  )}
                  <p className="text-[#315A7D]">Rationale: {activeProposal.rationale}</p>
                </div>

                {/* Supporting Sources */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#174B80]">
                    Supporting Research Sources ({activeProposal.supportingSources.length})
                  </div>
                  {activeProposal.supportingSources.map((src) => (
                    <div
                      key={src.id}
                      className="p-3 rounded-lg bg-white/80 border border-[#8DBDFF]/50 text-xs"
                    >
                      <div className="font-bold text-[#0B2E56]">{src.title}</div>
                      <div className="text-[#315A7D]">
                        {src.publisherOrBody} • Published: {src.publicationDate} • Type:{' '}
                        {src.sourceType}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Proposed Description & Reviewer Notes */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      Edit Proposed Skill Description
                    </label>
                    <textarea
                      rows={3}
                      value={editedDesc || activeProposal.proposedDescription}
                      onChange={(e) => setEditedDesc(e.target.value)}
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      Curator / Reviewer Governance Notes
                    </label>
                    <textarea
                      rows={2}
                      value={reviewNotes || activeProposal.reviewerNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="wf-input w-full text-sm"
                    />
                  </div>
                </div>

                {/* 5 Required Governance Actions */}
                <div className="pt-2 border-t border-[#8DBDFF]/40 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('APPROVED_FOR_CATALOGUE_PROPOSAL')}
                    className="wf-btn wf-btn-primary text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('FURTHER_RESEARCH_REQUESTED')}
                    className="wf-btn wf-btn-secondary text-xs"
                  >
                    Request Further Research
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('INSUFFICIENT_EVIDENCE_MARKED')}
                    className="wf-btn wf-btn-secondary text-xs"
                  >
                    Mark Insufficient Evidence
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('REJECTED')}
                    className="wf-btn wf-btn-secondary text-xs text-[#B91C1C]"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Candidate
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-[#315A7D]">Select a candidate proposal to review.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8C: RESEARCH CONFIGURATION SCREEN */}
      {activeTab === 'RESEARCH_CONFIG' && (
        <div className="wf-panel p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#8DBDFF]/40 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#075FC7]">
                8C — Research Configuration &amp; Validation Policy
              </div>
              <h2 className="text-lg font-bold text-[#0B2E56]">
                Market &amp; Skill Intelligence Research Parameters
              </h2>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              BACKEND CONNECTION STATUS: {config.backendConnectionStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#174B80] mb-1">
                  Research Execution Frequency (Backend Automated Scheduler: NOT YET CONNECTED)
                </label>
                <select
                  aria-label="Research Frequency"
                  value={config.researchFrequency}
                  onChange={(e) =>
                    setConfig({
                      ...AdminResearchService.updateResearchConfig({
                        researchFrequency:
                          e.target.value as AdminResearchConfiguration['researchFrequency'],
                      }),
                    })
                  }
                  className="wf-select w-full text-sm"
                >
                  <option value="MANUAL_CURATOR_ONLY">
                    Manual Curator Entry Only (Active Frontend Mode)
                  </option>
                  <option value="WEEKLY_SCHEDULED_DEFERRED">
                    Weekly Scheduled Job (NOT YET CONNECTED — Deferred to Backend Phase)
                  </option>
                  <option value="MONTHLY_SCHEDULED_DEFERRED">
                    Monthly Scheduled Job (NOT YET CONNECTED — Deferred to Backend Phase)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#174B80] mb-1">
                  Minimum Evidence Strength Required for Catalogue Review
                </label>
                <select
                  aria-label="Minimum Evidence Strength"
                  value={config.minimumEvidenceStrengthForReview}
                  onChange={(e) =>
                    setConfig({
                      ...AdminResearchService.updateResearchConfig({
                        minimumEvidenceStrengthForReview:
                          e.target.value as AdminResearchConfiguration['minimumEvidenceStrengthForReview'],
                      }),
                    })
                  }
                  className="wf-select w-full text-sm"
                >
                  <option value="MODERATE_MULTI_SOURCE_SAMPLE">
                    Moderate Multi-Source Benchmark Required
                  </option>
                  <option value="PRELIMINARY_OBSERVATION">
                    Allow Preliminary Single-Source Observations
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireDualSourceValidation}
                  onChange={(e) =>
                    setConfig({
                      ...AdminResearchService.updateResearchConfig({
                        requireDualSourceValidation: e.target.checked,
                      }),
                    })
                  }
                />
                <span className="font-bold text-[#0B2E56]">
                  Require Dual-Source Citation Before Approving New Skill Candidates
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/50">
                <div className="font-bold text-[#0B2E56] mb-1">Configured Source Preferences</div>
                <ul className="list-disc list-inside text-[#123B63] space-y-1">
                  {config.sourcePreferences.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/50">
                <div className="font-bold text-[#0B2E56] mb-1">Geographic Coverage Scope</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {config.geographicCoverage.map((geo) => (
                    <span
                      key={geo}
                      className="px-2.5 py-0.5 rounded bg-white border border-[#8DBDFF] text-[#0B2E56] font-semibold"
                    >
                      {geo}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] text-[#B45309] font-semibold">
                Automated Web Crawler / Live Job Board Ingestion: NOT YET CONNECTED. All records in
                this phase are served via deterministic frontend service adapters.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
