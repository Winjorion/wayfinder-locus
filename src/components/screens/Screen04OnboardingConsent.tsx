import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, UserPlus } from 'lucide-react';
import { LiquidButton, TactileCheckbox, TactileSwitch } from '../common/LiquidGlassKit';

export const Screen04OnboardingConsent: React.FC = () => {
  const { state, updateOnboardingConsent, verifyEligibilityStatus, navigateTo } = useWayfinder();
  const user = state.currentUser;

  const [dataProcessing, setDataProcessing] = useState(
    user?.consent.acceptedDataProcessing ?? false
  );
  const [assessmentTerms, setAssessmentTerms] = useState(
    user?.consent.acceptedAssessmentTerms ?? false
  );
  const [evidenceTerms, setEvidenceTerms] = useState(
    user?.consent.acceptedEvidenceReviewTerms ?? false
  );

  const [enrolledStatus, setEnrolledStatus] = useState(
    user?.eligibility.enrolledStudentVerified ?? false
  );
  const [academicStanding, setAcademicStanding] = useState(
    user?.eligibility.minimumAcademicStandingVerified ?? false
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOnboardingConsent({
      acceptedDataProcessing: dataProcessing,
      acceptedAssessmentTerms: assessmentTerms,
      acceptedEvidenceReviewTerms: evidenceTerms,
    });
    verifyEligibilityStatus({
      enrolledStudentVerified: enrolledStatus,
      minimumAcademicStandingVerified: academicStanding,
    });
    setSavedNotice(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#087FE0]" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold text-[#087FE0] uppercase">
                Onboarding &amp; Eligibility
              </span>
              <h1 className="font-display text-2xl font-bold text-[#0F2942]">
                Onboarding, Consent &amp; Eligibility
              </h1>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#F0F9FF] text-[#087FE0] border border-[#8CCBFF]">
            Terms: {user?.consent.consentVersion || '2025.1'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
          Review your privacy preferences and confirm any academic eligibility details needed for
          specific opportunities.
        </p>

        {!user && (
          <div className="p-4 rounded-xl glass-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#456784]">
              <strong className="text-[#0F2942]">Not Signed In:</strong> You are previewing
              onboarding preferences without an active account.
            </div>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => navigateTo('02_REGISTER')}
              icon={<UserPlus className="w-3.5 h-3.5 text-[#087FE0]" />}
            >
              Create Account
            </LiquidButton>
          </div>
        )}

        {/* Important Distinction Banner */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-display font-bold text-amber-950">
              Platform Consent Is Separate from Opportunity Eligibility
            </div>
            <p className="text-amber-800 leading-relaxed">
              Accepting platform privacy terms allows WAYFINDER to save your assessments and track
              your readiness, but it{' '}
              <strong>never automatically satisfies opportunity eligibility requirements</strong>{' '}
              (such as full-time student enrollment or academic standing). Those requirements are
              checked separately below.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Platform Consent */}
          <div className="space-y-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#087FE0]">
              1. Privacy &amp; Platform Preferences
            </h2>

            <div className="p-4 rounded-xl glass-panel-subtle">
              <TactileCheckbox
                checked={dataProcessing}
                onChange={setDataProcessing}
                label={
                  <div>
                    <div className="text-sm font-semibold text-[#0F2942]">
                      Readiness Profile &amp; Progress Tracking
                    </div>
                    <p className="text-xs text-[#456784] mt-0.5">
                      Allow WAYFINDER to process your assessment results, skill ratings, and
                      saved readiness milestones for your personal account.
                    </p>
                  </div>
                }
              />
            </div>

            <div className="p-4 rounded-xl glass-panel-subtle">
              <TactileCheckbox
                checked={assessmentTerms}
                onChange={setAssessmentTerms}
                label={
                  <div>
                    <div className="text-sm font-semibold text-[#0F2942]">
                      How Assessments Are Interpreted
                    </div>
                    <p className="text-xs text-[#456784] mt-0.5">
                      I understand that the RIASEC questionnaire measures career interests only (not
                      skills), and self-reported skill ratings are recorded as claims until verified
                      through objective assessments or reviewed work.
                    </p>
                  </div>
                }
              />
            </div>

            <div className="p-4 rounded-xl glass-panel-subtle">
              <TactileCheckbox
                checked={evidenceTerms}
                onChange={setEvidenceTerms}
                accent="violet"
                label={
                  <div>
                    <div className="text-sm font-semibold text-[#0F2942]">
                      Evidence Submission &amp; Reviewer Access
                    </div>
                    <p className="text-xs text-[#456784] mt-0.5">
                      I understand that my uploaded work remains private by default and is shared
                      only with assigned reviewers or institutions I explicitly authorise.
                    </p>
                  </div>
                }
              />
            </div>
          </div>

          {/* Section 2: Independent Eligibility Facts */}
          <div className="space-y-3 pt-4 border-t border-[#C5E4FA]">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#174B80]">
              2. Opportunity Eligibility Status
            </h2>
            <p className="text-xs text-[#456784]">
              Some internships, competitions, and programs require active enrollment or academic
              standing. These remain unverified until confirmed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl glass-panel-subtle">
                <TactileSwitch
                  id="elig-enrolled"
                  checked={enrolledStatus}
                  onChange={setEnrolledStatus}
                  label="Active Full-Time Student Enrollment"
                  description="Used when an opportunity requires current student enrollment"
                />
              </div>

              <div className="p-4 rounded-xl glass-panel-subtle">
                <TactileSwitch
                  id="elig-standing"
                  checked={academicStanding}
                  onChange={setAcademicStanding}
                  label="Minimum Academic Standing Met"
                  description="Used when an opportunity requires good academic standing"
                />
              </div>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Your privacy preferences and eligibility status have been saved for this session.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <LiquidButton type="submit" variant="secondary" pill>
              Save Preferences
            </LiquidButton>

            <LiquidButton
              type="button"
              variant="primary"
              pill
              onClick={() => {
                updateOnboardingConsent({
                  acceptedDataProcessing: dataProcessing,
                  acceptedAssessmentTerms: assessmentTerms,
                  acceptedEvidenceReviewTerms: evidenceTerms,
                });
                verifyEligibilityStatus({
                  enrolledStudentVerified: enrolledStatus,
                  minimumAcademicStandingVerified: academicStanding,
                });
                navigateTo('05_STUDENT_DASHBOARD');
              }}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Save &amp; Continue to Dashboard
            </LiquidButton>
          </div>
        </form>
      </div>
    </div>
  );
};
