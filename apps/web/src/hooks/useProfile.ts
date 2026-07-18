"use client";

import { useState, useEffect, useCallback } from "react";
import { getProfile } from "@/lib/trustdsource/service";
import type { Profile } from "@/types";

function contractProfileToProfile(
  walletAddress: string,
  raw: Record<string, unknown>
): Profile {
  const now = new Date().toISOString();
  return {
    id: walletAddress,
    wallet_address: String(raw.wallet_address ?? walletAddress),
    username: null,
    display_name: null,
    bio: null,
    avatar_url: null,
    reputation_score: Number(raw.reputation_score ?? 0),
    reputation_tier: String(raw.reputation_tier ?? "new") as Profile["reputation_tier"],
    total_verifications: Number(raw.total_verifications ?? 0),
    accurate_verifications: 0,
    researcher_score: Number(raw.reputation_score ?? 0),
    is_researcher: Number(raw.total_verifications ?? 0) > 0,
    genlayer_address: null,
    created_at: now,
    updated_at: now,
  };
}

export function useProfile(walletAddress: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!walletAddress) {
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getProfile(walletAddress);
      if (res.error) throw new Error(res.error);
      setProfile(
        contractProfileToProfile(
          walletAddress,
          (res.data ?? {}) as unknown as Record<string, unknown>
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const createProfile = useCallback(async () => {
    if (!walletAddress) return null;
    try {
      const data = contractProfileToProfile(walletAddress, {});
      setProfile(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to prepare profile");
      return null;
    }
  }, [walletAddress]);

  const ensureProfile = useCallback(async () => {
    if (!walletAddress) return null;
    await fetchProfile();
    if (!profile) {
      return await createProfile();
    }
    return profile;
  }, [walletAddress, fetchProfile, createProfile, profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, fetchProfile, createProfile, ensureProfile };
}
