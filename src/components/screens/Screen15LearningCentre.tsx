import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Plus,
  FileCheck,
  ShieldCheck,
  Compass,
  Flag,
  Video,
} from 'lucide-react';
import { useWayfinder } from '../../context/WayfinderContext';
import { CANONICAL_CAPABILITY_DIMENSIONS } from '../../data/capabilityDimensions';
import {
  computeTargetReadinessReport,
  recommendLearningForOpportunityGaps,
} from '../../engine/readinessEngine';
import {
  CapabilityDimensionId,
  LearningResourceType,
  ResourceIssueReport,
  RubricLevel,
  StudentResourceProgressState,
} from '../../types/wayfinder';
import {
  LiquidButton,
  LiquidCard,
  LiquidTabs,
} from '../common/LiquidGlassKit';
import { RequirementStatusBadge } from '../common/StatusBadge';

type LearningHubTab =
  | 'RECOMMENDED_FOR_GAPS'
  | 'RESOURCE_CATALOGUE'
  | 'FIELD_SKILL_LIBRARY'
  | 'DEVELOPMENT_AND_CURATION';

const RESOURCE_TYPE_LABELS: Record<LearningResourceType, string> = {
  YOUTUBE_VIDEO: 'YouTube Video Lecture',
  YOUTUBE_PLAYLIST: 'YouTube Course Playlist',
  ONLINE_COURSE: 'Online Course',
  UNIVERSITY_OER: 'University Open Courseware',
  OFFICIAL_DOCUMENTATION: 'Official Documentation',
  TECHNICAL_REFERENCE: 'Technical Reference',
  TUTORIAL_ARTICLE: 'Tutorial / Guide',
  PRACTICE_EXERCISE: 'Practice Exercise',
  PRACTICAL_PROJECT: 'Practical Project Brief',
  OPEN_TEXTBOOK: 'Open Textbook',
  STANDARD_GUIDANCE: 'Standard / Guidance',
};

export const Screen15LearningCentre: React.FC = () => {
  const {
    state,
    navigateTo,
    selectSkillAssessment,
    updateResourceProgress,
    reportLearningResourceIssue,
    addCustomFieldCategory,
    addCustomSkillToCatalogue,
    addCustomLearningResource,
    updateSkillPublicationStatus,
    updateResourceEditorialStatus,
    selectTarget,
    addGapDevelopmentPlanActivity,
  } = useWayfinder();

  const [activeTab, setActiveTab] = useState<LearningHubTab>('RECOMMENDED_FOR_GAPS');

  // Catalogue filter state (Field, Specialisation, Skill, Format, Level, Cost, Language)
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');
  const [specFilter, setSpecFilter] = useState<string>('ALL');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [costFilter, setCostFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<string>('ALL');

  // YouTube privacy-enhanced embed toggle state
  const [expandedEmbedResourceId, setExpandedEmbedResourceId] = useState<string | null>(null);

  // Broken link reporting state
  const [reportingResourceId, setReportingResourceId] = useState<string | null>(null);
  const [issueReason, setIssueReason] = useState<ResourceIssueReport['reason']>('BROKEN_LINK');
  const [issueDetails, setIssueDetails] = useState('');
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  // Field Library selected field
  const [selectedLibraryFieldId, setSelectedLibraryFieldId] = useState<string>('ALL');

  // Curation forms (Add custom field / skill / resource)
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldShort, setCustomFieldShort] = useState('');
  const [customFieldDesc, setCustomFieldDesc] = useState('');
  const [customFieldSpecs, setCustomFieldSpecs] = useState('');

  const [customSkillFieldId, setCustomSkillFieldId] = useState(
    state.fieldsCatalogue[0]?.id || 'FIELD_CS_SW'
  );
  const [customSkillSpec, setCustomSkillSpec] = useState('General');
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillDesc, setCustomSkillDesc] = useState('');
  const [customSkillCapId, setCustomSkillCapId] = useState<CapabilityDimensionId>('CAP_PROJ_EXEC');
  const [customSkillEvidence, setCustomSkillEvidence] = useState(
    'Verifiable project artifact, code repository, or laboratory report'
  );
  const [curationNotice, setCurationNotice] = useState<string | null>(null);

  const [customResTitle, setCustomResTitle] = useState('');
  const [customResProvider, setCustomResProvider] = useState('');
  const [customResType, setCustomResType] = useState<LearningResourceType>('OFFICIAL_DOCUMENTATION');
  const [customResFieldId, setCustomResFieldId] = useState(
    state.fieldsCatalogue[0]?.id || 'FIELD_CS_SW'
  );
  const [customResSkillId, setCustomResSkillId] = useState(
    state.skillsCatalogue[0]?.id || 'SKL_CS_SQL'
  );
  const [customResUrl, setCustomResUrl] = useState('');
  const [customResObjective, setCustomResObjective] = useState('');

  const canReviewContent =
    state.activeRole === 'ADMIN' ||
    state.activeRole === 'REVIEWER' ||
    state.currentUser?.role === 'ADMIN' ||
    state.currentUser?.role === 'REVIEWER';

  const selectedTarget =
    state.targets.find((t) => t.id === state.selectedTargetId) || state.targets[0] || null;

  const readinessReport = useMemo(() => {
    if (!selectedTarget) return null;
    return computeTargetReadinessReport(
      selectedTarget,
      state.capabilityRecords,
      state.evidenceSubmissions,
      state.currentUser
    );
  }, [selectedTarget, state.capabilityRecords, state.evidenceSubmissions, state.currentUser]);

  const gapRecommendations = useMemo(() => {
    if (!selectedTarget || !readinessReport) return [];
    return recommendLearningForOpportunityGaps(
      selectedTarget,
      readinessReport,
      state.skillsCatalogue,
      state.learningResources,
      state.skillAssessments
    );
  }, [
    selectedTarget,
    readinessReport,
    state.skillsCatalogue,
    state.learningResources,
    state.skillAssessments,
  ]);

  const availableSpecialisations = useMemo(() => {
    const specs = new Set<string>();
    state.learningResources.forEach((r) => {
      if (fieldFilter === 'ALL' || r.fieldId === fieldFilter) {
        specs.add(r.specialization);
      }
    });
    return Array.from(specs).sort();
  }, [state.learningResources, fieldFilter]);

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    state.learningResources.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [state.learningResources]);

  const filteredResources = useMemo(() => {
    return state.learningResources.filter((res) => {
      if (fieldFilter !== 'ALL' && res.fieldId !== fieldFilter) return false;
      if (specFilter !== 'ALL' && res.specialization !== specFilter) return false;
      if (skillFilter !== 'ALL' && !res.associatedSkillIds.includes(skillFilter)) return false;
      if (typeFilter !== 'ALL' && res.resourceType !== typeFilter) return false;
      if (costFilter !== 'ALL' && res.costInfo !== costFilter) return false;
      if (languageFilter !== 'ALL' && res.language !== languageFilter) return false;
      if (
        levelFilter !== 'ALL' &&
        res.suggestedProficiencyLevel !== (Number(levelFilter) as RubricLevel)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          res.title.toLowerCase().includes(q) ||
          res.providerOrCreator.toLowerCase().includes(q) ||
          res.specialization.toLowerCase().includes(q) ||
          res.description.toLowerCase().includes(q) ||
          res.learningObjective.toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      return true;
    });
  }, [
    state.learningResources,
    fieldFilter,
    specFilter,
    skillFilter,
    typeFilter,
    costFilter,
    languageFilter,
    levelFilter,
    searchQuery,
  ]);

  const handleReportIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingResourceId || !issueDetails.trim()) return;
    reportLearningResourceIssue(reportingResourceId, issueReason, issueDetails.trim());
    setReportFeedback(
      'Issue report logged. Resource verification status flagged for editorial review.'
    );
    setReportingResourceId(null);
    setIssueDetails('');
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillName.trim() || !customSkillDesc.trim()) return;
    addCustomSkillToCatalogue({
      id: `SKL_CUSTOM_${Date.now()}`,
      name: customSkillName.trim(),
      description: customSkillDesc.trim(),
      fieldId: customSkillFieldId,
      specialization: customSkillSpec.trim() || 'General',
      skillCategory: 'PRACTICAL_EXECUTION',
      mappedCapabilityId: customSkillCapId,
      relevantProficiencyLevels: [1, 2, 3, 4],
      prerequisiteSkillIds: [],
      assessmentAvailable: false,
      assessmentMethod: 'PORTFOLIO_OR_PROJECT_REVIEW_ONLY',
      assessmentMethodExplanation:
        'Evaluated through human-reviewed artifact submission in the Evidence Ledger rather than an automated quiz.',
      associatedResourceIds: [],
      evidenceRequirements: customSkillEvidence.trim(),
      relatedOpportunityNotes:
        'Applicable to roles and projects requiring verified domain execution.',
    });
    setCustomSkillName('');
    setCustomSkillDesc('');
    setCurationNotice('New skill registered in the Field & Skill Library.');
  };

  const handleAddCustomResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customResTitle.trim() || !customResUrl.trim() || !customResProvider.trim()) return;
    addCustomLearningResource({
      title: customResTitle.trim(),
      description:
        customResObjective.trim() ||
        'Curated reference material supporting foundational and applied skill development.',
      originalUrl: customResUrl.trim(),
      youtubeEmbedUrl: null,
      resourceType: customResType,
      providerOrCreator: customResProvider.trim(),
      fieldId: customResFieldId,
      specialization: 'General',
      associatedSkillIds: [customResSkillId],
      mappedCapabilityId: 'CAP_PROJ_EXEC',
      suggestedProficiencyLevel: 2,
      language: 'English',
      estimatedDuration: null,
      costInfo: null,
      prerequisites: null,
      certificateAvailable: null,
      publicationOrReviewedDate: null,
      accessibilityNotes: null,
      learningObjective:
        customResObjective.trim() ||
        'Apply the concepts from this resource to produce a verifiable artifact for the Evidence Ledger.',
    });
    setCustomResTitle('');
    setCustomResProvider('');
    setCustomResUrl('');
    setCustomResObjective('');
    setCurationNotice('New learning resource added to the curated catalogue.');
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldName.trim() || !customFieldDesc.trim()) return;
    const specsList = customFieldSpecs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    addCustomFieldCategory({
      id: `FIELD_CUSTOM_${Date.now()}`,
      name: customFieldName.trim(),
      shortName: customFieldShort.trim() || customFieldName.trim().slice(0, 18),
      description: customFieldDesc.trim(),
      specializations: specsList.length > 0 ? specsList : ['General Specialisation'],
      catalogueCoverageNote:
        'Added through the extensible Field & Specialisation Library workflow.',
    });
    setCustomFieldName('');
    setCustomFieldShort('');
    setCustomFieldDesc('');
    setCustomFieldSpecs('');
    setCurationNotice('New field and specialisations registered in the Field Library.');
  };

  const inputClass = 'w-full rounded-xl px-3.5 py-2 text-xs input-liquid';
  const labelClass = 'block text-[11px] font-mono uppercase tracking-wider text-[#174B80] mb-1';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#1F68FF] mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Field-Agnostic Opportunity Readiness Intelligence</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
            Learning Hub &amp; Field Skill Library
          </h1>
          <p className="text-sm text-[#3E6084] mt-1 max-w-3xl">
            Curated educational resources, official documentation, university courseware, YouTube lectures, and practical project briefs connected directly to your opportunity capability gaps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => navigateTo('24_SKILL_INTELLIGENCE')}
          >
            Skill Intelligence &amp; Trends
          </LiquidButton>
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => navigateTo('25_RESUME_BUILDER')}
          >
            Resume Skill Studio
          </LiquidButton>
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
          >
            Take Skill Assessment
          </LiquidButton>
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => navigateTo('16_ACTIVITY_WORKSPACE')}
          >
            My Learning Progress ({state.resourceProgress.length})
          </LiquidButton>
          <LiquidButton
            variant="primary"
            size="sm"
            icon={<FileCheck className="w-4 h-4" />}
            onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
          >
            Submit Proof Artifact
          </LiquidButton>
        </div>
      </div>

      {/* Non-Negotiable Integrity Principle Banner */}
      <div className="p-4 rounded-2xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#2B4C73]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#1F68FF] shrink-0" />
          <span>
            <strong className="text-[#0B2E56]">CLAIM ≠ CAPABILITY ≠ PROOF:</strong> Saving a resource, watching a video, or completing self-study updates your <em>Learning Progress</em>—it never automatically marks a capability as Demonstrated until you pass a versioned assessment or submit verified evidence.
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#174B80] shrink-0">
          {state.fieldsCatalogue.length} Fields · {state.skillsCatalogue.length} Skills · {state.learningResources.length} Curated Resources
        </span>
      </div>

      {reportFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <span>{reportFeedback}</span>
          <button
            type="button"
            onClick={() => setReportFeedback(null)}
            className="text-emerald-700 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Tabs */}
      <LiquidTabs<LearningHubTab>
        tabs={[
          {
            id: 'RECOMMENDED_FOR_GAPS',
            label: '1. Recommended for My Gaps',
            count: gapRecommendations.length,
          },
          {
            id: 'RESOURCE_CATALOGUE',
            label: '2. Curated Resource Catalogue',
            count: state.learningResources.length,
          },
          {
            id: 'FIELD_SKILL_LIBRARY',
            label: '3. Field & Skill Library',
            count: state.fieldsCatalogue.length,
          },
          {
            id: 'DEVELOPMENT_AND_CURATION',
            label: '4. Action Plan & Catalogue Curation',
          },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id)}
      />

      {/* TAB 1: RECOMMENDED FOR MY GAPS */}
      {activeTab === 'RECOMMENDED_FOR_GAPS' && (
        <div className="space-y-6">
          <LiquidCard className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-700">
                  Gap-Driven Recommendation Engine
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedTarget
                    ? `Target Opportunity: ${selectedTarget.title} (${selectedTarget.organizationLabel})`
                    : 'No Target Opportunity Selected Yet'}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Recommendations are computed deterministically from unmet, partial, or unassessed requirements on your active target opportunity.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {state.targets.length > 1 && (
                  <select
                    aria-label="Select target opportunity"
                    value={selectedTarget?.id || ''}
                    onChange={(e) => selectTarget(e.target.value)}
                    className={inputClass}
                  >
                    {state.targets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} — {t.organizationLabel}
                      </option>
                    ))}
                  </select>
                )}
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                >
                  {selectedTarget ? 'Change Target' : 'Select Target Opportunity'}
                </LiquidButton>
              </div>
            </div>
          </LiquidCard>

          {!selectedTarget ? (
            <LiquidCard className="p-6 text-center space-y-3">
              <Compass className="w-8 h-8 text-sky-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                Select or Create an Opportunity Target to Generate Gap-Specific Learning Pathways
              </h3>
              <p className="text-xs text-slate-600 max-w-xl mx-auto">
                Once you add an internship, role, research fellowship, or project target in Explore Opportunities, Wayfinder will compare its required proficiency levels against your demonstrated evidence and recommend specific resources, assessments, and proof projects here.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <LiquidButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                >
                  Open Opportunity Explorer
                </LiquidButton>
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('RESOURCE_CATALOGUE')}
                >
                  Browse Full Resource Catalogue
                </LiquidButton>
              </div>
            </LiquidCard>
          ) : gapRecommendations.length === 0 ? (
            <LiquidCard className="p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                All Capability Requirements Met for {selectedTarget.title}
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto">
                Your demonstrated capability levels and verified evidence currently satisfy all requirements for this target. You can still explore advanced resources in the Curated Resource Catalogue.
              </p>
            </LiquidCard>
          ) : (
            <div className="space-y-4">
              {gapRecommendations.map((rec) => {
                const primarySkill = rec.matchedSkills[0];
                return (
                  <LiquidCard key={rec.requirementId} className="p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 border-b border-sky-200/70 pb-3.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <RequirementStatusBadge status={rec.requirementStatus} />
                          <span className="text-xs font-mono text-slate-600">
                            Required L{rec.requiredLevel} · Current Demonstrated:{' '}
                            {rec.currentDemonstratedLevel === null
                              ? 'Unknown (Not Assessed)'
                              : `L${rec.currentDemonstratedLevel}`}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">
                          {rec.dimensionName}
                        </h3>
                        <p className="text-xs text-sky-900 font-medium mt-1">
                          {rec.gapExplanation}
                        </p>
                      </div>
                      {primarySkill && (
                        <div className="text-xs bg-sky-50/90 border border-sky-200/80 rounded-xl px-3 py-2 shrink-0">
                          <div className="font-mono text-[10px] uppercase text-sky-700">
                            Matched Catalogue Skill
                          </div>
                          <div className="font-bold text-slate-900">{primarySkill.name}</div>
                          <div className="text-[11px] text-slate-600">
                            {primarySkill.specialization}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Pathway */}
                    <div className="p-3.5 rounded-xl bg-white/80 border border-sky-200/70">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-sky-700 mb-2">
                        Step-by-Step Readiness Closure Pathway
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {rec.suggestedPathwaySteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 text-xs text-slate-700"
                          >
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Resources & Available Assessments */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-2.5">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Curated Learning &amp; Practice Resources ({rec.recommendedResources.length})
                        </div>
                        {!rec.hasCatalogueResources ? (
                          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                            {rec.emptyCatalogueExplanation}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {rec.recommendedResources.map((res) => {
                              const prog = state.resourceProgress.find(
                                (p) => p.resourceId === res.id
                              );
                              return (
                                <div
                                  key={res.id}
                                  className="p-3.5 rounded-xl bg-white/85 border border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-sky-700">
                                      <span>{RESOURCE_TYPE_LABELS[res.resourceType]}</span>
                                      <span>·</span>
                                      <span>{res.providerOrCreator}</span>
                                      {res.estimatedDuration && (
                                        <>
                                          <span>·</span>
                                          <span>{res.estimatedDuration}</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">
                                      {res.title}
                                    </div>
                                    <p className="text-xs text-slate-600">
                                      {res.learningObjective}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    {prog && (
                                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                        {prog.status.replace(/_/g, ' ')}
                                      </span>
                                    )}
                                    <a
                                      href={res.originalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() =>
                                        updateResourceProgress(
                                          res.id,
                                          prog?.status === 'REVIEWED_SELF_STUDY'
                                            ? 'REVIEWED_SELF_STUDY'
                                            : 'IN_PROGRESS',
                                          'Opened from Recommended for My Gaps'
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
                                    >
                                      <span>Open Resource</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Verification &amp; Assessment Next Steps
                        </div>
                        <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200/80 space-y-3">
                          {rec.availableAssessments.length > 0 ? (
                            rec.availableAssessments.map((asm) => (
                              <div key={asm.id} className="space-y-2">
                                <div className="text-xs font-bold text-slate-900">
                                  {asm.title}
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  {asm.items.length} Questions · Target Level: L
                                  {asm.targetProficiencyLevel}
                                </div>
                                <LiquidButton
                                  variant="primary"
                                  size="sm"
                                  className="w-full justify-center"
                                  onClick={() => {
                                    selectSkillAssessment(asm.id);
                                    navigateTo('08_APTITUDE_ASSESSMENT');
                                  }}
                                >
                                  Launch Skill Assessment
                                </LiquidButton>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-600">
                              This skill is evaluated directly through artifact review rather than an automated quiz.
                            </div>
                          )}
                          <div className="pt-2 border-t border-sky-200/70">
                            <LiquidButton
                              variant="secondary"
                              size="sm"
                              className="w-full justify-center"
                              onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                            >
                              Upload Verifiable Evidence Artifact
                            </LiquidButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </LiquidCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURATED RESOURCE CATALOGUE */}
      {activeTab === 'RESOURCE_CATALOGUE' && (
        <div className="space-y-6">
          <LiquidCard className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className={labelClass}>Search Curated Resources</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by skill, topic, provider (MIT, PostgreSQL, W3C, CS50)..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Field / Discipline</label>
                <select
                  value={fieldFilter}
                  onChange={(e) => {
                    setFieldFilter(e.target.value);
                    setSpecFilter('ALL');
                  }}
                  className={inputClass}
                >
                  <option value="ALL">All Fields ({state.fieldsCatalogue.length})</option>
                  {state.fieldsCatalogue.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Specialisation</label>
                <select
                  value={specFilter}
                  onChange={(e) => setSpecFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All Specialisations</option>
                  {availableSpecialisations.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className={labelClass}>Associated Skill</label>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All Skills ({state.skillsCatalogue.length})</option>
                  {state.skillsCatalogue.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Resource Format</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All Formats</option>
                  {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Suggested Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All Levels (L1–L4)</option>
                  <option value="1">Level 1 — Foundational</option>
                  <option value="2">Level 2 — Applied</option>
                  <option value="3">Level 3 — Advanced</option>
                  <option value="4">Level 4 — Specialist</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Cost / Access</label>
                <select
                  value={costFilter}
                  onChange={(e) => setCostFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All (Free &amp; Paid)</option>
                  <option value="FREE_OPEN_ACCESS">Free Open Access</option>
                  <option value="FREE_TO_AUDIT">Free to Audit</option>
                  <option value="PAID_SUBSCRIPTION">Paid / Subscription</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Language</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All Languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/50 text-xs text-[#3E6084]">
              <span>
                Showing <strong>{filteredResources.length}</strong> of{' '}
                {state.learningResources.length} curated resources
              </span>
              {(searchQuery ||
                fieldFilter !== 'ALL' ||
                specFilter !== 'ALL' ||
                skillFilter !== 'ALL' ||
                typeFilter !== 'ALL' ||
                costFilter !== 'ALL' ||
                languageFilter !== 'ALL' ||
                levelFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFieldFilter('ALL');
                    setSpecFilter('ALL');
                    setSkillFilter('ALL');
                    setTypeFilter('ALL');
                    setCostFilter('ALL');
                    setLanguageFilter('ALL');
                    setLevelFilter('ALL');
                  }}
                  className="text-[#1F68FF] font-semibold hover:underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </LiquidCard>

          <div className="space-y-4">
            {filteredResources.map((res) => {
              const field = state.fieldsCatalogue.find((f) => f.id === res.fieldId);
              const progressRecord = state.resourceProgress.find(
                (p) => p.resourceId === res.id
              );
              const isYoutube =
                res.resourceType === 'YOUTUBE_VIDEO' ||
                res.resourceType === 'YOUTUBE_PLAYLIST';
              const isEmbedOpen = expandedEmbedResourceId === res.id;

              return (
                <LiquidCard key={res.id} className="p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-700">
                        <span className="font-bold">
                          {RESOURCE_TYPE_LABELS[res.resourceType]}
                        </span>
                        <span>·</span>
                        <span>{res.providerOrCreator}</span>
                        <span>·</span>
                        <span>{field?.name || res.fieldId}</span>
                        <span>·</span>
                        <span>Suggested Level L{res.suggestedProficiencyLevel}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{res.title}</h3>
                      <p className="text-xs text-slate-700">{res.description}</p>
                      <p className="text-xs text-sky-900 bg-sky-50/80 border border-sky-200/70 rounded-lg px-3 py-2 mt-2">
                        <strong>Learning Objective &amp; Proof Guidance:</strong>{' '}
                        {res.learningObjective}
                      </p>
                    </div>

                    {/* Action Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-2 shrink-0 min-w-[215px]">
                      <a
                        href={res.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          updateResourceProgress(
                            res.id,
                            progressRecord?.status === 'REVIEWED_SELF_STUDY'
                              ? 'REVIEWED_SELF_STUDY'
                              : 'IN_PROGRESS',
                            'Opened external link'
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <span>Open Direct Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {isYoutube && res.youtubeEmbedUrl && (
                        <LiquidButton
                          variant="secondary"
                          size="sm"
                          icon={<Video className="w-3.5 h-3.5" />}
                          onClick={() =>
                            setExpandedEmbedResourceId(isEmbedOpen ? null : res.id)
                          }
                        >
                          {isEmbedOpen ? 'Hide Video Player' : 'Watch Embedded Video'}
                        </LiquidButton>
                      )}

                      <select
                        aria-label={`Track self-study status for ${res.title}`}
                        value={progressRecord?.status || ''}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          updateResourceProgress(
                            res.id,
                            e.target.value as StudentResourceProgressState,
                            `Self-study status updated to ${e.target.value}`
                          );
                        }}
                        className={inputClass}
                      >
                        <option value="">Track Learning Progress...</option>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="SAVED">Saved for Later</option>
                        <option value="BOOKMARKED">Bookmarked</option>
                        <option value="IN_PROGRESS">In Progress (Studying)</option>
                        <option value="COMPLETED_BY_USER">Completed by User (Self-Reported)</option>
                        <option value="REVIEWED_SELF_STUDY">Reviewed (Self-Study Only)</option>
                        <option value="PRACTICE_REQUIRED">Practice Project Required</option>
                        <option value="READY_FOR_REASSESSMENT">Ready for Skill Reassessment</option>
                      </select>
                    </div>
                  </div>

                  {/* Privacy-Enhanced YouTube Embed Player */}
                  {isYoutube && isEmbedOpen && res.youtubeEmbedUrl && (
                    <div className="rounded-xl overflow-hidden border border-sky-200 bg-slate-950 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-sky-200 font-mono">
                        <span>Privacy-Enhanced YouTube Player (youtube-nocookie.com)</span>
                        <a
                          href={res.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-white"
                        >
                          Fallback: Open directly on YouTube ↗
                        </a>
                      </div>
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={res.youtubeEmbedUrl}
                          title={res.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Honest Metadata & Broken Link Report Footer */}
                  <div className="pt-3 border-t border-sky-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="font-mono text-[11px] text-slate-500">
                      Duration: {res.estimatedDuration ?? 'Not specified by provider'} · Cost:{' '}
                      {res.costInfo ?? 'Not specified'} · Certificate:{' '}
                      {res.certificateAvailable === null
                        ? 'Unknown'
                        : res.certificateAvailable
                        ? 'Available'
                        : 'None (Open Resource)'}{' '}
                      · Link Status: {res.linkVerificationStatus}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setReportingResourceId(
                            reportingResourceId === res.id ? null : res.id
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-700 font-mono"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report Broken / Outdated Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Broken Link Reporting Form */}
                  {reportingResourceId === res.id && (
                    <form
                      onSubmit={handleReportIssueSubmit}
                      className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-3"
                    >
                      <div className="text-xs font-bold text-amber-950">
                        Report Link or Quality Issue for &ldquo;{res.title}&rdquo;
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className={labelClass}>Issue Type</label>
                          <select
                            value={issueReason}
                            onChange={(e) =>
                              setIssueReason(e.target.value as ResourceIssueReport['reason'])
                            }
                            className={inputClass}
                          >
                            <option value="BROKEN_LINK">
                              Broken or Unavailable URL (404 / Video Removed)
                            </option>
                            <option value="OUTDATED_CONTENT">
                              Outdated Standard or Deprecated API
                            </option>
                            <option value="INACCURATE_MAPPING">
                              Does Not Match Listed Skill
                            </option>
                            <option value="INACCESSIBLE">
                              Accessibility or Paywall Barrier
                            </option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Details</label>
                          <input
                            type="text"
                            value={issueDetails}
                            onChange={(e) => setIssueDetails(e.target.value)}
                            placeholder="Describe what happened when accessing this resource..."
                            required
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <LiquidButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setReportingResourceId(null)}
                        >
                          Cancel
                        </LiquidButton>
                        <LiquidButton type="submit" variant="primary" size="sm">
                          Submit Quality Report
                        </LiquidButton>
                      </div>
                    </form>
                  )}
                </LiquidCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FIELD & SKILL LIBRARY (ALL 18 INITIAL FIELDS + SKILLS) */}
      {activeTab === 'FIELD_SKILL_LIBRARY' && (
        <div className="space-y-6">
          <LiquidCard className="p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#1F68FF]">
                  Field &amp; Specialisation Library
                </div>
                <h2 className="text-lg font-bold text-[#0B2E56]">
                  {state.fieldsCatalogue.length} Academic, Technical, Professional, Creative &amp; Skilled Trade Domains
                </h2>
                <p className="text-xs text-[#3E6084] mt-0.5">
                  Select any field below to inspect its specialisations, mapped skills, assessment support status, and acceptable proof artifacts.
                </p>
              </div>
              <div className="min-w-[260px]">
                <select
                  aria-label="Filter by field"
                  value={selectedLibraryFieldId}
                  onChange={(e) => setSelectedLibraryFieldId(e.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">
                    Show All 18 Fields ({state.skillsCatalogue.length} Skills)
                  </option>
                  {state.fieldsCatalogue.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 18 Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {state.fieldsCatalogue
                .filter(
                  (f) => selectedLibraryFieldId === 'ALL' || f.id === selectedLibraryFieldId
                )
                .map((field) => {
                  const fieldSkills = state.skillsCatalogue.filter(
                    (s) => s.fieldId === field.id
                  );
                  return (
                    <div
                      key={field.id}
                      onClick={() =>
                        setSelectedLibraryFieldId(
                          selectedLibraryFieldId === field.id ? 'ALL' : field.id
                        )
                      }
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedLibraryFieldId === field.id
                          ? 'bg-sky-100/90 border-sky-400 shadow-sm'
                          : 'bg-white/80 border-sky-200/70 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-sky-700">
                          {field.shortName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600">
                          {fieldSkills.length} Catalogue Skill
                          {fieldSkills.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{field.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {field.description}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-2 font-mono">
                        Specializations: {field.specializations.join(' · ')}
                      </div>
                    </div>
                  );
                })}
            </div>
          </LiquidCard>

          {/* Skills in Selected Field */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Skills Catalogue (
              {
                state.skillsCatalogue.filter(
                  (s) =>
                    selectedLibraryFieldId === 'ALL' || s.fieldId === selectedLibraryFieldId
                ).length
              }{' '}
              Skills Shown)
            </h3>
            {state.skillsCatalogue
              .filter(
                (s) => selectedLibraryFieldId === 'ALL' || s.fieldId === selectedLibraryFieldId
              )
              .map((skill) => {
                const field = state.fieldsCatalogue.find((f) => f.id === skill.fieldId);
                const studentRecord = state.studentSkillRecords.find(
                  (r) => r.skillId === skill.id
                );
                const linkedAssessments = state.skillAssessments.filter(
                  (a) => a.skillId === skill.id
                );
                const linkedResources = state.learningResources.filter((r) =>
                  r.associatedSkillIds.includes(skill.id)
                );

                return (
                  <LiquidCard key={skill.id} className="p-5 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-700">
                          <span>{field?.name || skill.fieldId}</span>
                          <span>·</span>
                          <span>{skill.specialization}</span>
                          <span>·</span>
                          <span>v{skill.version}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{skill.name}</h4>
                        <p className="text-xs text-slate-600">{skill.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-slate-800">
                          Your Demonstrated Level:{' '}
                          <strong>
                            {studentRecord?.demonstratedLevel !== null &&
                            studentRecord?.demonstratedLevel !== undefined
                              ? `L${studentRecord.demonstratedLevel}`
                              : 'Unknown (Not Assessed)'}
                          </strong>
                        </span>
                        {skill.assessmentAvailable && linkedAssessments.length > 0 && (
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
                        <LiquidButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSkillFilter(skill.id);
                            setActiveTab('RESOURCE_CATALOGUE');
                          }}
                        >
                          View {linkedResources.length} Resource
                          {linkedResources.length === 1 ? '' : 's'}
                        </LiquidButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-sky-200/70 text-xs">
                      <div>
                        <span className="font-mono text-[11px] uppercase text-slate-500 block">
                          Assessment Method ({skill.assessmentMethod})
                        </span>
                        <span className="text-slate-700">
                          {skill.assessmentMethodExplanation}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[11px] uppercase text-slate-500 block">
                          Acceptable Evidence for Higher Levels
                        </span>
                        <span className="text-slate-700">{skill.evidenceRequirements}</span>
                      </div>
                    </div>
                  </LiquidCard>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: DEVELOPMENT PLAN & CATALOGUE CURATION */}
      {activeTab === 'DEVELOPMENT_AND_CURATION' && (
        <div className="space-y-6">
          {curationNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span>{curationNotice}</span>
              <button
                type="button"
                onClick={() => setCurationNotice(null)}
                className="underline ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Development Activities & One-Click Gap Plan Generation */}
          <LiquidCard className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-sky-700">
                  Active Development Activities ({state.activities.length})
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Gap-Linked Action Plan Items
                </h3>
              </div>
              <LiquidButton
                variant="secondary"
                size="sm"
                onClick={() => navigateTo('16_ACTIVITY_WORKSPACE')}
              >
                Open My Learning Progress Workspace →
              </LiquidButton>
            </div>

            {selectedTarget && readinessReport && (
              <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200/80 space-y-2.5">
                <div className="text-xs font-bold text-slate-900">
                  Generate Action Plan Activity from {selectedTarget.title} Gaps:
                </div>
                <div className="flex flex-wrap gap-2">
                  {readinessReport.requirementEvaluations
                    .filter((ev) => ev.status !== 'DEMONSTRATED')
                    .map((ev) => (
                      <LiquidButton
                        key={ev.requirement.id}
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => {
                          addGapDevelopmentPlanActivity(selectedTarget, ev);
                          setCurationNotice(
                            `Added development plan activity for ${ev.dimensionName} (Target L${ev.requiredLevel}).`
                          );
                        }}
                      >
                        Add Plan for {ev.dimensionName} (L{ev.requiredLevel})
                      </LiquidButton>
                    ))}
                </div>
              </div>
            )}

            {state.activities.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/80 border border-sky-200/70 text-xs text-slate-600">
                No structured development activities created yet. Select a target opportunity and click one of the gap buttons above (or generate a plan from Readiness Gap Analysis) to create a requirement-linked activity.
              </div>
            ) : (
              <div className="space-y-2.5">
                {state.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-white/85 border border-sky-200/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">{act.title}</div>
                      <div className="text-xs text-slate-600 font-mono">
                        Target L{act.targetRubricLevel} · {act.status} · {act.progressPercent}%
                        Complete
                      </div>
                    </div>
                    <LiquidButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigateTo('16_ACTIVITY_WORKSPACE')}
                    >
                      Manage in Workspace
                    </LiquidButton>
                  </div>
                ))}
              </div>
            )}
          </LiquidCard>

          {/* Catalogue Curation & Quality Control (Extend Skills & Resources Without Code Changes) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiquidCard className="p-5 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-sky-700">
                Extensible Catalogue — Register New Skill in Any Field
              </div>
              <form onSubmit={handleAddCustomSkill} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Field Category</label>
                    <select
                      value={customSkillFieldId}
                      onChange={(e) => setCustomSkillFieldId(e.target.value)}
                      className={inputClass}
                    >
                      {state.fieldsCatalogue.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Specialization</label>
                    <input
                      type="text"
                      value={customSkillSpec}
                      onChange={(e) => setCustomSkillSpec(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Mapped Core Capability Dimension</label>
                  <select
                    value={customSkillCapId}
                    onChange={(e) =>
                      setCustomSkillCapId(e.target.value as CapabilityDimensionId)
                    }
                    className={inputClass}
                  >
                    {CANONICAL_CAPABILITY_DIMENSIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Skill Name</label>
                  <input
                    type="text"
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    placeholder="e.g., Clinical Trial Protocol Compliance & Good Clinical Practice"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Skill Description</label>
                  <input
                    type="text"
                    value={customSkillDesc}
                    onChange={(e) => setCustomSkillDesc(e.target.value)}
                    placeholder="Describe what proficiency in this skill entails..."
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Acceptable Proof / Evidence Requirement</label>
                  <input
                    type="text"
                    value={customSkillEvidence}
                    onChange={(e) => setCustomSkillEvidence(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <LiquidButton type="submit" variant="secondary" size="sm">
                  Register Skill in Field Library
                </LiquidButton>
              </form>
            </LiquidCard>

            <LiquidCard className="p-5 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-sky-700">
                Curated Resource Quality Control — Add Verified Learning Resource
              </div>
              <form onSubmit={handleAddCustomResource} className="space-y-3">
                <div>
                  <label className={labelClass}>Resource Title</label>
                  <input
                    type="text"
                    value={customResTitle}
                    onChange={(e) => setCustomResTitle(e.target.value)}
                    placeholder="e.g., WHO Good Clinical Practice (GCP) Reference Manual"
                    required
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Provider / Channel / Institution</label>
                    <input
                      type="text"
                      value={customResProvider}
                      onChange={(e) => setCustomResProvider(e.target.value)}
                      placeholder="e.g., World Health Organization"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Resource Type</label>
                    <select
                      value={customResType}
                      onChange={(e) =>
                        setCustomResType(e.target.value as LearningResourceType)
                      }
                      className={inputClass}
                    >
                      {Object.entries(RESOURCE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Field</label>
                    <select
                      value={customResFieldId}
                      onChange={(e) => setCustomResFieldId(e.target.value)}
                      className={inputClass}
                    >
                      {state.fieldsCatalogue.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Associated Skill</label>
                    <select
                      value={customResSkillId}
                      onChange={(e) => setCustomResSkillId(e.target.value)}
                      className={inputClass}
                    >
                      {state.skillsCatalogue.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Direct Verified URL (https://...)</label>
                  <input
                    type="url"
                    value={customResUrl}
                    onChange={(e) => setCustomResUrl(e.target.value)}
                    placeholder="https://..."
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Learning Objective &amp; Proof Artifact Guidance
                  </label>
                  <input
                    type="text"
                    value={customResObjective}
                    onChange={(e) => setCustomResObjective(e.target.value)}
                    placeholder="Explain what deliverable a student should build after studying this resource..."
                    className={inputClass}
                  />
                </div>
                <LiquidButton type="submit" variant="secondary" size="sm">
                  Add Resource to Catalogue
                </LiquidButton>
              </form>
            </LiquidCard>
          </div>

          {/* Add New Field & Specialisation + Content Review & Version History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiquidCard className="p-5 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#1F68FF]">
                Extensible Taxonomy — Add Field &amp; Specialisations
              </div>
              <form onSubmit={handleAddCustomField} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Field Name</label>
                    <input
                      type="text"
                      value={customFieldName}
                      onChange={(e) => setCustomFieldName(e.target.value)}
                      placeholder="e.g., Architecture & Urban Planning"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Short Label</label>
                    <input
                      type="text"
                      value={customFieldShort}
                      onChange={(e) => setCustomFieldShort(e.target.value)}
                      placeholder="e.g., Architecture"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Specialisations (Comma-Separated)</label>
                  <input
                    type="text"
                    value={customFieldSpecs}
                    onChange={(e) => setCustomFieldSpecs(e.target.value)}
                    placeholder="e.g., Sustainable Design, BIM Modelling, Structural Coordination"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Field Description</label>
                  <input
                    type="text"
                    value={customFieldDesc}
                    onChange={(e) => setCustomFieldDesc(e.target.value)}
                    placeholder="Describe the field and its core domain competencies..."
                    required
                    className={inputClass}
                  />
                </div>
                <LiquidButton type="submit" variant="secondary" size="sm">
                  Register Field &amp; Specialisations
                </LiquidButton>
              </form>
            </LiquidCard>

            <LiquidCard className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#1F68FF]">
                  Editorial Review Status &amp; Version History ({state.contentReviewHistory.length})
                </div>
                <span className="text-[11px] font-mono text-[#3E6084]">
                  {canReviewContent ? 'Reviewer / Admin Approval Enabled' : 'Read-Only Status Log'}
                </span>
              </div>
              <p className="text-xs text-[#3E6084]">
                Ordinary student submissions are recorded in <strong>DRAFT_REVIEW</strong> or{' '}
                <strong>PENDING_EDITORIAL_REVIEW</strong> until an authorised reviewer or administrator approves them.
              </p>

              {canReviewContent && (
                <div className="space-y-2 pt-1">
                  {state.skillsCatalogue
                    .filter((s) => s.publicationStatus === 'DRAFT_REVIEW')
                    .map((sk) => (
                      <div
                        key={sk.id}
                        className="p-3 rounded-xl glass-panel-subtle flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#0B2E56]">{sk.name}</div>
                          <div className="font-mono text-[11px] text-amber-800">
                            Skill Status: {sk.publicationStatus} ({sk.version})
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LiquidButton
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              updateSkillPublicationStatus(
                                sk.id,
                                'PUBLISHED',
                                'Approved for official Field & Skill Library'
                              );
                              setCurationNotice(`Published skill "${sk.name}".`);
                            }}
                          >
                            Approve &amp; Publish
                          </LiquidButton>
                          <LiquidButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateSkillPublicationStatus(
                                sk.id,
                                'RETIRED',
                                'Archived during editorial review'
                              );
                              setCurationNotice(`Archived skill "${sk.name}".`);
                            }}
                          >
                            Archive
                          </LiquidButton>
                        </div>
                      </div>
                    ))}

                  {state.learningResources
                    .filter((r) => r.editorialStatus === 'PENDING_EDITORIAL_REVIEW')
                    .map((res) => (
                      <div
                        key={res.id}
                        className="p-3 rounded-xl glass-panel-subtle flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#0B2E56]">{res.title}</div>
                          <div className="font-mono text-[11px] text-amber-800">
                            Resource Status: {res.editorialStatus}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LiquidButton
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              updateResourceEditorialStatus(
                                res.id,
                                'APPROVED_CATALOGUE',
                                'Verified URL and approved for Learning Hub catalogue'
                              );
                              setCurationNotice(`Approved resource "${res.title}".`);
                            }}
                          >
                            Approve
                          </LiquidButton>
                          <LiquidButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              updateResourceEditorialStatus(
                                res.id,
                                'RETIRED',
                                'Retired from catalogue'
                              );
                              setCurationNotice(`Retired resource "${res.title}".`);
                            }}
                          >
                            Archive
                          </LiquidButton>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {state.contentReviewHistory.length === 0 ? (
                <div className="p-3.5 rounded-xl glass-panel-subtle text-xs text-[#3E6084]">
                  No custom taxonomy or resource changes recorded in this session yet. Initial catalogue items are pre-approved (v2026.2).
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {state.contentReviewHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl glass-panel-subtle text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-[#174B80]">
                        <span>
                          {item.entityType} · v{item.version}
                        </span>
                        <span>
                          {item.previousStatus} → <strong>{item.newStatus}</strong>
                        </span>
                      </div>
                      <div className="font-bold text-[#0B2E56]">{item.entityTitle}</div>
                      <div className="text-[#3E6084]">{item.reviewNotes}</div>
                    </div>
                  ))}
                </div>
              )}
            </LiquidCard>
          </div>
        </div>
      )}
    </div>
  );
};
