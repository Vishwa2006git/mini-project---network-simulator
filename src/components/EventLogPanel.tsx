import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownCircle,
  CheckCircle2,
  Download,
  Filter,
  Flame,
  Info,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { EventLogEntry } from '../types/network';

interface EventLogPanelProps {
  logs: EventLogEntry[];
  darkMode: boolean;
  onClearLogs: () => void;
  onExportCsv: () => void;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  logs,
  darkMode,
  onClearLogs,
  onExportCsv,
}) => {
  const [filter, setFilter] = useState<'all' | 'warning' | 'alert' | 'attack' | 'recovery'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const renderBadge = (type: EventLogEntry['type']) => {
    switch (type) {
      case 'info':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
            INFO
          </span>
        );
      case 'warning':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
            WARN
          </span>
        );
      case 'alert':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            ALERT
          </span>
        );
      case 'attack':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
            ATTACK
          </span>
        );
      case 'recovery':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30">
            RECOVER
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-xl border flex flex-col h-full overflow-hidden transition-colors ${
        darkMode ? 'bg-[#0d1420]/90 border-[#1a283c] glass-panel' : 'bg-white border-slate-200 glass-panel-light shadow-xs'
      }`}
    >
      {/* Header with Title and Action Buttons */}
      <div className="p-3 border-b border-slate-800 bg-[#090e17]/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00ff88]" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-white">
            NOC Event Stream
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onExportCsv}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Export Event Log to CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Clear Log History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-3 py-1.5 border-b border-slate-800 bg-[#070b12] flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1">
          {(['all', 'warning', 'alert', 'attack', 'recovery'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                filter === t
                  ? 'bg-slate-800 text-[#00f0ff] font-bold border border-[#00f0ff]/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAutoScroll(!autoScroll)}
          className={`text-[10px] flex items-center gap-1 cursor-pointer ${
            autoScroll ? 'text-[#00ff88]' : 'text-slate-500'
          }`}
          title="Toggle Auto Scroll to Bottom"
        >
          <span>Auto</span>
          <ArrowDownCircle className="w-3 h-3" />
        </button>
      </div>

      {/* Log Feed List */}
      <div className="p-3 space-y-2 overflow-y-auto flex-1 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No events logged for current filter criteria.
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="p-2 rounded-lg bg-[#070b12] border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {renderBadge(entry.type)}
                  <span className="text-[10px] text-slate-400 font-semibold">{entry.source}</span>
                </div>
                <span className="text-[10px] text-slate-500">{entry.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">{entry.message}</p>
              {entry.details && (
                <div className="mt-1 text-[10px] text-slate-400 bg-[#090e17] px-2 py-1 rounded border border-slate-800/60">
                  {entry.details}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
