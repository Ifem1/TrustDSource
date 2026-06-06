"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { REPUTATION_TIER_LABELS, REPUTATION_TIER_THRESHOLDS } from "@/constants";
import { truncateAddress, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, ReputationTier } from "@/types";

const TIER_ICONS: Record<ReputationTier, string> = {
  new: "🌱",
  analyst: "🔍",
  researcher: "📊",
  trusted_researcher: "⭐",
  verification_expert: "🏆",
};

export default function ReputationPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("leaderboard")
        .select("*")
        .limit(50);
      if (data) setLeaderboard(data as LeaderboardEntry[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText">Reputation</h1>
          <p className="text-secondaryText mt-2">
            The global leaderboard of verified contributors
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tier Info */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-4">
                Reputation Tiers
              </h3>
              <div className="space-y-3">
                {(
                  [
                    "new",
                    "analyst",
                    "researcher",
                    "trusted_researcher",
                    "verification_expert",
                  ] as ReputationTier[]
                ).map((tier) => (
                  <div
                    key={tier}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surfaceSoft border border-border"
                  >
                    <span className="text-xl">{TIER_ICONS[tier]}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primaryText">
                        {REPUTATION_TIER_LABELS[tier]}
                      </p>
                      <p className="text-xs text-secondaryText">
                        {REPUTATION_TIER_THRESHOLDS[tier]}+ points
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-3">
                How to earn points
              </h3>
              <ul className="space-y-2">
                {[
                  { action: "Complete verification", pts: "+5–15" },
                  { action: "High credibility result", pts: "+15" },
                  { action: "Moderate credibility", pts: "+10" },
                  { action: "Low credibility", pts: "+7" },
                  { action: "Detection verified", pts: "+5" },
                ].map((item) => (
                  <li key={item.action} className="flex items-center justify-between text-sm">
                    <span className="text-secondaryText">{item.action}</span>
                    <span className="font-semibold text-credibilityGreen">
                      {item.pts}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold text-primaryText">
                  Global Leaderboard
                </h3>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-8 h-8 bg-border rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-border rounded w-1/3 mb-1" />
                        <div className="h-3 bg-border rounded w-1/4" />
                      </div>
                      <div className="h-4 bg-border rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-secondaryText text-sm mb-4">
                    No contributors yet. Be the first!
                  </p>
                  <Link href="/verify" className="btn-primary">
                    Start Verifying
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {leaderboard.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/profile/${entry.wallet_address}`}
                      className="flex items-center gap-4 p-4 hover:bg-surfaceSoft transition-colors"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          entry.rank === 1
                            ? "bg-yellow-100 text-yellow-700"
                            : entry.rank === 2
                            ? "bg-gray-100 text-gray-600"
                            : entry.rank === 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-surfaceSoft text-secondaryText"
                        )}
                      >
                        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primaryText truncate">
                            {entry.display_name ||
                              entry.username ||
                              truncateAddress(entry.wallet_address)}
                          </span>
                          <span className="text-xs">
                            {TIER_ICONS[entry.reputation_tier]}
                          </span>
                        </div>
                        <p className="text-xs text-secondaryText">
                          {REPUTATION_TIER_LABELS[entry.reputation_tier]} ·{" "}
                          {entry.total_verifications} verifications
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-graphPurple text-sm">
                          {formatNumber(entry.reputation_score)}
                        </p>
                        <p className="text-xs text-secondaryText">pts</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
