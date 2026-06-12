"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  VERDICT_BG,
  VERDICT_LABELS,
  CATEGORY_LABELS,
} from "@/constants";
import { formatTimeAgo, cn } from "@/lib/utils";
import { checkIndexHealth, runResync } from "@/lib/trustdsource/sync";

interface IndexRow {
  report_id: string;
  wallet: string;
  title: string;
  category: string | null;
  verdict: string | null;
  credibility_score: number | null;
  created_at: string;
}

const CATEGORIES = [
  "news",
  "social",
  "research",
  "public_statement",
  "blog",
  "press_release",
  "breaking_news",
  "other",
];

const VERDICTS = [
  "HIGH_CREDIBILITY",
  "MODERATE_CREDIBILITY",
  "LOW_CREDIBILITY",
  "MISLEADING",
  "UNVERIFIED",
];

const PAGE_SIZE = 12;

export default function ExplorePage() {
  const [rows, setRows] = useState<IndexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [verdict, setVerdict] = useState<string>("");
  const [page, setPage] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [chainAhead, setChainAhead] = useState<{
    contract: number;
    index: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (search) params.set("q", search);
    if (category) params.set("category", category);
    if (verdict) params.set("verdict", verdict);

    try {
      const res = await fetch(`/api/index?${params}`);
      const json = await res.json();
      setRows(json.data ?? []);
      setOffline(Boolean(json.offline));
    } catch {
      setRows([]);
      setOffline(true);
    }
    setLoading(false);
  }, [search, category, verdict, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Self-healing: if the contract has more reports than the index,
  // auto-trigger a resync the first time the page loads.
  useEffect(() => {
    if (loading || offline || syncing) return;
    let cancelled = false;

    async function check() {
      const health = await checkIndexHealth();
      if (cancelled) return;
      if (!health.needsSync) {
        setChainAhead(null);
        return;
      }
      setChainAhead({
        contract: health.contractTotal,
        index: health.indexTotal,
      });

      // Auto-trigger only when the index is genuinely behind on initial load,
      // not for every search/filter change.
      if (rows.length === 0 && page === 0 && !search && !category && !verdict) {
        setSyncing(true);
        const result = await runResync(25);
        if (cancelled) return;
        setSyncing(false);
        if (result.indexed > 0) {
          await load();
          setChainAhead(null);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function handleManualSync() {
    setSyncing(true);
    await runResync(25);
    setSyncing(false);
    await load();
    setChainAhead(null);
  }

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

        {offline && (
          <div className="card p-4 mb-6 border-warningAmber bg-amber-50">
            <p className="text-sm text-amber-800">
              <strong>Indexing offline.</strong> The search index isn&apos;t
              configured. New verifications still write on-chain — individual
              reports are accessible by their report ID.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-8 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="input flex-1 min-w-48"
            placeholder="Search by title..."
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
            className="input w-auto"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
          <select
            value={verdict}
            onChange={(e) => {
              setVerdict(e.target.value);
              setPage(0);
            }}
            className="input w-auto"
          >
            <option value="">All Verdicts</option>
            {VERDICTS.map((v) => (
              <option key={v} value={v}>
                {VERDICT_LABELS[v] ?? v}
              </option>
            ))}
          </select>
          {(search || category || verdict) && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
                setVerdict("");
                setPage(0);
              }}
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
        ) : rows.length === 0 ? (
          chainAhead && chainAhead.contract > chainAhead.index ? (
            <div className="card p-12 text-center max-w-lg mx-auto">
              <div className="text-4xl mb-4">{syncing ? "⏳" : "🔄"}</div>
              <h3 className="font-bold text-primaryText text-lg mb-2">
                {syncing
                  ? "Indexing latest reports…"
                  : "Index catching up"}
              </h3>
              <p className="text-secondaryText text-sm mb-6">
                {chainAhead.contract} verification
                {chainAhead.contract === 1 ? "" : "s"} exist on-chain,{" "}
                {chainAhead.index} indexed so far. The search index pulls from
                the contract — this takes a moment for older reports.
              </p>
              {!syncing && (
                <button onClick={handleManualSync} className="btn-primary">
                  Sync now
                </button>
              )}
              {syncing && (
                <div className="flex items-center justify-center gap-2 text-sm text-graphPurple">
                  <span className="w-4 h-4 border-2 border-graphPurple/30 border-t-graphPurple rounded-full animate-spin" />
                  Reading from chain…
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center max-w-md mx-auto">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold text-primaryText text-lg mb-2">
                No reports found
              </h3>
              <p className="text-secondaryText text-sm mb-6">
                {search || category || verdict
                  ? "Try adjusting your filters."
                  : "Be the first to verify content."}
              </p>
              <Link href="/verify" className="btn-primary">
                Start Verifying
              </Link>
            </div>
          )
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((r) => (
                <Link
                  key={r.report_id}
                  href={`/report/${r.report_id}`}
                  className="card p-5 flex flex-col gap-4 hover:border-trustLavender hover:shadow-glow-purple transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    {r.category && (
                      <span className="badge bg-surfaceSoft text-secondaryText border-border text-xs">
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                    )}
                    {r.verdict && VERDICT_BG[r.verdict] && (
                      <span className={cn("badge text-xs", VERDICT_BG[r.verdict])}>
                        {VERDICT_LABELS[r.verdict] ?? r.verdict}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-primaryText text-sm leading-snug line-clamp-2 group-hover:text-graphPurple transition-colors">
                    {r.title}
                  </h3>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-secondaryText">
                      {formatTimeAgo(r.created_at)}
                    </span>
                    {r.credibility_score != null && (
                      <div
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                        style={{
                          borderColor:
                            r.credibility_score >= 80
                              ? "#16a34a"
                              : r.credibility_score >= 55
                              ? "#3b82f6"
                              : "#f59e0b",
                          color:
                            r.credibility_score >= 80
                              ? "#16a34a"
                              : r.credibility_score >= 55
                              ? "#3b82f6"
                              : "#f59e0b",
                        }}
                      >
                        {r.credibility_score}
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
                disabled={rows.length < PAGE_SIZE}
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
