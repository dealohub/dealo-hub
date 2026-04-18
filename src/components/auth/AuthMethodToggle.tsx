'use client';

import { Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AuthMethod = 'email' | 'phone';

interface AuthMethodToggleProps {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
  emailLabel: string;
  phoneLabel: string;
  /** Phone is coming-soon in Sprint 1; keep disabled until Sprint 6 Twilio wiring. */
  phoneDisabled?: boolean;
  comingSoonLabel?: string;
}

/**
 * Segmented toggle between Email and Phone auth methods.
 *
 * Sprint 1: phone tab is disabled (locked) with "قريباً" hint.
 * The tab is still rendered so users see we'll support both.
 */
export function AuthMethodToggle({
  value,
  onChange,
  emailLabel,
  phoneLabel,
  phoneDisabled = true,
  comingSoonLabel = 'قريباً',
}: AuthMethodToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Authentication method"
      className="
        grid grid-cols-2 gap-1
        p-1 rounded-xl
        bg-canvas-zinc border border-ghost-border
      "
    >
      <MethodTab
        active={value === 'email'}
        onClick={() => onChange('email')}
        icon={<Mail className="size-4" />}
        label={emailLabel}
      />
      <MethodTab
        active={value === 'phone'}
        onClick={() => !phoneDisabled && onChange('phone')}
        disabled={phoneDisabled}
        icon={<Phone className="size-4" />}
        label={phoneLabel}
        badge={phoneDisabled ? comingSoonLabel : undefined}
      />
    </div>
  );
}

interface MethodTabProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

function MethodTab({ active, onClick, disabled, icon, label, badge }: MethodTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'h-10 px-3 rounded-lg',
        'text-body-small font-medium',
        'transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
        active && !disabled && 'bg-pure-surface text-charcoal-ink shadow-sm',
        !active && !disabled && 'text-muted-steel hover:text-charcoal-ink',
        disabled && 'text-muted-steel/60 cursor-not-allowed'
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className="
            absolute top-0.5 end-0.5
            inline-flex items-center px-1.5 py-0
            rounded-full
            bg-warm-amber/15 text-warm-amber-700
            text-[10px] font-semibold uppercase tracking-wide
          "
        >
          {badge}
        </span>
      )}
    </button>
  );
}
