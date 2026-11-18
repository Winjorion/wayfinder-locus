import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { CONFLICT_REGISTER, OWNER_DECISIONS } from '../../data/conflictAndDecisionRegister';
import { SUPABASE_REQUIRED_ENV_VARS, SUPABASE_RLS_SCHEMA_SQL } from '../../services/supabaseBoundary';
import {
  AlertOctagon,
  Database,
  ShieldAlert,
  RefreshCw,
  Copy,
  Check,
  Lock,
  ArrowLeft,
  LogIn,
} from 'lucide-react';
import { LiquidButton, LiquidTabs } from '../common/LiquidGlassKit';

export const Screen22EdgeStates: React.FC = () => {
  const { state, navigateTo } = useWayfinder();
  const [simulatedEdgeState, setSimulatedEdgeState] = useState<
    'NONE' | 'LOADING' | 'EMPTY' | 'FORBIDDEN_403' | 'OFFLINE_RETRY'
  >('NONE');
  const [copiedSql, setCopiedSql] = useState(false);

  const isAuthorizedInternalAdmin =
    state.supabaseConfigured && state.currentUser?.role === 'ADMIN';

  const handleCopySql = () => {
    navigator.clipboard?.writeText(SUPABASE_RLS_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isAuthorizedInternalAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-8 text-center space-y-5 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7 text-[#087FE0]" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
              Restricted Internal Route
            </span>
            <h1 className="font-display text-2xl font-bold text-[#0F2942]">
              System Governance &amp; Schema Access Restricted
            </h1>
            <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
              This internal engineering view (specification conflict register, owner decision log,
              and database schema reference) is not part of public or student navigation and
              requires an authenticated administrator session from a configured backend.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-left text-xs text-amber-900 space-y-1 max-w-xl mx-auto">
            <div className="font-display font-bold text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Truthful Authorization Boundary</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              {state.supabaseConfigured
                ? 'Your current session does not hold verified administrator permissions for this route.'
                : 'Backend authentication (Supabase Auth & RLS) is not configured in this environment. Client-side route guards act only as a UI boundary and are not claimed as server-enforced security.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <LiquidButton
              variant="primary"
              pill
              onClick={() => navigateTo('05_STUDENT_DASHBOARD')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Student Dashboard
            </LiquidButton>
            {!state.currentUser && (
              <LiquidButton
                variant="secondary"
                pill
                onClick={() => navigateTo('03_LOGIN')}
                icon={<LogIn className="w-4 h-4 text-[#087FE0]" />}
              >
                Sign In
              </LiquidButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#087FE0]">
          <AlertOctagon className="w-4 h-4 text-[#087FE0]" />
          <span>SYSTEM GOVERNANCE, EDGE STATES & SUPABASE RLS BOUNDARY</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942]">
          Conflict Register (`CONF-01..10`), Owner Decisions (`DEC-01..10`), Edge States & SQL Schema
        </h1>
        <p className="text-xs sm:text-sm text-[#456784] max-w-3xl leading-relaxed">
          Unresolved specification conflicts and owner decisions are visibly documented and kept
          configurable rather than silently hardcoded.
        </p>
      </div>

      {/* Section 1: Interactive Edge States Preview (Empty, Loading, Forbidden, Offline/Retry) */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-[#0F2942]">
            1. UI Edge States Verification (Loading, Empty, 403 Forbidden, Unavailable/Retry)
          </h2>
          <LiquidTabs
            tabs={[
              { id: 'NONE', label: 'Normal' },
              { id: 'LOADING', label: 'Loading' },
              { id: 'EMPTY', label: 'Empty' },
              { id: 'FORBIDDEN_403', label: '403 Forbidden' },
              { id: 'OFFLINE_RETRY', label: 'Retry / Offline' },
            ]}
            activeTab={simulatedEdgeState}
            onChange={setSimulatedEdgeState}
          />
        </div>

        {simulatedEdgeState === 'LOADING' && (
          <div className="p-8 rounded-xl glass-panel-subtle flex flex-col items-center justify-center gap-3 text-center">
            <RefreshCw className="w-7 h-7 text-[#087FE0] animate-spin" />
            <div className="font-display text-sm font-bold text-[#0F2942]">
              Computing Non-Compensatory Readiness Matrix...
            </div>
            <p className="text-xs text-[#456784]">
              Verifying rubric version compatibility (`RUBRIC_V1`) and evidence review statuses.
            </p>
          </div>
        )}

        {simulatedEdgeState === 'EMPTY' && (
          <div className="p-8 rounded-xl glass-panel-subtle text-center space-y-2">
            <div className="font-display text-sm font-bold text-[#0F2942]">
              No Evidence Artifacts Submitted for This Requirement Yet
            </div>
            <p className="text-xs text-[#456784] max-w-md mx-auto">
              Unassessed capabilities remain explicitly marked as{' '}
              <code className="text-[#087FE0] font-semibold">UNKNOWN (≠ 0)</code> until an objective
              assessment or reviewed artifact is recorded.
            </p>
          </div>
        )}

        {simulatedEdgeState === 'FORBIDDEN_403' && (
          <div className="p-6 rounded-xl bg-red-50 border border-red-300 flex items-start gap-3 text-xs text-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-display font-bold text-sm text-red-950">
                403 Access Denied — Least-Privilege Role Boundary Enforced
              </div>
              <p className="mt-1 text-red-800">
                Your current role (<code>{state.activeRole}</code>) is not authorised to access
                unassigned student evidence or unsuppressed small cohorts (<code>N &lt; 5</code>).
              </p>
            </div>
          </div>
        )}

        {simulatedEdgeState === 'OFFLINE_RETRY' && (
          <div className="p-6 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4 text-xs text-amber-900">
            <div>
              <div className="font-display font-bold text-sm text-amber-950">
                Backend Service Unconfigured / Unavailable
              </div>
              <p className="mt-1 text-amber-800">
                Supabase credentials are not configured in this environment. Your draft input is
                preserved safely without fabricating a remote save confirmation.
              </p>
            </div>
            <LiquidButton
              variant="secondary"
              size="sm"
              pill
              onClick={() => setSimulatedEdgeState('NONE')}
            >
              Retry Connection
            </LiquidButton>
          </div>
        )}
      </div>

      {/* Section 2: Conflict Register CONF-01 through CONF-10 */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-base font-bold text-[#0F2942]">
          2. Documented Specification Conflict Register (`CONF-01` through `CONF-10`)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#C5E4FA] text-[11px] font-mono font-semibold text-[#174B80] bg-[#F0F9FF]">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Topic</th>
                <th className="py-3 px-3">Source A</th>
                <th className="py-3 px-3">Source B</th>
                <th className="py-3 px-3">Safe Configurable Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5E4FA]/70">
              {CONFLICT_REGISTER.map((c) => (
                <tr key={c.id} className="hover:bg-[#F0F9FF]/60">
                  <td className="py-3 px-3 font-mono font-bold text-[#087FE0]">{c.id}</td>
                  <td className="py-3 px-3 font-semibold text-[#0F2942]">{c.topic}</td>
                  <td className="py-3 px-3 text-[#456784]">{c.sourceA}</td>
                  <td className="py-3 px-3 text-[#456784]">{c.sourceB}</td>
                  <td className="py-3 px-3 text-emerald-700 font-medium">{c.currentSafeHandling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Unresolved Owner Decisions DEC-01 through DEC-10 */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-base font-bold text-[#0F2942]">
          3. Unresolved Owner Decisions (`DEC-01` through `DEC-10`)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OWNER_DECISIONS.map((d) => (
            <div key={d.id} className="p-4 rounded-xl glass-panel-subtle space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-[#087FE0] font-bold">
                  {d.id}: {d.title}
                </span>
                <span className="text-amber-700 font-semibold">{d.status}</span>
              </div>
              <div className="text-[#0F2942] font-mono text-[11px] font-semibold">
                Default: {d.defaultConfiguredValue}
              </div>
              <p className="text-[#456784] text-[11px]">{d.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Supabase PostgreSQL & RLS Integration Boundary */}
      <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#087FE0]" />
            <h2 className="font-display text-base font-bold text-[#0F2942]">
              4. Supabase PostgreSQL Schema & Row-Level Security (RLS) Integration Boundary
            </h2>
          </div>

          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={handleCopySql}
            icon={
              copiedSql ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#087FE0]" />
              )
            }
          >
            {copiedSql ? 'Copied SQL Migration' : 'Copy RLS Migration SQL'}
          </LiquidButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {SUPABASE_REQUIRED_ENV_VARS.map((v) => (
            <div key={v.name} className="p-3.5 rounded-xl glass-panel-subtle space-y-1">
              <div className="font-mono text-[#087FE0] font-bold">{v.name}</div>
              <div className="text-[10px] font-mono font-semibold text-amber-700">
                Scope: {v.scope}
              </div>
              <p className="text-[11px] text-[#456784]">{v.purpose}</p>
            </div>
          ))}
        </div>

        <pre className="p-4 rounded-xl bg-[#F0F9FF] border border-[#C5E4FA] text-[11px] font-mono text-[#174B80] overflow-x-auto max-h-80">
          {SUPABASE_RLS_SCHEMA_SQL}
        </pre>
      </div>
    </div>
  );
};
