import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/** Parse a boolean-ish value (true/1/yes/on/enabled/active) from string/number/bool fields. Null when absent. */
export function boolFrom(entry: unknown, paths: string[]): boolean | null {
  const s = getStringFromPaths(entry, paths);
  if (s == null) return null;
  return /^(true|1|yes|on|enabled|active|required)$/i.test(s.trim());
}

export type Profile = {
  name: string | null;
  email: string | null;
  role: string | null;
  workspaceName: string | null;
  orgName: string | null;
  timezone: string | null;
  locale: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export function normalizeProfile(...sources: unknown[]): Profile {
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
  return {
    name: str(["name", "full_name", "user.name", "profile.name", "display_name", "user_name"]),
    email: str(["email", "user.email", "profile.email", "email_address"]),
    role: str(["role", "user.role", "role_name", "title", "access_level"]),
    workspaceName: str(["workspace_name", "workspace.name", "workspace"]),
    orgName: str(["organization_name", "organization.name", "org_name", "company", "company_name"]),
    timezone: str(["timezone", "tz", "time_zone", "settings.timezone"]),
    locale: str(["locale", "language", "lang", "settings.locale"]),
    createdAt: date(["created_at", "createdAt", "joined_at"]),
    updatedAt: date(["updated_at", "updatedAt", "modified_at"])
  };
}

export type Organization = {
  companyName: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  complianceRegion: string | null;
  defaultFramework: string | null;
  dataRetention: string | null;
};

export function normalizeOrganization(...sources: unknown[]): Organization {
  const str = (paths: string[]) => {
    for (const s of sources) {
      const v = getStringFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  return {
    companyName: str(["company_name", "name", "organization_name", "company", "org_name"]),
    website: str(["website", "url", "domain", "homepage"]),
    industry: str(["industry", "sector", "vertical"]),
    country: str(["country", "region", "location", "country_code"]),
    complianceRegion: str(["compliance_region", "regulatory_region", "jurisdiction"]),
    defaultFramework: str(["default_framework", "primary_framework", "framework"]),
    dataRetention: str(["data_retention", "retention_period", "retention", "data_retention_days"])
  };
}

export type TeamMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  lastActive: string | null;
  invitedAt: string | null;
};

export function normalizeTeam(value: unknown): TeamMember[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "team", "members", "users"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "user_id", "member_id"]) || `member-${index}`,
    name: getStringFromPaths(entry, ["name", "full_name", "display_name"]),
    email: getStringFromPaths(entry, ["email", "email_address"]),
    role: getStringFromPaths(entry, ["role", "role_name", "access_level", "title"]),
    status: getStringFromPaths(entry, ["status", "state", "membership_status"]),
    lastActive: getDateFromPaths(entry, ["last_active", "last_active_at", "last_seen", "last_login"]),
    invitedAt: getDateFromPaths(entry, ["invited_at", "created_at", "joined_at"])
  }));
}

export type SecuritySettings = {
  mfaEnabled: boolean | null;
  ssoStatus: string | null;
  sessionTimeout: string | null;
  passwordPolicy: string | null;
  auditLogging: boolean | null;
  ipAllowlist: string | null;
  hasAny: boolean;
};

export function normalizeSecurity(...sources: unknown[]): SecuritySettings {
  const str = (paths: string[]) => {
    for (const s of sources) {
      const v = getStringFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const bool = (paths: string[]) => {
    for (const s of sources) {
      const v = boolFrom(s, paths);
      if (v != null) return v;
    }
    return null;
  };
  const mfaEnabled = bool(["mfa_enabled", "mfa", "two_factor_enabled", "2fa_enabled"]);
  const ssoStatus = str(["sso_status", "sso", "sso_enabled", "single_sign_on"]);
  const sessionTimeout = str(["session_timeout", "session_timeout_minutes", "session_ttl"]);
  const passwordPolicy = str(["password_policy", "password_policy_name", "policy"]);
  const auditLogging = bool(["audit_logging", "audit_log_enabled", "logging_enabled"]);
  // IP allowlist may be a count or list — summarize, never dump raw IPs as a security control list
  let ipAllowlist: string | null = str(["ip_allowlist_status", "ip_allowlist_enabled"]);
  if (ipAllowlist == null) {
    const count = getNumberFromPaths(sources[0], ["ip_allowlist_count", "allowed_ips_count"]);
    if (count != null) ipAllowlist = `${count} entries`;
  }
  const hasAny = [mfaEnabled, ssoStatus, sessionTimeout, passwordPolicy, auditLogging, ipAllowlist].some((v) => v != null);
  return { mfaEnabled, ssoStatus, sessionTimeout, passwordPolicy, auditLogging, ipAllowlist, hasAny };
}

export type NotificationSettings = {
  email: boolean | null;
  compliance: boolean | null;
  risk: boolean | null;
  incident: boolean | null;
  report: boolean | null;
  weeklySummary: boolean | null;
  hasAny: boolean;
};

export function normalizeNotifications(value: unknown): NotificationSettings {
  const email = boolFrom(value, ["email_notifications", "email", "notifications.email"]);
  const compliance = boolFrom(value, ["compliance_alerts", "compliance", "alerts.compliance"]);
  const risk = boolFrom(value, ["risk_alerts", "risk", "alerts.risk"]);
  const incident = boolFrom(value, ["incident_alerts", "incident", "alerts.incident"]);
  const report = boolFrom(value, ["report_generation_alerts", "report_alerts", "report"]);
  const weeklySummary = boolFrom(value, ["weekly_summary", "weekly_digest", "summary_weekly"]);
  const hasAny = [email, compliance, risk, incident, report, weeklySummary].some((v) => v != null);
  return { email, compliance, risk, incident, report, weeklySummary, hasAny };
}

export type Integration = {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  connectedAt: string | null;
  lastSync: string | null;
  error: string | null;
};

export function normalizeIntegrations(value: unknown): Integration[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "integrations", "connections"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "integration_id"]) || `integration-${index}`,
    name: getStringFromPaths(entry, ["name", "provider", "title", "service"]) || "Integration",
    type: getStringFromPaths(entry, ["type", "category", "kind"]),
    status: getStringFromPaths(entry, ["status", "state", "connection_status"]),
    connectedAt: getDateFromPaths(entry, ["connected_at", "created_at", "linked_at"]),
    lastSync: getDateFromPaths(entry, ["last_sync", "last_synced_at", "synced_at"]),
    error: getStringFromPaths(entry, ["error", "error_message", "last_error"])
  }));
}

export type ApiKeyMeta = {
  id: string;
  name: string;
  masked: string;
  createdAt: string | null;
  lastUsed: string | null;
  status: string | null;
};

/** Build a MASKED key display only. Never returns or renders the full token, even if the API includes it. */
function maskKey(entry: unknown): string {
  const direct = getStringFromPaths(entry, ["masked_key", "masked", "display_key"]);
  if (direct) return direct;
  const prefix = getStringFromPaths(entry, ["prefix", "key_prefix"]);
  const last4 = getStringFromPaths(entry, ["last4", "last_four", "suffix"]);
  if (prefix || last4) return `${prefix ?? ""}••••${last4 ?? ""}`;
  const full = getStringFromPaths(entry, ["key", "api_key", "token", "secret", "value"]);
  if (full && full.length >= 8) return `${full.slice(0, 3)}••••${full.slice(-4)}`;
  return "••••••••";
}

export function normalizeApiKeys(value: unknown): ApiKeyMeta[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "api_keys", "keys"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "key_id"]) || `key-${index}`,
    name: getStringFromPaths(entry, ["name", "label", "description"]) || "API key",
    masked: maskKey(entry),
    createdAt: getDateFromPaths(entry, ["created_at", "createdAt"]),
    lastUsed: getDateFromPaths(entry, ["last_used", "last_used_at", "last_seen"]),
    status: getStringFromPaths(entry, ["status", "state", "active"])
  }));
}

export type DataPreferences = {
  defaultFramework: string | null;
  dataRetention: string | null;
  evidenceFreshness: string | null;
  reportFormat: string | null;
  auditReviewMode: string | null;
  humanReviewRequired: boolean | null;
  hasAny: boolean;
};

export function normalizeDataPreferences(...sources: unknown[]): DataPreferences {
  const str = (paths: string[]) => {
    for (const s of sources) {
      const v = getStringFromPaths(s, paths);
      if (v) return v;
    }
    return null;
  };
  const defaultFramework = str(["default_framework", "primary_framework", "framework"]);
  const dataRetention = str(["data_retention", "retention_period", "retention", "data_retention_days"]);
  const evidenceFreshness = str(["evidence_freshness_threshold", "evidence_freshness", "freshness_threshold"]);
  const reportFormat = str(["report_export_format", "export_format", "default_export_format"]);
  const auditReviewMode = str(["audit_review_mode", "review_mode"]);
  const humanReviewRequired = (() => {
    for (const s of sources) {
      const v = boolFrom(s, ["human_review_required", "require_human_review", "human_review"]);
      if (v != null) return v;
    }
    return null;
  })();
  const hasAny = [defaultFramework, dataRetention, evidenceFreshness, reportFormat, auditReviewMode, humanReviewRequired].some((v) => v != null);
  return { defaultFramework, dataRetention, evidenceFreshness, reportFormat, auditReviewMode, humanReviewRequired, hasAny };
}
