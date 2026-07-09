import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

const STEPS: { status: VerificationStatus; label: string; description: string }[] = [
  {
    status: "snapshot_locked",
    label: "Snapshot Locked",
    description: "Content immutably recorded on GenLayer",
  },
  {
    status: "extracting_claims",
    label: "Claims Extracted",
    description: "Factual claims prepared deterministically",
  },
  {
    status: "discovering_sources",
    label: "Evidence Prepared",
    description: "Source references and provenance checked",
  },
  {
    status: "verifying",
    label: "Credibility Evaluated",
    description: "Verdict bounded by accepted evidence",
  },
  {
    status: "complete",
    label: "Verification Complete",
    description: "Report stored on-chain",
  },
];

const STATUS_ORDER: VerificationStatus[] = [
  "pending",
  "snapshot_locked",
  "extracting_claims",
  "discovering_sources",
  "verifying",
  "complete",
];

interface VerificationTimelineProps {
  currentStatus: VerificationStatus;
  snapshotTimestamp?: string;
}

export function VerificationTimeline({
  currentStatus,
  snapshotTimestamp,
}: VerificationTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isFailed = currentStatus === "failed";

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-primaryText mb-5">Verification Pipeline</h3>

      {snapshotTimestamp && (
        <div className="bg-surfaceSoft rounded-lg p-3 mb-5 border border-border">
          <p className="text-xs text-secondaryText">
            Snapshot locked at:{" "}
            <span className="font-mono text-primaryText">
              {new Date(snapshotTimestamp).toISOString()}
            </span>
          </p>
        </div>
      )}

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const stepIndex = STATUS_ORDER.indexOf(step.status);
          const isComplete = stepIndex <= currentIndex && !isFailed;
          const isCurrent =
            step.status === currentStatus ||
            (currentStatus === "verifying" && step.status === "verifying");
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border-2 transition-all duration-500",
                    isComplete && !isCurrent
                      ? "bg-credibilityGreen border-credibilityGreen"
                      : isCurrent
                      ? "bg-graphPurple border-graphPurple animate-pulse-slow"
                      : isFailed
                      ? "bg-riskRed border-riskRed"
                      : "bg-surface border-border"
                  )}
                >
                  {isComplete && !isCurrent ? (
                    <svg
                      className="w-4 h-4 text-white"
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
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-0.5 h-10 mt-0 transition-colors duration-500",
                      stepIndex < currentIndex
                        ? "bg-credibilityGreen"
                        : "bg-border"
                    )}
                  />
                )}
              </div>

              <div className="pb-8 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isComplete ? "text-primaryText" : "text-secondaryText"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-secondaryText mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
