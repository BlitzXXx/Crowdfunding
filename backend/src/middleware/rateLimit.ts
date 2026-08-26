import type { MiddlewareHandler } from "hono";

interface Bucket {
  hits: number[];
}

/**
 * Fixed-window in-memory rate limiter keyed by client IP.
 * Zero dependencies; suitable for single-instance deployments.
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
}): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();

  const sweeper = setInterval(() => {
    const cutoff = Date.now() - options.windowMs;
    for (const [key, bucket] of buckets) {
      bucket.hits = bucket.hits.filter((t) => t > cutoff);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  }, options.windowMs);
  sweeper.unref();

  return async (c, next) => {
    const key =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    const bucket = buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((t) => now - t < options.windowMs);

    if (bucket.hits.length >= options.max) {
      const retryAfterSec = Math.ceil(
        (options.windowMs - (now - bucket.hits[0])) / 1000
      );
      c.header("Retry-After", String(retryAfterSec));
      c.header("X-RateLimit-Limit", String(options.max));
      c.header("X-RateLimit-Remaining", "0");
      return c.json({ error: "Too many requests" }, 429);
    }

    bucket.hits.push(now);
    buckets.set(key, bucket);
    c.header("X-RateLimit-Limit", String(options.max));
    c.header("X-RateLimit-Remaining", String(options.max - bucket.hits.length));

    await next();
  };
}
