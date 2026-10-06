export type IntegrationStatus =
  | 'connected'
  | 'not-configured'
  | 'error'
  | 'simulated';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  timestamp: string;
}

export interface NetworkIntegrationAdapter<T = unknown> {
  id: string;
  name: string;
  description: string;
  category: 'monitoring' | 'maps' | 'ai' | 'cloud' | 'storage';
  status: IntegrationStatus;
  isConfigured(): boolean;
  testConnection(): Promise<ConnectionTestResult>;
  fetchData?(): Promise<T>;
  fallback(): T;
}
