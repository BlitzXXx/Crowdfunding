# 🔑 API Key Guide

Every key needed for CrowdChain — where to get it, cost, and where to paste it.

## Quick Reference

| Key | Free? | Where to Get | Files |
|-----|-------|-------------|-------|
| Alchemy/Infura RPC URL | ✅ Free tier | [alchemy.com](https://alchemy.com) or [infura.io](https://infura.io) | `contracts/.env`, `backend/.env` |
| MetaMask Private Key | ✅ Free | MetaMask → Account Details → Show Private Key | `contracts/.env` |
| Sepolia Testnet ETH | ✅ Free | Faucets (see below) | — (goes to wallet) |
| Etherscan API Key | ✅ Free | [etherscan.io](https://etherscan.io) → My Account → API Keys | `contracts/.env` |
| Pinata JWT | ✅ Free (500 pins/mo) | [pinata.cloud](https://pinata.cloud) → API Keys → New Key | `backend/.env` |
| WalletConnect Project ID | ✅ Free | [cloud.walletconnect.com](https://cloud.walletconnect.com) | `frontend/.env` |
| Subgraph Studio Key | ✅ Free | [thegraph.com/studio](https://thegraph.com/studio) → Deploy Key | CLI only |

**Total cost: $0.00** for testnet use.

---

## Detailed Instructions

### 1. Alchemy or Infura RPC URL

**What it does**: Lets your app talk to the Ethereum Sepolia testnet.

1. Sign up at [alchemy.com](https://alchemy.com) (recommended) or [infura.io](https://infura.io)
2. Create a new app/project
3. Select **Sepolia** as the network
4. Copy the HTTPS URL (looks like `https://eth-sepolia.g.alchemy.com/v2/abc123`)

**Paste in:**
```
# contracts/.env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# backend/.env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

---

### 2. MetaMask Private Key

**What it does**: Signs deployment transactions from your wallet.

1. Install [MetaMask](https://metamask.io) browser extension
2. Create a **new, testnet-only wallet** (never use a mainnet wallet!)
3. Export the private key: MetaMask → ⋮ menu → Account Details → Show Private Key

**Paste in:**
```
# contracts/.env
PRIVATE_KEY=your_hex_key_without_0x_prefix
```

⚠️ **Never commit this to git.** The `.env` file is gitignored.

---

### 3. Sepolia Testnet ETH

**What it does**: Pays gas fees for deploying contracts and testing transactions.

**Faucets** (paste your MetaMask wallet address):
- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) — most reliable
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com) — needs Alchemy account
- [Infura Faucet](https://www.infura.io/faucet/sepolia) — needs Infura account

You'll get 0.1–0.5 ETH per request, enough for all deploys and tests.

---

### 4. Etherscan API Key

**What it does**: Verifies your smart contract source code on Etherscan.

1. Go to [etherscan.io](https://etherscan.io)
2. Sign up → My Account → API Keys → Add New Key
3. Copy the key

**Paste in:**
```
# contracts/.env
ETHERSCAN_API_KEY=your_key_here
```

---

### 5. Pinata JWT

**What it does**: Uploads campaign metadata and images to IPFS (decentralized storage).

1. Go to [pinata.cloud](https://pinata.cloud)
2. Sign up → API Keys → New Key
3. Copy the JWT token (starts with `eyJ...`)

**Free tier**: 500 pins/month, 1 GB storage.

**Paste in:**
```
# backend/.env
PINATA_JWT=eyJhbGciOi...
```

---

### 6. WalletConnect Project ID (Optional)

**What it does**: Enables mobile wallet support via WalletConnect protocol.

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up → Create Project → copy the Project ID

**Paste in:**
```
# frontend/.env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

Optional — MetaMask works without it.

---

### 7. Subgraph Studio Deploy Key

**What it does**: Deploys the indexing subgraph to The Graph Studio.

1. Go to [thegraph.com/studio](https://thegraph.com/studio)
2. Sign in with GitHub
3. Create a new subgraph (name: `crowdfunding`)
4. Go to Settings → Deploy Key → copy the key
5. Authenticate: `npx graph auth --studio YOUR_DEPLOY_KEY`
6. Deploy: `npm run deploy:studio` (from `subgraph/` directory)

---

## Setup Order

| Step | What | Keys Needed |
|------|------|-------------|
| 1 | Get Alchemy/Infura account | RPC URL |
| 2 | Create testnet MetaMask wallet | Private key |
| 3 | Get testnet ETH from faucet | — |
| 4 | Create Etherscan account | API key |
| 5 | Deploy contracts | RPC URL, Private key, Etherscan key |
| 6 | Get Pinata account | JWT |
| 7 | Deploy subgraph (optional) | Deploy key |
| 8 | Deploy frontend (optional) | WalletConnect ID |
