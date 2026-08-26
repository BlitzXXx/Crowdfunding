import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Sparkles, Search } from "lucide-react";
import { Alert, Button, Input, CampaignCardSkeleton } from "@/components/ui";
import { CampaignCard } from "@/components/CampaignCard";
import { useCampaignCount, useCampaignAddresses, useCampaignList } from "@/hooks/useCampaigns";
import { CAMPAIGN_STATE, type CampaignDetails } from "@/config/contracts";
import { FACTORY_ADDRESS } from "@/config/contracts";

type StateFilter = "all" | "active" | "funded" | "expired" | "cancelled";
type SortKey = "newest" | "raised" | "progress" | "ending";

const STATE_FILTERS: { key: StateFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "funded", label: "Funded" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Cancelled" },
];

function matchesState(details: CampaignDetails, filter: StateFilter): boolean {
  switch (filter) {
    case "active":
      return details.state === CAMPAIGN_STATE.ACTIVE;
    case "funded":
      return details.state === CAMPAIGN_STATE.SUCCESSFUL;
    case "expired":
      return details.state === CAMPAIGN_STATE.FAILED;
    case "cancelled":
      return details.state === CAMPAIGN_STATE.CANCELLED;
    default:
      return true;
  }
}

function sortCampaigns(list: CampaignDetails[], sort: SortKey): CampaignDetails[] {
  const sorted = [...list];
  switch (sort) {
    case "raised":
      return sorted.sort((a, b) => (b.totalFunds > a.totalFunds ? 1 : -1));
    case "progress":
      return sorted.sort(
        (a, b) =>
          Number(b.goal > 0n ? (b.totalFunds * 10_000n) / b.goal : 0n) -
          Number(a.goal > 0n ? (a.totalFunds * 10_000n) / a.goal : 0n)
      );
    case "ending":
      return sorted.sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
    default:
      return sorted; // list arrives newest-first from the hook
  }
}

export default function HomePage() {
  const { data: rawCount } = useCampaignCount();
  const count = rawCount as bigint | undefined;
  const addresses = useCampaignAddresses(count);
  const list = useCampaignList(addresses.data);

  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const visible = useMemo(() => {
    if (!list.data) return [];
    const q = query.trim().toLowerCase();
    const filtered = list.data.filter((details) => {
      if (!matchesState(details, stateFilter)) return false;
      if (!q) return true;
      return (
        details.address.toLowerCase().includes(q) ||
        details.creator.toLowerCase().includes(q)
      );
    });
    return sortCampaigns(filtered, sort);
  }, [list.data, query, stateFilter, sort]);

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

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">
          Browse campaigns{" "}
          <span className="ml-1 text-sm font-normal text-slate-500">
            {list.data
              ? `(${visible.length}${visible.length !== list.data.length ? ` of ${list.data.length}` : ""})`
              : ""}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address or creator…"
              aria-label="Search campaigns"
              className="w-56 pl-8"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort campaigns"
            className="h-9 cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-sm text-slate-300 outline-none transition-colors focus:border-violet-500"
          >
            <option value="newest">Newest first</option>
            <option value="raised">Most raised</option>
            <option value="progress">Highest progress</option>
            <option value="ending">Ending soon</option>
          </select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by state">
        {STATE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={stateFilter === key}
            onClick={() => setStateFilter(key)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              stateFilter === key
                ? "border-violet-500/60 bg-violet-600/20 text-violet-200"
                : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {addresses.isLoading || (list.isLoading && !!addresses.data?.length) ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((details) => (
            <CampaignCard key={details.address} details={details} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 p-16 text-center text-slate-500">
          <Rocket className="mx-auto mb-3 text-slate-600" size={32} />
          {list.data && list.data.length > 0 ? (
            <p>No campaigns match your filters. Try clearing the search or picking another state.</p>
          ) : (
            <>
              <p>No campaigns yet. Be the first to launch one!</p>
              <Link to="/create" className="mt-4 inline-block">
                <Button variant="secondary">Create campaign</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
