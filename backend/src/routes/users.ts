import { Hono } from "hono";
import { z } from "zod";
import { getPrisma } from "../services/prisma.js";

export const users = new Hono();

const profileSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a 20-byte hex address"),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
});

const updateSchema = profileSchema.omit({ address: true }).partial();

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

// List all profiles (paginated)
users.get("/", async (c) => {
  try {
    const prisma = getPrisma();
    if (!prisma) return c.json({ error: "Database not configured" }, 503);

    const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? "20") || 20));
    const search = c.req.query("q");

    const where = search
      ? {
          OR: [
            { displayName: { contains: search, mode: "insensitive" as const } },
            { address: { contains: search.toLowerCase() } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userProfile.count({ where }),
    ]);

    return c.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Database error" }, 503);
  }
});

// Get profile by wallet address
users.get("/:address", async (c) => {
  try {
    const prisma = getPrisma();
    if (!prisma) return c.json({ error: "Database not configured" }, 503);

    const address = normalizeAddress(c.req.param("address"));
    const item = await prisma.userProfile.findUnique({ where: { address } });

    if (!item) return c.json({ error: "Profile not found" }, 404);
    return c.json(item);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Database error" }, 503);
  }
});

// Create or update profile (upsert by address)
users.post("/", async (c) => {
  try {
    const body = profileSchema.parse(await c.req.json());
    const prisma = getPrisma();
    if (!prisma) return c.json({ error: "Database not configured" }, 503);

    const address = normalizeAddress(body.address);
    const { address: _addr, ...data } = body;
    const item = await prisma.userProfile.upsert({
      where: { address },
      create: { address, ...data },
      update: {
        displayName: body.displayName,
        bio: body.bio,
        avatarUrl: body.avatarUrl,
        websiteUrl: body.websiteUrl,
      },
    });

    return c.json(item, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Validation")) throw e;
    return c.json({ error: e instanceof Error ? e.message : "Database error" }, 503);
  }
});

// Update profile
users.patch("/:address", async (c) => {
  try {
    const body = updateSchema.parse(await c.req.json());
    const prisma = getPrisma();
    if (!prisma) return c.json({ error: "Database not configured" }, 503);

    const address = normalizeAddress(c.req.param("address"));
    const existing = await prisma.userProfile.findUnique({ where: { address } });
    if (!existing) return c.json({ error: "Profile not found" }, 404);

    const item = await prisma.userProfile.update({ where: { address }, data: body });
    return c.json(item);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Validation")) throw e;
    return c.json({ error: e instanceof Error ? e.message : "Database error" }, 503);
  }
});

// Delete profile
users.delete("/:address", async (c) => {
  try {
    const prisma = getPrisma();
    if (!prisma) return c.json({ error: "Database not configured" }, 503);

    const address = normalizeAddress(c.req.param("address"));
    const existing = await prisma.userProfile.findUnique({ where: { address } });
    if (!existing) return c.json({ error: "Profile not found" }, 404);

    await prisma.userProfile.delete({ where: { address } });
    return c.body(null, 204);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Database error" }, 503);
  }
});
