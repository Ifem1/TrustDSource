/**
 * GenLayer StudioNet proxy.
 *
 * One unified contract. No method routing.
 *
 * POST /api/genlayer
 *   { action: "read",    method, args }   — calls a view on the unified contract
 *   { action: "status",  txHash }         — single tx status check
 *   { action: "receipt", txHash, fromMethod?, fromArgs? }
 *     — fetches the decoded receipt (assumes the tx is already decided)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";
import { TRUSTDSOURCE_UNIFIED_ADDRESS } from "@/lib/genlayer/contracts";

const account = createAccount();
const client = createClient({ chain: studionet, account });

const STATUS_NAMES: Record<number, string> = {
  0: "UNINITIALIZED",
  1: "PENDING",
  2: "PROPOSING",
  3: "COMMITTING",
  4: "REVEALING",
  5: "ACCEPTED",
  6: "UNDETERMINED",
  7: "FINALIZED",
  8: "CANCELED",
  9: "APPEAL_REVEALING",
  10: "APPEAL_COMMITTING",
  11: "READY_TO_FINALIZE",
  12: "VALIDATORS_TIMEOUT",
  13: "LEADER_TIMEOUT",
};

const DECIDED_STATUSES = new Set([
  "ACCEPTED",
  "FINALIZED",
  "UNDETERMINED",
  "LEADER_TIMEOUT",
  "VALIDATORS_TIMEOUT",
  "CANCELED",
]);

function getStatusName(receipt: Record<string, unknown>): string {
  if (typeof receipt.statusName === "string") return receipt.statusName;
  const raw = receipt.status;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return STATUS_NAMES[raw] ?? "UNKNOWN";
  return "UNKNOWN";
}

async function readResultAfterWrite(
  method: string,
  args: CalldataEncodable[]
): Promise<unknown> {
  const firstArg = args[0];

  if (method === "submit_content") {
    const total = await client.readContract({
      address: TRUSTDSOURCE_UNIFIED_ADDRESS,
      functionName: "get_total_verifications",
      args: [],
    });
    const lastIdx = Number(total) - 1;
    if (lastIdx >= 0) {
      const ids = await client.readContract({
        address: TRUSTDSOURCE_UNIFIED_ADDRESS,
        functionName: "get_recent_report_ids",
        args: [1],
      });
      // ids is a JSON string array
      try {
        const arr = JSON.parse(String(ids ?? "[]"));
        if (Array.isArray(arr) && arr.length > 0) return arr[0];
      } catch {}
    }
    return null;
  }

  if (method === "store_report") return true;

  if (method === "update_reputation" && firstArg) {
    return client.readContract({
      address: TRUSTDSOURCE_UNIFIED_ADDRESS,
      functionName: "get_profile",
      args: [firstArg],
    });
  }

  // For extract_claims / use_fallback_sources / analyse_sources /
  // use_deterministic_credibility / analyse_credibility / calculate_credibility,
  // the leader_receipt should hold the return string. If decoding fails we
  // fall back to reading get_snapshot.
  if (firstArg) {
    return client.readContract({
      address: TRUSTDSOURCE_UNIFIED_ADDRESS,
      functionName: "get_snapshot",
      args: [firstArg],
    });
  }

  return null;
}

async function getTransaction(txHash: string): Promise<Record<string, unknown> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx: any = await (client as any).getTransaction({ hash: txHash });
    return tx ?? null;
  } catch (e) {
    console.error(`[GL] getTransaction failed:`, e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action: string;
      method?: string;
      args?: CalldataEncodable[];
      txHash?: string;
      fromMethod?: string;
      fromArgs?: CalldataEncodable[];
    };

    if (body.action === "read") {
      const method = body.method;
      const args = body.args ?? [];
      if (!method) {
        return NextResponse.json({ error: "method required" }, { status: 400 });
      }
      console.log(`[GL] read ${method}`);
      const result = await client.readContract({
        address: TRUSTDSOURCE_UNIFIED_ADDRESS,
        functionName: method,
        args,
      });
      return NextResponse.json({ data: result });
    }

    if (body.action === "status") {
      const { txHash } = body;
      if (!txHash) {
        return NextResponse.json({ error: "txHash required" }, { status: 400 });
      }
      const tx = await getTransaction(txHash);
      if (!tx) {
        return NextResponse.json({ data: { status: "PENDING", decided: false } });
      }
      const statusName = getStatusName(tx);
      return NextResponse.json({
        data: { status: statusName, decided: DECIDED_STATUSES.has(statusName) },
      });
    }

    if (body.action === "receipt") {
      const { txHash, fromMethod, fromArgs } = body;
      if (!txHash) {
        return NextResponse.json({ error: "txHash required" }, { status: 400 });
      }
      const tx = await getTransaction(txHash);
      if (!tx) {
        return NextResponse.json(
          { error: `Transaction not found: ${txHash}` },
          { status: 404 }
        );
      }
      const statusName = getStatusName(tx);

      if (statusName === "CANCELED" || statusName === "UNDETERMINED") {
        return NextResponse.json(
          { error: `Transaction failed: status=${statusName}` },
          { status: 500 }
        );
      }
      if (!DECIDED_STATUSES.has(statusName)) {
        return NextResponse.json(
          { error: `Transaction not yet decided: status=${statusName}`, status: statusName },
          { status: 425 }
        );
      }

      let returnValue: unknown = null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txAny = tx as any;

        // The leader_receipt can live in several places depending on SDK version
        const leaderReceipts =
          txAny.leader_receipt ??
          txAny.consensus_data?.leader_receipt ??
          txAny.consensus_data?.final?.leader_receipt ??
          txAny.roundData?.[0]?.leader_receipt ??
          [];

        console.log(
          `[GL] ${fromMethod} leader_receipts:`,
          JSON.stringify(leaderReceipts).slice(0, 400)
        );

        if (Array.isArray(leaderReceipts) && leaderReceipts.length > 0) {
          const lr = leaderReceipts[0];
          const { abi } = await import("genlayer-js");
          const { fromHex } = await import("viem");

          // Try execution_result first (newer SDK), then calldata
          const candidateHex =
            (typeof lr.execution_result === "string" && lr.execution_result.length > 2
              ? lr.execution_result
              : null) ??
            (typeof lr.calldata === "string" && lr.calldata.length > 2 ? lr.calldata : null) ??
            (typeof lr.result === "string" && lr.result.length > 2 ? lr.result : null);

          if (candidateHex) {
            const hex = candidateHex.startsWith("0x") ? candidateHex : `0x${candidateHex}`;
            try {
              const decoded = abi.calldata.decode(
                fromHex(hex as `0x${string}`, "bytes")
              );
              returnValue = decoded;
              console.log(
                `[GL] decoded ${fromMethod}:`,
                JSON.stringify(returnValue).slice(0, 300)
              );
            } catch (decodeErr) {
              console.warn(
                `[GL] calldata.decode failed, raw hex was:`,
                hex.slice(0, 100),
                decodeErr
              );
            }
          }
        }
      } catch (e) {
        console.warn(`[GL] decode failed for ${fromMethod}:`, e);
      }

      if ((returnValue === null || returnValue === undefined) && fromMethod) {
        returnValue = await readResultAfterWrite(
          fromMethod,
          (fromArgs ?? []) as CalldataEncodable[]
        );
        console.log(`[GL] fallback read for ${fromMethod}`);
      }

      return NextResponse.json({ data: returnValue, status: statusName });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[GL] ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
