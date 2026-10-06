import type { NetworkEdge, NetworkNode } from '../types/network';
import { getOperationalGraph } from './graphUtils';
import { PriorityQueue } from './priorityQueue';

export interface SpanningTreeResult {
  algorithm: 'Kruskal' | 'Prim';
  mstEdges: NetworkEdge[];
  mstEdgeIds: Set<string>;
  totalCost: number;
  totalLatency: number;
  coveredNodes: string[];
  isConnected: boolean;
}

/**
 * Disjoint Set Union (Union-Find) for Kruskal's algorithm.
 */
class DisjointSet {
  private parent = new Map<string, string>();
  private rank = new Map<string, number>();

  constructor(elements: string[]) {
    for (const el of elements) {
      this.parent.set(el, el);
      this.rank.set(el, 0);
    }
  }

  find(item: string): string {
    const p = this.parent.get(item);
    if (!p) return item;
    if (p !== item) {
      const root = this.find(p);
      this.parent.set(item, root);
      return root;
    }
    return p;
  }

  union(a: string, b: string): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
    return true;
  }
}

/**
 * Kruskal's Algorithm: Sort edges by cost/weight, greedily add non-cycle edges.
 */
export function kruskal(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  metric: 'cost' | 'latency' = 'cost'
): SpanningTreeResult {
  const { validNodes, validEdges } = getOperationalGraph(nodes, edges);
  const nodeIds = validNodes.map((n) => n.id);

  if (nodeIds.length <= 1) {
    return {
      algorithm: 'Kruskal',
      mstEdges: [],
      mstEdgeIds: new Set(),
      totalCost: 0,
      totalLatency: 0,
      coveredNodes: nodeIds,
      isConnected: true,
    };
  }

  const sortedEdges = [...validEdges].sort((a, b) =>
    metric === 'latency' ? a.latency - b.latency : a.cost - b.cost
  );

  const dsu = new DisjointSet(nodeIds);
  const mstEdges: NetworkEdge[] = [];
  const mstEdgeIds = new Set<string>();
  let totalCost = 0;
  let totalLatency = 0;

  for (const edge of sortedEdges) {
    if (dsu.union(edge.u, edge.v)) {
      mstEdges.push(edge);
      mstEdgeIds.add(edge.id);
      totalCost += edge.cost;
      totalLatency += edge.latency;

      if (mstEdges.length === nodeIds.length - 1) {
        break;
      }
    }
  }

  const isConnected = mstEdges.length === nodeIds.length - 1;

  return {
    algorithm: 'Kruskal',
    mstEdges,
    mstEdgeIds,
    totalCost: Number(totalCost.toFixed(2)),
    totalLatency: Number(totalLatency.toFixed(2)),
    coveredNodes: nodeIds,
    isConnected,
  };
}

/**
 * Prim's Algorithm: Grow tree from an arbitrary start node using min-heap.
 */
export function prim(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  metric: 'cost' | 'latency' = 'cost',
  startNodeId?: string
): SpanningTreeResult {
  const { validNodes, adjacency } = getOperationalGraph(nodes, edges);
  const nodeIds = validNodes.map((n) => n.id);

  if (nodeIds.length <= 1) {
    return {
      algorithm: 'Prim',
      mstEdges: [],
      mstEdgeIds: new Set(),
      totalCost: 0,
      totalLatency: 0,
      coveredNodes: nodeIds,
      isConnected: true,
    };
  }

  const start = startNodeId && nodeIds.includes(startNodeId) ? startNodeId : nodeIds[0];
  const inMst = new Set<string>([start]);
  const mstEdges: NetworkEdge[] = [];
  const mstEdgeIds = new Set<string>();

  const pq = new PriorityQueue<{ edge: NetworkEdge; toNode: string }>();

  for (const { neighborId, edge } of adjacency.get(start) || []) {
    const weight = metric === 'latency' ? edge.latency : edge.cost;
    pq.enqueue({ edge, toNode: neighborId }, weight);
  }

  let totalCost = 0;
  let totalLatency = 0;

  while (!pq.isEmpty() && inMst.size < nodeIds.length) {
    const item = pq.dequeue()!;
    if (inMst.has(item.toNode)) continue;

    inMst.add(item.toNode);
    mstEdges.push(item.edge);
    mstEdgeIds.add(item.edge.id);
    totalCost += item.edge.cost;
    totalLatency += item.edge.latency;

    for (const { neighborId, edge } of adjacency.get(item.toNode) || []) {
      if (!inMst.has(neighborId)) {
        const weight = metric === 'latency' ? edge.latency : edge.cost;
        pq.enqueue({ edge, toNode: neighborId }, weight);
      }
    }
  }

  return {
    algorithm: 'Prim',
    mstEdges,
    mstEdgeIds,
    totalCost: Number(totalCost.toFixed(2)),
    totalLatency: Number(totalLatency.toFixed(2)),
    coveredNodes: Array.from(inMst),
    isConnected: inMst.size === nodeIds.length,
  };
}
