# Frontend Security Review

**Date**: August 2026
**Scope**: `frontend/src/` — React + wagmi + viem client application
**Result**: No critical or high-severity findings.

---

## Environment Variable Exposure

All environment variables use the `VITE_*` prefix (Vite convention) and are **inlined at build time** into the client bundle. The variables are:

| Variable | Sensitivity | Notes |
|----------|-------------|-------|
| `VITE_FACTORY_ADDRESS` | Low | Public on-chain address |
| `VITE_CHAIN` | None | `sepolia` or `localhost` |
| `VITE_SUBGRAPH_URL` | Low | Public GraphQL endpoint |
| `VITE_API_URL` | Low | Public backend URL |
| `VITE_WALLETCONNECT_PROJECT_ID` | Low | Public project ID (not a secret per WC docs) |

**Finding**: No secrets are bundled. All values are either public addresses/URLs or non-sensitive identifiers. ✅

## External Links

Two external links use `target="_blank"` (Etherscan and Pinata gateway). Both include `rel="noreferrer"` to prevent `window.opener` attacks. ✅

## Dangerous APIs

- **`dangerouslySetInnerHTML`**: Not used anywhere in the codebase. ✅
- **`eval` / `new Function`**: Not used. ✅
- **`innerHTML`**: Not used. ✅

## Wallet Security

- Transactions are signed exclusively through wagmi hooks (`useWriteContract`) which delegate to the connected wallet (MetaMask, etc.). No private keys are ever handled by the app.
- The app only requests standard `eth_sendTransaction` — no `personal_sign` or `eth_sign` with arbitrary data.
- User rejection is mapped to a friendly error message; the app never retries automatically.

## CORS / API Security

- The frontend calls the backend via `VITE_API_URL` (default `http://localhost:3001`).
- CORS is configured on the backend to allow only the frontend origin.
- Rate limiting is applied on the backend for `/api/*` routes.

## Subgraph

- GraphQL queries are read-only and hit a public endpoint.
- No authentication headers are sent to the subgraph.

## Recommendations

1. **Content Security Policy (CSP)**: If deploying to production, configure a strict CSP header on the hosting provider (Vercel/Netlify) to limit script sources.
2. **WalletConnect Project ID**: Rotate periodically even though it's a public identifier.
3. **Dependency audit**: Run `npm audit` periodically; the wagmi/viem stack pulls many transitive dependencies.
