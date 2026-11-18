import React, { useState, useEffect, useRef } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { ScreenId } from '../../types/wayfinder';
import {
  Compass,
  Award,
  Briefcase,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Building2,
  Activity,
  LayoutDashboard,
  UserPlus,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Lock,
  History,
  UserCheck,
  Home,
} from 'lucide-react';

export interface PrimaryNavGroup {
  id: string;
  label: string;
  defaultScreen: ScreenId;
  matchScreens: ScreenId[];
  icon: React.ReactNode;
  subItems?: {
    id: ScreenId;
    label: string;
  }[];
}

export const PRIMARY_NAV_GROUPS: PrimaryNavGroup[] = [
  {
    id: 'overview',
    label: 'Home',
    defaultScreen: '01_LANDING',
    matchScreens: ['01_LANDING'],
    icon: <Home className="w-3.5 h-3.5" />,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    defaultScreen: '05_STUDENT_DASHBOARD',
    matchScreens: ['05_STUDENT_DASHBOARD'],
    icon: <LayoutDashboard className="w-3.5 h-3.5" />,
  },
  {
    id: 'assessments',
    label: 'Assessments',
    defaultScreen: '06_ASSESSMENT_HUB',
    matchScreens: [
      '06_ASSESSMENT_HUB',
      '07_RIASEC_ASSESSMENT',
      '08_APTITUDE_ASSESSMENT',
      '09_SKILL_RUBRIC_ASSESSMENT',
      '10_ASSESSMENT_RESULTS',
    ],
    icon: <Activity className="w-3.5 h-3.5" />,
    subItems: [
      { id: '06_ASSESSMENT_HUB', label: 'Assessment Hub' },
      { id: '07_RIASEC_ASSESSMENT', label: 'Career Interests (RIASEC)' },
      { id: '08_APTITUDE_ASSESSMENT', label: 'Take Skill Assessments' },
      { id: '09_SKILL_RUBRIC_ASSESSMENT', label: 'Skill Self-Rubric' },
      { id: '10_ASSESSMENT_RESULTS', label: 'My Assessment Results' },
    ],
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    defaultScreen: '12_OPPORTUNITY_DISCOVERY',
    matchScreens: [
      '12_OPPORTUNITY_DISCOVERY',
      '13_OPPORTUNITY_DETAIL',
      '23_JOB_MARKET_INTELLIGENCE',
      '27_STUDENT_UPDATES',
    ],
    icon: <Briefcase className="w-3.5 h-3.5" />,
    subItems: [
      { id: '12_OPPORTUNITY_DISCOVERY', label: 'Discover & Configure' },
      { id: '13_OPPORTUNITY_DETAIL', label: 'Target Requirements' },
      { id: '23_JOB_MARKET_INTELLIGENCE', label: 'Job Market Intelligence' },
      { id: '27_STUDENT_UPDATES', label: 'Market & Skill Updates' },
    ],
  },
  {
    id: 'readiness',
    label: 'Readiness',
    defaultScreen: '11_CAPABILITY_PASSPORT',
    matchScreens: [
      '11_CAPABILITY_PASSPORT',
      '14_READINESS_GAP_ANALYSIS',
      '19_HISTORICAL_SNAPSHOTS',
    ],
    icon: <Award className="w-3.5 h-3.5" />,
    subItems: [
      { id: '11_CAPABILITY_PASSPORT', label: 'Skill & Evidence Profile' },
      { id: '14_READINESS_GAP_ANALYSIS', label: 'Gap Analysis' },
      { id: '19_HISTORICAL_SNAPSHOTS', label: 'Readiness History' },
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    defaultScreen: '15_LEARNING_CENTRE',
    matchScreens: ['15_LEARNING_CENTRE', '16_ACTIVITY_WORKSPACE', '24_SKILL_INTELLIGENCE'],
    icon: <BookOpen className="w-3.5 h-3.5" />,
    subItems: [
      { id: '15_LEARNING_CENTRE', label: 'Learning Hub & Field Library' },
      { id: '24_SKILL_INTELLIGENCE', label: 'Skill Intelligence & Trends' },
      { id: '16_ACTIVITY_WORKSPACE', label: 'My Learning Progress' },
    ],
  },
  {
    id: 'evidence',
    label: 'Evidence',
    defaultScreen: '17_EVIDENCE_LEDGER',
    matchScreens: ['17_EVIDENCE_LEDGER', '25_RESUME_BUILDER', '26_LINKEDIN_SUPPORT'],
    icon: <FileCheck className="w-3.5 h-3.5" />,
    subItems: [
      { id: '17_EVIDENCE_LEDGER', label: 'Evidence Ledger' },
      { id: '25_RESUME_BUILDER', label: 'Resume Builder Studio' },
      { id: '26_LINKEDIN_SUPPORT', label: 'LinkedIn Profile Support' },
    ],
  },
];

export const ACCOUNT_AND_PORTAL_LINKS: {
  id: ScreenId;
  label: string;
  description: string;
  section: 'ACCOUNT_PRIVACY' | 'ROLE_PORTALS';
  icon: React.ReactNode;
}[] = [
  {
    id: '04_ONBOARDING_CONSENT',
    label: 'Onboarding & Eligibility',
    description: 'Privacy preferences and opportunity eligibility status',
    section: 'ACCOUNT_PRIVACY',
    icon: <UserCheck className="w-4 h-4 text-[#075FC7]" />,
  },
  {
    id: '20_PRIVACY_SHARING',
    label: 'Privacy & Data Sharing',
    description: 'Manage time-limited sharing links and access permissions',
    section: 'ACCOUNT_PRIVACY',
    icon: <Lock className="w-4 h-4 text-[#075FC7]" />,
  },
  {
    id: '19_HISTORICAL_SNAPSHOTS',
    label: 'Readiness History',
    description: 'Saved readiness milestones and activity log',
    section: 'ACCOUNT_PRIVACY',
    icon: <History className="w-4 h-4 text-[#075FC7]" />,
  },
  {
    id: '18_REVIEWER_WORKSPACE',
    label: 'Reviewer Workspace',
    description: 'Evaluate assigned student evidence submissions',
    section: 'ROLE_PORTALS',
    icon: <ShieldCheck className="w-4 h-4 text-[#075FC7]" />,
  },
  {
    id: '21_INSTITUTION_DASHBOARD',
    label: 'Institution Analytics',
    description: 'Anonymised cohort readiness insights and shared reports',
    section: 'ROLE_PORTALS',
    icon: <Building2 className="w-4 h-4 text-[#075FC7]" />,
  },
  {
    id: '28_ADMIN_INTELLIGENCE',
    label: 'Admin Intelligence Console',
    description: 'Market research dashboard, skill candidate governance & config',
    section: 'ROLE_PORTALS',
    icon: <Activity className="w-4 h-4 text-[#075FC7]" />,
  },
];

export const Header: React.FC = () => {
  const { state, navigateTo, logout } = useWayfinder();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const activeGroup = PRIMARY_NAV_GROUPS.find((group) =>
    group.matchScreens.includes(state.currentScreen)
  );

  const isAccountOrPortalActive = [
    '04_ONBOARDING_CONSENT',
    '20_PRIVACY_SHARING',
    '18_REVIEWER_WORKSPACE',
    '21_INSTITUTION_DASHBOARD',
    '28_ADMIN_INTELLIGENCE',
  ].includes(state.currentScreen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectScreen = (screen: ScreenId) => {
    navigateTo(screen);
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const accountPrivacyLinks = ACCOUNT_AND_PORTAL_LINKS.filter(
    (item) => item.section === 'ACCOUNT_PRIVACY'
  );
  const rolePortalLinks = ACCOUNT_AND_PORTAL_LINKS.filter(
    (item) => item.section === 'ROLE_PORTALS'
  );

  const contextualSubItems: { id: ScreenId; label: string }[] = activeGroup?.subItems
    ? activeGroup.subItems
    : isAccountOrPortalActive
    ? [
        { id: '04_ONBOARDING_CONSENT', label: 'Onboarding & Eligibility' },
        { id: '20_PRIVACY_SHARING', label: 'Privacy & Data Sharing' },
        { id: '18_REVIEWER_WORKSPACE', label: 'Reviewer Workspace' },
        { id: '21_INSTITUTION_DASHBOARD', label: 'Institution Analytics' },
        { id: '28_ADMIN_INTELLIGENCE', label: 'Admin Intelligence Console' },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 glass-panel border-t-0 border-x-0 border-b border-white/65">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Primary Header Bar */}
        <div className="flex items-center justify-between h-16 gap-3 relative z-10">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectScreen('01_LANDING')}
              aria-label="WAYFINDER Home — Identify the gap. Build the capability. Prove it."
              className="flex items-center gap-2.5 text-left group rounded-xl p-1 -ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#2178EE] via-[#1864DC] to-[#075FC7] border border-white/75 flex items-center justify-center shadow-[0_6px_16px_rgba(7,95,199,0.42),inset_0_1px_1px_rgba(255,255,255,0.65)] group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-extrabold tracking-tight text-base leading-none text-[#0B2E56]">
                  WAYFINDER
                </div>
                <div className="text-[10px] font-semibold text-[#174B80] mt-0.5 hidden xl:block">
                  Identify the gap. Build the capability. Prove it.
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Primary Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-1"
          >
            {PRIMARY_NAV_GROUPS.map((group) => {
              const isActive = group.matchScreens.includes(state.currentScreen);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectScreen(group.defaultScreen)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer ${
                    isActive
                      ? 'tab-liquid-active text-[#0B2E56]'
                      : 'text-[#123B63] hover:text-[#0B2E56] hover:bg-white/35 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-[#075FC7]' : 'text-[#174B80]'}>
                    {group.icon}
                  </span>
                  <span>{group.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Account & Portals Menu + Auth Actions + Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Account & Portals Dropdown */}
            <div className="relative hidden sm:block" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                aria-controls="wayfinder-account-menu"
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer ${
                  isAccountOrPortalActive || accountMenuOpen
                    ? 'tab-liquid-active text-[#0B2E56]'
                    : 'btn-liquid-secondary'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#075FC7]" />
                <span>Portals &amp; Privacy</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#174B80] transition-transform ${
                    accountMenuOpen ? 'rotate-180 text-[#075FC7]' : ''
                  }`}
                />
              </button>

              {accountMenuOpen && (
                <div
                  id="wayfinder-account-menu"
                  role="menu"
                  aria-label="Account, privacy, and role portals"
                  className="absolute right-0 mt-2 w-80 rounded-2xl glass-dropdown p-3 z-50 space-y-3"
                >
                  {state.currentUser && (
                    <div className="p-3 rounded-xl glass-panel-subtle space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B2E56]">
                          {state.currentUser.fullName}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/60 border border-white/80 text-[#075FC7]">
                          {state.currentUser.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#315A7D] truncate">
                        {state.currentUser.email}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#174B80]">
                      Account &amp; Privacy
                    </div>
                    {accountPrivacyLinks.map((item) => {
                      const active = state.currentScreen === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitem"
                          onClick={() => handleSelectScreen(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer ${
                            active
                              ? 'bg-white/65 border border-white/85 text-[#0B2E56]'
                              : 'hover:bg-white/45 text-[#0B2E56]'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{item.icon}</div>
                          <div>
                            <div className="text-xs font-semibold text-[#0B2E56]">{item.label}</div>
                            <div className="text-[11px] text-[#123B63] leading-snug">
                              {item.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-white/60 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#174B80]">
                      Reviewer &amp; Institutional Portals
                    </div>
                    {rolePortalLinks.map((item) => {
                      const active = state.currentScreen === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitem"
                          onClick={() => handleSelectScreen(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer ${
                            active
                              ? 'bg-white/65 border border-white/85 text-[#0B2E56]'
                              : 'hover:bg-white/45 text-[#0B2E56]'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{item.icon}</div>
                          <div>
                            <div className="text-xs font-semibold text-[#0B2E56]">{item.label}</div>
                            <div className="text-[11px] text-[#123B63] leading-snug">
                              {item.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Authentication Controls */}
            {state.currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel-subtle text-xs font-semibold text-[#0B2E56]">
                  <span className="w-2 h-2 rounded-full bg-[#075FC7]" />
                  {state.currentUser.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setAccountMenuOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className="btn-liquid-secondary px-3.5 py-1.5 rounded-full text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7]"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#075FC7]" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectScreen('03_LOGIN')}
                  aria-current={state.currentScreen === '03_LOGIN' ? 'page' : undefined}
                  className="btn-liquid-secondary px-4 py-1.5 rounded-full text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7]"
                >
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectScreen('02_REGISTER')}
                  aria-current={state.currentScreen === '02_REGISTER' ? 'page' : undefined}
                  className="btn-liquid-primary px-4 py-1.5 rounded-full text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7]"
                >
                  <span>Get Started →</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="wayfinder-mobile-nav"
              className="lg:hidden btn-liquid-icon w-10 h-10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Contextual Sub-Navigation Bar */}
        {contextualSubItems.length > 0 && (
          <nav
            aria-label={`${activeGroup ? activeGroup.label : 'Account'} section navigation`}
            className="hidden sm:flex items-center gap-1.5 py-2 border-t border-white/50 flex-wrap relative z-10"
          >
            <span className="text-[11px] font-semibold text-[#174B80] mr-2">
              {activeGroup ? `${activeGroup.label}:` : 'Workspace:'}
            </span>
            {contextualSubItems.map((sub) => {
              const isSubActive = state.currentScreen === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectScreen(sub.id)}
                  aria-current={isSubActive ? 'page' : undefined}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer ${
                    isSubActive
                      ? 'bg-white/55 text-[#0B2E56] font-bold border border-white/85 shadow-2xs'
                      : 'text-[#123B63] hover:text-[#0B2E56] hover:bg-white/35 border border-transparent'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Responsive Mobile Navigation Drawer (High-Readability Translucent Glass) */}
      {mobileMenuOpen && (
        <nav
          id="wayfinder-mobile-nav"
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-white/65 glass-dropdown px-4 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto relative z-50"
        >
          <div className="space-y-1.5">
            <div className="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#174B80]">
              Navigation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRIMARY_NAV_GROUPS.map((group) => {
                const isActive = group.matchScreens.includes(state.currentScreen);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleSelectScreen(group.defaultScreen)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'tab-liquid-active text-[#0B2E56]'
                        : 'glass-panel-subtle text-[#0B2E56] hover:bg-white/45'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[#075FC7]">{group.icon}</span>
                      <span>{group.label}</span>
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-[#075FC7]">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {contextualSubItems.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/55">
              <div className="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#174B80]">
                {activeGroup ? `${activeGroup.label} Views` : 'Current Section Views'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contextualSubItems.map((sub) => {
                  const isSubActive = state.currentScreen === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectScreen(sub.id)}
                      aria-current={isSubActive ? 'page' : undefined}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isSubActive
                          ? 'tab-liquid-active text-[#0B2E56]'
                          : 'glass-panel-subtle text-[#0B2E56]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-white/55">
            <div className="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#174B80]">
              Account, Privacy &amp; Portals
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ACCOUNT_AND_PORTAL_LINKS.map((item) => {
                const active = state.currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectScreen(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'tab-liquid-active text-[#0B2E56]'
                        : 'glass-panel-subtle text-[#0B2E56] hover:bg-white/45'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/55 flex flex-wrap items-center justify-between gap-2">
            {state.currentUser ? (
              <>
                <div className="text-xs font-medium text-[#0B2E56]">
                  Signed in as <strong>{state.currentUser.fullName}</strong> (
                  {state.currentUser.role})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn-liquid-secondary px-4 py-2 rounded-full text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#075FC7]" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handleSelectScreen('03_LOGIN')}
                  className="btn-liquid-secondary py-2.5 px-4 rounded-full text-xs w-full"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#075FC7]" />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectScreen('02_REGISTER')}
                  className="btn-liquid-primary py-2.5 px-4 rounded-full text-xs w-full"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
