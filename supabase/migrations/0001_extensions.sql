-- ============================================================================
-- 0001_extensions.sql — PostgreSQL Extensions
-- ============================================================================
-- Enables required extensions for Dealo Hub V1:
--   * vector  — Semantic search + listing duplicate detection (AI Layer)
--   * pg_trgm — Fuzzy text search for hybrid ranking
--   * citext  — Case-insensitive emails/handles
--   * unaccent— Accent-insensitive Arabic/English search
--
-- Must run FIRST. All other migrations depend on these.
-- ============================================================================

-- pgvector: OpenAI text-embedding-3-small produces 1536-dim vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm: Trigram-based fuzzy search (hybrid with semantic search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- citext: Case-insensitive text (emails, handles)
CREATE EXTENSION IF NOT EXISTS citext;

-- unaccent: Strip Arabic diacritics + Latin accents for better search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Verify
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension not loaded. Enable it in Supabase: Database > Extensions > vector';
  END IF;
  RAISE NOTICE 'Extensions ready: vector, pg_trgm, citext, unaccent';
END $$;
