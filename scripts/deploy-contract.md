# Deploying the TrustDSource Unified GenLayer Contract

## Prerequisites

- GenLayer Studio account at https://studio.genlayer.com
- Wallet connected to GenLayer StudioNet
- Current contract source: `contracts/TrustDSource.py`

## Steps

1. Open GenLayer Studio.
2. Create a new Intelligent Contract.
3. Paste the full contents of `contracts/TrustDSource.py`.
4. Deploy to StudioNet.
5. Copy the deployed contract address.
6. Set the address in `apps/web/.env.local`:

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

## Post-Deploy Smoke Check

From the app, connect a wallet and run `/verify`.

Expected behavior:

- `submit_content` creates an on-chain snapshot.
- `extract_claims` prepares deterministic claim objects.
- submitted-source-only evidence remains `UNVERIFIED`;
- accepted independent evidence can unlock stronger verdicts;
- `get_report` returns the final report and hash.

Do not deploy old split-contract examples or files from an
`intelligent-contract/` directory. The current project uses the unified
contract in `contracts/TrustDSource.py`.
