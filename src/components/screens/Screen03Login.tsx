import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Compass,
  ArrowRight,
  Loader2,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const Screen03Login: React.FC = () => {
  const { signInAccount, requestPasswordRecovery, navigateTo, state } = useWayfinder();

  const [mode, setMode] = useState<'SIGN_IN' | 'RECOVERY'>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'IDLE' | 'UNCONFIGURED' | 'SUCCESS' | 'ERROR';
    message: string;
  }>({ type: 'IDLE', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusBanner({ type: 'IDLE', message: '' });

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInAccount({ email: trimmedEmail, password });
      if (res.status === 'UNCONFIGURED') {
        setStatusBanner({ type: 'UNCONFIGURED', message: res.message });
      } else if (!res.ok) {
        setStatusBanner({ type: 'ERROR', message: res.message });
      } else {
        setPassword('');
        setStatusBanner({ type: 'SUCCESS', message: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusBanner({ type: 'IDLE', message: '' });

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Enter the email address associated with your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPasswordRecovery(trimmedEmail);
      if (res.status === 'UNCONFIGURED') {
        setStatusBanner({ type: 'UNCONFIGURED', message: res.message });
      } else if (res.ok) {
        setStatusBanner({ type: 'SUCCESS', message: res.message });
      } else {
        setStatusBanner({ type: 'ERROR', message: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-10 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden rounded-3xl my-4 mx-auto max-w-6xl">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#65DEFF]/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-[#087FE0]/18 blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute top-14 left-16 w-8 h-8 aqua-drop pointer-events-none opacity-80" />
      <div className="hidden sm:block absolute bottom-12 right-16 w-6 h-6 aqua-drop pointer-events-none opacity-75" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="liquid-stack-card liquid-glow-bar rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2 pt-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0F9FF] border border-[#8CCBFF] text-[#087FE0] text-xs font-semibold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-[#087FE0]" />
              <span>WAYFINDER • SIGN IN</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
              {mode === 'SIGN_IN' ? 'Sign in to WAYFINDER' : 'Reset your password'}
            </h1>
            <p className="text-sm text-[#456784]">
              {mode === 'SIGN_IN'
                ? 'Access your Capability Passport, readiness gap analysis, and evidence ledger.'
                : 'Enter your registered email address to request a password reset link.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F0F9FF] border border-[#C5E4FA]">
            <button
              type="button"
              onClick={() => {
                setMode('SIGN_IN');
                setErrorMessage(null);
                setStatusBanner({ type: 'IDLE', message: '' });
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'SIGN_IN'
                  ? 'tab-liquid-active'
                  : 'text-[#527493] hover:text-[#0F2942]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-[#087FE0]" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('RECOVERY');
                setErrorMessage(null);
                setStatusBanner({ type: 'IDLE', message: '' });
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'RECOVERY'
                  ? 'tab-liquid-active'
                  : 'text-[#527493] hover:text-[#0F2942]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#087FE0]" />
              <span>Password Recovery</span>
            </button>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusBanner.type === 'UNCONFIGURED' && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5"
            >
              <div className="font-display font-bold text-amber-900 flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sign-In Service Not Connected</span>
              </div>
              <p className="text-amber-800 leading-relaxed">{statusBanner.message}</p>
            </div>
          )}

          {statusBanner.type === 'ERROR' && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{statusBanner.message}</span>
            </div>
          )}

          {statusBanner.type === 'SUCCESS' && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusBanner.message}</span>
            </div>
          )}

          {mode === 'SIGN_IN' ? (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.edu"
                  className="w-full px-4 py-3 rounded-xl input-liquid text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#0F2942]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('RECOVERY');
                      setErrorMessage(null);
                      setStatusBanner({ type: 'IDLE', message: '' });
                    }}
                    className="text-xs font-semibold text-[#087FE0] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-4 pr-10 py-3 rounded-xl input-liquid text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#527493] hover:text-[#087FE0] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full btn-liquid-primary text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecovery} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="rec-email"
                  className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                >
                  Registered email address
                </label>
                <input
                  id="rec-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.edu"
                  className="w-full px-4 py-3 rounded-xl input-liquid text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full btn-liquid-primary text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending recovery request...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Instructions</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#C5E4FA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#527493]">
            <div className="flex items-center gap-1.5">
              <span>New to WAYFINDER?</span>
              <button
                type="button"
                onClick={() => navigateTo('02_REGISTER')}
                className="font-semibold text-[#087FE0] hover:text-[#0F2942] hover:underline cursor-pointer"
              >
                Create account
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('01_LANDING')}
              className="text-[#527493] hover:text-[#0F2942] flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#087FE0]" />
              <span>{state.supabaseConfigured ? 'Supabase Auth Ready' : 'Return to Landing'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
