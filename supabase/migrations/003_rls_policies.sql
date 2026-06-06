-- ============================================================
-- Trustdsource - Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

CREATE POLICY "Profiles are publicly viewable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (wallet_address = current_setting('app.wallet_address', true));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (wallet_address = current_setting('app.wallet_address', true));

-- ============================================================
-- VERIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "Verifications are publicly viewable"
  ON verifications FOR SELECT
  USING (true);

CREATE POLICY "Authenticated wallets can submit verifications"
  ON verifications FOR INSERT
  WITH CHECK (submitter_wallet = current_setting('app.wallet_address', true));

CREATE POLICY "Service role can update verifications"
  ON verifications FOR UPDATE
  USING (true);

-- ============================================================
-- CLAIMS POLICIES
-- ============================================================

CREATE POLICY "Claims are publicly viewable"
  ON claims FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert claims"
  ON claims FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SOURCES POLICIES
-- ============================================================

CREATE POLICY "Sources are publicly viewable"
  ON sources FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert sources"
  ON sources FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- VERIFICATION REPORTS POLICIES
-- ============================================================

CREATE POLICY "Reports are publicly viewable"
  ON verification_reports FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert reports"
  ON verification_reports FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- SAVED REPORTS POLICIES
-- ============================================================

CREATE POLICY "Users can view their saved reports"
  ON saved_reports FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE wallet_address = current_setting('app.wallet_address', true)
    )
  );

CREATE POLICY "Users can save reports"
  ON saved_reports FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles
      WHERE wallet_address = current_setting('app.wallet_address', true)
    )
  );

CREATE POLICY "Users can unsave reports"
  ON saved_reports FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE wallet_address = current_setting('app.wallet_address', true)
    )
  );

-- ============================================================
-- REPUTATION HISTORY POLICIES
-- ============================================================

CREATE POLICY "Reputation history is publicly viewable"
  ON reputation_history FOR SELECT
  USING (true);

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE wallet_address = current_setting('app.wallet_address', true)
    )
  );

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE wallet_address = current_setting('app.wallet_address', true)
    )
  );

-- ============================================================
-- ANALYTICS POLICIES
-- ============================================================

CREATE POLICY "Analytics are publicly viewable"
  ON analytics_daily FOR SELECT
  USING (true);

-- ============================================================
-- AUDIT LOG POLICIES
-- ============================================================

CREATE POLICY "Audit log viewable by service role only"
  ON audit_log FOR SELECT
  USING (false);
