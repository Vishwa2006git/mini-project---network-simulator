import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface StoryDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStoryStep: (stepIndex: number) => void;
}

export const STORY_STEPS = [
  {
    step: 1,
    title: '1. Baseline Steady-State Topology',
    subtitle: 'Healthy Enterprise Campus Network',
    description:
      'All nodes and links are operating at nominal capacity. Traffic flows along the primary low-latency path: CSE Workstation → CSE Switch → Core Router → Edge Firewall → Internet Gateway (total latency ~8.3ms).',
    actionText: 'Load Baseline State',
    icon: CheckCircle2,
    badgeColor: 'text-[#00ff88] bg-[#00ff88]/15 border-[#00ff88]/30',
  },
  {
    step: 2,
    title: '2. Sudden Traffic Surge & Congestion Spike',
    subtitle: 'High Congestion Warning Triggered',
    description:
      'A large database sync or video stream floods the link between Edge Firewall and Core Router. Traffic jumps from 1450 Mbps to 9200 Mbps (92% utilization), triggering a CRITICAL congestion alert.',
    actionText: 'Inject Traffic Spike',
    icon: Flame,
    badgeColor: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
  },
  {
    step: 3,
    title: '3. Physical Fiber Cut & Link Severance',
    subtitle: 'Primary Link Outage & Failover',
    description:
      'A backhoe cuts the fiber link between Core Router and Edge Firewall! The link drops to DOWN. The simulator immediately invokes the routing engine and re-routes packets through the redundant Backup Router (FW1 → BACKUP_RTR → SW_LIB → SW_ADMIN → SW_CSE).',
    actionText: 'Sever Primary Link (Failover Test)',
    icon: Zap,
    badgeColor: 'text-red-400 bg-red-400/15 border-red-400/30',
  },
  {
    step: 4,
    title: '4. Cyber Attack & Lateral Movement',
    subtitle: 'Malware Compromise & Blast Radius Quarantine',
    description:
      'An intrusion is detected on the Campus Web Server (SRV_APP), which attempts lateral pivoting toward the Student Records Database (Crown Jewel). The NOC quarantines SRV_APP and reroutes academic traffic safely.',
    actionText: 'Simulate Malware Intrusion',
    icon: ShieldAlert,
    badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
  },
  {
    step: 5,
    title: '5. NOC Remediation & Full Restoration',
    subtitle: 'Automated Recovery & Verification',
    description:
      'The fiber link is repaired, quarantined nodes are cleansed, and routing converges back to the optimal low-latency primary path. Global network health score returns to 100%.',
    actionText: 'Execute Full Recovery',
    icon: Sparkles,
    badgeColor: 'text-[#00f0ff] bg-[#00f0ff]/15 border-[#00f0ff]/30',
  },
];

export const StoryDemoModal: React.FC<StoryDemoModalProps> = ({
  isOpen,
  onClose,
  onApplyStoryStep,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STORY_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < STORY_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      onApplyStoryStep(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      onApplyStoryStep(prevIdx);
    }
  };

  const handleApplyCurrent = () => {
    onApplyStoryStep(currentStepIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="max-w-xl w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden font-sans text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Interactive Incident Storyline
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Live step-by-step walkthrough of enterprise routing dynamics
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

        {/* Step Progression Indicators */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-800/80 bg-[#070b12]">
          {STORY_STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                setCurrentStepIndex(idx);
                onApplyStoryStep(idx);
              }}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                currentStepIndex === idx ? 'scale-105' : 'opacity-60 hover:opacity-90'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border ${
                  currentStepIndex === idx
                    ? 'bg-[#00f0ff] text-[#070b12] border-[#00f0ff] shadow-sm shadow-[#00f0ff]/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {s.step}
              </div>
              <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                Step {s.step}
              </span>
            </button>
          ))}
        </div>

        {/* Story Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border flex items-center gap-1.5 ${currentStep.badgeColor}`}
            >
              <StepIcon className="w-3.5 h-3.5" />
              <span>{currentStep.subtitle}</span>
            </span>
          </div>

          <h4 className="text-base font-bold text-white">{currentStep.title}</h4>

          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#090e17] p-3.5 rounded-lg border border-slate-800">
            {currentStep.description}
          </p>

          <button
            type="button"
            onClick={handleApplyCurrent}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#0070f3] text-[#070b12] font-mono font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-[#00f0ff]/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Apply To Topology: {currentStep.actionText}</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-[#090e17] flex items-center justify-between font-mono text-xs">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-slate-500 text-[11px]">
            {currentStepIndex + 1} of {STORY_STEPS.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIndex === STORY_STEPS.length - 1}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#00f0ff] disabled:opacity-30 flex items-center gap-1 cursor-pointer font-bold"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
