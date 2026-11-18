import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { History, Camera, Clock, FileCode, Compass } from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

const TRIGGER_LABELS: Record<string, string> = {
  CAPABILITY_CHANGE: 'Skill Assessment Updated',
  REASSESSMENT_COMPLETED: 'Skill Assessment Updated',
  EVIDENCE_REVIEWED: 'Evidence Verified',
  EVIDENCE_ACCEPTANCE: 'Evidence Verified',
  TARGET_VERSION_UPDATED: 'Opportunity Requirements Updated',
  TARGET_VERSION_CHANGE: 'Opportunity Requirements Updated',
  MANUAL_SNAPSHOT: 'Saved Milestone',
  MANUAL_RECALCULATION: 'Saved Milestone',
};

export const Screen19HistoricalSnapshots: React.FC = () => {
  const { state, createManualSnapshot, navigateTo } = useWayfinder();
  const hasTarget = state.targets.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#087FE0]">
            <History className="w-4 h-4 text-[#087FE0]" />
            <span>READINESS HISTORY & MILESTONES</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
            Track Your Readiness Over Time
          </h1>
          <p className="text-xs sm:text-sm text-[#456784] max-w-3xl leading-relaxed">
            Review saved readiness milestones and see whether changes came from{' '}
            <strong className="text-[#0F2942]">Skill Improvement</strong>,{' '}
            <strong className="text-emerald-700">Verified Evidence</strong>, or{' '}
            <strong className="text-amber-700">Updated Opportunity Requirements</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasTarget ? (
            <LiquidButton
              variant="primary"
              size="sm"
              pill
              onClick={() =>
                createManualSnapshot('Readiness milestone saved from Readiness History')
              }
              icon={<Camera className="w-4 h-4" />}
            >
              Save Readiness Milestone
            </LiquidButton>
          ) : (
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
              icon={<Compass className="w-4 h-4 text-[#087FE0]" />}
            >
              Select an Opportunity to Save Milestones
            </LiquidButton>
          )}
        </div>
      </div>

      {/* Cooldown & Reassessment Rule Banner */}
      <div className="p-4 rounded-xl glass-panel-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-[#087FE0] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#0F2942]">Assessment Retake Schedule:</strong>{' '}
            <span className="text-[#456784]">
              You can retake objective domain assessments after{' '}
              <strong className="text-[#087FE0]">
                {state.featureFlags.aptitudeCooldownHours} hours
              </strong>
              . Previous assessment attempts are preserved in your history so you can see your
              progress over time.
            </span>
          </div>
        </div>
        <button
          onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
          className="text-[#087FE0] font-semibold hover:underline font-mono shrink-0 cursor-pointer"
        >
          Open Domain Assessment →
        </button>
      </div>

      {/* Historical Snapshots Comparison Grid */}
      <div className="space-y-4">
        <h2 className="font-display text-base font-bold text-[#0F2942]">
          1. Saved Readiness Milestones ({state.snapshots.length})
        </h2>

        {state.snapshots.length === 0 ? (
          <div className="liquid-stack-card rounded-2xl p-8 text-center space-y-2">
            <div className="font-display text-sm font-bold text-[#0F2942]">
              No Readiness Milestones Saved Yet
            </div>
            <p className="text-xs text-[#456784] max-w-md mx-auto">
              Milestones are saved when you capture a snapshot for a target opportunity or when a
              reviewer verifies a piece of evidence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.snapshots.map((snap) => (
              <div key={snap.id} className="liquid-stack-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono font-semibold text-[#087FE0] bg-[#F0F9FF] px-2.5 py-0.5 rounded border border-[#C5E4FA]">
                    {new Date(snap.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF2FF] text-[#174B80] border border-[#8CCBFF]">
                    {TRIGGER_LABELS[snap.triggerType] || snap.triggerType}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-base font-bold text-[#0F2942]">
                    {snap.summaryNote}
                  </h3>
                  <div className="text-[11px] font-mono text-[#527493] mt-1">
                    Opportunity: {snap.targetTitle} ({snap.targetVersion}) •{' '}
                    {new Date(snap.createdAt).toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl glass-panel-subtle text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#527493] block">Demonstrated</span>
                    <span className="text-emerald-700 font-bold">
                      {snap.statusCounts.DEMONSTRATED}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#527493] block">Skill Gaps</span>
                    <span className="text-amber-700 font-bold">
                      {snap.statusCounts.PARTIALLY_DEMONSTRATED +
                        snap.statusCounts.DEVELOPMENT_NEEDED}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#527493] block">Needs Assessment</span>
                    <span className="text-[#174B80] font-bold">
                      {snap.statusCounts.UNKNOWN_INSUFFICIENT_INFO}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity History Log */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display text-base font-bold text-[#0F2942] flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#087FE0]" /> 2. Recent Readiness Activity (
            {state.auditEvents.length})
          </h2>
          <span className="text-xs font-mono text-[#527493]">
            Chronological record of profile and evidence updates
          </span>
        </div>

        {state.auditEvents.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel-subtle text-center text-xs text-[#456784]">
            No activity recorded in this session yet. Completing assessments, updating skill
            ratings, or submitting evidence will appear here.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {state.auditEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#087FE0] font-bold">
                      {ev.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[#527493]">• {ev.actorRole}</span>
                  </div>
                  <p className="font-sans text-[#0F2942] text-xs">{ev.details}</p>
                </div>
                <span className="text-[11px] font-mono text-[#527493] shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
