import type {
  BalancedWeights,
  NetworkEdge,
  NetworkNode,
  OptimizationMode,
  RoutingResult,
} from '../types/network';
import {
  calculateEdgeWeight,
  computePathMetrics,
  createUnreachableResult,
  getOperationalGraph,
} from './graphUtils';

/**
 * Runs Bellman-Ford shortest path algorithm with negative-cycle detection.
 */
export function bellmanFord(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  sourceId: string,
  destinationId: string,
  mode: OptimizationMode = 'latency',
  balancedWeights?: BalancedWeights
): RoutingResult {
  const startTime = performance.now();

  if (sourceId === destinationId) {
    return {
      path: [sourceId],
      totalCost: 0,
      totalLatency: 0,
      minBandwidth: 10000,
      hops: 0,
      visitedOrder: [sourceId],
      reachable: true,
      executionTimeMs: performance.now() - startTime,
    };
  }

  const { validNodes, validEdges, nodeMap } = getOperationalGraph(nodes, edges);

  if (!nodeMap.has(sourceId) || !nodeMap.has(destinationId)) {
    return {
      ...createUnreachableResult(sourceId, destinationId, 'Endpoint offline / quarantined.'),
      executionTimeMs: performance.now() - startTime,
    };
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedOrder: string[] = [];

  for (const node of validNodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  }
  distances[sourceId] = 0;

  // Build directed edge list (since edges are bidirectional by default)
  const directedEdges: Array<{ u: string; v: string; weight: number }> = [];
  for (const edge of validEdges) {
    const vNode = nodeMap.get(edge.v);
    const uNode = nodeMap.get(edge.u);
    const w1 = calculateEdgeWeight(edge, vNode, mode, balancedWeights);
    const w2 = calculateEdgeWeight(edge, uNode, mode, balancedWeights);

    directedEdges.push({ u: edge.u, v: edge.v, weight: w1 });
    directedEdges.push({ u: edge.v, v: edge.u, weight: w2 });
  }

  const V = validNodes.length;

  // Relax |V| - 1 times
  for (let i = 0; i < V - 1; i++) {
    let anyChanged = false;
    for (const { u, v, weight } of directedEdges) {
      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        previous[v] = u;
        anyChanged = true;
        if (!visitedOrder.includes(v)) visitedOrder.push(v);
      }
    }
    if (!anyChanged) break;
  }

  // Detect negative-weight cycle on V-th iteration
  let hasNegativeCycle = false;
  for (const { u, v, weight } of directedEdges) {
    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      hasNegativeCycle = true;
      break;
    }
  }

  if (hasNegativeCycle) {
    return {
      path: null,
      totalCost: 0,
      totalLatency: 0,
      minBandwidth: 0,
      hops: 0,
      visitedOrder,
      reachable: false,
      hasNegativeCycle: true,
      error: 'Negative-weight cycle detected! Finite shortest path is undefined.',
      executionTimeMs: performance.now() - startTime,
    };
  }

  if (distances[destinationId] === Infinity || !previous[destinationId]) {
    return {
      ...createUnreachableResult(sourceId, destinationId),
      visitedOrder,
      executionTimeMs: performance.now() - startTime,
    };
  }

  const path: string[] = [];
  let curr: string | null = destinationId;
  const cycleGuard = new Set<string>();

  while (curr !== null) {
    if (cycleGuard.has(curr)) {
      return {
        path: null,
        totalCost: 0,
        totalLatency: 0,
        minBandwidth: 0,
        hops: 0,
        visitedOrder,
        reachable: false,
        hasNegativeCycle: true,
        error: 'Path reconstruction caught a loop in predecessor pointers.',
        executionTimeMs: performance.now() - startTime,
      };
    }
    cycleGuard.add(curr);
    path.unshift(curr);
    curr = previous[curr];
  }

  const metrics = computePathMetrics(path, edges);

  return {
    path,
    totalCost: metrics.totalCost,
    totalLatency: metrics.totalLatency,
    minBandwidth: metrics.minBandwidth,
    hops: metrics.hops,
    visitedOrder,
    reachable: true,
    executionTimeMs: performance.now() - startTime,
  };
}
