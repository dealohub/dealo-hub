import { describe, it, expect } from 'vitest';
import {
  ElectronicsFieldsRaw,
  ElectronicsFieldsDraftSchemaV2,
  validateElectronicsFieldsRawV2,
  toElectronicsFields,
  batteryHealthBand,
  deviceKindHasBattery,
  deviceKindHasScreen,
  containsElectronicsCounterfeitTerm,
  type ElectronicsFieldsRawT,
} from './validators';

/**
 * Electronics vertical — v2 validator tests.
 *
 * Lock down the three layers:
 *   1. ElectronicsFieldsRaw — shape + ranges
 *   2. validateElectronicsFieldsRawV2(raw, subCat) — sub-cat conditionals:
 *        phones-tablets       → storage_gb
 *        laptops-computers    → storage_gb + ram_gb; laptop → screen_size
 *        tvs-audio (TV)       → screen_size_inches + resolution
 *        gaming console       → storage_gb
 *        smart-watches        → battery_health_pct
 *        cameras (lens)       → lens_mount
 *   3. containsElectronicsCounterfeitTerm() — widened blocklist (16 terms)
 *
 * Plus UX helpers: batteryHealthBand (P3 colored bar) +
 * deviceKindHasBattery/Screen (drives UI conditional cards).
 *
 * v1 tests are deleted with the v1 schema; this is a fresh file.
 */

// ---------------------------------------------------------------------------
// Fixtures — minimal valid payload per sub-cat
// ---------------------------------------------------------------------------

const validPhone: ElectronicsFieldsRawT = {
  device_kind: 'phone',
  brand: 'Apple',
  model: 'iPhone 15 Pro Max',
  storage_gb: 256,
  cosmetic_grade: 'excellent',
  repair_screen: 'original',
  repair_battery: 'original',
  accessories_included: ['charger', 'cable'],
};

const validLaptopOK: ElectronicsFieldsRawT = {
  device_kind: 'laptop',
  brand: 'Apple',
  model: 'MacBook Pro 14 M3 Pro',
  storage_gb: 512,
  ram_gb: 18,
  screen_size_inches: 14,
  cosmetic_grade: 'premium',
  accessories_included: [],
};

const validTv: ElectronicsFieldsRawT = {
  device_kind: 'tv',
  brand: 'Samsung',
  model: 'QLED Q80C 65"',
  screen_size_inches: 65,
  resolution: '4k',
  cosmetic_grade: 'excellent',
  accessories_included: [],
};

const validConsole: ElectronicsFieldsRawT = {
  device_kind: 'console',
  brand: 'Sony',
  model: 'PlayStation 5 Disc',
  storage_gb: 825,
  cosmetic_grade: 'good',
  accessories_included: ['cable'],
};

const validSmartWatch: ElectronicsFieldsRawT = {
  device_kind: 'smart_watch',
  brand: 'Apple',
  model: 'Watch Ultra 2',
  cosmetic_grade: 'premium',
  battery_health_pct: 99,
  accessories_included: ['charger'],
};

const validLens: ElectronicsFieldsRawT = {
  device_kind: 'lens',
  brand: 'Canon',
  model: 'RF 24-70 f/2.8 L',
  lens_mount: 'canon_rf',
  cosmetic_grade: 'excellent',
  accessories_included: [],
};

// ---------------------------------------------------------------------------
// Bare-shape tests
// ---------------------------------------------------------------------------

describe('ElectronicsFieldsRaw — shape + ranges', () => {
  it('accepts a complete phone payload', () => {
    expect(ElectronicsFieldsRaw.safeParse(validPhone).success).toBe(true);
  });

  it('accepts a complete laptop payload', () => {
    expect(ElectronicsFieldsRaw.safeParse(validLaptopOK).success).toBe(true);
  });

  it('accepts a complete TV payload', () => {
    expect(ElectronicsFieldsRaw.safeParse(validTv).success).toBe(true);
  });

  it('rejects battery_health_pct above 100', () => {
    const bad = { ...validPhone, battery_health_pct: 120 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects battery_health_pct below 0', () => {
    const bad = { ...validPhone, battery_health_pct: -10 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects negative storage_gb', () => {
    const bad = { ...validPhone, storage_gb: -1 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects imei last-4 that is too short', () => {
    const bad = { ...validPhone, serial_or_imei_last_4: 'ABC' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects imei last-4 in lowercase (schema requires uppercase)', () => {
    const bad = { ...validPhone, serial_or_imei_last_4: 'a1b2' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects cosmetic_grade outside the 4-tier set', () => {
    const bad = { ...validPhone, cosmetic_grade: 'mint' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown device_kind', () => {
    const bad = { ...validPhone, device_kind: 'toaster' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('passthrough preserves forward-compat keys', () => {
    const withFuture = { ...validPhone, future_key_v3: 'foo' };
    expect(ElectronicsFieldsRaw.safeParse(withFuture).success).toBe(true);
  });

  it('rejects warranty_end_date not in YYYY-MM-DD format', () => {
    const bad = { ...validPhone, warranty_end_date: '2026/09/22' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects year_of_purchase below 2000', () => {
    const bad = { ...validPhone, year_of_purchase: 1999 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('empty brand is rejected', () => {
    const bad = { ...validPhone, brand: '' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('oversize brand (>60 chars) is rejected', () => {
    const bad = { ...validPhone, brand: 'A'.repeat(120) };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('accepts optional per-component repair values', () => {
    const ok = {
      ...validPhone,
      repair_screen: 'replaced',
      repair_battery: 'unknown',
      repair_back_glass: 'original',
      repair_camera: 'original',
    };
    expect(ElectronicsFieldsRaw.safeParse(ok).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sub-cat conditional invariants
// ---------------------------------------------------------------------------

describe('phones-tablets conditionals', () => {
  it('complete phone passes', () => {
    expect(validateElectronicsFieldsRawV2(validPhone, 'phones-tablets').success).toBe(true);
  });

  it('rejects phone missing storage_gb', () => {
    const { storage_gb: _, ...bad } = validPhone;
    const r = validateElectronicsFieldsRawV2(bad as any, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('storage_gb');
    }
  });

  it('rejects console under phones-tablets (device_kind cross-check)', () => {
    const bad = { ...validPhone, device_kind: 'console' as const };
    const r = validateElectronicsFieldsRawV2(bad, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('device_kind');
    }
  });

  it('accepts a tablet without carrier_lock (v2 dropped that enum)', () => {
    const tablet: ElectronicsFieldsRawT = { ...validPhone, device_kind: 'tablet' };
    const r = validateElectronicsFieldsRawV2(tablet, 'phones-tablets');
    expect(r.success).toBe(true);
  });

  it('does NOT require region_spec (dropped in v2)', () => {
    const noRegion = { ...validPhone };
    const r = validateElectronicsFieldsRawV2(noRegion, 'phones-tablets');
    expect(r.success).toBe(true);
  });
});

describe('laptops-computers conditionals', () => {
  it('complete laptop passes', () => {
    expect(validateElectronicsFieldsRawV2(validLaptopOK, 'laptops-computers').success).toBe(true);
  });

  it('rejects laptop missing ram_gb', () => {
    const { ram_gb: _, ...bad } = validLaptopOK;
    const r = validateElectronicsFieldsRawV2(bad as any, 'laptops-computers');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('ram_gb');
    }
  });

  it('rejects laptop missing screen_size_inches', () => {
    const { screen_size_inches: _, ...bad } = validLaptopOK;
    const r = validateElectronicsFieldsRawV2(bad as any, 'laptops-computers');
    expect(r.success).toBe(false);
  });

  it('accepts desktop without screen_size_inches', () => {
    const desktop: ElectronicsFieldsRawT = { ...validLaptopOK, device_kind: 'desktop' };
    delete (desktop as any).screen_size_inches;
    expect(validateElectronicsFieldsRawV2(desktop, 'laptops-computers').success).toBe(true);
  });
});

describe('tvs-audio conditionals', () => {
  it('complete TV passes', () => {
    expect(validateElectronicsFieldsRawV2(validTv, 'tvs-audio').success).toBe(true);
  });

  it('rejects TV missing screen_size_inches', () => {
    const { screen_size_inches: _, ...bad } = validTv;
    expect(validateElectronicsFieldsRawV2(bad as any, 'tvs-audio').success).toBe(false);
  });

  it('rejects TV missing resolution', () => {
    const { resolution: _, ...bad } = validTv;
    expect(validateElectronicsFieldsRawV2(bad as any, 'tvs-audio').success).toBe(false);
  });

  it('soundbar accepted without screen/resolution', () => {
    const sb: ElectronicsFieldsRawT = {
      device_kind: 'soundbar',
      brand: 'Sonos',
      model: 'Beam Gen 2',
      cosmetic_grade: 'premium',
      accessories_included: [],
    };
    expect(validateElectronicsFieldsRawV2(sb, 'tvs-audio').success).toBe(true);
  });
});

describe('gaming conditionals', () => {
  it('complete console passes', () => {
    expect(validateElectronicsFieldsRawV2(validConsole, 'gaming').success).toBe(true);
  });

  it('rejects console missing storage_gb', () => {
    const { storage_gb: _, ...bad } = validConsole;
    expect(validateElectronicsFieldsRawV2(bad as any, 'gaming').success).toBe(false);
  });

  it('controller accessory accepted with minimal fields', () => {
    const ctrl: ElectronicsFieldsRawT = {
      device_kind: 'accessory',
      brand: 'Sony',
      model: 'DualSense Edge',
      cosmetic_grade: 'excellent',
      accessories_included: [],
    };
    expect(validateElectronicsFieldsRawV2(ctrl, 'gaming').success).toBe(true);
  });
});

describe('smart-watches conditionals', () => {
  it('complete smart watch passes', () => {
    expect(validateElectronicsFieldsRawV2(validSmartWatch, 'smart-watches').success).toBe(true);
  });

  it('rejects smart watch missing battery_health_pct', () => {
    const { battery_health_pct: _, ...bad } = validSmartWatch;
    const r = validateElectronicsFieldsRawV2(bad as any, 'smart-watches');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('battery_health_pct');
    }
  });
});

describe('cameras conditionals', () => {
  it('lens with mount passes', () => {
    expect(validateElectronicsFieldsRawV2(validLens, 'cameras').success).toBe(true);
  });

  it('rejects lens missing lens_mount', () => {
    const { lens_mount: _, ...bad } = validLens;
    const r = validateElectronicsFieldsRawV2(bad as any, 'cameras');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('lens_mount');
    }
  });

  it('camera body without lens_mount passes', () => {
    const body: ElectronicsFieldsRawT = {
      device_kind: 'camera',
      brand: 'Sony',
      model: 'Alpha 7 IV',
      cosmetic_grade: 'excellent',
      accessories_included: [],
    };
    expect(validateElectronicsFieldsRawV2(body, 'cameras').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting invariants
// ---------------------------------------------------------------------------

describe('cross-cutting invariants', () => {
  it('warranty_active with end_date in the past is rejected', () => {
    const bad: ElectronicsFieldsRawT = {
      ...validPhone,
      warranty_active: true,
      warranty_end_date: '2020-01-01',
    };
    const r = validateElectronicsFieldsRawV2(bad, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('warranty_end_date');
    }
  });

  it('warranty_active=false with past end_date is fine (expired)', () => {
    const ok: ElectronicsFieldsRawT = {
      ...validPhone,
      warranty_active: false,
      warranty_end_date: '2020-01-01',
    };
    expect(validateElectronicsFieldsRawV2(ok, 'phones-tablets').success).toBe(true);
  });

  it('trade_for_models without accepts_trade is rejected', () => {
    const bad: ElectronicsFieldsRawT = {
      ...validPhone,
      accepts_trade: false,
      trade_for_models: 'iPhone 16 Pro Max + cash',
    };
    const r = validateElectronicsFieldsRawV2(bad, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('accepts_trade');
    }
  });

  it('accepts_trade=true without trade_for_models is fine', () => {
    const ok: ElectronicsFieldsRawT = { ...validPhone, accepts_trade: true };
    expect(validateElectronicsFieldsRawV2(ok, 'phones-tablets').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Counterfeit blocklist (P7)
// ---------------------------------------------------------------------------

describe('counterfeit blocklist (widened from v1)', () => {
  it.each([
    '1st copy iPhone 15',
    'first copy watch',
    'high copy AirPods',
    'high quality copy',
    'master copy samsung',
    'aaa replica',
    'mirror copy',
    'super copy',
    'fake iphone',
    'counterfeit device',
    'reproduction unit',
    'knockoff phone',
    'clone device',
  ])('blocks English term: "%s"', term => {
    expect(containsElectronicsCounterfeitTerm(term)).toBe(true);
  });

  it.each([
    'جهاز كوبي',
    'هاي كوبي للبيع',
    'ماستر كوبي جديد',
    'فيرست هاي كوبي',
    'مستر كوبي',
    'شبيه الاصلي',
    'شبيه الأصلي',
    'تقليد ممتاز',
    'مستنسخ',
    'درجة ثانية',
    'درجه ثانيه',
    'نسخة طبق الأصل',
    'كلاس وان',
  ])('blocks Arabic term: "%s"', term => {
    expect(containsElectronicsCounterfeitTerm(term)).toBe(true);
  });

  it('accepts clean English text', () => {
    expect(containsElectronicsCounterfeitTerm('iPhone 15 Pro Max — like new')).toBe(false);
  });

  it('accepts clean Arabic text', () => {
    expect(containsElectronicsCounterfeitTerm('آيفون 15 برو ماكس — حالة ممتازة')).toBe(false);
  });

  it('case-insensitive on English', () => {
    expect(containsElectronicsCounterfeitTerm('IPHONE MASTER COPY')).toBe(true);
    expect(containsElectronicsCounterfeitTerm('First Copy Watch')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UX helpers
// ---------------------------------------------------------------------------

describe('batteryHealthBand', () => {
  it.each([
    [100, 'green'],
    [95, 'green'],
    [85, 'green'],
    [84, 'amber'],
    [70, 'amber'],
    [69, 'red'],
    [0, 'red'],
  ])('%d%% → %s', (pct, want) => {
    expect(batteryHealthBand(pct)).toBe(want);
  });

  it('null / undefined → unknown', () => {
    expect(batteryHealthBand(null)).toBe('unknown');
    expect(batteryHealthBand(undefined)).toBe('unknown');
  });
});

describe('deviceKindHasBattery', () => {
  it.each(['phone', 'tablet', 'laptop', 'smart_watch', 'handheld_console', 'headphones', 'camera'] as const)(
    '%s → true',
    k => expect(deviceKindHasBattery(k)).toBe(true),
  );

  it.each(['tv', 'soundbar', 'speaker', 'desktop', 'console', 'accessory', 'lens'] as const)(
    '%s → false',
    k => expect(deviceKindHasBattery(k)).toBe(false),
  );
});

describe('deviceKindHasScreen', () => {
  it.each(['phone', 'tablet', 'laptop', 'tv', 'smart_watch', 'handheld_console'] as const)(
    '%s → true',
    k => expect(deviceKindHasScreen(k)).toBe(true),
  );

  it.each(['soundbar', 'headphones', 'speaker', 'console', 'accessory', 'lens', 'camera'] as const)(
    '%s → false',
    k => expect(deviceKindHasScreen(k)).toBe(false),
  );
});

// ---------------------------------------------------------------------------
// Draft schema
// ---------------------------------------------------------------------------

describe('ElectronicsFieldsDraftSchemaV2 (progressive wizard)', () => {
  it('accepts empty object', () => {
    expect(ElectronicsFieldsDraftSchemaV2.safeParse({}).success).toBe(true);
  });

  it('accepts partial (just brand)', () => {
    expect(ElectronicsFieldsDraftSchemaV2.safeParse({ brand: 'Apple' }).success).toBe(true);
  });

  it('rejects structurally invalid enum', () => {
    expect(ElectronicsFieldsDraftSchemaV2.safeParse({ device_kind: 'toaster' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// camelCase transform
// ---------------------------------------------------------------------------

describe('toElectronicsFields', () => {
  it('renames snake_case → camelCase correctly', () => {
    const out = toElectronicsFields({
      ...validPhone,
      serial_or_imei_last_4: '7Q4F',
      battery_health_pct: 96,
      repair_screen: 'original',
      repair_battery: 'replaced',
      purchase_source: 'apple_store',
      has_original_receipt: true,
      warranty_active: true,
      warranty_end_date: '2026-09-22',
      year_of_purchase: 2023,
    });
    expect(out.deviceKind).toBe('phone');
    expect(out.brand).toBe('Apple');
    expect(out.storageGb).toBe(256);
    expect(out.serialOrImeiLast4).toBe('7Q4F');
    expect(out.batteryHealthPct).toBe(96);
    expect(out.repairScreen).toBe('original');
    expect(out.repairBattery).toBe('replaced');
    expect(out.purchaseSource).toBe('apple_store');
    expect(out.hasOriginalReceipt).toBe(true);
    expect(out.warrantyActive).toBe(true);
    expect(out.warrantyEndDate).toBe('2026-09-22');
    expect(out.yearOfPurchase).toBe(2023);
  });
});
