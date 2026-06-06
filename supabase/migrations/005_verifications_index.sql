-- ============================================================
-- Trustdsource — Verifications index
-- Mirror of contract reports for search, filtering, pagination.
-- ============================================================

CREATE TABLE IF NOT EXISTS verifications_index (
  report_id           TEXT PRIMARY KEY,
  wallet              TEXT NOT NULL,
  title               TEXT NOT NULL,
  url                 TEXT,
  category            TEXT,
  verdict             TEXT,
  credibility_score   INTEGER,
  source_quality      INTEGER,
  evidence_strength   INTEGER,
  consistency_score   INTEGER,
  bias_risk           TEXT,
  misinformation_risk TEXT,
  confidence          NUMERIC,
  reputation_at_time  INTEGER,
  reputation_tier_at_time TEXT,
  ai_summary          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  indexed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vi_wallet_created
  ON verifications_index(wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vi_created
  ON verifications_index(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vi_category
  ON verifications_index(category);
CREATE INDEX IF NOT EXISTS idx_vi_verdict
  ON verifications_index(verdict);
CREATE INDEX IF NOT EXISTS idx_vi_title_trgm
  ON verifications_index USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vi_score
  ON verifications_index(credibility_score DESC);

ALTER TABLE verifications_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Index is publicly viewable"
  ON verifications_index FOR SELECT USING (true);

CREATE POLICY "Anyone can write to index (service role enforced at API)"
  ON verifications_index FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update index"
  ON verifications_index FOR UPDATE USING (true);

-- ============================================================
-- Leaderboard view (cheap aggregate over the index)
-- ============================================================

CREATE OR REPLACE VIEW leaderboard_index AS
SELECT
  wallet,
  COUNT(*) AS total_verifications,
  COALESCE(MAX(reputation_at_time), 0) AS reputation_score,
  COALESCE(
    (ARRAY_AGG(reputation_tier_at_time ORDER BY created_at DESC))[1],
    'new'
  ) AS reputation_tier,
  AVG(credibility_score)::INTEGER AS avg_credibility_score,
  MAX(created_at) AS last_verification_at
FROM verifications_index
GROUP BY wallet
ORDER BY reputation_score DESC, total_verifications DESC;
