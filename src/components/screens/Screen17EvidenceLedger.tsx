import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  CANONICAL_CAPABILITY_DIMENSIONS,
  getCapabilityDimensionName,
} from '../../data/capabilityDimensions';
import { CapabilityDimensionId, RubricLevel } from '../../types/wayfinder';
import { computeRealFileSha256 } from '../../services/supabaseBoundary';
import { EvidenceStatusBadge } from '../common/StatusBadge';
import { FileCheck, Upload, ShieldAlert, Eye, Lock, AlertCircle } from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

const MALWARE_SCAN_LABELS: Record<string, string> = {
  NOT_CONFIGURED_IN_DEV: 'Pending cloud security scan',
  CLEAN: 'Security scan passed',
  QUARANTINED: 'Flagged by security scan',
};

const REVIEW_DECISION_LABELS: Record<string, string> = {
  ACCEPTED: 'Approved & Verified',
  REVISION_REQUESTED: 'Revision Requested',
  REJECTED: 'Not Accepted',
};

export const Screen17EvidenceLedger: React.FC = () => {
  const { state, submitEvidence, navigateTo } = useWayfinder();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dimensionId, setDimensionId] = useState<CapabilityDimensionId>('CAP_DATA_ANAL');
  const [claimedLevel, setClaimedLevel] = useState<RubricLevel>(3);
  const [evidenceType, setEvidenceType] = useState<'FILE' | 'URL'>('FILE');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedSha256, setComputedSha256] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const maxLimitMB = state.featureFlags.uploadPolicyMode === 'ENG_SPEC_10MB' ? 10 : 25;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setComputedSha256(null);
    setFormError(null);
    if (file) {
      try {
        const digest = await computeRealFileSha256(file);
        setComputedSha256(digest);
      } catch {
        setComputedSha256(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Enter an evidence title.');
      return;
    }

    if (evidenceType === 'FILE' && !selectedFile) {
      setFormError('Select a file from your device to upload.');
      return;
    }

    if (evidenceType === 'URL' && !url.trim()) {
      setFormError('Enter a valid project or repository URL.');
      return;
    }

    submitEvidence({
      title: title.trim(),
      description:
        description.trim() ||
        'Submitted work linked to a core skill area for reviewer verification.',
      linkedDimensionId: dimensionId,
      linkedTargetId: state.selectedTargetId || undefined,
      claimedRubricLevel: claimedLevel,
      evidenceType,
      fileName: evidenceType === 'FILE' ? selectedFile?.name : undefined,
      fileSizeBytes: evidenceType === 'FILE' ? selectedFile?.size : undefined,
      mimeType:
        evidenceType === 'FILE' ? selectedFile?.type || 'application/octet-stream' : undefined,
      url: evidenceType === 'URL' ? url.trim() : undefined,
    });

    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setComputedSha256(null);
    setUrl('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
              Evidence Ledger
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942] mt-1">
              Submit & Track Your Skill Evidence
            </h1>
            <p className="text-xs sm:text-sm text-[#456784] mt-1">
              Upload project files (up to{' '}
              <strong className="text-[#087FE0]">{maxLimitMB} MB</strong>) or link a repository so
              an authorised reviewer can verify your demonstrated skill level.
            </p>
          </div>

          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('18_REVIEWER_WORKSPACE')}
            icon={<Eye className="w-4 h-4 text-[#087FE0]" />}
          >
            Open Reviewer Workspace
          </LiquidButton>
        </div>

        {/* Truthful Security & Malware Scan Boundary Notice */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-display font-bold text-amber-950">
              How Evidence Verification Works
            </div>
            <p className="leading-relaxed text-amber-800">
              WAYFINDER checks file types and sizes on upload, but passing a file check is not the
              same as verified proof. Your submission is marked as{' '}
              <strong>Verified Evidence</strong> only after an assigned reviewer evaluates its
              relevance, authenticity, scope, quality, recency, and context.
            </p>
          </div>
        </div>
      </div>

      {/* Two Columns: Genuine Upload Form + Evidence Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit New Evidence Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="liquid-stack-card rounded-2xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-[#0F2942] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#087FE0]" /> Submit New Evidence
          </h2>

          {formError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label htmlFor="ev-title" className="block text-xs font-semibold text-[#0F2942] mb-1">
              Evidence Title *
            </label>
            <input
              id="ev-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Customer Churn Analysis Notebook"
              className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-xs"
            />
          </div>

          <div>
            <label htmlFor="ev-dim" className="block text-xs font-semibold text-[#0F2942] mb-1">
              Skill Area
            </label>
            <select
              id="ev-dim"
              value={dimensionId}
              onChange={(e) => setDimensionId(e.target.value as CapabilityDimensionId)}
              className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs"
            >
              {CANONICAL_CAPABILITY_DIMENSIONS.map((d) => (
                <option key={d.id} value={d.id} className="bg-white text-[#0F2942]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ev-lvl" className="block text-xs font-semibold text-[#0F2942] mb-1">
              Target Skill Level Demonstrated
            </label>
            <select
              id="ev-lvl"
              value={claimedLevel}
              onChange={(e) => setClaimedLevel(Number(e.target.value) as RubricLevel)}
              className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs"
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

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEvidenceType('FILE')}
              className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                evidenceType === 'FILE'
                  ? 'tab-liquid-active text-[#0F2942]'
                  : 'bg-white border-[#C5E4FA] text-[#527493]'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setEvidenceType('URL')}
              className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                evidenceType === 'URL'
                  ? 'tab-liquid-active text-[#0F2942]'
                  : 'bg-white border-[#C5E4FA] text-[#527493]'
              }`}
            >
              Repository / URL
            </button>
          </div>

          {evidenceType === 'FILE' ? (
            <div className="space-y-3 p-3.5 rounded-xl glass-panel-subtle text-xs">
              <label
                htmlFor="ev-file-input"
                className="block text-[11px] font-semibold text-[#0F2942]"
              >
                Select File (Max {maxLimitMB} MB) *
              </label>
              <input
                id="ev-file-input"
                type="file"
                onChange={handleFileChange}
                className="w-full text-xs text-[#456784] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#8CCBFF] file:text-xs file:font-mono file:font-semibold file:bg-[#DDF2FF] file:text-[#087FE0] hover:file:bg-[#8CCBFF]/40 cursor-pointer"
              />
              {selectedFile && (
                <div className="pt-2 border-t border-[#C5E4FA] space-y-1 font-mono text-[11px] text-[#527493]">
                  <div>
                    File: <span className="text-[#0F2942] font-semibold">{selectedFile.name}</span>
                  </div>
                  <div>
                    Size:{' '}
                    <span className="text-[#087FE0] font-semibold">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>{' '}
                    • Format:{' '}
                    <span className="text-[#0F2942]">{selectedFile.type || 'Standard file'}</span>
                  </div>
                  {computedSha256 && (
                    <div className="truncate" title={computedSha256}>
                      Integrity Checksum:{' '}
                      <span className="text-emerald-700 font-semibold">
                        {computedSha256.slice(0, 20)}…
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label
                htmlFor="ev-url-input"
                className="block text-xs font-semibold text-[#0F2942] mb-1"
              >
                Project or Repository URL *
              </label>
              <input
                id="ev-url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs font-mono"
              />
            </div>
          )}

          <div>
            <label htmlFor="ev-desc" className="block text-xs font-semibold text-[#0F2942] mb-1">
              Context & Your Contribution
            </label>
            <textarea
              id="ev-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what you built, your individual contribution, and how it demonstrates this skill level..."
              className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs"
            />
          </div>

          <LiquidButton type="submit" variant="primary" pill className="w-full">
            Submit Evidence for Review
          </LiquidButton>
        </form>

        {/* Evidence Ledger Table / Empty State */}
        <div className="lg:col-span-2 space-y-4">
          {state.evidenceSubmissions.length === 0 ? (
            <div className="liquid-stack-card rounded-2xl p-10 text-center space-y-4 relative overflow-hidden">
              <div className="hidden sm:block absolute top-6 right-8 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
              <div className="w-14 h-14 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7 text-[#087FE0]" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="font-display text-xl font-bold text-[#0F2942]">
                  Your Evidence Ledger Is Empty
                </h2>
                <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
                  No evidence has been submitted yet. Use the form on the left to upload a file or
                  share a project link for reviewer verification.
                </p>
              </div>
            </div>
          ) : (
            state.evidenceSubmissions.map((ev) => (
              <div key={ev.id} className="liquid-stack-card rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-[#087FE0] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#C5E4FA]">
                        {getCapabilityDimensionName(ev.linkedDimensionId)}
                      </span>
                      <h3 className="font-display text-base font-bold text-[#0F2942]">
                        {ev.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#456784] mt-1">{ev.description}</p>
                  </div>
                  <EvidenceStatusBadge status={ev.status} />
                </div>

                {/* Technical Validation vs Malware Scan Truthfulness Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl glass-panel-subtle text-[11px] font-mono">
                  <div>
                    <span className="text-[#527493] block">Skill & Target Level:</span>
                    <span className="text-[#0F2942] font-semibold">
                      {getCapabilityDimensionName(ev.linkedDimensionId)} (Level{' '}
                      {ev.claimedRubricLevel})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#527493] block">Security Scan:</span>
                    <span className="text-amber-700 font-semibold">
                      {MALWARE_SCAN_LABELS[ev.technicalValidation.malwareScanStatus] ||
                        ev.technicalValidation.malwareScanStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#527493] block">Reviewer Assignment:</span>
                    <span className="text-[#087FE0] font-semibold">
                      {ev.assignedReviewerId || 'Awaiting assignment'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#527493] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#087FE0] shrink-0" />
                  <span>{ev.technicalValidation.validationNotes}</span>
                </div>

                {ev.reviewDecision && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-emerald-800 font-bold">
                        REVIEW OUTCOME:{' '}
                        {REVIEW_DECISION_LABELS[ev.reviewDecision.decision] ||
                          ev.reviewDecision.decision}
                        {ev.reviewDecision.verifiedRubricLevel
                          ? ` (Verified Level ${ev.reviewDecision.verifiedRubricLevel})`
                          : ''}
                      </span>
                      <span className="text-[#527493]">
                        Reviewed by {ev.reviewDecision.reviewerName}
                      </span>
                    </div>
                    <p className="text-[#0F2942]">{ev.reviewDecision.rationale}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
