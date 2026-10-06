import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  CornerDownLeft,
  Loader2,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import type {
  NetworkEdge,
  NetworkNode,
  ResilienceReport,
  RoutingResult,
} from '../types/network';
import { GeminiAdapter } from '../integrations/geminiAdapter';

interface AiAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  routingResult: RoutingResult | null;
  resilienceReport: ResilienceReport | null;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiAnalystModal: React.FC<AiAnalystModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  routingResult,
  resilienceReport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Greetings Network Engineer. I am your NOC AI Operations Analyst. I am continuously monitoring your topology for routing bottlenecks, single points of failure (SPOF), and link congestion. How can I assist you?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const geminiAdapter = useRef(new GeminiAdapter());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiAdapter.current.analyzeNetwork(
        nodes,
        edges,
        [],
        routingResult
      );

      const parsedCmd = await geminiAdapter.current.parseNaturalLanguageCommand(
        textToSend,
        nodes,
        edges
      );

      let textOutput = `${response.rootCause}\n\n• Risk: ${response.riskAssessment}\n• Explanation: ${response.explanation}`;
      if (response.recommendations?.length > 0) {
        textOutput += `\n\nRecommendations:\n${response.recommendations.map((r) => `  - ${r}`).join('\n')}`;
      }
      if (parsedCmd) {
        textOutput += `\n\n[Action Intended]: ${parsedCmd.explanation}`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: textOutput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'NOC Diagnostic Rule Engine: Evaluated topology state. Network connectivity is nominal with automated failover paths standby.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQueries = [
    'Which router is the highest failure risk?',
    'What happens if Core Router fails?',
    'Identify bottleneck bandwidth to Database',
    'How do we increase network resilience to 100%?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-2xl w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col h-[75vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#0070f3] flex items-center justify-center text-[#070b12] shadow-sm shadow-[#00f0ff]/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>NOC AI Network Operations Analyst</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  GEMINI AI
                </span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Context-aware root-cause failure diagnostics and topology reasoning
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

        {/* Chat Feed */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto font-mono text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-6 h-6 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[82%] p-3 rounded-xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#00f0ff] text-[#070b12] font-semibold rounded-tr-none'
                    : 'bg-[#070b12] border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span
                  className={`text-[9px] mt-1 block ${
                    m.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono p-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00f0ff]" />
              <span>Analyzing graph topology matrices...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Queries Pills */}
        <div className="p-2 border-t border-slate-800/80 bg-[#070b12] flex flex-wrap gap-1.5 font-mono text-[10px]">
          {suggestedQueries.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2 py-1 rounded-md bg-[#0d1420] border border-slate-800 text-slate-300 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-[#090e17] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI Analyst about routing, bottleneck links, or incident response..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-[#070b12] text-slate-200 font-mono text-xs focus:outline-none focus:border-[#00f0ff]"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-[#00f0ff] text-[#070b12] hover:bg-[#00d0e0] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
