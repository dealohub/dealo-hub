import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { PropertyCard } from '@/lib/properties/types';
import ListingCardProperties from './listing-card-properties';

/**
 * Properties hub — featured premium row.
 *
 * Displays the top 6 featured properties, ordered by
 * verification_tier DESC then published_at DESC (via query).
 * Explicit "Hand-picked by our inspection team" framing — not
 * algorithmic — aligned with AI-assisted (not AI-first) doctrine.
 */

interface Props {
  featured: PropertyCard[];
  locale: 'ar' | 'en';
}

export default function PropertiesFeaturedPremium({ featured, locale }: Props) {
  const t = useTranslations('marketplace.properties.hub.featured');

  if (featured.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/5 via-transparent to-transparent py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              {t('eyebrow')}
            </p>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">{t('subline')}</p>
          </div>
          <Link
            href={`/${locale}/properties?featured=1`}
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-foreground/70 transition hover:text-foreground sm:inline-flex"
          >
            {t('viewAll')}
            <ArrowRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((card, i) => (
            <ListingCardProperties
              key={card.id}
              card={card}
              locale={locale}
              priority={i < 3}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
