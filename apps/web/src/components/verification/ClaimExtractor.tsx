import { ClaimCard } from "./ClaimCard";
import type { GenLayerClaim } from "@/types";

interface ClaimExtractorProps {
  claims: GenLayerClaim[];
  isLoading?: boolean;
}

export function ClaimExtractor({ claims, isLoading }: ClaimExtractorProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-4 h-4 border-2 border-graphPurple/30 border-t-graphPurple rounded-full animate-spin" />
          <span className="text-sm text-secondaryText">Extracting claims from content...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card p-4 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="h-4 bg-border rounded w-3/4 mb-3" />
            <div className="h-3 bg-border rounded w-full mb-2" />
            <div className="h-3 bg-border rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-secondaryText text-sm">No claims extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-primaryText">
          {claims.length} claim{claims.length !== 1 ? "s" : ""} extracted
        </span>
        <span className="text-xs text-secondaryText">by GenLayer LLM</span>
      </div>
      {claims.map((claim, i) => (
        <ClaimCard key={i} claim={claim} index={i} />
      ))}
    </div>
  );
}
