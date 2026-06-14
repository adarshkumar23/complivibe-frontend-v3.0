import { getStringFromPaths, getDateFromPaths, getArrayFromPaths } from "@/lib/api/normalizers";
import { scoreFrom } from "@/lib/api/score-explainer-normalizers";

// Reuse the audited, safe Settings normalizers (masked keys only — never raw values).
export {
  normalizeOrganization,
  normalizeTeam,
  normalizeApiKeys,
  normalizeSecurity,
  normalizeIntegrations,
  normalizeDataPreferences,
  boolFrom
} from "@/lib/api/settings-normalizers";
export type {
  Organization,
  TeamMember,
  ApiKeyMeta,
  SecuritySettings,
  Integration,
  DataPreferences
} from "@/lib/api/settings-normalizers";

// Reuse the audited Security health/tone helpers.
export { normalizeHealth, healthTone } from "@/lib/api/security-normalizers";
export type { SecurityHealth } from "@/lib/api/security-normalizers";

import { normalizeSecurity, normalizeDataPreferences } from "@/lib/api/settings-normalizers";
import { normalizeHealth } from "@/lib/api/security-normalizers";
import type { Integration, SecuritySettings } from "@/lib/api/settings-normalizers";

/** Production/enterprise readiness score — backend only, never invented. */
export function enterpriseReadinessScore(...sources: unknown[]): number | null {
  return scoreFrom(sources, ["readiness_score", "production_readiness_score", "readiness", "score", "overall_score"]);
}

/* ----------------------------- Workspace / organization profile ----------------------------- */
export type Workspace = {
  name: string | null;
  slug: string | null;
  plan: string | null;
  status: string | null;
  region: string | null;
  industry: string | null;
  website: string | null;
  createdAt: string | null;
  hasAny: boolean;
};

export function normalizeWorkspace(...sources: unknown[]): Workspace {
  const str = (paths: string[]) => {
    for (const s of sources) {
      const v = getStringFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const date = (paths: string[]) => {
    for (const s of sources) {
      const v = getDateFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const name = str(["company_name", "name", "organization_name", "company", "org_name", "workspace_name", "workspace.name"]);
  const slug = str(["slug", "workspace_slug", "workspace_id", "org_id", "organization_id", "tenant_id", "id"]);
  const plan = str(["plan", "plan_name", "subscription_plan", "tier", "subscription.tier"]);
  const status = str(["status", "state", "account_status", "subscription_status"]);
  const region = str(["region", "data_region", "country", "location", "compliance_region", "jurisdiction"]);
  const industry = str(["industry", "sector", "vertical"]);
  const website = str(["website", "url", "domain", "homepage"]);
  const createdAt = date(["created_at", "createdAt", "founded_at", "onboarded_at"]);
  const hasAny = [name, slug, plan, status, region, industry, website, createdAt].some((v) => v != null);
  return { name, slug, plan, status, region, industry, website, createdAt, hasAny };
}

/* ----------------------------- Role distribution (from real records) ----------------------------- */
export type RoleCount = { role: string; count: number };

export function roleDistribution(members: { role: string | null }[]): RoleCount[] {
  const map = new Map<string, number>();
  for (const m of members) {
    if (!m.role) continue;
    map.set(m.role, (map.get(m.role) ?? 0) + 1);
  }
  return [...map.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count);
}

/* ----------------------------- Production readiness detail ----------------------------- */
export type ReadinessDetail = {
  health: string | null;
  readiness: string | null;
  backup: string | null;
  monitoring: string | null;
  scan: string | null;
  lastGate: string | null;
  warnings: string[];
  hasAny: boolean;
};

export function normalizeReadiness(...sources: unknown[]): ReadinessDetail {
  const base = normalizeHealth(...sources);
  let lastGate: string | null = null;
  for (const s of sources) {
    const v = getStringFromPaths(s, ["last_gate", "gate_result", "last_check", "production_gate", "gate_status", "last_run"]);
    if (v) { lastGate = v; break; }
  }
  const warnings: string[] = [];
  for (const s of sources) {
    const raw = getArrayFromPaths(s, ["warnings", "issues", "blockers", "failures", "checks_failed", "failed_checks"]);
    for (const w of raw) {
      const t = typeof w === "string" ? w : getStringFromPaths(w, ["message", "title", "name", "description", "check"]);
      if (t) warnings.push(t);
    }
  }
  return {
    health: base.health,
    readiness: base.readiness,
    backup: base.backup,
    monitoring: base.monitoring,
    scan: base.scan,
    lastGate,
    warnings,
    hasAny: base.hasAny || lastGate != null || warnings.length > 0
  };
}

/* ----------------------------- Enterprise controls (real settings only) ----------------------------- */
export type ControlRow = { id: string; label: string; value: string | null };

export function enterpriseControls(
  securitySource: unknown,
  settingsSource: unknown,
  integrations: Integration[] | null
): ControlRow[] {
  const sec: SecuritySettings = normalizeSecurity(securitySource);
  const prefs = normalizeDataPreferences(settingsSource, securitySource);
  const fmt = (b: boolean | null) => (b == null ? null : b ? "Enabled" : "Disabled");
  return [
    { id: "mfa", label: "Multi-factor authentication", value: fmt(sec.mfaEnabled) },
    { id: "sso", label: "Single sign-on", value: sec.ssoStatus },
    { id: "audit", label: "Audit logging", value: fmt(sec.auditLogging) },
    { id: "session", label: "Session timeout", value: sec.sessionTimeout },
    { id: "ip", label: "IP allowlist", value: sec.ipAllowlist },
    { id: "retention", label: "Data retention", value: prefs.dataRetention },
    { id: "framework", label: "Default framework", value: prefs.defaultFramework },
    { id: "review", label: "Human review required", value: fmt(prefs.humanReviewRequired) },
    { id: "integrations", label: "Connected integrations", value: integrations == null ? null : String(integrations.length) }
  ];
}
