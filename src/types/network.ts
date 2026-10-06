export type NodeType =
  | 'Internet'
  | 'Firewall'
  | 'Core Router'
  | 'Router'
  | 'Switch'
  | 'PC'
  | 'Server'
  | 'Database'
  | 'ISP';

export type NodeStatus = 'UP' | 'DOWN' | 'QUARANTINED';

export type EdgeStatus = 'UP' | 'DOWN';

export type CongestionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  ip: string;
  status: NodeStatus;
  riskScore: number; // 0 - 100
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  isCrownJewel?: boolean;
}

export interface NetworkEdge {
  id: string;
  u: string;
  v: string;
  latency: number; // ms
  bandwidth: number; // Mbps
  currentTraffic: number; // Mbps
  cost: number;
  packetLoss: number; // %
  status: EdgeStatus;
  utilization: number; // % (currentTraffic / bandwidth * 100)
  congestionLevel: CongestionLevel;
}

export type OptimizationMode =
  | 'cost'
  | 'latency'
  | 'bandwidth'
  | 'congestion'
  | 'balanced'
  | 'security';

export interface BalancedWeights {
  costWeight: number; // 0 - 1
  latencyWeight: number; // 0 - 1
  congestionWeight: number; // 0 - 1
  securityWeight: number; // 0 - 1
}

export type AlgorithmType =
  | 'dijkstra'
  | 'bellman-ford'
  | 'floyd-warshall'
  | 'a-star'
  | 'kruskal'
  | 'prim'
  | 'edmonds-karp';

export interface RoutingResult {
  path: string[] | null;
  totalCost: number;
  totalLatency: number;
  minBandwidth: number;
  hops: number;
  visitedOrder: string[];
  reachable: boolean;
  executionTimeMs?: number;
  error?: string;
  warning?: string;
  hasNegativeCycle?: boolean;
}

export interface AlgorithmStep {
  stepNumber: number;
  currentNode: string | null;
  visitedNodes: string[];
  frontierNodes: string[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  description: string;
}

export interface KShortestPathItem {
  rank: number;
  path: string[];
  totalCost: number;
  totalLatency: number;
  minBandwidth: number;
  hops: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  type: 'info' | 'warning' | 'alert' | 'attack' | 'recovery';
  source: string;
  message: string;
  details?: string;
}

export interface NetworkMetricsSnapshot {
  timestamp: number;
  timeLabel: string;
  activePathLatency: number;
  totalTrafficMbps: number;
  averagePacketLoss: number;
  averageUtilization: number;
  healthScore: number;
  activeNodes: number;
  failedNodes: number;
  congestedLinks: number;
  reliabilityScore: number;
}

export interface ResilienceReport {
  articulationPoints: string[]; // Critical single points of failure (nodes)
  bridges: Array<{ u: string; v: string; edgeId: string }>; // Critical single links
  reliabilityScore: number; // 0 - 100 %
  totalPairs: number;
  connectedPairs: number;
  blastRadiusMap: Record<string, string[]>; // Map of node -> nodes that lose connectivity if removed
}

export interface MaxFlowResult {
  maxFlow: number;
  flows: Record<string, number>; // edgeId -> flow
  bottlenecks: string[]; // edgeIds in the minimum cut
  residualCapacities: Record<string, number>;
}

export interface TopologyData {
  name: string;
  description: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}
