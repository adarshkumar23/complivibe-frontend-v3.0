"use client";

import { Users, FileCheck2, AlarmClock, ClipboardCheck } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import {
  normalizeRoster, normalizeAcknowledgements, normalizeComplianceTasks, collectOverdue, isComplete
} from "@/lib/api/employee-compliance-normalizers";
import type { EmployeeComplianceData } from "@/lib/hooks/useEmployeeCompliance";

export function EmployeeComplianceKpis({ data }: { data: EmployeeComplianceData }) {
  const { team, acknowledgements, training, attestations } = data;

  const roster = team.isSuccess ? normalizeRoster(team.data) : null;
  const covered = roster ? roster.length : null;

  const acks = acknowledgements.isSuccess ? normalizeAcknowledgements(acknowledgements.data) : null;
  const completedAcks = acks ? acks.filter((a) => isComplete(a.status) || a.acknowledgedDate != null).length : null;

  const trainingList = training.isSuccess ? normalizeComplianceTasks(training.data, "training") : [];
  const attestationList = attestations.isSuccess ? normalizeComplianceTasks(attestations.data, "attestation") : [];

  const anyActionSource = acknowledgements.isSuccess || training.isSuccess || attestations.isSuccess;
  const overdue = anyActionSource ? collectOverdue(acks ?? [], trainingList, attestationList).length : null;

  const pendingAttestations = attestations.isSuccess ? attestationList.filter((a) => !isComplete(a.status)).length : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Covered Employees" icon={Users} accent="blue" value={covered} caption={covered != null ? "in roster" : undefined} loading={team.isLoading} unavailableHint="Roster unavailable" />
      <RegistryKpi label="Completed Acknowledgements" icon={FileCheck2} accent="green" value={completedAcks} caption={completedAcks != null ? "acknowledged" : undefined} loading={acknowledgements.isLoading} unavailableHint="Acks unavailable" />
      <RegistryKpi label="Overdue Actions" icon={AlarmClock} accent="red" value={overdue} caption={overdue != null ? "past due" : undefined} loading={training.isLoading} unavailableHint="No action data" />
      <RegistryKpi label="Pending Attestations" icon={ClipboardCheck} accent="amber" value={pendingAttestations} caption={pendingAttestations != null ? "open" : undefined} loading={attestations.isLoading} unavailableHint="Attestations unavailable" />
    </div>
  );
}
