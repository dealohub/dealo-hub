'use client';

import { motion } from 'framer-motion';
import {
  ChevronRight,
  Eye,
  MapPin,
  Calendar,
  ShieldCheck,
  Flame,
  Camera,
  MessageSquare,
  Heart,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { RideDetail } from '@/lib/rides/types';

/**
 * RideDetailHeader — page header for /rides/[id].
 *
 * Layout (top to bottom, single narrative column):
 *   1. Breadcrumb (doubles as the back-link — no redundant "back" button)
 *   2. Title block — centered badges · H1 title · spec line
 *   3. Dealer strip — avatar + name on one side, stats on the other
 *
 * All data comes from RideDetail (DB-backed). Hash-synthesized counts
 * are gone; header now shows real view/save/inquiry counters from the
 * listings table (trigger-maintained).
 */

interface Props {
  listing: RideDetail;
  locale: 'ar' | 'en';
}

const LOW_MILEAGE_KM = 2000;

export const RideDetailHeader = ({ listing, locale }: Props) => {
  const t = useTranslations('marketplace.rides.detail');
  const catColor = listing.catColor;

  const categoryLabel =
    locale === 'ar' ? listing.category.nameAr : listing.category.nameEn;

  // Derive spec-line bits from real specs
  const mileageKm = listing.specs.mileageKm ?? 0;
  const mileageLabel =
    mileageKm === 0
      ? t('brandNew')
      : `${mileageKm.toLocaleString('en-US')} km`;

  const engineLabel =
    listing.specs.fuelType === 'electric'
      ? 'Electric'
      : listing.specs.engineCc
        ? `${(listing.specs.engineCc / 1000).toFixed(1)}L${
            listing.specs.cylinders
              ? ` · ${listing.specs.cylinders}-cyl`
              : ''
          }`
        : '';

  // Price-drop derivation
  const dropPct =
    listing.oldPriceMinorUnits && listing.oldPriceMinorUnits > listing.priceMinorUnits
      ? Math.round(
          (1 - listing.priceMinorUnits / listing.oldPriceMinorUnits) * 100,
        )
      : null;

  const dealerLabel =
    listing.seller.dealerName?.trim() || listing.seller.displayName;

  const initials = dealerLabel
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');

  const isVerifiedDealer =
    listing.seller.isDealer && Boolean(listing.seller.dealerVerifiedAt);

  return (
    <section className="relative w-full overflow-hidden border-b border-foreground/10 bg-background">
      {/* ── Ambient layers ─────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(700px 280px at 85% 0%, ${catColor}1a, transparent 55%), radial-gradient(500px 220px at 10% 100%, ${catColor}12, transparent 60%)`,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-full"
        style={{
          background:
            'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 2,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-6 pt-5 md:pb-8 md:pt-6">
        {/* ── 1. Breadcrumb — centered to match hero ──────── */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex min-w-0 flex-wrap items-center justify-center gap-1.5 text-[11.5px] text-foreground/55"
        >
          <Link href="/" className="transition hover:text-foreground">
            {t('crumbHome')}
          </Link>
          <ChevronRight
            size={12}
            className="shrink-0 text-foreground/30 rtl:rotate-180"
          />
          <Link href="/rides" className="transition hover:text-foreground">
            {t('crumbRides')}
          </Link>
          <ChevronRight
            size={12}
            className="shrink-0 text-foreground/30 rtl:rotate-180"
          />
          <span
            className="inline-flex items-center gap-1.5 font-medium"
            style={{ color: catColor }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: catColor }}
            />
            {categoryLabel}
          </span>
          <ChevronRight
            size={12}
            className="shrink-0 text-foreground/30 rtl:rotate-180"
          />
          <span className="truncate font-medium text-foreground/80">
            {listing.title}
          </span>
        </nav>

        {/* ── 2. Title block — centered hero ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          {/* Badges row */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{
                background: `${catColor}1a`,
                color: catColor,
                border: `1px solid ${catColor}44`,
              }}
            >
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: catColor }}
              />
              {categoryLabel}
            </span>

            {/* Verified = live + clean (we're rendering, so status=live, fraud NOT held/rejected — show) */}
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
              <ShieldCheck size={10} strokeWidth={2.4} />
              {t('badgeVerified')}
            </span>

            {listing.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C9A86A]">
                ◆ {t('badgeFeatured')}
              </span>
            )}

            {listing.isHot && (
              <motion.span
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame size={10} strokeWidth={2.4} />
                {t('badgeHot')}
              </motion.span>
            )}

            {dropPct !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e30613] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-[#e30613]/25">
                {dropPct}% {t('badgePriceDrop')}
              </span>
            )}

            {mileageKm < LOW_MILEAGE_KM && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t('badgeLowMileage')}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-calSans text-[28px] font-extrabold leading-[1.1] tracking-tight text-foreground md:text-[36px] lg:text-[44px]">
            {listing.title}
          </h1>

          {/* Spec line — immediately under title, centered */}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-foreground/65 md:text-[14px]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar
                size={13}
                strokeWidth={2.2}
                className="text-foreground/40"
              />
              <span className="font-semibold tabular-nums text-foreground/85">
                {listing.specs.year}
              </span>
            </span>
            {engineLabel && (
              <>
                <Dot />
                <span>{engineLabel}</span>
              </>
            )}
            <Dot />
            <span>{mileageLabel}</span>
            <Dot />
            <span className="inline-flex items-center gap-1.5">
              <MapPin
                size={13}
                strokeWidth={2.2}
                className="text-foreground/40"
              />
              {listing.cityName}
            </span>
          </p>
        </motion.div>

        {/* ── 3. Dealer + stats strip ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 0.61, 0.36, 1] }}
          className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-foreground/10 pt-4"
        >
          {/* Dealer */}
          <div className="flex items-center gap-3">
            <div
              className="grid size-10 place-items-center rounded-xl text-[11px] font-extrabold tracking-tight"
              style={{ background: `${catColor}18`, color: catColor }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold text-foreground">
                  {dealerLabel}
                </span>
                {isVerifiedDealer && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    className="shrink-0"
                  >
                    <path
                      d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z"
                      fill="#3B82F6"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-foreground/45">
                {listing.seller.isDealer
                  ? t('authorizedDealer')
                  : t('privateSeller')}
              </p>
            </div>
          </div>

          {/* Stats — all real, from DB triggers */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px]">
            <Stat
              icon={<Eye size={12} strokeWidth={2.2} />}
              value={listing.viewCount}
              label={t('statViews')}
            />
            <Stat
              icon={<Heart size={12} strokeWidth={2.2} />}
              value={listing.saveCount}
              label={t('statSaves')}
            />
            <Stat
              icon={<MessageSquare size={12} strokeWidth={2.2} />}
              value={listing.chatInitiationCount}
              label={t('statInquiries')}
            />
            <Stat
              icon={<Camera size={12} strokeWidth={2.2} />}
              value={listing.images.length}
              label={t('statPhotos')}
            />
            <Stat value={`#${listing.id}`} label={t('statListingId')} mono />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ─── Small pieces ─────────────────────────────────────
const Dot = () => <span className="text-foreground/20">·</span>;

const Stat = ({
  icon,
  value,
  label,
  mono,
}: {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  mono?: boolean;
}) => (
  <span className="inline-flex items-center gap-1.5 text-foreground/55">
    {icon && <span className="text-foreground/40">{icon}</span>}
    <span
      className={
        'font-semibold text-foreground/85 ' +
        (mono ? 'font-mono text-[11px]' : 'tabular-nums')
      }
    >
      {value}
    </span>
    <span className="text-foreground/45">{label}</span>
  </span>
);

export default RideDetailHeader;
