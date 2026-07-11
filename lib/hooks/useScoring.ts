"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLatestScoreSnapshots,
  getScoreMethodology,
  getScoreTrends,
  materializeScoreSnapshots
} from "@/lib/api/scoring";

export function useScoring() {
  const latest = useQuery({ queryKey: ["scoring-latest"], queryFn: getLatestScoreSnapshots });
  const trends = useQuery({ queryKey: ["scoring-trends"], queryFn: () => getScoreTrends(30) });
  const methodology = useQuery({ queryKey: ["scoring-methodology"], queryFn: getScoreMethodology });
  return { latest, trends, methodology };
}

export type ScoringData = ReturnType<typeof useScoring>;

/** Recompute all score snapshots (POST /scoring/snapshots/materialize). */
export function useMaterializeScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: materializeScoreSnapshots,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-latest"] });
      queryClient.invalidateQueries({ queryKey: ["scoring-trends"] });
      // The command-center KPI reads /dashboard/summary → refresh it too.
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });
}
