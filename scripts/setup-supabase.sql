-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- to set up the complete Trustdsource database schema.
--
-- Order of execution:
-- 1. Run supabase/migrations/001_initial_schema.sql
-- 2. Run supabase/migrations/002_views_and_triggers.sql
-- 3. Run supabase/migrations/003_rls_policies.sql
-- 4. Optionally run supabase/seeds/001_seed_data.sql for demo data

-- Quick verification query - run after migrations to confirm setup:
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables_created,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') AS views_created,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') AS triggers_created;
