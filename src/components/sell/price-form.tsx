'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2, Lock, MessageCircle, Target } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import type { PriceMode } from '@/lib/listings/validators';

/**
 * PriceForm — Step 4 of /sell.
 *
 * Three modes (DECISIONS #3):
 *   - fixed     → "Price firm, contact to buy"
 *   - negotiable→ "Price open, chat to haggle"
 *   - best_offer→ "Submit your best offer, min X"
 *
 * KWD stored as minor units (× 1000). The input accepts whole KWD +
 * optional 3-decimal fils; the conversion is explicit, not hidden.
 */

const MODES: { key: PriceMode; icon: typeof Lock; tKey: string }[] = [
  { key: 'fixed', icon: Lock, tKey: 'fixed' },
  { key: 'negotiable', icon: MessageCircle, tKey: 'negotiable' },
  { key: 'best_offer', icon: Target, tKey: 'best_offer' },
];

interface Props {
  locale: 'ar' | 'en';
  initial: {
    price_minor_units: number | null;
    price_mode: PriceMode | null;
    min_offer_minor_units: number | null;
  };
}

function parsePriceInput(raw: string): number | null {
  // Accept "1,234", "1234", "1234.500", "1234.5" — convert to minor units (× 1000 for KWD)
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000);
}

function formatPriceForInput(minor: number | null): string {
  if (minor == null) return '';
  return String(minor / 1000);
}

export default function PriceForm({ locale, initial }: Props) {
  const t = useTranslations('sell.step.price');
  const tMode = useTranslations('sell.priceMode');
  const tNav = useTranslations('sell.nav');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [priceStr, setPriceStr] = useState(formatPriceForInput(initial.price_minor_units));
  const [minOfferStr, setMinOfferStr] = useState(formatPriceForInput(initial.min_offer_minor_units));
  const [mode, setMode] = useState<PriceMode | null>(initial.price_mode);

  const priceMinor = parsePriceInput(priceStr);
  const minOfferMinor = mode === 'best_offer' ? parsePriceInput(minOfferStr) : null;

  const priceOk = priceMinor != null && priceMinor > 0;
  const minOfferOk =
    mode !== 'best_offer' ||
    minOfferStr === '' ||
    (minOfferMinor != null && priceMinor != null && minOfferMinor <= priceMinor);
  const canContinue = priceOk && !!mode && minOfferOk;

  async function handleContinue() {
    if (!canContinue) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDraft({
        price_minor_units: priceMinor,
        currency_code: 'KWD',
        price_mode: mode,
        min_offer_minor_units:
          mode === 'best_offer' && minOfferMinor != null ? minOfferMinor : null,
        current_step: 'location',
      });
      if (!result.ok) {
        setError(tErrors('generic'));
        return;
      }
      router.push(`/${locale}/sell/location`);
    });
  }

  return (
    <div className="space-y-5">
      {/* Price input */}
      <div className="space-y-1.5">
        <label
          htmlFor="price"
          className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
        >
          {t('priceLabel')} <span className="text-rose-500">*</span>
        </label>
        <div className="relative flex h-12 items-center rounded-lg border border-border/60 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/40">
          <span className="absolute start-3 text-xs font-semibold text-foreground/50">
            KWD
          </span>
          <input
            id="price"
            type="text"
            inputMode="decimal"
            value={priceStr}
            onChange={e => setPriceStr(e.target.value)}
            placeholder="0"
            className="h-full w-full bg-transparent ps-14 pe-3 text-lg font-semibold text-foreground outline-none placeholder:text-foreground/30"
          />
        </div>
        <p className="text-[11px] text-foreground/50">{t('priceHint')}</p>
      </div>

      {/* Mode selector */}
      <div className="space-y-2">
        <span className="block text-xs font-medium uppercase tracking-wider text-foreground/70">
          {t('modeLabel')} <span className="text-rose-500">*</span>
        </span>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map(({ key, icon: Icon, tKey }) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={
                  'flex flex-col items-start gap-2 rounded-xl border p-3.5 text-start transition ' +
                  (isActive
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
                }
              >
                <Icon size={18} className={isActive ? 'text-primary' : 'text-foreground/50'} />
                <span className="text-sm font-semibold text-foreground">
                  {tMode(`${tKey}.label` as any)}
                </span>
                <span className="text-[11px] leading-snug text-foreground/60">
                  {tMode(`${tKey}.desc` as any)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Min offer — only for best_offer */}
      {mode === 'best_offer' && (
        <div className="space-y-1.5 rounded-xl bg-foreground/[0.02] p-4">
          <label
            htmlFor="min-offer"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
          >
            {t('minOfferLabel')}
          </label>
          <div className="relative flex h-11 items-center rounded-lg border border-border/60 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/40">
            <span className="absolute start-3 text-xs font-semibold text-foreground/50">
              KWD
            </span>
            <input
              id="min-offer"
              type="text"
              inputMode="decimal"
              value={minOfferStr}
              onChange={e => setMinOfferStr(e.target.value)}
              placeholder="0"
              className="h-full w-full bg-transparent ps-14 pe-3 text-sm text-foreground outline-none placeholder:text-foreground/30"
            />
          </div>
          <p className="text-[11px] text-foreground/50">{t('minOfferHint')}</p>
          {!minOfferOk && (
            <p className="text-[11px] text-rose-500">
              {tErrors('min_offer_must_be_less_than_price' as any, {
                default: 'Min offer must be ≤ price',
              })}
            </p>
          )}
        </div>
      )}

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
