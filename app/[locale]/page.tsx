'use client';

import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import Feature283 from '@/components/shadcnblocks/feature-283';
import FeaturedBrandsStrip from '@/components/shadcnblocks/featured-brands-strip';
import LiveFeed from '@/components/shadcnblocks/live-feed';
import BackgroundPattern115 from '@/components/shadcnblocks/background-pattern-115';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';

export default function HomePage() {
  return (
    <>
      <EcommerceNavbar1 />
      <Feature283 />
      <FeaturedBrandsStrip />
      <LiveFeed />
      <BackgroundPattern115 />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
