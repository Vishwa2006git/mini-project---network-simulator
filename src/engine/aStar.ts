import type {
  BalancedWeights,
  NetworkEdge,
  NetworkNode,
  OptimizationMode,
  RoutingResult,
} from '../types/network';
import { PriorityQueue } from './priorityQueue';
import {
  calculateEdgeWeight,
  computePathMetrics,
  createUnreachableResult,
  getOperationalGraph,
} from './graphUtils';

/**
 * Runs A* heuristic search algorithm.
 * Heuristic: Euclidean distance between node coordinates, scaled by a factor
 * so h(n) <= true remaining distance (admissible & consistent).
 */
export function aStar(
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

  const { validNodes, validEdges, nodeMap, adjacency } = getOperationalGraph(nodes, edges);

  const sourceNode = nodeMap.get(sourceId);
  const destNode = nodeMap.get(destinationId);

  if (!sourceNode || !destNode) {
    return {
      ...createUnreachableResult(sourceId, destinationId, 'Endpoint offline.'),
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Calculate scaling factor to guarantee admissibility:
  // scaleFactor = min_edge (weight / Euclidean length)
  let minScale = Infinity;
  for (const edge of validEdges) {
    const u = nodeMap.get(edge.u);
    const v = nodeMap.get(edge.v);
    if (!u || !v) continue;

    const spatialDist = Math.hypot(u.x - v.x, u.y - v.y);
    if (spatialDist > 0) {
      const weight = calculateEdgeWeight(edge, v, mode, balancedWeights);
      if (weight > 0) {
        minScale = Math.min(minScale, weight / spatialDist);
      }
    }
  }

  const heuristicScale = Number.isFinite(minScale) && minScale > 0 ? minScale * 0.9 : 0.01;

  const heuristic = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node || !destNode) return 0;
    return Math.hypot(node.x - destNode.x, node.y - destNode.y) * heuristicScale;
  };

  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedOrder: string[] = [];
  const closedSet = new Set<string>();

  for (const node of validNodes) {
    gScore[node.id] = Infinity;
    fScore[node.id] = Infinity;
    previous[node.id] = null;
  }

  gScore[sourceId] = 0;
  fScore[sourceId] = heuristic(sourceId);

  const openPq = new PriorityQueue<string>();
  openPq.enqueue(sourceId, fScore[sourceId]);

  while (!openPq.isEmpty()) {
    const current = openPq.dequeue()!;
    if (closedSet.has(current)) continue;

    closedSet.add(current);
    visitedOrder.push(current);

    if (current === destinationId) {
      break;
    }

    const neighbors = adjacency.get(current) || [];
    for (const { neighborId, edge } of neighbors) {
      if (closedSet.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      const weight = calculateEdgeWeight(edge, neighborNode, mode, balancedWeights);
      const tentativeG = gScore[current] + weight;

      if (tentativeG < gScore[neighborId]) {
        previous[neighborId] = current;
        gScore[neighborId] = tentativeG;
        const newF = tentativeG + heuristic(neighborId);
        fScore[neighborId] = newF;
        openPq.enqueue(neighborId, newF);
      }
    }
  }

  if (gScore[destinationId] === Infinity || !previous[destinationId]) {
    return {
      ...createUnreachableResult(sourceId, destinationId),
      visitedOrder,
      executionTimeMs: performance.now() - startTime,
    };
  }

  const path: string[] = [];
  let curr: string | null = destinationId;
  while (curr !== null) {
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
