import React from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { Shield, FileCode, Lock, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useWayfinder();

  return (
    <footer className="mt-16 glass-panel border-b-0 border-x-0 border-t border-white/65 text-xs text-[#123B63]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-2.5">
            <div className="font-display font-bold text-[#0B2E56] flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#2178EE] to-[#075FC7] border border-white/75 flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <span>WAYFINDER</span>
            </div>
            <p className="text-xs leading-relaxed text-[#123B63]">
              Opportunity Readiness Intelligence Platform.
              <br />
              <span className="font-semibold text-[#0B2E56]">
                Don&apos;t just find opportunities. Become ready for them.
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-display font-bold text-[#0B2E56] flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-[#075FC7]" /> How Readiness Works
            </div>
            <ul className="space-y-1.5 text-xs text-[#123B63]">
              <li>• Claims, assessed skills, and proof are tracked separately</li>
              <li>• Unassessed skills are shown as needing more information—never as zero</li>
              <li>• Skills are compared requirement by requirement against your target</li>
              <li>• Opportunity eligibility is checked separately from privacy consent</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-display font-bold text-[#0B2E56] flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-[#075FC7]" /> Privacy &amp; Trust
            </div>
            <ul className="space-y-1.5 text-xs text-[#123B63]">
              <li>• Cohort insights require at least 5 students to protect privacy</li>
              <li>• Time-limited sharing links with instant revocation</li>
              <li>• Reviewers only see submissions assigned to them</li>
              <li>• File checks are separate from human evidence review</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-display font-bold text-[#0B2E56] flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <FileCode className="w-3.5 h-3.5 text-[#075FC7]" /> Quick Links
            </div>
            <div className="flex flex-col items-start gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => navigateTo('05_STUDENT_DASHBOARD')}
                className="text-[#075FC7] font-semibold hover:underline cursor-pointer"
              >
                Student Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigateTo('11_CAPABILITY_PASSPORT')}
                className="text-[#123B63] hover:text-[#075FC7] hover:underline cursor-pointer"
              >
                Capability Passport
              </button>
              <button
                type="button"
                onClick={() => navigateTo('19_HISTORICAL_SNAPSHOTS')}
                className="text-[#123B63] hover:text-[#075FC7] hover:underline cursor-pointer"
              >
                Readiness History
              </button>
              <button
                type="button"
                onClick={() => navigateTo('20_PRIVACY_SHARING')}
                className="text-[#123B63] hover:text-[#075FC7] hover:underline cursor-pointer"
              >
                Privacy &amp; Data Sharing
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/55 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#174B80]">
          <span>WAYFINDER — Opportunity Readiness Intelligence Platform</span>
          <span className="font-semibold text-[#075FC7]">
            Identify the gap. Build the capability. Prove it.
          </span>
        </div>
      </div>
    </footer>
  );
};
