import { Link } from "react-router-dom";
import { Users, Target, CalendarClock } from "lucide-react";
import type { CampaignDetails } from "@/config/contracts";
import { CAMPAIGN_STATE } from "@/config/contracts";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { daysLeft, formatDate, formatEth, progressPercent } from "@/lib/format";

export function StateBadge({ details }: { details: CampaignDetails }) {
  switch (details.state) {
    case CAMPAIGN_STATE.ACTIVE:
      return <Badge tone="green">Active</Badge>;
    case CAMPAIGN_STATE.SUCCESSFUL:
      return <Badge tone="violet">Funded</Badge>;
    case CAMPAIGN_STATE.FAILED:
      return <Badge tone="slate">Expired</Badge>;
    default:
      return <Badge tone="red">Cancelled</Badge>;
  }
}

export function CampaignCard({ details }: { details: CampaignDetails }) {
  const percent = progressPercent(details.totalFunds, details.goal);

  return (
    <Link to={`/campaign/${details.address}`}>
      <Card className="group h-full p-5 transition-all hover:border-violet-500/50 hover:shadow-violet-500/10">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
            {(details.ipfsHash.replace(/^Qm/, "")[0] ?? "?").toUpperCase()}
          </div>
          <StateBadge details={details} />
        </div>

        <p className="font-mono text-xs text-slate-500">{details.address.slice(0, 18)}…</p>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-xl font-bold text-white">{formatEth(details.totalFunds)}</span>
          <span className="text-xs text-slate-400">of {formatEth(details.goal)}</span>
        </div>

        <div className="mt-2">
          <ProgressBar percent={percent} />
          <p className="mt-1.5 text-right text-xs font-medium text-violet-400">{percent.toFixed(1)}%</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Users size={13} /> {details.contributorsCount.toString()}
          </span>
          <span className="flex items-center gap-1">
            <Target size={13} /> {formatEth(details.goal)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock size={13} />
            {details.state === CAMPAIGN_STATE.ACTIVE
              ? `${daysLeft(details.deadline)}d left`
              : formatDate(details.deadline)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
