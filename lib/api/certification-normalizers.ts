import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

/**
 * Certification, normalized from /api/v1/certifications.
 * Status/readiness/dates/counts are null unless the backend returns them — never defaulted
 * to "Ready", "Certified", "Active", "Complete", etc.
 */
export type NormalizedCertification = {
  id: string;
  rawId: string | null;
  name: string;
  framework: string | null;
  status: string | null;
  readiness: number | null;
  issueDate: string | null;
  expiryDate: string | null;
  evidenceCount: number | null;
  owner: string | null;
};

const LIST_PATHS = ["", "data", "result", "items", "results", "certifications", "certs", "data.items", "records"];

/** Normalize a 0–100 readiness from a 0–1 ratio or 0–100 number. Null when absent. */
function readinessFrom(entry: unknown): number | null {
  const raw = getNumberFromPaths(entry, [
    "readiness",
    "readiness_score",
    "progress",
    "completion",
    "completion_percentage",
    "percent_complete",
    "coverage"
  ]);
  if (raw == null) return null;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(Math.min(100, raw));
}

export function normalizeCertifications(value: unknown): NormalizedCertification[] {
  return normalizeList(value, LIST_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "certification_id", "cert_id"]);
    return {
      id: rawId || `certification-${index}`,
      rawId,
      name: getStringFromPaths(entry, ["name", "certification", "title", "cert_name", "standard", "framework"]) || "Certification",
      framework: getStringFromPaths(entry, ["framework", "standard", "scheme", "regulation"]),
      status: getStringFromPaths(entry, ["status", "state", "validity", "stage"]),
      readiness: readinessFrom(entry),
      issueDate: getDateFromPaths(entry, ["issue_date", "issued_at", "obtained_at", "valid_from", "certified_at"]),
      expiryDate: getDateFromPaths(entry, ["expiry_date", "expires_at", "valid_until", "expiration_date", "renewal_date"]),
      evidenceCount: getNumberFromPaths(entry, ["evidence_count", "evidence", "mapped_evidence", "linked_evidence", "evidence_total"]),
      owner: getStringFromPaths(entry, ["owner", "owner_name", "responsible", "assignee"])
    };
  });
}

const READY = ["ready", "complete", "completed", "certified", "approved", "active", "achieved", "passed"];

/** True only when the backend status genuinely indicates readiness/completion. */
export function isReady(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return READY.some((x) => s.includes(x));
}

export function statusTone(status: string | null): "good" | "warn" | "bad" | "neutral" {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (/(expired|failed|revoked|lapsed)/.test(s)) return "bad";
  if (isReady(status)) return "good";
  if (/(progress|pending|review|preparing|draft)/.test(s)) return "warn";
  return "neutral";
}

/** Days until expiry, or null when no expiry date. */
export function daysToExpiry(cert: NormalizedCertification): number | null {
  if (!cert.expiryDate) return null;
  return Math.ceil((new Date(cert.expiryDate).getTime() - Date.now()) / 86_400_000);
}

/** Expiring soon = real expiry date within the window (default 90 days) and not already expired. */
export function isExpiringSoon(cert: NormalizedCertification, withinDays = 90): boolean {
  const d = daysToExpiry(cert);
  return d != null && d >= 0 && d <= withinDays;
}

/** Average readiness across certs that actually report a readiness value; null otherwise. */
export function averageReadiness(certs: NormalizedCertification[]): number | null {
  const withReadiness = certs.filter((c) => c.readiness != null);
  if (withReadiness.length === 0) return null;
  return Math.round(withReadiness.reduce((s, c) => s + (c.readiness as number), 0) / withReadiness.length);
}
