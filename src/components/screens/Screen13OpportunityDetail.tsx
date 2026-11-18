import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { getCapabilityDimensionName, RUBRIC_V1_ANCHORS } from '../../data/capabilityDimensions';
import {
  computeTargetReadinessReport,
  evaluateOpportunityInterestRelevance,
  resolveOpportunityVerification,
} from '../../engine/readinessEngine';
import { OpportunityVerificationStatus } from '../../types/wayfinder';
import { RequirementStatusBadge } from '../common/StatusBadge';
import {
  Briefcase,
  ShieldCheck,
  Compass,
  ArrowLeft,
  ArrowRight,
  Layers,
  PlusCircle,
  ShieldAlert,
  ExternalLink,
  Calendar,
  FileCheck,
  UserCheck,
  Laptop,
} from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

const CATEGORY_LABELS: Record<string, string> = {
  CAREER_PATHWAY: 'Career Pathway',
  INTERNSHIP_JOB: 'Internship & Job',
  COMPETITION: 'Competition',
  PROJECT_CHALLENGE: 'Project Challenge',
};

const CONDITION_TYPE_LABELS: Record<string, string> = {
  ENROLLED_STUDENT: 'Active Student Enrolment',
  ACADEMIC_STANDING: 'Good Academic Standing',
};

const SOURCE_LABELS: Record<string, string> = {
  USER_ATTESTATION: 'Student Confirmation',
  INSTITUTION_ATTESTATION: 'Institution Verification',
  UNVERIFIED: 'Not yet verified',
};

const VERIFICATION_STATUS_STYLE: Record<
  OpportunityVerificationStatus,
  { label: string; badgeClass: string }
> = {
  VERIFIED: {
    label: 'Verified',
    badgeClass: 'bg-[#E5FAFF]/50 text-[#0B2E56] border-white/75',
  },
  NOT_VERIFIED: {
    label: 'Not Verified',
    badgeClass: 'bg-[#DDF2FF]/40 text-[#0B2E56] border-white/65',
  },
  PENDING: {
    label: 'Pending Verification',
    badgeClass: 'bg-[#8DBDFF]/35 text-[#1F68FF] border-white/70',
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    badgeClass: 'bg-white/20 text-[#1A4678] border-white/50',
  },
  EXPIRED: {
    label: 'Expired',
    badgeClass: 'bg-[#0B2E56]/15 text-[#0B2E56] border-white/55',
  },
};

export const Screen13OpportunityDetail: React.FC = () => {
  const { state, selectTarget, navigateTo } = useWayfinder();
  const target =
    state.targets.find((t) => t.id === state.selectedTargetId) || state.targets[0] || null;

  if (!target) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-panel liquid-glow-bar rounded-[24px] p-8 text-center space-y-5 relative overflow-hidden">
          <div className="hidden sm:block absolute top-6 right-8 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
          <div className="w-14 h-14 rounded-2xl glass-floating flex items-center justify-center mx-auto relative z-10">
            <Briefcase className="w-7 h-7 text-[#2178EE]" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto relative z-10">
            <span className="text-xs font-mono font-semibold text-[#1F68FF] uppercase">
              Opportunity Details &amp; Verification
            </span>
            <h1 className="font-display text-2xl font-bold text-[#0B2E56]">
              No Target Opportunity Selected
            </h1>
            <p className="text-xs sm:text-sm text-[#0B2E56]/85 leading-relaxed">
              Choose or define a target opportunity in Opportunity Discovery to inspect its
              verification status, required capabilities, acceptable evidence, and eligibility
              conditions.
            </p>
          </div>
          <div className="pt-2 relative z-10">
            <LiquidButton
              variant="primary"
              pill
              onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Open Opportunity Discovery
            </LiquidButton>
          </div>
        </div>
      </div>
    );
  }

  const verification = resolveOpportunityVerification(target);
  const interestEval = evaluateOpportunityInterestRelevance(
    target,
    state.riasecResult,
    state.currentUser
  );
  const report = computeTargetReadinessReport(
    target,
    state.capabilityRecords,
    state.evidenceSubmissions,
    state.currentUser
  );
  const overallStyle = VERIFICATION_STATUS_STYLE[verification.overallStatus];

  const verificationRows: { label: string; status: OpportunityVerificationStatus; note: string }[] =
    [
      {
        label: '1. Company or Organizer Identity Checked',
        status: verification.organizerIdentityStatus,
        note: `Organizer: ${target.organizationLabel}`,
      },
      {
        label: '2. Opportunity Source Checked',
        status: verification.opportunitySourceStatus,
        note: target.sourceUrl ? target.sourceUrl : 'No external source link provided',
      },
      {
        label: '3. Requirements Extracted & Reviewed',
        status: verification.requirementsExtractedStatus,
        note: `${target.requirements.length} requirement(s) in version ${target.version}`,
      },
      {
        label: '4. Required Capabilities Mapped',
        status: verification.capabilitiesMappedStatus,
        note: `Mapped to canonical 10-dimension rubric (${target.rubricVersion})`,
      },
      {
        label: '5. Application Link Checked',
        status: verification.applicationLinkStatus,
        note: target.applicationUrl
          ? target.applicationUrl
          : 'No external application link provided',
      },
      {
        label: '6. Application Deadline Checked',
        status: verification.deadlineStatus,
        note: target.applicationDeadline
          ? `Deadline: ${target.applicationDeadline}`
          : 'No deadline recorded',
      },
    ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Breadcrumb & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-[#1A4678]">
          <button
            type="button"
            onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
            className="inline-flex items-center gap-1.5 text-[#1F68FF] font-semibold hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Opportunities
          </button>
          <span>&gt;</span>
          <span className="text-[#0B2E56] font-semibold">Details</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="detail-target-select" className="text-xs text-[#1A4678] font-mono">
            Switch Opportunity:
          </label>
          <select
            id="detail-target-select"
            value={target.id}
            onChange={(e) => selectTarget(e.target.value)}
            className="select-liquid rounded-xl px-3 py-1.5 text-xs font-mono"
          >
            {state.targets.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#EAF6FF] text-[#0B2E56]">
                {t.title} ({t.version})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* HERO CARD + REQUIREMENTS CARD — High-Transparency Glassmorphism */}
      <div className="glass-panel liquid-glow-bar rounded-[28px] p-6 sm:p-8 space-y-7">
        {/* Top Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-3 py-0.5 rounded-full border backdrop-blur-md ${overallStyle.badgeClass}`}
              >
                Verification: {overallStyle.label}
              </span>
              <span className="text-[11px] font-mono font-semibold px-3 py-0.5 rounded-full glass-floating text-[#1F68FF]">
                {CATEGORY_LABELS[target.category] || target.category}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
              {target.title}
            </h1>

            <div className="text-xs sm:text-sm text-[#1A4678] flex flex-wrap items-center gap-2">
              <span>{CATEGORY_LABELS[target.category] || target.category}</span>
              <span>•</span>
              <span className="font-semibold text-[#0B2E56]">{target.organizationLabel}</span>
            </div>

            {/* Translucent Capability Tag Pills */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {target.requirements.map((req) => (
                <span
                  key={req.id}
                  className="px-3 py-1 rounded-full text-xs font-semibold glass-floating text-[#1F68FF]"
                >
                  {getCapabilityDimensionName(req.dimensionId)}
                </span>
              ))}
            </div>

            <p className="text-xs sm:text-sm text-[#0B2E56]/85 leading-relaxed pt-1">
              {target.summary}
            </p>
          </div>

          {/* Right Translucent Glass Arch Workspace Visual */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-t-full rounded-b-[28px] glass-panel-subtle border border-white/75 flex flex-col items-center justify-center p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#E5FAFF]/40 blur-xl" />
              <div className="w-16 h-16 rounded-2xl glass-floating flex items-center justify-center text-[#1F68FF] mb-3">
                <Laptop className="w-8 h-8" />
              </div>
              <div className="text-center">
                <div className="font-display text-xs font-bold text-[#0B2E56]">
                  {report.counts.DEMONSTRATED} / {report.totalRequirements} Met
                </div>
                <div className="text-[11px] text-[#1A4678] mt-0.5">
                  Version {target.version}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REQUIREMENTS CARD SECTION — Secondary Translucent Glass */}
        <div className="rounded-[22px] glass-panel-subtle p-5 sm:p-6 space-y-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-base font-bold text-[#0B2E56]">Requirements</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium glass-floating text-[#1A4678]">
                Version {target.version}
              </span>
            </div>
            <a
              href="#verification-layer"
              className="text-xs font-semibold text-[#1F68FF] hover:underline"
            >
              View verification details
            </a>
          </div>

          {/* Structured Translucent Requirement Rows */}
          <div className="space-y-2.5">
            {report.requirementEvaluations.map((ev, idx) => (
              <div
                key={ev.requirement.id}
                className="p-4 rounded-2xl glass-floating flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl glass-panel-subtle flex items-center justify-center text-[#1F68FF] shrink-0 mt-0.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                        {ev.dimensionName}
                      </span>
                      {ev.requirement.isMandatory && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#2178EE]/20 border border-white/60 text-[#0B2E56]">
                          Mandatory
                        </span>
                      )}
                      {ev.requirement.evidenceRequired && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#E5FAFF]/45 border border-white/70 text-[#0B2E56]">
                          Verified Evidence Required
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#0B2E56]/85">
                      Target Level {ev.requiredLevel} ({RUBRIC_V1_ANCHORS[ev.requiredLevel].label}) —{' '}
                      {ev.requirement.rationale}
                    </div>
                    <div className="text-[11px] text-[#1A4678] flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-[#2178EE] shrink-0" />
                      <span>
                        Acceptable Evidence:{' '}
                        {ev.requirement.acceptableEvidenceTypes ||
                          `Project deliverable or verified assessment demonstrating Level ${ev.requiredLevel} (Req #${idx + 1}).`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                  <RequirementStatusBadge status={ev.status} />
                  <span className="text-[11px] font-mono text-[#1A4678]">
                    Current:{' '}
                    {ev.demonstratedLevel !== null ? `Lvl ${ev.demonstratedLevel}` : 'Unassessed'}
                  </span>
                </div>
              </div>
            ))}

            {/* Mandatory Eligibility Condition Rows */}
            {target.mandatoryConditions.map((mc) => {
              const condEval = report.mandatoryConditionResults.find(
                (c) => c.id === mc.id
              );
              const isMet = condEval?.isMet ?? false;
              return (
                <div
                  key={mc.id}
                  className="p-4 rounded-2xl glass-floating flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl glass-panel-subtle flex items-center justify-center text-[#1F68FF] shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                        Eligibility
                      </div>
                      <div className="text-xs text-[#0B2E56]/85">
                        {mc.label} (Mandatory •{' '}
                        {CONDITION_TYPE_LABELS[mc.conditionType] || mc.conditionType})
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${
                      isMet
                        ? 'bg-[#E5FAFF]/50 text-[#0B2E56] border-white/75'
                        : 'bg-[#DDF2FF]/35 text-[#0B2E56] border-white/60'
                    }`}
                  >
                    {isMet ? 'Met' : 'Unconfirmed'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom 2-Button Action Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 relative z-10">
          <LiquidButton
            variant="secondary"
            size="lg"
            pill
            onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
            className="w-full"
          >
            Compare
          </LiquidButton>

          <LiquidButton
            variant="primary"
            size="lg"
            pill
            onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
            className="w-full"
          >
            <span>Evaluate Readiness &amp; Gaps</span>
            <ArrowRight className="w-4 h-4" />
          </LiquidButton>
        </div>

        {/* Source, Application Link, and Deadline Strip */}
        <div className="pt-4 border-t border-white/45 flex flex-wrap items-center gap-6 text-xs font-mono text-[#1A4678] relative z-10">
          <span>
            Requirement Version:{' '}
            <strong className="text-[#0B2E56]">{target.version}</strong>
          </span>
          <span>
            Application Deadline:{' '}
            <strong className="text-[#0B2E56]">
              {target.applicationDeadline
                ? `${target.applicationDeadline} (${VERIFICATION_STATUS_STYLE[verification.deadlineStatus].label})`
                : 'Not available'}
            </strong>
          </span>
          {target.applicationUrl ? (
            <span className="inline-flex items-center gap-1">
              Application Link:{' '}
              <a
                href={target.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1F68FF] font-semibold hover:underline inline-flex items-center gap-1"
              >
                {target.applicationUrl} <ExternalLink className="w-3 h-3" />
              </a>{' '}
              ({VERIFICATION_STATUS_STYLE[verification.applicationLinkStatus].label})
            </span>
          ) : (
            <span>
              Application Link: <strong className="text-[#1A4678]">Unavailable</strong>
            </span>
          )}
        </div>
      </div>

      {/* Opportunity Verification Layer (All 8 Required Fields) */}
      <div
        id="verification-layer"
        className="glass-panel rounded-[24px] p-6 sm:p-7 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
          <div>
            <h2 className="font-display text-base font-bold text-[#0B2E56] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#2178EE]" /> Opportunity Verification Layer
            </h2>
            <p className="text-xs text-[#0B2E56]/85">
              Transparent verification breakdown across organizer identity, source, requirement
              extraction, capability mapping, application link, and deadline.
            </p>
          </div>
          <span
            className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border backdrop-blur-md ${overallStyle.badgeClass}`}
          >
            Overall Status: {overallStyle.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs relative z-10">
          {verificationRows.map((row) => {
            const st = VERIFICATION_STATUS_STYLE[row.status];
            return (
              <div
                key={row.label}
                className="p-3.5 rounded-2xl glass-panel-subtle flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#0B2E56]">{row.label}</div>
                  <div className="text-[11px] text-[#1A4678] break-all">{row.note}</div>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${st.badgeClass}`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl glass-panel-subtle text-xs space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#1A4678]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2178EE]" />
              <strong>7. Last Verification Date:</strong>{' '}
              {verification.lastVerifiedAt
                ? new Date(verification.lastVerifiedAt).toLocaleDateString()
                : 'Not yet verified by an external verification provider'}
            </span>
            <span>
              <strong>8. Overall Verification Status:</strong> {overallStyle.label}
            </span>
          </div>
          <div className="text-[#0B2E56]">
            <strong>Verification Explanation:</strong> {verification.statusExplanation}
          </div>
        </div>
      </div>

      {/* Interest-Based Relevance vs. Capability Readiness */}
      <div className="glass-panel rounded-[24px] p-6 sm:p-7 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
          <h2 className="font-display text-base font-bold text-[#0B2E56] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#2178EE]" /> Why This Opportunity May Be Relevant to
            Your Interests &amp; Goals
          </h2>
          <span className="text-[11px] font-mono font-semibold px-3 py-0.5 rounded-full glass-floating text-[#1F68FF]">
            Interest Exploration ≠ Capability Readiness
          </span>
        </div>
        <p className="text-xs text-[#0B2E56] leading-relaxed relative z-10">
          {interestEval.relevanceSummary}
        </p>
        <div className="p-3.5 rounded-2xl glass-panel-subtle text-[11px] text-[#0B2E56] relative z-10">
          <strong>Important Distinction:</strong> {interestEval.separationPrincipleNote}
        </div>
      </div>

      {/* Mandatory Eligibility Conditions Reference */}
      <div className="glass-panel rounded-[24px] p-6 sm:p-7 space-y-4">
        <div className="space-y-1 relative z-10">
          <h2 className="font-display text-base font-bold text-[#0B2E56] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2178EE]" /> Mandatory Eligibility Conditions
          </h2>
          <p className="text-xs text-[#0B2E56]/85">
            These baseline conditions are checked separately from your platform terms and skill
            assessments.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {target.mandatoryConditions.map((mc) => (
            <div
              key={mc.id}
              className="p-4 rounded-2xl glass-panel-subtle flex items-start justify-between gap-3"
            >
              <div>
                <div className="text-sm font-semibold text-[#0B2E56]">{mc.label}</div>
                <div className="text-[11px] font-mono text-[#1A4678] mt-1">
                  {CONDITION_TYPE_LABELS[mc.conditionType] || mc.conditionType} •{' '}
                  {SOURCE_LABELS[mc.verificationSource] || mc.verificationSource}
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full glass-floating text-[#0B2E56]">
                Required
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
