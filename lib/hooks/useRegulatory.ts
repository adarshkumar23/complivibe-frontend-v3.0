"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getFrameworkCatalog,
  getActiveFrameworks,
  getFrameworkObligations,
  getApplicabilitySummary
} from "@/lib/api/frameworks";
import { getDeadlines, getDeadlineSummary } from "@/lib/api/compliance";

export function useRegulatory() {
  const catalog = useQuery({ queryKey: ["reg-catalog"], queryFn: getFrameworkCatalog });
  const active = useQuery({ queryKey: ["reg-active"], queryFn: getActiveFrameworks });
  const deadlines = useQuery({
    queryKey: ["reg-deadlines"],
    queryFn: () => getDeadlines("?deadline_type=regulatory_filing")
  });
  const deadlineSummary = useQuery({ queryKey: ["cmp-deadline-summary"], queryFn: getDeadlineSummary });

  // Obligations are browsed per framework; default to the first active one.
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const firstActive = active.data?.[0]?.framework_id ?? null;
  const frameworkId = selectedFrameworkId ?? firstActive;

  const obligations = useQuery({
    queryKey: ["reg-obligations", frameworkId],
    queryFn: () => getFrameworkObligations(frameworkId as string),
    enabled: frameworkId != null
  });
  const applicability = useQuery({
    queryKey: ["reg-applicability", frameworkId],
    queryFn: () => getApplicabilitySummary(frameworkId as string),
    enabled: frameworkId != null
  });

  return {
    catalog,
    active,
    deadlines,
    deadlineSummary,
    obligations,
    applicability,
    frameworkId,
    setSelectedFrameworkId
  };
}

export type RegulatoryData = ReturnType<typeof useRegulatory>;
