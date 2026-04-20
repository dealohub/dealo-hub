'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  LiveStatusBar,
  FeedHeader,
  FilterPills,
  SignalRow,
  Sidebar,
  type ListingItem,
  type SignalItem,
  type FeedItem,
  type CategoryKey,
} from './live-feed-parts';
// Card variant swap:
//   - Original (handoff):  `ListingCard` from './live-feed-parts'
//   - Option A editorial:  `ListingCardEditorial` from './listing-card-editorial'
//   - Option B compact:    `ListingCardCompact`   from './listing-card-compact'
import { ListingCardCompact as ListingCard } from './listing-card-compact';
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
    const tick = () => {
      const roll = Math.random();
      const now = Date.now();
      let newItem: FeedItem;

      if (roll < 0.15) {
        newItem = {
          kind: 'signal',
          id: `s-${now}`,
          text: ACTIVITY_SIGNALS[Math.floor(Math.random() * ACTIVITY_SIGNALS.length)],
          ts: now,
        };
      } else if (roll < 0.3) {
        const base = SEED_PRICE_DROPS[Math.floor(Math.random() * SEED_PRICE_DROPS.length)];
        newItem = { ...base, id: `${base.id}-${now}`, kind: 'pricedrop', ts: now };
      } else {
        const base = SEED_LISTINGS[Math.floor(Math.random() * SEED_LISTINGS.length)];
        newItem = { ...base, id: `${base.id}-${now}`, kind: 'listing', ts: now };
      }

      setFeed((prev) => [newItem, ...prev].slice(0, 8));
    };

    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <FeedHeader />
            <FilterPills value={filter} onChange={setFilter} />

            {/* Compact list: tight vertical stack for fast scanning. */}
            <div className="mt-6 space-y-2">
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

          <aside className="hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
