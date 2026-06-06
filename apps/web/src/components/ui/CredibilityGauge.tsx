"use client";

import { getScoreColor, getCredibilityLabel } from "@/lib/utils";

interface CredibilityGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CredibilityGauge({
  score,
  size = "md",
  showLabel = true,
}: CredibilityGaugeProps) {
  const sizes = {
    sm: { r: 36, stroke: 6, text: "text-xl", container: "w-24 h-24" },
    md: { r: 52, stroke: 8, text: "text-3xl", container: "w-36 h-36" },
    lg: { r: 70, stroke: 10, text: "text-5xl", container: "w-48 h-48" },
  };

  const { r, stroke, text, container } = sizes[size];
  const cx = r + stroke;
  const cy = r + stroke;
  const svgSize = (r + stroke) * 2;
  const circumference = 2 * Math.PI * r;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;
  const color = getScoreColor(clampedScore);
  const label = getCredibilityLabel(clampedScore);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${container} flex items-center justify-center`}>
        <svg
          width={svgSize}
          height={svgSize}
          className="rotate-[-90deg]"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f7f0ff"
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out score-ring"
            style={{ color }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold ${text} leading-none`}
            style={{ color }}
          >
            {clampedScore}
          </span>
          <span className="text-xs text-secondaryText mt-1">/ 100</span>
        </div>
      </div>
      {showLabel && (
        <span
          className="text-sm font-semibold text-center"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
