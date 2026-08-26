import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { rateLimit } from "../src/middleware/rateLimit.js";

function createLimitedApp(max: number) {
  const app = new Hono();
  app.use("*", rateLimit({ windowMs: 60_000, max }));
  app.get("/ping", (c) => c.json({ ok: true }));
  return app;
}

describe("rateLimit middleware", () => {
  it("allows requests under the limit", async () => {
    const app = createLimitedApp(3);

    for (let i = 0; i < 3; i++) {
      const res = await app.request("/ping");
      expect(res.status).toBe(200);
    }
  });

  it("returns 429 with Retry-After once the limit is exceeded", async () => {
    const app = createLimitedApp(2);

    await app.request("/ping");
    await app.request("/ping");
    const blocked = await app.request("/ping");

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(blocked.headers.get("X-RateLimit-Limit")).toBe("2");
    expect((await blocked.json()).error).toBe("Too many requests");
  });

  it("tracks remaining quota headers", async () => {
    const app = createLimitedApp(5);

    const res = await app.request("/ping");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("4");
  });
});
