import {
  REPUTATION_TIER_LABELS,
  REPUTATION_TIER_THRESHOLDS,
} from "@/constants";
import { cn } from "@/lib/utils";
import type { Profile, ReputationTier } from "@/types";

interface ResearcherStatsProps {
  profile: Profile;
}

const TIER_ICONS: Record<ReputationTier, string> = {
  new: "🌱",
  analyst: "🔍",
  researcher: "📊",
  trusted_researcher: "⭐",
  verification_expert: "🏆",
};

const TIER_ORDER: ReputationTier[] = [
  "new",
  "analyst",
  "researcher",
  "trusted_researcher",
  "verification_expert",
];

export function ResearcherStats({ profile }: ResearcherStatsProps) {
  const currentTierIndex = TIER_ORDER.indexOf(profile.reputation_tier);
  const nextTier =
    currentTierIndex < TIER_ORDER.length - 1
      ? TIER_ORDER[currentTierIndex + 1]
      : null;
  const nextThreshold = nextTier
    ? REPUTATION_TIER_THRESHOLDS[nextTier]
    : null;
  const currentThreshold =
    REPUTATION_TIER_THRESHOLDS[profile.reputation_tier];
  const progress = nextThreshold
    ? ((profile.reputation_score - currentThreshold) /
        (nextThreshold - currentThreshold)) *
      100
    : 100;

  const accuracy =
    profile.total_verifications > 0
      ? Math.round(
          (profile.accurate_verifications / profile.total_verifications) * 100
        )
      : 0;

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">
              {TIER_ICONS[profile.reputation_tier]}
            </span>
            <span className="font-bold text-primaryText text-xl">
              {profile.display_name || profile.username || "Anonymous"}
            </span>
          </div>
          <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20">
            {REPUTATION_TIER_LABELS[profile.reputation_tier]}
          </span>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-graphPurple">
            {profile.reputation_score}
          </p>
          <p className="text-xs text-secondaryText">Reputation Score</p>
        </div>
      </div>

      {nextTier && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondaryText">
              Progress to {REPUTATION_TIER_LABELS[nextTier]}
            </span>
            <span className="text-xs font-semibold text-primaryText">
              {profile.reputation_score} / {nextThreshold}
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-graphPurple to-trustLavender transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Verifications",
            value: profile.total_verifications,
            color: "text-graphPurple",
          },
          {
            label: "Accuracy",
            value: `${accuracy}%`,
            color: "text-credibilityGreen",
          },
          {
            label: "Researcher Score",
            value: profile.researcher_score.toFixed(1),
            color: "text-moderateBlue",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-surfaceSoft rounded-xl p-3 text-center">
            <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-secondaryText mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-primaryText uppercase tracking-wider">
          Tier Progression
        </h4>
        <div className="flex items-center gap-2">
          {TIER_ORDER.map((tier, i) => (
            <div
              key={tier}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all duration-500",
                i <= currentTierIndex ? "bg-graphPurple" : "bg-border"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between">
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
  );
}
