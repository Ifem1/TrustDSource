"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatNumber, formatDate } from "@/lib/utils";

const VERDICT_COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#9d4edd"];

interface AnalyticsPanelProps {
  compact?: boolean;
}

export function AnalyticsPanel({ compact = false }: AnalyticsPanelProps) {
  const { analytics, stats, loading } = useAnalytics(30);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 bg-border rounded w-1/3 mb-4" />
            <div className="h-40 bg-border rounded" />
          </div>
        ))}
      </div>
    );
  }

  const pieData = stats
    ? [
        { name: "High", value: stats.high_credibility_count },
        {
          name: "Moderate",
          value:
            stats.total_verifications -
            stats.high_credibility_count -
            stats.misleading_detected,
        },
        { name: "Misleading", value: stats.misleading_detected },
      ].filter((d) => d.value > 0)
    : [];

  const areaData = analytics.map((d) => ({
    date: formatDate(d.date),
    total: d.total_verifications,
    score: d.avg_credibility_score,
    misleading: d.misleading_count,
  }));

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Verifications",
              value: formatNumber(stats.total_verifications),
              color: "text-graphPurple",
            },
            {
              label: "Avg Credibility",
              value: `${stats.avg_credibility}/100`,
              color: "text-credibilityGreen",
            },
            {
              label: "Misleading Detected",
              value: formatNumber(stats.misleading_detected),
              color: "text-riskRed",
            },
            {
              label: "Total Users",
              value: formatNumber(stats.total_users),
              color: "text-moderateBlue",
            },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-secondaryText mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {!compact && (
        <>
          <div className="card p-5">
            <h3 className="font-semibold text-primaryText mb-4">
              Verification Trend (30 days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9d4edd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7b5ff" strokeOpacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#54486b" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#54486b" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #d7b5ff",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#9d4edd"
                  fill="url(#totalGrad)"
                  strokeWidth={2}
                  name="Verifications"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-4">
                Verdict Distribution
              </h3>
              <div className="flex items-center gap-6">
                <PieChart width={160} height={160}>
                  <Pie
                    data={pieData}
                    cx={75}
                    cy={75}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={VERDICT_COLORS[i % VERDICT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            VERDICT_COLORS[i % VERDICT_COLORS.length],
                        }}
                      />
                      <span className="text-sm text-primaryText">{d.name}</span>
                      <span className="text-sm font-semibold text-primaryText ml-auto">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
