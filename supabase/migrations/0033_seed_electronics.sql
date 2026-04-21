-- ============================================================================
-- 0033_seed_electronics.sql — 6 Electronics seed listings (one per sub-cat)
-- ============================================================================
-- Companion to migration 0027 (Properties seeds). Each row demonstrates
-- one or more pillars from planning/PHASE-7A-ELECTRONICS.md so the hub
-- + detail pages have realistic data for visual review:
--
--   1. iPhone 15 Pro Max 256GB         (phones-tablets) — IMEI + battery + region
--   2. MacBook Pro 14 M3 Pro            (laptops-computers) — CPU/RAM/cycles
--   3. Samsung 65" QLED Q80C            (tvs-audio) — screen + resolution
--   4. PlayStation 5 + 2 controllers   (gaming) — console storage + accessories
--   5. Apple Watch Ultra 2 Cellular    (smart-watches) — battery health required
--   6. Sony Alpha 7 IV body            (cameras) — camera body without lens
--
-- Reuses the founder's existing seller profile (id from `profiles`).
-- Author the seed via UPDATE-or-INSERT pattern keyed on `slug` so the
-- migration is idempotent.
--
-- Reference: planning/PHASE-7A-ELECTRONICS.md §3 (28 fields × 5 domains)
-- Depends on: 0001 (categories), 0026 (verification_tier), 0033 has no
--             new schema — only data.
-- ============================================================================

DO $$
DECLARE
  v_seller uuid;
  v_city_capital bigint;
  v_city_hawalli bigint;
  v_area_salmiya bigint;
  v_area_sharq bigint;
BEGIN
  -- Pick the first seller profile (founder).
  SELECT id INTO v_seller FROM profiles ORDER BY created_at LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE NOTICE '0033_seed_electronics: no profile found, skipping seed';
    RETURN;
  END IF;

  SELECT id INTO v_city_capital FROM cities WHERE country_code='KW' AND name_en='Capital';
  SELECT id INTO v_city_hawalli FROM cities WHERE country_code='KW' AND name_en='Hawalli';
  SELECT id INTO v_area_salmiya FROM areas WHERE slug='salmiya';
  SELECT id INTO v_area_sharq   FROM areas WHERE slug='sharq';

  -- ── 1. iPhone 15 Pro Max 256GB ──────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en,
    condition, brand, model,
    price_mode, price_minor_units, currency_code, min_offer_minor_units,
    country_code, city_id, area_id,
    delivery_options, status,
    verification_tier, verified_at, verified_by,
    is_featured, is_hot,
    category_fields, published_at, expires_at
  )
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='phones-tablets'),
    'iphone-15-pro-max-256gb-natural-titanium',
    'iPhone 15 Pro Max 256GB Natural Titanium — Kuwait spec, 96% battery',
    'آيفون 15 برو ماكس 256GB لون تيتانيوم طبيعي — كويتي، بطارية 96%',
    'iPhone 15 Pro Max 256GB Natural Titanium — Kuwait spec, 96% battery',
    'البائع: مستخدم مرّة واحدة، حالة ممتازة، فاتورة Apple Avenues مرفقة. كل القطع أصلية. مفتوح على جميع الشبكات. الكرتون الأصلي + الشاحن + الكيبل + الحاوية.',
    'البائع: مستخدم مرّة واحدة، حالة ممتازة، فاتورة Apple Avenues مرفقة. كل القطع أصلية. مفتوح على جميع الشبكات.',
    'Lightly used, mint condition. Apple Avenues purchase receipt included. All original parts. Unlocked. Original box + charger + cable + case.',
    'like_new', 'Apple', 'iPhone 15 Pro Max',
    'best_offer', 380000, 'KWD', 360000,
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup','seller_delivers']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    true, false,
    jsonb_build_object(
      'device_kind','phone',
      'brand','Apple',
      'model','iPhone 15 Pro Max',
      'year_of_release', 2023,
      'serial_or_imei_last_4','7Q4F',
      'storage_gb', 256,
      'ram_gb', 8,
      'connectivity', jsonb_build_array('wifi6','5g','bluetooth'),
      'condition_grade','excellent',
      'battery_health_pct', 96,
      'repair_history', jsonb_build_array('none'),
      'original_parts', true,
      'box_status','open_box',
      'accessories_included', jsonb_build_array('charger','cable','case','original_packaging'),
      'purchase_country','kw',
      'warranty_status','active_kuwait',
      'warranty_expires_at', '2026-09-22',
      'has_original_receipt', true,
      'region_spec','gcc',
      'carrier_lock','unlocked',
      'accepts_trade', true,
      'trade_for_models','iPhone 16 Pro Max + cash difference'
    ),
    NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- ── 2. MacBook Pro 14 M3 Pro ────────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en,
    condition, brand, model,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, area_id,
    delivery_options, status,
    verification_tier, verified_at, verified_by,
    category_fields, published_at, expires_at
  )
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='laptops-computers'),
    'macbook-pro-14-m3-pro-18gb-512gb',
    'MacBook Pro 14" M3 Pro 18GB / 512GB — 87 cycles, AppleCare+',
    'ماك بوك برو 14 إنش M3 برو 18GB / 512GB — 87 دورة، AppleCare+',
    'MacBook Pro 14" M3 Pro 18GB / 512GB — 87 cycles, AppleCare+',
    'استعمال خفيف جداً، 87 دورة بطارية فقط (يقدر يطلع تقرير من macOS). AppleCare+ ساري لـ 2026. كرتون أصلي + شاحن MagSafe.',
    'استعمال خفيف جداً، 87 دورة بطارية فقط. AppleCare+ ساري لـ 2026.',
    'Lightly used, 87 battery cycles only (verifiable in macOS System Information). AppleCare+ active until 2026. Original box + MagSafe charger.',
    'excellent_used', 'Apple', 'MacBook Pro 14 M3 Pro',
    'negotiable', 720000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'device_kind','laptop',
      'brand','Apple',
      'model','MacBook Pro 14 M3 Pro',
      'year_of_release', 2023,
      'serial_or_imei_last_4','M3P9',
      'storage_gb', 512,
      'ram_gb', 18,
      'cpu','Apple M3 Pro 11-core',
      'gpu','Apple M3 Pro 14-core GPU',
      'storage_type','ssd',
      'screen_size_inches', 14.2,
      'connectivity', jsonb_build_array('wifi6','bluetooth','thunderbolt','usb_c'),
      'condition_grade','excellent',
      'battery_health_pct', 95,
      'battery_cycles', 87,
      'repair_history', jsonb_build_array('none'),
      'original_parts', true,
      'box_status','open_box',
      'accessories_included', jsonb_build_array('charger','cable','original_packaging'),
      'purchase_country','kw',
      'warranty_status','active_kuwait',
      'warranty_expires_at', '2026-11-15',
      'has_original_receipt', true,
      'accepts_trade', false
    ),
    NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- ── 3. Samsung 65" QLED Q80C ────────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en,
    condition, brand, model,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, area_id,
    delivery_options, status,
    verification_tier, verified_at, verified_by,
    category_fields, published_at, expires_at
  )
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='tvs-audio'),
    'samsung-65-qled-q80c-4k',
    'Samsung 65" QLED Q80C 4K — Kuwait warranty, like new',
    'سامسونج 65 إنش QLED Q80C 4K — ضمان كويتي، شبه جديد',
    'Samsung 65" QLED Q80C 4K — Kuwait warranty, like new',
    'تلفزيون من معرض Eureka في الكويت. ضمان ساري حتى 2026. مع الريموت + الكيبل. السبب: نقل بيت.',
    'تلفزيون من معرض Eureka في الكويت. ضمان ساري حتى 2026.',
    'Bought from Eureka Kuwait. Warranty active until 2026. Includes remote + cable. Reason: moving home.',
    'like_new', 'Samsung', 'QLED Q80C 65"',
    'negotiable', 220000, 'KWD',
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'device_kind','tv',
      'brand','Samsung',
      'model','QLED Q80C 65"',
      'year_of_release', 2023,
      'screen_size_inches', 65,
      'resolution','4k',
      'connectivity', jsonb_build_array('wifi','bluetooth','ethernet'),
      'condition_grade','excellent',
      'repair_history', jsonb_build_array('none'),
      'box_status','no_box',
      'accessories_included', jsonb_build_array('cable'),
      'purchase_country','kw',
      'warranty_status','active_kuwait',
      'warranty_expires_at', '2026-08-10',
      'has_original_receipt', true,
      'accepts_trade', false
    ),
    NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- ── 4. PlayStation 5 + 2 controllers ────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en,
    condition, brand, model,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, area_id,
    delivery_options, status,
    category_fields, published_at, expires_at
  )
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='gaming'),
    'playstation-5-disc-2-controllers',
    'PlayStation 5 Disc edition + 2 DualSense controllers',
    'بلاي ستيشن 5 (نسخة الدسك) + 2 يد دوال سينس',
    'PlayStation 5 Disc edition + 2 DualSense controllers',
    'استعمال خفيف، نظيف. مع يدّين أصليّتين، يد منهم لون midnight black. كل الكوابل الأصلية موجودة. شراء من X-cite الكويت.',
    'استعمال خفيف، نظيف. مع يدّين أصليّتين. شراء من X-cite الكويت.',
    'Lightly used, clean condition. 2 original controllers (one midnight black). All original cables. Purchased from X-cite Kuwait.',
    'good_used', 'Sony', 'PlayStation 5 Disc',
    'fixed', 175000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup','seller_delivers']::delivery_option[], 'live',
    jsonb_build_object(
      'device_kind','console',
      'brand','Sony',
      'model','PlayStation 5 Disc',
      'year_of_release', 2022,
      'storage_gb', 825,
      'connectivity', jsonb_build_array('wifi','bluetooth','ethernet','usb_c'),
      'condition_grade','good',
      'repair_history', jsonb_build_array('none'),
      'box_status','no_box',
      'accessories_included', jsonb_build_array('cable'),
      'purchase_country','kw',
      'warranty_status','expired',
      'has_original_receipt', false,
      'accepts_trade', true,
      'trade_for_models','PS5 Pro + cash'
    ),
    NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- ── 5. Apple Watch Ultra 2 Cellular ─────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en,
    condition, brand, model,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, area_id,
    delivery_options, status,
    verification_tier, verified_at, verified_by,
    category_fields, published_at, expires_at
  )
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='smart-watches'),
    'apple-watch-ultra-2-cellular-49mm',
    'Apple Watch Ultra 2 Cellular 49mm — Kuwait, 99% battery',
    'آبل ووتش ألترا 2 سيلولر 49mm — كويتي، بطارية 99%',
    'Apple Watch Ultra 2 Cellular 49mm — Kuwait, 99% battery',
    'مستخدم 3 شهور فقط. eSIM مفعّل على Zain. الحزام الترايتيوم الأصلي + كرتون كامل.',
    'مستخدم 3 شهور فقط. eSIM مفعّل على Zain.',
    '3 months light use. eSIM activated on Zain. Original Trail Loop band + full box.',
    'like_new', 'Apple', 'Watch Ultra 2',
    'negotiable', 240000, 'KWD',
    'KW', v_city_hawalli, v_area_salmiya,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'device_kind','smart_watch',
      'brand','Apple',
      'model','Watch Ultra 2',
      'year_of_release', 2023,
      'serial_or_imei_last_4','U2K8',
      'connectivity', jsonb_build_array('bluetooth','lte','wifi'),
      'condition_grade','mint',
      'battery_health_pct', 99,
      'repair_history', jsonb_build_array('none'),
      'original_parts', true,
      'box_status','open_box',
      'accessories_included', jsonb_build_array('charger','cable','original_packaging'),
      'purchase_country','kw',
      'warranty_status','active_kuwait',
      'warranty_expires_at', '2025-12-01',
      'has_original_receipt', true,
      'accepts_trade', false
    ),
    NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- ── 6. Sony Alpha 7 IV body ─────────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en,
    condition, brand, model,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, area_id,
    delivery_options, status,
    verification_tier, verified_at, verified_by,
    category_fields, published_at, expires_at
  )
  VALUES (
    v_seller,
    (SELECT id FROM categories WHERE slug='cameras'),
    'sony-alpha-7-iv-body-15k-shutter',
    'Sony Alpha 7 IV body — 15 000 shutter, mint',
    'سوني ألفا 7 IV (بدن فقط) — 15 ألف لقطة، ممتاز',
    'Sony Alpha 7 IV body — 15 000 shutter, mint',
    'بدن الكاميرا فقط (بدون عدسة). شراء من Sony Avenues. 15 ألف لقطة فقط (تقدر تتأكد من EXIF). الكرتون الأصلي + الشاحن + البطارية.',
    'بدن الكاميرا فقط (بدون عدسة). 15 ألف لقطة فقط.',
    'Body only (no lens). Purchased from Sony Avenues. 15 000 shutter actuations (verifiable in EXIF). Original box + charger + battery.',
    'excellent_used', 'Sony', 'Alpha 7 IV',
    'negotiable', 580000, 'KWD',
    'KW', v_city_capital, v_area_sharq,
    ARRAY['pickup']::delivery_option[], 'live',
    'ai_verified', NOW(), 'ai',
    jsonb_build_object(
      'device_kind','camera',
      'brand','Sony',
      'model','Alpha 7 IV',
      'year_of_release', 2022,
      'serial_or_imei_last_4','A74S',
      'connectivity', jsonb_build_array('wifi','bluetooth','usb_c'),
      'condition_grade','excellent',
      'repair_history', jsonb_build_array('none'),
      'original_parts', true,
      'box_status','open_box',
      'accessories_included', jsonb_build_array('charger','cable','original_packaging'),
      'purchase_country','kw',
      'warranty_status','expired',
      'has_original_receipt', true,
      'accepts_trade', false
    ),
    NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days'
  )
  ON CONFLICT (slug) DO NOTHING;

  RAISE NOTICE '0033_seed_electronics: completed';
END $$;
