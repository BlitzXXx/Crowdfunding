import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { FACTORY_ADDRESS, factoryAbi } from "@/config/contracts";
import { Spinner, Card, Alert } from "@/components/ui";
import { CampaignCard } from "@/components/CampaignCard";
import { useGraphQuery, useSubgraphEnabled } from "@/hooks/useSubgraph";
import { fetchCampaignDetails } from "@/lib/readCampaigns";
import { formatEth, shortAddress } from "@/lib/format";

interface GraphUser {
  user: {
    campaignsCreatedCount: string;
    contributionsCount: string;
    totalContributed: string;
    totalRefunded: string;
  };
}

export default function DashboardPage() {
  const { address } = useAccount();
  const client = usePublicClient();
  const subgraphEnabled = useSubgraphEnabled();

  const created = useQuery({
    enabled: !!client && !!address,
    queryKey: ["myCampaigns", address],
    queryFn: async () => {
      const addresses = (await client!.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "getCampaignsByCreator",
        args: [address!],
      })) as readonly `0x${string}`[];

      const details = await fetchCampaignDetails(client!, [...addresses].reverse());
      return details;
    },
  });

  const stats = useGraphQuery<GraphUser>(
    `query User($id: ID!) { user(id: $id) { campaignsCreatedCount contributionsCount totalContributed totalRefunded } }`,
    { id: address?.toLowerCase() ?? "" },
    !!address
  );

  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-slate-400">
        Connect your wallet to view your dashboard.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 font-mono text-sm text-slate-500">{shortAddress(address)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Campaigns created</p>
          <p className="mt-1 text-2xl font-bold text-white">{created.data?.length ?? "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total backed</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.data ? formatEth(BigInt(stats.data.user.totalContributed)) : "—"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Backer count</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {stats.data ? stats.data.user.contributionsCount : "—"}
          </p>
        </Card>
      </div>

      {!subgraphEnabled && (
        <Alert tone="info">
          Set <code>VITE_SUBGRAPH_URL</code> to unlock contribution history (indexed by the subgraph).
        </Alert>
      )}

      <h2 className="mb-4 mt-10 text-lg font-semibold text-white">My campaigns</h2>
      {created.isLoading ? (
        <Spinner />
      ) : created.data && created.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {created.data.map((details) => (
            <CampaignCard key={details.address} details={details} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">You haven't created any campaigns yet.</p>
      )}
    </div>
  );
}
