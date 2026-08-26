# 📖 User Guide

Everything you need to use CrowdChain, the decentralized crowdfunding platform.

## Getting Started

### 1. Install a Wallet

You need an Ethereum wallet to interact with campaigns. We recommend **MetaMask**:

1. Install the MetaMask browser extension from [metamask.io](https://metamask.io).
2. Create a new wallet and **safely store your recovery phrase** (never share it).
3. Pin the extension to your toolbar for quick access.

### 2. Get Test ETH

CrowdChain runs on the **Sepolia testnet** (or a local Hardhat node for development). You need Sepolia ETH to pay gas:

- Use a public faucet such as [sepoliafaucet.com](https://sepoliafaucet.com) or the Alchemy/Infura faucets.
- A little goes a long way — contributions themselves are what cost real funds; everything else is small gas.

### 3. Connect Your Wallet

Click **Connect Wallet** in the header and approve the connection prompt. Your address appears as a chip in the top-right; click it to disconnect.

## Browsing & Backing Campaigns

### Find a Campaign

The home page lists every campaign on-chain. You can:

- **Search** by campaign contract address or creator address.
- **Filter** by state: Active, Funded, Expired, or Cancelled.
- **Sort** by newest, most raised, highest progress, or ending soon.

Each card shows raised amount, goal, progress %, backer count, and time remaining.

### Contribute

1. Open a campaign and make sure its badge says **Active**.
2. In the contribution card, enter an ETH amount and confirm.
3. Your wallet pops up — review the transaction and confirm.
4. Watch for the toast confirmation once it's mined. Your contribution is recorded immutably on-chain.

### Claim a Refund

If a campaign ends **without reaching its goal** (Expired) or is **Cancelled** by the creator:

1. Open the campaign page while connected with the same wallet you contributed from.
2. Click **Claim refund** — funds return straight to your wallet (pull-based, one transaction per contributor).

## Creating a Campaign

1. Click **Launch your campaign** and fill in title, description, goal (ETH), and duration.
2. Metadata is pinned to IPFS via the backend; if IPFS is unavailable in local dev, you can toggle the skip-IPFS fallback.
3. Confirm the deployment transaction. Campaigns deploy as cheap minimal-proxy clones of a shared implementation.
4. Share your campaign's link — anyone can contribute while it's active.

## As a Campaign Creator

Once your campaign is live you have two extra actions on its page:

| Action | When available | Effect |
|--------|----------------|--------|
| **Withdraw funds** | Goal reached (Funded) | Transfers the full balance to your wallet |
| **Cancel campaign** | Still active | Immediately refunds all contributors and closes the campaign |

## Campaign States

| State | Meaning | Contributors can |
|-------|---------|------------------|
| 🟢 Active | Accepting contributions until deadline | Contribute |
| 🟣 Funded | Goal reached | Wait for creator withdrawal |
| ⚪ Expired | Deadline passed, goal not reached | Claim refund |
| 🔴 Cancelled | Creator cancelled | Claim refund |

## Safety Tips

- **Never share your recovery phrase.** No legitimate service will ask for it.
- Contributions are irreversible once a campaign succeeds — back projects you trust.
- Verify campaign addresses before sending large amounts.
- The app never requests signatures beyond normal transactions; reject anything unusual.
