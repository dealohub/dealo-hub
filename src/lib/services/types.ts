/**
 * Phase 8a — Home Services vertical types.
 *
 * Mirrors the shape of src/lib/electronics/types.ts and
 * src/lib/properties/types.ts:
 *   - Re-exports validated ServiceFields from ./validators
 *   - Defines ServiceDetail + ServiceCard consumer interfaces
 *   - Defines provider-verification tier (reuses the platform tiering
 *     idiom used on listings.verification_tier, but for profiles)
 *
 * Scope (doctrine §1): `home-services` sub-cat only in Phase 8a.
 * The 8 task_type values are the full v1 scope — no expansion without
 * a new doctrine phase.
 */

import type { ServiceFields } from './validators';

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

/** Sub-cat slugs active in Phase 8a. Only 1 value today. */
export type ServiceCategoryKey = 'home-services';

/** Single source of truth. Every Phase 8a listing resolves to one of these. */
export const SERVICE_SUB_CATS: ReadonlyArray<ServiceCategoryKey> = [
  'home-services',
];

export function isServiceSubCat(slug: string | undefined | null): slug is ServiceCategoryKey {
  return slug != null && (SERVICE_SUB_CATS as ReadonlyArray<string>).includes(slug);
}

/** The 8 task_type values that gate Phase 8a scope. */
export type TaskType =
  | 'home_cleaning_one_off'
  | 'home_cleaning_recurring'
  | 'handyman_ikea_assembly'
  | 'handyman_tv_mount'
  | 'handyman_shelf_hang'
  | 'handyman_furniture_move'
  | 'handyman_basic_painting'
  | 'handyman_other';

export const TASK_TYPES: ReadonlyArray<TaskType> = [
  'home_cleaning_one_off',
  'home_cleaning_recurring',
  'handyman_ikea_assembly',
  'handyman_tv_mount',
  'handyman_shelf_hang',
  'handyman_furniture_move',
  'handyman_basic_painting',
  'handyman_other',
];

/** Which task types are cleaning vs. handyman — used by UI grouping. */
export function taskTypeFamily(t: TaskType): 'cleaning' | 'handyman' {
  return t.startsWith('home_cleaning_') ? 'cleaning' : 'handyman';
}

// ---------------------------------------------------------------------------
// Pricing modes (P7 transparent pricing)
// ---------------------------------------------------------------------------

export type PriceMode = 'hourly' | 'fixed' | 'hybrid';

// ---------------------------------------------------------------------------
// Availability summary (coarse — real slot-level is in booking_proposals)
// ---------------------------------------------------------------------------

export type AvailabilitySummary =
  | 'daytime_weekdays'
  | 'daytime_weekends'
  | 'evenings'
  | 'flexible';

// ---------------------------------------------------------------------------
// Provider verification tier (P2)
// ---------------------------------------------------------------------------
//
// Mirrors profiles.services_provider_verification_tier column enum
// (migration 0037). Typed here so consumers have a compile-time guarantee
// they never render a typo like 'identityverified'.

export type ServiceProviderVerificationTier =
  | 'unverified'
  | 'identity_verified'
  | 'address_verified'
  | 'dealo_inspected';

// ---------------------------------------------------------------------------
// Languages (P10 plain-language UX; Arabic-first but multilingual reality)
// ---------------------------------------------------------------------------

export type ProviderLanguage = 'ar' | 'en' | 'hi' | 'ur' | 'tl' | 'ml';

export const PROVIDER_LANGUAGES: ReadonlyArray<ProviderLanguage> = [
  'ar', 'en', 'hi', 'ur', 'tl', 'ml',
];

// ---------------------------------------------------------------------------
// GCC Kuwait governorates (P6 — doctrine restricts to Kuwait for v1)
// ---------------------------------------------------------------------------

export type KwGovernorate =
  | 'capital'         // محافظة العاصمة
  | 'hawalli'         // محافظة حولي
  | 'farwaniya'       // محافظة الفروانية
  | 'mubarak_al_kabeer' // محافظة مبارك الكبير
  | 'ahmadi'          // محافظة الأحمدي
  | 'jahra';          // محافظة الجهراء

export const KW_GOVERNORATES: ReadonlyArray<KwGovernorate> = [
  'capital', 'hawalli', 'farwaniya', 'mubarak_al_kabeer', 'ahmadi', 'jahra',
];

// ---------------------------------------------------------------------------
// Chat-primitive kinds (Phase 8a P4) — mirror messages.kind enum from 0038
// ---------------------------------------------------------------------------

export type MessageKind =
  | 'free_text'
  | 'offer'
  | 'quote_request'
  | 'quote_response'
  | 'booking_proposal'
  | 'completion_mark';

export const SERVICE_MESSAGE_KINDS: ReadonlyArray<MessageKind> = [
  'quote_request', 'quote_response', 'booking_proposal', 'completion_mark',
];

// ---------------------------------------------------------------------------
// Structured payload shapes (messages.payload JSON per kind)
// ---------------------------------------------------------------------------
//
// These are the TypeScript mirrors of the Zod schemas in validators.ts.
// Keeping them here as types lets consumers import without paying the
// Zod runtime cost.

export interface QuoteRequestPayload {
  sub_cat: ServiceCategoryKey;
  task_type: TaskType;
  /** Bedrooms, for cleaning tasks. Null for most handyman tasks. */
  bedrooms?: number;
  /** Square-metre area, if buyer knows it. */
  area_m2?: number;
  /** "this_week" | "next_week" | specific ISO date */
  preferred_date_window: string;
  /** Coarse window for scheduling. */
  preferred_time_window: 'morning' | 'afternoon' | 'evening' | 'flexible';
  /** Free-text notes — Filter A + C already applied at submit time. */
  notes?: string;
  /** Which governorate the job is in (enforced against area_served). */
  job_governorate: KwGovernorate;
}

export interface QuoteResponsePayload {
  price_minor_units: number;
  /** 'fixed' = one lump; 'hourly_x_hours' = hourly × N hours. */
  price_mode: 'fixed' | 'hourly_x_hours';
  /** If hourly_x_hours, this is the expected number of hours. */
  hours?: number;
  /** What's included — e.g. ['supplies', 'eco_friendly_chemicals']. */
  includes: string[];
  /** ISO datetime of earliest slot the provider can start. */
  earliest_slot: string;
  /** ISO datetime after which this quote auto-expires. */
  expires_at: string;
}

export interface BookingProposalPayload {
  slot_start_at: string; // ISO
  slot_end_at: string;   // ISO
  area_id: number;
  estimated_total_minor_units: number;
  /** Always true at propose-time; only becomes false if chat moved off-platform. */
  guarantee_applies: boolean;
}

export interface CompletionMarkPayload {
  booking_id: number;
  completed_at: string; // ISO
}

// ---------------------------------------------------------------------------
// Consumer-facing types (what queries.ts emits)
// ---------------------------------------------------------------------------

export interface ServiceProviderSummary {
  profileId: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  verificationTier: ServiceProviderVerificationTier;
  completedBookings: number;
  ratingAvg: number | null;
  ratingCount: number;
  spokenLanguages: ReadonlyArray<ProviderLanguage>;
  yearsExperience: number | null;
  teamSize: number;
  createdAt: string;
}

export interface ServiceDetail {
  id: number;
  slug: string;
  subCat: ServiceCategoryKey;

  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  /** Locale-picked pre-resolved title. */
  title: string;
  /** Locale-picked pre-resolved description. */
  description: string;

  /** Validated service-fields JSONB. */
  fields: ServiceFields;

  provider: ServiceProviderSummary;

  /** Governorate(s) the provider explicitly serves. */
  servedGovernorates: ReadonlyArray<KwGovernorate>;
  /** Area IDs the provider explicitly serves (from service_areas_served). */
  servedAreaIds: ReadonlyArray<number>;

  countryCode: 'KW';
  createdAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  isFeatured: boolean;
  isHot: boolean;
}

export interface ServiceCard {
  id: number;
  slug: string;
  subCat: ServiceCategoryKey;
  title: string;
  taskType: TaskType;
  priceMode: PriceMode;
  hourlyRateMinorUnits: number | null;
  fixedPriceMinorUnits: number | null;
  currencyCode: 'KWD';
  providerDisplayName: string;
  providerAvatarUrl: string | null;
  verificationTier: ServiceProviderVerificationTier;
  ratingAvg: number | null;
  ratingCount: number;
  completedBookings: number;
  servedGovernorates: ReadonlyArray<KwGovernorate>;
  createdAt: string;
  isFeatured: boolean;
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { ServiceFields } from './validators';
