import React, { useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Filter,
  Sliders,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useWayfinder } from '../../context/WayfinderContext';
import { StudentUpdatesService } from '../../services/careerIntelligenceServices';
import {
  MarketAndSkillUpdateItem,
  StudentUpdatePreferences,
  UpdateCategory,
  UpdateVerificationBadge,
} from '../../types/marketSkillsCareer';

const UPDATE_CATEGORIES: { id: UpdateCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Updates' },
  { id: 'JOB_UPDATE', label: '1. Job Updates' },
  { id: 'INTERNSHIP_UPDATE', label: '2. Internship Updates' },
  { id: 'EMERGING_SKILL_UPDATE', label: '3. Emerging Skill Updates' },
  { id: 'INDUSTRY_CHANGE', label: '4. Industry Changes' },
  { id: 'LEARNING_OPPORTUNITY', label: '5. Learning Opportunities' },
  { id: 'APPLICATION_DEADLINE', label: '6. Application Deadlines' },
  { id: 'PROFESSIONAL_DEVELOPMENT', label: '7. Professional Development' },
];

function badgeStyle(badge: UpdateVerificationBadge): string {
  switch (badge) {
    case 'SOURCE_VERIFIED':
      return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
    case 'RECENTLY_DISCOVERED':
      return 'bg-[#DDF0FF] text-[#075FC7] border-[#8DBDFF]';
    case 'AWAITING_REVIEW':
      return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
    case 'EXPIRED':
      return 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]';
    case 'SAMPLE_DATA':
    default:
      return 'bg-[#E5F2FF] text-[#0B2E56] border-[#99C8FF]';
  }
}

export const Screen27StudentUpdates: React.FC = () => {
  const { state, navigateTo } = useWayfinder();

  const [updates] = useState<MarketAndSkillUpdateItem[]>(() =>
    StudentUpdatesService.getAllUpdates()
  );
  const [prefs, setPrefs] = useState<StudentUpdatePreferences>(() =>
    StudentUpdatesService.getPreferences()
  );

  const [selectedCategory, setSelectedCategory] = useState<UpdateCategory | 'ALL'>('ALL');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('ALL');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'FOLLOWED_ONLY' | 'SAVED_ONLY' | 'UNREAD'>(
    'ALL'
  );
  const [showPrefsDrawer, setShowPrefsDrawer] = useState<boolean>(false);

  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      if (selectedCategory !== 'ALL' && u.category !== selectedCategory) return false;
      if (selectedFieldId !== 'ALL' && u.fieldId !== selectedFieldId) return false;
      if (!prefs.enabledCategories.includes(u.category)) return false;

      if (viewFilter === 'SAVED_ONLY' && !prefs.savedUpdateIds.includes(u.id)) return false;
      if (viewFilter === 'UNREAD' && prefs.readUpdateIds.includes(u.id)) return false;
      if (viewFilter === 'FOLLOWED_ONLY') {
        const matchesField = prefs.followedFieldIds.includes(u.fieldId);
        const matchesSpec = prefs.followedSpecializations.includes(u.specialization);
        const matchesSkill = u.relatedSkillIds.some((sid) =>
          prefs.followedSkillIds.includes(sid)
        );
        if (!matchesField && !matchesSpec && !matchesSkill) return false;
      }
      return true;
    });
  }, [updates, selectedCategory, selectedFieldId, viewFilter, prefs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="wf-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="wf-Chip">MODULE 5 — PERSONALISED MARKET &amp; SKILL UPDATES</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#E5F2FF] text-[#075FC7] border border-[#8DBDFF]">
                SAMPLE DATA FEED (NO LIVE BACKGROUND SCRAPER)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0B2E56]">
              Unified Market, Skill &amp; Opportunity Updates Centre
            </h1>
            <p className="text-sm text-[#123B63] mt-1 max-w-3xl">
              Track curated demonstration updates across jobs, internships, emerging skills,
              industry changes, learning opportunities, deadlines, and professional development.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrefsDrawer(!showPrefsDrawer)}
              className="wf-btn wf-btn-primary text-xs"
            >
              <Sliders className="w-3.5 h-3.5" />{' '}
              {showPrefsDrawer ? 'Hide Update Preferences' : 'Manage Update Preferences'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('23_JOB_MARKET_INTELLIGENCE')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <Briefcase className="w-3.5 h-3.5" /> Job Market Intelligence
            </button>
            <button
              type="button"
              onClick={() => navigateTo('24_SKILL_INTELLIGENCE')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Skill Intelligence
            </button>
          </div>
        </div>

        {/* Preferences Drawer */}
        {showPrefsDrawer && (
          <div className="mt-5 p-5 rounded-xl bg-white/85 border border-[#8DBDFF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#8DBDFF]/40 pb-2">
              <h2 className="text-base font-bold text-[#0B2E56]">
                Student Update Preferences (Followed Fields, Specialisations, Skills &amp; Categories)
              </h2>
              <span className="text-xs font-semibold text-[#075FC7]">
                Saved Locally to Student Profile
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Followed Fields */}
              <div className="p-3 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/50 space-y-2">
                <div className="font-bold text-[#0B2E56]">
                  Followed Fields ({prefs.followedFieldIds.length})
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {state.fieldsCatalogue.map((f) => {
                    const active = prefs.followedFieldIds.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-white cursor-pointer"
                      >
                        <span className="text-[#123B63] font-medium">{f.shortName}</span>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            setPrefs({ ...StudentUpdatesService.toggleFollowField(f.id) })
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Followed Skills */}
              <div className="p-3 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/50 space-y-2">
                <div className="font-bold text-[#0B2E56]">
                  Followed Skills ({prefs.followedSkillIds.length})
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {state.skillsCatalogue.map((sk) => {
                    const active = prefs.followedSkillIds.includes(sk.id);
                    return (
                      <label
                        key={sk.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-white cursor-pointer"
                      >
                        <span className="text-[#123B63] font-medium truncate">{sk.name}</span>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            setPrefs({ ...StudentUpdatesService.toggleFollowSkill(sk.id) })
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Enabled Update Categories */}
              <div className="p-3 rounded-xl bg-[#F4FAFF] border border-[#8DBDFF]/50 space-y-2">
                <div className="font-bold text-[#0B2E56]">
                  Enabled Update Categories ({prefs.enabledCategories.length}/7)
                </div>
                <div className="space-y-1">
                  {UPDATE_CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => {
                    const catId = c.id as UpdateCategory;
                    const enabled = prefs.enabledCategories.includes(catId);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-white cursor-pointer"
                      >
                        <span className="text-[#123B63] font-medium">{c.label}</span>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() =>
                            setPrefs({
                              ...StudentUpdatesService.toggleCategoryPreference(catId),
                            })
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="wf-panel p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {UPDATE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#075FC7] text-white shadow-sm'
                    : 'bg-white/75 text-[#0B2E56] border border-[#8DBDFF]/50 hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-[#8DBDFF]/40">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[#075FC7]" />
            {(
              [
                { id: 'ALL', label: `All Feed (${updates.length})` },
                { id: 'FOLLOWED_ONLY', label: 'Followed Fields & Skills Only' },
                { id: 'SAVED_ONLY', label: `Saved Updates (${prefs.savedUpdateIds.length})` },
                { id: 'UNREAD', label: 'Unread Only' },
              ] as const
            ).map((vf) => (
              <button
                key={vf.id}
                type="button"
                onClick={() => setViewFilter(vf.id)}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  viewFilter === vf.id
                    ? 'bg-[#DDF0FF] text-[#075FC7] border border-[#075FC7]'
                    : 'bg-white/70 text-[#123B63] border border-[#8DBDFF]/40'
                }`}
              >
                {vf.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter Updates by Field"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="wf-select text-xs"
          >
            <option value="ALL">All 18 Fields</option>
            {state.fieldsCatalogue.map((f) => (
              <option key={f.id} value={f.id}>
                {f.shortName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Updates Feed */}
      <div className="space-y-3">
        {filteredUpdates.length === 0 ? (
          <div className="wf-panel p-8 text-center space-y-2">
            <Bell className="w-8 h-8 text-[#075FC7] mx-auto" />
            <h3 className="text-base font-bold text-[#0B2E56]">
              No Updates Match Your Current Filter Selection
            </h3>
            <p className="text-xs text-[#315A7D]">
              Reset your category or view filters above, or enable additional categories in Manage
              Update Preferences.
            </p>
          </div>
        ) : (
          filteredUpdates.map((item) => {
            const isSaved = prefs.savedUpdateIds.includes(item.id);
            const isRead = prefs.readUpdateIds.includes(item.id);
            const fieldObj = state.fieldsCatalogue.find((f) => f.id === item.fieldId);

            return (
              <div
                key={item.id}
                className={`wf-panel p-5 transition-all ${
                  isRead ? 'opacity-85' : 'border-l-4 border-l-[#075FC7]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#075FC7] text-white">
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle(
                          item.verificationBadge
                        )}`}
                      >
                        {item.verificationBadge.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5F2FF] text-[#0B2E56] border border-[#8DBDFF]">
                        SAMPLE DATA
                      </span>
                      <span className="text-xs text-[#315A7D] font-semibold">
                        {fieldObj?.shortName || item.fieldId} • {item.specialization}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-[#0B2E56]">{item.title}</h2>
                    <p className="text-xs text-[#123B63] leading-relaxed">{item.summary}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#315A7D]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Published: {item.publishedAt}
                      </span>
                      <span>Source: {item.sourceLabel}</span>
                    </div>
                  </div>

                  {/* Student Actions */}
                  <div className="flex flex-wrap md:flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPrefs({ ...StudentUpdatesService.toggleSaveUpdate(item.id) })
                        }
                        className={`wf-btn text-xs ${
                          isSaved ? 'wf-btn-primary' : 'wf-btn-secondary'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" /> {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPrefs({ ...StudentUpdatesService.toggleReadUpdate(item.id) })
                        }
                        className="wf-btn wf-btn-secondary text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                        {isRead ? 'Marked Read' : 'Mark Read'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.relatedOpportunityId && (
                        <button
                          type="button"
                          onClick={() => navigateTo('23_JOB_MARKET_INTELLIGENCE')}
                          className="text-xs font-bold text-[#075FC7] underline"
                        >
                          Inspect Opportunity →
                        </button>
                      )}
                      {item.relatedResourceId && (
                        <button
                          type="button"
                          onClick={() => navigateTo('15_LEARNING_CENTRE')}
                          className="text-xs font-bold text-[#075FC7] underline"
                        >
                          Open Learning Hub →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
