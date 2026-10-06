import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  Network,
  Shield,
  ShieldAlert,
  Zap,
  X,
} from 'lucide-react';
import type {
  NetworkEdge,
  NetworkNode,
  ResilienceReport,
} from '../types/network';

interface ResilienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ResilienceReport | null;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onFailNode: (nodeId: string) => void;
  onFailEdge: (edgeId: string) => void;
}

export const ResilienceModal: React.FC<ResilienceModalProps> = ({
  isOpen,
  onClose,
  report,
  nodes,
  edges,
  onFailNode,
  onFailEdge,
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-2xl w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Network Resilience &amp; Tarjan SPOF Analysis
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Single Points of Failure, Bridge Links &amp; Blast Radius Modeling
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

        {/* Reliability Score KPI Strip */}
        <div className="p-4 border-b border-slate-800 bg-[#070b12] grid grid-cols-3 gap-3 text-center font-mono">
          <div className="p-2.5 rounded-lg bg-[#0d1420] border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">
              Reliability Score
            </span>
            <span
              className={`text-lg font-bold ${
                report.reliabilityScore >= 90
                  ? 'text-[#00ff88]'
                  : report.reliabilityScore >= 60
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {report.reliabilityScore}%
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0d1420] border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">
              Articulation Points
            </span>
            <span
              className={`text-lg font-bold ${
                report.articulationPoints.length > 0 ? 'text-amber-400' : 'text-[#00ff88]'
              }`}
            >
              {report.articulationPoints.length}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0d1420] border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">
              Bridge Links
            </span>
            <span
              className={`text-lg font-bold ${
                report.bridges.length > 0 ? 'text-amber-400' : 'text-[#00ff88]'
              }`}
            >
              {report.bridges.length}
            </span>
          </div>
        </div>

        {/* Report Content Scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs font-mono">
          {/* Section 1: Critical Nodes (Articulation Points) */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Critical Single Points of Failure (Articulation Points)</span>
            </h4>
            {report.articulationPoints.length === 0 ? (
              <div className="p-3 rounded-lg bg-[#070b12] border border-[#00ff88]/30 text-[#00ff88] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>2-Connected Topology: No single node failure can partition the network.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {report.articulationPoints.map((nodeId) => {
                  const node = nodes.find((n) => n.id === nodeId);
                  const blast = report.blastRadiusMap[nodeId] || [];
                  return (
                    <div
                      key={nodeId}
                      className="p-2.5 rounded-lg bg-[#070b12] border border-amber-500/30 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{node?.label || nodeId}</span>
                          <span className="text-[10px] text-slate-400">({node?.type})</span>
                        </div>
                        <div className="text-[10px] text-red-300 mt-0.5">
                          Blast radius: {blast.length} dependent nodes severed if this node fails.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onFailNode(nodeId);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 cursor-pointer text-[10px] font-bold"
                      >
                        Fail Node
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Critical Bridge Links */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-bold flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
              <span>Critical Bridge Links (Severing creates network partitions)</span>
            </h4>
            {report.bridges.length === 0 ? (
              <div className="p-3 rounded-lg bg-[#070b12] border border-[#00ff88]/30 text-[#00ff88] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All links have alternate paths. No bridge links detected.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {report.bridges.map((br) => {
                  const uNode = nodes.find((n) => n.id === br.u);
                  const vNode = nodes.find((n) => n.id === br.v);
                  return (
                    <div
                      key={br.edgeId}
                      className="p-2.5 rounded-lg bg-[#070b12] border border-amber-500/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{uNode?.label || br.u}</span>
                        <span className="text-[#00f0ff]">↔</span>
                        <span className="text-white font-bold">{vNode?.label || br.v}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onFailEdge(br.edgeId);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 cursor-pointer text-[10px] font-bold"
                      >
                        Sever Link
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#090e17] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
