# 📊 Monitoring Setup

> How to monitor CrowdChain in production: health checks, alerts, and observability.

---

## Health Checks

### Backend (`/health`)

The backend exposes a health endpoint that checks downstream dependencies:

```
GET /health
{
  "status": "ok" | "degraded",
  "service": "crowdfunding-backend",
  "checks": {
    "database": { "configured": true, "ok": false },
    "ipfs": { "configured": true, "ok": true },
    "rpc": { "configured": true, "ok": true }
  },
  "uptime": 3621
}
```

**Monitor**: poll `/health` every 60 seconds. Alert on `status: "degraded"` or HTTP 5xx.

### Subgraph

Check indexing status via The Graph's status API:

```
GET https://api.studio.thegraph.com/status/<deployment-id>
```

Or use the local graph-node status endpoint:

```
GET http://localhost:8030/status
```

**Monitor**: poll every 5 minutes. Alert if `health` is not `"healthy"` or `entityCount` stops increasing.

### Smart Contracts

Use Etherscan's contract verification page and a custom watch script:

```bash
# Quick check: is the factory responding?
cast call $FACTORY_ADDRESS "getCampaignCount()(uint256)" --rpc-url $SEPOLIA_RPC_URL
```

---

## Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Backend health status | `degraded` | HTTP 5xx / timeout |
| Backend response time (p95) | > 2s | > 5s |
| Subgraph indexing lag | > 10 blocks | > 50 blocks |
| IPFS pin failure rate | > 5% | > 20% |
| Gas price (Sepolia) | > 50 gwei | > 100 gwei |
| Campaign creation failures | 1 per hour | 5 per hour |

---

## Logging

### Backend

The backend uses structured JSON logging (configurable via `LOG_LEVEL`):

| Level | When to use |
|-------|-------------|
| `error` | Unhandled exceptions, DB connection failures |
| `warn` | Rate limit exceeded, IPFS pin failures, validation errors |
| `info` | Request completion, campaign CRUD, IPFS operations |
| `debug` | Full request/response bodies (dev only) |

**Production recommendation**: set `LOG_LEVEL=warn` to reduce noise; bump to `info` during incidents.

### Frontend

Client-side errors are caught by the ErrorBoundary and logged to the browser console. For production observability:

- Consider integrating Sentry or a similar error tracking service.
- Wrap `ErrorBoundary` with a reporting callback.
- Log failed wallet transactions with enough context to diagnose revert reasons.

### Subgraph

Graph Node logs indexing events. In Docker:

```bash
docker compose logs -f graph-node
```

Look for `ERROR` lines — common issues:
- Schema mismatch (run `graph codegen` and redeploy)
- RPC provider rate limiting
- Block orphan handling

---

## Metrics to Track

### On-chain (manual / Etherscan API)

- Total campaigns created
- Total volume (ETH contributed)
- Active vs. completed campaigns
- Average campaign duration
- Average contribution size
- Gas usage per campaign creation

### Backend

- Request rate (req/s) per endpoint
- Error rate (4xx, 5xx)
- Database connection pool usage
- IPFS pin success rate
- Response time percentiles (p50, p95, p99)

### Frontend

- Page load time (LCP, FID)
- Wallet connection success rate
- Transaction submission success rate
- Transaction confirmation time
- Error boundary triggers

### Subgraph

- Indexing speed (blocks/minute)
- Query latency (p95)
- Entity count growth rate
- Subgraph health status

---

## Dashboards

### Recommended Tools

| Tool | Use case | Cost |
|------|----------|------|
| **Grafana** | Backend + infra metrics | Free (self-hosted) |
| **Sentry** | Frontend error tracking | Free tier available |
| **The Graph Studio** | Subgraph health | Free for hosted subgraphs |
| **Etherscan** | On-chain analytics | Free |

### Quick Grafana Setup

If using Docker Compose, add Grafana + Prometheus:

```yaml
# Add to docker-compose.yml
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: changeme

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
```

---

## Incident Response

See [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) for procedures when monitoring detects an issue.

---

## Runbook: Common Alerts

### "Backend health degraded"

1. Check `GET /health` for which dependency failed.
2. **Database**: verify Postgres is running (`docker compose ps postgres`).
3. **IPFS**: check Pinata status page; verify `PINATA_JWT` is valid.
4. **RPC**: verify `SEPOLIA_RPC_URL` is reachable; try switching providers.

### "Subgraph not indexing"

1. Check Studio dashboard for error messages.
2. Verify the factory contract address matches in `subgraph.yaml`.
3. Restart graph-node: `docker compose restart graph-node`.
4. If schema changed: `graph codegen && graph deploy --studio`.

### "High error rate on backend"

1. Check recent logs: `docker compose logs --tail=100 backend`.
2. Look for patterns: same endpoint, same error message.
3. Check if rate limiting is triggering legitimate traffic.
4. Verify database connection pool isn't exhausted.
