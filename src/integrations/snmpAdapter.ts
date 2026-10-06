import type { ConnectionTestResult, NetworkIntegrationAdapter } from './baseAdapter';

export interface SnmpInterfaceStats {
  ifIndex: number;
  ifDescr: string;
  ifSpeedMbps: number;
  ifOperStatus: 'UP' | 'DOWN';
  prevInOctets: number;
  currInOctets: number;
  prevOutOctets: number;
  currOutOctets: number;
  inErrors: number;
  outErrors: number;
  calculatedUtilization: number; // %
  calculatedTrafficMbps: number;
}

export interface SnmpDevicePollResult {
  sysName: string;
  sysUpTime: string;
  interfaces: SnmpInterfaceStats[];
  polledAt: string;
}

const MAX_32BIT_COUNTER = 4294967295;

/**
 * Calculates byte delta accounting for standard 32-bit SNMP counter wraparound.
 */
export function calculateCounterDelta(prev: number, curr: number): number {
  if (curr >= prev) {
    return curr - prev;
  }
  // Counter rolled over 2^32 - 1
  return MAX_32BIT_COUNTER - prev + curr;
}

/**
 * Calculates interface utilization percentage from octet delta and time elapsed.
 */
export function calculateInterfaceUtilization(
  deltaOctets: number,
  timeElapsedSec: number,
  ifSpeedMbps: number
): { utilizationPct: number; trafficMbps: number } {
  if (timeElapsedSec <= 0 || ifSpeedMbps <= 0) {
    return { utilizationPct: 0, trafficMbps: 0 };
  }
  const bitsTransferred = deltaOctets * 8;
  const trafficMbps = bitsTransferred / (timeElapsedSec * 1000000);
  const utilizationPct = Math.min(100, Math.max(0, (trafficMbps / ifSpeedMbps) * 100));

  return {
    utilizationPct: Number(utilizationPct.toFixed(1)),
    trafficMbps: Number(trafficMbps.toFixed(2)),
  };
}

export class SnmpAdapter implements NetworkIntegrationAdapter<SnmpDevicePollResult[]> {
  public id = 'snmp-monitoring';
  public name = 'SNMP Network Monitoring';
  public description = 'Polls standard MIB-II interface metrics (ifInOctets, ifOutOctets, ifOperStatus) via proxy.';
  public category = 'monitoring' as const;
  public status: 'connected' | 'not-configured' | 'error' | 'simulated' = 'simulated';

  private collectorUrl = import.meta.env.VITE_COLLECTOR_URL || '';

  public isConfigured(): boolean {
    return Boolean(this.collectorUrl && this.collectorUrl.trim().length > 0);
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now();
    if (!this.isConfigured()) {
      return {
        success: true,
        message: 'No external collector configured; running in High-Fidelity Demo Mock SNMP mode.',
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${this.collectorUrl}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.status = 'connected';
        return {
          success: true,
          message: 'Connected successfully to remote SNMP Collector proxy.',
          latencyMs: Math.round(performance.now() - start),
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error(`Collector returned HTTP ${res.status}`);
    } catch (err) {
      this.status = 'simulated';
      return {
        success: false,
        message: `Collector unavailable (${err instanceof Error ? err.message : 'timeout'}). Falling back to mock simulation.`,
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async fetchData(): Promise<SnmpDevicePollResult[]> {
    if (this.isConfigured()) {
      try {
        const res = await fetch(`${this.collectorUrl}/api/snmp/poll`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fall back to simulation on error
      }
    }
    return this.fallback();
  }

  public fallback(): SnmpDevicePollResult[] {
    const prevIn = 4294900000;
    const currIn = 250000; // Counter rollover demonstration
    const delta = calculateCounterDelta(prevIn, currIn);
    const { utilizationPct, trafficMbps } = calculateInterfaceUtilization(delta, 5, 1000);

    return [
      {
        sysName: 'CoreRouter-C9500-Campus',
        sysUpTime: '124 days, 18:42:10.02',
        polledAt: new Date().toISOString(),
        interfaces: [
          {
            ifIndex: 1,
            ifDescr: 'GigabitEthernet0/0/1 (Uplink to Firewall)',
            ifSpeedMbps: 10000,
            ifOperStatus: 'UP',
            prevInOctets: prevIn,
            currInOctets: currIn,
            prevOutOctets: 120000000,
            currOutOctets: 128500000,
            inErrors: 0,
            outErrors: 0,
            calculatedUtilization: utilizationPct,
            calculatedTrafficMbps: trafficMbps,
          },
          {
            ifIndex: 2,
            ifDescr: 'TenGigabitEthernet0/1/1 (Trunk to CSE Lab)',
            ifSpeedMbps: 1000,
            ifOperStatus: 'UP',
            prevInOctets: 54000000,
            currInOctets: 59800000,
            prevOutOctets: 78000000,
            currOutOctets: 82500000,
            inErrors: 2,
            outErrors: 0,
            calculatedUtilization: 38.4,
            calculatedTrafficMbps: 384,
          },
        ],
      },
    ];
  }
}
