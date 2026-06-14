"use client";

import { Layers, Activity, AlertTriangle, Boxes } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import {
  normalizeSimulations, simulatedImpactCount, affectedSystemCount, normalizeRisks
} from "@/lib/api/simulation-normalizers";
import type { SimulationData } from "@/lib/hooks/useSimulation";

export function SimulationKpis({ data }: { data: SimulationData }) {
  const { simulations, risks } = data;

  const sims = simulations.isSuccess ? normalizeSimulations(simulations.data) : null;
  const available = sims ? sims.length : null;
  const impacts = sims ? simulatedImpactCount(sims) : null;
  const affected = sims ? affectedSystemCount(sims) : null;

  // High-risk inputs derived from real risk records (high/critical severity).
  const riskList = risks.isSuccess ? normalizeRisks(risks.data) : null;
  const highRisk = riskList ? riskList.filter((r) => r.severity === "high" || r.severity === "critical").length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Available Scenarios" icon={Layers} accent="blue" value={available} caption={available != null ? "from backend" : undefined} loading={simulations.isLoading} unavailableHint="Simulation unavailable" />
      <RegistryKpi label="Simulated Impacts" icon={Activity} accent="purple" value={impacts} caption={impacts != null ? "with impact score" : undefined} loading={simulations.isLoading} unavailableHint="No results" />
      <RegistryKpi label="High-Risk Inputs" icon={AlertTriangle} accent="amber" value={highRisk} caption={highRisk != null ? "from risk records" : undefined} loading={risks.isLoading} unavailableHint="Risks unavailable" />
      <RegistryKpi label="Affected Systems" icon={Boxes} accent="teal" value={affected} caption={affected != null ? "in results" : undefined} loading={simulations.isLoading} unavailableHint="No results" />
    </div>
  );
}
