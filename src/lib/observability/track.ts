/**
 * Observability — product analytics.
 *
 * Central, typed event API. Every product event fires through
 * `track('event_name', { ...props })`. Benefits:
 *   - Exhaustive event-name union prevents typos (compiler-caught).
 *   - Props typed per event — no drift between call sites.
 *   - Zero-cost no-op until NEXT_PUBLIC_POSTHOG_KEY is set, at which
 *     point we lazy-init posthog-js and start shipping events.
 *
 * Call sites are sprinkled at meaningful moments, not every click:
 *   - Auth events: sign-in + sign-up success
 *   - Listing events: publish, save, contact-seller
 *   - Chat events: conversation start, message sent, offer sent
 *   - Search events: query performed (debounced)
 *
 * PII policy:
 *   - Never pass email, phone, or free-form message bodies.
 *   - User identification is by opaque `user_id` (auth.uid()).
 *   - Prices + counts are fine; titles are fine (already public).
 */

// ---------------------------------------------------------------------------
// Event catalog — exhaustive. Add new events here as features land.
// ---------------------------------------------------------------------------

export type TrackEventMap = {
  // Auth
  signin_success: { method: 'email' };
  signup_success: { method: 'email' };
  signout: Record<string, never>;

  // Listings
  listing_published: {
    listing_id: number;
    category_slug: string;
    price_minor_units: number;
    currency: string;
    vertical: 'rides' | 'properties' | 'other';
  };
  listing_saved: { listing_id: number; saved: boolean };
  listing_viewed: { listing_id: number; vertical: 'rides' | 'properties' | 'other' };

  // Chat
  conversation_started: {
    listing_id: number;
    vertical: 'rides' | 'properties' | 'other';
    opened_with_offer: boolean;
  };
  message_sent: {
    conversation_id: number;
    has_offer: boolean;
    chars: number;
  };

  // Search
  search_performed: {
    query_chars: number;
    result_count: number;
    semantic: boolean;
  };
};

export type TrackEventName = keyof TrackEventMap;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire a product event. No-op (console-only) until PostHog is wired.
 *
 * Safe to call from both Server and Client Components — but most
 * events are naturally client-side (user actions). For server-only
 * events (e.g. fired after a server action succeeds) call this from
 * the calling Client Component after the action returns, not from
 * the action body (which can't reach posthog-js).
 */
export function track<E extends TrackEventName>(
  event: E,
  props: TrackEventMap[E],
): void {
  try {
    // Development: log to console for visibility.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[track]', event, props);
    }

    // Production wiring lands here — one conditional import:
    //
    //   if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    //     const posthog = (await import('posthog-js')).default;
    //     if (!posthog.__loaded) {
    //       posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    //         api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    //         capture_pageview: true,
    //         capture_pageleave: true,
    //         persistence: 'localStorage+cookie',
    //       });
    //     }
    //     posthog.capture(event, props);
    //   }
  } catch {
    // Analytics must never crash a user flow.
  }
}

/**
 * Associate subsequent events with a signed-in user id.
 * Call after sign-in success. Call `resetIdentity()` on sign-out.
 */
export function identify(userId: string, traits?: Record<string, string | number | boolean>): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[track:identify]', userId, traits ?? {});
  }
  // posthog.identify(userId, traits) — pending wiring.
}

export function resetIdentity(): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[track:reset]');
  }
  // posthog.reset() — pending wiring.
}
