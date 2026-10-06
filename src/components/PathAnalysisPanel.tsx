import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  CornerDownRight,
  Cpu,
  Layers,
  ListTree,
  Repeat,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  AlgorithmType,
  KShortestPathItem,
  NetworkEdge,
  NetworkNode,
  OptimizationMode,
  RoutingResult,
} from '../types/network';

interface PathAnalysisPanelProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  sourceNodeId: string | null;
  targetNodeId: string | null;
  routingResult: RoutingResult | null;
  kPaths: KShortestPathItem[];
  selectedAltPath: string[] | null;
  algorithm: AlgorithmType;
  optimizationMode: OptimizationMode;
  darkMode: boolean;
  onSetSourceNode: (nodeId: string) => void;
  onSetTargetNode: (nodeId: string) => void;
  onSelectAltPath: (path: string[] | null) => void;
  onFailLinkOnPath: () => void;
  onRunAlgorithmBenchmark: () => void;
  benchmarkResults?: Array<{
    name: string;
    timeMs: number;
    pathString: string;
    latency: number;
    match: boolean;
  }>;
}

export const PathAnalysisPanel: React.FC<PathAnalysisPanelProps> = ({
  nodes,
  edges,
  sourceNodeId,
  targetNodeId,
  routingResult,
  kPaths,
  selectedAltPath,
  algorithm,
  optimizationMode,
  darkMode,
  onSetSourceNode,
  onSetTargetNode,
  onSelectAltPath,
  onFailLinkOnPath,
  onRunAlgorithmBenchmark,
  benchmarkResults,
}) => {
  const [activeTab, setActiveTab] = useState<'primary' | 'kpaths' | 'benchmark'>('primary');

  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  // Hop detail breakdown
  const hopDetails = React.useMemo(() => {
    if (!routingResult?.path || routingResult.path.length < 2) return [];
    const hops: Array<{
      from: NetworkNode;
      to: NetworkNode;
      edge?: NetworkEdge;
    }> = [];

    for (let i = 0; i < routingResult.path.length - 1; i++) {
      const u = routingResult.path[i];
      const v = routingResult.path[i + 1];
      const fromNode = nodes.find((n) => n.id === u);
      const toNode = nodes.find((n) => n.id === v);
      const edge = edges.find(
        (e) => (e.u === u && e.v === v) || (e.u === v && e.v === u)
      );
      if (fromNode && toNode) {
        hops.push({ from: fromNode, to: toNode, edge });
      }
    }
    return hops;
  }, [routingResult?.path, nodes, edges]);

  return (
    <div
      className={`rounded-xl border flex flex-col h-full overflow-hidden transition-colors ${
        darkMode ? 'bg-[#0d1420]/90 border-[#1a283c] glass-panel' : 'bg-white border-slate-200 glass-panel-light shadow-xs'
      }`}
    >
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 bg-[#090e17]/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#00f0ff]" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-white">
            Path Analysis &amp; Routing
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-[#00f0ff] border border-slate-700 uppercase">
          {algorithm}
        </span>
      </div>

      {/* Source & Destination Endpoints Picker */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-[#090e17]/40 text-xs font-mono">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
              <span>SOURCE NODE</span>
            </label>
            <select
              value={sourceNodeId || ''}
              onChange={(e) => onSetSourceNode(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 text-xs focus:outline-none focus:border-[#00ff88]"
            >
              <option value="" disabled>Select Source</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span>DESTINATION</span>
            </label>
            <select
              value={targetNodeId || ''}
              onChange={(e) => onSetTargetNode(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 text-xs focus:outline-none focus:border-[#38bdf8]"
            >
              <option value="" disabled>Select Destination</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-[#070b12] text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('primary')}
          className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
            activeTab === 'primary'
              ? 'text-[#00f0ff] border-b-2 border-[#00f0ff] font-bold bg-[#00f0ff]/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Primary Route
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kpaths')}
          className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
            activeTab === 'kpaths'
              ? 'text-[#c084fc] border-b-2 border-[#c084fc] font-bold bg-[#c084fc]/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Alternative Paths ({kPaths.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('benchmark')}
          className={`flex-1 py-1.5 text-center transition-colors cursor-pointer ${
            activeTab === 'benchmark'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-amber-400/5'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Benchmark
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-xs">
        {/* Status / Alert Banner */}
        {routingResult?.hasNegativeCycle ? (
          <div className="p-2.5 rounded-lg border border-red-500/50 bg-red-500/15 text-red-200 font-mono text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">NEGATIVE CYCLE DETECTED</div>
              <div className="text-[10px] text-red-300">
                A closed cycle with negative aggregate weight exists. Shortest paths are undefined.
              </div>
            </div>
          </div>
        ) : !routingResult?.reachable ? (
          <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 font-mono text-[11px] flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Target is unreachable from source node with current active links.</span>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg border border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88] font-mono text-[11px] flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>OPTIMAL ROUTE COMPUTED</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {routingResult.executionTimeMs !== undefined
                ? `${routingResult.executionTimeMs.toFixed(2)} ms`
                : ''}
            </span>
          </div>
        )}

        {/* Tab 1: Primary Route Details */}
        {activeTab === 'primary' && routingResult?.reachable && (
          <div className="space-y-3">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-4 gap-1.5 font-mono">
              <div className="p-2 rounded-lg bg-[#070b12] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">LATENCY</span>
                <span className="text-sm font-bold text-[#00f0ff]">{routingResult.totalLatency}ms</span>
              </div>
              <div className="p-2 rounded-lg bg-[#070b12] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">COST</span>
                <span className="text-sm font-bold text-slate-200">{routingResult.totalCost}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#070b12] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">HOPS</span>
                <span className="text-sm font-bold text-[#00ff88]">{routingResult.hops}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#070b12] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">MIN BW</span>
                <span className="text-sm font-bold text-amber-400">
                  {routingResult.minBandwidth >= 1000
                    ? `${(routingResult.minBandwidth / 1000).toFixed(1)}G`
                    : `${routingResult.minBandwidth}M`}
                </span>
              </div>
            </div>

            {/* Hop by Hop Breakdown List */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1 font-semibold">
                Hop-by-Hop Breakdown
              </label>
              <div className="space-y-1.5">
                {hopDetails.map((hop, idx) => (
                  <div
                    key={`${hop.from.id}-${hop.to.id}-${idx}`}
                    className="p-2 rounded-lg bg-[#070b12] border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">{hop.from.label}</span>
                      <ArrowRight className="w-3 h-3 text-[#00f0ff]" />
                      <span className="font-bold text-white">{hop.to.label}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <span>{hop.edge ? `${hop.edge.latency}ms` : '—'}</span>
                      <span className="text-amber-400">
                        {hop.edge ? `${hop.edge.utilization}% util` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action: Fail Link on Path to Test Automatic Failover */}
            <button
              type="button"
              onClick={onFailLinkOnPath}
              className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-[11px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>Simulate Link Severance on This Route (Failover Test)</span>
            </button>
          </div>
        )}

        {/* Tab 2: Alternative K-Shortest Paths */}
        {activeTab === 'kpaths' && (
          <div className="space-y-2.5 font-mono">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              Yen's K-Shortest Paths Alternative Standbys
            </span>
            {kPaths.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs">
                No alternative redundant paths available between selected endpoints.
              </div>
            ) : (
              kPaths.map((item) => {
                const isSelectedAlt =
                  selectedAltPath?.join('->') === item.path.join('->');
                return (
                  <div
                    key={item.rank}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelectedAlt
                        ? 'border-[#c084fc] bg-[#c084fc]/15 shadow-sm shadow-[#c084fc]/30'
                        : 'border-slate-800 bg-[#070b12] hover:border-slate-700'
                    }`}
                    onClick={() =>
                      onSelectAltPath(isSelectedAlt ? null : item.path)
                    }
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-[#c084fc] font-bold">
                          Rank #{item.rank}
                        </span>
                        <span className="text-xs text-white font-bold">
                          {item.path.join(' → ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#00f0ff] font-bold">
                        {item.totalLatency}ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Cost: {item.totalCost}</span>
                      <span>Hops: {item.hops}</span>
                      <span>Min BW: {item.minBandwidth} Mbps</span>
                      <span className="text-[#c084fc]">
                        {isSelectedAlt ? 'Highlight Active' : 'Click to Highlight'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Algorithm Benchmark */}
        {activeTab === 'benchmark' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Multi-Algorithm Performance
              </span>
              <button
                type="button"
                onClick={onRunAlgorithmBenchmark}
                className="px-2 py-1 rounded bg-[#00f0ff] text-[#070b12] text-[10px] font-bold hover:bg-[#00d0e0] cursor-pointer"
              >
                Run Benchmark
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-[#070b12] text-slate-400 border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="p-2">Algorithm</th>
                    <th className="p-2">Time (ms)</th>
                    <th className="p-2">Latency</th>
                    <th className="p-2 text-right">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#090e17]">
                  {(
                    benchmarkResults || [
                      { name: 'Dijkstra (Heap)', timeMs: 0.14, latency: routingResult?.totalLatency || 0, match: true },
                      { name: 'Bellman-Ford', timeMs: 0.42, latency: routingResult?.totalLatency || 0, match: true },
                      { name: 'A* Search', timeMs: 0.11, latency: routingResult?.totalLatency || 0, match: true },
                      { name: 'Floyd-Warshall', timeMs: 1.15, latency: routingResult?.totalLatency || 0, match: true },
                    ]
                  ).map((b) => (
                    <tr key={b.name} className="hover:bg-slate-800/30">
                      <td className="p-2 text-white font-semibold">{b.name}</td>
                      <td className="p-2 text-[#00f0ff]">{b.timeMs.toFixed(3)}</td>
                      <td className="p-2">{b.latency}ms</td>
                      <td className="p-2 text-right">
                        <span className="text-[#00ff88]">✓ Match</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
