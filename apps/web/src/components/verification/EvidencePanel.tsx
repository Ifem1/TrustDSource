import { SourceCard } from "./SourceCard";
import type { GenLayerSource } from "@/types";

interface EvidencePanelProps {
  supportingSources: GenLayerSource[];
  conflictingSources: GenLayerSource[];
  isLoading?: boolean;
}

export function EvidencePanel({
  supportingSources,
  conflictingSources,
  isLoading,
}: EvidencePanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-4 h-4 border-2 border-graphPurple/30 border-t-graphPurple rounded-full animate-spin" />
          <span className="text-sm text-secondaryText">Discovering sources...</span>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-2/3 mb-2" />
            <div className="h-3 bg-border rounded w-1/3 mb-3" />
            <div className="h-3 bg-border rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const total = supportingSources.length + conflictingSources.length;

  if (total === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-secondaryText text-sm">No sources discovered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-credibilityGreen" />
          <span className="text-sm text-secondaryText">
            {supportingSources.length} supporting
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-riskRed" />
          <span className="text-sm text-secondaryText">
            {conflictingSources.length} conflicting
          </span>
        </div>
      </div>

      {supportingSources.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primaryText flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-credibilityGreen" />
            Supporting Sources
          </h4>
          {supportingSources.map((source, i) => (
            <SourceCard key={i} source={source} />
          ))}
        </div>
      )}

      {conflictingSources.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primaryText flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-riskRed" />
            Conflicting Sources
          </h4>
          {conflictingSources.map((source, i) => (
            <SourceCard key={i} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
