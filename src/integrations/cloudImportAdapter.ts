import type { ConnectionTestResult, NetworkIntegrationAdapter } from './baseAdapter';
import type { TopologyData } from '../types/network';

export interface CloudImportResult {
  provider: 'AWS' | 'Azure' | 'GCP';
  topology: TopologyData;
  summary: {
    vpcs: number;
    subnets: number;
    instances: number;
    gateways: number;
  };
}

export class CloudImportAdapter implements NetworkIntegrationAdapter<TopologyData> {
  public id = 'cloud-infrastructure';
  public name = 'Cloud Infrastructure Import (AWS / Azure / GCP)';
  public description = 'Translates Cloud VPCs, Subnets, Route Tables, Gateways, and Instances into an interactive network topology.';
  public category = 'cloud' as const;
  public status: 'connected' | 'not-configured' | 'error' | 'simulated' = 'simulated';

  public isConfigured(): boolean {
    return false; // Uses server proxy or demo mode
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now();
    return {
      success: true,
      message: 'Demo Cloud Provider mode active. Realistic AWS multi-tier VPC topology ready to import.',
      latencyMs: Math.round(performance.now() - start),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates a realistic Cloud VPC Topology with Public/Private subnets, NAT Gateway,
   * Application Load Balancer, Web EC2 Instances, and an RDS Aurora Database.
   */
  public generateDemoCloudTopology(provider: 'AWS' | 'Azure' | 'GCP' = 'AWS'): TopologyData {
    if (provider === 'Azure') {
      return {
        name: 'Azure Hub-and-Spoke Enterprise VNet',
        description: 'Azure Virtual WAN Hub with Azure Firewall, Spoke VNets, Application Gateway, and SQL Managed Instance.',
        nodes: [
          { id: 'AZ_INET', label: 'Internet', type: 'Internet', ip: '52.170.0.1', status: 'UP', riskScore: 50, x: 450, y: 60 },
          { id: 'AZ_FW', label: 'Azure Firewall Premium', type: 'Firewall', ip: '10.0.0.4', status: 'UP', riskScore: 15, x: 450, y: 150 },
          { id: 'AZ_HUB', label: 'Hub VNet Gateway Router', type: 'Core Router', ip: '10.0.0.1', status: 'UP', riskScore: 10, x: 450, y: 240 },
          { id: 'AZ_APP_GW', label: 'App Gateway v2 (WAF)', type: 'Switch', ip: '10.1.1.4', status: 'UP', riskScore: 20, x: 300, y: 340 },
          { id: 'AZ_VM_WEB1', label: 'VM Web App 01', type: 'Server', ip: '10.1.2.10', status: 'UP', riskScore: 25, x: 220, y: 440 },
          { id: 'AZ_VM_WEB2', label: 'VM Web App 02', type: 'Server', ip: '10.1.2.11', status: 'UP', riskScore: 25, x: 380, y: 440 },
          { id: 'AZ_SQL', label: 'Azure SQL Managed Instance', type: 'Database', ip: '10.2.1.5', status: 'UP', riskScore: 35, x: 600, y: 380, isCrownJewel: true },
        ],
        edges: [
          { id: 'e1', u: 'AZ_INET', v: 'AZ_FW', latency: 6, bandwidth: 10000, currentTraffic: 3100, cost: 5, packetLoss: 0, status: 'UP', utilization: 31, congestionLevel: 'LOW' },
          { id: 'e2', u: 'AZ_FW', v: 'AZ_HUB', latency: 1, bandwidth: 40000, currentTraffic: 3100, cost: 1, packetLoss: 0, status: 'UP', utilization: 8, congestionLevel: 'LOW' },
          { id: 'e3', u: 'AZ_HUB', v: 'AZ_APP_GW', latency: 1.5, bandwidth: 20000, currentTraffic: 2400, cost: 2, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
          { id: 'e4', u: 'AZ_APP_GW', v: 'AZ_VM_WEB1', latency: 0.8, bandwidth: 10000, currentTraffic: 1200, cost: 1, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
          { id: 'e5', u: 'AZ_APP_GW', v: 'AZ_VM_WEB2', latency: 0.8, bandwidth: 10000, currentTraffic: 1200, cost: 1, packetLoss: 0, status: 'UP', utilization: 12, congestionLevel: 'LOW' },
          { id: 'e6', u: 'AZ_HUB', v: 'AZ_SQL', latency: 1.2, bandwidth: 20000, currentTraffic: 900, cost: 3, packetLoss: 0, status: 'UP', utilization: 5, congestionLevel: 'LOW' },
          { id: 'e7', u: 'AZ_VM_WEB1', v: 'AZ_SQL', latency: 1.0, bandwidth: 10000, currentTraffic: 450, cost: 2, packetLoss: 0, status: 'UP', utilization: 5, congestionLevel: 'LOW' },
          { id: 'e8', u: 'AZ_VM_WEB2', v: 'AZ_SQL', latency: 1.0, bandwidth: 10000, currentTraffic: 450, cost: 2, packetLoss: 0, status: 'UP', utilization: 5, congestionLevel: 'LOW' },
        ],
      };
    }

    // Default: AWS Multi-Tier VPC
    return {
      name: 'AWS Multi-AZ Enterprise VPC (us-east-1)',
      description: 'Production AWS VPC with Internet Gateway, NAT Gateway, Application Load Balancer, EC2 Auto-Scaling, and RDS Multi-AZ Database.',
      nodes: [
        { id: 'AWS_IGW', label: 'Internet Gateway (igw-01)', type: 'Internet', ip: '54.239.28.1', status: 'UP', riskScore: 60, x: 450, y: 60 },
        { id: 'AWS_ALB', label: 'Application Load Balancer', type: 'Core Router', ip: '10.0.1.5', status: 'UP', riskScore: 20, x: 450, y: 160 },
        { id: 'AWS_NAT', label: 'NAT Gateway (Public Subnet)', type: 'Router', ip: '10.0.1.250', status: 'UP', riskScore: 25, x: 620, y: 220 },
        { id: 'AWS_EC2_A', label: 'EC2 Web Instance (AZ-1a)', type: 'Server', ip: '10.0.2.14', status: 'UP', riskScore: 15, x: 300, y: 290 },
        { id: 'AWS_EC2_B', label: 'EC2 Web Instance (AZ-1b)', type: 'Server', ip: '10.0.3.28', status: 'UP', riskScore: 15, x: 450, y: 290 },
        { id: 'AWS_RDS_MAIN', label: 'Amazon RDS Aurora Primary', type: 'Database', ip: '10.0.10.5', status: 'UP', riskScore: 40, x: 360, y: 420, isCrownJewel: true },
        { id: 'AWS_RDS_REPL', label: 'Amazon RDS Aurora Replica', type: 'Database', ip: '10.0.11.8', status: 'UP', riskScore: 20, x: 540, y: 420 },
      ],
      edges: [
        { id: 'e1', u: 'AWS_IGW', v: 'AWS_ALB', latency: 4, bandwidth: 20000, currentTraffic: 4200, cost: 2, packetLoss: 0, status: 'UP', utilization: 21, congestionLevel: 'LOW' },
        { id: 'e2', u: 'AWS_IGW', v: 'AWS_NAT', latency: 5, bandwidth: 10000, currentTraffic: 800, cost: 5, packetLoss: 0, status: 'UP', utilization: 8, congestionLevel: 'LOW' },
        { id: 'e3', u: 'AWS_ALB', v: 'AWS_EC2_A', latency: 0.6, bandwidth: 10000, currentTraffic: 2100, cost: 1, packetLoss: 0, status: 'UP', utilization: 21, congestionLevel: 'LOW' },
        { id: 'e4', u: 'AWS_ALB', v: 'AWS_EC2_B', latency: 0.6, bandwidth: 10000, currentTraffic: 2100, cost: 1, packetLoss: 0, status: 'UP', utilization: 21, congestionLevel: 'LOW' },
        { id: 'e5', u: 'AWS_EC2_A', v: 'AWS_RDS_MAIN', latency: 0.8, bandwidth: 10000, currentTraffic: 850, cost: 1, packetLoss: 0, status: 'UP', utilization: 9, congestionLevel: 'LOW' },
        { id: 'e6', u: 'AWS_EC2_B', v: 'AWS_RDS_MAIN', latency: 0.9, bandwidth: 10000, currentTraffic: 820, cost: 1, packetLoss: 0, status: 'UP', utilization: 8, congestionLevel: 'LOW' },
        { id: 'e7', u: 'AWS_RDS_MAIN', v: 'AWS_RDS_REPL', latency: 0.5, bandwidth: 20000, currentTraffic: 1400, cost: 1, packetLoss: 0, status: 'UP', utilization: 7, congestionLevel: 'LOW' },
        { id: 'e8', u: 'AWS_EC2_B', v: 'AWS_RDS_REPL', latency: 0.8, bandwidth: 10000, currentTraffic: 300, cost: 2, packetLoss: 0, status: 'UP', utilization: 3, congestionLevel: 'LOW' },
      ],
    };
  }

  public fallback(): TopologyData {
    return this.generateDemoCloudTopology('AWS');
  }
}
