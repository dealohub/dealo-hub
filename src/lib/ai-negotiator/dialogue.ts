/**
 * AI Negotiator — Dialogue orchestrator.
 *
 * The only entrypoint the application layer should call. Given a
 * policy move + buyer context + a provider, it:
 *   1. Builds the system prompt via prompts.ts
 *   2. Calls the provider.generate()
 *   3. Returns the draft text + metadata for the audit log
 *
 * Filters (A/B/C + floor-leak scan) are applied by the CALLER before
 * actually sending the draft. See planning/PHASE-6A-AI-NEGOTIATOR.md §6.
 *
 * This file has zero business logic of its own. It composes the other
 * modules — keeping responsibilities sharply split.
 */

import { buildSystemPrompt, type PromptContext } from './prompts';
import type { PolicyMove } from './policy';
import type {
  LLMProvider,
  LLMResponse,
  LLMChatMessage,
} from './provider';

export interface DialogueInput {
  move: PolicyMove;
  ctx: PromptContext;
  /** Up to the last 4 buyer+seller messages. Older gets dropped. */
  history?: LLMChatMessage[];
  /** Provider instance (real or stub). Caller supplies. */
  provider: LLMProvider;
}

export interface DialogueResult {
  /** Unfiltered draft straight from the provider. */
  draftText: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  /**
   * sha256 prefix of the full prompt — goes to ai_message_log.prompt_hash
   * so investigators can group retries. Stable across calls.
   */
  promptHashPrefix: string;
}

const HISTORY_MAX_MESSAGES = 4;

export async function generateReply(input: DialogueInput): Promise<DialogueResult> {
  const { move, ctx, history = [], provider } = input;

  const systemPrompt = buildSystemPrompt(move, ctx);

  // Clip history to the most recent messages only — don't leak buyer's
  // phrasing about themselves beyond what's needed for context.
  const trimmedHistory = history.slice(-HISTORY_MAX_MESSAGES);

  // Append the buyer's current message as the final user turn, if not
  // already the tail of history. This mirrors the OpenAI/Anthropic
  // convention where system = persona, messages = conversation.
  const messages: LLMChatMessage[] = [...trimmedHistory];
  if (ctx.buyerLastMessage && (
    messages.length === 0 ||
    messages[messages.length - 1]?.content !== ctx.buyerLastMessage
  )) {
    messages.push({ role: 'user', content: ctx.buyerLastMessage });
  }

  const response: LLMResponse = await provider.generate({
    systemPrompt,
    messages,
    maxOutputTokens: 300,
    temperature: 0.7,
    traceTag: `move:${move.kind}`,
  });

  return {
    draftText: response.text,
    model: response.model,
    tokensInput: response.tokensInput,
    tokensOutput: response.tokensOutput,
    latencyMs: response.latencyMs,
    promptHashPrefix: simpleHashPrefix(systemPrompt + JSON.stringify(messages)),
  };
}

/**
 * Non-cryptographic hash for log grouping. Node's `crypto` would work
 * too but adds an import; this keeps the module platform-agnostic.
 * 16-char hex prefix is enough to cluster retries without collisions
 * at the scale of a single seller's daily conversations.
 */
function simpleHashPrefix(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (v: number) => (v >>> 0).toString(16).padStart(8, '0');
  return hex(h1) + hex(h2);
}
