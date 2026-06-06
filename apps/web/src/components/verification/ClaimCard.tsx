import { cn } from "@/lib/utils";
import type { GenLayerClaim } from "@/types";

interface ClaimCardProps {
  claim: GenLayerClaim;
  index: number;
}

const CLAIM_TYPE_COLORS: Record<string, string> = {
  statistical: "bg-blue-50 text-blue-700 border-blue-200",
  event: "bg-purple-50 text-purple-700 border-purple-200",
  attribution: "bg-amber-50 text-amber-700 border-amber-200",
  scientific: "bg-green-50 text-green-700 border-green-200",
  policy: "bg-indigo-50 text-indigo-700 border-indigo-200",
  quote: "bg-pink-50 text-pink-700 border-pink-200",
  factual: "bg-gray-50 text-gray-700 border-gray-200",
};

export function ClaimCard({ claim, index }: ClaimCardProps) {
  const confPercent = Math.round((claim.confidence || 0) * 100);

  return (
    <div
      className={cn(
        "card p-4 space-y-3 transition-all duration-200",
        claim.is_primary && "border-trustLavender shadow-glow-purple"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surfaceSoft flex items-center justify-center text-xs font-bold text-secondaryText flex-shrink-0">
            {index + 1}
          </span>
          {claim.is_primary && (
            <span className="badge bg-trustLavender/10 text-graphPurple border-trustLavender/30 text-xs">
              Primary
            </span>
          )}
        </div>
        <span
          className={cn(
            "badge text-xs",
            CLAIM_TYPE_COLORS[claim.claim_type] ||
              "bg-gray-50 text-gray-700 border-gray-200"
          )}
        >
          {claim.claim_type}
        </span>
      </div>

      <p className="text-sm text-primaryText leading-relaxed">
        {claim.claim_text}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-secondaryText">Confidence</span>
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-graphPurple transition-all duration-700"
            style={{ width: `${confPercent}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-primaryText">
          {confPercent}%
        </span>
      </div>
    </div>
  );
}
