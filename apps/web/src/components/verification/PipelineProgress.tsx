"use client";

import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/lib/genlayer/pipeline";

interface StepDef {
  key: PipelineStep;
  label: string;
  sublabel: string;
}

const STEPS: StepDef[] = [
  {
    key: "submitting",
    label: "Submitting content",
    sublabel: "Locking snapshot on GenLayer",
  },
  {
    key: "snapshot_locked",
    label: "Snapshot locked",
    sublabel: "Content immutably recorded on-chain",
  },
  {
    key: "extracting_claims",
    label: "Extracting claims",
    sublabel: "Deterministic claim preparation (fast)",
  },
  {
    key: "claims_extracted",
    label: "Claims extracted",
    sublabel: "Factual claims identified",
  },
  {
    key: "discovering_sources",
    label: "Preparing evidence",
    sublabel: "Checking source references and provenance",
  },
  {
    key: "sources_fallback",
    label: "Sources prepared",
    sublabel: "Submitted-source snapshot prepared",
  },
  {
    key: "sources_analyzed",
    label: "Sources checked",
    sublabel: "Evidence references accepted by contract",
  },
  {
    key: "verifying_claims",
    label: "Verifying claims",
    sublabel: "Running credibility analysis",
  },
  {
    key: "credibility_deterministic",
    label: "Credibility analysed",
    sublabel: "Snapshot-only fallback analysis complete",
  },
  {
    key: "credibility_analyzed",
    label: "Credibility analysed",
    sublabel: "GenLayer evidence adjudication complete",
  },
  {
    key: "calculating_credibility",
    label: "Calculating score",
    sublabel: "Computing final trust score",
  },
  {
    key: "credibility_calculated",
    label: "Score calculated",
    sublabel: "Final verdict determined",
  },
  {
    key: "storing_report",
    label: "Storing report",
    sublabel: "Report stored on-chain",
  },
  {
    key: "updating_reputation",
    label: "Updating reputation",
    sublabel: "Researcher score updated",
  },
  {
    key: "reading_final",
    label: "Finalising",
    sublabel: "Loading complete report",
  },
];

const STEP_ORDER = STEPS.map((s) => s.key);

function stepIndex(step: PipelineStep): number {
  return STEP_ORDER.indexOf(step);
}

interface PipelineProgressProps {
  currentStep: PipelineStep;
  error?: string | null;
  onRetry?: () => void;
  txStatus?: string | null;
  txElapsedMs?: number;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${m}m ${remS}s`;
}

export function PipelineProgress({
  currentStep,
  error,
  onRetry,
  txStatus,
  txElapsedMs = 0,
}: PipelineProgressProps) {
  const currentIdx = stepIndex(currentStep);
  const isFailed = currentStep === "failed";
  const isComplete = currentStep === "complete";

  // Collapsed display steps (group some pairs)
  const displaySteps = [
    { key: "submitting", label: "Submit & Snapshot", complete: currentIdx >= 1 },
    { key: "extracting_claims", label: "Extract Claims", complete: currentIdx >= 3 },
    { key: "discovering_sources", label: "Prepare Evidence", complete: currentIdx >= 5 },
    { key: "verifying_claims", label: "Adjudicate Evidence", complete: currentIdx >= 7 },
    { key: "calculating_credibility", label: "Calculate Score", complete: currentIdx >= 9 },
    { key: "storing_report", label: "Store On-Chain", complete: currentIdx >= 10 },
    { key: "updating_reputation", label: "Update Reputation", complete: currentIdx >= 11 },
  ];

  const currentDisplayStep = (() => {
    if (currentStep === "complete") return 7;
    if (currentStep === "submitting") return 0;
    if (currentStep === "snapshot_locked") return 0;
    if (currentStep === "extracting_claims") return 1;
    if (currentStep === "claims_extracted") return 1;
    if (currentStep === "discovering_sources") return 2;
    if (currentStep === "sources_fallback") return 2;
    if (currentStep === "sources_analyzed") return 2;
    if (currentStep === "verifying_claims") return 3;
    if (currentStep === "credibility_deterministic") return 3;
    if (currentStep === "credibility_analyzed") return 3;
    if (currentStep === "calculating_credibility") return 4;
    if (currentStep === "credibility_calculated") return 4;
    if (currentStep === "storing_report") return 5;
    if (currentStep === "updating_reputation") return 6;
    if (currentStep === "reading_final") return 6;
    return 0;
  })();

  const activeDef = STEPS.find((s) => s.key === currentStep);

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primaryText">
          GenLayer Verification Pipeline
        </h3>
        {isComplete && (
          <span className="badge bg-green-100 text-green-700 border-green-200 text-xs">
            Complete
          </span>
        )}
        {isFailed && (
          <span className="badge bg-red-100 text-red-700 border-red-200 text-xs">
            Failed
          </span>
        )}
      </div>

      {/* Active step label */}
      {!isComplete && !isFailed && activeDef && (
        <div className="flex items-center gap-3 bg-surfaceSoft rounded-xl p-3 border border-border">
          <span
            className="w-5 h-5 border-2 border-graphPurple/30 border-t-graphPurple rounded-full animate-spin flex-shrink-0"
            style={{ borderWidth: "2px" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primaryText">
              {activeDef.label}
            </p>
            <p className="text-xs text-secondaryText">{activeDef.sublabel}</p>
            {txStatus && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-graphPurple">
                  {txStatus}
                </span>
                <span className="text-xs text-secondaryText">
                  {formatElapsed(txElapsedMs)} elapsed
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step indicators */}
      <div className="space-y-2">
        {displaySteps.map((step, i) => {
          const isActive = i === currentDisplayStep && !isComplete && !isFailed;
          const isDone = step.complete || isComplete;
          const isCurrent = i === currentDisplayStep;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500",
                  isDone && !isActive
                    ? "bg-credibilityGreen"
                    : isActive
                    ? "bg-graphPurple animate-pulse"
                    : isFailed && isCurrent
                    ? "bg-riskRed"
                    : "bg-border"
                )}
              >
                {isDone && !isActive ? (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-white" />
                ) : isFailed && isCurrent ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white/50" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  isDone || isActive
                    ? "text-primaryText font-medium"
                    : "text-secondaryText"
                )}
              >
                {step.label}
              </span>
              {isActive && (
                <span className="text-xs text-graphPurple ml-auto font-mono">
                  running...
                </span>
              )}
              {isDone && !isActive && (
                <svg
                  className="w-3.5 h-3.5 text-credibilityGreen ml-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {isFailed && error && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
          <p className="text-sm text-riskRed font-medium">Verification failed</p>
          <p className="text-xs text-secondaryText">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary text-sm">
              Retry from this step
            </button>
          )}
        </div>
      )}

      {/* Notice about LLM time */}
      {!isComplete && !isFailed && (
        <p className="text-xs text-secondaryText text-center">
          Wallet-signed GenLayer steps may take 30s to several minutes each
        </p>
      )}
    </div>
  );
}
