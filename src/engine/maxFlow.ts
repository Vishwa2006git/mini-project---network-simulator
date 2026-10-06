import type { MaxFlowResult, NetworkEdge, NetworkNode } from '../types/network';
import { getOperationalGraph } from './graphUtils';

interface ResidualEdge {
  from: string;
  to: string;
  capacity: number;
  flow: number;
  reverseIndex: number;
  edgeId: string;
  isForward: boolean;
}

/**
 * Runs Edmonds-Karp Max Flow algorithm on the network topology.
 * Uses edge bandwidth (Mbps) as capacity.
 */
export function edmondsKarp(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  sourceId: string,
  sinkId: string
): MaxFlowResult {
  if (sourceId === sinkId) {
    return {
      maxFlow: 0,
      flows: {},
      bottlenecks: [],
      residualCapacities: {},
    };
  }

  const { nodeMap } = getOperationalGraph(nodes, edges);
  if (!nodeMap.has(sourceId) || !nodeMap.has(sinkId)) {
    return {
      maxFlow: 0,
      flows: {},
      bottlenecks: [],
      residualCapacities: {},
    };
  }

  const graph = new Map<string, ResidualEdge[]>();
  const initList = (id: string) => {
    if (!graph.has(id)) graph.set(id, []);
  };

  initList(sourceId);
  initList(sinkId);

  // Build residual graph with forward and reverse edges
  for (const edge of edges) {
    if (edge.status !== 'UP') continue;
    if (!nodeMap.has(edge.u) || !nodeMap.has(edge.v)) continue;

    initList(edge.u);
    initList(edge.v);

    const capacity = Math.max(0, edge.bandwidth);

    // Bidirectional physical links allow flow in either direction up to capacity
    const uList = graph.get(edge.u)!;
    const vList = graph.get(edge.v)!;

    const fwdIdx = uList.length;
    const revIdx = vList.length;

    const forwardEdge: ResidualEdge = {
      from: edge.u,
      to: edge.v,
      capacity,
      flow: 0,
      reverseIndex: revIdx,
      edgeId: edge.id,
      isForward: true,
    };

    const backwardEdge: ResidualEdge = {
      from: edge.v,
      to: edge.u,
      capacity,
      flow: 0,
      reverseIndex: fwdIdx,
      edgeId: edge.id,
      isForward: false,
    };

    uList.push(forwardEdge);
    vList.push(backwardEdge);
  }

  let totalMaxFlow = 0;

  // BFS to find augmenting path
  while (true) {
    const parentEdge = new Map<string, ResidualEdge>();
    const visited = new Set<string>([sourceId]);
    const queue: string[] = [sourceId];

    while (queue.length > 0) {
      const u = queue.shift()!;
      if (u === sinkId) break;

      const edgesList = graph.get(u) || [];
      for (const e of edgesList) {
        const residual = e.capacity - e.flow;
        if (residual > 0 && !visited.has(e.to)) {
          visited.add(e.to);
          parentEdge.set(e.to, e);
          queue.push(e.to);
        }
      }
    }

    if (!visited.has(sinkId)) {
      break; // No more augmenting paths
    }

    // Find bottleneck residual capacity along this augmenting path
    let pushFlow = Infinity;
    let curr = sinkId;
    while (curr !== sourceId) {
      const e = parentEdge.get(curr)!;
      pushFlow = Math.min(pushFlow, e.capacity - e.flow);
      curr = e.from;
    }

    // Apply pushFlow
    curr = sinkId;
    while (curr !== sourceId) {
      const e = parentEdge.get(curr)!;
      e.flow += pushFlow;
      const reverseList = graph.get(e.to)!;
      reverseList[e.reverseIndex].flow -= pushFlow;
      curr = e.from;
    }

    totalMaxFlow += pushFlow;
  }

  // Find minimum cut (bottleneck edges): Reachable from source in residual graph
  const reachableFromSource = new Set<string>([sourceId]);
  const queue: string[] = [sourceId];

  while (queue.length > 0) {
    const u = queue.shift()!;
    const edgesList = graph.get(u) || [];
    for (const e of edgesList) {
      if (e.capacity - e.flow > 0 && !reachableFromSource.has(e.to)) {
        reachableFromSource.add(e.to);
        queue.push(e.to);
      }
    }
  }

  const flows: Record<string, number> = {};
  const residualCapacities: Record<string, number> = {};
  const bottlenecksSet = new Set<string>();

  for (const [, edgesList] of graph.entries()) {
    for (const e of edgesList) {
      if (e.isForward) {
        flows[e.edgeId] = Math.max(0, Math.round(e.flow));
        residualCapacities[e.edgeId] = Math.max(0, Math.round(e.capacity - e.flow));

        // If from node is reachable in residual graph but to node is not, it's a bottleneck min-cut edge!
        if (
          (reachableFromSource.has(e.from) && !reachableFromSource.has(e.to)) ||
          (reachableFromSource.has(e.to) && !reachableFromSource.has(e.from))
        ) {
          if (e.capacity > 0 && Math.abs(e.capacity - Math.abs(e.flow)) < 1) {
            bottlenecksSet.add(e.edgeId);
          }
        }
      }
    }
  }

  return {
    maxFlow: Math.round(totalMaxFlow),
    flows,
    bottlenecks: Array.from(bottlenecksSet),
    residualCapacities,
  };
}
