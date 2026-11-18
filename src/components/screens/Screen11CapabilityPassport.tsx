import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  CANONICAL_CAPABILITY_DIMENSIONS,
  RUBRIC_V1_ANCHORS,
  getCapabilityDimensionName,
} from '../../data/capabilityDimensions';
import {
  CapabilityDimensionId,
  RubricLevel,
  StudentRecordCategory,
} from '../../types/wayfinder';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Compass,
  UserCheck,
  FolderGit2,
  PlusCircle,
  Trash2,
  Lock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { LiquidButton } from '../common/LiquidGlassKit';

const SOURCE_LABELS: Record<string, string> = {
  UNASSESSED: 'Not yet assessed',
  SELF_REPORT_ONLY: 'Self-reported claim only',
  OBJECTIVE_ASSESSMENT: 'Objective assessment',
  REVIEWED_EVIDENCE: 'Verified evidence',
  COMBINED_VERIFIED: 'Assessment + verified evidence',
};

const RECORD_TYPE_LABELS: Record<StudentRecordCategory, string> = {
  PROJECT: 'Project',
  INTERNSHIP: 'Internship / Experience',
  CERTIFICATE: 'Certificate / Credential',
};

export const Screen11CapabilityPassport: React.FC = () => {
  const {
    state,
    navigateTo,
    updateStudentPersonalInfo,
    updateSelfReportedSkill,
    addStudentPortfolioRecord,
    removeStudentPortfolioRecord,
    promotePortfolioRecordToEvidence,
  } = useWayfinder();

  const user = state.currentUser;
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [institutionName, setInstitutionName] = useState(user?.institutionName || '');
  const [program, setProgram] = useState(user?.program || '');
  const [statedCareerGoal, setStatedCareerGoal] = useState(user?.statedCareerGoal || '');
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  // Portfolio Record Form (Projects, Internships, Certificates)
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordType, setRecordType] = useState<StudentRecordCategory>('PROJECT');
  const [recordTitle, setRecordTitle] = useState('');
  const [organizationOrIssuer, setOrganizationOrIssuer] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  const [linkedDimensionId, setLinkedDimensionId] =
    useState<CapabilityDimensionId>('CAP_PROG_SW');
  const [artifactUrl, setArtifactUrl] = useState('');
  const [claimedLevelForPromote, setClaimedLevelForPromote] = useState<
    Record<string, RubricLevel>
  >({});

  const activeSharesCount = state.sharingAuthorisations.filter(
    (s) => s.revokedAt === null && new Date(s.expiresAt).getTime() > Date.now()
  ).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentPersonalInfo({
      fullName,
      email,
      institutionName,
      program,
      statedCareerGoal,
    });
    setEditingProfile(false);
    setProfileSavedNotice(true);
  };

  const handleAddPortfolioRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTitle.trim()) return;
    addStudentPortfolioRecord({
      recordType,
      title: recordTitle.trim(),
      organizationOrIssuer: organizationOrIssuer.trim() || 'Self-directed / Independent',
      completedDate: completedDate.trim() || 'In progress / Unspecified',
      description:
        recordDescription.trim() ||
        'Recorded by student in Capability Passport as an unverified claim.',
      linkedDimensionId,
      artifactUrl: artifactUrl.trim() || undefined,
    });
    setRecordTitle('');
    setOrganizationOrIssuer('');
    setCompletedDate('');
    setRecordDescription('');
    setArtifactUrl('');
    setShowRecordForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-[#123B63]">
        <div className="space-y-2 text-[#123B63]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-[#075FC7]">
            <Award className="w-4 h-4 text-[#075FC7]" />
            <span className="text-[#174B80]">STUDENT-OWNED CAPABILITY PASSPORT</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#DDF2FF]/75 text-[#0B2E56] border border-[#8DBDFF]">
              CLAIM ≠ CAPABILITY ≠ PROOF
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
            Your Capability Passport: Claim, Skill &amp; Proof
          </h1>
          <p className="text-xs sm:text-sm text-[#123B63] max-w-3xl leading-relaxed">
            You own and control your profile. Review your personal details, record projects,
            internships, and certificates, and track all 10 core capability areas side by side:{' '}
            <strong className="text-[#0B2E56]">Self-Reported Claim</strong>,{' '}
            <strong className="text-[#0B2E56]">Assessed Skill Level</strong>,{' '}
            <strong className="text-[#0B2E56]">Verified Evidence</strong>, and{' '}
            <strong className="text-[#0B2E56]">Demonstrated Level</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('20_PRIVACY_SHARING')}
            icon={<Lock className="w-4 h-4 text-[#087FE0]" />}
          >
            Sharing Controls ({activeSharesCount} Active)
          </LiquidButton>
          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
            icon={<FileCheck className="w-4 h-4 text-[#087FE0]" />}
          >
            Evidence Ledger ({state.evidenceSubmissions.length})
          </LiquidButton>
          <LiquidButton
            variant="primary"
            size="sm"
            pill
            onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
            icon={<Compass className="w-4 h-4" />}
          >
            Compare Against Target
          </LiquidButton>
        </div>
      </div>

      {/* Section 1: Student-Owned Personal Information & Career Goals */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2942]">
                1. Student-Owned Personal Information &amp; Career Direction
              </h2>
              <p className="text-xs text-[#456784]">
                Review and correct your name, institution, program, and stated career goals at any
                time.
              </p>
            </div>
          </div>

          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => {
              setFullName(user?.fullName || '');
              setEmail(user?.email || '');
              setInstitutionName(user?.institutionName || '');
              setProgram(user?.program || '');
              setStatedCareerGoal(user?.statedCareerGoal || '');
              setEditingProfile(!editingProfile);
              setProfileSavedNotice(false);
            }}
          >
            {editingProfile ? 'Cancel Editing' : 'Review / Edit Personal Information'}
          </LiquidButton>
        </div>

        {profileSavedNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your personal profile and stated career goal have been updated in your Capability
              Passport.
            </span>
          </div>
        )}

        {editingProfile ? (
          <form
            onSubmit={handleSaveProfile}
            className="p-4 rounded-xl glass-panel-subtle space-y-4 border border-[#8CCBFF]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Institution / College
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Your college or university"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Degree / Program &amp; Year
                </label>
                <input
                  type="text"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Stated Career Goal / Target Direction
                </label>
                <input
                  type="text"
                  value={statedCareerGoal}
                  onChange={(e) => setStatedCareerGoal(e.target.value)}
                  placeholder="e.g. Systems & Backend Engineering Internships, Applied AI Research"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <LiquidButton type="submit" variant="primary" size="sm" pill>
                Save Personal Profile
              </LiquidButton>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl glass-panel-subtle">
              <div className="text-[10px] font-mono text-[#527493] uppercase">Full Name</div>
              <div className="font-semibold text-[#0F2942] mt-0.5">
                {user?.fullName || 'Not entered yet'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl glass-panel-subtle">
              <div className="text-[10px] font-mono text-[#527493] uppercase">Email</div>
              <div className="font-semibold text-[#0F2942] mt-0.5">
                {user?.email || 'Not entered yet'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl glass-panel-subtle">
              <div className="text-[10px] font-mono text-[#527493] uppercase">Institution</div>
              <div className="font-semibold text-[#0F2942] mt-0.5">
                {user?.institutionName || 'Not entered yet'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl glass-panel-subtle">
              <div className="text-[10px] font-mono text-[#527493] uppercase">Program</div>
              <div className="font-semibold text-[#0F2942] mt-0.5">
                {user?.program || 'Not entered yet'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl glass-panel-subtle">
              <div className="text-[10px] font-mono text-[#527493] uppercase">
                Stated Career Goal
              </div>
              <div className="font-semibold text-[#087FE0] mt-0.5">
                {user?.statedCareerGoal || 'Not entered yet'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: 10 Canonical Dimensions Matrix Table with Inline Claim Editing */}
      <div className="liquid-stack-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#C5E4FA] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F2942]">
              2. Core Capability Matrix (10 Dimensions)
            </h2>
            <p className="text-xs text-[#456784]">
              Update your self-reported claim directly below or in the Skill Self-Assessment.
              Self-reported claims never overwrite your Assessed Skill or Demonstrated Level.
            </p>
          </div>
          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('06_ASSESSMENT_HUB')}
          >
            Open Assessment Hub →
          </LiquidButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#C5E4FA] bg-[#F0F9FF] text-[11px] font-mono font-semibold uppercase text-[#174B80]">
                <th className="py-4 px-4">Core Capability Area</th>
                <th className="py-4 px-4">1. Self-Reported Claim (Editable)</th>
                <th className="py-4 px-4">2. Assessed Skill</th>
                <th className="py-4 px-4">3. Verified Evidence</th>
                <th className="py-4 px-4">Demonstrated Level</th>
                <th className="py-4 px-4">Verification Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5E4FA]/70 text-xs">
              {CANONICAL_CAPABILITY_DIMENSIONS.map((dim, idx) => {
                const rec = state.capabilityRecords.find((r) => r.dimensionId === dim.id);
                const claim = rec?.selfReportedLevel ?? null;
                const obj = rec?.objectiveScoreLevel ?? null;
                const proof = rec?.verifiedEvidenceLevel ?? null;
                const dem = rec?.demonstratedLevel ?? null;
                const sourceKey = rec?.evidenceSource || 'UNASSESSED';

                return (
                  <tr key={dim.id} className="hover:bg-[#F0F9FF]/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono text-[10px] font-semibold text-[#087FE0]">
                        Capability {idx + 1}
                      </div>
                      <div className="font-display font-bold text-[#0F2942] text-sm">
                        {dim.name}
                      </div>
                      <div className="text-[11px] text-[#456784] mt-0.5 max-w-xs">
                        {dim.description}
                      </div>
                    </td>

                    {/* Column 1: Claim (with quick inline selector) */}
                    <td className="py-4 px-4 font-mono space-y-1.5">
                      <div>
                        {claim !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Claim: Lvl {claim} ({RUBRIC_V1_ANCHORS[claim].label})
                          </span>
                        ) : (
                          <span className="text-[#71869D]">No claim recorded</span>
                        )}
                      </div>
                      <select
                        aria-label={`Update self-reported claim for ${dim.name}`}
                        value={claim === null ? 'NULL' : String(claim)}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSelfReportedSkill(
                            dim.id,
                            val === 'NULL' ? null : (Number(val) as RubricLevel)
                          );
                        }}
                        className="select-liquid rounded-lg px-2 py-1 text-[11px] font-mono w-44"
                      >
                        <option value="NULL" className="bg-white text-[#0F2942]">
                          Not tried yet (Unknown)
                        </option>
                        {([0, 1, 2, 3, 4] as RubricLevel[]).map((lvl) => (
                          <option key={lvl} value={lvl} className="bg-white text-[#0F2942]">
                            Claim Level {lvl} — {RUBRIC_V1_ANCHORS[lvl].label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Column 2: Objective */}
                    <td className="py-4 px-4 font-mono">
                      {obj !== null ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF] font-semibold">
                          Level {obj}
                        </span>
                      ) : (
                        <span className="text-[#71869D]">Not assessed</span>
                      )}
                    </td>

                    {/* Column 3: Reviewed Proof */}
                    <td className="py-4 px-4 font-mono">
                      {proof !== null ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Verified Level {proof}
                        </span>
                      ) : (
                        <span className="text-[#71869D]">None yet</span>
                      )}
                    </td>

                    {/* Column 4: Demonstrated Level */}
                    <td className="py-4 px-4 font-mono">
                      {dem !== null ? (
                        <span className="px-3 py-1 rounded-full font-bold bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF] shadow-sm">
                          Level {dem} ({RUBRIC_V1_ANCHORS[dem].label})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#F4FAFF] text-[#527493] border border-[#C5E4FA] font-semibold">
                          More info needed
                        </span>
                      )}
                    </td>

                    {/* Column 5: Source */}
                    <td className="py-4 px-4 text-[11px] font-medium text-[#527493]">
                      {SOURCE_LABELS[sourceKey] || sourceKey}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Projects, Internships & Certificates (Linked to Capabilities) */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center">
              <FolderGit2 className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2942]">
                3. Recorded Projects, Internships &amp; Certificates
              </h2>
              <p className="text-xs text-[#456784]">
                Record your projects, internships, and certificates and link them to capabilities.
                Items recorded here remain <strong>Unverified Claims</strong> until submitted to the
                Evidence Ledger and accepted by a reviewer.
              </p>
            </div>
          </div>

          <LiquidButton
            variant="primary"
            size="sm"
            pill
            onClick={() => setShowRecordForm(!showRecordForm)}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            {showRecordForm ? 'Close Form' : 'Add Project, Internship or Certificate'}
          </LiquidButton>
        </div>

        {showRecordForm && (
          <form
            onSubmit={handleAddPortfolioRecord}
            className="p-5 rounded-2xl glass-panel-subtle border border-[#8CCBFF] space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Record Category
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as StudentRecordCategory)}
                  className="w-full px-3.5 py-2 rounded-xl select-liquid text-xs sm:text-sm"
                >
                  <option value="PROJECT" className="bg-white text-[#0F2942]">
                    Project
                  </option>
                  <option value="INTERNSHIP" className="bg-white text-[#0F2942]">
                    Internship / Experience
                  </option>
                  <option value="CERTIFICATE" className="bg-white text-[#0F2942]">
                    Certificate / Credential
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Queue Service"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Organization / Issuer / Context
                </label>
                <input
                  type="text"
                  value={organizationOrIssuer}
                  onChange={(e) => setOrganizationOrIssuer(e.target.value)}
                  placeholder="e.g. Campus Systems Lab / Self-Directed"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Linked Capability Dimension
                </label>
                <select
                  value={linkedDimensionId}
                  onChange={(e) => setLinkedDimensionId(e.target.value as CapabilityDimensionId)}
                  className="w-full px-3.5 py-2 rounded-xl select-liquid text-xs sm:text-sm"
                >
                  {CANONICAL_CAPABILITY_DIMENSIONS.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white text-[#0F2942]">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Completion Date / Timeframe
                </label>
                <input
                  type="text"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  placeholder="e.g. Oct 2025"
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                  Evidence / Repository / Certificate Link
                </label>
                <input
                  type="url"
                  value={artifactUrl}
                  onChange={(e) => setArtifactUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                What You Built or Demonstrated
              </label>
              <input
                type="text"
                value={recordDescription}
                onChange={(e) => setRecordDescription(e.target.value)}
                placeholder="Describe your specific contribution, methods used, and measurable outcomes..."
                className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900">
              <strong>Important:</strong> Recording a project, internship, or certificate adds it to
              your profile as an <strong>Unverified Claim</strong>. It will not increase your
              Demonstrated Capability Level until you submit it for review in the Evidence Ledger
              and a reviewer accepts it.
            </div>

            <div className="flex justify-end">
              <LiquidButton type="submit" variant="primary" size="sm" pill>
                Record in Capability Passport
              </LiquidButton>
            </div>
          </form>
        )}

        {state.portfolioRecords.length === 0 ? (
          <div className="p-6 rounded-xl glass-panel-subtle text-xs text-[#456784] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className="text-[#0F2942]">
                No Projects, Internships, or Certificates Recorded Yet:
              </strong>{' '}
              Add your real projects, internships, or credentials above and link them to one of the
              10 capability dimensions.
            </div>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => setShowRecordForm(true)}
            >
              Add First Record
            </LiquidButton>
          </div>
        ) : (
          <div className="space-y-3">
            {state.portfolioRecords.map((rec) => {
              const selectedLevel = claimedLevelForPromote[rec.id] ?? 2;
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl glass-panel-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#C5E4FA]"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF]">
                        {RECORD_TYPE_LABELS[rec.recordType]}
                      </span>
                      <span className="font-display text-sm font-bold text-[#0F2942]">
                        {rec.title}
                      </span>
                      <span className="text-xs text-[#527493]">
                        • {rec.organizationOrIssuer} ({rec.completedDate})
                      </span>
                      {rec.verificationState === 'UNVERIFIED_CLAIM' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Unverified Claim (Does not count as proof yet)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF]">
                          <FileCheck className="w-3 h-3 text-[#087FE0]" />
                          Submitted to Evidence Ledger for Review
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#456784]">{rec.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#174B80]">
                      <span>
                        Linked Capability:{' '}
                        <strong>{getCapabilityDimensionName(rec.linkedDimensionId)}</strong>
                      </span>
                      {rec.artifactUrl && (
                        <a
                          href={rec.artifactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#087FE0] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> {rec.artifactUrl}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {rec.verificationState === 'UNVERIFIED_CLAIM' ? (
                      <>
                        <select
                          aria-label={`Select claimed rubric level for ${rec.title}`}
                          value={selectedLevel}
                          onChange={(e) =>
                            setClaimedLevelForPromote((prev) => ({
                              ...prev,
                              [rec.id]: Number(e.target.value) as RubricLevel,
                            }))
                          }
                          className="select-liquid rounded-xl px-2.5 py-1.5 text-xs font-mono"
                        >
                          <option value={1} className="bg-white text-[#0F2942]">
                            Claim Lvl 1
                          </option>
                          <option value={2} className="bg-white text-[#0F2942]">
                            Claim Lvl 2
                          </option>
                          <option value={3} className="bg-white text-[#0F2942]">
                            Claim Lvl 3
                          </option>
                          <option value={4} className="bg-white text-[#0F2942]">
                            Claim Lvl 4
                          </option>
                        </select>
                        <LiquidButton
                          variant="primary"
                          size="sm"
                          pill
                          onClick={() => promotePortfolioRecordToEvidence(rec.id, selectedLevel)}
                          icon={<FileCheck className="w-3.5 h-3.5" />}
                        >
                          Submit for Evidence Review
                        </LiquidButton>
                      </>
                    ) : (
                      <LiquidButton
                        variant="secondary"
                        size="sm"
                        pill
                        onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                      >
                        Track Review Status →
                      </LiquidButton>
                    )}

                    <button
                      type="button"
                      onClick={() => removeStudentPortfolioRecord(rec.id)}
                      title="Remove record"
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
