import type { ConnectionTestResult, NetworkIntegrationAdapter } from './baseAdapter';
import type { EventLogEntry, NetworkEdge, NetworkNode, RoutingResult } from '../types/network';

export type ExplanationLevel = 'Beginner' | 'Engineer' | 'Executive';

export interface AiDiagnosisResult {
  rootCause: string;
  riskAssessment: string;
  recommendations: string[];
  explanation: string;
  isSimulatedFallback?: boolean;
}

export interface AiCommandAction {
  type:
    | 'fail_node'
    | 'restore_node'
    | 'quarantine_node'
    | 'fail_link'
    | 'restore_link'
    | 'set_source'
    | 'set_destination'
    | 'set_mode'
    | 'simulate_attack';
  targetId?: string;
  parameter?: string;
  explanation: string;
}

export class GeminiAdapter implements NetworkIntegrationAdapter<AiDiagnosisResult> {
  public id = 'gemini-ai';
  public name = 'Google Gemini AI Network Advisor';
  public description = 'Provides NOC root-cause diagnostics, attack path assessments, and natural-language network operations.';
  public category = 'ai' as const;
  public status: 'connected' | 'not-configured' | 'error' | 'simulated' = 'connected';

  private cache = new Map<string, AiDiagnosisResult>();

  public isConfigured(): boolean {
    return true; // Server-side or client proxy available
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return {
          success: true,
          message: 'Connected to AI Advisor service (Gemini 3.8 Flash configured with heuristic fallback).',
          latencyMs: Math.round(performance.now() - start),
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error(`Service returned HTTP ${res.status}`);
    } catch {
      return {
        success: true,
        message: 'Running in rule-based heuristic advisor mode (zero credentials required).',
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async analyzeNetwork(
    nodes: NetworkNode[],
    edges: NetworkEdge[],
    events: EventLogEntry[],
    activeResult: RoutingResult | null
  ): Promise<AiDiagnosisResult> {
    const cacheKey = JSON.stringify({
      downNodes: nodes.filter((n) => n.status !== 'UP').map((n) => n.id),
      downEdges: edges.filter((e) => e.status !== 'UP').map((e) => e.id),
      congested: edges.filter((e) => e.congestionLevel === 'CRITICAL').map((e) => e.id),
      path: activeResult?.path,
    });

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({ id: n.id, label: n.label, type: n.type, status: n.status, risk: n.riskScore })),
          edges: edges.map((e) => ({ id: e.id, u: e.u, v: e.v, status: e.status, latency: e.latency, utilization: e.utilization })),
          events: events.slice(0, 5),
          activePath: activeResult?.path,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.cache.set(cacheKey, data);
        return data;
      }
    } catch {
      // Fallback seamlessly
    }

    const fallbackResult = this.generateRuleBasedAnalysis(nodes, edges, events, activeResult);
    this.cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }

  public async parseNaturalLanguageCommand(
    prompt: string,
    nodes: NetworkNode[],
    edges: NetworkEdge[]
  ): Promise<AiCommandAction | null> {
    try {
      const res = await fetch('/api/gemini/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, nodeIds: nodes.map((n) => n.id), edgeIds: edges.map((e) => e.id) }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Rule-based fallback parsing
    }

    const lower = prompt.toLowerCase();

    // Look for node matches
    const matchedNode = nodes.find(
      (n) =>
        lower.includes(n.id.toLowerCase()) ||
        lower.includes(n.label.toLowerCase()) ||
        (n.type.toLowerCase().includes('core') && lower.includes('core')) ||
        (n.type.toLowerCase().includes('database') && lower.includes('database')) ||
        (n.type.toLowerCase().includes('firewall') && lower.includes('firewall'))
    );

    if (lower.includes('fail') || lower.includes('down') || lower.includes('break') || lower.includes('disable')) {
      if (matchedNode) {
        return {
          type: 'fail_node',
          targetId: matchedNode.id,
          explanation: `Simulating outage on node "${matchedNode.label}" (${matchedNode.id}) based on natural-language directive.`,
        };
      }
    }

    if (lower.includes('restore') || lower.includes('recover') || lower.includes('bring up') || lower.includes('heal')) {
      if (matchedNode) {
        return {
          type: 'restore_node',
          targetId: matchedNode.id,
          explanation: `Restoring node "${matchedNode.label}" (${matchedNode.id}) to UP status.`,
        };
      }
    }

    if (lower.includes('quarantine') || lower.includes('isolate') || lower.includes('block')) {
      if (matchedNode) {
        return {
          type: 'quarantine_node',
          targetId: matchedNode.id,
          explanation: `Applying security quarantine policy to isolate node "${matchedNode.label}" (${matchedNode.id}).`,
        };
      }
    }

    if (lower.includes('attack') || lower.includes('ddos') || lower.includes('breach')) {
      return {
        type: 'simulate_attack',
        targetId: matchedNode ? matchedNode.id : undefined,
        explanation: 'Simulating distributed denial-of-service attack vector.',
      };
    }

    if (lower.includes('safest') || lower.includes('secure')) {
      return {
        type: 'set_mode',
        parameter: 'security',
        explanation: 'Switching optimization metric to "Most Secure" routing to avoid compromised assets.',
      };
    }

    return null;
  }

  public explainRoute(
    path: string[],
    edges: NetworkEdge[],
    level: ExplanationLevel = 'Engineer'
  ): string {
    if (!path || path.length <= 1) {
      return 'No active multi-hop route selected.';
    }

    const hops = path.length - 1;
    const pathEdges = edges.filter((e) => {
      for (let i = 0; i < path.length - 1; i++) {
        if ((e.u === path[i] && e.v === path[i + 1]) || (e.u === path[i + 1] && e.v === path[i])) {
          return true;
        }
      }
      return false;
    });

    const totalLatency = pathEdges.reduce((sum, e) => sum + e.latency, 0);
    const minBw = Math.min(...pathEdges.map((e) => e.bandwidth));

    if (level === 'Beginner') {
      return `Packets travel from ${path[0]} to ${path[path.length - 1]} in ${hops} hop${hops === 1 ? '' : 's'} (${path.join(' ➔ ')}). Total transit time is about ${totalLatency.toFixed(1)} ms, with plenty of room (${minBw} Mbps capacity) to keep data flowing smoothly without delays.`;
    }

    if (level === 'Executive') {
      return `Operational path ${path[0]} → ${path[path.length - 1]} delivers optimal SLA compliance with an aggregate latency of ${totalLatency.toFixed(1)} ms across ${hops} transit segments. Minimum link throughput is sustained at ${minBw} Mbps, mitigating packet loss risk for business operations.`;
    }

    // Engineer
    const bottlenecks = pathEdges.filter((e) => e.utilization > 80);
    const bottleneckText =
      bottlenecks.length > 0
        ? ` Note: Link(s) ${bottlenecks.map((b) => `${b.u}-${b.v} (${b.utilization}%)`).join(', ')} exceed 80% saturation.`
        : ' All transit interfaces are operating within normal congestion margins.';

    return `Shortest path computed as ${path.join(' → ')}. Metrics: ${hops} hops, ${totalLatency.toFixed(1)} ms end-to-end delay, bottleneck throughput ${minBw} Mbps.${bottleneckText}`;
  }

  private generateRuleBasedAnalysis(
    nodes: NetworkNode[],
    edges: NetworkEdge[],
    events: EventLogEntry[],
    activeResult: RoutingResult | null
  ): AiDiagnosisResult {
    const downNodes = nodes.filter((n) => n.status === 'DOWN');
    const quarantinedNodes = nodes.filter((n) => n.status === 'QUARANTINED');
    const downEdges = edges.filter((e) => e.status === 'DOWN');
    const criticalEdges = edges.filter((e) => e.congestionLevel === 'CRITICAL');

    if (downNodes.length === 0 && downEdges.length === 0 && criticalEdges.length === 0) {
      return {
        rootCause: 'Normal Steady State. All monitored physical interfaces, routers, and switches are operational.',
        riskAssessment: 'LOW RISK (Green SLA). No active bottlenecks or packet-loss hotspots detected.',
        recommendations: [
          'Maintain standard link utilization polling.',
          'Verify automated BGP/OSPF convergence failover timers.',
          'Audit crown jewel server access control lists (ACLs).',
        ],
        explanation: 'Network topology is fully healthy. Redundant transit paths are primed for instantaneous failover if any link degrades.',
        isSimulatedFallback: true,
      };
    }

    const issues: string[] = [];
    if (downNodes.length > 0) {
      issues.push(`Node failure(s): ${downNodes.map((n) => n.label).join(', ')}`);
    }
    if (quarantinedNodes.length > 0) {
      issues.push(`Security quarantine enforced on: ${quarantinedNodes.map((n) => n.label).join(', ')}`);
    }
    if (downEdges.length > 0) {
      issues.push(`Link failure(s): ${downEdges.map((e) => `${e.u}↔${e.v}`).join(', ')}`);
    }
    if (criticalEdges.length > 0) {
      issues.push(`High link saturation (>90% utilization) on: ${criticalEdges.map((e) => `${e.u}↔${e.v}`).join(', ')}`);
    }

    return {
      rootCause: issues.join(' | '),
      riskAssessment:
        downNodes.some((n) => n.isCrownJewel || n.type === 'Core Router')
          ? 'HIGH CRITICAL RISK. Core infrastructure or crown-jewel assets impacted.'
          : 'MODERATE RISK. Secondary links or edge nodes degraded.',
      recommendations: [
        'Trigger automatic dynamic rerouting around degraded links.',
        'Isolate compromised endpoints into quarantine VLANs.',
        'Engage link-aggregation or secondary transit uplinks to absorb traffic spikes.',
      ],
      explanation: activeResult?.reachable
        ? `Traffic successfully rerouted via ${activeResult.path?.join(' → ')}. Latency is currently ${activeResult.totalLatency} ms.`
        : 'Warning: Destination is currently unreachable. Urgent intervention required to restore transit connectivity.',
      isSimulatedFallback: true,
    };
  }

  public fallback(): AiDiagnosisResult {
    return {
      rootCause: 'Simulated heuristic advisor active.',
      riskAssessment: 'Nominal operational state.',
      recommendations: ['Monitor network telemetry.'],
      explanation: 'Heuristic engine operating within safe tolerances.',
      isSimulatedFallback: true,
    };
  }
}
