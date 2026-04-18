import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * AuthCard — centered form container used by /signin, /signup, /verify-otp, /reset-password.
 *
 * Layout: max-w-md card on desktop, full-width on mobile (≤ 640px).
 * Subtle inset shadow + warm-ivory surface per DESIGN.md card pattern.
 */
export function AuthCard({ title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-md',
        'rounded-2xl bg-pure-surface',
        'border border-whisper-divider',
        'shadow-[0_1px_2px_rgba(24,24,27,0.04),0_8px_24px_-12px_rgba(24,24,27,0.08)]',
        'p-6 sm:p-8',
        'flex flex-col gap-6',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-heading-1 text-charcoal-ink text-balance">{title}</h1>
        {subtitle && (
          <p className="text-body text-muted-steel text-balance">{subtitle}</p>
        )}
      </div>

      <div className="flex flex-col gap-5">{children}</div>

      {footer && (
        <div className="text-body-small text-muted-steel text-center pt-2 border-t border-whisper-divider">
          {footer}
        </div>
      )}
    </div>
  );
}
