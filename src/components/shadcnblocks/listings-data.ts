/**
 * Shared seed data for marketplace listings used across the UI.
 *
 * Consumed by:
 *   - Feature283 (hero scatters 6 of these images around the headline)
 *   - LiveFeed   (renders them as cards + simulates new items every 8s)
 *
 * Keeping the source of truth in one place means the hero imagery
 * always reflects the listings surfaced below. When this moves to
 * real data from Supabase, both consumers migrate together.
 */

import type { CategoryKey } from './live-feed-parts';

export interface SeedListing {
  id: number;
  cat: CategoryKey;
  title: string;
  meta: string;
  price: string;
  loc: string;
  dealer: string;
  verified: boolean;
  featured: boolean;
  image: string;
}

export interface SeedPriceDrop {
  id: number;
  cat: CategoryKey;
  title: string;
  meta: string;
  oldPrice: string;
  price: string;
  drop: number;
  loc: string;
  dealer: string;
  verified: boolean;
  image: string;
}

export const SEED_LISTINGS: SeedListing[] = [
  { id: 101, cat: 'cars',     title: 'BMW X5 xDrive40i M Sport',          meta: '2023 · 12K km · Full option',      price: 'AED 285,000',    loc: 'Dubai Marina',    dealer: 'Al-Futtaim Motors',  verified: true, featured: false, image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop' },
  { id: 102, cat: 'property', title: '2BR Apartment · Marina Pinnacle',   meta: '1,240 sqft · Fully furnished',     price: 'AED 125,000/yr', loc: 'Dubai Marina',    dealer: 'Emaar Residences',   verified: true, featured: true,  image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop' },
  { id: 103, cat: 'tech',     title: 'iPhone 15 Pro Max · 256GB',         meta: 'Natural Titanium · Sealed',        price: 'AED 4,299',      loc: 'Deira, Dubai',    dealer: 'Sharaf DG',          verified: true, featured: false, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop' },
  { id: 104, cat: 'cars',     title: 'Mercedes G63 AMG',                   meta: '2024 · Brand new · GCC',           price: 'AED 890,000',    loc: 'Sheikh Zayed Rd', dealer: 'Gargash Motors',     verified: true, featured: true,  image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop' },
  { id: 105, cat: 'property', title: 'Villa · Palm Jumeirah',             meta: '5BR · Private beach · Signature',  price: 'AED 48,000,000', loc: 'Palm Jumeirah',   dealer: 'Damac Properties',   verified: true, featured: true,  image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&auto=format&fit=crop' },
  { id: 106, cat: 'tech',     title: 'MacBook Pro 16 · M3 Max',           meta: '64GB · 2TB · Space Black',         price: 'AED 12,499',     loc: 'Mall of the Emirates', dealer: 'Virgin Megastore', verified: true, featured: false, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop' },
  { id: 107, cat: 'cars',     title: 'Range Rover Sport Autobiography',   meta: '2024 · 3.0L · Warranty',           price: 'AED 620,000',    loc: 'Al Quoz',         dealer: 'Al Tayer Motors',    verified: true, featured: false, image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop' },
  { id: 108, cat: 'property', title: 'Office Space · DIFC',               meta: '2,800 sqft · Grade A',             price: 'AED 380,000/yr', loc: 'DIFC, Dubai',     dealer: 'Deyaar',             verified: true, featured: false, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop' },
];

export const SEED_PRICE_DROPS: SeedPriceDrop[] = [
  { id: 201, cat: 'cars',     title: 'Audi Q8 55 TFSI Quattro',              meta: '2022 · 28K km',            oldPrice: 'AED 320,000',   price: 'AED 279,000',   drop: -13, loc: 'JLT',              dealer: 'Audi UAE',          verified: true, image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop' },
  { id: 202, cat: 'property', title: '3BR Townhouse · Arabian Ranches',       meta: "2,200 sqft · Maid's room", oldPrice: 'AED 3,200,000', price: 'AED 2,850,000', drop: -11, loc: 'Arabian Ranches', dealer: 'Emaar Properties',  verified: true, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop' },
  { id: 203, cat: 'tech',     title: 'iPad Pro 12.9 · M2 · 1TB',              meta: 'Wi-Fi + Cellular · Silver', oldPrice: 'AED 6,199',     price: 'AED 5,299',     drop: -15, loc: 'Ibn Battuta',     dealer: 'Jumbo Electronics', verified: true, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop' },
];

export const ACTIVITY_SIGNALS = [
  '12 new cars listed in the last hour across Dubai',
  'A villa in Emirates Hills just sold for AED 62M',
  '3 people are viewing this BMW X5 right now',
  'Apartments in Marina averaging 4% higher this week',
  'Verified dealer Al-Futtaim added 8 new listings today',
  'Gold-tier listings getting 3× more inquiries on average',
  'New record: 847 properties listed today',
];

/**
 * Hero picks — 6 listings chosen to mix categories (2 cars, 2 property,
 * 2 tech) for the scattered images around the Feature283 headline.
 * Indices into SEED_LISTINGS.
 */
export const HERO_LISTING_INDICES = [3, 1, 2, 0, 4, 5] as const;
