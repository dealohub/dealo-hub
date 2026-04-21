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
} from 'lucide-react';
import type { PropertyActivityItem } from '@/lib/properties/queries';
import { formatPrice } from '@/lib/format';

/**
 * Properties live feed — doctrine-visible "things are happening now"
 * strip on the /properties hub. Founder-flagged gap on 2026-04-21:
 * landing had LiveFeed but /properties did not.
 *
 * Design:
 *   - Top eyebrow: pulsing dot + "LIVE · last 24h" label
 *   - Stack of ~4 visible activity cards at a time
 *   - Every 8s, the oldest card fades out + a new one fades in at top
 *   - Each card: cover · event-type pill · title · city · price · tier
 *
 * The rotation is simulated (no push-based events yet — Phase 5c wires
 * real-time when the chat/offers layer lands). Uses the pre-fetched
 * recent-activity pool and cycles through it, so cards still feel
 * alive even on a quiet day.
 */

const VISIBLE_COUNT = 4;
const ROTATION_MS = 8000;

interface Props {
  items: PropertyActivityItem[];
}

export default function PropertiesLiveFeed({ items }: Props) {
  const t = useTranslations('marketplace.properties.hub.liveFeed');
  const td = useTranslations('marketplace.properties.detail');
  const locale = useLocale() as 'ar' | 'en';

  const [tick, setTick] = useState(0);

  // Pre-compute the rotation order — stable across renders
  const rotation = useMemo(() => {
    // Duplicate the list so rotation wraps without gaps when items < ROTATION_MAX
    if (items.length === 0) return [];
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

  // Select the window of `VISIBLE_COUNT` items starting at `tick`
  const visible = rotation.slice(tick, tick + VISIBLE_COUNT);

  return (
    <section className="border-b border-border/40 bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <Radio size={12} />
              {t('eyebrow')}
            </p>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">{t('subline')}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {visible.map((item, i) => (
            <ActivityCard
              key={`${item.id}-${tick}-${i}`}
              item={item}
              locale={locale}
              t={t}
              td={td}
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
  td,
}: {
  item: PropertyActivityItem;
  locale: 'ar' | 'en';
  t: ReturnType<typeof useTranslations>;
  td: ReturnType<typeof useTranslations>;
}) {
  const eventMeta = EVENT_META[item.event];

  const typeLabelMap: Record<string, string> = {
    apartment: 'typeApartment',
    villa: 'typeVilla',
    townhouse: 'typeTownhouse',
    chalet: 'typeChalet',
    studio: 'typeStudio',
    duplex: 'typeDuplex',
    penthouse: 'typePenthouse',
    floor: 'typeFloor',
    annex: 'typeAnnex',
    office: 'typeOffice',
    shop: 'typeShop',
    warehouse: 'typeWarehouse',
    room: 'typeRoom',
    'land-plot': 'typeLandPlot',
  };
  const typeLabel = td((typeLabelMap[item.propertyType as string] ?? 'typeApartment') as any);

  const periodMap: Record<string, string> = {
    daily: 'periodDaily',
    weekly: 'periodWeekly',
    monthly: 'periodMonthly',
    yearly: 'periodYearly',
  };
  const periodKey = item.rentPeriod ? (periodMap[item.rentPeriod as string] as any) : null;

  return (
    <Link
      href={`/${locale}/properties/${item.slug}`}
      className="group relative flex gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-3 transition hover:border-primary/40 hover:shadow-sm"
      style={{ animation: 'fade-in 0.4s ease-out' }}
    >
      {/* Cover thumbnail */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-foreground/5">
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

        <div className="flex items-center gap-1 text-[10px] text-foreground/50">
          <span className="uppercase tracking-wide">{typeLabel}</span>
          {item.cityName && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 truncate">
                <MapPin size={9} />
                {item.cityName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[13px] font-semibold text-foreground">
            {formatPrice(item.priceMinorUnits, item.currencyCode, locale)}
          </span>
          {periodKey && (
            <span className="text-[10px] text-foreground/50">{td(periodKey)}</span>
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

type EventKey = PropertyActivityItem['event'];

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
};
