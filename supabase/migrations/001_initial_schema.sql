-- ============================================================
-- Trustdsource - Initial Schema Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE verification_status AS ENUM (
  'pending',
  'snapshot_locked',
  'extracting_claims',
  'discovering_sources',
  'verifying',
  'complete',
  'failed'
);

CREATE TYPE verdict_type AS ENUM (
  'HIGH_CREDIBILITY',
  'MODERATE_CREDIBILITY',
  'LOW_CREDIBILITY',
  'MISLEADING',
  'UNVERIFIED'
);

CREATE TYPE content_category AS ENUM (
  'news',
  'social',
  'research',
  'public_statement',
  'blog',
  'press_release',
  'breaking_news',
  'other'
);

CREATE TYPE reputation_tier AS ENUM (
  'new',
  'analyst',
  'researcher',
  'trusted_researcher',
  'verification_expert'
);

CREATE TYPE bias_risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE misinformation_risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  reputation_tier reputation_tier NOT NULL DEFAULT 'new',
  total_verifications INTEGER NOT NULL DEFAULT 0,
  accurate_verifications INTEGER NOT NULL DEFAULT 0,
  researcher_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_researcher BOOLEAN NOT NULL DEFAULT false,
  genlayer_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_reputation_tier ON profiles(reputation_tier);
CREATE INDEX idx_profiles_reputation_score ON profiles(reputation_score DESC);

-- ============================================================
-- VERIFICATIONS TABLE
-- ============================================================

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitter_wallet TEXT NOT NULL,
  submitter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT NOT NULL,
  claim_summary TEXT,
  category content_category NOT NULL DEFAULT 'news',
  content_hash TEXT NOT NULL,
  verification_hash TEXT,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status verification_status NOT NULL DEFAULT 'pending',
  genlayer_tx_hash TEXT,
  genlayer_report_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT content_hash_unique UNIQUE (content_hash)
);

CREATE INDEX idx_verifications_submitter_wallet ON verifications(submitter_wallet);
CREATE INDEX idx_verifications_submitter_id ON verifications(submitter_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_category ON verifications(category);
CREATE INDEX idx_verifications_created_at ON verifications(created_at DESC);
CREATE INDEX idx_verifications_content_hash ON verifications(content_hash);
CREATE INDEX idx_verifications_title_trgm ON verifications USING gin(title gin_trgm_ops);

-- ============================================================
-- CLAIMS TABLE
-- ============================================================

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'factual',
  confidence DECIMAL(4,3),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_verification ON claims(verification_id);

-- ============================================================
-- SOURCES TABLE
-- ============================================================

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  domain TEXT,
  publication TEXT,
  credibility_score INTEGER,
  source_type TEXT NOT NULL DEFAULT 'web',
  is_supporting BOOLEAN NOT NULL DEFAULT true,
  relevance_score DECIMAL(4,3),
  snippet TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_verification ON sources(verification_id);
CREATE INDEX idx_sources_domain ON sources(domain);
CREATE INDEX idx_sources_is_supporting ON sources(is_supporting);

-- ============================================================
-- VERIFICATION REPORTS TABLE
-- ============================================================

CREATE TABLE verification_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  report_id TEXT UNIQUE NOT NULL,
  credibility_score INTEGER NOT NULL DEFAULT 0 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  confidence DECIMAL(4,3) NOT NULL DEFAULT 0,
  source_quality INTEGER NOT NULL DEFAULT 0 CHECK (source_quality >= 0 AND source_quality <= 100),
  evidence_strength INTEGER NOT NULL DEFAULT 0 CHECK (evidence_strength >= 0 AND evidence_strength <= 100),
  consistency_score INTEGER NOT NULL DEFAULT 0 CHECK (consistency_score >= 0 AND consistency_score <= 100),
  bias_risk bias_risk_level NOT NULL DEFAULT 'LOW',
  misinformation_risk misinformation_risk_level NOT NULL DEFAULT 'LOW',
  verdict verdict_type NOT NULL DEFAULT 'UNVERIFIED',
  supporting_sources JSONB NOT NULL DEFAULT '[]',
  conflicting_sources JSONB NOT NULL DEFAULT '[]',
  reasoning TEXT,
  ai_summary TEXT,
  genlayer_proof JSONB,
  consensus_data JSONB,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_verification ON verification_reports(verification_id);
CREATE INDEX idx_reports_report_id ON verification_reports(report_id);
CREATE INDEX idx_reports_verdict ON verification_reports(verdict);
CREATE INDEX idx_reports_credibility_score ON verification_reports(credibility_score DESC);
CREATE INDEX idx_reports_created_at ON verification_reports(created_at DESC);

-- ============================================================
-- SAVED REPORTS TABLE
-- ============================================================

CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, verification_id)
);

CREATE INDEX idx_saved_reports_profile ON saved_reports(profile_id);

-- ============================================================
-- REPUTATION HISTORY TABLE
-- ============================================================

CREATE TABLE reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  previous_tier reputation_tier NOT NULL,
  new_tier reputation_tier NOT NULL,
  reason TEXT NOT NULL,
  verification_id UUID REFERENCES verifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reputation_history_profile ON reputation_history(profile_id);
CREATE INDEX idx_reputation_history_created ON reputation_history(created_at DESC);

-- ============================================================
-- ANALYTICS TABLE
-- ============================================================

CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_verifications INTEGER NOT NULL DEFAULT 0,
  high_credibility_count INTEGER NOT NULL DEFAULT 0,
  moderate_credibility_count INTEGER NOT NULL DEFAULT 0,
  low_credibility_count INTEGER NOT NULL DEFAULT 0,
  misleading_count INTEGER NOT NULL DEFAULT 0,
  unverified_count INTEGER NOT NULL DEFAULT 0,
  avg_credibility_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_source_quality DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_evidence_strength DECIMAL(5,2) NOT NULL DEFAULT 0,
  unique_submitters INTEGER NOT NULL DEFAULT 0,
  news_count INTEGER NOT NULL DEFAULT 0,
  social_count INTEGER NOT NULL DEFAULT 0,
  research_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);

-- ============================================================
-- AUDIT LOG TABLE
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile ON notifications(profile_id);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read) WHERE is_read = false;
