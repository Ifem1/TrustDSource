"use client";

import { useState, useCallback } from "react";
import type { VerificationFull, SubmitContentForm } from "@/types";
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
      const res = await fetch(`/api/report/${id}`);
      if (!res.ok) throw new Error("Report not found");
      const data = await res.json();
      setCurrentVerification(data);
      return data as VerificationFull;
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
