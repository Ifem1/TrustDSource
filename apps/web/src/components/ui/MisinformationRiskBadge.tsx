import { cn } from "@/lib/utils";
import { RISK_BG } from "@/constants";
import type { MisinformationRisk } from "@/types";

interface MisinformationRiskBadgeProps {
  risk: MisinformationRisk;
  className?: string;
}

export function MisinformationRiskBadge({
  risk,
  className,
}: MisinformationRiskBadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        RISK_BG[risk] || "bg-gray-100 text-gray-700 border-gray-200",
        className
      )}
    >
      Misinfo: {risk}
    </span>
  );
}
