/**
 * AI Negotiator — OpenAI provider.
 *
 * Uses `gpt-4o-mini` (env `OPENAI_MODEL_MINI`) — cheapest capable
 * model as of 2026-04:
 *   • Input  $0.15 / 1M tokens
 *   • Output $0.60 / 1M tokens
 *   • ~5× cheaper than Claude Haiku 3.5 for equivalent quality on
 *     English and good-enough on Arabic for MVP.
 *
 * The SDK is lazy-imported so environments without the key don't pay
 * the bundle cost. StubProvider remains the default in tests.
 *
 * Failure mode: any network / API error → throws. The caller
 * (dialogue orchestrator) catches + falls back to StubProvider per
 * doctrine §P15 (offline-safe).
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMChatMessage,
} from '../provider';

interface OpenAICompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string | null } }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
}

export interface OpenAIProviderOpts {
  /** Defaults to process.env.OPENAI_API_KEY. */
  apiKey?: string;
  /** Defaults to process.env.OPENAI_MODEL_MINI || 'gpt-4o-mini'. */
  model?: string;
  /** For dependency injection in tests. Production leaves undefined. */
  fetchImpl?: typeof fetch;
}

export class OpenAIProvider implements LLMProvider {
  readonly name: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: OpenAIProviderOpts = {}) {
    const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        '[ai-negotiator/openai] OPENAI_API_KEY not set — cannot construct provider',
      );
    }
    this.apiKey = apiKey;
    this.name = opts.model ?? process.env.OPENAI_MODEL_MINI ?? 'gpt-4o-mini';
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async generate(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    const messages: OpenAICompletionMessage[] = [
      { role: 'system', content: req.systemPrompt },
      ...req.messages.map((m: LLMChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await this.fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.name,
        messages,
        max_tokens: req.maxOutputTokens ?? 300,
        temperature: req.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(no body)');
      throw new Error(
        `[ai-negotiator/openai] ${response.status}: ${body.slice(0, 200)}`,
      );
    }

    const json = (await response.json()) as OpenAIChatResponse;
    const text = json.choices?.[0]?.message?.content ?? '';

    return {
      text: text.trim(),
      model: json.model ?? this.name,
      tokensInput: json.usage?.prompt_tokens ?? 0,
      tokensOutput: json.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - start,
    };
  }
}
