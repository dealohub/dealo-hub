'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, Wrench, AlertTriangle, ChevronLeft } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import type { Condition } from '@/lib/listings/validators';
import {
  TASK_TYPES,
  KW_GOVERNORATES,
  PROVIDER_LANGUAGES,
  taskTypeFamily,
  type TaskType,
  type KwGovernorate,
  type ProviderLanguage,
  type PriceMode,
  type AvailabilitySummary,
} from '@/lib/services/types';

/**
 * Phase 8a P10 — sell wizard branch for home-services providers.
 *
 * Single-page form (not 7-step like electronics) because services have
 * far fewer conditional branches — the whole thing fits in one scroll
 * without feeling cramped. Steps are section-headers rather than modal
 * transitions.
 *
 * Sections:
 *   1. Task type(s) — pick ONE (the task_type enum gates Phase 8a scope)
 *   2. Pricing — hourly / fixed / hybrid (P7 invariant enforced)
 *   3. Serving map — governorates (area-level picker lands in 8b)
 *   4. About the provider — team, experience, languages, supplies
 *   5. Availability — coarse summary
 *   6. Title + description (reuses the generic sell form's copy)
 *   7. P9 attestations — BLOCKING checkboxes
 *
 * Draft is saved progressively via saveDraft (same pattern as electronics).
 * Publish-time validation happens via publishListing on step 7 (already
 * wires ServiceFieldsSchema through listings/actions.ts once we add
 * the services branch in that file — stubbed here for Phase 8a).
 */

// Arabic labels — mirrored from listing-card-services + detail components
const TASK_LABELS_AR: Record<TaskType, string> = {
  home_cleaning_one_off: 'تنظيف شامل لمرة واحدة',
  home_cleaning_recurring: 'تنظيف أسبوعي / دوري',
  handyman_ikea_assembly: 'تركيب أثاث IKEA',
  handyman_tv_mount: 'تعليق تلفزيون',
  handyman_shelf_hang: 'تعليق رفوف أو لوحات',
  handyman_furniture_move: 'ترتيب ونقل أثاث داخل البيت',
  handyman_basic_painting: 'صباغة بسيطة',
  handyman_other: 'أعمال منزلية أخرى',
};

const GOV_LABELS_AR: Record<KwGovernorate, string> = {
  capital: 'العاصمة',
  hawalli: 'حولي',
  farwaniya: 'الفروانية',
  mubarak_al_kabeer: 'مبارك الكبير',
  ahmadi: 'الأحمدي',
  jahra: 'الجهراء',
};

const LANG_LABELS_AR: Record<ProviderLanguage, string> = {
  ar: 'العربية',
  en: 'English',
  hi: 'हिन्दी',
  ur: 'اردو',
  tl: 'Tagalog',
  ml: 'മലയാളം',
};

const AVAILABILITY_LABELS_AR: Record<AvailabilitySummary, string> = {
  daytime_weekdays: 'نهار أيام العمل',
  daytime_weekends: 'نهار نهاية الأسبوع',
  evenings: 'مساءً',
  flexible: 'مرن — معظم الأوقات',
};

type Props = {
  locale: 'ar' | 'en';
  initial: {
    title: string | null;
    description: string | null;
    condition: Condition | null;
    brand: string | null;
    model: string | null;
    fields: Record<string, unknown> | null;
  };
};

export default function ServicesDetailsForm({ locale, initial }: Props) {
  const t = useTranslations('sell.steps.services');
  const tErr = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Section 6 — title + description
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');

  // Section 1 — task type
  const [taskType, setTaskType] = useState<TaskType | ''>(
    (initial.fields?.task_type as TaskType | undefined) ?? '',
  );

  // Section 2 — pricing
  const [priceMode, setPriceMode] = useState<PriceMode>(
    (initial.fields?.price_mode as PriceMode | undefined) ?? 'hourly',
  );
  const [hourlyRate, setHourlyRate] = useState<string>(
    initial.fields?.hourly_rate_minor_units != null
      ? String(Number(initial.fields.hourly_rate_minor_units) / 1000)
      : '',
  );
  const [minHours, setMinHours] = useState<string>(
    initial.fields?.min_hours != null ? String(initial.fields.min_hours) : '',
  );
  const [fixedPrice, setFixedPrice] = useState<string>(
    initial.fields?.fixed_price_minor_units != null
      ? String(Number(initial.fields.fixed_price_minor_units) / 1000)
      : '',
  );

  // Section 3 — governorates
  const [governorates, setGovernorates] = useState<Set<KwGovernorate>>(
    new Set((initial.fields?.served_governorates as KwGovernorate[] | undefined) ?? []),
  );

  // Section 4 — provider info
  const [teamSize, setTeamSize] = useState<string>(
    initial.fields?.team_size != null ? String(initial.fields.team_size) : '1',
  );
  const [yearsExperience, setYearsExperience] = useState<string>(
    initial.fields?.years_experience != null ? String(initial.fields.years_experience) : '',
  );
  const [suppliesIncluded, setSuppliesIncluded] = useState<boolean>(
    (initial.fields?.supplies_included as boolean | undefined) ?? false,
  );
  const [languages, setLanguages] = useState<Set<ProviderLanguage>>(
    new Set((initial.fields?.spoken_languages as ProviderLanguage[] | undefined) ?? ['ar']),
  );

  // Section 5 — availability
  const [availability, setAvailability] = useState<AvailabilitySummary>(
    (initial.fields?.availability_summary as AvailabilitySummary | undefined) ?? 'flexible',
  );

  // Section 7 — P9 attestations
  const [att1, setAtt1] = useState(false);
  const [att2, setAtt2] = useState(false);

  function toggleGovernorate(g: KwGovernorate) {
    setGovernorates((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function toggleLanguage(l: ProviderLanguage) {
    setLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  function clientValidate(): string | null {
    if (!title.trim()) return t('errTitleRequired');
    if (!description.trim() || description.length < 30) return t('errDescriptionShort');
    if (!taskType) return t('errTaskTypeRequired');
    if (governorates.size === 0) return t('errGovernorateRequired');
    if (languages.size === 0) return t('errLanguageRequired');

    const hr = hourlyRate ? parseFloat(hourlyRate) : NaN;
    const mh = minHours ? parseInt(minHours, 10) : NaN;
    const fx = fixedPrice ? parseFloat(fixedPrice) : NaN;

    if (priceMode === 'hourly') {
      if (!(hr > 0) || !(mh >= 1)) return t('errHourlyRequired');
    }
    if (priceMode === 'fixed') {
      if (!(fx > 0)) return t('errFixedRequired');
    }
    if (priceMode === 'hybrid') {
      if (!(hr > 0) || !(mh >= 1) || !(fx > 0)) return t('errHybridRequired');
    }

    if (!att1 || !att2) return t('errAttestationsRequired');
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = clientValidate();
    if (v) {
      setError(v);
      return;
    }

    const fields: Record<string, unknown> = {
      task_type: taskType,
      served_governorates: Array.from(governorates),
      price_mode: priceMode,
      availability_summary: availability,
      team_size: parseInt(teamSize, 10) || 1,
      supplies_included: suppliesIncluded,
      spoken_languages: Array.from(languages),
      completed_bookings_count: 0,
      rating_avg: null,
      rating_count: 0,
    };

    if (priceMode !== 'fixed') {
      fields.hourly_rate_minor_units = Math.round(parseFloat(hourlyRate) * 1000);
      fields.min_hours = parseInt(minHours, 10);
    }
    if (priceMode !== 'hourly') {
      fields.fixed_price_minor_units = Math.round(parseFloat(fixedPrice) * 1000);
    }
    if (yearsExperience) {
      fields.years_experience = parseInt(yearsExperience, 10);
    }

    startTransition(async () => {
      const result = await saveDraft({
        title: title.trim(),
        description: description.trim(),
        condition: 'like_new' as Condition, // not meaningful for services; satisfies schema
        brand: 'Home Services',
        model: taskType, // helps search semantically
        category_fields: fields,
      } as any);
      if (!result.ok) {
        setError(tErr(result.error as any, { default: tErr('generic') }));
        return;
      }
      router.push(`/${locale}/sell/price`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 py-2">
      {/* Section 1 — task type */}
      <Section number="1" title={t('section1Title')} body={t('section1Body')}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TASK_TYPES.map((tt) => {
            const family = taskTypeFamily(tt);
            const Icon = family === 'cleaning' ? Sparkles : Wrench;
            const active = taskType === tt;
            return (
              <button
                key={tt}
                type="button"
                onClick={() => setTaskType(tt)}
                className={
                  'flex flex-col items-start gap-1.5 rounded-xl border p-3 text-start transition ' +
                  (active
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border/60 bg-card hover:border-primary/40')
                }
              >
                <Icon size={16} className={active ? 'text-primary' : 'text-foreground/60'} />
                <span className="text-[12px] font-semibold leading-tight text-foreground">
                  {TASK_LABELS_AR[tt]}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Section 2 — pricing (P7) */}
      <Section number="2" title={t('section2Title')} body={t('section2Body')}>
        <div className="mb-4 flex gap-2">
          {(['hourly', 'fixed', 'hybrid'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPriceMode(m)}
              className={
                'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ' +
                (priceMode === m
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                  : 'border-border/60 bg-card text-foreground/70 hover:border-primary/40')
              }
            >
              {t(`priceMode_${m}`)}
            </button>
          ))}
        </div>

        {(priceMode === 'hourly' || priceMode === 'hybrid') && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <NumberField
              label={t('hourlyRate')}
              suffix={t('kwdHour')}
              step="0.25"
              min="0.25"
              max="20"
              value={hourlyRate}
              onChange={setHourlyRate}
            />
            <NumberField
              label={t('minHours')}
              suffix={t('hours')}
              step="1"
              min="1"
              max="12"
              value={minHours}
              onChange={setMinHours}
            />
          </div>
        )}

        {(priceMode === 'fixed' || priceMode === 'hybrid') && (
          <NumberField
            label={t('fixedPrice')}
            suffix={t('kwd')}
            step="0.5"
            min="1"
            max="500"
            value={fixedPrice}
            onChange={setFixedPrice}
          />
        )}
      </Section>

      {/* Section 3 — governorates (P6) */}
      <Section number="3" title={t('section3Title')} body={t('section3Body')}>
        <div className="flex flex-wrap gap-2">
          {KW_GOVERNORATES.map((g) => {
            const active = governorates.has(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGovernorate(g)}
                className={
                  'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ' +
                  (active
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'border-border/60 bg-card text-foreground/70 hover:border-primary/40')
                }
              >
                {GOV_LABELS_AR[g]}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Section 4 — provider info */}
      <Section number="4" title={t('section4Title')} body={t('section4Body')}>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <NumberField
            label={t('teamSize')}
            suffix={t('persons')}
            step="1"
            min="1"
            max="20"
            value={teamSize}
            onChange={setTeamSize}
          />
          <NumberField
            label={t('yearsExperience')}
            suffix={t('years')}
            step="1"
            min="0"
            max="60"
            value={yearsExperience}
            onChange={setYearsExperience}
          />
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-sm">
          <input
            type="checkbox"
            checked={suppliesIncluded}
            onChange={(e) => setSuppliesIncluded(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span>{t('suppliesIncluded')}</span>
        </label>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
            {t('languages')}
          </div>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_LANGUAGES.map((l) => {
              const active = languages.has(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLanguage(l)}
                  className={
                    'rounded-md border px-2.5 py-1 text-[12px] font-semibold transition ' +
                    (active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-card text-foreground/70')
                  }
                >
                  {LANG_LABELS_AR[l]}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Section 5 — availability */}
      <Section number="5" title={t('section5Title')} body={t('section5Body')}>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value as AvailabilitySummary)}
          className="w-full rounded-xl border border-border/60 bg-card p-3 text-sm"
        >
          {(['flexible', 'daytime_weekdays', 'daytime_weekends', 'evenings'] as const).map((a) => (
            <option key={a} value={a}>
              {AVAILABILITY_LABELS_AR[a]}
            </option>
          ))}
        </select>
      </Section>

      {/* Section 6 — title + description */}
      <Section number="6" title={t('section6Title')} body={t('section6Body')}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={100}
          className="mb-3 w-full rounded-xl border border-border/60 bg-card p-3 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          maxLength={1500}
          rows={5}
          className="w-full rounded-xl border border-border/60 bg-card p-3 text-sm"
        />
        <div className="mt-1 text-end text-[10.5px] text-foreground/50">
          {description.length}/1500
        </div>
      </Section>

      {/* Section 7 — P9 attestations (BLOCKING) */}
      <Section
        number="7"
        title={t('section7Title')}
        body={t('section7Body')}
        variant="warn"
      >
        <div className="space-y-3">
          <label className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-[13px] leading-relaxed">
            <input
              type="checkbox"
              checked={att1}
              onChange={(e) => setAtt1(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-500"
            />
            <span>{t('attest1')}</span>
          </label>
          <label className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-[13px] leading-relaxed">
            <input
              type="checkbox"
              checked={att2}
              onChange={(e) => setAtt2(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-amber-500"
            />
            <span>{t('attest2')}</span>
          </label>
        </div>
      </Section>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? t('saving') : t('submit')}
        <ChevronLeft size={14} className="rtl:rotate-180" />
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Section({
  number,
  title,
  body,
  children,
  variant,
}: {
  number: string;
  title: string;
  body?: string;
  children: React.ReactNode;
  variant?: 'warn';
}) {
  return (
    <section>
      <header className="mb-3 flex items-start gap-3">
        <span
          className={
            'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ' +
            (variant === 'warn'
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              : 'bg-primary/10 text-primary')
          }
        >
          {number}
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {body && (
            <p className="mt-0.5 text-[12px] text-foreground/60">{body}</p>
          )}
        </div>
      </header>
      <div className="ms-10">{children}</div>
    </section>
  );
}

function NumberField({
  label, suffix, value, onChange, step, min, max,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 focus-within:border-primary/60">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          min={min}
          max={max}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <span className="text-[11px] text-foreground/50">{suffix}</span>
      </div>
    </div>
  );
}
