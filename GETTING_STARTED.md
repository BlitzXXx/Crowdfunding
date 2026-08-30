# 🚀 Getting Started

Get CrowdChain running locally in 10 minutes.

## Prerequisites

- **Node.js** v18+ (`node --version`)
- **Docker Desktop** (running)
- **MetaMask** browser extension (optional, for wallet features)

## 1. Install Dependencies

```bash
# Root level (not needed)
# Install each package independently:

cd contracts && npm install && cd ..
cd subgraph && npm install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## 2. Start Docker Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5433` (user: `crowdchain`, pass: `crowdchain_dev`)
- **Graph Node** on `localhost:8000` (GraphQL), `:8020` (admin), `:8030` (index status)
- **IPFS** on `localhost:5001` (API), `:8080` (gateway)

Verify containers are running:
```bash
docker ps
```

## 3. Configure Environment Variables

```bash
cp contracts/.env.example contracts/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Minimum required** — edit `backend/.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=0xE9C82D2a18d9059f2BB980462831111397Bc406B
PINATA_JWT=your_pinata_jwt
```

**Optional for local testing** (Hardhat node instead of Sepolia):
```
# backend/.env
SEPOLIA_RPC_URL=http://127.0.0.1:8545

# frontend/.env
VITE_CHAIN=localhost
```

See [docs/deployment/KEY_GUIDE.md](docs/deployment/KEY_GUIDE.md) for where to get each key (all free).

## 4. Set Up Database

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 5. Start the Backend

```bash
cd backend
npm run dev
# Runs on http://localhost:3001
# API docs at http://localhost:3001/docs
# Health check at http://localhost:3001/health
```

## 6. Start the Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

## 7. Verify Everything Works

```bash
bash scripts/check-connections.sh
```

Expected output:
```
✓ PostgreSQL connected
✓ Backend healthy, database connected
✓ OpenAPI docs available
✓ Connected to Sepolia
✓ Frontend serving on :5173
✓ PostgreSQL container running
✓ Graph-node container running
✓ IPFS container running
```

## Optional: Local Hardhat Node

For fully local testing without Sepolia:

```bash
# Terminal: Start Hardhat node
cd contracts && npx hardhat node

# Terminal: Deploy contracts locally
cd contracts && npx hardhat run scripts/deploy.js --network localhost

# Update backend/.env
SEPOLIA_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<from deployment output>

# Update frontend/.env
VITE_CHAIN=localhost
VITE_FACTORY_ADDRESS=<from deployment output>
```

## Running Tests

```bash
# Smart contracts (73 tests)
cd contracts && npm test

# Backend API (8 tests)
cd backend && npm test

# Frontend build + typecheck
cd frontend && npm run typecheck && npm run build

# Playwright E2E (requires frontend running)
cd frontend && npx playwright test
```

## Troubleshooting

**Port 5432 already in use:**
```bash
# PostgreSQL is on 5433, not 5432 — check backend/.env
grep DATABASE_URL backend/.env
```

**Docker containers won't start:**
```bash
docker compose down -v   # Remove volumes and recreate
docker compose up -d
```

**Prisma migration fails:**
```bash
cd backend
npx prisma migrate reset    # ⚠️ Deletes all data
npx prisma migrate deploy
npx prisma generate
```

**Backend won't connect to database:**
```bash
# Check if PostgreSQL is running
docker exec crowdfunding-postgres-1 pg_isready -U crowdchain

# Check connection
PGPASSWORD=crowdchain_dev psql -h 127.0.0.1 -p 5433 -U crowdchain -d crowdchain
```

**Frontend shows "Cannot connect to MetaMask":**
This is expected without the MetaMask extension. The app works without wallet connection for browsing.

See [docs/user/TROUBLESHOOTING.md](docs/user/TROUBLESHOOTING.md) for more issues.
