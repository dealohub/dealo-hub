import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import Feature283 from '@/components/shadcnblocks/feature-283';
import FeaturedBrandsStrip from '@/components/shadcnblocks/featured-brands-strip';
import AIProtectionStrip from '@/components/shadcnblocks/ai-protection-strip';
import LiveFeed from '@/components/shadcnblocks/live-feed';
import { FeaturedPartnersSection } from '@/components/shadcnblocks/live-feed-parts';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import BackgroundPattern115 from '@/components/shadcnblocks/background-pattern-115';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { getHeroListings, getLiveFeedListings } from '@/lib/landing/queries';
import { ACTIVITY_SIGNALS } from '@/lib/landing/constants';

/**
 * Landing page — pre-auth marketplace homepage.
 *
 * Dynamic sections (Feature283 hero scatters + LiveFeed cards) are
 * server-fetched here and passed down as props. The rest are
 * editorial (brands strip, AI protection, partners, footer).
 *
 * ISR: each locale-variant renders on-demand and caches for 60s,
 * matching the rides pages.
 */
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const locale = params.locale;

  const [heroImages, feedListings] = await Promise.all([
    getHeroListings({ limit: 6, locale }),
    getLiveFeedListings({ limit: 8, locale }),
  ]);

  return (
    <>
      <EcommerceNavbar1 />
      {/*
        BackgroundPattern115 is authored as a backdrop wrapper (accepts
        children; PatternPlaceholder is just the demo default). The handoff
        rendered it standalone at the bottom purely as a showcase. Real
        placement: use it as the hero backdrop behind Feature283.
      */}
      <BackgroundPattern115 className="!min-h-0">
        <Feature283 images={heroImages} />
      </BackgroundPattern115>
      <FeaturedBrandsStrip />
      <AIProtectionStrip />
      <LiveFeed initialFeed={feedListings} activitySignals={ACTIVITY_SIGNALS} />
      <FeaturedPartnersSection />
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
