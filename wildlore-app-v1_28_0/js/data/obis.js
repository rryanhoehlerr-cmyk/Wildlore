import { CONFIG } from '../config.js';
const BASE = CONFIG.obis.base;
async function get(path, params = {}) { const url = new URL(BASE + path); Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.append(k, v); }); const res = await fetch(url, { headers: { Accept: 'application/json' } }); if (!res.ok) throw new Error(`OBIS ${res.status}`); return res.json(); }
export const taxon = (n) => get('/taxon/' + encodeURIComponent(n)).catch(() => null);
export async function enrich(record) {
  if (record.realm && record.realm !== 'marine') return null;
  const t = await taxon(record.scientificName); const hit = t?.results?.[0]; if (!hit) return null;
  return { marineConfirmed: !!hit.is_marine || record.realm === 'marine', obisRecords: hit.records || null, depthRange: (hit.depth_min != null && hit.depth_max != null) ? { min: hit.depth_min, max: hit.depth_max } : null, source: { name: 'OBIS (NOAA-affiliated)', url: 'https://obis.org', fetchedAt: Date.now() } };
}
