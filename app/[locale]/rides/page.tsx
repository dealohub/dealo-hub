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

/**
 * /rides — unified vehicle marketplace hub.
 *
 * Sections (top → bottom):
 *   1. Navbar
 *   2. Hero split (search card + sponsored dealer spotlight)
 *   3. Shop by Style (circular type tiles)
 *   4. Native ad banner (Dealo Pro sponsored)
 *   5. Best Rides of 2026 (editorial award block)
 *   6. Featured Premium listings (paid dealer placements, 4-card row)
 *   7. Main browse grid (sort + sub-type chips + uniform grid + load more)
 *   8. Latest from our experts (articles strip)
 *   9. Top verified dealers (directory)
 *   10. Footer
 *
 * Server component — client bits (state, interactivity) live inside
 * each section component, all marked 'use client' where needed.
 */
export default function RidesPage() {
  return (
    <>
      <EcommerceNavbar1 />
      <RidesHeroSplit />
      <RidesBrandPartners />
      <RidesShopByStyle />
      <RidesAdBanner />
      <RidesBestOf2026 />
      <RidesFeaturedPremium />
      <RidesMainGrid />
      <RidesFinanceBanner />
      <RidesArticlesStrip />
      <RidesDealerSpotlight />
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
