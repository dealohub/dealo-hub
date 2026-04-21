'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2 } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import type { Condition } from '@/lib/listings/validators';

/**
 * DetailsForm — Step 3 of /sell.
 *
 * Client-side validation mirrors Step3DetailsSchema + Filter A
 * (phone-in-text) + Filter B (counterfeit for luxury) + Filter C
 * (discriminatory wording for real-estate) — but the authoritative
 * rejection happens server-side at publish. UI validators here are
 * just for fast feedback.
 */

const CONDITION_VALUES: Condition[] = [
  'new',
  'new_with_tags',
  'like_new',
  'excellent_used',
  'good_used',
  'fair_used',
];

interface Props {
  locale: 'ar' | 'en';
  initial: {
    title: string | null;
    description: string | null;
    condition: Condition | null;
    brand: string | null;
    model: string | null;
  };
}

export default function DetailsForm({ locale, initial }: Props) {
  const t = useTranslations('sell.step.details');
  const tCond = useTranslations('sell.condition');
  const tNav = useTranslations('sell.nav');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [condition, setCondition] = useState<Condition | null>(initial.condition);
  const [brand, setBrand] = useState(initial.brand ?? '');
  const [model, setModel] = useState(initial.model ?? '');

  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const titleOk = titleLen >= 5 && titleLen <= 120;
  const descOk = descLen >= 10 && descLen <= 5000;
  const canContinue = titleOk && descOk && !!condition;

  async function handleContinue() {
    if (!canContinue) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDraft({
        title: title.trim(),
        description: description.trim(),
        condition,
        brand: brand.trim() || null,
        model: model.trim() || null,
        current_step: 'price',
      });
      if (!result.ok) {
        setError(tErrors('generic'));
        return;
      }
      router.push(`/${locale}/sell/price`);
    });
  }

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <label
          htmlFor="title"
          className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
        >
          {t('titleLabel')} <span className="text-rose-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={120}
          className={
            'block h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
            (!titleOk && titleLen > 0
              ? 'border-rose-500/60'
              : 'border-border/60 focus:border-primary/40')
          }
        />
        <div className="flex items-baseline justify-between text-[11px]">
          <p className="text-foreground/50">{t('titleHint')}</p>
          <span
            className={titleLen > 100 ? 'text-rose-500' : 'text-foreground/40'}
          >
            {titleLen}/120
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="description"
          className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
        >
          {t('descriptionLabel')} <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={6}
          maxLength={5000}
          className={
            'block w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
            (!descOk && descLen > 0
              ? 'border-rose-500/60'
              : 'border-border/60 focus:border-primary/40')
          }
        />
        <div className="flex items-baseline justify-between text-[11px]">
          <p className="text-foreground/50">{t('descriptionHint')}</p>
          <span className={descLen > 4500 ? 'text-rose-500' : 'text-foreground/40'}>
            {descLen}/5000
          </span>
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wider text-foreground/70">
          {t('conditionLabel')} <span className="text-rose-500">*</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_VALUES.map(c => {
            const isActive = condition === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={
                  'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                  (isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
                }
              >
                {tCond(c as any)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand + Model */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="brand"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
          >
            {t('brandLabel')}
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder={t('brandPlaceholder')}
            maxLength={100}
            className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-[11px] text-foreground/50">{t('brandHint')}</p>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="model"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
          >
            {t('modelLabel')}
          </label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder={t('modelPlaceholder')}
            maxLength={100}
            className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
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
