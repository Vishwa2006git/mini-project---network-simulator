import React, { useState } from 'react';
import { EdgeStatus, NetworkEdge } from '../types/network';
import { Network, Save, Trash2, X } from 'lucide-react';

interface EdgeEditModalProps {
  edge: NetworkEdge | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: NetworkEdge) => void;
  onDelete: (edgeId: string) => void;
}

export const EdgeEditModal: React.FC<EdgeEditModalProps> = ({
  edge,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !edge) return null;

  const [latency, setLatency] = useState(edge.latency);
  const [bandwidth, setBandwidth] = useState(edge.bandwidth);
  const [currentTraffic, setCurrentTraffic] = useState(edge.currentTraffic);
  const [cost, setCost] = useState(edge.cost);
  const [status, setStatus] = useState<EdgeStatus>(edge.status);
  const [packetLoss, setPacketLoss] = useState(edge.packetLoss);

  const handleSave = () => {
    const utilization = Math.round((currentTraffic / (bandwidth || 1)) * 100);
    const congestionLevel =
      utilization > 90
        ? 'CRITICAL'
        : utilization > 80
        ? 'HIGH'
        : utilization > 50
        ? 'MEDIUM'
        : 'LOW';

    onSave({
      ...edge,
      latency,
      bandwidth,
      currentTraffic,
      cost,
      status,
      packetLoss,
      utilization,
      congestionLevel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-md w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#00ff88]" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Configure Link [{edge.u} ↔ {edge.v}]
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">LATENCY (ms)</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={latency}
                onChange={(e) => setLatency(parseFloat(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00ff88]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EdgeStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00ff88]"
              >
                <option value="UP">UP (Operational)</option>
                <option value="DOWN">DOWN (Severed/Fiber Cut)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">BANDWIDTH (Mbps)</label>
              <input
                type="number"
                min="10"
                step="100"
                value={bandwidth}
                onChange={(e) => setBandwidth(parseInt(e.target.value, 10) || 100)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00ff88]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">TRAFFIC (Mbps)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={currentTraffic}
                onChange={(e) => setCurrentTraffic(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00ff88]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">COST METRIC</label>
              <input
                type="number"
                step="1"
                value={cost}
                onChange={(e) => setCost(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00ff88]"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">PACKET LOSS (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={packetLoss}
                onChange={(e) => setPacketLoss(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00ff88]"
              />
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-[#090e17] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDelete(edge.id);
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Link</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-[#00ff88] text-[#070b12] hover:bg-[#00d070] font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
