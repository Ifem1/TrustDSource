"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { getRecentReports } from "@/lib/genlayer/pipeline";
import {
  filterReportRows,
  getRecentContractReports,
  type ContractReportRow,
} from "@/lib/trustdsource/reports";
import { VERDICT_BG, VERDICT_LABELS, CATEGORY_LABELS } from "@/constants";
import { cn, formatTimeAgo } from "@/lib/utils";

export default function HistoryPage() {
  const { address, isConnected } = useWallet();
  const [rows, setRows] = useState<ContractReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      const contractRows = filterReportRows(await getRecentContractReports(100), {
        wallet: address,
      });

      if (cancelled) return;
      if (contractRows.length > 0) {
        setRows(contractRows);
      } else {
        setRows(
          getRecentReports()
            .filter((r) => !r.wallet || r.wallet === address)
            .map((r) => ({
              report_id: r.reportId,
              wallet: r.wallet ?? address!,
              title: r.title,
              url: null,
              category: null,
              verdict: r.verdict ?? null,
              credibility_score: r.credibility_score ?? null,
              created_at: new Date(r.timestamp).toISOString(),
            }))
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background bg-mesh">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="card p-12 text-center max-w-md">
            <h2 className="text-xl font-bold text-primaryText mb-3">
              Connect your wallet
            </h2>
            <p className="text-secondaryText text-sm mb-6">
              View your personal verification history.
            </p>
            <WalletConnectButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primaryText">
            Verification History
          </h1>
          <p className="text-secondaryText mt-2">
            Your personal history of contract-backed verifications
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-border rounded w-2/3 mb-2" />
                <div className="h-3 bg-border rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-secondaryText text-sm mb-4">
              No verifications yet.
            </p>
            <Link href="/verify" className="btn-primary inline-block">
              Start Verifying
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link
                key={r.report_id}
                href={`/report/${r.report_id}`}
                className="card p-4 flex items-start gap-4 hover:border-trustLavender transition-all duration-200 block"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primaryText truncate">
                    {r.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-secondaryText">
                      {formatTimeAgo(r.created_at)}
                    </span>
                    {r.category && (
                      <>
                        <span className="text-xs text-secondaryText">·</span>
                        <span className="text-xs text-secondaryText">
                          {CATEGORY_LABELS[r.category] ?? r.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.credibility_score != null && (
                    <span className="text-sm font-bold text-primaryText">
                      {r.credibility_score}
                    </span>
                  )}
                  {r.verdict && VERDICT_BG[r.verdict] && (
                    <span className={cn("badge text-xs", VERDICT_BG[r.verdict])}>
                      {VERDICT_LABELS[r.verdict] ?? r.verdict}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
