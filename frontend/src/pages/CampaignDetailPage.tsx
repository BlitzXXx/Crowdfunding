import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, User } from "lucide-react";
import { Spinner, Card, ProgressBar, Badge } from "@/components/ui";
import { ContributeCard } from "@/components/ContributeCard";
import { StateBadge } from "@/components/CampaignCard";
import { useCampaign } from "@/hooks/useCampaigns";
import { daysLeft, formatDate, formatEth, progressPercent, shortAddress } from "@/lib/format";
import { CAMPAIGN_STATE } from "@/config/contracts";

export default function CampaignDetailPage() {
  const { address } = useParams<{ address: `0x${string}` }>();
  const { details, isLoading } = useCampaign(address as `0x${string}` | undefined);

  if (isLoading) return <Spinner label="Loading campaign…" />;
  if (!details || details.creator === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-400">
        <p>Campaign not found.</p>
        <Link to="/" className="mt-4 inline-block text-violet-400 hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  const state = details.state;
  const percent = progressPercent(details.totalFunds, details.goal);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} /> All campaigns
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <StateBadge details={details} />
            {state === CAMPAIGN_STATE.ACTIVE && <Badge tone="amber">{daysLeft(details.deadline)} days left</Badge>}
          </div>

          <h1 className="mt-4 font-mono text-xl font-bold break-all text-white">
            {shortAddress(details.address)}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
            <User size={14} /> Creator:{" "}
            <a
              className="font-mono text-violet-400 hover:underline"
              href={`https://sepolia.etherscan.io/address/${details.creator}`}
              target="_blank"
              rel="noreferrer"
            >
              {shortAddress(details.creator)}
            </a>
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Goal</dt>
              <dd className="mt-1 font-semibold text-white">{formatEth(details.goal)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Raised</dt>
              <dd className="mt-1 font-semibold text-white">{formatEth(details.totalFunds)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Backers</dt>
              <dd className="mt-1 font-semibold text-white">{details.contributorsCount.toString()}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Deadline</dt>
              <dd className="mt-1 text-slate-300">{formatDate(details.deadline)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Refunded</dt>
              <dd className="mt-1 text-slate-300">
                {state === CAMPAIGN_STATE.CANCELLED ? "—" : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Metadata</dt>
              <dd className="mt-1">
                <a
                  className="inline-flex items-center gap-1 text-violet-400 hover:underline"
                  href={`https://gateway.pinata.cloud/ipfs/${details.ipfsHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  IPFS <ExternalLink size={12} />
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">{percent.toFixed(1)}% funded</span>
              <span className="font-medium text-violet-400">{formatEth(details.totalFunds)}</span>
            </div>
            <ProgressBar percent={percent} />
          </div>
        </Card>

        <ContributeCard details={details} />
      </div>
    </div>
  );
}
