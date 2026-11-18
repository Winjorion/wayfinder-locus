import React, { useState } from 'react';
import {
  Upload,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useWayfinder } from '../../context/WayfinderContext';
import { CANONICAL_CAPABILITY_DIMENSIONS } from '../../data/capabilityDimensions';
import { ActivityStatus, StudentResourceProgressState } from '../../types/wayfinder';
import {
  LiquidButton,
  LiquidCard,
  TactileProgressBar,
} from '../common/LiquidGlassKit';

export const Screen16ActivityWorkspace: React.FC = () => {
  const {
    state,
    navigateTo,
    updateActivityProgress,
    updateResourceProgress,
    selectSkillAssessment,
  } = useWayfinder();

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    state.activities[0]?.id || ''
  );

  const activity =
    state.activities.find((a) => a.id === selectedActivityId) ||
    state.activities[0] ||
    null;

  const targetCapDim = activity
    ? CANONICAL_CAPABILITY_DIMENSIONS.find((d) => d.id === activity.linkedDimensionId)
    : null;

  const targetCapRecord = activity
    ? state.capabilityRecords.find((r) => r.dimensionId === activity.linkedDimensionId)
    : null;

  const inputClass = 'w-full rounded-xl px-3.5 py-2 text-xs input-liquid';
  const labelClass = 'block text-[11px] font-mono uppercase tracking-wider text-slate-600 mb-1';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigateTo('15_LEARNING_CENTRE')}
            className="flex items-center gap-1.5 text-xs text-[#1F68FF] hover:underline mb-2 font-mono uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Learning Hub &amp; Field Library
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
            My Learning Progress &amp; Action Plan Workspace
          </h1>
          <p className="text-sm text-[#3E6084] mt-1">
            Track your self-study resources, complete structured project milestones, and convert your learning into verified capability proof.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
          >
            Take Skill Assessment
          </LiquidButton>
          <LiquidButton
            variant="primary"
            size="sm"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
          >
            Submit Proof Artifact
          </LiquidButton>
        </div>
      </div>

      {/* Integrity Safeguard Notice */}
      <div className="p-4 rounded-2xl glass-panel-subtle flex items-center gap-3 text-xs text-[#2B4C73]">
        <ShieldCheck className="w-4 h-4 text-[#1F68FF] shrink-0" />
        <span>
          <strong className="text-[#0B2E56]">Learning Progress vs. Demonstrated Proof:</strong> Self-study resource tracking and action plan progress record your preparation. Your official <strong>Demonstrated Capability Level</strong> updates only when you complete a versioned Skill Assessment or submit an artifact that passes verification in the Evidence Ledger.
        </span>
      </div>

      {/* Section 1: Tracked Learning Hub Resources */}
      <LiquidCard className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/50 pb-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#1F68FF]">
              Self-Study Resource Tracker
            </div>
            <h2 className="text-base font-bold text-[#0B2E56]">
              Saved &amp; In-Progress Learning Hub Resources ({state.resourceProgress.length})
            </h2>
          </div>
          <LiquidButton
            variant="secondary"
            size="sm"
            icon={<BookOpen className="w-3.5 h-3.5" />}
            onClick={() => navigateTo('15_LEARNING_CENTRE')}
          >
            Browse Learning Hub Catalogue
          </LiquidButton>
        </div>

        {state.resourceProgress.length === 0 ? (
          <div className="p-4 rounded-xl glass-panel-subtle text-xs text-[#3E6084] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>
              You have not saved or started any curated Learning Hub resources yet. Explore official documentation, university courseware, and YouTube lectures in the Learning Hub.
            </span>
            <LiquidButton
              variant="primary"
              size="sm"
              onClick={() => navigateTo('15_LEARNING_CENTRE')}
            >
              Explore Resources
            </LiquidButton>
          </div>
        ) : (
          <div className="space-y-3">
            {state.resourceProgress.map((prog) => {
              const res = state.learningResources.find((r) => r.id === prog.resourceId);
              if (!res) return null;
              const linkedAssessments = state.skillAssessments.filter((a) =>
                res.associatedSkillIds.includes(a.skillId)
              );

              return (
                <div
                  key={prog.resourceId}
                  className="p-4 rounded-xl glass-panel-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#1F68FF]">
                      <span>{res.providerOrCreator}</span>
                      <span>·</span>
                      <span>Updated {new Date(prog.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0B2E56]">{res.title}</h3>
                    <div className="text-xs text-[#3E6084]">
                      <strong>Learning Objective &amp; Next Proof Step:</strong>{' '}
                      {res.learningObjective}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <select
                      aria-label={`Self-study status for ${res.title}`}
                      value={prog.status}
                      onChange={(e) =>
                        updateResourceProgress(
                          res.id,
                          e.target.value as StudentResourceProgressState,
                          prog.notes
                        )
                      }
                      className="rounded-xl px-3 py-1.5 text-xs input-liquid"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="SAVED">Saved for Later</option>
                      <option value="BOOKMARKED">Bookmarked</option>
                      <option value="IN_PROGRESS">In Progress (Studying)</option>
                      <option value="COMPLETED_BY_USER">Completed by User (Self-Reported)</option>
                      <option value="REVIEWED_SELF_STUDY">Reviewed (Self-Study Complete)</option>
                      <option value="PRACTICE_REQUIRED">Practice Project Required</option>
                      <option value="READY_FOR_REASSESSMENT">Ready for Skill Reassessment</option>
                    </select>

                    <a
                      href={res.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {linkedAssessments[0] && (
                      <LiquidButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          selectSkillAssessment(linkedAssessments[0].id);
                          navigateTo('08_APTITUDE_ASSESSMENT');
                        }}
                      >
                        Take Skill Assessment
                      </LiquidButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </LiquidCard>

      {/* Section 2: Structured Development Plan Activities */}
      {!activity ? (
        <LiquidCard className="p-6 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-sky-700">
            Structured Action Plan Milestones
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            No Structured Development Activities Created Yet
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            Add a gap-linked action plan activity from the Learning Hub ("4. Action Plan &amp; Catalogue Curation" tab) or from Readiness Gap Analysis to track your deliverable preparation before uploading your final proof artifact.
          </p>
          <div className="pt-1">
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={() => navigateTo('15_LEARNING_CENTRE')}
            >
              Open Learning Hub Action Plan
            </LiquidButton>
          </div>
        </LiquidCard>
      ) : (
        <div className="space-y-4">
          {state.activities.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-600">Select Active Plan Item:</span>
              {state.activities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedActivityId(a.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    a.id === activity.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white/80 text-slate-700 border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  {a.title} ({a.progressPercent}%)
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LiquidCard className="lg:col-span-2 p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-sky-200/80">
                <div>
                  <span className="text-xs font-mono text-sky-700 uppercase">
                    {activity.linkedTargetTitle || 'Capability Development Plan'}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{activity.title}</h2>
                </div>
                <span className="text-sm font-mono font-bold text-sky-700">
                  {activity.progressPercent}% Complete
                </span>
              </div>

              <TactileProgressBar value={activity.progressPercent} />

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3.5 rounded-xl bg-sky-50/75 border border-sky-200/70">
                  <div className="font-mono text-[11px] uppercase text-sky-700 mb-1">
                    Objective
                  </div>
                  <p>{activity.objective}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 border border-sky-200/70">
                  <div className="font-mono text-[11px] uppercase text-sky-700 mb-1">
                    Practical Execution Instructions
                  </div>
                  <p>{activity.instructions}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <div className="font-mono text-[11px] uppercase text-emerald-800 mb-1">
                    Expected Verifiable Output Artifact
                  </div>
                  <p className="text-emerald-950">{activity.expectedOutputArtifact}</p>
                </div>
              </div>

              {/* Interactive Progress & Reflection Update */}
              <div className="pt-3 border-t border-sky-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Activity Status</label>
                  <select
                    value={activity.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as ActivityStatus;
                      const nextPct =
                        nextStatus === 'COMPLETED'
                          ? 100
                          : nextStatus === 'IN_PROGRESS'
                          ? Math.max(50, activity.progressPercent)
                          : nextStatus === 'PAUSED'
                          ? activity.progressPercent
                          : 0;
                      updateActivityProgress(
                        activity.id,
                        nextStatus,
                        nextPct,
                        activity.reflectionNotes
                      );
                    }}
                    className={inputClass}
                  >
                    <option value="NOT_STARTED">Not Started (0%)</option>
                    <option value="IN_PROGRESS">In Progress (50%)</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">
                      Deliverable Ready — Pending Evidence Upload (100%)
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Reflection / Deliverable Notes</label>
                  <input
                    type="text"
                    value={activity.reflectionNotes}
                    onChange={(e) =>
                      updateActivityProgress(
                        activity.id,
                        activity.status,
                        activity.progressPercent,
                        e.target.value
                      )
                    }
                    placeholder="Record repository link or key implementation notes..."
                    className={inputClass}
                  />
                </div>
              </div>
            </LiquidCard>

            <div className="space-y-6">
              <LiquidCard className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Target Capability Impact
                </h3>
                <div className="p-3.5 rounded-xl bg-sky-50/75 border border-sky-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Target Capability:</span>
                    <span className="font-bold text-slate-900">
                      {targetCapDim?.name || activity.linkedDimensionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Demonstrated Level:</span>
                    <span className="font-mono text-slate-800">
                      {targetCapRecord?.demonstratedLevel === null ||
                      targetCapRecord?.demonstratedLevel === undefined
                        ? 'Unassessed (null)'
                        : `Level ${targetCapRecord.demonstratedLevel}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Target Rubric Level:</span>
                    <span className="font-mono font-bold text-sky-700">
                      Level {activity.targetRubricLevel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Updating your activity status tracks your preparation progress, but does{' '}
                  <strong className="text-slate-900">not</strong> automatically elevate your Demonstrated Capability Level. Submit your completed deliverable to the Evidence Ledger for verification.
                </p>

                <LiquidButton
                  variant="primary"
                  className="w-full justify-center"
                  icon={<Upload className="w-4 h-4" />}
                  onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                >
                  Submit Artifact to Evidence Ledger
                </LiquidButton>
              </LiquidCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
