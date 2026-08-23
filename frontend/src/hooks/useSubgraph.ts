import { useQuery } from "@tanstack/react-query";
import { SUBGRAPH_URL } from "@/config/contracts";
import { gqlRequest } from "@/lib/gql";

export function useSubgraphEnabled(): boolean {
  return SUBGRAPH_URL.length > 0;
}

export function useGraphQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  enabled = true
) {
  const subgraphReady = useSubgraphEnabled();

  return useQuery({
    queryKey: ["subgraph", query, variables],
    queryFn: () => gqlRequest<T>(query, variables),
    enabled: enabled && subgraphReady,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}
