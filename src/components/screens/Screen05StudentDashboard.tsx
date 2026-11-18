import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { computeTargetReadinessReport } from '../../engine/readinessEngine';
import { RequirementStatusBadge } from '../common/StatusBadge';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';
import {
  Compass,
  Award,
  Activity,
  FileCheck,
  Briefcase,
  ArrowRight,
  AlertTriangle,
  Lock,
  UserPlus,
  PlusCircle,
  ShieldCheck,
  Home,
  GraduationCap,
  CheckSquare,
  User,
} from 'lucide-react';
import {
  LiquidButton,
  TactileProgressRing,
  TactileProgressBar,
} from '../common/LiquidGlassKit';

export const Screen05StudentDashboard: React.FC = () => {
  const { state, navigateTo, selectTarget } = useWayfinder();
  const user = state.currentUser;
  const activeTarget =
    state.targets.find((t) => t.id === state.selectedTargetId) || state.targets[0] || null;

  const assessedDimensionsCount = state.capabilityRecords.filter(
    (r) => r.demonstratedLevel !== null
  ).length;
  const selfClaimedDimensionsCount = state.capabilityRecords.filter(
    (r) => r.selfReportedLevel !== null
  ).length;
  const skillAssessmentsCount = state.skillAssessments?.length || 0;

  const report = activeTarget
    ? computeTargetReadinessReport(
        activeTarget,
        state.capabilityRecords,
        state.evidenceSubmissions,
        user
      )
    : null;

  const assessedRequirementsCount = report
    ? report.counts.DEMONSTRATED +
      report.counts.PARTIALLY_DEMONSTRATED +
      report.counts.DEVELOPMENT_NEEDED +
      report.counts.EVIDENCE_MISSING +
      report.counts.EVIDENCE_PENDING_REVIEW
    : 0;

  const demonstratedRatio =
    report && report.totalRequirements > 0
      ? Math.round((report.counts.DEMONSTRATED / report.totalRequirements) * 100)
      : 0;

  const sidebarItems = [
    {
      label: 'Dashboard',
      icon: Home,
      screen: '05_STUDENT_DASHBOARD' as const,
      active: true,
    },
    {
      label: 'Assessments',
      icon: CheckSquare,
      screen: '06_ASSESSMENT_HUB' as const,
      active: false,
    },
    {
      label: 'Opportunities',
      icon: Briefcase,
      screen: '12_OPPORTUNITY_DISCOVERY' as const,
      active: false,
    },
    {
      label: 'Readiness',
      icon: ShieldCheck,
      screen: '14_READINESS_GAP_ANALYSIS' as const,
      active: false,
    },
    {
      label: 'Learning Centre',
      icon: GraduationCap,
      screen: '15_LEARNING_CENTRE' as const,
      active: false,
    },
    {
      label: 'My Activities',
      icon: Activity,
      screen: '16_ACTIVITY_WORKSPACE' as const,
      active: false,
    },
    {
      label: 'Evidence Ledger',
      icon: FileCheck,
      screen: '17_EVIDENCE_LEDGER' as const,
      active: false,
    },
    {
      label: 'Job Market Intel',
      icon: Briefcase,
      screen: '23_JOB_MARKET_INTELLIGENCE' as const,
      active: false,
    },
    {
      label: 'Skill Intelligence',
      icon: Activity,
      screen: '24_SKILL_INTELLIGENCE' as const,
      active: false,
    },
    {
      label: 'Resume Builder',
      icon: Award,
      screen: '25_RESUME_BUILDER' as const,
      active: false,
    },
    {
      label: 'LinkedIn Support',
      icon: User,
      screen: '26_LINKEDIN_SUPPORT' as const,
      active: false,
    },
    {
      label: 'Market Updates',
      icon: Compass,
      screen: '27_STUDENT_UPDATES' as const,
      active: false,
    },
    {
      label: 'Privacy & Sharing',
      icon: Lock,
      screen: '20_PRIVACY_SHARING' as const,
      active: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR — High-Transparency Glass Sidebar */}
        <aside className="lg:col-span-3 glass-panel liquid-glow-bar rounded-[24px] p-4 flex flex-col justify-between lg:min-h-[680px]">
          <div className="space-y-6 relative z-10">
            {/* Sidebar Brand Header */}
            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#3489F8] to-[#2178EE] border border-white/65 flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-[#0B2E56]">
                WAYFINDER
              </span>
            </div>

            {/* Sidebar Navigation List */}
            <nav aria-label="Student workspace navigation" className="space-y-1">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigateTo(item.screen)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      item.active
                        ? 'tab-liquid-active text-[#0B2E56] font-bold'
                        : 'text-[#0B2E56]/80 hover:text-[#0B2E56] hover:bg-white/20'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${item.active ? 'text-[#2178EE]' : 'text-[#1A4678]'}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: Authenticated User or Guest Status */}
          <div className="mt-6 pt-4 border-t border-white/45 relative z-10">
            {user ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl glass-panel-subtle">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#2178EE]/25 border border-white/65 text-[#0B2E56] flex items-center justify-center font-display font-bold text-xs shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0B2E56] truncate">{user.fullName}</div>
                    <div className="text-[11px] text-[#1A4678] capitalize">{user.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
                  className="text-[11px] font-semibold text-[#1F68FF] hover:underline shrink-0 cursor-pointer"
                >
                  Passport
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl glass-panel-subtle space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B2E56]">
                  <User className="w-4 h-4 text-[#2178EE]" />
                  <span>Active Session</span>
                </div>
                <p className="text-[11px] text-[#0B2E56]/80 leading-snug">
                  Create an account to save your Capability Passport across sessions.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('02_REGISTER')}
                  className="text-xs font-semibold text-[#1F68FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Create Account <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN WORKSPACE COLUMN */}
        <div className="lg:col-span-9 space-y-6">
          {/* Greeting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2E56]">
                {user ? `Good morning, ${user.fullName}` : 'Welcome to Wayfinder'}
              </h1>
              <p className="text-xs sm:text-sm text-[#0B2E56]/85">
                Your journey to opportunity starts here.{' '}
                <span className="font-semibold text-[#1F68FF]">
                  Identify the gap. Build the capability. Prove it.
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!user && (
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  pill
                  onClick={() => navigateTo('02_REGISTER')}
                  icon={<UserPlus className="w-3.5 h-3.5 text-[#2178EE]" />}
                >
                  Create Account
                </LiquidButton>
              )}
              <LiquidButton
                variant="secondary"
                size="sm"
                pill
                onClick={() => navigateTo('04_ONBOARDING_CONSENT')}
                icon={<ShieldCheck className="w-3.5 h-3.5 text-[#2178EE]" />}
              >
                Eligibility &amp; Consent
              </LiquidButton>
            </div>
          </div>

          {/* YOUR READINESS OVERVIEW HERO CARD — High-Transparency Glass + Aqua Mountain SVG */}
          <div className="glass-panel liquid-glow-bar rounded-[24px] p-6 space-y-6 relative overflow-hidden">
            {/* Decorative Translucent Aqua Mountain / Wave Header Illustration */}
            <svg
              aria-hidden="true"
              viewBox="0 0 500 130"
              className="hidden sm:block absolute top-0 right-0 w-[360px] h-[120px] pointer-events-none opacity-85"
            >
              <defs>
                <linearGradient id="aquaWave1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#8DBDFF" stopOpacity="0.32" />
                </linearGradient>
                <linearGradient id="aquaWave2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E5FAFF" stopOpacity="0.52" />
                  <stop offset="100%" stopColor="#2178EE" stopOpacity="0.28" />
                </linearGradient>
              </defs>
              <path
                d="M120,120 L210,45 L290,95 L380,25 L470,85 L500,65 L500,130 L120,130 Z"
                fill="url(#aquaWave1)"
              />
              <path
                d="M190,125 L275,60 L345,100 L425,40 L500,95 L500,130 L190,130 Z"
                fill="url(#aquaWave2)"
              />
            </svg>

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#0B2E56]">
                  Your Readiness Overview
                </h2>
                <p className="text-xs text-[#0B2E56]/80">
                  Track your progress across all key capability areas ({assessedDimensionsCount}/10
                  core dimensions assessed).
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
                  className="pt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1F68FF] hover:underline cursor-pointer"
                >
                  View details <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="px-3 py-1 rounded-full glass-floating text-[11px] font-mono font-semibold text-[#1F68FF]">
                CLAIM ≠ CAPABILITY ≠ PROOF
              </span>
            </div>

            {/* 4 Translucent Glass Sub-Cards */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Sub-Card 1: Interest / RIASEC */}
              <button
                type="button"
                onClick={() => navigateTo('07_RIASEC_ASSESSMENT')}
                className="glass-panel-interactive rounded-2xl p-4 text-left space-y-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full glass-floating flex items-center justify-center text-[#1F68FF]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#0B2E56]">Interest</div>
                  <div className="text-xs text-[#1A4678]">RIASEC</div>
                </div>
                <div>
                  {state.riasecResult ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5FAFF]/50 text-[#0B2E56] border border-white/75">
                      Complete ({state.riasecResult.topThreeCode})
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/25 text-[#1F68FF] border border-white/60">
                      Not Yet Completed
                    </span>
                  )}
                </div>
              </button>

              {/* Sub-Card 2: Aptitude & Knowledge */}
              <button
                type="button"
                onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
                className="glass-panel-interactive rounded-2xl p-4 text-left space-y-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full glass-floating flex items-center justify-center text-[#1F68FF]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#0B2E56]">Aptitude</div>
                  <div className="text-xs text-[#1A4678]">&amp; Knowledge</div>
                </div>
                <div>
                  {assessedDimensionsCount > 0 ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DDF2FF]/45 text-[#1F68FF] border border-white/70">
                      {assessedDimensionsCount} / 10 Assessed
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/25 text-[#1F68FF] border border-white/60">
                      0 / 10 Assessed
                    </span>
                  )}
                </div>
              </button>

              {/* Sub-Card 3: Skills & Competencies */}
              <button
                type="button"
                onClick={() => navigateTo('06_ASSESSMENT_HUB')}
                className="glass-panel-interactive rounded-2xl p-4 text-left space-y-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full glass-floating flex items-center justify-center text-[#1F68FF]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#0B2E56]">Skills</div>
                  <div className="text-xs text-[#1A4678]">&amp; Competencies</div>
                </div>
                <div>
                  {skillAssessmentsCount > 0 || selfClaimedDimensionsCount > 0 ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5FAFF]/50 text-[#0B2E56] border border-white/75">
                      {skillAssessmentsCount} Verified • {selfClaimedDimensionsCount} Claimed
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/25 text-[#0B2E56] border border-white/60">
                      Needs Assessment
                    </span>
                  )}
                </div>
              </button>

              {/* Sub-Card 4: Evidence & Review */}
              <button
                type="button"
                onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                className="glass-panel-interactive rounded-2xl p-4 text-left space-y-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full glass-floating flex items-center justify-center text-[#1F68FF]">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold text-[#0B2E56]">Evidence</div>
                  <div className="text-xs text-[#1A4678]">&amp; Review</div>
                </div>
                <div>
                  {state.evidenceSubmissions.length > 0 ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5FAFF]/50 text-[#0B2E56] border border-white/75">
                      {state.evidenceSubmissions.length} Submitted
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-[#1A4678] border border-white/55">
                      No Evidence Yet
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS ROW */}
          <div className="space-y-3">
            <h2 className="font-display text-base font-bold text-[#0B2E56]">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => navigateTo('06_ASSESSMENT_HUB')}
                className="glass-panel-interactive rounded-2xl p-4 flex items-center gap-3.5 text-left cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full glass-floating text-[#1F68FF] flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                    Start Assessment
                  </div>
                  <div className="text-[11px] text-[#1A4678] truncate">Continue your journey</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                className="glass-panel-interactive rounded-2xl p-4 flex items-center gap-3.5 text-left cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full glass-floating text-[#1F68FF] flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                    Explore Opportunities
                  </div>
                  <div className="text-[11px] text-[#1A4678] truncate">Find suitable matches</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
                className="glass-panel-interactive rounded-2xl p-4 flex items-center gap-3.5 text-left cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full glass-floating text-[#1F68FF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                    View Capability Passport
                  </div>
                  <div className="text-[11px] text-[#1A4678] truncate">See your current profile</div>
                </div>
              </button>
            </div>
          </div>

          {/* BOTTOM TWO-COLUMN SPLIT — Upcoming Activities & Target Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upcoming Activities */}
            <div className="lg:col-span-6 glass-panel rounded-[24px] p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold text-[#0B2E56]">
                    Upcoming Activities
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateTo('16_ACTIVITY_WORKSPACE')}
                    className="text-xs font-semibold text-[#1F68FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {state.activities.length === 0 ? (
                  <div className="p-5 rounded-2xl glass-panel-subtle text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl glass-floating text-[#1F68FF] flex items-center justify-center mx-auto">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-display text-xs font-bold text-[#0B2E56]">
                        No Active Development Tasks Yet
                      </div>
                      <p className="text-[11px] text-[#0B2E56]/80 leading-relaxed">
                        Generate gap-linked development tasks from an opportunity readiness analysis
                        or add a learning resource from the Learning Hub.
                      </p>
                    </div>
                    <LiquidButton
                      variant="secondary"
                      size="sm"
                      pill
                      onClick={() => navigateTo('15_LEARNING_CENTRE')}
                    >
                      Open Learning Centre
                    </LiquidButton>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {state.activities.slice(0, 4).map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => navigateTo('16_ACTIVITY_WORKSPACE')}
                        className="w-full p-3.5 rounded-2xl glass-panel-interactive flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl glass-floating text-[#1F68FF] flex items-center justify-center shrink-0">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#0B2E56] truncate">
                              {act.title}
                            </div>
                            <div className="text-[11px] text-[#1A4678] truncate">
                              {getCapabilityDimensionName(act.linkedDimensionId)} • Status:{' '}
                              {act.status}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#1F68FF] shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/45 flex items-center justify-between text-[11px] text-[#1A4678] relative z-10">
                <span>Development tasks link directly to evidence submission</span>
                <button
                  type="button"
                  onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                  className="text-[#1F68FF] font-semibold hover:underline cursor-pointer"
                >
                  Evidence Ledger →
                </button>
              </div>
            </div>

            {/* Right Column: Target Opportunities & Readiness */}
            <div className="lg:col-span-6 glass-panel rounded-[24px] p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold text-[#0B2E56]">
                    Target Opportunities
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                    className="text-xs font-semibold text-[#1F68FF] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {!activeTarget || !report ? (
                  <div className="p-5 rounded-2xl glass-panel-subtle text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl glass-floating text-[#1F68FF] flex items-center justify-center mx-auto">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-display text-xs font-bold text-[#0B2E56]">
                        No Target Opportunity Selected Yet
                      </div>
                      <p className="text-[11px] text-[#0B2E56]/80 leading-relaxed">
                        Choose or create a target opportunity to compare your current skill levels
                        against each requirement.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <LiquidButton
                        variant="primary"
                        size="sm"
                        pill
                        onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                        icon={<PlusCircle className="w-3.5 h-3.5" />}
                      >
                        Explore Opportunities
                      </LiquidButton>
                      <LiquidButton
                        variant="secondary"
                        size="sm"
                        pill
                        onClick={() => navigateTo('06_ASSESSMENT_HUB')}
                      >
                        Take Assessment
                      </LiquidButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Opportunity Card */}
                    <div className="p-4 rounded-2xl glass-panel-subtle space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl glass-floating text-[#1F68FF] flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/30 border border-white/60 text-[#1F68FF]">
                              {activeTarget.category.replace('_', ' ')}
                            </span>
                            <h3 className="font-display text-sm font-bold text-[#0B2E56] mt-0.5">
                              {activeTarget.title}
                            </h3>
                            <p className="text-[11px] text-[#1A4678]">
                              {activeTarget.organizationLabel}
                            </p>
                          </div>
                        </div>

                        {state.targets.length > 1 && (
                          <select
                            aria-label="Select active target opportunity"
                            value={activeTarget.id}
                            onChange={(e) => selectTarget(e.target.value)}
                            className="select-liquid rounded-lg px-2 py-1 text-[11px] font-mono"
                          >
                            {state.targets.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Capability Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {activeTarget.requirements.slice(0, 3).map((req) => (
                          <span
                            key={req.id}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold glass-floating text-[#0B2E56]"
                          >
                            {getCapabilityDimensionName(req.dimensionId)}
                          </span>
                        ))}
                      </div>

                      {/* Readiness Summary Ring + Progress */}
                      <div className="pt-2 border-t border-white/45 flex items-center justify-between gap-3">
                        <TactileProgressRing
                          value={demonstratedRatio}
                          size={52}
                          label={`${report.counts.DEMONSTRATED}/${report.totalRequirements}`}
                          sublabel="Met"
                          accent="cyan"
                        />
                        <div className="flex-1">
                          <TactileProgressBar
                            value={Math.round(
                              (assessedRequirementsCount / Math.max(1, report.totalRequirements)) *
                                100
                            )}
                            label="Assessed"
                            rightLabel={`${assessedRequirementsCount}/${report.totalRequirements}`}
                            accent="cyan"
                            showThumb={false}
                          />
                        </div>
                      </div>

                      {!report.allMandatoryConditionsMet && (
                        <div className="p-2.5 rounded-xl glass-floating flex items-center justify-between gap-2 text-[11px] text-[#0B2E56]">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#1F68FF] shrink-0" />
                            {report.unmetMandatoryConditionsCount} eligibility condition(s) unconfirmed
                          </span>
                          <button
                            type="button"
                            onClick={() => navigateTo('04_ONBOARDING_CONSENT')}
                            className="font-semibold text-[#1F68FF] underline cursor-pointer"
                          >
                            Review
                          </button>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => navigateTo('13_OPPORTUNITY_DETAIL')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full glass-floating text-[#1F68FF] text-xs font-semibold hover:bg-[#2178EE] hover:text-white transition-all cursor-pointer"
                        >
                          View details <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
                          className="text-xs font-semibold text-[#1F68FF] hover:underline cursor-pointer"
                        >
                          Gap Analysis →
                        </button>
                      </div>
                    </div>

                    {/* Compact Requirement Breakdown List */}
                    <div className="space-y-2">
                      {report.requirementEvaluations.slice(0, 3).map((ev) => (
                        <div
                          key={ev.requirement.id}
                          className="p-2.5 rounded-xl glass-panel-subtle flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#0B2E56] truncate">
                              {ev.dimensionName}
                            </div>
                            <div className="text-[10px] font-mono text-[#1A4678]">
                              Target Lvl {ev.requiredLevel} • Current:{' '}
                              {ev.demonstratedLevel !== null
                                ? `Lvl ${ev.demonstratedLevel}`
                                : 'Unassessed'}
                            </div>
                          </div>
                          <RequirementStatusBadge status={ev.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
