'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Hand, Truck, Package } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormMessage } from '@/components/ui/FormMessage';
import { Button } from '@/components/ui/Button';
import { Step6DeliverySchema, type DeliveryOption } from '@/lib/listings/validators';
import { saveDraft } from '@/lib/listings/actions';
import { cn } from '@/lib/utils';

interface DeliveryOptionsFormProps {
  initial: DeliveryOption[];
  /** Category-derived defaults (preselected if current draft is empty). */
  categoryDefaults: DeliveryOption[];
  /** True → skip Step 7, go straight to /sell/preview. */
  skipAuthenticity: boolean;
}

const OPTION_ICONS: Record<DeliveryOption, typeof Hand> = {
  pickup: Hand,
  seller_delivers: Truck,
  buyer_ships: Package,
};

const ALL_OPTIONS: DeliveryOption[] = ['pickup', 'seller_delivers', 'buyer_ships'];

export function DeliveryOptionsForm({
  initial,
  categoryDefaults,
  skipAuthenticity,
}: DeliveryOptionsFormProps) {
  const t = useTranslations('sell.step.delivery');
  const tOption = useTranslations('sell.delivery');
  const tErr = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<DeliveryOption[]>(
    initial.length > 0 ? initial : categoryDefaults
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(opt: DeliveryOption, checked: boolean) {
    setSelected(prev =>
      checked ? Array.from(new Set([...prev, opt])) : prev.filter(x => x !== opt)
    );
    setError(null);
  }

  function continueNext() {
    const parsed = Step6DeliverySchema.safeParse({ delivery_options: selected });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'delivery_required');
      return;
    }
    const nextStep = skipAuthenticity ? 'preview' : 'authenticity';
    startTransition(async () => {
      await saveDraft({
        delivery_options: parsed.data.delivery_options,
        current_step: nextStep,
      });
      router.push(`/sell/${nextStep}`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2">
        {ALL_OPTIONS.map(opt => {
          const Icon = OPTION_ICONS[opt];
          const isChecked = selected.includes(opt);
          return (
            <label
              key={opt}
              htmlFor={`delivery-${opt}`}
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl cursor-pointer select-none',
                'border-[1.5px] transition-all duration-150',
                isChecked
                  ? 'border-warm-amber bg-warm-amber/5'
                  : 'border-ghost-border bg-pure-surface hover:border-warm-amber/40'
              )}
            >
              <Checkbox
                id={`delivery-${opt}`}
                checked={isChecked}
                onCheckedChange={state => toggle(opt, state === true)}
                size="md"
                aria-describedby={`delivery-${opt}-desc`}
              />
              <span className="shrink-0 text-muted-steel mt-0.5">
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-body font-medium text-charcoal-ink">
                  {tOption(`${opt}.label`)}
                </span>
                <span id={`delivery-${opt}-desc`} className="text-body-small text-muted-steel">
                  {tOption(`${opt}.description`)}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {error && <FormMessage tone="error">{tErr(error)}</FormMessage>}

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isPending || selected.length === 0}
          onClick={continueNext}
        >
          <span>{isPending ? t('saving') : t('continue')}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
