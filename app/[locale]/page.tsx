'use client';

import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import Feature283 from '@/components/shadcnblocks/feature-283';
import FeaturedBrandsStrip from '@/components/shadcnblocks/featured-brands-strip';
import AIProtectionStrip from '@/components/shadcnblocks/ai-protection-strip';
import LiveFeed from '@/components/shadcnblocks/live-feed';
import { FeaturedPartnersSection } from '@/components/shadcnblocks/live-feed-parts';
import BackgroundPattern115 from '@/components/shadcnblocks/background-pattern-115';
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
      <FeaturedBrandsStrip />
      <AIProtectionStrip />
      <LiveFeed />
      <FeaturedPartnersSection />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
