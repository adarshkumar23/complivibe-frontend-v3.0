"use client";

import { useQuery } from "@tanstack/react-query";
import { getControls, getControlGapsSummary, getControlTestsSummary } from "@/lib/api/controls";

export function useControls() {
  const controls = useQuery({ queryKey: ["controls"], queryFn: () => getControls() });
  const gaps = useQuery({ queryKey: ["control-gaps"], queryFn: getControlGapsSummary });
  const tests = useQuery({ queryKey: ["control-tests-summary"], queryFn: getControlTestsSummary });

  return { controls, gaps, tests };
}

export type ControlsData = ReturnType<typeof useControls>;
