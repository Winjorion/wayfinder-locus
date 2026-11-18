import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { RIASEC_ITEMS, RIASEC_DOMAIN_LABELS } from '../../data/riasecBank';
import { RiasecDomain } from '../../types/wayfinder';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ListFilter,
} from 'lucide-react';
import {
  LiquidButton,
  LiquidTabs,
  TactileProgressBar,
  TactileProgressRing,
} from '../common/LiquidGlassKit';

const DOMAINS: RiasecDomain[] = ['R', 'I', 'A', 'S', 'E', 'C'];

const RADIO_OPTIONS: { val: number; label: string }[] = [
  { val: 5, label: 'Strongly agree' },
  { val: 4, label: 'Agree' },
  { val: 3, label: 'Neutral' },
  { val: 2, label: 'Disagree' },
  { val: 1, label: 'Strongly disagree' },
];

export const Screen07RiasecAssessment: React.FC = () => {
  const { submitRiasecResponses, navigateTo } = useWayfinder();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'DOMAIN'>('SINGLE');
  const [activeDomain, setActiveDomain] = useState<RiasecDomain>('R');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(responses).length;
  const progressPct = Math.round((answeredCount / 48) * 100);
  const currentItem = RIASEC_ITEMS[currentIndex] || RIASEC_ITEMS[0];
  const domainItems = RIASEC_ITEMS.filter((i) => i.domain === activeDomain);

  const handleSelect = (itemId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
    if (error) setError(null);
  };

  const handleSetDomainNeutral = () => {
    const targetDom = viewMode === 'SINGLE' ? currentItem.domain : activeDomain;
    const itemsToFill = RIASEC_ITEMS.filter((i) => i.domain === targetDom);
    setResponses((prev) => {
      const next = { ...prev };
      itemsToFill.forEach((item) => {
        if (next[item.id] === undefined) next[item.id] = 3;
      });
      return next;
    });
    setError(null);
  };

  const handleClearResponses = () => {
    setResponses({});
    setError(null);
  };

  const handleSubmit = () => {
    if (Object.keys(responses).length < 48) {
      setError(
        `Incomplete response set: ${Object.keys(responses).length}/48 items answered. All 48 items are required before calculating a final RIASEC profile.`
      );
      return;
    }
    setError(null);
    submitRiasecResponses(responses);
    navigateTo('10_ASSESSMENT_RESULTS');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* TOP HEADER BAR — High-Transparency Glass */}
      <div className="glass-panel liquid-glow-bar rounded-[24px] p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <button
            type="button"
            onClick={() => navigateTo('06_ASSESSMENT_HUB')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F68FF] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Assessments
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'SINGLE' ? 'DOMAIN' : 'SINGLE')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass-floating text-[#0B2E56] hover:border-white transition-all cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5 text-[#2178EE]" />
              <span>
                {viewMode === 'SINGLE' ? 'Switch to Domain Batch View' : 'Switch to Single Question View'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
              RIASEC Interest Assessment
            </h1>
            <p className="text-xs sm:text-sm text-[#0B2E56]/85">
              Discover what gives you energy, helps you engage, and aligns with your natural
              interests.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#1A4678]">Answered</span>
              <span className="font-bold text-[#0B2E56]">{answeredCount} / 48</span>
            </div>
            <TactileProgressBar value={progressPct} accent="cyan" showThumb={false} />
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl glass-panel border border-white/75 text-[#0B2E56] text-xs flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-[#1F68FF] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Single Question Card OR Domain Batch View */}
        <div className="lg:col-span-7 space-y-5">
          {viewMode === 'SINGLE' ? (
            <div className="glass-panel rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between gap-2 relative z-10">
                <span className="text-xs font-semibold text-[#1A4678]">
                  Question {currentIndex + 1} of 48
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold glass-floating text-[#1F68FF]">
                  {currentItem.domain} — {RIASEC_DOMAIN_LABELS[currentItem.domain]}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B2E56] leading-snug relative z-10">
                {currentItem.prompt}
              </h2>

              {/* 5 Vertical Translucent Glass Radio Option Rows */}
              <div
                className="space-y-2.5 pt-1 relative z-10"
                role="radiogroup"
                aria-label={currentItem.prompt}
              >
                {RADIO_OPTIONS.map((opt) => {
                  const selected = responses[currentItem.id] === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => handleSelect(currentItem.id, opt.val)}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                        selected
                          ? 'tab-liquid-active text-[#0B2E56] font-bold border-[#075FC7]/60'
                          : 'glass-panel-subtle text-[#123B63] font-medium hover:bg-white/40 hover:border-white/85'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'border-[#075FC7] bg-[#075FC7] shadow-[0_2px_8px_rgba(7,95,199,0.45)]'
                            : 'border-[#174B80]/55 bg-white/45'
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Previous / Next Navigation Bar */}
              <div className="pt-4 border-t border-white/45 flex items-center justify-between gap-4 relative z-10">
                <LiquidButton
                  type="button"
                  variant="secondary"
                  pill
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  icon={<ArrowLeft className="w-4 h-4 text-[#0B2E56]" />}
                >
                  Previous
                </LiquidButton>

                <div className="text-xs font-mono text-[#1A4678]">
                  {currentIndex + 1} / 48
                </div>

                {currentIndex < 47 ? (
                  <LiquidButton
                    type="button"
                    variant="primary"
                    pill
                    onClick={() => setCurrentIndex((i) => Math.min(47, i + 1))}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </LiquidButton>
                ) : (
                  <LiquidButton
                    type="button"
                    variant="primary"
                    pill
                    onClick={handleSubmit}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Finish &amp; Calculate
                  </LiquidButton>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-4">
                <LiquidTabs
                  tabs={DOMAINS.map((dom) => {
                    const countInDom = RIASEC_ITEMS.filter(
                      (i) => i.domain === dom && responses[i.id] !== undefined
                    ).length;
                    return {
                      id: dom,
                      label: `${dom} — ${RIASEC_DOMAIN_LABELS[dom]}`,
                      count: `${countInDom}/8`,
                    };
                  })}
                  activeTab={activeDomain}
                  onChange={setActiveDomain}
                  className="w-full"
                />
              </div>

              {domainItems.map((item, idx) => {
                const currentVal = responses[item.id];
                return (
                  <div key={item.id} className="glass-panel rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <span className="text-xs font-semibold text-[#1F68FF] glass-floating px-2.5 py-0.5 rounded-md">
                        Question {idx + 1} of {domainItems.length}
                      </span>
                      <span className="text-[11px] font-medium text-[#1A4678]">
                        {RIASEC_DOMAIN_LABELS[item.domain]}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#0B2E56] relative z-10">{item.prompt}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 relative z-10">
                      {RADIO_OPTIONS.map((opt) => {
                        const selected = currentVal === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => handleSelect(item.id, opt.val)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                              selected
                                ? 'tab-liquid-active text-[#0B2E56] font-semibold'
                                : 'glass-panel-subtle text-[#0B2E56]/80 hover:text-[#0B2E56] hover:border-white/75'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Your Progress Card + Quick Tip Card + Quick Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Your Progress Card */}
          <div className="glass-panel rounded-[24px] p-6 space-y-5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 relative z-10">
              {/* Soft 3D Glass Bar Chart Graphic */}
              <div className="flex items-end gap-2 pt-4 pl-2">
                <div className="w-5 h-12 rounded-t-lg bg-gradient-to-t from-[#8DBDFF]/65 to-[#E5FAFF]/85 border border-white/75 shadow-xs" />
                <div className="w-5 h-20 rounded-t-lg bg-gradient-to-t from-[#2178EE]/85 to-[#E5FAFF]/90 border border-white/75 shadow-xs" />
                <div className="w-5 h-16 rounded-t-lg bg-gradient-to-t from-[#8DBDFF]/75 to-[#FFFFFF]/85 border border-white/75 shadow-xs" />
                <div className="w-5 h-24 rounded-t-lg bg-gradient-to-t from-[#1F68FF]/90 to-[#8DBDFF]/90 border border-white/80 shadow-xs" />
              </div>

              {/* Floating Translucent Progress Ring Sub-Card */}
              <div className="glass-floating rounded-2xl p-4 space-y-2 min-w-[185px]">
                <div className="font-display text-xs font-bold text-[#0B2E56]">Your Progress</div>
                <TactileProgressRing
                  value={progressPct}
                  size={68}
                  label={`${answeredCount} of 48`}
                  sublabel="questions answered"
                  accent="cyan"
                />
              </div>
            </div>

            {/* Domain Jump Pills */}
            <div className="space-y-2 pt-2 border-t border-white/45 relative z-10">
              <div className="text-[11px] font-semibold text-[#1A4678]">
                Jump by Interest Domain:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DOMAINS.map((dom, domIdx) => {
                  const countInDom = RIASEC_ITEMS.filter(
                    (i) => i.domain === dom && responses[i.id] !== undefined
                  ).length;
                  const isCurrentDom =
                    viewMode === 'SINGLE'
                      ? currentItem.domain === dom
                      : activeDomain === dom;
                  return (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => {
                        setActiveDomain(dom);
                        setCurrentIndex(domIdx * 8);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                        isCurrentDom
                          ? 'tab-liquid-active text-[#1F68FF] font-bold'
                          : 'glass-panel-subtle text-[#0B2E56]/85 hover:border-white/75'
                      }`}
                    >
                      <span>{dom}</span>
                      <span className="font-mono text-[10px]">{countInDom}/8</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Tip Card */}
          <div className="glass-panel rounded-[24px] p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full glass-floating flex items-center justify-center text-[#1F68FF] shrink-0 relative z-10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="font-display text-sm font-bold text-[#0B2E56]">Quick Tip</h3>
              <p className="text-xs text-[#0B2E56]/85 leading-relaxed">
                There are no right or wrong answers. Just answer based on what feels most like you.
                Your RIASEC results guide opportunity exploration and are kept separate from your
                assessed skill levels.
              </p>
            </div>
          </div>

          {/* Assessment Utilities & Submit */}
          <div className="glass-panel rounded-[24px] p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2 relative z-10">
              <LiquidButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSetDomainNeutral}
                icon={<Sparkles className="w-3.5 h-3.5 text-[#2178EE]" />}
                className="flex-1"
              >
                Mark Unanswered in {viewMode === 'SINGLE' ? currentItem.domain : activeDomain} as
                Neutral (3)
              </LiquidButton>
              <LiquidButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearResponses}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </LiquidButton>
            </div>

            <LiquidButton
              type="button"
              variant="primary"
              size="lg"
              pill
              onClick={handleSubmit}
              icon={<CheckCircle2 className="w-4 h-4" />}
              className="w-full relative z-10"
            >
              Calculate RIASEC Profile ({answeredCount}/48)
            </LiquidButton>
          </div>
        </div>
      </div>
    </div>
  );
};
