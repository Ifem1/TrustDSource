/**
 * TrustDSource - unified GenLayer contract.
 *
 * The product is now a one-contract deployment. All reads and writes
 * target the unified TrustDSource contract on GenLayer StudioNet.
 */

export const TRUSTDSOURCE_UNIFIED_ADDRESS =
  "0xFDf33604b6BDEfFCf004CFD543dD1aa68F2720Bd" as const;

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
