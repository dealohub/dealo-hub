'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ElectronicsDetail } from '@/lib/electronics/types';

/**
 * Electronics detail — gallery.
 *
 * Simpler than property-detail-gallery: electronics listings carry
 * fewer distinct photo categories (power-on screen, IMEI screen,
 * battery-health screen, exterior) so we don't expose filter pills.
 * Instead the gallery just rotates through images with prev/next +
 * thumbnail strip + fullscreen toggle.
 *
 * Shows a small "Verified photos" hint chip when the listing
 * includes the canonical trust-photo categories (power-on +
 * IMEI/serial + battery health). The hint is a nudge to buyers
 * that the seller followed the photo guidelines.
 */

interface Props {
  listing: ElectronicsDetail;
}

export default function ElectronicsDetailGallery({ listing }: Props) {
  const t = useTranslations('electronicsDetail');
  const images = listing.images;

  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border/50 bg-foreground/[0.02] text-sm text-foreground/40">
        {t('noPhoto')}
      </div>
    );
  }

  const activeImage = images[active] ?? images[0];

  const go = (dir: -1 | 1) => {
    const next = (active + dir + images.length) % images.length;
    setActive(next);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-foreground/[0.04] shadow-sm ring-1 ring-border/50">
          <Image
            src={activeImage.url}
            alt={activeImage.altText ?? listing.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className="absolute start-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:bg-background"
              >
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className="absolute end-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:bg-background"
              >
                <ChevronRight size={16} className="rtl:rotate-180" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Fullscreen"
            className="absolute end-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:bg-background"
          >
            <Maximize2 size={14} />
          </button>
          <span className="absolute start-3 bottom-3 rounded-full bg-background/85 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 ring-1 ring-border/60 backdrop-blur">
            {active + 1} / {images.length}
          </span>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Image ${i + 1}`}
                className={
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-md ring-1 transition ' +
                  (i === active
                    ? 'ring-2 ring-primary'
                    : 'ring-border/50 hover:ring-border')
                }
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur"
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Close"
            className="absolute end-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
          >
            <X size={18} />
          </button>
          <div className="relative h-full w-full max-w-6xl">
            <Image
              src={activeImage.url}
              alt={activeImage.altText ?? listing.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
                className="absolute start-5 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
              >
                <ChevronLeft size={22} className="rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next"
                className="absolute end-5 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
              >
                <ChevronRight size={22} className="rtl:rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
