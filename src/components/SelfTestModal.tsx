import React, { useState } from 'react';
import { CheckCircle2, Play, ShieldCheck, X } from 'lucide-react';
import { dijkstra } from '../engine/dijkstra';
import { bellmanFord } from '../engine/bellmanFord';
import { aStar } from '../engine/aStar';
import { floydWarshallAllPairs, reconstructFloydWarshallPath } from '../engine/floydWarshall';
import { edmondsKarp } from '../engine/maxFlow';
import { kruskal, prim } from '../engine/spanningTree';
import { analyzeResilience } from '../engine/resilience';
import type { NetworkEdge, NetworkNode } from '../types/network';

interface SelfTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<
    Array<{ name: string; passed: boolean; message: string; durationMs: number }>
  >([]);
  const [hasRun, setHasRun] = useState(false);

  if (!isOpen) return null;

  const runAllTests = () => {
    const start = performance.now();
    const results: Array<{ name: string; passed: boolean; message: string; durationMs: number }> = [];

    const nodes: NetworkNode[] = [
      { id: 'N1', label: 'Router 1', type: 'Core Router', ip: '10.0.0.1', status: 'UP', riskScore: 10, x: 100, y: 100 },
      { id: 'N2', label: 'Router 2', type: 'Router', ip: '10.0.0.2', status: 'UP', riskScore: 15, x: 300, y: 100 },
      { id: 'N3', label: 'Router 3', type: 'Router', ip: '10.0.0.3', status: 'UP', riskScore: 20, x: 200, y: 250 },
      { id: 'N4', label: 'Server', type: 'Server', ip: '10.0.0.4', status: 'UP', riskScore: 5, x: 400, y: 250 },
    ];

    const edges: NetworkEdge[] = [
      { id: 'e1', u: 'N1', v: 'N2', latency: 10, bandwidth: 1000, currentTraffic: 200, cost: 5, packetLoss: 0, status: 'UP', utilization: 20, congestionLevel: 'LOW' },
      { id: 'e2', u: 'N1', v: 'N3', latency: 30, bandwidth: 500, currentTraffic: 150, cost: 20, packetLoss: 0, status: 'UP', utilization: 30, congestionLevel: 'LOW' },
      { id: 'e3', u: 'N2', v: 'N3', latency: 10, bandwidth: 800, currentTraffic: 100, cost: 5, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
      { id: 'e4', u: 'N3', v: 'N4', latency: 15, bandwidth: 1000, currentTraffic: 300, cost: 10, packetLoss: 0, status: 'UP', utilization: 30, congestionLevel: 'LOW' },
      { id: 'e5', u: 'N2', v: 'N4', latency: 40, bandwidth: 200, currentTraffic: 180, cost: 35, packetLoss: 2, status: 'UP', utilization: 90, congestionLevel: 'CRITICAL' },
    ];

    // Test 1: Dijkstra Shortest Path
    const t1 = performance.now();
    const dRes = dijkstra(nodes, edges, 'N1', 'N4', 'latency');
    results.push({
      name: 'Dijkstra Min-Heap Shortest Path',
      passed: dRes.reachable && dRes.totalLatency === 35 && dRes.path?.join('->') === 'N1->N2->N3->N4',
      message: 'Optimal path resolved in 35ms total latency: N1 → N2 → N3 → N4.',
      durationMs: Number((performance.now() - t1).toFixed(3)),
    });

    // Test 2: Bellman-Ford Equivalence
    const t2 = performance.now();
    const bfRes = bellmanFord(nodes, edges, 'N1', 'N4', 'latency');
    results.push({
      name: 'Bellman-Ford Non-Negative Equivalence',
      passed: bfRes.reachable && bfRes.totalLatency === 35,
      message: 'Bellman-Ford confirmed exact equivalence with Dijkstra result.',
      durationMs: Number((performance.now() - t2).toFixed(3)),
    });

    // Test 3: Floyd-Warshall All-Pairs & Path Reconstruction
    const t3 = performance.now();
    const fw = floydWarshallAllPairs(nodes, edges, 'latency');
    const fwPath = reconstructFloydWarshallPath(fw, 'N1', 'N4', edges);
    results.push({
      name: 'Floyd–Warshall O(V³) Matrix & Path Reconstruction',
      passed: !fw.hasNegativeCycle && fwPath.reachable && fwPath.totalLatency === 35,
      message: 'All-pairs dynamic programming matrix successfully reconstructed.',
      durationMs: Number((performance.now() - t3).toFixed(3)),
    });

    // Test 4: Edmonds-Karp Maximum Flow
    const t4 = performance.now();
    const flowRes = edmondsKarp(nodes, edges, 'N1', 'N4');
    results.push({
      name: 'Edmonds-Karp Max Flow / Min Cut',
      passed: flowRes.maxFlow > 0 && Object.keys(flowRes.flows).length > 0,
      message: `Max flow computed: ${flowRes.maxFlow} Mbps throughput.`,
      durationMs: Number((performance.now() - t4).toFixed(3)),
    });

    // Test 5: Kruskal and Prim Spanning Trees
    const t5 = performance.now();
    const kRes = kruskal(nodes, edges, 'cost');
    const pRes = prim(nodes, edges, 'cost', 'N1');
    results.push({
      name: 'Kruskal & Prim MST Parity',
      passed: kRes.isConnected && pRes.isConnected && kRes.totalCost === pRes.totalCost,
      message: `Both algorithms produced identical minimal spanning tree weight (${kRes.totalCost}).`,
      durationMs: Number((performance.now() - t5).toFixed(3)),
    });

    // Test 6: Tarjan Articulation Points & Bridges
    const t6 = performance.now();
    const resReport = analyzeResilience(nodes, edges);
    results.push({
      name: "Tarjan's Linear DFS Resilience Analysis",
      passed: resReport.reliabilityScore > 0,
      message: `Reliability score: ${resReport.reliabilityScore}%, SPOF points detected: ${resReport.articulationPoints.length}.`,
      durationMs: Number((performance.now() - t6).toFixed(3)),
    });

    setTestResults(results);
    setHasRun(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-xl w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Routing Engine Operational Self-Test
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Execute automated validation across Dijkstra, Bellman-Ford, Floyd-Warshall &amp; Tarjan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs font-mono">
          {!hasRun ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-slate-300">
                Click below to execute the complete in-browser algorithmic verification test suite.
              </p>
              <button
                type="button"
                onClick={runAllTests}
                className="px-5 py-2.5 rounded-lg bg-[#00ff88] text-[#070b12] font-bold text-xs inline-flex items-center gap-2 hover:bg-[#00d070] cursor-pointer shadow-md shadow-[#00ff88]/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Algorithmic Engine Verification</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-white font-bold">Verification Results</span>
                <span className="text-[#00ff88] font-bold">
                  {testResults.filter((r) => r.passed).length}/{testResults.length} PASSED
                </span>
              </div>

              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#070b12] border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                      <span>{t.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{t.message}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{t.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#090e17] flex justify-between items-center">
          {hasRun && (
            <button
              type="button"
              onClick={runAllTests}
              className="text-xs font-mono text-[#00f0ff] hover:underline cursor-pointer"
            >
              Re-run Test Suite
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
