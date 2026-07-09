/**
 * Trustdsource — unified contract response types.
 *
 * All complex on-chain return values come back as JSON strings.
 * Use safeJsonParse from ./utils before treating them as objects.
 */

export type Claim = {
  claim_text: string;
  claim_type: string;
  confidence: string;
  is_primary: boolean;
  order_index?: number;
};

export type Source = {
  url: string;
  title: string;
  domain: string;
  publication: string;
  credibility_score: number;
  source_type: string;
  is_supporting: boolean;
  relevance_score: string;
  snippet: string;
  evidence_kind?: string;
  evidence_hash?: string;
  verification_note?: string;
};

export type TrustDSourceReport = {
  report_id: string;
  content_hash: string;
  verification_hash?: string;
  snapshot_timestamp?: string;
  status?: string;
  title?: string;
  url?: string;
  category?: string;
  submitter_wallet?: string;
  credibility_score: number;
  confidence: string;
  source_quality: number;
  evidence_strength: number;
  consistency_score: number;
  bias_risk: string;
  misinformation_risk: string;
  verdict: string;
  evidence_model?: string;
  independent_source_count?: number;
  supporting_sources: Source[];
  conflicting_sources: Source[];
  reasoning: string;
  ai_summary: string;
  misinformation_signals?: string[];
  bias_signals?: string[];
  claims: Claim[];
  created_at: string;
};

export type TrustDSourceSnapshot = {
  report_id: string;
  content_hash: string;
  title: string;
  url: string;
  content: string;
  claim_summary: string;
  category: string;
  submitter_wallet: string;
  snapshot_timestamp: string;
  status: string;
  locked: boolean;
  claims: Claim[];
  sources: Source[];
  verification_analysis: Record<string, unknown>;
  final_report: Record<string, unknown>;
  verification_hash: string;
  stored: boolean;
};

export type TrustDSourceProfile = {
  wallet_address: string;
  reputation_score: number;
  reputation_tier: string;
  total_verifications: number;
  last_verification: string;
};

export type TrustDSourceAnalytics = {
  date: string;
  total: number;
  high_credibility: number;
  moderate_credibility: number;
  low_credibility: number;
  misleading: number;
  unverified: number;
  total_score: number;
  avg_score: number;
};

export type PipelineMode = "fast" | "ai";

export type PipelineStatus =
  | "idle"
  | "submitting"
  | "snapshot_locked"
  | "extracting_claims"
  | "claims_extracted"
  | "discovering_sources"
  | "sources_fallback"
  | "sources_analyzed"
  | "verifying_claims"
  | "credibility_deterministic"
  | "credibility_analyzed"
  | "calculating_credibility"
  | "credibility_calculated"
  | "storing_report"
  | "updating_reputation"
  | "reading_final"
  | "complete"
  | "failed";

export const STATUS_LABELS: Record<string, string> = {
  snapshot_locked: "Snapshot locked on-chain",
  claims_extracted: "Claims extracted",
  sources_fallback: "Submitted-source snapshot prepared",
  sources_analyzed: "Evidence references checked",
  credibility_deterministic: "Deterministic credibility analysis complete",
  credibility_analyzed: "Evidence-bounded credibility analysis complete",
  complete: "Verification complete",
};
