import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Construction } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { WizardShell } from '@/components/sell/WizardShell';
import { getCurrentDraft, getCategoriesWithSubs } from '@/lib/listings/queries';
import type { WizardStep } from '@/lib/listings/draft';

/**
 * Placeholder used by Steps 2–8 until their real forms ship in BRIEF-003 session 2.
 * Renders the wizard shell + a clear "coming soon" message so the route resolves.
 */
export async function StepStub({
  step,
  locale,
  title,
  subtitle,
  children,
}: {
  step: WizardStep;
  locale: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const [t, draft, categories] = await Promise.all([
    getTranslations({ locale, namespace: 'sell.stub' }),
    getCurrentDraft(),
    getCategoriesWithSubs(),
  ]);
  const selectedParent = categories.find(c => c.id === draft?.category_id);
  const includeAuthenticity = selectedParent?.requires_auth_statement ?? false;

  return (
    <WizardShell
      step={step}
      title={title}
      subtitle={subtitle}
      includeAuthenticity={includeAuthenticity}
    >
      <div
        className="
          flex flex-col items-start gap-4 p-6 rounded-2xl
          border border-dashed border-ghost-border bg-pure-surface
        "
      >
        <span
          className="
            inline-flex items-center justify-center size-10 rounded-xl
            bg-warm-amber/10 text-warm-amber-700
          "
          aria-hidden="true"
        >
          <Construction className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-heading-3 text-charcoal-ink">{t('title')}</h2>
          <p className="text-body text-muted-steel">{t('subtitle')}</p>
        </div>
        {children}
        <Link href="/sell/category">
          <Button variant="secondary" size="sm">
            {t('backToCategory')}
          </Button>
        </Link>
      </div>
    </WizardShell>
  );
}
