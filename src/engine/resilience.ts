import type { NetworkEdge, NetworkNode, ResilienceReport } from '../types/network';
import { getOperationalGraph } from './graphUtils';

/**
 * Computes network resilience metrics using Tarjan's bridge & articulation point algorithm,
 * pairwise connectivity reliability, and blast radius analysis.
 */
export function analyzeResilience(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): ResilienceReport {
  const { validNodes, validEdges, adjacency } = getOperationalGraph(nodes, edges);
  const nodeIds = validNodes.map((n) => n.id);
  const n = nodeIds.length;

  if (n <= 1) {
    return {
      articulationPoints: [],
      bridges: [],
      reliabilityScore: 100,
      totalPairs: 0,
      connectedPairs: 0,
      blastRadiusMap: {},
    };
  }

  // Tarjan's Articulation Points & Bridges
  let timer = 0;
  const tin = new Map<string, number>();
  const low = new Map<string, number>();
  const visited = new Set<string>();
  const articulationPointsSet = new Set<string>();
  const bridgesList: Array<{ u: string; v: string; edgeId: string }> = [];

  function dfs(u: string, parentEdgeId: string | null) {
    visited.add(u);
    timer++;
    tin.set(u, timer);
    low.set(u, timer);
    let children = 0;

    const neighbors = adjacency.get(u) || [];
    for (const { neighborId: v, edge } of neighbors) {
      if (edge.id === parentEdgeId) continue;

      if (visited.has(v)) {
        low.set(u, Math.min(low.get(u)!, tin.get(v)!));
      } else {
        children++;
        dfs(v, edge.id);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        // Articulation point condition for non-root
        if (parentEdgeId !== null && low.get(v)! >= tin.get(u)!) {
          articulationPointsSet.add(u);
        }

        // Bridge condition
        if (low.get(v)! > tin.get(u)!) {
          bridgesList.push({ u, v, edgeId: edge.id });
        }
      }
    }

    // Root is articulation point if it has > 1 child in DFS tree
    if (parentEdgeId === null && children > 1) {
      articulationPointsSet.add(u);
    }
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, null);
    }
  }

  // Calculate pairwise connectivity (Reliability Score)
  const connectedComponents: string[][] = [];
  const compVisited = new Set<string>();

  for (const nodeId of nodeIds) {
    if (!compVisited.has(nodeId)) {
      const comp: string[] = [];
      const q = [nodeId];
      compVisited.add(nodeId);

      while (q.length > 0) {
        const curr = q.shift()!;
        comp.push(curr);
        for (const { neighborId } of adjacency.get(curr) || []) {
          if (!compVisited.has(neighborId)) {
            compVisited.add(neighborId);
            q.push(neighborId);
          }
        }
      }
      connectedComponents.push(comp);
    }
  }

  const totalPairs = (n * (n - 1)) / 2;
  let connectedPairs = 0;
  for (const comp of connectedComponents) {
    const size = comp.length;
    connectedPairs += (size * (size - 1)) / 2;
  }

  const reliabilityScore =
    totalPairs > 0 ? Number(((connectedPairs / totalPairs) * 100).toFixed(1)) : 100;

  // Blast Radius Map: For each node X, what nodes lose connectivity if X is removed?
  const blastRadiusMap: Record<string, string[]> = {};

  for (const targetNode of validNodes) {
    const remainingNodes = validNodes.filter((n) => n.id !== targetNode.id);
    const subAdjacency = new Map<string, string[]>();
    for (const rn of remainingNodes) {
      subAdjacency.set(rn.id, []);
    }

    for (const e of validEdges) {
      if (e.u !== targetNode.id && e.v !== targetNode.id) {
        subAdjacency.get(e.u)?.push(e.v);
        subAdjacency.get(e.v)?.push(e.u);
      }
    }

    // Check connectivity from the first surviving node (or an 'Internet' / Gateway node if exists)
    const referenceNode =
      remainingNodes.find((n) => n.type === 'Internet') || remainingNodes[0];

    if (!referenceNode) {
      blastRadiusMap[targetNode.id] = [];
      continue;
    }

    const reachable = new Set<string>([referenceNode.id]);
    const q = [referenceNode.id];
    while (q.length > 0) {
      const curr = q.shift()!;
      for (const nxt of subAdjacency.get(curr) || []) {
        if (!reachable.has(nxt)) {
          reachable.add(nxt);
          q.push(nxt);
        }
      }
    }

    // Disconnected nodes
    const isolated = remainingNodes
      .filter((n) => !reachable.has(n.id))
      .map((n) => n.id);

    blastRadiusMap[targetNode.id] = isolated;
  }

  return {
    articulationPoints: Array.from(articulationPointsSet),
    bridges: bridgesList,
    reliabilityScore,
    totalPairs,
    connectedPairs,
    blastRadiusMap,
  };
}
