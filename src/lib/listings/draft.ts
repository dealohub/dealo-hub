import type { Condition, DeliveryOption, PriceMode } from './validators';

/**
 * Draft wizard state — shape shared between localStorage and the
 * `listing_drafts` DB row. All fields optional during the wizard.
 */

export const WIZARD_STEPS = [
  'category',
  'media',
  'details',
  'price',
  'location',
  'delivery',
  'authenticity', // luxury-only; skipped otherwise
  'preview',
] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export interface DraftState {
  // Step 1
  category_id?: number | null;
  subcategory_id?: number | null;

  // Step 2
  image_urls?: string[];
  video_url?: string | null;

  // Step 3
  title?: string;
  description?: string;
  condition?: Condition | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;

  // Step 4
  price_minor_units?: number | null;
  currency_code?: string;
  price_mode?: PriceMode | null;
  min_offer_minor_units?: number | null;

  // Step 5
  country_code?: string;
  city_id?: number | null;
  area_id?: number | null;

  // Step 6
  delivery_options?: DeliveryOption[];

  // Step 7 (luxury)
  authenticity_confirmed?: boolean;
  has_receipt?: boolean;
  serial_number?: string | null;

  // Category-specific structured fields (raw snake_case JSONB shape).
  // Populated by vertical-branched variants of Step 3 — e.g. the
  // Properties form writes PropertyFieldsRaw here (34 fields). Shape is
  // validated by a per-vertical Zod schema at publish time; during
  // editing it's a free-form object so the wizard can be progressive.
  category_fields?: Record<string, unknown>;

  // Wizard nav
  current_step?: WizardStep;

  // Meta
  updated_at?: string;
}

export const DRAFT_STORAGE_KEY = 'dealohub.draft.v1';

// ---------------------------------------------------------------------------
// localStorage (instant writes, client-only)
// ---------------------------------------------------------------------------

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadLocalDraft(): DraftState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalDraft(state: DraftState): void {
  if (!isBrowser()) return;
  try {
    const withStamp = { ...state, updated_at: new Date().toISOString() };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(withStamp));
  } catch {
    // Quota exceeded / private mode — silently drop; DB is source of truth.
  }
}

export function clearLocalDraft(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// Freshness merge — pick whichever of {local, remote} has the newer timestamp.
// ---------------------------------------------------------------------------

export function pickFreshest(
  local: DraftState | null,
  remote: DraftState | null
): DraftState | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;
  const lTime = local.updated_at ? Date.parse(local.updated_at) : 0;
  const rTime = remote.updated_at ? Date.parse(remote.updated_at) : 0;
  return lTime > rTime ? local : remote;
}

// ---------------------------------------------------------------------------
// Debounced DB sync (client-only). Consumer imports `debouncedSaveRemote` and
// calls it on every draft state change; the helper coalesces within 1 s.
// ---------------------------------------------------------------------------

type RemoteSaver = (state: DraftState) => Promise<void>;

export function createDebouncedRemoteSaver(saver: RemoteSaver, wait = 1000) {
  let handle: ReturnType<typeof setTimeout> | null = null;
  let pending: DraftState | null = null;

  async function flushNow() {
    if (!pending) return;
    const snapshot = pending;
    pending = null;
    if (handle) {
      clearTimeout(handle);
      handle = null;
    }
    try {
      await saver(snapshot);
    } catch (err) {
      // Don't rethrow — local copy is still intact; next edit will retry.
      console.error('[draft] remote save failed:', err);
    }
  }

  function schedule(state: DraftState) {
    pending = state;
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => {
      void flushNow();
    }, wait);
  }

  return { schedule, flushNow };
}
