import type { Context } from "hono";
import { ZodError } from "zod";

export interface ApiError {
  error: string;
  details?: unknown;
}

export function isZodLikeError(err: unknown): err is ZodError {
  return (
    err instanceof ZodError ||
    (typeof err === "object" &&
      err !== null &&
      (err as { name?: string }).name === "ZodError" &&
      typeof (err as { flatten?: unknown }).flatten === "function")
  );
}

export async function errorHandler(err: Error, c: Context) {
  if (isZodLikeError(err)) {
    return c.json<ApiError>(
      { error: "Validation failed", details: err.flatten().fieldErrors },
      400
    );
  }

  console.error("Unhandled error:", err);
  return c.json<ApiError>({ error: "Internal server error" }, 500);
}
