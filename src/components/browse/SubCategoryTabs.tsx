'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

interface SubCategory {
  slug: string;
  name_ar: string;
  name_en: string;
}

interface SubCategoryTabsProps {
  parentSlug: string;
  subCategories: SubCategory[];
  activeSubSlug?: string;
}

export function SubCategoryTabs({
  parentSlug,
  subCategories,
  activeSubSlug,
}: SubCategoryTabsProps) {
  const locale = useLocale() as Locale;

  if (subCategories.length === 0) return null;

  const base = `/categories/${parentSlug}`;

  return (
    <nav
      aria-label="sub-categories"
      className="border-b border-whisper-divider bg-pure-surface sticky top-16 z-20"
    >
      <div className="container overflow-x-auto">
        <ul className="flex items-center gap-1 min-w-max py-2">
          <Tab href={base} active={!activeSubSlug} label={{ ar: 'الكل', en: 'All' }[locale]} />
          {subCategories.map(sub => (
            <Tab
              key={sub.slug}
              href={`${base}/${sub.slug}`}
              active={activeSubSlug === sub.slug}
              label={locale === 'ar' ? sub.name_ar : sub.name_en}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'inline-flex items-center h-10 px-4 rounded-lg text-body-small font-medium transition-colors',
          'border-b-2 -mb-px',
          active
            ? 'border-warm-amber text-charcoal-ink'
            : 'border-transparent text-muted-steel hover:text-charcoal-ink'
        )}
      >
        {label}
      </Link>
    </li>
  );
}
