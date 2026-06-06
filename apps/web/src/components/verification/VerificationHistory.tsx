"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { VERDICT_BG, VERDICT_LABELS, CATEGORY_LABELS } from "@/constants";
import { formatTimeAgo, cn } from "@/lib/utils";
import type { VerificationFull } from "@/types";

interface VerificationHistoryProps {
  walletAddress?: string;
  limit?: number;
}

export function VerificationHistory({
  walletAddress,
  limit = 10,
}: VerificationHistoryProps) {
  const [verifications, setVerifications] = useState<VerificationFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      let query = supabase
        .from("verification_full")
        .select("*")
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (walletAddress) {
        query = query.eq("submitter_wallet", walletAddress);
      }

      const { data } = await query;
      if (data) setVerifications(data as unknown as VerificationFull[]);
      setLoading(false);
    }
    load();
  }, [walletAddress, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-4 bg-border rounded w-2/3 mb-2" />
            <div className="h-3 bg-border rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (verifications.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surfaceSoft flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-secondaryText" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-secondaryText text-sm">No verifications yet.</p>
        <Link href="/verify" className="btn-primary mt-4 inline-block text-sm">
          Start Verifying
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {verifications.map((v) => (
        <Link
          key={v.id}
          href={`/report/${v.id}`}
          className="card p-4 flex items-start gap-4 hover:border-trustLavender hover:shadow-glow-purple transition-all duration-200 block"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primaryText truncate">
              {v.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-secondaryText">
                {formatTimeAgo(v.created_at)}
              </span>
              <span className="text-xs text-secondaryText">·</span>
              <span className="text-xs text-secondaryText">
                {CATEGORY_LABELS[v.category] || v.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {v.credibility_score != null && (
              <span className="text-sm font-bold text-primaryText">
                {v.credibility_score}
              </span>
            )}
            {v.verdict && (
              <span
                className={cn(
                  "badge text-xs",
                  VERDICT_BG[v.verdict] || "bg-gray-100 text-gray-700 border-gray-200"
                )}
              >
                {VERDICT_LABELS[v.verdict] || v.verdict}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
