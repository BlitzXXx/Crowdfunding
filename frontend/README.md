# Frontend (Phase 5)

This directory contains the React frontend application for the Crowdfunding DApp.

## 🎯 Phase 5 Overview

**Goal**: Build a complete Web3 frontend with wallet integration

**Duration**: 2 weeks

**Key Deliverables**:
- React application with Web3 integration
- Wallet connection (MetaMask)
- Campaign creation and browsing
- Contribution flow
- User dashboard
- Responsive UI

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   ├── wallet/
│   │   │   ├── WalletConnect.tsx
│   │   │   └── WalletInfo.tsx
│   │   ├── campaign/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── CampaignGrid.tsx
│   │   │   ├── ContributionForm.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Toast.tsx
│   │   └── shared/
│   │       ├── NetworkSwitch.tsx
│   │       └── TransactionStatus.tsx
│   │
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── CreateCampaign.tsx
│   │   ├── CampaignDetail.tsx
│   │   ├── Browse.tsx
│   │   ├── Dashboard.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.ts
│   │   ├── useContract.ts
│   │   ├── useCampaigns.ts
│   │   ├── useTransaction.ts
│   │   └── useIPFS.ts
│   │
│   ├── contexts/           # React Context providers
│   │   ├── Web3Context.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── services/           # External service integrations
│   │   ├── contract.service.ts
│   │   ├── ipfs.service.ts
│   │   └── api.service.ts
│   │
│   ├── graphql/            # GraphQL queries
│   │   ├── queries.ts
│   │   ├── fragments.ts
│   │   └── client.ts
│   │
│   ├── utils/              # Utility functions
│   │   ├── format.ts       # Format wei, dates, etc.
│   │   ├── validation.ts
│   │   └── constants.ts
│   │
│   ├── types/              # TypeScript types
│   │   ├── campaign.ts
│   │   ├── user.ts
│   │   └── web3.ts
│   │
│   ├── App.tsx             # Main App component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
│
├── public/                 # Static assets
│   ├── logo.svg
│   └── favicon.ico
│
├── .env.example           # Environment template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## 🚀 Getting Started

### 1. Initialize React + Vite Project

```bash
cd frontend
npm create vite@latest . -- --template react-ts
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install react-router-dom
npm install ethers@6

# GraphQL
npm install @apollo/client graphql

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Form handling
npm install react-hook-form zod @hookform/resolvers

# IPFS
npm install ipfs-http-client

# Date handling
npm install date-fns

# Icons
npm install lucide-react

# State management (optional)
npm install zustand
```

### 3. Configure TailwindCSS

```js
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4. Environment Variables

Create `.env` file:
```env
VITE_FACTORY_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/...
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../crowdfunding-platform/v0.0.1
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_BACKEND_URL=http://localhost:3001
```

## 🔌 Web3 Integration

### Web3Context Setup

```typescript
// src/contexts/Web3Context.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import { BrowserProvider, Contract } from 'ethers'

interface Web3ContextType {
  account: string | null
  chainId: number | null
  provider: BrowserProvider | null
  signer: any | null
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  error: string | null
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<any | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const network = await provider.getNetwork()
      const signer = await provider.getSigner()

      setProvider(provider)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setSigner(signer)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setSigner(null)
  }

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  return (
    <Web3Context.Provider value={{
      account,
      chainId,
      provider,
      signer,
      connect,
      disconnect,
      isConnecting,
      error
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider')
  }
  return context
}
```

### Contract Hook

```typescript
// src/hooks/useContract.ts
import { useMemo } from 'react'
import { Contract } from 'ethers'
import { useWeb3 } from '../contexts/Web3Context'
import FactoryABI from '../abis/CrowdfundingFactory.json'
import CampaignABI from '../abis/Campaign.json'

export function useFactoryContract() {
  const { signer, provider } = useWeb3()

  return useMemo(() => {
    if (!signer && !provider) return null

    const address = import.meta.env.VITE_FACTORY_CONTRACT_ADDRESS
    return new Contract(
      address,
      FactoryABI.abi,
      signer || provider
    )
  }, [signer, provider])
}

export function useCampaignContract(campaignAddress: string) {
  const { signer, provider } = useWeb3()

  return useMemo(() => {
    if (!signer && !provider) return null
    if (!campaignAddress) return null

    return new Contract(
      campaignAddress,
      CampaignABI.abi,
      signer || provider
    )
  }, [campaignAddress, signer, provider])
}
```

### Transaction Hook

```typescript
// src/hooks/useTransaction.ts
import { useState } from 'react'
import { ContractTransactionResponse } from 'ethers'

export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const execute = async (
    txFunction: () => Promise<ContractTransactionResponse>,
    onSuccess?: (receipt: any) => void
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      setTxHash(null)

      const tx = await txFunction()
      setTxHash(tx.hash)

      const receipt = await tx.wait()

      if (onSuccess) {
        onSuccess(receipt)
      }

      return receipt
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { execute, isLoading, error, txHash }
}
```

## 📊 GraphQL Integration

### Apollo Client Setup

```typescript
// src/graphql/client.ts
import { ApolloClient, InMemoryCache } from '@apollo/client'

export const client = new ApolloClient({
  uri: import.meta.env.VITE_SUBGRAPH_URL,
  cache: new InMemoryCache()
})
```

### Queries

```typescript
// src/graphql/queries.ts
import { gql } from '@apollo/client'

export const GET_CAMPAIGNS = gql`
  query GetCampaigns($first: Int!, $skip: Int!, $orderBy: Campaign_orderBy, $orderDirection: OrderDirection) {
    campaigns(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { state: Active }
    ) {
      id
      creator {
        id
      }
      title
      description
      category
      goal
      totalFunds
      deadline
      contributorsCount
      createdAt
    }
  }
`

export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    campaign(id: $id) {
      id
      creator {
        id
        totalCampaigns
      }
      title
      description
      category
      goal
      totalFunds
      deadline
      state
      contributorsCount
      ipfsHash
      contributions(orderBy: timestamp, orderDirection: desc, first: 50) {
        id
        contributor {
          id
        }
        amount
        timestamp
      }
    }
  }
`

export const GET_USER_PROFILE = gql`
  query GetUser($address: ID!) {
    user(id: $address) {
      id
      totalCampaigns
      totalContributed
      totalContributions
      campaignsCreated {
        id
        title
        state
        totalFunds
        goal
      }
      contributions {
        id
        campaign {
          id
          title
        }
        amount
        timestamp
      }
    }
  }
`
```

## 🎨 Key Components

### WalletConnect Component

```typescript
// src/components/wallet/WalletConnect.tsx
import { useWeb3 } from '../../contexts/Web3Context'
import { formatAddress } from '../../utils/format'

export function WalletConnect() {
  const { account, connect, disconnect, isConnecting } = useWeb3()

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{formatAddress(account)}</span>
        <button onClick={disconnect} className="btn-secondary">
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="btn-primary"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
```

### Campaign Card

```typescript
// src/components/campaign/CampaignCard.tsx
import { Link } from 'react-router-dom'
import { formatEther } from 'ethers'
import { formatTimeLeft } from '../../utils/format'

interface CampaignCardProps {
  campaign: {
    id: string
    title: string
    description: string
    goal: string
    totalFunds: string
    deadline: string
    contributorsCount: number
  }
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = (Number(formatEther(campaign.totalFunds)) / Number(formatEther(campaign.goal))) * 100
  const timeLeft = formatTimeLeft(Number(campaign.deadline))

  return (
    <Link to={`/campaign/${campaign.id}`} className="card hover:shadow-lg transition">
      <h3 className="text-xl font-bold">{campaign.title}</h3>
      <p className="text-gray-600 mt-2">{campaign.description}</p>

      <div className="mt-4">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>

        <div className="flex justify-between mt-2 text-sm">
          <span>{formatEther(campaign.totalFunds)} ETH raised</span>
          <span>Goal: {formatEther(campaign.goal)} ETH</span>
        </div>
      </div>

      <div className="flex justify-between mt-4 text-sm text-gray-600">
        <span>{campaign.contributorsCount} backers</span>
        <span>{timeLeft}</span>
      </div>
    </Link>
  )
}
```

### Contribution Form

```typescript
// src/components/campaign/ContributionForm.tsx
import { useState } from 'react'
import { parseEther } from 'ethers'
import { useCampaignContract } from '../../hooks/useContract'
import { useTransaction } from '../../hooks/useTransaction'

interface ContributionFormProps {
  campaignAddress: string
  onSuccess: () => void
}

export function ContributionForm({ campaignAddress, onSuccess }: ContributionFormProps) {
  const [amount, setAmount] = useState('')
  const campaign = useCampaignContract(campaignAddress)
  const { execute, isLoading, error } = useTransaction()

  const handleContribute = async () => {
    if (!campaign) return

    await execute(
      () => campaign.contribute({ value: parseEther(amount) }),
      () => {
        setAmount('')
        onSuccess()
      }
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">Back this project</h3>

      <input
        type="number"
        step="0.01"
        placeholder="Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input w-full"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        onClick={handleContribute}
        disabled={!amount || isLoading}
        className="btn-primary w-full mt-4"
      >
        {isLoading ? 'Processing...' : 'Contribute'}
      </button>
    </div>
  )
}
```

## 🎨 Styling

### Base Styles (Tailwind)

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
  }

  .input {
    @apply border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500;
  }

  .progress-bar {
    @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
  }

  .progress-fill {
    @apply h-full bg-blue-600 transition-all duration-300;
  }
}
```

## 📊 Phase 5 Checklist

- [ ] React + Vite project initialized
- [ ] TailwindCSS configured
- [ ] React Router setup
- [ ] Web3Context implemented
- [ ] Wallet connection working
- [ ] Contract hooks created
- [ ] Transaction hook implemented
- [ ] Apollo Client configured
- [ ] GraphQL queries written
- [ ] Home page complete
- [ ] Campaign browsing page
- [ ] Campaign detail page
- [ ] Campaign creation page
- [ ] User dashboard
- [ ] All components implemented
- [ ] IPFS integration
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Transaction feedback
- [ ] Event listeners
- [ ] Testing complete

## 📚 Resources

- [React Documentation](https://react.dev/)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [TailwindCSS](https://tailwindcss.com/)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [Vite](https://vitejs.dev/)

## 🔜 Next Phase

Once Phase 5 is complete, proceed to:
- **Phase 6**: Testing & Deployment

---

**Status**: 🔴 Not Started

Ready when you complete Phases 2-4!
