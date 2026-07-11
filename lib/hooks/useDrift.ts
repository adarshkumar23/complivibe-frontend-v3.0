"use client";

import { useQuery } from "@tanstack/react-query";
import { getMlflowDrift, getMlflowConnection } from "@/lib/api/ai-systems";
import { ApiError } from "@/lib/api/client";

export function useDrift() {
  // 404 means "MLflow not connected" — an expected configuration state, not an error.
  const connection = useQuery({
    queryKey: ["mlflow-connection"],
    queryFn: async () => {
      try {
        return await getMlflowConnection();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    }
  });
  const drift = useQuery({ queryKey: ["mlflow-drift"], queryFn: getMlflowDrift });

  return { connection, drift };
}

export type DriftData = ReturnType<typeof useDrift>;
