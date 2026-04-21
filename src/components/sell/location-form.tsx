'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2 } from 'lucide-react';
import { saveDraft, fetchAreasForCity } from '@/lib/listings/actions';

/**
 * LocationForm — Step 5 of /sell.
 *
 * Country locked to KW (V1 — DECISIONS locks Kuwait-first).
 * Governorate required (city_id). Area optional; loads on city pick.
 */

interface City {
  id: number;
  name: string;
}

interface Props {
  locale: 'ar' | 'en';
  cities: City[];
  initialCityId: number | null;
  initialAreaId: number | null;
}

export default function LocationForm({
  locale,
  cities,
  initialCityId,
  initialAreaId,
}: Props) {
  const t = useTranslations('sell.step.location');
  const tNav = useTranslations('sell.nav');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [cityId, setCityId] = useState<number | null>(initialCityId);
  const [areaId, setAreaId] = useState<number | null>(initialAreaId);
  const [areas, setAreas] = useState<{ id: number; name: string }[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      return;
    }
    let cancelled = false;
    setLoadingAreas(true);
    fetchAreasForCity(cityId).then(rows => {
      if (cancelled) return;
      setAreas(
        rows.map(r => ({
          id: r.id,
          name: locale === 'ar' ? r.name_ar : r.name_en,
        })),
      );
      setLoadingAreas(false);
    });
    return () => {
      cancelled = true;
    };
  }, [cityId, locale]);

  const canContinue = !!cityId;

  async function handleContinue() {
    if (!canContinue) return;
    setError(null);
    startTransition(async () => {
      const result = await saveDraft({
        country_code: 'KW',
        city_id: cityId,
        area_id: areaId,
        current_step: 'delivery',
      });
      if (!result.ok) {
        setError(tErrors('generic'));
        return;
      }
      router.push(`/${locale}/sell/delivery`);
    });
  }

  return (
    <div className="space-y-5">
      {/* Country */}
      <div className="space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wider text-foreground/70">
          {t('countryLabel')}
        </span>
        <div className="rounded-lg bg-foreground/5 px-3 py-2.5 text-sm text-foreground/70">
          🇰🇼 {t('countryFixedKW')}
        </div>
      </div>

      {/* City (governorate) */}
      <div className="space-y-1.5">
        <label
          htmlFor="city"
          className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
        >
          {t('cityLabel')} <span className="text-rose-500">*</span>
        </label>
        <select
          id="city"
          value={cityId ?? ''}
          onChange={e => {
            const v = e.target.value ? Number(e.target.value) : null;
            setCityId(v);
            setAreaId(null);
          }}
          className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">—</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Area */}
      {cityId && (
        <div className="space-y-1.5">
          <label
            htmlFor="area"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
          >
            {t('areaLabel')}
          </label>
          {loadingAreas ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2.5 text-xs text-foreground/60">
              <Loader2 size={12} className="animate-spin" />
              {t('loadingAreas')}
            </div>
          ) : areas.length > 0 ? (
            <select
              id="area"
              value={areaId ?? ''}
              onChange={e => setAreaId(e.target.value ? Number(e.target.value) : null)}
              className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">—</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-foreground/50">—</p>
          )}
          <p className="text-[11px] text-foreground/50">{t('areaHint')}</p>
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
