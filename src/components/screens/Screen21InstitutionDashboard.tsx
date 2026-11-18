import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { evaluateInstitutionCohortSuppression } from '../../engine/readinessEngine';
import { Building2, ShieldAlert, Lock, EyeOff, CheckCircle2, Users, Database } from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

export const Screen21InstitutionDashboard: React.FC = () => {
  const { state, navigateTo } = useWayfinder();

  const evaluatedCohorts = evaluateInstitutionCohortSuppression(
    state.institutionCohorts,
    state.featureFlags.institutionSuppressionThresholdK
  );

  const now = Date.now();
  const activeValidShares = state.sharingAuthorisations.filter(
    (sh) => sh.revokedAt === null && new Date(sh.expiresAt).getTime() > now
  );

  const minCohortSize = state.featureFlags.institutionSuppressionThresholdK;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
                Institution Portal
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
                Institution Readiness Analytics
              </h1>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#F0F9FF] text-[#087FE0] border border-[#8CCBFF]">
            Minimum Group Size: {minCohortSize} Students
          </span>
        </div>

        {/* Privacy & Suppression Safeguard Explanation */}
        <div className="p-4 rounded-xl glass-panel-subtle flex items-start gap-3 text-xs text-[#456784]">
          <Lock className="w-4 h-4 text-[#087FE0] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#0F2942]">Cohort Privacy Protection:</strong> To protect
            student privacy, summary metrics are only shown for groups of at least{' '}
            <strong className="text-[#087FE0]">{minCohortSize} students</strong>. Smaller groups are
            automatically withheld so individual performance cannot be inferred from group averages.
          </div>
        </div>

        {/* Phase 8 & 9: College, Institution & Opportunity Provider Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl glass-panel-subtle space-y-1.5">
            <div className="text-xs font-bold text-[#0F2942]">
              1. Aggregated Capability Gap Insights
            </div>
            <p className="text-[11px] text-[#456784] leading-relaxed">
              Identify which canonical capabilities and target requirements have the highest gap
              rates across student cohorts (when cohort size ≥ {minCohortSize}), enabling targeted
              curriculum and workshop interventions.
            </p>
          </div>
          <div className="p-4 rounded-xl glass-panel-subtle space-y-1.5">
            <div className="text-xs font-bold text-[#0F2942]">
              2. Evidence Coverage &amp; Progress Visibility
            </div>
            <p className="text-[11px] text-[#456784] leading-relaxed">
              See where student claims are backed by verified evidence versus where evidence is
              still missing or awaiting review—complementing existing campus placement portals.
            </p>
          </div>
          <div className="p-4 rounded-xl glass-panel-subtle space-y-1.5">
            <div className="text-xs font-bold text-[#0F2942]">
              3. Opportunity Provider Readiness Layer
            </div>
            <p className="text-[11px] text-[#456784] leading-relaxed">
              Employers and opportunity providers define explicit capability levels, mandatory
              eligibility conditions, and acceptable evidence types so applicants understand
              readiness before applying.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Aggregate Cohort Analytics OR Polished Empty State */}
      <div className="space-y-4">
        <h2 className="font-display text-base font-bold text-[#0F2942] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#087FE0]" /> 1. Cohort Readiness Summaries
        </h2>

        {evaluatedCohorts.length === 0 ? (
          <div className="liquid-stack-card rounded-2xl p-10 text-center space-y-4 relative overflow-hidden">
            <div className="hidden sm:block absolute top-6 right-8 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
            <div className="w-14 h-14 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto">
              <Database className="w-7 h-7 text-[#087FE0]" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="font-display text-xl font-bold text-[#0F2942]">
                No Cohort Analytics Available Yet
              </h3>
              <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
                {state.supabaseConfigured
                  ? `No student cohorts with at least ${minCohortSize} students were found for your institution.`
                  : `Sign in with an authorised Institution account once your institution's data service is connected to view anonymised readiness trends for cohorts of ${minCohortSize} or more students.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {evaluatedCohorts.map((cohort) => (
              <div
                key={cohort.cohortId}
                className={`liquid-stack-card rounded-2xl p-6 space-y-4 border ${
                  cohort.isSuppressed ? 'border-red-300' : 'border-[#C5E4FA]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-[#087FE0]">
                    {cohort.cohortId}
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                      cohort.isSuppressed
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    Students: {cohort.studentCount}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-[#0F2942]">
                  {cohort.cohortName}
                </h3>

                {cohort.isSuppressed || !cohort.aggregateMetrics ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-xs text-red-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-red-800">
                      <EyeOff className="w-4 h-4 text-red-600" /> Withheld for Privacy (Fewer than{' '}
                      {minCohortSize} students)
                    </div>
                    <p className="text-[11px] leading-relaxed text-red-800">
                      Summary metrics and skill gap averages are hidden for groups smaller than{' '}
                      {minCohortSize} students to protect individual privacy.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 p-3.5 rounded-xl glass-panel-subtle text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#527493]">Avg. Demonstrated Skills:</span>
                      <span className="text-emerald-700 font-bold">
                        {cohort.aggregateMetrics.avgDemonstratedCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#527493]">Avg. Skill Gaps:</span>
                      <span className="text-[#087FE0] font-bold">
                        {cohort.aggregateMetrics.avgGapCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#527493]">Evidence Still Needed:</span>
                      <span className="text-amber-700 font-bold">
                        {cohort.aggregateMetrics.evidenceMissingPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#527493]">Not Yet Assessed:</span>
                      <span className="text-[#174B80] font-bold">
                        {cohort.aggregateMetrics.unknownDimensionPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Scoped Individual Student Reports */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F2942]">
              2. Shared Individual Student Reports
            </h2>
            <p className="text-xs text-[#456784]">
              Individual readiness reports appear here only when a student grants active sharing
              permission. If a student revokes access, the report is removed immediately.
            </p>
          </div>
          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('20_PRIVACY_SHARING')}
          >
            Manage Sharing Permissions →
          </LiquidButton>
        </div>

        {activeValidShares.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel-subtle text-xs text-[#456784] flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#087FE0] shrink-0" />
            <div>
              <strong className="text-[#0F2942]">No Shared Individual Reports:</strong> No student
              currently has an active sharing permission for this institution.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeValidShares.map((sh) => {
              const target = state.targets.find((t) => t.id === sh.scopeTargetId);
              return (
                <div
                  key={sh.id}
                  className="p-4 rounded-xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-[#0F2942]">
                        Student: {state.currentUser?.fullName || 'Shared Student Profile'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#087FE0]">
                        Active Permission
                      </span>
                    </div>
                    <div className="text-xs text-[#456784]">
                      Opportunity Report: <strong>{target?.title || sh.scopeTargetId}</strong> •
                      Access Expires: {new Date(sh.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <LiquidButton
                    variant="primary"
                    size="sm"
                    pill
                    onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
                  >
                    View Shared Report
                  </LiquidButton>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
