'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Checkbox — Radix-based checkbox primitive.
 *
 * Default size 20×20 (≥16px mobile, comfortable on touch). `size="lg"` = 24×24
 * for primary consent rows (terms, authenticity statement).
 */

const checkboxVariants = cva(
  [
    'peer inline-flex shrink-0 items-center justify-center',
    'rounded-[5px] border-[1.5px]',
    'transition-[background,border,box-shadow] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'bg-pure-surface border-ghost-border',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
    'data-[state=checked]:bg-warm-amber data-[state=checked]:border-warm-amber data-[state=checked]:text-white',
    'data-[state=indeterminate]:bg-warm-amber data-[state=indeterminate]:border-warm-amber',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[invalid=true]:border-danger-coral',
  ],
  {
    variants: {
      size: {
        md: 'size-5',
        lg: 'size-6',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface CheckboxProps
  extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className={cn(size === 'lg' ? 'size-4' : 'size-3.5')} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
);

Checkbox.displayName = 'Checkbox';
