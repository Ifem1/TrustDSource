/**
 * Compatibility shim — re-exports the unified Trustdsource service.
 *
 * The unified contract migration replaced this module's role.
 * New code should import from "@/lib/trustdsource/service" directly.
 */

import {
  getReport,
  getProfile,
  getAnalytics,
  getTotalVerifications,
  type ServiceResult,
} from "@/lib/trustdsource/service";
import type {
  TrustDSourceReport,
  TrustDSourceProfile,
  TrustDSourceAnalytics,
} from "@/lib/trustdsource/types";
import { TRUSTDSOURCE_UNIFIED_ADDRESS } from "./contracts";

export const GL_CONTRACT = TRUSTDSOURCE_UNIFIED_ADDRESS;

export type GLCallResult<T = unknown> = ServiceResult<T>;

export async function glGetReport(
  reportId: string
): Promise<GLCallResult<TrustDSourceReport>> {
  return getReport(reportId);
}

export async function glGetProfile(
  walletAddress: string
): Promise<GLCallResult<TrustDSourceProfile>> {
  return getProfile(walletAddress);
}

export async function glGetAnalytics(): Promise<
  GLCallResult<TrustDSourceAnalytics>
> {
  return getAnalytics("all_time");
}

export async function glGetTotalVerifications(): Promise<GLCallResult<number>> {
  return getTotalVerifications();
}
