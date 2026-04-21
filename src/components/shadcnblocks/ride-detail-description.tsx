'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Quote,
  ChevronDown,
  ChevronUp,
  Flag,
  Check,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RideDetail } from '@/lib/rides/types';

/**
 * RideDetailDescription — "كلام البائع" block.
 *
 * Displays the real description text stored on the listing, with
 * word-boundary-aware truncation and a "read more" toggle. Highlight
 * chips are derived from listing signals (warranty active, low
 * mileage, featured, dealer-verified, hot) — no synthetic prose.
 *
 * The prior version synthesized bilingual copy from structured fields
 * and offered an AR/EN toggle. With real descriptions in DB (one
 * language per listing), that pattern is gone.
 */

interface Props {
  listing: RideDetail;
  locale: 'ar' | 'en';
}

const PREVIEW_CHARS = 320;

const LOW_MILEAGE_THRESHOLD_KM = 10_000;

export const RideDetailDescription = ({ listing, locale }: Props) => {
  const t = useTranslations('marketplace.rides.detail.description');
  const catColor = listing.catColor;

  const dealerLabel =
    listing.seller.dealerName?.trim() || listing.seller.displayName;

  const [expanded, setExpanded] = useState(false);
  const body = listing.description;
  const isLong = body.length > PREVIEW_CHARS;
  const preview = isLong
    ? body.slice(0, PREVIEW_CHARS).replace(/\s+\S*$/, '').trimEnd() + '…'
    : body;

  // Derive highlight chips from real listing signals (locale-aware labels).
  const highlights: string[] = [];
  const mileageKm = listing.specs.mileageKm;
  if (mileageKm != null && mileageKm === 0) {
    highlights.push(locale === 'ar' ? 'جديدة 0 كم' : 'Brand new');
  } else if (mileageKm != null && mileageKm < LOW_MILEAGE_THRESHOLD_KM) {
    highlights.push(locale === 'ar' ? 'ميلاج قليل' : 'Low mileage');
  }
  if (listing.specs.warrantyActive) {
    highlights.push(locale === 'ar' ? 'ضمان ساري' : 'Under warranty');
  }
  if (listing.isFeatured) {
    highlights.push(locale === 'ar' ? 'عرض مميّز' : 'Featured listing');
  }
  if (listing.isHot) {
    highlights.push(locale === 'ar' ? 'رائج هذا الأسبوع' : 'Trending');
  }
  if (
    listing.seller.isDealer &&
    listing.seller.dealerVerifiedAt
  ) {
    highlights.push(locale === 'ar' ? 'وكيل معتمد' : 'Verified dealer');
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-background"
    >
      {/* Ambient tint header */}
      <div
        className="flex items-center justify-between gap-3 border-b border-foreground/[0.06] px-5 py-3"
        style={{
          background: `linear-gradient(90deg, ${catColor}10, transparent 70%)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-8 place-items-center rounded-xl text-white shadow-sm"
            style={{ background: catColor }}
          >
            <Quote size={14} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-foreground/55">
              {t('eyebrow')}
            </p>
            <h3 className="font-calSans text-[15px] font-bold leading-tight text-foreground">
              {dealerLabel}
            </h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Highlight chips */}
        {highlights.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <motion.span
                key={h}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/30 bg-[#C9A86A]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[#C9A86A]"
              >
                <Sparkles size={9} strokeWidth={2.4} />
                {h}
              </motion.span>
            ))}
          </div>
        )}

        {/* The text */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={String(expanded)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="whitespace-pre-line text-[13.5px] leading-[1.85] text-foreground/75"
            style={{ textAlign: 'start' }}
          >
            {expanded || !isLong ? body : preview}
          </motion.div>
        </AnimatePresence>

        {/* Read more toggle */}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="group mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground/70 transition hover:text-foreground"
            style={{ color: expanded ? undefined : catColor }}
          >
            {expanded ? t('showLess') : t('readMore')}
            {expanded ? (
              <ChevronUp size={12} className="transition-transform group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown size={12} className="transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        )}

        {/* Footer: written-by + report */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-foreground/[0.06] pt-4 text-[11px] text-foreground/50">
          <span className="inline-flex items-center gap-1.5">
            <Check size={11} strokeWidth={2.4} className="text-emerald-500" />
            {t('writtenBy', { dealer: dealerLabel })}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-foreground/50 transition hover:text-foreground/80"
          >
            <Flag size={11} strokeWidth={2.2} />
            {t('report')}
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default RideDetailDescription;
