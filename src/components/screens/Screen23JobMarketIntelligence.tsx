import React, { useMemo, useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  JobMarketService,
  StudentUpdatesService,
} from '../../services/careerIntelligenceServices';
import {
  JobMarketOpportunity,
  MarketListingStatus,
  MarketOpportunityCategory,
  SavedApplicationStatus,
} from '../../types/marketSkillsCareer';
import { computeTargetReadinessReport } from '../../engine/readinessEngine';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';
import { getFieldById, getSkillById } from '../../data/fieldAndSkillLibrary';
import { RequirementStatusBadge } from '../common/StatusBadge';
import {
  LiquidButton,
  LiquidTabs,
} from '../common/LiquidGlassKit';
import {
  Briefcase,
  Search,
  Bookmark,
  BookmarkCheck,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  FileText,
  Compass,
  Sparkles,
  Trash2,
} from 'lucide-react';

const CATEGORY_LABELS: Record<MarketOpportunityCategory, string> = {
  JOB_OPPORTUNITY: 'Latest Job Opportunities',
  INTERNSHIP: 'Internships',
  GRADUATE_PROGRAMME: 'Graduate Programmes',
  ENTRY_LEVEL: 'Entry-Level Jobs',
  APPRENTICESHIP: 'Apprenticeships',
  FELLOWSHIP: 'Fellowships',
  RESEARCH_OPPORTUNITY: 'Research Opportunities',
  HIRING_ANNOUNCEMENT: 'Industry Hiring Announcements',
};

const LISTING_STATUS_CONFIG: Record<
  MarketListingStatus,
  { label: string; badgeClass: string }
> = {
  DISCOVERED: {
    label: 'Discovered',
    badgeClass: 'bg-[#DDF2FF]/70 text-[#0B2E56] border-white/80',
  },
  VALIDATION_PENDING: {
    label: 'Validation Pending',
    badgeClass: 'bg-[#EAF6FF]/75 text-[#174B80] border-[#8DBDFF]',
  },
  VERIFIED_ACTIVE: {
    label: 'Verified Active',
    badgeClass: 'bg-[#E5FAFF]/80 text-[#0B2E56] border-white/85',
  },
  EXPIRING_SOON: {
    label: 'Expiring Soon',
    badgeClass: 'bg-[#DDF2FF]/80 text-[#075FC7] border-[#075FC7]/45',
  },
  EXPIRED: {
    label: 'Expired',
    badgeClass: 'bg-white/50 text-[#315A7D] border-white/65',
  },
  CLOSED: {
    label: 'Closed',
    badgeClass: 'bg-white/45 text-[#315A7D] border-white/60',
  },
  UNVERIFIABLE: {
    label: 'Unverifiable',
    badgeClass: 'bg-[#DDF2FF]/60 text-[#0B2E56] border-[#0B2E56]/30',
  },
};

const APPLICATION_STATUS_LABELS: Record<SavedApplicationStatus, string> = {
  SAVED: 'Saved',
  PLANNING_TO_APPLY: 'Planning to Apply',
  APPLICATION_IN_PROGRESS: 'Application in Progress',
  APPLIED: 'Applied',
  INTERVIEW: 'Interview',
  OFFER_RECEIVED: 'Offer Received',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const Screen23JobMarketIntelligence: React.FC = () => {
  const { state, createCustomTarget, selectTarget, navigateTo } = useWayfinder();

  const [activeTab, setActiveTab] = useState<
    'DISCOVER_MARKET' | 'OPPORTUNITY_DETAIL' | 'SAVED_TRACKER' | 'DEMAND_TRENDS'
  >('DISCOVER_MARKET');

  // 10 Required Filters (Section 3A)
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');
  const [specializationFilter, setSpecializationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [workArrangementFilter, setWorkArrangementFilter] = useState<string>('ALL');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string>('ALL');
  const [educationFilter, setEducationFilter] = useState<string>('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('ALL');
  const [requiredSkillFilter, setRequiredSkillFilter] = useState<string>('ALL');
  const [deadlineFilter, setDeadlineFilter] = useState<
    'ALL' | 'ACTIVE_ONLY' | 'EXPIRING_SOON' | 'INCLUDE_EXPIRED'
  >('ALL');
  const [categoryFilter, setCategoryFilter] = useState<MarketOpportunityCategory | 'ALL'>('ALL');

  const allOpportunities = useMemo(() => JobMarketService.getAllOpportunities(), []);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(
    allOpportunities[0]?.id || ''
  );

  // Saved opportunities state
  const [savedRecords, setSavedRecords] = useState(() =>
    JobMarketService.getSavedOpportunities()
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const availableSpecializations = useMemo(() => {
    const specs = new Set<string>();
    state.fieldsCatalogue.forEach((f) => {
      if (fieldFilter === 'ALL' || f.id === fieldFilter) {
        f.specializations.forEach((s) => specs.add(s));
      }
    });
    return Array.from(specs).sort();
  }, [state.fieldsCatalogue, fieldFilter]);

  const filteredOpportunities = useMemo(
    () =>
      JobMarketService.filterOpportunities({
        fieldId: fieldFilter,
        specialization: specializationFilter,
        searchQuery,
        location: locationFilter,
        workArrangement: workArrangementFilter,
        experienceLevel: experienceLevelFilter,
        educationEligibility: educationFilter,
        employmentType: employmentTypeFilter,
        requiredSkillId: requiredSkillFilter,
        deadlineFilter,
        category: categoryFilter,
      }),
    [
      fieldFilter,
      specializationFilter,
      searchQuery,
      locationFilter,
      workArrangementFilter,
      experienceLevelFilter,
      educationFilter,
      employmentTypeFilter,
      requiredSkillFilter,
      deadlineFilter,
      categoryFilter,
    ]
  );

  const selectedOpportunity =
    allOpportunities.find((o) => o.id === selectedOpportunityId) ||
    filteredOpportunities[0] ||
    allOpportunities[0];

  const demandTrends = useMemo(
    () => JobMarketService.getMarketDemandTrends(fieldFilter),
    [fieldFilter]
  );

  const upcomingDeadlines = useMemo(
    () =>
      allOpportunities
        .filter((o) => o.applicationDeadline && o.listingStatus !== 'EXPIRED')
        .sort((a, b) =>
          (a.applicationDeadline || '').localeCompare(b.applicationDeadline || '')
        ),
    [allOpportunities]
  );

  const recentlyAdded = useMemo(
    () =>
      [...allOpportunities].sort((a, b) =>
        b.discoveryDate.localeCompare(a.discoveryDate)
      ),
    [allOpportunities]
  );

  const selectedTargetBlueprint = useMemo(
    () =>
      selectedOpportunity
        ? JobMarketService.convertMarketOpportunityToTarget(selectedOpportunity)
        : null,
    [selectedOpportunity]
  );

  const readinessReport = useMemo(() => {
    if (!selectedTargetBlueprint) return null;
    return computeTargetReadinessReport(
      selectedTargetBlueprint,
      state.capabilityRecords,
      state.evidenceSubmissions,
      state.currentUser
    );
  }, [
    selectedTargetBlueprint,
    state.capabilityRecords,
    state.evidenceSubmissions,
    state.currentUser,
  ]);

  const isSaved = (oppId: string) =>
    savedRecords.some((r) => r.opportunityId === oppId);

  const handleSaveToggle = (opp: JobMarketOpportunity) => {
    if (isSaved(opp.id)) {
      const next = JobMarketService.removeSavedOpportunity(opp.id);
      setSavedRecords([...next]);
      setStatusNotice(`Removed "${opp.title}" from Saved Opportunities.`);
    } else {
      const next = JobMarketService.saveOrUpdateOpportunityTracking(
        opp.id,
        'SAVED',
        '',
        null,
        opp.applicationDeadline
      );
      setSavedRecords([...next]);
      setStatusNotice(`Saved "${opp.title}" to your Application Tracker.`);
    }
  };

  const handleUpdateSavedRecord = (
    opportunityId: string,
    status: SavedApplicationStatus,
    notes: string,
    appDate: string | null,
    deadline: string | null
  ) => {
    const next = JobMarketService.saveOrUpdateOpportunityTracking(
      opportunityId,
      status,
      notes,
      appDate,
      deadline
    );
    setSavedRecords([...next]);
    setStatusNotice(`Updated application tracking status to ${APPLICATION_STATUS_LABELS[status]}.`);
  };

  const handleBenchmarkInGapAnalysis = (opp: JobMarketOpportunity) => {
    const targetBlueprint = JobMarketService.convertMarketOpportunityToTarget(opp);
    const exists = state.targets.some((t) => t.id === targetBlueprint.id);
    if (!exists) {
      createCustomTarget(targetBlueprint);
    } else {
      selectTarget(targetBlueprint.id);
    }
    navigateTo('14_READINESS_GAP_ANALYSIS');
  };

  const handleOpenDetail = (oppId: string) => {
    setSelectedOpportunityId(oppId);
    setActiveTab('OPPORTUNITY_DETAIL');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel liquid-glow-bar rounded-[28px] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-[#075FC7]">
              <Briefcase className="w-4 h-4 text-[#075FC7]" />
              <span className="text-[#174B80]">MODULE 1 — JOB MARKET INTELLIGENCE</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DDF2FF]/80 text-[#0B2E56] border border-white/85">
                DEMONSTRATION MODE • SAMPLE DATA
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
              Job Market Intelligence &amp; Opportunity Readiness
            </h1>
            <p className="text-xs sm:text-sm text-[#123B63] max-w-3xl leading-relaxed">
              Explore structured internship, graduate, fellowship, apprenticeship, and research
              opportunities across fields. Compare every requirement directly against your
              demonstrated WAYFINDER capabilities and verified evidence—never mistaking a listing’s
              requirements for proof of capability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('24_SKILL_INTELLIGENCE')}
              icon={<TrendingUp className="w-4 h-4 text-[#075FC7]" />}
            >
              Skill Intelligence
            </LiquidButton>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('25_RESUME_BUILDER')}
              icon={<FileText className="w-4 h-4 text-[#075FC7]" />}
            >
              Tailor Resume
            </LiquidButton>
            <LiquidButton
              variant="primary"
              size="sm"
              pill
              onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
              icon={<Compass className="w-4 h-4" />}
            >
              Custom Target Builder
            </LiquidButton>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="pt-2 relative z-10">
          <LiquidTabs
            tabs={[
              {
                id: 'DISCOVER_MARKET',
                label: 'Market Opportunities & Filters',
                count: filteredOpportunities.length,
              },
              {
                id: 'OPPORTUNITY_DETAIL',
                label: 'Opportunity Detail & Readiness Match',
              },
              {
                id: 'SAVED_TRACKER',
                label: 'Saved Opportunities & Application Tracker',
                count: savedRecords.length,
              },
              {
                id: 'DEMAND_TRENDS',
                label: 'Deadlines, Newly Added & Market Trends',
                count: demandTrends.length,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          className="glass-panel-subtle rounded-2xl px-4 py-3 border border-white/80 flex items-center justify-between gap-3 text-xs text-[#0B2E56]"
        >
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#075FC7]" />
            {statusNotice}
          </span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-[#075FC7] font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: MARKET OPPORTUNITIES & 10 FILTERS */}
      {activeTab === 'DISCOVER_MARKET' && (
        <div className="space-y-6">
          {/* Category Quick Filter Bar */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#174B80]">
                Filter by Opportunity Type, Field, Skills &amp; Eligibility
              </span>
              <button
                type="button"
                onClick={() => {
                  setFieldFilter('ALL');
                  setSpecializationFilter('ALL');
                  setSearchQuery('');
                  setLocationFilter('');
                  setWorkArrangementFilter('ALL');
                  setExperienceLevelFilter('ALL');
                  setEducationFilter('');
                  setEmploymentTypeFilter('ALL');
                  setRequiredSkillFilter('ALL');
                  setDeadlineFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="text-xs font-semibold text-[#075FC7] hover:underline cursor-pointer"
              >
                Reset All 10 Filters
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'tab-liquid-active text-[#0B2E56]'
                    : 'glass-panel-subtle text-[#123B63] hover:text-[#0B2E56]'
                }`}
              >
                All Categories ({allOpportunities.length})
              </button>
              {(Object.keys(CATEGORY_LABELS) as MarketOpportunityCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'tab-liquid-active text-[#0B2E56]'
                      : 'glass-panel-subtle text-[#123B63] hover:text-[#0B2E56]'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* 10 Structured Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {/* 1. Job Title / Keyword Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  1. Job Title / Keyword
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#075FC7] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Title, employer..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl input-liquid text-xs"
                  />
                </div>
              </div>

              {/* 2. Field (All 18 Fields Supported) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  2. Professional Field (18 Fields)
                </label>
                <select
                  aria-label="Filter by professional field"
                  value={fieldFilter}
                  onChange={(e) => {
                    setFieldFilter(e.target.value);
                    setSpecializationFilter('ALL');
                  }}
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

              {/* 3. Specialisation */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  3. Specialisation
                </label>
                <select
                  aria-label="Filter by specialisation"
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="ALL">All Specialisations</option>
                  {availableSpecializations.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Location */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  4. Location
                </label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. Bengaluru, Delhi, Mumbai..."
                  className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
                />
              </div>

              {/* 5. Work Arrangement (Remote / Hybrid / On-site) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  5. Work Mode
                </label>
                <select
                  aria-label="Filter by work mode"
                  value={workArrangementFilter}
                  onChange={(e) => setWorkArrangementFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="ALL">All Modes (Remote / Hybrid / On-site)</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ON_SITE">On-site</option>
                </select>
              </div>

              {/* 6. Experience Level */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  6. Experience Level
                </label>
                <select
                  aria-label="Filter by experience level"
                  value={experienceLevelFilter}
                  onChange={(e) => setExperienceLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="ALL">All Experience Levels</option>
                  <option value="STUDENT_INTERN">Student Intern</option>
                  <option value="FRESH_GRADUATE">Fresh Graduate</option>
                  <option value="ENTRY_LEVEL_0_2_YRS">Entry-Level (0–2 yrs)</option>
                  <option value="RESEARCH_FELLOW">Research Fellow</option>
                  <option value="APPRENTICE_TRAINEE">Apprentice / Trainee</option>
                </select>
              </div>

              {/* 7. Education Eligibility */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  7. Education Eligibility
                </label>
                <input
                  type="text"
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                  placeholder="e.g. Undergraduate, B.Com, Psychology..."
                  className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
                />
              </div>

              {/* 8. Employment Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  8. Employment Type
                </label>
                <select
                  aria-label="Filter by employment type"
                  value={employmentTypeFilter}
                  onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="ALL">All Employment Types</option>
                  <option value="INTERNSHIP_CONTRACT">Internship Contract</option>
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="FELLOWSHIP_STIPEND">Fellowship Stipend</option>
                  <option value="APPRENTICESHIP_TRAINING">Apprenticeship Training</option>
                  <option value="RESEARCH_GRANT">Research Grant</option>
                </select>
              </div>

              {/* 9. Required Skill */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  9. Required Skill
                </label>
                <select
                  aria-label="Filter by required skill"
                  value={requiredSkillFilter}
                  onChange={(e) => setRequiredSkillFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="ALL">All Catalogue Skills</option>
                  {state.skillsCatalogue.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 10. Application Deadline */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#174B80]">
                  10. Application Deadline
                </label>
                <select
                  aria-label="Filter by deadline status"
                  value={deadlineFilter}
                  onChange={(e) =>
                    setDeadlineFilter(
                      e.target.value as 'ALL' | 'ACTIVE_ONLY' | 'EXPIRING_SOON' | 'INCLUDE_EXPIRED'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl select-liquid text-xs"
                >
                  <option value="ALL">All Deadlines (Including Archive)</option>
                  <option value="ACTIVE_ONLY">Active Deadlines Only</option>
                  <option value="EXPIRING_SOON">Expiring Soon</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opportunity Cards Grid */}
          {filteredOpportunities.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
              <div className="text-base font-bold text-[#0B2E56]">
                No sample opportunities match the current filter combination
              </div>
              <p className="text-xs text-[#123B63] max-w-lg mx-auto">
                All 18 WAYFINDER fields are supported by the architecture. Initial demonstration
                listings are populated for Computer Science &amp; Software, Psychology &amp;
                Behavioural Sciences, Commerce &amp; Finance, Engineering, and Business.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredOpportunities.map((opp) => {
                const statusBadge = LISTING_STATUS_CONFIG[opp.listingStatus];
                const fieldObj = getFieldById(opp.fieldId, state.fieldsCatalogue);
                const saved = isSaved(opp.id);

                return (
                  <div
                    key={opp.id}
                    className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Top Status & Sample Data Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DDF2FF]/85 text-[#0B2E56] border border-white/85">
                            SAMPLE DATA
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.badgeClass}`}
                          >
                            {statusBadge.label}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold glass-floating text-[#075FC7]">
                            {CATEGORY_LABELS[opp.category]}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveToggle(opp)}
                          aria-label={saved ? 'Remove saved opportunity' : 'Save opportunity'}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold glass-floating text-[#0B2E56] hover:border-white cursor-pointer"
                        >
                          {saved ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 text-[#075FC7]" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5 text-[#174B80]" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Title, Employer, Industry & Location */}
                      <div>
                        <h2 className="font-display text-lg font-bold text-[#0B2E56]">
                          {opp.title}
                        </h2>
                        <div className="text-xs font-semibold text-[#123B63] mt-0.5">
                          {opp.employerName} • <span className="text-[#174B80]">{opp.industry}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#315A7D] mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#075FC7]" />
                            {opp.location} ({opp.workArrangement.replace('_', '-')})
                          </span>
                          <span>•</span>
                          <span>{opp.employmentType.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span>{ fieldObj?.shortName || opp.fieldId } ({opp.specialization})</span>
                        </div>
                      </div>

                      {/* Experience & Education Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs glass-panel-subtle p-3 rounded-xl">
                        <div>
                          <div className="text-[10px] font-mono font-semibold uppercase text-[#174B80]">
                            Experience Requirement
                          </div>
                          <div className="text-[#123B63] mt-0.5 leading-snug">
                            {opp.experienceRequirementsText}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-semibold uppercase text-[#174B80]">
                            Education Eligibility
                          </div>
                          <div className="text-[#123B63] mt-0.5 leading-snug">
                            {opp.educationEligibility}
                          </div>
                        </div>
                      </div>

                      {/* Required & Preferred Skills */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-[#174B80]">
                          Required Skills:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.requiredSkillIds.map((sid) => {
                            const sk = getSkillById(sid, state.skillsCatalogue);
                            return (
                              <span
                                key={sid}
                                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5FAFF]/75 text-[#0B2E56] border border-white/80"
                              >
                                {sk?.name || sid}
                              </span>
                            );
                          })}
                        </div>
                        {opp.preferredSkillIds.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-[#315A7D]">Preferred:</span>
                            {opp.preferredSkillIds.map((sid) => {
                              const sk = getSkillById(sid, state.skillsCatalogue);
                              return (
                                <span
                                  key={sid}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-medium glass-panel-subtle text-[#123B63]"
                                >
                                  {sk?.name || sid}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Action Footer */}
                    <div className="pt-3 border-t border-white/55 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#315A7D]">
                        <span>
                          Deadline:{' '}
                          <strong className="text-[#0B2E56]">
                            {opp.applicationDeadline || 'Unspecified'}
                          </strong>
                        </span>
                        <span>Discovered: {opp.discoveryDate}</span>
                        <span>
                          Verified: {opp.lastVerificationDate || 'Pending'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-[#174B80] truncate max-w-[220px]">
                          Source: {opp.sourceName}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <LiquidButton
                            variant="secondary"
                            size="sm"
                            pill
                            onClick={() => handleOpenDetail(opp.id)}
                          >
                            Inspect &amp; Readiness Match
                          </LiquidButton>
                          <LiquidButton
                            variant="primary"
                            size="sm"
                            pill
                            onClick={() => handleBenchmarkInGapAnalysis(opp)}
                          >
                            Benchmark Gaps →
                          </LiquidButton>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPPORTUNITY DETAIL PAGE + WAYFINDER READINESS INTEGRATION PANEL (Section 3C) */}
      {activeTab === 'OPPORTUNITY_DETAIL' && selectedOpportunity && (
        <div className="space-y-6">
          {/* Opportunity Switcher Bar */}
          <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="mkt-detail-select" className="text-xs font-semibold text-[#174B80]">
                Select Opportunity to Inspect:
              </label>
              <select
                id="mkt-detail-select"
                value={selectedOpportunity.id}
                onChange={(e) => setSelectedOpportunityId(e.target.value)}
                className="select-liquid rounded-xl px-3 py-1.5 text-xs font-semibold"
              >
                {allOpportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LiquidButton
                variant="secondary"
                size="sm"
                pill
                onClick={() => handleSaveToggle(selectedOpportunity)}
              >
                {isSaved(selectedOpportunity.id) ? 'Saved in Tracker' : 'Save Opportunity'}
              </LiquidButton>
              <LiquidButton
                variant="secondary"
                size="sm"
                pill
                onClick={() => navigateTo('25_RESUME_BUILDER')}
              >
                Tailor Resume to This Role
              </LiquidButton>
              <LiquidButton
                variant="primary"
                size="sm"
                pill
                onClick={() => handleBenchmarkInGapAnalysis(selectedOpportunity)}
              >
                Open in Full Readiness &amp; Gap Analysis →
              </LiquidButton>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: All 10 Required Detail Sections */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#DDF2FF]/85 text-[#0B2E56] border border-white/85">
                  SAMPLE DATA
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                    LISTING_STATUS_CONFIG[selectedOpportunity.listingStatus].badgeClass
                  }`}
                >
                  Status: {LISTING_STATUS_CONFIG[selectedOpportunity.listingStatus].label}
                </span>
              </div>

              <div>
                <h2 className="font-display text-2xl font-bold text-[#0B2E56]">
                  {selectedOpportunity.title}
                </h2>
                <p className="text-xs font-semibold text-[#174B80] mt-1">
                  {selectedOpportunity.employerName} • {selectedOpportunity.location} (
                  {selectedOpportunity.workArrangement})
                </p>
              </div>

              {/* 1. Opportunity Overview */}
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  1. Opportunity Overview
                </h3>
                <p className="text-xs sm:text-sm text-[#123B63] leading-relaxed">
                  {selectedOpportunity.overview}
                </p>
              </div>

              {/* 2. Employer Information */}
              <div className="p-3.5 rounded-xl glass-panel-subtle space-y-1">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  2. Employer Information
                </h3>
                <p className="text-xs text-[#123B63] leading-relaxed">
                  <strong>{selectedOpportunity.employerName}</strong> ({selectedOpportunity.industry}
                  ): {selectedOpportunity.employerOverview}
                </p>
              </div>

              {/* 3. Eligibility & 6. Education Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl glass-panel-subtle space-y-1">
                  <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                    3. Experience &amp; Eligibility Requirements
                  </h3>
                  <p className="text-xs text-[#123B63]">
                    {selectedOpportunity.experienceRequirementsText}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl glass-panel-subtle space-y-1">
                  <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                    6. Education Requirements
                  </h3>
                  <p className="text-xs text-[#123B63]">
                    {selectedOpportunity.educationEligibility}
                  </p>
                </div>
              </div>

              {/* 4. Required Capabilities & 5. Preferred Capabilities */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                  4. Required Capabilities &amp; Skills
                </h3>
                <div className="space-y-2">
                  {selectedOpportunity.requiredCapabilities.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl glass-panel-subtle border border-white/70 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0B2E56]">
                          {getCapabilityDimensionName(req.dimensionId)} (Required Level{' '}
                          {req.requiredLevel})
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-[#075FC7]">
                          {req.evidenceRequired ? 'Verified Evidence Required' : 'Assessment Supported'}
                        </span>
                      </div>
                      <p className="text-xs text-[#123B63]">{req.rationale}</p>
                      {req.acceptableEvidenceTypes && (
                        <p className="text-[11px] text-[#315A7D]">
                          Acceptable Evidence: {req.acceptableEvidenceTypes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {selectedOpportunity.preferredCapabilities.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-xs font-mono font-bold uppercase text-[#174B80]">
                      5. Preferred Capabilities
                    </h3>
                    {selectedOpportunity.preferredCapabilities.map((pref, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl glass-panel-subtle text-xs text-[#123B63]"
                      >
                        <strong>{getCapabilityDimensionName(pref.dimensionId)}</strong> (Recommended
                        Level {pref.recommendedLevel}): {pref.rationale}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Application Instructions, 8. Original Source, 9. Deadline, 10. Verification Status */}
              <div className="p-4 rounded-xl glass-panel-subtle space-y-2 text-xs">
                <div>
                  <span className="font-mono font-bold uppercase text-[#174B80]">
                    7. Application Instructions:{' '}
                  </span>
                  <span className="text-[#123B63]">
                    {selectedOpportunity.applicationInstructions}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/55 font-mono text-[11px]">
                  <div>
                    <div className="text-[#174B80] font-bold">8. Original Source</div>
                    <div className="text-[#123B63]">{selectedOpportunity.sourceName}</div>
                  </div>
                  <div>
                    <div className="text-[#174B80] font-bold">9. Application Deadline</div>
                    <div className="text-[#0B2E56] font-bold">
                      {selectedOpportunity.applicationDeadline || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#174B80] font-bold">10. Verification Status</div>
                    <div className="text-[#123B63]">
                      {LISTING_STATUS_CONFIG[selectedOpportunity.listingStatus].label} (
                      {selectedOpportunity.lastVerificationDate || 'Pending'})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: WAYFINDER Readiness Integration Panel */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold uppercase text-[#075FC7] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#075FC7]" />
                  <span>WAYFINDER Readiness Integration Panel</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0B2E56]">
                  Live Capability vs. Requirement Comparison
                </h3>
                <p className="text-xs text-[#123B63]">
                  Compares this opportunity’s requirements against your current Capability Passport.
                  Unknown/unassessed capabilities are never converted into zero.
                </p>
              </div>

              {readinessReport && (
                <>
                  {/* 6 Status Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-xl glass-panel-subtle">
                      <div className="text-lg font-display font-bold text-[#0B2E56]">
                        {readinessReport.counts.DEMONSTRATED}
                      </div>
                      <div className="text-[11px] font-semibold text-[#174B80]">Demonstrated</div>
                    </div>
                    <div className="p-2.5 rounded-xl glass-panel-subtle">
                      <div className="text-lg font-display font-bold text-[#0B2E56]">
                        {readinessReport.counts.PARTIALLY_DEMONSTRATED}
                      </div>
                      <div className="text-[11px] font-semibold text-[#174B80]">
                        Partially Demonstrated
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl glass-panel-subtle">
                      <div className="text-lg font-display font-bold text-[#0B2E56]">
                        {readinessReport.counts.DEVELOPMENT_NEEDED}
                      </div>
                      <div className="text-[11px] font-semibold text-[#174B80]">
                        Development Needed
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl glass-panel-subtle">
                      <div className="text-lg font-display font-bold text-[#0B2E56]">
                        {readinessReport.counts.EVIDENCE_MISSING}
                      </div>
                      <div className="text-[11px] font-semibold text-[#174B80]">
                        Missing Evidence
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl glass-panel-subtle">
                      <div className="text-lg font-display font-bold text-[#0B2E56]">
                        {readinessReport.counts.MANDATORY_CONDITION_NOT_MET}
                      </div>
                      <div className="text-[11px] font-semibold text-[#174B80]">
                        Conditions Not Met
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl glass-panel-subtle">
                      <div className="text-lg font-display font-bold text-[#0B2E56]">
                        {readinessReport.counts.UNKNOWN_INSUFFICIENT_INFO}
                      </div>
                      <div className="text-[11px] font-semibold text-[#174B80]">
                        Info Not Yet Available
                      </div>
                    </div>
                  </div>

                  {/* Requirement-by-Requirement Evaluation List */}
                  <div className="space-y-2.5">
                    {readinessReport.requirementEvaluations.map((ev) => (
                      <div
                        key={ev.requirement.id}
                        className="p-3.5 rounded-xl glass-panel-subtle space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#0B2E56]">
                            {ev.dimensionName}
                          </span>
                          <RequirementStatusBadge status={ev.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#174B80]">
                          <span>Required: L{ev.requiredLevel}</span>
                          <span>
                            Demonstrated:{' '}
                            {ev.demonstratedLevel !== null
                              ? `L${ev.demonstratedLevel}`
                              : 'Unassessed (Unknown)'}
                          </span>
                          <span>
                            Gap: {ev.numericGap !== null ? ev.numericGap : 'Needs Assessment'}
                          </span>
                        </div>
                        <p className="text-xs text-[#123B63]">{ev.explanation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <LiquidButton
                      variant="primary"
                      size="sm"
                      pill
                      onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
                    >
                      Take Skill Assessments
                    </LiquidButton>
                    <LiquidButton
                      variant="secondary"
                      size="sm"
                      pill
                      onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                    >
                      Submit Proof in Evidence Ledger
                    </LiquidButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED OPPORTUNITIES & APPLICATION TRACKER (Section 3D) */}
      {activeTab === 'SAVED_TRACKER' && (
        <div className="glass-panel rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B2E56]">
                Saved Opportunities &amp; Application Status Tracker
              </h2>
              <p className="text-xs text-[#123B63]">
                Track application statuses, personal notes, submission dates, and deadlines. Stored
                via the JobMarketService abstraction for future backend persistence.
              </p>
            </div>
          </div>

          {savedRecords.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel-subtle text-center space-y-3">
              <Bookmark className="w-8 h-8 text-[#075FC7] mx-auto" />
              <div className="text-sm font-bold text-[#0B2E56]">
                No Saved Opportunities Yet
              </div>
              <p className="text-xs text-[#123B63] max-w-md mx-auto">
                Click &ldquo;Save&rdquo; on any opportunity card in the Market Opportunities tab to
                track your application status, personal notes, and deadlines here.
              </p>
              <LiquidButton
                variant="primary"
                size="sm"
                pill
                onClick={() => setActiveTab('DISCOVER_MARKET')}
              >
                Browse Market Opportunities
              </LiquidButton>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRecords.map((rec) => {
                const opp = allOpportunities.find((o) => o.id === rec.opportunityId);
                if (!opp) return null;
                return (
                  <div
                    key={rec.opportunityId}
                    className="p-5 rounded-2xl glass-panel-subtle border border-white/75 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#DDF2FF]/80 text-[#0B2E56]">
                          SAMPLE DATA
                        </span>
                        <h3 className="font-display text-base font-bold text-[#0B2E56] mt-1">
                          {opp.title}
                        </h3>
                        <p className="text-xs text-[#174B80]">
                          {opp.employerName} • {opp.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <LiquidButton
                          variant="secondary"
                          size="sm"
                          pill
                          onClick={() => handleOpenDetail(opp.id)}
                        >
                          View Details
                        </LiquidButton>
                        <button
                          type="button"
                          onClick={() => handleSaveToggle(opp)}
                          className="p-2 rounded-xl glass-floating text-[#0B2E56] hover:text-[#075FC7] cursor-pointer"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#174B80]">
                          Application Status (8 States)
                        </label>
                        <select
                          aria-label={`Application status for ${opp.title}`}
                          value={rec.applicationStatus}
                          onChange={(e) =>
                            handleUpdateSavedRecord(
                              rec.opportunityId,
                              e.target.value as SavedApplicationStatus,
                              rec.personalNotes,
                              rec.applicationDate,
                              rec.reminderDeadline
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl select-liquid text-xs font-semibold"
                        >
                          {(
                            Object.keys(APPLICATION_STATUS_LABELS) as SavedApplicationStatus[]
                          ).map((st) => (
                            <option key={st} value={st}>
                              {APPLICATION_STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#174B80]">
                          Recorded Application Date
                        </label>
                        <input
                          type="date"
                          value={rec.applicationDate || ''}
                          onChange={(e) =>
                            handleUpdateSavedRecord(
                              rec.opportunityId,
                              rec.applicationStatus,
                              rec.personalNotes,
                              e.target.value || null,
                              rec.reminderDeadline
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#174B80]">
                          Tracked Deadline
                        </label>
                        <input
                          type="date"
                          value={rec.reminderDeadline || ''}
                          onChange={(e) =>
                            handleUpdateSavedRecord(
                              rec.opportunityId,
                              rec.applicationStatus,
                              rec.personalNotes,
                              rec.applicationDate,
                              e.target.value || null
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#174B80]">
                        Personal Application &amp; Readiness Notes
                      </label>
                      <textarea
                        rows={2}
                        value={rec.personalNotes}
                        onChange={(e) =>
                          handleUpdateSavedRecord(
                            rec.opportunityId,
                            rec.applicationStatus,
                            e.target.value,
                            rec.applicationDate,
                            rec.reminderDeadline
                          )
                        }
                        placeholder="Record preparation notes, required evidence links, or interview follow-ups..."
                        className="w-full px-3 py-2 rounded-xl input-liquid text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UPCOMING DEADLINES, RECENTLY ADDED & MARKET DEMAND TRENDS */}
      {activeTab === 'DEMAND_TRENDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Market Demand Trends */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#0B2E56]">
                Market Demand Trends (Sample Synthesis)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DDF2FF]/80 text-[#0B2E56]">
                SAMPLE DATA
              </span>
            </div>

            <div className="space-y-3">
              {demandTrends.map((trend) => {
                const fieldObj = getFieldById(trend.fieldId, state.fieldsCatalogue);
                return (
                  <div
                    key={trend.id}
                    className="p-4 rounded-xl glass-panel-subtle space-y-2 border border-white/75"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#075FC7]">
                      <span>
                        {fieldObj?.shortName || trend.fieldId} • {trend.specialization}
                      </span>
                      <span>{trend.observationPeriod}</span>
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#0B2E56]">
                      {trend.headline}
                    </h3>
                    <p className="text-xs text-[#123B63] leading-relaxed">{trend.summary}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {trend.observedRoleCategories.map((role) => (
                        <span
                          key={role}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/55 text-[#0B2E56]"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Application Deadlines & Recently Added */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B2E56] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#075FC7]" />
                <span>Upcoming Application Deadlines (Sample)</span>
              </h2>
              <div className="space-y-2.5">
                {upcomingDeadlines.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3 rounded-xl glass-panel-subtle flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B2E56] truncate">{opp.title}</div>
                      <div className="text-[11px] text-[#315A7D] truncate">{opp.employerName}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[#075FC7]">
                        {opp.applicationDeadline}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(opp.id)}
                        className="text-[11px] font-semibold text-[#0B2E56] hover:underline cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B2E56] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#075FC7]" />
                <span>Recently Added Opportunities</span>
              </h2>
              <div className="space-y-2.5">
                {recentlyAdded.slice(0, 4).map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3 rounded-xl glass-panel-subtle flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0B2E56] truncate">{opp.title}</div>
                      <div className="text-[11px] text-[#315A7D]">
                        Discovered: {opp.discoveryDate}
                      </div>
                    </div>
                    <LiquidButton
                      variant="secondary"
                      size="sm"
                      pill
                      onClick={() => handleOpenDetail(opp.id)}
                    >
                      Open
                    </LiquidButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
