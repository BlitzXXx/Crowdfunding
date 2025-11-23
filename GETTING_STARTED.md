# 🚀 Getting Started Guide

This guide will walk you through setting up your development environment and starting Phase 1 of the Web3 Crowdfunding Platform project.

## 📋 Prerequisites

Before you begin, ensure you have the following:

### Required Software
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn**: Package manager (comes with Node.js)
- **Git**: Version control ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

### Recommended VS Code Extensions
```
- Solidity (Juan Blanco)
- ESLint
- Prettier
- GitLens
- Tailwind CSS IntelliSense
```

### Blockchain Tools
- **MetaMask**: Browser wallet extension ([Install](https://metamask.io/))
- **Sepolia ETH**: Testnet funds from faucets (we'll get these later)

## 🔧 Phase 1: Initial Setup

### Step 1: Verify Prerequisites

Check your installations:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

### Step 2: Project Repository

You're already in the project directory. Let's verify:

```bash
# Check current directory
pwd

# Should show: /home/user/Crowdfunding
```

### Step 3: Review Project Structure

Review the blueprint and phases:

```bash
# Read the blueprint
cat BLUEPRINT.md

# Read phase details
cat PHASES.md

# Check current structure
ls -la
```

## 📁 Directory Structure Overview

We'll create the following structure throughout the project:

```
Crowdfunding/
├── contracts/              # Phase 2: Smart Contracts
│   ├── src/
│   │   ├── CrowdfundingFactory.sol
│   │   └── Campaign.sol
│   ├── test/
│   ├── scripts/
│   ├── hardhat.config.js
│   └── package.json
│
├── subgraph/              # Phase 4: The Graph
│   ├── src/
│   ├── schema.graphql
│   ├── subgraph.yaml
│   └── package.json
│
├── backend/               # Phase 3: Backend Services
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── app.ts
│   ├── prisma/
│   └── package.json
│
├── frontend/              # Phase 5: React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
├── docs/                  # Documentation
│   ├── architecture/
│   ├── api/
│   └── guides/
│
└── scripts/               # Deployment scripts
    └── deploy/
```

## 🎯 Phase 1 Checklist

Follow this checklist to complete Phase 1:

### ✅ 1.1 Environment Verification
- [ ] Node.js v18+ installed
- [ ] npm/yarn installed
- [ ] Git configured
- [ ] VS Code with extensions
- [ ] MetaMask installed

### ✅ 1.2 Understanding the Architecture
- [ ] Read BLUEPRINT.md completely
- [ ] Understand the system architecture diagram
- [ ] Review the technology stack
- [ ] Understand the data flow

### ✅ 1.3 Smart Contract Concepts Review
Read about these concepts before Phase 2:
- [ ] Solidity basics
- [ ] Factory pattern
- [ ] Payable functions
- [ ] Events and logging
- [ ] Modifiers and access control

Resources:
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

### ✅ 1.4 MetaMask Setup
- [ ] Install MetaMask extension
- [ ] Create new wallet (or import existing)
- [ ] **IMPORTANT**: Save your seed phrase securely (this is a testnet wallet)
- [ ] Add Sepolia testnet to MetaMask
- [ ] Get Sepolia ETH from faucets

#### Adding Sepolia Network to MetaMask:
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter Sepolia details:
   - **Network Name**: Sepolia
   - **RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY` (or use Alchemy)
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.etherscan.io`

#### Getting Sepolia ETH:
- [Sepolia Faucet 1](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## 🔜 Next Steps

Once you've completed Phase 1 checklist:

### Ready to Code?

1. **Phase 2 Start**: Smart Contract Development
   ```bash
   # You'll initialize the Hardhat project:
   # cd contracts
   # npm init -y
   # npm install --save-dev hardhat
   ```

2. **Review Phase 2 Tasks**:
   - Open `PHASES.md`
   - Review Phase 2 section
   - Understand what you'll build

3. **Get Coding**:
   - We'll create the contracts step-by-step
   - Write tests for each function
   - Deploy to local network first
   - Then deploy to Sepolia

## 📚 Recommended Learning Path

Before diving into code, review these topics:

### Week 1: Phase 1 + Preparation
- [ ] Review Solidity syntax
- [ ] Understand Ethereum basics (accounts, transactions, gas)
- [ ] Read about smart contract security
- [ ] Familiarize yourself with Hardhat

### Week 2-3: Phase 2
- [ ] Factory pattern
- [ ] State machines
- [ ] Event-driven architecture
- [ ] Testing best practices

### Week 4: Phase 3
- [ ] IPFS concepts
- [ ] REST API design
- [ ] Off-chain data strategies

### Week 5: Phase 4
- [ ] The Graph architecture
- [ ] GraphQL basics
- [ ] Event indexing

### Week 6-7: Phase 5
- [ ] React + Web3 integration
- [ ] ethers.js v6
- [ ] Transaction handling
- [ ] UX patterns for DApps

### Week 8: Phase 6
- [ ] Deployment strategies
- [ ] Testing in production
- [ ] Monitoring and maintenance

## 💡 Development Tips

### Best Practices
1. **Commit Often**: Commit after completing each task
2. **Test First**: Write tests before or alongside code
3. **Document**: Comment complex logic
4. **Gas Awareness**: Always consider gas costs
5. **Security First**: Think about edge cases and attacks

### Common Pitfalls to Avoid
- ❌ Not testing edge cases
- ❌ Ignoring gas optimization
- ❌ Poor error handling
- ❌ Inadequate access control
- ❌ Not handling failed transactions in frontend

### Debugging Tools
- **Hardhat Console**: `npx hardhat console`
- **Hardhat Network**: Built-in blockchain for testing
- **Etherscan**: Verify and explore contracts
- **Tenderly**: Advanced debugging and monitoring

## 🆘 Getting Help

### Resources
- **Hardhat Docs**: https://hardhat.org/docs
- **Solidity Docs**: https://docs.soliditylang.org/
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **The Graph**: https://thegraph.com/docs/
- **ethers.js**: https://docs.ethers.org/v6/

### Community
- Ethereum Stack Exchange
- Hardhat Discord
- The Graph Discord
- r/ethdev on Reddit

## ✅ Phase 1 Complete?

Once you've:
- ✅ Installed all prerequisites
- ✅ Read and understood the blueprint
- ✅ Set up MetaMask with Sepolia
- ✅ Reviewed Solidity basics
- ✅ Understand the project architecture

**You're ready to begin Phase 2!** 🎉

Let's start building the smart contracts. When you're ready, let me know and we'll:
1. Initialize the Hardhat project
2. Set up the project structure
3. Write our first smart contract
4. Create comprehensive tests
5. Deploy to local network

---

**Questions?** Review the documentation or ask for clarification before proceeding!
