import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { WizardStep } from '@/lib/listings/draft';
import WizardStepIndicator from './step-indicator';

/**
 * WizardShell — shared chrome for every step of /sell/*.
 *
 * Renders:
 *   - Top bar: logo (back home) + exit CTA (back to /my-listings or home)
 *   - Step indicator
 *   - Step title + subtitle (pulled from sell.steps.{step} i18n)
 *   - Children slot (the step's form)
 *
 * Server component — no interactivity in the shell itself. Each step
 * renders its own client form inside `children`.
 */

interface Props {
  locale: 'ar' | 'en';
  step: WizardStep;
  children: React.ReactNode;
  hideLuxury?: boolean;
}

export default async function WizardShell({ locale, step, children, hideLuxury }: Props) {
  const t = await getTranslations({ locale, namespace: `sell.steps.${step}` });
  const tNav = await getTranslations({ locale, namespace: 'sell.nav' });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition hover:text-foreground"
          >
            <Image
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg"
              alt="Dealo Hub"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span>Dealo Hub</span>
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1 text-xs text-foreground/60 transition hover:text-foreground"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            {tNav('back')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Step indicator */}
        <div className="mb-8 overflow-x-auto pb-2">
          <WizardStepIndicator currentStep={step} hideLuxury={hideLuxury} />
        </div>

        {/* Step title */}
        <div className="mb-6 space-y-1.5">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h1>
          <p className="text-sm leading-relaxed text-foreground/60">
            {t('subtitle')}
          </p>
        </div>

        {/* Step body */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
