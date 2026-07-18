"use client";

import { useState, useEffect } from "react";
import {
  getAnalytics,
  getTotalVerifications,
} from "@/lib/trustdsource/service";
import { getPlatformStatsFromContract } from "@/lib/trustdsource/reports";
import type { AnalyticsDaily, PlatformStats } from "@/types";

export function useAnalytics(_days = 30) {
  const [analytics, setAnalytics] = useState<AnalyticsDaily[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [analyticsRes, totalRes, platformStats] = await Promise.all([
        getAnalytics("all_time"),
        getTotalVerifications(),
        getPlatformStatsFromContract(),
      ]);

      const raw = analyticsRes.data as unknown as Record<string, unknown> | undefined;
      const total = Number(totalRes.data ?? raw?.total ?? 0);
      const today = new Date().toISOString().split("T")[0];

      setAnalytics([
        {
          id: "all_time",
          date: today,
          total_verifications: total,
          high_credibility_count: Number(raw?.high_credibility ?? 0),
          moderate_credibility_count: Number(raw?.moderate_credibility ?? 0),
          low_credibility_count: Number(raw?.low_credibility ?? 0),
          misleading_count: Number(raw?.misleading ?? 0),
          unverified_count: Number(raw?.unverified ?? 0),
          avg_credibility_score: Number(raw?.avg_score ?? 0),
          avg_source_quality: 0,
          avg_evidence_strength: 0,
          unique_submitters: platformStats.total_users,
          news_count: 0,
          social_count: 0,
          research_count: 0,
        },
      ]);
      setStats(platformStats);
      setLoading(false);
    }
    load();
  }, []);

  return { analytics, stats, loading };
}
