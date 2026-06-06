-- ============================================================
-- Trustdsource - Views, Triggers, Functions
-- ============================================================

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER verifications_updated_at
  BEFORE UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER analytics_daily_updated_at
  BEFORE UPDATE ON analytics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REPUTATION TIER CALCULATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_reputation_tier(score INTEGER)
RETURNS reputation_tier AS $$
BEGIN
  IF score >= 1000 THEN RETURN 'verification_expert';
  ELSIF score >= 500 THEN RETURN 'trusted_researcher';
  ELSIF score >= 200 THEN RETURN 'researcher';
  ELSIF score >= 50 THEN RETURN 'analyst';
  ELSE RETURN 'new';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- UPDATE REPUTATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_profile_reputation(
  p_wallet TEXT,
  p_delta INTEGER,
  p_reason TEXT,
  p_verification_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_new_score INTEGER;
  v_new_tier reputation_tier;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE wallet_address = p_wallet;
  IF NOT FOUND THEN RETURN; END IF;

  v_new_score := GREATEST(0, v_profile.reputation_score + p_delta);
  v_new_tier := calculate_reputation_tier(v_new_score);

  UPDATE profiles SET
    reputation_score = v_new_score,
    reputation_tier = v_new_tier,
    updated_at = NOW()
  WHERE id = v_profile.id;

  INSERT INTO reputation_history (
    profile_id, previous_score, new_score, delta,
    previous_tier, new_tier, reason, verification_id
  ) VALUES (
    v_profile.id, v_profile.reputation_score, v_new_score, p_delta,
    v_profile.reputation_tier, v_new_tier, p_reason, p_verification_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INCREMENT VERIFICATION COUNT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION on_verification_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'complete' AND OLD.status != 'complete' THEN
    UPDATE profiles
    SET total_verifications = total_verifications + 1
    WHERE wallet_address = NEW.submitter_wallet;

    PERFORM update_profile_reputation(
      NEW.submitter_wallet, 10,
      'Completed verification', NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER verification_complete_trigger
  AFTER UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION on_verification_complete();

-- ============================================================
-- UPDATE DAILY ANALYTICS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_daily_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE vr.verdict = 'HIGH_CREDIBILITY')::INTEGER AS high_cred,
    COUNT(*) FILTER (WHERE vr.verdict = 'MODERATE_CREDIBILITY')::INTEGER AS mod_cred,
    COUNT(*) FILTER (WHERE vr.verdict = 'LOW_CREDIBILITY')::INTEGER AS low_cred,
    COUNT(*) FILTER (WHERE vr.verdict = 'MISLEADING')::INTEGER AS misleading,
    COUNT(*) FILTER (WHERE vr.verdict = 'UNVERIFIED')::INTEGER AS unverified,
    COALESCE(AVG(vr.credibility_score), 0)::DECIMAL(5,2) AS avg_cred,
    COALESCE(AVG(vr.source_quality), 0)::DECIMAL(5,2) AS avg_sq,
    COALESCE(AVG(vr.evidence_strength), 0)::DECIMAL(5,2) AS avg_es,
    COUNT(DISTINCT v.submitter_wallet)::INTEGER AS unique_sub,
    COUNT(*) FILTER (WHERE v.category = 'news')::INTEGER AS news_c,
    COUNT(*) FILTER (WHERE v.category = 'social')::INTEGER AS social_c,
    COUNT(*) FILTER (WHERE v.category = 'research')::INTEGER AS research_c
  INTO v_stats
  FROM verifications v
  LEFT JOIN verification_reports vr ON vr.verification_id = v.id
  WHERE v.created_at::DATE = p_date AND v.status = 'complete';

  INSERT INTO analytics_daily (
    date, total_verifications, high_credibility_count, moderate_credibility_count,
    low_credibility_count, misleading_count, unverified_count,
    avg_credibility_score, avg_source_quality, avg_evidence_strength,
    unique_submitters, news_count, social_count, research_count
  ) VALUES (
    p_date, v_stats.total, v_stats.high_cred, v_stats.mod_cred,
    v_stats.low_cred, v_stats.misleading, v_stats.unverified,
    v_stats.avg_cred, v_stats.avg_sq, v_stats.avg_es,
    v_stats.unique_sub, v_stats.news_c, v_stats.social_c, v_stats.research_c
  )
  ON CONFLICT (date) DO UPDATE SET
    total_verifications = EXCLUDED.total_verifications,
    high_credibility_count = EXCLUDED.high_credibility_count,
    moderate_credibility_count = EXCLUDED.moderate_credibility_count,
    low_credibility_count = EXCLUDED.low_credibility_count,
    misleading_count = EXCLUDED.misleading_count,
    unverified_count = EXCLUDED.unverified_count,
    avg_credibility_score = EXCLUDED.avg_credibility_score,
    avg_source_quality = EXCLUDED.avg_source_quality,
    avg_evidence_strength = EXCLUDED.avg_evidence_strength,
    unique_submitters = EXCLUDED.unique_submitters,
    news_count = EXCLUDED.news_count,
    social_count = EXCLUDED.social_count,
    research_count = EXCLUDED.research_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW verification_full AS
SELECT
  v.*,
  vr.credibility_score,
  vr.confidence,
  vr.source_quality,
  vr.evidence_strength,
  vr.consistency_score,
  vr.bias_risk,
  vr.misinformation_risk,
  vr.verdict,
  vr.reasoning,
  vr.ai_summary,
  vr.supporting_sources,
  vr.conflicting_sources,
  vr.genlayer_proof,
  vr.report_id,
  p.username AS submitter_username,
  p.display_name AS submitter_display_name,
  p.reputation_tier AS submitter_tier,
  p.avatar_url AS submitter_avatar
FROM verifications v
LEFT JOIN verification_reports vr ON vr.verification_id = v.id
LEFT JOIN profiles p ON p.id = v.submitter_id;

CREATE VIEW leaderboard AS
SELECT
  id,
  wallet_address,
  username,
  display_name,
  avatar_url,
  reputation_score,
  reputation_tier,
  total_verifications,
  researcher_score,
  ROW_NUMBER() OVER (ORDER BY reputation_score DESC) AS rank
FROM profiles
WHERE total_verifications > 0
ORDER BY reputation_score DESC;

CREATE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM verifications WHERE status = 'complete') AS total_verifications,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COALESCE(AVG(credibility_score), 0)::INTEGER FROM verification_reports) AS avg_credibility,
  (SELECT COUNT(*) FROM verification_reports WHERE verdict = 'MISLEADING') AS misleading_detected,
  (SELECT COUNT(*) FROM verification_reports WHERE verdict = 'HIGH_CREDIBILITY') AS high_credibility_count;
