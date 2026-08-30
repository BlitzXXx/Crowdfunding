# 🚀 CrowdChain — Decentralized Crowdfunding Platform

> A full-stack Web3 crowdfunding dApp: Solidity contracts on Ethereum, subgraph indexing, Node.js backend, React frontend.

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
cd contracts && npm install
cd ../subgraph && npm install
cd ../backend && npm install
cd ../frontend && npm install
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
│   ├── src/routes/         # API routes (campaigns, users, search, blockchain, monitoring)
│   ├── src/services/       # Business logic (blockchain, IPFS, Prisma)
│   ├── prisma/             # Database schema + migrations
│   └── test/               # API tests (8 tests)
├── frontend/               # React + Vite + wagmi
│   ├── src/pages/          # Home, Create, Detail, Dashboard, 404
│   ├── src/components/     # UI components, toast, ContributeCard
│   ├── src/hooks/          # useOptimisticCampaign
│   └── e2e/                # Playwright smoke tests (7 tests)
├── scripts/                # Automation (check-connections.sh)
└── docs/                   # Deployment, security, guides
```

## Tech Stack

| Layer | Tech | Details |
|-------|------|---------|
| **Smart Contracts** | Solidity, Hardhat | Factory pattern, campaign lifecycle, 73 tests |
| **Indexing** | The Graph, GraphQL | Event indexing, platform stats, search |
| **Storage** | IPFS (Pinata) | Campaign metadata + images |
| **Backend** | Node.js, Hono, Prisma | REST API, Zod validation, rate limiting |
| **Database** | PostgreSQL 16 | Docker, migrations via Prisma |
| **Frontend** | React 19, wagmi v2, Tailwind v4 | MetaMask, optimistic UI, responsive |
| **Testing** | Hardhat, Vitest, Playwright | Unit + integration + E2E |

## Deployed Contracts

| Network | Address | Etherscan |
|---------|---------|-----------|
| **Sepolia** | [`0xE9C82D2a18d9059f2BB980462831111397Bc406B`](https://sepolia.etherscan.io/address/0xE9C82D2a18d9059f2BB980462831111397Bc406B) | ✅ Verified |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (DB + IPFS status) |
| `GET` | `/docs` | OpenAPI documentation |
| `GET` | `/api/v1/blockchain/status` | Chain connection, block number |
| `GET` | `/api/v1/blockchain/campaigns` | All on-chain campaigns |
| `GET` | `/api/v1/blockchain/stats` | Platform statistics |
| `GET` | `/api/v1/users/:address` | User profile |
| `GET` | `/api/v1/search` | Search campaigns |
| `GET` | `/api/v1/monitoring/indexing` | Subgraph indexing status |

## Testing

```bash
# Smart contracts (73 tests)
cd contracts && npm test

# Backend API (8 tests)
cd backend && npm test

# Frontend typecheck + build
cd frontend && npm run typecheck && npm run build

# Playwright E2E (7 tests, requires dev server running)
cd frontend && npx playwright test
```

## Deployment

- **Frontend** → Vercel (config: `frontend/vercel.json`)
- **Backend** → Railway (config: `backend/railway.json`)
- **Subgraph** → The Graph Studio (`npx graph auth --studio KEY && npm run deploy:studio`)

See [docs/deployment/DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md) for full checklist.

## Documentation

- **[PHASES.md](./PHASES.md)** — Detailed phase breakdown (168/178 tasks complete)
- **[docs/deployment/KEY_GUIDE.md](docs/deployment/KEY_GUIDE.md)** — All API keys (free)
- **[docs/deployment/DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md)** — Step-by-step deploy
- **[docs/user/USER_GUIDE.md](docs/user/USER_GUIDE.md)** — End-user guide
- **[docs/user/TROUBLESHOOTING.md](docs/user/TROUBLESHOOTING.md)** — Common issues

## License

MIT
