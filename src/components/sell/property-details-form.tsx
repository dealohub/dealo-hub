'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2 } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import type {
  Condition,
} from '@/lib/listings/validators';
import type {
  PropertyType,
  Amenity,
} from '@/lib/properties/validators';
import type { PropertyCategoryKey } from '@/lib/properties/types';

/**
 * PropertyDetailsForm — Step 3 of /sell for the Properties vertical.
 *
 * This is the Properties-branched variant of DetailsForm. When Step 1
 * lands on a real-estate sub-cat, the /sell/details page swaps in this
 * form to capture the full `PropertyFieldsRaw` JSONB body that lives
 * in `listings.category_fields`.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Title + description + condition + brand/model            │  ← shared
 *   │ Property type (14 tiles) · bedrooms · bathrooms · area   │
 *   │ Furnished · Tenure · Year built                          │
 *   │ Rent fields (conditional: rent_period, cheques)          │
 *   │ Sale fields (conditional: completion_status, zoning)     │
 *   │ Off-plan fields (conditional: payment_plan, handover)    │
 *   │ Chalet fields (conditional: availability.min_stay)       │
 *   │ Amenities (22 chips, grouped by domain)                  │
 *   │ Diwaniya (structured sub-object)                         │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Validation:
 *   - Client-side we mirror the "you can't continue" gates (title/desc
 *     length, condition picked, property_type picked, area_sqm > 0 for
 *     non-land, plot_area_sqm > 0 for land-plot). These are fast-fail
 *     UX — the authoritative refusal is at publish time via
 *     `validatePropertyFieldsRaw(raw, subCat)` in
 *     src/lib/properties/validators.ts.
 *
 * Progressive save:
 *   - Continue writes `category_fields` (snake_case) into
 *     `listing_drafts.category_fields` JSONB. Incomplete drafts are
 *     OK — the wizard is progressive, the publish gate is strict.
 *
 * i18n:
 *   - Reuses `properties.detail.*` strings (locale-complete: 14 types,
 *     22 amenities, diwaniya, etc.)
 *   - Wizard-specific copy lives under `sell.step.property.*`
 */

const CONDITION_VALUES: Condition[] = [
  'new',
  'new_with_tags',
  'like_new',
  'excellent_used',
  'good_used',
  'fair_used',
];

const PROPERTY_TYPES: PropertyType[] = [
  'apartment',
  'villa',
  'townhouse',
  'chalet',
  'studio',
  'duplex',
  'penthouse',
  'floor',
  'annex',
  'office',
  'shop',
  'warehouse',
  'room',
  'land-plot',
];

const FURNISHED_VALUES = ['unfurnished', 'semi_furnished', 'fully_furnished'] as const;
const COMPLETION_VALUES = ['ready', 'under_construction', 'off_plan'] as const;
const RENT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
const CHEQUE_COUNTS = [1, 2, 4, 6, 12] as const;
const TENURES = ['freehold', 'leasehold'] as const;
const ZONING_VALUES = [
  'residential-private',
  'investment',
  'commercial',
  'chalet',
  'industrial',
  'agricultural',
] as const;

/** 22 amenity slugs grouped into 4 domains for UI display. */
const AMENITY_GROUPS: Array<{ groupKey: string; amenities: Amenity[] }> = [
  {
    groupKey: 'Essentials',
    amenities: [
      'central_ac',
      'split_ac',
      'elevator',
      'covered_parking',
      'backup_generator',
      'water_tank',
      'balcony',
      'storage_room',
    ],
  },
  {
    groupKey: 'Comfort',
    amenities: [
      'swimming_pool_shared',
      'swimming_pool_private',
      'gym',
      'maid_room',
      'driver_room',
    ],
  },
  {
    groupKey: 'Security',
    amenities: ['24h_security', 'cctv', 'gated_community'],
  },
  {
    groupKey: 'Lifestyle',
    amenities: [
      'sea_view',
      'garden',
      'kids_play_area',
      'beachfront',
      'private_entrance',
      'roof_access',
    ],
  },
];

/**
 * Convert an amenity slug to the `properties.detail.amenity*` i18n key.
 * Mirrors the mapping used in src/components/properties/detail-page.tsx.
 */
function amenityI18nKey(slug: Amenity): string {
  // '24h_security' → 'amenity24hSecurity'
  //  'central_ac'  → 'amenityCentralAc'
  const pascal = slug
    .split('_')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
    // 'A' 'c' → 'Ac' stays same; `central_ac` already → `CentralAc`
    .replace(/Ac$/, 'Ac');
  return `amenity${pascal}`;
}

/** Convert a property_type slug to the `properties.detail.type*` i18n key. */
function propertyTypeI18nKey(slug: PropertyType): string {
  // 'land-plot' → 'typeLandPlot'
  const pascal = slug
    .split(/[-_]/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  return `type${pascal}`;
}

// ---------------------------------------------------------------------------
// Initial snapshot passed from the server
// ---------------------------------------------------------------------------

export interface PropertyInitial {
  // Shared (same as DetailsForm)
  title: string | null;
  description: string | null;
  condition: Condition | null;
  brand: string | null;
  model: string | null;

  // PropertyFieldsRaw (snake_case, straight from the JSONB)
  fields: Record<string, unknown> | null;

  // Sub-cat slug drives conditional field visibility
  subCatSlug: PropertyCategoryKey | null;
}

interface Props {
  locale: 'ar' | 'en';
  initial: PropertyInitial;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PropertyDetailsForm({ locale, initial }: Props) {
  const t = useTranslations('sell.step.details');
  const tP = useTranslations('sell.step.property');
  const tDetail = useTranslations('properties.detail');
  const tCond = useTranslations('sell.condition');
  const tNav = useTranslations('sell.nav');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Shared fields (same shape as DetailsForm)
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [condition, setCondition] = useState<Condition | null>(initial.condition);
  const [brand, setBrand] = useState(initial.brand ?? '');
  const [model, setModel] = useState(initial.model ?? '');

  // Property-specific fields. Extract from the draft blob (snake_case).
  const f = initial.fields ?? {};
  const [propertyType, setPropertyType] = useState<PropertyType | null>(
    (f.property_type as PropertyType | undefined) ?? null,
  );
  const [bedrooms, setBedrooms] = useState<string>(
    f.bedrooms != null ? String(f.bedrooms) : '',
  );
  const [bathrooms, setBathrooms] = useState<string>(
    f.bathrooms != null ? String(f.bathrooms) : '',
  );
  const [areaSqm, setAreaSqm] = useState<string>(
    f.area_sqm != null ? String(f.area_sqm) : '',
  );
  const [plotAreaSqm, setPlotAreaSqm] = useState<string>(
    f.plot_area_sqm != null ? String(f.plot_area_sqm) : '',
  );
  const [yearBuilt, setYearBuilt] = useState<string>(
    f.year_built != null ? String(f.year_built) : '',
  );
  const [furnishedStatus, setFurnishedStatus] = useState<string>(
    (f.furnished_status as string | undefined) ?? '',
  );
  const [tenure, setTenure] = useState<string>(
    (f.tenure as string | undefined) ?? '',
  );

  // Rent-conditional
  const [rentPeriod, setRentPeriod] = useState<string>(
    (f.rent_period as string | undefined) ?? '',
  );
  const [chequesCount, setChequesCount] = useState<string>(
    f.cheques_count != null ? String(f.cheques_count) : '',
  );

  // Sale-conditional
  const [completionStatus, setCompletionStatus] = useState<string>(
    (f.completion_status as string | undefined) ?? '',
  );
  const [zoningType, setZoningType] = useState<string>(
    (f.zoning_type as string | undefined) ?? '',
  );
  const [handoverQuarter, setHandoverQuarter] = useState<string>(
    (f.handover_expected_quarter as string | undefined) ?? '',
  );
  const paymentPlanInit = (f.payment_plan as {
    down_payment_pct?: number;
    handover_pct?: number;
    post_handover_months?: number;
    post_handover_pct?: number;
  } | undefined) ?? {};
  const [downPaymentPct, setDownPaymentPct] = useState<string>(
    paymentPlanInit.down_payment_pct != null ? String(paymentPlanInit.down_payment_pct) : '',
  );
  const [handoverPct, setHandoverPct] = useState<string>(
    paymentPlanInit.handover_pct != null ? String(paymentPlanInit.handover_pct) : '',
  );
  const [postHandoverMonths, setPostHandoverMonths] = useState<string>(
    paymentPlanInit.post_handover_months != null ? String(paymentPlanInit.post_handover_months) : '',
  );
  const [postHandoverPct, setPostHandoverPct] = useState<string>(
    paymentPlanInit.post_handover_pct != null ? String(paymentPlanInit.post_handover_pct) : '',
  );

  // Chalet-conditional
  const availInit = (f.availability as { min_stay_nights?: number } | undefined) ?? {};
  const [minStayNights, setMinStayNights] = useState<string>(
    availInit.min_stay_nights != null ? String(availInit.min_stay_nights) : '',
  );

  // Amenities + diwaniya
  const [amenities, setAmenities] = useState<Amenity[]>(
    Array.isArray(f.amenities) ? (f.amenities as Amenity[]) : [],
  );
  const diwaniyaInit = (f.diwaniya as {
    present?: boolean;
    separate_entrance?: boolean;
    has_bathroom?: boolean;
    has_kitchenette?: boolean;
  } | undefined) ?? {};
  const [diwaniyaPresent, setDiwaniyaPresent] = useState(diwaniyaInit.present ?? false);
  const [diwaniyaSepEntry, setDiwaniyaSepEntry] = useState(
    diwaniyaInit.separate_entrance ?? false,
  );
  const [diwaniyaHasBath, setDiwaniyaHasBath] = useState(
    diwaniyaInit.has_bathroom ?? false,
  );
  const [diwaniyaHasKitch, setDiwaniyaHasKitch] = useState(
    diwaniyaInit.has_kitchenette ?? false,
  );

  // ── Derived UI state ──────────────────────────────────────────────
  const subCat = initial.subCatSlug;
  const isRent =
    subCat === 'property-for-rent' || subCat === 'rooms-for-rent';
  const isSale = subCat === 'property-for-sale';
  const isLand = subCat === 'land';
  const isChalet = propertyType === 'chalet';
  const isLandPlot = propertyType === 'land-plot';
  const isOffPlan = isSale && completionStatus === 'off_plan';

  // Locked property_type for some sub-cats to keep UX + refinement aligned
  const lockedPropertyType: PropertyType | null =
    subCat === 'rooms-for-rent' ? 'room' : subCat === 'land' ? 'land-plot' : null;
  const effectivePropertyType = lockedPropertyType ?? propertyType;

  // Title / description validity (same as DetailsForm)
  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const titleOk = titleLen >= 5 && titleLen <= 120;
  const descOk = descLen >= 10 && descLen <= 5000;

  // Required property fields for Continue
  const areaOk = Number.parseInt(areaSqm, 10) >= 10;
  const plotAreaOk = isLandPlot ? Number.parseInt(plotAreaSqm, 10) >= 100 : true;
  const propertyTypeOk = !!effectivePropertyType;
  const rentOk = !isRent || !!rentPeriod;
  const saleOk = !isSale || (!!completionStatus && !!zoningType);
  const offPlanOk = !isOffPlan
    ? true
    : !!handoverQuarter &&
      Number.parseInt(downPaymentPct, 10) >= 0 &&
      Number.parseInt(handoverPct, 10) >= 0;
  const chaletOk = !(isRent && isChalet) || Number.parseInt(minStayNights, 10) >= 1;

  const canContinue =
    titleOk &&
    descOk &&
    !!condition &&
    propertyTypeOk &&
    areaOk &&
    plotAreaOk &&
    rentOk &&
    saleOk &&
    offPlanOk &&
    chaletOk;

  // ── Serialize UI state → PropertyFieldsRaw (snake_case) ────────────
  const categoryFields = useMemo(() => {
    const out: Record<string, unknown> = {};
    if (effectivePropertyType) out.property_type = effectivePropertyType;
    const bed = Number.parseInt(bedrooms, 10);
    if (!Number.isNaN(bed)) out.bedrooms = bed;
    const bath = Number.parseInt(bathrooms, 10);
    if (!Number.isNaN(bath)) out.bathrooms = bath;
    const area = Number.parseInt(areaSqm, 10);
    if (!Number.isNaN(area)) out.area_sqm = area;
    const plotArea = Number.parseInt(plotAreaSqm, 10);
    if (!Number.isNaN(plotArea)) out.plot_area_sqm = plotArea;
    const yearN = Number.parseInt(yearBuilt, 10);
    if (!Number.isNaN(yearN)) out.year_built = yearN;
    if (furnishedStatus) out.furnished_status = furnishedStatus;
    if (tenure) out.tenure = tenure;

    if (rentPeriod) out.rent_period = rentPeriod;
    const chq = Number.parseInt(chequesCount, 10);
    if (!Number.isNaN(chq)) out.cheques_count = chq;

    if (completionStatus) out.completion_status = completionStatus;
    if (zoningType) out.zoning_type = zoningType;
    if (handoverQuarter) out.handover_expected_quarter = handoverQuarter;

    if (isOffPlan) {
      const dp = Number.parseInt(downPaymentPct, 10);
      const hp = Number.parseInt(handoverPct, 10);
      const phm = Number.parseInt(postHandoverMonths, 10);
      const php = Number.parseInt(postHandoverPct, 10);
      if (!Number.isNaN(dp) && !Number.isNaN(hp)) {
        out.payment_plan = {
          down_payment_pct: dp,
          handover_pct: hp,
          ...(Number.isNaN(phm) ? {} : { post_handover_months: phm }),
          ...(Number.isNaN(php) ? {} : { post_handover_pct: php }),
        };
      }
    }

    if (isRent && isChalet) {
      const mn = Number.parseInt(minStayNights, 10);
      if (!Number.isNaN(mn)) out.availability = { min_stay_nights: mn };
    }

    if (amenities.length > 0) out.amenities = amenities;

    if (diwaniyaPresent) {
      out.diwaniya = {
        present: true,
        separate_entrance: diwaniyaSepEntry,
        has_bathroom: diwaniyaHasBath,
        has_kitchenette: diwaniyaHasKitch,
      };
    }

    return out;
  }, [
    effectivePropertyType,
    bedrooms,
    bathrooms,
    areaSqm,
    plotAreaSqm,
    yearBuilt,
    furnishedStatus,
    tenure,
    rentPeriod,
    chequesCount,
    completionStatus,
    zoningType,
    handoverQuarter,
    isOffPlan,
    downPaymentPct,
    handoverPct,
    postHandoverMonths,
    postHandoverPct,
    isRent,
    isChalet,
    minStayNights,
    amenities,
    diwaniyaPresent,
    diwaniyaSepEntry,
    diwaniyaHasBath,
    diwaniyaHasKitch,
  ]);

  function toggleAmenity(a: Amenity) {
    setAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a],
    );
  }

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
        category_fields: categoryFields,
        current_step: 'price',
      });
      if (!result.ok) {
        setError(tErrors('generic'));
        return;
      }
      router.push(`/${locale}/sell/price`);
    });
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Title ── */}
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
          <span className={titleLen > 100 ? 'text-rose-500' : 'text-foreground/40'}>
            {titleLen}/120
          </span>
        </div>
      </div>

      {/* ── Description ── */}
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

      {/* ── Condition ── */}
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
                {tCond(`${c}.label` as any)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Property type ── */}
      <div className="space-y-1.5 border-t border-border/40 pt-5">
        <span className="block text-xs font-medium uppercase tracking-wider text-foreground/70">
          {tP('propertyTypeLabel')} <span className="text-rose-500">*</span>
        </span>
        {lockedPropertyType ? (
          <p className="text-[11px] text-foreground/60">
            {tP('propertyTypeLocked', {
              type: tDetail(propertyTypeI18nKey(lockedPropertyType) as any),
            })}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(pt => {
              const isActive = propertyType === pt;
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPropertyType(pt)}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                    (isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
                  }
                >
                  {tDetail(propertyTypeI18nKey(pt) as any)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dimensions ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <FieldInput
          id="bedrooms"
          label={tP('bedroomsLabel')}
          value={bedrooms}
          onChange={setBedrooms}
          type="number"
          min={0}
          max={20}
          disabled={isLandPlot}
        />
        <FieldInput
          id="bathrooms"
          label={tP('bathroomsLabel')}
          value={bathrooms}
          onChange={setBathrooms}
          type="number"
          min={0}
          max={20}
          disabled={isLandPlot}
        />
        <FieldInput
          id="areaSqm"
          label={`${tP('areaSqmLabel')} *`}
          value={areaSqm}
          onChange={setAreaSqm}
          type="number"
          min={10}
          max={50000}
          disabled={isLandPlot}
        />
        <FieldInput
          id="plotAreaSqm"
          label={`${tP('plotAreaSqmLabel')}${isLandPlot ? ' *' : ''}`}
          value={plotAreaSqm}
          onChange={setPlotAreaSqm}
          type="number"
          min={100}
          max={50000}
        />
      </div>

      {/* ── Furnished · Tenure · Year built ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FieldSelect
          id="furnishedStatus"
          label={tP('furnishedLabel')}
          value={furnishedStatus}
          onChange={setFurnishedStatus}
          options={FURNISHED_VALUES.map(v => ({
            value: v,
            label: tDetail(
              (v === 'unfurnished'
                ? 'furnishedUnfurnished'
                : v === 'semi_furnished'
                  ? 'furnishedSemi'
                  : 'furnishedFully') as any,
            ),
          }))}
        />
        <FieldSelect
          id="tenure"
          label={tP('tenureLabel')}
          value={tenure}
          onChange={setTenure}
          options={TENURES.map(v => ({
            value: v,
            label: tDetail(
              (v === 'freehold' ? 'tenureFreehold' : 'tenureLeasehold') as any,
            ),
          }))}
        />
        <FieldInput
          id="yearBuilt"
          label={tP('yearBuiltLabel')}
          value={yearBuilt}
          onChange={setYearBuilt}
          type="number"
          min={1950}
          max={new Date().getFullYear() + 3}
        />
      </div>

      {/* ── Rent-only fields ── */}
      {isRent && (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-border/40 pt-5">
          <FieldSelect
            id="rentPeriod"
            label={`${tP('rentPeriodLabel')} *`}
            value={rentPeriod}
            onChange={setRentPeriod}
            options={RENT_PERIODS.map(v => ({
              value: v,
              label: tDetail(
                (v === 'daily'
                  ? 'periodDaily'
                  : v === 'weekly'
                    ? 'periodWeekly'
                    : v === 'monthly'
                      ? 'periodMonthly'
                      : 'periodYearly') as any,
              ),
            }))}
          />
          {rentPeriod === 'yearly' && (
            <FieldSelect
              id="chequesCount"
              label={`${tP('chequesCountLabel')} *`}
              value={chequesCount}
              onChange={setChequesCount}
              options={CHEQUE_COUNTS.map(v => ({
                value: String(v),
                label: tDetail('chequesShort', { n: v }),
              }))}
            />
          )}
        </div>
      )}

      {/* ── Sale-only fields ── */}
      {(isSale || isLand) && (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-border/40 pt-5">
          {isSale && (
            <FieldSelect
              id="completionStatus"
              label={`${tP('completionStatusLabel')} *`}
              value={completionStatus}
              onChange={setCompletionStatus}
              options={COMPLETION_VALUES.map(v => ({
                value: v,
                label: tDetail(
                  (v === 'ready'
                    ? 'completionReady'
                    : v === 'under_construction'
                      ? 'completionUnderConstruction'
                      : 'completionOffPlan') as any,
                ),
              }))}
            />
          )}
          <FieldSelect
            id="zoningType"
            label={`${tP('zoningTypeLabel')}${isSale ? ' *' : ''}`}
            value={zoningType}
            onChange={setZoningType}
            options={ZONING_VALUES.map(v => ({
              value: v,
              label: tP(`zoning_${v.replace('-', '_')}` as any),
            }))}
          />
        </div>
      )}

      {/* ── Off-plan fields ── */}
      {isOffPlan && (
        <div className="space-y-4 rounded-lg border border-border/50 bg-foreground/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
            {tP('offPlanHeading')} <span className="text-rose-500">*</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput
              id="handoverQuarter"
              label={tP('handoverQuarterLabel')}
              value={handoverQuarter}
              onChange={setHandoverQuarter}
              type="text"
              placeholder="2027-Q3"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <FieldInput
              id="downPaymentPct"
              label={tP('downPaymentPctLabel')}
              value={downPaymentPct}
              onChange={setDownPaymentPct}
              type="number"
              min={0}
              max={100}
            />
            <FieldInput
              id="handoverPct"
              label={tP('handoverPctLabel')}
              value={handoverPct}
              onChange={setHandoverPct}
              type="number"
              min={0}
              max={100}
            />
            <FieldInput
              id="postHandoverMonths"
              label={tP('postHandoverMonthsLabel')}
              value={postHandoverMonths}
              onChange={setPostHandoverMonths}
              type="number"
              min={0}
              max={120}
            />
            <FieldInput
              id="postHandoverPct"
              label={tP('postHandoverPctLabel')}
              value={postHandoverPct}
              onChange={setPostHandoverPct}
              type="number"
              min={0}
              max={100}
            />
          </div>
        </div>
      )}

      {/* ── Chalet booking primitives ── */}
      {isRent && isChalet && (
        <div className="space-y-4 rounded-lg border border-border/50 bg-foreground/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
            {tP('chaletHeading')} <span className="text-rose-500">*</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldInput
              id="minStayNights"
              label={tP('minStayNightsLabel')}
              value={minStayNights}
              onChange={setMinStayNights}
              type="number"
              min={1}
              max={365}
            />
          </div>
        </div>
      )}

      {/* ── Amenities (grouped chips) ── */}
      <div className="space-y-2 border-t border-border/40 pt-5">
        <span className="block text-xs font-medium uppercase tracking-wider text-foreground/70">
          {tP('amenitiesLabel')}
        </span>
        <div className="space-y-2.5">
          {AMENITY_GROUPS.map(group => (
            <div key={group.groupKey}>
              <p className="mb-1 text-[11px] font-medium text-foreground/60">
                {tDetail(`amenitiesCategory${group.groupKey}` as any)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.amenities.map(a => {
                  const isActive = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={
                        'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                        (isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
                      }
                    >
                      {tDetail(amenityI18nKey(a) as any)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Diwaniya (structured sub-object) ── */}
      <div className="space-y-2 border-t border-border/40 pt-5">
        <label className="inline-flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={diwaniyaPresent}
            onChange={e => setDiwaniyaPresent(e.target.checked)}
            className="h-4 w-4 rounded border-border/60"
          />
          <span className="text-xs font-medium uppercase tracking-wider text-foreground/70">
            {tDetail('diwaniyaPresent')}
          </span>
        </label>
        {diwaniyaPresent && (
          <div className="grid gap-1.5 pl-6 text-xs text-foreground/80 sm:grid-cols-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={diwaniyaSepEntry}
                onChange={e => setDiwaniyaSepEntry(e.target.checked)}
                className="h-4 w-4 rounded border-border/60"
              />
              {tDetail('diwaniyaSeparateEntrance')}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={diwaniyaHasBath}
                onChange={e => setDiwaniyaHasBath(e.target.checked)}
                className="h-4 w-4 rounded border-border/60"
              />
              {tDetail('diwaniyaHasBathroom')}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={diwaniyaHasKitch}
                onChange={e => setDiwaniyaHasKitch(e.target.checked)}
                className="h-4 w-4 rounded border-border/60"
              />
              {tDetail('diwaniyaHasKitchenette')}
            </label>
          </div>
        )}
      </div>

      {/* ── Brand + Model (kept for parity; optional) ── */}
      <div className="grid gap-4 sm:grid-cols-2 border-t border-border/40 pt-5">
        <div className="space-y-1.5">
          <label
            htmlFor="brand"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
          >
            {tP('developerLabel')}
          </label>
          <input
            id="brand"
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder={tP('developerPlaceholder')}
            maxLength={100}
            className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="model"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
          >
            {tP('buildingLabel')}
          </label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder={tP('buildingPlaceholder')}
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

// ---------------------------------------------------------------------------
// Small inlined presentation helpers (kept local — these are bespoke to the
// Properties form and don't justify a new export surface).
// ---------------------------------------------------------------------------

function FieldInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-foreground/70"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">—</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
