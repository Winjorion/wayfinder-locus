import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { Lock, Share2, ShieldOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { LiquidButton, TactileCheckbox } from '../common/LiquidGlassKit';

export const Screen20PrivacySharing: React.FC = () => {
  const { state, createSharingAuthorisation, revokeSharingAuthorisation, navigateTo } =
    useWayfinder();

  const [recipientInstitution, setRecipientInstitution] = useState('');
  const [scopeTargetId, setScopeTargetId] = useState(state.selectedTargetId || '');
  const [includeEvidenceMetadata, setIncludeEvidenceMetadata] = useState(true);
  const [durationDays, setDurationDays] = useState(30);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateShare = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const activeTargetId = scopeTargetId || state.targets[0]?.id || '';
    if (!recipientInstitution.trim()) {
      setFormError('Enter the recipient institution name.');
      return;
    }
    if (!activeTargetId) {
      setFormError(
        'Select or create a target opportunity in Opportunity Discovery before sharing a readiness report.'
      );
      return;
    }
    createSharingAuthorisation(
      recipientInstitution.trim(),
      activeTargetId,
      includeEvidenceMetadata,
      durationDays
    );
    setRecipientInstitution('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-3">
        <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
          Privacy & Data Sharing
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
          Control Who Can View Your Readiness Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#456784] max-w-3xl leading-relaxed">
          By default, institutions can only view anonymised summary trends for groups of at least{' '}
          <strong className="text-[#087FE0]">5 students</strong>. An institution can view your
          individual readiness report only when you grant a time-limited sharing permission below—and
          you can revoke access at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Scoped Share Form */}
        <form
          onSubmit={handleCreateShare}
          noValidate
          className="liquid-stack-card rounded-2xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-[#0F2942] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#087FE0]" /> Share a Readiness Report
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
            <label htmlFor="share-inst" className="block text-xs font-semibold text-[#0F2942] mb-1">
              Recipient Institution or Employer *
            </label>
            <input
              id="share-inst"
              type="text"
              required
              value={recipientInstitution}
              onChange={(e) => setRecipientInstitution(e.target.value)}
              placeholder="Enter institution or organisation name"
              className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-xs"
            />
          </div>

          <div>
            <label
              htmlFor="share-target"
              className="block text-xs font-semibold text-[#0F2942] mb-1"
            >
              Opportunity Report to Share *
            </label>
            {state.targets.length === 0 ? (
              <div className="p-3 rounded-xl glass-panel-subtle text-xs text-[#456784] flex items-center justify-between">
                <span>No target opportunities added</span>
                <button
                  type="button"
                  onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                  className="text-[#087FE0] font-semibold hover:underline font-mono cursor-pointer"
                >
                  Add Opportunity →
                </button>
              </div>
            ) : (
              <select
                id="share-target"
                value={scopeTargetId || state.targets[0]?.id || ''}
                onChange={(e) => setScopeTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs font-mono"
              >
                {state.targets.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white text-[#0F2942]">
                    {t.title} ({t.version})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="share-days" className="block text-xs font-semibold text-[#0F2942] mb-1">
              Access Duration (Up to {state.featureFlags.maxShareExpiryDays} Days)
            </label>
            <select
              id="share-days"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs font-mono"
            >
              <option value={7} className="bg-white text-[#0F2942]">
                7 Days
              </option>
              <option value={30} className="bg-white text-[#0F2942]">
                30 Days (Recommended)
              </option>
              <option value={90} className="bg-white text-[#0F2942]">
                90 Days
              </option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl glass-panel-subtle">
            <TactileCheckbox
              checked={includeEvidenceMetadata}
              onChange={setIncludeEvidenceMetadata}
              label="Include verified evidence titles (Private uploaded files remain confidential)"
            />
          </div>

          <LiquidButton type="submit" variant="primary" pill className="w-full">
            Grant Sharing Permission
          </LiquidButton>
        </form>

        {/* Active & Revoked Sharing Authorisations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display text-base font-bold text-[#0F2942]">
              Active & Past Sharing Permissions ({state.sharingAuthorisations.length})
            </h2>
            <button
              onClick={() => navigateTo('21_INSTITUTION_DASHBOARD')}
              className="text-xs text-[#087FE0] font-semibold hover:underline font-mono cursor-pointer"
            >
              Preview Institution Portal →
            </button>
          </div>

          {state.sharingAuthorisations.length === 0 ? (
            <div className="liquid-stack-card rounded-2xl p-10 text-center space-y-3 relative overflow-hidden">
              <div className="hidden sm:block absolute top-6 right-8 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
              <div className="w-12 h-12 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[#087FE0]" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F2942]">
                Your Profile Is Private
              </h3>
              <p className="text-xs text-[#456784] max-w-md mx-auto leading-relaxed">
                You have not shared your individual readiness profile with any institution or
                employer.
              </p>
            </div>
          ) : (
            state.sharingAuthorisations.map((sh) => {
              const isExpired = new Date(sh.expiresAt).getTime() <= Date.now();
              const isRevoked = sh.revokedAt !== null;
              const isValid = !isExpired && !isRevoked;
              const targetObj = state.targets.find((t) => t.id === sh.scopeTargetId);

              return (
                <div key={sh.id} className="liquid-stack-card rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Access
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-red-50 text-red-800 border border-red-300">
                            <ShieldOff className="w-3 h-3 text-red-600" />{' '}
                            {isRevoked ? 'Revoked' : 'Expired'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base font-bold text-[#0F2942] mt-1">
                        {sh.recipientInstitution}
                      </h3>
                      <div className="text-xs text-[#456784] mt-0.5">
                        Shared Report:{' '}
                        <strong className="text-[#0F2942]">
                          {targetObj?.title || sh.scopeTargetId}
                        </strong>
                      </div>
                    </div>

                    {isValid && (
                      <LiquidButton
                        variant="danger"
                        size="sm"
                        pill
                        onClick={() => revokeSharingAuthorisation(sh.id)}
                        icon={<ShieldOff className="w-3.5 h-3.5" />}
                      >
                        Revoke Access
                      </LiquidButton>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl glass-panel-subtle text-[11px] font-mono text-[#527493]">
                    <div>
                      <span className="block text-[10px]">Granted On</span>
                      <span className="text-[#0F2942] font-semibold">
                        {new Date(sh.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Expires On</span>
                      <span className="text-[#087FE0] font-semibold">
                        {new Date(sh.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px]">Access Status</span>
                      <span
                        className={
                          isRevoked
                            ? 'text-red-700 font-semibold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        {isRevoked
                          ? `Revoked at ${new Date(sh.revokedAt!).toLocaleTimeString()}`
                          : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
