-- ============================================================================
-- 0022_reseed_cars_full.sql — re-seed the 5 used-car demos with full detail
-- ============================================================================
-- The Phase 3a seed (0019) ran before the schema was extended with
--   * listings.old_price_minor_units
--   * listings.is_featured
--   * listings.is_hot
--   * listing_images.category
--   * 9 new category_fields keys (cylinders, doors, seats, warranty_*,
--     region_spec, torque_nm, registration_ref, features[])
--
-- Rather than a cascade of UPDATEs across rows + images, this migration
-- is a clean DELETE + re-INSERT inside a single DO block. The listings
-- `ON DELETE CASCADE` FK on listing_images handles image cleanup.
--
-- The 5 cars get realistic, manufacturer-accurate values:
--   * BMW M5 Competition 2024  — 8cyl V8, 617hp/750Nm, GCC, featured
--   * Mercedes-AMG G63 2023    — 8cyl V8 biturbo, 577hp/850Nm, GCC, hot
--   * Toyota Camry 2022        — 4cyl I4, 203hp/247Nm, GCC, price drop
--   * Honda Civic Type R 2024  — 4cyl turbo, 315hp/420Nm, american import
--   * Tesla Model 3 LR 2024    — 0cyl (electric), 346hp/493Nm, american, price drop
--
-- Each car has 4-6 categorised images (position 0 = cover).
--
-- Idempotent: if any used-cars listing already has is_featured=true,
-- the full re-seed has already run and this migration is a no-op.
--
-- Reference: planning/PHASE-3B-AUDIT.md §3.3 + §7
-- Depends on: 0015..0021 (schema), 0019 (supplanted)
-- ============================================================================

DO $$
DECLARE
  v_seller            UUID;
  v_cat_id            BIGINT;
  v_city_capital      BIGINT;
  v_city_hawalli      BIGINT;
  v_city_farwaniya    BIGINT;
  v_reseeded_count    INT;
  v_bmw_id            BIGINT;
  v_g63_id            BIGINT;
  v_camry_id          BIGINT;
  v_civic_id          BIGINT;
  v_tesla_id          BIGINT;
BEGIN
  -- ── Lookup FK targets ─────────────────────────────────────────────────
  SELECT id INTO v_seller FROM profiles LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'no profiles row — full re-seed requires a seller';
  END IF;

  SELECT id INTO v_cat_id FROM categories WHERE slug = 'used-cars';
  IF v_cat_id IS NULL THEN
    RAISE EXCEPTION 'used-cars category missing — run 0018 first';
  END IF;

  SELECT id INTO v_city_capital   FROM cities WHERE country_code='KW' AND slug='capital';
  SELECT id INTO v_city_hawalli   FROM cities WHERE country_code='KW' AND slug='hawalli';
  SELECT id INTO v_city_farwaniya FROM cities WHERE country_code='KW' AND slug='farwaniya';

  -- ── Idempotency ───────────────────────────────────────────────────────
  -- A full-detail seed always marks at least one listing is_featured=true
  -- (BMW M5). Original 0019 seed left is_featured=false for all rows.
  SELECT COUNT(*) INTO v_reseeded_count
  FROM listings
  WHERE category_id = v_cat_id
    AND seller_id = v_seller
    AND is_featured = true;

  IF v_reseeded_count > 0 THEN
    RAISE NOTICE 'used-cars already re-seeded with full detail — skipping';
    RETURN;
  END IF;

  -- ── Wipe the 0019 seeds (cascades to listing_images via FK) ───────────
  DELETE FROM listings
  WHERE category_id = v_cat_id
    AND seller_id = v_seller;

  -- ══════════════════════════════════════════════════════════════════════
  -- Car 1: BMW M5 Competition 2024 — FEATURED
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, description, brand, model, color,
    condition, price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields,
    is_featured
  ) VALUES (
    v_seller, v_cat_id,
    'BMW M5 Competition 2024 - Alpine White',
    'بي ام دبليو M5 كومبيتيشن 2024 — وكالة، فل أوبشن، ضمان وصيانة مجانية. BMW M5 Competition 2024, dealer-maintained, full options, active factory warranty.',
    'BMW', 'M5 Competition', 'Alpine White', 'new',
    'fixed', 38500000, 'KWD', 'KW', v_city_capital,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'seed-bmw-m5-placeholder',
    jsonb_build_object(
      'make','BMW','model','M5 Competition','year',2024,
      'mileage_km',1500,
      'transmission','automatic','fuel_type','petrol',
      'vin','WBSJF0C54KB123456','accident_history','none',
      'engine_cc',4400,'horsepower',617,'torque_nm',750,
      'cylinders',8,'doors',4,'seats',5,
      'body_style','sedan','drivetrain','awd',
      'exterior_color','Alpine White','interior_color','Black Merino',
      'service_history_status','full',
      'region_spec','gcc',
      'warranty_active',true,'warranty_remaining_months',30,
      'registration_ref','KW 12345',
      'features', jsonb_build_array(
        'abs','airbags','esp','adaptiveCruise','laneAssist','blindSpot',
        'camera360','parkingSensors',
        'leatherSeats','heatedSeats','ventilatedSeats','climateControl',
        'keylessEntry','remoteStart','powerSeats',
        'applecarplay','androidauto','navigation','wirelessCharging',
        'headupDisplay','digitalCluster','premiumSound','bluetooth',
        'ambientLighting',
        'ledHeadlights','alloyWheels'
      )
    ),
    true  -- is_featured
  ) RETURNING id INTO v_bmw_id;

  UPDATE listings SET slug = 'bmw-m5-competition-2024-' || v_bmw_id WHERE id = v_bmw_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_bmw_id, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior', 'BMW M5 Competition 2024 Alpine White front three-quarter'),
    (v_bmw_id, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior', 'BMW M5 Competition rear quarter'),
    (v_bmw_id, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'interior', 'BMW M5 Competition interior front'),
    (v_bmw_id, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'interior', 'BMW M5 Competition dashboard'),
    (v_bmw_id, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'engine', 'BMW M5 Competition S63 V8 engine bay'),
    (v_bmw_id, 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'wheels', 'BMW M5 Competition forged alloy wheel');

  -- ══════════════════════════════════════════════════════════════════════
  -- Car 2: Mercedes-AMG G63 2023 — HOT
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, description, brand, model, color,
    condition, price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields,
    is_hot
  ) VALUES (
    v_seller, v_cat_id,
    'Mercedes-AMG G63 2023 - Obsidian Black',
    'مرسيدس AMG G63 2023، حالة الوكالة، صيانة كاملة موثّقة، بدون حوادث. Mercedes-AMG G63 2023, pristine dealer-like condition, full service history, accident-free.',
    'Mercedes-AMG', 'G63', 'Obsidian Black', 'like_new',
    'fixed', 58000000, 'KWD', 'KW', v_city_hawalli,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'seed-mercedes-g63-placeholder',
    jsonb_build_object(
      'make','Mercedes-AMG','model','G63','year',2023,
      'mileage_km',12000,
      'transmission','automatic','fuel_type','petrol',
      'vin','WDCYC7DF9MX234567','accident_history','none',
      'engine_cc',4000,'horsepower',577,'torque_nm',850,
      'cylinders',8,'doors',4,'seats',5,
      'body_style','suv','drivetrain','4wd',
      'exterior_color','Obsidian Black','interior_color','Macchiato Beige',
      'service_history_status','full',
      'region_spec','gcc',
      'warranty_active',true,'warranty_remaining_months',18,
      'registration_ref','KW 23456',
      'features', jsonb_build_array(
        'abs','airbags','esp','adaptiveCruise','laneAssist','blindSpot',
        'camera360','parkingSensors',
        'leatherSeats','heatedSeats','ventilatedSeats','climateControl',
        'keylessEntry','remoteStart','powerSeats',
        'applecarplay','androidauto','navigation','digitalCluster',
        'premiumSound','bluetooth',
        'ambientLighting',
        'ledHeadlights','alloyWheels'
      )
    ),
    true  -- is_hot
  ) RETURNING id INTO v_g63_id;

  UPDATE listings SET slug = 'mercedes-amg-g63-2023-' || v_g63_id WHERE id = v_g63_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_g63_id, 'https://images.unsplash.com/photo-1519440938413-ef91a6a76342?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior', 'Mercedes-AMG G63 Obsidian Black front'),
    (v_g63_id, 'https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior', 'Mercedes-AMG G63 side profile'),
    (v_g63_id, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'interior', 'Mercedes-AMG G63 Macchiato Beige cabin'),
    (v_g63_id, 'https://images.unsplash.com/photo-1537984822441-cff330075342?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'interior', 'Mercedes-AMG G63 dashboard and infotainment'),
    (v_g63_id, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'engine', 'Mercedes-AMG G63 biturbo V8 engine'),
    (v_g63_id, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'wheels', 'Mercedes-AMG G63 22-inch wheel');

  -- ══════════════════════════════════════════════════════════════════════
  -- Car 3: Toyota Camry 2022 — PRICE DROP
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, description, brand, model, color,
    condition, price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields,
    old_price_minor_units
  ) VALUES (
    v_seller, v_cat_id,
    'Toyota Camry 2022 - Silver GCC Spec',
    'تويوتا كامري 2022، مواصفات خليجية، صيانة بالوكالة، استخدام عائلي نظيف. Toyota Camry 2022, GCC specification, dealer-serviced, clean family use.',
    'Toyota', 'Camry', 'Silver Metallic', 'excellent_used',
    'fixed', 6800000, 'KWD', 'KW', v_city_capital,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'seed-toyota-camry-placeholder',
    jsonb_build_object(
      'make','Toyota','model','Camry','year',2022,
      'mileage_km',45000,
      'transmission','automatic','fuel_type','petrol',
      'vin','4T1G11AK5NU345678','accident_history','none',
      'engine_cc',2500,'horsepower',203,'torque_nm',247,
      'cylinders',4,'doors',4,'seats',5,
      'body_style','sedan','drivetrain','fwd',
      'exterior_color','Silver Metallic','interior_color','Black Fabric',
      'service_history_status','full',
      'region_spec','gcc',
      'warranty_active',false,'warranty_remaining_months',0,
      'registration_ref','KW 34567',
      'features', jsonb_build_array(
        'abs','airbags','esp','parkingSensors',
        'climateControl','keylessEntry','powerSeats',
        'applecarplay','androidauto','bluetooth',
        'ledHeadlights','alloyWheels'
      )
    ),
    7500000  -- old_price_minor_units (was 7,500 KWD before drop to 6,800)
  ) RETURNING id INTO v_camry_id;

  UPDATE listings SET slug = 'toyota-camry-2022-' || v_camry_id WHERE id = v_camry_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_camry_id, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior', 'Toyota Camry 2022 Silver front three-quarter'),
    (v_camry_id, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior', 'Toyota Camry profile'),
    (v_camry_id, 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'interior', 'Toyota Camry interior'),
    (v_camry_id, 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'wheels', 'Toyota Camry alloy wheel');

  -- ══════════════════════════════════════════════════════════════════════
  -- Car 4: Honda Civic Type R 2024
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, description, brand, model, color,
    condition, price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields
  ) VALUES (
    v_seller, v_cat_id,
    'Honda Civic Type R 2024 - Championship White',
    'هوندا سيفيك Type R 2024، ناقل يدوي 6 سرعات، حالة ممتازة، بدون تعديلات. Honda Civic Type R 2024, 6-speed manual, pristine condition, fully stock.',
    'Honda', 'Civic Type R', 'Championship White', 'like_new',
    'fixed', 14200000, 'KWD', 'KW', v_city_farwaniya,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'seed-honda-civic-r-placeholder',
    jsonb_build_object(
      'make','Honda','model','Civic Type R','year',2024,
      'mileage_km',3800,
      'transmission','manual','fuel_type','petrol',
      'vin','2HGFL5H85RH456789','accident_history','none',
      'engine_cc',2000,'horsepower',315,'torque_nm',420,
      'cylinders',4,'doors',4,'seats',5,
      'body_style','hatchback','drivetrain','fwd',
      'exterior_color','Championship White','interior_color','Red Suede',
      'service_history_status','full',
      'region_spec','american',
      'warranty_active',true,'warranty_remaining_months',22,
      'registration_ref','KW 45678',
      'features', jsonb_build_array(
        'abs','airbags','esp','adaptiveCruise','blindSpot','parkingSensors',
        'climateControl','keylessEntry','heatedSeats',
        'applecarplay','androidauto','digitalCluster','premiumSound','bluetooth',
        'ledHeadlights','alloyWheels'
      )
    )
  ) RETURNING id INTO v_civic_id;

  UPDATE listings SET slug = 'honda-civic-type-r-2024-' || v_civic_id WHERE id = v_civic_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_civic_id, 'https://images.unsplash.com/photo-1611821064430-0d40291922d2?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior', 'Honda Civic Type R 2024 Championship White'),
    (v_civic_id, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior', 'Honda Civic Type R rear with wing'),
    (v_civic_id, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'interior', 'Honda Civic Type R red suede seats'),
    (v_civic_id, 'https://images.unsplash.com/photo-1597007519128-778c3648dae6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'engine', 'Honda Civic Type R K20C1 engine bay'),
    (v_civic_id, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'wheels', 'Honda Civic Type R matte black wheel');

  -- ══════════════════════════════════════════════════════════════════════
  -- Car 5: Tesla Model 3 Long Range 2024 — PRICE DROP
  -- ══════════════════════════════════════════════════════════════════════
  INSERT INTO listings (
    seller_id, category_id, title, description, brand, model, color,
    condition, price_mode, price_minor_units, currency_code,
    country_code, city_id, delivery_options,
    status, published_at, expires_at, fraud_status,
    slug, category_fields,
    old_price_minor_units
  ) VALUES (
    v_seller, v_cat_id,
    'Tesla Model 3 Long Range 2024',
    'تسلا موديل 3 Long Range 2024، مدى طويل، شحن منزلي مرفق، سوبر كلين. Tesla Model 3 Long Range 2024, home charger included, showroom condition.',
    'Tesla', 'Model 3 Long Range', 'Pearl White Multi-Coat', 'like_new',
    'fixed', 13900000, 'KWD', 'KW', v_city_hawalli,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'seed-tesla-model-3-placeholder',
    jsonb_build_object(
      'make','Tesla','model','Model 3 Long Range','year',2024,
      'mileage_km',5200,
      'transmission','automatic','fuel_type','electric',
      'vin','5YJ3E1EA4NF567890','accident_history','none',
      'engine_cc',0,'horsepower',346,'torque_nm',493,
      'cylinders',0,'doors',4,'seats',5,
      'body_style','sedan','drivetrain','awd',
      'exterior_color','Pearl White Multi-Coat','interior_color','Black',
      'service_history_status','full',
      'region_spec','american',
      'warranty_active',true,'warranty_remaining_months',30,
      'registration_ref','KW 56789',
      'features', jsonb_build_array(
        'abs','airbags','esp','adaptiveCruise','laneAssist','blindSpot',
        'camera360','parkingSensors',
        'leatherSeats','heatedSeats','climateControl',
        'keylessEntry','remoteStart','powerSeats',
        'navigation','digitalCluster','premiumSound','bluetooth',
        'ambientLighting',
        'ledHeadlights','alloyWheels'
      )
    ),
    15500000  -- old_price_minor_units (was 15,500 KWD before drop to 13,900)
  ) RETURNING id INTO v_tesla_id;

  UPDATE listings SET slug = 'tesla-model-3-long-range-2024-' || v_tesla_id WHERE id = v_tesla_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_tesla_id, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior', 'Tesla Model 3 Long Range Pearl White front'),
    (v_tesla_id, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior', 'Tesla Model 3 rear three-quarter'),
    (v_tesla_id, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'interior', 'Tesla Model 3 minimalist cabin with center display'),
    (v_tesla_id, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'details', 'Tesla Model 3 charge port'),
    (v_tesla_id, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'wheels', 'Tesla Model 3 19-inch aero wheel');

  RAISE NOTICE 'Re-seeded 5 used-cars with full detail data';
END $$;
