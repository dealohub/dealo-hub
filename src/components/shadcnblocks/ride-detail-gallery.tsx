'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Share2,
  Download,
  ZoomIn,
  X,
  Play,
  Camera,
  Orbit,
  Info,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ImageCategory, RideDetail } from '@/lib/rides/types';

/**
 * RideDetailGallery — premium media gallery.
 *
 * Reads images from `listing.images` (DB-backed, ordered by position).
 * Each image carries an ImageCategory that drives the filter pills.
 * No synthesis; uncategorised rows (if any) fall into an "other"
 * bucket that's treated as exterior for display.
 */

interface Props {
  listing: RideDetail;
}

type FilterKey = ImageCategory | 'all';

const CATEGORIES: { key: FilterKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'catAll' },
  { key: 'exterior', labelKey: 'catExterior' },
  { key: 'interior', labelKey: 'catInterior' },
  { key: 'engine', labelKey: 'catEngine' },
  { key: 'wheels', labelKey: 'catWheels' },
  { key: 'details', labelKey: 'catDetails' },
];

/** Rewrite the Unsplash-style `w=` query param to a small thumbnail. */
const toThumb = (url: string): string => url.replace(/w=\d+/, 'w=320');

export const RideDetailGallery = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.gallery');
  const catColor = listing.catColor;

  // All images (already sorted by position in queries.mapDetail)
  const allImages = useMemo(
    () => listing.images.filter((img) => img.url),
    [listing.images],
  );

  const [activeCat, setActiveCat] = useState<FilterKey>('all');
  const visible = useMemo(
    () =>
      activeCat === 'all'
        ? allImages
        : allImages.filter((img) => img.category === activeCat),
    [allImages, activeCat],
  );

  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset idx when category changes
  useEffect(() => {
    setIdx(0);
  }, [activeCat]);

  const go = useCallback(
    (delta: number) => {
      setDirection(delta);
      setIdx((prev) => {
        const next = prev + delta;
        if (next < 0) return visible.length - 1;
        if (next >= visible.length) return 0;
        return next;
      });
    },
    [visible.length],
  );

  const jump = useCallback(
    (i: number) => {
      setDirection(i > idx ? 1 : -1);
      setIdx(i);
    },
    [idx],
  );

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape' && lightbox) setLightbox(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, lightbox]);

  const thumbRailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = thumbRailRef.current;
    if (!rail) return;
    const el = rail.querySelector<HTMLButtonElement>(
      `[data-thumb-idx="${idx}"]`,
    );
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [idx]);

  const current = visible[idx] ?? visible[0];

  // ─── Cursor-follow parallax on hero ────────────────────────
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const mxS = useSpring(mx, { stiffness: 120, damping: 22 });
  const myS = useSpring(my, { stiffness: 120, damping: 22 });
  const tx = useTransform(mxS, [0, 1], ['2%', '-2%']);
  const ty = useTransform(myS, [0, 1], ['2%', '-2%']);

  const onHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onHeroLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  // Share
  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* noop */
    }
  };

  // Counts per category for pill badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allImages.length };
    for (const img of allImages) {
      if (img.category) c[img.category] = (c[img.category] || 0) + 1;
    }
    return c;
  }, [allImages]);

  const hasVideo = listing.isFeatured;
  const has360 = listing.isFeatured || listing.isHot;

  if (allImages.length === 0 || !current) return null;

  const currentCategoryKey: ImageCategory = current.category ?? 'exterior';

  return (
    <div className="relative w-full">
      <div>
        {/* ── Category pills ─────────────────────────── */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const n = counts[c.key] ?? 0;
              if (c.key !== 'all' && n === 0) return null;
              const active = activeCat === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCat(c.key)}
                  className={
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-medium transition ' +
                    (active
                      ? 'border-foreground/40 bg-foreground text-background'
                      : 'border-foreground/10 bg-foreground/[0.03] text-foreground/75 hover:border-foreground/25 hover:bg-foreground/[0.06]')
                  }
                >
                  {t(c.labelKey)}
                  <span
                    className={
                      'tabular-nums text-[10px] ' +
                      (active ? 'text-background/70' : 'text-foreground/45')
                    }
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Utility actions */}
          <div className="hidden items-center gap-1.5 md:flex">
            <UtilButton onClick={share} icon={<Share2 size={13} />} label={t('share')} />
            <UtilButton
              icon={<Download size={13} />}
              label={t('download')}
              as="a"
              href={current.url}
              download
            />
            <UtilButton
              onClick={() => setLightbox(true)}
              icon={<Expand size={13} />}
              label={t('fullscreen')}
            />
          </div>
        </div>

        {/* ── Main layout: hero + side rail ──────────── */}
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          {/* HERO */}
          <div className="relative">
            <div
              className="group/hero relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.04] shadow-lg"
              onMouseMove={onHeroMove}
              onMouseLeave={onHeroLeave}
              onDoubleClick={() => setLightbox(true)}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(60% 60% at 50% 40%, ${catColor}22, transparent)`,
                }}
              />

              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.img
                  key={current.url}
                  src={current.url}
                  alt={current.altText ?? listing.title}
                  draggable={false}
                  initial={{ opacity: 0, scale: 1.04, x: direction * 24 }}
                  animate={{ opacity: 1, scale: 1.02, x: 0 }}
                  exit={{ opacity: 0, scale: 1.0, x: -direction * 24 }}
                  transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
                  style={{ x: tx, y: ty }}
                  className="absolute inset-0 size-full object-cover"
                  loading="eager"
                />
              </AnimatePresence>

              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  else if (info.offset.x > 60) go(-1);
                }}
              />

              {/* Top-start: counter */}
              <div className="pointer-events-none absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                <Camera size={11} strokeWidth={2.4} />
                <span className="tabular-nums">
                  {idx + 1} / {visible.length}
                </span>
              </div>

              {/* Top-end: media badges */}
              <div className="absolute end-4 top-4 z-10 flex items-center gap-1.5">
                {has360 && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-black/75"
                  >
                    <Orbit size={11} strokeWidth={2.4} />
                    360°
                  </button>
                )}
                {hasVideo && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-black/75"
                  >
                    <Play size={11} strokeWidth={2.4} />
                    {t('video')}
                  </button>
                )}
              </div>

              <NavButton dir="prev" onClick={() => go(-1)} />
              <NavButton dir="next" onClick={() => go(1)} />

              {/* Bottom overlay: category tag + zoom hint */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 pt-16">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md"
                  style={{ background: `${catColor}cc` }}
                >
                  <span className="inline-block size-1.5 rounded-full bg-white/90" />
                  {t(`cat${capitalize(currentCategoryKey)}`)}
                </span>
                <span className="hidden items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-md md:inline-flex">
                  <ZoomIn size={11} strokeWidth={2.2} />
                  {t('doubleClickZoom')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] w-full bg-white/10">
                <motion.div
                  className="h-full"
                  style={{ background: catColor }}
                  animate={{ width: `${((idx + 1) / visible.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Mobile utility row */}
            <div className="mt-3 flex items-center justify-center gap-1.5 md:hidden">
              <UtilButton onClick={share} icon={<Share2 size={13} />} label={t('share')} />
              <UtilButton
                onClick={() => setLightbox(true)}
                icon={<Expand size={13} />}
                label={t('fullscreen')}
              />
            </div>
          </div>

          {/* SIDE RAIL — quick visual metadata */}
          <aside className="hidden w-[220px] flex-col gap-2 lg:flex">
            <SideStat
              label={t('sidePhotos')}
              value={visible.length}
              hint={t('sidePhotosHint')}
            />
            <SideStat
              label={t('sideUploaded')}
              value={t('sideUploadedValue')}
              small
            />
            <div
              className="relative flex-1 overflow-hidden rounded-2xl border border-foreground/10 p-4"
              style={{
                background: `linear-gradient(160deg, ${catColor}18, ${catColor}05 70%, transparent)`,
              }}
            >
              <Info size={14} className="mb-2 text-foreground/60" />
              <p className="text-[11px] leading-relaxed text-foreground/70">
                {t('sideHintBody')}
              </p>
              <ul className="mt-3 space-y-1.5 text-[10.5px] text-foreground/55">
                <li className="flex items-center gap-1.5">
                  <kbd className="rounded border border-foreground/15 bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-foreground/70">
                    ←
                  </kbd>
                  {t('shortcutPrev')}
                </li>
                <li className="flex items-center gap-1.5">
                  <kbd className="rounded border border-foreground/15 bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-foreground/70">
                    →
                  </kbd>
                  {t('shortcutNext')}
                </li>
                <li className="flex items-center gap-1.5">
                  <kbd className="rounded border border-foreground/15 bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-foreground/70">
                    Esc
                  </kbd>
                  {t('shortcutEsc')}
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* ── Thumbnail rail ─────────────────────────── */}
        <div
          ref={thumbRailRef}
          className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((img, i) => {
            const active = i === idx;
            return (
              <button
                key={img.url + i}
                type="button"
                data-thumb-idx={i}
                onClick={() => jump(i)}
                className={
                  'relative aspect-[4/3] h-16 shrink-0 overflow-hidden rounded-lg border transition-all duration-300 md:h-20 ' +
                  (active
                    ? 'border-foreground/60 opacity-100 shadow-md ring-2 ring-offset-2 ring-offset-background'
                    : 'border-foreground/10 opacity-55 hover:opacity-90')
                }
                style={
                  active
                    ? ({ '--tw-ring-color': catColor } as React.CSSProperties)
                    : undefined
                }
                aria-label={`${t('thumb')} ${i + 1}`}
              >
                <img
                  src={toThumb(img.url)}
                  alt={img.altText ?? listing.title}
                  className="size-full object-cover"
                  loading="lazy"
                />
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-[2px]"
                    style={{ background: catColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute end-5 top-5 grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="absolute start-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
              <span className="tabular-nums">{idx + 1} / {visible.length}</span>
              <span className="text-white/50">·</span>
              <span className="text-white/80">
                {t(`cat${capitalize(currentCategoryKey)}`)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute start-6 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 rtl:rotate-180"
              aria-label="Prev"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute end-6 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 rtl:rotate-180"
              aria-label="Next"
            >
              <ChevronRight size={22} />
            </button>

            <motion.img
              key={current.url + '-lb'}
              src={current.url}
              alt={current.altText ?? listing.title}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed((z) => !z);
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: isZoomed ? 1.6 : 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className={
                'max-h-[85vh] max-w-[90vw] select-none rounded-lg object-contain shadow-2xl ' +
                (isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Small pieces ─────────────────────────────────────
const NavButton = ({
  dir,
  onClick,
}: {
  dir: 'prev' | 'next';
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={dir}
    className={
      'absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/70 ' +
      (dir === 'prev' ? 'start-4' : 'end-4') +
      ' opacity-0 group-hover/hero:opacity-100 rtl:rotate-180'
    }
  >
    {dir === 'prev' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
  </button>
);

type UtilButtonProps =
  | {
      as?: 'button';
      onClick?: () => void;
      icon: React.ReactNode;
      label: string;
      href?: never;
      download?: never;
    }
  | {
      as: 'a';
      href?: string;
      download?: boolean;
      icon: React.ReactNode;
      label: string;
      onClick?: never;
    };

const UtilButton = (props: UtilButtonProps) => {
  const className =
    'inline-flex h-8 items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 text-[11px] font-medium text-foreground/70 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground';
  if (props.as === 'a') {
    return (
      <a
        href={props.href}
        download={props.download}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {props.icon}
        {props.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={className}>
      {props.icon}
      {props.label}
    </button>
  );
};

const SideStat = ({
  label,
  value,
  hint,
  small,
}: {
  label: string;
  value: string | number;
  hint?: string;
  small?: boolean;
}) => (
  <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3">
    <p className="text-[9.5px] uppercase tracking-[0.15em] text-foreground/45">
      {label}
    </p>
    <p
      className={
        'font-calSans font-bold tabular-nums text-foreground ' +
        (small ? 'text-[14px]' : 'text-[22px]')
      }
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 text-[10px] text-foreground/50">{hint}</p>}
  </div>
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default RideDetailGallery;
