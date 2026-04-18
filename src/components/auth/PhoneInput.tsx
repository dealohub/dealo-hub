'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * PhoneInput — GCC phone input, E.164 output.
 *
 * Sprint 1 state: **UI stubbed + disabled** (`disabled` prop always true here).
 * Real Twilio/SMS wiring lands in Sprint 6 after Kuwait sender-ID registration.
 * The input is rendered for visual preview + layout testing, with a "قريباً / Coming soon"
 * overlay so users don't attempt phone signup.
 *
 * When we un-stub:
 *   1. Remove `alwaysDisabled` + the badge.
 *   2. Wire `react-phone-number-input` with limited countries = GCC_COUNTRIES.
 *   3. Validate on change with `isValidGCCPhone` from lib/auth/phone.
 */

interface PhoneInputProps {
  name?: string;
  defaultValue?: string;
  className?: string;
  /** Hides the "Coming soon" badge — only used by Storybook/visual-only previews. */
  hideBadge?: boolean;
  /** Translated "Coming soon" label. Falls back to Arabic. */
  comingSoonLabel?: string;
}

export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ name = 'phone', defaultValue = '', className, hideBadge, comingSoonLabel = 'قريباً' }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)}>
        <div className="flex items-stretch gap-2">
          {/* Country code chip (KW only visible while stubbed). */}
          <div
            className="
              flex items-center gap-1.5 shrink-0
              h-12 px-3 rounded-xl
              bg-canvas-zinc border-[1.5px] border-ghost-border
              text-body text-muted-steel
              select-none
            "
            aria-hidden="true"
          >
            <span className="text-base leading-none">🇰🇼</span>
            <span className="font-mono text-body-small" lang="en">+965</span>
          </div>

          {/* Number field (disabled) */}
          <input
            type="tel"
            name={name}
            defaultValue={defaultValue}
            disabled
            inputMode="tel"
            lang="en"
            dir="ltr"
            autoComplete="tel-national"
            placeholder="XXXX XXXX"
            aria-disabled="true"
            className="
              w-full h-12 px-4 rounded-xl
              bg-canvas-zinc border-[1.5px] border-ghost-border
              text-body text-charcoal-ink placeholder:text-muted-steel
              opacity-60 cursor-not-allowed
              focus:outline-none
            "
          />
        </div>

        {/* Coming-soon pill, end-aligned for RTL correctness. */}
        {!hideBadge && (
          <span
            className="
              absolute top-0 end-0
              -translate-y-1/2
              inline-flex items-center gap-1
              px-2 py-0.5 rounded-full
              bg-warm-amber/10 border border-warm-amber/30
              text-caption font-semibold text-warm-amber-700
              uppercase tracking-wide
            "
          >
            {comingSoonLabel}
          </span>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
