import { Hono } from "hono";
import { z } from "zod";
import {
  gatewayUrl,
  isIpfsConfigured,
  pinFile,
  pinJson,
} from "../services/ipfs.service.js";

export const ipfs = new Hono();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

ipfs.use("*", async (c, next) => {
  if (!isIpfsConfigured()) {
    return c.json(
      { error: "IPFS not configured. Set PINATA_JWT in environment." },
      503
    );
  }
  await next();
});

const jsonPinSchema = z.object({
  content: z.record(z.unknown()),
  name: z.string().max(100).optional(),
});

ipfs.post("/json", async (c) => {
  const body = jsonPinSchema.parse(await c.req.json());

  const result = await pinJson(body.content, body.name);

  return c.json({ ...result, url: gatewayUrl(result.cid) }, 201);
});

ipfs.post("/file", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return c.json({ error: "Missing 'file' field in multipart form data" }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "File exceeds 10 MB limit" }, 413);
  }

  const name = formData.get("name");
  const result = await pinFile(
    file,
    typeof name === "string" ? name : undefined
  );

  return c.json({ ...result, url: gatewayUrl(result.cid) }, 201);
});
