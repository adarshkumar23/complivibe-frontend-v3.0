import { apiFetch } from "@/lib/api/client";
import {
  ShieldCheck,
  TriangleAlert,
  Building2,
  FileText,
  Scale,
  Flag,
  type LucideIcon
} from "lucide-react";
import type { Accent } from "@/components/ui/accent";

/**
 * Global search API — typed against the live backend schema
 * (GET /api/v1/search, Meilisearch-backed, org-scoped fuzzy search).
 */

// ── GET /api/v1/search ───────────────────────────────────────────────────────
/** One Meilisearch hit. Field presence varies by entity type (each index has
 * its own document shape); every field the backend can emit is optional here. */
export type SearchHit = {
  entity_type: string;
  id: string;
  organization_id?: string | null;
  _rankingScore?: number | null;
  // risk / control / issue / compliance_policy / obligation
  title?: string | null;
  // vendor
  name?: string | null;
  description?: string | null;
  status?: string | null;
  severity?: string | null;
  category?: string | null;
  control_code?: string | null;
  control_type?: string | null;
  criticality?: string | null;
  vendor_type?: string | null;
  risk_tier?: string | null;
  issue_type?: string | null;
  policy_type?: string | null;
  reference_code?: string | null;
  jurisdiction?: string | null;
};

export type SearchResponse = {
  query: string;
  took_ms: number;
  hits: SearchHit[];
  degraded: boolean;
  degraded_reason: string | null;
};

export const SEARCH_ENTITY_TYPES = [
  "risk",
  "control",
  "vendor",
  "issue",
  "compliance_policy",
  "obligation"
] as const;

export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

export function search(q: string, entityTypes?: string[], limit = 20) {
  const params = new URLSearchParams({ q, limit: String(limit) });
  for (const t of entityTypes ?? []) {
    params.append("entity_types", t);
  }
  return apiFetch<SearchResponse>(`/api/v1/search?${params.toString()}`);
}

// ── Presentation metadata per entity type (deep links to existing pages) ─────
export type SearchEntityMeta = {
  label: string;
  icon: LucideIcon;
  accent: Accent;
  /** page listing this entity type — no per-record routes exist yet */
  href: string;
};

export const SEARCH_ENTITY_META: Record<SearchEntityType, SearchEntityMeta> = {
  risk: { label: "Risk", icon: TriangleAlert, accent: "red", href: "/dashboard/risks" },
  control: { label: "Control", icon: ShieldCheck, accent: "blue", href: "/dashboard/controls" },
  vendor: { label: "Vendor", icon: Building2, accent: "purple", href: "/dashboard/vendor-risk" },
  issue: { label: "Issue", icon: Flag, accent: "amber", href: "/dashboard/compliance" },
  compliance_policy: { label: "Policy", icon: FileText, accent: "teal", href: "/dashboard/policies" },
  obligation: { label: "Obligation", icon: Scale, accent: "cyan", href: "/dashboard/regulatory" }
};

export function searchHitTitle(hit: SearchHit): string {
  return hit.title || hit.name || hit.reference_code || hit.id;
}

export function searchHitMeta(hit: SearchHit): SearchEntityMeta {
  return (
    SEARCH_ENTITY_META[hit.entity_type as SearchEntityType] ?? {
      label: hit.entity_type,
      icon: FileText,
      accent: "blue" as Accent,
      href: "/dashboard"
    }
  );
}
