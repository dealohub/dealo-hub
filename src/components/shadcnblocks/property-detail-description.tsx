import { useTranslations } from 'next-intl';
import { DoorOpen, Bath, Utensils, LogIn } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';

/**
 * Property detail — description + structured diwaniya (P14).
 *
 * Two tightly-coupled sections rendered as one card:
 *
 *   1. Bilingual description blurb (seller's own words, locale-picked
 *      by the query layer). If the `title_ar` or `title_en` alternate
 *      exists, we show a small "View [other locale]" toggle — Phase 4c.
 *
 *   2. Diwaniya (structured). Only renders when the listing has a
 *      diwaniya AND present=true. The 4 attributes (present +
 *      separate_entrance + has_bathroom + has_kitchenette) are shown
 *      as 4 icon chips. This is a Dealo differentiator — Dubizzle
 *      treats diwaniya as free-text.
 */

interface Props {
  listing: PropertyDetail;
  locale: 'ar' | 'en';
}

export default function PropertyDetailDescription({ listing, locale: _locale }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const d = listing.fields.diwaniya;

  return (
    <section className="space-y-6 rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      {/* Description */}
      <div>
        <h2 className="mb-3 font-sans text-xl font-semibold tracking-tight text-foreground">
          {t('descriptionTitle')}
        </h2>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
          {listing.description}
        </p>
        <p className="mt-3 text-xs text-foreground/50">
          {t('describedBy', { name: listing.seller.displayName })}
        </p>
      </div>

      {/* Diwaniya — structured (P14) */}
      {d?.present && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <DoorOpen size={16} className="text-amber-500" strokeWidth={2.25} />
            <h3 className="text-sm font-semibold text-foreground">
              {t('diwaniyaTitle')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip
              icon={<DoorOpen size={12} />}
              label={t('diwaniyaPresent')}
              active
            />
            {d.separateEntrance && (
              <Chip
                icon={<LogIn size={12} />}
                label={t('diwaniyaSeparateEntrance')}
                active
              />
            )}
            {d.hasBathroom && (
              <Chip icon={<Bath size={12} />} label={t('diwaniyaHasBathroom')} active />
            )}
            {d.hasKitchenette && (
              <Chip
                icon={<Utensils size={12} />}
                label={t('diwaniyaHasKitchenette')}
                active
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
        (active
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          : 'bg-foreground/5 text-foreground/50')
      }
    >
      {icon}
      {label}
    </span>
  );
}
