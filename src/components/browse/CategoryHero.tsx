import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/format';
import type { Locale } from '@/i18n/routing';

interface CategoryHeroProps {
  nameAr: string;
  nameEn: string;
  count: number;
  breadcrumb?: { nameAr: string; nameEn: string; slug: string };
  className?: string;
}

export function CategoryHero({ nameAr, nameEn, count, breadcrumb, className }: CategoryHeroProps) {
  const t = useTranslations('browse.category');
  const locale = useLocale() as Locale;
  const name = locale === 'ar' ? nameAr : nameEn;
  const crumbName = breadcrumb ? (locale === 'ar' ? breadcrumb.nameAr : breadcrumb.nameEn) : null;

  return (
    <section
      className={cn(
        'border-b border-whisper-divider bg-gradient-to-b from-warm-amber/5 to-transparent',
        className
      )}
    >
      <div className="container py-10 sm:py-14">
        {crumbName && (
          <p className="text-body-small text-muted-steel mb-3">{crumbName}</p>
        )}
        <h1 className="text-display font-bold text-charcoal-ink tracking-tight">
          {name}
        </h1>
        <p className="mt-3 text-body-large text-muted-steel">
          {t('resultCount', { count: formatCount(count, locale) })}
        </p>
      </div>
    </section>
  );
}
