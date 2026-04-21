import { describe, it, expect, vi } from 'vitest';
import { OpenAIProvider } from './openai';

/**
 * OpenAIProvider tests.
 *
 * We stub `fetch` via the `fetchImpl` DI hook so tests are fully
 * offline + deterministic. The production class uses the global
 * `fetch` directly.
 *
 * Locked invariants:
 *   - System prompt is placed as the first 'system' message
 *   - Buyer/assistant history preserved in order
 *   - max_tokens + temperature respect request defaults
 *   - Token counts + model passed back from the API
 *   - API error → throws (caller falls back to stub per §P15)
 *   - Missing API key → constructor throws
 */

function mockOkResponse(text: string, tokensIn = 100, tokensOut = 50) {
  return (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: text } }],
          usage: { prompt_tokens: tokensIn, completion_tokens: tokensOut },
          model: 'gpt-4o-mini',
        }),
      text: () => Promise.resolve(''),
    } as unknown as Response)) as typeof fetch;
}

function mockErrResponse(status: number, body: string) {
  return (() =>
    Promise.resolve({
      ok: false,
      status,
      text: () => Promise.resolve(body),
      json: () => Promise.resolve({}),
    } as unknown as Response)) as typeof fetch;
}

describe('OpenAIProvider — construction', () => {
  it('throws when no API key provided and env not set', () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => new OpenAIProvider()).toThrow(/OPENAI_API_KEY/);
    if (original) process.env.OPENAI_API_KEY = original;
  });

  it('accepts explicit apiKey', () => {
    const p = new OpenAIProvider({ apiKey: 'test-key' });
    expect(p.name).toBeTypeOf('string');
  });

  it('uses OPENAI_MODEL_MINI env var as model name', () => {
    const original = process.env.OPENAI_MODEL_MINI;
    process.env.OPENAI_MODEL_MINI = 'gpt-custom-mini';
    const p = new OpenAIProvider({ apiKey: 'test-key' });
    expect(p.name).toBe('gpt-custom-mini');
    if (original) process.env.OPENAI_MODEL_MINI = original;
    else delete process.env.OPENAI_MODEL_MINI;
  });

  it('falls back to gpt-4o-mini when no model env', () => {
    const original = process.env.OPENAI_MODEL_MINI;
    delete process.env.OPENAI_MODEL_MINI;
    const p = new OpenAIProvider({ apiKey: 'test-key' });
    expect(p.name).toBe('gpt-4o-mini');
    if (original) process.env.OPENAI_MODEL_MINI = original;
  });
});

describe('OpenAIProvider — generate()', () => {
  it('calls OpenAI chat completions with system + messages', async () => {
    let capturedBody: any = null;
    const spy: typeof fetch = (async (_url: any, init: any) => {
      capturedBody = JSON.parse(init.body as string);
      return mockOkResponse('مرحبا، شنو عرضك؟')(_url, init);
    }) as typeof fetch;

    const p = new OpenAIProvider({
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      fetchImpl: spy,
    });

    await p.generate({
      systemPrompt: 'You are a seller assistant. [[move:greet_and_ask_offer]]',
      messages: [
        { role: 'user', content: 'السلام عليكم' },
      ],
      maxOutputTokens: 300,
      temperature: 0.7,
    });

    expect(capturedBody.model).toBe('gpt-4o-mini');
    expect(capturedBody.messages[0].role).toBe('system');
    expect(capturedBody.messages[0].content).toMatch(/seller assistant/);
    expect(capturedBody.messages[1].role).toBe('user');
    expect(capturedBody.messages[1].content).toBe('السلام عليكم');
    expect(capturedBody.max_tokens).toBe(300);
    expect(capturedBody.temperature).toBe(0.7);
  });

  it('returns text + token counts + model + latency', async () => {
    const p = new OpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: mockOkResponse('مرحبا، كم عرضك؟', 120, 45),
    });
    const result = await p.generate({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(result.text).toBe('مرحبا، كم عرضك؟');
    expect(result.tokensInput).toBe(120);
    expect(result.tokensOutput).toBe(45);
    expect(result.model).toBe('gpt-4o-mini');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('trims leading/trailing whitespace from response', async () => {
    const p = new OpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: mockOkResponse('  \n  السلام عليكم  \n '),
    });
    const result = await p.generate({
      systemPrompt: 'x',
      messages: [{ role: 'user', content: 'x' }],
    });
    expect(result.text).toBe('السلام عليكم');
  });

  it('non-OK HTTP status → throws with body preview', async () => {
    const p = new OpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: mockErrResponse(429, '{"error":"rate_limited"}'),
    });
    await expect(
      p.generate({ systemPrompt: 'x', messages: [{ role: 'user', content: 'x' }] }),
    ).rejects.toThrow(/429/);
  });

  it('empty choices → returns empty text', async () => {
    const noChoices: typeof fetch = (() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ choices: [], model: 'gpt-4o-mini' }),
      } as unknown as Response)) as typeof fetch;
    const p = new OpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: noChoices,
    });
    const result = await p.generate({
      systemPrompt: 'x',
      messages: [{ role: 'user', content: 'x' }],
    });
    expect(result.text).toBe('');
  });

  it('uses default max_tokens=300 + temperature=0.7 when not set', async () => {
    let capturedBody: any = null;
    const spy: typeof fetch = (async (_url: any, init: any) => {
      capturedBody = JSON.parse(init.body as string);
      return mockOkResponse('ok')(_url, init);
    }) as typeof fetch;
    const p = new OpenAIProvider({ apiKey: 'test-key', fetchImpl: spy });
    await p.generate({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(capturedBody.max_tokens).toBe(300);
    expect(capturedBody.temperature).toBe(0.7);
  });
});
