import { Hono } from "hono";
import { getPrisma } from "../services/prisma.js";

export const health = new Hono();

health.get("/", async (c) => {
  const dbConfigured = Boolean(process.env.DATABASE_URL);
  let dbConnected = false;

  if (dbConfigured) {
    const prisma = getPrisma();
    try {
      await prisma!.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
  }

  const status = !dbConfigured || dbConnected ? "ok" : "degraded";

  return c.json({
    status,
    service: "crowdfunding-backend",
    version: "1.0.0",
    checks: {
      database: {
        configured: dbConfigured,
        connected: dbConnected,
      },
      ipfs: {
        configured: Boolean(process.env.PINATA_JWT),
      },
    },
    timestamp: new Date().toISOString(),
  });
});
