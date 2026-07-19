import {
  getAnalytics,
  getProfile,
  getRecentReportIds,
  getReport,
} from "./service";
import { isEmptyReport } from "./utils";
import type { TrustDSourceReport } from "./types";

export interface ContractReportRow {
  report_id: string;
  wallet: string;
  title: string;
  url: string | null;
  category: string | null;
  verdict: string | null;
  credibility_score: number | null;
  source_quality?: number | null;
  evidence_strength?: number | null;
  consistency_score?: number | null;
  bias_risk?: string | null;
  misinformation_risk?: string | null;
  confidence?: number | null;
  ai_summary?: string | null;
  created_at: string;
}

export interface ContractLeaderboardRow {
  wallet: string;
  total_verifications: number;
  reputation_score: number;
  reputation_tier: string;
  avg_credibility_score: number;
  rank: number;
}

function toReportRow(report: TrustDSourceReport): ContractReportRow {
  const rawCreatedAt = report.created_at ? String(report.created_at) : "";
  const createdAt = rawCreatedAt || String(report.snapshot_timestamp ?? "");

  return {
    report_id: String(report.report_id ?? ""),
    wallet: String(report.submitter_wallet ?? ""),
    title: String(report.title ?? report.report_id ?? "Untitled report"),
    url: report.url ? String(report.url) : null,
    category: report.category ? String(report.category) : null,
    verdict: report.verdict ? String(report.verdict) : null,
    credibility_score:
      report.credibility_score != null
        ? Number(report.credibility_score)
        : null,
    source_quality:
      report.source_quality != null ? Number(report.source_quality) : null,
    evidence_strength:
      report.evidence_strength != null
        ? Number(report.evidence_strength)
        : null,
    consistency_score:
      report.consistency_score != null
        ? Number(report.consistency_score)
        : null,
    bias_risk: report.bias_risk ? String(report.bias_risk) : null,
    misinformation_risk: report.misinformation_risk
      ? String(report.misinformation_risk)
      : null,
    confidence:
      report.confidence != null ? Number(report.confidence) : null,
    ai_summary: report.ai_summary ? String(report.ai_summary) : null,
    created_at: createdAt,
  };
}

export async function getRecentContractReports(
  limit = 25
): Promise<ContractReportRow[]> {
  const idsRes = await getRecentReportIds(limit);
  if (idsRes.error || !Array.isArray(idsRes.data)) return [];

  const reports = await Promise.all(
    idsRes.data.map(async (id) => {
      const reportRes = await getReport(id);
      if (reportRes.error || !reportRes.data || isEmptyReport(reportRes.data)) {
        return null;
      }
      return toReportRow(reportRes.data);
    })
  );

  return reports
    .filter((row): row is ContractReportRow => Boolean(row?.report_id))
    .sort(
      (a, b) => {
        const bTime = new Date(b.created_at).getTime();
        const aTime = new Date(a.created_at).getTime();
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      }
    );
}

export function filterReportRows(
  rows: ContractReportRow[],
  filters: {
    wallet?: string | null;
    category?: string | null;
    verdict?: string | null;
    q?: string | null;
  }
): ContractReportRow[] {
  const wallet = filters.wallet?.toLowerCase();
  const q = filters.q?.trim().toLowerCase();

  return rows.filter((row) => {
    if (wallet && row.wallet.toLowerCase() !== wallet) return false;
    if (filters.category && row.category !== filters.category) return false;
    if (filters.verdict && row.verdict !== filters.verdict) return false;
    if (q && !row.title.toLowerCase().includes(q)) return false;
    return true;
  });
}

export async function getContractLeaderboard(
  limit = 50
): Promise<ContractLeaderboardRow[]> {
  const rows = await getRecentContractReports(Math.max(limit * 4, 50));
  const grouped = new Map<
    string,
    { total: number; scoreTotal: number; scoreCount: number }
  >();

  for (const row of rows) {
    if (!row.wallet) continue;
    const current = grouped.get(row.wallet) ?? {
      total: 0,
      scoreTotal: 0,
      scoreCount: 0,
    };
    current.total += 1;
    if (row.credibility_score != null) {
      current.scoreTotal += row.credibility_score;
      current.scoreCount += 1;
    }
    grouped.set(row.wallet, current);
  }

  const entries = await Promise.all(
    Array.from(grouped.entries()).map(async ([wallet, stats]) => {
      const profileRes = await getProfile(wallet);
      return {
        wallet,
        total_verifications:
          Number(profileRes.data?.total_verifications) || stats.total,
        reputation_score: Number(profileRes.data?.reputation_score ?? 0),
        reputation_tier: String(profileRes.data?.reputation_tier ?? "new"),
        avg_credibility_score: stats.scoreCount
          ? Math.round(stats.scoreTotal / stats.scoreCount)
          : 0,
        rank: 0,
      };
    })
  );

  return entries
    .sort(
      (a, b) =>
        b.reputation_score - a.reputation_score ||
        b.total_verifications - a.total_verifications
    )
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getPlatformStatsFromContract() {
  const [analyticsRes, rows] = await Promise.all([
    getAnalytics("all_time"),
    getRecentContractReports(100),
  ]);
  const analytics = analyticsRes.data;
  const uniqueWallets = new Set(rows.map((row) => row.wallet).filter(Boolean));

  return {
    total_verifications: Number(analytics?.total ?? rows.length),
    total_users: uniqueWallets.size,
    avg_credibility: Number(analytics?.avg_score ?? 0),
    misleading_detected: Number(analytics?.misleading ?? 0),
    high_credibility_count: Number(analytics?.high_credibility ?? 0),
  };
}
