import React, { useMemo, useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  JobMarketService,
  SkillIntelligenceService,
  StudentUpdatesService,
} from '../../services/careerIntelligenceServices';
import {
  SkillCandidateClassification,
  SkillTrendClassification,
} from '../../types/marketSkillsCareer';
import { CapabilityDimensionId } from '../../types/wayfinder';
import { CANONICAL_CAPABILITY_DIMENSIONS, getCapabilityDimensionName } from '../../data/capabilityDimensions';
import { getFieldById, getSkillById } from '../../data/fieldAndSkillLibrary';
import { LiquidButton, LiquidTabs } from '../common/LiquidGlassKit';
import {
  TrendingUp,
  Search,
  Sparkles,
  BookOpen,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  PlusCircle,
  CheckCircle2,
  Layers,
  Activity,
} from 'lucide-react';

const TREND_CLASSIFICATION_CONFIG: Record<
  SkillTrendClassification,
  { label: string; badgeClass: string }
> = {
  EMERGING: {
    label: 'Emerging',
    badgeClass: 'bg-[#E5FAFF]/80 text-[#0B2E56] border-white/85',
  },
  GROWING_DEMAND: {
    label: 'Growing Demand',
    badgeClass: 'bg-[#DDF2FF]/80 text-[#075FC7] border-white/85',
  },
  STABLE: {
    label: 'Stable Foundation',
    badgeClass: 'bg-white/60 text-[#0B2E56] border-white/80',
  },
  DECLINING_DEMAND: {
    label: 'Declining Demand',
    badgeClass: 'bg-white/50 text-[#315A7D] border-white/70',
  },
  TRANSFORMING: {
    label: 'Transforming Skill',
    badgeClass: 'bg-[#EAF6FF]/80 text-[#174B80] border-[#8DBDFF]',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Insufficient Evidence',
    badgeClass: 'bg-[#DDF2FF]/55 text-[#315A7D] border-[#0B2E56]/30',
  },
};

const CANDIDATE_CLASSIFICATION_LABELS: Record<SkillCandidateClassification, string> = {
  NEW_SKILL: 'New Skill',
  UPDATED_DESCRIPTION: 'Existing Skill with Updated Description',
  SYNONYM: 'Synonym',
  SUBSKILL: 'Subskill',
  SPECIALISATION: 'Specialisation',
  DUPLICATE: 'Duplicate',
  POTENTIALLY_OUTDATED: 'Potentially Outdated Skill',
};

export const Screen24SkillIntelligence: React.FC = () => {
  const { state, navigateTo, selectSkillAssessment } = useWayfinder();

  const [activeTab, setActiveTab] = useState<
    'TREND_DASHBOARD' | 'SKILL_DETAIL' | 'LIBRARY_PROPOSAL_WORKFLOW'
  >('TREND_DASHBOARD');

  const [fieldFilter, setFieldFilter] = useState<string>('ALL');
  const [trendFilter, setTrendFilter] = useState<SkillTrendClassification | 'ALL'>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allTrends = useMemo(() => SkillIntelligenceService.getAllSkillTrends(), []);
  const [selectedTrendId, setSelectedTrendId] = useState<string>(allTrends[0]?.id || '');

  const [updatePrefs, setUpdatePrefs] = useState(() =>
    StudentUpdatesService.getPreferences()
  );
  const [proposals, setProposals] = useState(() =>
    SkillIntelligenceService.getCandidateProposals()
  );
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Proposed-update form state (Section 4C)
  const [propSkillName, setPropSkillName] = useState('');
  const [propFieldId, setPropFieldId] = useState(state.fieldsCatalogue[0]?.id || 'FIELD_CS_SW');
  const [propSpec, setPropSpec] = useState('General');
  const [propCapId, setPropCapId] = useState<CapabilityDimensionId>('CAP_TECH_COMM');
  const [propClassification, setPropClassification] =
    useState<SkillCandidateClassification>('NEW_SKILL');
  const [propTargetSkillId, setPropTargetSkillId] = useState<string>('');
  const [propTrendClass, setPropTrendClass] =
    useState<SkillTrendClassification>('EMERGING');
  const [propDesc, setPropDesc] = useState('');
  const [propRationale, setPropRationale] = useState('');

  const filteredTrends = useMemo(
    () =>
      SkillIntelligenceService.filterSkillTrends({
        fieldId: fieldFilter,
        trendClassification: trendFilter,
        sectionType: sectionFilter,
        searchQuery,
      }),
    [fieldFilter, trendFilter, sectionFilter, searchQuery]
  );

  const selectedTrend =
    allTrends.find((t) => t.id === selectedTrendId) ||
    filteredTrends[0] ||
    allTrends[0];

  const handleToggleFollowSkill = (skillId: string, label: string) => {
    const next = StudentUpdatesService.toggleFollowSkill(skillId);
    setUpdatePrefs({ ...next });
    setFeedbackBanner(
      next.followedSkillIds.includes(skillId)
        ? `Now following skill "${label}" in your Personalised Updates.`
        : `Unfollowed skill "${label}".`
    );
  };

  const handleToggleFollowField = (fieldId: string, label: string) => {
    const next = StudentUpdatesService.toggleFollowField(fieldId);
    setUpdatePrefs({ ...next });
    setFeedbackBanner(
      next.followedFieldIds.includes(fieldId)
        ? `Now following field "${label}".`
        : `Unfollowed field "${label}".`
    );
  };

  const handleToggleSaveTrend = (trendId: string, label: string) => {
    const next = StudentUpdatesService.toggleSaveTrend(trendId);
    setUpdatePrefs({ ...next });
    setFeedbackBanner(
      next.savedTrendIds.includes(trendId)
        ? `Saved skill trend "${label}".`
        : `Removed skill trend "${label}" from saved trends.`
    );
  };

  const handleSubmitCandidateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propSkillName.trim() || !propDesc.trim()) return;

    const created = SkillIntelligenceService.submitCandidateProposal({
      proposedSkillName: propSkillName,
      fieldId: propFieldId,
      specialization: propSpec,
      mappedCapabilityId: propCapId,
      candidateClassification: propClassification,
      targetExistingSkillId: propTargetSkillId || null,
      proposedDescription: propDesc,
      rationale: propRationale || 'Proposed via Skill Intelligence Library Integration.',
      trendClassification: propTrendClass,
    });
    setProposals([...SkillIntelligenceService.getCandidateProposals()]);
    setPropSkillName('');
    setPropDesc('');
    setPropRationale('');
    setFeedbackBanner(
      `Submitted "${created.proposedSkillName}" as ${CANDIDATE_CLASSIFICATION_LABELS[created.candidateClassification]} to the proposed-update queue (Status: PENDING_REVIEW — not automatically published to the official Skill Library).`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel liquid-glow-bar rounded-[28px] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-[#075FC7]">
              <TrendingUp className="w-4 h-4 text-[#075FC7]" />
              <span className="text-[#174B80]">
                MODULE 2 — SKILL INTELLIGENCE &amp; INDUSTRY TRENDS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DDF2FF]/80 text-[#0B2E56] border border-white/85">
                SAMPLE DATA • PROPOSED-UPDATE GOVERNANCE
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
              Skill Intelligence &amp; Evolving Professional Expectations
            </h1>
            <p className="text-xs sm:text-sm text-[#123B63] max-w-3xl leading-relaxed">
              Understand how professional skill requirements are evolving across emerging,
              growing-demand, stable, transforming, and declining-demand categories. Sample research
              signals are never automatically added to the official WAYFINDER Skill Library without
              editorial review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('15_LEARNING_CENTRE')}
              icon={<BookOpen className="w-4 h-4 text-[#075FC7]" />}
            >
              Learning Hub &amp; Library
            </LiquidButton>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
              icon={<Activity className="w-4 h-4 text-[#075FC7]" />}
            >
              Skill Assessments
            </LiquidButton>
            <LiquidButton
              variant="primary"
              size="sm"
              pill
              onClick={() => navigateTo('23_JOB_MARKET_INTELLIGENCE')}
              icon={<Briefcase className="w-4 h-4" />}
            >
              Job Market Intelligence
            </LiquidButton>
          </div>
        </div>

        <div className="pt-2 relative z-10">
          <LiquidTabs
            tabs={[
              {
                id: 'TREND_DASHBOARD',
                label: 'Skill Intelligence Dashboard',
                count: filteredTrends.length,
              },
              {
                id: 'SKILL_DETAIL',
                label: 'Skill Detail & Readiness Pathways',
              },
              {
                id: 'LIBRARY_PROPOSAL_WORKFLOW',
                label: 'Skill Library Proposed-Update Workflow',
                count: proposals.length,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {feedbackBanner && (
        <div
          role="status"
          className="glass-panel-subtle rounded-2xl px-4 py-3 border border-white/80 flex items-center justify-between gap-3 text-xs text-[#0B2E56]"
        >
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#075FC7]" />
            {feedbackBanner}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-[#075FC7] font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SKILL INTELLIGENCE DASHBOARD (Sections 4A & 4B) */}
      {activeTab === 'TREND_DASHBOARD' && (
        <div className="space-y-6">
          {/* Summary Counters Across All 6 Classifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              Object.keys(TREND_CLASSIFICATION_CONFIG) as SkillTrendClassification[]
            ).map((cls) => {
              const count = allTrends.filter((t) => t.trendClassification === cls).length;
              const active = trendFilter === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setTrendFilter(active ? 'ALL' : cls)}
                  className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                    active ? 'tab-liquid-active' : 'glass-panel-subtle hover:bg-white/40'
                  }`}
                >
                  <div className="text-xl font-display font-bold text-[#0B2E56]">{count}</div>
                  <div className="text-xs font-semibold text-[#174B80] mt-0.5">
                    {TREND_CLASSIFICATION_CONFIG[cls].label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#174B80]">
                Search Skill Trends &amp; Roles
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#075FC7] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skill, tool, or role..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl input-liquid text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#174B80]">
                Filter by Field (All 18 Fields)
              </label>
              <select
                aria-label="Filter skill trends by field"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
              >
                <option value="ALL">All 18 Fields</option>
                {state.fieldsCatalogue.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#174B80]">
                Trend Classification
              </label>
              <select
                aria-label="Filter by trend classification"
                value={trendFilter}
                onChange={(e) =>
                  setTrendFilter(e.target.value as SkillTrendClassification | 'ALL')
                }
                className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
              >
                <option value="ALL">All 6 Trend Classifications</option>
                {(
                  Object.keys(TREND_CLASSIFICATION_CONFIG) as SkillTrendClassification[]
                ).map((cls) => (
                  <option key={cls} value={cls}>
                    {TREND_CLASSIFICATION_CONFIG[cls].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#174B80]">
                Signal Dimension
              </label>
              <select
                aria-label="Filter by signal dimension"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
              >
                <option value="ALL">All Signal Dimensions</option>
                <option value="CORE_SKILL_TREND">Core Skill Trends</option>
                <option value="NEW_TECHNOLOGY">Newly Identified Technologies</option>
                <option value="PROFESSIONAL_TOOL">New Professional Tools</option>
                <option value="INTERDISCIPLINARY_SKILL">Interdisciplinary Skills</option>
                <option value="FIELD_SPECIFIC_DEVELOPMENT">Field-Specific Developments</option>
              </select>
            </div>
          </div>

          {/* Trend Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredTrends.map((trend) => {
              const clsBadge = TREND_CLASSIFICATION_CONFIG[trend.trendClassification];
              const fieldObj = getFieldById(trend.fieldId, state.fieldsCatalogue);
              const isSaved = updatePrefs.savedTrendIds.includes(trend.id);
              const isFollowingField = updatePrefs.followedFieldIds.includes(trend.fieldId);

              return (
                <div
                  key={trend.id}
                  className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DDF2FF]/85 text-[#0B2E56] border border-white/85">
                          SAMPLE DATA
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${clsBadge.badgeClass}`}
                        >
                          {clsBadge.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold glass-floating text-[#075FC7]">
                          {trend.sectionType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSaveTrend(trend.id, trend.skillName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold glass-floating text-[#0B2E56] cursor-pointer"
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-[#075FC7]" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-[#174B80]" />
                            <span>Save Trend</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h2 className="font-display text-lg font-bold text-[#0B2E56]">
                        {trend.skillName}
                      </h2>
                      <div className="text-xs font-semibold text-[#174B80] mt-0.5">
                        Field: {fieldObj?.name || trend.fieldId} • Specialisation:{' '}
                        {trend.specialization}
                      </div>
                    </div>

                    <p className="text-xs text-[#123B63] leading-relaxed">
                      {trend.description}
                    </p>

                    <div className="p-3 rounded-xl glass-panel-subtle text-xs space-y-1">
                      <div className="font-semibold text-[#0B2E56]">Industry Relevance:</div>
                      <p className="text-[#123B63] leading-snug">{trend.industryRelevance}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-[#174B80]">
                        Related Job Roles:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {trend.relatedJobRoles.map((role) => (
                          <span
                            key={role}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/60 text-[#0B2E56] border border-white/80"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="pt-3 border-t border-white/55 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[#315A7D]">
                      <div>
                        <span className="block text-[#174B80] font-bold">Evidence Strength</span>
                        <span>{trend.evidenceStrength.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="block text-[#174B80] font-bold">Confidence</span>
                        <span>{trend.confidenceLevel.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="block text-[#174B80] font-bold">Research Date</span>
                        <span>{trend.researchDate}</span>
                      </div>
                      <div>
                        <span className="block text-[#174B80] font-bold">Review Status</span>
                        <span>{trend.reviewStatus.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFollowField(
                            trend.fieldId,
                            fieldObj?.shortName || trend.fieldId
                          )
                        }
                        className="text-xs font-semibold text-[#075FC7] hover:underline cursor-pointer"
                      >
                        {isFollowingField ? 'Following Field ✓' : '+ Follow Field'}
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        {trend.linkedCatalogueSkillId && (
                          <LiquidButton
                            variant="secondary"
                            size="sm"
                            pill
                            onClick={() =>
                              handleToggleFollowSkill(
                                trend.linkedCatalogueSkillId!,
                                trend.skillName
                              )
                            }
                          >
                            {updatePrefs.followedSkillIds.includes(trend.linkedCatalogueSkillId)
                              ? 'Following Skill ✓'
                              : '+ Follow Skill'}
                          </LiquidButton>
                        )}
                        <LiquidButton
                          variant="primary"
                          size="sm"
                          pill
                          onClick={() => {
                            setSelectedTrendId(trend.id);
                            setActiveTab('SKILL_DETAIL');
                          }}
                        >
                          Open Skill Detail →
                        </LiquidButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SKILL DETAIL PAGE (Section 4D — All 10 Required Sections) */}
      {activeTab === 'SKILL_DETAIL' && selectedTrend && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="trend-detail-select" className="text-xs font-semibold text-[#174B80]">
                Inspect Skill Intelligence Record:
              </label>
              <select
                id="trend-detail-select"
                value={selectedTrend.id}
                onChange={(e) => setSelectedTrendId(e.target.value)}
                className="select-liquid rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                {allTrends.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.skillName} ({TREND_CLASSIFICATION_CONFIG[t.trendClassification].label})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LiquidButton
                variant="secondary"
                size="sm"
                pill
                onClick={() => navigateTo('15_LEARNING_CENTRE')}
              >
                Open in Learning Hub
              </LiquidButton>
              <LiquidButton
                variant="primary"
                size="sm"
                pill
                onClick={() => {
                  const asm = state.skillAssessments.find(
                    (a) => a.skillId === selectedTrend.linkedCatalogueSkillId
                  );
                  if (asm) selectSkillAssessment(asm.id);
                  navigateTo('08_APTITUDE_ASSESSMENT');
                }}
              >
                Take Skill Assessment →
              </LiquidButton>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#DDF2FF]/85 text-[#0B2E56]">
                SAMPLE DATA
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                  TREND_CLASSIFICATION_CONFIG[selectedTrend.trendClassification].badgeClass
                }`}
              >
                5. Demand Classification:{' '}
                {TREND_CLASSIFICATION_CONFIG[selectedTrend.trendClassification].label}
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-semibold glass-floating text-[#075FC7]">
                6. Recommended Proficiency:{' '}
                {selectedTrend.recommendedProficiencyLevel !== null
                  ? `Rubric Level ${selectedTrend.recommendedProficiencyLevel}`
                  : 'Not yet established'}
              </span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-[#0B2E56]">
                1. {selectedTrend.skillName}
              </h2>
              <p className="text-xs sm:text-sm text-[#123B63] mt-2 leading-relaxed">
                {selectedTrend.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 2. Relevant Professional Fields */}
              <div className="p-4 rounded-xl glass-panel-subtle space-y-1.5">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  2. Relevant Professional Fields
                </h3>
                <p className="text-xs font-bold text-[#0B2E56]">
                  {getFieldById(selectedTrend.fieldId, state.fieldsCatalogue)?.name ||
                    selectedTrend.fieldId}
                </p>
                <p className="text-xs text-[#123B63]">
                  Specialisation: {selectedTrend.specialization}
                </p>
                <p className="text-[11px] text-[#315A7D]">
                  Canonical Capability:{' '}
                  {getCapabilityDimensionName(selectedTrend.mappedCapabilityId)}
                </p>
              </div>

              {/* 3. Associated Job Roles */}
              <div className="p-4 rounded-xl glass-panel-subtle space-y-1.5">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  3. Associated Job Roles
                </h3>
                <ul className="space-y-1 text-xs text-[#123B63]">
                  {selectedTrend.relatedJobRoles.map((role) => (
                    <li key={role}>• {role}</li>
                  ))}
                </ul>
              </div>

              {/* 4. Related Skills */}
              <div className="p-4 rounded-xl glass-panel-subtle space-y-1.5">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  4. Related WAYFINDER Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTrend.relatedSkillIds.map((sid) => {
                    const sk = getSkillById(sid, state.skillsCatalogue);
                    return (
                      <span
                        key={sid}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/60 text-[#0B2E56] border border-white/80"
                      >
                        {sk?.name || sid}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 7. Learning Resources & 8. Related Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-panel-subtle space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  7. Curated Learning Resources
                </h3>
                {selectedTrend.associatedResourceIds.length === 0 ? (
                  <p className="text-xs text-[#315A7D]">No linked resources yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-[#123B63]">
                    {selectedTrend.associatedResourceIds.map((rid) => {
                      const res = state.learningResources.find((r) => r.id === rid);
                      return (
                        <li key={rid} className="flex items-center justify-between gap-2">
                          <span>• {res?.title || rid}</span>
                          <button
                            type="button"
                            onClick={() => navigateTo('15_LEARNING_CENTRE')}
                            className="text-[#075FC7] font-semibold hover:underline shrink-0 cursor-pointer"
                          >
                            Study →
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="p-4 rounded-xl glass-panel-subtle space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  8. Related Market Opportunities
                </h3>
                {selectedTrend.relatedOpportunityIds.length === 0 ? (
                  <p className="text-xs text-[#315A7D]">
                    No active demonstration opportunities linked to this trend.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-[#123B63]">
                    {selectedTrend.relatedOpportunityIds.map((oid) => {
                      const opp = JobMarketService.getOpportunityById(oid);
                      return (
                        <li key={oid} className="flex items-center justify-between gap-2">
                          <span>• {opp?.title || oid}</span>
                          <button
                            type="button"
                            onClick={() => navigateTo('23_JOB_MARKET_INTELLIGENCE')}
                            className="text-[#075FC7] font-semibold hover:underline shrink-0 cursor-pointer"
                          >
                            Inspect →
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* 9. Development Recommendations & 10. Source Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-panel-subtle space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  9. Practical Development Recommendations
                </h3>
                <ul className="space-y-1.5 text-xs text-[#123B63]">
                  {selectedTrend.developmentRecommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl glass-panel-subtle space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  10. Supporting Sources &amp; Provenance
                </h3>
                <div className="text-xs text-[#123B63] space-y-1">
                  <div>
                    <strong>Publication Summary:</strong> {selectedTrend.publicationDatesSummary}
                  </div>
                  <div>
                    <strong>Research Date:</strong> {selectedTrend.researchDate}
                  </div>
                  {selectedTrend.supportingSources.map((src) => (
                    <div key={src.id} className="pt-1 text-[11px] text-[#315A7D]">
                      • {src.title} ({src.publisherOrBody}, {src.publicationDate}) [SAMPLE
                      REFERENCE]
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SKILL LIBRARY PROPOSED-UPDATE WORKFLOW (Section 4C) */}
      {activeTab === 'LIBRARY_PROPOSAL_WORKFLOW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Submit Candidate Classification Form */}
          <form
            onSubmit={handleSubmitCandidateProposal}
            className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4"
          >
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase text-[#075FC7]">
                Proposed-Update Governance
              </span>
              <h2 className="font-display text-lg font-bold text-[#0B2E56]">
                Classify &amp; Propose a Skill Library Update
              </h2>
              <p className="text-xs text-[#123B63]">
                Classify identified skills as a New Skill, Updated Description, Synonym, Subskill,
                Specialisation, Duplicate, or Potentially Outdated Skill. Proposals enter the
                review queue and are never auto-published as official skills.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#174B80]">
                Candidate Classification (7 Categories)
              </label>
              <select
                value={propClassification}
                onChange={(e) =>
                  setPropClassification(e.target.value as SkillCandidateClassification)
                }
                className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
              >
                {(
                  Object.keys(
                    CANDIDATE_CLASSIFICATION_LABELS
                  ) as SkillCandidateClassification[]
                ).map((cls) => (
                  <option key={cls} value={cls}>
                    {CANDIDATE_CLASSIFICATION_LABELS[cls]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#174B80]">
                Proposed Skill or Subskill Name
              </label>
              <input
                type="text"
                required
                value={propSkillName}
                onChange={(e) => setPropSkillName(e.target.value)}
                placeholder="e.g. Automated Accessibility Tree Auditing"
                className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#174B80]">Field</label>
                <select
                  value={propFieldId}
                  onChange={(e) => setPropFieldId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  {state.fieldsCatalogue.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#174B80]">Specialisation</label>
                <input
                  type="text"
                  value={propSpec}
                  onChange={(e) => setPropSpec(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#174B80]">
                  Mapped Canonical Capability
                </label>
                <select
                  value={propCapId}
                  onChange={(e) => setPropCapId(e.target.value as CapabilityDimensionId)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  {CANONICAL_CAPABILITY_DIMENSIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#174B80]">
                  Related Existing Skill (Optional)
                </label>
                <select
                  value={propTargetSkillId}
                  onChange={(e) => setPropTargetSkillId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="">None (Standalone New Skill)</option>
                  {state.skillsCatalogue.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#174B80]">
                Proposed Description
              </label>
              <textarea
                rows={3}
                required
                value={propDesc}
                onChange={(e) => setPropDesc(e.target.value)}
                placeholder="Describe what the skill entails and how it is demonstrated..."
                className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
              />
            </div>

            <LiquidButton type="submit" variant="primary" pill icon={<PlusCircle className="w-4 h-4" />}>
              Submit to Proposed-Update Queue
            </LiquidButton>
          </form>

          {/* Proposed-Update Queue List */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B2E56]">
                  Skill Library Proposed-Update Queue ({proposals.length})
                </h2>
                <p className="text-xs text-[#123B63]">
                  Curators and Administrators review these proposals in the Administrative
                  Intelligence Workspace before any update reaches the official Skill Library.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {proposals.map((prop) => {
                const existingSkill = prop.targetExistingSkillId
                  ? getSkillById(prop.targetExistingSkillId, state.skillsCatalogue)
                  : null;
                return (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl glass-panel-subtle border border-white/75 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DDF2FF]/85 text-[#0B2E56]">
                          {CANDIDATE_CLASSIFICATION_LABELS[prop.candidateClassification]}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold glass-floating text-[#075FC7]">
                          {prop.reviewStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#315A7D]">
                        {prop.submittedAt.slice(0, 10)}
                      </span>
                    </div>

                    <h3 className="font-display text-sm font-bold text-[#0B2E56]">
                      {prop.proposedSkillName}
                    </h3>
                    {existingSkill && (
                      <div className="text-xs font-semibold text-[#174B80]">
                        Linked Existing Catalogue Skill: {existingSkill.name} ({existingSkill.id})
                      </div>
                    )}
                    <p className="text-xs text-[#123B63]">{prop.proposedDescription}</p>
                    <p className="text-[11px] text-[#315A7D]">
                      Reviewer Notes: {prop.reviewerNotes}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
