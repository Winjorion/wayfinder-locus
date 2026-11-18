import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  ShieldCheck,
  Target,
  FileCheck2,
  ArrowRight,
  Layers,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Building2,
  Compass,
  Search,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import {
  LiquidButton,
  LiquidCard,
  TactileProgressRing,
} from '../common/LiquidGlassKit';

export const Screen01Landing: React.FC = () => {
  const { state, navigateTo } = useWayfinder();

  const assessedDimensionsCount = state.capabilityRecords.filter(
    (r) => r.demonstratedLevel !== null
  ).length;
  const totalDimensionsCount = state.capabilityRecords.length;
  const coveragePct =
    totalDimensionsCount > 0
      ? Math.round((assessedDimensionsCount / totalDimensionsCount) * 100)
      : 0;

  const featurePillars = [
    {
      title: 'Explore Opportunities',
      desc: 'Find the right paths for your interests and goals across 18 fields.',
      icon: Search,
      screen: '12_OPPORTUNITY_DISCOVERY' as const,
    },
    {
      title: 'Assess Your Skills',
      desc: 'Understand your strengths and areas for growth with structured assessments.',
      icon: Sparkles,
      screen: '06_ASSESSMENT_HUB' as const,
    },
    {
      title: 'Track Your Progress',
      desc: 'Build evidence, close requirement gaps, and see your development.',
      icon: TrendingUp,
      screen: '14_READINESS_GAP_ANALYSIS' as const,
    },
    {
      title: 'Unlock Your Future',
      desc: "Be ready for what's next with a student-owned Capability Passport.",
      icon: ShieldCheck,
      screen: '11_CAPABILITY_PASSPORT' as const,
    },
  ];

  const coreJourneyStages = [
    {
      label: '1. ASSESS',
      desc: 'Assess interests, aptitude & field skills',
      screen: '06_ASSESSMENT_HUB' as const,
    },
    {
      label: '2. UNDERSTAND',
      desc: 'Separate self-reported claims from capability',
      screen: '11_CAPABILITY_PASSPORT' as const,
    },
    {
      label: '3. MAP',
      desc: 'Explore Job Market & Skill Intelligence',
      screen: '23_JOB_MARKET_INTELLIGENCE' as const,
    },
    {
      label: '4. IDENTIFY GAPS',
      desc: 'Compare demonstrated levels vs requirements',
      screen: '14_READINESS_GAP_ANALYSIS' as const,
    },
    {
      label: '5. DEVELOP',
      desc: 'Build skills in the Learning Hub & Library',
      screen: '15_LEARNING_CENTRE' as const,
    },
    {
      label: '6. APPLY',
      desc: 'Tailor Resume & align LinkedIn profile',
      screen: '25_RESUME_BUILDER' as const,
    },
    {
      label: '7. RECEIVE FEEDBACK',
      desc: 'Submit work artifacts for reviewer proof',
      screen: '17_EVIDENCE_LEDGER' as const,
    },
    {
      label: '8. GROW',
      desc: 'Track verified capability growth over time',
      screen: '19_HISTORICAL_SNAPSHOTS' as const,
    },
    {
      label: '9. REMAP',
      desc: 'Monitor market & skill updates for next targets',
      screen: '27_STUDENT_UPDATES' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* HERO SECTION — High-Transparency Glassmorphism + Illuminated Edges */}
      <section className="glass-panel liquid-glow-bar rounded-[28px] p-7 sm:p-12 relative overflow-hidden">
        {/* Ambient Electric-Blue & Soft Cyan Reflections */}
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-[#E5FAFF]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-[#1F68FF]/15 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute top-12 right-[38%] w-7 h-7 aqua-drop pointer-events-none opacity-85" />
        <div className="hidden lg:block absolute top-28 right-10 w-9 h-9 aqua-drop pointer-events-none opacity-80" />
        <div className="hidden lg:block absolute bottom-16 right-[44%] w-5 h-5 aqua-drop pointer-events-none opacity-75" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-display font-bold uppercase tracking-[0.14em] text-[#1F68FF]">
                OPPORTUNITY READINESS PLATFORM
              </div>
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium px-3 py-1 rounded-full glass-floating text-[#0B2E56]">
                  Don&apos;t just find opportunities. Become ready for them.
                </span>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full glass-floating text-[#1F68FF]">
                  CLAIM ≠ CAPABILITY ≠ PROOF
                </span>
              </div>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#0B2E56] leading-[1.12]">
              Identify the gap.
              <span className="block text-[#1F68FF]">Build the capability.</span>
              <span className="block text-[#0B2E56]">Prove it.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#0B2E56]/85 leading-relaxed max-w-xl">
              Discover opportunities, develop your skills across 18 fields, and build verified
              evidence of what you can do.
            </p>

            {/* Primary & Secondary Neo-Tactile Capsule CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <LiquidButton
                variant="primary"
                size="lg"
                pill
                onClick={() =>
                  navigateTo(
                    state.currentUser ? '05_STUDENT_DASHBOARD' : '14_READINESS_GAP_ANALYSIS'
                  )
                }
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </LiquidButton>

              <LiquidButton
                variant="secondary"
                size="lg"
                pill
                onClick={() => navigateTo('06_ASSESSMENT_HUB')}
              >
                Learn More
              </LiquidButton>
            </div>

            {/* Subtle Live Session Readiness Indicator */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#1A4678]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B2E56]">
                <CheckCircle2 className="w-4 h-4 text-[#2178EE]" />
                {assessedDimensionsCount}/{totalDimensionsCount} core capabilities assessed
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigateTo('15_LEARNING_CENTRE')}
                className="text-[#1F68FF] font-semibold hover:underline cursor-pointer"
              >
                Explore 18 Fields &amp; Learning Hub →
              </button>
            </div>
          </div>

          {/* Right Hero Visual: High-Transparency Glass Compass & Layered Stepped Pedestal */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[340px] sm:min-h-[380px]">
            <div className="relative w-full max-w-[460px] h-[350px] flex items-center justify-center">
              {/* Outer Translucent Glass Pedestal Ring */}
              <div className="absolute bottom-2 inset-x-4 h-36 rounded-[36px] glass-panel-subtle border border-white/65 shadow-[0_24px_48px_-14px_rgba(11,46,86,0.22),inset_0_2px_4px_rgba(255,255,255,0.65)]" />
              {/* Middle Translucent Glass Pedestal Step */}
              <div className="absolute bottom-12 inset-x-12 h-32 rounded-[32px] glass-panel border border-white/75 shadow-[0_18px_36px_-10px_rgba(31,104,255,0.22),inset_0_2px_4px_rgba(255,255,255,0.75)]" />
              {/* Upper Translucent Glass Pedestal Step */}
              <div className="absolute bottom-24 w-56 h-24 rounded-[28px] glass-floating border border-white/80 shadow-[0_12px_28px_-8px_rgba(31,104,255,0.25)]" />

              {/* Central 3D Luminous Glass Compass Sphere */}
              <div className="relative z-10 -mt-16 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-[#E5FAFF]/70 via-[#2178EE]/85 to-[#0B2E56]/90 p-3 border border-white/80 shadow-[0_22px_48px_-8px_rgba(31,104,255,0.48),inset_0_3px_8px_rgba(255,255,255,0.85)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#E5FAFF]/80 via-[#8DBDFF]/65 to-[#2178EE]/75 backdrop-blur-xl border-2 border-white/85 shadow-inner flex items-center justify-center relative overflow-hidden">
                  <div className="absolute -top-6 -left-6 w-24 h-16 rounded-full bg-white/70 blur-md rotate-[-20deg]" />
                  <div className="absolute inset-2 rounded-full border border-white/55" />
                  <Compass className="w-16 h-16 text-white drop-shadow-[0_4px_10px_rgba(11,46,86,0.35)] relative z-10" />
                </div>
              </div>

              {/* Floating Glass Pill 1: Discover */}
              <button
                type="button"
                onClick={() => navigateTo('12_OPPORTUNITY_DISCOVERY')}
                className="absolute top-36 left-4 sm:left-8 z-20 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full glass-floating hover:border-white hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-[#2178EE]/20 border border-white/60 text-[#1F68FF] flex items-center justify-center">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                  Discover
                </span>
              </button>

              {/* Floating Glass Pill 2: Develop */}
              <button
                type="button"
                onClick={() => navigateTo('15_LEARNING_CENTRE')}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full glass-floating hover:border-white hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-[#2178EE]/20 border border-white/60 text-[#1F68FF] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                  Develop
                </span>
              </button>

              {/* Floating Glass Pill 3: Prove */}
              <button
                type="button"
                onClick={() => navigateTo('17_EVIDENCE_LEDGER')}
                className="absolute bottom-6 right-4 sm:right-8 z-20 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full glass-floating hover:border-white hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-[#2178EE]/20 border border-white/60 text-[#1F68FF] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="font-display text-xs sm:text-sm font-bold text-[#0B2E56]">
                  Prove
                </span>
              </button>

              {/* Floating Glass Shield Badge on Right */}
              <div className="hidden sm:flex absolute top-28 right-8 z-20 w-11 h-11 rounded-2xl glass-floating items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#1F68FF]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 FEATURE PILLAR CARDS — High-Transparency Glass Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {featurePillars.map((pillar) => {
          const IconComponent = pillar.icon;
          return (
            <div
              key={pillar.title}
              onClick={() => navigateTo(pillar.screen)}
              className="glass-panel-interactive rounded-[22px] p-6 flex flex-col justify-between min-h-[210px] cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl glass-floating flex items-center justify-center text-[#1F68FF] group-hover:bg-white/30 transition-colors">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-display text-base font-bold text-[#0B2E56] group-hover:text-[#1F68FF] transition-colors">
                    {pillar.title}
                  </h2>
                  <p className="text-xs text-[#0B2E56]/80 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>

              <div className="pt-5 flex items-center justify-between">
                <span className="w-8 h-8 rounded-full glass-floating text-[#1F68FF] flex items-center justify-center group-hover:bg-[#2178EE] group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* 6-Stage Core Readiness Journey Strip */}
      <section className="glass-panel rounded-[24px] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1F68FF]">
              THE WAYFINDER CORE READINESS JOURNEY
            </span>
            <h2 className="font-display text-xl font-bold text-[#0B2E56] mt-0.5">
              Know what you&apos;re ready for. Discover what it takes to go further.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <TactileProgressRing
              value={coveragePct}
              size={56}
              label={`${assessedDimensionsCount}/${totalDimensionsCount}`}
              sublabel="Assessed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 relative z-10">
          {coreJourneyStages.map((stage, idx) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => navigateTo(stage.screen)}
              className="p-4 rounded-2xl glass-panel-subtle hover:bg-white/25 hover:border-white/75 transition-all text-left flex flex-col justify-between gap-2.5 group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/25 border border-white/55 text-[#1F68FF]">
                  0{idx + 1}
                </span>
                {idx < coreJourneyStages.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#2178EE] opacity-80 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
              <div>
                <div className="font-mono text-[11px] font-bold text-[#0B2E56] group-hover:text-[#1F68FF] leading-snug">
                  {stage.label}
                </div>
                <p className="text-[11px] text-[#0B2E56]/80 mt-1 leading-snug">{stage.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Core Product Principle: Claim ≠ Capability ≠ Proof */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1F68FF]">
              Governing Principle
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0B2E56] mt-1">
              CLAIM <span className="text-[#2178EE]">≠</span> CAPABILITY{' '}
              <span className="text-[#1F68FF]">≠</span> PROOF
            </h2>
          </div>
          <span className="text-xs text-[#1A4678]">
            Enforced across all capability areas, field skills, and target opportunities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <LiquidCard stacked glowBar accent="blue" className="p-6 space-y-3">
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-semibold px-3 py-1 rounded-full glass-floating text-[#0B2E56]">
                1. Claim (Self-Report &amp; Interests)
              </span>
              <AlertTriangle className="w-5 h-5 text-[#1F68FF]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0B2E56] relative z-10">
              What You State About Yourself
            </h3>
            <p className="text-sm text-[#0B2E56]/85 leading-relaxed relative z-10">
              Includes your RIASEC career interests, self-rated skills, and unverified certificates
              or project descriptions. Useful for career exploration, but{' '}
              <strong className="text-[#0B2E56]">
                never treated as demonstrated capability or verified proof
              </strong>
              .
            </p>
          </LiquidCard>

          <LiquidCard stacked glowBar accent="cyan" className="p-6 space-y-3">
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-semibold px-3 py-1 rounded-full glass-floating text-[#1F68FF]">
                2. Capability (Demonstrated Skill)
              </span>
              <Target className="w-5 h-5 text-[#2178EE]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0B2E56] relative z-10">
              What You Demonstrate on Structured Rubrics
            </h3>
            <p className="text-sm text-[#0B2E56]/85 leading-relaxed relative z-10">
              Established through objective domain assessments and reviewer-verified work on a 0–4
              behavioral rubric. Capabilities you have not assessed yet remain marked as{' '}
              <strong className="text-[#1F68FF]">unknown / needing more information</strong>—never
              zero.
            </p>
          </LiquidCard>

          <LiquidCard stacked glowBar accent="blue" className="p-6 space-y-3">
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-semibold px-3 py-1 rounded-full glass-floating text-[#0B2E56]">
                3. Proof (Reviewer-Verified Evidence)
              </span>
              <FileCheck2 className="w-5 h-5 text-[#2178EE]" />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0B2E56] relative z-10">
              Credible Artifacts Evaluated Against Criteria
            </h3>
            <p className="text-sm text-[#0B2E56]/85 leading-relaxed relative z-10">
              Source repositories, technical specifications, and project deliverables evaluated by
              an assigned reviewer across relevance, authenticity, sufficiency, quality, currency,
              and context.
            </p>
          </LiquidCard>
        </div>
      </section>

      {/* Competitive Positioning — How WAYFINDER Complements Existing Systems */}
      <section className="glass-panel rounded-[24px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1F68FF]">
              Why Opportunity Readiness Intelligence
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0B2E56]">
              Built to Complement Listing Portals, Campus Systems &amp; Assessments
            </h2>
            <p className="text-xs sm:text-sm text-[#0B2E56]/85 max-w-3xl leading-relaxed">
              Traditional platforms help students find listings, submit applications, or take
              isolated tests. WAYFINDER connects the entire readiness loop between a student&apos;s
              current capabilities and the exact requirements of a target opportunity.
            </p>
          </div>
          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('21_INSTITUTION_DASHBOARD')}
            icon={<Building2 className="w-4 h-4 text-[#2178EE]" />}
          >
            Institution &amp; Employer View
          </LiquidButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs relative z-10">
          {[
            {
              category: 'Opportunity & Competition Portals',
              theirFocus:
                'List hackathons, challenges, and job postings to drive application volume.',
              wayfinderValue:
                'Evaluates whether you meet each requirement before you apply, surfaces missing evidence, and shows transparent opportunity verification status.',
            },
            {
              category: 'Campus Recruitment Systems',
              theirFocus:
                'Manage placement schedules, eligibility filters, and resume submissions.',
              wayfinderValue:
                'Gives students a longitudinal Capability Passport and gives institutions privacy-preserving cohort gap analytics (minimum 5 students per group).',
            },
            {
              category: 'Internship & Job Boards',
              theirFocus: 'Match keywords on self-reported resumes against job descriptions.',
              wayfinderValue:
                'Separates self-reported claims from demonstrated capability and reviewer-verified proof so readiness is never based on keyword inflation.',
            },
            {
              category: 'Standalone Assessment Tools',
              theirFocus:
                'Deliver one-off test scores without connecting them to specific target roles.',
              wayfinderValue:
                'Maps objective assessments and reviewed work onto a shared rubric and turns requirement gaps directly into actionable development plans.',
            },
          ].map((comp) => (
            <div
              key={comp.category}
              className="p-5 rounded-2xl glass-panel-subtle flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="font-display text-sm font-bold text-[#0B2E56]">{comp.category}</div>
                <div className="p-2.5 rounded-xl glass-floating text-[#1A4678]">
                  <strong className="text-[#0B2E56] block mb-0.5">Standard Focus:</strong>
                  {comp.theirFocus}
                </div>
              </div>
              <div className="p-3 rounded-xl glass-floating text-[#0B2E56]">
                <strong className="text-[#1F68FF] block mb-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2178EE]" /> WAYFINDER Readiness Layer:
                </strong>
                <span className="text-[#0B2E56]/85 leading-relaxed">{comp.wayfinderValue}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step-by-Step Opportunity Readiness Workflow */}
      <section className="glass-panel rounded-[24px] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B2E56] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#2178EE]" /> Step-by-Step Opportunity Readiness
              Workflow
            </h2>
            <p className="text-xs text-[#1A4678] mt-1">
              Move from initial capability discovery and gap identification to focused development
              and verified evidence.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#1F68FF] font-semibold">
            <ShieldCheck className="w-4 h-4" /> Identify the gap. Build the capability. Prove it.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs relative z-10">
          {[
            {
              id: '06_ASSESSMENT_HUB',
              step: 'Step 01',
              label: 'Assessments & Baseline',
              desc: 'Explore your career interests, take objective domain and field skill assessments, and record self-ratings.',
            },
            {
              id: '11_CAPABILITY_PASSPORT',
              step: 'Step 02',
              label: 'Student-Owned Capability Passport',
              desc: 'Manage your profile, projects, internships, and certificates while keeping claims separate from verified proof.',
            },
            {
              id: '12_OPPORTUNITY_DISCOVERY',
              step: 'Step 03',
              label: 'Opportunities & Verification Layer',
              desc: 'Browse opportunities or define a target with transparent source, requirement, and deadline verification.',
            },
            {
              id: '14_READINESS_GAP_ANALYSIS',
              step: 'Step 04',
              label: 'Readiness & Requirement Gaps',
              desc: 'Compare demonstrated capabilities against each requirement, see acceptable evidence, and add gap actions.',
            },
            {
              id: '15_LEARNING_CENTRE',
              step: 'Step 05',
              label: 'Field & Skill Library + Learning Hub',
              desc: 'Access curated courses, official documentation, and gap-linked activities across 18 fields.',
            },
            {
              id: '17_EVIDENCE_LEDGER',
              step: 'Step 06',
              label: 'Evidence & Readiness Review',
              desc: 'Upload deliverables or repository links for structured evaluation by an assigned reviewer.',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id as any)}
              className="text-left p-5 rounded-2xl glass-panel-interactive text-[#0B2E56] flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold text-[#1F68FF] uppercase px-2.5 py-0.5 rounded-full glass-floating">
                  {item.step}
                </span>
                <div className="font-display font-bold text-sm text-[#0B2E56] group-hover:text-[#1F68FF] transition-colors">
                  {item.label}
                </div>
                <p className="text-xs text-[#0B2E56]/80 leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/45 text-xs font-semibold text-[#1F68FF]">
                <span>Open Section</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
