"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TrustScoreCard } from "@/components/ui/TrustScoreCard";
import { ClaimCard } from "@/components/verification/ClaimCard";
import { SourceCard } from "@/components/verification/SourceCard";
import { SourceGraph } from "@/components/verification/SourceGraph";
import { ReasoningPanel } from "@/components/verification/ReasoningPanel";
import { GenLayerProofPanel } from "@/components/verification/GenLayerProofPanel";
import { getReport } from "@/lib/trustdsource/service";
import { isEmptyReport } from "@/lib/trustdsource/utils";
import type {
  TrustDSourceReport,
  Claim as GLClaim,
  Source as GLSource,
} from "@/lib/trustdsource/types";
import { VERDICT_BG, VERDICT_LABELS, CATEGORY_LABELS, GL_CONTRACT } from "@/constants";
import { cn, buildShareUrl } from "@/lib/utils";
import toast from "react-hot-toast";

type GLFinalReport = TrustDSourceReport;

export default function ReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<GLFinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await getReport(reportId);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      if (!res.data || isEmptyReport(res.data)) {
        setError("Report not found or not indexed yet");
        setLoading(false);
        return;
      }

      const raw = res.data as unknown as Record<string, unknown>;
      const normalisedSources = (arr: unknown[]): GLSource[] =>
        (arr ?? [])
          .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
          .map((s) => ({
            url: String(s.url ?? ""),
            title: String(s.title ?? ""),
            domain: String(s.domain ?? ""),
            publication: String(s.publication ?? ""),
            credibility_score: Number(s.credibility_score ?? 0),
            source_type: String(s.source_type ?? "other"),
            is_supporting: s.is_supporting !== false,
            relevance_score: String(s.relevance_score ?? "0.5"),
            snippet: String(s.snippet ?? ""),
            evidence_kind: s.evidence_kind
              ? String(s.evidence_kind)
              : undefined,
            evidence_hash: s.evidence_hash ? String(s.evidence_hash) : undefined,
            verification_note: s.verification_note
              ? String(s.verification_note)
              : undefined,
          }));

      const normalisedClaims = (arr: unknown[]): GLClaim[] =>
        (arr ?? [])
          .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
          .map((c) => ({
            claim_text: String(c.claim_text ?? ""),
            claim_type: String(c.claim_type ?? "factual"),
            confidence: String(c.confidence ?? "0.5"),
            is_primary: Boolean(c.is_primary),
          }))
          .filter((c) => c.claim_text.trim() !== "");

      const finalReport: GLFinalReport = {
        report_id: String(raw.report_id ?? reportId),
        content_hash: String(raw.content_hash ?? ""),
        credibility_score: Number(raw.credibility_score ?? 0),
        confidence: String(raw.confidence ?? "0.0"),
        source_quality: Number(raw.source_quality ?? 0),
        evidence_strength: Number(raw.evidence_strength ?? 0),
        consistency_score: Number(raw.consistency_score ?? 0),
        bias_risk: String(raw.bias_risk ?? "LOW"),
        misinformation_risk: String(raw.misinformation_risk ?? "LOW"),
        verdict: String(raw.verdict ?? "UNVERIFIED"),
        evidence_model: raw.evidence_model
          ? String(raw.evidence_model)
          : undefined,
        independent_source_count:
          raw.independent_source_count != null
            ? Number(raw.independent_source_count)
            : undefined,
        supporting_sources: normalisedSources(
          Array.isArray(raw.supporting_sources) ? raw.supporting_sources : []
        ),
        conflicting_sources: normalisedSources(
          Array.isArray(raw.conflicting_sources) ? raw.conflicting_sources : []
        ),
        reasoning: String(raw.reasoning ?? ""),
        ai_summary: String(raw.ai_summary ?? ""),
        misinformation_signals: Array.isArray(raw.misinformation_signals)
          ? raw.misinformation_signals.map(String)
          : [],
        bias_signals: Array.isArray(raw.bias_signals)
          ? raw.bias_signals.map(String)
          : [],
        claims: normalisedClaims(
          Array.isArray(raw.claims) ? raw.claims : []
        ),
        created_at: String(raw.created_at ?? ""),
        title: String(raw.title ?? ""),
        url: String(raw.url ?? ""),
        category: String(raw.category ?? ""),
        submitter_wallet: String(raw.submitter_wallet ?? ""),
        verification_hash: String(raw.verification_hash ?? ""),
      };

      setReport(finalReport);
      setLoading(false);
    }
    load();
  }, [reportId]);

  async function handleShare() {
    const url = buildShareUrl(reportId);
    await navigator.clipboard.writeText(url);
    toast.success("Report URL copied to clipboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background bg-mesh">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-12 h-12 border-t-graphPurple rounded-full animate-spin mx-auto mb-4"
              style={{
                borderWidth: "3px",
                borderColor: "#d7b5ff",
                borderTopColor: "#9d4edd",
              }}
            />
            <p className="text-secondaryText text-sm">
              Reading from GenLayer contract…
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col bg-background bg-mesh">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="card p-8 text-center max-w-md">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-primaryText mb-3">
              Report not found
            </h2>
            <p className="text-secondaryText text-sm mb-6">{error}</p>
            <Link href="/verify" className="btn-primary">
              Start a Verification
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isEmpty = report.credibility_score === 0 && report.verdict === "UNVERIFIED" && !report.ai_summary;

  return (
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {report.category && (
                  <span className="badge bg-surfaceSoft text-secondaryText border-border text-xs">
                    {CATEGORY_LABELS[report.category] ?? report.category}
                  </span>
                )}
                {report.verdict && !isEmpty && (
                  <span
                    className={cn(
                      "badge text-xs",
                      VERDICT_BG[report.verdict] ??
                        "bg-gray-100 text-gray-700 border-gray-200"
                    )}
                  >
                    {VERDICT_LABELS[report.verdict] ?? report.verdict}
                  </span>
                )}
                <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 text-xs">
                  GenLayer On-Chain
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-primaryText leading-tight">
                {report.title || `Report ${reportId}`}
              </h1>

              {report.url && (
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-graphPurple hover:text-trustLavender mt-2 inline-block transition-colors truncate max-w-full"
                >
                  {report.url}
                </a>
              )}
            </div>

            <button
              onClick={handleShare}
              className="btn-secondary flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {isEmpty ? (
          <div className="card p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-primaryText mb-3">
              Verification in progress
            </h2>
            <p className="text-secondaryText text-sm mb-4">
              This report exists on-chain but hasn&apos;t completed all pipeline
              steps yet.
            </p>
            <Link href="/verify" className="btn-primary">
              Continue in Verify
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              <TrustScoreCard
                credibilityScore={report.credibility_score}
                confidence={Number(report.confidence)}
                sourceQuality={report.source_quality}
                evidenceStrength={report.evidence_strength}
                consistencyScore={report.consistency_score}
                biasRisk={report.bias_risk as "LOW" | "MEDIUM" | "HIGH"}
                misinformationRisk={report.misinformation_risk as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"}
                verdict={report.verdict as "HIGH_CREDIBILITY" | "MODERATE_CREDIBILITY" | "LOW_CREDIBILITY" | "MISLEADING" | "UNVERIFIED"}
              />

              <GenLayerProofPanel
                reportId={report.report_id || reportId}
                contentHash={report.content_hash}
                verificationHash={report.verification_hash}
                snapshotTimestamp={report.created_at || new Date().toISOString()}
                contractAddress={GL_CONTRACT}
              />
            </div>

            {/* Middle column */}
            <div className="space-y-6">
              {report.claims.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-primaryText mb-4">
                    Extracted Claims
                  </h3>
                  <div className="space-y-3">
                    {report.claims.map((claim, i) => (
                      <ClaimCard
                        key={i}
                        claim={{
                          ...claim,
                          confidence: Number(claim.confidence),
                        }}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(report.reasoning || report.ai_summary) && (
                <ReasoningPanel
                  reasoning={report.reasoning}
                  aiSummary={report.ai_summary || undefined}
                  misinformationSignals={report.misinformation_signals}
                  biasSignals={report.bias_signals}
                />
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <SourceGraph
                supportingSources={report.supporting_sources.map((s) => ({
                  ...s,
                  relevance_score: Number(s.relevance_score),
                }))}
                conflictingSources={report.conflicting_sources.map((s) => ({
                  ...s,
                  relevance_score: Number(s.relevance_score),
                }))}
              />

              {(report.supporting_sources.length > 0 ||
                report.conflicting_sources.length > 0) && (
                <div className="card p-5">
                  <h3 className="font-semibold text-primaryText mb-4">
                    Evidence &amp; Source Signals
                  </h3>
                  <div className="space-y-3">
                    {[
                      ...report.supporting_sources,
                      ...report.conflicting_sources,
                    ].map((source, i) => (
                      <SourceCard
                        key={i}
                        source={{
                          ...source,
                          relevance_score: Number(source.relevance_score),
                        }}
                      />
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
