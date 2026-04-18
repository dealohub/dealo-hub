import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Nav } from '@/components/layout/Nav';
import { createClient } from '@/lib/supabase/server';
import { PriceModeBadge } from '@/components/sell/PriceModeBadge';

/**
 * /listings/[id] — minimal publish-success landing.
 *
 * BRIEF-005 will build the real detail page. For now this is just enough
 * for the publish redirect to land somewhere readable.
 */
export default async function ListingDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const supabase = createClient();
  const { data: listing } = await supabase
    .from('listings')
    .select(
      'id, title, description, price_minor_units, price_mode, status, created_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (!listing) notFound();

  const { data: images } = await supabase
    .from('listing_images')
    .select('url, position')
    .eq('listing_id', id)
    .order('position', { ascending: true });

  const t = await getTranslations({
    locale: params.locale,
    namespace: 'listing.publishSuccess',
  });

  return (
    <>
      <Nav />
      <main className="container max-w-2xl py-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-success-sage/5 border border-success-sage/25">
            <CheckCircle2 className="size-5 text-success-sage mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-body font-medium text-charcoal-ink">{t('title')}</p>
              <p className="text-body-small text-muted-steel">{t('subtitle')}</p>
            </div>
          </div>

          {images && images.length > 0 && (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-whisper-divider bg-canvas-zinc">
              <Image
                src={images[0].url}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <h1 className="text-heading-1 text-charcoal-ink">{listing.title}</h1>

          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="text-display font-mono tabular-nums text-charcoal-ink"
              lang="en"
            >
              {(listing.price_minor_units / 1000).toLocaleString('en-US')} KWD
            </span>
            <PriceModeBadge mode={listing.price_mode} size="md" />
          </div>

          <p className="text-body text-charcoal-ink whitespace-pre-line">
            {listing.description}
          </p>

          <div className="pt-4 flex items-center gap-2">
            <Link href="/my-listings">
              <Button variant="secondary" size="md">
                {t('myListings')}
              </Button>
            </Link>
            <Link href="/sell">
              <Button variant="ghost" size="md">
                {t('sellAnother')}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
