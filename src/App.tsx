import React from 'react';
import { WayfinderProvider, useWayfinder } from './context/WayfinderContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Home, Activity, Briefcase, BookOpen, FileCheck } from 'lucide-react';

import { Screen01Landing } from './components/screens/Screen01Landing';
import { Screen02Register } from './components/screens/Screen02Register';
import { Screen03Login } from './components/screens/Screen03Login';
import { Screen04OnboardingConsent } from './components/screens/Screen04OnboardingConsent';
import { Screen05StudentDashboard } from './components/screens/Screen05StudentDashboard';
import { Screen06AssessmentHub } from './components/screens/Screen06AssessmentHub';
import { Screen07RiasecAssessment } from './components/screens/Screen07RiasecAssessment';
import { Screen08AptitudeAssessment } from './components/screens/Screen08AptitudeAssessment';
import { Screen09SkillRubricAssessment } from './components/screens/Screen09SkillRubricAssessment';
import { Screen10AssessmentResults } from './components/screens/Screen10AssessmentResults';
import { Screen11CapabilityPassport } from './components/screens/Screen11CapabilityPassport';
import { Screen12OpportunityDiscovery } from './components/screens/Screen12OpportunityDiscovery';
import { Screen13OpportunityDetail } from './components/screens/Screen13OpportunityDetail';
import { Screen14ReadinessGapAnalysis } from './components/screens/Screen14ReadinessGapAnalysis';
import { Screen15LearningCentre } from './components/screens/Screen15LearningCentre';
import { Screen16ActivityWorkspace } from './components/screens/Screen16ActivityWorkspace';
import { Screen17EvidenceLedger } from './components/screens/Screen17EvidenceLedger';
import { Screen18ReviewerWorkspace } from './components/screens/Screen18ReviewerWorkspace';
import { Screen19HistoricalSnapshots } from './components/screens/Screen19HistoricalSnapshots';
import { Screen20PrivacySharing } from './components/screens/Screen20PrivacySharing';
import { Screen21InstitutionDashboard } from './components/screens/Screen21InstitutionDashboard';
import { Screen22EdgeStates } from './components/screens/Screen22EdgeStates';
import { Screen23JobMarketIntelligence } from './components/screens/Screen23JobMarketIntelligence';
import { Screen24SkillIntelligence } from './components/screens/Screen24SkillIntelligence';
import { Screen25ResumeBuilder } from './components/screens/Screen25ResumeBuilder';
import { Screen26LinkedInSupport } from './components/screens/Screen26LinkedInSupport';
import { Screen27StudentUpdates } from './components/screens/Screen27StudentUpdates';
import { Screen28AdminIntelligence } from './components/screens/Screen28AdminIntelligence';

const ScreenRouter: React.FC = () => {
  const { state } = useWayfinder();

  switch (state.currentScreen) {
    case '01_LANDING':
      return <Screen01Landing />;
    case '02_REGISTER':
      return <Screen02Register />;
    case '03_LOGIN':
      return <Screen03Login />;
    case '04_ONBOARDING_CONSENT':
      return <Screen04OnboardingConsent />;
    case '05_STUDENT_DASHBOARD':
      return <Screen05StudentDashboard />;
    case '06_ASSESSMENT_HUB':
      return <Screen06AssessmentHub />;
    case '07_RIASEC_ASSESSMENT':
      return <Screen07RiasecAssessment />;
    case '08_APTITUDE_ASSESSMENT':
      return <Screen08AptitudeAssessment />;
    case '09_SKILL_RUBRIC_ASSESSMENT':
      return <Screen09SkillRubricAssessment />;
    case '10_ASSESSMENT_RESULTS':
      return <Screen10AssessmentResults />;
    case '11_CAPABILITY_PASSPORT':
      return <Screen11CapabilityPassport />;
    case '12_OPPORTUNITY_DISCOVERY':
      return <Screen12OpportunityDiscovery />;
    case '13_OPPORTUNITY_DETAIL':
      return <Screen13OpportunityDetail />;
    case '14_READINESS_GAP_ANALYSIS':
      return <Screen14ReadinessGapAnalysis />;
    case '15_LEARNING_CENTRE':
      return <Screen15LearningCentre />;
    case '16_ACTIVITY_WORKSPACE':
      return <Screen16ActivityWorkspace />;
    case '17_EVIDENCE_LEDGER':
      return <Screen17EvidenceLedger />;
    case '18_REVIEWER_WORKSPACE':
      return <Screen18ReviewerWorkspace />;
    case '19_HISTORICAL_SNAPSHOTS':
      return <Screen19HistoricalSnapshots />;
    case '20_PRIVACY_SHARING':
      return <Screen20PrivacySharing />;
    case '21_INSTITUTION_DASHBOARD':
      return <Screen21InstitutionDashboard />;
    case '22_EDGE_STATES':
      return <Screen22EdgeStates />;
    case '23_JOB_MARKET_INTELLIGENCE':
      return <Screen23JobMarketIntelligence />;
    case '24_SKILL_INTELLIGENCE':
      return <Screen24SkillIntelligence />;
    case '25_RESUME_BUILDER':
      return <Screen25ResumeBuilder />;
    case '26_LINKEDIN_SUPPORT':
      return <Screen26LinkedInSupport />;
    case '27_STUDENT_UPDATES':
      return <Screen27StudentUpdates />;
    case '28_ADMIN_INTELLIGENCE':
      return <Screen28AdminIntelligence />;
    default:
      return <Screen01Landing />;
  }
};

const MobileBottomGlassNav: React.FC = () => {
  const { state, navigateTo } = useWayfinder();

  const items = [
    {
      label: 'Home',
      screen: '05_STUDENT_DASHBOARD' as const,
      match: ['01_LANDING', '05_STUDENT_DASHBOARD'],
      icon: Home,
    },
    {
      label: 'Assessments',
      screen: '06_ASSESSMENT_HUB' as const,
      match: [
        '06_ASSESSMENT_HUB',
        '07_RIASEC_ASSESSMENT',
        '08_APTITUDE_ASSESSMENT',
        '09_SKILL_RUBRIC_ASSESSMENT',
        '10_ASSESSMENT_RESULTS',
      ],
      icon: Activity,
    },
    {
      label: 'Opportunities',
      screen: '12_OPPORTUNITY_DISCOVERY' as const,
      match: [
        '12_OPPORTUNITY_DISCOVERY',
        '13_OPPORTUNITY_DETAIL',
        '14_READINESS_GAP_ANALYSIS',
        '23_JOB_MARKET_INTELLIGENCE',
        '27_STUDENT_UPDATES',
      ],
      icon: Briefcase,
    },
    {
      label: 'Learning',
      screen: '15_LEARNING_CENTRE' as const,
      match: ['15_LEARNING_CENTRE', '16_ACTIVITY_WORKSPACE', '24_SKILL_INTELLIGENCE'],
      icon: BookOpen,
    },
    {
      label: 'Evidence',
      screen: '17_EVIDENCE_LEDGER' as const,
      match: [
        '17_EVIDENCE_LEDGER',
        '11_CAPABILITY_PASSPORT',
        '25_RESUME_BUILDER',
        '26_LINKEDIN_SUPPORT',
      ],
      icon: FileCheck,
    },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="md:hidden fixed bottom-3 inset-x-3 z-40 rounded-2xl glass-dropdown px-2 py-1.5 flex items-center justify-around"
    >
      {items.map((item) => {
        const IconComp = item.icon;
        const active = item.match.includes(state.currentScreen);
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => navigateTo(item.screen)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              active
                ? 'text-[#0B2E56] font-bold bg-white/60 border border-white/85 shadow-xs'
                : 'text-[#123B63] hover:text-[#0B2E56]'
            }`}
          >
            <IconComp className={`w-4 h-4 ${active ? 'text-[#075FC7]' : 'text-[#174B80]'}`} />
            <span className="mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export function App() {
  return (
    <WayfinderProvider>
      {/* Transparent wrapper so the supplied Blue-to-White Textured Gradient Background remains visible behind all glass panels */}
      <div className="min-h-screen flex flex-col bg-transparent text-[#123B63] relative selection:bg-[#2178EE]/20 selection:text-[#0B2E56]">
        {/* Ambient Electric-Blue & Soft Cyan Atmospheric Illumination */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-36 left-1/4 w-[36rem] h-[36rem] rounded-full bg-[#1F68FF]/15 blur-[130px]" />
          <div className="absolute top-1/3 -right-28 w-[32rem] h-[32rem] rounded-full bg-[#E5FAFF]/30 blur-[120px]" />
          <div className="absolute -bottom-36 left-12 w-[34rem] h-[34rem] rounded-full bg-[#8DBDFF]/25 blur-[110px]" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen pb-20 md:pb-0">
          <Header />
          <main className="flex-1">
            <ScreenRouter />
          </main>
          <Footer />
          <MobileBottomGlassNav />
        </div>
      </div>
    </WayfinderProvider>
  );
}

export default App;
