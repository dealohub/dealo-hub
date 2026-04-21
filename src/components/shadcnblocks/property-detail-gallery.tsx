'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PropertyDetail, PropertyImage, PropertyImageCategory } from '@/lib/properties/types';

/**
 * Property detail — gallery.
 *
 * Interaction model (simplified from ride-detail-gallery, which runs 609
 * lines of lightbox + parallax + pinch-zoom — property V1 gets the 80%
 * value at 30% complexity):
 *
 *   - Main image with prev/next
 *   - Filter pills driven by *which* image categories appear in this
 *     listing (dynamic). "All" always shown first.
 *   - Thumbnail strip under main image
 *   - Fullscreen toggle opens a simple white-bg overlay (not modal lib
 *     — keep it Server-first)
 *
 * Floor plans, diwaniya shots, and sea-view shots each get their own
 * pill when present. No silent merging into a generic "interior".
 */

const CATEGORY_LABEL_KEYS: Record<PropertyImageCategory, string> = {
  building_exterior: 'Exterior',
  living_room: 'Living',
  bedroom: 'Bedrooms',
  kitchen: 'Kitchen',
  bathroom: 'Bathrooms',
  floor_plan: 'Floor plan',
  view: 'Views',
  diwaniya_room: 'Diwaniya',
  exterior: 'Exterior',
  interior: 'Interior',
  details: 'Details',
};

interface Props {
  listing: PropertyDetail;
}

export default function PropertyDetailGallery({ listing }: Props) {
  const images = listing.images;
  const t = useTranslations('marketplace.properties.detail');

  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState<PropertyImageCategory | 'all'>('all');
  const [fullscreen, setFullscreen] = useState(false);

  // Which image categories actually appear in this listing
  const availableCategories = useMemo(() => {
    const seen = new Set<PropertyImageCategory>();
    for (const img of images) {
      if (img.category) seen.add(img.category);
    }
    return Array.from(seen);
  }, [images]);

  const filtered: PropertyImage[] = useMemo(() => {
    if (filter === 'all') return images;
    return images.filter(img => img.category === filter);
  }, [images, filter]);

  // Keep active in range when filter changes
  const activeImage = filtered[active] ?? filtered[0] ?? images[0];
  if (!activeImage) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-foreground/5 text-sm text-foreground/50">
        {t('statPhotos')}: 0
      </div>
    );
  }

  const prev = () => {
    setActive(a => (a - 1 + filtered.length) % filtered.length);
  };
  const next = () => {
    setActive(a => (a + 1) % filtered.length);
  };

  return (
    <section className="space-y-3">
      {/* Filter pills */}
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setFilter('all');
              setActive(0);
            }}
            className={
              'rounded-full px-3 py-1 text-xs font-medium transition ' +
              (filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
            }
          >
            All {images.length}
          </button>
          {availableCategories.map(cat => {
            const count = images.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat);
                  setActive(0);
                }}
                className={
                  'rounded-full px-3 py-1 text-xs font-medium transition ' +
                  (filter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
                }
              >
                {CATEGORY_LABEL_KEYS[cat]} {count}
              </button>
            );
          })}
        </div>
      )}

      {/* Main image */}
      <div className="group relative overflow-hidden rounded-2xl bg-foreground/5">
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={activeImage.url}
            alt={activeImage.altText ?? listing.title}
            fill
            sizes="(min-width: 1024px) 900px, 100vw"
            priority
            className="object-cover"
          />

          {/* Fullscreen */}
          <button
            aria-label="Fullscreen"
            onClick={() => setFullscreen(true)}
            className="absolute end-3 top-3 rounded-full bg-background/70 p-2 text-foreground/80 backdrop-blur transition hover:bg-background"
          >
            <Maximize2 size={16} />
          </button>

          {/* Prev / Next */}
          {filtered.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={prev}
                className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground/80 opacity-0 backdrop-blur transition hover:bg-background group-hover:opacity-100"
              >
                <ChevronLeft size={18} className="rtl:rotate-180" />
              </button>
              <button
                aria-label="Next"
                onClick={next}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground/80 opacity-0 backdrop-blur transition hover:bg-background group-hover:opacity-100"
              >
                <ChevronRight size={18} className="rtl:rotate-180" />
              </button>
            </>
          )}

          {/* Position pill */}
          <div className="absolute bottom-3 start-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground/80 backdrop-blur">
            {active + 1} / {filtered.length}
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {filtered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {filtered.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={
                'relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md ring-2 transition ' +
                (i === active
                  ? 'ring-primary'
                  : 'opacity-70 ring-transparent hover:opacity-100')
              }
            >
              <Image
                src={img.url}
                alt={img.altText ?? ''}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            aria-label="Close"
            onClick={() => setFullscreen(false)}
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            ✕
          </button>
          <div className="relative h-full w-full max-w-6xl" onClick={e => e.stopPropagation()}>
            <Image
              src={activeImage.url}
              alt={activeImage.altText ?? listing.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
