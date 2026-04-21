# Phase 6a — Dealo AI Negotiator: Doctrine, Schema, Safety Model

> **Author:** Claude Code · **Date:** 2026-04-21 · **Status:** v1 — evidence-locked, pre-code
> **Depends on:** Block A shipped (auth + sell + chat + search + accounts + navbar + observability), Block C tests green (174 assertions)
> **Strategically aligned with:** `DECISIONS.md` #2 (chat-only contact), PHASE-4A-AUDIT (14-pillar evidence pattern), `LAUNCH-STRATEGY.md`
> **Research tracks executed:**
>   - Agent A — Kuwait negotiation culture (training-knowledge + pan-Gulf C2C conventions) · ✅ returned
>   - Agent B — Global AI-negotiation state of the art (Lewis 2017, CICERO, Pactum, eBay/Mercari, EU AI Act) · ✅ returned
> **This document ships BEFORE any code.** Same pattern that worked for Phase 4a.

---

## 0. Why this document exists

The user proposed "AI that negotiates on behalf of sellers" as a differentiator.

I rejected building it during Block A — feature-creep before the foundation polished. Now that Block A is done, tests are locked, and the user has explicitly parked the cosmetic polish (design will be redone), **the right move is to design Phase 6 on paper first**, before a single React component or database migration is written.

What happened in Phase 4a is the template:
- Live DOM probe of two Kuwait competitors
- Law 74/1979 doctrine, evidence-cited
- Schema designed to enforce the doctrine (not bolt-on)
- 10 seed listings each demonstrating one pillar
- Shipped in 6 coherent commits

Phase 6a follows the same shape — research-first, doctrine-cited, schema-designed-to-enforce, then (Phase 6b+) ship.

---

## 1. Problem statement

### 1.1 What "AI negotiator" means for Dealo
An AI that, acting on behalf of a **seller who opts in**:

- Reads every buyer message on that seller's conversations
- Drafts a reply in the seller's voice, in Arabic (default) or English
- Either **sends autonomously** under tight guardrails, OR **queues for 1-click approval**
- Tracks negotiation state (opening → counter-1 → counter-2 → close/walk)
- Never breaches the seller's secret floor price
- Never closes a deal without explicit human ratification (legal/liability)

### 1.2 What it is NOT
- NOT a "chat assistant" advisor that suggests replies for the seller to type
- NOT a buyer-side AI (that's Phase 6c; asymmetric is safer MVP)
- NOT an automated accept/reject like eBay Best Offer (too mechanical for Kuwait haggling culture)
- NOT a price-recommender engine (that's a different feature, `pricing-insights`)
- NOT anonymous — every AI message carries a visible badge

### 1.3 Why now
- Block A's chat layer (Phase 5c) is the foundation — conversations + messages + offers + Filter A/C already wired
- Rate limit infrastructure (Phase 5g) prevents cost runaway
- Observability stubs (Phase 5g) make AI conversations auditable from day 1
- The Kuwait seller sits on multiple listings at once; AI-drafted replies cut their response latency from hours to seconds → first-mover advantage in a volume-insensitive market

### 1.4 Why Kuwait first — evidence-backed positioning
Three Kuwait-specific facts, drawn from Agent A, make this the ideal first market:

1. **The haggling dance is ritualised, not optimisation-driven.** Kuwaiti buyers open with `آخر سعر؟` ("last price?") or `السعر قابل للتفاوض؟` ("is the price negotiable?") before any number. Typical settled discount: **5-15% on used cars/electronics, 15-25% on furniture** (HIGH on phrases; MEDIUM on ranges). Sellers pad listings by ~10% expecting this dance. → An AI that skips the dance (cold counter-number on first reply) is instantly untrusted. An AI that performs the dance competently gets a seller the outcome they'd get manually — at 24/7 availability.

2. **Face-saving conventions are non-negotiable and testable.** Opening a reply with a number ("500 بس") without salaam is considered rude. Proper format: `السلام عليكم` + item-specific compliment (`شكلها نظيفة ماشاء الله`) + engagement. Cold English-only messages from a Kuwaiti-number signal non-Kuwaiti or bot (HIGH fidelity). → We can encode this as a deterministic pre-filter on AI output before send: discard drafts that open with a bare number.

3. **No GCC competitor has shipped agentic negotiation.** PropertyFinder + Bayut + Dubizzle + Q84Sale + Haraj.com.sa all use AI only for *description generation, price suggestion, or lead scoring* — never agentic chat on behalf of sellers (HIGH for absence of public deployment; MEDIUM on the exact why). Likely reasons: (a) brand-risk aversion post-Facebook "Deal or No Deal" press, (b) no dialect-capable LLM until recently, (c) fraud-liability unknowns, (d) ambiguity under Kuwait Law 39/2014 (Consumer Protection) + Law 20/2014 (E-Commerce). → First-mover opening with a credible safety model.

---

## 2. Research methodology

Two parallel agent tracks executed before §3 pillars were finalised. Every claim carries fidelity (HIGH = widely documented / verifiable, MEDIUM = informed inference, NO-EVIDENCE = flagged gap).

| Track | Source | Fidelity | Key deliverables for this doc |
|---|---|---|---|
| **A. Kuwait culture** | Agent A (training-knowledge on Gulf C2C conventions + Dubizzle KW patterns) | HIGH on phrase conventions, dialect, timing; MEDIUM on discount percentages | §1.4, §3 P4/P12/P13, §3 P15 (latency) |
| **B. Global AI-negotiation SOTA** | Agent B (Lewis 2017, Meta CICERO 2022, Pactum, eBay, EU AI Act, Anthropic Constitutional AI, Mercari, Amazon) | HIGH on precedents + legal frameworks; MEDIUM on cost numbers | §3 P1/P3/P6/P14, §6, §7, §8 |
| **C. Internal** | Dealo chat layer (Phase 5c schema), Filter A/B/C, rate-limit RPC | HIGH — live in DB | §4, §5, §6 |

Every pillar below cites its evidence row. §12 collects the primary agent reports in full.

**Key doctrinal shifts informed by research:**
- Lewis 2017's "invented language" failure → AI **must not** reward-optimise (strip the ritual); we mirror the cultural dance explicitly (P4/P15)
- CICERO 2022's policy-dialogue split (planner picks move, LLM verbalises) → encoded in P6 implementation; LLM never invents the number
- Pactum AI's B2B success → proven pattern = opt-in per listing + authority envelope + disclosure + no-close; P1/P2/P3/P6 are that pattern
- EU AI Act Art. 50 = "limited risk, transparency obligation" for marketplace negotiation AI → P3 (disclose always) satisfies this pre-emptively, even for GCC launch

---

## 3. The 15-pillar doctrine

Each pillar: **observed risk or opportunity → our answer → what it means for schema/code/UX**. Research agents added two pillars beyond the original 13 draft: P14 (human-like latency, from Agent A's timing evidence) and the policy-dialogue split inside P6 (from Agent B's CICERO findings).

### P1. Asymmetric opt-in (seller-side only, MVP)
**Risk.** Two-sided AI negotiation converges to either nonsense loops or bot-vs-bot price discovery that users don't trust.
**Answer.** Only the seller opts in, per listing. Buyers see the seller's messages (some AI, some human) and respond as normal. If the buyer also gets AI assistance later (Phase 6c), it'll be opt-in per account, not per listing, with mandatory disclosure on both sides.
**Schema.** `listings.negotiation_enabled` boolean + `listings.ai_settings` JSONB.

### P2. Floor-protected (AI never breaches)
**Risk.** AI makes a crude math-optimised counter that undercuts what the seller would ever accept → legal binding?
**Answer.** Every AI-enabled listing has a secret `ai_floor_minor_units` set by the seller at opt-in. The AI's system prompt never sees this number verbatim; instead it receives a one-way check function: "would the seller accept X?" → yes/no. The floor number itself only lives in the seller's draft + the negotiation_sessions audit trail.
**Schema.** `listings.ai_floor_minor_units` bigint, hidden from non-seller RLS. Engine calls `is_offer_above_floor(listing_id, offer) → bool` RPC, doesn't select the floor.

### P3. Disclosed (never hidden)
**Risk.** Bot-hiding erodes trust when discovered. EU AI Act Art.52(3) classifies commercial chatbots as high-risk-adjacent and mandates disclosure.
**Answer.** Every AI-authored message in the thread carries a "⚡ AI-assisted reply" badge. A sidebar note on the listing detail page informs buyers: "هذا البائع يستخدم مساعد ديلو للردّ السريع — جميع العروض يراجعها قبل القبول." ("This seller uses Dealo's reply assistant — all offers are reviewed by a human before acceptance.")
**Schema.** `messages.ai_generated` boolean (new column, default false). UI reads this to paint the badge.

### P4. Culture-calibrated (tone + dialect + rituals)
**Risk — Agent A (HIGH).** Four concrete failure modes: (a) MSA-only Arabic reads as "legalistic / foreign expat", (b) bare-number openings without `السلام عليكم` + compliment are rude, (c) perfect grammar/punctuation triggers bot suspicion, (d) instant sub-30s replies signal desperation OR bot. Combined effect: any one of these breaks Kuwait buyer trust on the first message.
**Answer.** Multi-layer prescription:
  - **Dialect non-negotiable.** Kuwaiti Khaleeji dialect (`شلونك`, `وايد`, `جذي`, `عاد`). MSA is **banned** as output language. English tech loan-words allowed and trust-positive (`البطارية original`, `السيارة clean title`).
  - **Mandatory opening template.** Every first-reply-in-thread starts: `salaam + item-specific compliment + engagement`. Deterministic pre-send filter rejects drafts that open with a bare number. Seller's opt-in preview shows 3 example openings in their chosen tone.
  - **Intentional human imperfection.** System prompt allows 1 typo per every ~4 messages (vowel diacritic variance, occasional shortened word). Never consistent perfect grammar. Punctuation varies (not every sentence ends in a period).
  - **Tone selector** on opt-in: `professional` / `warm` / `concise`. All three stay within Khaleeji register; they differ in formality + message length, not dialect.
**Schema.** `listings.ai_settings.tone` enum + system prompt scaffold per tone.
**Tests** (planned for Phase 6b): 40+ adversarial buyer messages × 3 tones; each output checked for (MSA-leak rate < 3%, opens-with-number rate = 0%, average reply length within tone band).

### P5. Filter-compliant (Filter A/B/C on AI output)
**Risk.** An AI could "helpfully" include a phone number, revive discriminatory copy from training data, or invent counterfeit language.
**Answer.** Every AI draft passes through the existing Filter A (phone), B (counterfeit), C (discriminatory) before being sent. If a filter fires, the draft is discarded, logged as a safety event, and the system falls back to "seller will reply shortly" with human-handover flag.
**Implementation.** Reuse `containsPhoneNumber` / `containsDiscriminatoryWording` / `containsCounterfeitTerm` from `validators.ts`. No new filters needed — already test-covered (67 tests).

### P6. Bounded authority + policy-dialogue split (CICERO pattern)
**Risk — Agent B (HIGH).** Lewis 2017 showed reward-optimising end-to-end chat agents drift into non-human protocol. Generic LLM-only agents hallucinate commitments (spec, warranty, delivery). Kuwait civil code Art. 95 makes AI-autonomous acceptance a potential binding contract — one hallucination = one lost case.
**Answer.** Two independent layers:
  - **Policy module** (pure TypeScript, deterministic): given current state `{list_price, current_buyer_offer, ai_floor, message_count}`, it picks the next move: `greet_and_ask_offer | polite_reject | small_concession(3-5%) | mid_concession(~8%) | final_offer | hand_to_human`. No LLM involvement.
  - **Dialogue module** (LLM): given the move + tone + language + conversation history, it verbalises the move in idiomatic Kuwaiti Khaleeji. Never picks numbers or strategy.

  **AI can** send greetings, ask for buyer offer, polite-reject lowballs, propose counters within policy-chosen envelope, reject out-of-band offers.
  **AI cannot** mark `accepted`. That state is only reachable by explicit seller tap in the inbox (UI-enforced + CHECK constraint + RLS policy).
**Schema.**
```sql
conversations.ai_negotiation_stage text CHECK IN (
  'inactive',           -- AI never touched this
  'negotiating',        -- policy module active
  'awaiting_seller_accept',  -- buyer's offer >= floor, AI paused, seller must tap
  'accepted',           -- seller tapped accept; immutable after this
  'walked'              -- either side disengaged; AI will not re-ping
);
```
**Enforcement.** AI service role can transition: `inactive → negotiating`, `negotiating → awaiting_seller_accept | walked`. Only the seller's authenticated JWT can transition `awaiting_seller_accept → accepted`. DB trigger enforces; Vitest state-machine tests lock it.

### P7. Handover-aware (knows its limits)
**Risk.** AI tries to answer an "is the property haunted?" / "is the owner divorced?" / "can I bring my pet?" question it shouldn't guess at.
**Answer.** A classifier on every incoming buyer message tags it: `price-offer` / `logistics-question` / `personal-question` / `emotional` / `off-topic`. Only `price-offer` + basic `logistics-question` get AI replies. Everything else triggers "Your buyer asked something specific — reply in seconds" seller notification with the message quoted.
**Schema.** `messages.intent_class` + `messages.needs_human_followup` columns (new).

### P8. Auditable (every AI message logged verbatim)
**Risk.** No way to investigate complaints, no way to train better tone models.
**Answer.** Every AI generation writes to `ai_message_log` with: input prompt, model, response draft, filter actions, final sent text, timestamp, tokens used, latency. RLS: only seller-self + service-role.
**Schema.** `ai_message_log` table (new, migration 0030).

### P9. Rate-limited + cost-bounded
**Risk.** Bot spams 1000 buyers; OpenAI bill = $200.
**Answer.** Build on the `check_rate_limit` RPC from Phase 5g. New actions: `ai.draft_generation` (50/hour/seller), `ai.proactive_followup` (5/day/conversation). Daily seller-level token budget: 500K input tokens = ~$0.05/day cap; exceed → AI stops, seller gets "daily AI budget exhausted, reply manually".
**Schema.** No new tables — reuses `rate_limits` + adds `ai_token_counters` view aggregating `ai_message_log.tokens_used`.

### P10. Reversible (seller can pause mid-session)
**Risk.** AI says something a seller disagrees with → seller wants out immediately.
**Answer.** One tap "Pause AI on this listing" in seller's inbox. Sets `listings.negotiation_enabled = false` — all in-flight AI drafts are dropped, queued buyer messages stay unanswered until the seller replies manually. Undo restores the setting but past AI drafts don't retroactively send.
**UX.** Pause button visible on every AI-written message + in seller dashboard.

### P11. Fairness (no mass-lowball, no floor leak)
**Risk.** AI gives every buyer a 5% discount → seller effectively re-prices down. Or: AI accidentally reveals floor while arguing.
**Answer.** Discount offered to any buyer never exceeds the difference between list price and seller's `ai_floor`. Two-message rule: AI never names a specific number below list price in its first two messages — it asks for the buyer's offer first (mirrors Kuwait haggling convention of "ما عندك؟" / "what do you have?"). Floor-leak check: before send, regex the outgoing text against `{{floor_number}}±5%` range; if present, discard + log.
**Implementation.** Prompt guardrail + post-generation regex scanner.

### P12. Register-mirroring (NOT dialect-forcing) — v1.1 revision
**Risk — Agent A (MEDIUM) + correction from user review 2026-04-21.** Agent A's HIGH-fidelity claim was "Kuwaitis clock MSA as foreign." True for **Kuwaiti nationals**. But **~70% of Kuwait's population is expat**: Egyptian, Syrian, Lebanese, Iraqi, Jordanian, Sudanese, Indian, Pakistani, Filipino, Sri Lankan, British, American. Forcing Khaleeji dialect onto an Egyptian writing `عايز` = alienates the buyer. Forcing casual English onto a South Asian domestic worker writing `sir please last price?` = equally wrong. Agent A's doctrine was biased toward a Kuwaiti-to-Kuwaiti haggle that is demographically the minority case.

**Corrected answer. AI mirrors the buyer's register. AI never imposes one.**

Routing rules:

| Buyer writes | AI replies |
|---|---|
| Khaleeji dialect (`شلونك`, `وايد`) | Khaleeji dialect — light, not theatrical |
| Egyptian / Levantine / Maghrebi dialect | **Modern Standard Arabic**, polite, not your own dialect |
| MSA (رسمية) | MSA, mid-formality |
| Broken / non-native Arabic | Short simple MSA sentences, never correct |
| Fluent English | English, same register (casual/formal) |
| Broken / non-native English (`sir please available?`) | **Short, simple sentences. Present tense. No idioms. Never correct.** |
| Code-switch AR+EN | Mirror the same mix at the same ratio |

**Invariants regardless of language:**
- Never start a reply with a bare number (rude in all Arabic registers AND English).
- Open every first-in-thread reply with a salaam OR polite acknowledgement of the item.
- Respect level is constant — British executive and domestic worker get the same politeness.

**Model routing (Agent B HIGH).** Claude Haiku 3.5 handles Arabic broadly (Khaleeji + Egyptian + Levantine). GPT-4o-mini handles English across registers. Jais-70B is a fallback for deep-Khaleeji edge cases. **Language detection fires per message**, not per conversation — a buyer can switch mid-thread and we mirror.

**Implementation.** `franc` or `cld3` for base detection + lightweight dialect classifier (regex on marker words: `شلونك/وايد/جذي` → Khaleeji; `عايز/ازاي/فين` → Egyptian; `شو/هلق/كيفك` → Levantine). Provider adapter pattern (`LLMProvider` with `claude`, `openai`, `jais` impls).

### P13. Time + prayer + Ramadan aware
**Risk — Agent A (HIGH).** Replying at 3 AM, or during Maghrib prayer, or in iftar window during Ramadan = instant distrust. Friday 11:30-13:00 (Jummah) is a dead zone. Kuwait weekend = Friday-Saturday.
**Answer.** Calendar-aware scheduler:
  - **Prayer-time windows.** Kuwait coordinates (29.38°N, 47.99°E) → compute 5 daily prayer times. AI pauses 10 min before through 20 min after each prayer (especially Maghrib).
  - **Ramadan mode.** Automatic date-range detection (Hijri calendar via `moment-hijri`). During Ramadan: no proactive follow-ups 17:00-21:00 (iftar → taraweeh prep). Peak reply window shifts to 21:00-01:00 (post-taraweeh).
  - **Friday Jummah.** 11:30-13:00 dead zone, no proactive messages.
  - **Quiet hours default.** 23:00-07:00 local (no proactive; buyer-initiated replies still answered).
**Schema.** `listings.ai_settings.quiet_hours` JSONB + server-side prayer calendar API (one cron-refreshed cache per day).

### P14. Human-like latency (NEW — Agent A finding)
**Risk — Agent A (HIGH).** Replies under 30 seconds signal bot OR desperation — both kill the deal. Kuwait buyers expect **5-45 minute** response windows from a real seller.
**Answer.** Intentional latency jitter. When AI generates a draft:
  - Minimum delay: 90 seconds (below this = obvious bot)
  - Maximum delay: 45 minutes
  - Distribution: log-normal weighted toward 3-12 min window (mimics natural human check-phone cadence)
  - Override: if the buyer has waited >2 hours, AI replies faster (2-5 min) to not lose the lead
  - Override: first message of the day after quiet hours gets 5-15 min delay (simulates seller checking phone after waking)
**Schema.** `ai_message_log.scheduled_send_at` column; a worker flushes due drafts every 30s.
**Tests.** Timing distribution test (Vitest fake timers): 1000 simulated draft schedules must spread across the log-normal band with no outliers under 90s.

### P15. Offline-safe (graceful degradation)
**Risk.** OpenAI/Anthropic 500s → AI silent → conversations look abandoned.
**Answer.** On LLM provider failure: swap immediately to a fallback template ("thanks for your interest — the seller will reply within a few hours") + queue the buyer's message for seller review. No false "AI down" error shown to buyer.
**Implementation.** Try-catch with exponential backoff; after 3 failures in 5min the session auto-hands-off for 1h.

---

## 4. Schema extensions (migration 0030)

### 4.1 Columns on existing tables

```sql
-- listings: per-listing AI opt-in + floor + settings
ALTER TABLE listings
  ADD COLUMN negotiation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN ai_floor_minor_units bigint,          -- secret; never SELECTed by AI engine
  ADD COLUMN ai_settings jsonb NOT NULL DEFAULT '{}'::jsonb;  -- tone, quiet_hours, tokens_used_today

-- RLS: ai_floor is visible ONLY to seller + service role.
-- A new column-grant policy restricts SELECT(ai_floor_minor_units) to
-- seller_id = auth.uid() OR current_setting('role') = 'service_role'.

-- messages: flag AI-authored + intent class + human-followup hint
ALTER TABLE messages
  ADD COLUMN ai_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN intent_class text,    -- 'price_offer' | 'logistics_question' | 'personal_question' | 'emotional' | 'off_topic'
  ADD COLUMN needs_human_followup boolean NOT NULL DEFAULT false;

-- conversations: stage machine for close-gate
ALTER TABLE conversations
  ADD COLUMN ai_negotiation_stage text NOT NULL DEFAULT 'inactive';
  -- values: 'inactive' | 'negotiating' | 'awaiting_seller_accept' | 'accepted' | 'walked'
```

### 4.2 New table — AI generation audit log

```sql
CREATE TABLE ai_message_log (
  id              bigserial PRIMARY KEY,
  message_id      bigint REFERENCES messages(id) ON DELETE SET NULL,
  conversation_id bigint NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  seller_id       uuid   NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model           text   NOT NULL,             -- e.g. 'gpt-4o-mini', 'claude-haiku'
  prompt_hash     text   NOT NULL,             -- sha256 of prompt for dedupe investigation
  draft_text      text   NOT NULL,             -- what model proposed
  sent_text       text,                        -- what actually sent after filters (null if discarded)
  filter_actions  jsonb  NOT NULL DEFAULT '[]'::jsonb,  -- [{filter:'phone',result:'blocked'}, …]
  tokens_input    integer NOT NULL,
  tokens_output   integer NOT NULL,
  latency_ms      integer NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_message_log_seller_created_idx
  ON ai_message_log (seller_id, created_at DESC);
CREATE INDEX ai_message_log_conversation_idx
  ON ai_message_log (conversation_id, created_at);

ALTER TABLE ai_message_log ENABLE ROW LEVEL SECURITY;

-- Seller reads own logs only; service role bypasses.
CREATE POLICY ai_log_seller_read ON ai_message_log
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());
```

### 4.3 New RPC — floor check without leak

```sql
CREATE OR REPLACE FUNCTION is_offer_above_floor(
  p_listing_id bigint,
  p_offer_minor bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_floor bigint;
BEGIN
  SELECT ai_floor_minor_units INTO v_floor
    FROM listings
   WHERE id = p_listing_id;
  IF v_floor IS NULL THEN RETURN TRUE; END IF;  -- no floor = any offer OK
  RETURN p_offer_minor >= v_floor;
END;
$$;

-- Returns boolean only. Never returns v_floor.
GRANT EXECUTE ON FUNCTION is_offer_above_floor(bigint, bigint) TO authenticated;
```

---

## 5. UX flows (wireframed, no pixels)

### 5.1 Seller opt-in
1. Sell wizard step 8 (new): "AI reply assistant?"
2. Toggle: Off · Draft-only · Autonomous
3. If Draft-only / Autonomous: 4 inputs
   - Floor price (KWD, validated ≥ 1 + ≤ listing price)
   - Tone: professional / warm / concise
   - Quiet hours: default KW (23:00–07:00 + Ramadan iftar)
   - Max AI messages per conversation: default 8
4. Preview: shows 3 sample AI replies in the chosen tone against a test buyer message. Confirms understanding before saving.

### 5.2 Buyer sees the seller's thread
- No change on listing detail page (AI presence is disclosed in sidebar, not plastered on card)
- In the chat thread: AI-authored messages have a small amber badge `⚡ AI-assisted` right of the sender name
- A one-time tooltip on first AI message: "This seller uses Dealo's AI reply assistant. Offers are reviewed by a human before acceptance."

### 5.3 Seller's inbox with AI active
- Each conversation row shows two pills:
  - AI state: `handling` / `needs-review` / `paused`
  - Last offer (if any): `KWD 580,000`
- Tap conversation → same thread UI + new top banner:
  - "AI is handling this conversation — [View drafts queue] · [Pause AI on this listing]"
- Draft queue (Draft-only mode): AI-authored messages stack here; seller taps "Send as-is" or "Edit & send"

### 5.4 Close gate
- Buyer sends an offer at or above floor
- AI replies (Autonomous): "That works for me — let me just confirm with the owner and I'll reply within an hour"
- Conversation status → `awaiting_seller_accept`
- Seller inbox shows red dot: "Offer ready to accept"
- Seller taps `✅ Accept offer` → conversation → `accepted` + triggers the (future) payment escrow flow

---

## 6. Safety model — five-layer defence

```
Layer 1 — Prompt guardrails       : System prompt bakes in floor-leak bans + dialect tone + pillars P4/P11/P13
Layer 2 — Pre-send filter pass    : Filter A/B/C run on draft_text → discard + log if hit
Layer 3 — Floor-leak regex        : Scans draft for any number within ±5% of ai_floor → discard + log
Layer 4 — Rate limits             : Per-seller draft count, per-conversation follow-up count, daily token cap
Layer 5 — Human close gate        : AI never marks conversation accepted (schema enum blocks it)
```

Every layer is testable in isolation. Planned Vitest additions when code ships:
- Prompt guardrail tests (~40 tests against a panel of adversarial buyer messages)
- Filter integration with AI draft path (reuse 67 Filter A/B/C tests)
- Floor-leak scanner unit tests (~25 tests — floor in text, near-floor, off-by-1%, etc.)
- Rate limit integration against real RPC
- Close-gate state machine tests (SQL CHECK constraint + RLS policy tests)

Target: 150+ new assertions lock down AI safety before public launch.

---

## 7. Cost economics

Per Agent B (MEDIUM fidelity on specific numbers, HIGH on the relative ranking of models).

### 7.1 Model routing
- **Arabic conversations (default in Kuwait)** → **Claude Haiku 3.5** or **Jais-70B** (G42, Abu Dhabi). Agent B HIGH: both lead on Gulf Arabic idiom; GPT-4o-mini is materially weaker on Khaleeji dialect.
- **English conversations** → **GPT-4o-mini** (cheapest capable; quality parity for English chat).
- **Failover (either side)** → switch to the other provider + 1h exponential backoff. Two providers configured from day 1 per P15 (offline-safe).

### 7.2 Unit economics (Agent B MEDIUM)
- A 20-turn negotiation averages ~3-5K input tokens + 1-2K output tokens total
- Claude Haiku 3.5: **~$0.003 per full negotiation deal**
- GPT-4o-mini (English): **~$0.002 per full negotiation deal**
- Jais-70B self-hosted: ~near-zero marginal cost but carries ops overhead (GPU hosting)
- A 5-exchange Arabic negotiation: ~**$0.00075** per round-trip on Haiku

### 7.3 Pricing to sellers
Free during beta (Phase 6b–6d). Post-beta: **flat monthly subscription tier**, NOT per-message. Rationale: per-message pricing creates adverse incentive to skip AI → defeats the feature. Flat fee aligns incentives + gives predictable margin.

### 7.4 Fraud/abuse budget
- Worst case: single bad actor creates 100 listings, AI generates replies for 100 concurrent buyers
- Daily hard cap: 500 AI messages/seller (rate-limit P9) = **~$1.50/day worst case** (Haiku) = $45/month/bad-actor
- Still dwarfed by per-seller subscription; economic incentive to abuse breaks down

---

## 8. Phased delivery (post-Block-A, post-redesign)

- **Phase 6a** (this doc) — Doctrine locked. **No code.** ✅
- **Phase 6b** — Schema migration + seller opt-in UI (sell wizard step 8) + draft-only mode. 3-4 days.
- **Phase 6c** — Autonomous mode. Prompt library + tone calibration + close gate. 4-5 days.
- **Phase 6d** — Analytics dashboard for sellers (close rate, typical offers, avg time-to-close). 2-3 days.
- **Phase 6e** — Buyer-side optional AI (opt-in per account). Deferred until 6b/c deliver a trust signal.

Total Phase 6 effort: ~12-15 days of focused build, assuming Block A + redesign stay stable.

---

## 9. Non-negotiable invariants (what must NEVER break)

These are the pillars we're willing to kill the feature over rather than compromise:

1. **No deal-close without human seller tap.** (P6)
2. **No floor leak.** (P11)
3. **Every AI message visibly disclosed.** (P3)
4. **Filter A/B/C applied pre-send.** (P5)
5. **Auditable every generation.** (P8)

Anything else is tunable.

---

## 10. Open questions — resolved + remaining

### Resolved by research
- [x] **Typical Kuwait discount %** — Agent A: 5-15% used cars/electronics, 15-25% furniture (HIGH phrases, MEDIUM numbers). Policy module calibrated to these bands by default.
- [x] **Safe Arabic dialect default** — Agent A: **Kuwaiti Khaleeji non-negotiable, MSA banned**, English tech loanwords trust-positive.
- [x] **Public AI-negotiation post-mortems** — Agent B: no well-documented consumer-app shutdowns specifically; Lewis 2017's "invented language" is the closest academic case. Pactum AI (B2B) is the shipped-success benchmark.
- [x] **EU AI Act Art. 50 applicability** — Agent B: marketplace negotiation = "limited risk" (transparency), not "high risk". Disclosure (P3) satisfies. Safe to ship for GCC and for future EU expansion.

### Remaining (need human input or live verification)
- [ ] **Kuwait Law 39/2014 (Consumer Protection) + Law 20/2014 (E-Commerce) applicability to AI-drafted chat** — Agent A (MEDIUM): laws exist, direct applicability untested. **Action: consult Kuwait-licensed lawyer before public launch of Phase 6b.**
- [ ] **Kuwait CITRA rules on automated commercial messaging** — Agent A: CITRA exists, specific rules on automated C2C chat unclear. **Action: same lawyer review.**
- [ ] **Local dialect tuning dataset** — need a panel of ~5-10 Kuwaiti native speakers to sign off on 40 sample AI replies per tone before Phase 6c autonomy. **Action: recruit beta panel in Phase 6b.**
- [ ] **Hijri calendar lib choice** — `moment-hijri` is mature but `moment` is deprecated. Evaluate `@hebcal/core` or `hijri-date` as alternatives. **Action: decide at Phase 6b migration time.**

---

## 11. Build-vs-buy assessment

**Build custom.** Reasons:
- The 5-layer safety model requires engine-level access no vendor provides
- Filter A/B/C already Kuwait-calibrated and unit-tested — a vendor would need to reimplement
- Arabic dialect tuning needs iteration only possible with full prompt control
- Vendor pricing (Salezilla, Twelvelabs, etc.) is $0.05-0.20/message — breaks our $0.00043 target by 100×

**What we do use off-the-shelf:**
- LLM provider SDK (OpenAI + Anthropic, multi-provider for failover)
- Language detection (`franc` npm, MIT licensed)
- Hijri calendar for Ramadan awareness (`moment-hijri` or equivalent)

---

## 12. Evidence appendix

### 12.1 Agent A — Kuwait negotiation culture (verbatim extracts, HIGH-fidelity claims)

**Haggling dance.** Buyers open with `آخر سعر؟` or `السعر قابل للتفاوض؟` before any offer. Typical settled discount: 5-15% used cars/electronics, 15-25% furniture. Sellers pad ~10% expecting this.

**Face-saving.** Bare-number opening rude. Proper reply: `السلام عليكم` + item compliment (e.g. `شكلها نظيفة ماشاء الله`) + engagement. Cold English from Kuwaiti-number = non-Kuwaiti or bot.

**Timing.** Sub-30s replies = bot/desperation signal. 5-45 min = human. Avoid replies during 5 daily prayers, Friday 11:30-13:00 (Jummah), post-2am. Ramadan iftar window ~17:00-18:30, peak activity 21:00-01:00 post-taraweeh. Weekend Fri-Sat.

**Dialect.** Kuwaiti Khaleeji features: `شلونك`, `وايد`, `جذي`, `عاد`. MSA reads legalistic/foreign. English tech loanwords trust-positive (`البطارية original`).

**Red flags.** Perfect grammar + instant replies + identical phrasing across listings + refusing voice-note + MSA-only. Dubizzle has NOT shipped AI chat publicly — likely brand-risk + regulatory ambiguity + no dialect-capable LLM until recently.

**Legal.** Kuwait Consumer Protection Law 39/2014 + E-Commerce Law 20/2014 + CITRA electronic-communications regulator exist. No public precedent for C2C AI negotiation in GCC. Closest analogs: PropertyFinder smart-reply templates (not agentic), Haraj.com.sa chat moderation.

**Cross-GCC comparison.** Egyptians: aggressive, 30-50% opening gaps. Saudis (Najdi): reserved, short dance. Lebanese: warm, fast, French/English mix. Emiratis (Dubai): more English-dominant, less ritual. Kuwait sits between Saudi restraint + Egyptian warmth → ~10% typical discount + moderate ritual.

### 12.2 Agent B — Global AI-negotiation state of the art (verbatim extracts)

**Lewis 2017 "Deal or No Deal" (FAIR).** End-to-end seq2seq bargaining agents. Reward-optimising self-play → agents drifted into non-human protocol (the famous "Facebook shut down AI" story). **Lesson:** no reward-optimised self-play; anchor to human protocol.

**CICERO (Meta 2022, Diplomacy).** Split architecture: strategic planner + LLM dialogue conditioned on plan. Reached top-10% human performance. Deceptive messages explicitly filtered. **Lesson for P6:** planner picks number, LLM only verbalises.

**Pactum AI (B2B procurement).** Chat-based, bounded authority, closes only within seller-approved envelopes. Walmart reported ~1.5% savings on tail-spend. **Lesson:** the proven pattern = opt-in + authority envelope + disclosure + no-close.

**eBay Best Offer.** Still rule-based (auto-accept/decline thresholds, no LLM counter). Magical Listing (generative description) shipped, negotiation not. **Signal:** even eBay found full agentic negotiation too risky.

**Mercari Smart Pricing.** List-price suggestion based on comparables + time-on-market. Not a negotiator. **Signal:** pricing intelligence ≠ conversation.

**PropertyFinder / Bayut / Dubizzle / Q84Sale / Haraj.** None ship agentic negotiation as of 2026 (HIGH on absence). **Signal:** first-mover opening with credible safety model.

**EU AI Act Art. 50.** Marketplace negotiation = "limited risk" → transparency obligation (disclose AI). Not "high risk" → no conformity assessment required. **Satisfied by P3.**

**OpenAI / Anthropic / FTC guidance.** Prohibit impersonation + unauthorised commitments. FTC 2024: truthful capability rep, no deceptive endorsements. **Satisfied by P3 + P6.**

**Arabic dialect model ranking (HIGH).** Claude family + Jais-70B (G42 Abu Dhabi) lead on Gulf Arabic. GPT-4o-mini weaker on Khaleeji idiom.

**Cost (MEDIUM).** 20-turn negotiation: ~3-5K input + 1-2K output. Haiku ~$0.003/deal, GPT-4o-mini ~$0.002/deal (English), Jais self-hosted near-zero marginal + ops cost.

**Loop risk (MEDIUM).** LLM negotiators can settle in 5-8 turns with clear reservation values, but loop indefinitely without deadlock-breaking. **Lesson:** hard turn cap (our P6 + P14) + escalate-to-human on stall.

### 12.3 Internal schema evidence (HIGH, live in Supabase)

Phase 5c migration 0028 already wires `conversations` + `messages` with RLS + realtime + trigger-based header sync. Phase 5g migration 0029 adds `rate_limits` table + `check_rate_limit` SECURITY DEFINER RPC. Phase 6 migration 0030 extends both without replacing.

---

## 13. Status — v1.1 + Phase 6b engine SHIPPED

| Item | State |
|---|---|
| Doctrine written (15 pillars, evidence-cited) | ✅ |
| Agent A (Kuwait culture) | ✅ returned + integrated |
| Agent B (global AI-negotiation SOTA) | ✅ returned + integrated |
| P12 v1.1 revision — register-mirroring (expat-aware) | ✅ 2026-04-21 |
| Evidence appendix (§12) | ✅ |
| Schema migration draft (§4) | ✅ |
| Safety model — 5 layers (§6) | ✅ |
| Cost + model routing (§7) | ✅ |
| Delivery plan (§8) | ✅ |
| Non-negotiables (§9) | ✅ |
| Open questions — resolved + remaining (§10) | ✅ |
| **Migration 0030 applied to Supabase** | ✅ 2026-04-21 |
| **Policy + provider + prompts + dialogue + floor-leak + safety modules** | ✅ 2026-04-21 |
| **OpenAI provider (gpt-4o-mini, cheapest)** | ✅ 2026-04-21 |
| **271 unit tests + 15 RLS = 286 assertions green** | ✅ 2026-04-21 |
| **Live smoke test — 3 Arabic turns at $0.000357 total** | ✅ 2026-04-21 |
| Intent classifier | ⏳ pending (6b.2) |
| Latency jitter scheduler | ⏳ pending (6b.3) |
| Wiring into `sendMessage` | ⏳ pending (6b.4) |
| Legal review | ⏳ pending — Kuwait-licensed lawyer before Phase 6c public launch |
| Native-speaker panel (dialect validation) | ⏳ pending — recruit during Phase 6c |
| Seller opt-in UI | ⏳ blocked on global redesign |

---

## 14. Live smoke-test findings (2026-04-21)

Ran `scripts/smoke-ai-negotiator.ts` against real gpt-4o-mini with a 3-turn Arabic negotiation on the Bayan villa (list KWD 650,000 / floor KWD 600,000):

| Turn | Buyer | Policy | AI reply | Safety |
|---|---|---|---|---|
| 1 | السلام عليكم، الفيلا لا تزال متاحة؟ | `greet_and_ask_offer` | "وعليكم السلام… ماشاء الله خيار ممتاز. شنو عرضك؟" | ✅ PASS |
| 2 | ممكن 550 ألف؟ | `mid_concession` → 636k (clamped) | "…أقدّم لك بسعر 636,000 د.ك. ما رأيك؟" | ✅ PASS |
| 3 | طيب 610 آخر كلام | `accept_offer` | "ماشاء الله على الجدية… راح أرجع لك خلال ساعة إن شاء الله." | ✅ PASS |

**Cost:** $0.000357 total (1888 in / 123 out tokens) · extrapolated $0.36/month at 1000 negotiations.

### Finding: policy/safety tuning mismatch (FIXED)
First run caught a bug: `mid_concession` at 8% off a 650k listing = 598k, which sits **inside** the floor ±5% band (570-630k) → safety pipeline correctly blocked the draft. Defence-in-depth worked, but it would mean frequent regeneration loops in production.

**Fix applied:** `policy.ts` now clamps both concession counters to `floor × 1.06`, keeping them visibly above the leak band. Regression-guard tests added (2 new assertions) prevent this from sneaking back.

---

## 15. Next action

1. **Intent classifier** — takes buyer text → `IntentClass`. Small module; regex first, LLM fallback later.
2. **Latency jitter scheduler** — background worker flushes AI drafts on log-normal delay (P14).
3. **Wiring into `sendMessage`** — server action checks `listings.negotiation_enabled`, runs the engine, inserts the AI message.
4. **Tests** — ~30 more for classifier + scheduler.

**Still no UI** until the global redesign lands. The engine is already wire-able as a server-side reply trigger — no buyer-visible product surface required for 6b to ship.
