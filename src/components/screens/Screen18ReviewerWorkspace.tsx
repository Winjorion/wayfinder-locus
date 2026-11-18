import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';
import { EvidenceReviewDimensions, RubricLevel } from '../../types/wayfinder';
import { EvidenceStatusBadge } from '../common/StatusBadge';
import { Eye, ShieldCheck, Lock, CheckCircle2, Inbox } from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

const DECISION_LABELS: Record<'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED', string> = {
  ACCEPTED: 'Approved & Verified',
  REVISION_REQUESTED: 'Revision Requested',
  REJECTED: 'Declined',
};

export const Screen18ReviewerWorkspace: React.FC = () => {
  const { state, submitReviewerDecision, navigateTo } = useWayfinder();

  const reviewerUser =
    state.currentUser && state.currentUser.role === 'REVIEWER' ? state.currentUser : null;

  const assignedSubmissions = reviewerUser
    ? state.evidenceSubmissions.filter((ev) => ev.assignedReviewerId === reviewerUser.id)
    : [];

  const [selectedId, setSelectedId] = useState<string>(assignedSubmissions[0]?.id || '');

  const currentSubmission = assignedSubmissions.find((s) => s.id === selectedId);

  const [decision, setDecision] = useState<'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED'>(
    'ACCEPTED'
  );
  const [verifiedLevel, setVerifiedLevel] = useState<RubricLevel>(3);
  const [dims, setDims] = useState<EvidenceReviewDimensions>({
    relevance: 3,
    authenticityAndAttribution: 3,
    sufficiency: 3,
    quality: 3,
    currency: 3,
    context: 3,
  });
  const [rationale, setRationale] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubmission || !rationale.trim()) return;

    submitReviewerDecision(
      currentSubmission.id,
      decision,
      decision === 'ACCEPTED' ? verifiedLevel : null,
      dims,
      rationale.trim()
    );

    setSubmittedNotice(
      `Review decision (${DECISION_LABELS[decision]}) saved for "${currentSubmission.title}".`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
                Reviewer Workspace
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
                Evidence Review & Verification Queue
              </h1>
            </div>
          </div>

          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#F0F9FF] border border-[#C5E4FA] text-[#174B80]">
            {reviewerUser
              ? `Reviewer: ${reviewerUser.fullName}`
              : 'Not Signed In as Reviewer'}
          </span>
        </div>

        {/* Least-Privilege Isolation Notice */}
        <div className="p-3.5 rounded-xl glass-panel-subtle flex items-center gap-2.5 text-xs text-[#456784]">
          <Lock className="w-4 h-4 text-[#087FE0] shrink-0" />
          <span>
            <strong className="text-[#0F2942]">Reviewer Access & Scope:</strong> Reviewers can only
            view and evaluate evidence submissions assigned to their account. Unrelated student
            profiles and opportunity requirements remain private.
          </span>
        </div>
      </div>

      {submittedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {submittedNotice}
          </span>
          <button
            onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
            className="text-[#087FE0] font-semibold hover:underline font-mono cursor-pointer"
          >
            View Readiness Analysis →
          </button>
        </div>
      )}

      {assignedSubmissions.length === 0 ? (
        <div className="liquid-stack-card rounded-2xl p-10 text-center space-y-4 relative overflow-hidden">
          <div className="hidden sm:block absolute top-6 right-8 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
          <div className="w-14 h-14 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7 text-[#087FE0]" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-display text-xl font-bold text-[#0F2942]">No Reviews Assigned</h2>
            <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
              {reviewerUser
                ? 'There are currently no student evidence submissions assigned to your review queue.'
                : 'Sign in with an authorised Reviewer account to evaluate evidence submissions assigned to you.'}
            </p>
          </div>
          {!reviewerUser && (
            <div className="pt-2">
              <LiquidButton
                variant="secondary"
                pill
                onClick={() => navigateTo('03_LOGIN')}
              >
                Sign In as Reviewer
              </LiquidButton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Submissions Queue */}
          <div className="liquid-stack-card rounded-2xl p-5 space-y-3 h-fit">
            <h2 className="font-display text-sm font-bold uppercase text-[#087FE0]">
              Assigned Submissions ({assignedSubmissions.length})
            </h2>
            {assignedSubmissions.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setSubmittedNotice(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-1.5 cursor-pointer ${
                  item.id === selectedId
                    ? 'tab-liquid-active text-[#0F2942]'
                    : 'bg-white/80 border-[#C5E4FA] text-[#456784] hover:text-[#0F2942]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[#087FE0]">
                    {getCapabilityDimensionName(item.linkedDimensionId)}
                  </span>
                  <EvidenceStatusBadge status={item.status} />
                </div>
                <div className="text-sm font-semibold text-[#0F2942]">{item.title}</div>
                <div className="text-[11px] font-mono text-[#527493]">
                  Target Level {item.claimedRubricLevel}
                </div>
              </button>
            ))}
          </div>

          {/* 6-Dimension Evaluation Form */}
          <div className="lg:col-span-2">
            {currentSubmission ? (
              <form
                onSubmit={handleReviewSubmit}
                className="liquid-stack-card rounded-2xl p-6 space-y-5"
              >
                <div className="border-b border-[#C5E4FA] pb-4 space-y-1">
                  <div className="text-xs font-mono font-semibold text-[#087FE0]">
                    Skill Area: {getCapabilityDimensionName(currentSubmission.linkedDimensionId)} •
                    Target Level {currentSubmission.claimedRubricLevel}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#0F2942]">
                    {currentSubmission.title}
                  </h2>
                  <p className="text-xs text-[#456784]">{currentSubmission.description}</p>
                </div>

                {/* 6 Documented Review Dimensions */}
                <div className="space-y-3">
                  <h3 className="font-display text-xs font-bold uppercase text-[#087FE0]">
                    Evaluation Criteria (0–4 Scale)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        { key: 'relevance', label: '1. Relevance to Requirement' },
                        {
                          key: 'authenticityAndAttribution',
                          label: '2. Authenticity & Individual Contribution',
                        },
                        { key: 'sufficiency', label: '3. Depth & Scope of Work' },
                        { key: 'quality', label: '4. Execution Quality' },
                        { key: 'currency', label: '5. Currency & Recency' },
                        { key: 'context', label: '6. Practical Context' },
                      ] as { key: keyof EvidenceReviewDimensions; label: string }[]
                    ).map((d) => (
                      <div
                        key={d.key}
                        className="p-3 rounded-xl glass-panel-subtle flex items-center justify-between gap-2"
                      >
                        <label className="text-xs text-[#0F2942] font-semibold">{d.label}</label>
                        <select
                          value={dims[d.key]}
                          onChange={(e) =>
                            setDims((prev) => ({
                              ...prev,
                              [d.key]: Number(e.target.value) as RubricLevel,
                            }))
                          }
                          className="select-liquid rounded-lg px-2.5 py-1 text-xs font-mono text-[#087FE0] font-semibold"
                        >
                          {[0, 1, 2, 3, 4].map((v) => (
                            <option key={v} value={v} className="bg-white text-[#0F2942]">
                              {v} / 4
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
                      Review Outcome
                    </label>
                    <select
                      value={decision}
                      onChange={(e) =>
                        setDecision(
                          e.target.value as 'ACCEPTED' | 'REVISION_REQUESTED' | 'REJECTED'
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs"
                    >
                      <option value="ACCEPTED" className="bg-white text-[#0F2942]">
                        Approve & Verify Evidence
                      </option>
                      <option value="REVISION_REQUESTED" className="bg-white text-[#0F2942]">
                        Request Revisions
                      </option>
                      <option value="REJECTED" className="bg-white text-[#0F2942]">
                        Decline Submission
                      </option>
                    </select>
                  </div>

                  {decision === 'ACCEPTED' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
                        Verified Skill Level Awarded
                      </label>
                      <select
                        value={verifiedLevel}
                        onChange={(e) => setVerifiedLevel(Number(e.target.value) as RubricLevel)}
                        className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs text-emerald-700 font-semibold"
                      >
                        <option value={1} className="bg-white text-[#0F2942]">
                          Level 1 — Foundational
                        </option>
                        <option value={2} className="bg-white text-[#0F2942]">
                          Level 2 — Applied
                        </option>
                        <option value={3} className="bg-white text-[#0F2942]">
                          Level 3 — Proficient
                        </option>
                        <option value={4} className="bg-white text-[#0F2942]">
                          Level 4 — Advanced
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
                    Reviewer Feedback & Rationale *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Explain how this work meets the skill criteria or what improvements are needed..."
                    className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-xs"
                  />
                </div>

                <LiquidButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  pill
                  className="w-full"
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Submit Review Decision
                </LiquidButton>
              </form>
            ) : (
              <div className="liquid-stack-card rounded-2xl p-6 text-xs text-[#456784]">
                Select an assigned submission from the queue.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
