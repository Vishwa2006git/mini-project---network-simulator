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

export interface FloydWarshallMatrixResult {
  nodeIds: string[];
  matrix: number[][]; // Infinity where unreachable
  nextMatrix: (string | null)[][];
  hasNegativeCycle: boolean;
  executionTimeMs: number;
}

/**
 * Computes all-pairs shortest paths using Floyd–Warshall O(V^3).
 */
export function floydWarshallAllPairs(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  mode: OptimizationMode = 'latency',
  balancedWeights?: BalancedWeights
): FloydWarshallMatrixResult {
  const startTime = performance.now();
  const { validNodes, validEdges, nodeMap } = getOperationalGraph(nodes, edges);

  const nodeIds = validNodes.map((n) => n.id);
  const n = nodeIds.length;
  const indexMap = new Map<string, number>();
  nodeIds.forEach((id, idx) => indexMap.set(id, idx));

  // Initialize n x n matrix with 0 on diagonal and Infinity elsewhere
  const matrix: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? 0 : Infinity))
  );

  const nextMatrix: (string | null)[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => (i === j ? nodeIds[i] : null))
  );

  for (const edge of validEdges) {
    const uIdx = indexMap.get(edge.u);
    const vIdx = indexMap.get(edge.v);
    if (uIdx === undefined || vIdx === undefined) continue;

    const vNode = nodeMap.get(edge.v);
    const uNode = nodeMap.get(edge.u);
    const wForward = calculateEdgeWeight(edge, vNode, mode, balancedWeights);
    const wBackward = calculateEdgeWeight(edge, uNode, mode, balancedWeights);

    if (wForward < matrix[uIdx][vIdx]) {
      matrix[uIdx][vIdx] = wForward;
      nextMatrix[uIdx][vIdx] = edge.v;
    }

    if (wBackward < matrix[vIdx][uIdx]) {
      matrix[vIdx][uIdx] = wBackward;
      nextMatrix[vIdx][uIdx] = edge.u;
    }
  }

  // Triple loop
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      if (matrix[i][k] === Infinity) continue;
      for (let j = 0; j < n; j++) {
        if (matrix[k][j] === Infinity) continue;
        const candidate = matrix[i][k] + matrix[k][j];
        if (candidate < matrix[i][j]) {
          matrix[i][j] = candidate;
          nextMatrix[i][j] = nextMatrix[i][k];
        }
      }
    }
  }

  let hasNegativeCycle = false;
  for (let i = 0; i < n; i++) {
    if (matrix[i][i] < 0) {
      hasNegativeCycle = true;
      break;
    }
  }

  return {
    nodeIds,
    matrix,
    nextMatrix,
    hasNegativeCycle,
    executionTimeMs: performance.now() - startTime,
  };
}

/**
 * Reconstructs path between source and destination using precomputed Floyd–Warshall nextMatrix.
 */
export function reconstructFloydWarshallPath(
  fwResult: FloydWarshallMatrixResult,
  sourceId: string,
  destinationId: string,
  edges: NetworkEdge[]
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

  const { nodeIds, matrix, nextMatrix, hasNegativeCycle } = fwResult;
  const uIdx = nodeIds.indexOf(sourceId);
  const vIdx = nodeIds.indexOf(destinationId);

  if (uIdx === -1 || vIdx === -1) {
    return {
      ...createUnreachableResult(sourceId, destinationId, 'Endpoint offline.'),
      executionTimeMs: performance.now() - startTime,
    };
  }

  if (hasNegativeCycle) {
    return {
      path: null,
      totalCost: 0,
      totalLatency: 0,
      minBandwidth: 0,
      hops: 0,
      visitedOrder: [sourceId],
      reachable: false,
      hasNegativeCycle: true,
      error: 'Negative-weight cycle in topology; path cannot be determined.',
      executionTimeMs: performance.now() - startTime,
    };
  }

  if (matrix[uIdx][vIdx] === Infinity || nextMatrix[uIdx][vIdx] === null) {
    return {
      ...createUnreachableResult(sourceId, destinationId),
      visitedOrder: [sourceId],
      executionTimeMs: performance.now() - startTime,
    };
  }

  const path: string[] = [sourceId];
  let curr = sourceId;
  const maxGuard = nodeIds.length + 2;
  let guard = 0;

  while (curr !== destinationId) {
    const currIdx = nodeIds.indexOf(curr);
    const nextNode = nextMatrix[currIdx][vIdx];
    if (!nextNode) {
      return {
        ...createUnreachableResult(sourceId, destinationId),
        visitedOrder: path,
        executionTimeMs: performance.now() - startTime,
      };
    }
    curr = nextNode;
    path.push(curr);
    guard++;
    if (guard > maxGuard) {
      return {
        ...createUnreachableResult(sourceId, destinationId, 'Cycle detected in path reconstruction.'),
        visitedOrder: path,
        hasNegativeCycle: true,
        executionTimeMs: performance.now() - startTime,
      };
    }
  }

  const metrics = computePathMetrics(path, edges);

  return {
    path,
    totalCost: metrics.totalCost,
    totalLatency: metrics.totalLatency,
    minBandwidth: metrics.minBandwidth,
    hops: metrics.hops,
    visitedOrder: path,
    reachable: true,
    executionTimeMs: performance.now() - startTime,
  };
}
