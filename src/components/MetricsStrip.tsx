import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Flame,
  Radio,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type {
  NetworkMetricsSnapshot,
  ResilienceReport,
} from '../types/network';

interface MetricsStripProps {
  history: NetworkMetricsSnapshot[];
  currentHealth: number;
  activeNodesCount: number;
  totalNodesCount: number;
  congestedLinksCount: number;
  resilienceReport: ResilienceReport | null;
  darkMode: boolean;
  onOpenResilienceReport: () => void;
  onOpenAiAnalyst: () => void;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({
  history,
  currentHealth,
  activeNodesCount,
  totalNodesCount,
  congestedLinksCount,
  resilienceReport,
  darkMode,
  onOpenResilienceReport,
  onOpenAiAnalyst,
}) => {
  // Helper to render mini sparkline SVG path
  const renderSparkline = (
    data: number[],
    color: string,
    width = 110,
    height = 28
  ) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;
    const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill={`url(#grad-${color})`} />
        <path d={pathData} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  };

  const recentHistory = history.slice(-15);
  const latencyData = recentHistory.map((s) => s.activePathLatency);
  const trafficData = recentHistory.map((s) => s.totalTrafficMbps);
  const lossData = recentHistory.map((s) => s.averagePacketLoss);
  const healthData = recentHistory.map((s) => s.healthScore);

  const latestLatency = latencyData[latencyData.length - 1] || 0;
  const latestTraffic = trafficData[trafficData.length - 1] || 0;
  const latestLoss = lossData[lossData.length - 1] || 0;

  const spofCount = resilienceReport?.articulationPoints.length || 0;

  return (
    <div
      className={`rounded-xl border p-2.5 px-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs transition-colors ${
        darkMode
          ? 'bg-[#0d1420]/90 border-[#1a283c] glass-panel'
          : 'bg-white border-slate-200 glass-panel-light shadow-xs'
      }`}
    >
      {/* 4 Metrics Sparkline Blocks */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Latency */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00f0ff]" />
              <span>LATENCY</span>
            </span>
            <span className="text-sm font-bold text-white">{latestLatency}ms</span>
          </div>
          <div className="hidden sm:block">
            {renderSparkline(latencyData, '#00f0ff')}
          </div>
        </div>

        {/* Traffic */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00ff88]" />
              <span>TRAFFIC</span>
            </span>
            <span className="text-sm font-bold text-white">
              {latestTraffic >= 1000
                ? `${(latestTraffic / 1000).toFixed(1)} Gbps`
                : `${latestTraffic} Mbps`}
            </span>
          </div>
          <div className="hidden sm:block">
            {renderSparkline(trafficData, '#00ff88')}
          </div>
        </div>

        {/* Packet Loss */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-amber-400" />
              <span>LOSS</span>
            </span>
            <span className="text-sm font-bold text-amber-400">{latestLoss.toFixed(2)}%</span>
          </div>
          <div className="hidden md:block">
            {renderSparkline(lossData, '#f59e0b')}
          </div>
        </div>

        {/* Global Health */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>HEALTH</span>
            </span>
            <span className="text-sm font-bold text-purple-300">{currentHealth}%</span>
          </div>
          <div className="hidden lg:block">
            {renderSparkline(healthData, '#c084fc')}
          </div>
        </div>
      </div>

      {/* KPI Flags & Action Modals Trigger */}
      <div className="flex items-center gap-3">
        {/* Nodes online */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-300 bg-[#070b12] px-2.5 py-1 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
          <span>Nodes: {activeNodesCount}/{totalNodesCount} UP</span>
        </div>

        {/* Congestion warning badge */}
        {congestedLinksCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>{congestedLinksCount} Congested</span>
          </div>
        )}

        {/* Resilience / SPOF Trigger Button */}
        <button
          type="button"
          onClick={onOpenResilienceReport}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
            spofCount > 0
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              : 'bg-[#070b12] border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Analyze Critical Single Points of Failure and Tarjan Bridges"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${spofCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>SPOF ({spofCount})</span>
        </button>

        {/* AI Network Operations Analyst Button */}
        <button
          type="button"
          onClick={onOpenAiAnalyst}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-[#00f0ff]/20 to-[#0070f3]/20 border border-[#00f0ff]/40 text-[#00f0ff] hover:text-white text-xs font-mono font-bold transition-all shadow-sm shadow-[#00f0ff]/20 cursor-pointer"
          title="Open AI Network Operations Analyst (Gemini & Heuristic Engine)"
        >
          <Bot className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>AI Analyst</span>
        </button>
      </div>
    </div>
  );
};
