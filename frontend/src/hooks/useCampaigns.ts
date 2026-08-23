import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient, useReadContract } from "wagmi";
import {
  FACTORY_ADDRESS,
  CAMPAIGN_STATE,
  campaignAbi,
  factoryAbi,
} from "@/config/contracts";
import { decodeDetails, fetchCampaignAddresses, fetchCampaignDetails } from "@/lib/readCampaigns";

export function useCampaignCount() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getCampaignCount",
    query: { enabled: FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000" },
  });
}

export function useCampaignAddresses(count: bigint | undefined) {
  const client = usePublicClient();
  const enabled = !!client && count !== undefined && count > 0n;

  return useQuery({
    queryKey: ["campaignAddresses", count?.toString()],
    enabled,
    staleTime: 5_000,
    queryFn: async () => {
      const addresses = await fetchCampaignAddresses(client!, count!);
      return [...addresses].reverse();
    },
  });
}

export function useCampaignList(addresses: readonly `0x${string}`[] | undefined) {
  const client = usePublicClient();
  const enabled = !!client && !!addresses && addresses.length > 0;

  return useQuery({
    queryKey: ["campaignList", addresses?.map((a) => a).join(",")],
    enabled,
    staleTime: 5_000,
    refetchInterval: 10_000,
    queryFn: () => fetchCampaignDetails(client!, addresses!),
  });
}

export function useCampaign(address: `0x${string}` | undefined) {
  const detailsQuery = useReadContract({
    address,
    abi: campaignAbi,
    functionName: "getCampaignDetails",
    query: { enabled: !!address },
  });

  const stateQuery = useReadContract({
    address,
    abi: campaignAbi,
    functionName: "getState",
    query: { enabled: !!address },
  });

  const details = useMemo(() => {
    if (!address || !detailsQuery.data) return undefined;
    const state =
      stateQuery.data !== undefined ? Number(stateQuery.data) : CAMPAIGN_STATE.ACTIVE;
    return decodeDetails(address, detailsQuery.data as readonly unknown[], state);
  }, [address, detailsQuery.data, stateQuery.data]);

  const refetch = () => {
    detailsQuery.refetch();
    stateQuery.refetch();
  };

  return { details, isLoading: detailsQuery.isLoading, refetch };
}

export function useMyContribution(
  campaignAddress: `0x${string}` | undefined,
  account?: `0x${string}`
) {
  return useReadContract({
    address: campaignAddress,
    abi: campaignAbi,
    functionName: "getContribution",
    args: account ? [account] : undefined,
    query: { enabled: !!campaignAddress && !!account },
  });
}
