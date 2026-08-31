# 🚀 CrowdChain — Decentralized Crowdfunding Platform

> A full-stack Web3 crowdfunding dApp: Solidity contracts on Ethereum, subgraph indexing, Node.js backend, React frontend.

[![CI](https://github.com/your-username/Crowdfunding/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/Crowdfunding/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Frontend   │────▶│   Backend    │────▶│   PostgreSQL   │
│  React/Vite  │     │  Hono/Prisma │     │  (Docker :5433)│
│  :5173       │     │  :3001       │     └────────────────┘
└──────┬───────┘     └──────┬───────┘
       │                    │
       │ wagmi/viem         │ viem
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│  MetaMask    │     │  Sepolia     │
│  (wallet)    │     │  RPC (Alchemy)│
└──────┬───────┘     └──────┬───────┘
       │                    │
       │                    │ events
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│  Smart       │◀───│  Subgraph    │
│  Contracts   │    │  (Graph Node)│
│  (Factory +  │    │  :8000       │
│   Campaign)  │    └──────────────┘
└──────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** v18+
- **Docker Desktop** (for PostgreSQL + Graph Node + IPFS)
- **MetaMask** browser extension

### 1. Install Dependencies

```bash
cd contracts && npm install && cd ..
cd subgraph && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Start Infrastructure (Docker)

```bash
docker compose up -d
# Starts: PostgreSQL (:5433), Graph Node (:8000), IPFS (:5001)
```

### 3. Set Up Environment Variables

```bash
# Copy example env files and fill in your keys
cp contracts/.env.example contracts/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See [docs/deployment/KEY_GUIDE.md](docs/deployment/KEY_GUIDE.md) for where to get each key (all free for testnet).

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev

# Terminal 3 — Hardhat node (optional, for local testing)
cd contracts && npx hardhat node
```

### 6. Verify Everything Works

```bash
bash scripts/check-connections.sh
```

## Project Structure

```
Crowdfunding/
├── contracts/              # Solidity smart contracts (Hardhat)
│   ├── src/
│   │   ├── CrowdfundingFactory.sol   # Factory: creates campaigns
│   │   └── Campaign.sol             # Individual campaign logic
│   ├── test/               # 73 Hardhat tests (98.9% coverage)
│   ├── scripts/            # Deploy + interact + E2E scripts
│   └── deployments/        # Deployed contract addresses
├── subgraph/               # The Graph subgraph
│   ├── schema.graphql      # Entity definitions
│   ├── src/                # Event handlers
│   └── queries/            # GraphQL query examples
├── backend/                # Hono API server
│   ├── src/routes/         # API routes (7 route groups)
│   │   ├── campaigns.ts    # Campaign metadata CRUD
│   │   ├── blockchain.ts   # On-chain data (Sepolia)
│   │   ├── users.ts        # User profiles
│   │   ├── search.ts       # Search & filtering
│   │   ├── monitoring.ts   # Health & metrics
│   │   ├── ipfs.ts         # IPFS pinning
│   │   └── health.ts       # Health check
│   ├── src/services/       # Business logic (blockchain, IPFS, Prisma)
│   ├── prisma/             # Database schema + migrations
│   └── test/               # 30 backend tests (Vitest)
├── frontend/               # React + Vite + wagmi
│   ├── src/pages/          # Home, Create, Detail, Dashboard, 404
│   ├── src/components/     # UI components, toast, ContributeCard
│   ├── src/hooks/          # useOptimisticCampaign
│   └── e2e/                # 7 Playwright smoke tests
├── scripts/                # Automation scripts
│   ├── check-connections.sh # Verify all services are healthy
│   ├── deploy.sh           # One-command deployment
│   └── pre-commit          # Git pre-commit hook
└── docs/                   # Documentation
    ├── deployment/         # KEY_GUIDE.md, DEPLOYMENT_CHECKLIST.md
    └── user/               # USER_GUIDE.md, TROUBLESHOOTING.md
```

## Tech Stack

| Layer | Tech | Details |
|-------|------|---------|
| **Smart Contracts** | Solidity, Hardhat | Factory pattern, campaign lifecycle, 73 tests, Slither-clean |
| **Indexing** | The Graph, GraphQL | Event indexing, platform stats, search |
| **Storage** | IPFS (Pinata) | Campaign metadata + images |
| **Backend** | Node.js, Hono, Prisma | REST API, Zod validation, rate limiting, 30 tests |
| **Database** | PostgreSQL 16 | Docker, migrations via Prisma |
| **Frontend** | React 19, wagmi v2, Tailwind v4 | MetaMask, optimistic UI, responsive |
| **Testing** | Hardhat, Vitest, Playwright | 110 total tests across all packages |

## Deployed Contracts

| Network | Address | Etherscan |
|---------|---------|-----------|
| **Sepolia** | [`0xE9C82D2a18d9059f2BB980462831111397Bc406B`](https://sepolia.etherscan.io/address/0xE9C82D2a18d9059f2BB980462831111397Bc406B) | ✅ Verified |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (DB + IPFS status) |
| `GET` | `/docs` | OpenAPI documentation (Swagger UI) |
| `GET` | `/openapi.json` | OpenAPI spec |
| `GET` | `/api/v1/blockchain/status` | Chain connection, block number |
| `GET` | `/api/v1/blockchain/campaigns` | All on-chain campaigns |
| `GET` | `/api/v1/blockchain/campaigns/:address` | Single campaign details |
| `GET` | `/api/v1/blockchain/events` | Recent on-chain events |
| `GET` | `/api/v1/blockchain/stats` | Platform statistics |
| `GET` | `/api/v1/users` | List user profiles |
| `GET` | `/api/v1/users/:address` | Get user profile |
| `POST` | `/api/v1/users` | Create/update profile |
| `GET` | `/api/v1/search/campaigns` | Search & filter campaigns |
| `GET` | `/api/v1/search/users` | Search users |
| `GET` | `/api/v1/monitoring` | Comprehensive service health |
| `GET` | `/api/v1/monitoring/metrics` | Prometheus metrics |
| `POST` | `/api/v1/ipfs/json` | Pin JSON to IPFS |
| `POST` | `/api/v1/ipfs/file` | Pin file to IPFS |

## Testing

```bash
# Smart contracts — 73 tests (Slither-clean, 98.9% coverage)
cd contracts && npm test

# Backend API — 30 tests (Vitest)
cd backend && npm test

# Frontend typecheck + build
cd frontend && npm run typecheck && npm run build

# Playwright E2E — 7 tests (requires frontend running)
cd frontend && npx playwright test

# Run all checks at once
cd backend && npm test && cd ../frontend && npm run typecheck && npm run lint
```

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| **Frontend** | Vercel | `frontend/vercel.json` |
| **Backend** | Railway | `backend/railway.json` |
| **Subgraph** | The Graph Studio | `npx graph auth --studio KEY` |
| **Database** | Supabase / Neon | — |
| **IPFS** | Pinata | — |

One-command deploy (after setting up keys):
```bash
bash scripts/deploy.sh           # Deploy everything
bash scripts/deploy.sh contracts # Deploy contracts only
bash scripts/deploy.sh backend   # Deploy backend only
```

See [docs/deployment/DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md) for full checklist.

## Documentation

| Document | Description |
|----------|-------------|
| **[PHASES.md](./PHASES.md)** | Detailed phase breakdown (176/186 tasks complete) |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Local dev setup guide |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Development workflow & code style |
| **[docs/deployment/KEY_GUIDE.md](docs/deployment/KEY_GUIDE.md)** | All API keys (free for testnet) |
| **[docs/deployment/DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md)** | Step-by-step deploy |
| **[docs/user/USER_GUIDE.md](docs/user/USER_GUIDE.md)** | End-user guide |
| **[docs/user/TROUBLESHOOTING.md](docs/user/TROUBLESHOOTING.md)** | Common issues & fixes |

## Security

- **Smart contracts**: Slither static analysis — 0 high/medium findings
- **Backend**: Rate limiting, CORS allowlist, Zod validation, Helmet-style headers
- **Frontend**: No secrets in bundle, no dangerouslySetInnerHTML/eval, all external links use rel=noreferrer
- **API keys**: Never committed to git (all in `.env` files, gitignored)

See [docs/security/](docs/security/) for full reports.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, code style, and PR process.

## License

MIT
