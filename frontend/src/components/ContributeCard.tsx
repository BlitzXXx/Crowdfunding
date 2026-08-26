import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { HandCoins, Undo2, XCircle, BadgeDollarSign } from "lucide-react";
import type { CampaignDetails } from "@/config/contracts";
import { CAMPAIGN_STATE } from "@/config/contracts";
import { Alert, Button, Card, Input, Label } from "@/components/ui";
import { useToast } from "@/components/toast";
import { formatEth } from "@/lib/format";
import { useCampaignAction } from "@/hooks/useActions";
import { useMyContribution } from "@/hooks/useCampaigns";
import {
  useOptimisticCampaign,
  useReceiptCleanup,
} from "@/hooks/useOptimisticCampaign";

function ActionStatus({
  phase,
  error,
  success,
}: {
  phase: string;
  error: string | null;
  success: string;
}) {
  if (phase === "pending") {
    return <Alert tone="info">Transaction submitted — waiting for confirmation…</Alert>;
  }
  if (phase === "success") return <Alert tone="success">{success}</Alert>;
  if (error) return <Alert>{error}</Alert>;
  return null;
}

function useTxToasts(
  action: ReturnType<typeof useCampaignAction>,
  successMessage: string
) {
  const toast = useToast();
  const notified = useRef<string | null>(null);

  useEffect(() => {
    const key = `${action.hash ?? ""}:${action.phase}`;
    if (notified.current === key) return;

    if (action.phase === "success" && action.hash) {
      toast.success(successMessage);
      notified.current = key;
    } else if (action.error) {
      toast.error(action.error);
      notified.current = key;
    }
  }, [action.phase, action.hash, action.error, toast, successMessage]);
}

export function ContributeCard({ details }: { details: CampaignDetails }) {
  const { address: account } = useAccount();
  const [amount, setAmount] = useState("");
  const { delta, apply } = useOptimisticCampaign();

  const contribute = useCampaignAction("contribute", details.address);
  const refund = useCampaignAction("refund", details.address);
  const withdraw = useCampaignAction("withdraw", details.address);
  const cancel = useCampaignAction("cancel", details.address);

  // Clear optimistic state + refetch once any action's receipt confirms.
  useReceiptCleanup([contribute, refund, withdraw, cancel], apply);

  useTxToasts(contribute, "Contribution confirmed on-chain!");
  useTxToasts(refund, "Refund claimed!");
  useTxToasts(withdraw, "Funds withdrawn!");
  useTxToasts(cancel, "Campaign cancelled.");

  const myContribution = useMyContribution(details.address, account);
  const mine = (myContribution.data ?? 0n) as bigint;
  const displayMine = mine + (delta.addedFunds ?? 0n) > (delta.myRefund ?? 0n)
    ? mine + (delta.addedFunds ?? 0n) - (delta.myRefund ?? 0n)
    : 0n;

  const state = details.state;
  const isCreator = !!account && account.toLowerCase() === details.creator.toLowerCase();
  const canContribute =
    state === CAMPAIGN_STATE.ACTIVE && !details.goalReached;

  if (!account) {
    return (
      <Card className="p-5">
        <p className="text-center text-sm text-slate-400">Connect your wallet to interact with this campaign.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate-400">Your contribution</span>
        <span className="font-semibold text-white">{formatEth(displayMine)}</span>
      </div>

      {canContribute && (
        <>
          <div>
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={!amount || Number(amount) <= 0 || contribute.phase === "pending"}
            onClick={async () => {
              const value = parseEther(amount);
              const ok = await contribute.run({ value });
              if (ok) {
                // Optimistic: reflect the contribution before the block lands.
                apply({ addedFunds: value, newContributor: mine === 0n });
                setAmount("");
              }
            }}
          >
            <HandCoins size={16} />
            Back this project
          </Button>
          <ActionStatus phase={contribute.phase} error={contribute.error} success="Contribution confirmed!" />
        </>
      )}

      {state !== CAMPAIGN_STATE.ACTIVE &&
        myContribution.data !== undefined &&
        displayMine > 0n &&
        state !== CAMPAIGN_STATE.SUCCESSFUL && (
          <>
            <Button
              variant="secondary"
              className="w-full"
              disabled={refund.phase === "pending"}
              onClick={async () => {
                const refunded = displayMine;
                const ok = await refund.run();
                if (ok) apply({ myRefund: refunded });
              }}
            >
              <Undo2 size={16} />
              Claim refund of {formatEth(displayMine)}
            </Button>
            <ActionStatus phase={refund.phase} error={refund.error} success="Refund claimed!" />
          </>
        )}

      {isCreator && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Creator actions</p>

          {state === CAMPAIGN_STATE.SUCCESSFUL && !details.fundsWithdrawn && (
            <>
              <Button
                className="w-full"
                disabled={withdraw.phase === "pending"}
                onClick={async () => {
                  const ok = await withdraw.run();
                  if (ok) apply({ withdrawn: true });
                }}
              >
                <BadgeDollarSign size={16} />
                Withdraw {formatEth(details.totalFunds)}
              </Button>
              <ActionStatus phase={withdraw.phase} error={withdraw.error} success="Funds withdrawn!" />
            </>
          )}
          {details.fundsWithdrawn && <Alert tone="success">Funds have been withdrawn.</Alert>}

          {state === CAMPAIGN_STATE.ACTIVE && (
            <>
              <Button
                variant="danger"
                className="w-full"
                loading={cancel.phase === "pending"}
                onClick={async () => {
                  const ok = await cancel.run();
                  if (ok) apply({ cancelled: true });
                }}
              >
                <XCircle size={16} />
                Cancel campaign
              </Button>
              <ActionStatus phase={cancel.phase} error={cancel.error} success="Campaign cancelled." />
            </>
          )}
        </div>
      )}
    </Card>
  );
}
