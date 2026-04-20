import type { RideListing, VehicleType } from './rides-data';

/**
 * Builds a rich gallery for a listing. Since seed data only has one
 * `image`, we synthesize ~12 categorized photos per listing from a
 * curated per-type pool. Categories feed the gallery's filter pills.
 */

export type GalleryCategory =
  | 'exterior'
  | 'interior'
  | 'engine'
  | 'wheels'
  | 'details';

export interface GalleryImage {
  src: string;
  category: GalleryCategory;
  alt: string;
}

// ─── Photo pool per vehicle type ──────────────────────────────
// All verified Unsplash photo IDs (high-res, automotive-focused).
const POOL: Record<VehicleType, Record<GalleryCategory, string[]>> = {
  cars: {
    exterior: [
      '1555215695-3004980ad54e',
      '1606664515524-ed2f786a0bd6',
      '1583121274602-3e2820c69888',
      '1614026480209-cfc01b3ee4d7',
      '1503376780353-7e6692767b70',
      '1494976388531-d1058494cdd8',
    ],
    interior: [
      '1542362567-b07e54358753',
      '1537984822441-cff330075342',
      '1511919884226-fd3cad34687c',
      '1552519507-da3b142c6e3d',
    ],
    engine: [
      '1486262715619-67b85e0b08d3',
      '1492144534655-ae79c964c9d7',
      '1597007519128-778c3648dae6',
    ],
    wheels: [
      '1542362567-b07e54358753',
      '1617531653332-bd46c24f2068',
      '1580273916550-e323be2ae537',
    ],
    details: [
      '1552519507-da3b142c6e3d',
      '1494976388531-d1058494cdd8',
    ],
  },
  bikes: {
    exterior: [
      '1568772585407-9361f9bf3a87',
      '1558981806-ec527fa84c39',
      '1611241443322-b5c0ae1e7633',
      '1525160354320-d8e92641c563',
    ],
    interior: ['1558981403-c5f9899a28bc'],
    engine: ['1547549082-6bc09f2049ae', '1611241443322-b5c0ae1e7633'],
    wheels: ['1558981403-c5f9899a28bc', '1558981806-ec527fa84c39'],
    details: ['1568772585407-9361f9bf3a87'],
  },
  boats: {
    exterior: [
      '1567899378494-47b22a2ae96a',
      '1527431016407-d2a68d8a1c59',
      '1514282401047-d79a71a590e8',
      '1548574505-5e239809ee19',
    ],
    interior: ['1527431016407-d2a68d8a1c59'],
    engine: ['1514282401047-d79a71a590e8'],
    wheels: ['1567899378494-47b22a2ae96a'],
    details: ['1548574505-5e239809ee19'],
  },
  trucks: {
    exterior: [
      '1605893477799-b99e3b8b93fe',
      '1609630875171-b1321377ee65',
      '1595872018818-97555653a011',
    ],
    interior: ['1519641471654-76ce0107ad1b'],
    engine: ['1486262715619-67b85e0b08d3'],
    wheels: ['1617531653332-bd46c24f2068'],
    details: ['1605893477799-b99e3b8b93fe'],
  },
  campers: {
    exterior: [
      '1523987355523-c7b5b0dd90a7',
      '1519641471654-76ce0107ad1b',
      '1533131295891-b70f7f43e45e',
    ],
    interior: ['1494976388531-d1058494cdd8'],
    engine: ['1492144534655-ae79c964c9d7'],
    wheels: ['1580273916550-e323be2ae537'],
    details: ['1523987355523-c7b5b0dd90a7'],
  },
  bicycles: {
    exterior: [
      '1532298229144-0ec0c57515c7',
      '1485965120184-e220f721d03e',
      '1502744688674-c619d1586c9e',
    ],
    interior: [],
    engine: [],
    wheels: ['1485965120184-e220f721d03e', '1502744688674-c619d1586c9e'],
    details: ['1532298229144-0ec0c57515c7'],
  },
};

const toSrc = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=80`;

/**
 * buildRideGallery — returns a deterministic list of gallery images
 * for a listing. The listing's own `image` is always first.
 */
export const buildRideGallery = (listing: RideListing): GalleryImage[] => {
  const pool = POOL[listing.type];
  const out: GalleryImage[] = [];

  // 1) Main image goes first as exterior
  out.push({
    src: listing.image,
    category: 'exterior',
    alt: `${listing.title} — exterior`,
  });

  // 2) Pull remaining by category, deterministically based on id
  const order: GalleryCategory[] = [
    'exterior',
    'exterior',
    'interior',
    'interior',
    'engine',
    'wheels',
    'details',
    'exterior',
    'interior',
    'wheels',
    'details',
  ];

  order.forEach((cat, i) => {
    const ids = pool[cat];
    if (!ids || ids.length === 0) return;
    const picked = ids[(Number(listing.id) + i) % ids.length];
    const src = toSrc(picked);
    // skip if we already have the same src (the listing.image case)
    if (out.some((img) => img.src === src)) return;
    out.push({ src, category: cat, alt: `${listing.title} — ${cat}` });
  });

  return out;
};

export const galleryThumb = (src: string) => {
  // Rewrite width param to 320 for lightweight thumbnails
  return src.replace(/w=\d+/, 'w=320');
};

