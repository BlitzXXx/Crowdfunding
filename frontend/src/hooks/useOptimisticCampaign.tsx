import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CAMPAIGN_STATE, type CampaignDetails } from "@/config/contracts";

/**
 * Optimistic UI layer for campaign actions.
 *
 * While a transaction is pending, components render *expected* post-tx values
 * instead of waiting for the next block. Deltas are applied on submission,
 * rolled back instantly on error (the caller never applies on failure), and
 * cleared on receipt success — at which point real chain data is refetched.
 */

export interface OptimisticDelta {
  /** Pending contribution amount (wei) not yet reflected on-chain. */
  addedFunds?: bigint;
  /** True when the pending contribution is the user's first for this campaign. */
  newContributor?: boolean;
  /** Pending refund amount (wei) subtracted from the user's contribution. */
  myRefund?: bigint;
  /** Pending creator withdrawal. */
  withdrawn?: boolean;
  /** Pending campaign cancellation. */
  cancelled?: boolean;
}

const EMPTY: OptimisticDelta = {};

interface OptimisticApi {
  delta: OptimisticDelta;
  apply: (delta: OptimisticDelta | null) => void;
}

const OptimisticCtx = createContext<OptimisticApi>({
  delta: EMPTY,
  apply: () => {},
});

export function OptimisticCampaignProvider({ children }: { children: ReactNode }) {
  const [delta, setDelta] = useState<OptimisticDelta>(EMPTY);
  const apply = useCallback((d: OptimisticDelta | null) => setDelta(d ?? EMPTY), []);
  const api = useMemo<OptimisticApi>(() => ({ delta, apply }), [delta, apply]);
  return <OptimisticCtx.Provider value={api}>{children}</OptimisticCtx.Provider>;
}

export function useOptimisticCampaign(): OptimisticApi {
  return useContext(OptimisticCtx);
}

function isEmpty(delta: OptimisticDelta): boolean {
  return (
    delta.addedFunds === undefined &&
    delta.myRefund === undefined &&
    delta.newContributor === undefined &&
    delta.withdrawn === undefined &&
    delta.cancelled === undefined
  );
}

/** Merge pending expectations into on-chain details for display. */
export function useDisplayDetails(details: CampaignDetails | undefined): CampaignDetails | undefined {
  const { delta } = useOptimisticCampaign();

  return useMemo(() => {
    if (!details || isEmpty(delta)) return details;
    const totalFunds = details.totalFunds + (delta.addedFunds ?? 0n);
    return {
      ...details,
      totalFunds,
      contributorsCount:
        details.contributorsCount + (delta.newContributor ? 1n : 0n),
      goalReached:
        details.goalReached ||
        (!!delta.addedFunds && details.goal > 0n && totalFunds >= details.goal),
      fundsWithdrawn: details.fundsWithdrawn || !!delta.withdrawn,
      state: delta.cancelled ? CAMPAIGN_STATE.CANCELLED : details.state,
    };
  }, [details, delta]);
}

/**
 * Wire an action's receipt to optimistic-state cleanup: once the tx succeeds,
 * clear the delta and invalidate caches so fresh chain data takes over.
 */
export function useReceiptCleanup(actions: Array<{ receipt: { isSuccess: boolean } }>, apply: (d: OptimisticDelta | null) => void) {
  const queryClient = useQueryClient();
  const successKey = actions.map((a) => a.receipt.isSuccess).join(",");

  useEffect(() => {
    if (!actions.some((a) => a.receipt.isSuccess)) return;
    apply(null);
    // Broad invalidation is intentional and rare: refetch wagmi reads,
    // campaign lists and subgraph queries in one go after confirmation.
    void queryClient.invalidateQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successKey]);
}
