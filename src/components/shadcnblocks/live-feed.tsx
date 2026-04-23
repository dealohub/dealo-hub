'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { FeedListing } from '@/lib/landing/types';

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
          <div className="relative overflow-hidden rounded-3xl bg-muted md:col-span-2 md:row-span-2 md:h-[400px] lg:col-span-4 lg:h-full">
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

          {/* ─── Tile 2 · Build your interface (Feature 261 original) ─── */}
          <div className="relative h-60 overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 md:h-[400px] lg:col-span-4 lg:h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg"
              alt="shadcn UI component library"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute right-6 bottom-6 left-6 z-10">
              <h2 className="text-sm leading-tight font-medium md:text-base lg:text-xl">
                Build your interface with stunning components and modern design.
              </h2>
            </div>
          </div>

          {/* ─── Tile 3 · 95% ─── */}
          <Card className="col-span-1 rounded-3xl border-0 md:col-span-2 md:row-span-1 md:h-[192px] lg:col-span-2">
            <CardContent className="flex h-full flex-col justify-center p-4 md:p-6">
              <div className="mb-2 text-4xl font-bold md:text-4xl lg:text-6xl">
                95
                <span className="align-top text-2xl md:text-xl lg:text-3xl">%</span>
              </div>
              <p className="text-sm leading-tight md:text-sm">
                Developers choose us
                <br />
                for our exceptional quality
              </p>
            </CardContent>
          </Card>

          {/* ─── Tile 4 · placeholder image ─── */}
          <div className="relative col-span-1 h-60 overflow-hidden rounded-3xl md:col-span-2 md:row-span-1 md:h-[192px] lg:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg"
              alt="shadcn UI components"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* ─── Tile 5 · $299 ─── */}
          <Card className="col-span-1 rounded-3xl border-0 bg-muted md:col-span-4 md:row-span-1 md:h-[300px] lg:col-span-4">
            <CardContent className="h-full p-4 md:p-5">
              <div className="flex h-full flex-col justify-end">
                <div className="space-y-2">
                  <div className="text-4xl font-normal md:text-5xl lg:text-6xl">
                    $299
                  </div>
                  <div className="text-muted-foreground">
                    Premium Component Library
                  </div>
                  <Button>Buy Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Tile 6 · 300+ developers ─── */}
          <Card className="col-span-1 rounded-3xl border-0 md:col-span-2 md:row-span-1 md:h-[300px] lg:col-span-3">
            <CardContent className="flex h-full flex-col justify-center p-4 md:p-5">
              <div className="mb-3">
                <span className="text-4xl font-bold md:text-3xl lg:text-6xl">
                  300
                </span>
                <span className="align-top text-2xl font-bold md:text-xl lg:text-3xl">
                  +
                </span>
              </div>
              <p className="mb-4 text-sm md:text-sm">Delighted developers</p>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Avatar
                    key={i}
                    className="h-8 w-8 border-2 border-border md:h-8 md:w-8 lg:h-10 lg:w-10"
                  >
                    <AvatarImage
                      src={`https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-${i + 1}.webp`}
                    />
                    <AvatarFallback>DEV{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Tile 7 · placeholder image ─── */}
          <Card className="relative col-span-1 h-60 overflow-hidden rounded-3xl border-0 md:col-span-3 md:row-span-1 md:h-[300px] lg:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg"
              alt="shadcn UI components"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </Card>

          {/* ─── Tile 8 · Rapid Development ─── */}
          <Card className="relative col-span-1 h-60 overflow-hidden rounded-3xl border-0 md:col-span-3 md:row-span-1 md:h-[300px] lg:col-span-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/Geometric Staircase and Concrete Wall.jpeg"
              alt="shadcn UI development"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 z-10 flex items-center justify-start p-4 md:p-6">
              <div className="text-white">
                <div className="mb-2 flex items-center gap-2 md:gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 md:h-7 md:w-7">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                  <span className="text-base font-semibold md:text-lg">
                    Rapid Development
                  </span>
                </div>
                <p className="text-sm opacity-90 md:text-sm">
                  Build your interface faster
                  <br />
                  <span className="text-sm font-semibold md:text-sm">
                    with ready-to-use components
                  </span>
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
