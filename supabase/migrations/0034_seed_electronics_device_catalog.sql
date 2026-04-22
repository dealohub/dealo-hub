-- ============================================================================
-- 0034_seed_electronics_device_catalog.sql — Canonical device list (v2 start)
-- ============================================================================
-- Seeds ~40 models spanning the 6 electronics sub-categories. The wizard's
-- catalog-first flow (pillar P1) uses this table as the source of truth —
-- sellers pick from here instead of typing free-text titles.
--
-- Coverage philosophy (GCC-wide, 2026-Q2):
--   - iPhone 12 through 17 Pro Max (most-asked handset family across GCC)
--   - Samsung Galaxy S22 / S23 / S24 Ultra
--   - MacBook Air M1/M2/M3 + Pro 14/16 M3/M4
--   - iPad Pro 11" M4 / iPad Air M2
--   - Apple Watch Series 9 / 10 / Ultra 2
--   - AirPods Pro 2 / Max
--   - PlayStation 5 (disc + digital) / Xbox Series X/S / Switch OLED / Steam Deck
--   - Samsung QLED / LG OLED 55" + 65"
--   - Sony WH-1000XM5 / Bose QC Ultra
--   - Sony A7 IV body / Canon R5 body + a couple of kit lenses
--
-- Launch prices are GCC MSRP in fils (KWD minor units). Used later for
-- price-anomaly warnings (Phase 8+). Null where not tracked.
--
-- Idempotent — ON CONFLICT (slug) DO NOTHING. Safe to re-run.
--
-- Reference: planning/PHASE-7A-ELECTRONICS-V2.md §P1
-- Depends on: 0033_electronics_v2_tables.sql
-- ============================================================================

INSERT INTO public.electronics_device_catalog
  (slug, brand, model, device_kind, storage_gb, ram_gb, screen_size_inches,
   release_year, launch_price_minor_units, display_name, sub_cat)
VALUES

-- ── Phones & Tablets ────────────────────────────────────────────────────
-- iPhone 17 series (2025)
('iphone-17-pro-max-256gb',    'Apple', 'iPhone 17 Pro Max', 'phone', 256, 8, 6.9, 2025, 420000, 'iPhone 17 Pro Max · 256GB', 'phones-tablets'),
('iphone-17-pro-max-512gb',    'Apple', 'iPhone 17 Pro Max', 'phone', 512, 8, 6.9, 2025, 470000, 'iPhone 17 Pro Max · 512GB', 'phones-tablets'),
('iphone-17-pro-256gb',        'Apple', 'iPhone 17 Pro',     'phone', 256, 8, 6.3, 2025, 380000, 'iPhone 17 Pro · 256GB',     'phones-tablets'),
('iphone-17-pro-512gb',        'Apple', 'iPhone 17 Pro',     'phone', 512, 8, 6.3, 2025, 430000, 'iPhone 17 Pro · 512GB',     'phones-tablets'),
-- iPhone 16 series (2024)
('iphone-16-pro-max-256gb',    'Apple', 'iPhone 16 Pro Max', 'phone', 256, 8, 6.9, 2024, 400000, 'iPhone 16 Pro Max · 256GB', 'phones-tablets'),
('iphone-16-pro-256gb',        'Apple', 'iPhone 16 Pro',     'phone', 256, 8, 6.3, 2024, 360000, 'iPhone 16 Pro · 256GB',     'phones-tablets'),
('iphone-16-plus-128gb',       'Apple', 'iPhone 16 Plus',    'phone', 128, 8, 6.7, 2024, 290000, 'iPhone 16 Plus · 128GB',    'phones-tablets'),
('iphone-16-128gb',            'Apple', 'iPhone 16',         'phone', 128, 8, 6.1, 2024, 260000, 'iPhone 16 · 128GB',         'phones-tablets'),
-- iPhone 15 series (2023)
('iphone-15-pro-max-256gb',    'Apple', 'iPhone 15 Pro Max', 'phone', 256, 8, 6.7, 2023, 380000, 'iPhone 15 Pro Max · 256GB', 'phones-tablets'),
('iphone-15-pro-256gb',        'Apple', 'iPhone 15 Pro',     'phone', 256, 8, 6.1, 2023, 340000, 'iPhone 15 Pro · 256GB',     'phones-tablets'),
('iphone-15-plus-128gb',       'Apple', 'iPhone 15 Plus',    'phone', 128, 6, 6.7, 2023, 270000, 'iPhone 15 Plus · 128GB',    'phones-tablets'),
-- iPhone 14 / 13 / 12
('iphone-14-pro-max-256gb',    'Apple', 'iPhone 14 Pro Max', 'phone', 256, 6, 6.7, 2022, 360000, 'iPhone 14 Pro Max · 256GB', 'phones-tablets'),
('iphone-13-pro-256gb',        'Apple', 'iPhone 13 Pro',     'phone', 256, 6, 6.1, 2021, 330000, 'iPhone 13 Pro · 256GB',     'phones-tablets'),
('iphone-12-128gb',            'Apple', 'iPhone 12',         'phone', 128, 4, 6.1, 2020, 260000, 'iPhone 12 · 128GB',         'phones-tablets'),

-- Samsung Galaxy flagships
('galaxy-s24-ultra-512gb',     'Samsung', 'Galaxy S24 Ultra', 'phone', 512, 12, 6.8, 2024, 360000, 'Galaxy S24 Ultra · 512GB', 'phones-tablets'),
('galaxy-s24-ultra-256gb',     'Samsung', 'Galaxy S24 Ultra', 'phone', 256, 12, 6.8, 2024, 330000, 'Galaxy S24 Ultra · 256GB', 'phones-tablets'),
('galaxy-s23-ultra-256gb',     'Samsung', 'Galaxy S23 Ultra', 'phone', 256, 12, 6.8, 2023, 310000, 'Galaxy S23 Ultra · 256GB', 'phones-tablets'),
('galaxy-s22-ultra-256gb',     'Samsung', 'Galaxy S22 Ultra', 'phone', 256, 12, 6.8, 2022, 290000, 'Galaxy S22 Ultra · 256GB', 'phones-tablets'),

-- iPads
('ipad-pro-11-m4-256gb',       'Apple', 'iPad Pro 11" M4',   'tablet', 256, 8, 11.0, 2024, 320000, 'iPad Pro 11" · M4 · 256GB', 'phones-tablets'),
('ipad-air-m2-128gb',          'Apple', 'iPad Air M2',       'tablet', 128, 8, 11.0, 2024, 220000, 'iPad Air · M2 · 128GB',     'phones-tablets'),

-- ── Laptops & Computers ──────────────────────────────────────────────────
('macbook-pro-16-m4-pro-512gb','Apple', 'MacBook Pro 16" M4 Pro', 'laptop',  512, 24, 16.2, 2024, 960000, 'MacBook Pro 16" · M4 Pro · 24GB/512GB', 'laptops-computers'),
('macbook-pro-14-m4-pro-512gb','Apple', 'MacBook Pro 14" M4 Pro', 'laptop',  512, 24, 14.2, 2024, 800000, 'MacBook Pro 14" · M4 Pro · 24GB/512GB', 'laptops-computers'),
('macbook-pro-14-m3-pro-512gb','Apple', 'MacBook Pro 14" M3 Pro', 'laptop',  512, 18, 14.2, 2023, 720000, 'MacBook Pro 14" · M3 Pro · 18GB/512GB', 'laptops-computers'),
('macbook-air-15-m3-512gb',    'Apple', 'MacBook Air 15" M3',     'laptop',  512, 16, 15.3, 2024, 560000, 'MacBook Air 15" · M3 · 16GB/512GB',     'laptops-computers'),
('macbook-air-13-m3-256gb',    'Apple', 'MacBook Air 13" M3',     'laptop',  256, 8,  13.6, 2024, 400000, 'MacBook Air 13" · M3 · 8GB/256GB',      'laptops-computers'),
('macbook-air-13-m2-256gb',    'Apple', 'MacBook Air 13" M2',     'laptop',  256, 8,  13.6, 2022, 360000, 'MacBook Air 13" · M2 · 8GB/256GB',      'laptops-computers'),
('dell-xps-15-i9-1tb',         'Dell',  'XPS 15 9530 i9',         'laptop', 1024, 32, 15.6, 2024, 780000, 'Dell XPS 15 · i9 · 32GB/1TB',           'laptops-computers'),

-- ── TVs & Audio ──────────────────────────────────────────────────────────
('samsung-qled-q80c-65',       'Samsung', 'QLED Q80C 65"', 'tv',       null, null, 65.0, 2023, 280000, 'Samsung QLED Q80C · 65"',    'tvs-audio'),
('samsung-qled-q80c-55',       'Samsung', 'QLED Q80C 55"', 'tv',       null, null, 55.0, 2023, 210000, 'Samsung QLED Q80C · 55"',    'tvs-audio'),
('lg-oled-c3-65',              'LG',      'OLED C3 65"',   'tv',       null, null, 65.0, 2023, 320000, 'LG OLED C3 · 65"',           'tvs-audio'),
('sony-bravia-xr-a95l-65',     'Sony',    'BRAVIA XR A95L 65"', 'tv',  null, null, 65.0, 2023, 420000, 'Sony BRAVIA XR A95L · 65"',  'tvs-audio'),
('sony-wh1000xm5',             'Sony',    'WH-1000XM5',    'headphones', null, null, null, 2022, 110000, 'Sony WH-1000XM5',           'tvs-audio'),
('bose-qc-ultra',              'Bose',    'QuietComfort Ultra','headphones', null, null, null, 2023, 120000, 'Bose QuietComfort Ultra', 'tvs-audio'),
('sonos-beam-gen2',            'Sonos',   'Beam Gen 2',    'soundbar',  null, null, null, 2021, 150000, 'Sonos Beam · Gen 2',        'tvs-audio'),

-- ── Gaming ────────────────────────────────────────────────────────────────
('playstation-5-disc',         'Sony',      'PlayStation 5 Disc',    'console',          825, null, null, 2020, 200000, 'PlayStation 5 · Disc Edition', 'gaming'),
('playstation-5-digital',      'Sony',      'PlayStation 5 Digital', 'console',          825, null, null, 2020, 180000, 'PlayStation 5 · Digital',      'gaming'),
('playstation-5-pro',          'Sony',      'PlayStation 5 Pro',     'console',         2048, null, null, 2024, 280000, 'PlayStation 5 Pro · 2TB',      'gaming'),
('xbox-series-x',              'Microsoft', 'Xbox Series X',         'console',         1024, null, null, 2020, 200000, 'Xbox Series X · 1TB',          'gaming'),
('xbox-series-s',              'Microsoft', 'Xbox Series S',         'console',          512, null, null, 2020, 130000, 'Xbox Series S · 512GB',        'gaming'),
('nintendo-switch-oled',       'Nintendo',  'Switch OLED',           'handheld_console',  64, null, 7.0, 2021, 130000, 'Nintendo Switch · OLED',       'gaming'),
('steam-deck-oled',            'Valve',     'Steam Deck OLED',       'handheld_console',  512, 16,  7.4, 2023, 230000, 'Steam Deck OLED · 512GB',      'gaming'),

-- ── Smart Watches ────────────────────────────────────────────────────────
('apple-watch-ultra-2-49mm',   'Apple', 'Watch Ultra 2 49mm',  'smart_watch', null, null, null, 2023, 240000, 'Apple Watch Ultra 2 · 49mm',  'smart-watches'),
('apple-watch-10-46mm',        'Apple', 'Watch Series 10 46mm','smart_watch', null, null, null, 2024, 160000, 'Apple Watch Series 10 · 46mm', 'smart-watches'),
('apple-watch-9-45mm',         'Apple', 'Watch Series 9 45mm', 'smart_watch', null, null, null, 2023, 140000, 'Apple Watch Series 9 · 45mm',  'smart-watches'),
('galaxy-watch-7-44mm',        'Samsung','Galaxy Watch 7 44mm','smart_watch', null, null, null, 2024, 110000, 'Galaxy Watch 7 · 44mm',        'smart-watches'),
('airpods-pro-2-usbc',         'Apple', 'AirPods Pro 2 USB-C', 'headphones',  null, null, null, 2023,  82000, 'AirPods Pro 2 · USB-C',        'smart-watches'),
('airpods-max-usbc',           'Apple', 'AirPods Max USB-C',   'headphones',  null, null, null, 2024, 195000, 'AirPods Max · USB-C',          'smart-watches'),

-- ── Cameras ──────────────────────────────────────────────────────────────
('sony-alpha-7-iv-body',       'Sony',  'Alpha 7 IV body',   'camera',     null, null, null, 2022, 580000, 'Sony Alpha 7 IV · body only',    'cameras'),
('canon-eos-r5-body',          'Canon', 'EOS R5 body',       'camera',     null, null, null, 2020, 850000, 'Canon EOS R5 · body only',       'cameras'),
('canon-eos-r6-ii-body',       'Canon', 'EOS R6 Mark II body','camera',    null, null, null, 2022, 680000, 'Canon EOS R6 Mark II · body',    'cameras'),
('fuji-xt5-body',              'Fujifilm','X-T5 body',       'camera',     null, null, null, 2022, 520000, 'Fujifilm X-T5 · body only',      'cameras'),
('canon-rf-24-70-f28',         'Canon', 'RF 24-70mm f/2.8L IS','lens',     null, null, null, 2019, 650000, 'Canon RF 24-70mm f/2.8L IS',     'cameras'),
('sony-fe-24-70-gm-ii',        'Sony',  'FE 24-70mm f/2.8 GM II','lens',   null, null, null, 2022, 700000, 'Sony FE 24-70mm f/2.8 GM II',    'cameras')

ON CONFLICT (slug) DO NOTHING;
