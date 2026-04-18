import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Label — form label primitive.
 *
 * Always above its input (no floating). Required indicator uses muted-steel
 * asterisk (NOT red per DESIGN.md Section 22 — red is reserved for real errors).
 */

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-body-small font-medium text-charcoal-ink',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ms-1 text-muted-steel" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);

Label.displayName = 'Label';
