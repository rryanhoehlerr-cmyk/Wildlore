import * as gbif from './gbif.js';
import * as db from '../core/db.js';
export const REGIONS = {
  yosemite: { id: 'yosemite', name: 'Yosemite', type: 'park', realm: 'terrestrial', featured: true, sub: 'Granite domes & alpine meadows', wkt: 'POLYGON((-119.9 37.5,-119.2 37.5,-119.2 38.0,-119.9 38.0,-119.9 37.5))' },
  montereybay: { id: 'montereybay', name: 'Monterey Bay', type: 'marine', realm: 'marine', featured: true, sub: 'Kelp forests & submarine canyon', wkt: 'POLYGON((-122.1 36.5,-121.78 36.5,-121.78 36.97,-122.1 36.97,-122.1 36.5))' },
  pointreyes: { id: 'pointreyes', name: 'Point Reyes', type: 'protected', realm: 'terrestrial', featured: true, sub: 'Coastal headlands & estuaries', wkt: 'POLYGON((-123.05 37.9,-122.7 37.9,-122.7 38.25,-123.05 38.25,-123.05 37.9))' },
  californiacoast: { id: 'californiacoast', name: 'California Coast', type: 'coast', realm: 'marine', featured: true, sub: 'Tidepools, kelp forests & seabird cliffs', wkt: 'POLYGON((-124 34,-120 34,-120 39,-124 39,-124 34))' },
  channelislands: { id: 'channelislands', name: 'Channel Islands', type: 'marine', realm: 'marine', sub: 'Marine sanctuary & rocky reefs', wkt: 'POLYGON((-120.5 33.85,-119.3 33.85,-119.3 34.15,-120.5 34.15,-120.5 33.85))' },
  amazon: { id: 'amazon', name: 'Amazon Rainforest', type: 'rainforest', realm: 'terrestrial', sub: 'The richest rainforest on Earth', wkt: 'POLYGON((-75 -10,-60 -10,-60 0,-75 0,-75 -10))' },
  galapagos: { id: 'galapagos', name: 'Galapagos Islands', type: 'islands', realm: 'terrestrial', sub: 'Islands that shaped evolution', wkt: 'POLYGON((-92 -1.5,-89 -1.5,-89 0.7,-92 0.7,-92 -1.5))' },
  greatbarrierreef: { id: 'greatbarrierreef', name: 'Great Barrier Reef', type: 'reef', realm: 'marine', sub: 'The largest living reef system', wkt: 'POLYGON((145 -24,152 -24,152 -10,145 -10,145 -24))' },
  serengeti: { id: 'serengeti', name: 'Serengeti', type: 'savanna', realm: 'terrestrial', sub: 'Great plains & the great migration', wkt: 'POLYGON((33 -4,37 -4,37 0,33 0,33 -4))' },
  borneo: { id: 'borneo', name: 'Borneo Rainforest', type: 'rainforest', realm: 'terrestrial', sub: 'Ancient equatorial rainforest', wkt: 'POLYGON((109 -4,119 -4,119 7,109 7,109 -4))' },
  costarica: { id: 'costarica', name: 'Costa Rica', type: 'cloud forest', realm: 'terrestrial', sub: 'Cloud forests & rich neotropics', wkt: 'POLYGON((-86 8,-82.5 8,-82.5 11.2,-86 11.2,-86 8))' },
  coraltriangle: { id: 'coraltriangle', name: 'Coral Triangle', type: 'reef', realm: 'marine', sub: 'The heart of marine biodiversity', wkt: 'POLYGON((118 -8,132 -8,132 8,118 8,118 -8))' },
  madagascar: { id: 'madagascar', name: 'Madagascar', type: 'island', realm: 'terrestrial', sub: 'An island of species found nowhere else', wkt: 'POLYGON((43 -25.5,50.5 -25.5,50.5 -12,43 -12,43 -25.5))' },
  yellowstone: { id: 'yellowstone', name: 'Yellowstone', type: 'park', realm: 'terrestrial', sub: 'Geysers, wolves & the northern range', wkt: 'POLYGON((-111.2 44.1,-109.8 44.1,-109.8 45.1,-111.2 45.1,-111.2 44.1))' },
  pantanal: { id: 'pantanal', name: 'Pantanal', type: 'wetland', realm: 'terrestrial', sub: 'The world largest tropical wetland', wkt: 'POLYGON((-58 -20,-55 -20,-55 -16,-58 -16,-58 -20))' },
  sundarbans: { id: 'sundarbans', name: 'Sundarbans', type: 'mangrove', realm: 'terrestrial', sub: 'Tidal mangrove forest of the delta', wkt: 'POLYGON((88.5 21.5,90 21.5,90 22.5,88.5 22.5,88.5 21.5))' },
  congobasin: { id: 'congobasin', name: 'Congo Basin', type: 'rainforest', realm: 'terrestrial', sub: 'The second-largest rainforest on Earth', wkt: 'POLYGON((15 -4,27 -4,27 4,15 4,15 -4))' },
  westernghats: { id: 'westernghats', name: 'Western Ghats', type: 'mountains', realm: 'terrestrial', sub: 'Monsoon mountains of southern India', wkt: 'POLYGON((73 8,77 8,77 16,73 16,73 8))' }
};
export function regionCenter(r) { const n = (r.wkt.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); let sx = 0, sy = 0, c = 0; for (let i = 0; i + 1 < n.length; i += 2) { sx += n[i]; sy += n[i + 1]; c++; } return c ? { lng: sx / c, lat: sy / c } : { lng: 0, lat: 0 }; }
function hav(a, b) { const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180; const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); }
export function nearestRegions(lat, lng, n = 4) { const here = { lat, lng }; return Object.values(REGIONS).map((r) => ({ r, d: hav(here, regionCenter(r)) })).sort((a, b) => a.d - b.d).slice(0, n).map((x) => x.r); }
export async function regionSpecies(region, limit = 30) {
  const id = 'region:' + region.id; const cached = await db.get('regions', id); if (cached && Date.now() - cached._cachedAt < 6048e5) return cached;
  const data = await gbif.occurrenceSearch({ geometry: region.wkt, hasCoordinate: true, mediaType: 'StillImage', facet: 'speciesKey', facetLimit: limit, limit: 0 });
  const counts = data.facets?.[0]?.counts || []; const out = { regionId: id, total: data.count || 0, speciesKeys: counts.map((c) => ({ taxonKey: Number(c.name), occ: c.count })), _cachedAt: Date.now() };
  await db.put('regions', out); return out;
}
export async function regionProgress(region, foundSet) { const list = await regionSpecies(region); const checklist = list.speciesKeys.map((s) => s.taxonKey); const found = checklist.filter((k) => foundSet.has(k)).length; return { found, total: checklist.length || 0, pct: checklist.length ? Math.round((found / checklist.length) * 100) : 0, checklist }; }
