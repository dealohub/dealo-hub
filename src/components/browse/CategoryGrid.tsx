import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import {
  Smartphone,
  Sofa,
  Gem,
  Baby,
  Gamepad2,
  Mountain,
  Dumbbell,
  Utensils,
  Sparkles,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES, type Category, type LucideIconName } from '@/lib/categories';
import type { Locale } from '@/i18n/routing';

const ICON_MAP: Record<LucideIconName, typeof Smartphone> = {
  Smartphone,
  Sofa,
  Gem,
  Baby,
  Gamepad2,
  Mountain,
  Dumbbell,
  Utensils,
  Sparkles,
  Package,
};

/**
 * Marketplace category index — editorial bento-ish grid.
 *
 * Tier p0 = large (col-span-2) cards on lg+. p1 = single. p2 = compact.
 * This mirrors the 4+4+2 asymmetric pattern from DESIGN.md Section 11.
 */
export function CategoryGrid({ className }: { className?: string }) {
  const locale = useLocale() as Locale;

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4', className)}>
      {CATEGORIES.map(cat => (
        <CategoryCard key={cat.slug} category={cat} locale={locale} />
      ))}
    </div>
  );
}

function CategoryCard({ category, locale }: { category: Category; locale: Locale }) {
  const Icon = ICON_MAP[category.icon as LucideIconName] ?? Package;
  const name = locale === 'ar' ? category.nameAr : category.nameEn;

  const span =
    category.tier === 'p0'
      ? 'col-span-2 md:col-span-2 lg:col-span-2 row-span-2'
      : category.tier === 'p1'
        ? 'col-span-1 md:col-span-2 lg:col-span-2'
        : 'col-span-1 md:col-span-2 lg:col-span-2';

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-pure-surface border border-ghost-border',
        'p-5 sm:p-6',
        'flex flex-col justify-between gap-6',
        'transition-all duration-200',
        'hover:shadow-category hover:-translate-y-0.5 hover:border-zinc-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
        category.tier === 'p0' ? 'min-h-[220px] sm:min-h-[280px]' : 'min-h-[140px]',
        span
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl',
          'bg-warm-amber/10 text-warm-amber-700',
          'transition-transform duration-300 group-hover:scale-110',
          category.tier === 'p0' ? 'size-14' : 'size-11'
        )}
        aria-hidden="true"
      >
        <Icon
          className={cn(category.tier === 'p0' ? 'size-7' : 'size-6')}
          strokeWidth={1.75}
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3
          className={cn(
            'font-semibold text-charcoal-ink',
            category.tier === 'p0' ? 'text-heading-1' : 'text-heading-3'
          )}
        >
          {name}
        </h3>
        <span className="text-body-small text-muted-steel">
          {category.subCategories.length}
        </span>
      </div>
    </Link>
  );
}
