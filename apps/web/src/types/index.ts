export type VerificationStatus =
  | "pending"
  | "snapshot_locked"
  | "extracting_claims"
  | "discovering_sources"
  | "verifying"
  | "complete"
  | "failed";

export type VerdictType =
  | "HIGH_CREDIBILITY"
  | "MODERATE_CREDIBILITY"
  | "LOW_CREDIBILITY"
  | "MISLEADING"
  | "UNVERIFIED";

export type ContentCategory =
  | "news"
  | "social"
  | "research"
  | "public_statement"
  | "blog"
  | "press_release"
  | "breaking_news"
  | "other";

export type ReputationTier =
  | "new"
  | "analyst"
  | "researcher"
  | "trusted_researcher"
  | "verification_expert";

export type BiasRisk = "LOW" | "MEDIUM" | "HIGH";
export type MisinformationRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Profile {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  reputation_score: number;
  reputation_tier: ReputationTier;
  total_verifications: number;
  accurate_verifications: number;
  researcher_score: number;
  is_researcher: boolean;
  genlayer_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Verification {
  id: string;
  submitter_wallet: string;
  submitter_id: string | null;
  title: string;
  url: string | null;
  content: string;
  claim_summary: string | null;
  category: ContentCategory;
  content_hash: string;
  verification_hash: string | null;
  snapshot_timestamp: string;
  status: VerificationStatus;
  genlayer_tx_hash: string | null;
  genlayer_report_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  verification_id: string;
  claim_text: string;
  claim_type: string;
  confidence: number | null;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export interface Source {
  id: string;
  verification_id: string;
  url: string;
  title: string | null;
  domain: string | null;
  publication: string | null;
  credibility_score: number | null;
  source_type: string;
  is_supporting: boolean;
  relevance_score: number | null;
  snippet: string | null;
  discovered_at: string;
}

export interface VerificationReport {
  id: string;
  verification_id: string;
  report_id: string;
  credibility_score: number;
  confidence: number;
  source_quality: number;
  evidence_strength: number;
  consistency_score: number;
  bias_risk: BiasRisk;
  misinformation_risk: MisinformationRisk;
  verdict: VerdictType;
  supporting_sources: Source[];
  conflicting_sources: Source[];
  reasoning: string | null;
  ai_summary: string | null;
  genlayer_proof: Record<string, unknown> | null;
  consensus_data: Record<string, unknown> | null;
  created_at: string;
}

export interface VerificationFull extends Verification {
  credibility_score: number | null;
  confidence: number | null;
  source_quality: number | null;
  evidence_strength: number | null;
  consistency_score: number | null;
  bias_risk: BiasRisk | null;
  misinformation_risk: MisinformationRisk | null;
  verdict: VerdictType | null;
  reasoning: string | null;
  ai_summary: string | null;
  supporting_sources: Source[] | null;
  conflicting_sources: Source[] | null;
  genlayer_proof: Record<string, unknown> | null;
  report_id: string | null;
  submitter_username: string | null;
  submitter_display_name: string | null;
  submitter_tier: ReputationTier | null;
  submitter_avatar: string | null;
}

export interface ReputationHistory {
  id: string;
  profile_id: string;
  previous_score: number;
  new_score: number;
  delta: number;
  previous_tier: ReputationTier;
  new_tier: ReputationTier;
  reason: string;
  verification_id: string | null;
  created_at: string;
}

export interface AnalyticsDaily {
  id: string;
  date: string;
  total_verifications: number;
  high_credibility_count: number;
  moderate_credibility_count: number;
  low_credibility_count: number;
  misleading_count: number;
  unverified_count: number;
  avg_credibility_score: number;
  avg_source_quality: number;
  avg_evidence_strength: number;
  unique_submitters: number;
  news_count: number;
  social_count: number;
  research_count: number;
}

export interface PlatformStats {
  total_verifications: number;
  total_users: number;
  avg_credibility: number;
  misleading_detected: number;
  high_credibility_count: number;
}

export interface SubmitContentForm {
  title: string;
  url: string;
  content: string;
  claim_summary: string;
  category: ContentCategory;
  evidence_urls?: string;
}

export interface GenLayerReport {
  report_id: string;
  content_hash: string;
  verification_hash: string;
  snapshot_timestamp: string;
  status: string;
  title: string;
  url: string;
  category: string;
  submitter_wallet: string;
  credibility_score: number;
  confidence: number;
  source_quality: number;
  evidence_strength: number;
  bias_risk: BiasRisk;
  misinformation_risk: MisinformationRisk;
  verdict: VerdictType;
  evidence_model?: string;
  independent_source_count?: number;
  supporting_sources: GenLayerSource[];
  conflicting_sources: GenLayerSource[];
  reasoning: string;
  ai_summary: string;
  claims: GenLayerClaim[];
  created_at: string;
}

export interface GenLayerSource {
  url: string;
  title: string;
  domain: string;
  publication: string;
  credibility_score: number;
  source_type: string;
  is_supporting: boolean;
  relevance_score: number;
  snippet: string;
  evidence_kind?: string;
  evidence_hash?: string;
  verification_note?: string;
}

export interface GenLayerClaim {
  claim_text: string;
  claim_type: string;
  confidence: number;
  is_primary: boolean;
}

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  reputation_score: number;
  reputation_tier: ReputationTier;
  total_verifications: number;
  researcher_score: number;
  rank: number;
}
