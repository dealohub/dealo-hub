'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Info,
  HelpCircle,
  Store,
  Lightbulb,
  Upload,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { saveDraft } from '@/lib/listings/actions';
import {
  searchElectronicsCatalog,
  checkImeiUnique,
  type ImeiCheckStatus,
} from '@/lib/electronics/actions';
import type { DeviceCatalogRow } from '@/lib/electronics/queries';
import type {
  ElectronicsCategoryKey,
  DeviceKind,
} from '@/lib/electronics/types';
import { DEVICE_KIND_BY_SUB_CAT } from '@/lib/electronics/types';
import type { Condition } from '@/lib/listings/validators';

/**
 * ElectronicsDetailsForm — Sell wizard, Step 3 branched for the
 * electronics parent category (Phase 7 v2).
 *
 * Seven guided questions, plain-language. Every technical concept
 * (IMEI, battery health, region, cosmetic grade) is wrapped in a
 * "How do I find this?" help popover, and every field carries a
 * visible "I don't know / skip" escape hatch. No jargon first.
 *
 * Question flow:
 *   Q1 — "What are you selling?"  → catalog autocomplete + fallback
 *   Q2 — "Where did you buy it?" → logo grid (13 GCC sources)
 *   Q3 — "How does it look?"     → 4 grade cards with SVG illustrations
 *   Q4 — "How's the battery?"    → numeric input + colored preview bar
 *                                  + per-platform how-to-find popover
 *                                  (hidden for non-battery devices)
 *   Q5 — "Any repairs?"          → 4 components × 3 states each
 *                                  (original / replaced / I'm not sure)
 *   Q6 — "Warranty & receipt?"   → warranty toggle + optional upload
 *   Q7 — "Open to a trade?"      → badal toggle + target free-text
 *
 * After Q7 the wizard saves to `listing_drafts.category_fields` and
 * routes to /sell/price, matching the Properties branch pattern.
 *
 * IMEI sub-flow: shown inline inside Q1 once the model is selected
 * (only for cellular device_kinds — phone / tablet / cellular watch).
 * Server check is debounced 500ms; result surfaces as inline chip
 * (green "Clean" / amber "Your prior listing" / red "Blocked").
 *
 * Receipt upload: delegated to the existing Storage pattern used by
 * the Step-2 media uploader — we attach a single file URL to the
 * draft under `receipt_url` for now. Verification of receipt
 * authenticity is deferred (Phase 8 QR partnership).
 */

// ---------------------------------------------------------------------------
// Static enum orderings (mirror validators.ts) — kept in sync manually
// because the wizard chooses display order independently of enum order
// ---------------------------------------------------------------------------

const PURCHASE_SOURCES = [
  'apple_store',
  'xcite',
  'eureka',
  'yousifi',
  'sharaf_dg',
  'jumbo',
  'jarir',
  'extra',
  'virgin',
  'carrier',
  'online',
  'imported',
  'other',
] as const;
type PurchaseSource = (typeof PURCHASE_SOURCES)[number];

const COSMETIC_GRADES = ['premium', 'excellent', 'good', 'fair'] as const;
type CosmeticGrade = (typeof COSMETIC_GRADES)[number];

const REPAIR_STATES = ['original', 'replaced', 'unknown'] as const;
type RepairState = (typeof REPAIR_STATES)[number];

const REPAIR_COMPONENTS = ['screen', 'battery', 'back_glass', 'camera'] as const;
type RepairComponent = (typeof REPAIR_COMPONENTS)[number];

type Answers = {
  // Q1
  modelSlug: string | null;
  brand: string;
  model: string;
  deviceKind: DeviceKind | null;
  storageGb: number | null;
  ramGb: number | null;
  screenSizeInches: number | null;
  resolution: string | null;
  // IMEI sub-flow
  serialOrImeiLast4: string;
  fullImeiForCheck: string; // not persisted, used for RPC only
  imeiStatus: ImeiCheckStatus | null;
  imeiSkipped: boolean;
  // Q2
  purchaseSource: PurchaseSource | null;
  // Q3
  cosmeticGrade: CosmeticGrade | null;
  // Q4
  batteryHealthPct: number | null;
  batteryDontKnow: boolean;
  // Q5 — per-component repair state
  repairScreen: RepairState | null;
  repairBattery: RepairState | null;
  repairBackGlass: RepairState | null;
  repairCamera: RepairState | null;
  // Q6
  warrantyActive: boolean | null;
  warrantyEndDate: string;
  hasOriginalReceipt: boolean | null;
  receiptUrl: string | null;
  // Q7
  acceptsTrade: boolean | null;
  tradeForModels: string;
};

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
// Helpers
// ---------------------------------------------------------------------------

function deviceKindHasBattery(kind: DeviceKind | null): boolean {
  if (!kind) return false;
  return (
    kind === 'phone' ||
    kind === 'tablet' ||
    kind === 'laptop' ||
    kind === 'smart_watch' ||
    kind === 'handheld_console' ||
    kind === 'headphones' ||
    kind === 'camera'
  );
}

function deviceKindIsCellular(kind: DeviceKind | null): boolean {
  if (!kind) return false;
  return kind === 'phone' || kind === 'tablet' || kind === 'smart_watch';
}

function deviceKindHasScreen(kind: DeviceKind | null): boolean {
  if (!kind) return false;
  return (
    kind === 'phone' ||
    kind === 'tablet' ||
    kind === 'laptop' ||
    kind === 'tv' ||
    kind === 'smart_watch' ||
    kind === 'handheld_console'
  );
}

function deviceKindHasBackGlass(kind: DeviceKind | null): boolean {
  if (!kind) return false;
  return kind === 'phone' || kind === 'tablet' || kind === 'smart_watch';
}

function deviceKindHasCamera(kind: DeviceKind | null): boolean {
  if (!kind) return false;
  return (
    kind === 'phone' ||
    kind === 'tablet' ||
    kind === 'laptop' ||
    kind === 'camera'
  );
}

function useDebounced<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// SVG grade illustrations — abstract phone silhouettes with increasing wear
// ---------------------------------------------------------------------------

function GradeIllustration({ grade }: { grade: CosmeticGrade }) {
  const strokeWidth = grade === 'premium' ? 1.2 : grade === 'excellent' ? 1.4 : 1.6;
  // Progressive scratch marks — more + denser as grade drops
  const scratches: Array<{ x1: number; y1: number; x2: number; y2: number; opacity: number }> = (() => {
    switch (grade) {
      case 'premium':
        return [];
      case 'excellent':
        return [{ x1: 35, y1: 55, x2: 50, y2: 57, opacity: 0.25 }];
      case 'good':
        return [
          { x1: 30, y1: 45, x2: 55, y2: 48, opacity: 0.35 },
          { x1: 40, y1: 90, x2: 62, y2: 92, opacity: 0.3 },
        ];
      case 'fair':
        return [
          { x1: 28, y1: 40, x2: 70, y2: 44, opacity: 0.5 },
          { x1: 25, y1: 80, x2: 68, y2: 85, opacity: 0.5 },
          { x1: 35, y1: 120, x2: 55, y2: 118, opacity: 0.4 },
          { x1: 48, y1: 150, x2: 72, y2: 155, opacity: 0.4 },
        ];
    }
  })();

  const cornerDent = grade === 'fair';

  return (
    <svg
      viewBox="0 0 100 180"
      className="h-24 w-full"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      {/* Phone body */}
      <rect
        x="20"
        y="10"
        width="60"
        height="160"
        rx="10"
        ry="10"
        className="text-foreground/30"
      />
      {/* Screen */}
      <rect
        x="25"
        y="18"
        width="50"
        height="144"
        rx="4"
        className="text-foreground/15"
        fill="currentColor"
        stroke="none"
      />
      {/* Speaker notch */}
      <rect
        x="42"
        y="14"
        width="16"
        height="2"
        rx="1"
        className="text-foreground/35"
        fill="currentColor"
        stroke="none"
      />
      {/* Scratches */}
      {scratches.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="currentColor"
          strokeWidth="0.8"
          opacity={s.opacity}
          className="text-foreground"
        />
      ))}
      {/* Corner dent for "fair" */}
      {cornerDent && (
        <path
          d="M70 10 L80 10 L80 22 Z"
          fill="currentColor"
          className="text-foreground/25"
          stroke="none"
        />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ElectronicsDetailsForm({ locale, initial }: Props) {
  const t = useTranslations('sell.step.electronics');
  const tErrors = useTranslations('sell.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const subCat = initial.subCatSlug;
  const f = initial.fields ?? {};

  // ── Wizard step state ─────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [error, setError] = useState<string | null>(null);

  // ── Answers ───────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Answers>(() => ({
    modelSlug: (f.model_slug as string | undefined) ?? null,
    brand: (f.brand as string | undefined) ?? initial.brand ?? '',
    model: (f.model as string | undefined) ?? initial.model ?? '',
    deviceKind:
      (f.device_kind as DeviceKind | undefined) ??
      (subCat
        ? DEVICE_KIND_BY_SUB_CAT[subCat]?.[0] ?? null
        : null),
    storageGb: (f.storage_gb as number | undefined) ?? null,
    ramGb: (f.ram_gb as number | undefined) ?? null,
    screenSizeInches: (f.screen_size_inches as number | undefined) ?? null,
    resolution: (f.resolution as string | undefined) ?? null,
    serialOrImeiLast4: (f.serial_or_imei_last_4 as string | undefined) ?? '',
    fullImeiForCheck: '',
    imeiStatus: null,
    imeiSkipped: false,
    purchaseSource: (f.purchase_source as PurchaseSource | undefined) ?? null,
    cosmeticGrade: (f.cosmetic_grade as CosmeticGrade | undefined) ?? null,
    batteryHealthPct: (f.battery_health_pct as number | undefined) ?? null,
    batteryDontKnow: false,
    repairScreen: (f.repair_screen as RepairState | undefined) ?? null,
    repairBattery: (f.repair_battery as RepairState | undefined) ?? null,
    repairBackGlass: (f.repair_back_glass as RepairState | undefined) ?? null,
    repairCamera: (f.repair_camera as RepairState | undefined) ?? null,
    warrantyActive: (f.warranty_active as boolean | undefined) ?? null,
    warrantyEndDate: (f.warranty_end_date as string | undefined) ?? '',
    hasOriginalReceipt: (f.has_original_receipt as boolean | undefined) ?? null,
    receiptUrl: (f.receipt_url as string | undefined) ?? null,
    acceptsTrade: (f.accepts_trade as boolean | undefined) ?? null,
    tradeForModels: (f.trade_for_models as string | undefined) ?? '',
  }));

  // ── Q1 catalog autocomplete ───────────────────────────────────────
  const [q1Search, setQ1Search] = useState('');
  const [q1Results, setQ1Results] = useState<DeviceCatalogRow[]>([]);
  const [q1Loading, setQ1Loading] = useState(false);
  const [q1UseOther, setQ1UseOther] = useState(!answers.modelSlug && !!answers.brand);
  const debouncedQ1Search = useDebounced(q1Search, 300);

  useEffect(() => {
    if (q1UseOther) return;
    const term = debouncedQ1Search.trim();
    if (term.length < 2) {
      setQ1Results([]);
      return;
    }
    setQ1Loading(true);
    searchElectronicsCatalog(term, subCat ?? null)
      .then(r => setQ1Results(r.rows))
      .catch(() => setQ1Results([]))
      .finally(() => setQ1Loading(false));
  }, [debouncedQ1Search, subCat, q1UseOther]);

  function pickCatalogRow(row: DeviceCatalogRow) {
    setAnswers(a => ({
      ...a,
      modelSlug: row.slug,
      brand: row.brand,
      model: row.model,
      deviceKind: row.deviceKind,
      storageGb: row.storageGb,
      ramGb: row.ramGb,
      screenSizeInches: row.screenSizeInches,
    }));
    setQ1Search(row.displayName);
    setQ1Results([]);
  }

  // ── IMEI sub-flow (live debounced check) ──────────────────────────
  const debouncedFullImei = useDebounced(answers.fullImeiForCheck, 500);
  const [imeiChecking, setImeiChecking] = useState(false);

  useEffect(() => {
    if (answers.imeiSkipped) return;
    const clean = debouncedFullImei.replace(/\s+/g, '');
    if (clean.length < 6) {
      setAnswers(a => ({ ...a, imeiStatus: null }));
      return;
    }
    setImeiChecking(true);
    checkImeiUnique(clean)
      .then(status => {
        setAnswers(a => ({
          ...a,
          imeiStatus: status,
          serialOrImeiLast4: clean.slice(-4).toUpperCase(),
        }));
      })
      .catch(() =>
        setAnswers(a => ({ ...a, imeiStatus: 'error' as ImeiCheckStatus })),
      )
      .finally(() => setImeiChecking(false));
  }, [debouncedFullImei, answers.imeiSkipped]);

  // ── Per-step validation ──────────────────────────────────────────
  const hasBattery = deviceKindHasBattery(answers.deviceKind);
  const hasScreen = deviceKindHasScreen(answers.deviceKind);
  const hasBackGlass = deviceKindHasBackGlass(answers.deviceKind);
  const hasCamera = deviceKindHasCamera(answers.deviceKind);
  const isCellular = deviceKindIsCellular(answers.deviceKind);

  const q1Valid =
    (!!answers.modelSlug ||
      (q1UseOther && answers.brand.trim().length > 0 && answers.model.trim().length > 0)) &&
    !!answers.deviceKind &&
    // IMEI flow: cellular devices need either a valid 'clean'/'own_listing' status, or skipped
    (!isCellular ||
      answers.imeiSkipped ||
      answers.imeiStatus === 'clean' ||
      answers.imeiStatus === 'own_listing');
  const q2Valid = !!answers.purchaseSource;
  const q3Valid = !!answers.cosmeticGrade;
  const q4Valid =
    !hasBattery ||
    answers.batteryDontKnow ||
    (answers.batteryHealthPct != null &&
      answers.batteryHealthPct >= 0 &&
      answers.batteryHealthPct <= 100);
  const q5Valid = true; // all components optional
  const q6Valid = true; // all optional
  const q7Valid = answers.acceptsTrade != null;

  const stepValid =
    step === 1 ? q1Valid
    : step === 2 ? q2Valid
    : step === 3 ? q3Valid
    : step === 4 ? q4Valid
    : step === 5 ? q5Valid
    : step === 6 ? q6Valid
    : step === 7 ? q7Valid
    : false;

  // ── Build category_fields for draft save ──────────────────────────
  const categoryFields = useMemo(() => {
    const out: Record<string, unknown> = {};
    if (answers.modelSlug) out.model_slug = answers.modelSlug;
    if (answers.brand.trim()) out.brand = answers.brand.trim();
    if (answers.model.trim()) out.model = answers.model.trim();
    if (answers.deviceKind) out.device_kind = answers.deviceKind;
    if (answers.storageGb != null) out.storage_gb = answers.storageGb;
    if (answers.ramGb != null) out.ram_gb = answers.ramGb;
    if (answers.screenSizeInches != null) out.screen_size_inches = answers.screenSizeInches;
    if (answers.resolution) out.resolution = answers.resolution;
    if (answers.serialOrImeiLast4 && !answers.imeiSkipped) {
      out.serial_or_imei_last_4 = answers.serialOrImeiLast4;
    }
    if (answers.purchaseSource) out.purchase_source = answers.purchaseSource;
    if (answers.cosmeticGrade) out.cosmetic_grade = answers.cosmeticGrade;
    if (answers.batteryHealthPct != null && !answers.batteryDontKnow) {
      out.battery_health_pct = answers.batteryHealthPct;
    }
    if (answers.repairScreen) out.repair_screen = answers.repairScreen;
    if (answers.repairBattery) out.repair_battery = answers.repairBattery;
    if (answers.repairBackGlass) out.repair_back_glass = answers.repairBackGlass;
    if (answers.repairCamera) out.repair_camera = answers.repairCamera;
    if (answers.warrantyActive != null) out.warranty_active = answers.warrantyActive;
    if (answers.warrantyEndDate && /^\d{4}-\d{2}-\d{2}$/.test(answers.warrantyEndDate)) {
      out.warranty_end_date = answers.warrantyEndDate;
    }
    if (answers.hasOriginalReceipt != null)
      out.has_original_receipt = answers.hasOriginalReceipt;
    if (answers.receiptUrl) out.receipt_url = answers.receiptUrl;
    out.accessories_included = [];
    if (answers.acceptsTrade != null) out.accepts_trade = answers.acceptsTrade;
    if (answers.tradeForModels.trim()) out.trade_for_models = answers.tradeForModels.trim();
    return out;
  }, [answers]);

  // Auto-generated title from catalog row (so DetailsForm.title isn't empty)
  const autoTitle = useMemo(() => {
    if (answers.modelSlug) {
      return [answers.brand, answers.model, answers.storageGb ? `${answers.storageGb}GB` : ''].filter(Boolean).join(' ');
    }
    return [answers.brand, answers.model].filter(Boolean).join(' ');
  }, [answers]);

  async function handleFinish() {
    setError(null);
    startTransition(async () => {
      const result = await saveDraft({
        title: autoTitle || initial.title || 'Electronics listing',
        description: initial.description ?? '',
        condition: initial.condition ?? 'excellent_used',
        brand: answers.brand.trim() || null,
        model: answers.model.trim() || null,
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
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>{t('step', { current: step, total: totalSteps })}</span>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={
                'h-1.5 w-6 rounded-full ' +
                (i + 1 < step
                  ? 'bg-primary'
                  : i + 1 === step
                    ? 'bg-primary/60'
                    : 'bg-foreground/10')
              }
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <Q1WhatAreYouSelling
          answers={answers}
          setAnswers={setAnswers}
          subCat={subCat}
          q1Search={q1Search}
          setQ1Search={setQ1Search}
          q1Results={q1Results}
          q1Loading={q1Loading}
          q1UseOther={q1UseOther}
          setQ1UseOther={setQ1UseOther}
          pickCatalogRow={pickCatalogRow}
          isCellular={isCellular}
          imeiChecking={imeiChecking}
          t={t}
          locale={locale}
        />
      )}

      {step === 2 && <Q2PurchaseSource answers={answers} setAnswers={setAnswers} t={t} />}

      {step === 3 && <Q3CosmeticGrade answers={answers} setAnswers={setAnswers} t={t} />}

      {step === 4 && hasBattery && (
        <Q4Battery answers={answers} setAnswers={setAnswers} t={t} />
      )}
      {step === 4 && !hasBattery && (
        <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-6 text-center text-sm text-foreground/65">
          {t('q4.notApplicable')}
        </div>
      )}

      {step === 5 && (
        <Q5Repairs
          answers={answers}
          setAnswers={setAnswers}
          hasScreen={hasScreen}
          hasBattery={hasBattery}
          hasBackGlass={hasBackGlass}
          hasCamera={hasCamera}
          t={t}
        />
      )}

      {step === 6 && <Q6WarrantyReceipt answers={answers} setAnswers={setAnswers} t={t} />}

      {step === 7 && <Q7Badal answers={answers} setAnswers={setAnswers} t={t} />}

      {/* Photo hints banner (appears once a device_kind is known) */}
      {step === 1 && answers.deviceKind && <PhotoHints deviceKind={answers.deviceKind} t={t} />}

      {/* Navigation */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1 || isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground/75 transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('back')}
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
            disabled={!stepValid || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('continue')}
            <ArrowRight size={14} className="rtl:rotate-180" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!stepValid || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                {t('continue')}
                <ArrowRight size={14} className="rtl:rotate-180" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-question components
// ---------------------------------------------------------------------------

interface QProps {
  answers: Answers;
  setAnswers: React.Dispatch<React.SetStateAction<Answers>>;
  t: (key: any, values?: any) => string;
}

function Q1WhatAreYouSelling(props: QProps & {
  subCat: ElectronicsCategoryKey | null;
  q1Search: string;
  setQ1Search: (s: string) => void;
  q1Results: DeviceCatalogRow[];
  q1Loading: boolean;
  q1UseOther: boolean;
  setQ1UseOther: (b: boolean) => void;
  pickCatalogRow: (row: DeviceCatalogRow) => void;
  isCellular: boolean;
  imeiChecking: boolean;
  locale: 'ar' | 'en';
}) {
  const {
    answers, setAnswers,
    q1Search, setQ1Search,
    q1Results, q1Loading,
    q1UseOther, setQ1UseOther,
    pickCatalogRow, isCellular, imeiChecking, t,
  } = props;

  return (
    <div className="space-y-5">
      <QHeader title={t('q1.title')} subtitle={t('q1.subtitle')} />

      {!q1UseOther ? (
        <div className="space-y-2">
          <input
            type="text"
            value={q1Search}
            onChange={e => setQ1Search(e.target.value)}
            placeholder={t('q1.searchPlaceholder')}
            className="block h-12 w-full rounded-xl border border-border/60 bg-background px-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {q1Loading && (
            <p className="flex items-center gap-1.5 text-xs text-foreground/55">
              <Loader2 size={12} className="animate-spin" />
              …
            </p>
          )}
          {q1Results.length > 0 && (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-background shadow-sm">
              {q1Results.map(row => (
                <button
                  key={row.slug}
                  type="button"
                  onClick={() => pickCatalogRow(row)}
                  className={
                    'flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-start text-sm transition last:border-b-0 ' +
                    (answers.modelSlug === row.slug
                      ? 'bg-primary/5'
                      : 'hover:bg-foreground/[0.03]')
                  }
                >
                  {answers.modelSlug === row.slug && (
                    <Check size={14} className="shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {row.displayName}
                    </p>
                    <p className="truncate text-[11px] text-foreground/55">
                      {row.brand} · {row.releaseYear ?? '—'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!q1Loading && q1Search.trim().length >= 2 && q1Results.length === 0 && (
            <p className="text-xs text-foreground/55">{t('q1.emptyHint')}</p>
          )}
          <button
            type="button"
            onClick={() => setQ1UseOther(true)}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            {t('q1.otherLabel')}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup label={t('q1.otherBrandLabel')} required>
            <input
              type="text"
              value={answers.brand}
              onChange={e => setAnswers(a => ({ ...a, brand: e.target.value }))}
              placeholder="Apple"
              className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FieldGroup>
          <FieldGroup label={t('q1.otherModelLabel')} required>
            <input
              type="text"
              value={answers.model}
              onChange={e => setAnswers(a => ({ ...a, model: e.target.value }))}
              placeholder="iPhone 15 Pro Max"
              className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FieldGroup>
          <button
            type="button"
            onClick={() => setQ1UseOther(false)}
            className="col-span-full text-xs text-foreground/55 hover:text-foreground"
          >
            ← {t('q1.searchPlaceholder')}
          </button>
        </div>
      )}

      {/* Selected model summary */}
      {(answers.modelSlug || (q1UseOther && answers.brand)) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {answers.brand}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {answers.model}
            {answers.storageGb ? ` · ${answers.storageGb} GB` : ''}
          </p>
        </div>
      )}

      {/* IMEI sub-flow — only for cellular devices */}
      {isCellular && (
        <ImeiInput
          answers={answers}
          setAnswers={setAnswers}
          imeiChecking={imeiChecking}
          t={t}
        />
      )}
    </div>
  );
}

function ImeiInput({
  answers,
  setAnswers,
  imeiChecking,
  t,
}: QProps & { imeiChecking: boolean }) {
  const [showHelp, setShowHelp] = useState(false);

  const statusChip =
    answers.imeiStatus === 'clean' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/25">
        <ShieldCheck size={11} />
        {t('imei.checkClean')}
      </span>
    ) : answers.imeiStatus === 'own_listing' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/25">
        <Info size={11} />
        {t('imei.checkOwnListing')}
      </span>
    ) : answers.imeiStatus === 'blocked' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-500/25">
        <ShieldAlert size={11} />
        {t('imei.checkBlocked')}
      </span>
    ) : null;

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-foreground/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {t('imei.label')}
          <button
            type="button"
            onClick={() => setShowHelp(s => !s)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/60 hover:bg-foreground/10"
            aria-label={t('imei.helpTitle')}
          >
            <HelpCircle size={11} />
          </button>
        </label>
        {imeiChecking && (
          <span className="inline-flex items-center gap-1 text-[11px] text-foreground/55">
            <Loader2 size={11} className="animate-spin" />
            {t('imei.checking')}
          </span>
        )}
      </div>

      {showHelp && (
        <ul className="list-disc rounded-lg bg-background px-5 py-3 text-[12px] leading-relaxed text-foreground/70 marker:text-foreground/35">
          <li>{t('imei.helpIphone')}</li>
          <li>{t('imei.helpAndroid')}</li>
          <li>{t('imei.helpWatch')}</li>
        </ul>
      )}

      <input
        type="text"
        value={answers.fullImeiForCheck}
        onChange={e =>
          setAnswers(a => ({
            ...a,
            fullImeiForCheck: e.target.value,
            imeiSkipped: false,
          }))
        }
        placeholder={t('imei.placeholder')}
        disabled={answers.imeiSkipped}
        className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
      />

      {statusChip}

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-foreground/55">{t('imei.privacyNote')}</span>
        <button
          type="button"
          onClick={() =>
            setAnswers(a => ({
              ...a,
              imeiSkipped: !a.imeiSkipped,
              imeiStatus: null,
              fullImeiForCheck: '',
            }))
          }
          className="shrink-0 rounded-md bg-foreground/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground/70 hover:bg-foreground/10"
        >
          {answers.imeiSkipped ? t('imei.label') : t('imei.skip')}
        </button>
      </div>
      {answers.imeiSkipped && (
        <p className="inline-flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          {t('imei.skipWarning')}
        </p>
      )}
    </div>
  );
}

function Q2PurchaseSource({ answers, setAnswers, t }: QProps) {
  return (
    <div className="space-y-5">
      <QHeader title={t('q2.title')} subtitle={t('q2.subtitle')} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {PURCHASE_SOURCES.map(src => {
          const active = answers.purchaseSource === src;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setAnswers(a => ({ ...a, purchaseSource: src }))}
              className={
                'flex items-center gap-2 rounded-xl border px-3 py-3 text-start text-sm transition ' +
                (active
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
              }
            >
              <span
                className={
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' +
                  (active ? 'bg-primary/15 text-primary' : 'bg-foreground/5 text-foreground/55')
                }
              >
                <Store size={14} />
              </span>
              <span className="flex-1 font-medium text-foreground">
                {t(`purchaseSource.${src}` as any)}
              </span>
              {active && <Check size={14} className="shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Q3CosmeticGrade({ answers, setAnswers, t }: QProps) {
  return (
    <div className="space-y-5">
      <QHeader title={t('q3.title')} subtitle={t('q3.subtitle')} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COSMETIC_GRADES.map(g => {
          const active = answers.cosmeticGrade === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setAnswers(a => ({ ...a, cosmeticGrade: g }))}
              className={
                'flex flex-col items-center gap-2 rounded-2xl border px-4 py-4 text-center transition ' +
                (active
                  ? 'border-primary bg-primary/[0.04] shadow-sm ring-2 ring-primary/20'
                  : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
              }
            >
              <GradeIllustration grade={g} />
              <span
                className={
                  'text-sm font-semibold ' +
                  (active ? 'text-primary' : 'text-foreground')
                }
              >
                {t(`q3.grade.${g}` as any)}
              </span>
              <span className="text-[11px] leading-snug text-foreground/55">
                {t(`q3.gradeDescription.${g}` as any)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Q4Battery({ answers, setAnswers, t }: QProps) {
  const [showHelp, setShowHelp] = useState(false);
  const pct = answers.batteryHealthPct;
  const fillColor =
    pct == null
      ? 'bg-foreground/20'
      : pct >= 85
        ? 'bg-emerald-500'
        : pct >= 70
          ? 'bg-amber-500'
          : 'bg-rose-500';

  return (
    <div className="space-y-5">
      <QHeader title={t('q4.title')} subtitle={t('q4.subtitle')} />

      <div className="space-y-3 rounded-xl border border-border/60 bg-foreground/[0.02] p-4">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            value={pct ?? ''}
            onChange={e =>
              setAnswers(a => ({
                ...a,
                batteryHealthPct: e.target.value ? Number.parseInt(e.target.value, 10) : null,
                batteryDontKnow: false,
              }))
            }
            disabled={answers.batteryDontKnow}
            placeholder={t('q4.placeholder')}
            className="block h-12 w-24 rounded-lg border border-border/60 bg-background px-3 text-center text-base font-semibold text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40"
          />
          <span className="text-sm text-foreground/65">%</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div
              className={`h-full transition-all ${fillColor}`}
              style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setShowHelp(s => !s)}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <HelpCircle size={11} />
            {t('q4.helpLabel')}
          </button>
          <button
            type="button"
            onClick={() =>
              setAnswers(a => ({
                ...a,
                batteryDontKnow: !a.batteryDontKnow,
                batteryHealthPct: null,
              }))
            }
            className={
              'rounded-md px-2.5 py-1 font-medium transition ' +
              (answers.batteryDontKnow
                ? 'bg-primary/15 text-primary'
                : 'bg-foreground/[0.06] text-foreground/70 hover:bg-foreground/10')
            }
          >
            {t('q4.dontKnow')}
          </button>
        </div>

        {showHelp && (
          <ul className="list-disc rounded-lg bg-background px-5 py-3 text-[12px] leading-relaxed text-foreground/70 marker:text-foreground/35">
            <li>{t('q4.helpIos')}</li>
            <li>{t('q4.helpAndroid')}</li>
            <li>{t('q4.helpLaptop')}</li>
            <li>{t('q4.helpWatch')}</li>
          </ul>
        )}
      </div>
    </div>
  );
}

function Q5Repairs(props: QProps & {
  hasScreen: boolean;
  hasBattery: boolean;
  hasBackGlass: boolean;
  hasCamera: boolean;
}) {
  const { answers, setAnswers, hasScreen, hasBattery, hasBackGlass, hasCamera, t } = props;

  const items: Array<{
    key: RepairComponent;
    show: boolean;
    field: keyof Pick<Answers, 'repairScreen' | 'repairBattery' | 'repairBackGlass' | 'repairCamera'>;
  }> = [
    { key: 'screen', show: hasScreen, field: 'repairScreen' },
    { key: 'battery', show: hasBattery, field: 'repairBattery' },
    { key: 'back_glass', show: hasBackGlass, field: 'repairBackGlass' },
    { key: 'camera', show: hasCamera, field: 'repairCamera' },
  ];

  return (
    <div className="space-y-5">
      <QHeader title={t('q5.title')} subtitle={t('q5.subtitle')} />
      <div className="space-y-3">
        {items.filter(i => i.show).map(item => (
          <div
            key={item.key}
            className="rounded-xl border border-border/60 bg-background p-4"
          >
            <p className="mb-2 text-sm font-semibold text-foreground">
              {t(`q5.componentLabel.${item.key}` as any)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REPAIR_STATES.map(state => {
                const active = answers[item.field] === state;
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() =>
                      setAnswers(a => ({ ...a, [item.field]: state } as Answers))
                    }
                    className={
                      'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                      (active
                        ? state === 'original'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25'
                          : state === 'replaced'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25'
                            : 'bg-foreground/[0.08] text-foreground/75 ring-1 ring-inset ring-foreground/15'
                        : 'bg-foreground/[0.04] text-foreground/65 hover:bg-foreground/[0.08]')
                    }
                  >
                    {t(`q5.stateLabel.${state}` as any)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Q6WarrantyReceipt({ answers, setAnswers, t }: QProps) {
  const [uploading, setUploading] = useState(false);

  async function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Reuse the existing media upload endpoint pattern if available,
      // otherwise use a data-URL placeholder. Phase 7 v2 ships the
      // plumbing; a proper Storage bucket for receipts ships later.
      const reader = new FileReader();
      reader.onload = () => {
        setAnswers(a => ({ ...a, receiptUrl: reader.result as string }));
        setUploading(false);
      };
      reader.onerror = () => setUploading(false);
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <QHeader title={t('q6.title')} subtitle={t('q6.subtitle')} />

      {/* Warranty */}
      <div className="space-y-2 rounded-xl border border-border/60 bg-background p-4">
        <p className="text-sm font-semibold text-foreground">
          {t('q6.warrantyLabel')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setAnswers(a => ({ ...a, warrantyActive: true }))}
            className={
              'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
              (answers.warrantyActive === true
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25'
                : 'bg-foreground/[0.04] text-foreground/65 hover:bg-foreground/[0.08]')
            }
          >
            {t('q6.warrantyYes')}
          </button>
          <button
            type="button"
            onClick={() => setAnswers(a => ({ ...a, warrantyActive: false, warrantyEndDate: '' }))}
            className={
              'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
              (answers.warrantyActive === false
                ? 'bg-foreground/[0.08] text-foreground/75 ring-1 ring-inset ring-foreground/15'
                : 'bg-foreground/[0.04] text-foreground/65 hover:bg-foreground/[0.08]')
            }
          >
            {t('q6.warrantyNo')}
          </button>
        </div>
        {answers.warrantyActive && (
          <div className="mt-2">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-foreground/60">
              {t('q6.warrantyEndDate')}
            </label>
            <input
              type="date"
              value={answers.warrantyEndDate}
              onChange={e => setAnswers(a => ({ ...a, warrantyEndDate: e.target.value }))}
              className="mt-1.5 block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
      </div>

      {/* Receipt */}
      <div className="space-y-2 rounded-xl border border-border/60 bg-background p-4">
        <p className="text-sm font-semibold text-foreground">
          {t('q6.receiptLabel')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setAnswers(a => ({ ...a, hasOriginalReceipt: true }))}
            className={
              'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
              (answers.hasOriginalReceipt === true
                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25'
                : 'bg-foreground/[0.04] text-foreground/65 hover:bg-foreground/[0.08]')
            }
          >
            {t('q6.warrantyYes')}
          </button>
          <button
            type="button"
            onClick={() =>
              setAnswers(a => ({ ...a, hasOriginalReceipt: false, receiptUrl: null }))
            }
            className={
              'rounded-full px-3 py-1.5 text-xs font-medium transition ' +
              (answers.hasOriginalReceipt === false
                ? 'bg-foreground/[0.08] text-foreground/75 ring-1 ring-inset ring-foreground/15'
                : 'bg-foreground/[0.04] text-foreground/65 hover:bg-foreground/[0.08]')
            }
          >
            {t('q6.warrantyNo')}
          </button>
        </div>
        {answers.hasOriginalReceipt && (
          <div className="mt-2 space-y-1.5">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/60 bg-foreground/[0.02] px-4 py-3 text-xs font-medium text-foreground/75 hover:bg-foreground/[0.05]">
              {uploading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  …
                </>
              ) : answers.receiptUrl ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  {t('q6.receiptUpload')}
                </>
              ) : (
                <>
                  <Upload size={12} />
                  {t('q6.receiptUpload')}
                </>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleReceiptChange}
                className="sr-only"
              />
            </label>
            <p className="text-[11px] text-foreground/55">{t('q6.receiptHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Q7Badal({ answers, setAnswers, t }: QProps) {
  return (
    <div className="space-y-5">
      <QHeader title={t('q7.title')} subtitle={t('q7.subtitle')} />
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAnswers(a => ({ ...a, acceptsTrade: true }))}
          className={
            'rounded-xl border px-4 py-4 text-start transition ' +
            (answers.acceptsTrade === true
              ? 'border-indigo-500 bg-indigo-500/[0.05] ring-2 ring-indigo-500/20'
              : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
          }
        >
          <span className="text-sm font-semibold text-foreground">
            {t('q7.acceptsYes')}
          </span>
        </button>
        <button
          type="button"
          onClick={() =>
            setAnswers(a => ({ ...a, acceptsTrade: false, tradeForModels: '' }))
          }
          className={
            'rounded-xl border px-4 py-4 text-start transition ' +
            (answers.acceptsTrade === false
              ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
              : 'border-border/60 bg-background hover:border-border hover:bg-foreground/[0.02]')
          }
        >
          <span className="text-sm font-semibold text-foreground">
            {t('q7.acceptsNo')}
          </span>
        </button>
      </div>

      {answers.acceptsTrade && (
        <FieldGroup label={t('q7.targetLabel')}>
          <input
            type="text"
            value={answers.tradeForModels}
            onChange={e =>
              setAnswers(a => ({ ...a, tradeForModels: e.target.value }))
            }
            placeholder={t('q7.targetPlaceholder')}
            maxLength={200}
            className="block h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldGroup>
      )}
    </div>
  );
}

function PhotoHints({ deviceKind, t }: { deviceKind: DeviceKind; t: (k: any) => string }) {
  const key =
    deviceKind === 'phone' || deviceKind === 'tablet'
      ? 'phone'
      : deviceKind === 'laptop' || deviceKind === 'desktop'
        ? 'laptop'
        : deviceKind === 'tv' || deviceKind === 'soundbar' || deviceKind === 'speaker' || deviceKind === 'headphones'
          ? 'tv'
          : deviceKind === 'console' || deviceKind === 'handheld_console'
            ? 'console'
            : deviceKind === 'smart_watch'
              ? 'watch'
              : 'camera';

  const hints = t(`photoHints.${key}`) as unknown as string[] | string;
  const list = Array.isArray(hints) ? hints : [];
  if (list.length === 0) return null;

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-foreground/[0.02] p-4">
      <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
        <Lightbulb size={11} className="text-amber-600" />
        {t('photoHints.title')}
      </p>
      <p className="mb-2 text-[12px] text-foreground/60">{t('photoHints.body')}</p>
      <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-foreground/75 marker:text-foreground/35">
        {list.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI primitives
// ---------------------------------------------------------------------------

function QHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="space-y-1">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="text-sm text-foreground/60">{subtitle}</p>
    </header>
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
