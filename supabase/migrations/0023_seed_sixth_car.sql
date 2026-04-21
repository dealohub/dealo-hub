-- ============================================================================
-- 0023_seed_sixth_car.sql — add a 6th live used-car listing
-- ============================================================================
-- Feature283 (the landing hero) is authored with 6 scatter slots around
-- the headline. The 0022 re-seed shipped 5 cars, which left the
-- bottom-right slot empty. This migration adds a 6th car — Porsche 911
-- Carrera S 2024 — so all six slots render with real listings (the
-- hero images and the LiveFeed share one query, so the 6th car also
-- appears in the rolling feed).
--
-- Shape, fields, and image count match the 0022 pattern exactly:
--   * manufacturer-accurate category_fields
--   * 4-6 categorised images (position 0 = cover)
--   * seed-<slug>-placeholder slug, then rewritten to include id suffix
--
-- Idempotent: if a Porsche 911 already exists for this seller, the
-- migration is a no-op. A re-run after `supabase db reset` would
-- re-seed from scratch (0022 wipes the slate, 0023 adds the 6th).
--
-- Reference: src/components/shadcnblocks/feature-283.tsx (6 wraps)
-- Depends on: 0022 (provides the seller + 5 cars)
-- ============================================================================

DO $$
DECLARE
  v_seller       UUID;
  v_cat_id       BIGINT;
  v_city_capital BIGINT;
  v_existing     INT;
  v_porsche_id   BIGINT;
BEGIN
  -- ── Lookup FK targets ─────────────────────────────────────────────────
  SELECT id INTO v_seller FROM profiles LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'no profiles row — sixth-car seed requires a seller';
  END IF;

  SELECT id INTO v_cat_id FROM categories WHERE slug = 'used-cars';
  IF v_cat_id IS NULL THEN
    RAISE EXCEPTION 'used-cars category missing — run 0018 first';
  END IF;

  SELECT id INTO v_city_capital FROM cities WHERE country_code='KW' AND slug='capital';

  -- ── Idempotency ───────────────────────────────────────────────────────
  -- If a Porsche 911 row already exists for this seller+category, the
  -- 6th car is already seeded — skip silently.
  SELECT COUNT(*) INTO v_existing
  FROM listings
  WHERE category_id = v_cat_id
    AND seller_id   = v_seller
    AND brand       = 'Porsche'
    AND model       = '911 Carrera S';

  IF v_existing > 0 THEN
    RAISE NOTICE 'Porsche 911 Carrera S already seeded — skipping';
    RETURN;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════
  -- Car 6: Porsche 911 Carrera S 2024 — FEATURED
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
    'Porsche 911 Carrera S 2024 - Guards Red',
    'بورش 911 كاريرا S 2024 — وكالة، فل أوبشن، حالة سوبر كلين، بدون حوادث. Porsche 911 Carrera S 2024, dealer-maintained, full options, accident-free, showroom condition.',
    'Porsche', '911 Carrera S', 'Guards Red', 'like_new',
    'fixed', 52000000, 'KWD', 'KW', v_city_capital,
    '{pickup,seller_delivers}'::delivery_option[],
    'live', NOW(), NOW() + INTERVAL '30 days', 'clean',
    'seed-porsche-911-placeholder',
    jsonb_build_object(
      'make','Porsche','model','911 Carrera S','year',2024,
      'mileage_km',2400,
      'transmission','automatic','fuel_type','petrol',
      'vin','WP0AB2A99RS123456','accident_history','none',
      'engine_cc',3000,'horsepower',443,'torque_nm',530,
      'cylinders',6,'doors',2,'seats',4,
      'body_style','coupe','drivetrain','rwd',
      'exterior_color','Guards Red','interior_color','Black Leather',
      'service_history_status','full',
      'region_spec','gcc',
      'warranty_active',true,'warranty_remaining_months',28,
      'registration_ref','KW 67890',
      'features', jsonb_build_array(
        'abs','airbags','esp','adaptiveCruise','laneAssist','blindSpot',
        'camera360','parkingSensors',
        'leatherSeats','heatedSeats','ventilatedSeats','climateControl',
        'keylessEntry','remoteStart','powerSeats',
        'applecarplay','navigation','digitalCluster','premiumSound','bluetooth',
        'ambientLighting',
        'ledHeadlights','alloyWheels'
      )
    ),
    true  -- is_featured
  ) RETURNING id INTO v_porsche_id;

  UPDATE listings SET slug = 'porsche-911-carrera-s-2024-' || v_porsche_id WHERE id = v_porsche_id;

  INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
    (v_porsche_id, 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior', 'Porsche 911 Carrera S 2024 Guards Red front three-quarter'),
    (v_porsche_id, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior', 'Porsche 911 Carrera S rear quarter'),
    (v_porsche_id, 'https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'interior', 'Porsche 911 Carrera S cabin with sport seats'),
    (v_porsche_id, 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'interior', 'Porsche 911 Carrera S dashboard'),
    (v_porsche_id, 'https://images.unsplash.com/photo-1611859266238-4b98091d9d9b?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 4, 'engine', 'Porsche 911 Carrera S flat-six engine'),
    (v_porsche_id, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 5, 'wheels', 'Porsche 911 Carrera S forged wheel');

  RAISE NOTICE 'Seeded 6th car: Porsche 911 Carrera S 2024';
END $$;
