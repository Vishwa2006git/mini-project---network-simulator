import type { ConnectionTestResult, NetworkIntegrationAdapter } from './baseAdapter';
import type { EventLogEntry, TopologyData } from '../types/network';

export interface StorageRecord {
  id: string;
  name: string;
  description: string;
  topology: TopologyData;
  createdAt: string;
  updatedAt: string;
  syncedToCloud: boolean;
}

export const SUPABASE_SQL_SCHEMA = `-- VK Network Simulator PostgreSQL / Supabase Schema

CREATE TABLE IF NOT EXISTS topologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  topology_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topology_id UUID REFERENCES topologies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metrics_history (
  id BIGSERIAL PRIMARY KEY,
  topology_id UUID REFERENCES topologies(id) ON DELETE CASCADE,
  latency_ms NUMERIC NOT NULL,
  traffic_mbps NUMERIC NOT NULL,
  packet_loss_pct NUMERIC NOT NULL,
  health_score INT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) policies for anonymous web access
ALTER TABLE topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON topologies FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON topologies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON topologies FOR UPDATE USING (true);
CREATE POLICY "Allow public read events" ON event_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert events" ON event_logs FOR INSERT WITH CHECK (true);
`;

export class StorageAdapter implements NetworkIntegrationAdapter<StorageRecord[]> {
  public id = 'database-storage';
  public name = 'Database & Persistence (LocalStorage / Supabase / PostgreSQL)';
  public description = 'Persists network topologies, simulation scenarios, event logs, and metric history.';
  public category = 'storage' as const;
  public status: 'connected' | 'not-configured' | 'error' | 'simulated' = 'connected';

  private supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  private supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  private localStorageKey = 'vk_network_simulator_topologies_v1';

  public isConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now();
    if (!this.isConfigured()) {
      return {
        success: true,
        message: 'Using LocalStorage Persistence Adapter. Topologies persist in browser storage without remote database setup.',
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const res = await fetch(`${this.supabaseUrl}/rest/v1/topologies?select=count`, {
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
        },
      });

      if (res.ok) {
        this.status = 'connected';
        return {
          success: true,
          message: 'Connected to Supabase PostgreSQL database. Cloud sync active.',
          latencyMs: Math.round(performance.now() - start),
          timestamp: new Date().toISOString(),
        };
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      this.status = 'error';
      return {
        success: false,
        message: `Supabase connection failed (${err instanceof Error ? err.message : 'timeout'}). Operating in LocalStorage mode with "Sync Pending".`,
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public getSavedTopologies(): StorageRecord[] {
    try {
      const raw = localStorage.getItem(this.localStorageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Storage access error handling
    }
    return [];
  }

  public saveTopology(name: string, description: string, topology: TopologyData): StorageRecord {
    const records = this.getSavedTopologies();
    const id = `top_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newRecord: StorageRecord = {
      id,
      name,
      description,
      topology,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    };

    records.unshift(newRecord);
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(records));
    } catch {
      // Handle storage quota exceeded
    }

    return newRecord;
  }

  public deleteTopology(id: string): void {
    const records = this.getSavedTopologies().filter((r) => r.id !== id);
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(records));
    } catch {
      // Error handling
    }
  }

  public fallback(): StorageRecord[] {
    return this.getSavedTopologies();
  }
}
