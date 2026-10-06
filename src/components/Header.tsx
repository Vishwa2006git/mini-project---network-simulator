import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  BookOpen,
  CheckCircle2,
  Clock,
  Globe2,
  Layers,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  isPlaying: boolean;
  speed: number;
  healthScore: number;
  autoReroute: boolean;
  chaosMode: boolean;
  liveProbe: boolean;
  isGeoView: boolean;
  darkMode: boolean;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onStepTick: () => void;
  onToggleAutoReroute: () => void;
  onToggleChaosMode: () => void;
  onToggleLiveProbe: () => void;
  onToggleGeoView: () => void;
  onToggleDarkMode: () => void;
  onOpenDemo: () => void;
  onOpenSelfTest: () => void;
  onOpenIntegrations: () => void;
  onOpenLearn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPlaying,
  speed,
  healthScore,
  autoReroute,
  chaosMode,
  liveProbe,
  isGeoView,
  darkMode,
  onTogglePlay,
  onSetSpeed,
  onStepTick,
  onToggleAutoReroute,
  onToggleChaosMode,
  onToggleLiveProbe,
  onToggleGeoView,
  onToggleDarkMode,
  onOpenDemo,
  onOpenSelfTest,
  onOpenIntegrations,
  onOpenLearn,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeString(
        `${now.toLocaleTimeString([], { hour12: false })} UTC${now.getTimezoneOffset() <= 0 ? '+' : '-'}${Math.abs(
          Math.floor(now.getTimezoneOffset() / 60)
        )}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const healthColor =
    healthScore >= 80 ? 'text-[#00ff88]' : healthScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const healthBadgeBg =
    healthScore >= 80
      ? 'bg-[#00ff88]/10 border-[#00ff88]/30'
      : healthScore >= 50
      ? 'bg-amber-400/10 border-amber-400/30'
      : 'bg-red-400/10 border-red-400/30';

  return (
    <header
      className={`border-b sticky top-0 z-40 transition-colors ${
        darkMode ? 'bg-[#0a0f18]/95 border-[#172334] glass-panel' : 'bg-white/95 border-slate-200 glass-panel-light'
      }`}
    >
      <div className="max-w-[1760px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo + Live Clock */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#0070f3] flex items-center justify-center text-[#070b12] shadow-md shadow-[#00f0ff]/20 font-black text-sm tracking-wider">
              VK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-white drop-shadow-xs">
                  VK Simulator App
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-semibold">
                  NOC v2.5
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#00f0ff]" />
                  <span>{timeString}</span>
                </span>
                <span>•</span>
                <span className="text-[#00ff88] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block animate-pulse" />
                  <span>LIVE NOC PROBE</span>
                </span>
              </div>
            </div>
          </div>

          {/* Network Health Badge */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${healthBadgeBg} ${healthColor}`}
            title="Global network operational health index (calculated from node uptime, link congestion, and reachability)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>HEALTH: {healthScore}%</span>
          </div>
        </div>

        {/* Center: Simulation Play/Pause & Speed */}
        <div className="flex items-center gap-1.5 bg-[#070b12]/80 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause simulation tick loop' : 'Start simulation tick loop'}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#00f0ff] text-[#070b12] shadow-sm shadow-[#00f0ff]/40'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'SIMULATE'}</span>
          </button>

          <button
            type="button"
            onClick={onStepTick}
            disabled={isPlaying}
            title="Step simulation forward by 1 second"
            className="px-2.5 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Speeds */}
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSetSpeed(s)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                speed === s
                  ? 'bg-slate-700 text-[#00f0ff] font-bold border border-[#00f0ff]/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Right Side: Mode Toggles & Extra Navigation */}
        <div className="flex items-center gap-2">
          {/* Geo View Toggle */}
          <button
            type="button"
            onClick={onToggleGeoView}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              isGeoView
                ? 'bg-[#0070f3]/20 border-[#0070f3] text-[#38bdf8] font-bold'
                : darkMode
                ? 'bg-[#0d1420] border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle between Topological Grid and Geographic GPS Map"
          >
            {isGeoView ? <Globe2 className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Layers className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isGeoView ? 'Geo View' : 'Topology'}</span>
          </button>

          {/* Auto Reroute */}
          <button
            type="button"
            onClick={onToggleAutoReroute}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoReroute
                ? 'bg-[#00ff88]/15 border-[#00ff88]/40 text-[#00ff88]'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
            title="Automatically recompute shortest path when link metrics fluctuate or failures occur"
          >
            <Zap className="w-3 h-3" />
            <span className="hidden lg:inline">Auto-Reroute</span>
          </button>

          {/* Chaos Mode */}
          <button
            type="button"
            onClick={onToggleChaosMode}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              chaosMode
                ? 'bg-red-500/20 border-red-500 text-red-300 font-bold animate-pulse'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
            title="Chaos Mode randomly triggers link outages and congestion spikes for stress testing"
          >
            <AlertOctagon className="w-3 h-3" />
            <span className="hidden lg:inline">Chaos</span>
          </button>

          {/* Guided Story Demo */}
          <button
            type="button"
            onClick={onOpenDemo}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1"
            title="Interactive Storyline: normal route -> congestion -> link failure -> cyber attack -> recovery"
          >
            <span>Story Demo</span>
          </button>

          {/* Self-Test */}
          <button
            type="button"
            onClick={onOpenSelfTest}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#0d1420] text-slate-300 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 transition-colors cursor-pointer"
            title="Run Routing Engine Self-Test Suite"
            aria-label="Run engine self-test"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Learn / Algorithm Guide */}
          <button
            type="button"
            onClick={onOpenLearn}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#0d1420] text-slate-300 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 transition-colors cursor-pointer"
            title="Algorithm Guide & Time Complexity"
            aria-label="Algorithm Guide"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Integrations Modal */}
          <button
            type="button"
            onClick={onOpenIntegrations}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#0d1420] text-slate-300 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 transition-colors cursor-pointer"
            title="Integration Settings (SNMP, Maps, Gemini, Cloud, DB)"
            aria-label="Integrations Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#0d1420] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Cyber NOC Dark Theme'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
