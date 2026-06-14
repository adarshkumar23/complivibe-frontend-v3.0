"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSimulations, getImpactAnalysis,
  getAiSystems, getRisks, getIncidents, getRegulatoryDeadlines, getEvidenceList, getAuditPacks, getQuestionnaires
} from "@/lib/api/simulation";

function useEndpoint<T = unknown>(key: string, fn: () => Promise<T>) {
  return useQuery({ queryKey: [key], queryFn: fn, retry: false });
}

export function useSimulation() {
  const simulations = useEndpoint("sim-simulations", getSimulations);
  const impact = useEndpoint("sim-impact", getImpactAnalysis);

  const aiSystems = useEndpoint("sim-ai-systems", getAiSystems);
  const risks = useEndpoint("sim-risks", getRisks);
  const incidents = useEndpoint("sim-incidents", getIncidents);
  const deadlines = useEndpoint("sim-deadlines", getRegulatoryDeadlines);
  const evidence = useEndpoint("sim-evidence", getEvidenceList);
  const auditPacks = useEndpoint("sim-audit-packs", getAuditPacks);
  const questionnaires = useEndpoint("sim-questionnaires", getQuestionnaires);

  return { simulations, impact, aiSystems, risks, incidents, deadlines, evidence, auditPacks, questionnaires };
}

export type SimulationData = ReturnType<typeof useSimulation>;
