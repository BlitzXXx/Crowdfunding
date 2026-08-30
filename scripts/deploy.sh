#!/bin/bash
# CrowdChain Deployment Script
# Deploys the full stack: contracts → subgraph → backend → frontend
#
# Usage:
#   bash scripts/deploy.sh              # Deploy all
#   bash scripts/deploy.sh contracts    # Deploy contracts only
#   bash scripts/deploy.sh subgraph     # Deploy subgraph only
#   bash scripts/deploy.sh backend      # Deploy backend only
#   bash scripts/deploy.sh frontend     # Deploy frontend only

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}▸${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

TARGET=${1:-all}

# ─── Contracts ──────────────────────────────────────────────
deploy_contracts() {
  step "Deploying smart contracts to Sepolia..."

  # Check required env vars
  [ -f contracts/.env ] || fail "contracts/.env not found. Run: cp contracts/.env.example contracts/.env"
  source contracts/.env

  [ -z "$SEPOLIA_RPC_URL" ] && fail "SEPOLIA_RPC_URL not set in contracts/.env"
  [ -z "$PRIVATE_KEY" ] && fail "PRIVATE_KEY not set in contracts/.env"

  cd contracts
  npm install --silent
  npx hardhat compile
  npx hardhat run scripts/deploy.js --network sepolia

  # Read deployed address
  if [ -f deployments/sepolia.json ]; then
    ADDR=$(node -e "console.log(require('./deployments/sepolia.json').address)")
    echo ""
    step "Contract deployed at: $ADDR"
    step "Verify on Etherscan: npx hardhat verify --network sepolia $ADDR"

    # Update backend and frontend configs
    cd ..
    sed -i "s/^CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$ADDR/" backend/.env
    sed -i "s/^VITE_FACTORY_ADDRESS=.*/VITE_FACTORY_ADDRESS=$ADDR/" frontend/.env
    step "Updated backend/.env and frontend/.env with new address"
  fi

  cd ..
}

# ─── Subgraph ───────────────────────────────────────────────
deploy_subgraph() {
  step "Deploying subgraph to The Graph Studio..."

  [ -f subgraph/subgraph.yaml ] || fail "subgraph/subgraph.yaml not found. Run: cd subgraph && npm run build"

  cd subgraph
  npm install --silent

  # Check for auth
  if ! npx graph auth --studio 2>/dev/null; then
    warn "Not authenticated with The Graph Studio."
    echo "  Run: npx graph auth --studio YOUR_DEPLOY_KEY"
    echo "  Get key from: https://thegraph.com/studio → your subgraph → Settings → Deploy Key"
    cd ..
    return 1
  fi

  npm run deploy:studio
  cd ..
}

# ─── Backend ────────────────────────────────────────────────
deploy_backend() {
  step "Deploying backend..."

  [ -f backend/.env ] || fail "backend/.env not found. Run: cp backend/.env.example backend/.env"

  cd backend
  npm install --silent
  npx prisma generate
  npx prisma migrate deploy
  npm run build

  step "Backend built successfully."
  step "Deploy to Railway: push this repo with backend/railway.json configured"
  step "Or run locally: PORT=3001 node dist/index.js"
  cd ..
}

# ─── Frontend ───────────────────────────────────────────────
deploy_frontend() {
  step "Deploying frontend..."

  [ -f frontend/.env ] || fail "frontend/.env not found. Run: cp frontend/.env.example frontend/.env"

  cd frontend
  npm install --silent
  npm run typecheck
  npm run lint
  npm run build

  step "Frontend built successfully."
  step "Deploy to Vercel: push this repo with frontend/vercel.json configured"
  step "Or preview locally: npx vite preview"
  cd ..
}

# ─── Main ───────────────────────────────────────────────────
echo "🚀 CrowdChain Deployment"
echo "========================"

case $TARGET in
  contracts) deploy_contracts ;;
  subgraph)  deploy_subgraph ;;
  backend)   deploy_backend ;;
  frontend)  deploy_frontend ;;
  all)
    deploy_contracts
    deploy_subgraph
    deploy_backend
    deploy_frontend
    echo ""
    step "All deployments complete!"
    ;;
  *)
    echo "Usage: bash scripts/deploy.sh [contracts|subgraph|backend|frontend|all]"
    exit 1
    ;;
esac
