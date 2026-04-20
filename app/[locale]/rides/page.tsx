'use client';

import { useState } from 'react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import RidesHeader from '@/components/shadcnblocks/rides-header';
import RidesSearch from '@/components/shadcnblocks/rides-search';
import RidesGridBento from '@/components/shadcnblocks/rides-grid-bento';
import type { VehicleType } from '@/components/shadcnblocks/rides-data';

export default function RidesPage() {
  const [activeType, setActiveType] = useState<VehicleType | 'all'>('all');

  return (
    <>
      <EcommerceNavbar1 />
      <RidesHeader />
      <RidesSearch activeType={activeType} onTypeChange={setActiveType} />

      <main className="relative w-full bg-background">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-20">
          <RidesGridBento filterType={activeType} />
        </div>
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
