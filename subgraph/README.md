# Subgraph (Phase 4)

This directory contains The Graph subgraph for indexing blockchain events.

## 🎯 Phase 4 Overview

**Goal**: Build and deploy a subgraph to index all campaign events

**Duration**: 1 week

**Key Deliverables**:
- GraphQL schema
- Event handlers
- Deployed subgraph
- Query examples
- Documentation

## 📁 Directory Structure

```
subgraph/
├── src/
│   ├── mapping.ts           # Event handlers
│   └── utils.ts             # Helper functions
│
├── abis/                    # Contract ABIs
│   ├── CrowdfundingFactory.json
│   └── Campaign.json
│
├── schema.graphql           # GraphQL schema
├── subgraph.yaml           # Subgraph manifest
├── networks.json           # Network configurations
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## 🚀 Getting Started

### 1. Install Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

### 2. Initialize Subgraph

```bash
cd subgraph
graph init --studio crowdfunding-platform
```

Or manually:
```bash
npm init -y
npm install --save-dev @graphprotocol/graph-cli @graphprotocol/graph-ts
```

### 3. Authentication

```bash
# Get deploy key from https://thegraph.com/studio/
graph auth --studio <DEPLOY_KEY>
```

## 📝 GraphQL Schema

### schema.graphql

```graphql
type Campaign @entity {
  id: ID!                              # Campaign contract address
  creator: User!                       # Creator reference
  title: String                        # From metadata
  description: String                  # From metadata
  category: String                     # From metadata
  goal: BigInt!                        # Funding goal in wei
  deadline: BigInt!                    # Deadline timestamp
  totalFunds: BigInt!                  # Total raised
  contributorsCount: Int!              # Number of contributors
  state: CampaignState!                # Active/Successful/Failed
  ipfsHash: String                     # Metadata IPFS hash

  contributions: [Contribution!]! @derivedFrom(field: "campaign")

  createdAt: BigInt!                   # Block timestamp
  createdAtBlock: BigInt!              # Block number
  updatedAt: BigInt!                   # Last update timestamp
  transactionHash: String!             # Creation tx hash
}

type User @entity {
  id: ID!                              # User address
  campaignsCreated: [Campaign!]! @derivedFrom(field: "creator")
  contributions: [Contribution!]! @derivedFrom(field: "contributor")
  totalCampaigns: Int!                 # Total campaigns created
  totalContributed: BigInt!            # Total amount contributed
  totalContributions: Int!             # Number of contributions

  createdAt: BigInt!
}

type Contribution @entity {
  id: ID!                              # tx hash + log index
  campaign: Campaign!
  contributor: User!
  amount: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: String!
}

type Withdrawal @entity {
  id: ID!                              # tx hash + log index
  campaign: Campaign!
  amount: BigInt!
  timestamp: BigInt!
  transactionHash: String!
}

type Refund @entity {
  id: ID!                              # tx hash + log index
  campaign: Campaign!
  contributor: User!
  amount: BigInt!
  timestamp: BigInt!
  transactionHash: String!
}

type GlobalStats @entity {
  id: ID!                              # Singleton: "1"
  totalCampaigns: Int!
  totalContributions: Int!
  totalFundsRaised: BigInt!
  totalUsers: Int!
  activeCampaigns: Int!
  successfulCampaigns: Int!
  failedCampaigns: Int!
}

enum CampaignState {
  Active
  Successful
  Failed
  Cancelled
}
```

## 🔧 Subgraph Manifest

### subgraph.yaml

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  # CrowdfundingFactory
  - kind: ethereum
    name: CrowdfundingFactory
    network: sepolia
    source:
      address: "0xYourFactoryAddress"
      abi: CrowdfundingFactory
      startBlock: 1234567
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Campaign
        - User
        - GlobalStats
      abis:
        - name: CrowdfundingFactory
          file: ./abis/CrowdfundingFactory.json
        - name: Campaign
          file: ./abis/Campaign.json
      eventHandlers:
        - event: CampaignCreated(indexed address,indexed address,uint256,uint256)
          handler: handleCampaignCreated
      file: ./src/mapping.ts

templates:
  # Campaign template (for dynamically created contracts)
  - kind: ethereum
    name: Campaign
    network: sepolia
    source:
      abi: Campaign
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Campaign
        - Contribution
        - User
        - Withdrawal
        - Refund
      abis:
        - name: Campaign
          file: ./abis/Campaign.json
      eventHandlers:
        - event: ContributionMade(indexed address,uint256)
          handler: handleContributionMade
        - event: GoalReached(uint256)
          handler: handleGoalReached
        - event: WithdrawalMade(indexed address,uint256)
          handler: handleWithdrawalMade
        - event: RefundClaimed(indexed address,uint256)
          handler: handleRefundClaimed
      file: ./src/mapping.ts
```

## 🔨 Event Handlers

### src/mapping.ts

```typescript
import { BigInt, Bytes, dataSource } from "@graphprotocol/graph-ts"
import {
  CampaignCreated,
} from "../generated/CrowdfundingFactory/CrowdfundingFactory"
import {
  ContributionMade,
  GoalReached,
  WithdrawalMade,
  RefundClaimed,
  Campaign as CampaignContract
} from "../generated/templates/Campaign/Campaign"
import {
  Campaign,
  User,
  Contribution,
  Withdrawal,
  Refund,
  GlobalStats
} from "../generated/schema"
import { Campaign as CampaignTemplate } from "../generated/templates"

// Handler for CampaignCreated event
export function handleCampaignCreated(event: CampaignCreated): void {
  // Create Campaign entity
  let campaign = new Campaign(event.params.campaignAddress.toHexString())

  campaign.creator = getOrCreateUser(event.params.creator).id
  campaign.goal = event.params.goal
  campaign.deadline = event.params.deadline
  campaign.totalFunds = BigInt.fromI32(0)
  campaign.contributorsCount = 0
  campaign.state = "Active"
  campaign.createdAt = event.block.timestamp
  campaign.createdAtBlock = event.block.number
  campaign.updatedAt = event.block.timestamp
  campaign.transactionHash = event.transaction.hash.toHexString()

  // Try to get additional data from contract
  let campaignContract = CampaignContract.bind(event.params.campaignAddress)
  let ipfsHashResult = campaignContract.try_ipfsHash()
  if (!ipfsHashResult.reverted) {
    campaign.ipfsHash = ipfsHashResult.value
  }

  campaign.save()

  // Start indexing this campaign
  CampaignTemplate.create(event.params.campaignAddress)

  // Update user stats
  let user = getOrCreateUser(event.params.creator)
  user.totalCampaigns = user.totalCampaigns + 1
  user.save()

  // Update global stats
  updateGlobalStats(true, false, false, BigInt.fromI32(0))
}

// Handler for ContributionMade event
export function handleContributionMade(event: ContributionMade): void {
  let campaignAddress = dataSource.address()
  let campaign = Campaign.load(campaignAddress.toHexString())

  if (campaign == null) {
    return
  }

  // Create Contribution entity
  let contributionId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let contribution = new Contribution(contributionId)

  contribution.campaign = campaign.id
  contribution.contributor = getOrCreateUser(event.params.contributor).id
  contribution.amount = event.params.amount
  contribution.timestamp = event.block.timestamp
  contribution.blockNumber = event.block.number
  contribution.transactionHash = event.transaction.hash.toHexString()

  contribution.save()

  // Update campaign
  campaign.totalFunds = campaign.totalFunds.plus(event.params.amount)
  campaign.contributorsCount = campaign.contributorsCount + 1
  campaign.updatedAt = event.block.timestamp
  campaign.save()

  // Update user stats
  let user = getOrCreateUser(event.params.contributor)
  user.totalContributed = user.totalContributed.plus(event.params.amount)
  user.totalContributions = user.totalContributions + 1
  user.save()

  // Update global stats
  updateGlobalStats(false, false, false, event.params.amount)
}

// Handler for GoalReached event
export function handleGoalReached(event: GoalReached): void {
  let campaignAddress = dataSource.address()
  let campaign = Campaign.load(campaignAddress.toHexString())

  if (campaign == null) {
    return
  }

  campaign.state = "Successful"
  campaign.updatedAt = event.block.timestamp
  campaign.save()

  // Update global stats
  updateGlobalStatsOnCampaignEnd(true)
}

// Handler for WithdrawalMade event
export function handleWithdrawalMade(event: WithdrawalMade): void {
  let campaignAddress = dataSource.address()

  // Create Withdrawal entity
  let withdrawalId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let withdrawal = new Withdrawal(withdrawalId)

  withdrawal.campaign = campaignAddress.toHexString()
  withdrawal.amount = event.params.amount
  withdrawal.timestamp = event.block.timestamp
  withdrawal.transactionHash = event.transaction.hash.toHexString()

  withdrawal.save()
}

// Handler for RefundClaimed event
export function handleRefundClaimed(event: RefundClaimed): void {
  let campaignAddress = dataSource.address()
  let campaign = Campaign.load(campaignAddress.toHexString())

  if (campaign == null) {
    return
  }

  // Create Refund entity
  let refundId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let refund = new Refund(refundId)

  refund.campaign = campaign.id
  refund.contributor = getOrCreateUser(event.params.contributor).id
  refund.amount = event.params.amount
  refund.timestamp = event.block.timestamp
  refund.transactionHash = event.transaction.hash.toHexString()

  refund.save()

  // Update campaign state if not already failed
  if (campaign.state != "Failed") {
    campaign.state = "Failed"
    campaign.updatedAt = event.block.timestamp
    campaign.save()

    updateGlobalStatsOnCampaignEnd(false)
  }
}

// Helper: Get or create user
function getOrCreateUser(address: Bytes): User {
  let userId = address.toHexString()
  let user = User.load(userId)

  if (user == null) {
    user = new User(userId)
    user.totalCampaigns = 0
    user.totalContributed = BigInt.fromI32(0)
    user.totalContributions = 0
    user.createdAt = BigInt.fromI32(0) // Will be set properly in first interaction
    user.save()

    // Update global user count
    let stats = getGlobalStats()
    stats.totalUsers = stats.totalUsers + 1
    stats.save()
  }

  return user
}

// Helper: Get global stats (singleton)
function getGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("1")

  if (stats == null) {
    stats = new GlobalStats("1")
    stats.totalCampaigns = 0
    stats.totalContributions = 0
    stats.totalFundsRaised = BigInt.fromI32(0)
    stats.totalUsers = 0
    stats.activeCampaigns = 0
    stats.successfulCampaigns = 0
    stats.failedCampaigns = 0
    stats.save()
  }

  return stats
}

// Helper: Update global stats
function updateGlobalStats(
  newCampaign: boolean,
  contribution: boolean,
  campaignEnded: boolean,
  amount: BigInt
): void {
  let stats = getGlobalStats()

  if (newCampaign) {
    stats.totalCampaigns = stats.totalCampaigns + 1
    stats.activeCampaigns = stats.activeCampaigns + 1
  }

  if (contribution) {
    stats.totalContributions = stats.totalContributions + 1
    stats.totalFundsRaised = stats.totalFundsRaised.plus(amount)
  }

  stats.save()
}

function updateGlobalStatsOnCampaignEnd(successful: boolean): void {
  let stats = getGlobalStats()
  stats.activeCampaigns = stats.activeCampaigns - 1

  if (successful) {
    stats.successfulCampaigns = stats.successfulCampaigns + 1
  } else {
    stats.failedCampaigns = stats.failedCampaigns + 1
  }

  stats.save()
}
```

## 📊 Example Queries

> These match the actual schema in `schema.graphql`. Campaign/User ids are lowercase hex addresses.

### Get Active Campaigns (not ended, not cancelled, goal not reached)
```graphql
query GetActiveCampaigns {
  campaigns(
    where: { goalReached: false, cancelled: false, deadline_gt: "1756000000" }
    orderBy: createdAt
    orderDirection: desc
    first: 10
  ) {
    id
    creator { id }
    goal
    totalFunds
    deadline
    contributorsCount
    createdAt
  }
}
```

### Get Campaign Details with Contributions and Refunds
```graphql
query GetCampaign($id: ID!) {
  campaign(id: $id) {
    id
    creator { id campaignsCreatedCount }
    goal
    deadline
    totalFunds
    refundedAmount
    withdrawnAmount
    goalReached
    fundsWithdrawn
    cancelled
    contributorsCount
    contributions(orderBy: blockTimestamp, orderDirection: desc) {
      id
      contributor { id }
      amount
      blockTimestamp
    }
    refunds { id contributor { id } amount }
  }
}
```

### Get User Profile
```graphql
query GetUser($address: ID!) {
  user(id: $address) {
    id
    campaignsCreatedCount
    contributionsCount
    totalContributed
    totalRefunded
    campaignsCreated { id goal totalFunds goalReached cancelled }
    contributions(orderBy: blockTimestamp, orderDirection: desc) {
      id
      amount
      campaign { id }
    }
  }
}
```

### Get Platform Statistics (singleton)
```graphql
query GetPlatformStats {
  platformStats(id: "platform") {
    totalCampaigns
    successfulCampaigns
    cancelledCampaigns
    totalContributionCount
    totalVolume
    totalWithdrawn
    totalRefunded
    updatedAt
  }
}
```

## 🚀 Deployment

### Generate Code
```bash
graph codegen
```

### Build
```bash
graph build
```

### Deploy to Subgraph Studio
```bash
graph deploy --studio crowdfunding-platform
```

### Deploy to Hosted Service (deprecated but still works)
```bash
graph deploy --product hosted-service <GITHUB_USER>/crowdfunding-platform
```

## 🧪 Testing

### Local Testing with Graph Node

```bash
# Clone graph-node
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker

# Start services
docker-compose up

# Deploy locally
graph create --node http://localhost:8020/ crowdfunding-platform
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 crowdfunding-platform
```

### Query GraphQL Playground
```
http://localhost:8000/subgraphs/name/crowdfunding-platform
```

## 📊 Phase 4 Checklist

- [x] Graph CLI installed (local devDependency, no global install needed)
- [x] Subgraph initialized (`subgraph.template.yaml` + `networks.json` + configure script)
- [x] GraphQL schema designed (Campaign, User, Contribution, Withdrawal, Refund, PlatformStats)
- [x] ABIs extracted from compiled contracts into `abis/`
- [x] subgraph.yaml configured per network (`npm run configure:sepolia|configure:localhost`)
- [x] Event handlers implemented — all 6 events incl. CampaignCancelled
- [x] Helper functions created (`src/utils.ts`)
- [x] Code generated (`npm run codegen`)
- [x] Subgraph built successfully (`npm run build` → `build/subgraph.yaml`)
- [ ] Local testing with graph-node *(requires Docker)*
- [ ] Deployed to Subgraph Studio *(requires Studio deploy key)*
- [ ] Queries tested against live endpoint
- [x] Query examples documented

## 📚 Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [AssemblyScript Documentation](https://www.assemblyscript.org/)
- [Subgraph Studio](https://thegraph.com/studio/)
- [GraphQL Documentation](https://graphql.org/learn/)

## 🔜 Next Phase

Once Phase 4 is complete, proceed to:
- **Phase 5**: Frontend Development

---

**Status**: 🟢 Built & verified locally — deployment pending Studio deploy key + real factory address on Sepolia
