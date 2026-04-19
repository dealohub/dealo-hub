'use client';

import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import Feature283 from '@/components/shadcnblocks/feature-283';
import FeaturedBrandsStrip from '@/components/shadcnblocks/featured-brands-strip';
import LiveFeed from '@/components/shadcnblocks/live-feed';
import BackgroundPattern115 from '@/components/shadcnblocks/background-pattern-115';
import ThemeToggle from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <>
      <EcommerceNavbar1 />
      <Feature283 />
      {/*
        FeaturedBrandsStrip + LiveFeed are authored dark-only in the handoff
        (hardcoded text-white / bg-white/X classes). We scope them to a .dark
        subtree so they always render in dark mode, regardless of the root
        theme. Nav + hero + pattern remain theme-responsive.
      */}
      <div className="dark bg-background text-foreground">
        <FeaturedBrandsStrip />
        <LiveFeed />
      </div>
      <BackgroundPattern115 />
      <ThemeToggle />
    </>
  );
}
