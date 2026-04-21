'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  LiveStatusBar,
  FeedHeader,
  FilterPills,
  SignalRow,
  type ListingItem,
  type SignalItem,
  type FeedItem,
  type CategoryKey,
} from './live-feed-parts';
// Card variant swap:
//   - Option A editorial:  `ListingCardEditorial` from './listing-card-editorial'
//   - Option B compact:    `ListingCardCompact`   from './listing-card-compact'
//   - Option C polished:   `ListingCardPolished`  from './listing-card-polished'
//   - Option D circular:   `ListingCardCircular`  from './listing-card-circular'  (shipped)
import { ListingCardCircular as ListingCard } from './listing-card-circular';
import type { FeedListing } from '@/lib/landing/types';

/* LiveFeed — real-time marketplace activity feed.
 *
 * Phase 3d: the feed now seeds from Supabase (via the page's
 * `getLiveFeedListings` call) and rotates new items every 8 seconds
 * by picking from the pre-fetched pool. ACTIVITY_SIGNALS are still
 * editorial (kept in src/lib/landing/constants.ts) and passed in
 * alongside so the feed can intersperse them like before.
 */

interface Props {
  /** Server-fetched listings + pricedrops. Used as both the initial
   *  visible set and the rotation pool. */
  initialFeed: FeedListing[];
  /** Editorial one-liners interspersed with listings. */
  activitySignals: readonly string[];
}

const LiveFeed = ({ initialFeed, activitySignals }: Props) => {
  const [filter, setFilter] = useState('all');
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
      // Nothing to rotate — skip the interval entirely.
      return;
    }

    // Extract the underlying DB id from a feed item id. Pre-fetched
    // items carry pure numeric ids; rotated items carry "<id>-<ts>".
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
          // Prefer listings not already visible so the feed doesn't
          // rapidly duplicate. If every listing is already on screen,
          // fall back to the full pool and accept the repetition —
          // small demo inventory trade-off tracked in Phase 3d audit Q2.
          const pool = initialFeed.filter(
            (s) => !recentSeeds.has(String(s.id)),
          );
          const candidates = pool.length > 0 ? pool : initialFeed;

          // Weighted toward pricedrops when the roll is low (<0.3) so
          // they appear a little more often in the rotation.
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
          // No listings at all (signal-only mode without any pre-fetched
          // rows) — skip this tick.
          return prev;
        }

        return [newItem, ...prev].slice(0, 8);
      });
    };

    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, [initialFeed, activitySignals]);

  const visible = feed.filter((it) => {
    if (filter === 'all') return true;
    if (it.kind === 'signal') {
      return false;
    }
    if (filter === 'featured')
      return it.kind === 'listing' && (it as ListingItem).featured;
    if (filter === 'pricedrop') return it.kind === 'pricedrop';
    return (it as ListingItem).cat === (filter as CategoryKey);
  });

  return (
    <section className="relative w-full bg-background">
      <LiveStatusBar feed={feed} />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <FeedHeader />
        <FilterPills value={filter} onChange={setFilter} />

        {/* Single-column stack — the circular card reads best one per row. */}
        <div className="mt-6 space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((item) => {
              if (item.kind === 'signal')
                return <SignalRow key={item.id} item={item as SignalItem} />;
              if (item.kind === 'pricedrop')
                return (
                  <ListingCard
                    key={item.id}
                    item={item as ListingItem}
                    priceDrop
                  />
                );
              return <ListingCard key={item.id} item={item as ListingItem} />;
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
