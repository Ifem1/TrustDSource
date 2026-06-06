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
import { cn, formatNumber, formatTimeAgo, truncateAddress } from "@/lib/utils";

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
    setLoading(true);

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

      // Always flip loading off, even if cancelled (avoids stuck skeleton)
      setLoading(false);
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

  // Safe defaults so the page always renders, even when profile is empty
  const tier = profile?.reputation_tier || "new";
  const repScore = profile?.reputation_score ?? 0;
  const totalVerified = profile?.total_verifications ?? 0;
  const currentTierIndex = TIER_ORDER.indexOf(tier);
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < TIER_ORDER.length - 1
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
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primaryText">Dashboard</h1>
            <p className="text-secondaryText mt-1">
              On-chain verification activity for{" "}
              <span className="font-mono text-xs">
                {truncateAddress(address ?? "")}
              </span>
            </p>
          </div>
          <Link href="/verify" className="btn-primary">
            New Verification
          </Link>
        </div>

        {/* Top KPI row — full width, four equal cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon="📋"
            label="Your Verifications"
            value={formatNumber(totalVerified)}
            color="text-graphPurple"
            loading={loading}
          />
          <KpiCard
            icon="⭐"
            label="Your Reputation"
            value={formatNumber(repScore)}
            color="text-credibilityGreen"
            loading={loading}
          />
          <KpiCard
            icon="🌐"
            label="Platform Total"
            value={formatNumber(totalPlatform || analytics?.total || 0)}
            color="text-moderateBlue"
            loading={loading}
          />
          <KpiCard
            icon="📊"
            label="Avg Credibility"
            value={analytics ? `${analytics.avg_score}/100` : "—"}
            color="text-credibilityGreen"
            loading={loading}
          />
        </div>

        {/* Main grid: profile (sidebar) + recent verifications + platform breakdown */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left — Profile + tier ladder */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{TIER_ICONS[tier]}</span>
                  <div>
                    <p className="font-bold text-primaryText text-lg">
                      {REPUTATION_TIER_LABELS[tier] ?? tier}
                    </p>
                    <p className="text-xs text-secondaryText">
                      On-chain reputation
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surfaceSoft rounded-xl p-4 text-center">
                <p className="text-4xl font-black text-graphPurple">{repScore}</p>
                <p className="text-xs text-secondaryText mt-1">reputation points</p>
              </div>

              {nextTier && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-secondaryText">
                      Next: {REPUTATION_TIER_LABELS[nextTier] ?? nextTier}
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

              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-secondaryText mb-2 uppercase tracking-wider">
                  Tier ladder
                </p>
                <div className="flex justify-between items-center">
                  {TIER_ORDER.map((t, i) => (
                    <div
                      key={t}
                      className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        i <= currentTierIndex ? "opacity-100" : "opacity-40"
                      )}
                    >
                      <span
                        className={cn(
                          "text-lg",
                          t === tier && "scale-125"
                        )}
                      >
                        {TIER_ICONS[t]}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          t === tier
                            ? "text-graphPurple font-bold"
                            : "text-secondaryText"
                        )}
                      >
                        {REPUTATION_TIER_THRESHOLDS[t]}+
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={`/profile/${address}`}
              className="btn-secondary w-full block text-center"
            >
              View your public profile →
            </Link>
          </div>

          {/* Middle — Recent verifications */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primaryText text-lg">
                Your Recent Verifications
              </h2>
              <Link
                href="/history"
                className="text-sm text-graphPurple hover:text-trustLavender transition-colors"
              >
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-4 bg-border rounded w-2/3 mb-2" />
                    <div className="h-3 bg-border rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-4xl mb-3">📋</div>
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
                      <p className="text-sm font-semibold text-primaryText line-clamp-1">
                        {r.title}
                      </p>
                      <p className="text-xs text-secondaryText mt-1">
                        {formatTimeAgo(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.credibility_score != null && (
                        <span
                          className="text-lg font-bold"
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

          {/* Right — Platform breakdown */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primaryText text-lg">
                Platform Verdicts
              </h2>
              <Link
                href="/analytics"
                className="text-sm text-graphPurple hover:text-trustLavender transition-colors"
              >
                Full →
              </Link>
            </div>

            <div className="card p-5 space-y-3">
              {[
                {
                  label: "High Credibility",
                  value: analytics?.high_credibility ?? 0,
                  color: "bg-credibilityGreen",
                  textColor: "text-credibilityGreen",
                },
                {
                  label: "Moderate",
                  value: analytics?.moderate_credibility ?? 0,
                  color: "bg-moderateBlue",
                  textColor: "text-moderateBlue",
                },
                {
                  label: "Low Credibility",
                  value: analytics?.low_credibility ?? 0,
                  color: "bg-warningAmber",
                  textColor: "text-warningAmber",
                },
                {
                  label: "Misleading",
                  value: analytics?.misleading ?? 0,
                  color: "bg-riskRed",
                  textColor: "text-riskRed",
                },
                {
                  label: "Unverified",
                  value: analytics?.unverified ?? 0,
                  color: "bg-graphPurple",
                  textColor: "text-graphPurple",
                },
              ].map((row) => {
                const total = analytics?.total || 1;
                const pct = Math.round((row.value / total) * 100);
                return (
                  <div key={row.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-secondaryText">
                        {row.label}
                      </span>
                      <span
                        className={cn("text-xs font-bold", row.textColor)}
                      >
                        {row.value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          row.color
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Reusable KPI tile
// ──────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  color,
  loading,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="card p-5 flex flex-col items-center text-center">
      <div className="text-2xl mb-2">{icon}</div>
      {loading ? (
        <div className="h-7 w-16 bg-border rounded animate-pulse mb-2" />
      ) : (
        <p className={cn("text-2xl font-bold leading-none mb-2", color)}>
          {value}
        </p>
      )}
      <p className="text-xs text-secondaryText leading-tight">{label}</p>
    </div>
  );
}
