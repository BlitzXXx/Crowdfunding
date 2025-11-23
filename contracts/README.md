# Smart Contracts (Phase 2)

This directory contains all smart contract code for the Crowdfunding DApp.

## 🎯 Phase 2 Overview

**Goal**: Build, test, and deploy production-ready smart contracts

**Duration**: 2 weeks

**Key Deliverables**:
- CrowdfundingFactory contract
- Campaign contract
- Comprehensive test suite (>90% coverage)
- Deployment scripts
- Gas optimization

## 📁 Directory Structure

```
contracts/
├── src/                          # Smart contract source files
│   ├── CrowdfundingFactory.sol  # Factory contract for creating campaigns
│   ├── Campaign.sol             # Individual campaign contract
│   ├── interfaces/              # Contract interfaces
│   │   ├── ICrowdfundingFactory.sol
│   │   └── ICampaign.sol
│   └── libraries/               # Reusable libraries (if needed)
│
├── test/                        # Test files
│   ├── CrowdfundingFactory.test.js
│   ├── Campaign.test.js
│   └── integration/
│       └── fullWorkflow.test.js
│
├── scripts/                     # Deployment and utility scripts
│   ├── deploy.js               # Main deployment script
│   ├── verify.js               # Etherscan verification
│   └── interact.js             # Contract interaction examples
│
├── hardhat.config.js           # Hardhat configuration
├── .env.example                # Environment variables template
└── package.json                # Dependencies
```

## 🚀 Getting Started

### 1. Initialize Hardhat Project

```bash
cd contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Choose "Create a TypeScript project" (or JavaScript if preferred)

### 2. Install Dependencies

```bash
npm install @openzeppelin/contracts dotenv
npm install --save-dev @nomicfoundation/hardhat-chai-matchers @nomicfoundation/hardhat-ethers ethers
```

### 3. Configure Hardhat

Edit `hardhat.config.js` to include:
- Solidity version: ^0.8.20
- Networks: localhost, Sepolia
- Etherscan API key for verification

### 4. Set Up Environment Variables

Create `.env` file:
```
SEPOLIA_RPC_URL=your_infura_or_alchemy_url
PRIVATE_KEY=your_testnet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 📝 Contract Specifications

### CrowdfundingFactory.sol

**Purpose**: Factory contract for creating and tracking Campaign contracts

**Key Functions**:
- `createCampaign()` - Deploy new campaign contract
- `getCampaigns()` - Get all campaigns
- `getCampaignsByCreator()` - Get campaigns by creator address

**Events**:
- `CampaignCreated(address indexed campaign, address indexed creator, uint256 goal)`

### Campaign.sol

**Purpose**: Individual crowdfunding campaign with contributions and withdrawals

**Key Functions**:
- `contribute()` - Accept contributions (payable)
- `withdraw()` - Creator withdraws funds (after goal reached)
- `refund()` - Contributors get refunds (if goal not met)
- `getCampaignDetails()` - Get campaign information
- `getContributors()` - Get list of contributors

**State Variables**:
- `creator` - Campaign creator address
- `goal` - Funding goal in wei
- `deadline` - Campaign deadline timestamp
- `totalFunds` - Total funds raised
- `state` - Campaign state (Active, Successful, Failed)

**Events**:
- `ContributionMade(address indexed contributor, uint256 amount)`
- `GoalReached(uint256 totalAmount)`
- `WithdrawalMade(address indexed creator, uint256 amount)`
- `RefundClaimed(address indexed contributor, uint256 amount)`

**Modifiers**:
- `onlyCreator()` - Restrict to campaign creator
- `campaignActive()` - Check if campaign is active
- `afterDeadline()` - Check if deadline has passed

## 🧪 Testing Strategy

### Unit Tests
- Test each function independently
- Test all modifiers
- Test edge cases (zero amounts, exact goal, etc.)
- Test access control
- Test events emission

### Integration Tests
- Full campaign lifecycle (create → contribute → withdraw)
- Refund scenario (create → contribute → deadline passes → refund)
- Multiple campaigns
- Multiple contributors

### Coverage Goals
- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: 100%

```bash
# Run tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test file
npx hardhat test test/Campaign.test.js
```

## 🔒 Security Considerations

### Checks-Effects-Interactions Pattern
Always follow this pattern to prevent reentrancy:
1. Checks (require statements)
2. Effects (state changes)
3. Interactions (external calls)

### Key Security Features
- ✅ ReentrancyGuard for fund transfers
- ✅ Access control modifiers
- ✅ Input validation
- ✅ State machine for campaign status
- ✅ Pull payment pattern for refunds
- ✅ Event emission for all state changes

### Security Checklist
- [ ] No reentrancy vulnerabilities
- [ ] No integer overflow/underflow (using Solidity 0.8+)
- [ ] Proper access control on all functions
- [ ] No unchecked external calls
- [ ] Proper event emission
- [ ] Gas optimization doesn't compromise security

## ⛽ Gas Optimization

### Strategies
- Use `uint256` instead of smaller uints (unless packing)
- Pack struct variables efficiently
- Use events instead of storage where possible
- Batch operations when possible
- Use `calldata` instead of `memory` for function parameters
- Cache storage variables in memory

### Analysis
```bash
# Get gas report
REPORT_GAS=true npx hardhat test
```

## 🚀 Deployment

### Local Deployment
```bash
# Start local node
npx hardhat node

# Deploy (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet Deployment
```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 📊 Phase 2 Checklist

- [ ] Hardhat project initialized
- [ ] Dependencies installed
- [ ] Configuration complete
- [ ] CrowdfundingFactory contract written
- [ ] Campaign contract written
- [ ] All events defined
- [ ] All modifiers implemented
- [ ] Unit tests written (>90% coverage)
- [ ] Integration tests written
- [ ] Gas optimization performed
- [ ] Security review completed
- [ ] Deployment scripts written
- [ ] Local deployment successful
- [ ] Sepolia deployment successful
- [ ] Contracts verified on Etherscan

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)

## 🔜 Next Phase

Once Phase 2 is complete, proceed to:
- **Phase 3**: Backend & Off-Chain Services
- **Phase 4**: Indexing & Subgraph (can be done in parallel with Phase 3)

---

**Status**: 🔴 Not Started

When you're ready to begin, let's initialize the Hardhat project and write our first contract!
