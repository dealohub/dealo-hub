-- ============================================================================
-- 0036_seed_electronics_listing_images.sql — images for the 8 electronics seeds
-- ============================================================================
-- 0035 seeded the listings + IMEI registry but *not* listing_images. Every
-- electronics card on /tech + the detail gallery rendered with a "لا توجد
-- صورة" placeholder. The landing hero + LiveFeed additionally filter out
-- image-less rows in `coverUrl()`, so electronics were also absent from
-- the 6 hero scatter slots — a silent drop.
--
-- This migration:
--   1. Extends the listing_images.category CHECK constraint to admit the
--      4 electronics-specific gallery buckets (power_on_screen /
--      imei_screen / battery_health_screen / serial_label). The 3
--      overlapping buckets (exterior / interior / details) are already
--      allowed from the automotive + property unions.
--   2. Inserts 4 listing_images per seed × 8 seeds = 32 rows. Each cover
--      (position 0) is chosen to represent the device family on a card
--      thumbnail; follow-ups show the device from different angles.
--
-- Image source: Unsplash (same convention as migration 0027 for
-- properties). URLs are deliberately generic per device family — the
-- point is to unblock the visual demo, not to claim these are photos
-- of the *specific* serial-number'd device.
--
-- Idempotent via delete-then-insert per listing (keyed by slug). Safe
-- to re-run. If a seed listing slug is missing (e.g. 0035 hasn't been
-- applied yet), the corresponding image insert is skipped via NOT
-- FOUND guard — the migration will not error.
--
-- Depends on: 0035 (electronics seed listings)
-- ============================================================================

-- Wrap the whole file in a single transaction so the DROP → ADD of
-- the category CHECK constraint is atomic even if the runner is
-- psql with `autocommit` forced on. Supabase CLI already does this
-- implicitly per migration, but explicit BEGIN/COMMIT means the
-- same file is safe to replay manually, and closes the window
-- where another connection could INSERT an arbitrary `category`
-- value between the DROP and the ADD.

BEGIN;

-- ── 1. Extend category CHECK to include electronics buckets ───────────────

ALTER TABLE listing_images
  DROP CONSTRAINT IF EXISTS listing_images_category_check;

ALTER TABLE listing_images
  ADD CONSTRAINT listing_images_category_check
  CHECK (
    category IS NULL OR category = ANY (ARRAY[
      -- Automotive (Phase 3)
      'exterior', 'interior', 'engine', 'wheels', 'details',
      -- Properties (Phase 4a)
      'building_exterior', 'living_room', 'bedroom', 'kitchen', 'bathroom',
      'floor_plan', 'view', 'diwaniya_room',
      -- Electronics (Phase 7 v2 — new)
      'power_on_screen', 'imei_screen', 'battery_health_screen', 'serial_label'
    ]::text[])
  );

-- ── 2. Seed listing_images for each of the 8 electronics listings ─────────

DO $$
DECLARE
  v_id bigint;
BEGIN

  -- ── 1. iPhone 15 Pro Max 256GB (Apple Store, premium) ──────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'iphone-15-pro-max-256gb-natural-titanium-v2';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 0, 'exterior',        'iPhone 15 Pro Max titanium — front'),
      (v_id, 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 1, 'exterior',        'iPhone 15 Pro Max titanium — back'),
      (v_id, 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 2, 'details',         'iPhone 15 Pro Max camera system close-up'),
      (v_id, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 3, 'power_on_screen', 'iPhone 15 Pro Max powered on');
  END IF;

  -- ── 2. iPhone 14 Pro 128GB — Badal demo ────────────────────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'iphone-14-pro-128gb-badal';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1663487117747-4a076c91ac4e?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 0, 'exterior',        'iPhone 14 Pro — front'),
      (v_id, 'https://images.unsplash.com/photo-1676419172770-ec2c2b9a6f62?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 1, 'exterior',        'iPhone 14 Pro — Dynamic Island'),
      (v_id, 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 2, 'details',         'iPhone 14 Pro — camera bump'),
      (v_id, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 3, 'power_on_screen', 'iPhone 14 Pro — powered on in hand');
  END IF;

  -- ── 3. MacBook Pro 14 M3 Pro (Jarir + AppleCare+) ──────────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'macbook-pro-14-m3-pro-18gb-512gb-applecare';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior',        'MacBook Pro 14 — open on desk'),
      (v_id, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior',        'MacBook Pro — lifestyle on desk'),
      (v_id, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555b8?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'details',         'MacBook Pro — keyboard detail'),
      (v_id, 'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'power_on_screen', 'MacBook Pro — powered on');
  END IF;

  -- ── 4. iPhone 12 128GB — imported, fair, screen replaced ───────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'iphone-12-128gb-imported-screen-replaced';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1603356033288-acfcb54801e6?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 0, 'exterior',        'iPhone 12 — front'),
      (v_id, 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 1, 'exterior',        'iPhone 12 — back'),
      (v_id, 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 2, 'details',         'iPhone 12 — edge detail'),
      (v_id, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1600&auto=format&fit=crop&q=80', 1600, 1200, 3, 'power_on_screen', 'iPhone 12 — powered on');
  END IF;

  -- ── 5. Samsung 65" QLED Q80C (Eureka) ──────────────────────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'samsung-65-qled-q80c-4k-eureka';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior',        'Samsung 65" QLED TV'),
      (v_id, 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior',        'QLED TV — living room setup'),
      (v_id, 'https://images.unsplash.com/photo-1577979749830-f1d742b96791?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'details',         'TV — stand + ports detail'),
      (v_id, 'https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'power_on_screen', 'QLED TV — powered on');
  END IF;

  -- ── 6. PlayStation 5 Disc (Sharaf DG + Badal) ──────────────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'playstation-5-disc-sharafdg-badal';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior',        'PlayStation 5 Disc — console'),
      (v_id, 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior',        'PS5 — with DualSense controller'),
      (v_id, 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'details',         'PS5 — controller detail'),
      (v_id, 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'power_on_screen', 'PS5 — home screen');
  END IF;

  -- ── 7. Apple Watch Ultra 2 (Yousifi) ───────────────────────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'apple-watch-ultra-2-49mm-yousifi';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1600&auto=format&fit=crop&q=80', 1600, 1600, 0, 'exterior',        'Apple Watch Ultra 2 — front'),
      (v_id, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1600&auto=format&fit=crop&q=80', 1600, 1600, 1, 'exterior',        'Apple Watch — on wrist'),
      (v_id, 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=1600&auto=format&fit=crop&q=80', 1600, 1600, 2, 'details',         'Apple Watch — side detail'),
      (v_id, 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=1600&auto=format&fit=crop&q=80', 1600, 1600, 3, 'power_on_screen', 'Apple Watch — powered on');
  END IF;

  -- ── 8. Sony Alpha 7 IV body (imported Japan) ───────────────────────
  SELECT id INTO v_id FROM listings
  WHERE slug = 'sony-alpha-7-iv-body-imported-japan';
  IF FOUND THEN
    DELETE FROM listing_images WHERE listing_id = v_id;
    INSERT INTO listing_images (listing_id, url, width, height, position, category, alt_text) VALUES
      (v_id, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 0, 'exterior',        'Sony Alpha 7 IV body — front'),
      (v_id, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 1, 'exterior',        'Sony Alpha — top controls'),
      (v_id, 'https://images.unsplash.com/photo-1617005082133-5c66bafab8fe?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 2, 'details',         'Sony Alpha — grip detail'),
      (v_id, 'https://images.unsplash.com/photo-1606983340077-e40e2fb69c48?w=1600&auto=format&fit=crop&q=80', 1600, 1066, 3, 'serial_label',    'Sony Alpha — serial label');
  END IF;

  RAISE NOTICE '0036: seeded listing_images for electronics (32 rows if all 8 slugs matched)';
END $$;

COMMIT;
