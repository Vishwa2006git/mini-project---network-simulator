import React, { useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Globe2,
  Key,
  Layers,
  Radio,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import {
  SUPABASE_SQL_SCHEMA,
  StorageAdapter,
} from '../integrations/storageAdapter';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  snmpSimulated: boolean;
  onToggleSnmpSimulated: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  snmpSimulated,
  onToggleSnmpSimulated,
}) => {
  const [activeTab, setActiveTab] = useState<'snmp' | 'maps' | 'ai' | 'cloud' | 'db'>('snmp');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [snmpStatusMsg, setSnmpStatusMsg] = useState<string>('SNMP Agent running in simulation demo mode.');

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-3xl w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[#38bdf8]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                External Integrations &amp; Adapter Architecture
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Pluggable adapters for enterprise SNMP, Google Maps, Gemini AI, Cloud &amp; SQL
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#070b12] text-xs font-mono">
          {[
            { id: 'snmp', label: '1. SNMP Poller', icon: Radio },
            { id: 'maps', label: '2. Maps Platform', icon: Globe2 },
            { id: 'ai', label: '3. Gemini AI NOC', icon: Bot },
            { id: 'cloud', label: '4. Cloud Importer', icon: UploadCloud },
            { id: 'db', label: '5. SQL Persistence', icon: Database },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 py-2 px-2 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === id
                  ? 'text-[#00f0ff] border-b-2 border-[#00f0ff] font-bold bg-[#00f0ff]/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs font-mono">
          {/* Tab 1: SNMP Monitoring */}
          {activeTab === 'snmp' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">SNMP v2c / v3 Telemetry Poller</span>
                  <span className="px-2 py-0.5 rounded bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 text-[10px]">
                    ADAPTER ACTIVE
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The SNMP Polling adapter queries RFC-1213 MIB-II endpoints for router interface states,
                  traffic octets, and packet drop counters. When deployed in non-datacenter environments,
                  it seamlessly activates high-fidelity synthetic telemetry simulation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800">
                  <span className="text-slate-400 text-[10px] block mb-1">MONITORED OIDS</span>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    <li>• .1.3.6.1.2.1.1.3 (sysUpTime)</li>
                    <li>• .1.3.6.1.2.1.2.2.1.10 (ifInOctets)</li>
                    <li>• .1.3.6.1.2.1.2.2.1.16 (ifOutOctets)</li>
                    <li>• .1.3.6.1.2.1.2.2.1.8 (ifOperStatus)</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800">
                  <span className="text-slate-400 text-[10px] block mb-1">POLL FREQUENCY &amp; MODE</span>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Simulation Poller</span>
                      <button
                        type="button"
                        onClick={onToggleSnmpSimulated}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          snmpSimulated
                            ? 'bg-[#00ff88] text-[#070b12]'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {snmpSimulated ? 'ENABLED' : 'PAUSED'}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Sample Rate: 1000ms heartbeat
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Google Maps Platform */}
          {activeTab === 'maps' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Google Maps Platform Geo Placement</span>
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 text-[10px]">
                    GEO VIEW READY
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Nodes with real-world geographical coordinates (like Preset #2: ISP National Optical Backbone
                  in Chennai, Bangalore, Hyderabad, Mumbai, Delhi) are projected onto true geographic lat/lng grids.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] block">GEOGRAPHIC COORDINATES CONFIGURATION</span>
                <p className="text-slate-300 text-[11px]">
                  Click the <strong>"Geo View"</strong> toggle in the top header bar to switch between the logical
                  topological canvas and the geographic projection. Nodes map their <code>lat</code> and <code>lng</code> coordinates automatically.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Gemini AI NOC Analyst */}
          {activeTab === 'ai' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Gemini AI Network Intelligence</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px]">
                    GEMINI ENGINE CONNECTED
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The AI Network Operations Analyst combines natural language queries with deterministic graph
                  algorithms. It parses questions like "Which node is the highest risk?" or "What happens if Core Router fails?"
                  using Google's Gemini models with a zero-latency heuristic rule fallback.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] block">SAMPLE NATURAL LANGUAGE COMMANDS</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-[#090e17] border border-slate-800 text-slate-300">
                    "Identify single points of failure in this network"
                  </div>
                  <div className="p-2 rounded bg-[#090e17] border border-slate-800 text-slate-300">
                    "Simulate failure of the primary firewall"
                  </div>
                  <div className="p-2 rounded bg-[#090e17] border border-slate-800 text-slate-300">
                    "What is the bottleneck bandwidth to Database?"
                  </div>
                  <div className="p-2 rounded bg-[#090e17] border border-slate-800 text-slate-300">
                    "How can I improve reliability to 100%?"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Cloud Importer */}
          {activeTab === 'cloud' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Cloud Topology Importer</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                    STANDALONE READY
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Import network architectures exported by Cisco Packet Tracer, GNS3, Wireshark topology JSONs,
                  or community repository links.
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: PostgreSQL / Supabase Persistence */}
          {activeTab === 'db' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">PostgreSQL / Supabase Storage Schema</span>
                  <button
                    type="button"
                    onClick={handleCopySchema}
                    className="px-2.5 py-1 rounded bg-[#00f0ff] text-[#070b12] hover:bg-[#00d0e0] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSchema ? 'COPIED!' : 'COPY SQL'}</span>
                  </button>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The application stores all topologies, incident logs, and metric history in LocalStorage by default.
                  For enterprise persistence, apply this schema to any PostgreSQL or Supabase database:
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800">
                <pre className="text-[10px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed font-mono">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#090e17] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
