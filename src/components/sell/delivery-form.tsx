'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2, MapPin, Truck, Package } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import type { DeliveryOption } from '@/lib/listings/validators';

/**
 * DeliveryForm — Step 6 of /sell.
 *
 * Multi-select of 3 options: pickup / seller_delivers / buyer_ships.
 * At least one required (PublishSchema.delivery_options.min(1)).
 */

const OPTIONS: { key: DeliveryOption; icon: typeof MapPin; tKey: string }[] = [
  { key: 'pickup', icon: MapPin, tKey: 'pickup' },
  { key: 'seller_delivers', icon: Truck, tKey: 'seller_delivers' },
  { key: 'buyer_ships', icon: Package, tKey: 'buyer_ships' },
];

interface Props {
  locale: 'ar' | 'en';
  initialOptions: DeliveryOption[];
}

export default function DeliveryForm({ locale, initialOptions }: Props) {
  const t = useTranslations('sell.step.delivery');
  const tDelivery = useTranslations('sell.delivery');
  const tNav = useTranslations('sell.nav');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<DeliveryOption>>(new Set(initialOptions));
  const [error, setError] = useState<string | null>(null);

  const canContinue = selected.size >= 1;

  function toggle(key: DeliveryOption) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleContinue() {
    if (!canContinue) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDraft({
        delivery_options: Array.from(selected),
        current_step: 'preview',
      });
      if (!result.ok) {
        setError(tErrors('generic'));
        return;
      }
      router.push(`/${locale}/sell/preview`);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {OPTIONS.map(({ key, icon: Icon, tKey }) => {
          const isActive = selected.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={
                'flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition ' +
                (isActive
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
              }
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-foreground/50'} />
              <span className="text-sm font-semibold text-foreground">
                {tDelivery(`${tKey}.label` as any)}
              </span>
              <span className="text-[11px] leading-snug text-foreground/60">
                {tDelivery(`${tKey}.desc` as any)}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              {tNav('continue')}
              <ArrowRight size={14} className="rtl:rotate-180" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
