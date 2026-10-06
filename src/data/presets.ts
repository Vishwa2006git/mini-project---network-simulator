import type { NetworkEdge, NetworkNode, TopologyData } from '../types/network';

/**
 * 1. College Network (Default Specification)
 * Internet → Firewall → Core Router → CSE Lab Switch / Admin Switch / Library Switch → PCs,
 * plus Database Server and redundant links for alternative paths.
 */
export const COLLEGE_NETWORK: TopologyData = {
  name: 'College Campus Network',
  description: 'Campus LAN with redundant links, security perimeter, faculty/lab subnets, and database crown jewel.',
  nodes: [
    { id: 'INET', label: 'Internet Gateway', type: 'Internet', ip: '198.51.100.1', status: 'UP', riskScore: 70, x: 450, y: 55, lat: 13.0827, lng: 80.2707 },
    { id: 'FW1', label: 'Edge Firewall', type: 'Firewall', ip: '198.51.100.2', status: 'UP', riskScore: 25, x: 450, y: 145, lat: 13.0827, lng: 80.2707 },
    { id: 'CORE', label: 'Core Router (Cisco 9500)', type: 'Core Router', ip: '10.0.0.1', status: 'UP', riskScore: 10, x: 450, y: 245, lat: 13.0827, lng: 80.2707 },
    { id: 'SW_CSE', label: 'CSE Lab Switch', type: 'Switch', ip: '10.10.0.1', status: 'UP', riskScore: 15, x: 220, y: 355, lat: 13.0835, lng: 80.2715 },
    { id: 'SW_ADMIN', label: 'Admin Switch', type: 'Switch', ip: '10.20.0.1', status: 'UP', riskScore: 20, x: 450, y: 355, lat: 13.0820, lng: 80.2690 },
    { id: 'SW_LIB', label: 'Library Switch', type: 'Switch', ip: '10.30.0.1', status: 'UP', riskScore: 10, x: 680, y: 355, lat: 13.0810, lng: 80.2730 },
    { id: 'PC_CSE1', label: 'CSE Workstation 01', type: 'PC', ip: '10.10.1.10', status: 'UP', riskScore: 5, x: 140, y: 465 },
    { id: 'PC_CSE2', label: 'CSE Workstation 02', type: 'PC', ip: '10.10.1.11', status: 'UP', riskScore: 5, x: 280, y: 465 },
    { id: 'SRV_APP', label: 'Campus Web Server', type: 'Server', ip: '10.50.0.5', status: 'UP', riskScore: 30, x: 450, y: 465 },
    { id: 'DB_MAIN', label: 'Student Records DB', type: 'Database', ip: '10.99.0.2', status: 'UP', riskScore: 40, x: 620, y: 465, isCrownJewel: true },
    { id: 'PC_LIB', label: 'Library Terminal', type: 'PC', ip: '10.30.1.5', status: 'UP', riskScore: 5, x: 760, y: 465 },
    { id: 'BACKUP_RTR', label: 'Backup Router', type: 'Router', ip: '10.0.99.1', status: 'UP', riskScore: 15, x: 640, y: 220 },
  ],
  edges: [
    { id: 'e_inet_fw', u: 'INET', v: 'FW1', latency: 4, bandwidth: 2000, currentTraffic: 620, cost: 2, packetLoss: 0.1, status: 'UP', utilization: 31, congestionLevel: 'LOW' },
    { id: 'e_fw_core', u: 'FW1', v: 'CORE', latency: 1.5, bandwidth: 10000, currentTraffic: 1450, cost: 1, packetLoss: 0, status: 'UP', utilization: 15, congestionLevel: 'LOW' },
    { id: 'e_core_cse', u: 'CORE', v: 'SW_CSE', latency: 2, bandwidth: 1000, currentTraffic: 380, cost: 3, packetLoss: 0, status: 'UP', utilization: 38, congestionLevel: 'LOW' },
    { id: 'e_core_adm', u: 'CORE', v: 'SW_ADMIN', latency: 2, bandwidth: 1000, currentTraffic: 240, cost: 3, packetLoss: 0, status: 'UP', utilization: 24, congestionLevel: 'LOW' },
    { id: 'e_core_lib', u: 'CORE', v: 'SW_LIB', latency: 3, bandwidth: 1000, currentTraffic: 120, cost: 4, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
    // Redundant interconnection between switches
    { id: 'e_cse_adm', u: 'SW_CSE', v: 'SW_ADMIN', latency: 2.5, bandwidth: 1000, currentTraffic: 80, cost: 5, packetLoss: 0, status: 'UP', utilization: 8, congestionLevel: 'LOW' },
    { id: 'e_adm_lib', u: 'SW_ADMIN', v: 'SW_LIB', latency: 2.5, bandwidth: 1000, currentTraffic: 90, cost: 5, packetLoss: 0, status: 'UP', utilization: 9, congestionLevel: 'LOW' },
    // Secondary redundant route through backup router
    { id: 'e_fw_backup', u: 'FW1', v: 'BACKUP_RTR', latency: 3, bandwidth: 1000, currentTraffic: 100, cost: 10, packetLoss: 0, status: 'UP', utilization: 10, congestionLevel: 'LOW' },
    { id: 'e_backup_lib', u: 'BACKUP_RTR', v: 'SW_LIB', latency: 4, bandwidth: 1000, currentTraffic: 60, cost: 12, packetLoss: 0, status: 'UP', utilization: 6, congestionLevel: 'LOW' },
    // End device access links
    { id: 'e_cse_pc1', u: 'SW_CSE', v: 'PC_CSE1', latency: 0.8, bandwidth: 1000, currentTraffic: 45, cost: 1, packetLoss: 0, status: 'UP', utilization: 5, congestionLevel: 'LOW' },
    { id: 'e_cse_pc2', u: 'SW_CSE', v: 'PC_CSE2', latency: 0.8, bandwidth: 1000, currentTraffic: 75, cost: 1, packetLoss: 0, status: 'UP', utilization: 8, congestionLevel: 'LOW' },
    { id: 'e_adm_srv', u: 'SW_ADMIN', v: 'SRV_APP', latency: 1, bandwidth: 1000, currentTraffic: 180, cost: 2, packetLoss: 0, status: 'UP', utilization: 18, congestionLevel: 'LOW' },
    { id: 'e_srv_db', u: 'SRV_APP', v: 'DB_MAIN', latency: 0.9, bandwidth: 1000, currentTraffic: 140, cost: 2, packetLoss: 0, status: 'UP', utilization: 14, congestionLevel: 'LOW' },
    { id: 'e_lib_db', u: 'SW_LIB', v: 'DB_MAIN', latency: 2, bandwidth: 1000, currentTraffic: 50, cost: 4, packetLoss: 0, status: 'UP', utilization: 5, congestionLevel: 'LOW' },
    { id: 'e_lib_pc', u: 'SW_LIB', v: 'PC_LIB', latency: 1, bandwidth: 1000, currentTraffic: 25, cost: 1, packetLoss: 0, status: 'UP', utilization: 3, congestionLevel: 'LOW' },
  ],
};

/**
 * 2. ISP Backbone (Chennai, Bangalore, Hyderabad, Mumbai, Delhi with real lat/lng)
 */
export const ISP_BACKBONE: TopologyData = {
  name: 'ISP National Optical Backbone',
  description: 'Major Tier-1 Indian transit rings connecting Chennai, Bangalore, Hyderabad, Mumbai, and Delhi.',
  nodes: [
    { id: 'DEL', label: 'Delhi Core (DEL-POP1)', type: 'ISP', ip: '103.21.244.1', status: 'UP', riskScore: 15, x: 450, y: 80, lat: 28.6139, lng: 77.2090 },
    { id: 'MUM', label: 'Mumbai Core (BOM-POP1)', type: 'ISP', ip: '103.21.245.1', status: 'UP', riskScore: 10, x: 250, y: 220, lat: 19.0760, lng: 72.8777 },
    { id: 'HYD', label: 'Hyderabad Core (HYD-POP1)', type: 'ISP', ip: '103.21.246.1', status: 'UP', riskScore: 12, x: 460, y: 260, lat: 17.3850, lng: 78.4867 },
    { id: 'BLR', label: 'Bangalore Core (BLR-POP1)', type: 'ISP', ip: '103.21.247.1', status: 'UP', riskScore: 10, x: 380, y: 390, lat: 12.9716, lng: 77.5946 },
    { id: 'MAA', label: 'Chennai Subsea (MAA-POP1)', type: 'ISP', ip: '103.21.248.1', status: 'UP', riskScore: 15, x: 540, y: 380, lat: 13.0827, lng: 80.2707 },
    { id: 'IX_MUM', label: 'Mumbai IXP Gateway', type: 'Internet', ip: '185.1.12.1', status: 'UP', riskScore: 40, x: 120, y: 220, lat: 18.9220, lng: 72.8347 },
    { id: 'IX_MAA', label: 'Chennai Cable Landing', type: 'Internet', ip: '185.1.14.1', status: 'UP', riskScore: 35, x: 680, y: 380, lat: 13.0900, lng: 80.2900 },
  ],
  edges: [
    { id: 'e_del_mum', u: 'DEL', v: 'MUM', latency: 19.5, bandwidth: 40000, currentTraffic: 18500, cost: 25, packetLoss: 0.05, status: 'UP', utilization: 46, congestionLevel: 'LOW' },
    { id: 'e_del_hyd', u: 'DEL', v: 'HYD', latency: 22.0, bandwidth: 40000, currentTraffic: 14200, cost: 28, packetLoss: 0.02, status: 'UP', utilization: 35, congestionLevel: 'LOW' },
    { id: 'e_mum_hyd', u: 'MUM', v: 'HYD', latency: 12.8, bandwidth: 100000, currentTraffic: 52000, cost: 15, packetLoss: 0.01, status: 'UP', utilization: 52, congestionLevel: 'MEDIUM' },
    { id: 'e_mum_blr', u: 'MUM', v: 'BLR', latency: 15.2, bandwidth: 100000, currentTraffic: 61000, cost: 18, packetLoss: 0.03, status: 'UP', utilization: 61, congestionLevel: 'MEDIUM' },
    { id: 'e_hyd_blr', u: 'HYD', v: 'BLR', latency: 9.4, bandwidth: 40000, currentTraffic: 22000, cost: 12, packetLoss: 0, status: 'UP', utilization: 55, congestionLevel: 'MEDIUM' },
    { id: 'e_hyd_maa', u: 'HYD', v: 'MAA', latency: 11.2, bandwidth: 40000, currentTraffic: 19000, cost: 14, packetLoss: 0.01, status: 'UP', utilization: 47, congestionLevel: 'LOW' },
    { id: 'e_blr_maa', u: 'BLR', v: 'MAA', latency: 5.6, bandwidth: 100000, currentTraffic: 48000, cost: 8, packetLoss: 0, status: 'UP', utilization: 48, congestionLevel: 'LOW' },
    { id: 'e_mum_ix', u: 'MUM', v: 'IX_MUM', latency: 1.2, bandwidth: 100000, currentTraffic: 41000, cost: 2, packetLoss: 0, status: 'UP', utilization: 41, congestionLevel: 'LOW' },
    { id: 'e_maa_ix', u: 'MAA', v: 'IX_MAA', latency: 1.5, bandwidth: 100000, currentTraffic: 39000, cost: 2, packetLoss: 0, status: 'UP', utilization: 39, congestionLevel: 'LOW' },
  ],
};

/**
 * 3. Dual-ISP Campus: CSE Lab → Switch → Core Router → ISP-1 / ISP-2 → Internet
 */
export const DUAL_ISP_CAMPUS: TopologyData = {
  name: 'Dual-ISP High-Availability Campus',
  description: 'Multi-homed enterprise perimeter routing across Tier-1 primary and backup upstream transit providers.',
  nodes: [
    { id: 'INTERNET', label: 'Global Internet', type: 'Internet', ip: '1.1.1.1', status: 'UP', riskScore: 60, x: 450, y: 60 },
    { id: 'ISP_A', label: 'ISP 1 (Airtel Primary 10G)', type: 'ISP', ip: '182.79.0.1', status: 'UP', riskScore: 15, x: 280, y: 150 },
    { id: 'ISP_B', label: 'ISP 2 (Tata Backup 5G)', type: 'ISP', ip: '115.112.0.1', status: 'UP', riskScore: 20, x: 620, y: 150 },
    { id: 'EDGE_R1', label: 'Border Router A', type: 'Core Router', ip: '10.0.1.1', status: 'UP', riskScore: 10, x: 330, y: 250 },
    { id: 'EDGE_R2', label: 'Border Router B', type: 'Core Router', ip: '10.0.1.2', status: 'UP', riskScore: 10, x: 570, y: 250 },
    { id: 'CAMPUS_SW', label: 'Distribution Switch', type: 'Switch', ip: '10.10.0.1', status: 'UP', riskScore: 10, x: 450, y: 350 },
    { id: 'CSE_SW', label: 'CSE Lab Access Switch', type: 'Switch', ip: '10.20.0.1', status: 'UP', riskScore: 15, x: 330, y: 450 },
    { id: 'SRV_FARM', label: 'Campus Data Center', type: 'Server', ip: '10.30.0.1', status: 'UP', riskScore: 25, x: 570, y: 450, isCrownJewel: true },
    { id: 'CSE_PC', label: 'CSE Client Machine', type: 'PC', ip: '10.20.1.50', status: 'UP', riskScore: 5, x: 200, y: 450 },
  ],
  edges: [
    { id: 'e1', u: 'INTERNET', v: 'ISP_A', latency: 8, bandwidth: 10000, currentTraffic: 3200, cost: 10, packetLoss: 0.1, status: 'UP', utilization: 32, congestionLevel: 'LOW' },
    { id: 'e2', u: 'INTERNET', v: 'ISP_B', latency: 15, bandwidth: 5000, currentTraffic: 1100, cost: 25, packetLoss: 0.2, status: 'UP', utilization: 22, congestionLevel: 'LOW' },
    { id: 'e3', u: 'ISP_A', v: 'EDGE_R1', latency: 2, bandwidth: 10000, currentTraffic: 3200, cost: 5, packetLoss: 0, status: 'UP', utilization: 32, congestionLevel: 'LOW' },
    { id: 'e4', u: 'ISP_B', v: 'EDGE_R2', latency: 3, bandwidth: 5000, currentTraffic: 1100, cost: 15, packetLoss: 0, status: 'UP', utilization: 22, congestionLevel: 'LOW' },
    { id: 'e5', u: 'EDGE_R1', v: 'EDGE_R2', latency: 0.5, bandwidth: 20000, currentTraffic: 600, cost: 1, packetLoss: 0, status: 'UP', utilization: 3, congestionLevel: 'LOW' },
    { id: 'e6', u: 'EDGE_R1', v: 'CAMPUS_SW', latency: 1, bandwidth: 10000, currentTraffic: 2400, cost: 2, packetLoss: 0, status: 'UP', utilization: 24, congestionLevel: 'LOW' },
    { id: 'e7', u: 'EDGE_R2', v: 'CAMPUS_SW', latency: 1, bandwidth: 10000, currentTraffic: 800, cost: 4, packetLoss: 0, status: 'UP', utilization: 8, congestionLevel: 'LOW' },
    { id: 'e8', u: 'CAMPUS_SW', v: 'CSE_SW', latency: 1.5, bandwidth: 2000, currentTraffic: 600, cost: 3, packetLoss: 0, status: 'UP', utilization: 30, congestionLevel: 'LOW' },
    { id: 'e9', u: 'CAMPUS_SW', v: 'SRV_FARM', latency: 0.8, bandwidth: 10000, currentTraffic: 1800, cost: 2, packetLoss: 0, status: 'UP', utilization: 18, congestionLevel: 'LOW' },
    { id: 'e10', u: 'CSE_SW', v: 'CSE_PC', latency: 0.5, bandwidth: 1000, currentTraffic: 40, cost: 1, packetLoss: 0, status: 'UP', utilization: 4, congestionLevel: 'LOW' },
  ],
};

/**
 * 4. Small Office: PC-A, R1-R5, Server (from the classic networking diagram)
 */
export const SMALL_OFFICE: TopologyData = {
  name: 'Small Office / Branch Mesh',
  description: 'Classic textbook routing topology: PC-A connected through mesh routers R1-R5 to File Server.',
  nodes: [
    { id: 'PC_A', label: 'Workstation PC-A', type: 'PC', ip: '192.168.1.5', status: 'UP', riskScore: 5, x: 120, y: 250 },
    { id: 'R1', label: 'Router R1', type: 'Router', ip: '10.0.1.1', status: 'UP', riskScore: 10, x: 260, y: 150 },
    { id: 'R2', label: 'Router R2', type: 'Router', ip: '10.0.2.1', status: 'UP', riskScore: 10, x: 260, y: 350 },
    { id: 'R3', label: 'Router R3', type: 'Core Router', ip: '10.0.3.1', status: 'UP', riskScore: 15, x: 450, y: 250 },
    { id: 'R4', label: 'Router R4', type: 'Router', ip: '10.0.4.1', status: 'UP', riskScore: 10, x: 640, y: 150 },
    { id: 'R5', label: 'Router R5', type: 'Router', ip: '10.0.5.1', status: 'UP', riskScore: 10, x: 640, y: 350 },
    { id: 'SERVER', label: 'Corporate App Server', type: 'Server', ip: '192.168.10.100', status: 'UP', riskScore: 30, x: 780, y: 250, isCrownJewel: true },
  ],
  edges: [
    { id: 'e1', u: 'PC_A', v: 'R1', latency: 4, bandwidth: 1000, currentTraffic: 150, cost: 5, packetLoss: 0, status: 'UP', utilization: 15, congestionLevel: 'LOW' },
    { id: 'e2', u: 'PC_A', v: 'R2', latency: 6, bandwidth: 1000, currentTraffic: 50, cost: 7, packetLoss: 0, status: 'UP', utilization: 5, congestionLevel: 'LOW' },
    { id: 'e3', u: 'R1', v: 'R3', latency: 8, bandwidth: 2000, currentTraffic: 420, cost: 10, packetLoss: 0, status: 'UP', utilization: 21, congestionLevel: 'LOW' },
    { id: 'e4', u: 'R2', v: 'R3', latency: 9, bandwidth: 2000, currentTraffic: 350, cost: 11, packetLoss: 0, status: 'UP', utilization: 17, congestionLevel: 'LOW' },
    { id: 'e5', u: 'R1', v: 'R4', latency: 18, bandwidth: 1000, currentTraffic: 200, cost: 24, packetLoss: 0, status: 'UP', utilization: 20, congestionLevel: 'LOW' },
    { id: 'e6', u: 'R2', v: 'R5', latency: 20, bandwidth: 1000, currentTraffic: 120, cost: 26, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
    { id: 'e7', u: 'R3', v: 'R4', latency: 6, bandwidth: 2000, currentTraffic: 610, cost: 8, packetLoss: 0, status: 'UP', utilization: 30, congestionLevel: 'LOW' },
    { id: 'e8', u: 'R3', v: 'R5', latency: 7, bandwidth: 2000, currentTraffic: 390, cost: 9, packetLoss: 0, status: 'UP', utilization: 19, congestionLevel: 'LOW' },
    { id: 'e9', u: 'R4', v: 'SERVER', latency: 3, bandwidth: 1000, currentTraffic: 450, cost: 4, packetLoss: 0, status: 'UP', utilization: 45, congestionLevel: 'LOW' },
    { id: 'e10', u: 'R5', v: 'SERVER', latency: 4, bandwidth: 1000, currentTraffic: 200, cost: 6, packetLoss: 0, status: 'UP', utilization: 20, congestionLevel: 'LOW' },
  ],
};

/**
 * 5. Random Connected Topology Generator
 */
export function generateRandomConnectedTopology(nodeCount = 8): TopologyData {
  const count = Math.max(3, Math.min(16, nodeCount));
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  const types: NetworkNode['type'][] = ['Core Router', 'Router', 'Switch', 'Server', 'PC'];
  const centerX = 450;
  const centerY = 270;
  const radius = 200;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = Math.round(centerX + radius * Math.cos(angle));
    const y = Math.round(centerY + radius * Math.sin(angle));
    const id = `N${i + 1}`;
    const type = i === 0 ? 'Internet' : i === count - 1 ? 'Database' : types[i % types.length];

    nodes.push({
      id,
      label: `${type} ${i + 1}`,
      type,
      ip: `10.0.${i + 1}.1`,
      status: 'UP',
      riskScore: Math.floor(Math.random() * 30),
      x,
      y,
      isCrownJewel: i === count - 1,
    });
  }

  // Ensure connected graph by building spanning cycle first
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    const latency = Math.round(5 + Math.random() * 20);
    const bandwidth = [1000, 2000, 5000, 10000][Math.floor(Math.random() * 4)];
    const traffic = Math.round(bandwidth * (0.1 + Math.random() * 0.4));
    const cost = Math.round(2 + Math.random() * 15);

    edges.push({
      id: `e_${nodes[i].id}_${nodes[next].id}`,
      u: nodes[i].id,
      v: nodes[next].id,
      latency,
      bandwidth,
      currentTraffic: traffic,
      cost,
      packetLoss: 0,
      status: 'UP',
      utilization: Math.round((traffic / bandwidth) * 100),
      congestionLevel: 'LOW',
    });
  }

  // Add random cross chords for alternate routes
  const extraEdgesCount = Math.floor(count / 2);
  for (let k = 0; k < extraEdgesCount; k++) {
    const u = Math.floor(Math.random() * count);
    const v = (u + 2 + Math.floor(Math.random() * (count - 3))) % count;
    if (u !== v) {
      const uId = nodes[u].id;
      const vId = nodes[v].id;
      const exists = edges.some(
        (e) => (e.u === uId && e.v === vId) || (e.u === vId && e.v === uId)
      );

      if (!exists) {
        const latency = Math.round(8 + Math.random() * 25);
        const bandwidth = 1000;
        const traffic = Math.round(bandwidth * 0.2);
        edges.push({
          id: `e_cross_${uId}_${vId}`,
          u: uId,
          v: vId,
          latency,
          bandwidth,
          currentTraffic: traffic,
          cost: Math.round(4 + Math.random() * 10),
          packetLoss: 0,
          status: 'UP',
          utilization: 20,
          congestionLevel: 'LOW',
        });
      }
    }
  }

  return {
    name: `Random Mesh Network (${count} Nodes)`,
    description: `Synthetically generated connected graph with ${count} nodes and ${edges.length} multi-path links.`,
    nodes,
    edges,
  };
}

export const BLANK_CANVAS: TopologyData = {
  name: 'Blank Topology Canvas',
  description: 'Clean empty network canvas. Add nodes and links from the control panel.',
  nodes: [],
  edges: [],
};
