import { cn } from "@/lib/utils";
import type { GenLayerSource } from "@/types";

interface SourceCardProps {
  source: GenLayerSource;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  primary_source: "Primary",
  government: "Government",
  academic: "Academic",
  news: "News",
  blog: "Blog",
  social: "Social",
  other: "Other",
};

export function SourceCard({ source }: SourceCardProps) {
  const score = source.credibility_score || 0;
  const scoreColor =
    score >= 80 ? "#16a34a" : score >= 55 ? "#3b82f6" : "#f59e0b";

  return (
    <div
      className={cn(
        "card p-4 space-y-2 hover:border-trustLavender transition-all duration-200",
        source.is_supporting
          ? "border-l-4 border-l-credibilityGreen"
          : "border-l-4 border-l-riskRed"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primaryText hover:text-graphPurple truncate block transition-colors"
          >
            {source.title || source.domain}
          </a>
          <span className="text-xs text-secondaryText">{source.domain}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold" style={{ color: scoreColor }}>
            {score}
          </span>
          <span
            className={cn(
              "badge text-xs",
              source.is_supporting
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {source.is_supporting ? "Supporting" : "Conflicting"}
          </span>
        </div>
      </div>

      {source.snippet && (
        <p className="text-xs text-secondaryText line-clamp-2">
          {source.snippet}
        </p>
      )}

      <div className="flex items-center gap-2">
        <span className="badge bg-surfaceSoft text-secondaryText border-border text-xs">
          {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
        </span>
        {source.publication && (
          <span className="text-xs text-secondaryText">{source.publication}</span>
        )}
        {source.evidence_kind && (
          <span className="badge bg-surfaceSoft text-secondaryText border-border text-xs">
            {source.evidence_kind.replace(/_/g, " ")}
          </span>
        )}
        {source.relevance_score != null && (
          <span className="text-xs text-secondaryText ml-auto">
            Relevance: {Math.round(source.relevance_score * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}
