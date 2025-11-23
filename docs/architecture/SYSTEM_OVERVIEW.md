# System Architecture Overview

## High-Level Architecture

The Crowdfunding DApp is built on a modern Web3 architecture with multiple layers working together:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│                    (Web Browser + MetaMask)                     │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │ Web3 Calls                        │ HTTP/GraphQL
             │ (ethers.js)                       │
             │                                    │
┌────────────▼──────────────┐    ┌───────────────▼──────────────┐
│    BLOCKCHAIN LAYER        │    │     APPLICATION LAYER        │
│                            │    │                              │
│  ┌──────────────────────┐ │    │  ┌────────────────────────┐ │
│  │ CrowdfundingFactory  │ │    │  │   Frontend (React)     │ │
│  │   - createCampaign() │ │    │  │   - Campaign UI        │ │
│  │   - getCampaigns()   │ │    │  │   - Wallet Integration │ │
│  └──────────────────────┘ │    │  │   - Transaction UI     │ │
│                            │    │  └────────────────────────┘ │
│  ┌──────────────────────┐ │    │                              │
│  │   Campaign [1..n]    │ │    │  ┌────────────────────────┐ │
│  │   - contribute()     │ │    │  │   Backend API          │ │
│  │   - withdraw()       │ │    │  │   - Metadata Storage   │ │
│  │   - refund()         │ │    │  │   - IPFS Gateway       │ │
│  └──────────────────────┘ │    │  │   - Analytics          │ │
│                            │    │  └────────────────────────┘ │
│  Events:                   │    │                              │
│  - CampaignCreated        │    │  ┌────────────────────────┐ │
│  - ContributionMade       │    │  │   The Graph Subgraph   │ │
│  - GoalReached            │    │  │   - Event Indexing     │ │
│  - WithdrawalMade         │────┼──│   - GraphQL API        │ │
│  - RefundClaimed          │    │  │   - Query Optimization │ │
│                            │    │  └────────────────────────┘ │
│  Network: Sepolia/Mainnet  │    │                              │
└────────────────────────────┘    └──────────────────────────────┘
             │                                    │
             │                                    │
             └────────────┬───────────────────────┘
                          │
                          │
              ┌───────────▼────────────┐
              │   STORAGE LAYER        │
              │                        │
              │  - IPFS (Pinata)      │
              │  - PostgreSQL         │
              └────────────────────────┘
```

## Component Breakdown

### 1. Blockchain Layer

#### Smart Contracts

**CrowdfundingFactory.sol**
- **Responsibility**: Campaign creation and registry
- **Pattern**: Factory pattern for deploying Campaign contracts
- **State**: Array of campaign addresses
- **Access**: Public (anyone can create campaigns)

```solidity
Key Functions:
- createCampaign(goal, deadline, ipfsHash) → address
- getCampaigns() → address[]
- getCampaignsByCreator(address) → address[]

Events:
- CampaignCreated(campaignAddress, creator, goal, deadline)
```

**Campaign.sol**
- **Responsibility**: Individual campaign logic
- **Pattern**: State machine (Active → Successful/Failed)
- **State**: Goal, deadline, contributions, creator
- **Access**: Public contributions, creator-only withdrawals

```solidity
Key Functions:
- contribute() payable
- withdraw() onlyCreator
- refund()
- getCampaignDetails() view
- getContributors() view

Events:
- ContributionMade(contributor, amount)
- GoalReached(totalAmount)
- WithdrawalMade(creator, amount)
- RefundClaimed(contributor, amount)

Modifiers:
- onlyCreator
- campaignActive
- afterDeadline
```

#### Smart Contract Architecture Patterns

1. **Factory Pattern**
   - CrowdfundingFactory creates Campaign instances
   - Each campaign is an independent contract
   - Benefits: Isolation, gas efficiency, scalability

2. **Pull Payment Pattern**
   - Contributors pull refunds (don't receive automatically)
   - Prevents reentrancy attacks
   - Gas-efficient for campaign creator

3. **State Machine**
   ```
   Active → [Goal Reached] → Successful
         → [Deadline Passed, Goal Not Reached] → Failed
   ```

4. **Access Control**
   - onlyCreator modifier for withdrawals
   - Public functions for contributions
   - View functions for transparency

### 2. Indexing Layer (The Graph)

#### Subgraph Components

**Entities** (GraphQL Schema)
- Campaign: Full campaign details
- User: Aggregated user data
- Contribution: Individual contributions
- Withdrawal: Withdrawal records
- Refund: Refund records
- GlobalStats: Platform-wide statistics

**Event Handlers** (AssemblyScript)
```typescript
handleCampaignCreated()
  → Create Campaign entity
  → Create/Update User entity
  → Update GlobalStats
  → Start indexing new Campaign contract

handleContributionMade()
  → Create Contribution entity
  → Update Campaign totalFunds
  → Update User contribution stats
  → Update GlobalStats

handleGoalReached()
  → Update Campaign state to Successful
  → Update GlobalStats

handleWithdrawalMade()
  → Create Withdrawal entity

handleRefundClaimed()
  → Create Refund entity
  → Update Campaign state to Failed (if first refund)
```

**Data Flow**
```
Blockchain Event
  → Subgraph Handler
    → Entity Creation/Update
      → GraphQL API Update
        → Frontend Query Result
```

### 3. Backend Layer

#### API Architecture

```
Express.js Server
├── Routes Layer (HTTP endpoints)
│   ├── /api/campaigns
│   ├── /api/ipfs
│   └── /api/users
│
├── Controller Layer (Request handling)
│   ├── campaignController
│   ├── ipfsController
│   └── userController
│
├── Service Layer (Business logic)
│   ├── ipfsService → Pinata
│   ├── blockchainService → ethers.js
│   └── cacheService → Redis
│
└── Data Layer
    ├── Prisma ORM → PostgreSQL
    └── Redis Cache
```

#### Backend Responsibilities

1. **IPFS Integration**
   - Upload campaign metadata
   - Upload images/media
   - Provide IPFS gateway
   - Pin important content

2. **Metadata Management**
   - Store rich campaign data (not on-chain)
   - Search and filter functionality
   - Analytics and statistics

3. **Blockchain Monitoring**
   - Listen to contract events
   - Sync state with database
   - Provide real-time updates

4. **Caching**
   - Cache frequent queries
   - Cache IPFS content
   - Rate limiting

### 4. Frontend Layer

#### React Application Architecture

```
Frontend Architecture
├── Presentation Layer
│   ├── Pages (Routes)
│   │   ├── Home
│   │   ├── Browse
│   │   ├── CampaignDetail
│   │   ├── CreateCampaign
│   │   └── Dashboard
│   │
│   └── Components
│       ├── Layout (Header, Footer)
│       ├── Campaign (CampaignCard, ProgressBar)
│       ├── Wallet (WalletConnect, NetworkSwitch)
│       └── UI (Button, Modal, Loading)
│
├── State Management Layer
│   ├── Web3Context (Wallet, Provider, Signer)
│   └── ToastContext (Notifications)
│
├── Data Layer
│   ├── GraphQL Client (Apollo)
│   ├── Contract Interaction (ethers.js)
│   └── API Client (Axios)
│
└── Business Logic Layer
    ├── Hooks
    │   ├── useWallet
    │   ├── useContract
    │   ├── useTransaction
    │   └── useCampaigns
    │
    └── Services
        ├── contractService
        ├── ipfsService
        └── apiService
```

#### Frontend Data Flow

```
User Action
  → Event Handler
    → Hook (useTransaction)
      → Contract Call (ethers.js)
        → Transaction Sent
          → Wait for Confirmation
            → Event Emitted
              → Subgraph Indexed
                → GraphQL Query
                  → UI Update
```

## Data Models

### On-Chain Data (Smart Contracts)

```solidity
struct CampaignData {
    address creator;
    uint256 goal;
    uint256 deadline;
    uint256 totalFunds;
    string ipfsHash;
    CampaignState state;
}

struct Contribution {
    address contributor;
    uint256 amount;
    uint256 timestamp;
}
```

### Off-Chain Data (IPFS)

```json
{
  "version": "1.0",
  "title": "Campaign Title",
  "description": "Detailed description...",
  "category": "technology",
  "image": "ipfs://Qm...",
  "video": "ipfs://Qm...",
  "rewards": [...],
  "team": [...],
  "milestones": [...]
}
```

### Indexed Data (The Graph)

```graphql
type Campaign {
  id: ID!                    # Contract address
  creator: User!
  goal: BigInt!
  deadline: BigInt!
  totalFunds: BigInt!
  state: CampaignState!
  contributions: [Contribution!]!
  # ... metadata from IPFS
}
```

### Database Data (PostgreSQL)

```prisma
model Campaign {
  id              String
  contractAddress String   @unique
  creatorAddress  String
  title           String
  description     String
  category        String
  ipfsHash        String
  # ... cached data for performance
}
```

## Communication Patterns

### 1. User → Blockchain (Write Operations)

```
User Action (Contribute)
  → Frontend validates input
    → ethers.js prepares transaction
      → MetaMask shows confirmation
        → User signs transaction
          → Transaction sent to blockchain
            → Mining/Confirmation
              → Event emitted
                → Frontend listens to event
                  → UI update (success)
```

### 2. Blockchain → Indexer → Frontend (Read Operations)

```
Smart Contract emits Event
  → The Graph subgraph catches event
    → Handler processes event
      → Entity updated in graph-node
        → GraphQL API reflects change
          → Frontend polls/subscribes
            → UI updates automatically
```

### 3. Frontend → Backend → IPFS (Metadata)

```
User creates campaign
  → Frontend collects data
    → Upload to IPFS via backend
      → IPFS returns hash
        → Include hash in contract creation
          → Store metadata in database
            → Link via ipfsHash
```

## Security Architecture

### Smart Contract Security

1. **Reentrancy Protection**
   - ReentrancyGuard on all fund transfers
   - Checks-Effects-Interactions pattern

2. **Access Control**
   - onlyCreator modifier
   - Proper function visibility

3. **Input Validation**
   - Require statements for all inputs
   - State validation

4. **Integer Safety**
   - Solidity 0.8+ (built-in overflow protection)

### Backend Security

1. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration
   - Helmet.js headers

2. **Data Security**
   - Environment variables for secrets
   - Database connection security
   - API key protection

### Frontend Security

1. **Wallet Security**
   - Never request private keys
   - Always use MetaMask signing
   - Validate contract addresses

2. **Transaction Security**
   - Show transaction details before signing
   - Verify contract address
   - Handle transaction errors

## Scalability Considerations

### On-Chain Scalability

1. **Gas Optimization**
   - Efficient storage patterns
   - Batch operations
   - Minimal on-chain data

2. **Factory Pattern Benefits**
   - Independent campaigns
   - No single point of failure
   - Horizontal scaling

### Off-Chain Scalability

1. **Subgraph Indexing**
   - Fast queries without blockchain calls
   - Cached data
   - Complex aggregations

2. **Backend Caching**
   - Redis for frequent queries
   - IPFS content caching
   - Database query optimization

3. **Frontend Optimization**
   - Lazy loading
   - Virtual scrolling for lists
   - Optimistic UI updates

## Deployment Architecture

### Development
```
Local Hardhat Node → Local Graph Node → Local Backend → Local Frontend
```

### Staging
```
Sepolia Testnet → Graph Studio → Railway Backend → Vercel Preview
```

### Production
```
Mainnet/Polygon → Graph Studio → Railway Production → Vercel Production
```

## Monitoring & Observability

### Smart Contracts
- Etherscan for transaction history
- Tenderly for monitoring
- Event logs for debugging

### Subgraph
- Subgraph Studio dashboard
- Query analytics
- Indexing status

### Backend
- Application logs (Winston)
- Error tracking (Sentry)
- API metrics

### Frontend
- User analytics
- Error tracking
- Performance monitoring

---

This architecture provides a robust, scalable, and secure foundation for the crowdfunding DApp while teaching all major Web3 concepts.
