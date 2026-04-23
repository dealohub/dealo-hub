import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import RidesHeroSplit from '@/components/shadcnblocks/rides-hero-split';
import RidesBrandPartners from '@/components/shadcnblocks/rides-brand-partners';
import RidesShopByStyle from '@/components/shadcnblocks/rides-shop-by-style';
import RidesAdBanner from '@/components/shadcnblocks/rides-ad-banner';
import RidesBestOf2026 from '@/components/shadcnblocks/rides-best-of-2026';
import RidesFeaturedPremium from '@/components/shadcnblocks/rides-featured-premium';
import RidesMainGrid from '@/components/shadcnblocks/rides-main-grid';
import RidesFinanceBanner from '@/components/shadcnblocks/rides-finance-banner';
import RidesArticlesStrip from '@/components/shadcnblocks/rides-articles-strip';
import RidesDealerSpotlight from '@/components/shadcnblocks/rides-dealer-spotlight';
import {
  getFeaturedRides,
  getRidesForGrid,
  getRideTypeCounts,
} from '@/lib/rides/queries';

/**
 * /rides — unified vehicle marketplace hub.
 *
 * Sections (top → bottom):
 *   1. Navbar
 *   2. Hero split (search card + sponsored dealer spotlight) — editorial
 *   3. Brand partners marquee — editorial
 *   4. Shop by Style (circular type tiles) — editorial
 *   5. Native ad banner (Dealo Pro sponsored) — editorial
 *   6. Best Rides of 2026 (editorial award block) — editorial
 *   7. Featured Premium — DB-backed (getFeaturedRides)
 *   8. Main browse grid — DB-backed (getRidesForGrid + getRideTypeCounts)
 *   9. Latest from our experts (articles strip) — editorial
 *  10. Top verified dealers (directory) — editorial
 *  11. Footer
 *
 * The hub's dynamic sections are pre-fetched server-side and passed
 * down as props. The main grid stays client-side for filter / sort /
 * load-more interactivity (client-side slicing of the pre-fetched set,
 * which is fine for V1 inventory volume).
 *
 * ISR: reuse the detail-page default — 60s cache on the rendered HTML.
 */
export const revalidate = 60;

export default async function RidesPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const locale = params.locale;

  const [featured, grid, typeCounts] = await Promise.all([
    getFeaturedRides({ limit: 4, locale }),
    // V1: fetch all non-featured listings up to a safe ceiling for client
    // filtering. Swap to server-side pagination when volume grows.
    getRidesForGrid({
      sortBy: 'relevance',
      limit: 200,
      offset: 0,
      locale,
    }),
    getRideTypeCounts({ locale }),
  ]);

  return (
    <>
      <EcommerceNavbar1 />
      <RidesHeroSplit />
      <RidesBrandPartners />
      <RidesShopByStyle />
      <RidesAdBanner />
      <RidesBestOf2026 />
      <RidesFeaturedPremium items={featured} />
      <RidesMainGrid items={grid.items} typeCounts={typeCounts} />
      <RidesFinanceBanner />
      <RidesArticlesStrip />
      <RidesDealerSpotlight />
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
