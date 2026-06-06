"use client";

/**
 * Wallet-signed write hook for the unified Trustdsource contract.
 *
 * All writes go to TRUSTDSOURCE_UNIFIED_ADDRESS — there is no method routing.
 * Encodes calldata using genlayer-js binary format, wraps in RLP,
 * ABI-encodes addTransaction, and sends through MetaMask.
 */

import { useCallback } from "react";
import {
  useAccount,
  useSendTransaction,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { encodeFunctionData, toHex, toRlp } from "viem";
import { abi } from "genlayer-js";
import { genlayerStudionet } from "@/lib/wallet";
import { TRUSTDSOURCE_UNIFIED_ADDRESS } from "@/lib/genlayer/contracts";

const CONSENSUS_CONTRACT = "0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575" as const;
const NUM_VALIDATORS = 5;
const MAX_ROTATIONS = 3;

const ADD_TRANSACTION_ABI = [
  {
    inputs: [
      { name: "_sender", type: "address" },
      { name: "_recipient", type: "address" },
      { name: "_numOfInitialValidators", type: "uint256" },
      { name: "_maxRotations", type: "uint256" },
      { name: "_txData", type: "bytes" },
    ],
    name: "addTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export interface GLWriteResult {
  evmTxHash: string;
  recipient?: `0x${string}`;
  error?: string;
}

export function useGenLayerWrite() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const writeContract = useCallback(
    async (method: string, args: unknown[]): Promise<GLWriteResult> => {
      if (!address) {
        return { evmTxHash: "", error: "Wallet not connected" };
      }

      if (chainId !== genlayerStudionet.id) {
        try {
          await switchChainAsync({ chainId: genlayerStudionet.id });
        } catch (e) {
          return {
            evmTxHash: "",
            error: `Please switch to GenLayer StudioNet (chain ${genlayerStudionet.id}). ${e instanceof Error ? e.message : ""}`,
          };
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calldataObj = abi.calldata.makeCalldataObject(
          method,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args as any,
          undefined
        );
        const encodedCalldata = abi.calldata.encode(calldataObj);
        const rlpData = toRlp([toHex(encodedCalldata), toHex(false)]);

        const txData = encodeFunctionData({
          abi: ADD_TRANSACTION_ABI,
          functionName: "addTransaction",
          args: [
            address,
            TRUSTDSOURCE_UNIFIED_ADDRESS,
            BigInt(NUM_VALIDATORS),
            BigInt(MAX_ROTATIONS),
            rlpData as `0x${string}`,
          ],
        });

        const evmTxHash = await sendTransactionAsync({
          to: CONSENSUS_CONTRACT,
          data: txData,
          value: 0n,
        });

        console.log(`[GL wallet] ${method} → tx ${evmTxHash}`);
        return { evmTxHash, recipient: TRUSTDSOURCE_UNIFIED_ADDRESS };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("User rejected") || msg.includes("user rejected")) {
          return { evmTxHash: "", error: "Transaction rejected by user" };
        }
        return { evmTxHash: "", error: msg };
      }
    },
    [address, chainId, sendTransactionAsync, switchChainAsync]
  );

  return { writeContract, address };
}
