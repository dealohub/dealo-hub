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
import { getLiveFeedListings, pickBalancedHero } from '@/lib/landing/queries';
import { ACTIVITY_SIGNALS } from '@/lib/landing/constants';
import { verticalPathForFeedCat, type HeroImage } from '@/lib/landing/types';

/**
 * Landing page — pre-auth marketplace homepage.
 *
 * Dynamic surfaces (Feature283 hero scatters + LiveFeed cards) share
 * a single `getLiveFeedListings` call so the listings teased at the
 * top are literally the same ones in the feed below. Each hero image
 * links into the underlying listing's detail page.
 *
 * Editorial sections (brands strip, AI protection, partners, footer)
 * stay hardcoded per Q3-locked strategy.
 *
 * ISR: each locale-variant renders on-demand and caches for 60s,
 * matching the rides pages.
 */
export const revalidate = 60;

export default async function HomePage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const locale = params.locale;

  // One query serves both the hero scatters and the feed. Single
  // source of truth. We over-fetch (limit: 18) so pickBalancedHero
  // sees enough per-vertical depth to keep the hero cross-vertical
  // even if one vertical has a recent seed burst (the 2026-04-22
  // electronics cluster is exactly what this guards against).
  //
  // Why 18 and not 12: the `coverUrl` filter in mapFeedRow drops
  // rows without an image *after* the LIMIT lands, so 18 gives
  // roughly 3× headroom over the hero need of 6. If sparse cover
  // coverage becomes common (real user listings without images),
  // bump this. LiveFeed only needs the first 8 so headroom for it
  // is trivially satisfied.
  const feed = await getLiveFeedListings({ limit: 18, locale });

  const heroImages: HeroImage[] = pickBalancedHero(feed, 6).map((item) => ({
    src: item.image,
    alt: item.title,
    // Vertical-aware routing — Phase 5f. Routes property listings to
    // /properties/<slug>, automotive to /rides/<slug>, electronics
    // to /tech/<slug> (Phase 7 v2).
    href: verticalPathForFeedCat(locale, item.cat, item.slug),
    listingSlug: item.slug,
  }));

  // LiveFeed stays chronological — it's an activity strip, newest-first
  // is the correct semantic regardless of vertical distribution.
  const initialFeed = feed.slice(0, 8);

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
      <LiveFeed initialFeed={initialFeed} activitySignals={ACTIVITY_SIGNALS} />
      <FeaturedPartnersSection />
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
