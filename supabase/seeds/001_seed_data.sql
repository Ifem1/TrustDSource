-- ============================================================
-- Trustdsource - Seed Data
-- ============================================================

-- Seed analytics for last 30 days
DO $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 0..29 LOOP
    INSERT INTO analytics_daily (
      date,
      total_verifications,
      high_credibility_count,
      moderate_credibility_count,
      low_credibility_count,
      misleading_count,
      unverified_count,
      avg_credibility_score,
      avg_source_quality,
      avg_evidence_strength,
      unique_submitters,
      news_count,
      social_count,
      research_count
    ) VALUES (
      CURRENT_DATE - i,
      (RANDOM() * 50 + 10)::INTEGER,
      (RANDOM() * 20 + 5)::INTEGER,
      (RANDOM() * 15 + 3)::INTEGER,
      (RANDOM() * 8 + 1)::INTEGER,
      (RANDOM() * 5 + 1)::INTEGER,
      (RANDOM() * 5 + 1)::INTEGER,
      (RANDOM() * 30 + 50)::DECIMAL(5,2),
      (RANDOM() * 25 + 55)::DECIMAL(5,2),
      (RANDOM() * 25 + 50)::DECIMAL(5,2),
      (RANDOM() * 20 + 5)::INTEGER,
      (RANDOM() * 20 + 5)::INTEGER,
      (RANDOM() * 15 + 3)::INTEGER,
      (RANDOM() * 10 + 2)::INTEGER
    )
    ON CONFLICT (date) DO NOTHING;
  END LOOP;
END $$;
