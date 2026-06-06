"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsDaily, PlatformStats } from "@/types";

export function useAnalytics(days = 30) {
  const [analytics, setAnalytics] = useState<AnalyticsDaily[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const [{ data: analyticsData }, { data: statsData }] = await Promise.all([
        supabase
          .from("analytics_daily")
          .select("*")
          .gte("date", cutoff.toISOString().split("T")[0])
          .order("date", { ascending: true }),
        supabase.from("platform_stats").select("*").maybeSingle(),
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      if (statsData) setStats(statsData as PlatformStats);
      setLoading(false);
    }
    load();
  }, [days]);

  return { analytics, stats, loading };
}
