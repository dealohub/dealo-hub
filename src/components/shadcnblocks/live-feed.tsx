'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LiveStatusBar,
  FeedHeader,
  useShortRelativeTime,
  useCatLabels,
  CAT_COLORS,
  type ListingItem,
  type FeedItem,
  type CategoryKey,
} from './live-feed-parts';
import type { FeedListing } from '@/lib/landing/types';
import {
  TallBrandTakeover,
  DealoAITile,
  LiveStatsTile,
  DealerStripTile,
  ServiceProviderTile,
  CategoryGatewayTile,
  ListingSpotlightTile,
} from './partner-bento-tiles';

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

const catChipClasses = (cat: CategoryKey): string => {
  if (cat === 'property') return 'bg-blue-500/15 text-blue-400';
  if (cat === 'cars') return 'bg-red-500/15 text-red-400';
  if (cat === 'tech') return 'bg-purple-500/15 text-purple-400';
  return 'bg-foreground/15 text-foreground';
};

// ─── One row inside the live feed tile ─────────────────────
const LiveFeedRow = ({ item }: { item: ListingItem }) => {
  const { short: shortTime, isFresh } = useShortRelativeTime(item.ts);
  const catLabels = useCatLabels();
  const catColor = CAT_COLORS[item.cat] || 'currentColor';
  const catLabel = catLabels[item.cat] || '';
  const isPriceDrop = item.kind === 'pricedrop';

  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/5">
      {/* Time column */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        {isFresh ? (
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: catColor }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: catColor }}
            />
          </span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
        )}
        <span
          className="mt-0.5 font-mono text-[9px] font-bold tabular-nums text-muted-foreground"
          style={isFresh ? { color: catColor } : undefined}
        >
          {shortTime}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${catChipClasses(item.cat)}`}
          >
            {catLabel}
          </span>
          {isPriceDrop ? (
            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
              ▼ خفض
            </span>
          ) : (
            <span className="truncate text-[10px] text-muted-foreground">
              {item.loc}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12px] font-semibold text-foreground">
          {item.title}
        </div>
      </div>

      {/* Price */}
      <div className="text-end">
        <div
          className={
            'text-sm font-bold tabular-nums ' +
            (isPriceDrop ? 'text-red-400' : 'text-foreground')
          }
        >
          {item.price}
        </div>
      </div>
    </li>
  );
};

const LiveFeed = ({ initialFeed, activitySignals }: Props) => {
  const tBar = useTranslations('marketplace.liveBar');
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

  // Bento tile only shows listings (signals skipped — they still rotate
  // into state for LiveStatusBar stats but don't render as rows).
  const liveItems = feed
    .filter((it) => it.kind !== 'signal')
    .slice(0, 6) as ListingItem[];
  const liveCount = feed.filter((it) => it.kind !== 'signal').length;

  return (
    <section id="live-feed" className="relative w-full bg-background">
      <LiveStatusBar feed={feed} />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <FeedHeader />

        {/* ════════ Feature 261 bento — one tile is the live feed ═══════ */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">

          {/* ─── Tile 1 · LIVE FEED (swapped in place of first hero image) ─── */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-700 md:col-span-2 md:row-span-2 md:h-[400px] lg:col-span-4 lg:h-full">
            <div className="flex items-center justify-between px-6 pt-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">
                  {tBar('live')}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                أحدث <span className="font-bold text-foreground">{liveCount}</span>
              </span>
            </div>

            <div className="mt-4 px-3">
              <ul className="flex flex-col">
                {liveItems.map((item) => (
                  <LiveFeedRow key={item.id} item={item} />
                ))}
              </ul>
            </div>

            <div className="absolute inset-x-6 bottom-4 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
              <span>يُحدَّث كل 8 ثوانٍ</span>
              <a href="#" className="font-semibold text-foreground hover:underline">
                شاهد الكل ←
              </a>
            </div>
          </div>

          {/* ─── Tile 2 · Tall Brand Takeover ─── */}
          <TallBrandTakeover />

          {/* ─── Tile 3 · Dealo AI Trust Signal ─── */}
          <DealoAITile />

          {/* ─── Tile 4 · Live Market Stats ─── */}
          <LiveStatsTile />

          {/* ─── Tile 5 · Dealer Strip (3 listings) ─── */}
          <DealerStripTile />

          {/* ─── Tile 6 · Service Provider Bio ─── */}
          <ServiceProviderTile />

          {/* ─── Tile 7 · Category Gateway ─── */}
          <CategoryGatewayTile />

          {/* ─── Tile 8 · Featured Listing Spotlight ─── */}
          <ListingSpotlightTile />

        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
