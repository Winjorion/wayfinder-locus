import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  computeTargetReadinessReport,
  evaluateOpportunityInterestRelevance,
  resolveOpportunityVerification,
} from '../../engine/readinessEngine';
import { RequirementStatusBadge } from '../common/StatusBadge';
import {
  Compass,
  Camera,
  CheckCircle2,
  FileCheck,
  BookOpen,
  PlusCircle,
  ShieldAlert,
  ExternalLink,
  ListChecks,
} from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

const CONDITION_LABELS: Record<string, string> = {
  ENROLLED_STUDENT: 'Active Student Enrolment',
  ACADEMIC_STANDING: 'Good Academic Standing',
};

export const Screen14ReadinessGapAnalysis: React.FC = () => {
  const {
    state,
    selectTarget,
    createManualSnapshot,
    addGapDevelopmentPlanActivity,
    navigateTo,
  } = useWayfinder();
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [addedGapRequirementId, setAddedGapRequirementId] = useState<string | null>(null);

  const activeTarget =
    state.targets.find((t) => t.id === state.selectedTargetId) || state.targets[0] || null;

  if (!activeTarget) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-8 text-center space-y-5 relative overflow-hidden">
          <div className="hidden sm:block absolute top-6 right-8 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
          <div className="w-14 h-14 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7 text-[#087FE0]" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
              Opportunity Readiness &amp; Gap Analysis
            </span>
            <h1 className="font-display text-2xl font-bold text-[#0F2942]">
              No Target Opportunity Selected
            </h1>
            <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
              Select or create a target opportunity in Opportunity Discovery to compare your
              demonstrated capabilities and verified evidence against each requirement, see
              acceptable evidence, and build a requirement-linked development plan.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <LiquidButton
              variant="primary"
              pill
              onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Add Target Opportunity
            </LiquidButton>
            <LiquidButton
              variant="secondary"
              pill
              onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
            >
              View Capability Passport
            </LiquidButton>
          </div>
        </div>
      </div>
    );
  }

  const report = computeTargetReadinessReport(
    activeTarget,
    state.capabilityRecords,
    state.evidenceSubmissions,
    state.currentUser
  );

  const verification = resolveOpportunityVerification(activeTarget);
  const interestEval = evaluateOpportunityInterestRelevance(
    activeTarget,
    state.riasecResult,
    state.currentUser
  );

  const handleSaveSnapshot = () => {
    createManualSnapshot(
      `Readiness milestone saved for ${activeTarget.title} (${activeTarget.version})`
    );
    setSnapshotSaved(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. Opportunity Title, Verified Source Information, Application Link & Deadline */}
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-[#087FE0]">
              <Compass className="w-4 h-4 text-[#087FE0]" />
              <span>OPPORTUNITY READINESS &amp; GAP ANALYSIS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DDF2FF] text-[#174B80] border border-[#8CCBFF]">
                CLAIM ≠ CAPABILITY ≠ PROOF
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
              {activeTarget.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#456784] max-w-3xl">
              Requirement-by-requirement evaluation of your demonstrated capabilities, accepted
              evidence, and mandatory eligibility conditions. Unassessed capabilities remain marked
              as needing more information—never as zero or an arbitrary readiness percentage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select target for gap analysis"
              value={activeTarget.id}
              onChange={(e) => selectTarget(e.target.value)}
              className="select-liquid rounded-xl px-3.5 py-2 text-xs font-mono"
            >
              {state.targets.map((t) => (
                <option key={t.id} value={t.id} className="bg-white text-[#0F2942]">
                  {t.title} ({t.version})
                </option>
              ))}
            </select>

            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('13_OPPORTUNITY_DETAIL')}
            >
              Inspect Verification Layer
            </LiquidButton>

            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={handleSaveSnapshot}
              icon={<Camera className="w-4 h-4 text-[#087FE0]" />}
            >
              Save Readiness Snapshot
            </LiquidButton>
          </div>
        </div>

        {/* Source, Verification, Application Link & Deadline Summary Bar */}
        <div className="pt-4 border-t border-[#C5E4FA] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl glass-panel-subtle">
            <div className="text-[10px] text-[#527493] uppercase">Organizer &amp; Source</div>
            <div className="font-bold text-[#0F2942] mt-0.5 truncate">
              {activeTarget.organizationLabel}
            </div>
            <div className="text-[11px] text-[#087FE0]">
              Source Status: {verification.opportunitySourceStatus}
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel-subtle">
            <div className="text-[10px] text-[#527493] uppercase">Verification Layer</div>
            <div className="font-bold text-[#0F2942] mt-0.5">
              Overall: {verification.overallStatus}
            </div>
            <div className="text-[11px] text-[#527493]">
              Capabilities Mapped: {verification.capabilitiesMappedStatus}
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel-subtle">
            <div className="text-[10px] text-[#527493] uppercase">Application Deadline</div>
            <div className="font-bold text-[#0F2942] mt-0.5">
              {activeTarget.applicationDeadline || 'Not specified'}
            </div>
            <div className="text-[11px] text-[#527493]">
              Status: {verification.deadlineStatus}
            </div>
          </div>

          <div className="p-3 rounded-xl glass-panel-subtle">
            <div className="text-[10px] text-[#527493] uppercase">Application Link</div>
            <div className="font-bold text-[#0F2942] mt-0.5 truncate">
              {activeTarget.applicationUrl ? (
                <a
                  href={activeTarget.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#087FE0] hover:underline inline-flex items-center gap-1"
                >
                  Open Link <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                'Unavailable'
              )}
            </div>
            <div className="text-[11px] text-[#527493]">
              Status: {verification.applicationLinkStatus}
            </div>
          </div>
        </div>
      </div>

      {snapshotSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Readiness snapshot saved for {activeTarget.title} ({activeTarget.version}).
          </span>
          <button
            onClick={() => navigateTo('19_HISTORICAL_SNAPSHOTS')}
            className="text-[#087FE0] font-semibold hover:underline font-mono cursor-pointer"
          >
            View History →
          </button>
        </div>
      )}

      {addedGapRequirementId && (
        <div className="p-4 rounded-xl bg-[#F0F9FF] border border-[#087FE0] text-[#0F2942] text-xs flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#087FE0]" />
            Added requirement-linked development activity to your Learning Centre &amp; Activity
            Workspace.
          </span>
          <div className="flex items-center gap-2">
            <LiquidButton
              variant="primary"
              size="sm"
              pill
              onClick={() => navigateTo('15_LEARNING_CENTRE')}
            >
              Open Development Plan →
            </LiquidButton>
          </div>
        </div>
      )}

      {/* 2. Interest-Based Relevance vs. Actual Capability Readiness */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-[#0F2942]">
            1. Interest &amp; Goal Relevance (Kept Separate from Capability Readiness)
          </h2>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            Interests Guide Exploration Only
          </span>
        </div>
        <p className="text-xs text-[#0F2942] leading-relaxed">{interestEval.relevanceSummary}</p>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{interestEval.separationPrincipleNote}</span>
        </div>
      </div>

      {/* 3. Structured Readiness Status Breakdown (Items 4, 5, 6, 7, 8) */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F2942]">
              2. Structured Capability &amp; Evidence Status Summary
            </h2>
            <p className="text-xs text-[#456784]">
              Breakdown across demonstrated capabilities, partial gaps, development needed, missing
              or pending evidence, and unassessed requirements.
            </p>
          </div>
          <span className="text-xs font-mono text-[#087FE0] font-semibold">
            {report.totalRequirements} Total Capability Requirement(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 rounded-xl glass-panel-subtle border-l-4 border-l-emerald-500">
            <div className="text-lg font-bold font-mono text-emerald-700">
              {report.counts.DEMONSTRATED}
            </div>
            <div className="font-semibold text-[#0F2942] mt-0.5">Demonstrated</div>
            <div className="text-[10px] text-[#527493]">Meets target + proof</div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-subtle border-l-4 border-l-[#087FE0]">
            <div className="text-lg font-bold font-mono text-[#087FE0]">
              {report.counts.PARTIALLY_DEMONSTRATED}
            </div>
            <div className="font-semibold text-[#0F2942] mt-0.5">Partially Demonstrated</div>
            <div className="text-[10px] text-[#527493]">1 level below target</div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-subtle border-l-4 border-l-indigo-500">
            <div className="text-lg font-bold font-mono text-indigo-700">
              {report.counts.DEVELOPMENT_NEEDED}
            </div>
            <div className="font-semibold text-[#0F2942] mt-0.5">Development Needed</div>
            <div className="text-[10px] text-[#527493]">2+ levels below target</div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-subtle border-l-4 border-l-amber-500">
            <div className="text-lg font-bold font-mono text-amber-700">
              {report.counts.EVIDENCE_MISSING + report.counts.EVIDENCE_PENDING_REVIEW}
            </div>
            <div className="font-semibold text-[#0F2942] mt-0.5">
              Evidence Missing / Pending
            </div>
            <div className="text-[10px] text-[#527493]">
              {report.counts.EVIDENCE_MISSING} missing, {report.counts.EVIDENCE_PENDING_REVIEW}{' '}
              pending
            </div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-subtle border-l-4 border-l-[#8CCBFF]">
            <div className="text-lg font-bold font-mono text-[#527493]">
              {report.counts.UNKNOWN_INSUFFICIENT_INFO}
            </div>
            <div className="font-semibold text-[#0F2942] mt-0.5">Unknown / Unassessed</div>
            <div className="text-[10px] text-[#527493]">More info needed (never 0)</div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-subtle border-l-4 border-l-red-500">
            <div className="text-lg font-bold font-mono text-red-700">
              {report.unmetMandatoryConditionsCount}
            </div>
            <div className="font-semibold text-[#0F2942] mt-0.5">Unmet Eligibility</div>
            <div className="text-[10px] text-[#527493]">Mandatory conditions</div>
          </div>
        </div>
      </div>

      {/* 4. Mandatory Eligibility Conditions Block */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-base font-bold text-[#0F2942]">
            3. Mandatory Eligibility Conditions
          </h2>
          <span className="text-xs font-mono text-[#527493]">
            Platform Consent:{' '}
            {state.currentUser?.consent.acceptedDataProcessing ? 'Completed' : 'Pending'} (Evaluated
            Separately from Eligibility)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.mandatoryConditionResults.map((mc) => (
            <div
              key={mc.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                mc.isMet
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : 'bg-red-50/80 border-red-300'
              }`}
            >
              <div>
                <div className="text-sm font-semibold text-[#0F2942]">{mc.label}</div>
                <div className="text-[11px] font-mono text-[#527493] mt-0.5">
                  {CONDITION_LABELS[mc.conditionType] || mc.conditionType}
                </div>
              </div>
              {mc.isMet ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Met
                </span>
              ) : (
                <button
                  onClick={() => navigateTo('04_ONBOARDING_CONSENT')}
                  className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-red-100 text-red-800 border border-red-300 hover:underline cursor-pointer"
                >
                  Not Met (Update Eligibility)
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Detailed Requirement-Level Evaluation Cards with Acceptable Evidence & Development Plan Actions */}
      <div className="space-y-4">
        <h2 className="font-display text-base font-bold text-[#0F2942]">
          4. Requirement-by-Requirement Readiness, Acceptable Evidence &amp; Development Plan
        </h2>

        {report.requirementEvaluations.map((ev, idx) => {
          const linkedPlanExists = state.activities.some(
            (a) =>
              a.linkedTargetId === activeTarget.id &&
              a.linkedRequirementId === ev.requirement.id
          );

          return (
            <div key={ev.requirement.id} className="liquid-stack-card rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-[#087FE0] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#C5E4FA]">
                      Requirement {idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-bold text-[#0F2942]">
                      {ev.dimensionName}
                    </h3>
                    {ev.requirement.isMandatory && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-300">
                        Mandatory
                      </span>
                    )}
                    {ev.requirement.evidenceRequired && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF]">
                        Verified Evidence Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#456784]">{ev.requirement.rationale}</p>
                </div>

                <RequirementStatusBadge status={ev.status} />
              </div>

              {/* Numeric Comparison Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl glass-panel-subtle font-mono text-xs">
                <div>
                  <div className="text-[10px] text-[#527493]">Target Level</div>
                  <div className="text-sm font-bold text-[#0F2942]">Level {ev.requiredLevel}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#527493]">Demonstrated Level</div>
                  <div className="text-sm font-bold text-[#087FE0]">
                    {ev.demonstratedLevel !== null
                      ? `Level ${ev.demonstratedLevel}`
                      : 'Not assessed'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#527493]">Self-Reported Claim</div>
                  <div className="text-sm font-bold text-amber-700">
                    {ev.selfReportedClaimLevel !== null
                      ? `Level ${ev.selfReportedClaimLevel}`
                      : 'Not rated'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#527493]">Skill Gap</div>
                  <div className="text-sm font-bold text-[#174B80]">
                    {ev.numericGap !== null
                      ? ev.numericGap === 0
                        ? 'No gap (0)'
                        : `${ev.numericGap} level${ev.numericGap > 1 ? 's' : ''} to build`
                      : 'Needs assessment'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#527493]">Verified Evidence</div>
                  <div className="text-sm font-bold text-emerald-700">
                    {ev.hasAcceptedEvidence
                      ? 'Verified'
                      : ev.hasPendingEvidence
                      ? 'Awaiting review'
                      : 'None yet'}
                  </div>
                </div>
              </div>

              {/* Evidence That Could Satisfy This Requirement & Concrete Development Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl glass-panel-subtle space-y-1.5 border border-[#C5E4FA]">
                  <div className="font-semibold text-[#0F2942] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#087FE0]" />
                    <span>Evidence That Satisfies This Requirement</span>
                  </div>
                  <p className="text-[#456784] leading-relaxed">{ev.acceptableEvidenceGuide}</p>
                </div>

                <div className="p-3.5 rounded-xl glass-panel-subtle space-y-1.5 border border-[#C5E4FA]">
                  <div className="font-semibold text-[#0F2942] flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-[#087FE0]" />
                    <span>Practical Steps to Close This Gap</span>
                  </div>
                  <ul className="space-y-1 text-[#456784] list-disc list-inside">
                    {ev.developmentActionSteps.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Explanation & Recommended Next Action */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-[#C5E4FA] text-xs">
                <div className="space-y-1">
                  <div className="text-[#456784]">
                    <strong className="text-[#0F2942]">Evaluation Summary:</strong> {ev.explanation}
                  </div>
                  <div className="text-[#087FE0] font-medium">
                    <strong>Recommended Next Step:</strong> {ev.recommendedNextAction}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {ev.status !== 'DEMONSTRATED' && (
                    <LiquidButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        addGapDevelopmentPlanActivity(activeTarget, ev);
                        setAddedGapRequirementId(ev.requirement.id);
                      }}
                      icon={<BookOpen className="w-3.5 h-3.5 text-[#087FE0]" />}
                    >
                      {linkedPlanExists
                        ? 'Added to Development Plan'
                        : 'Add to Development Plan'}
                    </LiquidButton>
                  )}

                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    onClick={() => navigateTo('15_LEARNING_CENTRE')}
                  >
                    Open Learning Centre
                  </LiquidButton>

                  <LiquidButton
                    variant="primary"
                    size="sm"
                    onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                    icon={<FileCheck className="w-3.5 h-3.5" />}
                  >
                    Submit Evidence
                  </LiquidButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
