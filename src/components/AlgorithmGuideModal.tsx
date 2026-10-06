import React, { useState } from 'react';
import {
  BookOpen,
  Code,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  X,
} from 'lucide-react';

interface AlgorithmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmGuideModal: React.FC<AlgorithmGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedAlg, setSelectedAlg] = useState<
    'dijkstra' | 'bellman' | 'astar' | 'floyd' | 'mst' | 'flow' | 'tarjan'
  >('dijkstra');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="max-w-3xl w-full bg-[#0d1420] border border-[#1e2f47] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#090e17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Routing Engine &amp; Graph Algorithm Specification
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Mathematical formulations, algorithmic recurrence, and Big-O computational complexities
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

        {/* Algorithm List + Details Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-52 border-r border-slate-800 bg-[#070b12] p-2 space-y-1 font-mono text-xs overflow-y-auto">
            {[
              { id: 'dijkstra', label: 'Dijkstra (Heap)' },
              { id: 'bellman', label: 'Bellman-Ford' },
              { id: 'astar', label: 'A* Search' },
              { id: 'floyd', label: 'Floyd–Warshall' },
              { id: 'mst', label: 'Kruskal & Prim' },
              { id: 'flow', label: 'Edmonds-Karp' },
              { id: 'tarjan', label: "Tarjan's SPOF" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedAlg(id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  selectedAlg === id
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] font-bold border border-[#00f0ff]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-5 overflow-y-auto text-xs font-mono space-y-4 leading-relaxed">
            {selectedAlg === 'dijkstra' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">Dijkstra's Algorithm with Min-Heap</h4>
                  <span className="px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                    O((V + E) log V)
                  </span>
                </div>
                <p className="text-slate-300">
                  Dijkstra's algorithm finds the shortest path from a single source vertex to all other vertices
                  in a weighted graph with non-negative edge weights. It maintains a priority queue of tentative distances.
                </p>
                <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 space-y-1 text-slate-300">
                  <div className="text-[#00ff88] font-bold">// Relaxation Step</div>
                  <div>if (dist[u] + weight(u, v) &lt; dist[v]) &#123;</div>
                  <div className="pl-4">dist[v] = dist[u] + weight(u, v);</div>
                  <div className="pl-4">prev[v] = u;</div>
                  <div className="pl-4">priorityQueue.insert(v, dist[v]);</div>
                  <div>&#125;</div>
                </div>
              </div>
            )}

            {selectedAlg === 'bellman' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">Bellman-Ford Algorithm</h4>
                  <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    O(V · E)
                  </span>
                </div>
                <p className="text-slate-300">
                  Unlike Dijkstra, Bellman-Ford can handle edges with negative weights and detect negative cycles.
                  It relaxes all edges |V| - 1 times. If any edge can still be relaxed on the |V|-th pass,
                  a negative cycle is guaranteed to exist.
                </p>
              </div>
            )}

            {selectedAlg === 'astar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">A* Heuristic Search</h4>
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">
                    O(E) best / O(b^d) worst
                  </span>
                </div>
                <p className="text-slate-300">
                  A* combines the actual path cost g(n) with an admissible heuristic estimate h(n) of the distance
                  to target: f(n) = g(n) + h(n). In this simulator, h(n) uses Euclidean straight-line distance on canvas
                  or Haversine distance on geographic maps.
                </p>
              </div>
            )}

            {selectedAlg === 'floyd' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">Floyd–Warshall All-Pairs Shortest Path</h4>
                  <span className="px-2 py-0.5 rounded bg-purple-400/10 text-purple-300 border border-purple-400/30">
                    O(V³) Time / O(V²) Space
                  </span>
                </div>
                <p className="text-slate-300">
                  Computes shortest distances between every pair of vertices in a single pass of three nested loops.
                  Dynamic programming recurrence:
                </p>
                <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-[#00f0ff]">
                  D^(k)[i][j] = min( D^(k-1)[i][j], D^(k-1)[i][k] + D^(k-1)[k][j] )
                </div>
              </div>
            )}

            {selectedAlg === 'mst' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">Minimum Spanning Tree (Kruskal &amp; Prim)</h4>
                  <span className="px-2 py-0.5 rounded bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30">
                    O(E log V)
                  </span>
                </div>
                <p className="text-slate-300">
                  Kruskal's algorithm sorts all edges and uses Disjoint Set Union (DSU) to avoid cycles.
                  Prim's algorithm grows a tree vertex-by-vertex using a min-heap priority queue. Both find the minimal
                  cost tree that interconnects all network nodes.
                </p>
              </div>
            )}

            {selectedAlg === 'flow' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">Edmonds-Karp Max Flow / Min Cut</h4>
                  <span className="px-2 py-0.5 rounded bg-red-400/10 text-red-300 border border-red-400/30">
                    O(V · E²)
                  </span>
                </div>
                <p className="text-slate-300">
                  An implementation of the Ford-Fulkerson method that uses Breadth-First Search (BFS) to find augmenting paths.
                  By the Max-Flow Min-Cut Theorem, maximum network throughput equals the total capacity of bottleneck cut links.
                </p>
              </div>
            )}

            {selectedAlg === 'tarjan' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-base font-bold text-white">Tarjan's Bridge &amp; Articulation Point Analysis</h4>
                  <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    O(V + E)
                  </span>
                </div>
                <p className="text-slate-300">
                  Using a single Depth-First Search (DFS) pass, Tarjan's algorithm computes discovery times <code>tin[u]</code>
                  and low-link values <code>low[u]</code> to detect single points of failure in linear time.
                </p>
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
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
