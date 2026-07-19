// One-off test-data seeding script.
// Generates N throwaway accounts and drives them through the full
// TrustDSource verification pipeline against the deployed StudioNet contract.
//
// Usage: node scripts/seed-transactions.mjs [--runs=17] [--accounts=3]

import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT_ADDRESS = "0xFDf33604b6BDEfFCf004CFD543dD1aa68F2720Bd";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const NUM_ACCOUNTS = Number(args.accounts ?? 3);
const NUM_RUNS = Number(args.runs ?? 17); // ~7 writes/run -> ~7*17=119 too many; default trimmed below

const SAMPLE_ITEMS = [
  {
    title: "Python 3.13.0 was released on Oct. 7, 2024",
    url: "",
    content:
      "Python.org lists Python 3.13.0 as a stable release with a release date of Oct. 7, 2024. The Python documentation also describes Python 3.13 as the next major Python release.",
    claimSummary: "Python 3.13.0 was released on Oct. 7, 2024.",
    category: "research",
    evidenceUrls: [
      "https://www.python.org/downloads/release/python-3130/",
      "https://en.wikipedia.org/wiki/Python_3.13",
    ],
  },
  {
    title: "HTTP 404 means Not Found",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404",
    content:
      "MDN and RFC 9110 document HTTP status code 404 as Not Found, meaning the server cannot find the requested resource.",
    claimSummary: "HTTP status code 404 means Not Found.",
    category: "research",
    evidenceUrls: [
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404",
      "https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found",
    ],
  },
  {
    title: "Central bank holds interest rates steady",
    url: "https://www.reuters.com/markets/central-bank-rate-decision",
    content:
      "The central bank kept its benchmark interest rate unchanged this quarter, citing balanced risks between inflation and slowing growth.",
    claimSummary: "The central bank held interest rates steady this quarter.",
    category: "finance",
  },
  {
    title: "New exoplanet found in habitable zone",
    url: "https://www.nature.com/articles/exoplanet-habitable-zone-2026",
    content:
      "Astronomers using the James Webb Space Telescope identified a rocky exoplanet within the habitable zone of a nearby M-dwarf star.",
    claimSummary: "A new potentially habitable exoplanet was discovered via JWST.",
    category: "science",
  },
  {
    title: "City council approves new public transit line",
    url: "https://www.local-news.example/transit-line-approved",
    content:
      "The city council voted 7-2 to approve funding for a new light rail line connecting downtown to the eastern suburbs, with construction slated to begin next year.",
    claimSummary: "City council approved funding for a new light rail line.",
    category: "politics",
  },
  {
    title: "Study links sleep quality to memory retention",
    url: "https://www.sciencedaily.com/releases/sleep-memory-study-2026",
    content:
      "A peer-reviewed study of 1,200 participants found a strong correlation between deep-sleep duration and next-day memory recall performance.",
    claimSummary: "A study found deep sleep duration correlates with memory retention.",
    category: "health",
  },
  {
    title: "Tech company announces layoffs amid restructuring",
    url: "https://www.techcrunch.example/company-layoffs-restructuring",
    content:
      "The company announced it will cut 8% of its workforce as part of a broader restructuring plan aimed at prioritizing AI infrastructure investment.",
    claimSummary: "The company announced an 8% workforce reduction tied to restructuring.",
    category: "business",
  },
];

function pickItem(i) {
  return SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
}

function makeClient(privateKey) {
  const account = createAccount(privateKey);
  const client = createClient({ chain: studionet, account });
  return { account, client };
}

async function write(client, functionName, writeArgs) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: writeArgs,
    value: 0,
  });
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  return { hash, receipt };
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return fallback;
  }
}

function countIndependentSources(sources) {
  const domains = new Set();
  for (const source of sources) {
    const evidenceKind = String(source?.evidence_kind ?? "");
    if (
      evidenceKind === "submitted_source_snapshot" ||
      evidenceKind === "contract_fetched_submitted_url"
    ) {
      continue;
    }
    const url = String(source?.url ?? "");
    const domain = String(source?.domain ?? "").toLowerCase();
    const snippet = String(source?.snippet ?? "");
    if (!url.startsWith("https://") && !url.startsWith("http://")) continue;
    if (!domain) continue;
    if (snippet.trim().length < 25) continue;
    domains.add(domain);
  }
  return domains.size;
}

async function runFullFlow(client, walletAddress, item, mode, runLabel) {
  const log = (msg) => console.log(`  [${runLabel}] ${msg}`);

  log(`submit_content ("${item.title}")`);
  await write(client, "submit_content", [
    item.title,
    item.url,
    item.content,
    item.claimSummary,
    item.category,
    walletAddress,
    new Date().toISOString(),
  ]);

  const total = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_verifications",
    args: [],
  });
  const ids = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_recent_report_ids",
    args: [1],
  });
  let reportId = "";
  try {
    const arr = JSON.parse(String(ids ?? "[]"));
    reportId = arr[0] ?? "";
  } catch {}
  if (!reportId) throw new Error("could not resolve report_id after submit_content");
  log(`report_id = ${reportId} (total=${total})`);

  log("extract_claims");
  await write(client, "extract_claims", [reportId]);

  if (mode === "ai") {
    const evidenceUrlsText = (item.evidenceUrls ?? [item.url]).join("\n");
    log(`analyse_sources (evidence mode) -> ${evidenceUrlsText.replace(/\n/g, ", ")}`);
    await write(client, "analyse_sources", [reportId, evidenceUrlsText]);

    const snapshotRaw = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_snapshot",
      args: [reportId],
    });
    const snapshot = parseJson(snapshotRaw, {});
    const sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];
    const independentCount = countIndependentSources(sources);
    log(`accepted independent sources = ${independentCount}`);
    if (independentCount < 2) {
      throw new Error(
        `insufficient live evidence accepted (${independentCount}); not finalizing fallback report`
      );
    }
  } else {
    log("use_fallback_sources (fast mode)");
    await write(client, "use_fallback_sources", [reportId]);
  }

  if (mode === "ai") {
    log("analyse_credibility");
    await write(client, "analyse_credibility", [reportId]);
  } else {
    log("use_deterministic_credibility (snapshot fallback)");
    await write(client, "use_deterministic_credibility", [reportId]);
  }

  log("calculate_credibility");
  await write(client, "calculate_credibility", [reportId]);

  log("store_report");
  await write(client, "store_report", [reportId]);

  log("update_reputation");
  await write(client, "update_reputation", [walletAddress, reportId]);

  log("done");
  return reportId;
}

async function main() {
  console.log(`Generating ${NUM_ACCOUNTS} test accounts...`);
  const wallets = [];
  for (let i = 0; i < NUM_ACCOUNTS; i++) {
    const pk = generatePrivateKey();
    const { account, client } = makeClient(pk);
    wallets.push({ privateKey: pk, address: account.address, client });
    console.log(`  [${i}] address=${account.address} pk=${pk}`);
  }

  // Distribute NUM_RUNS full pipeline runs across accounts, alternating
  // fast/evidence mode so every entry point in the flow gets exercised.
  let runCount = 0;
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < NUM_RUNS; i++) {
    const wallet = wallets[i % wallets.length];
    const item = pickItem(i);
    const mode = args.mode ? String(args.mode) : "ai";
    const label = `run ${i + 1}/${NUM_RUNS} acct=${i % wallets.length} mode=${mode}`;
    console.log(`\n=== ${label} ===`);
    try {
      await runFullFlow(wallet.client, wallet.address, item, mode, label);
      ok++;
    } catch (err) {
      failed++;
      console.error(`  FAILED: ${err?.message ?? err}`);
    }
    runCount++;
  }

  console.log(`\nDone. ${ok}/${runCount} full pipeline runs succeeded, ${failed} failed.`);
  console.log(`Approx write-tx count: ${ok * 7} (7 writes per successful run).`);
  console.log("\nTest account private keys (throwaway, StudioNet only):");
  for (const w of wallets) {
    console.log(`  ${w.address}  ${w.privateKey}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
