import { ShieldCheck, Sparkles, ShieldAlert } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { VerificationTier, VerificationMethod } from '@/lib/properties/types';

/**
 * PropertyVerificationBadge — doctrine pillar P1 + P6.
 *
 * Trust tier badge shown on property cards (hub grid) and detail page
 * header. Three tiers, each with a distinct icon + color + tooltip:
 *
 *   ● dealo_inspected — green,  filled shield icon, "Inspected by team {date}"
 *   ◈ ai_verified    — blue,   sparkles icon,     "AI-verified {date}"
 *   ○ unverified     — gray,   outlined shield,   "Not yet verified"
 *
 * Design: never lie. If verification_tier='unverified', we display
 * that explicitly — absence of a badge would be implicit deceit.
 * Consumers that *don't* want to show the unverified state pass
 * `hideIfUnverified` — e.g., the hub card hides it to reduce clutter,
 * while the detail page always shows it.
 */

type Size = 'sm' | 'md' | 'lg';

interface Props {
  tier: VerificationTier;
  verifiedAt?: string | null;
  verifiedBy?: VerificationMethod | null;
  /** When true and tier === 'unverified', render nothing. */
  hideIfUnverified?: boolean;
  /** Tailwind size preset. Default 'md'. */
  size?: Size;
  /** Show relative date label beside the tier name. Default true on lg. */
  showDate?: boolean;
}

const SIZE_CLASSES: Record<Size, { wrapper: string; icon: number; text: string }> = {
  sm: { wrapper: 'px-1.5 py-0.5 text-[10px] gap-1', icon: 10, text: 'text-[10px]' },
  md: { wrapper: 'px-2 py-0.5 text-xs gap-1', icon: 12, text: 'text-xs' },
  lg: { wrapper: 'px-2.5 py-1 text-sm gap-1.5', icon: 14, text: 'text-sm' },
};

const TIER_CLASSES: Record<VerificationTier, string> = {
  dealo_inspected:
    'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30',
  ai_verified:
    'bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/30',
  unverified: 'bg-foreground/5 text-foreground/60 ring-1 ring-foreground/10',
};

function formatRelativeDate(iso: string, locale: 'ar' | 'en'): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const day = 1000 * 60 * 60 * 24;
  const days = Math.floor(diff / day);
  if (locale === 'ar') {
    if (days < 1) return 'اليوم';
    if (days === 1) return 'أمس';
    if (days < 30) return `قبل ${days} يوم`;
    if (days < 365) return `قبل ${Math.floor(days / 30)} شهر`;
    return `قبل ${Math.floor(days / 365)} سنة`;
  } else {
    if (days < 1) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }
}

export default function PropertyVerificationBadge({
  tier,
  verifiedAt,
  verifiedBy: _verifiedBy,
  hideIfUnverified = false,
  size = 'md',
  showDate,
}: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const locale = useLocale() as 'ar' | 'en';

  if (tier === 'unverified' && hideIfUnverified) return null;

  const Icon =
    tier === 'dealo_inspected'
      ? ShieldCheck
      : tier === 'ai_verified'
      ? Sparkles
      : ShieldAlert;

  const label =
    tier === 'dealo_inspected'
      ? t('tierDealoInspected')
      : tier === 'ai_verified'
      ? t('tierAiVerified')
      : t('tierUnverified');

  const sizeCls = SIZE_CLASSES[size];
  const showDateResolved = showDate ?? size === 'lg';

  return (
    <span
      className={
        'inline-flex items-center rounded-full font-medium ' +
        sizeCls.wrapper +
        ' ' +
        TIER_CLASSES[tier]
      }
      title={
        verifiedAt && tier !== 'unverified'
          ? t('tierVerifiedOnLabel', {
              date: new Date(verifiedAt).toLocaleDateString(
                locale === 'ar' ? 'ar-KW' : 'en-US',
                { numberingSystem: 'latn' },
              ),
            })
          : undefined
      }
    >
      <Icon size={sizeCls.icon} strokeWidth={2.25} />
      <span className={sizeCls.text}>{label}</span>
      {showDateResolved && verifiedAt && tier !== 'unverified' && (
        <span className={'opacity-70 ' + sizeCls.text}>
          · {formatRelativeDate(verifiedAt, locale)}
        </span>
      )}
    </span>
  );
}
