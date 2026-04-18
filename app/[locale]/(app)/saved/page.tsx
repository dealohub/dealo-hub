import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { EmptyListings } from '@/components/listings/EmptyListings';
import type { ListingCardData } from '@/components/listings/ListingCard';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'saved' });
  return { title: t('metaTitle') };
}

export default async function SavedPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as Locale;
  const t = await getTranslations({ locale, namespace: 'saved' });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/signin`);

  const { data } = await supabase
    .from('favorites')
    .select(
      `
      created_at,
      listing:listings!inner (
        id, title, price_minor_units, currency_code, price_mode, min_offer_minor_units,
        country_code, created_at, save_count, authenticity_confirmed, category_id, status,
        listing_images ( url, thumb_url, medium_url, position ),
        listing_videos ( id ),
        profiles:seller_id ( id, display_name, handle, avatar_url, phone_verified_at ),
        cities:city_id ( id, name_ar, name_en ),
        areas:area_id ( id, name_ar, name_en )
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows: ListingCardData[] = (data ?? [])
    .map((row: any) => {
      const listing = row.listing;
      if (!listing || listing.status !== 'live') return null;
      const images = (listing.listing_images ?? []).sort(
        (a: any, b: any) => a.position - b.position
      );
      const cover = images[0];
      const profile = listing.profiles;
      const city = listing.cities;
      const area = listing.areas;
      return {
        id: listing.id,
        title: listing.title,
        priceMode: listing.price_mode,
        priceMinorUnits:
          typeof listing.price_minor_units === 'string'
            ? BigInt(listing.price_minor_units)
            : listing.price_minor_units,
        currencyCode: listing.currency_code,
        minOfferMinorUnits:
          listing.min_offer_minor_units == null
            ? null
            : typeof listing.min_offer_minor_units === 'string'
              ? BigInt(listing.min_offer_minor_units)
              : listing.min_offer_minor_units,
        coverUrl: cover?.medium_url ?? cover?.url ?? null,
        imageCount: images.length,
        hasVideo: (listing.listing_videos?.length ?? 0) > 0,
        areaName: area ? (locale === 'ar' ? area.name_ar : area.name_en) : null,
        cityName: city ? (locale === 'ar' ? city.name_ar : city.name_en) : null,
        createdAt: listing.created_at,
        saveCount: listing.save_count,
        categorySlug: null,
        isAuthenticityConfirmed: !!listing.authenticity_confirmed,
        seller: {
          id: profile?.id ?? '',
          displayName: profile?.display_name ?? '—',
          handle: profile?.handle ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          isPhoneVerified: !!profile?.phone_verified_at,
        },
      } as ListingCardData;
    })
    .filter((row): row is ListingCardData => row !== null);

  const savedIds = new Set(rows.map(r => r.id));

  return (
    <div className="container py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-heading-1 font-semibold text-charcoal-ink">{t('title')}</h1>
        <p className="mt-1 text-body text-muted-steel">
          {t('subtitle', { count: rows.length })}
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyListings
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={{ label: t('browseAction'), href: '/categories' }}
        />
      ) : (
        <ListingGrid listings={rows} locale={locale} savedIds={savedIds} />
      )}
    </div>
  );
}
