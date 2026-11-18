import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { CANONICAL_CAPABILITY_DIMENSIONS, RUBRIC_V1_ANCHORS } from '../../data/capabilityDimensions';
import { CapabilityDimensionId, RubricLevel } from '../../types/wayfinder';
import { Sliders, ShieldAlert, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

export const Screen09SkillRubricAssessment: React.FC = () => {
  const { state, updateSelfReportedSkill, navigateTo } = useWayfinder();
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const scaleMode = state.featureFlags.skillSelfReportScaleMode;

  const handleSelectLevel = (dimId: CapabilityDimensionId, level: RubricLevel | null) => {
    const dimName =
      CANONICAL_CAPABILITY_DIMENSIONS.find((d) => d.id === dimId)?.name || dimId;
    updateSelfReportedSkill(dimId, level);
    setSavedToast(
      `Updated your self-rating for ${dimName} to ${
        level === null ? 'Not tried yet (more information needed)' : `Level ${level}`
      }`
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
              <Sliders className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold text-[#087FE0] uppercase">
                Skill Self-Assessment
              </span>
              <h1 className="font-display text-2xl font-bold text-[#0F2942]">
                Rate Your Current Experience Across 10 Core Skills
              </h1>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            Self-Reported Claims
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-display font-bold text-amber-950">
              How Self-Ratings Work
            </div>
            <p className="leading-relaxed text-amber-800">
              Choosing <strong>Not Tried Yet</strong> keeps a skill marked as needing more
              information rather than counting it as zero. Self-ratings are recorded as{' '}
              <strong>Claims</strong> and are kept separate from your demonstrated skill levels until
              confirmed by an assessment or reviewed evidence.
            </p>
          </div>
        </div>

        {savedToast && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {savedToast}
            </span>
            <button
              onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
              className="text-[#087FE0] font-semibold hover:underline cursor-pointer"
            >
              View in Capability Passport →
            </button>
          </div>
        )}
      </div>

      {/* 10 Canonical Dimensions List */}
      <div className="space-y-4">
        {CANONICAL_CAPABILITY_DIMENSIONS.map((dim, idx) => {
          const record = state.capabilityRecords.find((r) => r.dimensionId === dim.id);
          const currentClaim = record?.selfReportedLevel ?? null;
          const currentDemonstrated = record?.demonstratedLevel ?? null;

          return (
            <div key={dim.id} className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#087FE0] px-2 py-0.5 rounded bg-[#F0F9FF] border border-[#C5E4FA]">
                      Skill {idx + 1}
                    </span>
                    <h2 className="font-display text-base font-bold text-[#0F2942]">{dim.name}</h2>
                  </div>
                  <p className="text-xs text-[#456784] mt-1">{dim.description}</p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
                    Your Claim:{' '}
                    {currentClaim === null ? 'Not tried yet' : `Level ${currentClaim}`}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF] font-semibold">
                    Demonstrated:{' '}
                    {currentDemonstrated === null ? 'Not assessed' : `Level ${currentDemonstrated}`}
                  </span>
                </div>
              </div>

              {/* Level Selection Buttons including explicit UNTRIED */}
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectLevel(dim.id, null)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    currentClaim === null
                      ? 'tab-liquid-active text-[#0F2942]'
                      : 'bg-white/80 border-[#C5E4FA] text-[#527493] hover:text-[#0F2942] hover:bg-[#F0F9FF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#174B80]">Not Tried Yet</span>
                    <HelpCircle className="w-3.5 h-3.5 text-[#527493]" />
                  </div>
                  <p className="text-[11px] mt-1 leading-snug text-[#456784]">
                    No experience yet (shown as needing more info, never 0)
                  </p>
                </button>

                {([0, 1, 2, 3, 4] as RubricLevel[]).map((lvl) => {
                  const anchor = RUBRIC_V1_ANCHORS[lvl];
                  const isSelected = currentClaim === lvl;
                  const displayLevel =
                    scaleMode === 'BEHAVIORAL_0_4' ? `Level ${lvl}` : `Rating ${lvl + 1}/5`;

                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleSelectLevel(dim.id, lvl)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'tab-liquid-active text-[#0F2942]'
                          : 'bg-white/80 border-[#C5E4FA] text-[#456784] hover:text-[#0F2942] hover:border-[#8CCBFF] hover:bg-[#F0F9FF]'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold text-[#087FE0]">
                        {displayLevel}: {anchor.label}
                      </div>
                      <p className="text-[10px] mt-1 leading-snug text-[#456784]">
                        {anchor.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="liquid-stack-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[#456784]">
          Your self-ratings are saved directly to the Claim column of your Capability Passport.
        </span>
        <LiquidButton
          variant="primary"
          pill
          onClick={() => navigateTo('10_ASSESSMENT_RESULTS')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          View Assessment Results
        </LiquidButton>
      </div>
    </div>
  );
};
