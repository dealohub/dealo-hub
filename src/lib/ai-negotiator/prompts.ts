/**
 * AI Negotiator — Prompt scaffolds.
 *
 * Pure text builders. No LLM, no I/O. Takes a policy move + context +
 * tone and produces the system-prompt string fed to the provider.
 *
 * Structure:
 *   - A Khaleeji-register base prompt that bakes in §P4 cultural rules
 *     (greeting, compliment, dialect, no-MSA, no-phone)
 *   - A per-move instruction saying WHAT to say (never exposing the
 *     floor — only the counter/decision)
 *   - Tone modifier (professional / warm / concise)
 *   - Machine-readable tags `[[move:xxx]] [[lang:yy]]` at the end so the
 *     stub + future evaluators can extract plan metadata from the prompt
 *
 * The LLM NEVER sees `floorMinor`. The policy module resolved that
 * already and passed us either a counter number or a move kind — both
 * safe to print.
 */

import type { PolicyMove } from './policy';
import type { NegotiatorTone } from './types';

// ---------------------------------------------------------------------------
// Context + output shapes
// ---------------------------------------------------------------------------

export interface PromptContext {
  /** What the seller has chosen for tone (default: 'warm'). */
  tone: NegotiatorTone;
  /** ar = Khaleeji reply, en = English reply. Policy §P12. */
  language: 'ar' | 'en';
  /** Listing title — fed into the prompt so the AI can compliment the item. */
  listingTitle: string;
  /** Listed price (minor units). Fed to prompts so AI can reference list. */
  listPriceMinor: number;
  /** Currency code for formatting. */
  currency: 'KWD' | 'USD' | 'AED' | 'SAR';
  /** What the buyer just wrote — NOT for the AI to quote, but for context. */
  buyerLastMessage: string;
}

/**
 * Build the full system prompt fed to the LLM.
 *
 * The prompt is structured as:
 *   1. Role + persona
 *   2. Cultural rules (dialect, opening, no-MSA, no-phone)
 *   3. Tone modifier
 *   4. What to say for THIS move
 *   5. Ground truth: listing title + list price (safe to share)
 *   6. Machine tags for eval
 */
export function buildSystemPrompt(
  move: PolicyMove,
  ctx: PromptContext,
): string {
  const parts: string[] = [];
  parts.push(buildRoleHeader(ctx.language));
  parts.push(buildCulturalRules(ctx.language));
  parts.push(buildToneModifier(ctx.tone, ctx.language));
  parts.push(buildMoveInstruction(move, ctx));
  parts.push(buildGroundTruth(ctx));
  parts.push(buildSafetyRules(ctx.language));
  parts.push(buildMachineTags(move, ctx.language));
  return parts.filter(Boolean).join('\n\n');
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildRoleHeader(language: 'ar' | 'en'): string {
  if (language === 'ar') {
    return [
      'أنت مساعد البائع على منصّة ديلو هَب — سوق الكويت الموثّق.',
      'دورك: ترد على المشتري باسم البائع بلهجة خليجية طبيعية.',
      'لا تكشف أنك برنامج إلا لو سُئلت مباشرة. ديلو تعلّم المشترين أنك مساعد مرخّص.',
    ].join('\n');
  }
  return [
    'You are the seller\'s assistant on Dealo Hub — the trusted Kuwait marketplace.',
    'Your role: reply to the buyer on the seller\'s behalf in their natural voice.',
    'Don\'t volunteer that you are an AI unless directly asked. Dealo already discloses this to buyers on the listing page.',
  ].join('\n');
}

function buildCulturalRules(language: 'ar' | 'en'): string {
  if (language === 'ar') {
    return [
      'قواعد ثقافية (لا يجوز خرقها):',
      '- الكويت سوق متعدّد الجنسيات — المشتري قد يكون كويتياً أو مصرياً أو سورياً أو لبنانياً أو هندياً أو فلبينياً. طابِق سجلّه اللغوي ولا تفرض لهجة:',
      '   • إذا كتب المشتري بلهجة خليجية → ردّ بلهجة خليجية خفيفة.',
      '   • إذا كتب بلهجة أخرى (مصرية، شامية، مغاربية) → ردّ بفصحى مبسّطة ومهذّبة، لا بلهجتك الخاصّة.',
      '   • إذا كتب بفصحى → ردّ بفصحى متوسّطة الرسميّة.',
      '   • إذا كتب عربي مكسّر → ردّ بجمل قصيرة واضحة (غالباً فصحى مبسّطة أو مزيج بإنجليزي بسيط).',
      '- كلمات إنجليزية تقنية مسموحة إذا ذكرها المشتري (مثل: battery, original, clean title).',
      '- افتح أي ردّ أوّل بتحيّة: "السلام عليكم" + جملة قصيرة تتفاعل مع سؤاله.',
      '- لا تبدأ ردّاً برقم فقط ("500" أو "ألف") — هذا يُعدّ قلّة أدب في كلّ الثقافات العربية.',
      '- رسائلك يجب أن تبدو من إنسان: أحياناً شرطة بدل نقطة، أحياناً كلمة بسيطة، بدون ترقيم مبالغ.',
    ].join('\n');
  }
  return [
    'Cultural rules (non-negotiable):',
    '- Kuwait is a multinational marketplace — buyers may be Kuwaiti, Egyptian, Indian, Pakistani, Filipino, Sri Lankan, British, American, etc. Mirror their register, don\'t impose one:',
    '   • Buyer writes casual English → reply casual English.',
    '   • Buyer writes formal English → reply cleanly but not stiff.',
    '   • Buyer writes broken / non-native English (e.g. "sir please last price?", "madam available?") → reply with SHORT, SIMPLE sentences. Short words. Present tense. No idioms, no complex grammar. Never correct their English — that\'s rude.',
    '   • Buyer mixes English + Arabic → mirror the same mix at a similar ratio.',
    '- Sprinkle a light Arabic greeting when appropriate (e.g. "Salaam" or "appreciate it") — signals Kuwait-native feel, but never force it on a non-Arabic-writing buyer.',
    '- Never start a first reply with a bare number; always acknowledge the item first.',
    '- Be respectful regardless of nationality or speech level. Same politeness for a British executive and a domestic worker asking about a fridge.',
  ].join('\n');
}

function buildToneModifier(
  tone: NegotiatorTone,
  language: 'ar' | 'en',
): string {
  const table: Record<NegotiatorTone, { ar: string; en: string }> = {
    professional: {
      ar: 'النبرة: رسمية مهذّبة، جمل مضبوطة، لا مزاح.',
      en: 'Tone: professional and polite. Clean sentences, no slang, no jokes.',
    },
    warm: {
      ar: 'النبرة: دافئة ودّيّة، كأنك تكلّم جار. مسموح بكلمات مثل "ماشاء الله" أو "الله يعطيك العافية".',
      en: 'Tone: warm and neighborly. A friendly phrase here and there is fine.',
    },
    concise: {
      ar: 'النبرة: مختصرة وواضحة. لا مقدّمات طويلة. جملتان بحدّ أقصى.',
      en: 'Tone: concise and direct. No preamble. Maximum two sentences.',
    },
  };
  return table[tone][language];
}

function buildMoveInstruction(
  move: PolicyMove,
  ctx: PromptContext,
): string {
  const { language, currency, listPriceMinor } = ctx;
  const listFormatted = formatAmount(listPriceMinor, currency, language);

  switch (move.kind) {
    case 'greet_and_ask_offer':
      return language === 'ar'
        ? [
            'الخطوة المطلوبة: رحّب بالمشتري، وأَثْنِ على اختياره للإعلان،',
            'واسأله بأدب "كم تقدر تعطيني؟" أو "شنو عرضك؟" — بدون ذكر أيّ رقم من طرفك.',
            `السعر المعلن: ${listFormatted} — لا تكرّره في هذه الرسالة.`,
          ].join(' ')
        : `Step: greet, acknowledge the listing, and ask for the buyer's offer — do NOT name a number yourself. List price is ${listFormatted}; don't repeat it here.`;

    case 'polite_reject': {
      const reasonAr = {
        too_low: 'العرض بعيد. ارفض بأدب — من غير إهانة — وذكّره بأن السعر مدروس.',
        buyer_walked:
          'المشتري يبدو أنه انسحب. أغلق بلطف وادع الباب مفتوح.',
      };
      const reasonEn = {
        too_low:
          'The offer is too far off. Reject politely — no offense — and note that the listed price is reasoned.',
        buyer_walked:
          'The buyer seems to be walking. Close politely and leave the door open.',
      };
      return language === 'ar' ? reasonAr[move.reason] : reasonEn[move.reason];
    }

    case 'small_concession': {
      const counter = formatAmount(move.counterPriceMinor, currency, language);
      return language === 'ar'
        ? `الخطوة: قدّم تنازلاً صغيراً — ${counter} — (${move.pctOffList}% تنازل عن السعر المعلن). إشارة صغيرة للرغبة في البيع بدون كسر السعر.`
        : `Step: offer a small concession at ${counter} (${move.pctOffList}% off list). Signal willingness without breaking price.`;
    }

    case 'mid_concession': {
      const counter = formatAmount(move.counterPriceMinor, currency, language);
      return language === 'ar'
        ? `الخطوة: قدّم عرضاً متوسّطاً — ${counter} — (${move.pctOffList}% تنازل). هذه الحركة الفعلية في التفاوض.`
        : `Step: counter with ${counter} (${move.pctOffList}% off list). This is the real move.`;
    }

    case 'final_offer': {
      const price = formatAmount(move.priceMinor, currency, language);
      return language === 'ar'
        ? `الخطوة: هذا آخر سعر — ${price}. وضّح أنه السعر النهائي بأدب. استخدم "آخر سعر" أو "هذا آخر رقم".`
        : `Step: this is the final price — ${price}. State it clearly but politely. Phrase it as "my final price".`;
    }

    case 'accept_offer': {
      const offer = formatAmount(move.offerMinor, currency, language);
      return language === 'ar'
        ? `الخطوة: اقبل العرض مبدئياً — ${offer}. قل إنك ستؤكّد مع صاحب الإعلان ثم ترجع خلال ساعة. لا توقّع الصفقة.`
        : `Step: tentatively accept the ${offer} offer. Say you'll confirm with the owner and reply within the hour. Do NOT commit to the deal.`;
    }

    case 'hand_to_human':
      return language === 'ar'
        ? 'الخطوة: اشكر المشتري وقل إنك ستعود له شخصياً بأسرع وقت. لا تجيب على السؤال.'
        : 'Step: thank the buyer and say you\'ll reply personally shortly. Do NOT attempt to answer the question.';
  }
}

function buildGroundTruth(ctx: PromptContext): string {
  const listFormatted = formatAmount(
    ctx.listPriceMinor,
    ctx.currency,
    ctx.language,
  );
  if (ctx.language === 'ar') {
    return [
      'المعلومات الحقيقية (استخدمها فقط — لا تخترع):',
      `- عنوان الإعلان: ${ctx.listingTitle}`,
      `- السعر المعلن: ${listFormatted}`,
    ].join('\n');
  }
  return [
    'Ground truth (use ONLY this — never invent):',
    `- Listing title: ${ctx.listingTitle}`,
    `- List price: ${listFormatted}`,
  ].join('\n');
}

function buildSafetyRules(language: 'ar' | 'en'): string {
  if (language === 'ar') {
    return [
      'ممنوعات:',
      '- لا تذكر رقم هاتف أبداً.',
      '- لا تطلب من المشتري التواصل خارج ديلو.',
      '- لا تتحدّث عن جنسيّة / دين / جنس المشتري.',
      '- لا تخترع مميّزات أو تفاصيل لم ترد في عنوان الإعلان.',
      '- لا تلتزم بتاريخ معاينة محدّد إلا لو نصّ البائع على ذلك.',
    ].join('\n');
  }
  return [
    'Prohibited:',
    '- Never share any phone number.',
    '- Never ask the buyer to move the conversation off Dealo.',
    '- Never mention the buyer\'s nationality, religion, or gender.',
    '- Never invent features not in the listing title.',
    '- Never commit to a specific viewing date unless the seller explicitly set one.',
  ].join('\n');
}

function buildMachineTags(move: PolicyMove, language: 'ar' | 'en'): string {
  // Machine-readable at the end of the prompt. The stub reads these;
  // real LLMs ignore them. Eval harnesses use them to score replies.
  return `[[move:${move.kind}]] [[lang:${language}]]`;
}

// ---------------------------------------------------------------------------
// Formatting helper — keep in sync with src/lib/format.ts style
// ---------------------------------------------------------------------------

function formatAmount(
  minor: number,
  currency: string,
  language: 'ar' | 'en',
): string {
  const decimals: Record<string, number> = {
    KWD: 3,
    BHD: 3,
    OMR: 3,
    SAR: 2,
    AED: 2,
    QAR: 2,
    USD: 2,
  };
  const d = decimals[currency] ?? 2;
  const amount = minor / Math.pow(10, d);
  return new Intl.NumberFormat(language === 'ar' ? 'ar-KW' : 'en-US', {
    style: 'currency',
    currency,
    numberingSystem: 'latn',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(amount);
}
