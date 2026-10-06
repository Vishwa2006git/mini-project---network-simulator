import type {
  BalancedWeights,
  NetworkEdge,
  NetworkNode,
  OptimizationMode,
  RoutingResult,
} from '../types/network';

export const DEFAULT_BALANCED_WEIGHTS: BalancedWeights = {
  costWeight: 0.25,
  latencyWeight: 0.35,
  congestionWeight: 0.25,
  securityWeight: 0.15,
};

/**
 * Calculates effective routing weight for an edge based on the chosen optimization mode.
 */
export function calculateEdgeWeight(
  edge: NetworkEdge,
  targetNode: NetworkNode | undefined,
  mode: OptimizationMode,
  balancedWeights: BalancedWeights = DEFAULT_BALANCED_WEIGHTS
): number {
  if (edge.status === 'DOWN') return Infinity;
  if (targetNode && (targetNode.status === 'DOWN' || targetNode.status === 'QUARANTINED')) {
    return Infinity;
  }

  const baseCost = edge.cost;
  const baseLatency = edge.latency;
  const bandwidthScore = 10000 / Math.max(1, edge.bandwidth);
  const congestionPenalty = Math.max(0, edge.utilization);
  const nodeRiskPenalty = targetNode ? targetNode.riskScore * 2 : 0;

  switch (mode) {
    case 'cost':
      return baseCost;

    case 'latency':
      return baseLatency;

    case 'bandwidth':
      // Lower weight means higher bandwidth preference
      return bandwidthScore;

    case 'congestion':
      // Highly congested or lossy links get penalized heavily
      return (
        baseLatency * (1 + congestionPenalty / 40) +
        Math.max(0, edge.packetLoss) * 15
      );

    case 'security':
      // Strongly avoid high-risk or compromised nodes
      return baseLatency + baseCost + nodeRiskPenalty * 10;

    case 'balanced': {
      const normalizedCost = baseCost / 10;
      const normalizedLatency = baseLatency / 5;
      const normalizedCongestion = (congestionPenalty / 20) + (edge.packetLoss * 2);
      const normalizedSecurity = nodeRiskPenalty / 10;

      return (
        normalizedCost * balancedWeights.costWeight +
        normalizedLatency * balancedWeights.latencyWeight +
        normalizedCongestion * balancedWeights.congestionWeight +
        normalizedSecurity * balancedWeights.securityWeight
      );
    }

    default:
      return baseLatency;
  }
}

/**
 * Filter operational nodes and edges (excluding DOWN or QUARANTINED elements)
 */
export function getOperationalGraph(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): {
  validNodes: NetworkNode[];
  validEdges: NetworkEdge[];
  nodeMap: Map<string, NetworkNode>;
  adjacency: Map<string, Array<{ neighborId: string; edge: NetworkEdge }>>;
} {
  const nodeMap = new Map<string, NetworkNode>();
  const validNodes: NetworkNode[] = [];

  for (const node of nodes) {
    if (node.status === 'UP') {
      validNodes.push(node);
      nodeMap.set(node.id, node);
    }
  }

  const adjacency = new Map<string, Array<{ neighborId: string; edge: NetworkEdge }>>();
  for (const node of validNodes) {
    adjacency.set(node.id, []);
  }

  const validEdges: NetworkEdge[] = [];

  for (const edge of edges) {
    if (edge.status !== 'UP') continue;
    const uNode = nodeMap.get(edge.u);
    const vNode = nodeMap.get(edge.v);

    if (uNode && vNode) {
      validEdges.push(edge);
      adjacency.get(edge.u)?.push({ neighborId: edge.v, edge });
      adjacency.get(edge.v)?.push({ neighborId: edge.u, edge });
    }
  }

  return { validNodes, validEdges, nodeMap, adjacency };
}

/**
 * Computes standard path metrics (cost, latency, min bandwidth, hops) for a list of node IDs.
 */
export function computePathMetrics(
  path: string[],
  edges: NetworkEdge[]
): {
  totalCost: number;
  totalLatency: number;
  minBandwidth: number;
  hops: number;
} {
  if (path.length <= 1) {
    return { totalCost: 0, totalLatency: 0, minBandwidth: 10000, hops: 0 };
  }

  let totalCost = 0;
  let totalLatency = 0;
  let minBandwidth = Infinity;

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];

    const edge = edges.find(
      (e) => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );

    if (edge) {
      totalCost += edge.cost;
      totalLatency += edge.latency;
      minBandwidth = Math.min(minBandwidth, edge.bandwidth);
    }
  }

  return {
    totalCost: Number(totalCost.toFixed(2)),
    totalLatency: Number(totalLatency.toFixed(2)),
    minBandwidth: minBandwidth === Infinity ? 0 : Number(minBandwidth.toFixed(2)),
    hops: Math.max(0, path.length - 1),
  };
}

/**
 * Creates an empty/unreachable RoutingResult
 */
export function createUnreachableResult(
  source: string,
  destination: string,
  reason = 'Destination is unreachable from source.'
): RoutingResult {
  return {
    path: null,
    totalCost: 0,
    totalLatency: 0,
    minBandwidth: 0,
    hops: 0,
    visitedOrder: [source],
    reachable: false,
    error: reason,
  };
}
