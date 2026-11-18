import React from 'react';
import { Check, X, Sparkles, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * WAYFINDER — HIGH-TRANSPARENCY GLASSMORPHISM + NEO-TACTILE UI KIT
 * Implements the authoritative visual tokens and Section 3 Text Colour Hierarchy:
 * - Primary Headings: #0B2E56
 * - Main Body Text: #123B63
 * - Secondary Text: #315A7D
 * - Small Labels: #174B80
 * - Interactive Links: #075FC7
 * - Light Text on Dark Blue Controls: #FFFFFF
 */

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  icon?: React.ReactNode;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'primary',
  size = 'md',
  pill = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs sm:text-sm',
    lg: 'px-6 py-3 text-sm',
  }[size];

  const radiusClass = pill ? 'rounded-full' : 'rounded-xl';

  const variantClasses = {
    primary: 'btn-liquid-primary',
    secondary: 'btn-liquid-secondary',
    ghost:
      'glass-panel-subtle hover:bg-white/40 text-[#0B2E56] hover:text-[#075FC7] border border-white/65 font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
    danger:
      'glass-panel-subtle hover:bg-white/45 text-[#0B2E56] border border-[#075FC7]/50 font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
  }[variant];

  return (
    <button
      className={`${variantClasses} ${sizeClasses} ${radiusClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export interface LiquidIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  label: string;
}

export const LiquidIconButton: React.FC<LiquidIconButtonProps> = ({
  size = 'md',
  active = false,
  label,
  children,
  className = '',
  ...props
}) => {
  const dims = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`btn-liquid-icon rounded-full ${dims} ${
        active
          ? 'border-white/85 text-white bg-[#075FC7] shadow-[0_6px_18px_rgba(7,95,199,0.45)]'
          : ''
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
  stacked?: boolean;
  interactive?: boolean;
  glowBar?: boolean;
  accent?: 'cyan' | 'violet' | 'blue' | 'emerald' | 'amber';
  onClick?: () => void;
}

export const LiquidCard: React.FC<LiquidCardProps> = ({
  children,
  className = '',
  stacked = false,
  interactive = false,
  glowBar = false,
  accent = 'cyan',
  onClick,
}) => {
  const baseClass = stacked
    ? 'liquid-stack-card'
    : interactive
    ? 'glass-panel-interactive'
    : 'glass-panel';

  const accentBorder = {
    cyan: 'border-white/65',
    violet: 'border-white/65',
    blue: 'border-white/70',
    emerald: 'border-white/65',
    amber: 'border-white/65',
  }[accent];

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${accentBorder} ${
        glowBar ? 'liquid-glow-bar' : ''
      } rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export interface TactileSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const TactileSwitch: React.FC<TactileSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}) => {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-3 select-none ${
        disabled ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`w-11 h-6 rounded-full p-0.5 transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] ${
          checked
            ? 'bg-gradient-to-r from-[#2178EE] to-[#075FC7] border border-white/80 shadow-[0_4px_12px_rgba(7,95,199,0.40)]'
            : 'tactile-track'
        } flex items-center`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs sm:text-sm font-semibold text-[#0B2E56]">{label}</span>
          )}
          {description && <span className="text-[11px] text-[#315A7D]">{description}</span>}
        </div>
      )}
    </label>
  );
};

export interface TactileCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  accent?: 'cyan' | 'violet';
  disabled?: boolean;
}

export const TactileCheckbox: React.FC<TactileCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <label
      className={`inline-flex items-start gap-3 select-none ${
        disabled ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all border shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] ${
          checked
            ? 'bg-gradient-to-b from-[#2178EE] to-[#075FC7] border-white/85 shadow-[0_3px_10px_rgba(7,95,199,0.38)]'
            : 'bg-white/45 border-[#174B80]/40 hover:border-[#075FC7]'
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
      </button>
      {label && <span className="text-xs sm:text-sm text-[#123B63] leading-relaxed">{label}</span>}
    </label>
  );
};

export interface LiquidTabsProps<T extends string> {
  tabs: { id: T; label: string; count?: number | string; icon?: React.ReactNode }[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export function LiquidTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: LiquidTabsProps<T>) {
  return (
    <div
      className={`tabs-liquid-container rounded-2xl p-1.5 flex flex-wrap gap-1 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#075FC7] cursor-pointer ${
              isActive
                ? 'tab-liquid-active text-[#0B2E56]'
                : 'text-[#123B63] hover:text-[#0B2E56] hover:bg-white/30'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-semibold ${
                  isActive
                    ? 'bg-[#075FC7]/15 text-[#0B2E56] font-bold border border-white/75'
                    : 'bg-white/45 text-[#174B80] border border-white/65'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface TactileProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  accent?: 'cyan' | 'violet' | 'emerald';
}

export const TactileProgressRing: React.FC<TactileProgressRingProps> = ({
  value,
  size = 76,
  strokeWidth = 6,
  label,
  sublabel,
  accent = 'cyan',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor = {
    cyan: '#075FC7',
    violet: '#2178EE',
    emerald: '#075FC7',
  }[accent];

  return (
    <div className="inline-flex items-center gap-3.5">
      <div
        className="relative inline-flex items-center justify-center rounded-full glass-panel-subtle p-1"
        style={{ width: size, height: size }}
      >
        <svg width={size - 8} height={size - 8} className="-rotate-90">
          <circle
            cx={(size - 8) / 2}
            cy={(size - 8) / 2}
            r={radius - 2}
            fill="transparent"
            stroke="rgba(11, 46, 86, 0.16)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={(size - 8) / 2}
            cy={(size - 8) / 2}
            r={radius - 2}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-display font-bold text-[#0B2E56]">
            {label ?? `${Math.round(clamped)}%`}
          </span>
        </div>
      </div>
      {sublabel && (
        <div className="text-xs text-[#123B63] font-medium leading-snug max-w-[160px]">
          {sublabel}
        </div>
      )}
    </div>
  );
};

export interface TactileProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  rightLabel?: string;
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber';
  showThumb?: boolean;
}

export const TactileProgressBar: React.FC<TactileProgressBarProps> = ({
  value,
  label,
  rightLabel,
  showThumb = false,
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {(label || rightLabel) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          {label && <span className="text-[#0B2E56] font-semibold">{label}</span>}
          {rightLabel && (
            <span className="font-mono font-semibold text-[#075FC7]">{rightLabel}</span>
          )}
        </div>
      )}
      <div className="relative h-2.5 w-full rounded-full tactile-track overflow-visible flex items-center">
        <div
          className="h-full rounded-full tactile-fill-cyan transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
        {showThumb && clamped > 0 && (
          <div
            className="tactile-thumb -ml-1.5 pointer-events-none"
            style={{ left: `${clamped}%`, position: 'absolute' }}
          />
        )}
      </div>
    </div>
  );
};

export interface LiquidToastProps {
  message: string;
  subtext?: string;
  variant?: 'info' | 'success' | 'warning';
  onClose?: () => void;
}

export const LiquidToast: React.FC<LiquidToastProps> = ({
  message,
  subtext,
  variant = 'info',
  onClose,
}) => {
  const icon = {
    info: <Info className="w-4 h-4 text-[#075FC7]" />,
    success: <CheckCircle2 className="w-4 h-4 text-[#075FC7]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#075FC7]" />,
  }[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-dropdown rounded-2xl px-4 py-3 flex items-start justify-between gap-3 max-w-sm"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-white/60 border border-white/80 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#0B2E56]">{message}</p>
          {subtext && <p className="text-[11px] text-[#123B63] mt-0.5">{subtext}</p>}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-[#174B80] hover:text-[#0B2E56] p-1 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface LiquidModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const LiquidModal: React.FC<LiquidModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2E56]/30 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="liquid-modal-title"
    >
      <div className="glass-dropdown rounded-2xl max-w-lg w-full p-6 border border-white/85 relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-panel-subtle flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#075FC7]" />
            </div>
            <div>
              <h3 id="liquid-modal-title" className="font-display text-lg font-bold text-[#0B2E56]">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-[#315A7D]">{subtitle}</p>}
            </div>
          </div>
          <LiquidIconButton size="sm" label="Close modal" onClick={onClose}>
            <X className="w-4 h-4" />
          </LiquidIconButton>
        </div>
        <div className="text-sm text-[#123B63] space-y-4">{children}</div>
        {footer && (
          <div className="mt-6 pt-4 border-t border-white/60 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
