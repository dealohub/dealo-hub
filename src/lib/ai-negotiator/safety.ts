/**
 * AI Negotiator — Safety pipeline.
 *
 * Single entry point the engine calls after `generateReply`. It runs
 * the 3 content filters (Filter A/B/C from src/lib/listings/validators)
 * PLUS the floor-leak scanner, in series. Any failure → the draft is
 * discarded and the engine must either regenerate or hand off to
 * human.
 *
 * Layer ordering (doctrine §6):
 *   1. Filter A — phone-in-text (P5 + DECISIONS #2)
 *   2. Filter C — discriminatory wording (P5 + Phase 4a)
 *   3. Filter B — counterfeit terms (P5 + luxury moat)
 *   4. Floor-leak scan (P11)
 *
 * All filters run regardless of outcome — the return value lists
 * EVERY violation so the audit log (ai_message_log.filter_actions)
 * has the full picture, not just the first hit.
 */

import {
  containsPhoneNumber,
  containsCounterfeitTerm,
  containsDiscriminatoryWording,
} from '@/lib/listings/validators';
import { scanForFloorLeak } from './floor-leak';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FilterViolation =
  | { filter: 'phone'; matched: true }
  | { filter: 'discriminatory'; matched: true }
  | { filter: 'counterfeit'; matched: true }
  | {
      filter: 'floor_leak';
      matched: true;
      detectedMinorUnits: number[];
    };

export interface SafetyCheckInput {
  /** The AI-generated draft text. */
  draftText: string;
  /** Seller's secret floor (minor units). Pass 0 to skip floor scan. */
  floorMinor: number;
  /** The listing's list price (minor units). Guards against false positives. */
  listPriceMinor: number;
  /** Currency — affects floor-leak decimal interpretation. */
  currency?: 'KWD' | 'BHD' | 'OMR' | 'SAR' | 'AED' | 'QAR' | 'USD' | 'EUR';
  /**
   * TRUE iff the policy move is `final_offer` and its priceMinor is
   * the floor. In that case the floor legitimately appears → scanner
   * bypassed. The caller (dialogue orchestrator) decides this.
   */
  allowFloorMatch?: boolean;
  /**
   * If TRUE, apply Filter B (counterfeit). Only enabled when the
   * listing is in the luxury taxonomy subtree. For non-luxury
   * listings, mentions of "replica" or "fake" may be legitimate
   * negative-framing ("this isn't a replica") and shouldn't be
   * auto-blocked. Default FALSE.
   */
  enforceCounterfeitFilter?: boolean;
}

export type SafetyCheckResult =
  | { safe: true; filterActions: [] }
  | {
      safe: false;
      violations: FilterViolation[];
      filterActions: FilterViolation[];
    };

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

export function runSafetyPipeline(
  input: SafetyCheckInput,
): SafetyCheckResult {
  const {
    draftText,
    floorMinor,
    listPriceMinor,
    currency = 'KWD',
    allowFloorMatch = false,
    enforceCounterfeitFilter = false,
  } = input;

  const violations: FilterViolation[] = [];

  // Filter A — phone-in-text. Always applied. §P5 + DECISIONS #2.
  if (containsPhoneNumber(draftText)) {
    violations.push({ filter: 'phone', matched: true });
  }

  // Filter C — discriminatory wording. Always applied. §P5 + Phase 4a.
  if (containsDiscriminatoryWording(draftText)) {
    violations.push({ filter: 'discriminatory', matched: true });
  }

  // Filter B — counterfeit. Only for luxury listings.
  if (enforceCounterfeitFilter && containsCounterfeitTerm(draftText)) {
    violations.push({ filter: 'counterfeit', matched: true });
  }

  // Floor-leak scan. Skip when floor is 0 (no floor set) — policy
  // module would have handed to human in that case anyway, but safety
  // pipeline is defensive.
  if (floorMinor > 0) {
    const leakResult = scanForFloorLeak({
      text: draftText,
      floorMinor,
      listPriceMinor,
      currency,
      allowFloorMatch,
    });
    if (!leakResult.safe) {
      violations.push({
        filter: 'floor_leak',
        matched: true,
        detectedMinorUnits: leakResult.detectedMinorUnits,
      });
    }
  }

  if (violations.length === 0) {
    return { safe: true, filterActions: [] };
  }

  return {
    safe: false,
    violations,
    filterActions: violations,
  };
}
