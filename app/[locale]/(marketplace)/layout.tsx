import type { ReactNode } from 'react';
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';

/**
 * Public marketplace layout.
 *
 * Wraps /categories, /search, and /saved-for-later browsing pages with the
 * shared Nav + Footer. Accessible to both anonymous and signed-in visitors.
 */
export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
