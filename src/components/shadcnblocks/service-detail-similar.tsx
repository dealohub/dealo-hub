import { getTranslations } from 'next-intl/server';
import ListingCardServices from './listing-card-services';
import type { ServiceCard } from '@/lib/services/types';

/**
 * Phase 8a — similar services strip at the bottom of the detail page.
 * Reuses listing-card-services for DRY. Hidden when fewer than 2 peers.
 */

interface Props {
  services: ServiceCard[];
  locale: 'ar' | 'en';
}

export default async function ServiceDetailSimilar({ services, locale }: Props) {
  const t = await getTranslations('servicesDetail.similar');
  if (services.length < 2) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-foreground">
        {t('title')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((card) => (
          <ListingCardServices key={card.id} card={card} locale={locale} />
        ))}
      </div>
    </section>
  );
}
