-- ============================================================
-- Trustdsource — Recent reports (unified contract migration)
-- ============================================================

CREATE TABLE IF NOT EXISTS recent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  report_id TEXT NOT NULL,
  title TEXT NOT NULL,
  verdict TEXT,
  credibility_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wallet, report_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_reports_wallet_created
  ON recent_reports(wallet, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recent_reports_created
  ON recent_reports(created_at DESC);

ALTER TABLE recent_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recent reports are publicly viewable"
  ON recent_reports FOR SELECT USING (true);

CREATE POLICY "Anyone can insert their own recent report"
  ON recent_reports FOR INSERT WITH CHECK (true);
