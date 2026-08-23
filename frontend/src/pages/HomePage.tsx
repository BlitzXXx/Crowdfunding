import { Link } from "react-router-dom";
import { Rocket, Sparkles } from "lucide-react";
import { Spinner, Alert, Button } from "@/components/ui";
import { CampaignCard } from "@/components/CampaignCard";
import { useCampaignCount, useCampaignAddresses, useCampaignList } from "@/hooks/useCampaigns";
import { FACTORY_ADDRESS } from "@/config/contracts";

export default function HomePage() {
  const { data: rawCount } = useCampaignCount();
  const count = rawCount as bigint | undefined;
  const addresses = useCampaignAddresses(count);
  const list = useCampaignList(addresses.data);

  if (!import.meta.env.VITE_FACTORY_ADDRESS || FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Alert tone="info">
          Factory contract not configured. Set <code className="mx-1">VITE_FACTORY_ADDRESS</code> in{" "}
          <code className="mx-1">frontend/.env</code>, or deploy locally:
          <code className="mx-1">npm run deploy:ignition</code> in contracts/, then restart the dev server.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-10 rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-950 p-10">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
          <Sparkles className="text-violet-400" />
          Fund what matters, transparently
        </h1>
        <p className="mt-3 max-w-xl text-slate-400">
          Every campaign lives as its own smart contract. Contributions, refunds and payouts are fully
          trustless — no middleman, no gatekeeper.
        </p>
        <Link to="/create" className="mt-5 inline-block">
          <Button>Launch your campaign →</Button>
        </Link>
      </section>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-white">
          All campaigns{" "}
          <span className="ml-1 text-sm font-normal text-slate-500">
            ({count?.toString() ?? "…"} on-chain)
          </span>
        </h2>
      </div>

      {addresses.isLoading || (list.isLoading && !!addresses.data?.length) ? (
        <Spinner label="Loading campaigns…" />
      ) : list.data && list.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((details) => (
            <CampaignCard key={details.address} details={details} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 p-16 text-center text-slate-500">
          <Rocket className="mx-auto mb-3 text-slate-600" size={32} />
          <p>No campaigns yet. Be the first to launch one!</p>
          <Link to="/create" className="mt-4 inline-block">
            <Button variant="secondary">Create campaign</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
