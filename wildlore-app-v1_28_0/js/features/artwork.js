/* Per-species AI illustrations: generate once, cache per device, reuse everywhere.
   On discovery we generate the species' flat illustration; habitats then place that illustration
   (not the vector shape) as the living creature. Falls back to vector art when none exists yet. */
import { CONFIG } from '../config.js';
import * as db from '../core/db.js';
const key = (k) => 'art:' + k;

export async function getArt(taxonKey) { return db.kvGet(key(taxonKey), null); }

export async function ensureArt(rec) {
  const ck = key(rec.taxonKey);
  let img = await db.kvGet(ck, null);
  if (img) return img;
  if (!CONFIG.art || !CONFIG.art.endpoint) return null;
  try {
    const r = await fetch(CONFIG.art.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taxonKey: rec.taxonKey, commonName: rec.commonName || rec.canonicalName, scientificName: rec.scientificName }) });
    const d = await r.json();
    if (d && d.available && d.image) { img = await downscale(d.image, 720); await db.kvSet(ck, img); return img; }
  } catch (_) {}
  return null;
}

/* map of taxonKey -> cached illustration (only present ones), for placing a whole habitat at once */
export async function artMapFor(list) {
  const entries = await Promise.all((list || []).map((sp) => db.kvGet(key(sp.taxonKey), null).then((v) => [sp.taxonKey, v])));
  const m = {}; entries.forEach(([k, v]) => { if (v) m[k] = v; }); return m;
}

export function downscale(dataUrl, max) {
  return new Promise((res) => { const i = new Image(); i.onload = () => { const sc = Math.min(1, max / Math.max(i.naturalWidth, i.naturalHeight)); const w = Math.round(i.naturalWidth * sc), h = Math.round(i.naturalHeight * sc); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(i, 0, 0, w, h); try { res(c.toDataURL('image/png')); } catch (_) { res(dataUrl); } }; i.onerror = () => res(dataUrl); i.src = dataUrl; });
}
