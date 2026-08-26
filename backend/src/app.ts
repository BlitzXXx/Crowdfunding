import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { health } from "./routes/health.js";
import { campaigns } from "./routes/campaigns.js";
import { ipfs } from "./routes/ipfs.js";
import { blockchain } from "./routes/blockchain.js";
import { users } from "./routes/users.js";
import { search } from "./routes/search.js";
import { monitoring } from "./routes/monitoring.js";
import { openApiSpec } from "./openapi.js";
import { env } from "./env.js";

const docsPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CrowdChain API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;

export function createApp() {
  const app = new Hono();

  app.use("*", cors({ origin: env.CORS_ORIGIN }));

  if (env.NODE_ENV !== "test") {
    app.use(
      "/api/*",
      rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),
        max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
      })
    );
  }

  // onError is the only reliable global error boundary in Hono v4:
  // errors thrown inside mounted sub-apps bypass app.use() middleware.
  app.onError(errorHandler);

  app.get("/openapi.json", (c) => c.json(openApiSpec));
  app.get("/docs", (c) => c.html(docsPage));

  app.route("/health", health);
  app.route("/api/v1/campaigns", campaigns);
  app.route("/api/v1/ipfs", ipfs);
  app.route("/api/v1/blockchain", blockchain);
  app.route("/api/v1/users", users);
  app.route("/api/v1/search", search);
  app.route("/api/v1/monitoring", monitoring);

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}
