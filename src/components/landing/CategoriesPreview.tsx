import { useLocale, useTranslations } from 'next-intl';
import { CATEGORIES, getLocalizedName } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

/**
 * CategoriesPreview — 10-category grid (DESIGN.md Section 11).
 *
 * Asymmetric 4+4+2 grid:
 *   Row 1: 4 P0 cards (taller, feature icons)
 *   Row 2: 4 P1 cards (square)
 *   Row 3: 2 P2 cards (wide, half-width each)
 */
export function CategoriesPreview() {
  const t = useTranslations('landing.categories');
  const locale = useLocale() as Locale;

  return (
    <section className="py-section">
      <div className="container">
        {/* Section header */}
        <div className="flex flex-col gap-3 mb-10 max-w-2xl">
          <span className="typo-label text-muted-steel">{t('eyebrow')}</span>
          <h2 className="text-display font-bold text-charcoal-ink">{t('heading')}</h2>
          <p className="text-body-large text-muted-steel">{t('subheading')}</p>
        </div>

        {/* Grid: 4 + 4 + 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {CATEGORIES.map(category => {
            const Icon = getCategoryIcon(category.icon);
            const name = getLocalizedName(category, locale);

            return (
              <article
                key={category.slug}
                className={cn(
                  'group relative flex flex-col justify-end',
                  'p-4 sm:p-5 rounded-2xl overflow-hidden',
                  'bg-pure-surface border border-ghost-border',
                  'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                  'hover:-translate-y-1 hover:border-warm-amber/40',
                  'hover:shadow-category',
                  // Tier-based sizing
                  category.tier === 'p0' && 'aspect-[4/5] min-h-[160px]',
                  category.tier === 'p1' && 'aspect-square',
                  category.tier === 'p2' && 'aspect-[2/1] col-span-2 sm:col-span-2'
                )}
              >
                {/* Background icon — large, faint */}
                <Icon
                  className="
                    absolute top-4 start-4
                    size-12 sm:size-14 text-warm-amber/10
                    group-hover:text-warm-amber/20
                    transition-colors duration-300
                    pointer-events-none
                  "
                  strokeWidth={1.5}
                  aria-hidden="true"
                />

                {/* Foreground content */}
                <div className="relative flex flex-col gap-0.5">
                  <h3 className="text-heading-3 font-semibold text-charcoal-ink">{name}</h3>
                  <p className="text-caption text-muted-steel tabular-nums font-mono-data">
                    {category.seedTarget}+ {t('listingsSoon')}
                  </p>
                </div>

                {/* Tier pill — top end corner */}
                {category.tier === 'p0' && (
                  <span className="absolute top-3 end-3 typo-label text-warm-amber">
                    ★
                  </span>
                )}
              </article>
            );
          })}
        </div>

        {/* Footnote */}
        <p className="mt-8 text-body-small text-muted-steel text-center max-w-2xl mx-auto">
          {t('footnote')}
        </p>
      </div>
    </section>
  );
}
