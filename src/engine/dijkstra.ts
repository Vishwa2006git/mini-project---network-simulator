import type {
  AlgorithmStep,
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
 * Runs Dijkstra's shortest path algorithm using a Min-Heap priority queue.
 */
export function dijkstra(
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
      ...createUnreachableResult(sourceId, destinationId, 'Source or destination node is offline / quarantined.'),
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Check for negative weights
  const hasNegativeWeights = validEdges.some((e) => e.cost < 0 || e.latency < 0);
  const warning = hasNegativeWeights
    ? 'Warning: Graph contains negative weights. Dijkstra may yield suboptimal paths; use Bellman-Ford instead.'
    : undefined;

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedOrder: string[] = [];
  const visitedSet = new Set<string>();

  for (const node of validNodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  }

  distances[sourceId] = 0;
  const pq = new PriorityQueue<string>();
  pq.enqueue(sourceId, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    if (visitedSet.has(current)) continue;
    visitedSet.add(current);
    visitedOrder.push(current);

    if (current === destinationId) {
      break;
    }

    const neighbors = adjacency.get(current) || [];
    for (const { neighborId, edge } of neighbors) {
      if (visitedSet.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      const weight = calculateEdgeWeight(edge, neighborNode, mode, balancedWeights);
      const newDist = distances[current] + weight;

      if (newDist < distances[neighborId]) {
        distances[neighborId] = newDist;
        previous[neighborId] = current;
        pq.enqueue(neighborId, newDist);
      }
    }
  }

  if (distances[destinationId] === Infinity || !previous[destinationId]) {
    return {
      ...createUnreachableResult(sourceId, destinationId),
      visitedOrder,
      warning,
      executionTimeMs: performance.now() - startTime,
    };
  }

  // Reconstruct path
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
    warning,
    executionTimeMs: performance.now() - startTime,
  };
}

/**
 * Runs Dijkstra while recording step-by-step state snapshots for the interactive algorithm visualizer.
 */
export function dijkstraWithSteps(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  sourceId: string,
  destinationId: string,
  mode: OptimizationMode = 'latency',
  balancedWeights?: BalancedWeights
): { result: RoutingResult; steps: AlgorithmStep[] } {
  const steps: AlgorithmStep[] = [];
  const startTime = performance.now();

  const { validNodes, validEdges, nodeMap, adjacency } = getOperationalGraph(nodes, edges);

  if (!nodeMap.has(sourceId) || !nodeMap.has(destinationId)) {
    const result = {
      ...createUnreachableResult(sourceId, destinationId, 'Endpoint offline.'),
      executionTimeMs: performance.now() - startTime,
    };
    return { result, steps };
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedSet = new Set<string>();
  const visitedOrder: string[] = [];

  for (const node of validNodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  }

  distances[sourceId] = 0;
  const pq = new PriorityQueue<string>();
  pq.enqueue(sourceId, 0);

  // Initial step 0
  steps.push({
    stepNumber: 0,
    currentNode: null,
    visitedNodes: [],
    frontierNodes: [sourceId],
    distances: { ...distances },
    previous: { ...previous },
    description: `Initialized distances. Set dist[${sourceId}] = 0 and enqueued source node into priority queue.`,
  });

  let stepCount = 1;

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    if (visitedSet.has(current)) continue;

    visitedSet.add(current);
    visitedOrder.push(current);

    const frontierNodes: string[] = [];
    const neighbors = adjacency.get(current) || [];

    steps.push({
      stepNumber: stepCount++,
      currentNode: current,
      visitedNodes: Array.from(visitedSet),
      frontierNodes: neighbors.map((n) => n.neighborId).filter((id) => !visitedSet.has(id)),
      distances: { ...distances },
      previous: { ...previous },
      description: `Popped node "${current}" (min distance ${distances[current].toFixed(1)}) from priority queue. Relaxing adjacent links.`,
    });

    if (current === destinationId) {
      steps.push({
        stepNumber: stepCount++,
        currentNode: current,
        visitedNodes: Array.from(visitedSet),
        frontierNodes: [],
        distances: { ...distances },
        previous: { ...previous },
        description: `Target destination "${destinationId}" reached with optimal cost ${distances[destinationId].toFixed(1)}. Shortest path finalized.`,
      });
      break;
    }

    for (const { neighborId, edge } of neighbors) {
      if (visitedSet.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      const weight = calculateEdgeWeight(edge, neighborNode, mode, balancedWeights);
      const newDist = distances[current] + weight;

      if (newDist < distances[neighborId]) {
        const oldDist = distances[neighborId];
        distances[neighborId] = newDist;
        previous[neighborId] = current;
        pq.enqueue(neighborId, newDist);

        steps.push({
          stepNumber: stepCount++,
          currentNode: current,
          visitedNodes: Array.from(visitedSet),
          frontierNodes: [neighborId],
          distances: { ...distances },
          previous: { ...previous },
          description: `Relaxed link ${current} → ${neighborId}: updated dist[${neighborId}] from ${oldDist === Infinity ? '∞' : oldDist.toFixed(1)} to ${newDist.toFixed(1)}.`,
        });
      }
    }
  }

  if (distances[destinationId] === Infinity || !previous[destinationId]) {
    const result = {
      ...createUnreachableResult(sourceId, destinationId),
      visitedOrder,
      executionTimeMs: performance.now() - startTime,
    };
    return { result, steps };
  }

  const path: string[] = [];
  let curr: string | null = destinationId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  const metrics = computePathMetrics(path, edges);

  const result: RoutingResult = {
    path,
    totalCost: metrics.totalCost,
    totalLatency: metrics.totalLatency,
    minBandwidth: metrics.minBandwidth,
    hops: metrics.hops,
    visitedOrder,
    reachable: true,
    executionTimeMs: performance.now() - startTime,
  };

  return { result, steps };
}
