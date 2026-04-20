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
//   - Original (handoff):  `ListingCard` from './live-feed-parts'
//   - Option A editorial:  `ListingCardEditorial` from './listing-card-editorial'
//   - Option B compact:    `ListingCardCompact`   from './listing-card-compact'
//   - Option C polished:   `ListingCardPolished`  from './listing-card-polished'
//   - Option D circular:   `ListingCardCircular`  from './listing-card-circular'
import { ListingCardCircular as ListingCard } from './listing-card-circular';
import { SEED_LISTINGS, SEED_PRICE_DROPS, ACTIVITY_SIGNALS } from './listings-data';

/* LiveFeed — real-time marketplace activity feed */

const LiveFeed = () => {

  const [filter, setFilter] = useState('all');
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    const now = Date.now();
    const items: FeedItem[] = [
      { kind: 'listing',   ...SEED_LISTINGS[0], ts: now - 1000 * 60 * 2 },
      { kind: 'listing',   ...SEED_LISTINGS[1], ts: now - 1000 * 60 * 4 },
      { kind: 'signal',    id: 's1', text: ACTIVITY_SIGNALS[0], ts: now - 1000 * 60 * 5 },
      { kind: 'listing',   ...SEED_LISTINGS[2], ts: now - 1000 * 60 * 8 },
      { kind: 'pricedrop', ...SEED_PRICE_DROPS[0],   ts: now - 1000 * 60 * 11 },
      { kind: 'listing',   ...SEED_LISTINGS[3], ts: now - 1000 * 60 * 14 },
      { kind: 'listing',   ...SEED_LISTINGS[4], ts: now - 1000 * 60 * 18 },
      { kind: 'listing',   ...SEED_LISTINGS[5], ts: now - 1000 * 60 * 28 },
    ];
    return items;
  });

  useEffect(() => {
    // Extract the seed id from a feed item id. Feed items carry ids
    // like "101-169…" (seed 101, timestamped); pure seeds stay as "101".
    const seedIdOf = (id: string | number) => String(id).split('-')[0];

    const tick = () => {
      setFeed((prev) => {
        const roll = Math.random();
        const now = Date.now();
        const recentSeeds = new Set(prev.map((it) => seedIdOf(it.id)));
        let newItem: FeedItem;

        if (roll < 0.15) {
          newItem = {
            kind: 'signal',
            id: `s-${now}`,
            text: ACTIVITY_SIGNALS[Math.floor(Math.random() * ACTIVITY_SIGNALS.length)],
            ts: now,
          };
        } else if (roll < 0.3) {
          // Pick a price-drop seed that isn't already in the feed.
          const pool = SEED_PRICE_DROPS.filter((s) => !recentSeeds.has(String(s.id)));
          const candidates = pool.length > 0 ? pool : SEED_PRICE_DROPS;
          const base = candidates[Math.floor(Math.random() * candidates.length)];
          newItem = { ...base, id: `${base.id}-${now}`, kind: 'pricedrop', ts: now };
        } else {
          // Pick a listing seed that isn't already in the feed.
          const pool = SEED_LISTINGS.filter((s) => !recentSeeds.has(String(s.id)));
          const candidates = pool.length > 0 ? pool : SEED_LISTINGS;
          const base = candidates[Math.floor(Math.random() * candidates.length)];
          newItem = { ...base, id: `${base.id}-${now}`, kind: 'listing', ts: now };
        }

        return [newItem, ...prev].slice(0, 8);
      });
    };

    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  const visible = feed.filter((it) => {
    if (filter === 'all') return true;
    if (it.kind === 'signal') {
      return false;
    }
    if (filter === 'featured') return it.kind === 'listing' && (it as ListingItem).featured;
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
                return <ListingCard key={item.id} item={item as ListingItem} priceDrop />;
              return <ListingCard key={item.id} item={item as ListingItem} />;
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
