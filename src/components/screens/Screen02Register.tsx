import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  RegistrationFieldKey,
  validateRegistrationForm,
} from '../../services/supabaseBoundary';
import {
  Compass,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Info,
  MailCheck,
} from 'lucide-react';

export const Screen02Register: React.FC = () => {
  const { signUpAccount, navigateTo, state } = useWayfinder();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegistrationFieldKey, string>>>({});
  const [summaryErrors, setSummaryErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'IDLE' | 'SUCCESS' | 'EMAIL_CONFIRMATION_REQUIRED' | 'UNCONFIGURED' | 'ERROR';
    message: string;
  }>({ type: 'IDLE', message: '' });

  const passwordRules = [
    { id: 'len', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter (a–z)', met: /[a-z]/.test(password) },
    { id: 'num', label: 'One number (0–9)', met: /[0-9]/.test(password) },
  ];

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const clearFieldError = (field: RegistrationFieldKey) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus({ type: 'IDLE', message: '' });

    const validation = validateRegistrationForm({
      fullName,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    });

    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      setSummaryErrors(validation.summaryErrors);
      return;
    }

    setFieldErrors({});
    setSummaryErrors([]);
    setIsSubmitting(true);

    try {
      const result = await signUpAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (result.status === 'UNCONFIGURED') {
        setSubmitStatus({
          type: 'UNCONFIGURED',
          message: result.message,
        });
      } else if (result.status === 'EMAIL_CONFIRMATION_REQUIRED') {
        setPassword('');
        setConfirmPassword('');
        setSubmitStatus({
          type: 'EMAIL_CONFIRMATION_REQUIRED',
          message: result.message,
        });
      } else if (result.ok) {
        setPassword('');
        setConfirmPassword('');
        setSubmitStatus({
          type: 'SUCCESS',
          message: result.message,
        });
      } else {
        setSubmitStatus({
          type: 'ERROR',
          message: result.message,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-10 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden rounded-3xl my-4 mx-auto max-w-6xl">
      {/* Subtle Aqua-Morphism Reflections & Water Drops */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#65DEFF]/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-24 w-96 h-96 rounded-full bg-[#087FE0]/18 blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute top-12 right-16 w-9 h-9 aqua-drop pointer-events-none opacity-80" />
      <div className="hidden sm:block absolute bottom-14 left-16 w-6 h-6 aqua-drop pointer-events-none opacity-75" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Translucent White & Ice-Blue Liquid Glass Registration Card */}
        <div className="liquid-stack-card liquid-glow-bar rounded-3xl p-6 sm:p-10 space-y-6">
          {/* Brand & Screen Header */}
          <div className="text-center space-y-2 pt-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F0F9FF] border border-[#8CCBFF] text-[#087FE0] text-xs font-semibold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-[#087FE0]" />
              <span>WAYFINDER • CREATE ACCOUNT</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
              Create your WAYFINDER account
            </h1>
            <p className="text-sm text-[#456784] max-w-md mx-auto leading-relaxed">
              Identify skill gaps, build verified work, and track your readiness for target
              opportunities.
            </p>
          </div>

          {/* Accessible Validation Error Summary */}
          {summaryErrors.length > 0 && (
            <div
              role="alert"
              aria-labelledby="reg-error-summary-title"
              className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1.5 shadow-sm"
            >
              <div
                id="reg-error-summary-title"
                className="font-display font-bold text-red-800 flex items-center gap-2 text-sm"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Please correct the following before continuing:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-red-700 pl-1">
                {summaryErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unconfigured Backend Status Banner (Truthful Reporting on Submit) */}
          {submitStatus.type === 'UNCONFIGURED' && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2 shadow-sm"
            >
              <div className="font-display font-bold text-amber-900 flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Account Service Not Connected</span>
              </div>
              <p className="text-amber-800 leading-relaxed">{submitStatus.message}</p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo('05_STUDENT_DASHBOARD')}
                  className="text-xs font-semibold text-[#087FE0] hover:underline cursor-pointer"
                >
                  Continue to Student Dashboard →
                </button>
              </div>
            </div>
          )}

          {/* Email Confirmation Required State */}
          {submitStatus.type === 'EMAIL_CONFIRMATION_REQUIRED' && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#8CCBFF] text-[#0F2942] text-xs space-y-2"
            >
              <div className="font-display font-bold flex items-center gap-2 text-sm text-[#087FE0]">
                <MailCheck className="w-4 h-4 text-[#087FE0] shrink-0" />
                <span>Verify your email address</span>
              </div>
              <p className="leading-relaxed text-[#456784]">{submitStatus.message}</p>
              <button
                type="button"
                onClick={() => navigateTo('03_LOGIN')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#087FE0] hover:underline pt-1 cursor-pointer"
              >
                Proceed to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Provider Error State */}
          {submitStatus.type === 'ERROR' && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-display font-bold text-red-800">
                  Registration could not be completed
                </div>
                <p className="text-red-700 mt-0.5">{submitStatus.message}</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {submitStatus.type === 'SUCCESS' && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-display font-bold text-emerald-800">Account created</div>
                <p className="text-emerald-700 mt-0.5">{submitStatus.message}</p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="reg-full-name"
                className="block text-xs font-semibold text-[#0F2942] mb-1.5"
              >
                Full name <span className="text-[#087FE0]">*</span>
              </label>
              <input
                id="reg-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? 'reg-full-name-error' : undefined}
                placeholder="Enter your full name"
                className={`w-full px-4 py-3 rounded-xl input-liquid text-sm ${
                  fieldErrors.fullName ? '!border-red-400 focus:!ring-red-300' : ''
                }`}
              />
              {fieldErrors.fullName && (
                <p id="reg-full-name-error" className="mt-1.5 text-xs text-red-600 font-medium">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* 2. Email Address */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-[#0F2942] mb-1.5"
              >
                Email address <span className="text-[#087FE0]">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
                placeholder="name@domain.edu"
                className={`w-full px-4 py-3 rounded-xl input-liquid text-sm ${
                  fieldErrors.email ? '!border-red-400 focus:!ring-red-300' : ''
                }`}
              />
              {fieldErrors.email && (
                <p id="reg-email-error" className="mt-1.5 text-xs text-red-600 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* 3. Password & 4. Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                >
                  Password <span className="text-[#087FE0]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? 'reg-password-error' : 'reg-password-rules'
                    }
                    placeholder="Create a strong password"
                    className={`w-full pl-4 pr-10 py-3 rounded-xl input-liquid text-sm ${
                      fieldErrors.password ? '!border-red-400 focus:!ring-red-300' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#527493] hover:text-[#087FE0] focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="reg-password-error" className="mt-1.5 text-xs text-red-600 font-medium">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                >
                  Confirm password <span className="text-[#087FE0]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={
                      fieldErrors.confirmPassword ? 'reg-confirm-password-error' : undefined
                    }
                    placeholder="Re-enter your password"
                    className={`w-full pl-4 pr-10 py-3 rounded-xl input-liquid text-sm ${
                      fieldErrors.confirmPassword ? '!border-red-400 focus:!ring-red-300' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#527493] hover:text-[#087FE0] focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p
                    id="reg-confirm-password-error"
                    className="mt-1.5 text-xs text-red-600 font-medium"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
                {passwordsMatch && !fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passwords match
                  </p>
                )}
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div
              id="reg-password-rules"
              className="p-3.5 rounded-2xl glass-panel-subtle space-y-2"
            >
              <div className="text-[11px] font-semibold text-[#527493] uppercase tracking-wider">
                Password security requirements
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-1.5 ${
                      rule.met ? 'text-emerald-700 font-semibold' : 'text-[#527493]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        rule.met ? 'text-emerald-600' : 'text-[#8CCBFF]'
                      }`}
                    />
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Required Terms and Privacy Acknowledgement */}
            <div
              className={`p-4 rounded-2xl border transition-colors ${
                fieldErrors.acceptedTerms
                  ? 'bg-red-50/70 border-red-300'
                  : 'glass-panel-subtle'
              }`}
            >
              <label
                htmlFor="reg-terms"
                className="flex items-start gap-3 cursor-pointer select-none"
              >
                <input
                  id="reg-terms"
                  name="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    clearFieldError('acceptedTerms');
                  }}
                  aria-invalid={Boolean(fieldErrors.acceptedTerms)}
                  aria-describedby={fieldErrors.acceptedTerms ? 'reg-terms-error' : undefined}
                  className="mt-0.5 w-4 h-4 rounded border-[#8CCBFF] text-[#087FE0] focus:ring-2 focus:ring-[#087FE0]/40 accent-[#087FE0]"
                />
                <span className="text-xs text-[#456784] leading-relaxed">
                  I agree to the{' '}
                  <strong className="text-[#0F2942]">WAYFINDER Terms of Use</strong> and{' '}
                  <strong className="text-[#0F2942]">Privacy Notice</strong>. I understand that
                  self-reported claims are kept separate from demonstrated capabilities and reviewed
                  proof, and that platform consent never automatically satisfies opportunity
                  eligibility requirements. <span className="text-[#087FE0] font-bold">*</span>
                </span>
              </label>
              {fieldErrors.acceptedTerms && (
                <p id="reg-terms-error" className="mt-2 text-xs text-red-600 font-medium pl-7">
                  {fieldErrors.acceptedTerms}
                </p>
              )}
            </div>

            {/* Glossy Blue Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full btn-liquid-primary text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Connection & Security Note + Link to Login */}
          <div className="pt-4 border-t border-[#C5E4FA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#527493]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#087FE0]" />
              <span>
                {state.supabaseConfigured
                  ? 'Connected to Supabase Auth'
                  : 'Passwords are never stored in browser storage'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={() => navigateTo('03_LOGIN')}
                className="font-semibold text-[#087FE0] hover:text-[#0F2942] hover:underline focus:outline-none rounded px-1 cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
