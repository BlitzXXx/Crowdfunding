import { Hono } from "hono";
import { getPrisma } from "../services/prisma.js";
import {
  createCampaignMetadataSchema,
  updateCampaignMetadataSchema,
} from "../schemas/campaign.js";

export const campaigns = new Hono();

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

campaigns.get("/", async (c) => {
  const prisma = getPrisma();
  if (!prisma) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const category = c.req.query("category");
  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? "20") || 20));

  const [items, total] = await Promise.all([
    prisma.campaignMetadata.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaignMetadata.count({
      where: category ? { category } : undefined,
    }),
  ]);

  return c.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

campaigns.get("/:address", async (c) => {
  const prisma = getPrisma();
  if (!prisma) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const item = await prisma.campaignMetadata.findUnique({
    where: { campaignAddress: normalizeAddress(c.req.param("address")) },
  });

  if (!item) {
    return c.json({ error: "Campaign metadata not found" }, 404);
  }

  return c.json(item);
});

campaigns.post("/", async (c) => {
  const body = createCampaignMetadataSchema.parse(await c.req.json());

  const prisma = getPrisma();
  if (!prisma) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const item = await prisma.campaignMetadata.upsert({
    where: { campaignAddress: normalizeAddress(body.campaignAddress) },
    create: {
      ...body,
      campaignAddress: normalizeAddress(body.campaignAddress),
      factoryAddress: normalizeAddress(body.factoryAddress),
    },
    update: {
      title: body.title,
      description: body.description,
      category: body.category,
      imageUrl: body.imageUrl,
      metadataCid: body.metadataCid,
      websiteUrl: body.websiteUrl,
      twitterHandle: body.twitterHandle,
    },
  });

  return c.json(item, 201);
});

campaigns.patch("/:address", async (c) => {
  const body = updateCampaignMetadataSchema.parse(await c.req.json());

  const prisma = getPrisma();
  if (!prisma) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const existing = await prisma.campaignMetadata.findUnique({
    where: { campaignAddress: normalizeAddress(c.req.param("address")) },
  });

  if (!existing) {
    return c.json({ error: "Campaign metadata not found" }, 404);
  }

  const item = await prisma.campaignMetadata.update({
    where: { campaignAddress: normalizeAddress(c.req.param("address")) },
    data: body,
  });

  return c.json(item);
});

campaigns.delete("/:address", async (c) => {
  const prisma = getPrisma();
  if (!prisma) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const address = normalizeAddress(c.req.param("address"));
  const existing = await prisma.campaignMetadata.findUnique({
    where: { campaignAddress: address },
  });

  if (!existing) {
    return c.json({ error: "Campaign metadata not found" }, 404);
  }

  await prisma.campaignMetadata.delete({ where: { campaignAddress: address } });

  return c.body(null, 204);
});
