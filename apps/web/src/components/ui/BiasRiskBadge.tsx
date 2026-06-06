import { cn } from "@/lib/utils";
import { RISK_BG } from "@/constants";
import type { BiasRisk } from "@/types";

interface BiasRiskBadgeProps {
  risk: BiasRisk;
  className?: string;
}

export function BiasRiskBadge({ risk, className }: BiasRiskBadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        RISK_BG[risk] || "bg-gray-100 text-gray-700 border-gray-200",
        className
      )}
    >
      Bias: {risk}
    </span>
  );
}
