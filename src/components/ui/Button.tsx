import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button — core primitive (DESIGN.md Section 5).
 *
 * Variants:
 *   primary     → amber background, white text (default CTA)
 *   secondary   → white background, zinc border
 *   ghost       → transparent, hover zinc-100
 *   destructive → red background, white text
 *
 * Sizes:
 *   sm  → 36px tall
 *   md  → 40px tall (default)
 *   lg  → 48px tall (hero CTAs)
 *   icon → 40x40 square
 */

const buttonVariants = cva(
  // Base — shared across all variants
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-semibold rounded-lg',
    'transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'active:translate-y-[1px] active:scale-[0.99]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-warm-amber text-white',
          'hover:bg-warm-amber-700',
          // NO outer glow — banned per DESIGN.md Section 22
        ],
        secondary: [
          'bg-pure-surface border-[1.5px] border-zinc-200 text-charcoal-ink',
          'hover:bg-zinc-50 hover:border-zinc-300',
        ],
        ghost: [
          'bg-transparent text-muted-steel',
          'hover:bg-zinc-100 hover:text-charcoal-ink',
        ],
        destructive: [
          'bg-danger-coral text-white',
          'hover:bg-red-700',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-body-small',
        md: 'h-10 px-5 text-body',
        lg: 'h-12 px-6 text-body-large',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);

Button.displayName = 'Button';
