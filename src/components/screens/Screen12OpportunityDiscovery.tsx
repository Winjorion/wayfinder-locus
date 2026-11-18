import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  TargetCategory,
  OpportunityTarget,
  CapabilityDimensionId,
  RubricLevel,
  RiasecDomain,
  OpportunityVerificationStatus,
} from '../../types/wayfinder';
import { CANONICAL_CAPABILITY_DIMENSIONS } from '../../data/capabilityDimensions';
import { RIASEC_DOMAIN_LABELS } from '../../data/riasecBank';
import { resolveOpportunityVerification } from '../../engine/readinessEngine';
import {
  Briefcase,
  Search,
  PlusCircle,
  ArrowRight,
  Compass,
  ShieldAlert,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { LiquidButton, LiquidTabs } from '../common/LiquidGlassKit';

const CATEGORY_LABELS: Record<TargetCategory, string> = {
  CAREER_PATHWAY: 'Career Pathway',
  INTERNSHIP_JOB: 'Internship & Job',
  COMPETITION: 'Competition',
  PROJECT_CHALLENGE: 'Project Challenge',
};

const VERIFICATION_BADGE_CONFIG: Record<
  OpportunityVerificationStatus,
  { label: string; className: string }
> = {
  VERIFIED: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  NOT_VERIFIED: {
    label: 'Not Verified Externally',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  PENDING: {
    label: 'Verification Pending',
    className: 'bg-[#F0F9FF] text-[#087FE0] border-[#8CCBFF]',
  },
  UNAVAILABLE: {
    label: 'Source Unavailable',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  EXPIRED: {
    label: 'Deadline Expired',
    className: 'bg-red-50 text-red-800 border-red-300',
  },
};

export const Screen12OpportunityDiscovery: React.FC = () => {
  const { state, selectTarget, createCustomTarget, navigateTo } = useWayfinder();
  const [categoryFilter, setCategoryFilter] = useState<TargetCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TargetCategory>('PROJECT_CHALLENGE');
  const [newOrg, setNewOrg] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newApplicationUrl, setNewApplicationUrl] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<RiasecDomain[]>(['I', 'R']);
  const [reqDim1, setReqDim1] = useState<CapabilityDimensionId>('CAP_PROG_SW');
  const [reqLevel1, setReqLevel1] = useState<RubricLevel>(3);
  const [reqDim2, setReqDim2] = useState<CapabilityDimensionId>('CAP_SYS_DESIGN');
  const [reqLevel2, setReqLevel2] = useState<RubricLevel>(2);

  const filteredTargets = state.targets.filter((t) => {
    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleDomain = (d: RiasecDomain) => {
    setSelectedDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const hasSource = Boolean(newSourceUrl.trim());
    const hasAppLink = Boolean(newApplicationUrl.trim());
    const hasDeadline = Boolean(newDeadline.trim());
    const deadlineExpired =
      hasDeadline &&
      !Number.isNaN(Date.parse(newDeadline.trim())) &&
      Date.parse(newDeadline.trim()) < Date.now();

    const newTarget: OpportunityTarget = {
      id: `TGT_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      organizationLabel: newOrg.trim() || 'User-Defined Target Opportunity',
      isSampleData: false,
      version: '2025.1',
      rubricVersion: 'RUBRIC_V1',
      summary:
        newSummary.trim() ||
        'Custom opportunity target defined to compare demonstrated capabilities and identify requirement gaps.',
      sourceUrl: hasSource ? newSourceUrl.trim() : null,
      applicationUrl: hasAppLink ? newApplicationUrl.trim() : null,
      applicationDeadline: hasDeadline ? newDeadline.trim() : null,
      relevantRiasecDomains: selectedDomains.length > 0 ? selectedDomains : ['I', 'R'],
      verification: {
        organizerIdentityStatus: 'NOT_VERIFIED',
        opportunitySourceStatus: hasSource ? 'NOT_VERIFIED' : 'UNAVAILABLE',
        requirementsExtractedStatus: 'NOT_VERIFIED',
        capabilitiesMappedStatus: 'VERIFIED',
        applicationLinkStatus: hasAppLink ? 'NOT_VERIFIED' : 'UNAVAILABLE',
        deadlineStatus: deadlineExpired
          ? 'EXPIRED'
          : hasDeadline
          ? 'NOT_VERIFIED'
          : 'UNAVAILABLE',
        lastVerifiedAt: null,
        overallStatus: deadlineExpired ? 'EXPIRED' : 'NOT_VERIFIED',
        statusExplanation: deadlineExpired
          ? 'The application deadline entered for this target has already passed.'
          : 'User-entered target opportunity: required capabilities are mapped to the 10-dimension rubric, while external organizer identity, source URL, application link, and deadline have not been independently verified.',
      },
      mandatoryConditions: [
        {
          id: `MC_${Date.now()}`,
          label: 'Active Student Enrollment',
          conditionType: 'ENROLLED_STUDENT',
          isMet: state.currentUser?.eligibility.enrolledStudentVerified ?? false,
          verificationSource: 'USER_ATTESTATION',
        },
      ],
      requirements: [
        {
          id: `REQ_1_${Date.now()}`,
          dimensionId: reqDim1,
          requiredLevel: reqLevel1,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: true,
          evidenceRequired: true,
          rationale: 'Primary mandatory capability requirement with verified evidence.',
        },
        {
          id: `REQ_2_${Date.now()}`,
          dimensionId: reqDim2,
          requiredLevel: reqLevel2,
          rubricVersion: 'RUBRIC_V1',
          isMandatory: false,
          evidenceRequired: false,
          rationale: 'Supporting capability requirement.',
        },
      ],
    };
    createCustomTarget(newTarget);
    setNewTitle('');
    setNewOrg('');
    setNewSummary('');
    setNewSourceUrl('');
    setNewApplicationUrl('');
    setNewDeadline('');
    setShowCreateForm(false);
    navigateTo('13_OPPORTUNITY_DETAIL');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
              Opportunity Readiness &amp; Verification Layer
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942] mt-1">
              Explore &amp; Define Target Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-[#456784] mt-1 max-w-3xl">
              Compare your demonstrated capabilities and verified evidence against specific
              opportunities. Every opportunity displays transparent source, requirement, link, and
              deadline verification status—never an unexplained trust checkmark.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LiquidButton
              variant="secondary"
              pill
              onClick={() => navigateTo('23_JOB_MARKET_INTELLIGENCE')}
              icon={<Briefcase className="w-4 h-4" />}
            >
              Job Market Intelligence
            </LiquidButton>
            <LiquidButton
              variant="secondary"
              pill
              onClick={() => navigateTo('25_RESUME_BUILDER')}
            >
              Tailor Resume
            </LiquidButton>
            <LiquidButton
              variant="primary"
              pill
              onClick={() => setShowCreateForm(!showCreateForm)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              {showCreateForm ? 'Close Target Builder' : 'Define Custom Opportunity'}
            </LiquidButton>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#087FE0] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities by title or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl input-liquid text-xs sm:text-sm"
            />
          </div>

          <LiquidTabs
            tabs={[
              { id: 'ALL', label: 'All Categories' },
              { id: 'CAREER_PATHWAY', label: 'Career Pathways' },
              { id: 'INTERNSHIP_JOB', label: 'Internships & Jobs' },
              { id: 'COMPETITION', label: 'Competitions' },
              { id: 'PROJECT_CHALLENGE', label: 'Projects' },
            ]}
            activeTab={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
      </div>

      {/* Custom Target Builder Panel */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateCustom}
          className="liquid-stack-card rounded-2xl p-6 border border-[#8CCBFF] space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F2942]">
                Define a Target Opportunity to Benchmark Readiness
              </h2>
              <p className="text-xs text-[#456784]">
                Specify the role or challenge, map its required capabilities, and optionally include
                source and application details. User-entered fields are honestly marked as{' '}
                <strong>Not Verified Externally</strong> until reviewed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Opportunity Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Backend Systems Engineering Internship"
                className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Organization / Organizer
              </label>
              <input
                type="text"
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                placeholder="Organization or competition host"
                className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Opportunity Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TargetCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-sm"
              >
                <option value="CAREER_PATHWAY" className="bg-white text-[#0F2942]">
                  Career Pathway
                </option>
                <option value="INTERNSHIP_JOB" className="bg-white text-[#0F2942]">
                  Internship &amp; Job
                </option>
                <option value="COMPETITION" className="bg-white text-[#0F2942]">
                  Competition
                </option>
                <option value="PROJECT_CHALLENGE" className="bg-white text-[#0F2942]">
                  Project Challenge
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Overview &amp; Goal Summary
            </label>
            <input
              type="text"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Describe what this opportunity involves and what deliverables or responsibilities are expected..."
              className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-sm"
            />
          </div>

          {/* Optional Source, Application Link, and Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Official Source URL (Optional)
              </label>
              <input
                type="url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://organization.org/listing"
                className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Application Link (Optional)
              </label>
              <input
                type="url"
                value={newApplicationUrl}
                onChange={(e) => setNewApplicationUrl(e.target.value)}
                placeholder="https://organization.org/apply"
                className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl input-liquid text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Relevant RIASEC Interest Areas (For Interest vs Readiness Comparison) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#0F2942]">
              Relevant Career Interest Themes (Used for Interest Exploration Only — Never Readiness)
            </div>
            <div className="flex flex-wrap gap-2">
              {(['R', 'I', 'A', 'S', 'E', 'C'] as RiasecDomain[]).map((dom) => {
                const active = selectedDomains.includes(dom);
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => toggleDomain(dom)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#DDF2FF] text-[#087FE0] border-[#087FE0]'
                        : 'bg-white/70 text-[#527493] border-[#C5E4FA]'
                    }`}
                  >
                    {dom} — {RIASEC_DOMAIN_LABELS[dom]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl glass-panel-subtle space-y-2">
              <div className="text-xs font-semibold text-[#087FE0]">
                Primary Capability Requirement (Mandatory + Verified Evidence)
              </div>
              <select
                value={reqDim1}
                onChange={(e) => setReqDim1(e.target.value as CapabilityDimensionId)}
                className="w-full px-2.5 py-2 rounded-xl select-liquid text-xs"
              >
                {CANONICAL_CAPABILITY_DIMENSIONS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-[#0F2942]">
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={reqLevel1}
                onChange={(e) => setReqLevel1(Number(e.target.value) as RubricLevel)}
                className="w-full px-2.5 py-2 rounded-xl select-liquid text-xs"
              >
                <option value={1} className="bg-white text-[#0F2942]">
                  Target Level 1 — Foundational
                </option>
                <option value={2} className="bg-white text-[#0F2942]">
                  Target Level 2 — Applied
                </option>
                <option value={3} className="bg-white text-[#0F2942]">
                  Target Level 3 — Proficient
                </option>
                <option value={4} className="bg-white text-[#0F2942]">
                  Target Level 4 — Advanced
                </option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl glass-panel-subtle space-y-2">
              <div className="text-xs font-semibold text-[#174B80]">
                Secondary Capability Requirement
              </div>
              <select
                value={reqDim2}
                onChange={(e) => setReqDim2(e.target.value as CapabilityDimensionId)}
                className="w-full px-2.5 py-2 rounded-xl select-liquid text-xs"
              >
                {CANONICAL_CAPABILITY_DIMENSIONS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-[#0F2942]">
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={reqLevel2}
                onChange={(e) => setReqLevel2(Number(e.target.value) as RubricLevel)}
                className="w-full px-2.5 py-2 rounded-xl select-liquid text-xs"
              >
                <option value={1} className="bg-white text-[#0F2942]">
                  Target Level 1 — Foundational
                </option>
                <option value={2} className="bg-white text-[#0F2942]">
                  Target Level 2 — Applied
                </option>
                <option value={3} className="bg-white text-[#0F2942]">
                  Target Level 3 — Proficient
                </option>
                <option value={4} className="bg-white text-[#0F2942]">
                  Target Level 4 — Advanced
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <LiquidButton type="submit" variant="primary" pill>
              Save Target &amp; Inspect Verification &amp; Readiness
            </LiquidButton>
          </div>
        </form>
      )}

      {/* Target Cards Grid OR Truthful Empty State */}
      {filteredTargets.length === 0 ? (
        <div className="liquid-stack-card rounded-2xl p-10 text-center space-y-4 relative overflow-hidden">
          <div className="hidden sm:block absolute top-8 right-10 w-8 h-8 aqua-drop pointer-events-none opacity-75" />
          <div className="w-14 h-14 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto">
            <Compass className="w-7 h-7 text-[#087FE0]" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-display text-xl font-bold text-[#0F2942]">
              No Verified or Custom Opportunities Available Yet
            </h2>
            <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
              {state.supabaseConfigured
                ? 'No published opportunities matched your current search or category filter. WAYFINDER never populates fictional listings.'
                : 'No external opportunity feed is connected in this session, and WAYFINDER never fabricates sample listings. Define a target opportunity above to evaluate your capability readiness, missing evidence, and verification status.'}
            </p>
          </div>
          <div className="pt-2">
            <LiquidButton
              variant="primary"
              pill
              onClick={() => setShowCreateForm(true)}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Define a Target Opportunity
            </LiquidButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTargets.map((target) => {
            const isSelected = state.selectedTargetId === target.id;
            const verification = resolveOpportunityVerification(target);
            const badgeCfg = VERIFICATION_BADGE_CONFIG[verification.overallStatus];

            return (
              <div
                key={target.id}
                className={`liquid-stack-card rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all ${
                  isSelected
                    ? 'border-[#087FE0] shadow-[0_12px_32px_rgba(8,127,224,0.18)]'
                    : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF2FF] text-[#087FE0] border border-[#8CCBFF]">
                      {CATEGORY_LABELS[target.category] || target.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${badgeCfg.className}`}
                      >
                        {verification.overallStatus === 'VERIFIED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : verification.overallStatus === 'PENDING' ? (
                          <Clock className="w-3 h-3" />
                        ) : verification.overallStatus === 'UNAVAILABLE' ? (
                          <HelpCircle className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        {badgeCfg.label}
                      </span>
                      <span className="text-[11px] font-mono text-[#527493]">
                        v{target.version}
                      </span>
                    </div>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#0F2942]">{target.title}</h2>
                  <div className="text-xs text-[#087FE0] font-medium flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{target.organizationLabel}</span>
                  </div>
                  <p className="text-xs text-[#456784] leading-relaxed">{target.summary}</p>

                  {/* Mini Verification Summary Strip */}
                  <div className="p-3 rounded-xl glass-panel-subtle text-[11px] text-[#456784] space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                      <span>
                        Capabilities Mapped:{' '}
                        <strong className="text-[#087FE0]">
                          {verification.capabilitiesMappedStatus}
                        </strong>
                      </span>
                      <span>
                        Source:{' '}
                        <strong className="text-[#0F2942]">
                          {verification.opportunitySourceStatus}
                        </strong>
                      </span>
                      <span>
                        Deadline:{' '}
                        <strong className="text-[#0F2942]">
                          {target.applicationDeadline
                            ? `${target.applicationDeadline} (${verification.deadlineStatus})`
                            : 'Unavailable'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#C5E4FA] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-mono text-[#527493]">
                    {target.requirements.length} Skill Requirements •{' '}
                    {target.mandatoryConditions.length} Eligibility Checks
                  </div>

                  <div className="flex items-center gap-2">
                    <LiquidButton
                      variant="secondary"
                      size="sm"
                      pill
                      onClick={() => {
                        selectTarget(target.id);
                        navigateTo('13_OPPORTUNITY_DETAIL');
                      }}
                    >
                      Verification &amp; Details
                    </LiquidButton>
                    <LiquidButton
                      variant="primary"
                      size="sm"
                      pill
                      onClick={() => {
                        selectTarget(target.id);
                        navigateTo('14_READINESS_GAP_ANALYSIS');
                      }}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Compare Readiness
                    </LiquidButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
