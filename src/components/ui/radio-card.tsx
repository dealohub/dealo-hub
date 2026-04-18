'use client';

import { forwardRef, type ReactNode, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * RadioCard — a styled radio button rendered as a full-width selectable card.
 *
 * Used for: condition picker (Step 3), price mode (Step 4), and anywhere we
 * want "big-target" single-select input on mobile (≥44px hit area).
 *
 * Radio semantics are preserved via a hidden native input — keyboard nav
 * (arrow keys within a `role="radiogroup"`) works for free.
 */

export interface RadioCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
}

export const RadioCard = forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, label, description, icon, badge, id, ...props }, ref) => {
    const inputId = id ?? (props.name ? `${props.name}-${props.value}` : undefined);
    return (
      <label
        htmlFor={inputId}
        className={cn(
          'relative flex items-start gap-3 cursor-pointer select-none',
          'rounded-2xl border-[1.5px] border-ghost-border bg-pure-surface',
          'p-4',
          'transition-[border,box-shadow,background] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          'hover:border-warm-amber/40',
          'has-[:checked]:border-warm-amber has-[:checked]:bg-warm-amber/5',
          'has-[:checked]:shadow-[0_0_0_3px_rgba(217,119,6,0.10)]',
          'has-[:focus-visible]:shadow-[0_0_0_3px_rgba(217,119,6,0.18)]',
          'has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed',
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          className="peer sr-only"
          {...props}
        />

        {/* Custom dot indicator */}
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 shrink-0 inline-flex items-center justify-center',
            'size-5 rounded-full',
            'border-[1.5px] border-ghost-border bg-pure-surface',
            'transition-colors duration-150',
            'peer-checked:border-warm-amber peer-checked:bg-warm-amber'
          )}
        >
          <span className="size-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity" />
        </span>

        {icon && <span className="shrink-0 text-muted-steel mt-0.5">{icon}</span>}

        <span className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-body font-medium text-charcoal-ink">{label}</span>
          {description && (
            <span className="text-body-small text-muted-steel">{description}</span>
          )}
        </span>

        {badge && (
          <span className="shrink-0 self-start">{badge}</span>
        )}
      </label>
    );
  }
);

RadioCard.displayName = 'RadioCard';
