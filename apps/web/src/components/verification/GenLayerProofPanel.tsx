"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GenLayerProofPanelProps {
  reportId: string;
  contentHash: string;
  verificationHash?: string;
  snapshotTimestamp: string;
  genlayerProof?: Record<string, unknown> | null;
  contractAddress?: string;
}

export function GenLayerProofPanel({
  reportId,
  contentHash,
  verificationHash,
  snapshotTimestamp,
  genlayerProof,
  contractAddress,
}: GenLayerProofPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const hashFields = [
    { label: "Report ID", value: reportId, key: "report_id" },
    { label: "Content Hash", value: contentHash, key: "content_hash" },
    ...(verificationHash
      ? [{ label: "Verification Hash", value: verificationHash, key: "verification_hash" }]
      : []),
    ...(contractAddress
      ? [{ label: "Contract Address", value: contractAddress, key: "contract" }]
      : []),
  ];

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-credibilityGreen/10 flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-credibilityGreen"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="font-semibold text-primaryText">GenLayer Proof</h3>
        <span className="badge bg-credibilityGreen/10 text-credibilityGreen border-credibilityGreen/20 text-xs ml-auto">
          On-Chain
        </span>
      </div>

      <div className="bg-surfaceSoft rounded-xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-credibilityGreen" />
          <span className="text-xs font-semibold text-credibilityGreen">
            Snapshot Locked
          </span>
          <span className="text-xs text-secondaryText ml-auto">
            {new Date(snapshotTimestamp).toLocaleString()}
          </span>
        </div>

        {hashFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <span className="text-xs text-secondaryText">{field.label}</span>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-primaryText bg-white rounded-lg px-3 py-1.5 border border-border flex-1 truncate">
                {field.value}
              </code>
              <button
                onClick={() => copyToClipboard(field.value, field.key)}
                className={cn(
                  "p-1.5 rounded-lg border transition-all duration-200 flex-shrink-0",
                  copied === field.key
                    ? "border-credibilityGreen bg-green-50 text-credibilityGreen"
                    : "border-border bg-white text-secondaryText hover:border-graphPurple hover:text-graphPurple"
                )}
              >
                {copied === field.key ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {genlayerProof && (
        <details className="group">
          <summary className="text-xs font-medium text-graphPurple cursor-pointer hover:text-trustLavender transition-colors select-none">
            View raw consensus data
          </summary>
          <pre className="mt-3 text-xs font-mono text-secondaryText bg-surfaceSoft rounded-xl p-4 border border-border overflow-auto max-h-48 scrollbar-thin">
            {JSON.stringify(genlayerProof, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
