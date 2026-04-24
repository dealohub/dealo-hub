'use client';

import { useEffect, useState } from 'react';
import {
  LiveStatusBar,
  FeedHeader,
  type FeedItem,
} from './live-feed-parts';
import type { FeedListing } from '@/lib/landing/types';
import { Feature284 } from '@/components/feature284';

/* LiveFeed — Feature-261 bento layout with a live feed tile.
 *
 * Phase 8b: the "Fresh from our partners" section is now rendered as a
 * bento grid (8 tiles) borrowed from shadcnblocks Feature 261. One big
 * tile displays the rotating live feed (sourced from Supabase via the
 * page's `getLiveFeedListings` call); the remaining tiles keep the
 * original Feature 261 editorial content as placeholders until we wire
 * them to real marketplace data.
 */

interface Props {
  /** Server-fetched listings + pricedrops. Used as both the initial
   *  visible set and the rotation pool. */
  initialFeed: FeedListing[];
  /** Editorial one-liners interspersed with listings. */
  activitySignals: readonly string[];
}

const LiveFeed = ({ initialFeed, activitySignals }: Props) => {
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    // Stagger the initial timestamps so relative-time reads ("Just
    // now" / "2m ago" / "4m ago") feel natural even if all rows were
    // created within a second of each other in the seed.
    const now = Date.now();
    return initialFeed.map((item, i) => ({
      ...item,
      ts: now - 1000 * 60 * (i * 2 + 1),
    })) as FeedItem[];
  });

  useEffect(() => {
    if (initialFeed.length === 0 && activitySignals.length === 0) {
      return;
    }

    const seedIdOf = (id: string | number) => String(id).split('-')[0];

    const tick = () => {
      setFeed((prev) => {
        const roll = Math.random();
        const now = Date.now();
        const recentSeeds = new Set(prev.map((it) => seedIdOf(it.id)));
        let newItem: FeedItem;

        if (roll < 0.15 && activitySignals.length > 0) {
          newItem = {
            kind: 'signal',
            id: `s-${now}`,
            text:
              activitySignals[
                Math.floor(Math.random() * activitySignals.length)
              ],
            ts: now,
          };
        } else if (initialFeed.length > 0) {
          const pool = initialFeed.filter(
            (s) => !recentSeeds.has(String(s.id)),
          );
          const candidates = pool.length > 0 ? pool : initialFeed;
          const preferPricedrop = roll < 0.3;
          const prioritised = preferPricedrop
            ? [
                ...candidates.filter((c) => c.kind === 'pricedrop'),
                ...candidates.filter((c) => c.kind !== 'pricedrop'),
              ]
            : candidates;

          const base =
            prioritised[Math.floor(Math.random() * prioritised.length)] ??
            candidates[0];
          newItem = {
            ...base,
            id: `${base.id}-${now}`,
            ts: now,
          } as FeedItem;
        } else {
          return prev;
        }

        return [newItem, ...prev].slice(0, 8);
      });
    };

    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [initialFeed, activitySignals]);

  return (
    <section id="live-feed" className="relative w-full bg-background">
      <LiveStatusBar feed={feed} />

      <div className="mx-auto max-w-7xl px-6 pt-16">
        <FeedHeader />
      </div>

      <Feature284 className="py-16" />
    </section>
  );
};

export default LiveFeed;
