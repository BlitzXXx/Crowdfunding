import { createPublicClient, http, formatEther, type PublicClient, type Address } from "viem";
import { sepolia } from "viem/chains";
import { env } from "../env.js";

// ── Contract ABIs (subset needed for reading) ────────────────

const factoryAbi = [
  {
    inputs: [],
    name: "getCampaignCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getCampaignAddress",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "predictNextCampaignAddress",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "campaign", type: "address" }],
    name: "verifyCampaign",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "campaignAddress", type: "address" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "goal", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" },
      { indexed: false, name: "ipfsHash", type: "string" },
    ],
    name: "CampaignCreated",
    type: "event",
  },
] as const;

const campaignAbi = [
  {
    inputs: [],
    name: "getCampaignDetails",
    outputs: [
      { name: "creator", type: "address" },
      { name: "goal", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "totalFunds", type: "uint256" },
      { name: "goalReached", type: "bool" },
      { name: "fundsWithdrawn", type: "bool" },
      { name: "ipfsHash", type: "string" },
      { name: "contributorsCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getState",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "contributor", type: "address" }],
    name: "getContribution",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "contributor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "ContributionMade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "totalAmount", type: "uint256" }],
    name: "GoalReached",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "WithdrawalMade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "contributor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "RefundClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "CampaignCancelled",
    type: "event",
  },
] as const;

// ── Client singleton ─────────────────────────────────────────

let client: PublicClient | null = null;

export function getClient(): PublicClient {
  if (!client) {
    client = createPublicClient({
      chain: sepolia,
      transport: http(env.SEPOLIA_RPC_URL),
    });
  }
  return client;
}

export function getFactoryAddress(): Address {
  const addr = env.CONTRACT_ADDRESS;
  if (!addr) throw new Error("CONTRACT_ADDRESS not set in environment");
  return addr as Address;
}

// ── Read functions ───────────────────────────────────────────

export async function getCampaignCount(): Promise<bigint> {
  const c = getClient();
  const count = await c.readContract({
    address: getFactoryAddress(),
    abi: factoryAbi,
    functionName: "getCampaignCount",
  });
  return count;
}

export async function getCampaignAddresses(
  start = 0n,
  end?: bigint
): Promise<Address[]> {
  const c = getClient();
  const count = await getCampaignCount();
  const last = end !== undefined ? (end < count ? end : count) : count;
  const addresses: Address[] = [];

  for (let i = BigInt(start); i < last; i++) {
    const addr = await c.readContract({
      address: getFactoryAddress(),
      abi: factoryAbi,
      functionName: "getCampaignAddress",
      args: [i],
    });
    addresses.push(addr);
  }
  return addresses;
}

export interface CampaignOnChain {
  address: Address;
  creator: Address;
  goal: bigint;
  deadline: bigint;
  totalFunds: bigint;
  goalReached: boolean;
  fundsWithdrawn: boolean;
  ipfsHash: string;
  contributorsCount: bigint;
  state: number;
}

export async function getCampaignDetails(
  address: Address
): Promise<CampaignOnChain> {
  const c = getClient();

  const [details, state] = await Promise.all([
    c.readContract({
      address,
      abi: campaignAbi,
      functionName: "getCampaignDetails",
    }),
    c.readContract({
      address,
      abi: campaignAbi,
      functionName: "getState",
    }),
  ]);

  return {
    address,
    creator: details[0],
    goal: details[1],
    deadline: details[2],
    totalFunds: details[3],
    goalReached: details[4],
    fundsWithdrawn: details[5],
    ipfsHash: details[6],
    contributorsCount: details[7],
    state: Number(state),
  };
}

export async function getAllCampaigns(): Promise<CampaignOnChain[]> {
  const addresses = await getCampaignAddresses();
  const campaigns = await Promise.all(
    addresses.map((addr) => getCampaignDetails(addr))
  );
  return campaigns.reverse(); // newest first
}

// ── Event watching ───────────────────────────────────────────

export type CampaignEvent =
  | { type: "CampaignCreated"; campaignAddress: Address; creator: Address; goal: bigint; deadline: bigint; ipfsHash: string; blockNumber: bigint }
  | { type: "ContributionMade"; contributor: Address; amount: bigint; blockNumber: bigint }
  | { type: "GoalReached"; totalAmount: bigint; blockNumber: bigint }
  | { type: "WithdrawalMade"; amount: bigint; blockNumber: bigint }
  | { type: "RefundClaimed"; contributor: Address; amount: bigint; blockNumber: bigint }
  | { type: "CampaignCancelled"; blockNumber: bigint };

export async function getRecentEvents(
  fromBlock?: bigint,
  toBlock?: bigint
): Promise<CampaignEvent[]> {
  const c = getClient();
  const factoryAddr = getFactoryAddress();

  // Get all campaign addresses to watch their events too
  const count = await getCampaignCount();
  const campaignAddresses = await getCampaignAddresses(0n, count > 10n ? 10n : count); // limit to recent 10

  const events: CampaignEvent[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type RawLog = { eventName?: string; args?: any; blockNumber: bigint; topics: readonly `0x${string}`[]; data: `0x${string}` };

  // Factory events
  const rawFactoryLogs = await c.getLogs({
    address: factoryAddr,
    fromBlock: fromBlock ?? "earliest",
    toBlock: toBlock ?? "latest",
  });

  for (const raw of rawFactoryLogs) {
    const log = raw as unknown as RawLog;
    if (log.eventName === "CampaignCreated" && log.args) {
      events.push({
        type: "CampaignCreated",
        campaignAddress: log.args.campaignAddress as Address,
        creator: log.args.creator as Address,
        goal: log.args.goal as bigint,
        deadline: log.args.deadline as bigint,
        ipfsHash: log.args.ipfsHash as string,
        blockNumber: log.blockNumber,
      });
    }
  }

  // Campaign events (from recent campaigns)
  for (const addr of campaignAddresses) {
    try {
      const rawLogs = await c.getLogs({
        address: addr,
        fromBlock: fromBlock ?? "earliest",
        toBlock: toBlock ?? "latest",
      });

      for (const raw of rawLogs) {
        const log = raw as unknown as RawLog;
        if (!log.eventName || !log.args) continue;

        switch (log.eventName) {
          case "ContributionMade":
            events.push({
              type: "ContributionMade",
              contributor: log.args.contributor as Address,
              amount: log.args.amount as bigint,
              blockNumber: log.blockNumber,
            });
            break;
          case "GoalReached":
            events.push({
              type: "GoalReached",
              totalAmount: log.args.totalAmount as bigint,
              blockNumber: log.blockNumber,
            });
            break;
          case "WithdrawalMade":
            events.push({
              type: "WithdrawalMade",
              amount: log.args.amount as bigint,
              blockNumber: log.blockNumber,
            });
            break;
          case "RefundClaimed":
            events.push({
              type: "RefundClaimed",
              contributor: log.args.contributor as Address,
              amount: log.args.amount as bigint,
              blockNumber: log.blockNumber,
            });
            break;
          case "CampaignCancelled":
            events.push({ type: "CampaignCancelled", blockNumber: log.blockNumber });
            break;
        }
      }
    } catch {
      // Campaign may not have events yet
    }
  }

  return events.sort((a, b) =>
    a.blockNumber > b.blockNumber ? -1 : 1
  );
}

// ── Formatting helpers ───────────────────────────────────────

export function formatCampaign(c: CampaignOnChain) {
  const states = ["Active", "Successful", "Failed", "Cancelled"];
  return {
    address: c.address,
    creator: c.creator,
    goal: formatEther(c.goal),
    deadline: new Date(Number(c.deadline) * 1000).toISOString(),
    totalFunds: formatEther(c.totalFunds),
    goalReached: c.goalReached,
    fundsWithdrawn: c.fundsWithdrawn,
    ipfsHash: c.ipfsHash,
    contributorsCount: c.contributorsCount.toString(),
    state: states[c.state] ?? "Unknown",
    stateCode: c.state,
  };
}
