'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Sofa,
  Smartphone,
  Music,
  Sparkles,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  FEATURE_CATEGORIES,
  buildRideSpecs,
  type FeatureCategory,
  type FeatureKey,
} from './build-ride-specs';
import { VEHICLE_COLORS, type RideListing } from './rides-data';

/**
 * RideDetailFeatures — buyer-facing equipment summary.
 *
 * Simplified from the earlier version: no tabs, no search, no
 * "show missing" toggle (those are editor-side concerns that belong
 * in the seller's dashboard). This component just lists what the
 * vehicle has, grouped by category, with a "show more" for overflow.
 */

interface Props {
  listing: RideListing;
}

const CATEGORY_META: Record<
  FeatureCategory,
  { icon: React.ReactNode; tint: string }
> = {
  safety: { icon: <Shield size={12} strokeWidth={2.2} />, tint: '#16a34a' },
  comfort: { icon: <Sofa size={12} strokeWidth={2.2} />, tint: '#8b5cf6' },
  tech: { icon: <Smartphone size={12} strokeWidth={2.2} />, tint: '#0ea5e9' },
  entertainment: { icon: <Music size={12} strokeWidth={2.2} />, tint: '#ec4899' },
  exterior: { icon: <Sparkles size={12} strokeWidth={2.2} />, tint: '#f59e0b' },
};

const INITIAL_VISIBLE = 12;

export const RideDetailFeatures = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.features');
  const catColor = VEHICLE_COLORS[listing.type];
  const specs = useMemo(() => buildRideSpecs(listing), [listing]);

  // Flat list of INCLUDED features only, preserving category order
  const included: { key: FeatureKey; category: FeatureCategory }[] = useMemo(() => {
    const out: { key: FeatureKey; category: FeatureCategory }[] = [];
    (Object.keys(FEATURE_CATEGORIES) as FeatureCategory[]).forEach((cat) => {
      FEATURE_CATEGORIES[cat].forEach((k) => {
        if (specs.features.has(k)) out.push({ key: k, category: cat });
      });
    });
    return out;
  }, [specs]);

  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? included : included.slice(0, INITIAL_VISIBLE);
  const hidden = Math.max(0, included.length - INITIAL_VISIBLE);

  return (
    <section className="relative">
      <div className="mb-4">
        <div className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
          <span className="h-px w-6" style={{ background: catColor }} />
          {t('eyebrow')}
        </div>
        <h2 className="font-calSans text-[22px] font-extrabold tracking-tight text-foreground md:text-[26px]">
          {t('titleSimple')}
        </h2>
        <p className="mt-1 text-[12px] text-foreground/55">
          {t('countSimple', { n: included.length })}
        </p>
      </div>

      {/* Flat clean grid */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {visible.map(({ key, category }) => (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 border-b border-foreground/[0.06] py-2.5"
            >
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check size={11} strokeWidth={2.8} />
              </span>
              <span
                className="shrink-0"
                style={{ color: CATEGORY_META[category].tint }}
              >
                {CATEGORY_META[category].icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/85">
                {t(`list.${key}`)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show more / less */}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold transition"
          style={{ color: expanded ? 'var(--foreground, currentColor)' : catColor }}
        >
          {expanded ? t('showLess') : t('showMore', { n: hidden })}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={13} strokeWidth={2.4} />
          </motion.span>
        </button>
      )}
    </section>
  );
};

export default RideDetailFeatures;
