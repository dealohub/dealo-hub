'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormMessage } from '@/components/ui/form-message';
import { RadioCard } from '@/components/ui/radio-card';
import { Button } from '@/components/ui/button';
import {
  Step3DetailsSchema,
  Step3DetailsLuxurySchema,
  containsPhoneNumber,
  containsCounterfeitTerm,
  type Condition,
} from '@/lib/listings/validators';
import { saveDraft } from '@/lib/listings/actions';
import { cn } from '@/lib/utils';

interface DetailsFormProps {
  initial: {
    title: string;
    description: string;
    condition: Condition | null;
    brand: string | null;
    model: string | null;
  };
  isLuxury: boolean;
}

const CONDITIONS: Condition[] = [
  'new',
  'new_with_tags',
  'like_new',
  'excellent_used',
  'good_used',
  'fair_used',
];

export function DetailsForm({ initial, isLuxury }: DetailsFormProps) {
  const t = useTranslations('sell.step.details');
  const tCond = useTranslations('sell.condition');
  const tErr = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [condition, setCondition] = useState<Condition | null>(initial.condition ?? null);
  const [brand, setBrand] = useState(initial.brand ?? '');
  const [model, setModel] = useState(initial.model ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Live hints (inline warnings before submit — full validation on continue).
  const titlePhoneWarn = title.length > 0 && containsPhoneNumber(title);
  const descPhoneWarn = description.length > 0 && containsPhoneNumber(description);
  const luxuryTextWarn =
    isLuxury &&
    containsCounterfeitTerm(`${title} ${description} ${brand}`);

  function continueNext() {
    const schema = isLuxury ? Step3DetailsLuxurySchema : Step3DetailsSchema;
    const parsed = schema.safeParse({
      title: title.trim(),
      description: description.trim(),
      condition,
      brand: brand.trim() || null,
      model: model.trim() || null,
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
        title: parsed.data.title,
        description: parsed.data.description,
        condition: parsed.data.condition,
        brand: parsed.data.brand,
        model: parsed.data.model,
        current_step: 'price',
      });
      router.push('/sell/price');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="title" required>
            {t('titleLabel')}
          </Label>
          <span
            className={cn(
              'text-caption tabular-nums',
              title.length > 96 ? 'text-warm-amber-700' : 'text-muted-steel'
            )}
            lang="en"
          >
            {title.length}/120
          </span>
        </div>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          placeholder={t('titlePlaceholder')}
          error={!!fieldErrors.title || titlePhoneWarn}
          disabled={isPending}
        />
        {fieldErrors.title ? (
          <FormMessage tone="error">{tErr(fieldErrors.title)}</FormMessage>
        ) : titlePhoneWarn ? (
          <FormMessage tone="error">{tErr('phone_not_allowed_in_text')}</FormMessage>
        ) : (
          <FormMessage tone="help">{t('titleHint')}</FormMessage>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" required>
            {t('descriptionLabel')}
          </Label>
          <span
            className={cn(
              'text-caption tabular-nums',
              description.length > 4000 ? 'text-warm-amber-700' : 'text-muted-steel'
            )}
            lang="en"
          >
            {description.length}/5000
          </span>
        </div>
        <Textarea
          id="description"
          name="description"
          rows={5}
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={5000}
          placeholder={t('descriptionPlaceholder')}
          error={!!fieldErrors.description || descPhoneWarn || luxuryTextWarn}
          disabled={isPending}
        />
        {fieldErrors.description ? (
          <FormMessage tone="error">{tErr(fieldErrors.description)}</FormMessage>
        ) : descPhoneWarn ? (
          <FormMessage tone="error">{tErr('phone_not_allowed_in_text')}</FormMessage>
        ) : luxuryTextWarn ? (
          <FormMessage tone="error">{tErr('counterfeit_term_not_allowed')}</FormMessage>
        ) : (
          <FormMessage tone="help">{t('descriptionHint')}</FormMessage>
        )}
      </div>

      {/* Condition */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-body-small font-medium text-charcoal-ink mb-1">
          {t('conditionLabel')} <span className="text-muted-steel">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONDITIONS.map(c => (
            <RadioCard
              key={c}
              name="condition"
              value={c}
              checked={condition === c}
              onChange={() => setCondition(c)}
              label={tCond(`${c}.label`)}
              description={tCond(`${c}.description`)}
            />
          ))}
        </div>
        {fieldErrors.condition && (
          <FormMessage tone="error">{tErr('condition_required')}</FormMessage>
        )}
      </fieldset>

      {/* Brand + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">{t('brandLabel')}</Label>
          <Input
            id="brand"
            name="brand"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            maxLength={100}
            placeholder={t('brandPlaceholder')}
            disabled={isPending}
          />
          <FormMessage tone="help">{t('brandHint')}</FormMessage>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">{t('modelLabel')}</Label>
          <Input
            id="model"
            name="model"
            value={model}
            onChange={e => setModel(e.target.value)}
            maxLength={100}
            placeholder={t('modelPlaceholder')}
            disabled={isPending}
          />
        </div>
      </div>

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
