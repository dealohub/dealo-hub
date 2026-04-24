'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  Sparkle,
  BadgeCheck,
  TrendingDown,
  Star,
  Radio,
  MapPin,
  Repeat,
  Battery,
} from 'lucide-react';
import type { ElectronicsActivityItem } from '@/lib/electronics/queries';
import { formatPrice } from '@/lib/format';
import { batteryHealthBand } from '@/lib/electronics/validators';

/**
 * Electronics live feed — "things are happening now" strip for the
 * /tech hub. Mirrors the Properties LiveFeed pattern (P8 discovery
 * moat surfaced prominently: `trade` pill on badal-enabled cards).
 *
 * Design:
 *   - Top eyebrow: pulsing green dot + "LIVE · last 24h"
 *   - 4 visible activity cards rotating every 8s
 *   - Each card: cover thumb + event pill (new / price_drop /
 *     inspected / trade / featured) + title + brand·model + area/city
 *     + price + small battery-health chip for battery-bearing devices
 *
 * Rotation is simulated — we fetch the most-recent N listings and
 * cycle through them so even a quiet day still feels alive. Real
 * push events are deferred (Phase 5c/AI-negotiator already wires the
 * chat realtime layer; LiveFeed push is a later enhancement).
 */

const VISIBLE_COUNT = 4;
const ROTATION_MS = 8000;

interface Props {
  items: ElectronicsActivityItem[];
}

export default function ElectronicsLiveFeed({ items }: Props) {
  const t = useTranslations('electronicsHub.liveFeed');
  const tSell = useTranslations('sell.step.electronics');
  const locale = useLocale() as 'ar' | 'en';

  const [tick, setTick] = useState(0);

  const rotation = useMemo(() => {
    if (items.length === 0) return [];
    // Only double the array when we actually have enough items to
    // rotate — padding with duplicates when items.length < VISIBLE_COUNT
    // shows the same card twice side-by-side, which reads as a bug.
    if (items.length <= VISIBLE_COUNT) return items;
    return [...items, ...items];
  }, [items]);

  useEffect(() => {
    if (rotation.length <= VISIBLE_COUNT) return;
    const id = setInterval(() => {
      setTick(t => (t + 1) % rotation.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [rotation.length]);

  if (items.length === 0) return null;

  const visible = rotation.slice(tick, tick + VISIBLE_COUNT);

  return (
    <section className="border-y border-border/40 bg-background py-12 md:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <Radio size={12} />
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-foreground/60">{t('subline')}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {visible.map((item, i) => (
            <ActivityCard
              key={`${item.id}-${tick}-${i}`}
              item={item}
              locale={locale}
              t={t}
              tSell={tSell}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivityCard({
  item,
  locale,
  t,
  tSell,
}: {
  item: ElectronicsActivityItem;
  locale: 'ar' | 'en';
  t: ReturnType<typeof useTranslations>;
  tSell: ReturnType<typeof useTranslations>;
}) {
  const eventMeta = EVENT_META[item.event];
  const band = batteryHealthBand(item.batteryHealthPct);
  const bandColor =
    band === 'green'
      ? 'text-emerald-600 dark:text-emerald-400'
      : band === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : band === 'red'
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-foreground/45';

  return (
    <Link
      href={`/${locale}/tech/${item.slug}`}
      className="group relative flex gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-3 transition hover:border-primary/40 hover:shadow-sm"
      style={{ animation: 'fade-in 0.4s ease-out' }}
    >
      {/* Cover thumbnail */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
        {item.cover ? (
          <Image
            src={item.cover}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
        {/* Event pill over cover */}
        <span
          className={
            'absolute start-1 top-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur ' +
            eventMeta.classes
          }
        >
          <eventMeta.Icon size={8} strokeWidth={3} />
          {t(eventMeta.labelKey as any)}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground group-hover:text-primary">
          {item.title}
        </h3>

        <div className="flex items-center gap-1 text-[10px] text-foreground/55">
          <span className="truncate uppercase tracking-wide">
            {tSell(`deviceKind.${item.deviceKind}` as any)}
          </span>
          {(item.areaName || item.cityName) && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 truncate">
                <MapPin size={9} />
                {[item.areaName, item.cityName].filter(Boolean).join(' · ')}
              </span>
            </>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">
            {formatPrice(item.priceMinorUnits, item.currencyCode, locale)}
          </span>
          {item.batteryHealthPct != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${bandColor}`}
            >
              <Battery size={9} />
              {item.batteryHealthPct}%
            </span>
          )}
        </div>
      </div>

      {/* Tier indicator — small dot */}
      {item.verificationTier !== 'unverified' && (
        <span
          className={
            'absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full ' +
            (item.verificationTier === 'dealo_inspected'
              ? 'bg-emerald-500'
              : 'bg-sky-500')
          }
          aria-label={item.verificationTier}
        />
      )}
    </Link>
  );
}

type EventKey = ElectronicsActivityItem['event'];

const EVENT_META: Record<
  EventKey,
  { Icon: typeof Sparkle; classes: string; labelKey: string }
> = {
  new: {
    Icon: Sparkle,
    classes: 'bg-primary/90 text-primary-foreground',
    labelKey: 'eventNew',
  },
  price_drop: {
    Icon: TrendingDown,
    classes: 'bg-rose-500/90 text-white',
    labelKey: 'eventPriceDrop',
  },
  inspected: {
    Icon: BadgeCheck,
    classes: 'bg-emerald-500/90 text-white',
    labelKey: 'eventInspected',
  },
  featured: {
    Icon: Star,
    classes: 'bg-amber-500/90 text-white',
    labelKey: 'eventFeatured',
  },
  trade: {
    Icon: Repeat,
    classes: 'bg-indigo-500/90 text-white',
    labelKey: 'eventTrade',
  },
};
