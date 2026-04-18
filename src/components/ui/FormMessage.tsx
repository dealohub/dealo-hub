import type { HTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FormMessage — inline help / error / success text for form fields.
 *
 * Tone variants:
 *   error   → AlertCircle icon + danger-coral text, role="alert"
 *   help    → Info icon + muted-steel text
 *   success → CheckCircle2 + success-sage text, role="status"
 */

type Tone = 'error' | 'help' | 'success';

interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: Tone;
}

const toneStyles: Record<Tone, string> = {
  error: 'text-danger-coral',
  help: 'text-muted-steel',
  success: 'text-success-sage',
};

const toneIcons: Record<Tone, typeof AlertCircle> = {
  error: AlertCircle,
  help: Info,
  success: CheckCircle2,
};

export function FormMessage({
  tone = 'help',
  className,
  children,
  ...props
}: FormMessageProps) {
  if (!children) return null;

  const Icon = toneIcons[tone];
  const role = tone === 'error' ? 'alert' : tone === 'success' ? 'status' : undefined;

  return (
    <p
      role={role}
      className={cn(
        'flex items-start gap-1.5 text-body-small',
        toneStyles[tone],
        className
      )}
      {...props}
    >
      <Icon className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
