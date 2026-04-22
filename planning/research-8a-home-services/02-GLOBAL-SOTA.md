# Phase 8a — Global SOTA: Home-Services Marketplace Mechanics

**Probed:** 2026-04-22 — Thumbtack (US), TaskRabbit (US/UK, IKEA-owned), Bark.com (UK-origin, global).
**Method:** Public help-center articles, community forums, BBB/Trustpilot/Sitejabber/G2 review aggregates, partner docs (IKEA).
**Note:** Live app probes were not available; all findings are sourced from public documentation and aggregated user reports. See Section 5 for uncertainty flags.

---

## 1. Per-platform summary

### 1.1 Thumbtack — "request-first, pay-per-lead auction"

- **Flow:** Buyer enters a service need + answers a short structured questionnaire. Thumbtack returns a ranked list of matching pros; buyer taps "Contact" on any pro(s). The pro is charged a lead fee the moment the buyer initiates contact — message, call, or booking click [source: https://help.thumbtack.com/article/pay-for-leads] [source: https://help.thumbtack.com/article/how-thumbtack-works/].
- **Quote cap:** "Maximum 5 quotes per request, first-come-first-served" [source: https://www.bookmorebrides.com/7-success-strategies-thumbtack/]. Most buyers hear back "within a day"; pros are measured against a 4-hour response SLA to earn Top Pro [source: https://help.thumbtack.com/article/how-thumbtack-works/].
- **Pricing:** No fixed price per task. Pro sets their own rate in free-text quote. Lead fees $10-$100+, dynamically re-priced weekly by Thumbtack based on supply/demand [source: https://7ten.marketing/how-much-does-thumbtack-charge-for-leads/].
- **Trust tiers:** Background check (Checkr, paid by Thumbtack, 10-17 business days) [source: https://help.thumbtack.com/article/background-checks]. **Top Pro** requires: ≥75% reply-within-4hrs, ≥4.8 rating, ≥5 verified reviews in 12 months, clean background check. Only ~4% qualify [source: https://www.everlance.com/gig-guides/thumbtack-requirements].
- **Chat:** In-app messaging; buyer contact info revealed only after buyer chooses to share it [source: https://help.thumbtack.com/article/messaging-guide].
- **Booking/payment:** Handled **off-platform**. Buyer pays the pro directly — Thumbtack does not escrow or process service payment; monetization is 100% lead-fee on the supply side [source: https://help.thumbtack.com/article/how-thumbtack-works/].
- **Pain points:** "Ghost leads" and "fake leads" dominate complaints. Pros report being charged for unresponsive or non-existent customers; refund policy is opaque. 1000+ BBB complaints on false-lead charges in 2025 [source: https://www.bbb.org/us/ca/san-francisco/profile/internet-service/thumbtack-inc-1116-367066/complaints] [source: https://community.thumbtack.com/discussion/1546/]. Buyers separately report the app is confusing and they miss pro replies [source: https://www.handymanstartup.com/thumbtack-pro-reviews/].

### 1.2 TaskRabbit — "browse-hourly, transactional, IKEA-backed"

- **Flow:** Buyer picks a task category, sees a list of Taskers with hourly rate + rating + profile, picks one, proposes a date/time. Tasker confirms in chat. **Browse-first, not quote-first.** [source: https://www.taskrabbit.com/].
- **Pricing:** Transparent per-hour rate set by each Tasker (observed range $22-$98/hr for cleaning Atlanta Nov 2025) [source: https://clark.com/save-money/taskrabbit-review/]. Client pays a **Trust & Support Fee (~7.5%, bounded 5-15%)** on top; Tasker keeps 100% of their hourly + tips [source: https://support.taskrabbit.com/hc/en-us/articles/46260504648731-].
- **Onboarding:** $25 non-refundable registration fee for Taskers + identity verification + criminal background check (third-party) [source: https://infostride.com/taskrabbit-business-model/].
- **Trust tier:** **Elite Tasker** badge (exact criteria not public but tied to "highest-rated + specific qualifications") [source: https://support.taskrabbit.com/].
- **Chat + booking:** In-app chat opens immediately after booking. Same-day bookings supported for most categories; IKEA assembly is next-day minimum, bookable 90 days out [source: https://www.ikea.com/us/en/customer-service/knowledge/articles/fbc35e47-]. Tasker auto-sends 24hr reminder [source: https://www.taskrabbit.com/ikea].
- **Payments:** Fully on-platform. Card on file, charged after completion. Chat, pay, tip, review all one place [source: https://www.taskrabbit.com/].
- **Cancellation:** If client cancels within 24hr of start, Tasker is paid 1 hour minimum [source: https://support.taskrabbit.com/hc/en-us/articles/35682300983181-].
- **Dispute safety net:** **Happiness Pledge** — up to **$10,000** compensation for damages/injuries, but **only if the task was booked + paid through the platform** [source: https://support.taskrabbit.com/hc/en-us/articles/360035570011-].

### 1.3 Bark.com — "buyer-request, provider-credits, high-volume"

- **Flow:** Buyer posts a request; Bark broadcasts it to matching providers who "buy" access using credits to see full contact details [source: https://help.bark.com/hc/en-us/articles/13346288068892-].
- **Pricing:** Standard credit = $2.35; each lead costs a variable credit bundle based on service/location/urgency [source: https://www.bark.com/en/us/sellers/pricing/]. **Nov 2025 change:** credits now expire 3 months after purchase [source: https://goadstra.co/2025/11/09/bark-lead-generation/].
- **Onboarding:** Minimal — email verification only; widely criticized as "unchecked traders can list" [source: https://www.sitejabber.com/reviews/bark.com].
- **Contact:** Phone + email revealed to provider upon credit spend. No in-app messaging requirement — provider expected to call/text directly.
- **Pain points:** Most severe of the three. Reports of fake leads, invalid phone numbers, 44% buyer response rate (vs 70%+ on competitors), competitors creating fake accounts, refund refusals [source: https://sidehustles.com/bark-com-review/] [source: https://medium.com/@kcelestin375/are-bark-leads-real-what-you-need-to-know-26158f95ff39].

---

## 2. Side-by-side mechanics

| Mechanic | Thumbtack | TaskRabbit | Bark |
|---|---|---|---|
| **Entry** | Buyer posts structured request | Buyer browses Taskers | Buyer posts request |
| **Match count** | Cap 5 pros/request | 1 Tasker per booking | Broadcast to N providers |
| **Pricing** | Free-text quote by pro | Hourly rate set by Tasker | Free-text negotiated off-platform |
| **Price visible before contact?** | No (estimates only) | Yes (hourly) | No |
| **Platform fee model** | Lead fee on pro ($10-$100) | 7.5% service fee on buyer | Credit-per-lead (~$2.35 base) |
| **Buyer card required?** | No | Yes (booking) | No |
| **Onboarding friction** | Background check 10-17d | $25 + ID + background | Email only |
| **Top-tier badge** | Top Pro (4% of pros) | Elite Tasker | None meaningful |
| **In-app chat** | Yes | Yes | Weak — contact info handed off |
| **On-platform payment** | No (pro paid direct) | Yes | No |
| **Dispute safety net** | Lead-refund only (contested) | $10k Happiness Pledge | Credit refund (rare) |
| **Primary surface** | Mobile + web | Mobile-first | Web |

---

## 3. Top 5 patterns worth adopting (Kuwait chat-first)

1. **Cap concurrent quotes (Thumbtack's 5-max).** Prevents the "15 pros all chasing one buyer" race-to-the-bottom that Thumbtack itself fails at in practice. In a chat-only model, 3 chat threads max per buyer request keeps signal high.
2. **Tiered trust badges with measurable gates (Thumbtack Top Pro).** "Reply within X hours" + "≥5 verified reviews" + "ID verified" is language Kuwait buyers already expect from ride-hailing apps. Gate by behavior, not fee.
3. **Response-time SLA as primary ranking signal.** Both platforms rank by it; it directly maps to our chat-first DECISION #2 — the marketplace rewards providers who actually chat.
4. **Happiness-Pledge-style safety net (TaskRabbit).** Even a capped KWD 500 "Dealo Guarantee" on disputed jobs creates massive trust lift at low actuarial cost. Crucially: "only covers jobs coordinated through Dealo chat" — this is our anti-disintermediation lever without forcing payment rails.
5. **Structured request form with smart defaults (Thumbtack).** A buyer answering 4-6 typed questions ("what room / how many bedrooms / one-off or recurring / preferred day") produces 10x better matches than free-text, and is Arabic-RTL-friendly.

---

## 4. Top 3 patterns to explicitly REJECT

1. **Pay-per-lead on providers (Thumbtack + Bark).** Violates trust at scale — the fake-lead/ghost-lead complaint volume is existential. Also incompatible with Kuwait's no-credit-card-default context: providers would need to prepay. REJECT → use subscription tier or free-with-cap.
2. **Card-on-file mandatory for buyers (TaskRabbit).** Kills conversion in a market where most users don't transact online services. Violates DECISION #2 (chat-only). REJECT → keep booking handoff in chat; no escrow v1.
3. **Phone-number handoff as core mechanic (Bark).** Directly causes the "scam calls / no response" failure mode. Also collapses the marketplace because once numbers are exchanged, the platform has zero re-engagement. REJECT → keep chat inside Dealo; reveal phone only after mutual opt-in (or never).

---

## 5. Uncertainty flags

- **Actual SLA "3-5 quotes in 24 hours" screen-by-screen UX** — not directly observable from help docs; inferred from community posts and third-party reviewer writeups. Would need a real buyer account to confirm notification cadence.
- **Exact Elite Tasker gate** — TaskRabbit does not publish numerical thresholds; only "highest-rated + qualifications." Phase 8a should not copy opaque criteria.
- **Top Pro 4% figure** is repeated across third-party sources but not currently stated on Thumbtack's own help pages; treat as directional.
- **Whether Thumbtack buyers actually pay a fee** — sources consistent that pros pay leads and buyers pay pros directly, but Thumbtack has tested buyer-side fees regionally; unconfirmed as of probe date.
- **Bark's 44% buyer-response rate** is from one aggregator sample (n=50), not a platform disclosure — directionally useful, not a benchmark.
- **Dispute resolution inside Thumbtack** beyond lead refunds is undocumented publicly; may involve ad-hoc CS handling that we can't model.
- **Localization/RTL behavior** of any of the three is unprobed; none operate in Kuwait natively.

---

**End of 02-GLOBAL-SOTA.md** — word count ~770.
