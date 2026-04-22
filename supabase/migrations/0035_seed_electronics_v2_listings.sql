-- ============================================================================
-- 0035_seed_electronics_v2_listings.sql — 8 Electronics v2 seed listings
-- ============================================================================
-- Fresh seed for the v2 rebuild. Each listing demonstrates one or more
-- doctrine pillars (PHASE-7A-ELECTRONICS-V2.md §P1-P9):
--
--   1. iPhone 15 Pro Max 256GB — Apple Store · premium · 96% battery
--      (P1 catalog + P3 orthogonal grade+battery + P5 provenance +
--       P6 warranty)
--   2. iPhone 14 Pro 128GB     — X-cite · excellent · 89% battery +
--      BADAL for iPhone 16 Pro Max (P8 trade moat visible on card)
--   3. MacBook Pro 14 M3 Pro   — Jarir · premium · 100% battery +
--      AppleCare+ (P6 warranty tier demo with end date)
--   4. iPhone 12 128GB         — IMPORTED · fair · 71% (red band) +
--      screen replaced aftermarket (P3 red battery + P4 repair
--      disclosure + P5 imported warning)
--   5. Samsung 65" QLED Q80C   — Eureka · excellent · Kuwait warranty
--      (TV sub-cat — no battery, P5 retailer demo)
--   6. PlayStation 5 Disc      — Sharaf DG · good · BADAL for PS5 Pro
--      (non-phone badal — proves P8 works across sub-cats)
--   7. Apple Watch Ultra 2     — Yousifi · premium · 99% battery
--      (smart-watches sub-cat — battery required)
--   8. Sony Alpha 7 IV body    — IMPORTED · excellent · no battery
--      (cameras sub-cat — imported-warranty warning demo)
--
-- All listings land with country_code='KW' because `countries.is_active`
-- is true only for Kuwait right now (RLS `public_read_live_listings`
-- filters via `active_country_codes()`). The GCC-wide story is told
-- through the `purchase_source` enum (13 retailers + imported + other).
--
-- Idempotent via ON CONFLICT (slug). Safe to re-run.
--
-- Depends on: 0033 (v2 tables + IMEI registry), 0034 (device catalog)
-- Reference: planning/PHASE-7A-ELECTRONICS-V2.md
-- ============================================================================

DO $$
DECLARE
  v_seller uuid;
  v_city_hawalli bigint;
  v_city_capital bigint;
  v_area_salmiya bigint;
  v_area_sharq bigint;
  v_listing_id bigint;
BEGIN
  SELECT id INTO v_seller FROM profiles ORDER BY created_at LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE NOTICE '0035_seed_electronics_v2_listings: no profile, skip';
    RETURN;
  END IF;

  SELECT id INTO v_city_hawalli FROM cities WHERE country_code='KW' AND name_en='Hawalli';
  SELECT id INTO v_city_capital FROM cities WHERE country_code='KW' AND name_en='Capital';
  SELECT id INTO v_area_salmiya FROM areas WHERE slug='salmiya';
  SELECT id INTO v_area_sharq   FROM areas WHERE slug='sharq';

  -- Helper pattern: INSERT listing; capture id; insert imei_registry
  -- hash using the same SHA-256 digest the publish gate will use.

  -- ── 1. iPhone 15 Pro Max 256GB — flagship clean ───────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, verification_tier, verified_at, verified_by, is_featured, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='phones-tablets'),
    'iphone-15-pro-max-256gb-natural-titanium-v2',
    'iPhone 15 Pro Max 256GB Natural Titanium — Apple Store, 96% battery',
    'آيفون 15 برو ماكس 256GB تيتانيوم طبيعي — Apple Store، بطارية 96%',
    'iPhone 15 Pro Max 256GB Natural Titanium — Apple Store, 96% battery',
    'Bought from Apple Store Avenues. Lightly used, mint condition. All original parts. Original box + charger + cable + case. AppleCare+ active until September 2026.',
    'من Apple Store الأفنيوز. استعمال خفيف. كل القطع أصلية. الكرتون الأصلي + الشاحن + الكيبل + الكفر. AppleCare+ ساري حتى سبتمبر 2026.',
    'Bought from Apple Store Avenues. Lightly used, mint condition. All original parts. Original box + charger + cable + case. AppleCare+ active until September 2026.',
    'like_new', 'Apple', 'iPhone 15 Pro Max',
    'negotiable', 380000, 'KWD',
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup','seller_delivers']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    true,
    jsonb_build_object(
      'model_slug','iphone-15-pro-max-256gb','brand','Apple','model','iPhone 15 Pro Max',
      'device_kind','phone','storage_gb',256,
      'serial_or_imei_last_4','7Q4F',
      'cosmetic_grade','premium','battery_health_pct',96,
      'repair_screen','original','repair_battery','original','repair_back_glass','original','repair_camera','original',
      'purchase_source','apple_store','has_original_receipt',true,
      'warranty_active',true,'warranty_end_date','2026-09-22',
      'accessories_included',jsonb_build_array('original_box','charger','cable','case','receipt'),
      'accepts_trade',false
    ),
    NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'
  ) RETURNING id INTO v_listing_id;
  INSERT INTO electronics_imei_registry (imei_hash, listing_id, seller_id)
  VALUES (encode(digest('357984563217Q4F','sha256'),'hex'), v_listing_id, v_seller)
  ON CONFLICT DO NOTHING;

  -- ── 2. iPhone 14 Pro 128GB — Badal demo ──────────────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, verification_tier, verified_at, verified_by, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='phones-tablets'),
    'iphone-14-pro-128gb-badal',
    'iPhone 14 Pro 128GB — trade for iPhone 16 Pro Max + cash',
    'آيفون 14 برو 128GB — بدل آيفون 16 برو ماكس + فرق نقدي',
    'iPhone 14 Pro 128GB — trade for iPhone 16 Pro Max + cash',
    'Well-kept, light scratches only. Open to a trade for iPhone 16 Pro Max with cash difference. Bought from X-cite Kuwait.',
    'بحالة ممتازة، خدوش خفيفة جداً. أقبل البدل بآيفون 16 برو ماكس مع فرق نقدي. من X-cite الكويت.',
    'Well-kept, light scratches only. Open to a trade for iPhone 16 Pro Max with cash difference. Bought from X-cite Kuwait.',
    'excellent_used', 'Apple', 'iPhone 14 Pro',
    'negotiable', 230000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'brand','Apple','model','iPhone 14 Pro',
      'device_kind','phone','storage_gb',128,
      'serial_or_imei_last_4','B2K7',
      'cosmetic_grade','excellent','battery_health_pct',89,
      'repair_screen','original','repair_battery','original','repair_back_glass','original','repair_camera','original',
      'purchase_source','xcite','has_original_receipt',true,
      'warranty_active',false,
      'accessories_included',jsonb_build_array('original_box','charger','cable'),
      'accepts_trade',true,'trade_for_models','iPhone 16 Pro Max + cash'
    ),
    NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days'
  ) RETURNING id INTO v_listing_id;
  INSERT INTO electronics_imei_registry (imei_hash, listing_id, seller_id)
  VALUES (encode(digest('352678491845B2K7','sha256'),'hex'), v_listing_id, v_seller)
  ON CONFLICT DO NOTHING;

  -- ── 3. MacBook Pro 14 M3 Pro — AppleCare+ demo ───────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, verification_tier, verified_at, verified_by, is_featured, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='laptops-computers'),
    'macbook-pro-14-m3-pro-18gb-512gb-applecare',
    'MacBook Pro 14" M3 Pro 18GB/512GB — AppleCare+ active, 100% battery',
    'ماك بوك برو 14 إنش M3 برو 18GB/512GB — AppleCare+ ساري، بطارية 100%',
    'MacBook Pro 14" M3 Pro 18GB/512GB — AppleCare+ active, 100% battery',
    'Purchased from Jarir KSA, AppleCare+ registered. Less than 30 battery cycles. All original parts, original box + MagSafe charger. Reason: upgrading to M4 Pro.',
    'من مكتبة جرير السعودية، AppleCare+ مسجّل. أقل من 30 دورة شحن. كل القطع أصلية، الكرتون الأصلي + شاحن MagSafe. السبب: ترقية لـ M4 Pro.',
    'Purchased from Jarir KSA, AppleCare+ registered. Less than 30 battery cycles. All original parts, original box + MagSafe charger. Reason: upgrading to M4 Pro.',
    'like_new', 'Apple', 'MacBook Pro 14 M3 Pro',
    'negotiable', 720000, 'KWD',
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    true,
    jsonb_build_object(
      'model_slug','macbook-pro-14-m3-pro-512gb','brand','Apple','model','MacBook Pro 14 M3 Pro',
      'device_kind','laptop','storage_gb',512,'ram_gb',18,'screen_size_inches',14.2,
      'serial_or_imei_last_4','M3P9',
      'cosmetic_grade','premium','battery_health_pct',100,
      'repair_screen','original','repair_battery','original','repair_camera','original',
      'purchase_source','jarir','has_original_receipt',true,
      'warranty_active',true,'warranty_end_date','2026-11-15',
      'accessories_included',jsonb_build_array('original_box','charger','receipt'),
      'accepts_trade',false
    ),
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'
  ) RETURNING id INTO v_listing_id;
  INSERT INTO electronics_imei_registry (imei_hash, listing_id, seller_id)
  VALUES (encode(digest('MACBOOK14M3P9','sha256'),'hex'), v_listing_id, v_seller)
  ON CONFLICT DO NOTHING;

  -- ── 4. iPhone 12 128GB — imported + screen replaced + red battery ─
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='phones-tablets'),
    'iphone-12-128gb-imported-screen-replaced',
    'iPhone 12 128GB — imported, screen replaced, 71% battery',
    'آيفون 12 128GB — مستورد، شاشة مستبدلة، بطارية 71%',
    'iPhone 12 128GB — imported, screen replaced, 71% battery',
    'Honest listing: bought abroad, no local GCC warranty. Screen was replaced (aftermarket, not Apple OEM). Battery at 71% — needs replacement soon. Works perfectly otherwise. Priced accordingly.',
    'إفصاح صادق: شراء من خارج الخليج، بدون ضمان محلي. الشاشة مستبدلة (خارجية، مش Apple أصلية). البطارية 71% — تحتاج استبدال قريباً. يعمل ممتاز بخلاف ذلك. السعر يعكس الحالة.',
    'Honest listing: bought abroad, no local GCC warranty. Screen was replaced (aftermarket, not Apple OEM). Battery at 71% — needs replacement soon. Works perfectly otherwise. Priced accordingly.',
    'good_used', 'Apple', 'iPhone 12',
    'negotiable', 105000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup']::delivery_option[], 'live',
    jsonb_build_object(
      'model_slug','iphone-12-128gb','brand','Apple','model','iPhone 12',
      'device_kind','phone','storage_gb',128,
      'serial_or_imei_last_4','I12X',
      'cosmetic_grade','fair','battery_health_pct',71,
      'repair_screen','replaced','repair_battery','original','repair_back_glass','original','repair_camera','original',
      'purchase_source','imported','has_original_receipt',false,
      'warranty_active',false,
      'accessories_included',jsonb_build_array('charger','cable'),
      'accepts_trade',false
    ),
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days'
  ) RETURNING id INTO v_listing_id;
  INSERT INTO electronics_imei_registry (imei_hash, listing_id, seller_id)
  VALUES (encode(digest('IPHONE12I12X','sha256'),'hex'), v_listing_id, v_seller)
  ON CONFLICT DO NOTHING;

  -- ── 5. Samsung 65" QLED — Eureka purchase ─────────────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, verification_tier, verified_at, verified_by, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='tvs-audio'),
    'samsung-65-qled-q80c-4k-eureka',
    'Samsung 65" QLED Q80C 4K — Eureka, Kuwait warranty active',
    'سامسونج 65 إنش QLED Q80C 4K — Eureka، ضمان كويتي ساري',
    'Samsung 65" QLED Q80C 4K — Eureka, Kuwait warranty active',
    'From Eureka Kuwait. Eureka Shield warranty active until August 2026. With remote + original cable. Reason: moving abroad.',
    'من معرض Eureka الكويت. ضمان Eureka Shield ساري حتى أغسطس 2026. مع الريموت + الكيبل الأصلي. السبب: انتقال خارج البلد.',
    'From Eureka Kuwait. Eureka Shield warranty active until August 2026. With remote + original cable. Reason: moving abroad.',
    'like_new', 'Samsung', 'QLED Q80C 65"',
    'negotiable', 220000, 'KWD',
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'model_slug','samsung-qled-q80c-65','brand','Samsung','model','QLED Q80C 65"',
      'device_kind','tv','screen_size_inches',65,'resolution','4k',
      'cosmetic_grade','excellent',
      'purchase_source','eureka','has_original_receipt',true,
      'warranty_active',true,'warranty_end_date','2026-08-10',
      'accessories_included',jsonb_build_array('cable','receipt'),
      'accepts_trade',false
    ),
    NOW() - INTERVAL '6 days', NOW() + INTERVAL '24 days'
  );

  -- ── 6. PS5 Disc — Sharaf DG + Badal for PS5 Pro ──────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='gaming'),
    'playstation-5-disc-sharafdg-badal',
    'PlayStation 5 Disc + 2 controllers — trade for PS5 Pro',
    'بلاي ستيشن 5 Disc + يدّين — بدل PS5 Pro',
    'PlayStation 5 Disc + 2 controllers — trade for PS5 Pro',
    'Bought from Sharaf DG UAE. Lightly used, 2 original DualSense controllers. All cables included. Open to swap for PS5 Pro with cash difference.',
    'من Sharaf DG الإمارات. استعمال خفيف، يدّين DualSense أصليّتين. كل الكوابل مرفقة. مستعد للبدل بـ PS5 Pro مع فرق نقدي.',
    'Bought from Sharaf DG UAE. Lightly used, 2 original DualSense controllers. All cables included. Open to swap for PS5 Pro with cash difference.',
    'good_used', 'Sony', 'PlayStation 5 Disc',
    'fixed', 175000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup','seller_delivers']::delivery_option[], 'live',
    jsonb_build_object(
      'model_slug','playstation-5-disc','brand','Sony','model','PlayStation 5 Disc',
      'device_kind','console','storage_gb',825,
      'serial_or_imei_last_4','PS5D',
      'cosmetic_grade','good',
      'purchase_source','sharaf_dg','has_original_receipt',false,
      'warranty_active',false,
      'accessories_included',jsonb_build_array('cable'),
      'accepts_trade',true,'trade_for_models','PlayStation 5 Pro + cash'
    ),
    NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days'
  );

  -- ── 7. Apple Watch Ultra 2 — Yousifi ──────────────────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, verification_tier, verified_at, verified_by, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='smart-watches'),
    'apple-watch-ultra-2-49mm-yousifi',
    'Apple Watch Ultra 2 49mm Cellular — Yousifi, 99% battery',
    'آبل ووتش ألترا 2 49mm سيلولر — اليوسفي، بطارية 99%',
    'Apple Watch Ultra 2 49mm Cellular — Yousifi, 99% battery',
    '3 months light use. Bought from Best Al-Yousifi Kuwait. All original parts, original Trail Loop band, full box + charger.',
    'استعمال 3 شهور فقط. من بست اليوسفي الكويت. كل القطع أصلية، حزام Trail Loop الأصلي، الكرتون كامل + الشاحن.',
    '3 months light use. Bought from Best Al-Yousifi Kuwait. All original parts, original Trail Loop band, full box + charger.',
    'like_new', 'Apple', 'Watch Ultra 2',
    'negotiable', 240000, 'KWD',
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'model_slug','apple-watch-ultra-2-49mm','brand','Apple','model','Watch Ultra 2',
      'device_kind','smart_watch',
      'serial_or_imei_last_4','U2K8',
      'cosmetic_grade','premium','battery_health_pct',99,
      'repair_screen','original','repair_battery','original','repair_back_glass','original',
      'purchase_source','yousifi','has_original_receipt',true,
      'warranty_active',true,'warranty_end_date','2026-07-01',
      'accessories_included',jsonb_build_array('original_box','charger','cable'),
      'accepts_trade',false
    ),
    NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days'
  ) RETURNING id INTO v_listing_id;
  INSERT INTO electronics_imei_registry (imei_hash, listing_id, seller_id)
  VALUES (encode(digest('WATCHULTRA2U2K8','sha256'),'hex'), v_listing_id, v_seller)
  ON CONFLICT DO NOTHING;

  -- ── 8. Sony Alpha 7 IV body — imported from Japan ─────────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en, description, description_ar, description_en, condition, brand, model, price_mode, price_minor_units, currency_code, country_code, city_id, area_id, delivery_options, status, verification_tier, verified_at, verified_by, category_fields, published_at, expires_at)
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='cameras'),
    'sony-alpha-7-iv-body-imported-japan',
    'Sony Alpha 7 IV body — imported from Japan, 15k shutter',
    'سوني ألفا 7 IV (بدن) — مستورد من اليابان، 15 ألف لقطة',
    'Sony Alpha 7 IV body — imported from Japan, 15k shutter',
    'Body only, imported from Japan. No local GCC warranty. Shutter count 15,000 (verifiable via EXIF). Original box + charger + battery. Excellent condition cosmetically.',
    'البدن فقط، مستورد من اليابان. بدون ضمان خليجي محلي. عدد الشتر 15 ألف (يُتحقق منه عبر EXIF). الكرتون الأصلي + الشاحن + البطارية. حالة ممتازة مظهرياً.',
    'Body only, imported from Japan. No local GCC warranty. Shutter count 15,000 (verifiable via EXIF). Original box + charger + battery. Excellent condition cosmetically.',
    'excellent_used', 'Sony', 'Alpha 7 IV',
    'negotiable', 580000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'model_slug','sony-alpha-7-iv-body','brand','Sony','model','Alpha 7 IV',
      'device_kind','camera',
      'serial_or_imei_last_4','A74S',
      'cosmetic_grade','excellent',
      'repair_screen','original','repair_battery','original','repair_camera','original',
      'purchase_source','imported','has_original_receipt',true,
      'warranty_active',false,
      'accessories_included',jsonb_build_array('original_box','charger'),
      'accepts_trade',false
    ),
    NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days'
  ) RETURNING id INTO v_listing_id;
  INSERT INTO electronics_imei_registry (imei_hash, listing_id, seller_id)
  VALUES (encode(digest('SONYA7IVA74S','sha256'),'hex'), v_listing_id, v_seller)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '0035_seed_electronics_v2_listings: 8 listings seeded';
END $$;
