"use client";

import { cn } from "@/lib/utils";
import { VERDICT_BG, VERDICT_LABELS, RISK_BG } from "@/constants";
import { CredibilityGauge } from "@/components/ui/CredibilityGauge";
import type {
  Claim as GLClaim,
  Source as GLSource,
  TrustDSourceReport as GLFinalReport,
} from "@/lib/trustdsource/types";

type GLAnalysis = {
  credibility_score: number;
  confidence: string;
  source_quality: number;
  evidence_strength: number;
  consistency_score: number;
  bias_risk: string;
  misinformation_risk: string;
  verdict: string;
  reasoning: string;
  ai_summary: string;
  misinformation_signals: string[];
  bias_signals: string[];
};

// ----------------------------------------------------------------
// Claims card
// ----------------------------------------------------------------

interface ClaimsLiveCardProps {
  claims: GLClaim[];
}

export function ClaimsLiveCard({ claims }: ClaimsLiveCardProps) {
  if (claims.length === 0) return null;

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-credibilityGreen" />
        <h3 className="font-semibold text-primaryText text-sm">
          {claims.length} claim{claims.length !== 1 ? "s" : ""} extracted
        </h3>
        <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 text-xs ml-auto">
          GenLayer LLM
        </span>
      </div>

      <div className="space-y-2">
        {claims.map((claim, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl p-3 border text-sm",
              claim.is_primary
                ? "bg-trustLavender/5 border-trustLavender/30"
                : "bg-surfaceSoft border-border"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-secondaryText flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-primaryText leading-snug">{claim.claim_text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-secondaryText bg-surface border border-border rounded px-1.5 py-0.5">
                    {claim.claim_type}
                  </span>
                  <span className="text-xs text-secondaryText">
                    {Math.round(Number(claim.confidence) * 100)}% confidence
                  </span>
                  {claim.is_primary && (
                    <span className="text-xs text-graphPurple font-medium ml-auto">
                      Primary
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Sources card
// ----------------------------------------------------------------

interface SourcesLiveCardProps {
  sources: GLSource[];
}

export function SourcesLiveCard({ sources }: SourcesLiveCardProps) {
  if (sources.length === 0) return null;

  const supporting = sources.filter((s) => s.is_supporting);
  const conflicting = sources.filter((s) => !s.is_supporting);

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-moderateBlue" />
        <h3 className="font-semibold text-primaryText text-sm">
          Evidence &amp; Source Signals
        </h3>
        <span className="text-xs text-secondaryText ml-auto">
          {supporting.length} supporting · {conflicting.length} conflicting
        </span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
        {sources.map((source, i) => {
          const score = source.credibility_score;
          const scoreColor =
            score >= 80 ? "#16a34a" : score >= 55 ? "#3b82f6" : "#f59e0b";
          const relevancePct = Math.round(Number(source.relevance_score) * 100);

          return (
            <div
              key={i}
              className={cn(
                "rounded-xl p-3 border-l-4 border border-border",
                source.is_supporting
                  ? "border-l-credibilityGreen"
                  : "border-l-riskRed"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primaryText hover:text-graphPurple truncate block transition-colors"
                    >
                      {source.title || source.domain || source.url}
                    </a>
                  ) : (
                    <p className="text-xs font-semibold text-primaryText truncate">
                      {source.title || source.domain || "Unknown source"}
                    </p>
                  )}
                  <span className="text-xs text-secondaryText">
                    {source.domain}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="text-xs font-bold"
                    style={{ color: scoreColor }}
                  >
                    {score}
                  </span>
                  <span
                    className={cn(
                      "badge text-xs",
                      source.is_supporting
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {source.is_supporting ? "Supporting" : "Conflicting"}
                  </span>
                </div>
              </div>

              {source.snippet && (
                <p className="text-xs text-secondaryText mt-1.5 line-clamp-2">
                  {source.snippet}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-secondaryText bg-surfaceSoft rounded px-1.5 py-0.5 border border-border">
                  {source.source_type}
                </span>
                {relevancePct > 0 && (
                  <span className="text-xs text-secondaryText ml-auto">
                    Relevance: {relevancePct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Analysis card (after verify_claims)
// ----------------------------------------------------------------

interface AnalysisLiveCardProps {
  analysis: GLAnalysis;
}

export function AnalysisLiveCard({ analysis: rawAnalysis }: AnalysisLiveCardProps) {
  // Normalise — the unified contract may omit fields entirely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (rawAnalysis ?? {}) as any;
  const analysis: GLAnalysis = {
    credibility_score: Number(r.credibility_score ?? 0),
    confidence: String(r.confidence ?? "0.0"),
    source_quality: Number(r.source_quality ?? 0),
    evidence_strength: Number(r.evidence_strength ?? 0),
    consistency_score: Number(r.consistency_score ?? 0),
    bias_risk: String(r.bias_risk ?? "LOW"),
    misinformation_risk: String(r.misinformation_risk ?? "LOW"),
    verdict: String(r.verdict ?? "UNVERIFIED"),
    reasoning: String(r.reasoning ?? ""),
    ai_summary: String(r.ai_summary ?? ""),
    misinformation_signals: Array.isArray(r.misinformation_signals)
      ? r.misinformation_signals.map(String)
      : [],
    bias_signals: Array.isArray(r.bias_signals) ? r.bias_signals.map(String) : [],
  };

  return (
    <div className="card p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-warningAmber" />
        <h3 className="font-semibold text-primaryText text-sm">
          AI Verification Analysis
        </h3>
      </div>

      {analysis.ai_summary && (
        <div className="bg-surfaceSoft rounded-xl p-3 border border-border">
          <p className="text-sm text-primaryText leading-relaxed">
            {analysis.ai_summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Source Quality", value: analysis.source_quality },
          { label: "Evidence Strength", value: analysis.evidence_strength },
          { label: "Consistency", value: analysis.consistency_score },
          {
            label: "Confidence",
            value: Math.round(Number(analysis.confidence) * 100),
          },
        ].map((m) => (
          <div key={m.label} className="bg-surfaceSoft rounded-lg p-2.5">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-secondaryText">{m.label}</span>
              <span className="text-xs font-bold text-primaryText">{m.value}</span>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${m.value}%`,
                  backgroundColor:
                    m.value >= 70
                      ? "#16a34a"
                      : m.value >= 45
                      ? "#3b82f6"
                      : "#f59e0b",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "badge text-xs",
            RISK_BG[analysis.bias_risk] ?? "bg-gray-50 text-gray-700 border-gray-200"
          )}
        >
          Bias: {analysis.bias_risk}
        </span>
        <span
          className={cn(
            "badge text-xs",
            RISK_BG[analysis.misinformation_risk] ??
              "bg-gray-50 text-gray-700 border-gray-200"
          )}
        >
          Misinfo: {analysis.misinformation_risk}
        </span>
      </div>

      {Array.isArray(analysis.misinformation_signals) &&
        analysis.misinformation_signals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-riskRed mb-1.5 uppercase tracking-wide">
              Signals detected
            </p>
            <ul className="space-y-1">
              {analysis.misinformation_signals.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-secondaryText"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-riskRed mt-1 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

      {Array.isArray(analysis.bias_signals) &&
        analysis.bias_signals.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-warningAmber mb-1.5 uppercase tracking-wide">
              Bias signals
            </p>
            <ul className="space-y-1">
              {analysis.bias_signals.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-secondaryText"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-warningAmber mt-1 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}

// ----------------------------------------------------------------
// Final report card (after calculate_credibility)
// ----------------------------------------------------------------

interface FinalReportCardProps {
  report: GLFinalReport;
}

export function FinalReportCard({ report }: FinalReportCardProps) {
  return (
    <div className="card p-5 animate-slide-up space-y-5 border-2 border-trustLavender/40">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-credibilityGreen animate-pulse" />
        <h3 className="font-bold text-primaryText">Credibility Result</h3>
        <span
          className={cn(
            "badge text-xs ml-auto",
            VERDICT_BG[report.verdict] ?? "bg-gray-100 text-gray-700 border-gray-200"
          )}
        >
          {VERDICT_LABELS[report.verdict] ?? report.verdict}
        </span>
      </div>

      <div className="flex justify-center">
        <CredibilityGauge score={report.credibility_score} size="lg" />
      </div>

      {report.ai_summary && (
        <div className="bg-surfaceSoft rounded-xl p-3 border border-border">
          <p className="text-sm text-primaryText leading-relaxed">
            {report.ai_summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-center">
        {[
          { label: "Source Quality", value: report.source_quality },
          { label: "Evidence Strength", value: report.evidence_strength },
          { label: "Consistency", value: report.consistency_score },
          {
            label: "Confidence",
            value: Math.round(Number(report.confidence) * 100),
          },
        ].map((m) => (
          <div key={m.label} className="bg-surfaceSoft rounded-xl p-3">
            <p className="text-xl font-bold text-primaryText">{m.value}</p>
            <p className="text-xs text-secondaryText mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "badge text-xs",
            RISK_BG[report.bias_risk] ?? ""
          )}
        >
          Bias: {report.bias_risk}
        </span>
        <span
          className={cn(
            "badge text-xs",
            RISK_BG[report.misinformation_risk] ?? ""
          )}
        >
          Misinfo: {report.misinformation_risk}
        </span>
      </div>
    </div>
  );
}
