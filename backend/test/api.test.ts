import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

describe("API", () => {
  const app = createApp();

  describe("GET /health", () => {
    it("returns ok status with service metadata", async () => {
      const res = await app.request("/health");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(["ok", "degraded"]).toContain(body.status);
      expect(body.service).toBe("crowdfunding-backend");
      expect(body.checks.database.configured).toBeTypeOf("boolean");
    });
  });

  describe("POST /api/v1/campaigns", () => {
    it("rejects invalid payloads with 400", async () => {
      const res = await app.request("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignAddress: "not-an-address",
          factoryAddress: "0x1234",
          title: "x",
          description: "short",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Validation failed");
    });
  });

  describe("GET /openapi.json", () => {
    it("serves a valid OpenAPI document", async () => {
      const res = await app.request("/openapi.json");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.openapi).toBe("3.1.0");
      expect(body.info.title).toBe("CrowdChain Backend API");
      expect(Object.keys(body.paths)).toContain("/api/v1/campaigns");
    });
  });

  describe("GET /docs", () => {
    it("serves the Swagger UI page", async () => {
      const res = await app.request("/docs");

      expect(res.status).toBe(200);
      expect(await res.text()).toContain("swagger-ui");
    });
  });

  describe("unknown routes", () => {
    it("returns 404 JSON", async () => {
      const res = await app.request("/nope");
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Not found");
    });
  });
});
