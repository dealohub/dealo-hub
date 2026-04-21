/**
 * AI Negotiator — Intent classifier.
 *
 * Given a buyer's message, returns one of the 5 IntentClass values the
 * policy module knows how to act on:
 *
 *   price_offer        → the buyer proposed or asked about a price
 *   logistics_question → about the item/delivery/viewing/location
 *   personal_question  → about the seller personally (handoff)
 *   emotional          → distress, emergency, pressure (handoff)
 *   off_topic          → unrelated (handoff)
 *
 * Strategy (regex-first, LLM fallback per doctrine §7 cost discipline):
 *
 *   1. Run a set of ordered regex rules. Most buyer messages hit one
 *      of them within microseconds and cost $0.
 *   2. If the text is ambiguous (no rule fires, OR contradictory rules
 *      fire), return NULL — caller decides whether to call an LLM or
 *      just hand to human.
 *
 * The classifier is language-aware (Arabic + English + code-switch)
 * and respects §P12 register-mirroring — it does NOT transliterate
 * or normalize dialect words before matching. Patterns list multiple
 * dialect variants where relevant.
 *
 * Pure function. No LLM call here. No I/O. Deterministic.
 */

import type { IntentClass } from './types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ClassifyResult {
  /** Null = ambiguous; caller falls back to LLM or human handoff. */
  intent: IntentClass | null;
  /** 0-1 heuristic. 1.0 = at least one HIGH pattern fired. */
  confidence: number;
  /** Which pattern(s) matched — for audit + eval. */
  matched: string[];
}

export function classifyBuyerMessage(text: string): ClassifyResult {
  const normalised = text.toLowerCase().trim();
  if (!normalised) {
    return { intent: null, confidence: 0, matched: [] };
  }

  // Walk in priority order. First HIGH hit wins. If no HIGH matches,
  // we fall back to the best MEDIUM or return null.
  const hits: { intent: IntentClass; level: 'HIGH' | 'MEDIUM'; tag: string }[] = [];

  for (const rule of RULES) {
    if (rule.match.test(normalised) || rule.match.test(text)) {
      hits.push({ intent: rule.intent, level: rule.level, tag: rule.tag });
    }
  }

  if (hits.length === 0) {
    return { intent: null, confidence: 0, matched: [] };
  }

  // Priority order: emotional > personal > price_offer > logistics > off_topic
  // Rationale: safety handoffs (emotional, personal) take precedence over
  // transactional intents — see §P7.
  const priority: IntentClass[] = [
    'emotional',
    'personal_question',
    'price_offer',
    'logistics_question',
    'off_topic',
  ];

  // Prefer HIGH hits; within HIGH, prefer higher-priority intents.
  const sorted = hits.slice().sort((a, b) => {
    if (a.level !== b.level) return a.level === 'HIGH' ? -1 : 1;
    return priority.indexOf(a.intent) - priority.indexOf(b.intent);
  });

  const top = sorted[0];
  return {
    intent: top.intent,
    confidence: top.level === 'HIGH' ? 1.0 : 0.6,
    matched: sorted.map(h => h.tag),
  };
}

// ---------------------------------------------------------------------------
// Rule library
// ---------------------------------------------------------------------------

interface Rule {
  /** Short stable identifier for audit logs. */
  tag: string;
  /** What intent this rule votes for. */
  intent: IntentClass;
  /** HIGH = confident single-pattern signal. MEDIUM = needs multiple hits. */
  level: 'HIGH' | 'MEDIUM';
  /** The regex. Tested against the original + a lowercased copy. */
  match: RegExp;
}

const RULES: Rule[] = [
  // ─────────────────────────────────────────────────────────────
  // EMOTIONAL — safety handoff (highest priority)
  // ─────────────────────────────────────────────────────────────
  {
    tag: 'ar_emotional_distress',
    intent: 'emotional',
    level: 'HIGH',
    // Covers: "والله + {negation|need|want|necessity}" · lone "ضروري|عاجل" as urgency markers ·
    // bereavement / divorce / distress · pleading ("حرام علي") · deferred gratitude ("يعطيك ألف عافية").
    // The "ضروري|عاجل" branch deliberately stands alone because it's a strong-enough urgency
    // signal on its own (see planning/PHASE-6A-AI-NEGOTIATOR.md §P7 — distress wins over price).
    match:
      /(والله\s+(ما|مو|محتاج|أبي|ضروري|لازم)|محتاج\s+(ضروري|مساعدة|عاجل)|ضروري\s+(أحتاج|احتاج|محتاج|لازم)|مريض|توفّى|توفي|طلاق|مطلّق|مفلس|مديون|حرام\s+علي|الله\s+يعينك|يعطيك\s+ألف\s+عافية)/,
  },
  {
    tag: 'en_emotional_distress',
    intent: 'emotional',
    level: 'HIGH',
    // `desperate(ly)?` catches "desperate" and "desperately" (word-boundary trick —
    // `\bdesperate\b` alone misses the adverb form, as in "I desperately need this").
    match:
      /\b(urgent(ly)?\s+need|urgent\s+emergency|desperate(ly)?|emergency|hospital|divorce|dying|sick|bankrupt|eviction|please\s+help|god\s+bless|for\s+god'?s?\s+sake)\b/i,
  },

  // ─────────────────────────────────────────────────────────────
  // PERSONAL — handoff (second priority)
  // ─────────────────────────────────────────────────────────────
  {
    tag: 'ar_personal_about_seller',
    intent: 'personal_question',
    level: 'HIGH',
    match:
      /(كم\s+عمرك|وين\s+ساكن|جنسيتك|من\s+أي\s+دولة|متزوّج|أعزب|شغلك|وظيفتك|رقمك|إنستغرام|سناب|تويتر|صورتك)/,
  },
  {
    tag: 'en_personal_about_seller',
    intent: 'personal_question',
    level: 'HIGH',
    match:
      /\b(how\s+old\s+are\s+you|where\s+do\s+you\s+live|your\s+nationality|are\s+you\s+married|your\s+job|your\s+phone|your\s+instagram|your\s+snapchat|send\s+me\s+your\s+photo)\b/i,
  },
  {
    tag: 'ar_greeting_personal',
    intent: 'personal_question',
    level: 'MEDIUM',
    // NOTE: no trailing `\b` here — Unicode word-boundary handling for Arabic in
    // JS regex is unreliable; `\b` checks ASCII word chars only and `شلونك أخي`
    // fails (space + Arabic letter is not an ASCII boundary). We lean on the
    // priority sort instead (HIGH rules still override this MEDIUM signal).
    match: /(شلونك|كيفك|كيف\s+حالك|هلا\s+بك)/,
  },
  {
    tag: 'en_greeting_personal',
    intent: 'personal_question',
    level: 'MEDIUM',
    match: /\b(how\s+are\s+you|hows\s+it\s+going|how\s+have\s+you\s+been)\b/i,
  },

  // ─────────────────────────────────────────────────────────────
  // PRICE_OFFER — the haggle signal
  // ─────────────────────────────────────────────────────────────
  {
    tag: 'ar_price_offer_with_number',
    intent: 'price_offer',
    level: 'HIGH',
    // "ممكن 550" · "أعطيك 600k" · "عرضي 580 ألف" · "بـ 500"
    match:
      /(ممكن|أعطيك|اعطيك|عرضي|بخصم|بـ|ب\s|تنزل(ها)?\s+(إلى|الى|ل)|ينزل|تقبل)\s*\+?\s*\d{2,}/,
  },
  {
    tag: 'en_price_offer_with_number',
    intent: 'price_offer',
    level: 'HIGH',
    // Tolerates optional copula/filler between phrase-cue and number:
    //   "my offer is 580" · "I'll give you 550" · "deal at 600 thousand"
    // The `(?:\s+(?:is|will\s+be))?` group is non-capturing to keep the number adjacency.
    match:
      /\b(i['']ll\s+give\s+you|i\s+can\s+(do|offer|pay)|my\s+offer|take\s+it\s+for|how\s+about|would\s+you\s+(take|accept)|deal\s+at)(?:\s+(?:is|will\s+be))?\s+\d{2,}/i,
  },
  {
    tag: 'ar_ask_last_price',
    intent: 'price_offer',
    level: 'HIGH',
    match:
      /(آخر\s+سعر|أخر\s+سعر|السعر\s+(قابل|النهائي)|ينزل\s+السعر|تقبل\s+(عرض|تفاوض)|سعر\s+(أقل|خاص))/,
  },
  {
    tag: 'en_ask_last_price',
    intent: 'price_offer',
    level: 'HIGH',
    match:
      /\b(best\s+price|final\s+price|last\s+price|negotiable|room\s+to\s+negotiate|lowest\s+you['']?ll\s+go)\b/i,
  },
  {
    tag: 'bare_number_with_currency_word',
    intent: 'price_offer',
    level: 'MEDIUM',
    // Bidirectional — currency word can sit on either side of the digits:
    //   "600 ألف" · "550k" · "KWD 600" · "dinar 450"
    // The `k` side uses `k\b` instead of `k` so it doesn't fire on arbitrary 'k' chars
    // mid-word (e.g. "bank"). Arabic-side words don't need `\b` — they're unambiguous.
    match: /(?:\d{2,}\s*(?:ألف|الف|k\b|كي|د\.?ك|kwd|kd|dinar)|(?:kwd|kd|dinar)\s*\d{2,})/i,
  },

  // ─────────────────────────────────────────────────────────────
  // LOGISTICS_QUESTION — about the item or visit
  // ─────────────────────────────────────────────────────────────
  {
    tag: 'ar_available_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match: /(لا\s+تزال|لا\s+يزال|ما\s+زال(ت)?|متاح(ة)?|موجود(ة)?)\s*\??/,
  },
  {
    tag: 'en_available_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match: /\b(still\s+available|is\s+it\s+still|available\s*\?)\b/i,
  },
  {
    tag: 'ar_location_question',
    intent: 'logistics_question',
    level: 'HIGH',
    // Two dialectal fixes from classifier.test.ts 2026-04-21:
    //   • "أي منطقة؟" (hamza form) is equally common as "اي منطقة" — use [اأ]ي
    //   • "أقدر أزورها؟" (first-person "I can") lives alongside "تقدر" (second-person)
    //     both signal a viewing-request; match either.
    match:
      /(العنوان|المنطقة|وين\s+الموقع|[اأ]ي\s+منطقة|(ت|أ)قدر\s+أزور(ها)?|معاينة|أشوفها|أشوفه)/,
  },
  {
    tag: 'en_location_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match:
      /\b(where\s+is|what\s+area|which\s+neighbou?rhood|can\s+i\s+(come|visit|see)|viewing|inspection)\b/i,
  },
  {
    tag: 'ar_specs_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match:
      /(كم\s+(غرفة|حمام|موقف|متر)|مفروش(ة)?|تأثيث|مكيف|جنرال|صيانة|ضمان|مستعمل(ة)?|جديد(ة)?)/,
  },
  {
    tag: 'en_specs_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match:
      /\b(how\s+many\s+(rooms|bathrooms|parking|bedrooms|meters|sqm)|furnished|ac\b|a\/c|warranty|service\s+history|new\s+or\s+used|condition)\b/i,
  },
  {
    tag: 'ar_delivery_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match: /(توصيل|شحن|تسليم|متى\s+(استلم|التسليم)|نقل)/,
  },
  {
    tag: 'en_delivery_question',
    intent: 'logistics_question',
    level: 'HIGH',
    match: /\b(delivery|shipping|pickup|handover|can\s+you\s+ship)\b/i,
  },

  // ─────────────────────────────────────────────────────────────
  // OFF_TOPIC — catch-all handoff for weird stuff
  // ─────────────────────────────────────────────────────────────
  {
    tag: 'ar_unrelated_topics',
    intent: 'off_topic',
    level: 'MEDIUM',
    match:
      /(طقس|كاس\s+العالم|انتخابات|رمضان\s+كريم|عيد\s+(مبارك|سعيد))/,
  },
  {
    tag: 'en_unrelated_topics',
    intent: 'off_topic',
    level: 'MEDIUM',
    match: /\b(the\s+weather|world\s+cup|elections|happy\s+(ramadan|eid|birthday))\b/i,
  },
];

