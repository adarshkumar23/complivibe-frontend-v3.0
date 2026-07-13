import { MarkerType, type Node, type Edge } from "reactflow";

/**
 * Deterministic layouts for the two real graph shapes we render. Both graphs are small
 * (single- or low-digit node counts) so a lightweight manual layout reads more clearly
 * than a force simulation, and keeps rendering fully deterministic across reloads.
 */

const COLUMN_GAP = 260;
const ROW_GAP = 92;

/**
 * Column layout for the risk entity graph: the risk itself sits in column 0, every other
 * node is grouped into a column by its node_type. Within a column, nodes stack vertically.
 */
export function layoutEntityGraphColumns<T extends { id: string; column: number }>(
  items: T[]
): Node<unknown>[] {
  const byColumn = new Map<number, T[]>();
  for (const item of items) {
    const bucket = byColumn.get(item.column) ?? [];
    bucket.push(item);
    byColumn.set(item.column, bucket);
  }

  const nodes: Node<unknown>[] = [];
  for (const [column, bucket] of byColumn.entries()) {
    const totalHeight = (bucket.length - 1) * ROW_GAP;
    bucket.forEach((item, i) => {
      nodes.push({
        id: item.id,
        position: { x: column * COLUMN_GAP, y: i * ROW_GAP - totalHeight / 2 },
        data: item,
        type: "trustNode",
        draggable: true
      });
    });
  }
  return nodes;
}

/**
 * BFS-hop layout for the risk dependency graph: the selected risk is hop 0; every other
 * node is placed by its shortest hop distance (direction-agnostic) from the root, so
 * upstream/downstream cascades read left-to-right in traversal order.
 */
export function layoutByHopDistance(
  nodeIds: string[],
  edges: { source: string; target: string }[],
  rootId: string
): Map<string, number> {
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodeIds) adjacency.set(id, new Set());
  for (const e of edges) {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  }

  const distances = new Map<string, number>([[rootId, 0]]);
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift() as string;
    const currentDist = distances.get(current) ?? 0;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }
  // Any unreachable node (shouldn't happen for a connected dependency graph) goes last.
  const maxDist = Math.max(0, ...Array.from(distances.values()));
  for (const id of nodeIds) {
    if (!distances.has(id)) distances.set(id, maxDist + 1);
  }
  return distances;
}

export function positionByHop<T extends { id: string }>(items: T[], hops: Map<string, number>): Node<unknown>[] {
  const byHop = new Map<number, T[]>();
  for (const item of items) {
    const hop = hops.get(item.id) ?? 0;
    const bucket = byHop.get(hop) ?? [];
    bucket.push(item);
    byHop.set(hop, bucket);
  }

  const nodes: Node<unknown>[] = [];
  for (const [hop, bucket] of byHop.entries()) {
    const totalHeight = (bucket.length - 1) * ROW_GAP;
    bucket.forEach((item, i) => {
      nodes.push({
        id: item.id,
        position: { x: hop * COLUMN_GAP, y: i * ROW_GAP - totalHeight / 2 },
        data: item,
        type: "trustNode",
        draggable: true
      });
    });
  }
  return nodes;
}

export function buildEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  color: string
): Edge {
  return {
    id,
    source,
    target,
    label,
    animated: false,
    style: { stroke: color, strokeWidth: 1.6 },
    labelStyle: { fill: color, fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: "rgba(255,255,255,0.85)" },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 }
  };
}
