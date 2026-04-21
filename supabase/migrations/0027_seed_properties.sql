-- ============================================================================
-- 0027_seed_properties.sql — 10 curated property listings (Phase 4a seed)
-- ============================================================================
-- Each listing demonstrates one or more pillars of the Dealo Properties
-- Doctrine (see planning/PHASE-4A-AUDIT.md §1). Not a random sample —
-- every row is chosen to showcase a schema capability the competition
-- doesn't have.
--
-- Distribution across 4 seeded sub-cats (rest are empty taxonomy rows):
--   property-for-rent:  4 listings (#1 chalet, #3 apartment, #6 townhouse, #9 penthouse)
--   property-for-sale:  4 listings (#2 chalet, #4 apartment off-plan, #5 villa, #10 townhouse)
--   rooms-for-rent:     1 listing  (#7 — differentiator)
--   land:               1 listing  (#8)
--
-- Verification tier distribution:
--   dealo_inspected: 2 (#5 villa, #10 townhouse) — flagship tier
--   ai_verified:     6 (the rest that pass Zod)
--   unverified:      2 (#7 room, #8 land — cold-seeded demo of unverified UX)
--
-- All image URLs verified 200-OK via curl before this migration was
-- committed (discipline from migration 0024 hero-URL fix).
--
-- Idempotent: checks for an existing "Bnaider-Chalet-A1" row (brand
-- field); skips entire block if found.
--
-- Reference: planning/PHASE-4A-AUDIT.md §9 (seed table)
-- Depends on: 0025 (taxonomy), 0026 (verification_tier + bilingual columns)
-- ============================================================================

DO $$
DECLARE
  v_seller         UUID;
  v_existing       INT;
  -- Sub-cat IDs
  v_sub_rent       BIGINT;
  v_sub_sale       BIGINT;
  v_sub_rooms      BIGINT;
  v_sub_land       BIGINT;
  -- City IDs
  v_city_capital   BIGINT;  -- Kuwait City, Sharq, Shuwaikh
  v_city_hawalli   BIGINT;  -- Salmiya, Mishref, Bayan, Hawally
  v_city_ahmadi    BIGINT;  -- Bnaider, Sabah Al-Ahmad Sea City
  v_city_mubarak   BIGINT;  -- Mubarak Al-Kabeer
  -- Returning listing IDs
  v_id1 BIGINT; v_id2 BIGINT; v_id3 BIGINT; v_id4 BIGINT; v_id5 BIGINT;
  v_id6 BIGINT; v_id7 BIGINT; v_id8 BIGINT; v_id9 BIGINT; v_id10 BIGINT;
BEGIN
  -- ── Lookups ─────────────────────────────────────────────────────────────
  SELECT id INTO v_seller FROM profiles LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'no profiles row — property seed requires a seller';
  END IF;

  SELECT id INTO v_sub_rent  FROM categories WHERE slug = 'property-for-rent';
  SELECT id INTO v_sub_sale  FROM categories WHERE slug = 'property-for-sale';
  SELECT id INTO v_sub_rooms FROM categories WHERE slug = 'rooms-for-rent';
  SELECT id INTO v_sub_land  FROM categories WHERE slug = 'land';
  IF v_sub_rent IS NULL OR v_sub_sale IS NULL OR v_sub_rooms IS NULL OR v_sub_land IS NULL THEN
    RAISE EXCEPTION 'real-estate sub-cats missing — run 0025 first';
  END IF;

  SELECT id INTO v_city_capital FROM cities WHERE country_code='KW' AND slug='capital';
  SELECT id INTO v_city_hawalli FROM cities WHERE country_code='KW' AND slug='hawalli';
  SELECT id INTO v_city_ahmadi  FROM cities WHERE country_code='KW' AND slug='ahmadi';
  SELECT id INTO v_city_mubarak FROM cities WHERE country_code='KW' AND slug='mubarak-kabeer';

  -- ── Idempotency ─────────────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_existing
  FROM listings
  WHERE brand = 'Bnaider-Chalet-A1' AND category_id = v_sub_rent;
  IF v_existing > 0 THEN
    RAISE NOTICE 'property seed already applied — skipping';
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- #1 — Chalet rent DAILY (Bnaider) — P4 doctrine (bookable chalet)
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by
  ) VALUES (
    v_seller, v_sub_rent,
    'شاليه بنيدر A1 — 4 غرف، إطلالة بحرية، حجز يومي',
    'شاليه بنيدر A1 — 4 غرف، إطلالة بحرية، حجز يومي',
    'Bnaider Chalet A1 — 4BR, Sea View, Daily Booking',
    'شاليه راقي على شاطئ بنيدر، 4 غرف ماستر، ديوانية خارجية، مسبح خاص، متاح للحجز اليومي مع ذروة عطلة نهاية الأسبوع. Daily chalet in Bnaider with 4 master bedrooms, external diwaniya, private pool, weekend premium pricing.',
    'شاليه راقي على شاطئ بنيدر، 4 غرف ماستر، ديوانية خارجية، مسبح خاص، متاح للحجز اليومي مع ذروة عطلة نهاية الأسبوع.',
    'Daily chalet in Bnaider with 4 master bedrooms, external diwaniya, private pool, weekend premium pricing.',
    'Bnaider-Chalet-A1', 'Sea-Front-Chalet', 'White-Coral', 'excellent_used',
    'negotiable', 150000, 'KWD',
    'KW', v_city_ahmadi, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '90 days', 'clean',
    'bnaider-chalet-a1-placeholder',
    jsonb_build_object(
      'property_type', 'chalet',
      'area_sqm', 320,
      'plot_area_sqm', 500,
      'bedrooms', 4,
      'bathrooms', 3,
      'year_built', 2019,
      'furnished_status', 'fully_furnished',
      'condition', 'excellent',
      'rent_period', 'daily',
      'deposit_minor_units', 200000,
      'parking_spaces', 3,
      'orientation', 'west',
      'view_type', 'sea',
      'amenities', jsonb_build_array(
        'central_ac','swimming_pool_private','beachfront','sea_view',
        'garden','gated_community','24h_security','cctv',
        'kids_play_area','covered_parking','water_tank','backup_generator'
      ),
      'diwaniya', jsonb_build_object(
        'present', true,
        'separate_entrance', true,
        'has_bathroom', true,
        'has_kitchenette', true
      ),
      'availability', jsonb_build_object(
        'min_stay_nights', 2,
        'max_stay_nights', 14,
        'check_in_time', '15:00',
        'check_out_time', '12:00',
        'cleaning_fee_kwd', 25,
        'weekend_premium_pct', 40,
        'seasonal_multipliers', jsonb_build_object(
          'summer', 1.5, 'winter', 0.9, 'eid', 2.5
        )
      ),
      'is_deed_verified', false
    ),
    'ai_verified', NOW(), 'ai'
  ) RETURNING id INTO v_id1;
  UPDATE listings SET slug = 'bnaider-chalet-a1-' || v_id1 WHERE id = v_id1;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id1, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Bnaider chalet exterior'),
    (v_id1, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'living_room', 'Chalet living area'),
    (v_id1, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'bedroom', 'Master bedroom'),
    (v_id1, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'kitchen', 'Kitchen'),
    (v_id1, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'view', 'Sea view from terrace'),
    (v_id1, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'diwaniya_room', 'External diwaniya');

  -- ══════════════════════════════════════════════════════════════════════
  -- #2 — Chalet SALE (Sabah Al-Ahmad Sea City) — P8 ownership banner demo
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by, is_featured
  ) VALUES (
    v_seller, v_sub_sale,
    'شاليه صباح الأحمد — 5 غرف، واجهة بحرية مباشرة',
    'شاليه صباح الأحمد — 5 غرف، واجهة بحرية مباشرة',
    'Sabah Al-Ahmad Sea City Chalet — 5BR Direct Waterfront',
    'شاليه فاخر في مدينة صباح الأحمد البحرية، إطلالة مباشرة على القناة، 5 غرف نوم، ديوانية كبيرة، رصيف خاص للقارب. Premium waterfront chalet in Sabah Al-Ahmad Sea City, direct canal view, private boat dock.',
    'شاليه فاخر في مدينة صباح الأحمد البحرية، إطلالة مباشرة على القناة، 5 غرف نوم، ديوانية كبيرة، رصيف خاص للقارب.',
    'Premium waterfront chalet in Sabah Al-Ahmad Sea City, direct canal view, private boat dock.',
    'SAA-Canal-Chalet', 'Waterfront-Villa', 'Sandstone', 'like_new',
    'negotiable', 185000000, 'KWD',
    'KW', v_city_ahmadi, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '90 days', 'clean',
    'sabah-al-ahmad-chalet-placeholder',
    jsonb_build_object(
      'property_type', 'chalet',
      'area_sqm', 480,
      'plot_area_sqm', 600,
      'bedrooms', 5,
      'bathrooms', 4,
      'year_built', 2022,
      'furnished_status', 'fully_furnished',
      'condition', 'excellent',
      'completion_status', 'ready',
      'tenure', 'freehold',
      'zoning_type', 'chalet',
      'parking_spaces', 4,
      'orientation', 'south',
      'view_type', 'sea',
      'amenities', jsonb_build_array(
        'swimming_pool_private','beachfront','sea_view','central_ac',
        'garden','gated_community','24h_security','cctv',
        'maid_room','covered_parking','private_entrance','water_tank'
      ),
      'diwaniya', jsonb_build_object(
        'present', true,
        'separate_entrance', true,
        'has_bathroom', true,
        'has_kitchenette', false
      ),
      'building_name', 'Sabah Al-Ahmad Sea City',
      'plot_block', jsonb_build_object('area','Sabah Al-Ahmad','block','12','plot','A-47'),
      'is_deed_verified', true
    ),
    'ai_verified', NOW(), 'ai', true
  ) RETURNING id INTO v_id2;
  UPDATE listings SET slug = 'sabah-al-ahmad-chalet-' || v_id2 WHERE id = v_id2;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id2, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Waterfront chalet exterior'),
    (v_id2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'view', 'Direct canal waterfront view'),
    (v_id2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'living_room', 'Grand living room'),
    (v_id2, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'bedroom', 'Master suite'),
    (v_id2, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'view', 'Private boat dock'),
    (v_id2, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'diwaniya_room', 'Main diwaniya');

  -- ══════════════════════════════════════════════════════════════════════
  -- #3 — Apartment RENT yearly (Salmiya) — P11 furnished + P12 cheques
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by
  ) VALUES (
    v_seller, v_sub_rent,
    'شقة في السالمية — غرفتين، إطلالة بحرية، 4 شيكات',
    'شقة في السالمية — غرفتين، إطلالة بحرية، 4 شيكات',
    'Salmiya 2BR Sea-View Apartment, 4 Cheques',
    'شقة غرفتين نوم مع إطلالة بحرية في قلب السالمية، تأثيث نصفي، مرآب مغطى، إيجار سنوي بـ 4 شيكات مقدمة. 2-bedroom sea-view apartment in central Salmiya, semi-furnished, covered parking, 4-cheque yearly lease.',
    'شقة غرفتين نوم مع إطلالة بحرية في قلب السالمية، تأثيث نصفي، مرآب مغطى، إيجار سنوي بـ 4 شيكات مقدمة.',
    '2-bedroom sea-view apartment in central Salmiya, semi-furnished, covered parking, 4-cheque yearly lease.',
    'Salmiya-Sea-Tower', 'Apartment-8B', 'Beige', 'excellent_used',
    'fixed', 450000, 'KWD',
    'KW', v_city_hawalli, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '60 days', 'clean',
    'salmiya-sea-view-apartment-placeholder',
    jsonb_build_object(
      'property_type', 'apartment',
      'area_sqm', 110,
      'bedrooms', 2,
      'bathrooms', 2,
      'floor_number', 8,
      'total_floors', 15,
      'year_built', 2018,
      'furnished_status', 'semi_furnished',
      'rent_period', 'yearly',
      'cheques_count', 4,
      'deposit_minor_units', 450000,
      'service_charge_kwd', 150,
      'commission_payer', 'tenant',
      'parking_spaces', 1,
      'orientation', 'north',
      'view_type', 'sea',
      'amenities', jsonb_build_array(
        'central_ac','elevator','covered_parking','sea_view',
        'balcony','24h_security','cctv','gym','swimming_pool_shared',
        'water_tank','backup_generator'
      ),
      'building_name', 'Salmiya Sea Tower',
      'is_deed_verified', false
    ),
    'ai_verified', NOW(), 'ai'
  ) RETURNING id INTO v_id3;
  UPDATE listings SET slug = 'salmiya-sea-apartment-' || v_id3 WHERE id = v_id3;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id3, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Salmiya Sea Tower exterior'),
    (v_id3, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'living_room', 'Living room with sea view'),
    (v_id3, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'kitchen', 'Semi-furnished kitchen'),
    (v_id3, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'bedroom', 'Master bedroom'),
    (v_id3, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'view', 'Salmiya Gulf view');

  -- ══════════════════════════════════════════════════════════════════════
  -- #4 — Apartment SALE OFF-PLAN (Kuwait City) — P13 completion + payment_plan
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by
  ) VALUES (
    v_seller, v_sub_sale,
    'شقة على الخارطة — مدينة الكويت، تسليم 2027 الربع الثاني',
    'شقة على الخارطة — مدينة الكويت، تسليم 2027 الربع الثاني',
    'Off-Plan Apartment — Kuwait City, Handover 2027-Q2',
    'شقة استثمارية على الخارطة في مجمع الحمراء التجاري، تسليم الربع الثاني 2027. خطة سداد مرنة: 20% مقدم، 30% تسليم، 50% بعد التسليم على 36 شهر. Off-plan investment apartment in the Al Hamra complex, Q2-2027 handover. 20/30/50 payment plan.',
    'شقة استثمارية على الخارطة في مجمع الحمراء التجاري، تسليم الربع الثاني 2027. خطة سداد مرنة: 20% مقدم، 30% تسليم، 50% بعد التسليم على 36 شهر.',
    'Off-plan investment apartment in the Al Hamra complex, Q2-2027 handover. 20/30/50 payment plan.',
    'Al-Hamra-Residences', 'Unit-12-F', 'TBD', 'new',
    'fixed', 95000000, 'KWD',
    'KW', v_city_capital, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '90 days', 'clean',
    'al-hamra-off-plan-apartment-placeholder',
    jsonb_build_object(
      'property_type', 'apartment',
      'area_sqm', 95,
      'bedrooms', 2,
      'bathrooms', 2,
      'floor_number', 12,
      'total_floors', 40,
      'year_built', 2027,
      'furnished_status', 'unfurnished',
      'completion_status', 'off_plan',
      'handover_expected_quarter', '2027-Q2',
      'tenure', 'freehold',
      'zoning_type', 'investment',
      'parking_spaces', 1,
      'orientation', 'east',
      'view_type', 'city',
      'amenities', jsonb_build_array(
        'central_ac','elevator','covered_parking','24h_security',
        'cctv','gym','swimming_pool_shared','backup_generator',
        'water_tank','gated_community'
      ),
      'payment_plan', jsonb_build_object(
        'down_payment_pct', 20,
        'handover_pct', 30,
        'post_handover_months', 36,
        'post_handover_pct', 50
      ),
      'building_name', 'Al Hamra Residences',
      'developer_name', 'Al Hamra Real Estate',
      'is_deed_verified', false
    ),
    'ai_verified', NOW(), 'ai'
  ) RETURNING id INTO v_id4;
  UPDATE listings SET slug = 'al-hamra-off-plan-' || v_id4 WHERE id = v_id4;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id4, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Al Hamra Residences tower render'),
    (v_id4, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'floor_plan', 'Unit 12-F floor plan'),
    (v_id4, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'living_room', '3D render — living area'),
    (v_id4, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'view', 'Projected city view');

  -- ══════════════════════════════════════════════════════════════════════
  -- #5 — Villa SALE (Bayan) — P14 diwaniya + P8 ownership banner + dealo_inspected
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by, is_featured
  ) VALUES (
    v_seller, v_sub_sale,
    'فيلا في بيان — 6 غرف، ديوانية مستقلة، ضمان ديلو',
    'فيلا في بيان — 6 غرف، ديوانية مستقلة، ضمان ديلو',
    'Bayan Villa — 6BR, Independent Diwaniya, Dealo Inspected',
    'فيلا عائلية في بيان، 6 غرف نوم، 5 حمامات، ديوانية مستقلة بمدخل خاص وحمام ومطبخ صغير، حديقة كبيرة، حوض سباحة خاص. حالة ممتازة، مفحوصة من فريق ديلو. Inspected family villa in Bayan — 6 bedrooms, independent diwaniya (separate entrance + bathroom + kitchenette), large garden, private pool.',
    'فيلا عائلية في بيان، 6 غرف نوم، 5 حمامات، ديوانية مستقلة بمدخل خاص وحمام ومطبخ صغير، حديقة كبيرة، حوض سباحة خاص. حالة ممتازة، مفحوصة من فريق ديلو.',
    'Inspected family villa in Bayan — 6 bedrooms, independent diwaniya (separate entrance + bathroom + kitchenette), large garden, private pool.',
    'Bayan-Villa-Block-3', 'Family-Villa-6BR', 'Sandstone', 'excellent_used',
    'negotiable', 650000000, 'KWD',
    'KW', v_city_hawalli, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '90 days', 'clean',
    'bayan-villa-placeholder',
    jsonb_build_object(
      'property_type', 'villa',
      'area_sqm', 550,
      'plot_area_sqm', 700,
      'bedrooms', 6,
      'bathrooms', 5,
      'year_built', 2015,
      'furnished_status', 'unfurnished',
      'condition', 'excellent',
      'completion_status', 'ready',
      'tenure', 'freehold',
      'zoning_type', 'residential-private',
      'parking_spaces', 4,
      'orientation', 'corner',
      'view_type', 'garden',
      'amenities', jsonb_build_array(
        'central_ac','swimming_pool_private','garden','maid_room',
        'driver_room','storage_room','covered_parking','24h_security',
        'cctv','backup_generator','water_tank','gated_community',
        'private_entrance','roof_access'
      ),
      'diwaniya', jsonb_build_object(
        'present', true,
        'separate_entrance', true,
        'has_bathroom', true,
        'has_kitchenette', true
      ),
      'plot_block', jsonb_build_object('area','Bayan','block','3','plot','127'),
      'paci_number', '95842316',
      'is_deed_verified', true
    ),
    'dealo_inspected', NOW(), 'inspection', true
  ) RETURNING id INTO v_id5;
  UPDATE listings SET slug = 'bayan-villa-' || v_id5 WHERE id = v_id5;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id5, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Bayan villa front exterior'),
    (v_id5, 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'living_room', 'Main living hall'),
    (v_id5, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'bedroom', 'Master bedroom'),
    (v_id5, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'kitchen', 'Full family kitchen'),
    (v_id5, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'bathroom', 'En-suite bathroom'),
    (v_id5, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'diwaniya_room', 'Independent diwaniya'),
    (v_id5, 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 6, 'view', 'Private garden + pool');

  -- ══════════════════════════════════════════════════════════════════════
  -- #6 — Townhouse RENT yearly (Mishref) — P3 clean listing demo
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by
  ) VALUES (
    v_seller, v_sub_rent,
    'تاون هاوس في مشرف — 4 غرف، مفروشة بالكامل، 12 شيك',
    'تاون هاوس في مشرف — 4 غرف، مفروشة بالكامل، 12 شيك',
    'Mishref Townhouse — 4BR Fully Furnished, 12 Cheques',
    'تاون هاوس عائلي في مشرف، 4 غرف نوم، مفروش بالكامل، حديقة خاصة صغيرة، عائلة هادئة مرحب بها. Quiet family-friendly townhouse in Mishref, fully furnished, private garden, professional building residents welcome.',
    'تاون هاوس عائلي في مشرف، 4 غرف نوم، مفروش بالكامل، حديقة خاصة صغيرة، عائلة هادئة مرحب بها.',
    'Quiet family-friendly townhouse in Mishref, fully furnished, private garden, professional building residents welcome.',
    'Mishref-Townhouse', 'Family-TH-4BR', 'White', 'excellent_used',
    'fixed', 1200000, 'KWD',
    'KW', v_city_hawalli, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '60 days', 'clean',
    'mishref-townhouse-placeholder',
    jsonb_build_object(
      'property_type', 'townhouse',
      'area_sqm', 280,
      'plot_area_sqm', 320,
      'bedrooms', 4,
      'bathrooms', 4,
      'year_built', 2016,
      'furnished_status', 'fully_furnished',
      'rent_period', 'yearly',
      'cheques_count', 12,
      'deposit_minor_units', 1200000,
      'commission_payer', 'tenant',
      'parking_spaces', 2,
      'view_type', 'garden',
      'amenities', jsonb_build_array(
        'central_ac','garden','covered_parking','balcony',
        '24h_security','gated_community','storage_room','water_tank',
        'backup_generator','roof_access'
      ),
      'diwaniya', jsonb_build_object(
        'present', true,
        'separate_entrance', false,
        'has_bathroom', false,
        'has_kitchenette', false
      ),
      'is_deed_verified', false
    ),
    'ai_verified', NOW(), 'ai'
  ) RETURNING id INTO v_id6;
  UPDATE listings SET slug = 'mishref-townhouse-' || v_id6 WHERE id = v_id6;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id6, 'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Mishref townhouse exterior'),
    (v_id6, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'living_room', 'Living room'),
    (v_id6, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'bedroom', 'Bedroom'),
    (v_id6, 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'view', 'Small private garden'),
    (v_id6, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'kitchen', 'Fully furnished kitchen');

  -- ══════════════════════════════════════════════════════════════════════
  -- #7 — Room for rent (Hawally) — P5 differentiator + unverified demo
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier
  ) VALUES (
    v_seller, v_sub_rooms,
    'غرفة مفروشة في حولي — حمام مشترك، قريب من الخط الأول',
    'غرفة مفروشة في حولي — حمام مشترك، قريب من الخط الأول',
    'Furnished Room in Hawally — Shared Bathroom, Near Main Road',
    'غرفة مفروشة للإيجار في شقة مشتركة وسط حولي، حمام مشترك، إنترنت شامل، قريبة من محطة الخط الأول. Furnished room in a shared flat in central Hawally, shared bathroom, wifi included, near public transport.',
    'غرفة مفروشة للإيجار في شقة مشتركة وسط حولي، حمام مشترك، إنترنت شامل، قريبة من محطة الخط الأول.',
    'Furnished room in a shared flat in central Hawally, shared bathroom, wifi included, near public transport.',
    'Hawally-Shared-Room', 'Room-3', 'White', 'excellent_used',
    'fixed', 180000, 'KWD',
    'KW', v_city_hawalli, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'hawally-shared-room-placeholder',
    jsonb_build_object(
      'property_type', 'room',
      'area_sqm', 18,
      'bedrooms', 1,
      'bathrooms', 1,
      'floor_number', 3,
      'total_floors', 6,
      'furnished_status', 'fully_furnished',
      'rent_period', 'monthly',
      'deposit_minor_units', 180000,
      'amenities', jsonb_build_array(
        'split_ac','elevator','balcony','private_entrance'
      ),
      'is_deed_verified', false
    ),
    'unverified'
  ) RETURNING id INTO v_id7;
  UPDATE listings SET slug = 'hawally-shared-room-' || v_id7 WHERE id = v_id7;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id7, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'bedroom', 'Furnished room'),
    (v_id7, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'bathroom', 'Shared bathroom'),
    (v_id7, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'living_room', 'Shared living area');

  -- ══════════════════════════════════════════════════════════════════════
  -- #8 — Land (Shuwaikh Industrial) — P8 industrial zoning + unverified demo
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier
  ) VALUES (
    v_seller, v_sub_land,
    'قسيمة صناعية في الشويخ — 1,500 متر مربع',
    'قسيمة صناعية في الشويخ — 1,500 متر مربع',
    'Industrial Plot in Shuwaikh — 1,500 sqm',
    'قسيمة أرض صناعية في منطقة الشويخ الصناعية، 1500 متر مربع، جاهزة للبناء. تنظيم صناعي، متاحة للشركات الكويتية ومواطني دول مجلس التعاون. Industrial plot in Shuwaikh Industrial Area, 1,500 sqm, build-ready.',
    'قسيمة أرض صناعية في منطقة الشويخ الصناعية، 1500 متر مربع، جاهزة للبناء. تنظيم صناعي، متاحة للشركات الكويتية ومواطني دول مجلس التعاون.',
    'Industrial plot in Shuwaikh Industrial Area, 1,500 sqm, build-ready.',
    'Shuwaikh-Industrial-Plot', 'Plot-42', 'N/A', 'new',
    'negotiable', 280000000, 'KWD',
    'KW', v_city_capital, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '90 days', 'clean',
    'shuwaikh-industrial-plot-placeholder',
    jsonb_build_object(
      'property_type', 'land-plot',
      'area_sqm', 1500,
      'plot_area_sqm', 1500,
      'completion_status', 'ready',
      'tenure', 'freehold',
      'zoning_type', 'industrial',
      'plot_block', jsonb_build_object('area','Shuwaikh Industrial','block','4','plot','42'),
      'is_deed_verified', false,
      'amenities', jsonb_build_array()
    ),
    'unverified'
  ) RETURNING id INTO v_id8;
  UPDATE listings SET slug = 'shuwaikh-industrial-plot-' || v_id8 WHERE id = v_id8;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id8, 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'view', 'Shuwaikh industrial plot aerial'),
    (v_id8, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'floor_plan', 'Plot layout survey'),
    (v_id8, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'view', 'Street-side access');

  -- ══════════════════════════════════════════════════════════════════════
  -- #9 — Penthouse RENT yearly (Sharq Al Hamra) — P9 market-band demo (top 20%)
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by, is_featured
  ) VALUES (
    v_seller, v_sub_rent,
    'بنتهاوس برج الحمراء — 3 غرف، إطلالة بانورامية',
    'بنتهاوس برج الحمراء — 3 غرف، إطلالة بانورامية',
    'Al Hamra Tower Penthouse — 3BR Panoramic Views',
    'بنتهاوس في قمة برج الحمراء بمدينة الكويت، 3 غرف نوم فاخرة، إطلالة بانورامية على الخليج، مسبح خاص داخلي، شيكان سنوي. Al Hamra Tower penthouse, 3 bedrooms, panoramic Gulf view, private indoor pool.',
    'بنتهاوس في قمة برج الحمراء بمدينة الكويت، 3 غرف نوم فاخرة، إطلالة بانورامية على الخليج، مسبح خاص داخلي، شيكان سنوي.',
    'Al Hamra Tower penthouse, 3 bedrooms, panoramic Gulf view, private indoor pool.',
    'Al-Hamra-Tower', 'Penthouse-PH-1', 'Glass', 'like_new',
    'fixed', 2500000, 'KWD',
    'KW', v_city_capital, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '60 days', 'clean',
    'al-hamra-penthouse-placeholder',
    jsonb_build_object(
      'property_type', 'penthouse',
      'area_sqm', 240,
      'bedrooms', 3,
      'bathrooms', 4,
      'floor_number', 77,
      'total_floors', 77,
      'year_built', 2013,
      'furnished_status', 'fully_furnished',
      'rent_period', 'yearly',
      'cheques_count', 2,
      'deposit_minor_units', 2500000,
      'service_charge_kwd', 600,
      'commission_payer', 'owner',
      'parking_spaces', 3,
      'orientation', 'corner',
      'view_type', 'sea',
      'amenities', jsonb_build_array(
        'central_ac','elevator','covered_parking','sea_view',
        '24h_security','cctv','gym','swimming_pool_private',
        'swimming_pool_shared','backup_generator','water_tank',
        'maid_room','balcony','roof_access','storage_room'
      ),
      'building_name', 'Al Hamra Tower',
      'developer_name', 'Al Hamra Real Estate',
      'is_deed_verified', true
    ),
    'ai_verified', NOW(), 'ai', true
  ) RETURNING id INTO v_id9;
  UPDATE listings SET slug = 'al-hamra-penthouse-' || v_id9 WHERE id = v_id9;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id9, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Al Hamra Tower exterior'),
    (v_id9, 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'living_room', 'Penthouse living hall'),
    (v_id9, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'bedroom', 'Master suite'),
    (v_id9, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'view', 'Panoramic Gulf view'),
    (v_id9, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'bathroom', 'Marble bathroom'),
    (v_id9, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'kitchen', 'Designer kitchen');

  -- ══════════════════════════════════════════════════════════════════════
  -- #10 — Townhouse SALE (Mubarak Al-Kabeer) — P1 dealo_inspected tier demo
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, title_ar, title_en, description, description_ar, description_en,
    brand, model, color, condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields, verification_tier, verified_at, verified_by
  ) VALUES (
    v_seller, v_sub_sale,
    'تاون هاوس مبارك الكبير — 5 غرف، مفحوصة ديلو',
    'تاون هاوس مبارك الكبير — 5 غرف، مفحوصة ديلو',
    'Mubarak Al-Kabeer Townhouse — 5BR Dealo Inspected',
    'تاون هاوس مفحوص فعلياً من فريق ديلو (عداد الصور مختوم بالتاريخ). 5 غرف، حالة ممتازة، موقع عائلي هادئ. Physically-inspected townhouse by Dealo team (timestamped photos). 5BR, excellent condition, family-friendly location.',
    'تاون هاوس مفحوص فعلياً من فريق ديلو (عداد الصور مختوم بالتاريخ). 5 غرف، حالة ممتازة، موقع عائلي هادئ.',
    'Physically-inspected townhouse by Dealo team (timestamped photos). 5BR, excellent condition, family-friendly location.',
    'Mubarak-TH-Block-8', 'Inspected-TH-5BR', 'Cream', 'excellent_used',
    'negotiable', 285000000, 'KWD',
    'KW', v_city_mubarak, '{pickup}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '90 days', 'clean',
    'mubarak-townhouse-inspected-placeholder',
    jsonb_build_object(
      'property_type', 'townhouse',
      'area_sqm', 350,
      'plot_area_sqm', 420,
      'bedrooms', 5,
      'bathrooms', 4,
      'year_built', 2017,
      'furnished_status', 'unfurnished',
      'condition', 'excellent',
      'completion_status', 'ready',
      'tenure', 'freehold',
      'zoning_type', 'residential-private',
      'parking_spaces', 3,
      'view_type', 'street',
      'amenities', jsonb_build_array(
        'central_ac','garden','covered_parking','storage_room',
        '24h_security','gated_community','maid_room','backup_generator',
        'water_tank','private_entrance','roof_access'
      ),
      'diwaniya', jsonb_build_object(
        'present', true,
        'separate_entrance', false,
        'has_bathroom', true,
        'has_kitchenette', false
      ),
      'plot_block', jsonb_build_object('area','Mubarak Al-Kabeer','block','8','plot','215'),
      'paci_number', '48517209',
      'is_deed_verified', true
    ),
    'dealo_inspected', NOW(), 'inspection'
  ) RETURNING id INTO v_id10;
  UPDATE listings SET slug = 'mubarak-townhouse-inspected-' || v_id10 WHERE id = v_id10;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_id10, 'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'building_exterior', 'Mubarak townhouse exterior — Dealo inspected'),
    (v_id10, 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'living_room', 'Family living room'),
    (v_id10, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'bedroom', 'Master bedroom'),
    (v_id10, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'kitchen', 'Kitchen'),
    (v_id10, 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'view', 'Garden + parking'),
    (v_id10, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'diwaniya_room', 'Internal diwaniya');

  RAISE NOTICE 'Seeded 10 Phase 4a properties (IDs: %, %, %, %, %, %, %, %, %, %)',
    v_id1, v_id2, v_id3, v_id4, v_id5, v_id6, v_id7, v_id8, v_id9, v_id10;
END $$;
