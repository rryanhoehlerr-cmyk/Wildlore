import { CONFIG } from '../config.js';
const BASE = CONFIG.gbif.base; let _chain = Promise.resolve(); const GAP = 120;
function throttle() { const p = _chain.then(() => new Promise((r) => setTimeout(r, GAP))); _chain = p.catch(() => {}); return p; }
async function get(path, params = {}, attempt = 0) {
  await throttle();
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.append(k, v); });
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 429 && attempt < 3) { await new Promise((r) => setTimeout(r, 600 * (attempt + 1))); return get(path, params, attempt + 1); }
  if (!res.ok) throw new Error(`GBIF ${res.status} ${path}`);
  return res.json();
}
export const match = (name) => get('/species/match', { name, strict: false });
export const searchSpecies = (q, o = {}) => get('/species/search', { q, rank: o.rank || 'SPECIES', highertaxonKey: o.highertaxonKey, nameType: o.nameType || 'SCIENTIFIC', status: 'ACCEPTED', limit: o.limit || CONFIG.gbif.pageSize, offset: o.offset || 0 });
export const taxon = (k) => get(`/species/${k}`);
export const vernacularNames = (k) => get(`/species/${k}/vernacularNames`, { limit: 30 });
export const descriptions = (k) => get(`/species/${k}/descriptions`, { limit: 10 });
export const speciesProfiles = (k) => get(`/species/${k}/speciesProfiles`, { limit: 10 });
export const iucn = (k) => get(`/species/${k}/iucnRedListCategory`).catch(() => null);
export const occurrenceSearch = (p) => get('/occurrence/search', p);
export async function speciesMedia(taxonKey, limit = CONFIG.gbif.mediaSize) {
  const data = await occurrenceSearch({ taxonKey, mediaType: 'StillImage', limit });
  const out = [];
  for (const occ of data.results || []) for (const m of occ.media || []) if (m.type === 'StillImage' && m.identifier) out.push({ url: m.identifier, license: m.license || null, creator: m.creator || m.rightsHolder || null });
  return { total: data.count || 0, photos: out };
}
