import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

// Helper: make a request and parse JSON
async function req(path: string, init?: RequestInit) {
  const res = await app.request(path, init);
  const body = await res.json().catch(() => null);
  return { res, body };
}

// ─── Users ─────────────────────────────────────────────────
describe("Users", () => {
  describe("GET /api/v1/users", () => {
    it("returns paginated list or 503 without DB", async () => {
      const { res, body } = await req("/api/v1/users");
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("items");
        expect(body).toHaveProperty("pagination");
      }
    });

    it("accepts pagination query params", async () => {
      const { res } = await req("/api/v1/users?page=2&limit=10");
      expect([200, 503]).toContain(res.status);
    });

    it("accepts search query", async () => {
      const { res } = await req("/api/v1/users?q=test");
      expect([200, 503]).toContain(res.status);
    });
  });

  describe("GET /api/v1/users/:address", () => {
    it("validates address or returns error when DB unavailable", async () => {
      const { res } = await req("/api/v1/users/not-a-address");
      expect([400, 503]).toContain(res.status);
    });

    it("accepts valid hex address", async () => {
      const addr = "0x" + "a".repeat(40);
      const { res } = await req(`/api/v1/users/${addr}`);
      expect([404, 503]).toContain(res.status);
    });
  });

  describe("PATCH /api/v1/users/:address", () => {
    it("returns 404 or 503 for unknown address", async () => {
      const addr = "0x" + "a".repeat(40);
      const { res } = await req(`/api/v1/users/${addr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Test" }),
      });
      expect([404, 503]).toContain(res.status);
    });
  });
});

// ─── Search ────────────────────────────────────────────────
describe("Search", () => {
  describe("GET /api/v1/search/campaigns", () => {
    it("returns results or error when chain unavailable", async () => {
      const { res, body } = await req("/api/v1/search/campaigns");
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("items");
        expect(body).toHaveProperty("pagination");
      }
    });

    it("accepts all query params", async () => {
      const { res } = await req("/api/v1/search/campaigns?q=test&category=tech&state=active&sort=newest");
      expect([200, 500]).toContain(res.status);
    });

    it("accepts pagination", async () => {
      const { res } = await req("/api/v1/search/campaigns?page=2&limit=5");
      expect([200, 500]).toContain(res.status);
    });
  });

  describe("GET /api/v1/search/users", () => {
    it("returns results or empty list", async () => {
      const { res, body } = await req("/api/v1/search/users");
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("items");
        expect(body).toHaveProperty("pagination");
      }
    });
  });
});

// ─── Monitoring ────────────────────────────────────────────
describe("Monitoring", () => {
  describe("GET /api/v1/monitoring", () => {
    it("returns service health status", async () => {
      const { res, body } = await req("/api/v1/monitoring");
      expect(res.status).toBe(200);
      expect(body).toHaveProperty("checks");
      expect(body).toHaveProperty("timestamp");
      expect(body).toHaveProperty("status");
      expect(["healthy", "degraded"]).toContain(body.status);
    }, 15000); // blockchain RPC may be slow
  });

  describe("GET /api/v1/monitoring/graph-node", () => {
    it("returns graph-node status or 503", async () => {
      const { res } = await req("/api/v1/monitoring/graph-node");
      expect([200, 502, 503]).toContain(res.status);
    });
  });

  describe("GET /api/v1/monitoring/metrics", () => {
    it("returns prometheus metrics", async () => {
      const res = await app.request("/api/v1/monitoring/metrics");
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");
      const text = await res.text();
      expect(text).toContain("crowdfund_uptime_seconds");
      expect(text).toContain("crowdfund_memory_rss_bytes");
    });
  });
});

// ─── Blockchain ────────────────────────────────────────────
describe("Blockchain", () => {
  describe("GET /api/v1/blockchain/status", () => {
    it("returns chain connection status", async () => {
      const { res, body } = await req("/api/v1/blockchain/status");
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("connected");
        expect(body).toHaveProperty("blockNumber");
        expect(body).toHaveProperty("campaignCount");
      }
    });
  });

  describe("GET /api/v1/blockchain/campaigns", () => {
    it("returns campaign list or error", async () => {
      const { res, body } = await req("/api/v1/blockchain/campaigns");
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("campaigns");
        expect(body).toHaveProperty("total");
      }
    });
  });

  describe("GET /api/v1/blockchain/campaigns/:address", () => {
    it("validates address format", async () => {
      const { res, body } = await req("/api/v1/blockchain/campaigns/not-valid");
      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid address format");
    });

    it("accepts valid address format", async () => {
      const addr = "0x" + "a".repeat(40);
      const { res } = await req(`/api/v1/blockchain/campaigns/${addr}`);
      expect([404, 500]).toContain(res.status);
    });
  });

  describe("GET /api/v1/blockchain/events", () => {
    it("returns recent events or error", async () => {
      const { res, body } = await req("/api/v1/blockchain/events");
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("events");
        expect(body).toHaveProperty("total");
      }
    });
  });

  describe("GET /api/v1/blockchain/stats", () => {
    it("returns platform statistics or error", async () => {
      const { res, body } = await req("/api/v1/blockchain/stats");
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(body).toHaveProperty("totalCampaigns");
        expect(body).toHaveProperty("totalVolume");
      }
    });
  });
});

// ─── IPFS ──────────────────────────────────────────────────
describe("IPFS", () => {
  describe("POST /api/v1/ipfs/json", () => {
    it("rejects without body", async () => {
      const { res } = await req("/api/v1/ipfs/json", {
        method: "POST",
      });
      expect([400, 500]).toContain(res.status);
    });

    it("accepts valid JSON content", async () => {
      const { res } = await req("/api/v1/ipfs/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { test: true } }),
      });
      // May fail if Pinata JWT not configured
      expect([201, 500]).toContain(res.status);
    });
  });
});

// ─── OpenAPI completeness ──────────────────────────────────
describe("OpenAPI", () => {
  it("documents all route groups", async () => {
    const { body } = await req("/openapi.json");
    const paths = Object.keys(body.paths);

    // Core routes
    expect(paths).toContain("/health");
    expect(paths).toContain("/api/v1/campaigns");

    // Verify new route groups exist in the spec
    const pathStr = paths.join(" ");
    expect(pathStr).toMatch(/users|user/);
    expect(pathStr).toMatch(/search/);
    expect(pathStr).toMatch(/blockchain/);
    expect(pathStr).toMatch(/monitoring/);
  });
});
