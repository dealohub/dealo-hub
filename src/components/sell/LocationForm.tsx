'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, MapPin } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { FormMessage } from '@/components/ui/FormMessage';
import { Step5LocationSchema } from '@/lib/listings/validators';
import { fetchAreasForCity, saveDraft } from '@/lib/listings/actions';
import { cn } from '@/lib/utils';

interface CityOption {
  id: number;
  name_ar: string;
  name_en: string;
}
interface AreaOption {
  id: number;
  name_ar: string;
  name_en: string;
}

interface LocationFormProps {
  cities: CityOption[];
  initial: { city_id: number | null; area_id: number | null };
}

/**
 * Location picker — city → area cascade.
 * Kuwait only for V1; country locked.
 */
export function LocationForm({ cities, initial }: LocationFormProps) {
  const t = useTranslations('sell.step.location');
  const tErr = useTranslations('sell.errors');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [cityId, setCityId] = useState<number | null>(initial.city_id);
  const [areaId, setAreaId] = useState<number | null>(initial.area_id);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load areas whenever city changes. Initial city also loads its areas.
  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    setLoadingAreas(true);
    fetchAreasForCity(cityId)
      .then(setAreas)
      .finally(() => setLoadingAreas(false));
  }, [cityId]);

  const labelFor = (o: { name_ar: string; name_en: string }) =>
    locale === 'ar' ? o.name_ar : o.name_en;

  function continueNext() {
    const parsed = Step5LocationSchema.safeParse({
      country_code: 'KW',
      city_id: cityId ?? undefined,
      area_id: areaId ?? null,
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
        country_code: 'KW',
        city_id: parsed.data.city_id,
        area_id: parsed.data.area_id ?? null,
        current_step: 'delivery',
      });
      router.push('/sell/delivery');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-pure-surface border border-whisper-divider">
        <span className="inline-flex items-center justify-center size-9 rounded-lg bg-warm-amber/10 text-warm-amber-700 shrink-0">
          <MapPin className="size-4" />
        </span>
        <div className="flex-1 flex flex-col gap-0.5">
          <p className="text-body font-medium text-charcoal-ink">{t('countryLabel')}</p>
          <p className="text-body-small text-muted-steel">{t('countryFixedKW')}</p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <Label htmlFor="city_select" required>
          {t('cityLabel')}
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cities.map(c => {
            const selected = cityId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCityId(c.id);
                  setAreaId(null);
                }}
                aria-pressed={selected}
                className={cn(
                  'h-11 px-3 rounded-xl text-body-small font-medium',
                  'border-[1.5px] transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
                  selected
                    ? 'bg-warm-amber/10 border-warm-amber text-charcoal-ink'
                    : 'bg-pure-surface border-ghost-border text-charcoal-ink hover:border-warm-amber/50'
                )}
              >
                {labelFor(c)}
              </button>
            );
          })}
        </div>
        {fieldErrors.city_id && (
          <FormMessage tone="error">{tErr(fieldErrors.city_id)}</FormMessage>
        )}
      </fieldset>

      {cityId && (
        <fieldset className="flex flex-col gap-2 animate-fade-in-up">
          <Label htmlFor="area_select">{t('areaLabel')}</Label>
          {loadingAreas ? (
            <p className="text-body-small text-muted-steel">{t('loadingAreas')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {areas.map(a => {
                const selected = areaId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAreaId(selected ? null : a.id)}
                    aria-pressed={selected}
                    className={cn(
                      'h-9 px-3 rounded-full text-body-small',
                      'border-[1.5px] transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
                      selected
                        ? 'bg-warm-amber text-white border-warm-amber'
                        : 'bg-pure-surface border-ghost-border hover:border-warm-amber/50'
                    )}
                  >
                    {labelFor(a)}
                  </button>
                );
              })}
            </div>
          )}
          <FormMessage tone="help">{t('areaHint')}</FormMessage>
        </fieldset>
      )}

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isPending || !cityId}
          onClick={continueNext}
        >
          <span>{isPending ? t('saving') : t('continue')}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
