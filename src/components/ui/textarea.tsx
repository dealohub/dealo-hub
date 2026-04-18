import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Textarea — multi-line input primitive.
 *
 * Mirrors <Input> styling (border, amber focus ring, danger-coral error state).
 * Auto-grow is caller's responsibility via `rows` + `resize-y` default.
 */

const textareaVariants = cva(
  [
    'w-full rounded-xl resize-y',
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
        md: 'min-h-[120px] px-4 py-3 text-body',
        sm: 'min-h-[80px] px-3 py-2 text-body-small',
      },
      error: {
        true: 'border-danger-coral focus:border-danger-coral focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]',
        false: '',
      },
    },
    defaultVariants: { size: 'md', error: false },
  }
);

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, error, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(textareaVariants({ size, error }), className)}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
