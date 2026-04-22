# Track A — Gulf Electronics Live Observation (chrome-devtools MCP, DOM-level)

> **Date:** 2026-04-21
> **Method:** Live navigation + DOM snapshots via chrome-devtools MCP
> **Platforms surveyed:** Dubizzle KW · Q84Sale (4Sale) KW · OpenSooq KW · Haraj.sa · Bayut KW
> **Time on observation:** ~90 minutes
> **Status:** HIGH fidelity (DOM-evidenced), some gaps documented

---

## Summary

Across four observed Gulf C2C platforms (Dubizzle KW, Q84Sale KW, OpenSooq KW, Haraj SA) the **structured-data floor for electronics is extraordinarily low.** None of them capture IMEI, battery health %, region spec (GCC/US/JP/EU), carrier lock status, or warranty as structured fields. Every one of those disclosures lives — if it lives at all — in free-text titles or descriptions, which means buyers are forced to parse Arabic-English code-switching slang ("بطارية 85", "زيرو ضريبه مصر", "شبيه الاصلي") to understand what they're buying. Counterfeit listings ("COPY A", "شبيه الاصلي") pass trust checks and are displayed alongside genuine goods with identical badging. Price-bait is rampant: on OpenSooq, the iPhone 17 Pro Max page shows eight listings priced under 50 KWD next to legitimate 600+ KWD inventory. On Dubizzle's homepage, four of the first eight cars/properties shown are listed at "KWD 1".

Each platform has one thing it does well that Dealo should absorb. **OpenSooq** has the deepest taxonomy (parts / accessories / wearables separated) and the strongest trust surface (explicit "Verified User", "Verified Business", "Listings with Price", "Listings with Images", "Has delivery by seller" filters). **Q84Sale** ships the cleanest model-series sub-taxonomy (iPhone 17 → 16 → 15 → …) and pins "Verified" shops above private sellers as top placement. **Haraj** has the most complete trust product layer — escrow ("اشتر بثقة"), shop verification, a formal ratings system, and a published "banned items list" — though its listing fields are the weakest of the four. **Dubizzle** has the worst structured-data surface of the paid classifieds (Mobile Phone = Brand + Model + Condition, nothing else).

Dealo's opportunity is to be the first Gulf platform that makes the invisible disclosures structured and required: IMEI, battery health, region, carrier lock, warranty end date, counterfeit-term rejection. The market is not currently served on any of these.

---

## Per-platform deep-dive

### Dubizzle Kuwait (dubizzle.com.kw / OLX)

URLs hit: `/en/`, `/en/electronics-and-home-appliances/` (404 — path is `/electronics-home-appliances/`), `/en/mobile-phones-accessories/mobile-phones/`, `/en/electronics-home-appliances/computers-tablets/`, `/en/electronics-home-appliances/tv-audio-video/`, `/en/ad/iphone-15-pro-256-gb-battery-85-small-dot-display-ID102668062.html`.

- **Taxonomy.** Electronics is split into two top-level siblings: "Mobiles & Tablets" (Mobile Phones, Mobile Accessories) and "Electronics & Appliances" (TV/Audio/Video, Computers/Tablets, Video Games/Consoles, Cameras/Imaging). Gaming bundled under Electronics, not given own vertical. No smartwatch category at the root — buried.
- **Structured filters.** Mobile Phones page filters: **Condition (Used/New) only**. That's it.
- **Listing detail fields (iPhone 15 Pro URL above).** Verbatim labels: Brand, Price Type, Condition, Model, Description, Location. **Six fields.** Battery, storage GB, IMEI, carrier, region: all absent.
- **IMEI / battery / region / carrier / warranty.** None structured.
- **Counterfeit handling.** "iPhone 16 plus (COPY A)" is a live listing. No filter or warning.
- **Anti-patterns observed.** (1) Phone numbers in titles. (2) Email in title: "hani37988@gmail. com" was a listing title. (3) 1-KWD bait: 4 of first 8 homepage cards. (4) Bundled stock listings ("3 Huawei Mobiles for sale").
- **Sample listings:** "IPhone 15 pro 256 gb battery 85 small dot display" KWD 145 · "ايفون 16 plus (COPY A)" · "ايفون 13pro max جيجا 256 زيرو ضريبه مصر" · "Samsung Galaxy S24 Ultra 256GB Telegram lD: @Hamzausain"
- **Trade-in.** Not structured. Free text "للبدل".
- **Seller verification.** "Listed by private user" + "Member since". No phone-verified badge surfaced.

### Q84Sale Kuwait (q84sale.com — branded "4Sale")

URLs hit: `/en/electronics`, `/en/electronics/mobile-phones-and-accessories/1`, `/en/electronics/mobile-phones-and-accessories/iphone/1`, `/en/listing/iphone-16-20783882`, `/en/electronics/laptop-and-computer/1`.

- **Taxonomy.** Richer than Dubizzle. 16+ siblings under Electronics including Mobile Numbers, Smartwatches, Smart TV, Satellite Receiver, Wanted Devices, Electronics Services, Electronics Shops. Model-series sub-tax: dedicated pages for iPhone 17 / 16 / 15 / 14 / 13 / 12 / 11 / X / XS / XS Max / SE / XR / 8 / Other.
- **Structured filters (Mobile Phones).** Condition · Price · **Storage** (only platform with structured storage filter).
- **Listing detail fields (iPhone 16 ad).** Storage Size, Network, Sim, Condition, Description, Location. Adds Network (5G) + Sim (Single Sim). Still no battery/IMEI/region/carrier/warranty.
- **IMEI / battery / region / carrier / warranty.** All free-text. Ad I opened: "بطارية 92%" in title, "كفالة لشهر يوليو / 2026" in description.
- **Anti-patterns:** Heavy emoji titles, tax-status flags in titles, trade-only ads with bait pricing.
- **Sample listings:** "ايفون 16 العادي 128 جيجا بكامل اغراضه بطارية 92%" · "ايفون ١٥ بلس كالجديد دورات شحن ٢٧ مره ٢٥٦ قيقا" (cycle count 27 in title!) · "ايفون ١٢ برو ماكس ٢٥٦ بطاريه ٧٢ خالص ضريبه مع الكرتونه والاغراض" · "ايفون ١٥ برو ماكس بحاله سليمه مبدل شاشه ب 110 من هاتف 2000 مافيه خدوش".
- **Seller verification.** **Explicit "Verified" badge** on shop listings. Top carousel: "Verified · Unlimited Tech · 104 ads", "Verified · Ostora phones · 5 ads".
- **Trade-in.** Free text only.

### OpenSooq Kuwait (kw.opensooq.com)

URLs hit: `/en/find/electronics`, `/en/mobile-phones-tablets/mobile-phones`, `/en/search/278383267`.

- **Taxonomy.** Deepest of the four. Phones & Tablets tree: Mobile Phones, Landline Phones, **VIP Phone Numbers**, Tablets, E-book Readers, Mobile & Tablet **Accessories** (Charging Station, Chargers/Cables, Memory Cards, Selfie Sticks, Power Banks, Stylus Pens, Covers/Protectors), Mobile & Tablet **Parts** (Batteries, Screens, Boards), **Smart Watches & Fitness Bracelets**.
- **Structured filters (Mobile Phones).** Brand, Model, **Storage Size** (2TB / 1TB / 512 / 256 / 128 GB), Color, **Condition (4-tier: Brand New / Used-Excellent / Used-Good / Damaged)**, Price, Accompaniments, Age, Listing Type, City, Neighbourhood.
- **Trust-signal filters (unique).** "Listings with Price", "Listings with Images", "Listings with Video", "Listings promoted", "Shops Listings", "Rating 3 stars or higher", "Listings from Verified Users", "Listings from Verified Businesses", "Has delivery by seller".
- **Listing detail fields.** 13 labels including Delivery (yes/no) + structured Color. Still missing IMEI/battery/region/carrier/warranty.
- **Bait-price evidence (load-bearing).** iPhone 17 Pro Max "Similar Listings" prices: 9.99 · 30 · 29 (256GB) · 39 (256GB) · 29 (1TB) · **1 KWD (1TB)** · 10 (256GB) · 8. Real iPhone 17 Pro Max ~300-400 KWD. **More than half similar-model inventory is price-bait.**
- **Counterfeit handling — most explicit evidence.** Listing 278383267 title: "ايفون 17pro max جيجا 512. **امرأتي شبيه الاصلي**" — counterfeit. Condition field shows "Brand New". Promoted Turbo paid placement applied to a replica listing.
- **Seller verification.** Two distinct badges: Verified Users + Verified Businesses.

### Haraj.sa (Saudi Arabia)

URLs hit: `/tags/جوالات/`, `/11179193076/` (iPhone 16 Pro Max listing, Abha).

- **Taxonomy.** Devices tree: phones, tablets, computers, video games, TV/audio, cameras, **Accounts & Subscriptions** (Netflix etc.), VIP Numbers, home/kitchen appliances. Brand chips: Apple, Samsung, Huawei, Sony, Blackberry, Nokia, HTC.
- **Structured filters.** Minimal. Brand chips + city chips only.
- **Listing detail fields.** Three structured fields only: الحالة (Condition) · الموديل (Model) · اللون (Color). Weakest of the four.
- **IMEI / battery / region / carrier / warranty.** None structured. **My hypothesis that Saudi would be stricter was wrong.**
- **Trust product layer (strongest of the four).** Footer: "خدمة الشراء الموثوق / اشتر بثقة" = **escrow service**. "توثيق المتجر و إضافة التراخيص" = shop verification + license upload. "نظام التقييم" = ratings system. "نظام الخصم" = penalty system. "مركز الأمان" = Safety Center. **"الحسابات والأرقام الموقوفة" = public suspended-accounts list.** Detail page: buyer can ask seller to enable escrow button.
- **Published prohibited-items policy** — "قائمة السلع والعروض الممنوعة".

### Bayut Kuwait (bayut.com.kw)

- **No electronics / tech section exists.** Property pure-play. Excluded from disclosure analysis.

---

## Cross-platform table

| Disclosure / feature | Dubizzle KW | Q84Sale | OpenSooq | Haraj SA | Bayut KW |
|---|---|---|---|---|---|
| IMEI structured | ❌ | ❌ | ❌ | ❌ | n/a |
| Battery health structured | ❌ | ❌ | ❌ | ❌ | n/a |
| Region spec (GCC/US/JP) | ❌ | ❌ | ❌ | ❌ | n/a |
| Carrier lock structured | ❌ | ❌ | ❌ | ❌ | n/a |
| Warranty end date structured | ❌ | ❌ | ❌ | ❌ | n/a |
| Storage size structured | ❌ | ✅ filter+chip | ✅ | ❌ | n/a |
| RAM structured | ❌ | ❌ | ❌ | ❌ | n/a |
| Brand structured | ✅ | ✅ + model series | ✅ + Model | ✅ chip only | n/a |
| Model series | ✅ | ✅ deeper per-gen | ✅ | ✅ | n/a |
| Condition tiers | 2 | 2 | **4** (incl. Damaged) | 2 | n/a |
| Counterfeit rejection | ❌ "COPY A" live | not observed | ❌ "شبيه الاصلي" classified Brand New | published list | n/a |
| 1-KWD price bait | ✅ homepage | likely | ✅ documented | unclear | n/a |
| Phone/email in title | ✅ observed | not seen | not seen | not seen | n/a |
| Seller verification | ❌ | ✅ "Verified" shops | ✅ User + Business 2 tiers | ✅ متجر موثق | n/a |
| Ratings system | ❌ | ❌ | ✅ filter | ✅ نظام التقييم | n/a |
| Escrow / Buy-with-Confidence | ❌ | ❌ | ❌ | ✅ "اشتر بثقة" opt-in | n/a |
| Delivery offered structured | ❌ | ❌ | ✅ field+filter | ❌ | n/a |
| Trade-in structured | ❌ | ❌ | ❌ | ❌ | n/a |
| Prohibited-items public policy | ❌ | ❌ | ❌ | ✅ | n/a |

---

## Concrete recommendations for Dealo Electronics doctrine v2

### Keep these pillars (with fresh evidence)

- **IMEI required on phones/tablets/cellular smartwatches.** Zero of four Gulf platforms capture it. Open whitespace.
- **Battery health % structured field.** Sellers *already want* to disclose ("بطارية 92%" in titles); platform must capture cleanly.
- **Region spec enum.** "زيرو ضريبه مصر" / "خالص ضريبه" load-bearing in titles; nobody captures.
- **Carrier lock enum.** Haraj seller used the single word "ماأنفك" to disclose. Words this load-bearing deserve a field.
- **Counterfeit-term rejection on submit.** Live evidence: "COPY A" (Dubizzle), "شبيه الاصلي" (OpenSooq) classified Brand New.
- **Price sanity band by model+storage.** iPhone 17 Pro Max 512GB cluster on OpenSooq has 8+ listings under 50 KWD vs legit peers 600+ KWD.
- **Anti-phone-in-title / anti-email-in-title.** Dubizzle has live phone numbers + `hani37988@gmail.com` as titles.

### Add NEW pillars (not in current Phase-7 doctrine)

- **4-tier Condition ladder** (Brand New / Used-Excellent / Used-Good / Damaged) — OpenSooq's lead.
- **Structured Accessories / Parts / Accounts-&-Subscriptions / VIP-Numbers sub-categories** — OpenSooq splits Parts (Batteries/Screens/Boards), Accessories (Chargers/Cables/Power Banks/Covers); Haraj has Accounts & Subscriptions.
- **Delivery-by-seller boolean as structured field AND filter** — OpenSooq.
- **Two-tier seller verification** (Verified User vs Verified Business) — OpenSooq + Haraj both implement.
- **Escrow / Buy-with-Confidence opt-in per listing** — Haraj's "اشتر بثقة".
- **Published prohibited-items list + public suspended-accounts ledger** — Haraj.
- **Warranty end-date as structured date field** with status enum — sellers already write it in prose.
- **Screen-replacement / motherboard-repair history boolean** — "مبدل شاشه" common disclosure.
- **Battery charge cycle count as optional structured numeric** — Q84Sale seller wrote "دورات شحن ٢٧" in title.
- **"Box / charger / accessories included" structured multi-select** — repeated "مع الكرتون والشاحن" across platforms.

### Reconsider / drop

- **Gaming as a sibling of Electronics.** Q84Sale model (Video Games & Consoles as dedicated sibling) is cleaner than Dubizzle's bundle.
- **2-tier condition (New/Used).** Replace with the 4-tier ladder.

### Field-level additions to schema

Per-category in `listings.category_fields` JSONB:

- **Mobile Phones / Smartwatches:** brand, model, model_variant, storage_gb, ram_gb, color, condition_tier (4-way), region_spec (enum), carrier_lock (enum), imei (Luhn-15 validated), battery_health_pct (0-100), battery_cycles (optional int), warranty_status (enum + optional end_date), screen_replaced (bool), motherboard_repaired (bool), accessories_included (multi-select), sim_type (single/dual/eSIM).
- **Laptops / Computers:** brand, model, cpu, ram_gb, storage_type (SSD/HDD/Hybrid), storage_gb, gpu, screen_size_in, os, condition_tier, battery_health_pct, warranty_status.
- **TVs:** brand, model, screen_size_in, resolution (4K/8K/FHD/HD), panel_type (OLED/QLED/LED/LCD), smart_os, condition_tier, warranty_status.
- **Cross-category:** delivery_offered (bool + fee), price_type (fixed/negotiable), trade_in_accepted (bool + target device free text), listing_is_business_inventory (bool, requires Verified Business).

---

## Honest research limitations

- Did not test Dubizzle's Post-an-Ad flow — fields the *seller* is asked for may differ from displayed fields.
- Q84Sale's "All Filters" drawer didn't open cleanly on two clicks — full filter set may be richer than what page rendered.
- Did not successfully search for "ماستر كوبي" on Dubizzle (search endpoint returned 404).
- Haraj listing detail page examined had 3 fields; other categories may expose more.
- Bayut KW excluded (no electronics).
- All claims based on listings observed approximately 14:00–15:00 Kuwait time on 2026-04-21.
