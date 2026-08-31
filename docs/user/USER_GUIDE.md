# CrowdChain User Guide

How to use the CrowdChain decentralized crowdfunding platform.

## Getting Started

### 1. Install MetaMask

You need an Ethereum wallet to interact with campaigns.

1. Install the [MetaMask](https://metamask.io) browser extension
2. Create a new wallet and **safely store your recovery phrase** (never share it)
3. Pin the extension to your toolbar

### 2. Get Testnet ETH

You need Sepolia testnet ETH to pay for gas fees (it's free):

1. Open MetaMask and switch to the **Sepolia** network
2. Copy your wallet address
3. Visit a faucet and paste your address:
   - [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) (recommended)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com)
4. You'll receive 0.1–0.5 ETH within a few minutes

### 3. Visit the App

1. Go to [your-deployed-url.vercel.app](https://your-deployed-url.vercel.app) (or `http://localhost:5173` locally)
2. Click **"Connect Wallet"** in the top-right corner
3. Approve the MetaMask connection

## Browsing Campaigns

The homepage shows all active campaigns. You can:

- **Search** by title, description, or creator address
- **Filter** by state: All, Active, Funded, Failed
- **Sort** by newest, most raised, progress, or ending soon
- **Click** any campaign card to view details

## Creating a Campaign

1. Click **"Create Campaign"** in the navigation bar
2. Fill in the form:
   - **Goal**: Amount of ETH you want to raise (e.g., `1.0`)
   - **Duration**: How long the campaign runs (e.g., `30` days)
   - **IPFS Hash**: Upload your campaign metadata/images to IPFS first, then paste the CID here
3. Click **"Create"** and approve the MetaMask transaction
4. Wait for the transaction to be confirmed (usually 15-30 seconds)
5. Your campaign is now live!

### Campaign Lifecycle

```
Created (Active) → Goal Reached (Funded) → Creator Withdraws
                  → Deadline Passes (Failed) → Contributors Refund
                  → Creator Cancels → Contributors Refund
```

- **Active**: Accepting contributions
- **Funded**: Goal reached, creator can withdraw
- **Failed**: Deadline passed without reaching goal
- **Cancelled**: Creator cancelled the campaign

## Contributing to a Campaign

1. Open a campaign you want to support
2. Enter the amount of ETH you want to contribute
3. Click **"Contribute"** and approve the MetaMask transaction
4. Your contribution is recorded on-chain immediately

## Getting a Refund

If a campaign fails or is cancelled, you can get your money back:

1. Open the failed/cancelled campaign
2. Click **"Request Refund"**
3. Approve the MetaMask transaction
4. ETH is returned to your wallet

## Withdrawing Funds (Campaign Creators)

If your campaign reached its goal:

1. Open your campaign from the Dashboard
2. Click **"Withdraw Funds"**
3. Approve the MetaMask transaction
4. ETH is transferred to your wallet

## Dashboard

The Dashboard shows:
- **My Campaigns**: Campaigns you created
- **My Contributions**: Campaigns you've backed
- **Activity**: Recent transactions

## Tips

- **Gas fees**: Every on-chain action costs a small amount of ETH for gas. Keep some extra in your wallet.
- **IPFS**: Campaign images and metadata are stored on IPFS. Use [Pinata](https://pinata.cloud) to upload (free tier available).
- **Verify contracts**: All contracts are verified on [Etherscan](https://sepolia.etherscan.io). You can inspect the source code.
- **Testnet only**: This is running on Sepolia testnet. The ETH has no real value.

## Need Help?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Review the [deployment checklist](../deployment/DEPLOYMENT_CHECKLIST.md) if deploying your own instance
