import type {
  BalancedWeights,
  KShortestPathItem,
  NetworkEdge,
  NetworkNode,
  OptimizationMode,
} from '../types/network';
import { dijkstra } from './dijkstra';
import { computePathMetrics } from './graphUtils';

/**
 * Yen's K-Shortest Loopless Paths Algorithm (K = 3)
 */
export function kShortestPaths(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  sourceId: string,
  destinationId: string,
  k = 3,
  mode: OptimizationMode = 'latency',
  balancedWeights?: BalancedWeights
): KShortestPathItem[] {
  if (sourceId === destinationId) {
    return [
      {
        rank: 1,
        path: [sourceId],
        totalCost: 0,
        totalLatency: 0,
        minBandwidth: 10000,
        hops: 0,
      },
    ];
  }

  const primaryResult = dijkstra(nodes, edges, sourceId, destinationId, mode, balancedWeights);
  if (!primaryResult.reachable || !primaryResult.path || primaryResult.path.length === 0) {
    return [];
  }

  const A: string[][] = [primaryResult.path]; // Top paths found so far
  const B: Array<{ path: string[]; cost: number }> = []; // Candidate paths container

  for (let kIndex = 1; kIndex < k; kIndex++) {
    const prevPath = A[kIndex - 1];
    if (!prevPath) break;

    // Spur node ranges from 0 to len - 2
    for (let i = 0; i <= prevPath.length - 2; i++) {
      const spurNode = prevPath[i];
      const rootPath = prevPath.slice(0, i + 1);

      // Edges to temporarily remove
      const edgesToRemove = new Set<string>();

      for (const p of A) {
        if (p.length > i && rootPath.every((node, idx) => node === p[idx])) {
          const nextNode = p[i + 1];
          // Find edge between spurNode and nextNode
          for (const e of edges) {
            if (
              (e.u === spurNode && e.v === nextNode) ||
              (e.u === nextNode && e.v === spurNode)
            ) {
              edgesToRemove.add(e.id);
            }
          }
        }
      }

      // Nodes in rootPath except spurNode are removed
      const nodesToRemove = new Set<string>(rootPath.slice(0, i));

      // Filtered network
      const filteredNodes = nodes.filter((n) => !nodesToRemove.has(n.id));
      const filteredEdges = edges.filter((e) => !edgesToRemove.has(e.id));

      const spurResult = dijkstra(
        filteredNodes,
        filteredEdges,
        spurNode,
        destinationId,
        mode,
        balancedWeights
      );

      if (spurResult.reachable && spurResult.path && spurResult.path.length > 0) {
        const totalCandidate = [...rootPath.slice(0, i), ...spurResult.path];
        const pathKey = totalCandidate.join('->');

        // Check if not already in A or B
        const existsInA = A.some((p) => p.join('->') === pathKey);
        const existsInB = B.some((cand) => cand.path.join('->') === pathKey);

        if (!existsInA && !existsInB) {
          const metrics = computePathMetrics(totalCandidate, edges);
          B.push({ path: totalCandidate, cost: metrics.totalLatency });
        }
      }
    }

    if (B.length === 0) break;

    // Sort B by cost ascending
    B.sort((a, b) => a.cost - b.cost);
    const bestCandidate = B.shift()!;
    A.push(bestCandidate.path);
  }

  return A.map((path, idx) => {
    const metrics = computePathMetrics(path, edges);
    return {
      rank: idx + 1,
      path,
      totalCost: metrics.totalCost,
      totalLatency: metrics.totalLatency,
      minBandwidth: metrics.minBandwidth,
      hops: metrics.hops,
    };
  });
}
