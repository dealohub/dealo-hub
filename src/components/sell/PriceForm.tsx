'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Lock, MessageCircle, Target } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormMessage } from '@/components/ui/form-message';
import { RadioCard } from '@/components/ui/radio-card';
import { Button } from '@/components/ui/button';
import { Step4PriceSchema, type PriceMode } from '@/lib/listings/validators';
import { saveDraft } from '@/lib/listings/actions';

interface PriceFormProps {
  initial: {
    price_minor_units: number | null;
    price_mode: PriceMode | null;
    min_offer_minor_units: number | null;
  };
}

// KWD has 3 decimal places (1 KWD = 1000 fils). Kuwait's price convention is
// usually "KD 150" not "0.150", so we display full KWD values with up to 3 dp.
function toMinor(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 1000);
}
function toMajor(minor: number | null): string {
  if (minor == null) return '';
  const n = minor / 1000;
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

const MODES: { value: PriceMode; icon: typeof Lock }[] = [
  { value: 'fixed', icon: Lock },
  { value: 'negotiable', icon: MessageCircle },
  { value: 'best_offer', icon: Target },
];

export function PriceForm({ initial }: PriceFormProps) {
  const t = useTranslations('sell.step.price');
  const tMode = useTranslations('sell.priceMode');
  const tErr = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [priceStr, setPriceStr] = useState(toMajor(initial.price_minor_units));
  const [mode, setMode] = useState<PriceMode | null>(initial.price_mode ?? 'fixed');
  const [minOfferStr, setMinOfferStr] = useState(toMajor(initial.min_offer_minor_units));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function continueNext() {
    const priceMinor = toMinor(priceStr);
    const minOfferMinor = mode === 'best_offer' ? toMinor(minOfferStr) : null;

    const parsed = Step4PriceSchema.safeParse({
      price_minor_units: priceMinor ?? undefined,
      currency_code: 'KWD',
      price_mode: mode ?? undefined,
      min_offer_minor_units: minOfferMinor,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !(key in errs)) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      await saveDraft({
        price_minor_units: parsed.data.price_minor_units,
        currency_code: 'KWD',
        price_mode: parsed.data.price_mode,
        min_offer_minor_units: parsed.data.min_offer_minor_units ?? null,
        current_step: 'location',
      });
      router.push('/sell/location');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price" required>
          {t('priceLabel')}
        </Label>
        <div className="relative">
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            value={priceStr}
            onChange={e => setPriceStr(e.target.value)}
            placeholder="0"
            dir="ltr"
            className="ps-16 pe-4 h-16 text-display font-mono tabular-nums"
            error={!!fieldErrors.price_minor_units}
            disabled={isPending}
          />
          <span
            className="
              absolute inset-y-0 start-4 flex items-center
              text-body-large font-semibold text-muted-steel
              pointer-events-none select-none
            "
            lang="en"
            aria-hidden="true"
          >
            KWD
          </span>
        </div>
        {fieldErrors.price_minor_units ? (
          <FormMessage tone="error">{tErr(fieldErrors.price_minor_units)}</FormMessage>
        ) : (
          <FormMessage tone="help">{t('priceHint')}</FormMessage>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-body-small font-medium text-charcoal-ink mb-1">
          {t('modeLabel')} <span className="text-muted-steel">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-2">
          {MODES.map(({ value, icon: Icon }) => (
            <RadioCard
              key={value}
              name="price_mode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              icon={<Icon className="size-4" strokeWidth={2} />}
              label={tMode(`${value}.label`)}
              description={tMode(`${value}.description`)}
            />
          ))}
        </div>
        {fieldErrors.price_mode && (
          <FormMessage tone="error">{tErr(fieldErrors.price_mode)}</FormMessage>
        )}
      </fieldset>

      {mode === 'best_offer' && (
        <div className="flex flex-col gap-1.5 animate-fade-in-up">
          <Label htmlFor="min_offer">{t('minOfferLabel')}</Label>
          <div className="relative">
            <Input
              id="min_offer"
              name="min_offer"
              type="text"
              inputMode="decimal"
              value={minOfferStr}
              onChange={e => setMinOfferStr(e.target.value)}
              placeholder="0"
              dir="ltr"
              className="ps-14 font-mono tabular-nums"
              error={!!fieldErrors.min_offer_minor_units}
              disabled={isPending}
            />
            <span
              className="absolute inset-y-0 start-3 flex items-center text-body-small font-semibold text-muted-steel pointer-events-none select-none"
              lang="en"
              aria-hidden="true"
            >
              KWD
            </span>
          </div>
          {fieldErrors.min_offer_minor_units ? (
            <FormMessage tone="error">{tErr(fieldErrors.min_offer_minor_units)}</FormMessage>
          ) : (
            <FormMessage tone="help">{t('minOfferHint')}</FormMessage>
          )}
        </div>
      )}

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isPending}
          onClick={continueNext}
        >
          <span>{isPending ? t('saving') : t('continue')}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
