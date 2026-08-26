import { Hono } from "hono";
import { getPrisma } from "../services/prisma.js";

export const monitoring = new Hono();

// Comprehensive health check for all services
monitoring.get("/", async (c) => {
  const checks: Record<string, { ok: boolean; latency?: number; error?: string }> = {};

  // Database
  const dbStart = Date.now();
  try {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, latency: Date.now() - dbStart };
    } else {
      checks.database = { ok: false, error: "Not configured" };
    }
  } catch (e) {
    checks.database = { ok: false, latency: Date.now() - dbStart, error: e instanceof Error ? e.message : "Unknown" };
  }

  // Blockchain (Sepolia RPC)
  const chainStart = Date.now();
  try {
    const client = getClient();
    const blockNumber = await client.getBlockNumber();
    checks.blockchain = { ok: true, latency: Date.now() - chainStart };
    void blockNumber;
  } catch (e) {
    checks.blockchain = { ok: false, latency: Date.now() - chainStart, error: e instanceof Error ? e.message : "Unknown" };
  }

  // Factory contract
  try {
    const count = await getCampaignCount();
    checks.factory = { ok: true };
    void count;
  } catch (e) {
    checks.factory = { ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }

  // Graph Node (local Docker)
  const graphStart = Date.now();
  try {
    const resp = await fetch("http://localhost:8030/status", { signal: AbortSignal.timeout(5000) });
    checks.graphNode = { ok: resp.ok, latency: Date.now() - graphStart };
  } catch {
    checks.graphNode = { ok: false, latency: Date.now() - graphStart, error: "Not reachable" };
  }

  // IPFS (Pinata)
  checks.ipfs = {
    ok: Boolean(process.env.PINATA_JWT),
    error: process.env.PINATA_JWT ? undefined : "PINATA_JWT not set",
  };

  const allOk = Object.values(checks).every((ch) => ch.ok);

  return c.json({
    status: allOk ? "healthy" : "degraded",
    service: "crowdfunding-backend",
    version: "1.0.0",
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Graph-node indexing status
monitoring.get("/graph-node", async (c) => {
  try {
    const resp = await fetch("http://localhost:8030/status", { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) {
      return c.json({ status: "error", message: `Graph node returned ${resp.status}` }, 502);
    }
    const data = await resp.json();
    return c.json({ status: "ok", data });
  } catch {
    return c.json({ status: "unreachable", message: "Graph node is not running on localhost:8030" }, 503);
  }
});

// Prometheus-compatible metrics (text format)
monitoring.get("/metrics", async (c) => {
  const metrics: string[] = [];

  try {
    const count = await getCampaignCount();
    metrics.push(`crowdfund_campaigns_total ${count}`);
  } catch {
    metrics.push("crowdfund_campaigns_total NaN");
  }

  metrics.push(`crowdfund_uptime_seconds ${Math.floor(process.uptime())}`);
  metrics.push(`crowdfund_memory_rss_bytes ${process.memoryUsage().rss}`);

  return c.text(metrics.join("\n") + "\n", 200, { "Content-Type": "text/plain" });
});
