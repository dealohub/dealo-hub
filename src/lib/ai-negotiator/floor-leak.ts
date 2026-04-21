/**
 * AI Negotiator — Floor-leak scanner (doctrine §P11 + §P2).
 *
 * Given an AI-generated draft text + the seller's secret floor, returns
 * whether the draft leaks the floor. A "leak" is any number mentioned
 * in the text that lands within a configurable band of the floor
 * (default ±5%).
 *
 * Why it matters:
 *   - The floor is the seller's minimum acceptable price.
 *   - If the AI hallucinates + mentions "600,000" when the floor is
 *     595,000, the buyer now knows how close they are to the floor.
 *   - The dialogue layer does NOT pass the floor into the prompt (only
 *     counters + list price), so leaks should be rare — but LLMs
 *     hallucinate. This is the last line of defence.
 *
 * Design:
 *   - Extract every numeric token (Latin digits + Arabic-Indic digits)
 *   - Handle thousand separators (, and .) and decimal separators
 *   - For each extracted value, compute the possible minor-unit
 *     interpretations given the currency's decimal convention
 *   - If ANY candidate is within the band of floor → LEAK
 *
 * EXCEPTION — if the policy move is `final_offer`, the floor WILL
 * legitimately appear in the draft (that's the whole point of the
 * move). Caller passes `allowFloorMatch: true` in that case.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScanInput {
  /** The AI-generated draft text. */
  text: string;
  /** The seller's secret floor (minor units). */
  floorMinor: number;
  /** The list price (minor units). Used to exclude legitimate references. */
  listPriceMinor: number;
  /** Currency — affects decimal interpretation. Default KWD (3 decimals). */
  currency?: 'KWD' | 'BHD' | 'OMR' | 'SAR' | 'AED' | 'QAR' | 'USD' | 'EUR';
  /** Tolerance band around the floor. Default 0.05 = ±5%. */
  band?: number;
  /**
   * Permitted when policy.move.kind === 'final_offer' and the move's
   * priceMinor IS the floor. In that case the floor appears on purpose;
   * scanner should not flag it.
   */
  allowFloorMatch?: boolean;
}

export type ScanResult =
  | { safe: true }
  | {
      safe: false;
      reason: 'floor_leak';
      /** The detected values in minor units, for audit logs. */
      detectedMinorUnits: number[];
    };

export function scanForFloorLeak(input: ScanInput): ScanResult {
  const {
    text,
    floorMinor,
    listPriceMinor,
    currency = 'KWD',
    band = 0.05,
    allowFloorMatch = false,
  } = input;

  if (allowFloorMatch) return { safe: true };
  if (floorMinor <= 0) return { safe: true };

  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const lower = Math.floor(floorMinor * (1 - band));
  const upper = Math.ceil(floorMinor * (1 + band));

  const listTolerance = Math.max(1, Math.round(listPriceMinor * 0.001));

  const candidates = extractMinorUnitCandidates(text, decimals);

  const leaks: number[] = [];
  for (const v of candidates) {
    if (v >= lower && v <= upper) {
      // Skip values that are "obviously" the list price (within 0.1% of it).
      if (Math.abs(v - listPriceMinor) <= listTolerance) continue;
      leaks.push(v);
    }
  }

  if (leaks.length === 0) return { safe: true };
  return {
    safe: false,
    reason: 'floor_leak',
    detectedMinorUnits: leaks,
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const CURRENCY_DECIMALS: Record<string, number> = {
  KWD: 3,
  BHD: 3,
  OMR: 3,
  SAR: 2,
  AED: 2,
  QAR: 2,
  USD: 2,
  EUR: 2,
};

/**
 * Pulls every numeric token from the text and normalises to possible
 * minor-unit values. Multiple interpretations are generated per token
 * because text is ambiguous — "600" could be 600 currency units OR
 * 600,000 (interpretation depends on context the scanner can't know).
 *
 * We emit ALL plausible interpretations so the proximity check is
 * defensive. A draft that contains "600" when the floor is 600,000 KWD
 * minor-units (= KWD 600.000) will match via the "number * 10^decimals"
 * interpretation. That's intentional: better to false-positive-reject
 * a draft and regenerate than to leak.
 */
function extractMinorUnitCandidates(text: string, decimals: number): number[] {
  const normalised = latiniseArabicDigits(text);
  const candidates = new Set<number>();

  // Match numeric tokens with optional thousands separators + optional
  // decimal. Allowed separators: , and . — we disambiguate per-token.
  //
  // Examples matched: 600  600,000  600.000  600,000.000  1.5k  1500
  const tokenRe = /\b\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?(?:\s*[kKmM])?\b|\b\d+(?:\.\d+)?\b/g;

  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(normalised)) !== null) {
    const raw = m[0];
    const values = parseNumericToken(raw, decimals);
    for (const v of values) candidates.add(v);
  }
  return [...candidates];
}

/**
 * Converts one numeric token into candidate minor-unit values.
 * Returns multiple interpretations to catch ambiguous cases.
 */
function parseNumericToken(raw: string, decimals: number): number[] {
  const out: number[] = [];
  // Strip whitespace and trailing k/M suffixes.
  let s = raw.trim().replace(/\s+/g, '');
  let multiplier = 1;
  if (/[kK]$/.test(s)) {
    multiplier = 1_000;
    s = s.slice(0, -1);
  } else if (/[mM]$/.test(s)) {
    multiplier = 1_000_000;
    s = s.slice(0, -1);
  }

  const separators = s.match(/[.,]/g) ?? [];
  let asDecimal: number | null = null;
  let asInteger: number | null = null;

  if (separators.length === 0) {
    asInteger = parseInt(s, 10);
  } else if (separators.length === 1) {
    // Single separator — could be thousands or decimal.
    const [pre, post] = s.split(/[.,]/);
    if (post.length === 3) {
      // Treat as thousands separator.
      const joined = pre + post;
      asInteger = parseInt(joined, 10);
    } else {
      // Treat as decimal.
      asDecimal = parseFloat(pre + '.' + post);
    }
    // Also emit the other interpretation as a defensive fallback.
    if (asInteger === null) asInteger = parseInt(pre + post, 10);
    if (asDecimal === null) asDecimal = parseFloat(pre + '.' + post);
  } else {
    // Multiple separators — last is decimal, rest are thousands.
    // KWD convention: `600,000.000` → 600000.000
    const lastSepIdx = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
    const intPart = s.slice(0, lastSepIdx).replace(/[.,]/g, '');
    const decPart = s.slice(lastSepIdx + 1);
    asDecimal = parseFloat(intPart + '.' + decPart);
  }

  // Emit candidate minor-unit values.
  if (asInteger !== null && !Number.isNaN(asInteger)) {
    // Interpretation 1: token is in whole currency units.
    out.push(asInteger * multiplier * Math.pow(10, decimals));
    // Interpretation 2: token is already in minor units (as raw).
    out.push(asInteger * multiplier);
  }
  if (asDecimal !== null && !Number.isNaN(asDecimal)) {
    out.push(Math.round(asDecimal * multiplier * Math.pow(10, decimals)));
  }

  return out.filter(v => Number.isFinite(v) && v > 0);
}

/** Replace Arabic-Indic digits (٠-٩) with Latin (0-9). */
function latiniseArabicDigits(s: string): string {
  const map: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };
  return s.replace(/[٠-٩۰-۹]/g, c => map[c] ?? c);
}
