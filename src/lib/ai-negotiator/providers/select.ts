/**
 * AI Negotiator — Provider selector.
 *
 * Single entry point for choosing which LLM provider to use at call
 * time. Current policy (keep it simple):
 *
 *   1. If `AI_NEGOTIATOR_PROVIDER` is explicitly 'stub' → StubProvider
 *      (useful for local dev / tests / CI without API keys).
 *   2. Otherwise → OpenAIProvider (cheapest option; doctrine §7).
 *
 * Anthropic Claude is wired in later (needs `@anthropic-ai/sdk`
 * install + more code). Routing by language (Arabic → Claude, English
 * → OpenAI) is a Phase 6c refinement — until then, we use OpenAI for
 * everything since it's ~5× cheaper and handles both languages
 * acceptably for MVP.
 *
 * The selector catches missing-API-key errors and falls back to
 * StubProvider with a single console warning. This keeps local dev
 * working even if a contributor hasn't set OPENAI_API_KEY yet.
 */

import type { LLMProvider } from '../provider';
import { StubProvider } from '../provider';
import { OpenAIProvider } from './openai';

export function selectProvider(): LLMProvider {
  const mode = process.env.AI_NEGOTIATOR_PROVIDER ?? 'openai';

  if (mode === 'stub') {
    return new StubProvider();
  }

  // Default: OpenAI (cheapest per §7).
  try {
    return new OpenAIProvider();
  } catch (err) {
    console.warn(
      '[ai-negotiator/select] OpenAI unavailable, falling back to StubProvider.',
      err instanceof Error ? err.message : err,
    );
    return new StubProvider();
  }
}
