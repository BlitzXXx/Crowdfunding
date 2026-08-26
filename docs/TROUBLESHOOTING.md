# 🔧 Troubleshooting Guide

Common issues and how to resolve them.

## Wallet & Connection

### "Connect Wallet" does nothing / MetaMask doesn't pop up
- Make sure the MetaMask extension is installed and unlocked.
- Check for a blocked popup (look for the MetaMask icon in your browser toolbar).
- Reload the page after installing or unlocking the wallet.

### Wrong network error
The app targets a configurable chain (`VITE_CHAIN`: `sepolia` or `localhost`).

- **Sepolia**: open MetaMask → network dropdown → enable *Show test networks* → select **Sepolia**.
- **Local dev**: add the Hardhat network manually — RPC URL `http://127.0.0.1:8545`, chain ID `31337`. Fund accounts by importing a Hardhat private key (never use these keys with real funds).

### Transaction stuck "pending" forever
- On local Hardhat, transactions auto-mine; if stuck, restart `npx hardhat node`.
- On Sepolia, check the hash on [sepolia.etherscan.io](https://sepolia.etherscan.io). Underpriced transactions can be sped up or cancelled from MetaMask activity view.

## Common Errors Explained

| Message | Cause | Fix |
|---------|-------|-----|
| `CampaignEnded` / state error | Trying to contribute after deadline or cancellation | Filter for Active campaigns only |
| `InsufficientContribution` | Contribution below the minimum | Increase the amount |
| `NothingToRefund` / `NoContribution` | Claiming a refund with no stake | Only contributors can claim |
| `NotCreator` | Calling cancel/withdraw from another account | Connect the creator wallet |
| `GoalNotReached` | Withdrawing before success | Withdrawals unlock only when funded |
| `AlreadyRefunded` | Double refund claim | Each contributor refunds exactly once |
| User rejected the request | You dismissed the wallet popup | Re-submit the transaction |

## Development Setup Issues

### Factory not configured warning on Home
Set `VITE_FACTORY_ADDRESS` in `frontend/.env`, then redeploy locally:

```bash
cd contracts && npm run deploy:ignition   # prints the factory address
```

Restart the Vite dev server so `.env` changes take effect.

### Local deploys fail with nonce/chain errors
A stale Hardhat node or cached deployment. Reset cleanly:

```bash
cd contracts && npx hardhat node          # terminal 1
npm run deploy:ignition -- --network localhost   # terminal 2
```

If Ignition complains about an existing deployment chain ID mismatch, wipe `contracts/ignition/deployments/`.

### Backend `/health` shows degraded
Degraded just means optional services (database, Pinata, RPC) aren't configured — expected with keys unset. Configure `DATABASE_URL` / `PINATA_JWT` / `SEPOLIA_RPC_URL` per [.env.example](../backend/.env.example).

### IPFS upload fails during campaign creation
- Without a `PINATA_JWT` the backend can't pin. For keyless local dev, use the skip-IPFS fallback toggle on the create form.
- With a JWT set, check quota at [pinata.cloud](https://pinata.cloud) and that your gateway URL is reachable.

### Subgraph data missing / dashboard empty
The subgraph URL must point at a deployed indexing instance (`VITE_SUBGRAPH_URL`). Until Studio deployment, dashboard sections degrade gracefully — on-chain pages keep working.

## Still Stuck?

- Check the browser console and network tab for failed calls to backend/subgraph endpoints.
- Search existing issues on the project tracker, then file a new one with: steps to reproduce, expected vs actual behavior, console output, and network (chain + app version).
