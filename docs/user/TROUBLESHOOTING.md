# Troubleshooting Guide

Common issues and how to fix them.

## Wallet & Connection

### "Connect Wallet" does nothing / MetaMask doesn't pop up
- Make sure the MetaMask extension is installed and unlocked
- Check for a blocked popup (look for the MetaMask icon in your browser toolbar)
- Reload the page after installing the wallet

### Wrong network error
The app targets Sepolia testnet. To switch:
1. Open MetaMask
2. Click the network dropdown (top-left)
3. Select **Sepolia**
4. If Sepolia isn't listed, add it manually:
   - Network Name: `Sepolia`
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_KEY` (or Alchemy)
   - Chain ID: `11155111`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.etherscan.io`

### "Insufficient funds" error
You need Sepolia ETH for gas fees. Get free ETH from:
- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com)

### Transaction stuck / pending
- Wait 1-2 minutes — Sepolia can be slow
- Check the transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)
- If truly stuck, you can speed it up in MetaMask (Accelerate) or cancel it (Speed up → Cancel)

### "Internal JSON-RPC error"
This usually means the RPC endpoint is down or rate-limited:
- Wait a minute and try again
- Switch to a different RPC provider (Alchemy ↔ Infura)

## Campaign Issues

### Campaign creation fails
- Check that all required fields are filled
- Goal must be greater than 0
- Duration must be at least 1 day
- Ensure you have enough ETH for gas (~0.01 ETH)

### Contribution fails
- Campaign may have ended (check the deadline)
- Campaign may be cancelled
- You may not have enough ETH (contribution + gas)

### Refund not available
- Refunds only work for failed or cancelled campaigns
- If the campaign is still active and the deadline hasn't passed, you can't refund yet
- Once the goal is reached and the creator withdraws, refunds are no longer possible

### "Campaign not found" on detail page
- The campaign address may be incorrect
- The campaign may not be deployed to the current network
- Try refreshing the page

## Backend & API

### Backend won't start
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check if port 3001 is in use
netstat -an | grep 3001

# Restart the backend
cd backend && npm run dev
```

### Database connection errors
```bash
# Verify PostgreSQL is running
docker exec crowdfunding-postgres-1 pg_isready -U crowdchain

# Test connection
PGPASSWORD=crowdchain_dev psql -h 127.0.0.1 -p 5433 -U crowdchain -d crowdchain

# Reset database (⚠️ deletes all data)
cd backend
npx prisma migrate reset
npx prisma migrate deploy
npx prisma generate
```

### API returns 503 "Database not configured"
The `DATABASE_URL` environment variable isn't set. Check `backend/.env`:
```
DATABASE_URL="postgresql://crowdchain:crowdchain_dev@localhost:5433/crowdchain"
```

### IPFS upload fails
- Check that `PINATA_JWT` is set in `backend/.env`
- Verify the JWT is valid at [pinata.cloud](https://pinata.cloud)
- Free tier allows 500 pins/month

## Docker Issues

### Docker containers won't start
```bash
# Check Docker Desktop is running
docker ps

# Recreate containers from scratch
docker compose down -v
docker compose up -d

# Check container logs
docker logs crowdfunding-postgres-1
docker logs crowdfunding-graph-node-1
```

### Port already in use
```bash
# Find what's using the port
netstat -ano | findstr :5433

# Stop conflicting services or change ports in docker-compose.yml
```

### Graph-node keeps crashing
- Graph-node needs a working IPFS node. Make sure `crowdfunding-ipfs-1` is running
- Check logs: `docker logs crowdfunding-graph-node-1`
- The graph-node container may need 30+ seconds to fully start

## Frontend Issues

### Blank page / white screen
1. Open browser DevTools (F12) → Console tab
2. Check for JavaScript errors
3. Make sure the dev server is running: `cd frontend && npm run dev`

### "Failed to fetch" or CORS errors
- Backend may not be running on port 3001
- Check `CORS_ORIGIN` in `backend/.env` matches your frontend URL

### Build fails
```bash
cd frontend
rm -rf node_modules
npm install
npm run typecheck
npm run build
```

## Getting Help

- Check the [API documentation](http://localhost:3001/docs) (when backend is running)
- Review [PHASES.md](../../PHASES.md) for project architecture
- See [DEPLOYMENT_CHECKLIST.md](../deployment/DEPLOYMENT_CHECKLIST.md) for setup steps
