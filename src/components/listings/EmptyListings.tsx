import { Link } from '@/i18n/routing';
import { PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyListingsProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}

/**
 * Empty state for browse / category / search / saved pages.
 *
 * Uses a single lucide icon instead of a bespoke illustration — keeps bundle
 * lean and feel consistent with the rest of the chrome.
 */
export function EmptyListings({ title, description, action, className }: EmptyListingsProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        'bg-pure-surface border border-ghost-border rounded-2xl',
        className
      )}
    >
      <span className="flex items-center justify-center size-14 rounded-2xl bg-warm-amber/10 text-warm-amber-700">
        <PackageSearch className="size-7" strokeWidth={1.75} />
      </span>
      <h3 className="text-heading-2 font-semibold text-charcoal-ink">{title}</h3>
      <p className="text-body text-muted-steel max-w-md">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex h-10 items-center rounded-xl bg-charcoal-ink px-5 text-body-small font-medium text-white hover:bg-charcoal-ink/90 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
