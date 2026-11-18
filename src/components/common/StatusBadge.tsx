import React from 'react';
import { RequirementStatus, EvidenceStatus } from '../../types/wayfinder';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  XCircle,
  ShieldAlert,
  MinusCircle,
  Sparkles,
  FileText,
  Send,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface RequirementStatusBadgeProps {
  status: RequirementStatus;
}

/**
 * Translucent Glass Status Chips — Strictly adheres to the WAYFINDER Blue/Aqua/Navy Glass
 * colour identity while ensuring WCAG 2.2 AA contrast (>7.2:1) and non-colour differentiation
 * (distinct icon + explicit text label + border style).
 */
export const RequirementStatusBadge: React.FC<RequirementStatusBadgeProps> = ({ status }) => {
  const config: Record<
    RequirementStatus,
    { label: string; classes: string; icon: React.ReactNode }
  > = {
    DEMONSTRATED: {
      label: 'Met',
      classes:
        'bg-[#E5FAFF]/72 text-[#0B2E56] border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#075FC7] shrink-0" />,
    },
    PARTIALLY_DEMONSTRATED: {
      label: 'Partially Met',
      classes:
        'bg-[#DDF2FF]/68 text-[#0B2E56] border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#075FC7] shrink-0" />,
    },
    DEVELOPMENT_NEEDED: {
      label: 'Development Needed',
      classes:
        'bg-[#EAF6FF]/68 text-[#0B2E56] border-[#8DBDFF]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#174B80] shrink-0" />,
    },
    EVIDENCE_MISSING: {
      label: 'Evidence Needed',
      classes:
        'bg-[#E5FAFF]/65 text-[#0B2E56] border-[#8DBDFF]/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-[#075FC7] shrink-0" />,
    },
    EVIDENCE_PENDING_REVIEW: {
      label: 'In Progress',
      classes:
        'bg-[#DDF2FF]/72 text-[#0B2E56] border-white/85 shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)]',
      icon: <Clock className="w-3.5 h-3.5 text-[#075FC7] shrink-0" />,
    },
    MANDATORY_CONDITION_NOT_MET: {
      label: 'Requirement Not Met',
      classes:
        'bg-[#DDF2FF]/65 text-[#0B2E56] border-[#0B2E56]/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)]',
      icon: <XCircle className="w-3.5 h-3.5 text-[#0B2E56] shrink-0" />,
    },
    UNKNOWN_INSUFFICIENT_INFO: {
      label: 'Needs Assessment',
      classes:
        'bg-white/55 text-[#123B63] border-white/75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]',
      icon: <HelpCircle className="w-3.5 h-3.5 text-[#075FC7] shrink-0" />,
    },
    NOT_APPLICABLE: {
      label: 'Not Applicable',
      classes: 'bg-white/45 text-[#315A7D] border-white/65',
      icon: <MinusCircle className="w-3.5 h-3.5 text-[#315A7D] shrink-0" />,
    },
  };

  const item = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${item.classes}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const EvidenceStatusBadge: React.FC<{ status: EvidenceStatus }> = ({ status }) => {
  const map: Record<
    EvidenceStatus,
    { label: string; classes: string; icon: React.ReactNode }
  > = {
    DRAFT: {
      label: 'Draft',
      classes: 'bg-white/55 text-[#174B80] border-white/75',
      icon: <FileText className="w-3 h-3 text-[#315A7D] shrink-0" />,
    },
    SUBMITTED: {
      label: 'Submitted',
      classes: 'bg-[#DDF2FF]/68 text-[#0B2E56] border-white/80',
      icon: <Send className="w-3 h-3 text-[#075FC7] shrink-0" />,
    },
    TECHNICAL_VALIDATION_PASSED: {
      label: 'In Progress — Awaiting Review',
      classes: 'bg-[#DDF2FF]/72 text-[#0B2E56] border-white/85',
      icon: <Clock className="w-3 h-3 text-[#075FC7] shrink-0" />,
    },
    TECHNICAL_VALIDATION_FAILED: {
      label: 'File Check Failed',
      classes: 'bg-[#DDF2FF]/65 text-[#0B2E56] border-[#0B2E56]/35',
      icon: <AlertCircle className="w-3 h-3 text-[#0B2E56] shrink-0" />,
    },
    ASSIGNED_FOR_REVIEW: {
      label: 'Assigned for Review',
      classes: 'bg-[#DDF2FF]/72 text-[#0B2E56] border-white/85',
      icon: <UserCheck className="w-3 h-3 text-[#075FC7] shrink-0" />,
    },
    UNDER_REVIEW: {
      label: 'Pending Review',
      classes: 'bg-[#E5FAFF]/70 text-[#0B2E56] border-white/80',
      icon: <Clock className="w-3 h-3 text-[#075FC7] shrink-0" />,
    },
    ACCEPTED: {
      label: 'Completed',
      classes: 'bg-[#E5FAFF]/75 text-[#0B2E56] border-white/90',
      icon: <CheckCircle2 className="w-3 h-3 text-[#075FC7] shrink-0" />,
    },
    REVISION_REQUESTED: {
      label: 'Revision Requested',
      classes: 'bg-[#EAF6FF]/70 text-[#0B2E56] border-[#8DBDFF]/85',
      icon: <RefreshCw className="w-3 h-3 text-[#174B80] shrink-0" />,
    },
    REJECTED: {
      label: 'Not Accepted',
      classes: 'bg-[#DDF2FF]/65 text-[#0B2E56] border-[#0B2E56]/35',
      icon: <XCircle className="w-3 h-3 text-[#0B2E56] shrink-0" />,
    },
    EXPIRED: {
      label: 'Expired',
      classes: 'bg-white/48 text-[#315A7D] border-white/65',
      icon: <MinusCircle className="w-3 h-3 text-[#315A7D] shrink-0" />,
    },
  };

  const item = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md ${item.classes}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};
