/**
 * Smoke test for the AI Negotiator end-to-end pipeline.
 *
 * Runs a REAL OpenAI call (gpt-4o-mini) through:
 *   policy.decidePolicyMove → dialogue.generateReply → safety.runSafetyPipeline
 *
 * Cost: ~$0.0001 per run (single call, ~400 input + ~80 output tokens).
 *
 * Run:   npx tsx scripts/smoke-ai-negotiator.ts
 * Env:   reads from .env.local (OPENAI_API_KEY, OPENAI_MODEL_MINI)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local manually (dotenv/config only reads .env by default)
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // No .env.local — rely on process env
}

import { decidePolicyMove } from '../src/lib/ai-negotiator/policy';
import { generateReply } from '../src/lib/ai-negotiator/dialogue';
import { runSafetyPipeline } from '../src/lib/ai-negotiator/safety';
import { OpenAIProvider } from '../src/lib/ai-negotiator/providers/openai';

// ---------------------------------------------------------------------------
// Scenario fixtures — realistic Bayan villa listing
// ---------------------------------------------------------------------------

const SCENARIO = {
  listingTitle: 'فيلا في بيان — مفحوصة ديلو',
  listPriceMinor: 650_000_000, // KWD 650,000
  floorMinor: 600_000_000, // KWD 600,000 (secret)
  currency: 'KWD' as const,
  tone: 'warm' as const,
  language: 'ar' as const,
};

// Buyer journey — 3 increasingly engaged messages
const BUYER_TURNS = [
  {
    text: 'السلام عليكم، الفيلا لا تزال متاحة؟',
    intent: 'logistics_question' as const,
    offerMinor: null,
    messageCount: 1,
    aiMessagesSent: 0,
    label: 'Turn 1 — greeting / logistics',
  },
  {
    text: 'ممكن 550 ألف؟',
    intent: 'price_offer' as const,
    offerMinor: 550_000_000, // below floor
    messageCount: 3,
    aiMessagesSent: 1,
    label: 'Turn 2 — lowball offer (below floor)',
  },
  {
    text: 'طيب 610 آخر كلام',
    intent: 'price_offer' as const,
    offerMinor: 610_000_000, // above floor
    messageCount: 5,
    aiMessagesSent: 2,
    label: 'Turn 3 — offer above floor (should accept)',
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  console.log('\n=== AI NEGOTIATOR SMOKE TEST ===\n');
  console.log(`Model: ${process.env.OPENAI_MODEL_MINI ?? 'gpt-4o-mini'}`);
  console.log(`Listing: ${SCENARIO.listingTitle}`);
  console.log(
    `List: KWD ${(SCENARIO.listPriceMinor / 1000).toLocaleString()} · Floor: KWD ${(SCENARIO.floorMinor / 1000).toLocaleString()} (secret)`,
  );
  console.log('');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set. Aborting.');
    process.exit(1);
  }

  const provider = new OpenAIProvider();
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalLatencyMs = 0;

  for (const turn of BUYER_TURNS) {
    console.log('─'.repeat(60));
    console.log(`🧑 ${turn.label}`);
    console.log(`    Buyer: "${turn.text}"`);

    // Step 1 — policy decides the move
    const move = decidePolicyMove({
      listPriceMinor: SCENARIO.listPriceMinor,
      floorMinor: SCENARIO.floorMinor,
      lastBuyerOfferMinor: turn.offerMinor,
      messageCount: turn.messageCount,
      aiMessagesSent: turn.aiMessagesSent,
      lastBuyerIntent: turn.intent,
    });
    console.log(`    🧠 Policy: ${JSON.stringify(move)}`);

    // Step 2 — dialogue generates draft via real OpenAI call
    const result = await generateReply({
      move,
      ctx: {
        tone: SCENARIO.tone,
        language: SCENARIO.language,
        listingTitle: SCENARIO.listingTitle,
        listPriceMinor: SCENARIO.listPriceMinor,
        currency: SCENARIO.currency,
        buyerLastMessage: turn.text,
      },
      provider,
    });
    console.log(`    💬 AI draft: "${result.draftText}"`);
    console.log(
      `    📊 Tokens: ${result.tokensInput} in / ${result.tokensOutput} out · ${result.latencyMs}ms · model=${result.model}`,
    );
    totalTokensIn += result.tokensInput;
    totalTokensOut += result.tokensOutput;
    totalLatencyMs += result.latencyMs;

    // Step 3 — safety pipeline
    const allowFloorMatch =
      move.kind === 'final_offer' &&
      move.priceMinor === SCENARIO.floorMinor;
    const safety = runSafetyPipeline({
      draftText: result.draftText,
      floorMinor: SCENARIO.floorMinor,
      listPriceMinor: SCENARIO.listPriceMinor,
      currency: SCENARIO.currency,
      allowFloorMatch,
    });
    if (safety.safe) {
      console.log(`    ✅ Safety: PASS`);
    } else {
      console.log(
        `    ❌ Safety: BLOCKED — violations: ${JSON.stringify(safety.violations)}`,
      );
    }
    console.log('');
  }

  // Cost estimate
  const priceInPerM = 0.15;
  const priceOutPerM = 0.6;
  const cost =
    (totalTokensIn * priceInPerM + totalTokensOut * priceOutPerM) / 1_000_000;
  console.log('─'.repeat(60));
  console.log(
    `TOTAL: ${totalTokensIn} tokens in / ${totalTokensOut} tokens out`,
  );
  console.log(
    `TOTAL LATENCY: ${totalLatencyMs}ms across ${BUYER_TURNS.length} calls`,
  );
  console.log(`TOTAL COST: $${cost.toFixed(6)}\n`);
}

run().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
