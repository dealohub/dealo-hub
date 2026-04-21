import { describe, it, expect } from 'vitest';
import {
  ElectronicsFieldsRaw,
  ElectronicsFieldsDraftSchema,
  validateElectronicsFieldsRaw,
  toElectronicsFields,
  batteryHealthBand,
  isElectronicsFieldsDraftNonEmpty,
  type ElectronicsFieldsRawT,
} from './validators';

/**
 * ElectronicsFields validator tests — Phase 7a.
 *
 * Three layers under test (mirrors properties/validators.test.ts):
 *   1. ElectronicsFieldsRaw shape (types + ranges)
 *   2. validateElectronicsFieldsRaw(raw, subCat) — conditional
 *      invariants:
 *        phones-tablets    ⇒ imei + storage + region; phone ⇒ carrier_lock
 *        laptops-computers ⇒ cpu + ram + storage; laptop ⇒ screen
 *        tvs-audio (TV)    ⇒ screen + resolution
 *        gaming console    ⇒ storage
 *        smart-watches     ⇒ battery_health
 *        cameras lens      ⇒ lens_mount
 *        battery_cycles    ⇒ laptops only
 *        warranty active   ⇒ expiry not in the past
 *   3. batteryHealthBand() UX helper (P4 colored bar)
 */

// ---------------------------------------------------------------------------
// Fixtures — minimal valid raw payloads per common case
// ---------------------------------------------------------------------------

const validPhone: ElectronicsFieldsRawT = {
  device_kind: 'phone',
  brand: 'Apple',
  model: 'iPhone 15 Pro Max',
  serial_or_imei_last_4: '4Z9K',
  storage_gb: 256,
  ram_gb: 8,
  battery_health_pct: 92,
  condition_grade: 'excellent',
  region_spec: 'gcc',
  carrier_lock: 'unlocked',
  connectivity: ['wifi6', '5g', 'bluetooth'],
  repair_history: ['none'],
  accessories_included: ['charger', 'cable'],
};

const validLaptop: ElectronicsFieldsRawT = {
  device_kind: 'laptop',
  brand: 'Apple',
  model: 'MacBook Pro 14 M3',
  cpu: 'Apple M3 Pro 11-core',
  ram_gb: 18,
  storage_gb: 512,
  storage_type: 'ssd',
  screen_size_inches: 14,
  battery_cycles: 87,
  condition_grade: 'mint',
  connectivity: ['wifi6', 'bluetooth', 'thunderbolt'],
  repair_history: [],
  accessories_included: ['charger', 'box_only'],
};

const validTv: ElectronicsFieldsRawT = {
  device_kind: 'tv',
  brand: 'Samsung',
  model: 'QLED Q80C',
  screen_size_inches: 65,
  resolution: '4k',
  condition_grade: 'good',
  connectivity: ['wifi', 'bluetooth', 'ethernet'],
  repair_history: [],
  accessories_included: [],
};

const validConsole: ElectronicsFieldsRawT = {
  device_kind: 'console',
  brand: 'Sony',
  model: 'PlayStation 5',
  storage_gb: 825,
  condition_grade: 'excellent',
  connectivity: ['wifi', 'bluetooth', 'ethernet'],
  repair_history: [],
  accessories_included: ['cable'],
};

const validSmartWatch: ElectronicsFieldsRawT = {
  device_kind: 'smart_watch',
  brand: 'Apple',
  model: 'Watch Ultra 2',
  battery_health_pct: 96,
  condition_grade: 'mint',
  connectivity: ['bluetooth', 'lte'],
  repair_history: [],
  accessories_included: ['charger', 'box_only'],
};

const validCameraLens: ElectronicsFieldsRawT = {
  device_kind: 'lens',
  brand: 'Canon',
  model: 'RF 24-70 f/2.8 L',
  lens_mount: 'canon_rf',
  condition_grade: 'excellent',
  connectivity: [],
  repair_history: [],
  accessories_included: ['case', 'box_only'],
};

// ---------------------------------------------------------------------------
// Bare-shape validation
// ---------------------------------------------------------------------------

describe('ElectronicsFieldsRaw — shape + ranges', () => {
  it('accepts a fully populated phone payload', () => {
    expect(ElectronicsFieldsRaw.safeParse(validPhone).success).toBe(true);
  });

  it('accepts a fully populated laptop payload', () => {
    expect(ElectronicsFieldsRaw.safeParse(validLaptop).success).toBe(true);
  });

  it('rejects out-of-range battery_health_pct', () => {
    const bad = { ...validPhone, battery_health_pct: 150 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects negative storage_gb', () => {
    const bad = { ...validPhone, storage_gb: -1 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects malformed imei (too long)', () => {
    const bad = { ...validPhone, serial_or_imei_last_4: 'ABCDE' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects lowercase imei (must be uppercase alphanumeric)', () => {
    const bad = { ...validPhone, serial_or_imei_last_4: 'a1b2' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('passthrough preserves unknown forward-compat keys', () => {
    const withFuture = { ...validPhone, future_key_v2: 'foo' };
    const r = ElectronicsFieldsRaw.safeParse(withFuture);
    expect(r.success).toBe(true);
  });

  it('rejects future year_of_release beyond +1', () => {
    const bad = { ...validPhone, year_of_release: new Date().getFullYear() + 5 };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown device_kind', () => {
    const bad = { ...validPhone, device_kind: 'fridge' };
    expect(ElectronicsFieldsRaw.safeParse(bad).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Conditional refinements — the meat of the schema
// ---------------------------------------------------------------------------

describe('phones-tablets conditionals', () => {
  it('accepts a complete phone', () => {
    const r = validateElectronicsFieldsRaw(validPhone, 'phones-tablets');
    expect(r.success).toBe(true);
  });

  it('rejects phone missing imei (P3)', () => {
    const { serial_or_imei_last_4: _, ...bad } = validPhone;
    const r = validateElectronicsFieldsRaw(bad as any, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('serial_or_imei_last_4');
    }
  });

  it('rejects phone missing storage_gb (P1)', () => {
    const { storage_gb: _, ...bad } = validPhone;
    const r = validateElectronicsFieldsRaw(bad as any, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map(i => i.path.join('.'));
      expect(paths).toContain('storage_gb');
    }
  });

  it('rejects phone missing region_spec (P5)', () => {
    const { region_spec: _, ...bad } = validPhone;
    const r = validateElectronicsFieldsRaw(bad as any, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('region_spec');
    }
  });

  it('rejects phone missing carrier_lock (P5 — phone-only branch)', () => {
    const { carrier_lock: _, ...bad } = validPhone;
    const r = validateElectronicsFieldsRaw(bad as any, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('carrier_lock');
    }
  });

  it('tablet (no carrier_lock) is accepted — carrier_lock only required for phones', () => {
    const tablet: ElectronicsFieldsRawT = {
      ...validPhone,
      device_kind: 'tablet',
    };
    delete (tablet as any).carrier_lock;
    const r = validateElectronicsFieldsRaw(tablet, 'phones-tablets');
    expect(r.success).toBe(true);
  });

  it('rejects console under phones-tablets (device_kind cross-check)', () => {
    const bad = { ...validPhone, device_kind: 'console' as const };
    const r = validateElectronicsFieldsRaw(bad, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('device_kind');
    }
  });
});

describe('laptops-computers conditionals', () => {
  it('accepts a complete laptop', () => {
    const r = validateElectronicsFieldsRaw(validLaptop, 'laptops-computers');
    expect(r.success).toBe(true);
  });

  it('rejects laptop missing cpu', () => {
    const { cpu: _, ...bad } = validLaptop;
    const r = validateElectronicsFieldsRaw(bad as any, 'laptops-computers');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('cpu');
    }
  });

  it('rejects laptop missing screen size', () => {
    const { screen_size_inches: _, ...bad } = validLaptop;
    const r = validateElectronicsFieldsRaw(bad as any, 'laptops-computers');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('screen_size_inches');
    }
  });

  it('desktop is accepted without screen_size_inches', () => {
    const desktop: ElectronicsFieldsRawT = {
      ...validLaptop,
      device_kind: 'desktop',
    };
    delete (desktop as any).screen_size_inches;
    const r = validateElectronicsFieldsRaw(desktop, 'laptops-computers');
    expect(r.success).toBe(true);
  });
});

describe('tvs-audio conditionals', () => {
  it('accepts a complete TV', () => {
    expect(validateElectronicsFieldsRaw(validTv, 'tvs-audio').success).toBe(true);
  });

  it('rejects TV missing screen_size_inches', () => {
    const { screen_size_inches: _, ...bad } = validTv;
    const r = validateElectronicsFieldsRaw(bad as any, 'tvs-audio');
    expect(r.success).toBe(false);
  });

  it('rejects TV missing resolution', () => {
    const { resolution: _, ...bad } = validTv;
    const r = validateElectronicsFieldsRaw(bad as any, 'tvs-audio');
    expect(r.success).toBe(false);
  });

  it('soundbar (non-TV) accepted without screen/resolution', () => {
    const soundbar: ElectronicsFieldsRawT = {
      device_kind: 'soundbar',
      brand: 'Sonos',
      model: 'Beam Gen 2',
      condition_grade: 'mint',
      connectivity: ['wifi', 'bluetooth'],
      repair_history: [],
      accessories_included: ['cable'],
    };
    expect(validateElectronicsFieldsRaw(soundbar, 'tvs-audio').success).toBe(true);
  });
});

describe('gaming conditionals', () => {
  it('accepts a complete console', () => {
    expect(validateElectronicsFieldsRaw(validConsole, 'gaming').success).toBe(true);
  });

  it('rejects console missing storage_gb', () => {
    const { storage_gb: _, ...bad } = validConsole;
    const r = validateElectronicsFieldsRaw(bad as any, 'gaming');
    expect(r.success).toBe(false);
  });

  it('accessory under gaming accepted with minimal fields', () => {
    const acc: ElectronicsFieldsRawT = {
      device_kind: 'accessory',
      brand: 'Sony',
      model: 'DualSense Edge controller',
      condition_grade: 'excellent',
      connectivity: ['bluetooth'],
      repair_history: [],
      accessories_included: ['box_only'],
    };
    expect(validateElectronicsFieldsRaw(acc, 'gaming').success).toBe(true);
  });
});

describe('smart-watches conditionals', () => {
  it('accepts a complete smart watch', () => {
    const r = validateElectronicsFieldsRaw(validSmartWatch, 'smart-watches');
    expect(r.success).toBe(true);
  });

  it('rejects smart watch missing battery_health (P4)', () => {
    const { battery_health_pct: _, ...bad } = validSmartWatch;
    const r = validateElectronicsFieldsRaw(bad as any, 'smart-watches');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('battery_health_pct');
    }
  });
});

describe('cameras conditionals', () => {
  it('accepts a lens with mount', () => {
    expect(validateElectronicsFieldsRaw(validCameraLens, 'cameras').success).toBe(true);
  });

  it('rejects lens without lens_mount', () => {
    const { lens_mount: _, ...bad } = validCameraLens;
    const r = validateElectronicsFieldsRaw(bad as any, 'cameras');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('lens_mount');
    }
  });

  it('accepts a camera body without lens_mount', () => {
    const body: ElectronicsFieldsRawT = {
      device_kind: 'camera',
      brand: 'Sony',
      model: 'A7 IV',
      condition_grade: 'excellent',
      connectivity: ['wifi', 'bluetooth'],
      repair_history: [],
      accessories_included: ['charger', 'cable', 'box_only'],
    };
    expect(validateElectronicsFieldsRaw(body, 'cameras').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting invariants
// ---------------------------------------------------------------------------

describe('cross-cutting invariants', () => {
  it('battery_cycles only allowed on laptops', () => {
    const bad = { ...validPhone, battery_cycles: 50 };
    const r = validateElectronicsFieldsRaw(bad, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('battery_cycles');
    }
  });

  it('warranty active in the past is rejected', () => {
    const expired: ElectronicsFieldsRawT = {
      ...validPhone,
      warranty_status: 'active_kuwait',
      warranty_expires_at: '2020-01-01',
    };
    const r = validateElectronicsFieldsRaw(expired, 'phones-tablets');
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map(i => i.path.join('.'))).toContain('warranty_expires_at');
    }
  });

  it('warranty expired status with past date is fine', () => {
    const ok: ElectronicsFieldsRawT = {
      ...validPhone,
      warranty_status: 'expired',
      warranty_expires_at: '2020-01-01',
    };
    expect(validateElectronicsFieldsRaw(ok, 'phones-tablets').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Draft schema — lenient
// ---------------------------------------------------------------------------

describe('ElectronicsFieldsDraftSchema (progressive wizard)', () => {
  it('accepts an empty object', () => {
    expect(ElectronicsFieldsDraftSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial payload (just brand+model so far)', () => {
    const r = ElectronicsFieldsDraftSchema.safeParse({
      brand: 'Apple',
      model: 'iPhone 15',
    });
    expect(r.success).toBe(true);
  });

  it('still rejects a structurally invalid enum mid-edit', () => {
    const r = ElectronicsFieldsDraftSchema.safeParse({
      device_kind: 'fridge',
    });
    expect(r.success).toBe(false);
  });
});

describe('isElectronicsFieldsDraftNonEmpty', () => {
  it('returns false for null / undefined / {}', () => {
    expect(isElectronicsFieldsDraftNonEmpty(null)).toBe(false);
    expect(isElectronicsFieldsDraftNonEmpty(undefined)).toBe(false);
    expect(isElectronicsFieldsDraftNonEmpty({})).toBe(false);
  });
  it('returns true once any key is set', () => {
    expect(isElectronicsFieldsDraftNonEmpty({ brand: 'Apple' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// camelCase transform
// ---------------------------------------------------------------------------

describe('toElectronicsFields camelCase transform', () => {
  it('renames every snake_case field correctly', () => {
    const out = toElectronicsFields(validPhone);
    expect(out.deviceKind).toBe('phone');
    expect(out.brand).toBe('Apple');
    expect(out.serialOrImeiLast4).toBe('4Z9K');
    expect(out.storageGb).toBe(256);
    expect(out.batteryHealthPct).toBe(92);
    expect(out.regionSpec).toBe('gcc');
    expect(out.carrierLock).toBe('unlocked');
    expect(out.conditionGrade).toBe('excellent');
    expect(out.connectivity).toEqual(['wifi6', '5g', 'bluetooth']);
  });
});

// ---------------------------------------------------------------------------
// Battery-health UI helper
// ---------------------------------------------------------------------------

describe('batteryHealthBand (P4)', () => {
  it.each([
    [100, 'green'],
    [90, 'green'],
    [85, 'green'],
    [84, 'amber'],
    [70, 'amber'],
    [69, 'red'],
    [40, 'red'],
    [0, 'red'],
  ])('%d%% → %s', (pct, want) => {
    expect(batteryHealthBand(pct)).toBe(want);
  });

  it('null → unknown (drives "Battery health undisclosed" warning)', () => {
    expect(batteryHealthBand(null)).toBe('unknown');
    expect(batteryHealthBand(undefined)).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// Brand+model latin retention (P12)
// ---------------------------------------------------------------------------

describe('brand + model fields (P12 — keep latin)', () => {
  it('accepts latin brand and model strings', () => {
    const r = ElectronicsFieldsRaw.safeParse({
      device_kind: 'phone',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      condition_grade: 'excellent',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty brand', () => {
    const r = ElectronicsFieldsRaw.safeParse({
      device_kind: 'phone',
      brand: '',
      model: 'iPhone 15',
      condition_grade: 'excellent',
    });
    expect(r.success).toBe(false);
  });

  it('rejects oversize brand string', () => {
    const r = ElectronicsFieldsRaw.safeParse({
      device_kind: 'phone',
      brand: 'A'.repeat(120),
      model: 'iPhone 15',
      condition_grade: 'excellent',
    });
    expect(r.success).toBe(false);
  });
});
