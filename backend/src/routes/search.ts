import { Hono } from "hono";
import { getPrisma } from "../services/prisma.js";
import { getAllCampaigns, formatCampaign } from "../services/blockchain.service.js";

export const search = new Hono();

// Search campaigns by title, description, category, or creator address
search.get("/campaigns", async (c) => {
  const prisma = getPrisma();
  const q = c.req.query("q")?.trim();
  const category = c.req.query("category");
  const state = c.req.query("state"); // active, successful, failed, cancelled
  const sort = c.req.query("sort") ?? "newest"; // newest, raised, progress, ending
  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? "20") || 20));

  // Build DB query filters
  const dbWhere: Record<string, unknown> = {};
  if (q) {
    dbWhere.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { campaignAddress: { contains: q.toLowerCase() } },
    ];
  }
  if (category) dbWhere.category = category;

  // Fetch from DB (metadata)
  const [dbItems, total] = await Promise.all([
    prisma
      ? prisma.campaignMetadata.findMany({
          where: Object.keys(dbWhere).length > 0 ? dbWhere : undefined,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        })
      : Promise.resolve([]),
    prisma
      ? prisma.campaignMetadata.count({
          where: Object.keys(dbWhere).length > 0 ? dbWhere : undefined,
        })
      : Promise.resolve(0),
  ]);

  // Fetch from chain (live data)
  let chainCampaigns = await getAllCampaigns();

  // Apply state filter from chain data
  if (state) {
    const stateMap: Record<string, number> = {
      active: 0, successful: 1, funded: 1, failed: 2, expired: 2, cancelled: 3,
    };
    const stateCode = stateMap[state.toLowerCase()];
    if (stateCode !== undefined) {
      chainCampaigns = chainCampaigns.filter((c) => c.state === stateCode);
    }
  }

  // Apply text search on chain data (creator address, ipfsHash)
  if (q) {
    const ql = q.toLowerCase();
    chainCampaigns = chainCampaigns.filter(
      (c) =>
        c.creator.toLowerCase().includes(ql) ||
        c.address.toLowerCase().includes(ql) ||
        c.ipfsHash.toLowerCase().includes(ql)
    );
  }

  // Sort chain data
  switch (sort) {
    case "raised":
      chainCampaigns.sort((a, b) => (b.totalFunds > a.totalFunds ? 1 : -1));
      break;
    case "progress":
      chainCampaigns.sort((a, b) => {
        const pa = a.goal > 0n ? Number((a.totalFunds * 10000n) / a.goal) : 0;
        const pb = b.goal > 0n ? Number((b.totalFunds * 10000n) / b.goal) : 0;
        return pb - pa;
      });
      break;
    case "ending":
      chainCampaigns.sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
      break;
    default: // newest
      break;
  }

  // Merge: combine DB metadata with chain data
  const chainMap = new Map(chainCampaigns.map((c) => [c.address.toLowerCase(), c]));
  const merged = dbItems.map((meta) => {
    const chain = chainMap.get(meta.campaignAddress.toLowerCase());
    return {
      ...meta,
      onChain: chain ? formatCampaign(chain) : null,
    };
  });

  // If no DB results, return chain-only results
  if (dbItems.length === 0 && chainCampaigns.length > 0) {
    return c.json({
      items: chainCampaigns.slice((page - 1) * limit, page * limit).map(formatCampaign),
      pagination: { page, limit, total: chainCampaigns.length, pages: Math.ceil(chainCampaigns.length / limit) },
      source: "chain",
    });
  }

  return c.json({
    items: merged,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    source: "db+chain",
  });
});

// Search users by display name or address
search.get("/users", async (c) => {
  const prisma = getPrisma();
  if (!prisma) return c.json({ items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });

  const q = c.req.query("q")?.trim();
  const page = Math.max(1, Number(c.req.query("page") ?? "1") || 1);
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? "20") || 20));

  const where = q
    ? {
        OR: [
          { displayName: { contains: q, mode: "insensitive" as const } },
          { address: { contains: q.toLowerCase() } },
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
});
