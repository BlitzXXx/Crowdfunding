import { useState } from "react";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { FACTORY_ADDRESS, campaignAbi, factoryAbi } from "@/config/contracts";

type TxPhase = "idle" | "signing" | "pending" | "success";

export function useCreateCampaign() {
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const receipt = useWaitForTransactionReceipt({ hash });
  const [error, setError] = useState<string | null>(null);

  async function createCampaign(goalWei: bigint, durationSeconds: bigint, ipfsHash: string) {
    setError(null);
    try {
      const tx = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "createCampaign",
        args: [goalWei, durationSeconds, ipfsHash],
      });
      setHash(tx);
      return tx;
    } catch (e) {
      setError(extractError(e));
      return undefined;
    }
  }

  return { createCampaign, hash, receipt, error, phase: phaseOf(hash, receipt) };
}

export function useCampaignAction(
  action: "contribute" | "refund" | "cancel" | "withdraw",
  campaignAddress: `0x${string}`
) {
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const receipt = useWaitForTransactionReceipt({ hash });
  const [error, setError] = useState<string | null>(null);

  async function run(args?: { value?: bigint }) {
    setError(null);
    try {
      const tx = await writeContractAsync({
        address: campaignAddress,
        abi: campaignAbi,
        functionName: action,
        ...(args?.value ? { value: args.value } : {}),
      } as never);
      setHash(tx);
      return true;
    } catch (e) {
      setError(extractError(e));
      return false;
    }
  }

  function reset() {
    setHash(undefined);
    setError(null);
  }

  return { run, reset, hash, receipt, error, phase: phaseOf(hash, receipt) };
}

function phaseOf(hash: `0x${string}` | undefined, receipt: { isSuccess: boolean; isLoading: boolean }): TxPhase {
  if (receipt.isSuccess) return "success";
  if (hash && receipt.isLoading) return "pending";
  if (hash) return "pending";
  return "idle";
}

const REVERT_PATTERNS: Array<[RegExp, string]> = [
  [/GoalAlreadyReached|Goal already reached/i, "The funding goal was already reached."],
  [/GoalNotReached|Goal not reached/i, "The funding goal has not been reached yet."],
  [/CampaignEnded|Campaign has ended/i, "This campaign has ended."],
  [/CampaignCancelledError|cancelled/i, "This campaign was cancelled."],
  [/AlreadyWithdrawn|already withdrawn/i, "Funds were already withdrawn."],
  [/NothingToRefund|No contribution/i, "You have no contribution to refund."],
  [/RefundsLocked/i, "Refunds are not available for this campaign."],
  [/NotCreator/i, "Only the campaign creator can perform this action."],
  [/ZeroValue/i, "Contribution must be greater than zero."],
  [/User rejected|user rejected/i, "Transaction rejected in wallet."],
];

export function extractError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  for (const [pattern, friendly] of REVERT_PATTERNS) {
    if (pattern.test(message)) return friendly;
  }
  return message.slice(0, 200) || "Something went wrong.";
}

export function usePredictedNextAddress() {
  const client = usePublicClient();
  return async () =>
    (await client!.readContract({
      address: FACTORY_ADDRESS,
      abi: factoryAbi,
      functionName: "predictNextCampaignAddress",
    })) as `0x${string}`;
}
