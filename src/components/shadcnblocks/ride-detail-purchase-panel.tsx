'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, animate } from 'framer-motion';
import {
  MessageCircle,
  Mail,
  MessageSquare,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Star,
  Clock,
  Eye,
  Wrench,
  Truck,
  Award,
  Calculator,
  ExternalLink,
  CircleDot,
  Heart,
  GitCompare,
  Share2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fromMinorUnits, formatPrice } from '@/lib/format';
import type { RideDetail } from '@/lib/rides/types';

/**
 * RideDetailPurchasePanel — the "buy-side" sticky sidebar.
 *
 * Reads entirely from RideDetail (DB-backed). Synthesis helpers are
 * gone: rating / reviews / years-active come from the joined seller
 * profile, view_count comes from the listings counter, postedDays is
 * derived from publishedAt.
 *
 * Per Decision 2 (chat-only), phone numbers are never exposed. The
 * "Start a chat" primary CTA + WhatsApp + Inquiry buttons are the
 * contact entry points — all three will open the in-app chat flow in
 * Phase 5+. For V1 they are placeholders that stay consistent with
 * the UI but do not dial out.
 */

interface Props {
  listing: RideDetail;
  locale: 'ar' | 'en';
}

// ─── Helpers ──────────────────────────────────────────
const monthlyPayment = (principal: number, aprPct: number, years: number) => {
  const n = years * 12;
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
};

const daysBetween = (isoDate: string | null): number => {
  if (!isoDate) return 0;
  const then = new Date(isoDate).getTime();
  if (!isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000)));
};

// ─── Main ─────────────────────────────────────────────
export const RideDetailPurchasePanel = ({ listing, locale }: Props) => {
  const t = useTranslations('marketplace.rides.detail.purchase');
  const catColor = listing.catColor;

  const price = fromMinorUnits(listing.priceMinorUnits, listing.currencyCode);
  const oldPrice = listing.oldPriceMinorUnits != null
    ? fromMinorUnits(listing.oldPriceMinorUnits, listing.currencyCode)
    : null;
  const dropPct =
    oldPrice != null && oldPrice > price
      ? Math.round((1 - price / oldPrice) * 100)
      : null;

  const postedDays = daysBetween(listing.publishedAt);

  // ── Verdict logic (tiny signal) ──────────────────
  const verdict = useMemo(() => {
    if (dropPct != null && dropPct >= 8) {
      return { key: 'great', tone: '#16a34a' };
    }
    if (listing.isFeatured) return { key: 'fair', tone: catColor };
    if (listing.isHot) return { key: 'competitive', tone: '#f59e0b' };
    return { key: 'market', tone: '#64748b' };
  }, [dropPct, listing.isFeatured, listing.isHot, catColor]);

  // ── Finance state ─────────────────────────────────
  const [financeOpen, setFinanceOpen] = useState(false);
  const [down, setDown] = useState(20);
  const [apr, setApr] = useState(2.79);
  const [years, setYears] = useState(5);
  const downAmount = (price * down) / 100;
  const loan = price - downAmount;
  const monthly = Math.round(monthlyPayment(loan, apr, years));

  // ── Save state (optimistic toggle) ───────────────
  const [saved, setSaved] = useState(false);

  // ── Dealer display helpers ───────────────────────
  const dealerLabel =
    listing.seller.dealerName?.trim() || listing.seller.displayName;
  const dealerInitials = dealerLabel
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');
  const isVerifiedDealer =
    listing.seller.isDealer && Boolean(listing.seller.dealerVerifiedAt);
  const ratingAvg = listing.seller.ratingAvg;
  const ratingCount = listing.seller.ratingCount;
  const yearsActive = listing.seller.yearsActive;

  return (
    <aside className="relative self-start lg:sticky lg:top-6">
      {/* Ambient glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[28px] opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(300px 200px at 30% 0%, ${verdict.tone}22, transparent 70%), radial-gradient(260px 180px at 70% 100%, ${catColor}1a, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-background/95 shadow-xl backdrop-blur-xl"
      >
        {/* ── Verdict top-bar ───── */}
        <div
          className="flex items-center gap-2 px-5 py-2 text-[11px] font-semibold"
          style={{
            background: `linear-gradient(90deg, ${verdict.tone}22, transparent 80%)`,
            color: verdict.tone,
          }}
        >
          <Sparkles size={12} strokeWidth={2.4} className="shrink-0" />
          <span className="min-w-0 truncate">
            {t(`verdict.${verdict.key}`)}
          </span>
          <span className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-current/20 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider opacity-70">
            Dealo AI
          </span>
        </div>

        <div className="p-5 md:p-6">
          {/* ── Action icons row ─────── */}
          <div className="mb-3 flex items-center justify-end gap-1.5">
            <PanelIconButton
              active={saved}
              onClick={() => setSaved((v) => !v)}
              label={t('actionSave')}
              activeColor="#dc2626"
            >
              <Heart
                size={14}
                strokeWidth={2.2}
                fill={saved ? '#dc2626' : 'none'}
              />
            </PanelIconButton>
            <PanelIconButton label={t('actionCompare')}>
              <GitCompare size={14} strokeWidth={2.2} />
            </PanelIconButton>
            <PanelIconButton label={t('actionShare')}>
              <Share2 size={14} strokeWidth={2.2} />
            </PanelIconButton>
          </div>

          {/* ── Price block ────────────────────── */}
          <div className="mb-5">
            {oldPrice != null && (
              <div className="mb-1.5 flex items-baseline gap-2 text-[12px]">
                <span className="text-foreground/40 line-through tabular-nums">
                  {formatPrice(
                    listing.oldPriceMinorUnits!,
                    listing.currencyCode,
                    locale,
                  )}
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

            <p className="mt-1 text-[12px] text-foreground/55">
              <span className="text-foreground/75">{listing.cityName}</span>
            </p>
          </div>

          {/* ── Monthly installment preview ──────── */}
          <button
            type="button"
            onClick={() => setFinanceOpen((v) => !v)}
            className="group mb-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-start transition hover:border-foreground/20 hover:bg-foreground/[0.05]"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-foreground/[0.06] text-foreground/70">
                <Calculator size={15} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-foreground/50">
                  {t('monthlyFrom')}
                </p>
                <p className="font-calSans text-[18px] font-bold leading-none tabular-nums text-foreground">
                  {monthly.toLocaleString('en-US')}{' '}
                  <span className="text-[11px] font-medium text-foreground/55">
                    {t('perMonth')}
                  </span>
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: financeOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-foreground/40"
            >
              <ChevronDown size={16} />
            </motion.div>
          </button>

          {/* ── Finance calculator (collapsible) ── */}
          <AnimatePresence initial={false}>
            {financeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mb-5 space-y-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <Stat label={t('calcPrice')} value={price.toLocaleString('en-US')} />
                    <Stat
                      label={t('calcLoan')}
                      value={loan.toLocaleString('en-US')}
                    />
                  </div>

                  <SliderRow
                    label={t('calcDown')}
                    value={down}
                    min={0}
                    max={60}
                    step={1}
                    onChange={setDown}
                    suffix="%"
                    extra={`${downAmount.toLocaleString('en-US')} ${listing.currencyCode}`}
                    accent={catColor}
                  />
                  <SliderRow
                    label={t('calcApr')}
                    value={apr}
                    min={0}
                    max={9.99}
                    step={0.1}
                    onChange={setApr}
                    suffix="%"
                    accent={catColor}
                  />

                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
                      {t('calcTerm')}
                    </p>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((y) => {
                        const active = y === years;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setYears(y)}
                            className={
                              'h-8 rounded-lg border text-[11.5px] font-semibold tabular-nums transition ' +
                              (active
                                ? 'text-background shadow-sm'
                                : 'border-foreground/10 bg-foreground/[0.03] text-foreground/70 hover:border-foreground/25')
                            }
                            style={
                              active
                                ? {
                                    background: catColor,
                                    borderColor: catColor,
                                  }
                                : undefined
                            }
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-foreground/10 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
                        {t('calcMonthly')}
                      </p>
                      <p className="font-calSans text-[22px] font-extrabold tabular-nums leading-none text-foreground">
                        {monthly.toLocaleString('en-US')}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] text-foreground/50">
                        {t('calcTotal')}
                      </p>
                      <p className="text-[13px] font-semibold tabular-nums text-foreground/80">
                        {(monthly * years * 12).toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>

                  <p className="text-[9.5px] leading-relaxed text-foreground/45">
                    {t('calcDisclaimer')}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Primary CTAs ─────────────────────── */}
          <div className="space-y-2">
            {/* Start-a-chat (replaces phone reveal per Decision 2) */}
            <motion.button
              type="button"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-md transition hover:shadow-lg"
              style={{ background: '#dc2626' }}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              aria-label={t('startChat')}
            >
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                animate={{
                  background: [
                    'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                    'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                  ],
                  backgroundPosition: ['200% 0', '-200% 0'],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                style={{ backgroundSize: '200% 100%' }}
              />
              <MessageSquare
                size={14}
                strokeWidth={2.4}
                className="relative z-10"
              />
              <span className="relative z-10">{t('startChat')}</span>
            </motion.button>

            {/* WhatsApp */}
            <button
              type="button"
              aria-label={t('whatsapp')}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-semibold transition hover:-translate-y-0.5"
              style={{
                borderColor: '#25D36644',
                background: '#25D36612',
                color: '#1fa855',
              }}
            >
              <MessageCircle size={13} strokeWidth={2.4} fill="#25D36630" />
              {t('whatsapp')}
            </button>

            {/* Inquiry form */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-2.5 text-[12.5px] font-semibold text-foreground/80 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <Mail size={13} strokeWidth={2.2} />
              {t('inquiry')}
            </button>
          </div>

          {/* ── Dealer card ─────────────────────── */}
          <div className="mt-5 rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.04] to-transparent p-4">
            <div className="flex items-center gap-3">
              <div
                className="relative grid size-11 shrink-0 place-items-center rounded-xl text-[12px] font-extrabold tracking-tight"
                style={{ background: `${catColor}1a`, color: catColor }}
              >
                {dealerInitials}
                <span className="absolute -bottom-0.5 -end-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {dealerLabel}
                  </p>
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
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground/55">
                  {ratingAvg != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star size={10} fill="#F59E0B" stroke="#F59E0B" />
                      <span className="tabular-nums font-semibold text-foreground/80">
                        {ratingAvg.toFixed(1)}
                      </span>
                      <span className="text-foreground/40">
                        ({ratingCount})
                      </span>
                    </span>
                  ) : (
                    <span className="text-foreground/55">
                      {t('noRatingYet')}
                    </span>
                  )}
                  {yearsActive > 0 && (
                    <>
                      <span className="text-foreground/25">·</span>
                      <span className="tabular-nums">
                        {yearsActive} {t('years')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="grid size-8 shrink-0 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.03] text-foreground/60 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:text-foreground"
                aria-label={t('visitDealer')}
              >
                <ExternalLink size={12} className="rtl:rotate-180" />
              </button>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] text-emerald-600 dark:text-emerald-400">
              <CircleDot size={10} strokeWidth={2.6} />
              <span className="font-medium">{t('onlineNow')}</span>
              <span className="text-foreground/35">·</span>
              <span className="text-foreground/55">{t('repliesIn')}</span>
            </div>
          </div>

          {/* ── Trust strip ─────────────────────── */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <TrustItem
              icon={<ShieldCheck size={14} strokeWidth={2.2} />}
              label={t('trustInspected')}
              tint="#16a34a"
            />
            <TrustItem
              icon={<Award size={14} strokeWidth={2.2} />}
              label={t('trustWarranty')}
              tint="#3b82f6"
            />
            <TrustItem
              icon={<Truck size={14} strokeWidth={2.2} />}
              label={t('trustDelivery')}
              tint={catColor}
            />
          </div>

          {/* ── Social proof / urgency ──────────── */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4 text-[11px] text-foreground/55">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={2.2} className="text-foreground/40" />
              {t('postedAgo', { days: postedDays })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={12} strokeWidth={2.2} className="text-foreground/40" />
              <span className="font-semibold tabular-nums text-foreground/80">
                {listing.viewCount.toLocaleString('en-US')}
              </span>
              {t('views')}
            </span>
          </div>
        </div>
      </motion.div>

      <p className="mx-auto mt-3 flex items-center justify-center gap-1.5 text-center text-[10.5px] text-foreground/45">
        <Wrench size={11} strokeWidth={2.2} />
        {t('reassurance')}
      </p>
    </aside>
  );
};

// ─── Animated price counter ──────────────────────────
const AnimatedPrice = ({ value }: { value: number }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, value, {
      duration: 1.3,
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

// ─── Reusable slider row ─────────────────────────────
const SliderRow = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  extra,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  extra?: string;
  accent: string;
}) => {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
        <label
          htmlFor={id}
          className="font-semibold uppercase tracking-[0.1em] text-foreground/60"
        >
          {label}
        </label>
        <div className="flex items-baseline gap-2">
          {extra && (
            <span className="text-[10px] text-foreground/45 tabular-nums">
              {extra}
            </span>
          )}
          <span className="font-bold tabular-nums text-foreground">
            {value.toFixed(step < 1 ? 2 : 0)}
            {suffix}
          </span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/10 accent-foreground"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} ${pct}%, rgba(127,127,127,0.15) ${pct}%, rgba(127,127,127,0.15) 100%)`,
        }}
      />
    </div>
  );
};

// ─── Stat pill (inside calc) ─────────────────────────
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1.5">
    <p className="text-[9px] uppercase tracking-[0.1em] text-foreground/45">
      {label}
    </p>
    <p className="text-[12px] font-semibold tabular-nums text-foreground">
      {value}
    </p>
  </div>
);

// ─── Panel icon button (Save / Compare / Share) ──────
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
    aria-pressed={active ? true : undefined}
    title={label}
    className="group grid size-8 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.03] text-foreground/65 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
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

// ─── Trust item ──────────────────────────────────────
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

export default RideDetailPurchasePanel;
