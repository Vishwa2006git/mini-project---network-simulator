import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VK Network Simulator uncaught UI error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b12] text-[#e2e8f0] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#0d1420] border border-red-500/40 rounded-xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Simulation Interface Recovered</h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {this.state.error?.message || 'An unexpected rendering anomaly occurred.'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00f0ff] hover:bg-[#00d0e0] text-[#070b12] text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Simulation Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
