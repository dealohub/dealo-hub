'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * RidesHeader — compact editorial header for the /rides page.
 * Breadcrumb + title + subtitle. No hero; this is a browse page,
 * the user is here to scan listings, not read marketing copy.
 */

export const RidesHeader = () => {
  const t = useTranslations('marketplace.rides.header');

  return (
    <header className="relative w-full border-b border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[12px] text-foreground/55">
          <a href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft size={12} className="rtl:rotate-180" />
            {t('breadcrumbHome')}
          </a>
          <span className="text-foreground/25">/</span>
          <span className="font-medium text-foreground/85">{t('breadcrumbCurrent')}</span>
        </nav>

        {/* Title + subtitle */}
        <h1 className="font-calSans text-[40px] font-extrabold leading-none tracking-tight text-foreground md:text-[56px]">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-foreground/60 md:text-base">
          {t('subtitle')}
        </p>
      </div>
    </header>
  );
};

export default RidesHeader;
