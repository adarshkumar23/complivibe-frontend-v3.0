"use client";

import { Users, ShieldCheck, KeyRound, Rocket } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { normalizeTeam, normalizeApiKeys, roleDistribution, enterpriseReadinessScore } from "@/lib/api/enterprise-normalizers";
import type { EnterpriseData } from "@/lib/hooks/useEnterpriseControl";

export function EnterpriseKpis({ data }: { data: EnterpriseData }) {
  const { team, apiKeys, summary, readiness } = data;

  const members = team.isSuccess ? normalizeTeam(team.data) : null;
  const memberCount = members ? members.length : null;
  const roles = members ? roleDistribution(members).length : null;

  const keys = apiKeys.isSuccess ? normalizeApiKeys(apiKeys.data) : null;
  const anyKeyStatus = keys ? keys.some((k) => k.status) : false;
  const activeKeys = keys ? (anyKeyStatus ? keys.filter((k) => k.status && /active|enabled/i.test(k.status)).length : keys.length) : null;

  const readinessScore = enterpriseReadinessScore(summary.data, readiness.data);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Workspace Members" icon={Users} accent="blue" value={memberCount} caption={memberCount != null ? "in workspace" : undefined} loading={team.isLoading} unavailableHint="Team unavailable" />
      <RegistryKpi label="Active Roles" icon={ShieldCheck} accent="purple" value={roles} caption={roles != null ? "distinct roles" : undefined} loading={team.isLoading} unavailableHint="Roles unavailable" />
      <RegistryKpi label="API Keys" icon={KeyRound} accent="cyan" value={activeKeys} caption={activeKeys != null ? (anyKeyStatus ? "active" : "configured") : undefined} loading={apiKeys.isLoading} unavailableHint="Keys unavailable" />
      <RegistryKpi label="Production Readiness" icon={Rocket} accent="green" value={readinessScore} suffix={readinessScore != null ? "/100" : ""} scoreToneFor={readinessScore} caption={readinessScore != null ? "backend score" : undefined} loading={readiness.isLoading} unavailableHint="No score returned" />
    </div>
  );
}
