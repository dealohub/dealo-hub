import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Input — base text-field primitive (DESIGN.md Section 5 + Section 22).
 *
 * Behavior:
 *   - Labels live ABOVE input (use <Label>); no floating labels.
 *   - Focus ring: amber 2px + 2px offset on the wrapper via `focus:` utilities.
 *   - Error state: danger-coral border + aria-invalid driven by `error` prop.
 *   - Disabled/loading: 60% opacity + not-allowed cursor.
 *
 * Sizes:
 *   md → 48px tall (default, matches touch-target on mobile).
 *   sm → 40px tall (compact forms).
 */

const inputVariants = cva(
  [
    'w-full rounded-xl',
    'bg-pure-surface border-[1.5px] border-ghost-border',
    'text-charcoal-ink placeholder:text-muted-steel',
    'transition-[border,box-shadow,background] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'focus:outline-none focus:border-warm-amber',
    'focus:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    'read-only:bg-canvas-zinc',
  ],
  {
    variants: {
      size: {
        md: 'h-12 px-4 text-body',
        sm: 'h-10 px-3 text-body-small',
      },
      error: {
        true: 'border-danger-coral focus:border-danger-coral focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Renders the input in danger-coral error state + sets aria-invalid. */
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, type = 'text', inputMode, ...props }, ref) => {
    // Western digits always (DESIGN.md Section 22 — no Arabic-Indic).
    const resolvedInputMode =
      inputMode ?? (type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'number' ? 'numeric' : undefined);

    return (
      <input
        ref={ref}
        type={type}
        inputMode={resolvedInputMode}
        // `latn` keeps numeric keyboards showing Western digits on Arabic locale.
        lang="en"
        dir={type === 'email' || type === 'tel' || type === 'password' ? 'ltr' : undefined}
        aria-invalid={error || undefined}
        className={cn(inputVariants({ size, error }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
