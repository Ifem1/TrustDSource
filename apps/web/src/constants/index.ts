export const VERDICT_LABELS: Record<string, string> = {
  HIGH_CREDIBILITY: "High Credibility",
  MODERATE_CREDIBILITY: "Moderate Credibility",
  LOW_CREDIBILITY: "Low Credibility",
  MISLEADING: "Misleading",
  UNVERIFIED: "Unverified",
};

export const VERDICT_COLORS: Record<string, string> = {
  HIGH_CREDIBILITY: "#16a34a",
  MODERATE_CREDIBILITY: "#3b82f6",
  LOW_CREDIBILITY: "#f59e0b",
  MISLEADING: "#ef4444",
  UNVERIFIED: "#9d4edd",
};

export const VERDICT_BG: Record<string, string> = {
  HIGH_CREDIBILITY: "bg-green-100 text-green-800 border-green-200",
  MODERATE_CREDIBILITY: "bg-blue-100 text-blue-800 border-blue-200",
  LOW_CREDIBILITY: "bg-amber-100 text-amber-800 border-amber-200",
  MISLEADING: "bg-red-100 text-red-800 border-red-200",
  UNVERIFIED: "bg-purple-100 text-purple-800 border-purple-200",
};

export const RISK_COLORS: Record<string, string> = {
  LOW: "text-green-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
  CRITICAL: "text-red-700 font-bold",
};

export const RISK_BG: Record<string, string> = {
  LOW: "bg-green-50 text-green-700 border-green-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HIGH: "bg-red-50 text-red-700 border-red-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
};

export const REPUTATION_TIER_LABELS: Record<string, string> = {
  new: "New",
  analyst: "Analyst",
  researcher: "Researcher",
  trusted_researcher: "Trusted Researcher",
  verification_expert: "Verification Expert",
};

export const REPUTATION_TIER_COLORS: Record<string, string> = {
  new: "text-secondaryText",
  analyst: "text-moderateBlue",
  researcher: "text-trustLavender",
  trusted_researcher: "text-graphPurple",
  verification_expert: "text-credibilityGreen",
};

export const REPUTATION_TIER_THRESHOLDS: Record<string, number> = {
  new: 0,
  analyst: 50,
  researcher: 200,
  trusted_researcher: 500,
  verification_expert: 1000,
};

export const CATEGORY_LABELS: Record<string, string> = {
  news: "News Article",
  social: "Social Media Post",
  research: "Research Paper",
  public_statement: "Public Statement",
  blog: "Blog Article",
  press_release: "Press Release",
  breaking_news: "Breaking News",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  snapshot_locked: "Snapshot Locked",
  extracting_claims: "Extracting Claims",
  discovering_sources: "Discovering Sources",
  verifying: "Verifying",
  complete: "Complete",
  failed: "Failed",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "text-secondaryText",
  snapshot_locked: "text-trustLavender",
  extracting_claims: "text-moderateBlue",
  discovering_sources: "text-graphPurple",
  verifying: "text-warningAmber",
  complete: "text-credibilityGreen",
  failed: "text-riskRed",
};

export const GENLAYER_STUDIONET_RPC =
  process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

export const GENLAYER_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "61999"
);

const DEFAULT_UNIFIED_CONTRACT_ADDRESS =
  "0xe90847463f1D9C663c2946B6DE718538F2226d0A";

export const GL_CONTRACT =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  DEFAULT_UNIFIED_CONTRACT_ADDRESS;

export const GL_CONTRACTS = {
  unified: GL_CONTRACT,
};

export const APP_NAME = "Trustdsource";
export const APP_TAGLINE = "Verify. Trace. Trust.";
