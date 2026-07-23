import { apiFetch } from "@/lib/api/client";

/**
 * AI-BOM (AI Bill of Materials) API — typed against the live backend schema
 * (/api/v1/ai-governance/systems/{systemId}/aibom*).
 *
 * An AI-BOM is a PER-AI-SYSTEM, VERSIONED inventory of the components an AI
 * system is built on (its training data, base models, fine-tuning datasets,
 * runtime data feeds, third-party APIs, and framework libraries). There is no
 * global BOM — every read/write is scoped to a single AI system, and each save
 * produces a new immutable version.
 */

// ── component_type is a CLOSED enum of exactly 6 values ─────────────────────
export const AIBOM_COMPONENT_TYPES = [
  "training_data",
  "base_model",
  "fine_tuning_dataset",
  "runtime_data_feed",
  "third_party_api",
  "framework_library"
] as const;

export type AibomComponentType = (typeof AIBOM_COMPONENT_TYPES)[number];

/** Human labels + rendering order for the grouped component sections. */
export const AIBOM_COMPONENT_TYPE_LABELS: Record<AibomComponentType, string> = {
  training_data: "Training Data",
  base_model: "Base Models",
  fine_tuning_dataset: "Fine-tuning Datasets",
  runtime_data_feed: "Runtime Data Feeds",
  third_party_api: "Third-party APIs",
  framework_library: "Framework Libraries"
};

// ── Read shapes ─────────────────────────────────────────────────────────────
export type AibomRecord = {
  id: string;
  organization_id: string;
  ai_system_id: string;
  version: number;
  generated_at: string;
  generated_by: string | null;
  notes: string | null;
};

export type AibomComponent = {
  id: string;
  organization_id: string;
  aibom_id: string;
  component_type: AibomComponentType;
  name: string;
  version: string | null;
  source: string | null;
  license_type: string | null;
  is_third_party: boolean;
  risk_notes: string | null;
  source_integration: string | null;
  created_at: string;
};

export type AibomWithComponents = {
  record: AibomRecord;
  components: AibomComponent[];
};

// ── Write shapes ────────────────────────────────────────────────────────────
export type AibomComponentCreate = {
  component_type: AibomComponentType;
  name: string;
  version?: string | null;
  source?: string | null;
  license_type?: string | null;
  is_third_party?: boolean;
  risk_notes?: string | null;
  source_integration?: string | null;
};

export type AibomVersionCreate = {
  notes?: string | null;
  components?: AibomComponentCreate[];
};

export type AibomDiff = {
  added: AibomComponent[];
  removed: AibomComponent[];
  changed: { before: AibomComponent; after: AibomComponent }[];
};

// ── GET latest BOM for a system (404 when none exists yet) ──────────────────
export function getLatestAibom(systemId: string) {
  return apiFetch<AibomWithComponents>(
    `/api/v1/ai-governance/systems/${encodeURIComponent(systemId)}/aibom/latest`
  );
}

// ── POST a new BOM version (copies previous forward when components omitted) ─
export function createAibomVersion(systemId: string, body: AibomVersionCreate = {}) {
  return apiFetch<AibomRecord>(`/api/v1/ai-governance/systems/${encodeURIComponent(systemId)}/aibom`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

// ── POST a component onto the latest BOM (409 on duplicate type+name) ────────
export function addAibomComponent(systemId: string, body: AibomComponentCreate) {
  return apiFetch<AibomComponent>(
    `/api/v1/ai-governance/systems/${encodeURIComponent(systemId)}/aibom/components`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

// ── GET diff between two versions (optional) ────────────────────────────────
export function getAibomDiff(systemId: string, v1: number, v2: number) {
  return apiFetch<AibomDiff>(
    `/api/v1/ai-governance/systems/${encodeURIComponent(systemId)}/aibom/diff?v1=${v1}&v2=${v2}`
  );
}
