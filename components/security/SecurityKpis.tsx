"use client";

import { ShieldCheck, Users, KeyRound, ScrollText } from "lucide-react";
import { RegistryKpi } from "@/components/ui/RegistryKpi";
import { securityScore, normalizeTeam, normalizeApiKeys, auditCount } from "@/lib/api/security-normalizers";
import type { SecurityData } from "@/lib/hooks/useSecurity";

export function SecurityKpis({ data }: { data: SecurityData }) {
  const { summary, securitySettings, team, apiKeys, auditLogs } = data;

  const posture = securityScore(summary.data, securitySettings.data);

  const members = team.isSuccess ? normalizeTeam(team.data) : null;
  const anyMemberStatus = members ? members.some((m) => m.status) : false;
  const activeUsers = members ? (anyMemberStatus ? members.filter((m) => m.status && /active|enabled/i.test(m.status)).length : members.length) : null;

  const keys = apiKeys.isSuccess ? normalizeApiKeys(apiKeys.data) : null;
  const anyKeyStatus = keys ? keys.some((k) => k.status) : false;
  const activeKeys = keys ? (anyKeyStatus ? keys.filter((k) => k.status && /active|enabled/i.test(k.status)).length : keys.length) : null;

  const audit = auditLogs.isSuccess ? auditCount(auditLogs.data) : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RegistryKpi label="Security Posture" icon={ShieldCheck} accent="purple" value={posture} suffix={posture != null ? "/100" : ""} scoreToneFor={posture} caption={posture != null ? "backend score" : undefined} loading={summary.isLoading} unavailableHint="No score returned" />
      <RegistryKpi label="Active Members" icon={Users} accent="blue" value={activeUsers} caption={activeUsers != null ? (anyMemberStatus ? "active" : "in workspace") : undefined} loading={team.isLoading} unavailableHint="Team unavailable" />
      <RegistryKpi label="Active API Keys" icon={KeyRound} accent="cyan" value={activeKeys} caption={activeKeys != null ? (anyKeyStatus ? "active" : "configured") : undefined} loading={apiKeys.isLoading} unavailableHint="Keys unavailable" />
      <RegistryKpi label="Recent Audit Events" icon={ScrollText} accent="amber" value={audit} caption={audit != null ? "logged" : undefined} loading={auditLogs.isLoading} unavailableHint="Audit log unavailable" />
    </div>
  );
}
