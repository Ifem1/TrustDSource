"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReasoningPanelProps {
  reasoning: string;
  aiSummary?: string;
  misinformationSignals?: string[];
  biasSignals?: string[];
}

export function ReasoningPanel({
  reasoning,
  aiSummary,
  misinformationSignals = [],
  biasSignals = [],
}: ReasoningPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-graphPurple/10 flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-graphPurple"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="font-semibold text-primaryText">AI Reasoning</h3>
        <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 text-xs ml-auto">
          GenLayer LLM
        </span>
      </div>

      {aiSummary && (
        <div className="bg-surfaceSoft rounded-xl p-4 border border-border">
          <p className="text-sm font-medium text-primaryText leading-relaxed">
            {aiSummary}
          </p>
        </div>
      )}

      <div>
        <p
          className={cn(
            "text-sm text-secondaryText leading-relaxed",
            !expanded && "line-clamp-4"
          )}
        >
          {reasoning}
        </p>
        {reasoning && reasoning.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-graphPurple font-medium mt-2 hover:text-trustLavender transition-colors"
          >
            {expanded ? "Show less" : "Read full reasoning"}
          </button>
        )}
      </div>

      {misinformationSignals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-riskRed uppercase tracking-wide">
            Misinformation Signals Detected
          </h4>
          <ul className="space-y-1">
            {misinformationSignals.map((signal, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-riskRed mt-1.5 flex-shrink-0" />
                <span className="text-xs text-secondaryText">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {biasSignals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-warningAmber uppercase tracking-wide">
            Bias Signals Detected
          </h4>
          <ul className="space-y-1">
            {biasSignals.map((signal, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warningAmber mt-1.5 flex-shrink-0" />
                <span className="text-xs text-secondaryText">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
