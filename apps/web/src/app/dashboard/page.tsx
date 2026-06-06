"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { ResearcherStats } from "@/components/reputation/ResearcherStats";
import { VerificationHistory } from "@/components/verification/VerificationHistory";
import { AnalyticsPanel } from "@/components/analytics/AnalyticsPanel";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { VERDICT_BG, VERDICT_LABELS } from "@/constants";
import { formatNumber } from "@/lib/utils";
import type { VerificationFull } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { address, isConnected } = useWallet();
  const { profile, loading: profileLoading } = useProfile(address);
  const [recentVerifications, setRecentVerifications] = useState<VerificationFull[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    async function loadStats() {
      const supabase = createClient();
      const { data } = await supabase
        .from("verification_full")
        .select("*")
        .eq("submitter_wallet", address)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentVerifications(data as unknown as VerificationFull[]);
      setStatsLoading(false);
    }
    loadStats();
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
              Access your personal dashboard to track verifications, reputation,
              and analytics.
            </p>
            <WalletConnectButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const verdictCounts: Record<string, number> = {};
  recentVerifications.forEach((v) => {
    if (v.verdict) {
      verdictCounts[v.verdict] = (verdictCounts[v.verdict] || 0) + 1;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primaryText">Dashboard</h1>
            <p className="text-secondaryText mt-1">
              Your verification activity and reputation
            </p>
          </div>
          <Link href="/verify" className="btn-primary">
            New Verification
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Profile & Stats */}
          <div className="space-y-6">
            {profile && !profileLoading ? (
              <ResearcherStats profile={profile} />
            ) : (
              <div className="card p-6 animate-pulse">
                <div className="h-20 bg-border rounded mb-4" />
                <div className="h-4 bg-border rounded w-2/3 mb-2" />
                <div className="h-4 bg-border rounded w-1/2" />
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-4">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Verifications",
                    value: profile?.total_verifications ?? 0,
                    icon: "📋",
                  },
                  {
                    label: "Reputation",
                    value: profile?.reputation_score ?? 0,
                    icon: "⭐",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-surfaceSoft rounded-xl p-3 text-center"
                  >
                    <div className="text-xl mb-1">{stat.icon}</div>
                    <p className="text-xl font-bold text-primaryText">
                      {formatNumber(stat.value)}
                    </p>
                    <p className="text-xs text-secondaryText">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(verdictCounts).length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-primaryText mb-4">
                  Verdict Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(verdictCounts).map(([verdict, count]) => (
                    <div key={verdict} className="flex items-center justify-between">
                      <span
                        className={`badge text-xs ${VERDICT_BG[verdict] || ""}`}
                      >
                        {VERDICT_LABELS[verdict] || verdict}
                      </span>
                      <span className="text-sm font-bold text-primaryText">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle — Recent Activity */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-primaryText text-lg">
                  Recent Verifications
                </h2>
                <Link href="/history" className="text-sm text-graphPurple hover:text-trustLavender transition-colors">
                  View all
                </Link>
              </div>
              <VerificationHistory walletAddress={address ?? undefined} limit={5} />
            </div>
          </div>

          {/* Right — Analytics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-primaryText text-lg">
                Platform Analytics
              </h2>
              <Link href="/analytics" className="text-sm text-graphPurple hover:text-trustLavender transition-colors">
                Full view
              </Link>
            </div>
            <AnalyticsPanel compact />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
