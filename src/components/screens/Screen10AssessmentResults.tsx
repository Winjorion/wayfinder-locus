import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { RIASEC_DOMAIN_LABELS } from '../../data/riasecBank';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';
import { RiasecDomain } from '../../types/wayfinder';
import {
  Compass,
  BrainCircuit,
  Award,
  ShieldAlert,
  ArrowRight,
  Activity,
  BookOpen,
  Layers,
} from 'lucide-react';
import { LiquidButton, LiquidCard, TactileProgressBar } from '../common/LiquidGlassKit';

export const Screen10AssessmentResults: React.FC = () => {
  const { state, navigateTo } = useWayfinder();
  const riasec = state.riasecResult;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
            My Assessment Results
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942] mt-1">
            Interests, Field Skill Assessments &amp; Aptitude Summary
          </h1>
          <p className="text-xs sm:text-sm text-[#456784] mt-1">
            Review your career interest profile alongside your versioned skill assessment attempts,
            diagnostic feedback, and recommended learning resources.
          </p>
        </div>

        <LiquidButton
          variant="primary"
          pill
          onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
          icon={<Award className="w-4 h-4" />}
        >
          Open Capability Passport
        </LiquidButton>
      </div>

      {/* Section 1: RIASEC Profile */}
      <LiquidCard stacked className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                1. Career Interest Profile (RIASEC)
              </h2>
              <p className="text-xs text-[#527493]">
                Based on your responses across all 48 interest questions
              </p>
            </div>
          </div>

          {riasec && (
            <div className="px-4 py-2 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] font-mono text-sm text-[#087FE0] font-semibold shadow-sm">
              Top Interest Code:{' '}
              <strong className="text-base text-[#0F2942]">{riasec.topThreeCode}</strong>
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>How to use this profile:</strong> Your RIASEC results highlight the types of
            work and environments that interest you most. They are never treated as skill-test
            results or proof of capability.
          </span>
        </div>

        {riasec ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['R', 'I', 'A', 'S', 'E', 'C'] as RiasecDomain[]).map((dom) => {
              const pct = riasec.normalizedPercentage[dom];
              const raw = riasec.rawDomainSums[dom];
              return (
                <div key={dom} className="p-4 rounded-xl glass-panel-subtle space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F2942]">
                      {dom} — {RIASEC_DOMAIN_LABELS[dom]}
                    </span>
                    <span className="font-mono font-semibold text-[#087FE0]">{pct}%</span>
                  </div>
                  <TactileProgressBar value={pct} showThumb={false} accent="cyan" />
                  <div className="text-[11px] font-mono text-[#527493]">
                    Score: {raw} / 40 (8 questions)
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[#0F2942]">
                Career Interest Profile Not Completed Yet
              </div>
              <p className="text-xs text-[#456784] mt-0.5">
                Answer all 48 questions in the RIASEC assessment to see your top career interest
                areas.
              </p>
            </div>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('07_RIASEC_ASSESSMENT')}
              icon={<Activity className="w-3.5 h-3.5 text-[#087FE0]" />}
            >
              Start Interest Assessment
            </LiquidButton>
          </div>
        )}
      </LiquidCard>

      {/* Section 2: Field & Skill Assessment Attempts */}
      <LiquidCard stacked className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                2. Completed Field &amp; Skill Assessments
              </h2>
              <p className="text-xs text-[#527493]">
                Versioned skill assessments with diagnostic feedback, limitations, and learning
                recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
            className="text-xs text-[#087FE0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Take a Skill Assessment <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.skillAssessmentAttempts.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[#0F2942]">
                No Field &amp; Skill Assessments Completed Yet
              </div>
              <p className="text-xs text-[#456784] mt-0.5">
                Complete a skill assessment (such as Relational SQL, Defensive API Engineering,
                Financial Analysis, or Empirical Research Design) to record a versioned attempt.
              </p>
            </div>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
            >
              Open Skill Assessment Engine
            </LiquidButton>
          </div>
        ) : (
          <div className="space-y-4">
            {state.skillAssessmentAttempts.map((att) => (
              <div key={att.id} className="p-5 rounded-xl glass-panel-subtle space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-[#087FE0]">
                      {att.assessmentId} · v{att.assessmentVersion} ·{' '}
                      {new Date(att.completedAt).toLocaleDateString()}
                    </div>
                    <h3 className="font-display text-base font-bold text-[#0F2942]">
                      {att.assessmentTitle}
                    </h3>
                    <div className="text-[#456784]">
                      Capability:{' '}
                      <strong>{getCapabilityDimensionName(att.mappedCapabilityId)}</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    {att.completionStatus === 'COMPLETED_SCORED' ? (
                      <div className="font-mono font-bold text-sm text-[#087FE0]">
                        {att.correctCount}/{att.totalItems} ({att.scorePercentage}%) · Assessed
                        Level {att.awardedRubricLevel} / 4
                      </div>
                    ) : (
                      <div className="font-mono font-semibold text-amber-800">
                        Submitted for Human Review
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#C5E4FA]">
                  <div>
                    <strong className="text-emerald-800 block">Demonstrated Strengths:</strong>
                    {att.demonstratedStrengths.length > 0
                      ? att.demonstratedStrengths.join('; ')
                      : 'None recorded on this attempt'}
                  </div>
                  <div>
                    <strong className="text-amber-800 block">Areas to Improve:</strong>
                    {att.areasNeedingDevelopment.length > 0
                      ? att.areasNeedingDevelopment.join('; ')
                      : 'All tested subtopics answered accurately'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#C5E4FA]">
                  <span className="text-[11px] text-[#527493]">
                    <strong>Limitation:</strong> {att.limitationsExplanation}
                  </span>
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    pill
                    onClick={() => navigateTo('15_LEARNING_CENTRE')}
                    icon={<BookOpen className="w-3.5 h-3.5 text-[#087FE0]" />}
                  >
                    Recommended Learning ({att.recommendedResourceIds.length})
                  </LiquidButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </LiquidCard>

      {/* Section 3: Core Aptitude & Domain Attempts */}
      <LiquidCard stacked className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                3. Completed Core Aptitude Modules
              </h2>
              <p className="text-xs text-[#527493]">
                Objective reasoning modules that establish foundational skill levels (0–4).
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
            className="text-xs text-[#087FE0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Take an Aptitude Module <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.aptitudeAttempts.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[#0F2942]">
                No Core Aptitude Modules Completed Yet
              </div>
              <p className="text-xs text-[#456784] mt-0.5">
                Complete a Numerical, Verbal, Logical, or Software &amp; Systems module to
                establish an objective skill level in your Capability Passport.
              </p>
            </div>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
              icon={<BrainCircuit className="w-3.5 h-3.5 text-[#087FE0]" />}
            >
              Start Aptitude Module
            </LiquidButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.aptitudeAttempts.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-xl glass-panel-subtle flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-semibold text-[#087FE0]">{att.domain}</div>
                  <div className="text-sm font-semibold text-[#0F2942] mt-0.5">
                    Score: {att.correctCount} / {att.totalItems} ({att.percentage}%)
                  </div>
                  <div className="text-[11px] text-[#527493] mt-0.5">
                    Completed: {new Date(att.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-[#087FE0]">
                    Skill Level {att.mappedRubricLevel} / 4
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </LiquidCard>
    </div>
  );
};

