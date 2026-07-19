import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount, createClient, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "contracts", "TrustDSource.py");
const code = fs.readFileSync(contractPath, "utf8");

const privateKey = process.env.GENLAYER_DEPLOYER_PRIVATE_KEY ?? generatePrivateKey();
const account = createAccount(privateKey);
const client = createClient({ chain: studionet, account });

function findAddress(value, seen = new Set()) {
  if (!value || typeof value !== "object") return "";
  if (seen.has(value)) return "";
  seen.add(value);

  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === "string" &&
      /^0x[a-fA-F0-9]{40}$/.test(child) &&
      /address|contract|recipient/i.test(key)
    ) {
      return child;
    }
  }

  for (const child of Object.values(value)) {
    const found = findAddress(child, seen);
    if (found) return found;
  }

  return "";
}

console.log(`deployer=${account.address}`);
console.log("leaderOnly=false");

const hash = await client.deployContract({
  code,
  args: [],
  leaderOnly: false,
});

console.log(`tx=${hash}`);

const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.ACCEPTED,
  fullTransaction: true,
});

const address =
  receipt.contractAddress ??
  receipt.data?.contractAddress ??
  receipt.data?.contract_address ??
  receipt.txDataDecoded?.address ??
  findAddress(receipt);

console.log(`status=${receipt.statusName ?? receipt.status ?? "unknown"}`);
console.log(`txExecutionResult=${receipt.txExecutionResultName ?? receipt.txExecutionResult ?? "unknown"}`);
console.log(`contractAddress=${address || "UNKNOWN"}`);

if (!address) {
  console.log(JSON.stringify(receipt, null, 2).slice(0, 4000));
  process.exitCode = 1;
}
