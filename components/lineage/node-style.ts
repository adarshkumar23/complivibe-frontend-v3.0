import {
  Database,
  Table,
  Workflow,
  FileCode2,
  FileSignature,
  BrainCircuit,
  FileCheck2,
  TriangleAlert,
  Siren,
  FileBarChart,
  Plug,
  ShieldAlert,
  type LucideIcon
} from "lucide-react";
import type { LineageNodeType } from "@/lib/api/lineage-normalizers";

export type NodeStyle = { label: string; icon: LucideIcon; hex: string; soft: string; text: string };

/** Static visual mapping per node type — colors/icons/labels only, no business data. */
export const NODE_STYLES: Record<LineageNodeType, NodeStyle> = {
  data_source: { label: "Data Source", icon: Database, hex: "#06B6D4", soft: "bg-cyan-500/10", text: "text-cyan-600" },
  dataset: { label: "Dataset", icon: Table, hex: "#0EA5E9", soft: "bg-sky-500/10", text: "text-sky-600" },
  pipeline: { label: "Pipeline", icon: Workflow, hex: "#3B82F6", soft: "bg-blue-500/10", text: "text-blue-600" },
  schema: { label: "Schema", icon: FileCode2, hex: "#6366F1", soft: "bg-indigo-500/10", text: "text-indigo-600" },
  contract: { label: "Contract", icon: FileSignature, hex: "#8B5CF6", soft: "bg-violet-500/10", text: "text-violet-600" },
  ai_system: { label: "AI System", icon: BrainCircuit, hex: "#8B5CF6", soft: "bg-violet-500/10", text: "text-violet-600" },
  evidence: { label: "Evidence", icon: FileCheck2, hex: "#10B981", soft: "bg-emerald-500/10", text: "text-emerald-600" },
  risk: { label: "Risk", icon: TriangleAlert, hex: "#F59E0B", soft: "bg-amber-500/10", text: "text-amber-600" },
  incident: { label: "Incident", icon: Siren, hex: "#EF4444", soft: "bg-rose-500/10", text: "text-rose-600" },
  report: { label: "Report", icon: FileBarChart, hex: "#14B8A6", soft: "bg-teal-500/10", text: "text-teal-600" },
  integration: { label: "Integration", icon: Plug, hex: "#0EA5E9", soft: "bg-sky-500/10", text: "text-sky-600" },
  sensitive: { label: "Sensitive Data", icon: ShieldAlert, hex: "#E11D48", soft: "bg-rose-500/10", text: "text-rose-600" }
};

/** Left→right lineage ordering used for graph columns. */
export const TYPE_ORDER: LineageNodeType[] = [
  "integration",
  "data_source",
  "dataset",
  "pipeline",
  "schema",
  "contract",
  "sensitive",
  "ai_system",
  "evidence",
  "risk",
  "incident",
  "report"
];
