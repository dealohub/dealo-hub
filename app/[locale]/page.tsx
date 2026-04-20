'use client';

import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import Feature283 from '@/components/shadcnblocks/feature-283';
import FeaturedBrandsStrip from '@/components/shadcnblocks/featured-brands-strip';
import LiveFeed from '@/components/shadcnblocks/live-feed';
import BackgroundPattern115 from '@/components/shadcnblocks/background-pattern-115';
// Experimental: category coasters row. Remove this import + the usage
// below to revert the landing page to its prior state.
import CategoryCoasters from '@/components/shadcnblocks/category-coasters';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';

export default function HomePage() {
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
        <Feature283 />
      </BackgroundPattern115>
      {/* Experimental: delete the next line to revert. */}
      <CategoryCoasters />
      <FeaturedBrandsStrip />
      <LiveFeed />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
