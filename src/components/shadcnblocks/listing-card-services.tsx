import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Shield, Star, MapPin, User } from 'lucide-react';
import type { ServiceCard } from '@/lib/services/types';
import { formatPrice } from '@/lib/format';

/**
 * Phase 8a — listing-card-services.
 *
 * Reusable service listing card for the /services hub (featured strip +
 * main grid) and provider-profile surfaces. Mirrors the pattern of
 * listing-card-electronics + listing-card-properties.
 *
 * Trust signals on the card (doctrine P2 + P5 + P7):
 *   - Verification tier badge (top-right) — 4-level enum, icon+label
 *   - Rating + rating count if ≥1 review, "new" pill otherwise (P5)
 *   - Transparent price strip (P7) — "3 KWD/hr · min 3h" or "25 KWD fixed"
 *   - Provider display name + avatar
 *   - Governorates served (P6 signal so buyer knows reachability)
 *
 * Cards link to /services/[slug]. In Phase 8a the detail page is not
 * yet built, so the link is kept but soft — the hub is the primary
 * visual surface until the detail page lands in a later chunk.
 */

const TIER_LABELS: Record<ServiceCard['verificationTier'], { label: string; icon: typeof BadgeCheck; className: string }> = {
  unverified:       { label: 'جديد',       icon: User,       className: 'bg-foreground/5 text-foreground/60 ring-border/40' },
  identity_verified:{ label: 'هوية موثقة',  icon: BadgeCheck, className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-500/30' },
  address_verified: { label: 'عنوان موثق',  icon: BadgeCheck, className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30' },
  dealo_inspected:  { label: 'محقق من Dealo', icon: Shield,    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/30' },
};

const TASK_LABELS_AR: Record<string, string> = {
  home_cleaning_one_off: 'تنظيف شامل',
  home_cleaning_recurring: 'تنظيف دوري',
  handyman_ikea_assembly: 'تركيب IKEA',
  handyman_tv_mount: 'تعليق تلفزيون',
  handyman_shelf_hang: 'تعليق رفوف',
  handyman_furniture_move: 'نقل أثاث داخلي',
  handyman_basic_painting: 'صباغة',
  handyman_other: 'أعمال منزلية',
};

const GOV_LABELS_AR: Record<string, string> = {
  capital: 'العاصمة',
  hawalli: 'حولي',
  farwaniya: 'الفروانية',
  mubarak_al_kabeer: 'مبارك الكبير',
  ahmadi: 'الأحمدي',
  jahra: 'الجهراء',
};

interface Props {
  card: ServiceCard;
  locale: 'ar' | 'en';
}

export default function ListingCardServices({ card, locale }: Props) {
  const t = useTranslations('servicesHub.card');
  const tier = TIER_LABELS[card.verificationTier];
  const TierIcon = tier.icon;

  // P7 — transparent price rendering
  const priceLine = (() => {
    if (card.priceMode === 'hourly' && card.hourlyRateMinorUnits != null) {
      return `${formatPrice(card.hourlyRateMinorUnits, card.currencyCode, locale)}/${t('hour')}`;
    }
    if (card.priceMode === 'fixed' && card.fixedPriceMinorUnits != null) {
      return `${formatPrice(card.fixedPriceMinorUnits, card.currencyCode, locale)} ${t('fixed')}`;
    }
    if (card.priceMode === 'hybrid' && card.hourlyRateMinorUnits != null) {
      return `${formatPrice(card.hourlyRateMinorUnits, card.currencyCode, locale)}/${t('hour')} · ${t('fromPrice')}`;
    }
    return t('priceOnRequest');
  })();

  const taskLabel =
    locale === 'ar'
      ? TASK_LABELS_AR[card.taskType] ?? card.taskType
      : card.taskType.replace(/_/g, ' ');

  const govsLabel = card.servedGovernorates
    .slice(0, 3)
    .map((g) => (locale === 'ar' ? GOV_LABELS_AR[g] ?? g : g.replace(/_/g, ' ')))
    .join(' · ');

  const ratingLabel =
    card.ratingAvg != null && card.ratingCount > 0
      ? `${card.ratingAvg.toFixed(1)} · ${card.ratingCount} ${t('reviews')}`
      : t('newProvider');

  return (
    <Link
      href={`/${locale}/services/${card.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40 hover:shadow-sm"
    >
      {/* Top bar: task type + verification tier */}
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <span className="inline-flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
          {taskLabel}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${tier.className}`}
        >
          <TierIcon size={10} />
          {tier.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="line-clamp-2 px-4 text-[15px] font-semibold leading-snug text-foreground transition group-hover:text-primary">
        {card.title}
      </h3>

      {/* Provider + rating strip */}
      <div className="mt-3 flex items-center gap-2 px-4">
        {card.providerAvatarUrl ? (
          <img
            src={card.providerAvatarUrl}
            alt={card.providerDisplayName}
            className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border/60"
          />
        ) : (
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground/10 text-[11px] font-semibold text-foreground/60 ring-1 ring-border/60">
            {card.providerDisplayName[0] ?? '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-foreground/80">
            {card.providerDisplayName}
          </div>
          <div className="flex items-center gap-1 text-[10.5px] text-foreground/55">
            <Star
              size={10}
              className={
                card.ratingAvg != null
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-foreground/30'
              }
            />
            {ratingLabel}
          </div>
        </div>
      </div>

      {/* Governorates served */}
      <div className="mt-2 flex items-center gap-1 px-4 text-[11px] text-foreground/60">
        <MapPin size={11} className="shrink-0" />
        <span className="truncate">{govsLabel}</span>
      </div>

      {/* Completed bookings badge */}
      {card.completedBookings > 0 && (
        <div className="mt-1 px-4 text-[11px] text-emerald-700 dark:text-emerald-400">
          {card.completedBookings} {t('completed')}
        </div>
      )}

      {/* Price strip */}
      <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-border/50 px-4 py-3">
        <span className="text-[15px] font-bold text-foreground">{priceLine}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">
          {t('viewDetails')}
        </span>
      </div>
    </Link>
  );
}
