/**
 * TrustDSource - unified GenLayer contract.
 *
 * The product is now a one-contract deployment. All reads and writes
 * target the unified TrustDSource contract on GenLayer StudioNet.
 */

const DEFAULT_TRUSTDSOURCE_UNIFIED_ADDRESS =
  "0xe90847463f1D9C663c2946B6DE718538F2226d0A";

export const TRUSTDSOURCE_UNIFIED_ADDRESS = (
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ||
  DEFAULT_TRUSTDSOURCE_UNIFIED_ADDRESS
) as `0x${string}`;

export const TRUSTDSOURCE_CONTRACTS = {
  unified: TRUSTDSOURCE_UNIFIED_ADDRESS,
} as const;

/**
 * All methods route to the unified contract.
 * Kept for compatibility with the existing wallet hook and API proxy.
 */
export function getContractByMethod(_method: string): `0x${string}` {
  return TRUSTDSOURCE_UNIFIED_ADDRESS;
}
