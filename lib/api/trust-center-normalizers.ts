import {
  getStringFromPaths,
  getNumberFromPaths,
  getDateFromPaths,
  normalizeList
} from "@/lib/api/normalizers";

export type TrustAsset = {
  id: string;
  rawId: string | null;
  title: string;
  type: string | null;
  status: string | null;
  visibility: string | null;
  url: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const ASSET_PATHS = ["", "data", "result", "items", "results", "data.items", "assets", "trust_assets", "documents", "records"];

export function normalizeTrustAssets(value: unknown): TrustAsset[] {
  return normalizeList(value, ASSET_PATHS).map((entry, index) => {
    const rawId = getStringFromPaths(entry, ["id", "uuid", "asset_id"]);
    return {
      id: rawId || `asset-${index}`,
      rawId,
      title: getStringFromPaths(entry, ["title", "name", "asset_name", "document"]) || "Untitled asset",
      type: getStringFromPaths(entry, ["type", "category", "asset_type", "kind"]),
      status: getStringFromPaths(entry, ["status", "state"]),
      visibility: getStringFromPaths(entry, ["visibility", "access", "audience", "scope"]),
      url: getStringFromPaths(entry, ["download_url", "url", "public_url", "file_url", "link"]),
      createdAt: getDateFromPaths(entry, ["created_at", "published_at", "createdAt"]),
      updatedAt: getDateFromPaths(entry, ["updated_at", "updatedAt", "modified_at"])
    };
  });
}

export function isPublished(asset: TrustAsset): boolean {
  const v = `${asset.visibility || ""} ${asset.status || ""}`.toLowerCase();
  return ["public", "published", "live", "shared"].some((x) => v.includes(x));
}

export type Certification = {
  id: string;
  name: string;
  framework: string | null;
  status: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  evidenceCount: number | null;
};

export function normalizeCertifications(value: unknown): Certification[] {
  return normalizeList(value, ["", "data", "result", "items", "results", "certifications", "certs"]).map((entry, index) => ({
    id: getStringFromPaths(entry, ["id", "uuid", "certification_id"]) || `cert-${index}`,
    name: getStringFromPaths(entry, ["name", "certification", "title", "cert_name", "standard"]) || "Certification",
    framework: getStringFromPaths(entry, ["framework", "standard", "scheme", "regulation"]),
    status: getStringFromPaths(entry, ["status", "state", "validity"]),
    issueDate: getDateFromPaths(entry, ["issue_date", "issued_at", "obtained_at", "valid_from"]),
    expiryDate: getDateFromPaths(entry, ["expiry_date", "expires_at", "valid_until", "expiration_date"]),
    evidenceCount: getNumberFromPaths(entry, ["evidence_count", "evidence", "mapped_evidence"])
  }));
}

export type TrustActivity = { id: string; title: string; action: string; timestamp: string };

/** Build recent activity from any timestamped record sets (assets, reports, packs, certs). */
export function trustActivity(groups: { label: string; items: { id: string; title: string; ts: string | null }[] }[]): TrustActivity[] {
  const events: TrustActivity[] = [];
  for (const g of groups) {
    for (const it of g.items) {
      if (!it.ts) continue;
      events.push({ id: `${g.label}-${it.id}`, title: it.title, action: g.label, timestamp: it.ts });
    }
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
