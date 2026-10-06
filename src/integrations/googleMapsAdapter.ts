import type { ConnectionTestResult, NetworkIntegrationAdapter } from './baseAdapter';

export class GoogleMapsAdapter implements NetworkIntegrationAdapter<boolean> {
  public id = 'google-maps';
  public name = 'Google Maps Platform (Geo View)';
  public description = 'Visualizes network nodes on an interactive geographic map using real GPS coordinates.';
  public category = 'maps' as const;
  public status: 'connected' | 'not-configured' | 'error' | 'simulated' = 'simulated';

  private apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now();
    if (!this.isConfigured()) {
      return {
        success: true,
        message: 'No Google Maps API key provided. Using built-in vector Geo Map view.',
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Validate key format and load Google Maps script
      if (typeof window !== 'undefined' && !(window as unknown as { google?: { maps?: unknown } }).google?.maps) {
        await new Promise<void>((resolve, reject) => {
          const scriptId = 'google-maps-api-script';
          if (document.getElementById(scriptId)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(this.apiKey)}&libraries=geometry`;
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google Maps JS SDK'));
          document.head.appendChild(script);

          // Handle auth failure callback
          (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
            reject(new Error('Google Maps authentication failure (invalid API key or billing disabled).'));
          };
        });
      }

      this.status = 'connected';
      return {
        success: true,
        message: 'Google Maps JavaScript API loaded successfully.',
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      this.status = 'error';
      return {
        success: false,
        message: `Google Maps error: ${err instanceof Error ? err.message : 'Auth failure'}. Gracefully falling back to vector Geo view.`,
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
      };
    }
  }

  public fallback(): boolean {
    return false; // use built-in vector geo map
  }
}
