/**
 * Seed listings for the /rides page.
 *
 * Separate from src/components/shadcnblocks/listings-data.ts because the
 * rides page needs a richer sub-type taxonomy (cars / bikes / boats /
 * trucks / campers / bicycles) and bento-specific `spotlight` flags.
 * Live feed keeps using its original cars/property/tech/jobs schema.
 */

export type VehicleType =
  | 'cars'
  | 'bikes'
  | 'boats'
  | 'trucks'
  | 'campers'
  | 'bicycles';

export type BentoSize = 'standard' | 'spotlight' | 'wide';

export interface RideListing {
  id: number;
  type: VehicleType;
  title: string;
  price: string;
  oldPrice?: string;
  dropPct?: number;
  year: number;
  specA: string;
  specB: string;
  location: string;
  dealer: string;
  dealerVerified: boolean;
  image: string;
  images?: string[];
  photoCount: number;
  featured: boolean;
  hot: boolean;
  verifiedListing: boolean;
  bentoSize?: BentoSize;
  /** Watching / saves / inquiries — deterministic per-card on the client */
}

export const VEHICLE_TYPES: { key: VehicleType; emoji: string }[] = [
  { key: 'cars',      emoji: '🚗' },
  { key: 'bikes',     emoji: '🏍️' },
  { key: 'boats',     emoji: '🚤' },
  { key: 'trucks',    emoji: '🚛' },
  { key: 'campers',   emoji: '🚐' },
  { key: 'bicycles',  emoji: '🚴' },
];

// Per-type accent colors used by the card rail, chip dot, etc.
export const VEHICLE_COLORS: Record<VehicleType, string> = {
  cars:     '#ef4444',
  bikes:    '#f59e0b',
  boats:    '#0ea5e9',
  trucks:   '#78716c',
  campers:  '#10b981',
  bicycles: '#a855f7',
};

// ──────────────────────────────────────────────────────────────
// Seed listings (~20 items)
// bentoSize is advisory — the grid component decides the final
// layout but hints premium items.
// ──────────────────────────────────────────────────────────────

export const RIDE_LISTINGS: RideListing[] = [
  // — CARS ────────────────────────────────────────────────────
  {
    id: 1001, type: 'cars', title: 'BMW M5 Competition',
    price: 'AED 485,000', year: 2024, specA: '4.4L V8', specB: '0 km',
    location: 'Dubai Marina', dealer: 'Al-Futtaim Motors', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop',
    photoCount: 18, featured: true, hot: true, verifiedListing: true, bentoSize: 'spotlight',
  },
  {
    id: 1002, type: 'cars', title: 'Mercedes G63 AMG',
    price: 'AED 890,000', year: 2024, specA: '4.0L V8 Biturbo', specB: 'Brand new',
    location: 'Sheikh Zayed Rd', dealer: 'Gargash Motors', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&auto=format&fit=crop',
    photoCount: 22, featured: true, hot: true, verifiedListing: true,
  },
  {
    id: 1003, type: 'cars', title: 'Range Rover Sport Autobiography',
    price: 'AED 620,000', year: 2024, specA: '3.0L I6', specB: 'Warranty',
    location: 'Al Quoz', dealer: 'Al Tayer Motors', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&auto=format&fit=crop',
    photoCount: 15, featured: false, hot: true, verifiedListing: true,
  },
  {
    id: 1004, type: 'cars', title: 'Audi RS e-tron GT',
    price: 'AED 540,000', year: 2024, specA: 'Electric · 637hp', specB: '0 km',
    location: 'Business Bay', dealer: 'Audi UAE', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=900&auto=format&fit=crop',
    photoCount: 20, featured: false, hot: false, verifiedListing: true, bentoSize: 'wide',
  },
  {
    id: 1005, type: 'cars', title: 'Porsche 911 Carrera S',
    price: 'AED 720,000', oldPrice: 'AED 780,000', dropPct: -8,
    year: 2023, specA: '3.0L Flat 6', specB: '8K km',
    location: 'Jumeirah', dealer: 'Porsche Centre Dubai', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1614026480209-cfc01b3ee4d7?w=900&auto=format&fit=crop',
    photoCount: 25, featured: false, hot: true, verifiedListing: true,
  },
  {
    id: 1006, type: 'cars', title: 'Toyota Land Cruiser VX-R',
    price: 'AED 395,000', year: 2023, specA: '3.5L Twin-Turbo V6', specB: '12K km',
    location: 'Al Barsha', dealer: 'Al-Futtaim Motors', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=900&auto=format&fit=crop',
    photoCount: 14, featured: false, hot: false, verifiedListing: true,
  },
  {
    id: 1007, type: 'cars', title: 'Lexus LX 600 Ultra Luxury',
    price: 'AED 680,000', year: 2024, specA: '3.5L V6', specB: '5K km',
    location: 'DIFC', dealer: 'Lexus Dubai', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&auto=format&fit=crop',
    photoCount: 19, featured: true, hot: false, verifiedListing: true,
  },
  {
    id: 1008, type: 'cars', title: 'Tesla Model S Plaid',
    price: 'AED 420,000', oldPrice: 'AED 465,000', dropPct: -10,
    year: 2023, specA: 'Electric · 1020hp', specB: '15K km',
    location: 'Downtown Dubai', dealer: 'EV Motors', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=900&auto=format&fit=crop',
    photoCount: 17, featured: false, hot: true, verifiedListing: true,
  },

  // — BIKES ───────────────────────────────────────────────────
  {
    id: 2001, type: 'bikes', title: 'Ducati Panigale V4 S',
    price: 'AED 185,000', year: 2024, specA: '1103cc', specB: '0 km',
    location: 'Al Quoz', dealer: 'Ducati Dubai', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&auto=format&fit=crop',
    photoCount: 12, featured: false, hot: true, verifiedListing: true, bentoSize: 'wide',
  },
  {
    id: 2002, type: 'bikes', title: 'Harley-Davidson Street Glide ST',
    price: 'AED 145,000', year: 2023, specA: '1923cc V-Twin', specB: '2K km',
    location: 'Al Barsha', dealer: 'Harley Dubai', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&auto=format&fit=crop',
    photoCount: 15, featured: false, hot: false, verifiedListing: true,
  },
  {
    id: 2003, type: 'bikes', title: 'Yamaha YZF-R1',
    price: 'AED 92,000', year: 2022, specA: '998cc inline-4', specB: '8K km',
    location: 'Sharjah', dealer: 'Private seller', dealerVerified: false,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop',
    photoCount: 8, featured: false, hot: false, verifiedListing: true,
  },

  // — BOATS ───────────────────────────────────────────────────
  {
    id: 3001, type: 'boats', title: 'Princess Y72 Motor Yacht',
    price: 'AED 14,500,000', year: 2023, specA: '72 ft · Twin MAN V12', specB: '150 hrs',
    location: 'Dubai Marina', dealer: 'Princess Yachts', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200&auto=format&fit=crop',
    photoCount: 32, featured: true, hot: true, verifiedListing: true, bentoSize: 'spotlight',
  },
  {
    id: 3002, type: 'boats', title: 'Axopar 37 Cabin',
    price: 'AED 1,250,000', year: 2024, specA: '37 ft · Twin Mercury 300hp', specB: '0 hrs',
    location: 'Mina Rashid', dealer: 'Gulf Craft', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1609436132311-e4b0c9302506?w=900&auto=format&fit=crop',
    photoCount: 18, featured: false, hot: false, verifiedListing: true,
  },
  {
    id: 3003, type: 'boats', title: 'Yamaha FX Cruiser SVHO Jet Ski',
    price: 'AED 78,000', year: 2024, specA: 'Supercharged 1812cc', specB: '0 hrs',
    location: 'Jumeirah Beach', dealer: 'Al Yousuf Motors', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1612875895280-4fbee8c64b03?w=900&auto=format&fit=crop',
    photoCount: 9, featured: false, hot: true, verifiedListing: true,
  },
  {
    id: 3004, type: 'boats', title: 'Fishing Boat 28ft · Twin Yamaha 250',
    price: 'AED 180,000', year: 2021, specA: '28 ft · Fiberglass', specB: '450 hrs',
    location: 'Umm Al Quwain', dealer: 'Private seller', dealerVerified: false,
    image: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?w=900&auto=format&fit=crop',
    photoCount: 11, featured: false, hot: false, verifiedListing: true,
  },

  // — TRUCKS ──────────────────────────────────────────────────
  {
    id: 4001, type: 'trucks', title: 'Mercedes-Benz Actros 2545',
    price: 'AED 340,000', year: 2022, specA: '6×2 · 450hp', specB: '180K km',
    location: 'Jebel Ali', dealer: 'EMC Heavy', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900&auto=format&fit=crop',
    photoCount: 14, featured: false, hot: false, verifiedListing: true,
  },
  {
    id: 4002, type: 'trucks', title: 'Volvo FH 460 Globetrotter',
    price: 'AED 285,000', year: 2021, specA: '6×2 · 460hp', specB: '240K km',
    location: 'Sharjah Industrial', dealer: 'Famco', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1586191582056-b7f0538a2a3a?w=900&auto=format&fit=crop',
    photoCount: 10, featured: false, hot: false, verifiedListing: true,
  },

  // — CAMPERS ─────────────────────────────────────────────────
  {
    id: 5001, type: 'campers', title: 'Mercedes Sprinter Camper Conversion',
    price: 'AED 265,000', year: 2023, specA: '2.0L Diesel · 4×4', specB: '8K km',
    location: 'Al Barsha', dealer: 'Nomad RV', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=900&auto=format&fit=crop',
    photoCount: 24, featured: true, hot: true, verifiedListing: true, bentoSize: 'wide',
  },
  {
    id: 5002, type: 'campers', title: 'Off-Road Caravan · 4 Berth',
    price: 'AED 95,000', year: 2022, specA: 'Solar + Lithium', specB: 'Dual axle',
    location: 'Ras Al Khaimah', dealer: 'Private seller', dealerVerified: false,
    image: 'https://images.unsplash.com/photo-1533747122638-a6f54e1c6b9d?w=900&auto=format&fit=crop',
    photoCount: 16, featured: false, hot: false, verifiedListing: true,
  },

  // — BICYCLES ────────────────────────────────────────────────
  {
    id: 6001, type: 'bicycles', title: 'Specialized S-Works Tarmac SL8',
    price: 'AED 48,000', year: 2024, specA: 'Carbon · SRAM Red AXS', specB: '0 km',
    location: 'City Walk', dealer: 'Ride Bike Shop', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=900&auto=format&fit=crop',
    photoCount: 13, featured: false, hot: true, verifiedListing: true,
  },
  {
    id: 6002, type: 'bicycles', title: 'Riese & Müller Delite GT e-Bike',
    price: 'AED 36,500', year: 2024, specA: 'Bosch CX 750Wh', specB: '0 km',
    location: 'JBR', dealer: 'Wolfi\'s Bike Shop', dealerVerified: true,
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900&auto=format&fit=crop',
    photoCount: 9, featured: false, hot: false, verifiedListing: true,
  },
];
