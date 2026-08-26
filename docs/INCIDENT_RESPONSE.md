# 🚨 Incident Response Plan

> Procedures for responding to security incidents, contract issues, and service outages.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 — Critical** | Funds at risk, contract exploit, total service outage | Immediate | Reentrancy bug, private key compromise, contract drained |
| **P1 — High** | Partial service outage, data integrity issue | Within 1 hour | Subgraph desync, IPFS gateway down, backend unreachable |
| **P2 — Medium** | Degraded functionality, non-critical bug | Within 4 hours | Wrong campaign stats, slow queries, UI rendering issue |
| **P3 — Low** | Cosmetic issue, minor UX friction | Within 24 hours | Typos, formatting, non-blocking warnings |

---

## Smart Contract Incidents (P0)

### Exploit or Vulnerability Detected

1. **Do NOT panic — assess before acting.** Contracts are immutable; you cannot patch on-chain code.
2. **Contact campaign creators** if a campaign's funds are at risk.
3. **Pause downstream services**: disable the frontend's write functions (`useWriteContract` calls) by setting a `MAINTENANCE` flag in the environment.
4. **Notify affected users** via the official communication channel with:
   - What happened
   - Which campaigns/wallets are affected
   - What users should do (e.g., "withdraw remaining funds")
   - What remediation is underway
5. **File a post-mortem** within 48 hours documenting root cause, timeline, and prevention.

### Key Compromise

1. **Rotate the compromised key** immediately.
2. **Revoke any approvals** (Etherscan token approvals, etc.).
3. **If a factory admin key is compromised**: deploy a new factory contract, migrate campaigns, and notify all creators.
4. **Report to relevant security contacts** (Etherscan, Infura, etc.).

---

## Infrastructure Incidents (P1)

### Backend Service Down

1. Check health endpoint: `GET /health` — review database and RPC status.
2. **If database is down**: restart the PostgreSQL instance; check connection pool exhaustion; review recent query logs.
3. **If RPC provider is down**: switch to a fallback provider (Alchemy → Infura → public endpoint).
4. **If Pinata/IPFS is down**: switch to fallback storage or disable IPFS uploads temporarily (create campaigns without metadata).

### Subgraph Not Indexing

1. Check indexing status on The Graph Studio dashboard.
2. **If stuck**: re-deploy the subgraph (`graph deploy --studio`).
3. **If schema mismatch**: regenerate from `schema.graphql` (`graph codegen`) and redeploy.
4. **Fallback**: the frontend falls back to on-chain multicall reads when subgraph is unavailable.

### Frontend Deploy Fails

1. Check the CI/CD pipeline logs (GitHub Actions).
2. **If build fails**: run `npm run typecheck` and `npm run build` locally to reproduce.
3. **If deploy fails**: check environment variables on the hosting platform (Vercel/Netlify).

---

## Data Integrity Incidents (P2)

### Inconsistent Campaign Data

1. **Subgraph vs. on-chain mismatch**: subgraph data is eventually consistent. Wait for the next indexing pass (typically <1 block).
2. **Persistent mismatch**: restart the subgraph indexer or redeploy.
3. **User-reported discrepancy**: cross-check with Etherscan and the contract's `getCampaignDetails()`.

### Incorrect Statistics

1. PlatformStats singleton aggregates all events. If counts are wrong, check the mapping handlers for edge cases.
2. Rebuild the subgraph from block 0 if necessary (`graph deploy --studio --version-label rebuild`).

---

## Communication Templates

### User Notification (Critical)

```
⚠️ CrowdChain Security Advisory

What: [Brief description of the incident]
Affected: [Campaign addresses or "All campaigns"]
Action required: [What users should do]
Status: [Investigating / Contained / Resolved]

We will provide updates every [30 minutes / hour] until resolved.
```

### Post-Incident Summary

```
## Incident Report: [Title]

**Date**: [Date]
**Duration**: [Start time] — [End time] (UTC)
**Severity**: P[0-3]

### Summary
[1-2 sentence description]

### Timeline
- [Time] — [Event]
- [Time] — [Event]

### Root Cause
[Description of root cause]

### Impact
[Number of users affected, funds at risk, service downtime]

### Remediation
[What was done to fix]

### Prevention
[Steps to prevent recurrence]
```

---

## Contacts

| Role | Responsibility |
|------|---------------|
| **Contract Lead** | Smart contract emergencies, key management |
| **Infrastructure Lead** | Backend, database, RPC, hosting |
| **Frontend Lead** | UI incidents, maintenance mode toggle |
| **Communications** | User notifications, post-mortem authoring |

---

## Drills

Run a tabletop exercise quarterly:
1. Simulate a contract exploit scenario.
2. Practice toggling maintenance mode.
3. Verify backup RPC providers work.
4. Test the communication templates.
5. Review and update this document.
