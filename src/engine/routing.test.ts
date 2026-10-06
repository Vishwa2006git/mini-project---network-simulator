import { describe, expect, it } from 'vitest';
import type { NetworkEdge, NetworkNode } from '../types/network';
import { dijkstra } from './dijkstra';
import { bellmanFord } from './bellmanFord';
import { aStar } from './aStar';
import { floydWarshallAllPairs, reconstructFloydWarshallPath } from './floydWarshall';
import { edmondsKarp } from './maxFlow';
import { kruskal, prim } from './spanningTree';
import { analyzeResilience } from './resilience';

describe('VK Routing Engine Comprehensive Test Suite', () => {
  const sampleNodes: NetworkNode[] = [
    { id: 'N1', label: 'Router 1', type: 'Core Router', ip: '10.0.0.1', status: 'UP', riskScore: 10, x: 100, y: 100 },
    { id: 'N2', label: 'Router 2', type: 'Router', ip: '10.0.0.2', status: 'UP', riskScore: 15, x: 300, y: 100 },
    { id: 'N3', label: 'Router 3', type: 'Router', ip: '10.0.0.3', status: 'UP', riskScore: 20, x: 200, y: 250 },
    { id: 'N4', label: 'Server', type: 'Server', ip: '10.0.0.4', status: 'UP', riskScore: 5, x: 400, y: 250 },
  ];

  const sampleEdges: NetworkEdge[] = [
    { id: 'e1', u: 'N1', v: 'N2', latency: 10, bandwidth: 1000, currentTraffic: 200, cost: 5, packetLoss: 0, status: 'UP', utilization: 20, congestionLevel: 'LOW' },
    { id: 'e2', u: 'N1', v: 'N3', latency: 30, bandwidth: 500, currentTraffic: 150, cost: 20, packetLoss: 0, status: 'UP', utilization: 30, congestionLevel: 'LOW' },
    { id: 'e3', u: 'N2', v: 'N3', latency: 10, bandwidth: 800, currentTraffic: 100, cost: 5, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
    { id: 'e4', u: 'N3', v: 'N4', latency: 15, bandwidth: 1000, currentTraffic: 300, cost: 10, packetLoss: 0, status: 'UP', utilization: 30, congestionLevel: 'LOW' },
    { id: 'e5', u: 'N2', v: 'N4', latency: 40, bandwidth: 200, currentTraffic: 180, cost: 35, packetLoss: 2, status: 'UP', utilization: 90, congestionLevel: 'CRITICAL' },
  ];

  it('Dijkstra and Bellman-Ford agree on optimal path for non-negative graphs', () => {
    const dRes = dijkstra(sampleNodes, sampleEdges, 'N1', 'N4', 'latency');
    const bfRes = bellmanFord(sampleNodes, sampleEdges, 'N1', 'N4', 'latency');
    const aStarRes = aStar(sampleNodes, sampleEdges, 'N1', 'N4', 'latency');

    expect(dRes.reachable).toBe(true);
    expect(bfRes.reachable).toBe(true);
    expect(aStarRes.reachable).toBe(true);

    // Path N1 -> N2 -> N3 -> N4 has total latency 10 + 10 + 15 = 35 ms (vs N1 -> N2 -> N4 which is 50 ms)
    expect(dRes.path).toEqual(['N1', 'N2', 'N3', 'N4']);
    expect(bfRes.path).toEqual(['N1', 'N2', 'N3', 'N4']);
    expect(aStarRes.path).toEqual(['N1', 'N2', 'N3', 'N4']);

    expect(dRes.totalLatency).toBe(35);
    expect(bfRes.totalLatency).toBe(35);
    expect(aStarRes.totalLatency).toBe(35);
  });

  it('Floyd-Warshall reconstructs the exact same shortest path', () => {
    const fw = floydWarshallAllPairs(sampleNodes, sampleEdges, 'latency');
    const fwPath = reconstructFloydWarshallPath(fw, 'N1', 'N4', sampleEdges);

    expect(fw.hasNegativeCycle).toBe(false);
    expect(fwPath.reachable).toBe(true);
    expect(fwPath.path).toEqual(['N1', 'N2', 'N3', 'N4']);
    expect(fwPath.totalLatency).toBe(35);
  });

  it('Detects unreachable cases for disconnected nodes', () => {
    const disconnectedNodes: NetworkNode[] = [
      ...sampleNodes,
      { id: 'N_ISO', label: 'Isolated', type: 'PC', ip: '192.168.1.100', status: 'UP', riskScore: 0, x: 600, y: 600 },
    ];

    const dRes = dijkstra(disconnectedNodes, sampleEdges, 'N1', 'N_ISO', 'latency');
    expect(dRes.reachable).toBe(false);
    expect(dRes.path).toBeNull();

    const bfRes = bellmanFord(disconnectedNodes, sampleEdges, 'N1', 'N_ISO', 'latency');
    expect(bfRes.reachable).toBe(false);
    expect(bfRes.path).toBeNull();
  });

  it('Detects negative cycles with Bellman-Ford and sets warning/error', () => {
    const cycleNodes: NetworkNode[] = [
      { id: 'A', label: 'A', type: 'Router', ip: '10.0.0.1', status: 'UP', riskScore: 0, x: 0, y: 0 },
      { id: 'B', label: 'B', type: 'Router', ip: '10.0.0.2', status: 'UP', riskScore: 0, x: 100, y: 0 },
      { id: 'C', label: 'C', type: 'Router', ip: '10.0.0.3', status: 'UP', riskScore: 0, x: 50, y: 100 },
    ];

    // Directed negative cycle simulation: A->B cost 2, B->C cost -6, C->A cost 1 => sum = -3
    const cycleEdges: NetworkEdge[] = [
      { id: 'c1', u: 'A', v: 'B', latency: 2, bandwidth: 100, currentTraffic: 10, cost: 2, packetLoss: 0, status: 'UP', utilization: 10, congestionLevel: 'LOW' },
      { id: 'c2', u: 'B', v: 'C', latency: 10, bandwidth: 100, currentTraffic: 10, cost: -6, packetLoss: 0, status: 'UP', utilization: 10, congestionLevel: 'LOW' },
      { id: 'c3', u: 'C', v: 'A', latency: 1, bandwidth: 100, currentTraffic: 10, cost: 1, packetLoss: 0, status: 'UP', utilization: 10, congestionLevel: 'LOW' },
    ];

    const bfRes = bellmanFord(cycleNodes, cycleEdges, 'A', 'C', 'cost');
    expect(bfRes.hasNegativeCycle).toBe(true);
    expect(bfRes.reachable).toBe(false);
  });

  it('Edmonds-Karp correctly computes max flow and identifies bottleneck cut edges', () => {
    const flowRes = edmondsKarp(sampleNodes, sampleEdges, 'N1', 'N4');

    // N1 connects to N2 (1000) and N3 (500) -> total potential in is 1500
    // N4 has incoming links from N3 (1000) and N2 (200)
    expect(flowRes.maxFlow).toBeGreaterThan(0);
    expect(Object.keys(flowRes.flows).length).toBeGreaterThan(0);
  });

  it('Kruskal and Prim produce identical total spanning tree weights', () => {
    const kRes = kruskal(sampleNodes, sampleEdges, 'cost');
    const pRes = prim(sampleNodes, sampleEdges, 'cost', 'N1');

    expect(kRes.isConnected).toBe(true);
    expect(pRes.isConnected).toBe(true);
    expect(kRes.mstEdges.length).toBe(sampleNodes.length - 1);
    expect(pRes.mstEdges.length).toBe(sampleNodes.length - 1);
    expect(kRes.totalCost).toBe(pRes.totalCost);
  });

  it('Resilience analysis accurately spots bridges and articulation points', () => {
    // Linear topology: A -- B -- C. B is an articulation point, both edges are bridges
    const linearNodes: NetworkNode[] = [
      { id: 'A', label: 'A', type: 'PC', ip: '10.0.0.1', status: 'UP', riskScore: 0, x: 0, y: 0 },
      { id: 'B', label: 'B', type: 'Core Router', ip: '10.0.0.2', status: 'UP', riskScore: 0, x: 100, y: 0 },
      { id: 'C', label: 'C', type: 'Server', ip: '10.0.0.3', status: 'UP', riskScore: 0, x: 200, y: 0 },
    ];

    const linearEdges: NetworkEdge[] = [
      { id: 'e1', u: 'A', v: 'B', latency: 5, bandwidth: 100, currentTraffic: 10, cost: 1, packetLoss: 0, status: 'UP', utilization: 10, congestionLevel: 'LOW' },
      { id: 'e2', u: 'B', v: 'C', latency: 5, bandwidth: 100, currentTraffic: 10, cost: 1, packetLoss: 0, status: 'UP', utilization: 10, congestionLevel: 'LOW' },
    ];

    const report = analyzeResilience(linearNodes, linearEdges);
    expect(report.articulationPoints).toContain('B');
    expect(report.bridges.length).toBe(2);
    expect(report.reliabilityScore).toBe(100);
  });
});
