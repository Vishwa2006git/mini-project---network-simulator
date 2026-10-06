import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { TopologyCanvas } from './components/TopologyCanvas';
import { PathAnalysisPanel } from './components/PathAnalysisPanel';
import { EventLogPanel } from './components/EventLogPanel';
import { MetricsStrip } from './components/MetricsStrip';
import { StoryDemoModal, STORY_STEPS } from './components/StoryDemoModal';
import { ResilienceModal } from './components/ResilienceModal';
import { IntegrationsModal } from './components/IntegrationsModal';
import { AlgorithmGuideModal } from './components/AlgorithmGuideModal';
import { AiAnalystModal } from './components/AiAnalystModal';
import { NodeEditModal } from './components/NodeEditModal';
import { EdgeEditModal } from './components/EdgeEditModal';
import { SelfTestModal } from './components/SelfTestModal';

import {
  COLLEGE_NETWORK,
  ISP_BACKBONE,
  DUAL_ISP_CAMPUS,
  SMALL_OFFICE,
  generateRandomConnectedTopology,
  BLANK_CANVAS,
} from './data/presets';
import { dijkstra } from './engine/dijkstra';
import { bellmanFord } from './engine/bellmanFord';
import { aStar } from './engine/aStar';
import { floydWarshallAllPairs, reconstructFloydWarshallPath } from './engine/floydWarshall';
import { kShortestPaths } from './engine/kShortestPaths';
import { analyzeResilience } from './engine/resilience';
import { StorageAdapter } from './integrations/storageAdapter';

import type {
  AlgorithmType,
  BalancedWeights,
  CongestionLevel,
  EventLogEntry,
  KShortestPathItem,
  NetworkEdge,
  NetworkMetricsSnapshot,
  NetworkNode,
  OptimizationMode,
  ResilienceReport,
  RoutingResult,
} from './types/network';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(true);

  // Network topology state
  const [nodes, setNodes] = useState<NetworkNode[]>(COLLEGE_NETWORK.nodes);
  const [edges, setEdges] = useState<NetworkEdge[]>(COLLEGE_NETWORK.edges);

  // Selected endpoints and elements
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>('PC_CSE1');
  const [targetNodeId, setTargetNodeId] = useState<string | null>('SRV_APP');

  // Algorithm & optimization settings
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('latency');
  const [balancedWeights, setBalancedWeights] = useState<BalancedWeights>({
    costWeight: 0.25,
    latencyWeight: 0.35,
    congestionWeight: 0.25,
    securityWeight: 0.15,
  });

  // Routing output state
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [kPaths, setKPaths] = useState<KShortestPathItem[]>([]);
  const [selectedAltPath, setSelectedAltPath] = useState<string[] | null>(null);

  // Simulation loop controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [autoReroute, setAutoReroute] = useState(true);
  const [chaosMode, setChaosMode] = useState(false);
  const [liveProbe, setLiveProbe] = useState(true);
  const [isGeoView, setIsGeoView] = useState(false);
  const [snmpSimulated, setSnmpSimulated] = useState(true);

  // Add Link Interactive Mode
  const [isAddLinkMode, setIsAddLinkMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

  // Event Logs and Metrics History
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([
    {
      id: 'init-log',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      timeMs: Date.now(),
      type: 'info',
      source: 'NOC-MONITOR',
      message: 'VK Simulator App initialized. Loaded College Campus Network topology.',
    },
  ]);
  const [metricsHistory, setMetricsHistory] = useState<NetworkMetricsSnapshot[]>([]);

  // Resilience Report
  const [resilienceReport, setResilienceReport] = useState<ResilienceReport | null>(null);

  // Undo / Redo history
  const [historyStack, setHistoryStack] = useState<Array<{ nodes: NetworkNode[]; edges: NetworkEdge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Modals state
  const [isStoryDemoOpen, setIsStoryDemoOpen] = useState(false);
  const [isResilienceModalOpen, setIsResilienceModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isAlgorithmGuideOpen, setIsAlgorithmGuideOpen] = useState(false);
  const [isAiAnalystOpen, setIsAiAnalystOpen] = useState(false);
  const [isSelfTestOpen, setIsSelfTestOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<NetworkEdge | null>(null);

  // Storage adapter ref
  const storageAdapter = useRef(new StorageAdapter());

  // Helper to add event log
  const logEvent = useCallback(
    (type: EventLogEntry['type'], source: string, message: string, details?: string) => {
      const entry: EventLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        timeMs: Date.now(),
        type,
        source,
        message,
        details,
      };
      setEventLogs((prev) => [...prev.slice(-99), entry]);
    },
    []
  );

  // Push state to undo/redo history
  const pushHistory = useCallback((newNodes: NetworkNode[], newEdges: NetworkEdge[]) => {
    setHistoryStack((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { nodes: newNodes, edges: newEdges }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Recalculate route whenever topology or algorithm settings change
  const computeRouting = useCallback(
    (curNodes = nodes, curEdges = edges, curSrc = sourceNodeId, curDst = targetNodeId) => {
      if (!curSrc || !curDst || curNodes.length < 2) {
        setRoutingResult(null);
        setKPaths([]);
        return;
      }

      const start = performance.now();
      let res: RoutingResult;

      switch (algorithm) {
        case 'bellman-ford':
          res = bellmanFord(curNodes, curEdges, curSrc, curDst, optimizationMode, balancedWeights);
          break;
        case 'a-star':
          res = aStar(curNodes, curEdges, curSrc, curDst, optimizationMode, balancedWeights);
          break;
        case 'floyd-warshall': {
          const fw = floydWarshallAllPairs(curNodes, curEdges, optimizationMode, balancedWeights);
          res = reconstructFloydWarshallPath(fw, curSrc, curDst, curEdges);
          break;
        }
        case 'dijkstra':
        default:
          res = dijkstra(curNodes, curEdges, curSrc, curDst, optimizationMode, balancedWeights);
          break;
      }

      res.executionTimeMs = performance.now() - start;
      setRoutingResult(res);

      // Compute K-shortest alternate standby paths using Yen's algorithm
      const alts = kShortestPaths(curNodes, curEdges, curSrc, curDst, 3, optimizationMode, balancedWeights);
      setKPaths(alts);

      // Update resilience report
      const rep = analyzeResilience(curNodes, curEdges);
      setResilienceReport(rep);
    },
    [nodes, edges, sourceNodeId, targetNodeId, algorithm, optimizationMode, balancedWeights]
  );

  // Run route calculation on mount and changes
  useEffect(() => {
    computeRouting();
  }, [computeRouting]);

  // Snapshot metrics
  const recordMetricsSnapshot = useCallback(
    (curLatency = routingResult?.totalLatency || 0) => {
      const totalTraffic = edges.reduce((acc, e) => acc + (e.status === 'UP' ? e.currentTraffic : 0), 0);
      const avgLoss =
        edges.length > 0 ? edges.reduce((acc, e) => acc + e.packetLoss, 0) / edges.length : 0;
      const upNodes = nodes.filter((n) => n.status === 'UP').length;
      const downNodes = nodes.length - upNodes;
      const congested = edges.filter((e) => e.status === 'UP' && e.utilization > 50).length;

      const healthScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (nodes.length > 0 ? (upNodes / nodes.length) * 60 : 60) +
              (edges.length > 0 ? (1 - congested / edges.length) * 30 : 30) -
              avgLoss * 2
          )
        )
      );

      const snapshot: NetworkMetricsSnapshot = {
        timestamp: Date.now(),
        timeLabel: new Date().toLocaleTimeString([], { hour12: false }),
        activePathLatency: curLatency,
        totalTrafficMbps: totalTraffic,
        averagePacketLoss: Number(avgLoss.toFixed(2)),
        averageUtilization: Math.round(
          edges.length > 0
            ? edges.reduce((acc, e) => acc + e.utilization, 0) / edges.length
            : 0
        ),
        healthScore,
        activeNodes: upNodes,
        failedNodes: downNodes,
        congestedLinks: congested,
        reliabilityScore: resilienceReport?.reliabilityScore || 100,
      };

      setMetricsHistory((prev) => [...prev.slice(-20), snapshot]);
    },
    [edges, nodes, routingResult?.totalLatency, resilienceReport?.reliabilityScore]
  );

  // Simulation tick loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1000 / speed);
    const interval = setInterval(() => {
      // Simulate live network fluctuation
      setEdges((prevEdges) => {
        let changed = false;
        const updated = prevEdges.map((e) => {
          if (e.status === 'DOWN') return e;

          // Minor jitter in traffic
          const jitter = (Math.random() - 0.48) * (e.bandwidth * 0.04);
          const newTraffic = Math.max(10, Math.min(e.bandwidth, Math.round(e.currentTraffic + jitter)));
          const utilization = Math.round((newTraffic / e.bandwidth) * 100);
          const congestionLevel: CongestionLevel =
            utilization > 90
              ? 'CRITICAL'
              : utilization > 80
              ? 'HIGH'
              : utilization > 50
              ? 'MEDIUM'
              : 'LOW';

          return {
            ...e,
            currentTraffic: newTraffic,
            utilization,
            congestionLevel,
          };
        });

        // Chaos mode randomly introduces transient spikes or link cuts
        if (chaosMode && Math.random() < 0.15) {
          const victimIdx = Math.floor(Math.random() * updated.length);
          if (updated[victimIdx].status === 'UP') {
            updated[victimIdx] = {
              ...updated[victimIdx],
              latency: updated[victimIdx].latency + 30,
              currentTraffic: Math.round(updated[victimIdx].bandwidth * 0.95),
              utilization: 95,
              congestionLevel: 'CRITICAL',
            };
            logEvent(
              'alert',
              'CHAOS-MONKEY',
              `Injected latency spike on link [${updated[victimIdx].u} ↔ ${updated[victimIdx].v}].`
            );
          }
        }

        return updated;
      });

      recordMetricsSnapshot();

      if (autoReroute) {
        computeRouting();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, autoReroute, chaosMode, computeRouting, recordMetricsSnapshot, logEvent]);

  // Handle Preset selection
  const handleSelectPreset = (presetKey: string) => {
    let chosen = COLLEGE_NETWORK;
    if (presetKey === 'isp') {
      chosen = ISP_BACKBONE;
      setIsGeoView(true);
    } else if (presetKey === 'dual-isp') {
      chosen = DUAL_ISP_CAMPUS;
      setIsGeoView(false);
    } else if (presetKey === 'small-office') {
      chosen = SMALL_OFFICE;
      setIsGeoView(false);
    } else if (presetKey === 'random') {
      chosen = generateRandomConnectedTopology(9);
      setIsGeoView(false);
    } else if (presetKey === 'blank') {
      chosen = BLANK_CANVAS;
      setIsGeoView(false);
    } else {
      setIsGeoView(false);
    }

    setNodes(chosen.nodes);
    setEdges(chosen.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedAltPath(null);

    const firstNode = chosen.nodes[0]?.id || null;
    const lastNode = chosen.nodes[chosen.nodes.length - 1]?.id || null;
    setSourceNodeId(firstNode);
    setTargetNodeId(lastNode);

    pushHistory(chosen.nodes, chosen.edges);
    logEvent('info', 'TOPOLOGY', `Switched active preset to "${chosen.name}".`);
  };

  // Step tick button
  const handleStepTick = () => {
    recordMetricsSnapshot();
    computeRouting();
    logEvent('info', 'MANUAL-TICK', 'Single simulation cycle advanced.');
  };

  // Add Router Action
  const handleAddRouter = () => {
    const newId = `R_${Date.now().toString().slice(-4)}`;
    const newNode: NetworkNode = {
      id: newId,
      label: `Router ${newId}`,
      type: 'Router',
      ip: `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      status: 'UP',
      riskScore: 10,
      x: 350 + Math.floor((Math.random() - 0.5) * 200),
      y: 250 + Math.floor((Math.random() - 0.5) * 200),
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    pushHistory(newNodes, edges);
    setSelectedNodeId(newId);
    logEvent('info', 'TOPOLOGY', `Provisioned new router node [${newId}].`);
  };

  // Add Link Connect
  const handleConnectNodes = (uId: string, vId: string) => {
    if (uId === vId) {
      logEvent('warning', 'VALIDATOR', 'Rejected self-loop link creation.');
      return;
    }

    const exists = edges.some(
      (e) => (e.u === uId && e.v === vId) || (e.u === vId && e.v === uId)
    );
    if (exists) {
      logEvent('warning', 'VALIDATOR', `Link between [${uId}] and [${vId}] already exists.`);
      setIsAddLinkMode(false);
      setLinkSourceId(null);
      return;
    }

    const newEdge: NetworkEdge = {
      id: `e_${uId}_${vId}`,
      u: uId,
      v: vId,
      latency: 5,
      bandwidth: 1000,
      currentTraffic: 150,
      cost: 5,
      packetLoss: 0,
      status: 'UP',
      utilization: 15,
      congestionLevel: 'LOW',
    };

    const newEdges = [...edges, newEdge];
    setEdges(newEdges);
    pushHistory(nodes, newEdges);
    setIsAddLinkMode(false);
    setLinkSourceId(null);
    logEvent('info', 'TOPOLOGY', `Interconnected nodes [${uId}] ↔ [${vId}] with 1 Gbps link.`);
    computeRouting(nodes, newEdges);
  };

  // Fail selected node / edge
  const handleFailSelectedNode = () => {
    if (selectedNodeId) {
      const updatedNodes = nodes.map((n) =>
        n.id === selectedNodeId ? { ...n, status: (n.status === 'UP' ? 'DOWN' : 'UP') as any } : n
      );
      setNodes(updatedNodes);
      pushHistory(updatedNodes, edges);
      const isNowDown = updatedNodes.find((n) => n.id === selectedNodeId)?.status === 'DOWN';
      logEvent(
        isNowDown ? 'alert' : 'recovery',
        'FAILURE-INJECT',
        `Node [${selectedNodeId}] marked as ${isNowDown ? 'DOWN' : 'UP'}.`
      );
      computeRouting(updatedNodes, edges);
    } else if (selectedEdgeId) {
      const updatedEdges = edges.map((e) =>
        e.id === selectedEdgeId ? { ...e, status: (e.status === 'UP' ? 'DOWN' : 'UP') as any } : e
      );
      setEdges(updatedEdges);
      pushHistory(nodes, updatedEdges);
      const isNowDown = updatedEdges.find((e) => e.id === selectedEdgeId)?.status === 'DOWN';
      logEvent(
        isNowDown ? 'alert' : 'recovery',
        'FAILURE-INJECT',
        `Link [${selectedEdgeId}] marked as ${isNowDown ? 'DOWN' : 'UP'}.`
      );
      computeRouting(nodes, updatedEdges);
    }
  };

  // Restore All
  const handleRestoreAll = () => {
    const updatedNodes = nodes.map((n) => ({ ...n, status: 'UP' as const }));
    const updatedEdges = edges.map((e) => ({
      ...e,
      status: 'UP' as const,
      congestionLevel: 'LOW' as const,
    }));
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    pushHistory(updatedNodes, updatedEdges);
    logEvent('recovery', 'NOC-RECOVERY', 'All nodes and fiber links fully restored to operational UP state.');
    computeRouting(updatedNodes, updatedEdges);
  };

  // Spike active path latency
  const handleIncreaseLatency = () => {
    if (!routingResult?.path || routingResult.path.length < 2) return;
    const u = routingResult.path[0];
    const v = routingResult.path[1];
    setEdges((prev) =>
      prev.map((e) => {
        if ((e.u === u && e.v === v) || (e.u === v && e.v === u)) {
          return { ...e, latency: e.latency + 25 };
        }
        return e;
      })
    );
    logEvent('warning', 'LATENCY-SPIKE', `Injected +25ms latency penalty along [${u} ↔ ${v}].`);
    computeRouting();
  };

  // Spike traffic
  const handleIncreaseTraffic = () => {
    if (!routingResult?.path || routingResult.path.length < 2) return;
    const u = routingResult.path[0];
    const v = routingResult.path[1];
    setEdges((prev) =>
      prev.map((e) => {
        if ((e.u === u && e.v === v) || (e.u === v && e.v === u)) {
          const newTraffic = e.currentTraffic + 400;
          const utilization = Math.round((newTraffic / e.bandwidth) * 100);
          return {
            ...e,
            currentTraffic: newTraffic,
            utilization,
            congestionLevel: utilization > 80 ? 'CRITICAL' : 'HIGH',
          };
        }
        return e;
      })
    );
    logEvent('alert', 'TRAFFIC-SURGE', `Injected +400 Mbps burst on link [${u} ↔ ${v}].`);
    computeRouting();
  };

  // Simulate DDoS Attack
  const handleSimulateDDoS = () => {
    const target = nodes.find((n) => n.isCrownJewel) || nodes[0];
    if (!target) return;

    setNodes((prev) =>
      prev.map((n) => (n.id === target.id ? { ...n, status: 'QUARANTINED', riskScore: 95 } : n))
    );

    // Flood incoming links to this target
    setEdges((prev) =>
      prev.map((e) => {
        if (e.u === target.id || e.v === target.id) {
          return {
            ...e,
            currentTraffic: e.bandwidth,
            utilization: 100,
            congestionLevel: 'CRITICAL',
            packetLoss: 8.5,
          };
        }
        return e;
      })
    );

    logEvent(
      'attack',
      'CYBER-SOC',
      `Volumetric DDoS attack identified targeting [${target.label}]. Node quarantined and link saturated.`
    );
    computeRouting();
  };

  // Delete selected item
  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const newEdges = edges.filter((e) => e.u !== selectedNodeId && e.v !== selectedNodeId);
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedNodeId(null);
      pushHistory(newNodes, newEdges);
      logEvent('info', 'TOPOLOGY', `Removed node [${selectedNodeId}] and connected links.`);
      computeRouting(newNodes, newEdges);
    } else if (selectedEdgeId) {
      const newEdges = edges.filter((e) => e.id !== selectedEdgeId);
      setEdges(newEdges);
      setSelectedEdgeId(null);
      pushHistory(nodes, newEdges);
      logEvent('info', 'TOPOLOGY', `Removed link [${selectedEdgeId}].`);
      computeRouting(nodes, newEdges);
    }
  };

  // Node Move
  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n)));
  };

  // Fail a link on the active path (Failover test)
  const handleFailLinkOnPath = () => {
    if (!routingResult?.path || routingResult.path.length < 2) return;
    const u = routingResult.path[0];
    const v = routingResult.path[1];
    const targetEdge = edges.find(
      (e) => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );
    if (!targetEdge) return;

    const newEdges = edges.map((e) => (e.id === targetEdge.id ? { ...e, status: 'DOWN' as const } : e));
    setEdges(newEdges);
    pushHistory(nodes, newEdges);
    logEvent(
      'alert',
      'FAILOVER-TEST',
      `Severed active link [${u} ↔ ${v}]. Automatic rerouting initiated.`
    );
    computeRouting(nodes, newEdges);
  };

  // Apply story step
  const handleApplyStoryStep = (stepIdx: number) => {
    if (stepIdx === 0) {
      // Step 1: Baseline
      handleSelectPreset('college');
    } else if (stepIdx === 1) {
      // Step 2: Traffic surge
      setEdges((prev) =>
        prev.map((e) =>
          e.id === 'e_fw_core'
            ? { ...e, currentTraffic: 9200, utilization: 92, congestionLevel: 'CRITICAL' }
            : e
        )
      );
      logEvent('alert', 'STORY-MODE', 'Step 2 Applied: Firewall-Core link flooded (92% util).');
      computeRouting();
    } else if (stepIdx === 2) {
      // Step 3: Sever primary link
      setEdges((prev) =>
        prev.map((e) => (e.id === 'e_fw_core' ? { ...e, status: 'DOWN' } : e))
      );
      logEvent('alert', 'STORY-MODE', 'Step 3 Applied: Severed primary FW1-CORE link. Rerouting via BACKUP_RTR.');
      computeRouting();
    } else if (stepIdx === 3) {
      // Step 4: Malware on SRV_APP
      setNodes((prev) =>
        prev.map((n) => (n.id === 'SRV_APP' ? { ...n, status: 'QUARANTINED', riskScore: 85 } : n))
      );
      logEvent('attack', 'STORY-MODE', 'Step 4 Applied: SRV_APP compromised and isolated in quarantine.');
      computeRouting();
    } else if (stepIdx === 4) {
      // Step 5: Full recovery
      handleRestoreAll();
      logEvent('recovery', 'STORY-MODE', 'Step 5 Applied: Incident resolved. Network health restored to 100%.');
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      name: 'VK_Topology_Export',
      description: 'Exported from VK Simulator App',
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vk_topology_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logEvent('info', 'STORAGE', 'Exported network topology as JSON file.');
  };

  // Import JSON
  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.nodes && parsed.edges && Array.isArray(parsed.nodes)) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          pushHistory(parsed.nodes, parsed.edges);
          computeRouting(parsed.nodes, parsed.edges);
          logEvent('info', 'STORAGE', `Successfully imported ${parsed.nodes.length} nodes from file.`);
        }
      } catch (err) {
        logEvent('warning', 'VALIDATOR', 'Failed to parse imported JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Export CSV
  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Type', 'Source', 'Message'],
      ...eventLogs.map((l) => [l.timestamp, l.type, l.source, `"${l.message.replace(/"/g, '""')}"`]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vk_event_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logEvent('info', 'STORAGE', 'Exported NOC incident log as CSV.');
  };

  // Download PNG Canvas
  const handleDownloadPng = () => {
    const svgElem = document.querySelector('svg');
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `vk_topology_canvas_${Date.now()}.png`;
      a.click();
      logEvent('info', 'STORAGE', 'Downloaded snapshot of topology canvas as PNG.');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyStack[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setNodes(prev.nodes);
      setEdges(prev.edges);
      computeRouting(prev.nodes, prev.edges);
      logEvent('info', 'HISTORY', 'Undo performed.');
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const next = historyStack[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setNodes(next.nodes);
      setEdges(next.edges);
      computeRouting(next.nodes, next.edges);
      logEvent('info', 'HISTORY', 'Redo performed.');
    }
  };

  // Calculate live health score
  const upNodesCount = nodes.filter((n) => n.status === 'UP').length;
  const congestedCount = edges.filter((e) => e.status === 'UP' && e.utilization > 50).length;
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (nodes.length > 0 ? (upNodesCount / nodes.length) * 60 : 60) +
          (edges.length > 0 ? (1 - congestedCount / edges.length) * 40 : 40)
      )
    )
  );

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        darkMode ? 'bg-[#070b12] text-[#e2e8f0]' : 'bg-[#f1f5f9] text-[#1e293b]'
      }`}
    >
      {/* 1. App Header */}
      <Header
        isPlaying={isPlaying}
        speed={speed}
        healthScore={healthScore}
        autoReroute={autoReroute}
        chaosMode={chaosMode}
        liveProbe={liveProbe}
        isGeoView={isGeoView}
        darkMode={darkMode}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onSetSpeed={(s) => setSpeed(s)}
        onStepTick={handleStepTick}
        onToggleAutoReroute={() => setAutoReroute(!autoReroute)}
        onToggleChaosMode={() => setChaosMode(!chaosMode)}
        onToggleLiveProbe={() => setLiveProbe(!liveProbe)}
        onToggleGeoView={() => setIsGeoView(!isGeoView)}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenDemo={() => setIsStoryDemoOpen(true)}
        onOpenSelfTest={() => setIsSelfTestOpen(true)}
        onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
        onOpenLearn={() => setIsAlgorithmGuideOpen(true)}
      />

      {/* 2. Main 3-Panel NOC Dashboard Layout */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto p-3 flex flex-col gap-3 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[580px]">
          {/* Left Panel: Control Panel (3 cols) */}
          <div className="lg:col-span-3 h-full">
            <ControlPanel
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              optimizationMode={optimizationMode}
              balancedWeights={balancedWeights}
              algorithm={algorithm}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < historyStack.length - 1}
              darkMode={darkMode}
              onSelectPreset={handleSelectPreset}
              onSetOptimizationMode={setOptimizationMode}
              onSetBalancedWeights={setBalancedWeights}
              onSetAlgorithm={setAlgorithm}
              onAddRouter={handleAddRouter}
              onStartAddLink={() => {
                setIsAddLinkMode(true);
                setLinkSourceId(selectedNodeId);
              }}
              onDeleteSelected={handleDeleteSelected}
              onFailSelectedNode={handleFailSelectedNode}
              onRestoreAll={handleRestoreAll}
              onIncreaseLatency={handleIncreaseLatency}
              onIncreaseTraffic={handleIncreaseTraffic}
              onSimulateDDoS={handleSimulateDDoS}
              onRecalculate={() => computeRouting()}
              onResetNetwork={() => handleSelectPreset('college')}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onExportCsv={handleExportCsv}
              onDownloadPng={handleDownloadPng}
            />
          </div>

          {/* Center Panel: Interactive Topology Canvas (6 cols) */}
          <div className="lg:col-span-6 h-[550px] lg:h-full">
            <TopologyCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              activePath={routingResult?.path || null}
              altPath={selectedAltPath}
              sourceNodeId={sourceNodeId}
              targetNodeId={targetNodeId}
              isAddLinkMode={isAddLinkMode}
              linkSourceId={linkSourceId}
              isGeoView={isGeoView}
              darkMode={darkMode}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                if (isAddLinkMode && !linkSourceId) {
                  setLinkSourceId(id);
                }
              }}
              onSelectEdge={setSelectedEdgeId}
              onSetSourceNode={setSourceNodeId}
              onSetTargetNode={setTargetNodeId}
              onNodeMove={handleNodeMove}
              onNodeDoubleClick={(n) => setEditingNode(n)}
              onEdgeDoubleClick={(e) => setEditingEdge(e)}
              onConnectNodes={handleConnectNodes}
              onCancelAddLink={() => {
                setIsAddLinkMode(false);
                setLinkSourceId(null);
              }}
            />
          </div>

          {/* Right Panel: Path Analysis & Real-time Event Stream (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-[300px]">
              <PathAnalysisPanel
                nodes={nodes}
                edges={edges}
                sourceNodeId={sourceNodeId}
                targetNodeId={targetNodeId}
                routingResult={routingResult}
                kPaths={kPaths}
                selectedAltPath={selectedAltPath}
                algorithm={algorithm}
                optimizationMode={optimizationMode}
                darkMode={darkMode}
                onSetSourceNode={setSourceNodeId}
                onSetTargetNode={setTargetNodeId}
                onSelectAltPath={setSelectedAltPath}
                onFailLinkOnPath={handleFailLinkOnPath}
                onRunAlgorithmBenchmark={() => {
                  logEvent('info', 'BENCHMARK', 'Ran performance benchmark across routing algorithms.');
                }}
              />
            </div>

            <div className="h-[240px]">
              <EventLogPanel
                logs={eventLogs}
                darkMode={darkMode}
                onClearLogs={() => setEventLogs([])}
                onExportCsv={handleExportCsv}
              />
            </div>
          </div>
        </div>

        {/* 3. Bottom Metrics Strip */}
        <MetricsStrip
          history={metricsHistory}
          currentHealth={healthScore}
          activeNodesCount={upNodesCount}
          totalNodesCount={nodes.length}
          congestedLinksCount={congestedCount}
          resilienceReport={resilienceReport}
          darkMode={darkMode}
          onOpenResilienceReport={() => setIsResilienceModalOpen(true)}
          onOpenAiAnalyst={() => setIsAiAnalystOpen(true)}
        />
      </main>

      {/* 4. Modals */}
      <StoryDemoModal
        isOpen={isStoryDemoOpen}
        onClose={() => setIsStoryDemoOpen(false)}
        onApplyStoryStep={handleApplyStoryStep}
      />

      <ResilienceModal
        isOpen={isResilienceModalOpen}
        onClose={() => setIsResilienceModalOpen(false)}
        report={resilienceReport}
        nodes={nodes}
        edges={edges}
        onFailNode={(id) => {
          setSelectedNodeId(id);
          handleFailSelectedNode();
        }}
        onFailEdge={(id) => {
          setSelectedEdgeId(id);
          handleFailSelectedNode();
        }}
      />

      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        snmpSimulated={snmpSimulated}
        onToggleSnmpSimulated={() => setSnmpSimulated(!snmpSimulated)}
      />

      <AlgorithmGuideModal
        isOpen={isAlgorithmGuideOpen}
        onClose={() => setIsAlgorithmGuideOpen(false)}
      />

      <AiAnalystModal
        isOpen={isAiAnalystOpen}
        onClose={() => setIsAiAnalystOpen(false)}
        nodes={nodes}
        edges={edges}
        routingResult={routingResult}
        resilienceReport={resilienceReport}
      />

      <SelfTestModal
        isOpen={isSelfTestOpen}
        onClose={() => setIsSelfTestOpen(false)}
      />

      <NodeEditModal
        node={editingNode}
        isOpen={Boolean(editingNode)}
        onClose={() => setEditingNode(null)}
        onSave={(updated) => {
          setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          computeRouting();
          logEvent('info', 'CONFIG', `Updated configuration for node [${updated.id}].`);
        }}
        onDelete={(id) => {
          setSelectedNodeId(id);
          handleDeleteSelected();
        }}
      />

      <EdgeEditModal
        edge={editingEdge}
        isOpen={Boolean(editingEdge)}
        onClose={() => setEditingEdge(null)}
        onSave={(updated) => {
          setEdges((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          computeRouting();
          logEvent('info', 'CONFIG', `Updated metrics for link [${updated.id}].`);
        }}
        onDelete={(id) => {
          setSelectedEdgeId(id);
          handleDeleteSelected();
        }}
      />
    </div>
  );
}
