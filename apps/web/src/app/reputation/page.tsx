"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWallet } from "@/hooks/useWallet";
import { getProfile } from "@/lib/trustdsource/service";
import { getContractLeaderboard } from "@/lib/trustdsource/reports";
import type { TrustDSourceProfile } from "@/lib/trustdsource/types";
import {
  REPUTATION_TIER_LABELS,
  REPUTATION_TIER_THRESHOLDS,
} from "@/constants";
import { truncateAddress, formatNumber, cn } from "@/lib/utils";

const TIER_ICONS: Record<string, string> = {
  new: "N",
  analyst: "A",
  researcher: "R",
  trusted_researcher: "T",
  verification_expert: "E",
};

const TIER_ORDER = [
  "new",
  "analyst",
  "researcher",
  "trusted_researcher",
  "verification_expert",
];

interface LeaderboardRow {
  wallet: string;
  total_verifications: number;
  reputation_score: number;
  reputation_tier: string;
  avg_credibility_score: number;
  rank: number;
}

export default function ReputationPage() {
  const { address, isConnected } = useWallet();
  const [profile, setProfile] = useState<TrustDSourceProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const tasks: Promise<unknown>[] = [
        getContractLeaderboard(50).then((data) => {
          if (!cancelled) setLeaderboard(data);
        }),
      ];

      if (address) {
        tasks.push(
          getProfile(address).then((r) => {
            if (!cancelled && r.data) setProfile(r.data);
          })
        );
      } else {
        setProfile(null);
      }

      await Promise.all(tasks);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText">Reputation</h1>
          <p className="text-secondaryText mt-2">
            Your on-chain reputation and the global leaderboard
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {!isConnected ? (
              <div className="card p-6 text-center">
                <p className="text-secondaryText text-sm mb-4">
                  Connect your wallet to see your reputation.
                </p>
                <Link href="/verify" className="btn-primary">
                  Start Verifying
                </Link>
              </div>
            ) : loading || !profile ? (
              <div className="card p-6 animate-pulse">
                <div className="h-20 bg-border rounded mb-3" />
                <div className="h-3 bg-border rounded w-2/3" />
              </div>
            ) : (
              <YourReputationCard profile={profile} />
            )}

            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-4">
                Reputation Tiers
              </h3>
              <div className="space-y-3">
                {TIER_ORDER.map((tier) => (
                  <div
                    key={tier}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border",
                      profile?.reputation_tier === tier
                        ? "bg-trustLavender/10 border-trustLavender"
                        : "bg-surfaceSoft border-border"
                    )}
                  >
                    <span className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-bold text-graphPurple">
                      {TIER_ICONS[tier]}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primaryText">
                        {REPUTATION_TIER_LABELS[tier] ?? tier}
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
                How to earn
              </h3>
              <ul className="space-y-2">
                {[
                  { action: "Completed verification", pts: "+5-15" },
                  { action: "High credibility result", pts: "+15" },
                  { action: "Moderate credibility", pts: "+10" },
                  { action: "Low credibility / unverified", pts: "+5-7" },
                ].map((it) => (
                  <li
                    key={it.action}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-secondaryText">{it.action}</span>
                    <span className="font-semibold text-credibilityGreen">
                      {it.pts}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-primaryText">
                  Global Leaderboard
                </h3>
                <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 text-xs">
                  Contract data
                </span>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 animate-pulse"
                    >
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
                      key={entry.wallet}
                      href={`/profile/${entry.wallet}`}
                      className={cn(
                        "flex items-center gap-4 p-4 hover:bg-surfaceSoft transition-colors",
                        address?.toLowerCase() === entry.wallet.toLowerCase() &&
                          "bg-trustLavender/10"
                      )}
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
                        {entry.rank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primaryText truncate">
                            {truncateAddress(entry.wallet)}
                          </span>
                          <span className="text-xs">
                            {TIER_ICONS[entry.reputation_tier] ?? "N"}
                          </span>
                        </div>
                        <p className="text-xs text-secondaryText">
                          {REPUTATION_TIER_LABELS[entry.reputation_tier] ??
                            entry.reputation_tier}{" "}
                          · {entry.total_verifications} verifications
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

function YourReputationCard({ profile }: { profile: TrustDSourceProfile }) {
  const tier = profile.reputation_tier;
  const repScore = profile.reputation_score;
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
    <div className="card p-6 space-y-5">
      <div>
        <p className="text-xs text-secondaryText mb-2 uppercase tracking-wider font-semibold">
          Your reputation
        </p>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-base font-bold text-graphPurple">
              {TIER_ICONS[tier] ?? "N"}
            </span>
            <div>
              <p className="font-bold text-primaryText text-lg">
                {REPUTATION_TIER_LABELS[tier] ?? tier}
              </p>
              <p className="text-xs text-secondaryText">On-chain</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-graphPurple">{repScore}</p>
            <p className="text-xs text-secondaryText">points</p>
          </div>
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
  );
}
