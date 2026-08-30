#!/bin/bash
# CrowdChain Connection Health Check
# Verifies all services are connected and communicating correctly

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo "CrowdChain Connection Check"
echo "=============================="
echo ""

# 1. PostgreSQL
echo "Database (PostgreSQL on :5433)"
if PGPASSWORD=crowdchain_dev psql -h 127.0.0.1 -p 5433 -U crowdchain -d crowdchain -c "SELECT 1" &>/dev/null; then
  pass "PostgreSQL connected (crowdchain@localhost:5433)"
else
  fail "PostgreSQL not reachable"
fi

# 2. Backend API
echo ""
echo "Backend API (:3001)"
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"ok"'; then
  DB_STATUS=$(echo "$HEALTH" | grep -o '"connected":true')
  if [ -n "$DB_STATUS" ]; then
    pass "Backend healthy, database connected"
  else
    warn "Backend healthy but database not connected"
  fi
else
  fail "Backend not reachable on :3001"
fi

# 3. OpenAPI docs
echo ""
echo "API Documentation (:3001/docs)"
DOCS=$(curl -s http://localhost:3001/openapi.json 2>/dev/null)
if echo "$DOCS" | grep -q '"openapi"'; then
  pass "OpenAPI docs available"
else
  fail "OpenAPI docs not available"
fi

# 4. Blockchain service
echo ""
echo "Blockchain (Sepolia)"
CHAIN_STATUS=$(curl -s http://localhost:3001/api/v1/blockchain/status 2>/dev/null)
if echo "$CHAIN_STATUS" | grep -q '"connected":true'; then
  pass "Connected to Sepolia"
else
  fail "Blockchain not connected"
fi

# 5. Hardhat local node
echo ""
echo "Hardhat Local Node (:8545)"
if curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null | grep -q '"result"'; then
  pass "Hardhat node running on :8545"
else
  warn "Hardhat node not running"
fi

# 6. Subgraph
echo ""
echo "Subgraph (:8000)"
if curl -s -X POST http://localhost:8000/subgraphs/name/crowdfunding -H "Content-Type: application/json" \
  -d '{"query":"{ platformStats { id totalCampaigns } }"}' 2>/dev/null | grep -q 'platformStats'; then
  pass "Subgraph serving queries on :8000"
else
  warn "Subgraph not available locally"
fi

# 7. Frontend
echo ""
echo "Frontend (:5173)"
if curl -s http://localhost:5173 2>/dev/null | grep -q "CrowdChain"; then
  pass "Frontend serving on :5173"
else
  warn "Frontend not running (run: cd frontend && npm run dev)"
fi

# 8. Docker
echo ""
echo "Docker Services"
if docker ps 2>/dev/null | grep -q "crowdfunding-postgres"; then
  pass "PostgreSQL container running"
else
  warn "PostgreSQL container not running"
fi
if docker ps 2>/dev/null | grep -q "crowdfunding-graph-node"; then
  pass "Graph-node container running"
else
  warn "Graph-node container not running"
fi
if docker ps 2>/dev/null | grep -q "crowdfunding-ipfs"; then
  pass "IPFS container running"
else
  warn "IPFS container not running"
fi

echo ""
echo "=============================="
