"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VerificationForm } from "@/components/verification/VerificationForm";
import { PipelineProgress } from "@/components/verification/PipelineProgress";
import { ClaimsLiveCard } from "@/components/verification/LiveResultCards";
import { SourcesLiveCard } from "@/components/verification/LiveResultCards";
import { AnalysisLiveCard } from "@/components/verification/LiveResultCards";
import { FinalReportCard } from "@/components/verification/LiveResultCards";
import { WalletConnectButton } from "@/components/ui/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useGenLayerWrite } from "@/hooks/useGenLayer";
import {
  runVerificationPipeline,
  resumePipeline,
  getRecentReports,
  initialPipelineState,
  type PipelineState,
  type RecentReport,
} from "@/lib/genlayer/pipeline";
import type { PipelineMode } from "@/lib/trustdsource/types";
import { formatTimeAgo, cn } from "@/lib/utils";
import type { SubmitContentForm } from "@/types";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { writeContract } = useGenLayerWrite();
  const [pipeline, setPipeline] = useState<PipelineState>(initialPipelineState());
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [activeTab, setActiveTab] = useState<"form" | "recent">("form");
  const [mode, setMode] = useState<PipelineMode>("fast");

  useEffect(() => {
    setRecentReports(getRecentReports());
  }, []);

  const updateState = useCallback((patch: Partial<PipelineState>) => {
    setPipeline((prev) => ({ ...prev, ...patch }));
  }, []);

  const [lastForm, setLastForm] = useState<SubmitContentForm | null>(null);

  async function handleSubmit(form: SubmitContentForm) {
    if (!address) return;
    setLastForm(form);
    setPipeline(initialPipelineState(mode));

    await runVerificationPipeline(
      address,
      writeContract,
      {
        title: form.title,
        url: form.url ?? "",
        content: form.content,
        claimSummary: form.claim_summary ?? "",
        category: form.category,
      },
      updateState,
      { mode }
    );
  }

  async function handleRetry() {
    if (!address || !pipeline.reportId || !pipeline.failedStep || !lastForm) return;

    await resumePipeline(
      address,
      writeContract,
      pipeline,
      updateState,
      {
        title: lastForm.title,
        url: lastForm.url ?? "",
        content: lastForm.content,
        claimSummary: lastForm.claim_summary ?? "",
        category: lastForm.category,
      },
      { mode: pipeline.mode }
    );
  }

  function handleViewReport() {
    if (pipeline.reportId) {
      router.push(`/report/${pipeline.reportId}`);
    }
  }

  function handleReset() {
    setPipeline(initialPipelineState());
    setRecentReports(getRecentReports());
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-primaryText">Verify Content</h1>
          <p className="text-secondaryText mt-2">
            Submit any article, tweet, or claim. GenLayer runs the full
            credibility pipeline — step by step, live.
          </p>
        </div>

        {!isConnected ? (
          <div className="max-w-lg mx-auto">
            <div className="card p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-graphPurple/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-graphPurple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-primaryText mb-3">
                Connect wallet to start
              </h2>
              <p className="text-secondaryText text-sm mb-6">
                A wallet connection is required. Each pipeline step is sent as
                an on-chain GenLayer transaction.
              </p>
              <WalletConnectButton />
            </div>
          </div>
        ) : pipeline.step === "idle" ? (
          /* ── Idle: show form + recent reports ── */
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex gap-1 mb-5">
                <button
                  onClick={() => setActiveTab("form")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === "form"
                      ? "bg-graphPurple text-white"
                      : "bg-surface border border-border text-secondaryText hover:text-primaryText"
                  )}
                >
                  New Verification
                </button>
                <button
                  onClick={() => setActiveTab("recent")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === "recent"
                      ? "bg-graphPurple text-white"
                      : "bg-surface border border-border text-secondaryText hover:text-primaryText"
                  )}
                >
                  Recent ({recentReports.length})
                </button>
              </div>

              {activeTab === "form" ? (
                <div className="card p-6 space-y-5">
                  {/* Mode selector */}
                  <div className="bg-surfaceSoft rounded-xl p-3 border border-border">
                    <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mb-2">
                      Verification mode
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMode("fast")}
                        className={cn(
                          "flex-1 px-3 py-2.5 rounded-lg text-left transition-all border-2",
                          mode === "fast"
                            ? "bg-graphPurple text-white border-graphPurple shadow-glow-purple"
                            : "bg-surface text-primaryText border-border hover:border-graphPurple"
                        )}
                      >
                        <p className="text-sm font-semibold">⚡ Fast mode</p>
                        <p
                          className={cn(
                            "text-xs mt-0.5",
                            mode === "fast" ? "text-white/80" : "text-secondaryText"
                          )}
                        >
                          Deterministic · seconds per step
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("ai")}
                        className={cn(
                          "flex-1 px-3 py-2.5 rounded-lg text-left transition-all border-2",
                          mode === "ai"
                            ? "bg-graphPurple text-white border-graphPurple shadow-glow-purple"
                            : "bg-surface text-primaryText border-border hover:border-graphPurple"
                        )}
                      >
                        <p className="text-sm font-semibold">🧠 AI-enhanced</p>
                        <p
                          className={cn(
                            "text-xs mt-0.5",
                            mode === "ai" ? "text-white/80" : "text-secondaryText"
                          )}
                        >
                          GenLayer consensus · slower, deeper
                        </p>
                      </button>
                    </div>
                  </div>

                  <VerificationForm onSubmit={handleSubmit} />
                </div>
              ) : (
                <div className="card overflow-hidden">
                  {recentReports.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="text-secondaryText text-sm">
                        No recent reports yet.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentReports.map((r) => (
                        <Link
                          key={r.reportId}
                          href={`/report/${r.reportId}`}
                          className="flex items-center gap-4 p-4 hover:bg-surfaceSoft transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primaryText truncate">
                              {r.title}
                            </p>
                            <p className="text-xs text-secondaryText mt-0.5">
                              {formatTimeAgo(new Date(r.timestamp).toISOString())}
                            </p>
                          </div>
                          {r.credibility_score != null && (
                            <span
                              className="text-sm font-bold flex-shrink-0"
                              style={{
                                color:
                                  r.credibility_score >= 80
                                    ? "#16a34a"
                                    : r.credibility_score >= 55
                                    ? "#3b82f6"
                                    : "#f59e0b",
                              }}
                            >
                              {r.credibility_score}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="font-semibold text-primaryText mb-4">
                  What gets analysed
                </h3>
                <ul className="space-y-2">
                  {[
                    "Claim validity",
                    "Evidence & source signals",
                    "Citation quality",
                    "Cross-source consistency",
                    "Misinformation indicators",
                    "Bias signals",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-secondaryText">
                      <span className="w-1.5 h-1.5 rounded-full bg-graphPurple flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-primaryText mb-3">
                  Pipeline steps
                </h3>
                <ol className="space-y-2">
                  {[
                    "Submit & lock snapshot",
                    "Extract claims",
                    "Discover sources",
                    "Verify claims",
                    "Calculate score",
                    "Store on-chain",
                    "Update reputation",
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-secondaryText">
                      <span className="w-5 h-5 rounded-full bg-surfaceSoft border border-border flex items-center justify-center text-xs font-bold text-primaryText flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ) : (
          /* ── Pipeline running / complete / failed ── */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: pipeline progress + actions */}
            <div className="space-y-5">
              <PipelineProgress
                currentStep={pipeline.step}
                error={pipeline.error}
                onRetry={pipeline.step === "failed" ? handleRetry : undefined}
                txStatus={pipeline.currentTxStatus}
                txElapsedMs={pipeline.currentTxElapsedMs}
              />

              {pipeline.reportId && (
                <div className="card p-4 space-y-2">
                  <p className="text-xs text-secondaryText">Report ID</p>
                  <code className="text-xs font-mono text-graphPurple bg-surfaceSoft px-3 py-2 rounded-lg border border-border block break-all">
                    {pipeline.reportId}
                  </code>
                </div>
              )}

              {pipeline.step === "complete" && (
                <div className="space-y-3">
                  <button
                    onClick={handleViewReport}
                    className="btn-primary w-full"
                  >
                    View Full Report →
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-secondary w-full"
                  >
                    Verify Another
                  </button>
                </div>
              )}

              {pipeline.step === "failed" && (
                <button onClick={handleReset} className="btn-secondary w-full">
                  Start Over
                </button>
              )}

              {/* Profile update */}
              {pipeline.profile && (
                <div className="card p-4">
                  <p className="text-xs text-secondaryText mb-2">
                    Your reputation
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primaryText">
                      {pipeline.profile.reputation_tier.replace(/_/g, " ")}
                    </span>
                    <span className="text-xl font-bold text-graphPurple">
                      {pipeline.profile.reputation_score}
                    </span>
                  </div>
                  <p className="text-xs text-secondaryText mt-1">
                    {pipeline.profile.total_verifications} total verifications
                  </p>
                </div>
              )}
            </div>

            {/* Middle: live result cards */}
            <div className="space-y-5">
              {pipeline.claims.length > 0 && (
                <ClaimsLiveCard claims={pipeline.claims} />
              )}

              {pipeline.analysis && (
                <AnalysisLiveCard
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  analysis={pipeline.analysis as any}
                />
              )}
            </div>

            {/* Right: sources + final report */}
            <div className="space-y-5">
              {pipeline.sources.length > 0 && (
                <SourcesLiveCard sources={pipeline.sources} />
              )}

              {pipeline.finalReport && (
                <FinalReportCard report={pipeline.finalReport} />
              )}

              {/* Analytics snapshot */}
              {pipeline.analytics && pipeline.analytics.total > 0 && (
                <div className="card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-primaryText">
                    Platform Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Total Verified",
                        value: pipeline.analytics.total,
                        color: "text-graphPurple",
                      },
                      {
                        label: "Avg Score",
                        value: pipeline.analytics.avg_score,
                        color: "text-credibilityGreen",
                      },
                      {
                        label: "Misleading",
                        value: pipeline.analytics.misleading,
                        color: "text-riskRed",
                      },
                      {
                        label: "High Credibility",
                        value: pipeline.analytics.high_credibility,
                        color: "text-credibilityGreen",
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-surfaceSoft rounded-lg p-2.5 text-center">
                        <p className={`text-lg font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                        <p className="text-xs text-secondaryText mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
