import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useInvalidateOnSuccess(phase: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (phase === "success") {
      queryClient.invalidateQueries();
    }
  }, [phase, queryClient]);
}
