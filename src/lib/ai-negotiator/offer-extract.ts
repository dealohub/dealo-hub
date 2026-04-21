/**
 * AI Negotiator — Offer extraction.
 *
 * Given a buyer message that was classified as `price_offer`, try to
 * pull out the numeric amount so the policy module can compare against
 * the seller's floor.
 *
 * Design:
 *   - Handles Latin digits + Arabic-Indic digits (٠-٩)
 *   - Understands the "k" suffix ("550k" → 550 000)
 *   - Understands Arabic thousand-words ("600 ألف" → 600 000)
 *   - Understands comma thousand-separators ("550,000")
 *   - Returns the amount in the listing's currency **minor units**
 *     (for KWD that's fils — × 1000). Caller supplies the currency's
 *     minor-unit multiplier so this stays currency-agnostic.
 *   - Returns `null` when no confident number can be extracted. A null
 *     return means the policy module should treat the offer as "buyer
 *     asked about price but didn't name one" (lastBuyerOfferMinor=null).
 *
 * Why it's its own module (not merged with classifier):
 *   The classifier outputs intent; the policy wants a number. Two
 *   different shapes, two different failure modes, two different tests.
 *
 * This is NOT a general-purpose NLP number parser. It's tuned to the
 * shapes that actually appear in Kuwait C2C chat (observed 2026-04-21
 * via Dubizzle live DOM + WhatsApp-style brevity).
 */

// ---------------------------------------------------------------------------
// Digit normalisation
// ---------------------------------------------------------------------------

/**
 * Map Arabic-Indic digits (٠-٩) to their Latin counterparts. Persian/
 * Urdu digits (۰-۹) look identical but have different code points —
 * include them for safety.
 */
const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

function normaliseDigits(text: string): string {
  let out = '';
  for (const ch of text) out += DIGIT_MAP[ch] ?? ch;
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ExtractOfferInput {
  /** Raw buyer message text. */
  text: string;
  /**
   * Minor-unit multiplier for the listing's currency. For KWD this is
   * 1000 (1 dinar = 1000 fils); for USD/AED it's 100. Passed in so this
   * module doesn't bake in currency assumptions.
   */
  minorUnitsPerMajor: number;
}

export interface ExtractOfferResult {
  /** Amount in the listing's minor-unit scale (e.g. fils). */
  offerMinor: number;
  /** The substring that matched — for audit logs. */
  matchedSpan: string;
  /** Which extractor fired — for debugging. */
  strategy: 'k_suffix' | 'arabic_thousand' | 'comma_grouped' | 'bare_integer';
}

/**
 * Try to pull a numeric offer out of a buyer message. Returns `null`
 * when no confident number is found.
 */
export function extractOffer(
  input: ExtractOfferInput,
): ExtractOfferResult | null {
  const text = normaliseDigits(input.text);
  const mult = input.minorUnitsPerMajor;

  // Strategy order matters — more specific shapes first so a "550k"
  // isn't accidentally caught by the bare-integer fallback.

  // 1) k-suffix: "550k" · "1.2k" · "550K" (Latin only — buyers always
  //    type it this way, never in Arabic).
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const value = Number.parseFloat(kMatch[1]);
    if (!Number.isNaN(value) && value > 0) {
      return {
        offerMinor: Math.round(value * 1000 * mult),
        matchedSpan: kMatch[0],
        strategy: 'k_suffix',
      };
    }
  }

  // 2) Arabic thousand-word: "600 ألف" · "550 الف" (unvoweled). Not
  //    "ألفين" etc. — those are rarer in offers and easily confused
  //    with filler speech.
  const arThousand = text.match(/(\d+(?:\.\d+)?)\s*(?:ألف|الف)/);
  if (arThousand) {
    const value = Number.parseFloat(arThousand[1]);
    if (!Number.isNaN(value) && value > 0) {
      return {
        offerMinor: Math.round(value * 1000 * mult),
        matchedSpan: arThousand[0],
        strategy: 'arabic_thousand',
      };
    }
  }

  // 3) Comma-grouped: "550,000" · "1,200,000". Must have at least one
  //    comma group of exactly 3 digits to avoid eating European
  //    decimal commas (though those are rare in Arabic/English chat).
  const comma = text.match(/(\d{1,3}(?:,\d{3})+)/);
  if (comma) {
    const digits = comma[1].replace(/,/g, '');
    const value = Number.parseInt(digits, 10);
    if (!Number.isNaN(value) && value > 0) {
      return {
        offerMinor: value * mult,
        matchedSpan: comma[0],
        strategy: 'comma_grouped',
      };
    }
  }

  // 4) Bare integer: "550" · "1200000". Constrained to 3+ digits to
  //    avoid matching low single-digit counts ("5 bedrooms"). We also
  //    skip numbers preceded by "@" or ":" or "/" — those are likely
  //    references (time, phone fragment, ratio), not prices.
  const bareMatches = Array.from(text.matchAll(/\d{3,}/g));
  for (const m of bareMatches) {
    const idx = m.index ?? 0;
    const prev = idx > 0 ? text[idx - 1] : '';
    if (prev === '@' || prev === ':' || prev === '/' || prev === '.') continue;
    const value = Number.parseInt(m[0], 10);
    if (!Number.isNaN(value) && value > 0) {
      return {
        offerMinor: value * mult,
        matchedSpan: m[0],
        strategy: 'bare_integer',
      };
    }
  }

  return null;
}
