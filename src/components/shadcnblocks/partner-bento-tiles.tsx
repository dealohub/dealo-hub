'use client';

import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 0.61, 0.36, 1] as const;

function useEntrance(delay = 0) {
  const shouldReduce = useReducedMotion();
  return {
    initial: { opacity: 0, y: shouldReduce ? 0 : 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' } as const,
    transition: shouldReduce ? { duration: 0 } : { duration: 0.45, delay, ease: EASE },
  };
}

// ── Shared placeholder label ──────────────────────────────────
const AdsLabel = ({ color = 'rgba(255,255,255,0.18)' }: { color?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <span
      className="rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em]"
      style={{ borderColor: color, color }}
    >
      مُموَّل
    </span>
    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color }}>
      ADS
    </span>
  </div>
);

// ─── TILE 2 — Tall Brand Takeover ────────────────────────────
export const TallBrandTakeover = () => (
  <motion.article
    {...useEntrance(0.06)}
    className="relative flex items-center justify-center overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 md:h-[400px] lg:col-span-4 lg:h-full"
    style={{ background: 'linear-gradient(160deg, #0d2a6b 0%, #1a3f9e 50%, #0d2a6b 100%)', minHeight: 240 }}
  >
    <AdsLabel color="rgba(147,197,253,0.95)" />
  </motion.article>
);

// ─── TILE 3 — أحمر ───────────────────────────────────────────
export const DealoAITile = () => (
  <motion.div
    {...useEntrance(0.12)}
    className="relative col-span-1 flex h-[192px] items-center justify-center overflow-hidden rounded-3xl md:col-span-2 lg:col-span-2"
    style={{ background: 'linear-gradient(135deg, #7a0c0c 0%, #a81212 100%)' }}
  >
    <AdsLabel color="rgba(255,180,180,0.95)" />
  </motion.div>
);

// ─── TILE 4 — أخضر ───────────────────────────────────────────
export const LiveStatsTile = () => (
  <motion.div
    {...useEntrance(0.18)}
    className="relative col-span-1 flex h-[192px] items-center justify-center overflow-hidden rounded-3xl md:col-span-2 lg:col-span-2"
    style={{ background: 'linear-gradient(135deg, #0c5c28 0%, #117a35 100%)' }}
  >
    <AdsLabel color="rgba(134,239,172,0.95)" />
  </motion.div>
);

// ─── TILE 5 — بنفسجي ─────────────────────────────────────────
export const DealerStripTile = () => (
  <motion.article
    {...useEntrance(0.24)}
    className="relative col-span-1 flex h-[300px] items-center justify-center overflow-hidden rounded-3xl md:col-span-4 lg:col-span-4"
    style={{ background: 'linear-gradient(135deg, #3b0764 0%, #5b21b6 100%)' }}
  >
    <AdsLabel color="rgba(216,180,254,0.95)" />
  </motion.article>
);

// ─── TILE 6 — أصفر ───────────────────────────────────────────
export const ServiceProviderTile = () => (
  <motion.article
    {...useEntrance(0.30)}
    className="relative col-span-1 flex h-[300px] items-center justify-center overflow-hidden rounded-3xl md:col-span-2 lg:col-span-3"
    style={{ background: 'linear-gradient(135deg, #713f00 0%, #92500a 100%)' }}
  >
    <AdsLabel color="rgba(253,224,71,0.95)" />
  </motion.article>
);

// ─── TILE 7 — رمادي ──────────────────────────────────────────
export const CategoryGatewayTile = () => (
  <motion.article
    {...useEntrance(0.36)}
    className="relative col-span-1 flex h-[300px] items-center justify-center overflow-hidden rounded-3xl md:col-span-2 lg:col-span-3"
    style={{ background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' }}
  >
    <AdsLabel color="rgba(229,231,235,0.95)" />
  </motion.article>
);

// ─── TILE 8 — أبيض ───────────────────────────────────────────
export const ListingSpotlightTile = () => (
  <motion.article
    {...useEntrance(0.42)}
    className="relative col-span-1 flex h-[300px] items-center justify-center overflow-hidden rounded-3xl md:col-span-2 lg:col-span-6"
    style={{ background: 'linear-gradient(135deg, #d1d5db 0%, #f3f4f6 100%)' }}
  >
    <AdsLabel color="rgba(30,30,30,0.7)" />
  </motion.article>
);
