'use client';

import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import {
  ShieldCheck,
  Award,
  MessageCircle,
  Sparkles,
  Info,
  Heart,
  ArrowLeftRight,
  Share2,
  CircleDot,
  Clock,
  Star,
  ExternalLink,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ServiceDetail } from '@/lib/services/types';
import { fromMinorUnits } from '@/lib/format';
import ContactSellerButton from '@/components/chat/contact-seller-button';

interface Props {
  listing: ServiceDetail;
  locale: 'ar' | 'en';
}

const TASK_COLOR: Record<string, string> = {
  home_cleaning_one_off:   '#0ea5e9',
  home_cleaning_recurring: '#0ea5e9',
  handyman_ikea_assembly:  '#f59e0b',
  handyman_tv_mount:       '#3b82f6',
  handyman_shelf_hang:     '#84cc16',
  handyman_furniture_move: '#f97316',
  handyman_basic_painting: '#ec4899',
  handyman_other:          '#78716c',
};

const daysBetween = (iso: string | null): number => {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
};

export default function ServiceDetailPurchasePanel({ listing, locale }: Props) {
  const t = useTranslations('servicesDetail.purchase');
  const f = listing.fields;
  const p = listing.provider;

  const catColor = TASK_COLOR[f.task_type] ?? '#64748b';
  const isVerified = p.verificationTier !== 'unverified';
  const isInspected = p.verificationTier === 'dealo_inspected';
  const accentColor = isInspected ? '#f59e0b' : isVerified ? catColor : '#64748b';

  const verdictLabel = isInspected
    ? t('verdictInspected')
    : isVerified
      ? t('verdictVerified')
      : t('verdictNew');

  const VerdictIcon = isInspected || isVerified ? Sparkles : Info;

  const hourlyLine =
    f.hourly_rate_minor_units != null
      ? fromMinorUnits(f.hourly_rate_minor_units, 'KWD')
      : null;
  const fixedLine =
    f.fixed_price_minor_units != null
      ? fromMinorUnits(f.fixed_price_minor_units, 'KWD')
      : null;
  const providerName = p.displayName;
  const providerInitials = providerName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');
  const postedDays = daysBetween(listing.publishedAt);

  const [saved, setSaved] = useState(false);

  return (
    <aside className="relative self-start lg:sticky lg:top-6">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[28px] opacity-60 blur-2xl"
        style={{
          background: `radial-gradient(300px 200px at 30% 0%, ${accentColor}22, transparent 70%), radial-gradient(260px 180px at 70% 100%, ${catColor}1a, transparent 70%)`,
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
            <div className="text-[10px] uppercase tracking-wider text-foreground/50">
              {t('priceLabel')}
            </div>

            {f.price_mode === 'hourly' && hourlyLine != null && (
              <div className="mt-1 flex items-baseline gap-2">
                <AnimatedPrice value={hourlyLine} />
                <span className="text-[14px] font-medium text-foreground/55">
                  KWD / {t('hour')}
                </span>
              </div>
            )}

            {f.price_mode === 'fixed' && fixedLine != null && (
              <div className="mt-1 flex items-baseline gap-2">
                <AnimatedPrice value={fixedLine} />
                <span className="text-[14px] font-medium text-foreground/55">
                  KWD {t('fixedPrice')}
                </span>
              </div>
            )}

            {f.price_mode === 'hybrid' && (
              <div className="mt-1 space-y-2">
                {hourlyLine != null && (
                  <div className="flex items-baseline gap-2">
                    <AnimatedPrice value={hourlyLine} />
                    <span className="text-[13px] font-medium text-foreground/55">
                      KWD / {t('hour')}
                      {f.min_hours && (
                        <span className="ms-1 text-[11px] text-foreground/45">
                          · min {f.min_hours}h
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="h-px bg-foreground/10" />
                {fixedLine != null && (
                  <div className="flex items-baseline gap-2">
                    <AnimatedPrice value={fixedLine} />
                    <span className="text-[13px] font-medium text-foreground/55">
                      KWD {t('fixedAlt')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {f.min_hours != null && f.price_mode !== 'hybrid' && (
              <p className="mt-1 text-[11px] text-foreground/55">
                {t('minHours', { hours: f.min_hours })}
              </p>
            )}
          </div>

          {/* Primary CTA */}
          <div className="space-y-2">
            <ContactSellerButton
              listingId={listing.id}
              locale={locale}
              variant="primary"
              labelOverride={t('contactCta')}
            />

            {/* Quote request stub */}
            <div className="rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] p-3 text-center">
              <Sparkles size={13} className="mx-auto mb-1 text-foreground/40" />
              <p className="text-[11px] font-semibold text-foreground">
                {t('quoteFlowTitle')}
              </p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-foreground/55">
                {t('quoteFlowBody')}
              </p>
            </div>
          </div>

          {/* Provider card */}
          <div className="mt-5 rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.04] to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={providerName}
                    className="size-11 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-[12px] font-extrabold"
                    style={{ background: `${catColor}18`, color: catColor }}
                  >
                    {providerInitials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -end-0.5 flex size-3 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                  <span className="absolute size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {providerName}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground/55">
                  {p.ratingAvg != null && p.ratingCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star size={10} fill="#F59E0B" stroke="#F59E0B" />
                      <span className="tabular-nums font-semibold text-foreground/80">
                        {p.ratingAvg.toFixed(1)}
                      </span>
                      <span className="text-foreground/40">({p.ratingCount})</span>
                    </span>
                  ) : (
                    <span>{t('newProvider')}</span>
                  )}
                  {p.completedBookings > 0 && (
                    <>
                      <span className="text-foreground/25">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓ {p.completedBookings} jobs
                      </span>
                    </>
                  )}
                </div>
              </div>

              {p.handle && (
                <a
                  href={`/${locale}/profile/${p.handle}`}
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.03] text-foreground/60 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:text-foreground"
                  aria-label="View profile"
                >
                  <ExternalLink size={12} className="rtl:rotate-180" />
                </a>
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
              label={t('guaranteeTitle').split(' ').slice(0, 2).join(' ')}
              tint="#16a34a"
            />
            <TrustItem
              icon={<MessageCircle size={14} strokeWidth={2.2} />}
              label={t('trustChatOnly')}
              tint="#3b82f6"
            />
            <TrustItem
              icon={<Award size={14} strokeWidth={2.2} />}
              label={t('trustIdChecked')}
              tint={catColor}
            />
          </div>

          {/* Dealo Guarantee */}
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck
                size={14}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
              />
              <div>
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {t('guaranteeTitle')}
                </div>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-foreground/65">
                  {t('guaranteeBody')}
                </p>
              </div>
            </div>
          </div>

          {/* Chat-only note */}
          <div className="mt-3 flex items-start gap-2 text-[10.5px] leading-relaxed text-foreground/50">
            <Info size={11} className="mt-0.5 shrink-0" />
            <p>{t('chatOnlyNote')}</p>
          </div>

          {/* Social proof */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-foreground/10 pt-4 text-[11px] text-foreground/55">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={2.2} className="text-foreground/40" />
              {postedDays === 0 ? t('postedToday') : t('postedDaysAgo', { days: postedDays })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wrench size={12} strokeWidth={2.2} className="text-foreground/40" />
              <span className="font-semibold tabular-nums text-foreground/80">
                {p.completedBookings}
              </span>
              {t('jobsDone')}
            </span>
          </div>
        </div>
      </motion.div>
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
