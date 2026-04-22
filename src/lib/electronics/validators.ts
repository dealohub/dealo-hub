import { z } from 'zod';
import type { ElectronicsCategoryKey, DeviceKind } from './types';
import { DEVICE_KIND_BY_SUB_CAT } from './types';

/**
 * ElectronicsFields — Zod schema for `listings.category_fields` JSONB
 * on electronics listings (v2).
 *
 * Design:
 *   - Raw schema = snake_case (mirrors DB) + `.passthrough()` for
 *     forward-compat
 *   - `validateElectronicsFieldsRawV2(raw, subCat)` layers sub-cat
 *     conditional requirements on top
 *   - `toElectronicsFields()` emits camelCase for consumers
 *
 * **What changed from v1 (deleted Phase 7 iteration):**
 *   - DROPPED `region_spec` enum — implicit via `purchase_source`
 *     (imported → warranty warning; GCC retailer → local warranty)
 *   - DROPPED `carrier_lock` enum — ≥95% of GCC phones are unlocked;
 *     edge cases go in description
 *   - DROPPED `installment_remaining_months` — unnecessary complexity
 *   - DROPPED separate `battery_tier` enum — single `battery_health_pct`
 *     number with UI-side band calculation (green/amber/red)
 *   - ADDED 4-way repair disclosure PER COMPONENT (screen / battery /
 *     back_glass / camera), each with 3 states: original / replaced /
 *     unknown — mirrors how sellers on Q84Sale + OpenSooq actually
 *     describe devices ("مبدل شاشة أصلية" vs "مبدل شاشة خارجية")
 *   - ADDED `purchase_source` GCC-wide enum (13 entries) — single
 *     field captures retailer provenance + warranty implication
 *   - WIDENED counterfeit blocklist from 6 terms to 16 (EN + AR,
 *     verified live on Gulf platforms)
 *
 * Schema is intentionally smaller than v1: 14 fields instead of 28,
 * half optional. Focus on signals that move close-rate, not
 * exhaustive cataloguing.
 *
 * Reference: planning/PHASE-7A-ELECTRONICS-V2.md (pillars P1-P9)
 *            planning/research-7a-v2/00-SYNTHESIS.md
 */

// ---------------------------------------------------------------------------
// Literal enums
// ---------------------------------------------------------------------------

export const DeviceKindSchema = z.enum([
  'phone',
  'tablet',
  'laptop',
  'desktop',
  'tv',
  'soundbar',
  'headphones',
  'speaker',
  'console',
  'handheld_console',
  'accessory',
  'smart_watch',
  'camera',
  'lens',
]);

/**
 * Cosmetic grade — 4-way ladder copied from Swappa + Reebelo + Back
 * Market (they've converged on this exact shape). Plain-language
 * UX-facing labels live in i18n; schema uses the canonical slug.
 */
export const CosmeticGradeSchema = z.enum([
  'premium', // "Like new — no visible wear"
  'excellent', // "Very light wear, fully functional"
  'good', // "Visible wear, fully functional"
  'fair', // "Heavy wear, may show issues but works"
]);

/**
 * Per-component repair state. Mirrors the Gulf seller vocabulary
 * where "مبدل شاشة" (screen replaced) is a meaningful disclosure.
 * 3-way keeps UX simple — no need for the 4-tier "aftermarket-premium /
 * aftermarket-generic" split (the buyer asks in chat if they care).
 */
export const RepairStateSchema = z.enum([
  'original', // never touched / factory original
  'replaced', // replaced (OEM or aftermarket — seller can elaborate)
  'unknown', // seller doesn't know
]);

export const StorageTypeSchema = z.enum(['ssd', 'hdd', 'nvme', 'hybrid', 'emmc']);

export const ResolutionSchema = z.enum(['hd', 'fhd', '2k', '4k', '8k']);

/** Accessories shipped with the device — multi-select. */
export const AccessorySchema = z.enum([
  'original_box',
  'charger',
  'cable',
  'earphones',
  'case',
  'stand',
  'receipt', // original receipt included
]);

/**
 * Purchase source — GCC-wide retailer enum. Covers the top 12
 * purchase channels across Kuwait / UAE / Saudi / Qatar / Bahrain /
 * Oman. `imported` is a first-class value because grey-market imports
 * are the single biggest warranty-risk signal (Track C §6).
 *
 * Seller-facing UX: grid of logos in the wizard; sellers pick one.
 * No free-text typing — eliminates misspellings + provenance ambiguity.
 */
export const PurchaseSourceSchema = z.enum([
  'apple_store', // Apple Store Avenues KW / Mall of Emirates UAE / Kingdom KSA etc.
  'xcite', // X-cite KW (Alghanim)
  'eureka', // Eureka KW
  'yousifi', // Best Al-Yousifi KW
  'sharaf_dg', // Sharaf DG (UAE / KW)
  'jumbo', // Jumbo Electronics UAE
  'jarir', // Jarir KSA / KW / Qatar
  'extra', // eXtra KSA
  'virgin', // Virgin Megastore UAE / Qatar
  'carrier', // any GCC telco — Zain / STC / Ooredoo / du / Etisalat / Mobily
  'online', // noon / amazon / etc.
  'imported', // grey market — warranty warning triggered
  'other', // fallback; seller can describe in text field
]);

/** GCC lens mounts — cameras sub-cat only. */
export const LensMountSchema = z.enum([
  'canon_ef',
  'canon_rf',
  'sony_e',
  'nikon_f',
  'nikon_z',
  'm43',
  'leica_m',
  'other',
]);

// ---------------------------------------------------------------------------
// Counterfeit blocklist (P7) — widened from v1 using research evidence
// ---------------------------------------------------------------------------

/**
 * Arabic counterfeit terms harvested from:
 *   - research-7a-v2/01-GULF-LIVE-OBSERVATION.md (live listings on
 *     Dubizzle KW + OpenSooq KW showing "COPY A" + "شبيه الاصلي")
 *   - research-7a-v2/03-KUWAIT-CULTURAL.md (Arabic detection
 *     vocabulary from YouTube review channels)
 *
 * Applied at publish time on combined title + description + brand +
 * model text via `containsElectronicsCounterfeitTerm()`. Rejection
 * UX: submit blocked with translation key
 * `counterfeit_term_not_allowed`.
 */
const COUNTERFEIT_TERMS_EN: ReadonlyArray<string> = [
  '1st copy',
  'first copy',
  'high copy',
  'high quality copy',
  'master copy',
  'mirror copy',
  'aaa copy',
  'aaa replica',
  'super copy',
  'replica',
  'reproduction',
  'knockoff',
  'knock-off',
  'clone',
  'fake',
  'counterfeit',
];

const COUNTERFEIT_TERMS_AR: ReadonlyArray<string> = [
  'كوبي',
  'هاي كوبي',
  'ماستر كوبي',
  'فيرست هاي كوبي',
  'مستر كوبي',
  'شبيه الاصلي',
  'شبيه الأصلي',
  'تقليد',
  'مستنسخ',
  'نسخة طبق الأصل',
  'درجة ثانية',
  'درجه ثانيه',
  'كلاس وان',
];

/**
 * Check whether a combined text blob contains any counterfeit-trigger
 * term (EN or AR). Case-insensitive for Latin text. Returns true on
 * first match — caller reports back the generic "not allowed" error;
 * we don't leak which specific term matched (harder for bad actors
 * to iterate around).
 */
export function containsElectronicsCounterfeitTerm(text: string): boolean {
  const lower = text.toLowerCase();
  for (const term of COUNTERFEIT_TERMS_EN) {
    if (lower.includes(term)) return true;
  }
  for (const term of COUNTERFEIT_TERMS_AR) {
    if (text.includes(term)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Raw schema (snake_case, pre-transform)
// ---------------------------------------------------------------------------

export const ElectronicsFieldsRaw = z
  .object({
    // Identity (5)
    device_kind: DeviceKindSchema,
    /** FK to `electronics_device_catalog.slug`. Free-text fallback if
     *  the model isn't in the catalog yet. v2 catalog ships ~40 models. */
    model_slug: z.string().trim().min(1).max(120).optional(),
    brand: z.string().trim().min(1).max(60),
    model: z.string().trim().min(1).max(120),
    year_of_purchase: z
      .number()
      .int()
      .min(2000)
      .max(new Date().getFullYear() + 1)
      .optional(),

    // Specs (5 — sub-cat-driven)
    storage_gb: z.number().int().min(1).max(64_000).optional(),
    ram_gb: z.number().int().min(1).max(2_048).optional(),
    screen_size_inches: z.number().min(1).max(120).optional(),
    resolution: ResolutionSchema.optional(),
    storage_type: StorageTypeSchema.optional(),
    lens_mount: LensMountSchema.optional(),

    // Condition (3)
    cosmetic_grade: CosmeticGradeSchema,
    /** 0-100 — UI computes the band (green ≥85 / amber 70-84 / red <70). */
    battery_health_pct: z.number().int().min(0).max(100).optional(),
    /**
     * Last 4 digits of IMEI (phones / cellular tablets / cellular
     * smart-watches) or serial (laptops / cameras / TVs). NEVER stored
     * in full — the buyer verifies the full number at handover.
     *
     * v2 additionally hashes the full IMEI into `electronics_imei_registry`
     * for uniqueness (one IMEI = one active listing) — see P2 in doctrine.
     * That hash lives in its own table, not this JSONB field.
     */
    serial_or_imei_last_4: z
      .string()
      .regex(/^[0-9A-Z]{4}$/, 'serial_or_imei_last_4 must be 4 alphanumeric uppercase chars')
      .optional(),

    // Per-component repair disclosure (P4 — 4 components × 3 states)
    repair_screen: RepairStateSchema.optional(),
    repair_battery: RepairStateSchema.optional(),
    repair_back_glass: RepairStateSchema.optional(),
    repair_camera: RepairStateSchema.optional(),

    // Provenance + warranty (4 — P5, P6)
    purchase_source: PurchaseSourceSchema.optional(),
    has_original_receipt: z.boolean().optional(),
    warranty_active: z.boolean().optional(),
    /** YYYY-MM-DD — optional date when warranty ends. */
    warranty_end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'warranty_end_date must be YYYY-MM-DD')
      .optional(),

    // Accessories + trade (2 — P8 badal support)
    accessories_included: z.array(AccessorySchema).default([]),
    accepts_trade: z.boolean().optional(),
    trade_for_models: z.string().trim().max(200).optional(),
  })
  .passthrough();

export type ElectronicsFieldsRawT = z.infer<typeof ElectronicsFieldsRaw>;

// ---------------------------------------------------------------------------
// Sub-cat conditional validator
// ---------------------------------------------------------------------------

/**
 * Layer sub-cat invariants on top of the bare schema. Call this (not
 * the bare `ElectronicsFieldsRaw.safeParse`) at publish time.
 *
 * Sub-cat requirements:
 *   phones-tablets     → storage_gb, cosmetic_grade
 *   laptops-computers  → storage_gb, ram_gb, screen_size_inches (laptop)
 *   tvs-audio (TV)     → screen_size_inches, resolution
 *   gaming console     → storage_gb
 *   smart-watches      → battery_health_pct (watches live/die on battery)
 *   cameras (lens)     → lens_mount
 *
 * device_kind must be one of the allowed kinds for the sub-cat
 * (DEVICE_KIND_BY_SUB_CAT map).
 */
export function validateElectronicsFieldsRawV2(
  raw: unknown,
  subCat: ElectronicsCategoryKey,
): z.SafeParseReturnType<unknown, ElectronicsFieldsRawT> {
  const baseResult = ElectronicsFieldsRaw.safeParse(raw);
  if (!baseResult.success) return baseResult;

  const data = baseResult.data;
  const issues: z.ZodIssue[] = [];

  // device_kind must be within the allowed set for this sub-cat
  const allowedKinds = DEVICE_KIND_BY_SUB_CAT[subCat] ?? [];
  if (!(allowedKinds as ReadonlyArray<DeviceKind>).includes(data.device_kind)) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['device_kind'],
      message: `device_kind=${data.device_kind} not allowed under sub-cat=${subCat}`,
    });
  }

  // Phones / tablets
  if (subCat === 'phones-tablets' && data.storage_gb == null) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['storage_gb'],
      message: 'phones/tablets require storage_gb',
    });
  }

  // Laptops / desktops
  if (subCat === 'laptops-computers' && (data.device_kind === 'laptop' || data.device_kind === 'desktop')) {
    if (data.storage_gb == null) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['storage_gb'],
        message: 'laptops/desktops require storage_gb',
      });
    }
    if (data.ram_gb == null) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['ram_gb'],
        message: 'laptops/desktops require ram_gb',
      });
    }
    if (data.device_kind === 'laptop' && data.screen_size_inches == null) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['screen_size_inches'],
        message: 'laptops require screen_size_inches',
      });
    }
  }

  // TVs
  if (subCat === 'tvs-audio' && data.device_kind === 'tv') {
    if (data.screen_size_inches == null) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['screen_size_inches'],
        message: 'TVs require screen_size_inches',
      });
    }
    if (!data.resolution) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['resolution'],
        message: 'TVs require resolution',
      });
    }
  }

  // Gaming consoles
  if (
    subCat === 'gaming' &&
    (data.device_kind === 'console' || data.device_kind === 'handheld_console') &&
    data.storage_gb == null
  ) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['storage_gb'],
      message: 'gaming consoles require storage_gb',
    });
  }

  // Smart watches — battery health is the single most-asked spec
  if (subCat === 'smart-watches' && data.device_kind === 'smart_watch' && data.battery_health_pct == null) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['battery_health_pct'],
      message: 'smart watches require battery_health_pct',
    });
  }

  // Camera lenses need the mount
  if (subCat === 'cameras' && data.device_kind === 'lens' && !data.lens_mount) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['lens_mount'],
      message: 'lenses require lens_mount',
    });
  }

  // Warranty coherence — if marked active, end_date shouldn't be in the past
  if (data.warranty_active && data.warranty_end_date) {
    const end = Date.parse(data.warranty_end_date);
    if (!Number.isNaN(end) && end < Date.now()) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['warranty_end_date'],
        message: 'warranty_active=true but warranty_end_date is in the past',
      });
    }
  }

  // Trade-in invariant: if accepts_trade, trade_for_models is optional but
  // trade_for_models without accepts_trade is contradictory.
  if (data.trade_for_models && !data.accepts_trade) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['accepts_trade'],
      message: 'trade_for_models set but accepts_trade is false',
    });
  }

  if (issues.length > 0) {
    return { success: false, error: new z.ZodError(issues) };
  }
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Draft-time partial schema — lenient for progressive wizard saves
// ---------------------------------------------------------------------------

export const ElectronicsFieldsDraftSchemaV2 = ElectronicsFieldsRaw.partial().passthrough();
export type ElectronicsFieldsDraftV2 = z.infer<typeof ElectronicsFieldsDraftSchemaV2>;

// ---------------------------------------------------------------------------
// camelCase transform for consumers
// ---------------------------------------------------------------------------

export interface ElectronicsFields {
  // Identity
  deviceKind: DeviceKind;
  modelSlug?: string;
  brand: string;
  model: string;
  yearOfPurchase?: number;

  // Specs
  storageGb?: number;
  ramGb?: number;
  screenSizeInches?: number;
  resolution?: z.infer<typeof ResolutionSchema>;
  storageType?: z.infer<typeof StorageTypeSchema>;
  lensMount?: z.infer<typeof LensMountSchema>;

  // Condition
  cosmeticGrade: z.infer<typeof CosmeticGradeSchema>;
  batteryHealthPct?: number;
  serialOrImeiLast4?: string;

  // Repair disclosure (per component)
  repairScreen?: z.infer<typeof RepairStateSchema>;
  repairBattery?: z.infer<typeof RepairStateSchema>;
  repairBackGlass?: z.infer<typeof RepairStateSchema>;
  repairCamera?: z.infer<typeof RepairStateSchema>;

  // Provenance + warranty
  purchaseSource?: z.infer<typeof PurchaseSourceSchema>;
  hasOriginalReceipt?: boolean;
  warrantyActive?: boolean;
  warrantyEndDate?: string;

  // Trade
  accessoriesIncluded: z.infer<typeof AccessorySchema>[];
  acceptsTrade?: boolean;
  tradeForModels?: string;
}

/** Pure transform — assumes `validateElectronicsFieldsRawV2` already passed. */
export function toElectronicsFields(raw: ElectronicsFieldsRawT): ElectronicsFields {
  return {
    deviceKind: raw.device_kind,
    modelSlug: raw.model_slug,
    brand: raw.brand,
    model: raw.model,
    yearOfPurchase: raw.year_of_purchase,

    storageGb: raw.storage_gb,
    ramGb: raw.ram_gb,
    screenSizeInches: raw.screen_size_inches,
    resolution: raw.resolution,
    storageType: raw.storage_type,
    lensMount: raw.lens_mount,

    cosmeticGrade: raw.cosmetic_grade,
    batteryHealthPct: raw.battery_health_pct,
    serialOrImeiLast4: raw.serial_or_imei_last_4,

    repairScreen: raw.repair_screen,
    repairBattery: raw.repair_battery,
    repairBackGlass: raw.repair_back_glass,
    repairCamera: raw.repair_camera,

    purchaseSource: raw.purchase_source,
    hasOriginalReceipt: raw.has_original_receipt,
    warrantyActive: raw.warranty_active,
    warrantyEndDate: raw.warranty_end_date,

    accessoriesIncluded: raw.accessories_included ?? [],
    acceptsTrade: raw.accepts_trade,
    tradeForModels: raw.trade_for_models,
  };
}

// ---------------------------------------------------------------------------
// UX helpers — keep them here so the component layer can render without
// duplicating threshold logic.
// ---------------------------------------------------------------------------

export type BatteryHealthBand = 'green' | 'amber' | 'red' | 'unknown';

/**
 * Map raw battery health % to the 3-band visual (Reebelo convention +
 * Swappa iPhone ≥80% disclosure line):
 *   ≥85 → green · 70-84 → amber · <70 → red · null/undefined → unknown
 */
export function batteryHealthBand(pct: number | undefined | null): BatteryHealthBand {
  if (pct == null) return 'unknown';
  if (pct >= 85) return 'green';
  if (pct >= 70) return 'amber';
  return 'red';
}

/**
 * Does the device-kind carry a battery worth disclosing? Gating rule
 * for when the UI should show the "Battery not disclosed" amber
 * warning on the detail page.
 */
export function deviceKindHasBattery(kind: DeviceKind): boolean {
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

/**
 * Does the device-kind have a repairable screen worth disclosing? TVs
 * and laptops yes; headphones/consoles no.
 */
export function deviceKindHasScreen(kind: DeviceKind): boolean {
  return (
    kind === 'phone' ||
    kind === 'tablet' ||
    kind === 'laptop' ||
    kind === 'tv' ||
    kind === 'smart_watch' ||
    kind === 'handheld_console'
  );
}
