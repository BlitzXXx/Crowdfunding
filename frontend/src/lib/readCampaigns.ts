import type { Abi, PublicClient } from "viem";
import {
  FACTORY_ADDRESS,
  CAMPAIGN_STATE,
  campaignAbi,
  factoryAbi,
  type CampaignDetails,
} from "@/config/contracts";

export async function fetchCampaignAddresses(
  client: PublicClient,
  count: bigint
): Promise<readonly `0x${string}`[]> {
  return (await client.readContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getCampaignsPaginated",
    args: [0n, count],
  })) as readonly `0x${string}`[];
}

export function decodeDetails(
  address: `0x${string}`,
  raw: readonly unknown[],
  state: number
): CampaignDetails {
  const [creator, goal, deadline, totalFunds, goalReached, fundsWithdrawn, ipfsHash, contributorsCount] =
    raw as [`0x${string}`, bigint, bigint, bigint, boolean, boolean, string, bigint];
  return {
    address,
    creator,
    goal,
    deadline,
    totalFunds,
    goalReached,
    fundsWithdrawn,
    ipfsHash,
    contributorsCount,
    state,
  };
}

export async function fetchCampaignDetails(
  client: PublicClient,
  addresses: readonly `0x${string}`[]
): Promise<CampaignDetails[]> {
  const contracts = addresses.flatMap((address) => [
    { address, abi: campaignAbi, functionName: "getCampaignDetails" },
    { address, abi: campaignAbi, functionName: "getState" as const },
  ] as const satisfies readonly [{ address: `0x${string}`; abi: Abi; functionName: string }, { address: `0x${string}`; abi: Abi; functionName: string }]);

  const results = await client.multicall({ contracts, allowFailure: true });

  return addresses
    .map((address, i) => {
      const detailRes = results[i * 2];
      const stateRes = results[i * 2 + 1];
      if (detailRes.status !== "success" || !Array.isArray(detailRes.result)) return null;
      const state = stateRes?.status === "success" ? Number(stateRes.result) : CAMPAIGN_STATE.ACTIVE;
      return decodeDetails(address, detailRes.result as readonly unknown[], state);
    })
    .filter((d): d is CampaignDetails => d !== null);
}
