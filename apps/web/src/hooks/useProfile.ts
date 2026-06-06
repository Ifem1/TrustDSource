"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

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
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      if (err) throw err;
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const createProfile = useCallback(async () => {
    if (!walletAddress) return null;
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("profiles")
        .insert({ wallet_address: walletAddress })
        .select()
        .single();

      if (err) throw err;
      setProfile(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create profile");
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
