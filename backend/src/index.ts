import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { disconnectPrisma } from "./services/prisma.js";

const app = createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`crowdfunding-backend listening on http://localhost:${info.port}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  server.close();
  await disconnectPrisma();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
