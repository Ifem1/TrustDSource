"use client";

import { useState, useCallback } from "react";
import type { VerificationFull, SubmitContentForm } from "@/types";
import { getReport } from "@/lib/trustdsource/service";
import toast from "react-hot-toast";

export function useVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVerification, setCurrentVerification] =
    useState<VerificationFull | null>(null);

  const submitVerification = useCallback(
    async (_form: SubmitContentForm, _walletAddress: string) => {
      setLoading(true);
      setError(null);

      try {
        throw new Error(
          "Deprecated hook. Use runVerificationPipeline with a wallet-signed GenLayer transaction."
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Submission failed";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchVerification = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReport(id);
      if (res.error || !res.data) throw new Error(res.error ?? "Report not found");
      const data = {
        id: res.data.report_id,
        submitter_wallet: res.data.submitter_wallet ?? "",
        submitter_id: null,
        title: res.data.title ?? "",
        url: res.data.url ?? null,
        content: "",
        claim_summary: null,
        category: res.data.category ?? "news",
        content_hash: res.data.content_hash ?? "",
        verification_hash: res.data.verification_hash ?? null,
        snapshot_timestamp: res.data.snapshot_timestamp ?? res.data.created_at,
        status: res.data.status ?? "complete",
        genlayer_tx_hash: null,
        genlayer_report_id: res.data.report_id,
        created_at: res.data.created_at,
        updated_at: res.data.created_at,
        credibility_score: res.data.credibility_score,
        confidence: Number(res.data.confidence ?? 0),
        source_quality: res.data.source_quality,
        evidence_strength: res.data.evidence_strength,
        consistency_score: res.data.consistency_score,
        bias_risk: res.data.bias_risk,
        misinformation_risk: res.data.misinformation_risk,
        verdict: res.data.verdict,
        reasoning: res.data.reasoning,
        ai_summary: res.data.ai_summary,
        supporting_sources: [],
        conflicting_sources: [],
        genlayer_proof: null,
        report_id: res.data.report_id,
        submitter_username: null,
        submitter_display_name: null,
        submitter_tier: null,
        submitter_avatar: null,
      } as VerificationFull;
      setCurrentVerification(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch report");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    currentVerification,
    submitVerification,
    fetchVerification,
  };
}
