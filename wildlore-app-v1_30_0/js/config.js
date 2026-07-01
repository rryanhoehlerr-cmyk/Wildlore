export const CONFIG = {
  app: { name: 'Wildlore', version: '1.30.0', resetOnVersionChange: true },
  gbif: { base: 'https://api.gbif.org/v1', pageSize: 30, mediaSize: 12 },
  obis: { base: 'https://api.obis.org/v3' },
  supabase: { url: '', anonKey: '', enabled() { return !!(this.url && this.anonKey); } },
  identify: { visionEndpoint: '/api/identify', audioEndpoint: '', onDeviceVision: true, confidence: { high: 0.85, medium: 0.55 } },
  art: { endpoint: '/api/illustrate' },
  cache: { speciesTtl: 1000 * 60 * 60 * 24 * 30, regionTtl: 1000 * 60 * 60 * 24 * 14 }
};
