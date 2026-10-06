import React, { useState } from 'react';
import { NetworkNode, NodeStatus, NodeType } from '../types/network';
import { Cpu, Save, Trash2, X } from 'lucide-react';

interface NodeEditModalProps {
  node: NetworkNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: NetworkNode) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !node) return null;

  const [label, setLabel] = useState(node.label);
  const [ip, setIp] = useState(node.ip);
  const [type, setType] = useState<NodeType>(node.type);
  const [status, setStatus] = useState<NodeStatus>(node.status);
  const [riskScore, setRiskScore] = useState(node.riskScore);
  const [isCrownJewel, setIsCrownJewel] = useState(Boolean(node.isCrownJewel));

  const handleSave = () => {
    onSave({
      ...node,
      label,
      ip,
      type,
      status,
      riskScore,
      isCrownJewel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-md w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Configure Node [{node.id}]
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
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">LABEL</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">IP ADDRESS</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NodeType)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="Core Router">Core Router</option>
                <option value="Router">Router</option>
                <option value="Switch">Switch</option>
                <option value="Firewall">Firewall</option>
                <option value="Server">Server</option>
                <option value="Database">Database</option>
                <option value="PC">PC Workstation</option>
                <option value="Internet">Internet Gateway</option>
                <option value="ISP">ISP Point of Presence</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NodeStatus)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="UP">UP (Operational)</option>
                <option value="DOWN">DOWN (Offline/Failed)</option>
                <option value="QUARANTINED">QUARANTINED (Attacked)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>RISK SCORE (0 - 100)</span>
              <span className="text-[#00f0ff]">{riskScore}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={riskScore}
              onChange={(e) => setRiskScore(parseInt(e.target.value, 10))}
              className="w-full accent-[#00f0ff]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="crownJewelCheck"
              checked={isCrownJewel}
              onChange={(e) => setIsCrownJewel(e.target.checked)}
              className="accent-amber-400 rounded cursor-pointer"
            />
            <label htmlFor="crownJewelCheck" className="text-slate-300 text-[11px] cursor-pointer">
              Mark as Crown Jewel Asset (High-Priority Target)
            </label>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-[#090e17] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onDelete(node.id);
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-[#00f0ff] text-[#070b12] hover:bg-[#00d0e0] font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
