import { CredibilityGauge } from "./CredibilityGauge";
import { BiasRiskBadge } from "./BiasRiskBadge";
import { MisinformationRiskBadge } from "./MisinformationRiskBadge";
import { VERDICT_BG, VERDICT_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { BiasRisk, MisinformationRisk, VerdictType } from "@/types";

interface TrustScoreCardProps {
  credibilityScore: number;
  confidence: number;
  sourceQuality: number;
  evidenceStrength: number;
  consistencyScore: number;
  biasRisk: BiasRisk;
  misinformationRisk: MisinformationRisk;
  verdict: VerdictType;
}

export function TrustScoreCard({
  credibilityScore,
  confidence,
  sourceQuality,
  evidenceStrength,
  consistencyScore,
  biasRisk,
  misinformationRisk,
  verdict,
}: TrustScoreCardProps) {
  const metrics = [
    { label: "Source Quality", value: sourceQuality },
    { label: "Evidence Strength", value: evidenceStrength },
    { label: "Consistency", value: consistencyScore },
    { label: "Confidence", value: Math.round(confidence * 100) },
  ];

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-primaryText text-lg">Trust Score</h3>
          <p className="text-secondaryText text-sm mt-0.5">
            GenLayer Consensus Result
          </p>
        </div>
        <span
          className={cn(
            "badge text-xs",
            VERDICT_BG[verdict] || "bg-gray-100 text-gray-700 border-gray-200"
          )}
        >
          {VERDICT_LABELS[verdict] || verdict}
        </span>
      </div>

      <div className="flex justify-center">
        <CredibilityGauge score={credibilityScore} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-surfaceSoft rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-secondaryText">{metric.label}</span>
              <span className="text-xs font-bold text-primaryText">
                {metric.value}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${metric.value}%`,
                  backgroundColor:
                    metric.value >= 70
                      ? "#16a34a"
                      : metric.value >= 45
                      ? "#3b82f6"
                      : "#f59e0b",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <BiasRiskBadge risk={biasRisk} />
        <MisinformationRiskBadge risk={misinformationRisk} />
      </div>
    </div>
  );
}
