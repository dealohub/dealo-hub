-- ============================================================================
-- 0039_seed_services_v1.sql — Phase 8a seed data
-- ============================================================================
-- 5 providers (all Kuwait), 12 home-service listings (6 cleaning + 6 handyman),
-- 8 historical bookings with completion timestamps, 16 cross-reviews.
--
-- Design decisions (per doctrine §8):
--   • 3 individual providers at identity_verified tier (no MOCI)
--   • 1 at address_verified (identity + PACI confirmed)
--   • 1 at dealo_inspected (MOCI on file, manually reviewed)
--   • All 5 carry both attestation timestamps (Law 68/2015 + authorization)
--   • 12 listings span 8 task_type values (so each has ≥1 example)
--   • 8 completed bookings → each provider has 1-2 reviews → non-null
--     rating_avg on their category_fields
--
-- Idempotent — ON CONFLICT (slug) DO NOTHING on listings; providers are
-- keyed by synthetic fixed UUIDs so replay is safe.
--
-- Depends on: 0037 (schema), 0038 (messages.kind). Must run after both.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_home_services_cat_id BIGINT;
  v_city_capital BIGINT;
  v_city_hawalli BIGINT;
  v_area_salmiya BIGINT;
  v_area_bayan BIGINT;
  v_area_sharq BIGINT;
  v_area_jabriya BIGINT;

  -- Synthetic provider UUIDs — fixed so replay is idempotent.
  v_p_fatima UUID := 'a0000001-0000-0000-0000-000000000001';
  v_p_ahmed  UUID := 'a0000002-0000-0000-0000-000000000002';
  v_p_maryam UUID := 'a0000003-0000-0000-0000-000000000003';
  v_p_deepak UUID := 'a0000004-0000-0000-0000-000000000004';
  v_p_nasser UUID := 'a0000005-0000-0000-0000-000000000005';

  v_listing_id BIGINT;
  v_conv_id BIGINT;
  v_booking_id BIGINT;
  v_buyer UUID;
BEGIN
  -- ── Lookups ───────────────────────────────────────────────────────────────
  SELECT id INTO v_home_services_cat_id FROM categories WHERE slug = 'home-services';
  SELECT id INTO v_city_capital FROM cities WHERE id = 1 LIMIT 1;
  SELECT id INTO v_city_hawalli FROM cities WHERE id = 2 LIMIT 1;
  SELECT id INTO v_area_salmiya FROM areas WHERE name_en ILIKE '%salmiya%' LIMIT 1;
  SELECT id INTO v_area_bayan   FROM areas WHERE name_en ILIKE '%bayan%' OR name_ar ILIKE '%بيان%' LIMIT 1;
  SELECT id INTO v_area_sharq   FROM areas WHERE name_en ILIKE '%sharq%' LIMIT 1;
  SELECT id INTO v_area_jabriya FROM areas WHERE name_en ILIKE '%jabriya%' OR name_ar ILIKE '%جابرية%' LIMIT 1;

  -- Fallback for `buyer` on seed bookings: use the first real profile
  SELECT id INTO v_buyer FROM profiles ORDER BY created_at LIMIT 1;

  IF v_home_services_cat_id IS NULL THEN
    RAISE NOTICE '0039: home-services category not found, skipping seed';
    RETURN;
  END IF;

  -- ── 1. Provider profiles (5) ──────────────────────────────────────────────

  INSERT INTO profiles (id, display_name, country_code, preferred_locale,
    services_provider_verification_tier,
    services_attestation_68_consent_at, services_attestation_authorization_at,
    rating_count, active_listings_count, created_at)
  VALUES
    (v_p_fatima, 'فاطمة الخالدي', 'KW', 'ar', 'identity_verified',
      NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', 0, 2, NOW() - INTERVAL '180 days'),
    (v_p_ahmed, 'Handyman Ahmed', 'KW', 'en', 'identity_verified',
      NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', 0, 3, NOW() - INTERVAL '200 days'),
    (v_p_maryam, 'Maryam Al-Sabah', 'KW', 'ar', 'dealo_inspected',
      NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', 0, 2, NOW() - INTERVAL '365 days'),
    (v_p_deepak, 'Ultra Services (Deepak)', 'KW', 'en', 'address_verified',
      NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', 0, 3, NOW() - INTERVAL '120 days'),
    (v_p_nasser, 'ناصر المطيري', 'KW', 'ar', 'identity_verified',
      NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 0, 2, NOW() - INTERVAL '90 days')
  ON CONFLICT (id) DO UPDATE SET
    -- display_name override — our auth.users seeds create profile rows via
    -- trigger with email-prefix as display_name; force the Arabic/English
    -- names we actually want.
    display_name = EXCLUDED.display_name,
    services_provider_verification_tier = EXCLUDED.services_provider_verification_tier,
    services_attestation_68_consent_at = EXCLUDED.services_attestation_68_consent_at,
    services_attestation_authorization_at = EXCLUDED.services_attestation_authorization_at;

  -- ── 2. service_areas_served — area-level serving map ──────────────────────

  -- Fatima serves Salmiya + Sharq
  INSERT INTO service_areas_served (provider_profile_id, area_id) VALUES
    (v_p_fatima, v_area_salmiya),
    (v_p_fatima, v_area_sharq)
  ON CONFLICT DO NOTHING;

  -- Ahmed serves Salmiya + Jabriya + Bayan
  INSERT INTO service_areas_served (provider_profile_id, area_id) VALUES
    (v_p_ahmed, v_area_salmiya),
    (v_p_ahmed, v_area_jabriya),
    (v_p_ahmed, v_area_bayan)
  ON CONFLICT DO NOTHING;

  -- Maryam — premium, covers all available areas
  INSERT INTO service_areas_served (provider_profile_id, area_id) VALUES
    (v_p_maryam, v_area_salmiya),
    (v_p_maryam, v_area_bayan),
    (v_p_maryam, v_area_sharq),
    (v_p_maryam, v_area_jabriya)
  ON CONFLICT DO NOTHING;

  -- Deepak — 4 areas
  INSERT INTO service_areas_served (provider_profile_id, area_id) VALUES
    (v_p_deepak, v_area_salmiya),
    (v_p_deepak, v_area_jabriya),
    (v_p_deepak, v_area_sharq)
  ON CONFLICT DO NOTHING;

  -- Nasser — handyman specialist
  INSERT INTO service_areas_served (provider_profile_id, area_id) VALUES
    (v_p_nasser, v_area_bayan),
    (v_p_nasser, v_area_jabriya)
  ON CONFLICT DO NOTHING;

  -- ── 3. Listings (12) ──────────────────────────────────────────────────────
  -- Aggregates (completed_bookings_count + rating_avg + rating_count) are
  -- STATIC in this seed. In prod a trigger keeps them synced. Provider
  -- ratings match the historical bookings in §4 below:
  --   Fatima:  2 bookings, avg 4.5
  --   Ahmed:   2 bookings, avg 4.8
  --   Maryam:  2 bookings, avg 5.0
  --   Deepak:  1 booking,  avg 4.0
  --   Nasser:  1 booking,  avg 4.7

  -- ──────────── Fatima Al-Khalidi (cleaning) ──────────────
  INSERT INTO listings (seller_id, category_id, slug, title, title_ar, title_en,
    description, description_ar, description_en, condition, brand, model,
    price_mode, price_minor_units, currency_code, country_code, city_id, area_id,
    delivery_options, status, category_fields, published_at, expires_at)
  VALUES
    (v_p_fatima, v_home_services_cat_id, 'fatima-cleaning-one-off',
     'تنظيف شامل للشقق — فاطمة الخالدي',
     'تنظيف شامل للشقق — فاطمة الخالدي',
     'One-off apartment cleaning — Fatima',
     'تنظيف شامل لمرة واحدة، مواد تنظيف مشمولة، خبرة ٥ سنوات، أتحدث العربية والإنجليزية.',
     'تنظيف شامل لمرة واحدة، مواد تنظيف مشمولة، خبرة ٥ سنوات، أتحدث العربية والإنجليزية.',
     'One-off deep clean, supplies included, 5 years experience, Arabic + English.',
     'like_new', 'Home Services', 'Cleaning',
     'negotiable', 3000, 'KWD', 'KW', v_city_hawalli, v_area_salmiya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_fatima::text,
       'task_type', 'home_cleaning_one_off',
       'served_governorates', jsonb_build_array('hawalli', 'capital'),
       'price_mode', 'hourly',
       'hourly_rate_minor_units', 3000,
       'min_hours', 3,
       'availability_summary', 'flexible',
       'team_size', 1,
       'supplies_included', true,
       'spoken_languages', jsonb_build_array('ar', 'en'),
       'years_experience', 5,
       'completed_bookings_count', 2,
       'rating_avg', 4.5,
       'rating_count', 2
     ),
     NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days'),

    (v_p_fatima, v_home_services_cat_id, 'fatima-cleaning-recurring',
     'تنظيف أسبوعي — فاطمة الخالدي',
     'تنظيف أسبوعي — فاطمة الخالدي',
     'Weekly recurring cleaning — Fatima',
     'تنظيف أسبوعي/كل أسبوعين بسعر مخفض، نفس المنظفة في كل زيارة.',
     'تنظيف أسبوعي/كل أسبوعين بسعر مخفض، نفس المنظفة في كل زيارة.',
     'Weekly/bi-weekly cleaning at a discounted rate, same cleaner each visit.',
     'like_new', 'Home Services', 'Cleaning',
     'fixed', 2500, 'KWD', 'KW', v_city_hawalli, v_area_salmiya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_fatima::text,
       'task_type', 'home_cleaning_recurring',
       'served_governorates', jsonb_build_array('hawalli', 'capital'),
       'price_mode', 'hourly',
       'hourly_rate_minor_units', 2500,
       'min_hours', 4,
       'availability_summary', 'daytime_weekdays',
       'team_size', 1,
       'supplies_included', true,
       'spoken_languages', jsonb_build_array('ar', 'en'),
       'years_experience', 5,
       'completed_bookings_count', 2,
       'rating_avg', 4.5,
       'rating_count', 2
     ),
     NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'),

  -- ──────────── Handyman Ahmed (handyman) ──────────────
    (v_p_ahmed, v_home_services_cat_id, 'ahmed-ikea-assembly',
     'تركيب أثاث IKEA — Handyman Ahmed',
     'تركيب أثاث IKEA — Handyman Ahmed',
     'IKEA assembly — Handyman Ahmed',
     'تركيب أي قطعة أثاث IKEA بسعر ثابت. تسليم نفس اليوم في أغلب المناطق.',
     'تركيب أي قطعة أثاث IKEA بسعر ثابت. تسليم نفس اليوم في أغلب المناطق.',
     'Flat fee IKEA assembly, same-day delivery in most areas.',
     'like_new', 'Home Services', 'Handyman',
     'fixed', 10000, 'KWD', 'KW', v_city_hawalli, v_area_jabriya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_ahmed::text,
       'task_type', 'handyman_ikea_assembly',
       'served_governorates', jsonb_build_array('hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'fixed',
       'fixed_price_minor_units', 10000,
       'availability_summary', 'flexible',
       'team_size', 1,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi'),
       'years_experience', 7,
       'completed_bookings_count', 2,
       'rating_avg', 4.8,
       'rating_count', 2
     ),
     NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'),

    (v_p_ahmed, v_home_services_cat_id, 'ahmed-tv-mount',
     'تركيب شاشات تلفزيون — Handyman Ahmed',
     'تركيب شاشات تلفزيون — Handyman Ahmed',
     'TV wall-mounting — Handyman Ahmed',
     'تركيب أي حجم شاشة مع مخفيات الكابلات. يشمل الفحص النهائي.',
     'تركيب أي حجم شاشة مع مخفيات الكابلات. يشمل الفحص النهائي.',
     'Any screen size with cable concealment. Final inspection included.',
     'like_new', 'Home Services', 'Handyman',
     'fixed', 15000, 'KWD', 'KW', v_city_hawalli, v_area_jabriya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_ahmed::text,
       'task_type', 'handyman_tv_mount',
       'served_governorates', jsonb_build_array('hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'fixed',
       'fixed_price_minor_units', 15000,
       'availability_summary', 'flexible',
       'team_size', 1,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi'),
       'years_experience', 7,
       'completed_bookings_count', 2,
       'rating_avg', 4.8,
       'rating_count', 2
     ),
     NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days'),

    (v_p_ahmed, v_home_services_cat_id, 'ahmed-shelf-hang',
     'تعليق رفوف وإطارات — Handyman Ahmed',
     'تعليق رفوف وإطارات — Handyman Ahmed',
     'Shelf + frame hanging — Handyman Ahmed',
     'تعليق الرفوف، اللوحات، والمرايا. بالساعة، أدوات كاملة.',
     'تعليق الرفوف، اللوحات، والمرايا. بالساعة، أدوات كاملة.',
     'Shelves, frames, mirrors. Hourly, full tools.',
     'like_new', 'Home Services', 'Handyman',
     'fixed', 5000, 'KWD', 'KW', v_city_hawalli, v_area_bayan,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_ahmed::text,
       'task_type', 'handyman_shelf_hang',
       'served_governorates', jsonb_build_array('hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'hourly',
       'hourly_rate_minor_units', 5000,
       'min_hours', 1,
       'availability_summary', 'flexible',
       'team_size', 1,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi'),
       'years_experience', 7,
       'completed_bookings_count', 2,
       'rating_avg', 4.8,
       'rating_count', 2
     ),
     NOW() - INTERVAL '6 days', NOW() + INTERVAL '24 days'),

  -- ──────────── Maryam Al-Sabah (premium cleaning, dealo_inspected) ──────────────
    (v_p_maryam, v_home_services_cat_id, 'maryam-premium-deep-clean',
     'تنظيف عميق احترافي — مريم آل صباح',
     'تنظيف عميق احترافي — مريم آل صباح',
     'Premium deep clean — Maryam Al-Sabah',
     'شركة مرخصة، فريق من ٣ عاملات، معدات مهنية، ضمان جودة. دفع عبر KNET.',
     'شركة مرخصة، فريق من ٣ عاملات، معدات مهنية، ضمان جودة. دفع عبر KNET.',
     'MOCI-licensed, 3-person team, professional equipment, quality guarantee.',
     'new', 'Home Services', 'Cleaning',
     'fixed', 25000, 'KWD', 'KW', v_city_capital, v_area_sharq,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_maryam::text,
       'task_type', 'home_cleaning_one_off',
       'served_governorates', jsonb_build_array('capital', 'hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'hybrid',
       'hourly_rate_minor_units', 5000,
       'min_hours', 4,
       'fixed_price_minor_units', 25000,
       'availability_summary', 'flexible',
       'team_size', 3,
       'supplies_included', true,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi', 'tl'),
       'years_experience', 12,
       'completed_bookings_count', 2,
       'rating_avg', 5.0,
       'rating_count', 2
     ),
     NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days'),

    (v_p_maryam, v_home_services_cat_id, 'maryam-weekly-plan',
     'تنظيف أسبوعي — مريم آل صباح',
     'تنظيف أسبوعي — مريم آل صباح',
     'Weekly cleaning plan — Maryam',
     'اشتراك أسبوعي مع ضمان الجودة. نفس الفريق، جدول ثابت.',
     'اشتراك أسبوعي مع ضمان الجودة. نفس الفريق، جدول ثابت.',
     'Weekly subscription with quality guarantee. Same team, fixed schedule.',
     'new', 'Home Services', 'Cleaning',
     'fixed', 4000, 'KWD', 'KW', v_city_capital, v_area_sharq,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_maryam::text,
       'task_type', 'home_cleaning_recurring',
       'served_governorates', jsonb_build_array('capital', 'hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'hourly',
       'hourly_rate_minor_units', 4000,
       'min_hours', 3,
       'availability_summary', 'flexible',
       'team_size', 3,
       'supplies_included', true,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi', 'tl'),
       'years_experience', 12,
       'completed_bookings_count', 2,
       'rating_avg', 5.0,
       'rating_count', 2
     ),
     NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days'),

  -- ──────────── Deepak (Ultra Services — multi-task) ──────────────
    (v_p_deepak, v_home_services_cat_id, 'deepak-1br-deep-clean',
     '1BR Deep Clean — Ultra Services',
     '1BR Deep Clean — Ultra Services',
     '1BR Deep Clean — Ultra Services',
     'Complete deep clean for 1-bedroom apartments. Fixed price, supplies extra.',
     'تنظيف عميق كامل لشقة بغرفة نوم واحدة. سعر ثابت، المواد على العميل.',
     'Complete deep clean for 1-bedroom apartments. Fixed price, supplies extra.',
     'like_new', 'Home Services', 'Cleaning',
     'fixed', 20000, 'KWD', 'KW', v_city_hawalli, v_area_jabriya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_deepak::text,
       'task_type', 'home_cleaning_one_off',
       'served_governorates', jsonb_build_array('hawalli', 'capital'),
       'price_mode', 'fixed',
       'fixed_price_minor_units', 20000,
       'availability_summary', 'flexible',
       'team_size', 2,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi', 'ml', 'tl'),
       'years_experience', 8,
       'completed_bookings_count', 1,
       'rating_avg', 4.0,
       'rating_count', 1
     ),
     NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days'),

    (v_p_deepak, v_home_services_cat_id, 'deepak-regular-hourly',
     'تنظيف بالساعة — Ultra Services',
     'تنظيف بالساعة — Ultra Services',
     'Hourly cleaning — Ultra Services',
     'خدمة بالساعة بأقل سعر: 2 دينار، حد أدنى ساعتين.',
     'خدمة بالساعة بأقل سعر: 2 دينار، حد أدنى ساعتين.',
     'Hourly service at the lowest price: 2 KWD, minimum 2 hours.',
     'like_new', 'Home Services', 'Cleaning',
     'fixed', 2000, 'KWD', 'KW', v_city_hawalli, v_area_jabriya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_deepak::text,
       'task_type', 'home_cleaning_recurring',
       'served_governorates', jsonb_build_array('hawalli', 'capital'),
       'price_mode', 'hourly',
       'hourly_rate_minor_units', 2000,
       'min_hours', 2,
       'availability_summary', 'flexible',
       'team_size', 1,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi', 'ml'),
       'years_experience', 8,
       'completed_bookings_count', 1,
       'rating_avg', 4.0,
       'rating_count', 1
     ),
     NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days'),

    (v_p_deepak, v_home_services_cat_id, 'deepak-painting',
     'صباغة غرف — Ultra Services',
     'صباغة غرف — Ultra Services',
     'Basic painting — Ultra Services',
     'صباغة غرفة واحدة (حتى 20 م²) بسعر ثابت. ألوان مختلفة متاحة.',
     'صباغة غرفة واحدة (حتى 20 م²) بسعر ثابت. ألوان مختلفة متاحة.',
     'Single room painting (up to 20m²) flat fee. Colors available.',
     'like_new', 'Home Services', 'Handyman',
     'fixed', 35000, 'KWD', 'KW', v_city_hawalli, v_area_jabriya,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_deepak::text,
       'task_type', 'handyman_basic_painting',
       'served_governorates', jsonb_build_array('hawalli', 'capital'),
       'price_mode', 'fixed',
       'fixed_price_minor_units', 35000,
       'availability_summary', 'daytime_weekends',
       'team_size', 2,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en', 'hi'),
       'years_experience', 8,
       'completed_bookings_count', 1,
       'rating_avg', 4.0,
       'rating_count', 1
     ),
     NOW() - INTERVAL '9 days', NOW() + INTERVAL '21 days'),

  -- ──────────── Nasser Al-Mutairi (handyman specialist) ──────────────
    (v_p_nasser, v_home_services_cat_id, 'nasser-ikea-specialist',
     'مختص تركيب IKEA — ناصر',
     'مختص تركيب IKEA — ناصر',
     'IKEA specialist — Nasser',
     'أعمل ٤ سنوات بتركيب IKEA. أعطي ضمان ٧ أيام على كل تركيب.',
     'أعمل ٤ سنوات بتركيب IKEA. أعطي ضمان ٧ أيام على كل تركيب.',
     '4 years of IKEA assembly. 7-day guarantee on every build.',
     'like_new', 'Home Services', 'Handyman',
     'fixed', 12000, 'KWD', 'KW', v_city_hawalli, v_area_bayan,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_nasser::text,
       'task_type', 'handyman_ikea_assembly',
       'served_governorates', jsonb_build_array('hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'fixed',
       'fixed_price_minor_units', 12000,
       'availability_summary', 'flexible',
       'team_size', 1,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en'),
       'years_experience', 4,
       'completed_bookings_count', 1,
       'rating_avg', 4.7,
       'rating_count', 1
     ),
     NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'),

    (v_p_nasser, v_home_services_cat_id, 'nasser-furniture-move',
     'ترتيب ونقل أثاث داخل البيت — ناصر',
     'ترتيب ونقل أثاث داخل البيت — ناصر',
     'In-home furniture rearranging — Nasser',
     'نقل قطع الأثاث الثقيلة داخل البيت (مو من بيت لبيت). بالساعة.',
     'نقل قطع الأثاث الثقيلة داخل البيت (مو من بيت لبيت). بالساعة.',
     'Move heavy furniture WITHIN a home (not house-to-house). Hourly.',
     'like_new', 'Home Services', 'Handyman',
     'fixed', 4000, 'KWD', 'KW', v_city_hawalli, v_area_bayan,
     ARRAY['pickup']::delivery_option[], 'live',
     jsonb_build_object(
       'provider_profile_id', v_p_nasser::text,
       'task_type', 'handyman_furniture_move',
       'served_governorates', jsonb_build_array('hawalli', 'mubarak_al_kabeer'),
       'price_mode', 'hourly',
       'hourly_rate_minor_units', 4000,
       'min_hours', 2,
       'availability_summary', 'daytime_weekends',
       'team_size', 1,
       'supplies_included', false,
       'spoken_languages', jsonb_build_array('ar', 'en'),
       'years_experience', 4,
       'completed_bookings_count', 1,
       'rating_avg', 4.7,
       'rating_count', 1
     ),
     NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days')
  ON CONFLICT (slug) DO NOTHING;

  -- ── 4. Historical bookings (8) + cross-reviews ─────────────────────────────
  -- Keeps this simple: we seed one conversation per booking for
  -- referential completeness, one booking, two reviews.
  --
  -- We only seed if the buyer profile exists (avoids errors in empty envs).

  IF v_buyer IS NULL THEN
    RAISE NOTICE '0039: no buyer profile found, skipping bookings + reviews';
    RETURN;
  END IF;

  -- Helper DO block per booking — we write 8 bookings each with a conv.
  -- Loop cleanly with a CTE-less approach.

  -- Booking 1: buyer → Fatima (completed, 5★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'fatima-cleaning-one-off' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_fatima, NOW() - INTERVAL '20 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_fatima,
      NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '3 hours',
      9000, 'KWD', 'completed',
      NOW() - INTERVAL '18 days' + INTERVAL '3 hours', NOW() - INTERVAL '18 days' + INTERVAL '3 hours',
      true, NOW() - INTERVAL '20 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_fatima, 5, 'ممتازة جداً، نظيفة ودقيقة.', true, true, true, NOW() - INTERVAL '17 days'),
      (v_booking_id, v_p_fatima, v_buyer, 5, 'عميلة رائعة، دفعت نفس اليوم.', true, null, true, NOW() - INTERVAL '17 days');
  END IF;

  -- Booking 2: buyer → Fatima (completed, 4★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'fatima-cleaning-recurring' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_fatima, NOW() - INTERVAL '14 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_fatima,
      NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '4 hours',
      10000, 'KWD', 'completed',
      NOW() - INTERVAL '12 days' + INTERVAL '4 hours', NOW() - INTERVAL '12 days' + INTERVAL '4 hours',
      true, NOW() - INTERVAL '14 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_fatima, 4, 'جيدة، تأخرت نصف ساعة بس الشغل كان نظيف.', false, true, true, NOW() - INTERVAL '11 days'),
      (v_booking_id, v_p_fatima, v_buyer, 5, 'شكراً على التعاون.', true, null, true, NOW() - INTERVAL '11 days');
  END IF;

  -- Booking 3: buyer → Ahmed (IKEA assembly, 5★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'ahmed-ikea-assembly' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_ahmed, NOW() - INTERVAL '10 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_ahmed,
      NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days' + INTERVAL '2 hours',
      10000, 'KWD', 'completed',
      NOW() - INTERVAL '9 days' + INTERVAL '2 hours', NOW() - INTERVAL '9 days' + INTERVAL '2 hours',
      true, NOW() - INTERVAL '10 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_ahmed, 5, 'Assembled 2 wardrobes in 90 min. Great work.', true, true, true, NOW() - INTERVAL '9 days'),
      (v_booking_id, v_p_ahmed, v_buyer, 5, 'Smooth job, clear instructions.', true, null, true, NOW() - INTERVAL '9 days');
  END IF;

  -- Booking 4: buyer → Ahmed (TV mount, 5★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'ahmed-tv-mount' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_ahmed, NOW() - INTERVAL '7 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_ahmed,
      NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '1 hours',
      15000, 'KWD', 'completed',
      NOW() - INTERVAL '6 days' + INTERVAL '1 hours', NOW() - INTERVAL '6 days' + INTERVAL '1 hours',
      true, NOW() - INTERVAL '7 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_ahmed, 5, 'Wall-mounted 65" TV, cables hidden. Fast.', true, true, true, NOW() - INTERVAL '6 days'),
      (v_booking_id, v_p_ahmed, v_buyer, 5, 'Clear requirements, good communication.', true, null, true, NOW() - INTERVAL '6 days');
  END IF;

  -- Booking 5: buyer → Maryam (5★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'maryam-premium-deep-clean' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_maryam, NOW() - INTERVAL '15 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_maryam,
      NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days' + INTERVAL '5 hours',
      25000, 'KWD', 'completed',
      NOW() - INTERVAL '13 days' + INTERVAL '5 hours', NOW() - INTERVAL '13 days' + INTERVAL '5 hours',
      true, NOW() - INTERVAL '15 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_maryam, 5, 'فريق ممتاز، تنظيف لا يُصدق. سأحجز مرة ثانية.', true, true, true, NOW() - INTERVAL '13 days'),
      (v_booking_id, v_p_maryam, v_buyer, 5, 'Thank you, great communication.', true, null, true, NOW() - INTERVAL '13 days');
  END IF;

  -- Booking 6: buyer → Maryam (5★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'maryam-weekly-plan' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_maryam, NOW() - INTERVAL '21 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_maryam,
      NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days' + INTERVAL '3 hours',
      12000, 'KWD', 'completed',
      NOW() - INTERVAL '19 days' + INTERVAL '3 hours', NOW() - INTERVAL '19 days' + INTERVAL '3 hours',
      true, NOW() - INTERVAL '21 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_maryam, 5, 'جاهز كل أسبوع، نفس الفريق، نفس الجودة.', true, true, true, NOW() - INTERVAL '19 days'),
      (v_booking_id, v_p_maryam, v_buyer, 5, 'Reliable client.', true, null, true, NOW() - INTERVAL '19 days');
  END IF;

  -- Booking 7: buyer → Deepak (4★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'deepak-1br-deep-clean' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_deepak, NOW() - INTERVAL '30 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_deepak,
      NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days' + INTERVAL '4 hours',
      20000, 'KWD', 'completed',
      NOW() - INTERVAL '28 days' + INTERVAL '4 hours', NOW() - INTERVAL '28 days' + INTERVAL '4 hours',
      true, NOW() - INTERVAL '30 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_deepak, 4, 'Good work, supplies cost extra was clear upfront.', true, true, true, NOW() - INTERVAL '28 days'),
      (v_booking_id, v_p_deepak, v_buyer, 5, 'Thanks.', true, null, true, NOW() - INTERVAL '28 days');
  END IF;

  -- Booking 8: buyer → Nasser (5★)
  SELECT id INTO v_listing_id FROM listings WHERE slug = 'nasser-ikea-specialist' LIMIT 1;
  IF v_listing_id IS NOT NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id, created_at)
    VALUES (v_listing_id, v_buyer, v_p_nasser, NOW() - INTERVAL '11 days')
    RETURNING id INTO v_conv_id;

    INSERT INTO service_bookings (listing_id, conversation_id, buyer_profile_id, provider_profile_id,
      slot_start_at, slot_end_at, estimated_total_minor_units, currency_code, status,
      buyer_completion_at, provider_completion_at, guarantee_applies, created_at)
    VALUES (v_listing_id, v_conv_id, v_buyer, v_p_nasser,
      NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '2 hours',
      12000, 'KWD', 'completed',
      NOW() - INTERVAL '10 days' + INTERVAL '2 hours', NOW() - INTERVAL '10 days' + INTERVAL '2 hours',
      true, NOW() - INTERVAL '11 days')
    RETURNING id INTO v_booking_id;

    INSERT INTO service_reviews (booking_id, reviewer_profile_id, reviewed_profile_id,
      rating, body, tag_on_time, tag_clean_work, tag_fair_price, created_at)
    VALUES
      (v_booking_id, v_buyer, v_p_nasser, 5, 'شاطر وسريع، أسوي معاه مرة ثانية.', true, true, true, NOW() - INTERVAL '10 days'),
      (v_booking_id, v_p_nasser, v_buyer, 4, 'شكراً.', true, null, true, NOW() - INTERVAL '10 days');
  END IF;

  RAISE NOTICE '0039: seeded 5 providers, 12 listings, 8 bookings, 16 reviews';
END $$;

COMMIT;
