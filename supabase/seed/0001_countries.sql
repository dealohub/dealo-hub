-- ============================================================================
-- 0001_countries.sql — Countries Seed (6 GCC States)
-- ============================================================================
-- V1: only KW is active. Others are "activatable" in Phase 2 (flip is_active).
-- Source: planning/GCC-READINESS.md
--
-- Usage:
--   psql $SUPABASE_DB_URL -f supabase/seed/0001_countries.sql
-- ============================================================================

BEGIN;

-- Clear and re-seed (idempotent)
DELETE FROM countries WHERE code IN ('KW', 'SA', 'AE', 'BH', 'QA', 'OM');

INSERT INTO countries (code, name_ar, name_en, currency_code, phone_code, is_active, sort_order) VALUES
  ('KW', 'الكويت',    'Kuwait',        'KWD', '+965', true,  1),   -- V1 active
  ('SA', 'السعودية',  'Saudi Arabia',  'SAR', '+966', false, 2),   -- Phase 2/3
  ('AE', 'الإمارات',  'UAE',           'AED', '+971', false, 3),   -- Phase 2/3
  ('BH', 'البحرين',   'Bahrain',       'BHD', '+973', false, 4),   -- Phase 3
  ('QA', 'قطر',        'Qatar',         'QAR', '+974', false, 5),   -- Phase 3
  ('OM', 'عُمان',      'Oman',          'OMR', '+968', false, 6);   -- Phase 3

-- Verify
DO $$
DECLARE
  active_count INT;
  total_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM countries;
  SELECT COUNT(*) INTO active_count FROM countries WHERE is_active = true;

  IF total_count != 6 THEN
    RAISE EXCEPTION 'Expected 6 countries, got %', total_count;
  END IF;

  IF active_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 active country (KW), got %', active_count;
  END IF;

  RAISE NOTICE 'Countries seeded: 6 total, % active (KW only in V1)', active_count;
END $$;

COMMIT;

-- ============================================================================
-- Activation checklist (Phase 2+)
-- ============================================================================
-- To activate UAE:
--   UPDATE countries SET is_active = true WHERE code = 'AE';
--   -- Then seed UAE cities + areas
--   -- Update marketing, run regression tests
-- ============================================================================
