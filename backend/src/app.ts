import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { health } from "./routes/health.js";
import { campaigns } from "./routes/campaigns.js";
import { ipfs } from "./routes/ipfs.js";
import { env } from "./env.js";

export function createApp() {
  const app = new Hono();

  app.use("*", cors({ origin: env.CORS_ORIGIN }));

  // onError is the only reliable global error boundary in Hono v4:
  // errors thrown inside mounted sub-apps bypass app.use() middleware.
  app.onError(errorHandler);

  app.route("/health", health);
  app.route("/api/v1/campaigns", campaigns);
  app.route("/api/v1/ipfs", ipfs);

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}
