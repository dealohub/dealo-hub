import type { RideListing, VehicleType } from './rides-data';

/**
 * Deterministically synthesize a full spec sheet for a listing.
 * Seed data only carries title/price/year/specA/specB — this fills
 * out the rest using a stable hash of listing.id so detail pages stay
 * consistent between renders.
 */

export type RegionSpec = 'gcc' | 'american' | 'european' | 'japanese';
export type Transmission = 'automatic' | 'manual' | 'dct';
export type Drivetrain = 'awd' | 'fwd' | 'rwd' | '4wd';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export interface RideSpecs {
  year: number;
  mileageKm: number;
  mileageLabel: string;

  bodyType: string;
  exteriorColor: { key: string; hex: string };
  interiorColor: { key: string; hex: string };
  regionSpec: RegionSpec;

  engine: string;
  displacement: string;
  cylinders: number;
  transmission: Transmission;
  drivetrain: Drivetrain;
  fuel: FuelType;

  doors: number;
  seats: number;

  warranty: { active: boolean; remainingMonths: number };
  vin: string;
  registration: string;

  // Market context
  marketAvgMileageKm: number;
  mileageVsMarketPct: number; // negative = below avg (good)

  // Performance
  performance: {
    horsepower: number;
    torqueNm: number;
    zeroToHundred: number; // seconds
    topSpeedKmh: number;
    fuelEfficiency: number; // L/100km (0 for electric)
    rangeKm: number; // km (electric only, 0 otherwise)
    co2: number; // g/km (0 for electric)
  };

  // Features — set of feature keys the listing has
  features: Set<FeatureKey>;
}

// ─── Feature taxonomy ────────────────────────────────
export type FeatureCategory =
  | 'safety'
  | 'comfort'
  | 'tech'
  | 'entertainment'
  | 'exterior';

export type FeatureKey =
  // safety
  | 'abs'
  | 'airbags'
  | 'esp'
  | 'laneAssist'
  | 'blindSpot'
  | 'adaptiveCruise'
  | 'camera360'
  | 'parkingSensors'
  // comfort
  | 'leatherSeats'
  | 'heatedSeats'
  | 'ventilatedSeats'
  | 'climateControl'
  | 'sunroof'
  | 'keylessEntry'
  | 'remoteStart'
  | 'powerSeats'
  // tech
  | 'applecarplay'
  | 'androidauto'
  | 'navigation'
  | 'wirelessCharging'
  | 'headupDisplay'
  | 'digitalCluster'
  | 'premiumSound'
  | 'bluetooth'
  // entertainment
  | 'rearEntertainment'
  | 'ambientLighting'
  // exterior
  | 'ledHeadlights'
  | 'alloyWheels'
  | 'powerTailgate'
  | 'towHitch'
  | 'roofRack';

export const FEATURE_CATEGORIES: Record<FeatureCategory, FeatureKey[]> = {
  safety: [
    'abs',
    'airbags',
    'esp',
    'adaptiveCruise',
    'laneAssist',
    'blindSpot',
    'camera360',
    'parkingSensors',
  ],
  comfort: [
    'leatherSeats',
    'heatedSeats',
    'ventilatedSeats',
    'climateControl',
    'sunroof',
    'keylessEntry',
    'remoteStart',
    'powerSeats',
  ],
  tech: [
    'applecarplay',
    'androidauto',
    'navigation',
    'wirelessCharging',
    'headupDisplay',
    'digitalCluster',
    'premiumSound',
    'bluetooth',
  ],
  entertainment: ['rearEntertainment', 'ambientLighting'],
  exterior: [
    'ledHeadlights',
    'alloyWheels',
    'powerTailgate',
    'towHitch',
    'roofRack',
  ],
};

const COLOR_POOL = [
  { key: 'white', hex: '#f5f5f5' },
  { key: 'black', hex: '#18181b' },
  { key: 'silver', hex: '#bfbfbf' },
  { key: 'grey', hex: '#71717a' },
  { key: 'blue', hex: '#1e40af' },
  { key: 'red', hex: '#b91c1c' },
  { key: 'green', hex: '#064e3b' },
  { key: 'beige', hex: '#d6c4a5' },
];
const INTERIOR_POOL = [
  { key: 'black', hex: '#18181b' },
  { key: 'beige', hex: '#d6c4a5' },
  { key: 'brown', hex: '#78350f' },
  { key: 'red', hex: '#7f1d1d' },
  { key: 'grey', hex: '#52525b' },
];

const BODY_BY_TYPE: Record<VehicleType, string[]> = {
  cars: ['sedan', 'suv', 'coupe', 'hatchback', 'sedan'],
  bikes: ['sport', 'cruiser', 'touring', 'adventure'],
  boats: ['yacht', 'motorYacht', 'fishing'],
  trucks: ['pickup', 'pickupSingle', 'pickupDouble'],
  campers: ['motorhome', 'classB', 'travelTrailer'],
  bicycles: ['road', 'mountain', 'hybrid', 'city'],
};

const hash = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
};

const hashAt = (h: number, shift: number) => (h >>> shift) >>> 0;

// ─── Intelligent title-aware guessers ────────────────
const guessBody = (listing: RideListing, h: number): string => {
  const title = listing.title.toLowerCase();
  if (listing.type === 'cars') {
    if (/suv|cruiser|range rover|g63|lx|x5|cayenne/.test(title)) return 'suv';
    if (/coupe|911|gt|rs|m4|m8/.test(title)) return 'coupe';
    if (/hatch/.test(title)) return 'hatchback';
    return 'sedan';
  }
  const pool = BODY_BY_TYPE[listing.type];
  return pool[hashAt(h, 3) % pool.length];
};

const guessFuel = (listing: RideListing): FuelType => {
  const s = (listing.title + ' ' + listing.specA).toLowerCase();
  if (/electric|tesla|e-tron|plaid|ev/.test(s)) return 'electric';
  if (/hybrid/.test(s)) return 'hybrid';
  if (/diesel/.test(s)) return 'diesel';
  return 'petrol';
};

const guessDrivetrain = (listing: RideListing, h: number): Drivetrain => {
  const s = listing.title.toLowerCase();
  if (/m5|m4|m8|rs|amg|gt3/.test(s)) return 'awd';
  if (/land cruiser|range rover|g63|lx|4x4/.test(s)) return '4wd';
  if (/911|mustang|charger/.test(s)) return 'rwd';
  if (listing.type === 'cars') {
    return (['awd', 'rwd', 'fwd'] as const)[hashAt(h, 5) % 3];
  }
  return 'awd';
};

const guessCylinders = (listing: RideListing, h: number): number => {
  const s = listing.specA.toLowerCase();
  if (/v12/.test(s)) return 12;
  if (/v10/.test(s)) return 10;
  if (/v8/.test(s)) return 8;
  if (/v6|i6|inline.6|flat 6/.test(s)) return 6;
  if (/electric/.test(s)) return 0;
  const pool = [4, 4, 6, 6, 8];
  return pool[hashAt(h, 7) % pool.length];
};

const guessDisplacement = (listing: RideListing): string => {
  const m = listing.specA.match(/([\d.]+)\s*L/i);
  return m ? `${m[1]}L` : '';
};

// Stable fake VIN (valid 17 chars, I/O/Q forbidden — use the real rule)
const genVin = (h: number, year: number): string => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  const arr: string[] = [];
  let s = h;
  for (let i = 0; i < 17; i++) {
    if (i === 9) {
      // Position 10 = year code
      const yearCodes = 'ABCDEFGHJKLMNPRSTVWXY123456789';
      arr.push(yearCodes[year % yearCodes.length]);
    } else {
      s = (s * 1103515245 + 12345) >>> 0;
      arr.push(chars[s % chars.length]);
    }
  }
  return arr.join('');
};

const genRegistration = (h: number): string => {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const L = letters[hashAt(h, 2) % letters.length];
  const N = 10000 + (hashAt(h, 11) % 89999);
  return `${L} ${N}`;
};

// ─── Main builder ────────────────────────────────────
export const buildRideSpecs = (listing: RideListing): RideSpecs => {
  const h = hash(String(listing.id));

  // Mileage — specB may be "0 km", "12K km", "Brand new", "Warranty"
  const kmMatch = listing.specB.match(/([\d.]+)\s*[kK]?/);
  let mileageKm = 0;
  if (/brand new|0\s*km|warranty/i.test(listing.specB)) {
    mileageKm = 0;
  } else if (kmMatch) {
    const base = parseFloat(kmMatch[1]);
    mileageKm = /k/i.test(listing.specB) ? Math.round(base * 1000) : Math.round(base);
  }

  // Rough market-average mileage for the listing's year
  const age = Math.max(0, 2026 - listing.year);
  const marketAvgMileageKm = age === 0 ? 8000 : age * 14000;
  const mileageVsMarketPct =
    marketAvgMileageKm === 0
      ? 0
      : Math.round(
          ((mileageKm - marketAvgMileageKm) / marketAvgMileageKm) * 100,
        );

  const exterior = COLOR_POOL[hashAt(h, 3) % COLOR_POOL.length];
  const interior = INTERIOR_POOL[hashAt(h, 6) % INTERIOR_POOL.length];

  const fuel = guessFuel(listing);
  const cylinders = fuel === 'electric' ? 0 : guessCylinders(listing, h);
  const transmission: Transmission =
    fuel === 'electric'
      ? 'automatic'
      : (['automatic', 'automatic', 'dct', 'manual'] as const)[hashAt(h, 4) % 4];

  const regionPool: RegionSpec[] = ['gcc', 'gcc', 'american', 'european', 'japanese'];
  const regionSpec = regionPool[hashAt(h, 8) % regionPool.length];

  const seats =
    listing.type === 'cars'
      ? [2, 4, 5, 5, 5, 7, 7][hashAt(h, 9) % 7]
      : listing.type === 'bikes'
      ? 2
      : listing.type === 'boats'
      ? 4 + (hashAt(h, 9) % 8)
      : listing.type === 'trucks'
      ? 2 + (hashAt(h, 9) % 4)
      : listing.type === 'campers'
      ? 4 + (hashAt(h, 9) % 4)
      : 1;

  const doors =
    listing.type === 'cars'
      ? [2, 4, 4, 4, 5][hashAt(h, 10) % 5]
      : listing.type === 'trucks'
      ? [2, 4][hashAt(h, 10) % 2]
      : listing.type === 'campers'
      ? 3
      : 0;

  // Warranty — new cars → active; older → 50/50
  const isNew = mileageKm < 2000;
  const warrantyActive =
    isNew || listing.featured || (hashAt(h, 12) % 3 !== 0);
  const warrantyRemainingMonths = warrantyActive
    ? Math.max(
        1,
        36 - age * 12 + ((hashAt(h, 13) % 12) - 6),
      )
    : 0;

  // ── Performance synthesis (title-aware) ────────────
  const title = listing.title.toLowerCase();
  let horsepower = 220 + (hashAt(h, 14) % 200);
  let zeroToHundred = 6.5 + ((hashAt(h, 15) % 40) / 10);
  let topSpeedKmh = 210 + (hashAt(h, 16) % 60);

  // Tuning based on title keywords — makes numbers match the car
  if (/m5|m8|rs|amg|plaid|turbo s|gt3|911|panigale|v4/.test(title)) {
    horsepower = 520 + (hashAt(h, 14) % 200);
    zeroToHundred = 2.5 + ((hashAt(h, 15) % 15) / 10);
    topSpeedKmh = 280 + (hashAt(h, 16) % 40);
  } else if (/m4|m3|s6|s5|gt|supra|rs5/.test(title)) {
    horsepower = 400 + (hashAt(h, 14) % 150);
    zeroToHundred = 3.5 + ((hashAt(h, 15) % 15) / 10);
    topSpeedKmh = 250 + (hashAt(h, 16) % 30);
  } else if (/land cruiser|range rover|g63|lx|g-class/.test(title)) {
    horsepower = 380 + (hashAt(h, 14) % 200);
    zeroToHundred = 5.5 + ((hashAt(h, 15) % 25) / 10);
    topSpeedKmh = 220 + (hashAt(h, 16) % 20);
  }

  // Electric rewrite
  if (fuel === 'electric') {
    horsepower = Math.max(horsepower, 400);
    zeroToHundred = Math.min(zeroToHundred, 3.5);
  }

  // Torque ≈ HP × 1.15-1.35 (matches real BMW / Mercedes figures)
  const torqueNm = Math.round(
    horsepower * (1.15 + ((hashAt(h, 17) % 20) / 100)),
  );
  // Fuel efficiency scales with power but stays in realistic ranges:
  //   250hp sedan: ~7-11 L/100km · 600hp M5: ~10-14 · 800hp hypercar: ~13-16
  const fuelEfficiency =
    fuel === 'electric'
      ? 0
      : Math.round((5.5 + (hashAt(h, 18) % 4) + horsepower / 180) * 10) / 10;
  const rangeKm = fuel === 'electric' ? 380 + (hashAt(h, 19) % 220) : 0;
  // CO₂ (g/km) ≈ L/100km × 23.5 for petrol, × 26 for diesel
  const co2Factor = fuel === 'diesel' ? 26 : 23.5;
  const co2 = fuel === 'electric' ? 0 : Math.round(fuelEfficiency * co2Factor);

  // ── Features — deterministic, more features for premium listings ─
  const allFeatures: FeatureKey[] = [
    ...FEATURE_CATEGORIES.safety,
    ...FEATURE_CATEGORIES.comfort,
    ...FEATURE_CATEGORIES.tech,
    ...FEATURE_CATEGORIES.entertainment,
    ...FEATURE_CATEGORIES.exterior,
  ];
  const features = new Set<FeatureKey>();
  // Baseline features almost every modern car has
  ['abs', 'airbags', 'esp', 'bluetooth', 'alloyWheels', 'ledHeadlights'].forEach((f) =>
    features.add(f as FeatureKey),
  );
  // Premium / hot listings get more
  const baseThreshold = listing.featured ? 0.8 : listing.hot ? 0.65 : 0.5;
  allFeatures.forEach((f, i) => {
    const roll = ((hashAt(h, 20 + i) % 100) / 100);
    if (roll < baseThreshold) features.add(f);
  });
  // Electric cars don't get engine-related features that don't make sense — all fine actually
  // Pickups get tow hitch and roof rack
  if (listing.type === 'trucks' || /cruiser|range|g63|lx/.test(title)) {
    features.add('towHitch');
    features.add('roofRack');
  }

  return {
    year: listing.year,
    mileageKm,
    mileageLabel: listing.specB,
    bodyType: guessBody(listing, h),
    exteriorColor: exterior,
    interiorColor: interior,
    regionSpec,
    engine: listing.specA,
    displacement: guessDisplacement(listing),
    cylinders,
    transmission,
    drivetrain: guessDrivetrain(listing, h),
    fuel,
    doors,
    seats,
    warranty: {
      active: warrantyActive,
      remainingMonths: Math.round(warrantyRemainingMonths),
    },
    vin: genVin(h, listing.year),
    registration: genRegistration(h),
    marketAvgMileageKm,
    mileageVsMarketPct,
    performance: {
      horsepower: Math.round(horsepower),
      torqueNm,
      zeroToHundred: Math.round(zeroToHundred * 10) / 10,
      topSpeedKmh: Math.round(topSpeedKmh),
      fuelEfficiency: Math.round(fuelEfficiency * 10) / 10,
      rangeKm: Math.round(rangeKm),
      co2,
    },
    features,
  };
};
