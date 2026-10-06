import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe,
  Shield,
  Cpu,
  Layers,
  Network,
  Monitor,
  Server,
  Database,
  Radio,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  X,
  Crosshair,
} from 'lucide-react';
import type {
  NetworkEdge,
  NetworkNode,
  NodeType,
  RoutingResult,
} from '../types/network';

interface TopologyCanvasProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  activePath: string[] | null;
  altPath: string[] | null;
  sourceNodeId: string | null;
  targetNodeId: string | null;
  isAddLinkMode: boolean;
  linkSourceId: string | null;
  isGeoView: boolean;
  darkMode: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onSetSourceNode: (nodeId: string) => void;
  onSetTargetNode: (nodeId: string) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeDoubleClick: (node: NetworkNode) => void;
  onEdgeDoubleClick: (edge: NetworkEdge) => void;
  onConnectNodes: (sourceId: string, targetId: string) => void;
  onCancelAddLink: () => void;
}

const NODE_RADIUS = 28;

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  activePath,
  altPath,
  sourceNodeId,
  targetNodeId,
  isAddLinkMode,
  linkSourceId,
  isGeoView,
  darkMode,
  onSelectNode,
  onSelectEdge,
  onSetSourceNode,
  onSetTargetNode,
  onNodeMove,
  onNodeDoubleClick,
  onEdgeDoubleClick,
  onConnectNodes,
  onCancelAddLink,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Pan & Zoom transform state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Live mouse position for link preview
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Active path set of edge keys (undirected pair representation)
  const activeEdgeKeys = useMemo(() => {
    const set = new Set<string>();
    if (!activePath || activePath.length < 2) return set;
    for (let i = 0; i < activePath.length - 1; i++) {
      const u = activePath[i];
      const v = activePath[i + 1];
      set.add(`${u}->${v}`);
      set.add(`${v}->${u}`);
    }
    return set;
  }, [activePath]);

  // Alternative path set of edge keys
  const altEdgeKeys = useMemo(() => {
    const set = new Set<string>();
    if (!altPath || altPath.length < 2) return set;
    for (let i = 0; i < altPath.length - 1; i++) {
      const u = altPath[i];
      const v = altPath[i + 1];
      set.add(`${u}->${v}`);
      set.add(`${v}->${u}`);
    }
    return set;
  }, [altPath]);

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(3.0, Math.max(0.35, prev * zoomFactor)));
  };

  // Canvas background mousedown (for panning)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Track mouse in SVG coordinates
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      setMousePos({ x: rawX, y: rawY });
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const newX = Math.round((e.clientX - rect.left - pan.x) / zoom - dragOffset.x);
        const newY = Math.round((e.clientY - rect.top - pan.y) / zoom - dragOffset.y);
        onNodeMove(draggingNodeId, Math.max(40, newX), Math.max(40, newY));
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, node: NetworkNode) => {
    e.stopPropagation();
    if (isAddLinkMode) {
      if (linkSourceId && linkSourceId !== node.id) {
        onConnectNodes(linkSourceId, node.id);
      }
      return;
    }

    setDraggingNodeId(node.id);
    onSelectNode(node.id);
    onSelectEdge(null);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseSvgX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseSvgY = (e.clientY - rect.top - pan.y) / zoom;
      setDragOffset({
        x: mouseSvgX - node.x,
        y: mouseSvgY - node.y,
      });
    }
  };

  // Node icon resolver
  const renderNodeIcon = (type: NodeType) => {
    const size = 18;
    switch (type) {
      case 'Internet':
        return <Globe size={size} />;
      case 'Firewall':
        return <Shield size={size} />;
      case 'Core Router':
        return <Layers size={size} />;
      case 'Router':
        return <Cpu size={size} />;
      case 'Switch':
        return <Network size={size} />;
      case 'PC':
        return <Monitor size={size} />;
      case 'Server':
        return <Server size={size} />;
      case 'Database':
        return <Database size={size} />;
      case 'ISP':
        return <Radio size={size} />;
      default:
        return <Cpu size={size} />;
    }
  };

  // Quick reset view
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to nodes
  const handleFitView = () => {
    if (nodes.length === 0) {
      handleResetView();
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y));

    const width = maxX - minX + 160;
    const height = maxY - minY + 160;
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const scale = Math.min(
      Math.max(0.4, Math.min(containerWidth / width, containerHeight / height)),
      1.4
    );

    setZoom(scale);
    setPan({
      x: containerWidth / 2 - ((minX + maxX) / 2) * scale,
      y: containerHeight / 2 - ((minY + maxY) / 2) * scale,
    });
  };

  // Compute node coordinates based on geo view toggle
  const getNodeCoordinates = (node: NetworkNode) => {
    if (isGeoView && node.lat !== undefined && node.lng !== undefined) {
      // Map India / Global coordinates to canvas viewBox
      // Approx bounding box for Indian subcontinent: Lat 8 to 35, Lng 68 to 92
      const x = 120 + ((node.lng - 68) / (92 - 68)) * 640;
      const y = 80 + ((35 - node.lat) / (35 - 8)) * 460;
      return { x: Math.round(x), y: Math.round(y) };
    }
    return { x: node.x, y: node.y };
  };

  // Create node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; node: NetworkNode }>();
    for (const n of nodes) {
      map.set(n.id, { ...getNodeCoordinates(n), node: n });
    }
    return map;
  }, [nodes, isGeoView]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none rounded-xl border transition-colors ${
        darkMode
          ? 'bg-[#060a10] border-[#152234] bg-cyber-grid'
          : 'bg-[#f8fafc] border-slate-200 bg-cyber-grid-light'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Add Link Banner */}
      {isAddLinkMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#00f0ff]/15 border border-[#00f0ff] backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono text-[#00f0ff] flex items-center gap-3 shadow-lg shadow-[#00f0ff]/20 animate-pulse">
          <Crosshair className="w-4 h-4 text-[#00f0ff]" />
          <span>
            {linkSourceId
              ? `Select destination node to link with [${linkSourceId}]`
              : 'Click any source node to initiate link'}
          </span>
          <button
            type="button"
            onClick={onCancelAddLink}
            className="p-1 hover:bg-[#00f0ff]/20 rounded-full text-slate-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Canvas Controls (Zoom / Pan / Fit) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-[#090e17]/90 border border-slate-800 p-1.5 rounded-lg shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.0, z * 1.2))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-[#00f0ff] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.35, z / 1.2))}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-[#00f0ff] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono"
          title="Reset View 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={handleFitView}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-[#00f0ff] transition-colors"
          title="Fit Topology to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Route Quick Legend */}
      <div className="absolute top-4 left-4 z-20 hidden sm:flex flex-col gap-1.5 bg-[#090e17]/85 border border-slate-800/80 p-2.5 rounded-lg backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-sm shadow-[#00f0ff]/50" />
          <span>Active Path (Optimal Route)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc] shadow-sm shadow-[#c084fc]/50" />
          <span>Alternative K-Path (Backup)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <span>Down / Critical Outage</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          <span>Congested Link (&gt;50%)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ cursor: isPanning ? 'grabbing' : isAddLinkMode ? 'crosshair' : 'default' }}
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="glow-cyan-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-purple-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Arrowhead Markers */}
          <marker
            id="arrow-cyan"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00f0ff" />
          </marker>
          <marker
            id="arrow-purple"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Geo View Map Background Overlay (Subtle outlines for India/Continents) */}
          {isGeoView && (
            <g opacity={0.25} className="pointer-events-none">
              <rect x="80" y="50" width="720" height="520" fill="none" stroke="#00f0ff" strokeDasharray="4 6" />
              <text x="95" y="75" fill="#00f0ff" fontSize="12" fontFamily="JetBrains Mono">
                GPS COORDINATE GRID: 8°N - 35°N / 68°E - 92°E
              </text>
            </g>
          )}

          {/* Render Edges */}
          {edges.map((edge) => {
            const uPos = nodeMap.get(edge.u);
            const vPos = nodeMap.get(edge.v);
            if (!uPos || !vPos) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isDown = edge.status === 'DOWN';
            const isOnActivePath = activeEdgeKeys.has(`${edge.u}->${edge.v}`);
            const isOnAltPath = !isOnActivePath && altEdgeKeys.has(`${edge.u}->${edge.v}`);

            // Midpoint coordinates for labels
            const midX = (uPos.x + vPos.x) / 2;
            const midY = (uPos.y + vPos.y) / 2;

            // Stroke color based on status and path membership
            let strokeColor = '#334155'; // default dark slate
            let strokeWidth = Math.max(2, Math.min(6, edge.bandwidth / 2000));
            let dashArray = 'none';

            if (isDown) {
              strokeColor = '#ef4444';
              dashArray = '6 6';
            } else if (isOnActivePath) {
              strokeColor = '#00f0ff';
              strokeWidth = 4.5;
            } else if (isOnAltPath) {
              strokeColor = '#c084fc';
              strokeWidth = 3.5;
              dashArray = '5 5';
            } else {
              // Color by congestion
              if (edge.congestionLevel === 'CRITICAL') strokeColor = '#ef4444';
              else if (edge.congestionLevel === 'HIGH') strokeColor = '#f97316';
              else if (edge.congestionLevel === 'MEDIUM') strokeColor = '#f59e0b';
              else strokeColor = '#1e293b';
            }

            return (
              <g
                key={edge.id}
                className="cursor-pointer transition-all group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(edge.id);
                  onSelectNode(null);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onEdgeDoubleClick(edge);
                }}
              >
                {/* Thick invisible hit area for easy clicking */}
                <line
                  x1={uPos.x}
                  y1={uPos.y}
                  x2={vPos.x}
                  y2={vPos.y}
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Base Edge Line */}
                <line
                  x1={uPos.x}
                  y1={uPos.y}
                  x2={vPos.x}
                  y2={vPos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  filter={isOnActivePath ? 'url(#glow-cyan-filter)' : undefined}
                />

                {/* Animated Packet Stream on Active Path */}
                {isOnActivePath && !isDown && (
                  <line
                    x1={uPos.x}
                    y1={uPos.y}
                    x2={vPos.x}
                    y2={vPos.y}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-packet-travel"
                  />
                )}

                {/* Edge Metrics Pill (Latency & Congestion) */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-28"
                    y="-10"
                    width="56"
                    height="20"
                    rx="10"
                    fill={isDown ? '#450a0a' : isSelected ? '#00f0ff' : '#090e17'}
                    stroke={isDown ? '#ef4444' : isSelected ? '#ffffff' : isOnActivePath ? '#00f0ff' : '#1e293b'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                    className="transition-colors shadow-sm"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? '#070b12' : isDown ? '#fca5a5' : '#cbd5e1'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                  >
                    {isDown ? 'DOWN' : `${edge.latency}ms`}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Interactive Link Preview Line (When Add Link mode is active) */}
          {isAddLinkMode && linkSourceId && nodeMap.get(linkSourceId) && (
            <line
              x1={nodeMap.get(linkSourceId)!.x}
              y1={nodeMap.get(linkSourceId)!.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#00f0ff"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="pointer-events-none"
            />
          )}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const pos = nodeMap.get(node.id);
            if (!pos) return null;

            const isSelected = selectedNodeId === node.id;
            const isSource = sourceNodeId === node.id;
            const isTarget = targetNodeId === node.id;
            const isDown = node.status === 'DOWN';
            const isQuarantined = node.status === 'QUARANTINED';
            const isLinkSource = linkSourceId === node.id;

            // Border color & glow based on state
            let ringColor = '#334155';
            let fillColor = '#0b111b';

            if (isDown) {
              ringColor = '#ef4444';
              fillColor = '#1f1315';
            } else if (isQuarantined) {
              ringColor = '#f59e0b';
              fillColor = '#241a0e';
            } else if (isSource) {
              ringColor = '#00ff88';
              fillColor = '#0a2318';
            } else if (isTarget) {
              ringColor = '#38bdf8';
              fillColor = '#092134';
            } else if (isSelected) {
              ringColor = '#00f0ff';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onNodeDoubleClick(node);
                }}
              >
                {/* Attacked / Suspicious Radar Pulse */}
                {isQuarantined && (
                  <circle
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="radar-ping"
                  />
                )}

                {/* Source / Target Selection Ring */}
                {(isSource || isTarget || isLinkSource) && (
                  <circle
                    r={NODE_RADIUS + 6}
                    fill="none"
                    stroke={isSource ? '#00ff88' : isTarget ? '#38bdf8' : '#00f0ff'}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  r={NODE_RADIUS}
                  fill={fillColor}
                  stroke={ringColor}
                  strokeWidth={isSelected || isSource || isTarget ? '2.5' : '1.5'}
                  filter={
                    isSource || isSelected
                      ? 'url(#glow-cyan-filter)'
                      : isDown
                      ? 'url(#glow-red-filter)'
                      : undefined
                  }
                  className="transition-colors"
                />

                {/* Node Icon inside SVG */}
                <foreignObject
                  x={-NODE_RADIUS}
                  y={-NODE_RADIUS}
                  width={NODE_RADIUS * 2}
                  height={NODE_RADIUS * 2}
                  className="pointer-events-none"
                >
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center transition-colors ${
                      isDown
                        ? 'text-red-400'
                        : isQuarantined
                        ? 'text-amber-400'
                        : isSource
                        ? 'text-[#00ff88]'
                        : isTarget
                        ? 'text-[#38bdf8]'
                        : isSelected
                        ? 'text-[#00f0ff]'
                        : 'text-slate-300'
                    }`}
                  >
                    {renderNodeIcon(node.type)}
                  </div>
                </foreignObject>

                {/* Status Dot (Top-Right of Node) */}
                <circle
                  cx={NODE_RADIUS * 0.7}
                  cy={-NODE_RADIUS * 0.7}
                  r="5"
                  fill={isDown ? '#ef4444' : isQuarantined ? '#f59e0b' : '#00ff88'}
                  stroke="#070b12"
                  strokeWidth="1.5"
                />

                {/* Crown Jewel Badge (Golden Star if sensitive asset) */}
                {node.isCrownJewel && (
                  <g transform={`translate(${-NODE_RADIUS * 0.7}, ${-NODE_RADIUS * 0.7})`}>
                    <circle r="6" fill="#eab308" stroke="#070b12" strokeWidth="1" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#070b12"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      ★
                    </text>
                  </g>
                )}

                {/* Node Label & IP Subtitle Underneath */}
                <g transform={`translate(0, ${NODE_RADIUS + 14})`}>
                  <text
                    textAnchor="middle"
                    fill={isSelected ? '#00f0ff' : darkMode ? '#e2e8f0' : '#1e293b'}
                    fontSize="11"
                    fontFamily="Inter"
                    fontWeight="600"
                    className="drop-shadow-xs"
                  >
                    {node.label}
                  </text>
                  <text
                    y="13"
                    textAnchor="middle"
                    fill={darkMode ? '#64748b' : '#94a3b8'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                  >
                    {node.ip}
                  </text>
                </g>

                {/* Quick Source/Target Assignment Hover Context Buttons */}
                {isSelected && !isAddLinkMode && (
                  <g transform={`translate(${NODE_RADIUS + 10}, ${-NODE_RADIUS / 2})`}>
                    <g
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetSourceNode(node.id);
                      }}
                    >
                      <rect x="0" y="0" width="34" height="18" rx="4" fill="#00ff88" />
                      <text
                        x="17"
                        y="12"
                        textAnchor="middle"
                        fill="#070b12"
                        fontSize="9"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        SRC
                      </text>
                    </g>
                    <g
                      className="cursor-pointer hover:opacity-80"
                      transform="translate(0, 22)"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetTargetNode(node.id);
                      }}
                    >
                      <rect x="0" y="0" width="34" height="18" rx="4" fill="#38bdf8" />
                      <text
                        x="17"
                        y="12"
                        textAnchor="middle"
                        fill="#070b12"
                        fontSize="9"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        DST
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
