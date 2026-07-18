# TrustDSource

TrustDSource is a GenLayer-based claim verification project focused on
evidence provenance, immutable content snapshots, deterministic scoring, and
researcher reputation.

The project is intentionally one end-to-end product, not a collection of small
demos. A submitted article, post, or claim is locked as an on-chain snapshot.
The contract extracts claims, records source evidence, bounds credibility
scores by accepted evidence, stores the final report hash, and updates the
submitter's reputation.

## Why GenLayer

TrustDSource uses GenLayer where validator consensus adds value:

- content snapshots and report hashes are stored on-chain;
- every pipeline step is wallet-signed and auditable;
- AI-assisted source and credibility analysis is bounded by contract checks;
- submitted-only evidence remains `UNVERIFIED` instead of receiving an
  unsupported credibility verdict;
- validator checks reject thin source outputs that only satisfy JSON shape.

This is not an off-chain recommendation or summary app with a chain wrapper.
The core value is the verifiable verification record.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, App Router
- Smart contract: GenLayer Intelligent Contract in `contracts/TrustDSource.py`
- Wallet: wagmi, viem, genlayer-js

## Project Structure

```text
trustdsource/
+-- apps/web/                 Next.js frontend
+-- contracts/TrustDSource.py Unified GenLayer contract
+-- tests/contract/           Contract behavior tests
+-- scripts/                  Setup and deployment notes
```

## Setup

```powershell
npm install --legacy-peer-deps
Copy-Item .env.example apps\web\.env.local
npm run dev
```

Fill `apps/web/.env.local` with:

- `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS`
- WalletConnect project ID, if required by your wallet setup

## Deploy the Contract

See `scripts/deploy-contract.md`.

Deploy the full contents of `contracts/TrustDSource.py` to GenLayer StudioNet,
then set the returned address as:

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xYOUR_ADDRESS
```

## Unified Contract API

| Function | Purpose |
| --- | --- |
| `submit_content` | Lock submitted title, URL, content, claim summary, and wallet |
| `extract_claims` | Deterministically prepare claim objects |
| `use_fallback_sources` | Record submitted-source snapshot evidence only |
| `analyse_sources` | Accept AI-assisted source references only when they contain URL/domain/snippet evidence |
| `use_deterministic_credibility` | Compute deterministic evidence-bound analysis |
| `analyse_credibility` | AI-assisted analysis bounded by accepted evidence |
| `calculate_credibility` | Compute the final score and verdict |
| `store_report` | Store the report hash and analytics |
| `update_reputation` | Update the submitter's on-chain profile |
| `get_report` | Read a report |
| `get_profile` | Read a wallet profile |
| `get_analytics` | Read aggregate analytics |

## Evidence Policy

- Submitted content alone can create an immutable snapshot, but it does not
  prove the factual claim.
- If no independent external source reference is accepted, the contract returns
  `UNVERIFIED`.
- One independent source caps the possible credibility result.
- Multiple accepted independent sources are required for stronger verdicts.
- Source validators require real URL/domain/snippet substance, not just valid
  JSON.

## Scripts

```powershell
npm run dev
npm run build
npm run lint
npm run type-check --workspace=apps/web
```
