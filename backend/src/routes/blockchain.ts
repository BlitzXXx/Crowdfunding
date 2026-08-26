import { Hono } from "hono";
import {
  getCampaignCount,
  getCampaignDetails,
  getAllCampaigns,
  getRecentEvents,
  formatCampaign,
  getClient,
  getFactoryAddress,
} from "../services/blockchain.service.js";

export const blockchain = new Hono();

// Health check for blockchain connectivity
blockchain.get("/status", async (c) => {
  try {
    const client = getClient();
    const [blockNumber, count] = await Promise.all([
      client.getBlockNumber(),
      getCampaignCount(),
    ]);
    return c.json({
      connected: true,
      blockNumber: blockNumber.toString(),
      campaignCount: count.toString(),
      factoryAddress: getFactoryAddress(),
    });
  } catch (e) {
    return c.json(
      {
        connected: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
      503
    );
  }
});

// List all campaigns from chain
blockchain.get("/campaigns", async (c) => {
  try {
    const campaigns = await getAllCampaigns();
    return c.json({
      campaigns: campaigns.map(formatCampaign),
      total: campaigns.length,
    });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Failed to fetch campaigns" },
      500
    );
  }
});

// Get single campaign details
blockchain.get("/campaigns/:address", async (c) => {
  const address = c.req.param("address") as `0x${string}`;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return c.json({ error: "Invalid address format" }, 400);
  }
  try {
    const details = await getCampaignDetails(address);
    return c.json(formatCampaign(details));
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Campaign not found" },
      404
    );
  }
});

// Get recent on-chain events
blockchain.get("/events", async (c) => {
  const fromBlock = c.req.query("fromBlock");
  const toBlock = c.req.query("toBlock");
  try {
    const events = await getRecentEvents(
      fromBlock ? BigInt(fromBlock) : undefined,
      toBlock ? BigInt(toBlock) : undefined
    );
    return c.json({ events, total: events.length });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Failed to fetch events" },
      500
    );
  }
});

// Platform statistics aggregated from chain
blockchain.get("/stats", async (c) => {
  try {
    const campaigns = await getAllCampaigns();

    let totalVolume = 0n;
    let activeCount = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let cancelledCount = 0;
    let totalContributors = 0n;

    for (const camp of campaigns) {
      totalVolume += camp.totalFunds;
      switch (camp.state) {
        case 0: activeCount++; break;
        case 1: successfulCount++; break;
        case 2: failedCount++; break;
        case 3: cancelledCount++; break;
      }
      totalContributors += camp.contributorsCount;
    }

    return c.json({
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCount,
      successfulCampaigns: successfulCount,
      failedCampaigns: failedCount,
      cancelledCampaigns: cancelledCount,
      totalVolume: totalVolume.toString(),
      totalContributors: totalContributors.toString(),
    });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Failed to compute stats" },
      500
    );
  }
});
