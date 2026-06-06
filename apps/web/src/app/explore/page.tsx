"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import { VERDICT_BG, VERDICT_LABELS, CATEGORY_LABELS } from "@/constants";
import { formatTimeAgo, cn } from "@/lib/utils";
import type { VerificationFull, ContentCategory, VerdictType } from "@/types";

const CATEGORIES: ContentCategory[] = [
  "news", "social", "research", "public_statement",
  "blog", "press_release", "breaking_news", "other",
];

const VERDICTS: VerdictType[] = [
  "HIGH_CREDIBILITY", "MODERATE_CREDIBILITY", "LOW_CREDIBILITY",
  "MISLEADING", "UNVERIFIED",
];

export default function ExplorePage() {
  const [verifications, setVerifications] = useState<VerificationFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ContentCategory | "">("");
  const [verdict, setVerdict] = useState<VerdictType | "">("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("verification_full")
      .select("*")
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search) query = query.ilike("title", `%${search}%`);
    if (category) query = query.eq("category", category);
    if (verdict) query = query.eq("verdict", verdict);

    const { data } = await query;
    setVerifications(data as unknown as VerificationFull[] ?? []);
    setLoading(false);
  }, [search, category, verdict, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText">Explore Reports</h1>
          <p className="text-secondaryText mt-2">
            Browse all completed GenLayer credibility verifications
          </p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-8 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="input flex-1 min-w-48"
            placeholder="Search reports..."
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value as ContentCategory | ""); setPage(0); }}
            className="input w-auto"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <select
            value={verdict}
            onChange={(e) => { setVerdict(e.target.value as VerdictType | ""); setPage(0); }}
            className="input w-auto"
          >
            <option value="">All Verdicts</option>
            {VERDICTS.map((v) => (
              <option key={v} value={v}>{VERDICT_LABELS[v]}</option>
            ))}
          </select>
          {(search || category || verdict) && (
            <button
              onClick={() => { setSearch(""); setCategory(""); setVerdict(""); setPage(0); }}
              className="btn-ghost text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-border rounded w-3/4 mb-3" />
                <div className="h-3 bg-border rounded w-1/2 mb-4" />
                <div className="h-8 bg-border rounded" />
              </div>
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold text-primaryText text-lg mb-2">No reports found</h3>
            <p className="text-secondaryText text-sm mb-6">
              Try adjusting your filters or be the first to verify content.
            </p>
            <Link href="/verify" className="btn-primary">
              Start Verifying
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {verifications.map((v) => (
                <Link
                  key={v.id}
                  href={`/report/${v.id}`}
                  className="card p-5 flex flex-col gap-4 hover:border-trustLavender hover:shadow-glow-purple transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge bg-surfaceSoft text-secondaryText border-border text-xs">
                      {CATEGORY_LABELS[v.category] || v.category}
                    </span>
                    {v.verdict && (
                      <span className={cn("badge text-xs", VERDICT_BG[v.verdict])}>
                        {VERDICT_LABELS[v.verdict]}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-primaryText text-sm leading-snug line-clamp-2 group-hover:text-graphPurple transition-colors">
                    {v.title}
                  </h3>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-secondaryText">
                      {formatTimeAgo(v.created_at)}
                    </span>
                    {v.credibility_score != null && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                          style={{
                            borderColor:
                              v.credibility_score >= 80
                                ? "#16a34a"
                                : v.credibility_score >= 55
                                ? "#3b82f6"
                                : "#f59e0b",
                            color:
                              v.credibility_score >= 80
                                ? "#16a34a"
                                : v.credibility_score >= 55
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        >
                          {v.credibility_score}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="text-sm text-secondaryText">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={verifications.length < PAGE_SIZE}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
