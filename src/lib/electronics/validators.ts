import { z } from 'zod';
import type { ElectronicsCategoryKey, DeviceKind } from './types';
import { DEVICE_KIND_BY_SUB_CAT } from './types';

/**
 * ElectronicsFields — Zod schema for the `listings.category_fields`
 * JSONB body of electronics listings.
 *
 * Design (mirrors src/lib/properties/validators.ts):
 *   - Raw schema matches DB JSONB exactly (snake_case + `.passthrough()`
 *     for forward-compat across schema revisions)
 *   - Conditional refinements via `validateElectronicsFieldsRaw(raw, subCat)`
 *     — the bare schema can't express "phones require IMEI" without
 *     the sub-cat context
 *   - `toElectronicsFields()` emits camelCase for the UI layer
 *
 * 28 fields across 5 domains (per planning/PHASE-7A-ELECTRONICS.md §3):
 *   1. Identity         — device_kind, brand, model, year_of_release, serial_or_imei_last_4
 *   2. Specs            — storage_gb, ram_gb, cpu, gpu, storage_type,
 *                         screen_size_inches, resolution, connectivity[]
 *   3. Condition        — condition_grade, battery_health_pct, battery_cycles,
 *                         repair_history[], original_parts, box_status, accessories_included[]
 *   4. Warranty         — purchase_country, warranty_status,
 *                         warranty_expires_at, has_original_receipt
 *   5. Lock + trade     — region_spec, carrier_lock, accepts_trade,
 *                         trade_for_models, lens_mount (cameras only)
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

export const ConditionGradeSchema = z.enum([
  'mint',
  'excellent',
  'good',
  'fair',
  'for_parts',
]);

export const StorageTypeSchema = z.enum([
  'ssd',
  'hdd',
  'nvme',
  'hybrid',
  'emmc',
]);

export const ResolutionSchema = z.enum(['hd', 'fhd', '2k', '4k', '8k']);

export const ConnectivitySchema = z.enum([
  'wifi',
  'wifi6',
  'bluetooth',
  '5g',
  'lte',
  'ethernet',
  'usb_c',
  'thunderbolt',
]);

export const RepairKindSchema = z.enum([
  'screen',
  'battery',
  'back_glass',
  'logic_board',
  'sensor',
  'none',
]);

export const BoxStatusSchema = z.enum(['bnib', 'open_box', 'no_box']);

export const AccessorySchema = z.enum([
  'charger',
  'cable',
  'earphones',
  'case',
  'stand',
  'box_only',
  'original_packaging',
]);

export const PurchaseCountrySchema = z.enum([
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
]);

export const WarrantyStatusSchema = z.enum([
  'active_kuwait',
  'active_international',
  'expired',
  'none',
]);

export const RegionSpecSchema = z.enum(['gcc', 'us', 'eu', 'jp', 'other']);

export const CarrierLockSchema = z.enum([
  'unlocked',
  'zain',
  'stc',
  'ooredoo',
  'other',
]);

/** Camera lens mount enum — only used when `device_kind=lens`. */
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
// Raw (snake_case, pre-transform) schema
// ---------------------------------------------------------------------------

export const ElectronicsFieldsRaw = z
  .object({
    // Identity
    device_kind: DeviceKindSchema,
    brand: z.string().trim().min(1).max(60),
    model: z.string().trim().min(1).max(80),
    year_of_release: z
      .number()
      .int()
      .min(1980)
      .max(new Date().getFullYear() + 1)
      .optional(),
    /**
     * Last 4 digits of IMEI (phones / cellular tablets / cellular
     * smart-watches) or serial (laptops / cameras). Never store the
     * full identifier — buyers verify against operator/Apple at the
     * pickup point.
     */
    serial_or_imei_last_4: z
      .string()
      .regex(/^[0-9A-Z]{4}$/, 'serial_or_imei_last_4 must be 4 alphanumeric uppercase chars')
      .optional(),

    // Specs
    storage_gb: z.number().int().min(1).max(64_000).optional(),
    ram_gb: z.number().int().min(1).max(2_048).optional(),
    cpu: z.string().trim().max(80).optional(),
    gpu: z.string().trim().max(80).optional(),
    storage_type: StorageTypeSchema.optional(),
    screen_size_inches: z.number().min(1).max(120).optional(),
    resolution: ResolutionSchema.optional(),
    connectivity: z.array(ConnectivitySchema).default([]),

    // Condition + provenance
    condition_grade: ConditionGradeSchema,
    battery_health_pct: z.number().int().min(0).max(100).optional(),
    battery_cycles: z.number().int().min(0).max(5_000).optional(),
    repair_history: z.array(RepairKindSchema).default([]),
    original_parts: z.boolean().optional(),
    box_status: BoxStatusSchema.optional(),
    accessories_included: z.array(AccessorySchema).default([]),

    // Provenance + warranty
    purchase_country: PurchaseCountrySchema.optional(),
    warranty_status: WarrantyStatusSchema.optional(),
    warranty_expires_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'warranty_expires_at must be YYYY-MM-DD')
      .optional(),
    has_original_receipt: z.boolean().optional(),

    // Lock + trade
    region_spec: RegionSpecSchema.optional(),
    carrier_lock: CarrierLockSchema.optional(),
    accepts_trade: z.boolean().optional(),
    trade_for_models: z.string().trim().max(200).optional(),

    // Camera-only
    lens_mount: LensMountSchema.optional(),
  })
  .passthrough();

export type ElectronicsFieldsRawT = z.infer<typeof ElectronicsFieldsRaw>;

// ---------------------------------------------------------------------------
// Conditional refinement — requires sub-cat context
// ---------------------------------------------------------------------------

/**
 * Validate a raw category_fields blob against the sub-cat-dependent
 * invariants. Returns SafeParseReturn — consumers branch on `.success`.
 *
 * Call this instead of the bare `ElectronicsFieldsRaw.parse()` at
 * publish time, since conditional requirements depend on the sub-cat
 * (which lives outside the JSONB).
 */
export function validateElectronicsFieldsRaw(
  raw: unknown,
  subCat: ElectronicsCategoryKey,
): z.SafeParseReturnType<unknown, ElectronicsFieldsRawT> {
  const baseResult = ElectronicsFieldsRaw.safeParse(raw);
  if (!baseResult.success) return baseResult;

  const data = baseResult.data;
  const issues: z.ZodIssue[] = [];

  // device_kind must belong to this sub-cat (no `console` under phones).
  const allowedKinds = DEVICE_KIND_BY_SUB_CAT[subCat] ?? [];
  if (!(allowedKinds as ReadonlyArray<DeviceKind>).includes(data.device_kind)) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['device_kind'],
      message: `device_kind=${data.device_kind} not allowed under sub-cat=${subCat}`,
    });
  }

  // ── Phones / tablets: IMEI + storage + region; phones also need carrier_lock
  if (subCat === 'phones-tablets') {
    if (!data.serial_or_imei_last_4) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['serial_or_imei_last_4'],
        message: 'phones/tablets require imei (last 4)',
      });
    }
    if (data.storage_gb == null) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['storage_gb'],
        message: 'phones/tablets require storage_gb',
      });
    }
    if (!data.region_spec) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['region_spec'],
        message: 'phones/tablets require region_spec (P5)',
      });
    }
    if (data.device_kind === 'phone' && !data.carrier_lock) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['carrier_lock'],
        message: 'phones require carrier_lock disclosure (P5)',
      });
    }
  }

  // ── Laptops: cpu + ram + storage + screen
  if (subCat === 'laptops-computers') {
    if (data.device_kind === 'laptop' || data.device_kind === 'desktop') {
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
      if (!data.cpu) {
        issues.push({
          code: z.ZodIssueCode.custom,
          path: ['cpu'],
          message: 'laptops/desktops require cpu',
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
  }

  // ── TVs: screen size + resolution
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

  // ── Gaming consoles need storage
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

  // ── Smart watches: need battery health (small device, big concern)
  if (subCat === 'smart-watches' && data.device_kind === 'smart_watch') {
    if (data.battery_health_pct == null) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['battery_health_pct'],
        message: 'smart watches require battery_health_pct (P4)',
      });
    }
  }

  // ── Cameras: lenses need lens_mount
  if (subCat === 'cameras' && data.device_kind === 'lens' && !data.lens_mount) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['lens_mount'],
      message: 'lenses require lens_mount',
    });
  }

  // ── Battery cycles is a laptop-only metric — flag if set elsewhere
  if (
    data.battery_cycles != null &&
    subCat !== 'laptops-computers'
  ) {
    issues.push({
      code: z.ZodIssueCode.custom,
      path: ['battery_cycles'],
      message: 'battery_cycles only applies to laptops',
    });
  }

  // ── Warranty cross-field — if status active, expiry should be in the future
  if (
    (data.warranty_status === 'active_kuwait' ||
      data.warranty_status === 'active_international') &&
    data.warranty_expires_at
  ) {
    const expiry = Date.parse(data.warranty_expires_at);
    if (!Number.isNaN(expiry) && expiry < Date.now()) {
      issues.push({
        code: z.ZodIssueCode.custom,
        path: ['warranty_expires_at'],
        message: 'warranty_expires_at is in the past — set status=expired instead',
      });
    }
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: new z.ZodError(issues),
    };
  }
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Draft-time partial schema (progressive wizard) — mirrors Properties pattern
// ---------------------------------------------------------------------------

export const ElectronicsFieldsDraftSchema = ElectronicsFieldsRaw.partial().passthrough();
export type ElectronicsFieldsDraft = z.infer<typeof ElectronicsFieldsDraftSchema>;

export function isElectronicsFieldsDraftNonEmpty(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  return Object.keys(raw as Record<string, unknown>).length > 0;
}

// ---------------------------------------------------------------------------
// Transform to camelCase (consumer-facing)
// ---------------------------------------------------------------------------

export interface ElectronicsFields {
  // Identity
  deviceKind: DeviceKind;
  brand: string;
  model: string;
  yearOfRelease?: number;
  serialOrImeiLast4?: string;

  // Specs
  storageGb?: number;
  ramGb?: number;
  cpu?: string;
  gpu?: string;
  storageType?: z.infer<typeof StorageTypeSchema>;
  screenSizeInches?: number;
  resolution?: z.infer<typeof ResolutionSchema>;
  connectivity: z.infer<typeof ConnectivitySchema>[];

  // Condition + provenance
  conditionGrade: z.infer<typeof ConditionGradeSchema>;
  batteryHealthPct?: number;
  batteryCycles?: number;
  repairHistory: z.infer<typeof RepairKindSchema>[];
  originalParts?: boolean;
  boxStatus?: z.infer<typeof BoxStatusSchema>;
  accessoriesIncluded: z.infer<typeof AccessorySchema>[];

  // Warranty
  purchaseCountry?: z.infer<typeof PurchaseCountrySchema>;
  warrantyStatus?: z.infer<typeof WarrantyStatusSchema>;
  warrantyExpiresAt?: string;
  hasOriginalReceipt?: boolean;

  // Lock + trade
  regionSpec?: z.infer<typeof RegionSpecSchema>;
  carrierLock?: z.infer<typeof CarrierLockSchema>;
  acceptsTrade?: boolean;
  tradeForModels?: string;

  // Camera-only
  lensMount?: z.infer<typeof LensMountSchema>;
}

/** Transform raw (snake_case) to camelCase. Assumes
 *  validateElectronicsFieldsRaw already passed. Pure function. */
export function toElectronicsFields(raw: ElectronicsFieldsRawT): ElectronicsFields {
  return {
    deviceKind: raw.device_kind,
    brand: raw.brand,
    model: raw.model,
    yearOfRelease: raw.year_of_release,
    serialOrImeiLast4: raw.serial_or_imei_last_4,

    storageGb: raw.storage_gb,
    ramGb: raw.ram_gb,
    cpu: raw.cpu,
    gpu: raw.gpu,
    storageType: raw.storage_type,
    screenSizeInches: raw.screen_size_inches,
    resolution: raw.resolution,
    connectivity: raw.connectivity ?? [],

    conditionGrade: raw.condition_grade,
    batteryHealthPct: raw.battery_health_pct,
    batteryCycles: raw.battery_cycles,
    repairHistory: raw.repair_history ?? [],
    originalParts: raw.original_parts,
    boxStatus: raw.box_status,
    accessoriesIncluded: raw.accessories_included ?? [],

    purchaseCountry: raw.purchase_country,
    warrantyStatus: raw.warranty_status,
    warrantyExpiresAt: raw.warranty_expires_at,
    hasOriginalReceipt: raw.has_original_receipt,

    regionSpec: raw.region_spec,
    carrierLock: raw.carrier_lock,
    acceptsTrade: raw.accepts_trade,
    tradeForModels: raw.trade_for_models,

    lensMount: raw.lens_mount,
  };
}

// ---------------------------------------------------------------------------
// Battery-health UI helper (P4)
// ---------------------------------------------------------------------------

export type BatteryHealthBand = 'green' | 'amber' | 'red' | 'unknown';

export function batteryHealthBand(pct: number | undefined | null): BatteryHealthBand {
  if (pct == null) return 'unknown';
  if (pct >= 85) return 'green';
  if (pct >= 70) return 'amber';
  return 'red';
}
