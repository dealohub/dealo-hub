'use client';

import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import {
  ShieldCheck,
  Award,
  Repeat,
  Sparkles,
  TrendingDown,
  Heart,
  ArrowLeftRight,
  Share2,
  Star,
  CircleDot,
  Clock,
  Eye,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ElectronicsDetail } from '@/lib/electronics/types';
import { formatPrice, fromMinorUnits } from '@/lib/format';
import ContactSellerButton from '@/components/chat/contact-seller-button';

interface Props {
  listing: ElectronicsDetail;
  locale: 'ar' | 'en';
}

const daysBetween = (iso: string | null): number => {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};

export default function ElectronicsDetailPurchasePanel({ listing, locale }: Props) {
  const t = useTranslations('electronicsDetail');
  const f = listing.fields;
  const seller = listing.seller;

  const price = fromMinorUnits(listing.priceMinorUnits, listing.currencyCode);
  const oldPrice =
    listing.oldPriceMinorUnits != null
      ? fromMinorUnits(listing.oldPriceMinorUnits, listing.currencyCode)
      : null;
  const dropPct =
    oldPrice != null && oldPrice > price
      ? Math.round((1 - price / oldPrice) * 100)
      : null;

  const accentColor =
    dropPct != null && dropPct >= 8
      ? '#16a34a'
      : listing.isFeatured
        ? '#f59e0b'
        : '#64748b';

  const verdictLabel =
    dropPct != null && dropPct >= 8
      ? t('verdictDeal')
      : listing.isPriceNegotiable
        ? t('verdictNegotiable')
        : listing.isFeatured
          ? t('verdictPremium')
          : t('verdictMarketRate');

  const VerdictIcon = dropPct != null && dropPct >= 8 ? TrendingDown : Sparkles;

  const sellerName =
    seller.isDealer && seller.dealerName ? seller.dealerName : seller.displayName;
  const sellerInitials = sellerName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');
  const isVerifiedDealer = seller.isDealer && Boolean(seller.dealerVerifiedAt);
  const ratingAvg = seller.ratingAvg;
  const ratingCount = seller.ratingCount;
  const postedDays = daysBetween(listing.publishedAt);

  const [saved, setSaved] = useState(false);

  return (
    <aside className="relative self-start lg:sticky lg:top-6">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[28px] opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(300px 200px at 30% 0%, ${accentColor}22, transparent 70%), radial-gradient(260px 180px at 70% 100%, ${accentColor}1a, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/95 shadow-xl backdrop-blur-xl"
      >
        {/* Verdict bar */}
        <div
          className="flex items-center gap-2 px-5 py-2 text-[11px] font-semibold"
          style={{
            background: `linear-gradient(90deg, ${accentColor}22, transparent 80%)`,
            color: accentColor,
          }}
        >
          <VerdictIcon size={12} strokeWidth={2.4} className="shrink-0" />
          <span className="min-w-0 truncate">{verdictLabel}</span>
          <span className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-current/20 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider opacity-80">
            Dealo AI
          </span>
        </div>

        <div className="p-5 md:p-6">
          {/* Action icons */}
          <div className="mb-3 flex items-center justify-end gap-1.5">
            <PanelIconButton
              active={saved}
              onClick={() => setSaved((v) => !v)}
              label="Save"
              activeColor="#dc2626"
            >
              <Heart
                size={14}
                strokeWidth={2.2}
                fill={saved ? '#dc2626' : 'none'}
              />
            </PanelIconButton>
            <PanelIconButton label="Compare">
              <ArrowLeftRight size={14} strokeWidth={2.2} />
            </PanelIconButton>
            <PanelIconButton label="Share">
              <Share2 size={14} strokeWidth={2.2} />
            </PanelIconButton>
          </div>

          {/* Price block */}
          <div className="mb-5">
            {oldPrice != null && (
              <div className="mb-1.5 flex items-baseline gap-2 text-[12px]">
                <span className="text-foreground/40 line-through tabular-nums">
                  {formatPrice(listing.oldPriceMinorUnits!, listing.currencyCode, locale)}
                </span>
                {dropPct != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#16a34a]/12 px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">
                    <TrendingDown size={10} strokeWidth={2.6} />
                    {dropPct}%
                  </span>
                )}
              </div>
            )}

            <div className="flex items-baseline gap-2">
              <AnimatedPrice value={price} />
              <span className="text-[14px] font-medium text-foreground/55">
                {listing.currencyCode}
              </span>
            </div>

            {listing.isPriceNegotiable && (
              <span className="mt-1.5 inline-block rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 ring-1 ring-inset ring-sky-500/20 dark:text-sky-400">
                {t('negotiableBadge')}
              </span>
            )}
            <p className="mt-1 text-[12px] text-foreground/55">{listing.cityName}</p>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <ContactSellerButton
              listingId={listing.id}
              locale={locale}
              variant="primary"
              labelOverride={t('contactCta')}
            />
            {listing.isPriceNegotiable && (
              <ContactSellerButton
                listingId={listing.id}
                locale={locale}
                variant="offer"
                labelOverride={t('makeOfferCta')}
              />
            )}
            {f.acceptsTrade && (
              <ContactSellerButton
                listingId={listing.id}
                locale={locale}
                variant="offer"
                labelOverride={t('tradeCta')}
                className="bg-indigo-500/10 text-indigo-700 ring-1 ring-inset ring-indigo-500/20 hover:bg-indigo-500/15 dark:text-indigo-300"
              />
            )}
          </div>

          {/* Seller card */}
          <div className="mt-5 rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.04] to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {seller.avatarUrl ? (
                  <Image
                    src={seller.avatarUrl}
                    alt={sellerName}
                    width={44}
                    height={44}
                    className="size-11 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground/10 text-[12px] font-extrabold text-foreground/60">
                    {sellerInitials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -end-0.5 flex size-3 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                  <span className="absolute size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {sellerName}
                  </p>
                  {isVerifiedDealer && (
                    <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
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
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground/55">
                  {ratingAvg != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star size={10} fill="#F59E0B" stroke="#F59E0B" />
                      <span className="tabular-nums font-semibold text-foreground/80">
                        {ratingAvg.toFixed(1)}
                      </span>
                      <span className="text-foreground/40">({ratingCount})</span>
                    </span>
                  ) : (
                    <span>{t('privateSeller')}</span>
                  )}
                </div>
              </div>

              {seller.handle && (
                <Link
                  href={`/${locale}/profile/${seller.handle}`}
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.03] text-foreground/60 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:text-foreground"
                  aria-label="View profile"
                >
                  <ExternalLink size={12} className="rtl:rotate-180" />
                </Link>
              )}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] text-emerald-600 dark:text-emerald-400">
              <CircleDot size={10} strokeWidth={2.6} />
              <span className="font-medium">{t('onlineStatus')}</span>
            </div>
          </div>

          {/* Trust items */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <TrustItem
              icon={<ShieldCheck size={14} strokeWidth={2.2} />}
              label={t('trustImei')}
              tint="#16a34a"
            />
            <TrustItem
              icon={<Award size={14} strokeWidth={2.2} />}
              label={t('trustInspect')}
              tint="#3b82f6"
            />
            <TrustItem
              icon={<Repeat size={14} strokeWidth={2.2} />}
              label={f.acceptsTrade ? t('trustTrade') : t('trustChatOnly')}
              tint="#8b5cf6"
            />
          </div>

          {/* Social proof */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4 text-[11px] text-foreground/55">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={2.2} className="text-foreground/40" />
              {postedDays === 0 ? t('postedToday') : t('postedDaysAgo', { days: postedDays })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={12} strokeWidth={2.2} className="text-foreground/40" />
              <span className="font-semibold tabular-nums text-foreground/80">
                {listing.viewCount.toLocaleString('en-US')}
              </span>
              {t('statViews')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Badal explainer */}
      {f.acceptsTrade && (
        <div className="mt-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            <Repeat size={12} />
            {t('tradeAcceptedTitle')}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
            {f.tradeForModels
              ? t('tradeAcceptedBody', { models: f.tradeForModels })
              : t('tradeAcceptedGeneric')}
          </p>
        </div>
      )}
    </aside>
  );
}

// ── Animated price counter ────────────────────────────
const AnimatedPrice = ({ value }: { value: number }) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const startValue = value > 10_000 ? value * 0.88 : 0;
    const duration = value > 100_000 ? 0.8 : 1.2;
    const ctrl = animate(startValue, value, {
      duration,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (x) => setV(x),
    });
    return () => ctrl.stop();
  }, [value]);
  return (
    <span className="font-calSans text-[32px] font-extrabold tabular-nums leading-none tracking-tight text-foreground md:text-[36px]">
      {Math.round(v).toLocaleString('en-US')}
    </span>
  );
};

// ── Panel icon button ─────────────────────────────────
const PanelIconButton = ({
  children,
  label,
  onClick,
  active,
  activeColor,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="grid size-8 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.03] text-foreground/65 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
    style={
      active && activeColor
        ? {
            color: activeColor,
            borderColor: `${activeColor}55`,
            background: `${activeColor}12`,
          }
        : undefined
    }
  >
    {children}
  </button>
);

// ── Trust item ────────────────────────────────────────
const TrustItem = ({
  icon,
  label,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  tint: string;
}) => (
  <div className="flex flex-col items-center gap-1 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-2 text-center transition hover:border-foreground/20 hover:bg-foreground/[0.04]">
    <span style={{ color: tint }}>{icon}</span>
    <span className="text-[9.5px] font-semibold leading-tight text-foreground/75">
      {label}
    </span>
  </div>
);
