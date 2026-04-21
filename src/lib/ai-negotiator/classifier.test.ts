import { describe, it, expect } from 'vitest';
import { classifyBuyerMessage } from './classifier';

/**
 * Intent classifier tests.
 *
 * The classifier feeds the policy module. A misclassification =
 * wrong strategic move. E.g., classifying an emotional message as
 * a price_offer = AI tries to counter an "I need this urgently because
 * my father is in hospital" message with a 3% discount. That's bad.
 *
 * Priority rules (§P7):
 *   emotional  >  personal_question  >  price_offer  >  logistics_question  >  off_topic
 *
 * Tests lock down:
 *   - Each intent fires on representative Arabic + English + dialect inputs
 *   - Priority: if emotional + price cues both present, emotional wins
 *   - Ambiguous input → null (caller falls back to LLM or handoff)
 *   - Empty / whitespace input → null
 */

// ---------------------------------------------------------------------------
// EMOTIONAL
// ---------------------------------------------------------------------------

describe('emotional → handoff', () => {
  it.each([
    'والله ضروري أحتاجها بسرعة',
    'محتاج مساعدة عاجل الله يعينك',
    'أخي في المستشفى ومريض',
    'طلاق وضعي صعب',
    'والله ما أقدر أكثر من 500 حرام علي',
    'يعطيك ألف عافية',
  ])('AR emotional: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('emotional');
  });

  it.each([
    'I desperately need this',
    'urgent emergency please help',
    'my father is in hospital',
    'divorce situation, very hard',
    'please for god\'s sake',
  ])('EN emotional: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('emotional');
  });
});

// ---------------------------------------------------------------------------
// PERSONAL
// ---------------------------------------------------------------------------

describe('personal → handoff', () => {
  it.each([
    'كم عمرك؟',
    'وين ساكن بالضبط؟',
    'إيش جنسيتك؟',
    'أرسل لي صورتك',
    'رقمك انستغرام؟',
  ])('AR personal: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('personal_question');
  });

  it.each([
    'how old are you?',
    'where do you live?',
    'what is your nationality?',
    'send me your photo',
    'your instagram?',
  ])('EN personal: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('personal_question');
  });

  it('AR greeting "شلونك" → personal (MEDIUM confidence)', () => {
    const r = classifyBuyerMessage('شلونك أخي؟');
    expect(r.intent).toBe('personal_question');
    expect(r.confidence).toBeLessThanOrEqual(0.6);
  });

  it('EN greeting "how are you" → personal (MEDIUM confidence)', () => {
    const r = classifyBuyerMessage('hey how are you');
    expect(r.intent).toBe('personal_question');
  });
});

// ---------------------------------------------------------------------------
// PRICE_OFFER
// ---------------------------------------------------------------------------

describe('price_offer (with explicit number)', () => {
  it.each([
    'ممكن 550؟',
    'أعطيك 600 ألف',
    'عرضي 580 ألف',
    'بـ 500 ألف تكون البيعة',
    'تنزل إلى 620k؟',
    'تقبل 550,000؟',
  ])('AR price with number: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('price_offer');
  });

  it.each([
    "I'll give you 550",
    'I can do 600',
    'my offer is 580',
    'take it for 500',
    'how about 620?',
    'would you accept 550',
    'deal at 600 thousand',
  ])('EN price with number: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('price_offer');
  });
});

describe('price_offer (asking about discount without a number)', () => {
  it.each([
    'آخر سعر؟',
    'السعر قابل للتفاوض؟',
    'ينزل السعر؟',
    'تقبل عرض؟',
  ])('AR negotiate ask: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('price_offer');
  });

  it.each([
    'best price?',
    'final price?',
    'is it negotiable?',
    'any room to negotiate?',
    'lowest you\'ll go?',
  ])('EN negotiate ask: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('price_offer');
  });
});

describe('price_offer (currency hint near number)', () => {
  it('"600 ألف" alone', () => {
    expect(classifyBuyerMessage('600 ألف').intent).toBe('price_offer');
  });
  it('"550k" alone', () => {
    expect(classifyBuyerMessage('550k').intent).toBe('price_offer');
  });
  it('"KWD 600"', () => {
    expect(classifyBuyerMessage('KWD 600 possible?').intent).toBe('price_offer');
  });
});

// ---------------------------------------------------------------------------
// LOGISTICS_QUESTION
// ---------------------------------------------------------------------------

describe('logistics_question', () => {
  it.each([
    'الفيلا لا تزال متاحة؟',
    'ما زالت موجودة؟',
    'وين الموقع بالضبط؟',
    'أي منطقة؟',
    'أقدر أزورها؟',
    'متى تقدر تعطيني معاينة؟',
    'كم غرفة نوم؟',
    'كم حمام؟',
    'مفروشة ولا لا؟',
    'مكيف سبليت ولا جنرال؟',
  ])('AR logistics: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('logistics_question');
  });

  it.each([
    'is it still available?',
    'still available?',
    'where is it located?',
    'what area?',
    'can I come see it?',
    'when can I visit?',
    'how many bedrooms?',
    'how many bathrooms?',
    'furnished or unfurnished?',
    'can you ship it?',
    'is delivery available?',
  ])('EN logistics: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('logistics_question');
  });
});

// ---------------------------------------------------------------------------
// OFF_TOPIC
// ---------------------------------------------------------------------------

describe('off_topic', () => {
  it.each([
    'رمضان كريم أخوي',
    'عيد مبارك',
    'شوفت مباراة كاس العالم أمس؟',
  ])('AR off-topic: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('off_topic');
  });

  it.each([
    'happy eid!',
    'did you watch the world cup?',
    'the weather is nice today',
  ])('EN off-topic: "%s"', text => {
    const r = classifyBuyerMessage(text);
    expect(r.intent).toBe('off_topic');
  });
});

// ---------------------------------------------------------------------------
// Priority rules — when multiple cues collide
// ---------------------------------------------------------------------------

describe('priority: emotional beats price_offer', () => {
  it('"ممكن 500 ضروري محتاج" → emotional (not price_offer)', () => {
    const r = classifyBuyerMessage('ممكن 500 ضروري محتاج مساعدة');
    expect(r.intent).toBe('emotional');
  });

  it('"urgent I need this for 500" → emotional', () => {
    const r = classifyBuyerMessage('urgent emergency, I can give 500');
    expect(r.intent).toBe('emotional');
  });
});

describe('priority: personal beats logistics', () => {
  it('"كم غرفة؟ وكم عمرك؟" → personal (handoff wins over logistics)', () => {
    const r = classifyBuyerMessage('كم غرفة؟ وكم عمرك؟');
    expect(r.intent).toBe('personal_question');
  });
});

describe('priority: HIGH confidence beats MEDIUM', () => {
  it('"شلونك؟ ممكن 550؟" → price_offer HIGH beats shلونك MEDIUM', () => {
    // "شلونك" is MEDIUM personal; "ممكن 550" is HIGH price_offer.
    // HIGH wins. Personal is MEDIUM greeting — not a safety signal.
    const r = classifyBuyerMessage('شلونك؟ ممكن 550؟');
    expect(r.intent).toBe('price_offer');
  });
});

// ---------------------------------------------------------------------------
// Ambiguous / null
// ---------------------------------------------------------------------------

describe('null for ambiguous input', () => {
  it('empty string → null', () => {
    expect(classifyBuyerMessage('').intent).toBeNull();
  });

  it('whitespace only → null', () => {
    expect(classifyBuyerMessage('   \n\t   ').intent).toBeNull();
  });

  it('gibberish → null', () => {
    const r = classifyBuyerMessage('asdfasdf qwerty xyz');
    expect(r.intent).toBeNull();
  });

  it('single word with no cue → null', () => {
    expect(classifyBuyerMessage('hi').intent).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Confidence + audit trail
// ---------------------------------------------------------------------------

describe('ClassifyResult shape', () => {
  it('HIGH intent returns confidence 1.0', () => {
    const r = classifyBuyerMessage('آخر سعر؟');
    expect(r.confidence).toBe(1.0);
    expect(r.matched.length).toBeGreaterThan(0);
  });

  it('matched[] contains rule tags for audit', () => {
    const r = classifyBuyerMessage('ممكن 550؟');
    expect(r.matched).toContain('ar_price_offer_with_number');
  });

  it('null intent returns confidence 0', () => {
    const r = classifyBuyerMessage('');
    expect(r.confidence).toBe(0);
    expect(r.matched).toEqual([]);
  });
});
