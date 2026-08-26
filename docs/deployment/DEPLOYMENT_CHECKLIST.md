# Deployment Checklist

End-to-end guide for taking the platform from local dev → Sepolia testnet → production.

---

## 0. Prerequisites — Where to Get Keys

| Key | Provider | Notes |
|-----|----------|-------|
| RPC URL | [Infura](https://app.infura.io) / [Alchemy](https://alchemy.com) | Free tier is enough for testnet |
| Deployer private key | Fresh MetaMask account | **Testnet-only wallet. Never reuse a mainnet key.** |
| Testnet ETH | [Google Cloud faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia), [Alchemy faucet](https://sepoliafaucet.com), [Infura faucet](https://www.infura.io/faucet/sepolia) | ~0.5 ETH covers deploys + demo txs |
| Etherscan API key | [etherscan.io](https://etherscan.io) → API Keys | Free, 5 req/s |
| Pinata JWT | [pinata.cloud](https://pinata.cloud) → API Keys | Free 500 pins |
| Subgraph deploy key | [thegraph.com/studio](https://thegraph.com/studio) | GitHub login required |
| WalletConnect project id *(optional)* | [cloud.walletconnect.com](https://cloud.walletconnect.com) | For mobile wallets in the frontend |

---

## 1. Smart Contracts (Sepolia)

- [ ] `contracts/.env`: set `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`
- [ ] `npm run deploy:sepolia` → note factory address from output (`deployments/sepolia.json`)
- [ ] `npm run verify:sepolia` → confirm source on Etherscan
- [ ] Smoke-test on Etherscan "Write Contract": create campaign → contribute from second account → withdraw/refund
- [ ] Record addresses in team password manager / ops doc

## 2. Subgraph (The Graph Studio)

- [ ] Set real `factoryAddress` + `startBlock` (deploy tx block) in `subgraph/networks.json` under `"sepolia"`
- [ ] `cd subgraph && npm run build` (runs configure → codegen → build)
- [ ] `npx graph auth --studio <DEPLOY_KEY>`
- [ ] `npm run deploy:studio`
- [ ] Wait for sync → run example queries from subgraph/README against the playground
- [ ] Copy GraphQL endpoint URL for frontend/backend envs

## 3. Backend (Railway / Render / Fly.io)

- [ ] Provision PostgreSQL (Neon/Supabase/Railway) → copy `DATABASE_URL`
- [ ] Set env vars: `DATABASE_URL`, `PINATA_JWT`, `SEPOLIA_RPC_URL`, `CONTRACT_ADDRESS`, `CORS_ORIGIN=<frontend URL>`, `NODE_ENV=production`, rate-limit values
- [ ] Run `npx prisma migrate deploy` against prod DB (generate first migration locally with `npm run db:migrate`)
- [ ] Deploy → verify `GET /health` returns `status: ok` with database connected
- [ ] Verify `/docs` renders Swagger UI; POST a metadata doc and GET it back

## 4. Frontend (Vercel)

- [ ] Import repo, root directory = `frontend`
- [ ] Env vars: `VITE_FACTORY_ADDRESS`, `VITE_SUBGRAPH_URL`, `VITE_API_URL`, `VITE_WALLETCONNECT_PROJECT_ID` (leave `VITE_CHAIN` empty for Sepolia)
- [ ] Deploy → connect wallet on Sepolia → load campaigns list
- [ ] Full flow test: create campaign → contribute (2nd wallet) → goal reached → withdraw → refund path on another campaign

## 5. Cross-cutting

- [ ] CI green on main ([.github/workflows/ci.yml](../.github/workflows/ci.yml))
- [ ] Slither report reviewed & attached ([docs/security/SLITHER_REPORT.md](../security/SLITHER_REPORT.md))
- [ ] Playwright suite green (`cd frontend && npx playwright test`)
- [ ] Sentry/error tracking wired (optional)
- [ ] Custom domain + HTTPS on frontend/backend
- [ ] Rotate any keys that ever touched chat/screenshots 🙂

## 6. Mainnet Considerations (optional, later)

- [ ] Professional audit of `Campaign.sol` + `CrowdfundingFactory.sol`
- [ ] Re-run gas report; confirm block-limit headroom for factory deploy (~2.1M gas ≈ 7%)
- [ ] Decide L2 vs mainnet (Base/Arbitrum dramatically cut user costs)
- [ ] Incident response plan: pause strategy, timelock for upgrades (contracts are currently immutable-by-design)
