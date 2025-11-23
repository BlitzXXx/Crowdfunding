# Quick Reference Guide

Essential commands and reference information for the Crowdfunding DApp project.

## 📁 Project Structure

```
Crowdfunding/
├── contracts/          → Phase 2: Solidity smart contracts
├── subgraph/          → Phase 4: The Graph indexing
├── backend/           → Phase 3: Node.js API
├── frontend/          → Phase 5: React frontend
├── docs/              → Documentation
└── scripts/           → Deployment scripts
```

## 🚀 Quick Start Commands

### Initial Setup
```bash
# Navigate to project
cd /home/user/Crowdfunding

# Review blueprint
cat BLUEPRINT.md

# Review phases
cat PHASES.md

# Start with getting started guide
cat GETTING_STARTED.md
```

## 📋 Phase-by-Phase Commands

### Phase 1: Architecture & Setup
```bash
# Install MetaMask browser extension
# Get Sepolia testnet ETH
# Review architecture documentation
cat docs/architecture/SYSTEM_OVERVIEW.md
```

### Phase 2: Smart Contracts
```bash
cd contracts

# Initialize Hardhat
npm init -y
npm install --save-dev hardhat
npx hardhat init

# Install dependencies
npm install @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Check coverage
npx hardhat coverage

# Deploy to local network
npx hardhat node                                    # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Phase 3: Backend
```bash
cd backend

# Initialize project
npm init -y

# Install dependencies
npm install express cors dotenv ethers@6 @prisma/client @pinata/sdk
npm install --save-dev typescript @types/node @types/express ts-node nodemon prisma

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# Run tests
npm test
```

### Phase 4: Subgraph
```bash
cd subgraph

# Install Graph CLI globally
npm install -g @graphprotocol/graph-cli

# Initialize subgraph
graph init --studio crowdfunding-platform

# Authenticate
graph auth --studio YOUR_DEPLOY_KEY

# Generate code
graph codegen

# Build subgraph
graph build

# Deploy to Studio
graph deploy --studio crowdfunding-platform

# Test queries (after deployment)
# Visit: https://thegraph.com/studio/subgraph/crowdfunding-platform
```

### Phase 5: Frontend
```bash
cd frontend

# Create Vite + React project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install react-router-dom ethers@6 @apollo/client graphql
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react date-fns

# Install TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Phase 6: Testing & Deployment
```bash
# Deploy frontend to Vercel
npm install -g vercel
vercel

# Deploy backend to Railway
# Visit: https://railway.app

# Full E2E test
npm run test:e2e
```

## 🔑 Environment Variables

### Contracts (.env)
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/crowdfunding
SEPOLIA_RPC_URL=your_rpc_url
CONTRACT_ADDRESS=deployed_factory_address
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

### Frontend (.env)
```env
VITE_FACTORY_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../crowdfunding-platform/v0.0.1
VITE_BACKEND_URL=http://localhost:3001
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

## 🧪 Testing Commands

### Smart Contracts
```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/Campaign.test.js

# Run with gas reporter
REPORT_GAS=true npx hardhat test

# Coverage
npx hardhat coverage

# Security analysis
slither .
myth analyze contracts/Campaign.sol
```

### Backend
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test campaigns.test.ts
```

### Frontend
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🔍 Common GraphQL Queries

### Get Active Campaigns
```graphql
query {
  campaigns(where: { state: Active }, first: 10) {
    id
    title
    goal
    totalFunds
    deadline
  }
}
```

### Get Campaign Details
```graphql
query GetCampaign($id: ID!) {
  campaign(id: $id) {
    id
    creator { id }
    title
    goal
    totalFunds
    contributions {
      contributor { id }
      amount
      timestamp
    }
  }
}
```

### Get User Profile
```graphql
query GetUser($address: ID!) {
  user(id: $address) {
    totalCampaigns
    totalContributed
    campaignsCreated { id title }
    contributions { campaign { id } amount }
  }
}
```

## 🛠️ Useful Hardhat Tasks

```bash
# List accounts
npx hardhat accounts

# Get balance
npx hardhat balance --account 0xYourAddress

# Clean artifacts
npx hardhat clean

# Compile contracts
npx hardhat compile

# Run Hardhat console
npx hardhat console --network sepolia
```

## 📊 Contract Addresses (After Deployment)

```bash
# Save your deployed addresses here
CrowdfundingFactory (Sepolia): 0x...
Campaign Template (Sepolia): 0x...

# Mainnet (when ready)
CrowdfundingFactory (Mainnet): 0x...
```

## 🔗 Important Links

### Documentation
- Main Blueprint: `BLUEPRINT.md`
- Phases Guide: `PHASES.md`
- Getting Started: `GETTING_STARTED.md`
- Tech Stack: `TECH_STACK.md`
- Architecture: `docs/architecture/SYSTEM_OVERVIEW.md`

### Contract READMEs
- Contracts: `contracts/README.md`
- Backend: `backend/README.md`
- Subgraph: `subgraph/README.md`
- Frontend: `frontend/README.md`

### External Resources
- Hardhat: https://hardhat.org/docs
- The Graph: https://thegraph.com/docs
- ethers.js: https://docs.ethers.org/v6/
- React: https://react.dev/

## 🎯 Learning Checkpoints

### After Phase 2
- [ ] Understand Solidity syntax
- [ ] Know how to write tests
- [ ] Deployed to testnet
- [ ] Verified on Etherscan

### After Phase 4
- [ ] Understand The Graph
- [ ] Can write GraphQL queries
- [ ] Subgraph deployed and syncing

### After Phase 5
- [ ] Can connect wallet
- [ ] Handle transactions in UI
- [ ] Query indexed data

### After Phase 6
- [ ] Full DApp deployed
- [ ] Portfolio-ready project
- [ ] Deep Web3 knowledge

## 🐛 Troubleshooting

### Common Issues

**MetaMask not connecting**
```javascript
// Check if MetaMask is installed
if (typeof window.ethereum === 'undefined') {
  alert('Please install MetaMask!')
}
```

**Wrong network**
```javascript
// Check chain ID
const chainId = await provider.getNetwork()
if (chainId.chainId !== 11155111) {
  alert('Please switch to Sepolia network')
}
```

**Transaction failing**
```bash
# Check gas estimation
npx hardhat run scripts/estimate-gas.js

# Increase gas limit in transaction
{ gasLimit: 500000 }
```

**Subgraph not syncing**
```bash
# Check deployment status
graph deploy --studio crowdfunding-platform --version-label v0.0.2

# Check logs in Subgraph Studio
```

## 📝 Git Workflow

```bash
# Check status
git status

# Add files
git add .

# Commit with message
git commit -m "feat: implement Campaign contract"

# Push to feature branch
git push -u origin claude/web3-full-stack-project-01C3Mmzt11rQUZVqybLf2Fes

# Create pull request (if needed)
# Use GitHub UI or gh CLI
```

## 🎓 Key Concepts Reference

### Gas Optimization
- Use `uint256` instead of smaller uints (unless packing)
- Cache storage variables in memory
- Use `calldata` for function parameters
- Batch operations when possible

### Security Patterns
- Checks-Effects-Interactions
- ReentrancyGuard
- Pull over Push payments
- Access control modifiers

### Web3 UX Patterns
- Show transaction status
- Handle pending states
- Optimistic UI updates
- Clear error messages

---

**Keep this file bookmarked for quick reference throughout the project!**
