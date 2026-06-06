"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import {
  getProfile,
  getAnalytics,
  getTotalVerifications,
} from "@/lib/trustdsource/service";
import { getRecentReports } from "@/lib/genlayer/pipeline";
import type {
  TrustDSourceProfile,
  TrustDSourceAnalytics,
} from "@/lib/trustdsource/types";
import {
  REPUTATION_TIER_LABELS,
  REPUTATION_TIER_THRESHOLDS,
  VERDICT_BG,
  VERDICT_LABELS,
} from "@/constants";
import { cn, formatNumber, formatTimeAgo } from "@/lib/utils";

const TIER_ICONS: Record<string, string> = {
  new: "🌱",
  analyst: "🔍",
  researcher: "📊",
  trusted_researcher: "⭐",
  verification_expert: "🏆",
};
const TIER_ORDER = [
  "new",
  "analyst",
  "researcher",
  "trusted_researcher",
  "verification_expert",
];

interface IndexRow {
  report_id: string;
  title: string;
  verdict: string | null;
  credibility_score: number | null;
  created_at: string;
}

export default function DashboardPage() {
  const { address, isConnected } = useWallet();
  const [profile, setProfile] = useState<TrustDSourceProfile | null>(null);
  const [analytics, setAnalytics] = useState<TrustDSourceAnalytics | null>(null);
  const [totalPlatform, setTotalPlatform] = useState<number>(0);
  const [recent, setRecent] = useState<IndexRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const [p, a, t] = await Promise.all([
        getProfile(address!),
        getAnalytics("all_time"),
        getTotalVerifications(),
      ]);
      if (cancelled) return;
      if (p.data) setProfile(p.data);
      if (a.data) setAnalytics(a.data);
      if (t.data != null) setTotalPlatform(Number(t.data));

      // Try Supabase index first, fall back to localStorage
      try {
        const res = await fetch(
          `/api/index?wallet=${encodeURIComponent(address!)}&limit=5`
        );
        const json = await res.json();
        if (!cancelled && Array.isArray(json.data) && json.data.length > 0) {
          setRecent(json.data as IndexRow[]);
        } else if (!cancelled) {
          const local = getRecentReports().slice(0, 5);
          setRecent(
            local.map((r) => ({
              report_id: r.reportId,
              title: r.title,
              verdict: r.verdict ?? null,
              credibility_score: r.credibility_score ?? null,
              created_at: new Date(r.timestamp).toISOString(),
            }))
          );
        }
      } catch {
        if (!cancelled) {
          const local = getRecentReports().slice(0, 5);
          setRecent(
            local.map((r) => ({
              report_id: r.reportId,
              title: r.title,
              verdict: r.verdict ?? null,
              credibility_score: r.credibility_score ?? null,
              created_at: new Date(r.timestamp).toISOString(),
            }))
          );
        }
      }

      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background bg-mesh">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="card p-12 text-center max-w-md">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-primaryText mb-3">
              Connect your wallet
            </h2>
            <p className="text-secondaryText text-sm mb-6">
              Your dashboard reads on-chain reputation, analytics, and recent
              verifications.
            </p>
            <WalletConnectButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tier = profile?.reputation_tier ?? "new";
  const repScore = profile?.reputation_score ?? 0;
  const totalVerified = profile?.total_verifications ?? 0;
  const currentTierIndex = TIER_ORDER.indexOf(tier);
  const nextTier =
    currentTierIndex < TIER_ORDER.length - 1
      ? TIER_ORDER[currentTierIndex + 1]
      : null;
  const currentThreshold = REPUTATION_TIER_THRESHOLDS[tier] ?? 0;
  const nextThreshold = nextTier ? REPUTATION_TIER_THRESHOLDS[nextTier] : null;
  const progress =
    nextThreshold && nextThreshold > currentThreshold
      ? ((repScore - currentThreshold) / (nextThreshold - currentThreshold)) *
        100
      : 100;

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primaryText">Dashboard</h1>
            <p className="text-secondaryText mt-1">
              Your on-chain verification activity and reputation
            </p>
          </div>
          <Link href="/verify" className="btn-primary">
            New Verification
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Profile + Quick Stats */}
          <div className="space-y-6">
            {loading ? (
              <div className="card p-6 animate-pulse">
                <div className="h-20 bg-border rounded mb-4" />
                <div className="h-4 bg-border rounded w-2/3 mb-2" />
                <div className="h-4 bg-border rounded w-1/2" />
              </div>
            ) : (
              <div className="card p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{TIER_ICONS[tier]}</span>
                    <div>
                      <p className="font-bold text-primaryText text-lg">
                        {REPUTATION_TIER_LABELS[tier] ?? tier}
                      </p>
                      <p className="text-xs text-secondaryText">On-chain</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-graphPurple">
                      {repScore}
                    </p>
                    <p className="text-xs text-secondaryText">points</p>
                  </div>
                </div>

                {nextTier && (
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-secondaryText">
                        Progress to {REPUTATION_TIER_LABELS[nextTier] ?? nextTier}
                      </span>
                      <span className="text-xs font-semibold text-primaryText">
                        {repScore} / {nextThreshold}
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-graphPurple to-trustLavender transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(0, progress))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surfaceSoft rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">📋</div>
                  <p className="text-xl font-bold text-primaryText">
                    {formatNumber(totalVerified)}
                  </p>
                  <p className="text-xs text-secondaryText">Verifications</p>
                </div>
                <div className="bg-surfaceSoft rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">⭐</div>
                  <p className="text-xl font-bold text-primaryText">
                    {formatNumber(repScore)}
                  </p>
                  <p className="text-xs text-secondaryText">Reputation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle — Recent verifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-primaryText text-lg">
                Recent Verifications
              </h2>
              <Link
                href="/history"
                className="text-sm text-graphPurple hover:text-trustLavender transition-colors"
              >
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-3xl mb-3">📋</div>
                <p className="text-secondaryText text-sm mb-4">
                  No verifications yet.
                </p>
                <Link href="/verify" className="btn-primary inline-block">
                  Start Verifying
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((r) => (
                  <Link
                    key={r.report_id}
                    href={`/report/${r.report_id}`}
                    className="card p-4 flex items-start gap-4 hover:border-trustLavender transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primaryText truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-secondaryText mt-1">
                        {formatTimeAgo(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.credibility_score != null && (
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              r.credibility_score >= 80
                                ? "#16a34a"
                                : r.credibility_score >= 55
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        >
                          {r.credibility_score}
                        </span>
                      )}
                      {r.verdict && VERDICT_BG[r.verdict] && (
                        <span
                          className={cn("badge text-xs", VERDICT_BG[r.verdict])}
                        >
                          {VERDICT_LABELS[r.verdict] ?? r.verdict}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right — Platform analytics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-primaryText text-lg">
                Platform Analytics
              </h2>
              <Link
                href="/analytics"
                className="text-sm text-graphPurple hover:text-trustLavender transition-colors"
              >
                Full view
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Verifications",
                  value: totalPlatform || analytics?.total || 0,
                  color: "text-graphPurple",
                  icon: "📊",
                },
                {
                  label: "Avg Credibility",
                  value: analytics ? `${analytics.avg_score}/100` : "0/100",
                  color: "text-credibilityGreen",
                  icon: "⭐",
                },
                {
                  label: "Misleading Detected",
                  value: analytics?.misleading ?? 0,
                  color: "text-riskRed",
                  icon: "⚠️",
                },
                {
                  label: "High Credibility",
                  value: analytics?.high_credibility ?? 0,
                  color: "text-credibilityGreen",
                  icon: "✅",
                },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-secondaryText mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
