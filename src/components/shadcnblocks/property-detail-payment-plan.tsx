import { useTranslations } from 'next-intl';
import { Coins, CalendarClock } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';

/**
 * Property detail — off-plan payment plan (Doctrine P13).
 *
 * Renders only when `completion_status='off_plan'` AND a payment_plan
 * is set. Common GCC off-plan structure: 20% down + 30% at handover +
 * 50% post-handover over N months. The schema matches Property Finder
 * UAE convention (validated by Agent 3 research).
 *
 * Also shows the `handover_expected_quarter` prominently so the buyer
 * knows the timeline. Dubizzle KW has no such field; it's buried in
 * free-text if present at all.
 */

interface Props {
  listing: PropertyDetail;
}

export default function PropertyDetailPaymentPlan({ listing }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;

  if (f.completionStatus !== 'off_plan' || !f.paymentPlan) return null;
  const pp = f.paymentPlan;

  return (
    <section className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Coins size={18} className="text-indigo-500" strokeWidth={2.25} />
        <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">
          {t('paymentPlanTitle')}
        </h2>
        {f.handoverExpectedQuarter && (
          <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <CalendarClock size={12} />
            {t('handoverLabel', { quarter: f.handoverExpectedQuarter })}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <Stage
          index={1}
          label={t('paymentDownPayment', { pct: pp.downPaymentPct })}
          pct={pp.downPaymentPct}
        />
        <Stage
          index={2}
          label={t('paymentHandover', { pct: pp.handoverPct })}
          pct={pp.handoverPct}
        />
        {pp.postHandoverPct != null && pp.postHandoverMonths != null && (
          <Stage
            index={3}
            label={t('paymentPostHandover', {
              pct: pp.postHandoverPct,
              months: pp.postHandoverMonths,
            })}
            pct={pp.postHandoverPct}
          />
        )}
      </div>

      {/* Combined-total sanity meter */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
          style={{
            width: `${Math.min(
              100,
              pp.downPaymentPct +
                pp.handoverPct +
                (pp.postHandoverPct ?? 0),
            )}%`,
          }}
        />
      </div>
    </section>
  );
}

function Stage({ index, label, pct }: { index: number; label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
        {index}
      </span>
      <span className="flex-1 text-sm text-foreground/80">{label}</span>
      <span className="text-sm font-semibold text-foreground">{pct}%</span>
    </div>
  );
}
