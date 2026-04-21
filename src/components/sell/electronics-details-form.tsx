'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import type { Condition } from '@/lib/listings/validators';
import type { ElectronicsCategoryKey, DeviceKind } from '@/lib/electronics/types';
import { DEVICE_KIND_BY_SUB_CAT } from '@/lib/electronics/types';

/**
 * ElectronicsDetailsForm — Step 3 of /sell for the Electronics vertical.
 *
 * Branched variant of the generic DetailsForm. When Step 1 lands on
 * any of the 6 electronics sub-cats, /sell/details renders this form
 * instead, capturing the 28-field ElectronicsFieldsRaw JSONB body.
 *
 * Layout (sub-cat-driven):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Title + description + condition (shared)                 │
 *   │ Device kind (filtered by sub-cat) · brand · model · year │
 *   │ IMEI/serial last 4 (P3 — phones/tablets/cellular watch)  │
 *   │ Storage / RAM / CPU / GPU / screen (sub-cat-driven)      │
 *   │ Battery health % + visible band (P4 — colored bar)       │
 *   │ Region spec + carrier lock (P5 — phones)                 │
 *   │ Condition grade · box · accessories · repair history     │
 *   │ Warranty status + country + receipt (P6 — Trust Panel)   │
 *   │ Trade-in toggle + free-text (P11)                        │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Validation:
 *   - Client-side gates the most-likely seller mistakes (missing IMEI
 *     on phone, missing CPU on laptop). The authoritative refusal is
 *     at publish via `validateElectronicsFieldsRaw(raw, subCat)`.
 *
 * Progressive save:
 *   - "Continue" writes `category_fields` (snake_case) into
 *     `listing_drafts.category_fields` JSONB. Incomplete drafts OK —
 *     wizard is progressive, publish is strict.
 *
 * i18n:
 *   - Wizard copy under `sell.step.electronics.*` (new namespace × AR/EN)
 *   - Enum labels (warranty, region, etc.) under same namespace
 */

// ---------------------------------------------------------------------------
// Constants — must align with validators.ts enums
// ---------------------------------------------------------------------------

const CONDITION_VALUES: Condition[] = [
  'new',
  'new_with_tags',
  'like_new',
  'excellent_used',
  'good_used',
  'fair_used',
];

const CONDITION_GRADES = ['mint', 'excellent', 'good', 'fair', 'for_parts'] as const;
const STORAGE_TYPES = ['ssd', 'hdd', 'nvme', 'hybrid', 'emmc'] as const;
const RESOLUTIONS = ['hd', 'fhd', '2k', '4k', '8k'] as const;
const BOX_STATUSES = ['bnib', 'open_box', 'no_box'] as const;
const REGIONS = ['gcc', 'us', 'eu', 'jp', 'other'] as const;
const CARRIER_LOCKS = ['unlocked', 'zain', 'stc', 'ooredoo', 'other'] as const;
const WARRANTY_STATUSES = [
  'active_kuwait',
  'active_international',
  'expired',
  'none',
] as const;
const PURCHASE_COUNTRIES = [
  'kw',
  'sa',
  'ae',
  'qa',
  'bh',
  'om',
  'us',
  'eu',
  'jp',
  'other',
] as const;
const ACCESSORIES = [
  'charger',
  'cable',
  'earphones',
  'case',
  'stand',
  'box_only',
  'original_packaging',
] as const;
const CONNECTIVITY_OPTS = [
  'wifi',
  'wifi6',
  'bluetooth',
  '5g',
  'lte',
  'ethernet',
  'usb_c',
  'thunderbolt',
] as const;
const REPAIR_KINDS = [
  'screen',
  'battery',
  'back_glass',
  'logic_board',
  'sensor',
  'none',
] as const;
const LENS_MOUNTS = [
  'canon_ef',
  'canon_rf',
  'sony_e',
  'nikon_f',
  'nikon_z',
  'm43',
  'leica_m',
  'other',
] as const;

// ---------------------------------------------------------------------------
// Initial snapshot
// ---------------------------------------------------------------------------

export interface ElectronicsInitial {
  title: string | null;
  description: string | null;
  condition: Condition | null;
  brand: string | null;
  model: string | null;
  fields: Record<string, unknown> | null;
  subCatSlug: ElectronicsCategoryKey | null;
}

interface Props {
  locale: 'ar' | 'en';
  initial: ElectronicsInitial;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ElectronicsDetailsForm({ locale, initial }: Props) {
  const t = useTranslations('sell.step.details');
  const tE = useTranslations('sell.step.electronics');
  const tCond = useTranslations('sell.condition');
  const tNav = useTranslations('sell.nav');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Shared text fields
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [condition, setCondition] = useState<Condition | null>(initial.condition);

  // Electronics-specific
  const f = initial.fields ?? {};
  const subCat = initial.subCatSlug;
  const allowedKinds: ReadonlyArray<DeviceKind> = subCat
    ? DEVICE_KIND_BY_SUB_CAT[subCat] ?? []
    : [];

  const [deviceKind, setDeviceKind] = useState<DeviceKind | ''>(
    (f.device_kind as DeviceKind | undefined) ??
      (allowedKinds.length === 1 ? allowedKinds[0] : ''),
  );
  const [brand, setBrand] = useState((initial.brand ?? f.brand ?? '') as string);
  const [model, setModel] = useState((initial.model ?? f.model ?? '') as string);
  const [yearOfRelease, setYearOfRelease] = useState<string>(
    f.year_of_release != null ? String(f.year_of_release) : '',
  );
  const [imeiLast4, setImeiLast4] = useState<string>(
    (f.serial_or_imei_last_4 as string | undefined) ?? '',
  );

  // Specs
  const [storageGb, setStorageGb] = useState<string>(
    f.storage_gb != null ? String(f.storage_gb) : '',
  );
  const [ramGb, setRamGb] = useState<string>(
    f.ram_gb != null ? String(f.ram_gb) : '',
  );
  const [cpu, setCpu] = useState((f.cpu as string | undefined) ?? '');
  const [gpu, setGpu] = useState((f.gpu as string | undefined) ?? '');
  const [storageType, setStorageType] = useState<string>(
    (f.storage_type as string | undefined) ?? '',
  );
  const [screenSizeInches, setScreenSizeInches] = useState<string>(
    f.screen_size_inches != null ? String(f.screen_size_inches) : '',
  );
  const [resolution, setResolution] = useState<string>(
    (f.resolution as string | undefined) ?? '',
  );
  const [connectivity, setConnectivity] = useState<string[]>(
    Array.isArray(f.connectivity) ? (f.connectivity as string[]) : [],
  );
  const [batteryCycles, setBatteryCycles] = useState<string>(
    f.battery_cycles != null ? String(f.battery_cycles) : '',
  );
  const [lensMount, setLensMount] = useState<string>(
    (f.lens_mount as string | undefined) ?? '',
  );

  // Condition + provenance
  const [conditionGrade, setConditionGrade] = useState<string>(
    (f.condition_grade as string | undefined) ?? '',
  );
  const [batteryHealthPct, setBatteryHealthPct] = useState<string>(
    f.battery_health_pct != null ? String(f.battery_health_pct) : '',
  );
  const [boxStatus, setBoxStatus] = useState<string>(
    (f.box_status as string | undefined) ?? '',
  );
  const [accessories, setAccessories] = useState<string[]>(
    Array.isArray(f.accessories_included)
      ? (f.accessories_included as string[])
      : [],
  );
  const [repairHistory, setRepairHistory] = useState<string[]>(
    Array.isArray(f.repair_history) ? (f.repair_history as string[]) : [],
  );
  const [originalParts, setOriginalParts] = useState<boolean>(
    (f.original_parts as boolean | undefined) ?? false,
  );

  // Warranty + provenance
  const [purchaseCountry, setPurchaseCountry] = useState<string>(
    (f.purchase_country as string | undefined) ?? '',
  );
  const [warrantyStatus, setWarrantyStatus] = useState<string>(
    (f.warranty_status as string | undefined) ?? '',
  );
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState<string>(
    (f.warranty_expires_at as string | undefined) ?? '',
  );
  const [hasOriginalReceipt, setHasOriginalReceipt] = useState<boolean>(
    (f.has_original_receipt as boolean | undefined) ?? false,
  );

  // Region + lock + trade
  const [regionSpec, setRegionSpec] = useState<string>(
    (f.region_spec as string | undefined) ?? '',
  );
  const [carrierLock, setCarrierLock] = useState<string>(
    (f.carrier_lock as string | undefined) ?? '',
  );
  const [acceptsTrade, setAcceptsTrade] = useState<boolean>(
    (f.accepts_trade as boolean | undefined) ?? false,
  );
  const [tradeForModels, setTradeForModels] = useState<string>(
    (f.trade_for_models as string | undefined) ?? '',
  );

  // ── Derived ─────────────────────────────────────────────────────────
  const isPhone = deviceKind === 'phone';
  const isTablet = deviceKind === 'tablet';
  const isLaptop = deviceKind === 'laptop';
  const isDesktop = deviceKind === 'desktop';
  const isTv = deviceKind === 'tv';
  const isConsole = deviceKind === 'console' || deviceKind === 'handheld_console';
  const isSmartWatch = deviceKind === 'smart_watch';
  const isLens = deviceKind === 'lens';

  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const titleOk = titleLen >= 5 && titleLen <= 120;
  const descOk = descLen >= 10 && descLen <= 5000;

  // Sub-cat-aware validation gates
  const deviceKindOk = !!deviceKind;
  const brandOk = brand.trim().length > 0;
  const modelOk = model.trim().length > 0;
  const conditionGradeOk = !!conditionGrade;

  const phoneOk = !isPhone
    ? true
    : /^[0-9A-Z]{4}$/.test(imeiLast4) &&
      Number.parseInt(storageGb, 10) > 0 &&
      !!regionSpec &&
      !!carrierLock;

  const tabletOk = !isTablet
    ? true
    : /^[0-9A-Z]{4}$/.test(imeiLast4) &&
      Number.parseInt(storageGb, 10) > 0 &&
      !!regionSpec;

  const laptopOk = !(isLaptop || isDesktop)
    ? true
    : Number.parseInt(storageGb, 10) > 0 &&
      Number.parseInt(ramGb, 10) > 0 &&
      cpu.trim().length > 0 &&
      (isDesktop || Number.parseFloat(screenSizeInches) > 0);

  const tvOk = !isTv
    ? true
    : Number.parseFloat(screenSizeInches) > 0 && !!resolution;

  const consoleOk = !isConsole ? true : Number.parseInt(storageGb, 10) > 0;
  const smartWatchOk = !isSmartWatch
    ? true
    : Number.parseInt(batteryHealthPct, 10) >= 0 &&
      Number.parseInt(batteryHealthPct, 10) <= 100;
  const lensOk = !isLens ? true : !!lensMount;

  const canContinue =
    titleOk &&
    descOk &&
    !!condition &&
    deviceKindOk &&
    brandOk &&
    modelOk &&
    conditionGradeOk &&
    phoneOk &&
    tabletOk &&
    laptopOk &&
    tvOk &&
    consoleOk &&
    smartWatchOk &&
    lensOk;

  // ── Battery-health visual band ──────────────────────────────────────
  const bhPct = Number.parseInt(batteryHealthPct, 10);
  const batteryBand: 'green' | 'amber' | 'red' | 'unknown' = Number.isNaN(bhPct)
    ? 'unknown'
    : bhPct >= 85
      ? 'green'
      : bhPct >= 70
        ? 'amber'
        : 'red';
  const batteryBandClass =
    batteryBand === 'green'
      ? 'bg-emerald-500'
      : batteryBand === 'amber'
        ? 'bg-amber-500'
        : batteryBand === 'red'
          ? 'bg-rose-500'
          : 'bg-foreground/20';

  // ── Serialize to PropertyFieldsRaw shape ────────────────────────────
  const categoryFields = useMemo(() => {
    const out: Record<string, unknown> = {};
    if (deviceKind) out.device_kind = deviceKind;
    if (brand.trim()) out.brand = brand.trim();
    if (model.trim()) out.model = model.trim();
    const yr = Number.parseInt(yearOfRelease, 10);
    if (!Number.isNaN(yr)) out.year_of_release = yr;
    if (imeiLast4.trim()) {
      out.serial_or_imei_last_4 = imeiLast4.trim().toUpperCase();
    }

    const stor = Number.parseInt(storageGb, 10);
    if (!Number.isNaN(stor)) out.storage_gb = stor;
    const ram = Number.parseInt(ramGb, 10);
    if (!Number.isNaN(ram)) out.ram_gb = ram;
    if (cpu.trim()) out.cpu = cpu.trim();
    if (gpu.trim()) out.gpu = gpu.trim();
    if (storageType) out.storage_type = storageType;
    const screen = Number.parseFloat(screenSizeInches);
    if (!Number.isNaN(screen)) out.screen_size_inches = screen;
    if (resolution) out.resolution = resolution;
    if (connectivity.length > 0) out.connectivity = connectivity;
    const cycles = Number.parseInt(batteryCycles, 10);
    if (!Number.isNaN(cycles) && (isLaptop || isDesktop)) {
      out.battery_cycles = cycles;
    }
    if (isLens && lensMount) out.lens_mount = lensMount;

    if (conditionGrade) out.condition_grade = conditionGrade;
    if (!Number.isNaN(bhPct)) out.battery_health_pct = bhPct;
    if (boxStatus) out.box_status = boxStatus;
    if (accessories.length > 0) out.accessories_included = accessories;
    if (repairHistory.length > 0) out.repair_history = repairHistory;
    if (originalParts) out.original_parts = true;

    if (purchaseCountry) out.purchase_country = purchaseCountry;
    if (warrantyStatus) out.warranty_status = warrantyStatus;
    if (
      warrantyExpiresAt &&
      /^\d{4}-\d{2}-\d{2}$/.test(warrantyExpiresAt)
    ) {
      out.warranty_expires_at = warrantyExpiresAt;
    }
    if (hasOriginalReceipt) out.has_original_receipt = true;

    if (regionSpec) out.region_spec = regionSpec;
    if (carrierLock && isPhone) out.carrier_lock = carrierLock;
    if (acceptsTrade) {
      out.accepts_trade = true;
      if (tradeForModels.trim()) out.trade_for_models = tradeForModels.trim();
    }

    return out;
  }, [
    deviceKind, brand, model, yearOfRelease, imeiLast4,
    storageGb, ramGb, cpu, gpu, storageType, screenSizeInches, resolution,
    connectivity, batteryCycles, lensMount, isLaptop, isDesktop, isLens,
    isPhone,
    conditionGrade, bhPct, boxStatus, accessories, repairHistory, originalParts,
    purchaseCountry, warrantyStatus, warrantyExpiresAt, hasOriginalReceipt,
    regionSpec, carrierLock, acceptsTrade, tradeForModels,
  ]);

  function toggleArrayValue(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
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
      {/* Title */}
      <FieldGroup label={t('titleLabel')} required>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={120}
          className={inputCls(!titleOk && titleLen > 0)}
        />
        <Hint>{t('titleHint')} · {titleLen}/120</Hint>
      </FieldGroup>

      {/* Description */}
      <FieldGroup label={t('descriptionLabel')} required>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={6}
          maxLength={5000}
          className={textareaCls(!descOk && descLen > 0)}
        />
        <Hint>{t('descriptionHint')} · {descLen}/5000</Hint>
      </FieldGroup>

      {/* Condition (legacy enum, kept for parity) */}
      <FieldGroup label={t('conditionLabel')} required>
        <ChipRow
          values={CONDITION_VALUES}
          active={condition ?? ''}
          onPick={v => setCondition(v as Condition)}
          render={v => tCond(`${v}.label` as any)}
        />
      </FieldGroup>

      {/* ── Identity ── */}
      <Section title={tE('sectionIdentity')}>
        <FieldGroup label={tE('deviceKindLabel')} required>
          <ChipRow
            values={allowedKinds.length > 0 ? allowedKinds : ([] as ReadonlyArray<string>)}
            active={deviceKind}
            onPick={v => setDeviceKind(v as DeviceKind)}
            render={v => tE(`deviceKind.${v}` as any)}
          />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label={tE('brandLabel')} required>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              maxLength={60}
              placeholder={tE('brandPlaceholder')}
              className={inputCls(false)}
            />
          </FieldGroup>
          <FieldGroup label={tE('modelLabel')} required>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              maxLength={80}
              placeholder={tE('modelPlaceholder')}
              className={inputCls(false)}
            />
          </FieldGroup>
          <FieldGroup label={tE('yearOfReleaseLabel')}>
            <input
              type="number"
              min={1980}
              max={new Date().getFullYear() + 1}
              value={yearOfRelease}
              onChange={e => setYearOfRelease(e.target.value)}
              className={inputCls(false)}
            />
          </FieldGroup>
        </div>
      </Section>

      {/* ── IMEI / serial — phones, tablets, cellular smart-watches ── */}
      {(isPhone || isTablet) && (
        <Section title={tE('sectionVerification')}>
          <FieldGroup label={`${tE('imeiLabel')} *`}>
            <input
              type="text"
              value={imeiLast4}
              onChange={e => setImeiLast4(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="A1B2"
              pattern="[0-9A-Z]{4}"
              className={inputCls(false)}
            />
            <Hint>{tE('imeiHint')}</Hint>
          </FieldGroup>
        </Section>
      )}

      {/* ── Specs (sub-cat-driven) ── */}
      <Section title={tE('sectionSpecs')}>
        <div className="grid gap-4 sm:grid-cols-3">
          {(isPhone || isTablet || isLaptop || isDesktop || isConsole) && (
            <FieldGroup
              label={`${tE('storageGbLabel')}${isPhone || isTablet || isConsole || isLaptop || isDesktop ? ' *' : ''}`}
            >
              <input
                type="number"
                min={1}
                max={64000}
                value={storageGb}
                onChange={e => setStorageGb(e.target.value)}
                className={inputCls(false)}
              />
            </FieldGroup>
          )}

          {(isPhone || isTablet || isLaptop || isDesktop) && (
            <FieldGroup
              label={`${tE('ramGbLabel')}${isLaptop || isDesktop ? ' *' : ''}`}
            >
              <input
                type="number"
                min={1}
                max={2048}
                value={ramGb}
                onChange={e => setRamGb(e.target.value)}
                className={inputCls(false)}
              />
            </FieldGroup>
          )}

          {(isLaptop || isDesktop) && (
            <FieldGroup label={`${tE('cpuLabel')} *`}>
              <input
                type="text"
                value={cpu}
                onChange={e => setCpu(e.target.value)}
                placeholder={tE('cpuPlaceholder')}
                maxLength={80}
                className={inputCls(false)}
              />
            </FieldGroup>
          )}

          {(isLaptop || isDesktop) && (
            <FieldGroup label={tE('gpuLabel')}>
              <input
                type="text"
                value={gpu}
                onChange={e => setGpu(e.target.value)}
                maxLength={80}
                className={inputCls(false)}
              />
            </FieldGroup>
          )}

          {(isLaptop || isDesktop) && (
            <FieldGroup label={tE('storageTypeLabel')}>
              <SelectInput
                value={storageType}
                onChange={setStorageType}
                options={STORAGE_TYPES.map(v => ({
                  value: v,
                  label: tE(`storageType.${v}` as any),
                }))}
              />
            </FieldGroup>
          )}

          {(isLaptop || isTv || isTablet) && (
            <FieldGroup
              label={`${tE('screenSizeInchesLabel')}${isTv || isLaptop ? ' *' : ''}`}
            >
              <input
                type="number"
                step="0.1"
                min={1}
                max={120}
                value={screenSizeInches}
                onChange={e => setScreenSizeInches(e.target.value)}
                className={inputCls(false)}
              />
            </FieldGroup>
          )}

          {isTv && (
            <FieldGroup label={`${tE('resolutionLabel')} *`}>
              <SelectInput
                value={resolution}
                onChange={setResolution}
                options={RESOLUTIONS.map(v => ({
                  value: v,
                  label: tE(`resolution.${v}` as any),
                }))}
              />
            </FieldGroup>
          )}

          {isLens && (
            <FieldGroup label={`${tE('lensMountLabel')} *`}>
              <SelectInput
                value={lensMount}
                onChange={setLensMount}
                options={LENS_MOUNTS.map(v => ({
                  value: v,
                  label: tE(`lensMount.${v}` as any),
                }))}
              />
            </FieldGroup>
          )}
        </div>

        {/* Connectivity chips */}
        <FieldGroup label={tE('connectivityLabel')}>
          <ChipRow
            values={CONNECTIVITY_OPTS}
            active={connectivity}
            multi
            onPick={v => setConnectivity(prev => toggleArrayValue(prev, v))}
            render={v => tE(`connectivity.${v}` as any)}
          />
        </FieldGroup>
      </Section>

      {/* ── Battery health (P4) ── */}
      {(isPhone || isTablet || isLaptop || isSmartWatch) && (
        <Section title={tE('sectionBattery')}>
          <FieldGroup
            label={`${tE('batteryHealthPctLabel')}${isSmartWatch ? ' *' : ''}`}
          >
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                value={batteryHealthPct}
                onChange={e => setBatteryHealthPct(e.target.value)}
                className={inputCls(false) + ' w-24'}
              />
              <span className="text-xs text-foreground/60">%</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                <div
                  className={`h-full transition-all ${batteryBandClass}`}
                  style={{ width: `${Math.min(100, Math.max(0, bhPct || 0))}%` }}
                />
              </div>
            </div>
            {batteryBand === 'unknown' && (
              <Hint className="text-amber-600 dark:text-amber-400">
                <AlertTriangle size={11} className="inline -mt-0.5 me-1" />
                {tE('batteryUndisclosedWarning')}
              </Hint>
            )}
          </FieldGroup>

          {(isLaptop || isDesktop) && (
            <FieldGroup label={tE('batteryCyclesLabel')}>
              <input
                type="number"
                min={0}
                max={5000}
                value={batteryCycles}
                onChange={e => setBatteryCycles(e.target.value)}
                className={inputCls(false)}
              />
              <Hint>{tE('batteryCyclesHint')}</Hint>
            </FieldGroup>
          )}
        </Section>
      )}

      {/* ── Region + carrier (P5) ── */}
      {(isPhone || isTablet) && (
        <Section title={tE('sectionRegionLock')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label={`${tE('regionSpecLabel')} *`}>
              <SelectInput
                value={regionSpec}
                onChange={setRegionSpec}
                options={REGIONS.map(v => ({
                  value: v,
                  label: tE(`region.${v}` as any),
                }))}
              />
            </FieldGroup>

            {isPhone && (
              <FieldGroup label={`${tE('carrierLockLabel')} *`}>
                <SelectInput
                  value={carrierLock}
                  onChange={setCarrierLock}
                  options={CARRIER_LOCKS.map(v => ({
                    value: v,
                    label: tE(`carrier.${v}` as any),
                  }))}
                />
              </FieldGroup>
            )}
          </div>
        </Section>
      )}

      {/* ── Condition + box + accessories ── */}
      <Section title={tE('sectionCondition')}>
        <FieldGroup label={`${tE('conditionGradeLabel')} *`}>
          <ChipRow
            values={CONDITION_GRADES}
            active={conditionGrade}
            onPick={setConditionGrade}
            render={v => tE(`grade.${v}` as any)}
          />
          <Hint>{tE(`gradeDescription.${conditionGrade}` as any) || tE('gradePickHint')}</Hint>
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label={tE('boxStatusLabel')}>
            <SelectInput
              value={boxStatus}
              onChange={setBoxStatus}
              options={BOX_STATUSES.map(v => ({
                value: v,
                label: tE(`box.${v}` as any),
              }))}
            />
          </FieldGroup>
          <FieldGroup label={tE('originalPartsLabel')}>
            <Toggle checked={originalParts} onChange={setOriginalParts}>
              {tE('originalPartsHelp')}
            </Toggle>
          </FieldGroup>
        </div>

        <FieldGroup label={tE('accessoriesIncludedLabel')}>
          <ChipRow
            values={ACCESSORIES}
            active={accessories}
            multi
            onPick={v => setAccessories(prev => toggleArrayValue(prev, v))}
            render={v => tE(`accessory.${v}` as any)}
          />
        </FieldGroup>

        <FieldGroup label={tE('repairHistoryLabel')}>
          <ChipRow
            values={REPAIR_KINDS}
            active={repairHistory}
            multi
            onPick={v => setRepairHistory(prev => toggleArrayValue(prev, v))}
            render={v => tE(`repair.${v}` as any)}
          />
          <Hint>{tE('repairHint')}</Hint>
        </FieldGroup>
      </Section>

      {/* ── Warranty + provenance (P6) ── */}
      <Section title={tE('sectionWarranty')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label={tE('warrantyStatusLabel')}>
            <SelectInput
              value={warrantyStatus}
              onChange={setWarrantyStatus}
              options={WARRANTY_STATUSES.map(v => ({
                value: v,
                label: tE(`warranty.${v}` as any),
              }))}
            />
          </FieldGroup>
          <FieldGroup label={tE('warrantyExpiresAtLabel')}>
            <input
              type="date"
              value={warrantyExpiresAt}
              onChange={e => setWarrantyExpiresAt(e.target.value)}
              className={inputCls(false)}
            />
          </FieldGroup>
          <FieldGroup label={tE('purchaseCountryLabel')}>
            <SelectInput
              value={purchaseCountry}
              onChange={setPurchaseCountry}
              options={PURCHASE_COUNTRIES.map(v => ({
                value: v,
                label: tE(`country.${v}` as any),
              }))}
            />
          </FieldGroup>
        </div>
        <FieldGroup label={tE('hasOriginalReceiptLabel')}>
          <Toggle checked={hasOriginalReceipt} onChange={setHasOriginalReceipt}>
            {tE('hasOriginalReceiptHelp')}
          </Toggle>
        </FieldGroup>
      </Section>

      {/* ── Trade (P11) ── */}
      <Section title={tE('sectionTrade')}>
        <Toggle checked={acceptsTrade} onChange={setAcceptsTrade}>
          {tE('acceptsTradeHelp')}
        </Toggle>
        {acceptsTrade && (
          <FieldGroup label={tE('tradeForModelsLabel')}>
            <input
              type="text"
              value={tradeForModels}
              onChange={e => setTradeForModels(e.target.value)}
              maxLength={200}
              placeholder={tE('tradeForModelsPlaceholder')}
              className={inputCls(false)}
            />
          </FieldGroup>
        )}
      </Section>

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
// Local presentation primitives
// ---------------------------------------------------------------------------

function inputCls(hasError: boolean) {
  return (
    'block h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
    (hasError ? 'border-rose-500/60' : 'border-border/60 focus:border-primary/40')
  );
}

function textareaCls(hasError: boolean) {
  return (
    'block w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ' +
    (hasError ? 'border-rose-500/60' : 'border-border/60 focus:border-primary/40')
  );
}

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-foreground/70">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Hint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[11px] text-foreground/55 ${className ?? ''}`}>{children}</p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border/40 pt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/55">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ChipRow<T extends string>({
  values,
  active,
  multi,
  onPick,
  render,
}: {
  values: ReadonlyArray<T>;
  active: T | string | string[];
  multi?: boolean;
  onPick: (v: T) => void;
  render: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map(v => {
        const isActive = multi
          ? Array.isArray(active) && (active as string[]).includes(v)
          : active === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onPick(v)}
            className={
              'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
              (isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10')
            }
          >
            {render(v)}
          </button>
        );
      })}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <option value="">—</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-start gap-2 text-sm text-foreground/85">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border/60"
      />
      <span>{children}</span>
    </label>
  );
}
