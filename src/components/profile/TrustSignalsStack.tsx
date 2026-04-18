import { Trophy, ShieldCheck, PhoneCall, Star, CalendarCheck2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

/**
 * TrustSignalsStack — reusable trust-badge row.
 *
 * Priority order per DESIGN.md Section 14:
 *   1. 🏆 Founding Partner
 *   2. ✓ ID Verified (V2)
 *   3. ✓ Phone Verified
 *   4. ⭐ Rating ≥ 4.5 with ≥ 3 reviews
 *   5. 📅 Member > 180 days
 *
 * `compact` caps at 3 badges (ListingCard use-case). Full mode shows up to 5.
 *
 * Server component — uses `getTranslations` so it works on RSC profile page +
 * can be passed into client-only listing cards later via props if needed.
 */

const SIX_MONTH_MS = 180 * 24 * 60 * 60 * 1000;

export interface TrustSignalInput {
  is_founding_partner: boolean;
  id_verified_at: string | null;
  phone_verified_at: string | null;
  rating_avg: number | null;
  rating_count: number;
  created_at: string;
}

interface TrustSignalsStackProps {
  signals: TrustSignalInput;
  compact?: boolean;
  className?: string;
}

export async function TrustSignalsStack({
  signals,
  compact = false,
  className,
}: TrustSignalsStackProps) {
  const t = await getTranslations('profile.trust');
  const items = resolveSignals(signals, t);
  const maxVisible = compact ? 3 : 5;
  const visible = items.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5',
        compact && 'gap-1',
        className
      )}
    >
      {visible.map(item => (
        <span
          key={item.key}
          className={cn(
            'inline-flex items-center gap-1',
            'px-2 py-0.5 rounded-md',
            'text-label font-semibold uppercase tracking-wide',
            item.className
          )}
        >
          <item.icon className="size-3" strokeWidth={2.25} aria-hidden="true" />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

type ResolvedSignal = {
  key: string;
  label: string;
  icon: typeof Trophy;
  className: string;
};

function resolveSignals(
  s: TrustSignalInput,
  t: (key: string, values?: Record<string, string | number>) => string
): ResolvedSignal[] {
  const out: ResolvedSignal[] = [];
  const now = Date.now();
  const memberMs = now - new Date(s.created_at).getTime();

  if (s.is_founding_partner) {
    out.push({
      key: 'founding',
      label: t('foundingPartner'),
      icon: Trophy,
      className: 'text-warm-amber-700 bg-warm-amber/10',
    });
  }

  if (s.id_verified_at) {
    out.push({
      key: 'id',
      label: t('idVerified'),
      icon: ShieldCheck,
      className: 'text-success-sage bg-success-sage/10',
    });
  }

  if (s.phone_verified_at) {
    out.push({
      key: 'phone',
      label: t('phoneVerified'),
      icon: PhoneCall,
      className: 'text-success-sage bg-success-sage/10',
    });
  }

  if (
    typeof s.rating_avg === 'number' &&
    s.rating_avg >= 4.5 &&
    s.rating_count >= 3
  ) {
    out.push({
      key: 'rating',
      label: t('ratingBadge', {
        avg: s.rating_avg.toFixed(1),
        count: s.rating_count,
      }),
      icon: Star,
      className: 'text-caution-flax bg-caution-flax/10',
    });
  }

  if (memberMs > SIX_MONTH_MS) {
    out.push({
      key: 'tenure',
      label: t('memberSince'),
      icon: CalendarCheck2,
      className: 'text-charcoal-ink bg-zinc-100',
    });
  }

  return out;
}
