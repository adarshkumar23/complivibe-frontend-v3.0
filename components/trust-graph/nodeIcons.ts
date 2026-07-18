import {
  ShieldCheck,
  Building2,
  ScrollText,
  FileCheck2,
  FileStack,
  TriangleAlert,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// The closed set of graph node kinds the backend risk/entity graph emits.
export type NodeKind =
  | "root-risk"
  | "control"
  | "vendor"
  | "obligation"
  | "evidence"
  | "policy"
  | "dependency-risk";

export const KIND_ICON: Record<NodeKind, LucideIcon> = {
  "root-risk": TriangleAlert,
  "dependency-risk": TriangleAlert,
  control: ShieldCheck,
  vendor: Building2,
  obligation: ScrollText,
  evidence: FileCheck2,
  policy: FileStack,
};

// Neutral fallback so an unmapped node kind degrades to a generic icon instead of
// rendering `undefined` (React "Element type is invalid" -> error boundary). Same
// guard-at-point-of-use pattern as components/ui/SeverityBadge.tsx.
export const FALLBACK_ICON: LucideIcon = HelpCircle;

/**
 * Resolve the icon for a node kind, tolerating values outside the known union
 * (e.g. a new backend node_type shipped ahead of the frontend). Never returns
 * undefined, so `<Icon />` is always a valid element type.
 */
export function iconForKind(kind: NodeKind | string | null | undefined): LucideIcon {
  return KIND_ICON[kind as NodeKind] ?? FALLBACK_ICON;
}
