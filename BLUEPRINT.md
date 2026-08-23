# Web3 Crowdfunding Platform - Complete Blueprint

## 🎯 Project Overview

A fully decentralized crowdfunding platform where creators can launch campaigns, backers can contribute cryptocurrency, and all operations are transparently executed on the blockchain. This end-to-end system demonstrates every major Web3 concept in a real-world application.

## 📚 Learning Objectives

Through this project, you will master:

### Smart Contract Concepts
- **Contract Architecture**: Factory pattern, modular design
- **State Management**: Storage optimization, state variables
- **Access Control**: Owner permissions, modifiers, role-based access
- **Transaction Handling**: Payable functions, ETH transfers, refunds
- **Gas Optimization**: Efficient loops, storage patterns, batch operations
- **Events & Logging**: Indexed parameters, event emission, off-chain tracking
- **Security**: Reentrancy guards, checks-effects-interactions, overflow protection
- **Upgradability**: Proxy patterns (optional advanced topic)

### Blockchain Fundamentals
- **Wallet Integration**: MetaMask connection, account management
- **Transaction Lifecycle**: Signing, broadcasting, confirmation, receipts
- **Gas Mechanics**: Gas estimation, price strategies, optimization
- **Network Interaction**: Reading blockchain state, writing transactions
- **Event Monitoring**: Real-time event listening, historical event queries
- **Block Confirmations**: Transaction finality, reorganization handling

### Web3 Infrastructure
- **Indexing & Queries**: The Graph subgraphs, GraphQL APIs
- **Decentralized Storage**: IPFS for campaign metadata and media
- **Off-Chain Services**: Backend APIs, caching, aggregation
- **Oracle Integration**: Price feeds (optional)
- **Testing Infrastructure**: Hardhat, local blockchain, test networks

### Frontend Integration
- **Web3 Libraries**: ethers.js deep dive
- **State Management**: Wallet state, transaction state, contract state
- **UI/UX Patterns**: Loading states, error handling, optimistic updates
- **Real-time Updates**: Event subscriptions, polling strategies

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  (React + ethers.js + TailwindCSS + GraphQL Client)        │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             │ Web3 Calls                   │ REST/GraphQL
             │                              │
┌────────────▼──────────────┐  ┌───────────▼─────────────────┐
│   BLOCKCHAIN LAYER         │  │   BACKEND SERVICES          │
│                            │  │                             │
│  Smart Contracts:          │  │  - REST API                 │
│  • CrowdfundingFactory     │  │  - Data Aggregation         │
│  • Campaign                │  │  - IPFS Gateway             │
│  • (ERC20 Token - optional)│  │  - Caching Layer            │
│                            │  │                             │
│  Network: Ethereum/Polygon │  │  Tech: Node.js/Express      │
└────────────┬───────────────┘  └─────────────────────────────┘
             │                              ▲
             │ Events                       │
             │                              │
┌────────────▼──────────────────────────────┴─────────────────┐
│                    INDEXING LAYER                           │
│                 (The Graph - Subgraph)                      │
│                                                             │
│  - Index blockchain events                                 │
│  - Build queryable database                                │
│  - Provide GraphQL API                                     │
└─────────────────────────────────────────────────────────────┘
             │
             │
┌────────────▼─────────────────────────────────────────────────┐
│                  STORAGE LAYER                               │
│                                                              │
│  IPFS: Campaign metadata, images, documents                 │
│  Database (optional): User preferences, analytics           │
└──────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

> Updated Aug 2026 to current best practices.

### Blockchain & Smart Contracts
| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | ^0.8.28 | Smart contract language (custom errors, Cancun EVM) |
| **Hardhat** | ^2.26 | Development environment (EDR-based network) |
| **OpenZeppelin Contracts** | ^5.x | ReentrancyGuard, Initializable, Clones (EIP-1167) |
| **ethers.js** | ^6.x | Contract interaction in scripts/tests |

**Architecture highlights**: campaigns deploy as CREATE2-deterministic minimal proxies (~80% cheaper than full deploys), gas-optimized custom errors replace require strings, pull-payment refunds, creator cancellation flow.

### Indexing & Querying
- **The Graph**: Subgraph Studio for event indexing (AssemblyScript mappings)
- **Ponder** *(alternative)*: TypeScript-native indexer, great DX for app-specific chains
- **IPFS**: Pinata (pinning + gateways); `helia`/`@pinata/sdk` clients

### Backend Services
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Hono (TypeScript-first, ultra-fast) — replaces Express
- **Validation**: Zod schemas shared between API routes
- **Database**: PostgreSQL + Prisma ORM
- **Caching**: Redis (optional)
- **Testing**: Vitest + Supertest

### Frontend
- **Framework**: React 19 + Vite (TypeScript)
- **Web3 Layer**: wagmi v2 + viem v2 (replaces raw ethers.js integration)
- **Wallet UX**: ConnectKit or RainbowKit-style modal — MetaMask, WalletConnect, Coinbase Wallet, embedded wallets out of the box
- **Data Fetching**: TanStack Query v5 (contract reads + GraphQL via request fetchers)
- **Styling**: TailwindCSS v4
- **State**: Zustand (app state), wagmi hooks (wallet/chain state)
- **UI Components**: Radix UI primitives + Lucide icons
- **Forms**: react-hook-form + zod resolvers

### DevOps & Deployment
- **Smart Contracts**: Hardhat Ignition modules (declarative deploys)
- **Verification**: hardhat-verify (Etherscan V2 API)
- **Frontend**: Vercel
- **Backend**: Railway / Render / Fly.io
- **Subgraph**: The Graph Studio
- **CI/CD**: GitHub Actions (test → coverage → deploy pipeline)

## 📋 High-Level Features

### Core Campaign Features
- Create crowdfunding campaigns with funding goals and deadlines
- Contribute cryptocurrency to campaigns
- Automatic refunds if funding goal not met by deadline
- Campaign creator withdrawal after successful funding
- Campaign cancellation with automatic refunds

### Advanced Features
- Milestone-based funding (stretch goals)
- Campaign categories and tagging
- Rich campaign pages with IPFS-hosted media
- Contribution tiers with rewards metadata
- Campaign updates and announcements
- Search and filter campaigns
- User profiles and contribution history

### Blockchain Features Demonstrated
- Factory pattern for campaign deployment
- Event emission for all state changes
- Gas-optimized data structures
- Reentrancy protection
- Time-based logic (deadlines)
- Conditional logic (funding goals)
- ETH transfer patterns
- Campaign state machines

## 🚀 Project Phases

> **Progress legend**: ✅ Complete · 🔨 In progress · ⬜ Not started

### Phase 1: Architecture & Setup ✅ (Week 1)
**Goal**: Set up development environment and understand the system architecture

**Deliverables**:
- ✅ Development environment configuration
- ✅ Project structure scaffolding
- ✅ Architecture documentation
- ✅ Development workflow setup
- ✅ Git repository structure

**Key Learnings**:
- Hardhat project setup and configuration
- Network configuration (local, testnet, mainnet)
- Environment variable management
- Development best practices

---

### Phase 2: Smart Contracts Development ✅ (Week 2-3)
**Goal**: Build, test, and deploy core smart contracts

**Deliverables**:
- ✅ CrowdfundingFactory contract (minimal-proxy clones, deterministic addresses)
- ✅ Campaign contract with full lifecycle (contribute / withdraw / refund / **cancel**)
- ✅ Comprehensive test suite — 73 tests, 98.9% statement coverage, 100% line coverage
- ✅ Gas optimization (custom errors, EIP-1167 clones, unchecked loops)
- ⬜ Static analysis pass (Slither) — scheduled with Phase 6 security review

**Key Learnings**:
- Solidity programming patterns
- Factory pattern implementation
- Event design and emission
- Gas optimization techniques
- Smart contract security
- Testing strategies
- Deployment scripts

---

### Phase 3: Backend & Off-Chain Services 🔨 (Week 4)
**Goal**: Build supporting backend services and IPFS integration

**Deliverables**:
- 🔨 REST API for campaign metadata (Hono + Zod + Prisma)
- ⬜ IPFS integration for file storage (Pinata)
- ⬜ Database schema for off-chain data
- ⬜ API documentation (OpenAPI)
- ⬜ Health monitoring endpoints

**Key Learnings**:
- IPFS upload and retrieval
- Off-chain data modeling
- API design for Web3 apps
- Metadata standards (JSON schema)
- Rate limiting and caching

---

### Phase 4: Indexing & Subgraph ⬜ (Week 5)
**Goal**: Index blockchain events for efficient querying

**Deliverables**:
- ⬜ The Graph subgraph definition (graph-cli latest, AssemblyScript)
- ⬜ Event handlers for all contract events (incl. CampaignCancelled)
- ⬜ GraphQL schema
- ⬜ Subgraph deployment (Studio)
- ⬜ Query examples and documentation

**Key Learnings**:
- The Graph architecture
- Subgraph manifest creation
- Event handler development
- GraphQL schema design
- Efficient query patterns
- Subgraph deployment and versioning

---

### Phase 5: Frontend Development ⬜ (Week 6-7)
**Goal**: Build a complete user interface with Web3 integration

**Deliverables**:
- ⬜ Wallet connection flow (wagmi v2 + ConnectKit — multi-wallet, not just MetaMask)
- ⬜ Campaign creation interface
- ⬜ Campaign browsing and filtering
- ⬜ Contribution flow with transaction feedback
- ⬜ User dashboard
- ⬜ Responsive design

**Key Learnings**:
- ethers.js integration patterns
- Wallet state management
- Transaction lifecycle handling
- Event listening in UI
- Error handling and user feedback
- Optimistic UI updates
- Web3 UX best practices

---

### Phase 6: Testing & Deployment ⬜ (Week 8)
**Goal**: Comprehensive testing and production deployment

**Deliverables**:
- ⬜ End-to-end testing suite (Playwright)
- ⬜ Testnet deployment (Hardhat Ignition + Etherscan V2 verification)
- ⬜ Production deployment checklist
- ⬜ User documentation
- ⬜ Video demo

**Key Learnings**:
- Integration testing strategies
- Testnet deployment workflow
- Mainnet deployment considerations
- Gas cost analysis
- Security best practices
- Production monitoring
- User onboarding strategies

## 📊 Success Metrics

By completing this project, you will have:

- ✅ Written and deployed production-ready smart contracts
- ✅ Implemented comprehensive testing (>90% coverage)
- ✅ Built a fully functional indexing layer
- ✅ Created off-chain services for enhanced UX
- ✅ Developed a complete frontend with Web3 integration
- ✅ Deployed to testnet and understood mainnet deployment
- ✅ Handled real ETH transactions and wallet interactions
- ✅ Optimized for gas efficiency
- ✅ Implemented security best practices
- ✅ Created a portfolio-worthy project

## 🎓 Skill Progression

### Beginner → Intermediate
- Phases 1-2: Smart contract basics, deployment, testing
- Learn Solidity fundamentals and Hardhat

### Intermediate → Advanced
- Phases 3-4: Off-chain architecture, indexing, events
- Understand full-stack Web3 architecture

### Advanced → Expert
- Phases 5-6: Complex integrations, optimization, production
- Master real-world Web3 development

## 📁 Repository Structure

```
crowdfunding-dapp/
├── contracts/               # Phase 2: Smart contracts
│   ├── src/
│   ├── test/
│   ├── scripts/
│   └── hardhat.config.js
│
├── subgraph/               # Phase 4: The Graph indexing
│   ├── src/
│   ├── schema.graphql
│   └── subgraph.yaml
│
├── backend/                # Phase 3: Off-chain services
│   ├── src/
│   ├── routes/
│   └── package.json
│
├── frontend/               # Phase 5: React app
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/                   # Documentation
│   ├── architecture/
│   ├── api/
│   └── user-guides/
│
└── scripts/                # Automation scripts
    └── deploy/
```

## 🔄 Development Workflow

1. **Local Development**: Hardhat local node for rapid iteration
2. **Testing**: Comprehensive test suite before deployment
3. **Testnet Deployment**: Deploy to Sepolia for integration testing
4. **Subgraph Deployment**: Deploy to The Graph Studio
5. **Frontend Integration**: Connect all components
6. **Production Deployment**: Deploy to mainnet (optional)

## 🎯 Next Steps

1. ✅ Review this blueprint
2. → Proceed to **Phase 1**: Architecture & Setup
3. → Set up development environment
4. → Initialize project structure
5. → Begin Phase 2: Smart Contracts

---

**Ready to build?** Let's start with Phase 1 and set up your development environment!
