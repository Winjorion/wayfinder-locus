import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileDown,
  FileText,
  Layers,
  Link2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  ProfessionalProfileService,
  ResumeService,
} from '../../services/careerIntelligenceServices';
import {
  ManualLinkedInProfile,
  ProfileProvenanceLabel,
} from '../../types/marketSkillsCareer';

function getProvenanceBadgeClasses(label: ProfileProvenanceLabel | string): string {
  switch (label) {
    case 'VERIFIED':
      return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
    case 'EVIDENCE_SUBMITTED':
      return 'bg-[#DDF0FF] text-[#075FC7] border-[#8DBDFF]';
    case 'ASSESSED_BY_WAYFINDER':
      return 'bg-[#E5F2FF] text-[#0B2E56] border-[#99C8FF]';
    case 'IMPORTED_BY_USER':
      return 'bg-[#F4FAFF] text-[#174B80] border-[#8DBDFF]';
    case 'USER_PROVIDED':
    default:
      return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
  }
}

export const Screen26LinkedInSupport: React.FC = () => {
  const { state, navigateTo } = useWayfinder();

  const [profile, setProfile] = useState<ManualLinkedInProfile>(() =>
    ProfessionalProfileService.getLinkedInProfile()
  );
  const [skillInput, setSkillInput] = useState<string>('');
  const [linkInput, setLinkInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resumeVersions = useMemo(() => ResumeService.getResumeVersions(), []);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    () => resumeVersions[0]?.id || ''
  );

  const completeness = useMemo(() => {
    return ProfessionalProfileService.evaluateProfileCompleteness(
      profile,
      state.skillsCatalogue,
      state.studentSkillRecords,
      state.portfolioRecords
    );
  }, [
    profile,
    state.skillsCatalogue,
    state.studentSkillRecords,
    state.portfolioRecords,
  ]);

  const discrepancies = useMemo(() => {
    return ProfessionalProfileService.compareWithWayfinderProfile(
      profile,
      state.skillsCatalogue,
      state.studentSkillRecords,
      state.capabilityRecords,
      state.portfolioRecords,
      state.evidenceSubmissions
    );
  }, [
    profile,
    state.skillsCatalogue,
    state.studentSkillRecords,
    state.capabilityRecords,
    state.portfolioRecords,
    state.evidenceSubmissions,
  ]);

  const handleSaveProfile = (next: ManualLinkedInProfile) => {
    const saved = ProfessionalProfileService.saveLinkedInProfile(next);
    setProfile({ ...saved });
  };

  const handleImportFromResume = () => {
    const targetResume =
      resumeVersions.find((r) => r.id === selectedResumeId) || resumeVersions[0];
    if (!targetResume) return;
    const imported = ProfessionalProfileService.importFromResumeVersion(targetResume);
    setProfile({ ...imported });
    setStatusMessage(
      `Imported structured sections from "${targetResume.versionName}". Provenance marked as IMPORTED_BY_USER.`
    );
  };

  const handleAddListedSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (profile.listedSkillNames.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    handleSaveProfile({
      ...profile,
      listedSkillNames: [...profile.listedSkillNames, trimmed],
      provenance: 'USER_PROVIDED',
    });
    setSkillInput('');
  };

  const handleAddPortfolioLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (profile.portfolioLinks.includes(trimmed)) {
      setLinkInput('');
      return;
    }
    handleSaveProfile({
      ...profile,
      portfolioLinks: [...profile.portfolioLinks, trimmed],
      provenance: 'USER_PROVIDED',
    });
    setLinkInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Strict Boundary Notice */}
      <div className="wf-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="wf-Chip">MODULE 4 — LINKEDIN PROFILE SUPPORT</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#E5F2FF] text-[#075FC7] border border-[#8DBDFF]">
                MANUAL &amp; USER-IMPORTED WORKSPACE (NO LIVE SCRAPING)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0B2E56]">
              LinkedIn Profile Completeness &amp; WAYFINDER Alignment Studio
            </h1>
            <p className="text-sm text-[#123B63] mt-1 max-w-3xl">
              Enter your LinkedIn profile sections manually or import them from your WAYFINDER
              Resume. Compare external profile claims against your assessed capabilities, verified
              projects, and Evidence Ledger artifacts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('25_RESUME_BUILDER')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <FileText className="w-3.5 h-3.5" /> Open Resume Builder
            </button>
            <button
              type="button"
              onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Capability Passport
            </button>
          </div>
        </div>

        {/* Provenance Legend */}
        <div className="mt-4 p-3.5 rounded-xl bg-white/80 border border-[#8DBDFF]/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-[#0B2E56]">
            Explicit Provenance Attribution (Never confuses self-reported LinkedIn text with verified
            capability):
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {(
              [
                'USER_PROVIDED',
                'IMPORTED_BY_USER',
                'ASSESSED_BY_WAYFINDER',
                'EVIDENCE_SUBMITTED',
                'VERIFIED',
              ] as ProfileProvenanceLabel[]
            ).map((lbl) => (
              <span
                key={lbl}
                className={`px-2 py-0.5 rounded font-bold border ${getProvenanceBadgeClasses(lbl)}`}
              >
                {lbl.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-xs font-semibold flex items-center justify-between">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="underline font-bold ml-3"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Import from WAYFINDER Resume Bar */}
      <div className="wf-panel p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#075FC7]">
            1-Click Structured Import
          </div>
          <h2 className="text-base font-bold text-[#0B2E56]">
            Populate LinkedIn Sections from Your WAYFINDER Resume Version
          </h2>
          <p className="text-xs text-[#315A7D]">
            Automatically copies your summary, education, experience, skills, projects, and proof
            links with provenance tagged as <strong>IMPORTED_BY_USER</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select Resume Version to Import"
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="wf-select text-xs"
          >
            {resumeVersions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.versionName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleImportFromResume}
            className="wf-btn wf-btn-primary text-xs"
          >
            <FileDown className="w-3.5 h-3.5" /> Import from Resume
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Left = Manual Profile Entry, Right = Completeness & WAYFINDER Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Manual Entry Form */}
        <div className="xl:col-span-7 wf-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#8DBDFF]/40 pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B2E56]">
                Manual LinkedIn Profile Content Entry
              </h2>
              <p className="text-xs text-[#315A7D]">
                Current Record Provenance:{' '}
                <strong className="text-[#075FC7]">{profile.provenance.replace(/_/g, ' ')}</strong>
              </p>
            </div>
            {profile.lastUpdatedAt && (
              <span className="text-[11px] text-[#315A7D]">
                Updated: {new Date(profile.lastUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                1. LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={profile.profileUrl}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    profileUrl: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="https://www.linkedin.com/in/your-handle"
                className="wf-input w-full text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                2. Professional Headline
              </label>
              <input
                type="text"
                value={profile.headline}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    headline: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="e.g., B.Tech Computer Science Student | Relational Databases & Backend Engineering"
                className="wf-input w-full text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                3. About Section
              </label>
              <textarea
                rows={3}
                value={profile.aboutSection}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    aboutSection: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="Paste or draft your LinkedIn About summary..."
                className="wf-input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                4. Education Summary
              </label>
              <textarea
                rows={3}
                value={profile.educationSummary}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    educationSummary: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="Institution, degree, specialisation, and expected graduation..."
                className="wf-input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                5. Experience Summary
              </label>
              <textarea
                rows={3}
                value={profile.experienceSummary}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    experienceSummary: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="Internships, research assistantships, leadership roles..."
                className="wf-input w-full text-sm"
              />
            </div>

            {/* 6. Listed Skills */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                6. Skills Listed on Your LinkedIn Profile ({profile.listedSkillNames.length})
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill claimed on your LinkedIn profile (e.g., SQL, Psychometrics, Valuation)"
                  className="wf-input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddListedSkill}
                  className="wf-btn wf-btn-secondary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.listedSkillNames.map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-1 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF] text-xs font-semibold text-[#0B2E56] flex items-center gap-1.5"
                  >
                    <span>{sk}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveProfile({
                          ...profile,
                          listedSkillNames: profile.listedSkillNames.filter((s) => s !== sk),
                        })
                      }
                      className="text-[#B91C1C] font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                7. Certifications Summary
              </label>
              <textarea
                rows={2}
                value={profile.certificationsSummary}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    certificationsSummary: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="Certifications or licenses listed on LinkedIn..."
                className="wf-input w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                8. Projects Summary
              </label>
              <textarea
                rows={2}
                value={profile.projectsSummary}
                onChange={(e) =>
                  handleSaveProfile({
                    ...profile,
                    projectsSummary: e.target.value,
                    provenance: 'USER_PROVIDED',
                  })
                }
                placeholder="Projects featured on your LinkedIn profile..."
                className="wf-input w-full text-sm"
              />
            </div>

            {/* 9. Portfolio Links */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#174B80] mb-1">
                9. External Portfolio &amp; Evidence Links ({profile.portfolioLinks.length})
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://github.com/... or WAYFINDER artifact link"
                  className="wf-input flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolioLink}
                  className="wf-btn wf-btn-secondary text-xs"
                >
                  <Link2 className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>
              <div className="space-y-1">
                {profile.portfolioLinks.map((lnk) => (
                  <div
                    key={lnk}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/50 text-xs text-[#075FC7]"
                  >
                    <span className="truncate">{lnk}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveProfile({
                          ...profile,
                          portfolioLinks: profile.portfolioLinks.filter((l) => l !== lnk),
                        })
                      }
                      className="text-[#B91C1C] font-bold ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Completeness Checker & WAYFINDER Comparison Engine */}
        <div className="xl:col-span-5 space-y-5">
          {/* Profile Completeness Checker */}
          <div className="wf-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#075FC7]">
                  Profile Completeness Checker
                </span>
                <h2 className="text-lg font-bold text-[#0B2E56]">
                  {completeness.completedSectionsCount} / {completeness.totalSectionsCount} Profile
                  Sections Complete
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#DDF0FF] text-[#0B2E56] font-bold text-xs">
                {Math.round(
                  (completeness.completedSectionsCount / completeness.totalSectionsCount) * 100
                )}
                %
              </span>
            </div>

            {completeness.missingInformation.length > 0 && (
              <div className="p-3 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] text-xs">
                <div className="font-bold text-[#B45309] mb-1">Missing Core Information:</div>
                <ul className="list-disc list-inside text-[#123B63] space-y-0.5">
                  {completeness.missingInformation.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {completeness.incompleteSections.length > 0 && (
              <div className="p-3 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/60 text-xs">
                <div className="font-bold text-[#0B2E56] mb-1">
                  Optional / Incomplete Sections to Strengthen:
                </div>
                <ul className="list-disc list-inside text-[#123B63] space-y-0.5">
                  {completeness.incompleteSections.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {completeness.relevantWayfinderSkillsNotIncluded.length > 0 && (
              <div className="p-3 rounded-xl bg-[#E5F2FF] border border-[#8DBDFF] text-xs">
                <div className="font-bold text-[#0B2E56] mb-1">
                  Assessed WAYFINDER Skills Not Yet Included on Your LinkedIn Profile:
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {completeness.relevantWayfinderSkillsNotIncluded.map((skName) => (
                    <button
                      key={skName}
                      type="button"
                      onClick={() =>
                        handleSaveProfile({
                          ...profile,
                          listedSkillNames: [...profile.listedSkillNames, skName],
                        })
                      }
                      className="px-2 py-0.5 rounded bg-white border border-[#075FC7] text-[#075FC7] font-bold text-[11px]"
                    >
                      + Add {skName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {completeness.experienceImprovementSuggestions.length > 0 && (
              <div className="p-3 rounded-xl bg-white/80 border border-[#8DBDFF]/50 text-xs">
                <div className="font-bold text-[#0B2E56] mb-1">
                  Suggestions for Improving Experience &amp; Summary Descriptions:
                </div>
                <ul className="list-disc list-inside text-[#123B63] space-y-1">
                  {completeness.experienceImprovementSuggestions.map((sug) => (
                    <li key={sug}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* LinkedIn-to-WAYFINDER Comparison Engine */}
          <div className="wf-panel p-6 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#075FC7]">
                LinkedIn-to-WAYFINDER Comparison
              </span>
              <h2 className="text-lg font-bold text-[#0B2E56]">
                Claim vs. Assessed Capability &amp; Proof Alignment ({discrepancies.length})
              </h2>
              <p className="text-xs text-[#315A7D] mt-0.5">
                Identifies skills claimed on LinkedIn that are not yet assessed in WAYFINDER, and
                assessed WAYFINDER achievements missing from your external profile.
              </p>
            </div>

            {discrepancies.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#15803D] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Your manual LinkedIn profile entries and your WAYFINDER capability records are
                  aligned, or no unverified claims were detected.
                </span>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {discrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl bg-white/85 border border-[#8DBDFF]/60 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#0B2E56]">{d.itemTitle}</span>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProvenanceBadgeClasses(
                            d.linkedInStateLabel
                          )}`}
                        >
                          LinkedIn: {d.linkedInStateLabel.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProvenanceBadgeClasses(
                            d.wayfinderStateLabel
                          )}`}
                        >
                          WAYFINDER: {d.wayfinderStateLabel.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-[#123B63]">{d.explanation}</p>
                    <div className="text-[#075FC7] font-semibold">
                      Recommended Action: {d.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
