"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getAnalytics, getTotalVerifications } from "@/lib/trustdsource/service";
import type { TrustDSourceAnalytics as GLAnalytics } from "@/lib/trustdsource/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { GL_CONTRACT } from "@/constants";

const VERDICT_COLORS = {
  high_credibility: "#16a34a",
  moderate_credibility: "#3b82f6",
  low_credibility: "#f59e0b",
  misleading: "#ef4444",
  unverified: "#9d4edd",
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<GLAnalytics | null>(null);
  const [totalVerifications, setTotalVerifications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [aRes, tRes] = await Promise.all([
        getAnalytics("all_time"),
        getTotalVerifications(),
      ]);

      if (aRes.error) {
        setError(aRes.error);
        setLoading(false);
        return;
      }

      if (aRes.data) {
        const raw = aRes.data as unknown as Record<string, unknown>;
        setAnalytics({
          date: String(raw.date ?? "all_time"),
          total: Number(raw.total ?? 0),
          high_credibility: Number(raw.high_credibility ?? 0),
          moderate_credibility: Number(raw.moderate_credibility ?? 0),
          low_credibility: Number(raw.low_credibility ?? 0),
          misleading: Number(raw.misleading ?? 0),
          unverified: Number(raw.unverified ?? 0),
          total_score: Number(raw.total_score ?? 0),
          avg_score: Number(raw.avg_score ?? 0),
        });
      }

      if (!tRes.error && tRes.data != null) {
        setTotalVerifications(Number(tRes.data));
      }

      setLoading(false);
    }
    load();
  }, []);

  const pieData = analytics
    ? [
        { name: "High Credibility", value: analytics.high_credibility, key: "high_credibility" },
        { name: "Moderate", value: analytics.moderate_credibility, key: "moderate_credibility" },
        { name: "Low Credibility", value: analytics.low_credibility, key: "low_credibility" },
        { name: "Misleading", value: analytics.misleading, key: "misleading" },
        { name: "Unverified", value: analytics.unverified, key: "unverified" },
      ].filter((d) => d.value > 0)
    : [];

  const barData = analytics
    ? [
        { label: "High Cred.", value: analytics.high_credibility, color: "#16a34a" },
        { label: "Moderate", value: analytics.moderate_credibility, color: "#3b82f6" },
        { label: "Low Cred.", value: analytics.low_credibility, color: "#f59e0b" },
        { label: "Misleading", value: analytics.misleading, color: "#ef4444" },
        { label: "Unverified", value: analytics.unverified, color: "#9d4edd" },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primaryText">Analytics</h1>
            <p className="text-secondaryText mt-2">
              Live statistics from the GenLayer contract · all-time
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-credibilityGreen animate-pulse" />
            <span className="text-xs text-secondaryText font-mono">
              {GL_CONTRACT.slice(0, 10)}…
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-8 bg-border rounded mb-2" />
                <div className="h-4 bg-border rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-riskRed font-medium mb-2">
              Failed to load analytics
            </p>
            <p className="text-secondaryText text-sm">{error}</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Verifications",
                  value: totalVerifications || analytics.total,
                  color: "text-graphPurple",
                  icon: "📊",
                },
                {
                  label: "Avg Credibility Score",
                  value: `${analytics.avg_score}/100`,
                  color: "text-credibilityGreen",
                  icon: "⭐",
                },
                {
                  label: "Misleading Detected",
                  value: analytics.misleading,
                  color: "text-riskRed",
                  icon: "⚠️",
                },
                {
                  label: "High Credibility",
                  value: analytics.high_credibility,
                  color: "text-credibilityGreen",
                  icon: "✅",
                },
              ].map((stat) => (
                <div key={stat.label} className="card p-5 text-center">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-secondaryText mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            {pieData.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pie chart */}
                <div className="card p-5">
                  <h3 className="font-semibold text-primaryText mb-4">
                    Verdict Distribution
                  </h3>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx={85}
                          cy={85}
                          innerRadius={50}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={
                                VERDICT_COLORS[
                                  entry.key as keyof typeof VERDICT_COLORS
                                ] ?? "#9d4edd"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #d7b5ff",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2 flex-1">
                      {pieData.map((entry) => (
                        <div
                          key={entry.key}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  VERDICT_COLORS[
                                    entry.key as keyof typeof VERDICT_COLORS
                                  ] ?? "#9d4edd",
                              }}
                            />
                            <span className="text-sm text-primaryText">
                              {entry.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-primaryText">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="card p-5">
                  <h3 className="font-semibold text-primaryText mb-4">
                    Breakdown by Verdict
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} barSize={36}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#d7b5ff"
                        strokeOpacity={0.4}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#54486b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#54486b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #d7b5ff",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                      >
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Score breakdown */}
            <div className="card p-5">
              <h3 className="font-semibold text-primaryText mb-4">
                All-Time Score Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Score Points",
                    value: analytics.total_score,
                    color: "text-graphPurple",
                  },
                  {
                    label: "Average Score",
                    value: `${analytics.avg_score}/100`,
                    color: "text-credibilityGreen",
                  },
                  {
                    label: "Reports Completed",
                    value: analytics.total,
                    color: "text-moderateBlue",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-surfaceSoft rounded-xl p-4 text-center"
                  >
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-secondaryText mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-secondaryText">
              No analytics data yet. Run a verification to populate this page.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
