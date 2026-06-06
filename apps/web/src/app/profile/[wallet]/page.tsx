"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getProfile } from "@/lib/trustdsource/service";
import { getRecentReports } from "@/lib/genlayer/pipeline";
import type { TrustDSourceProfile as GLProfile } from "@/lib/trustdsource/types";
import {
  REPUTATION_TIER_LABELS,
  REPUTATION_TIER_THRESHOLDS,
} from "@/constants";
import { truncateAddress, formatTimeAgo, cn } from "@/lib/utils";
import Link from "next/link";

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

export default function ProfilePage() {
  const { wallet } = useParams<{ wallet: string }>();
  const [profile, setProfile] = useState<GLProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getProfile(wallet);
      if (res.error || !res.data) {
        setError(res.error ?? "Profile not found on-chain");
        setLoading(false);
        return;
      }
      const raw = res.data as unknown as Record<string, unknown>;
      setProfile({
        wallet_address: String(raw.wallet_address ?? wallet),
        reputation_score: Number(raw.reputation_score ?? 0),
        reputation_tier: String(raw.reputation_tier ?? "new"),
        total_verifications: Number(raw.total_verifications ?? 0),
        last_verification: String(raw.last_verification ?? ""),
      });
      setLoading(false);
    }
    load();
  }, [wallet]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background bg-mesh">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{
              borderWidth: "3px",
              borderStyle: "solid",
              borderColor: "#d7b5ff",
              borderTopColor: "#9d4edd",
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background bg-mesh">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="card p-8 text-center max-w-md">
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-primaryText mb-3">
              Profile Not Found
            </h2>
            <p className="text-secondaryText text-sm mb-6">
              {error ?? "This wallet has not yet performed any verifications."}
            </p>
            <Link href="/verify" className="btn-primary">
              Start Verifying
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentTierIndex = TIER_ORDER.indexOf(profile.reputation_tier);
  const nextTier =
    currentTierIndex < TIER_ORDER.length - 1
      ? TIER_ORDER[currentTierIndex + 1]
      : null;
  const currentThreshold =
    REPUTATION_TIER_THRESHOLDS[profile.reputation_tier] ?? 0;
  const nextThreshold = nextTier
    ? REPUTATION_TIER_THRESHOLDS[nextTier]
    : null;
  const progress = nextThreshold
    ? ((profile.reputation_score - currentThreshold) /
        (nextThreshold - currentThreshold)) *
      100
    : 100;

  // Show recent reports from localStorage if this is the connected wallet
  const recentReports = getRecentReports();

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText">
            {truncateAddress(wallet)}
          </h1>
          <p className="font-mono text-sm text-secondaryText mt-1 break-all">
            {wallet}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile card */}
          <div className="space-y-5">
            <div className="card p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">
                      {TIER_ICONS[profile.reputation_tier] ?? "👤"}
                    </span>
                    <div>
                      <p className="font-bold text-primaryText text-lg">
                        {REPUTATION_TIER_LABELS[profile.reputation_tier] ??
                          profile.reputation_tier}
                      </p>
                      <p className="text-xs text-secondaryText">
                        GenLayer Reputation
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-graphPurple">
                    {profile.reputation_score}
                  </p>
                  <p className="text-xs text-secondaryText">points</p>
                </div>
              </div>

              {nextTier && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-secondaryText">
                      Progress to{" "}
                      {REPUTATION_TIER_LABELS[nextTier] ?? nextTier}
                    </span>
                    <span className="text-xs font-semibold text-primaryText">
                      {profile.reputation_score} / {nextThreshold}
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-graphPurple to-trustLavender transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surfaceSoft rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-graphPurple">
                    {profile.total_verifications}
                  </p>
                  <p className="text-xs text-secondaryText mt-1">
                    Verifications
                  </p>
                </div>
                <div className="bg-surfaceSoft rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-moderateBlue">
                    {profile.reputation_score}
                  </p>
                  <p className="text-xs text-secondaryText mt-1">Rep Score</p>
                </div>
              </div>

              {/* Tier progression */}
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mb-2">
                  Tier Progression
                </p>
                <div className="flex gap-1.5">
                  {TIER_ORDER.map((tier, i) => (
                    <div
                      key={tier}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-colors",
                        i <= currentTierIndex ? "bg-graphPurple" : "bg-border"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {TIER_ORDER.map((tier) => (
                    <span
                      key={tier}
                      className={cn(
                        "text-xs",
                        tier === profile.reputation_tier
                          ? "text-graphPurple font-semibold"
                          : "text-secondaryText"
                      )}
                    >
                      {TIER_ICONS[tier]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {profile.last_verification && (
              <div className="card p-4">
                <p className="text-xs text-secondaryText mb-2">
                  Last Verification
                </p>
                <Link
                  href={`/report/${profile.last_verification}`}
                  className="text-xs font-mono text-graphPurple hover:text-trustLavender transition-colors break-all"
                >
                  {profile.last_verification}
                </Link>
              </div>
            )}
          </div>

          {/* Recent reports from localStorage */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-primaryText text-lg mb-4">
              Recent Reports
            </h2>

            {recentReports.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-3xl mb-3">📋</div>
                <p className="text-secondaryText text-sm mb-4">
                  No recent reports in this browser session.
                </p>
                <Link href="/verify" className="btn-primary">
                  Start Verifying
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((r) => (
                  <Link
                    key={r.reportId}
                    href={`/report/${r.reportId}`}
                    className="card p-4 flex items-center gap-4 hover:border-trustLavender transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primaryText truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-secondaryText mt-0.5">
                        {formatTimeAgo(new Date(r.timestamp).toISOString())}
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
                      {r.verdict && (
                        <span className="text-xs font-mono text-secondaryText">
                          {r.verdict.replace(/_/g, " ")}
                        </span>
                      )}
                      <svg
                        className="w-4 h-4 text-border"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
