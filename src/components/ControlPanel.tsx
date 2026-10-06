import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  Download,
  FileCode,
  Flame,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import type {
  AlgorithmType,
  BalancedWeights,
  NetworkEdge,
  NetworkNode,
  OptimizationMode,
} from '../types/network';

interface ControlPanelProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  optimizationMode: OptimizationMode;
  balancedWeights: BalancedWeights;
  algorithm: AlgorithmType;
  canUndo: boolean;
  canRedo: boolean;
  darkMode: boolean;
  onSelectPreset: (presetKey: string) => void;
  onSetOptimizationMode: (mode: OptimizationMode) => void;
  onSetBalancedWeights: (weights: BalancedWeights) => void;
  onSetAlgorithm: (alg: AlgorithmType) => void;
  onAddRouter: () => void;
  onStartAddLink: () => void;
  onDeleteSelected: () => void;
  onFailSelectedNode: () => void;
  onRestoreAll: () => void;
  onIncreaseLatency: () => void;
  onIncreaseTraffic: () => void;
  onSimulateDDoS: () => void;
  onRecalculate: () => void;
  onResetNetwork: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onExportCsv: () => void;
  onDownloadPng: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  optimizationMode,
  balancedWeights,
  algorithm,
  canUndo,
  canRedo,
  darkMode,
  onSelectPreset,
  onSetOptimizationMode,
  onSetBalancedWeights,
  onSetAlgorithm,
  onAddRouter,
  onStartAddLink,
  onDeleteSelected,
  onFailSelectedNode,
  onRestoreAll,
  onIncreaseLatency,
  onIncreaseTraffic,
  onSimulateDDoS,
  onRecalculate,
  onResetNetwork,
  onUndo,
  onRedo,
  onExportJson,
  onImportJson,
  onExportCsv,
  onDownloadPng,
}) => {
  const [activeTab, setActiveTab] = useState<'routing' | 'actions' | 'export'>('routing');
  const [showSliders, setShowSliders] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <aside
      className={`rounded-xl border flex flex-col h-full overflow-hidden transition-colors ${
        darkMode ? 'bg-[#0d1420]/90 border-[#1a283c] glass-panel' : 'bg-white border-slate-200 glass-panel-light shadow-xs'
      }`}
    >
      {/* Top tabs */}
      <div className="flex border-b border-slate-800 p-1 gap-1 bg-[#090e17]/60">
        <button
          type="button"
          onClick={() => setActiveTab('routing')}
          className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'routing'
              ? 'bg-[#00f0ff] text-[#070b12] shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Routing
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-[#00f0ff] text-[#070b12] shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Controls
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'export'
              ? 'bg-[#00f0ff] text-[#070b12] shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          I/O
        </button>
      </div>

      <div className="p-3.5 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Preset Topologies Selector */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
            Topology Preset
          </label>
          <select
            onChange={(e) => onSelectPreset(e.target.value)}
            defaultValue="college"
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 font-mono text-xs focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="college">1. College Campus Network (Default)</option>
            <option value="isp">2. ISP National Backbone (Geo coordinates)</option>
            <option value="dual-isp">3. Dual-ISP Campus HA</option>
            <option value="small-office">4. Small Office (Mesh R1-R5)</option>
            <option value="random">5. Random Mesh (Connected Graph)</option>
            <option value="blank">6. Blank Canvas (Build from Scratch)</option>
          </select>
        </div>

        {/* Tab 1: Routing & Algorithms */}
        {activeTab === 'routing' && (
          <div className="space-y-3.5">
            {/* Algorithm Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                Routing Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => onSetAlgorithm(e.target.value as AlgorithmType)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 font-mono text-xs focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="dijkstra">Dijkstra (Min-Heap Priority Queue)</option>
                <option value="bellman-ford">Bellman-Ford (Detects Negative Cycles)</option>
                <option value="a-star">A* Search (Euclidean Admissible Heuristic)</option>
                <option value="floyd-warshall">Floyd–Warshall (All-Pairs O(V³))</option>
                <option value="kruskal">Kruskal MST (Disjoint Set Union)</option>
                <option value="prim">Prim MST (Growing Tree)</option>
                <option value="edmonds-karp">Edmonds-Karp (Max Flow / Min Cut)</option>
              </select>
            </div>

            {/* Optimization Objective */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Optimization Metric
                </label>
                {optimizationMode === 'balanced' && (
                  <button
                    type="button"
                    onClick={() => setShowSliders(!showSliders)}
                    className="text-[10px] font-mono text-[#00f0ff] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Sliders</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'latency', label: 'Lowest Latency', icon: Activity },
                  { id: 'cost', label: 'Lowest Cost', icon: ArrowDownUp },
                  { id: 'bandwidth', label: 'High Bandwidth', icon: Zap },
                  { id: 'congestion', label: 'Low Congestion', icon: Flame },
                  { id: 'security', label: 'Most Secure', icon: Shield },
                  { id: 'balanced', label: 'Balanced Blend', icon: Sparkles },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSetOptimizationMode(id as OptimizationMode)}
                    className={`p-2 rounded-lg border text-left font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                      optimizationMode === id
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] font-bold shadow-xs'
                        : 'border-slate-800 bg-[#070b12] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>

              {/* Balanced Weight Sliders */}
              {optimizationMode === 'balanced' && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Latency Weight: {Math.round(balancedWeights.latencyWeight * 100)}%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={balancedWeights.latencyWeight}
                      onChange={(e) =>
                        onSetBalancedWeights({
                          ...balancedWeights,
                          latencyWeight: parseFloat(e.target.value),
                        })
                      }
                      className="w-24 accent-[#00f0ff]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Cost Weight: {Math.round(balancedWeights.costWeight * 100)}%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={balancedWeights.costWeight}
                      onChange={(e) =>
                        onSetBalancedWeights({
                          ...balancedWeights,
                          costWeight: parseFloat(e.target.value),
                        })
                      }
                      className="w-24 accent-[#00f0ff]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Congestion: {Math.round(balancedWeights.congestionWeight * 100)}%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={balancedWeights.congestionWeight}
                      onChange={(e) =>
                        onSetBalancedWeights({
                          ...balancedWeights,
                          congestionWeight: parseFloat(e.target.value),
                        })
                      }
                      className="w-24 accent-[#00f0ff]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Security: {Math.round(balancedWeights.securityWeight * 100)}%</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={balancedWeights.securityWeight}
                      onChange={(e) =>
                        onSetBalancedWeights({
                          ...balancedWeights,
                          securityWeight: parseFloat(e.target.value),
                        })
                      }
                      className="w-24 accent-[#00f0ff]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Undo / Redo & Recalculate */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-[#070b12] text-slate-300 hover:text-white disabled:opacity-30 text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                title="Undo last topology action"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className="flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-[#070b12] text-slate-300 hover:text-white disabled:opacity-30 text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                title="Redo action"
              >
                <RotateCw className="w-3 h-3" />
                <span>Redo</span>
              </button>
              <button
                type="button"
                onClick={onRecalculate}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#00f0ff] hover:bg-[#00d0e0] text-[#070b12] font-mono font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                title="Recalculate shortest path immediately"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Route</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Topology Controls & Injections */}
        {activeTab === 'actions' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onAddRouter}
                className="p-2 rounded-lg border border-slate-800 bg-[#070b12] hover:border-[#00f0ff]/50 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Add Router</span>
              </button>
              <button
                type="button"
                onClick={onStartAddLink}
                className="p-2 rounded-lg border border-slate-800 bg-[#070b12] hover:border-[#00f0ff]/50 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>Add Link</span>
              </button>
            </div>

            {/* Failure Injections */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Failure &amp; Stress Injections
              </span>

              <button
                type="button"
                onClick={onFailSelectedNode}
                disabled={!selectedNodeId && !selectedEdgeId}
                className="w-full py-1.5 px-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-40 text-left font-mono text-[11px] flex items-center justify-between cursor-pointer"
              >
                <span>Fail Selected Item</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </button>

              <button
                type="button"
                onClick={onIncreaseLatency}
                className="w-full py-1.5 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-left font-mono text-[11px] flex items-center justify-between cursor-pointer"
              >
                <span>Spike Active Path Latency (+25ms)</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={onIncreaseTraffic}
                className="w-full py-1.5 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-left font-mono text-[11px] flex items-center justify-between cursor-pointer"
              >
                <span>Inject Traffic Spike (+400 Mbps)</span>
                <Flame className="w-3.5 h-3.5 text-purple-400" />
              </button>

              <button
                type="button"
                onClick={onSimulateDDoS}
                className="w-full py-1.5 px-2.5 rounded-lg border border-red-500/40 bg-red-500/15 text-red-200 hover:bg-red-500/25 font-bold text-left font-mono text-[11px] flex items-center justify-between cursor-pointer"
              >
                <span>Simulate DDoS Attack Vector</span>
                <Shield className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>

            {/* Recovery */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <button
                type="button"
                onClick={onRestoreAll}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/30 font-bold font-mono text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore All Nodes &amp; Links (UP)</span>
              </button>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onDeleteSelected}
                  disabled={!selectedNodeId && !selectedEdgeId}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-[#070b12] text-slate-400 hover:text-red-400 hover:border-red-500/30 disabled:opacity-30 font-mono text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={onResetNetwork}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-800 bg-[#070b12] text-slate-400 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Import / Export & Snapshots */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onExportJson}
              className="w-full py-2 px-3 rounded-lg border border-slate-800 bg-[#070b12] hover:border-[#00f0ff]/50 text-slate-200 font-mono text-xs flex items-center justify-between cursor-pointer"
            >
              <span>Export Topology (JSON)</span>
              <FileCode className="w-4 h-4 text-[#00f0ff]" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-lg border border-slate-800 bg-[#070b12] hover:border-[#00f0ff]/50 text-slate-200 font-mono text-xs flex items-center justify-between cursor-pointer"
            >
              <span>Import Topology (JSON)</span>
              <Upload className="w-4 h-4 text-[#00ff88]" />
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              className="w-full py-2 px-3 rounded-lg border border-slate-800 bg-[#070b12] hover:border-[#00f0ff]/50 text-slate-200 font-mono text-xs flex items-center justify-between cursor-pointer"
            >
              <span>Export Event Log (CSV)</span>
              <Download className="w-4 h-4 text-purple-400" />
            </button>

            <button
              type="button"
              onClick={onDownloadPng}
              className="w-full py-2 px-3 rounded-lg border border-slate-800 bg-[#070b12] hover:border-[#00f0ff]/50 text-slate-200 font-mono text-xs flex items-center justify-between cursor-pointer"
            >
              <span>Download Canvas (PNG)</span>
              <Download className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        )}
      </div>

      {/* Footer stats strip */}
      <div className="px-3.5 py-2 border-t border-slate-800 bg-[#090e17]/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Nodes: {nodes.length}</span>
        <span>•</span>
        <span>Edges: {edges.length}</span>
        <span>•</span>
        <span className="text-[#00ff88]">{nodes.filter((n) => n.status === 'UP').length} UP</span>
      </div>
    </aside>
  );
};
