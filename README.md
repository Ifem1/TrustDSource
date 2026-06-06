# Trustdsource

**GenLayer-powered misinformation detection and credibility verification platform.**

> Submit any article, tweet, or claim. GenLayer's AI consensus extracts facts, discovers sources, and returns an immutable credibility score — stored on-chain forever.

---

## Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, App Router
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Smart Contracts**: GenLayer Intelligent Contracts (Python)
- **Wallet**: wagmi + viem

---

## Project Structure

```
trustdsource/
├── apps/web/                    # Next.js frontend
│   └── src/
│       ├── app/                 # App Router pages + API routes
│       ├── components/          # UI components
│       ├── features/            # Feature modules
│       ├── hooks/               # React hooks
│       ├── lib/                 # Supabase + GenLayer clients
│       ├── providers/           # Context providers
│       ├── types/               # TypeScript types
│       └── constants/           # App constants
├── intelligent-contract/        # GenLayer contract (Python)
│   ├── trustdsource_contract.py # Main contract
│   ├── scoring_engine.py
│   ├── credibility_engine.py
│   ├── source_discovery.py
│   └── claim_extractor.py
├── supabase/
│   ├── migrations/              # SQL migrations
│   ├── functions/               # Edge functions
│   └── seeds/                   # Seed data
├── tests/                       # Test suite
└── scripts/                     # Setup scripts
```

---

## Setup

### 1. Clone and install

```powershell
cd apps\web
npm install --legacy-peer-deps
```

### 2. Configure environment

```powershell
Copy-Item .env.local.example .env.local
```

Edit `.env.local` with your:
- Supabase project URL and keys
- GenLayer contract address (after deployment)
- WalletConnect project ID

### 3. Set up Supabase

In your [Supabase dashboard](https://app.supabase.com) SQL Editor, run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_views_and_triggers.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. (Optional) `supabase/seeds/001_seed_data.sql`

### 4. Deploy the GenLayer Contract

See `scripts/deploy-contract.md` for step-by-step instructions.

Deploy `intelligent-contract/trustdsource_contract.py` to GenLayer StudioNet at https://studio.genlayer.com

Set the returned contract address in `.env.local`:
```
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xYOUR_ADDRESS
```

### 5. Run the development server

```powershell
npm run dev
```

Open http://localhost:3000

---

## GenLayer Contract

The `Trustdsource` intelligent contract provides:

| Function | Description |
|---|---|
| `submit_content()` | Lock content snapshot, begin verification |
| `extract_claims()` | LLM-powered claim extraction |
| `discover_sources()` | Web search for primary sources |
| `verify_claims()` | Cross-reference and evaluate credibility |
| `calculate_credibility()` | Compute composite trust score |
| `store_report()` | Persist report on-chain |
| `update_reputation()` | Update researcher reputation |
| `get_report()` | Read a verification report |
| `get_profile()` | Read a wallet's on-chain profile |
| `get_analytics()` | Read daily analytics data |
| `get_total_verifications()` | Platform-wide verification count |

---

## Verdict Scale

| Verdict | Score Range |
|---|---|
| HIGH_CREDIBILITY | 80–100 |
| MODERATE_CREDIBILITY | 55–79 |
| LOW_CREDIBILITY | 30–54 |
| MISLEADING | < 30 with misinfo signals |
| UNVERIFIED | Insufficient sources |

---

## Reputation Tiers

| Tier | Points Required |
|---|---|
| New | 0 |
| Analyst | 50 |
| Researcher | 200 |
| Trusted Researcher | 500 |
| Verification Expert | 1000 |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/verify` | Submit content for verification |
| `/report/[id]` | View full verification report |
| `/explore` | Browse all reports |
| `/history` | Personal verification history |
| `/dashboard` | User dashboard |
| `/profile/[wallet]` | Public researcher profile |
| `/analytics` | Platform analytics |
| `/reputation` | Global leaderboard |
