import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { getFieldById } from '../../data/fieldAndSkillLibrary';
import { ASSESSMENT_TYPE_CAPABILITY_MATRIX } from '../../data/skillAssessmentBank';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';
import {
  Compass,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Info,
  Sparkles,
  Layers,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { LiquidButton, LiquidCard } from '../common/LiquidGlassKit';

export const Screen06AssessmentHub: React.FC = () => {
  const { state, selectSkillAssessment, navigateTo } = useWayfinder();

  const handleLaunchSkillAssessment = (assessmentId: string) => {
    selectSkillAssessment(assessmentId);
    navigateTo('08_APTITUDE_ASSESSMENT');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#087FE0]">
          <Sparkles className="w-3.5 h-3.5 text-[#087FE0]" />
          <span>ASSESSMENT HUB • INTERESTS, SKILL ASSESSMENTS &amp; SELF-REFLECTION</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
          Explore Your Interests and Assess Your Field &amp; Domain Skills
        </h1>
        <p className="text-sm text-[#456784] max-w-3xl leading-relaxed">
          WAYFINDER separates <strong>Career Interest Discovery (RIASEC)</strong>,{' '}
          <strong>Field &amp; Skill Assessments</strong>, and{' '}
          <strong>Self-Reported Confidence Claims</strong> so you always know what is an interest,
          what is an unverified claim, and what is demonstrated capability.
        </p>
      </div>

      {/* Three Assessment Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. RIASEC */}
        <LiquidCard stacked glowBar accent="cyan" className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
                <Compass className="w-5 h-5 text-[#087FE0]" />
              </div>
              <span className="text-xs font-mono font-semibold text-[#087FE0]">
                48 Questions · 6 Areas
              </span>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                1. Career Interest Inventory (RIASEC)
              </h2>
              <p className="text-xs text-[#456784] mt-1 leading-relaxed">
                Explore the types of work and problem-solving environments you naturally enjoy
                across Realistic, Investigative, Artistic, Social, Enterprising, and Conventional
                areas.
              </p>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-subtle text-xs space-y-1">
              <div className="font-semibold text-[#087FE0]">What It Measures &amp; Cannot Prove</div>
              <div className="text-[#456784]">
                • Answer all 48 questions to generate your top three interest areas.
                <br />• Helps guide opportunity exploration across fields.
                <br />• <strong className="text-amber-700">Boundary:</strong> Measures career
                interests only—never treated as a skill test or proof of capability.
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#C5E4FA]">
            {state.riasecResult ? (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed: Code{' '}
                  <strong className="font-mono">{state.riasecResult.topThreeCode}</strong>
                </span>
                <span className="text-[#527493]">48/48 answered</span>
              </div>
            ) : (
              <div className="text-xs text-amber-700 font-medium">Not yet completed</div>
            )}

            <LiquidButton
              variant="primary"
              pill
              className="w-full"
              onClick={() => navigateTo('07_RIASEC_ASSESSMENT')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Start Interest Assessment
            </LiquidButton>
          </div>
        </LiquidCard>

        {/* 2. Skill Assessment Engine & Core Aptitude */}
        <LiquidCard stacked glowBar accent="blue" className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
                <BrainCircuit className="w-5 h-5 text-[#087FE0]" />
              </div>
              <span className="text-xs font-mono font-semibold text-[#174B80]">
                Levels 0–4 · Versioned
              </span>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                2. Skill Assessment Engine &amp; Aptitude
              </h2>
              <p className="text-xs text-[#456784] mt-1 leading-relaxed">
                Take field-specific skill assessments (SQL, Software Engineering, Quantitative
                Finance, Empirical Research, Design Portfolio) plus core Numerical, Verbal, and
                Logical modules.
              </p>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-subtle text-xs space-y-1">
              <div className="font-semibold text-[#087FE0]">Builds Your Demonstrated Profile</div>
              <div className="text-[#456784]">
                • Supports multiple-choice, multiple-select, numerical, scenario, and
                reviewer-evaluated portfolio tasks.
                <br />• Quiz scores establish an assessed level (0–4) while explaining what still
                requires practical project proof.
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#C5E4FA]">
            <div className="text-xs text-[#527493] flex items-center justify-between">
              <span>Completed Attempts:</span>
              <span className="font-mono font-semibold text-[#087FE0]">
                {state.skillAssessmentAttempts.length + state.aptitudeAttempts.length}
              </span>
            </div>

            <LiquidButton
              variant="primary"
              pill
              className="w-full"
              onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Open Skill Assessment Engine
            </LiquidButton>
          </div>
        </LiquidCard>

        {/* 3. Skill Self-Assessment & Rubric */}
        <LiquidCard stacked glowBar accent="violet" className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
                <Sliders className="w-5 h-5 text-[#168FE0]" />
              </div>
              <span className="text-xs font-semibold text-amber-800">Self-Reported Claim</span>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                3. Skill Self-Assessment Rubric
              </h2>
              <p className="text-xs text-[#456784] mt-1 leading-relaxed">
                Reflect on your experience across all 10 core capability areas using clear,
                real-world behavioral descriptions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-subtle text-xs space-y-1">
              <div className="font-semibold text-amber-700">Recorded as a Self-Reported Claim</div>
              <div className="text-[#456784]">
                • Choosing &ldquo;Not tried yet&rdquo; keeps the skill marked as needing more
                information—never as zero.
                <br />• Self-ratings are kept separate from assessed skill levels until verified.
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#C5E4FA]">
            <div className="text-xs text-[#527493] flex items-center justify-between">
              <span>Rating Format:</span>
              <span className="font-semibold text-[#087FE0]">
                {state.featureFlags.skillSelfReportScaleMode === 'BEHAVIORAL_0_4'
                  ? 'Levels 0–4 (Behavioral)'
                  : '1–5 Confidence Scale'}
              </span>
            </div>

            <LiquidButton
              variant="secondary"
              pill
              className="w-full"
              onClick={() => navigateTo('09_SKILL_RUBRIC_ASSESSMENT')}
              icon={<ArrowRight className="w-4 h-4 text-[#087FE0]" />}
            >
              Open Skill Self-Assessment
            </LiquidButton>
          </div>
        </LiquidCard>
      </div>

      {/* Field & Skill Assessments Catalogue */}
      <div className="liquid-stack-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
              Field-Agnostic Skill Assessment Library
            </span>
            <h2 className="font-display text-xl font-bold text-[#0F2942] mt-0.5">
              Available Versioned Skill Assessments Across Disciplines
            </h2>
            <p className="text-xs text-[#456784] mt-0.5">
              Select a skill assessment below to review its instructions, measurement objective,
              scoring rules, and complete an attempt.
            </p>
          </div>
          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('15_LEARNING_CENTRE')}
            icon={<Layers className="w-3.5 h-3.5 text-[#087FE0]" />}
          >
            Browse All 18 Fields &amp; Skills →
          </LiquidButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.skillAssessments.map((asm) => {
            const field = getFieldById(asm.fieldId, state.fieldsCatalogue);
            const pastAttempts = state.skillAssessmentAttempts.filter(
              (att) => att.assessmentId === asm.id
            );
            const latestAttempt = pastAttempts[0] || null;

            return (
              <div
                key={asm.id}
                className="p-5 rounded-2xl glass-panel-subtle flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#527493]">
                    <span className="font-semibold text-[#087FE0]">
                      {field?.shortName || asm.fieldId}
                    </span>
                    <span>·</span>
                    <span className="font-mono">v{asm.version}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {asm.estimatedDurationMinutes} min
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-[#0F2942] leading-snug">
                    {asm.title}
                  </h3>

                  <div className="text-xs text-[#174B80]">
                    Capability: <strong>{getCapabilityDimensionName(asm.mappedCapabilityId)}</strong>{' '}
                    · Up to Level {asm.targetProficiencyLevel}
                  </div>

                  <p className="text-xs text-[#456784] leading-relaxed">
                    {asm.measurementObjective}
                  </p>

                  <div className="text-[11px] text-[#527493] pt-1">
                    Evaluation:{' '}
                    <strong className="text-[#0F2942]">
                      {asm.requiresHumanReview
                        ? 'Human Reviewer Rubric (Portfolio / Project)'
                        : `Deterministic Key (${asm.items.length} questions)`}
                    </strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#C5E4FA] flex items-center justify-between gap-2">
                  {latestAttempt ? (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {latestAttempt.completionStatus === 'COMPLETED_SCORED'
                        ? `Last: ${latestAttempt.scorePercentage}% (Level ${latestAttempt.awardedRubricLevel})`
                        : 'Submitted for Review'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#527493]">No attempts yet</span>
                  )}

                  <LiquidButton
                    variant="primary"
                    size="sm"
                    pill
                    onClick={() => handleLaunchSkillAssessment(asm.id)}
                  >
                    {latestAttempt ? 'Retake / Open' : 'Start Assessment'}
                  </LiquidButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Methods & Transparency Matrix */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#087FE0]" />
          <h2 className="font-display text-base font-bold text-[#0F2942]">
            Assessment Types &amp; Evaluation Integrity
          </h2>
        </div>
        <p className="text-xs text-[#456784]">
          Not every skill can be validly measured with a multiple-choice quiz. WAYFINDER clearly
          distinguishes deterministic item types, reviewer-evaluated submissions, and assessment
          types not yet operational in this environment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ASSESSMENT_TYPE_CAPABILITY_MATRIX.map((meta) => (
            <div key={meta.type} className="p-3.5 rounded-xl glass-panel-subtle space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <strong className="text-[#0F2942]">{meta.label}</strong>
              </div>
              <div className="text-[11px] font-mono text-[#087FE0]">
                {meta.supportState === 'SUPPORTED_DETERMINISTIC'
                  ? 'Operational · Deterministic Scoring'
                  : meta.supportState === 'SUPPORTED_REVIEWER_WORKFLOW'
                  ? 'Operational · Human Reviewer Workflow'
                  : 'Not Operational in Current Runtime'}
              </div>
              <p className="text-[11px] text-[#456784] leading-snug">{meta.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info & Results Link */}
      <div className="liquid-stack-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#087FE0] shrink-0 mt-0.5" />
          <div className="text-xs text-[#456784] leading-relaxed">
            <strong className="text-[#0F2942]">How Your Results Come Together:</strong> View your
            career interest profile, versioned skill assessment attempts, aptitude scores, and
            recommended learning resources in your Results Summary.
          </div>
        </div>
        <LiquidButton
          variant="secondary"
          size="sm"
          pill
          onClick={() => navigateTo('10_ASSESSMENT_RESULTS')}
        >
          View My Assessment Results
        </LiquidButton>
      </div>
    </div>
  );
};

