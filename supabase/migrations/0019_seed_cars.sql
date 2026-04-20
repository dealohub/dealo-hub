-- ============================================================================
-- 0019_seed_cars.sql — Five used-car seeds for /rides/[id] testing
-- ============================================================================
-- Inserts 5 curated listings under automotive/used-cars with their
-- category_fields JSONB populated per TAXONOMY-V2 §Schema, plus one
-- cover image each. All 5 use the single existing profile as seller
-- (no new auth.users rows are created — that path goes through
-- Supabase Auth, not SQL).
--
-- Strategy:
--   * Wrapped in a DO block so we can look up FK ids by slug once.
--   * Idempotent at the batch level: if any used-cars listings
--     already exist, skip the whole block.
--   * Slug is computed from the returned id (brand-model-year-id)
--     via UPDATE immediately after INSERT. The UNIQUE constraint
--     on slug requires a placeholder value at INSERT time —
--     'seed-<car>-placeholder' is used and rewritten.
--
-- Lifecycle fields set explicitly: handle_listing_publish() is a
-- BEFORE UPDATE trigger and doesn't fire on INSERT, so published_at
-- and expires_at must be set by hand for the rows to be visible.
--
-- Reference: planning/PHASE-3-SUPABASE.md §4.5
-- Depends on: 0015 (category_fields), 0017 (slug), 0018 (automotive)
-- ============================================================================

DO $$
DECLARE
  v_seller            UUID;
  v_cat_id            BIGINT;
  v_city_capital      BIGINT;
  v_city_hawalli      BIGINT;
  v_city_farwaniya    BIGINT;
  v_existing_count    INT;
  v_id                BIGINT;
BEGIN
  -- ── Lookup FK targets ─────────────────────────────────────────────────
  SELECT id INTO v_seller FROM profiles LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'no profiles row found — seed needs at least one profile';
  END IF;

  SELECT id INTO v_cat_id FROM categories WHERE slug = 'used-cars';
  IF v_cat_id IS NULL THEN
    RAISE EXCEPTION 'used-cars category missing — run 0018 first';
  END IF;

  SELECT id INTO v_city_capital   FROM cities WHERE country_code='KW' AND slug='capital';
  SELECT id INTO v_city_hawalli   FROM cities WHERE country_code='KW' AND slug='hawalli';
  SELECT id INTO v_city_farwaniya FROM cities WHERE country_code='KW' AND slug='farwaniya';

  -- ── Idempotency ───────────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_existing_count
  FROM listings
  WHERE category_id = v_cat_id;

  IF v_existing_count >= 5 THEN
    RAISE NOTICE 'used-cars already seeded (% rows found) — skipping', v_existing_count;
    RETURN;
  END IF;

  -- ── Car 1: BMW M5 Competition 2024 ────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id,
    title, description,
    brand, model, color,
    condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id,
    delivery_options,
    status, published_at, expires_at,
    fraud_status,
    slug,
    category_fields
  ) VALUES (
    v_seller, v_cat_id,
    'BMW M5 Competition 2024 - Alpine White',
    'بي ام دبليو M5 كومبيتيشن 2024 — وكالة، فل أوبشن، ضمان وصيانة مجانية. BMW M5 Competition 2024, dealer-maintained, full options, active factory warranty.',
    'BMW', 'M5 Competition', 'Alpine White',
    'new',
    'fixed', 38500000, 'KWD',
    'KW', v_city_capital,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days',
    'clean',
    'seed-bmw-m5-placeholder',
    jsonb_build_object(
      'make', 'BMW',
      'model', 'M5 Competition',
      'year', 2024,
      'mileage_km', 1500,
      'transmission', 'automatic',
      'fuel_type', 'petrol',
      'vin', 'WBSJF0C54KB123456',
      'accident_history', 'none',
      'engine_cc', 4400,
      'horsepower', 617,
      'body_style', 'sedan',
      'exterior_color', 'Alpine White',
      'interior_color', 'Black Merino',
      'service_history_status', 'full'
    )
  ) RETURNING id INTO v_id;

  UPDATE listings SET slug = 'bmw-m5-competition-2024-' || v_id WHERE id = v_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, alt_text)
  VALUES (v_id,
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&auto=format&fit=crop&q=80',
    1600, 1066, 0,
    'BMW M5 Competition 2024 Alpine White exterior'
  );

  -- ── Car 2: Mercedes-AMG G63 2023 ──────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id,
    title, description,
    brand, model, color,
    condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id,
    delivery_options,
    status, published_at, expires_at,
    fraud_status,
    slug,
    category_fields
  ) VALUES (
    v_seller, v_cat_id,
    'Mercedes-AMG G63 2023 - Obsidian Black',
    'مرسيدس AMG G63 2023، حالة الوكالة، صيانة كاملة موثّقة، بدون حوادث. Mercedes-AMG G63 2023, pristine dealer-like condition, full service history, accident-free.',
    'Mercedes-AMG', 'G63', 'Obsidian Black',
    'like_new',
    'fixed', 58000000, 'KWD',
    'KW', v_city_hawalli,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days',
    'clean',
    'seed-mercedes-g63-placeholder',
    jsonb_build_object(
      'make', 'Mercedes-AMG',
      'model', 'G63',
      'year', 2023,
      'mileage_km', 12000,
      'transmission', 'automatic',
      'fuel_type', 'petrol',
      'vin', 'WDCYC7DF9MX234567',
      'accident_history', 'none',
      'engine_cc', 4000,
      'horsepower', 577,
      'body_style', 'suv',
      'exterior_color', 'Obsidian Black',
      'interior_color', 'Macchiato Beige',
      'service_history_status', 'full'
    )
  ) RETURNING id INTO v_id;

  UPDATE listings SET slug = 'mercedes-amg-g63-2023-' || v_id WHERE id = v_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, alt_text)
  VALUES (v_id,
    'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=1600&auto=format&fit=crop&q=80',
    1600, 1066, 0,
    'Mercedes-AMG G63 2023 Obsidian Black exterior'
  );

  -- ── Car 3: Toyota Camry 2022 ──────────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id,
    title, description,
    brand, model, color,
    condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id,
    delivery_options,
    status, published_at, expires_at,
    fraud_status,
    slug,
    category_fields
  ) VALUES (
    v_seller, v_cat_id,
    'Toyota Camry 2022 - Silver GCC Spec',
    'تويوتا كامري 2022، مواصفات خليجية، صيانة بالوكالة، استخدام عائلي نظيف. Toyota Camry 2022, GCC specification, dealer-serviced, clean family use.',
    'Toyota', 'Camry', 'Silver Metallic',
    'excellent_used',
    'fixed', 6800000, 'KWD',
    'KW', v_city_capital,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days',
    'clean',
    'seed-toyota-camry-placeholder',
    jsonb_build_object(
      'make', 'Toyota',
      'model', 'Camry',
      'year', 2022,
      'mileage_km', 45000,
      'transmission', 'automatic',
      'fuel_type', 'petrol',
      'vin', '4T1G11AK5NU345678',
      'accident_history', 'none',
      'engine_cc', 2500,
      'horsepower', 203,
      'body_style', 'sedan',
      'exterior_color', 'Silver Metallic',
      'interior_color', 'Black Fabric',
      'service_history_status', 'full'
    )
  ) RETURNING id INTO v_id;

  UPDATE listings SET slug = 'toyota-camry-2022-' || v_id WHERE id = v_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, alt_text)
  VALUES (v_id,
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1600&auto=format&fit=crop&q=80',
    1600, 1066, 0,
    'Toyota Camry 2022 Silver GCC exterior'
  );

  -- ── Car 4: Honda Civic Type R 2024 ────────────────────────────────────
  INSERT INTO listings (
    seller_id, category_id,
    title, description,
    brand, model, color,
    condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id,
    delivery_options,
    status, published_at, expires_at,
    fraud_status,
    slug,
    category_fields
  ) VALUES (
    v_seller, v_cat_id,
    'Honda Civic Type R 2024 - Championship White',
    'هوندا سيفيك Type R 2024، ناقل يدوي 6 سرعات، حالة ممتازة، بدون تعديلات. Honda Civic Type R 2024, 6-speed manual, pristine condition, fully stock.',
    'Honda', 'Civic Type R', 'Championship White',
    'like_new',
    'fixed', 14200000, 'KWD',
    'KW', v_city_farwaniya,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days',
    'clean',
    'seed-honda-civic-r-placeholder',
    jsonb_build_object(
      'make', 'Honda',
      'model', 'Civic Type R',
      'year', 2024,
      'mileage_km', 3800,
      'transmission', 'manual',
      'fuel_type', 'petrol',
      'vin', '2HGFL5H85RH456789',
      'accident_history', 'none',
      'engine_cc', 2000,
      'horsepower', 315,
      'body_style', 'hatchback',
      'exterior_color', 'Championship White',
      'interior_color', 'Red Suede',
      'service_history_status', 'full'
    )
  ) RETURNING id INTO v_id;

  UPDATE listings SET slug = 'honda-civic-type-r-2024-' || v_id WHERE id = v_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, alt_text)
  VALUES (v_id,
    'https://images.unsplash.com/photo-1611821064430-0d40291922d2?w=1600&auto=format&fit=crop&q=80',
    1600, 1066, 0,
    'Honda Civic Type R 2024 Championship White exterior'
  );

  -- ── Car 5: Tesla Model 3 Long Range 2024 ──────────────────────────────
  INSERT INTO listings (
    seller_id, category_id,
    title, description,
    brand, model, color,
    condition,
    price_mode, price_minor_units, currency_code,
    country_code, city_id,
    delivery_options,
    status, published_at, expires_at,
    fraud_status,
    slug,
    category_fields
  ) VALUES (
    v_seller, v_cat_id,
    'Tesla Model 3 Long Range 2024',
    'تسلا موديل 3 Long Range 2024، مدى طويل، شحن منزلي مرفق، سوبر كلين. Tesla Model 3 Long Range 2024, home charger included, showroom condition.',
    'Tesla', 'Model 3 Long Range', 'Pearl White Multi-Coat',
    'like_new',
    'fixed', 13900000, 'KWD',
    'KW', v_city_hawalli,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days',
    'clean',
    'seed-tesla-model-3-placeholder',
    jsonb_build_object(
      'make', 'Tesla',
      'model', 'Model 3 Long Range',
      'year', 2024,
      'mileage_km', 5200,
      'transmission', 'automatic',
      'fuel_type', 'electric',
      'vin', '5YJ3E1EA4NF567890',
      'accident_history', 'none',
      'engine_cc', 0,
      'horsepower', 346,
      'body_style', 'sedan',
      'exterior_color', 'Pearl White Multi-Coat',
      'interior_color', 'Black',
      'service_history_status', 'full'
    )
  ) RETURNING id INTO v_id;

  UPDATE listings SET slug = 'tesla-model-3-long-range-2024-' || v_id WHERE id = v_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, alt_text)
  VALUES (v_id,
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1600&auto=format&fit=crop&q=80',
    1600, 1066, 0,
    'Tesla Model 3 Long Range 2024 Pearl White exterior'
  );

  RAISE NOTICE 'Seeded 5 used-cars listings';
END $$;
