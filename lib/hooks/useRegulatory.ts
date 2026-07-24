"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getFrameworkCatalog,
  getActiveFrameworks,
  getFrameworkObligations,
  getApplicabilitySummary,
  updateObligationState
} from "@/lib/api/frameworks";
import { getDeadlines, getDeadlineSummary } from "@/lib/api/compliance";

export const OBLIGATION_APPLICABILITY_STATUSES = ["pending", "applicable", "not_applicable", "needs_review"] as const;
export const OBLIGATION_IMPLEMENTATION_STATUSES = ["not_started", "in_progress", "implemented", "blocked"] as const;

/** PATCH /api/v1/obligations/{id}/state — set the org's applicability/implementation
 * decision for an obligation. Gated at the call site on frameworks:activate. */
export function useUpdateObligationState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ obligationId, body }: { obligationId: string; body: { applicability_status?: string; implementation_status?: string; owner_user_id?: string; justification?: string } }) =>
      updateObligationState(obligationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reg-obligations"] });
      qc.invalidateQueries({ queryKey: ["reg-applicability"] });
    }
  });
}

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
