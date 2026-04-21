/**
 * AI Negotiator — LLM Provider adapter.
 *
 * A thin interface over whichever LLM we route to. Per doctrine §7,
 * Arabic conversations go to Claude Haiku or Jais; English goes to
 * GPT-4o-mini. Routing happens in dialogue.ts by inspecting language.
 *
 * No real provider is wired in this file — the runtime only sees the
 * `LLMProvider` interface + a deterministic `StubProvider` for tests
 * and dry-runs. Real providers (OpenAI, Anthropic) land in Phase 6c
 * once API keys are provisioned. Swapping them is a one-line import
 * change in the engine entrypoint.
 *
 * Why stubs first: lets us ship + test the full engine (policy +
 * dialogue + filters + scheduling) before committing to $/model costs.
 * Also lets tests be fully deterministic without external calls.
 */

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

export interface LLMChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  systemPrompt: string;
  messages: LLMChatMessage[];
  /** Soft cap; provider may undershoot. Default 300. */
  maxOutputTokens?: number;
  /** 0-2. Default 0.7 for natural-feeling dialect. */
  temperature?: number;
  /** Free-form tag so the log can attribute the request. */
  traceTag?: string;
}

export interface LLMResponse {
  /** The raw text returned by the model. Caller is responsible for filters. */
  text: string;
  /** Model identifier, e.g. 'claude-haiku-3.5', 'gpt-4o-mini', 'stub-v1'. */
  model: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// The interface every provider must implement.
// ---------------------------------------------------------------------------

export interface LLMProvider {
  /** Short identifier — appears in logs + ai_message_log.model column. */
  readonly name: string;
  /** Generate a reply. Must not throw for empty / trivial inputs. */
  generate(req: LLMRequest): Promise<LLMResponse>;
}

// ---------------------------------------------------------------------------
// Stub provider — deterministic canned replies. Used in tests + dev
// until real API keys are wired.
// ---------------------------------------------------------------------------

/**
 * Returns canned Arabic replies keyed off the "move" tag the system
 * prompt carries. The dialogue module encodes the chosen policy move
 * into the prompt via `[[move:xxx]]` tags; StubProvider reads those
 * back out and picks a plausible line.
 *
 * Not meant to be beautiful — meant to be deterministic and Khaleeji-ish
 * enough that downstream filter tests have real text to work with.
 */
export class StubProvider implements LLMProvider {
  readonly name = 'stub-v1';

  async generate(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const move = extractMoveTag(req.systemPrompt);
    const language = extractLanguageTag(req.systemPrompt);
    const text = cannedReply(move, language);

    // Simulate a tiny async so callers can assert on the Promise shape.
    await new Promise(r => setTimeout(r, 1));

    return {
      text,
      model: this.name,
      tokensInput: approxTokenCount(req.systemPrompt + joinMessages(req.messages)),
      tokensOutput: approxTokenCount(text),
      latencyMs: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers — intentionally small + pure
// ---------------------------------------------------------------------------

function joinMessages(messages: LLMChatMessage[]): string {
  return messages.map(m => m.content).join(' ');
}

/** Rough token estimate: ~4 chars/token for English, ~2 for Arabic. */
function approxTokenCount(s: string): number {
  // Detect majority script — not perfect but close enough for a stub.
  const arabicChars = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = s.length - arabicChars;
  return Math.ceil(arabicChars / 2) + Math.ceil(latinChars / 4);
}

/** Parse `[[move:accept_offer]]` from the system prompt. */
function extractMoveTag(prompt: string): string {
  const m = prompt.match(/\[\[move:([a-z_]+)\]\]/);
  return m?.[1] ?? 'unknown';
}

/** Parse `[[lang:ar]]` or `[[lang:en]]` from the system prompt. */
function extractLanguageTag(prompt: string): 'ar' | 'en' {
  const m = prompt.match(/\[\[lang:(ar|en)\]\]/);
  return (m?.[1] as 'ar' | 'en') ?? 'ar';
}

/**
 * Canned reply library — one line per (move × language). Deliberately
 * generic so we're not shipping fake "dialect" that'll age poorly; the
 * real replies come from Claude/Jais in Phase 6c.
 */
function cannedReply(move: string, language: 'ar' | 'en'): string {
  const ar: Record<string, string> = {
    greet_and_ask_offer:
      'السلام عليكم، شكراً على اهتمامك. عطني عرضك وأرد عليك بسرعة.',
    polite_reject:
      'الله يعطيك العافية — السعر مب قابل لهذا المستوى. ترى الإعلان واضح.',
    small_concession:
      'ممكن نزلها شوي — آخر ما نوصل تقريباً. شوف الرقم وخبرني.',
    mid_concession:
      'ترى أنا مرن شوي. هذا آخر سعر أقدر أوصل له على السريع.',
    final_offer:
      'هذا آخر سعر وسعر البيت والله. إذا يناسبك نقفل الصفقة.',
    accept_offer:
      'تمام — السعر يناسبني. راح أأكد مع صاحب الإعلان وأرد عليك خلال ساعة.',
    hand_to_human:
      'شكراً — راح أرجع لك شخصياً بأسرع وقت.',
  };
  const en: Record<string, string> = {
    greet_and_ask_offer:
      'Hi — thanks for reaching out. What offer do you have in mind?',
    polite_reject:
      'Appreciate the offer, but the price isn\'t flexible that far. The listing reflects what I need.',
    small_concession:
      'I can come down a touch — not much room, but let me know if the new number works.',
    mid_concession:
      'I have a little flexibility. This is the best I can do quickly.',
    final_offer:
      'This is my final price. If it works for you, we can close the deal.',
    accept_offer:
      'That works for me — let me confirm with the owner and I\'ll reply within the hour.',
    hand_to_human:
      'Thanks — I\'ll get back to you personally shortly.',
  };
  const bank = language === 'ar' ? ar : en;
  return bank[move] ?? bank.hand_to_human;
}
