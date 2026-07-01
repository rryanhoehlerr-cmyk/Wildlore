/* Authentic animal recordings. Tries iNaturalist research-grade observation audio (broad taxa:
   birds, frogs, mammals, insects, marine), then Xeno-canto for birds. Returns null when no verified
   recording exists, so the UI can say so honestly rather than fabricating audio. Cached per species. */
import * as db from '../core/db.js';

export async function findSound(rec) {
  const ck = 'sound:' + rec.taxonKey;
  const cached = await db.kvGet(ck, undefined);
  if (cached !== undefined) return cached; // may be null (known-no-sound)
  const sci = rec.scientificName || rec.canonicalName || rec.commonName;
  let result = null;
  // 1) iNaturalist research-grade audio
  try {
    const r = await fetch(`https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(sci)}&sounds=true&per_page=6&order_by=votes&quality_grade=research`);
    if (r.ok) { const d = await r.json(); for (const o of d.results || []) { const s = (o.sounds || [])[0]; const url = s && (s.file_url || s.url); if (url) { result = { url, attribution: 'iNaturalist · ' + ((o.user && (o.user.name || o.user.login)) || 'contributor'), source: 'inaturalist' }; break; } } }
  } catch (_) {}
  // 2) Xeno-canto for birds
  if (!result && (rec.class || '').toLowerCase() === 'aves') {
    try { const r = await fetch(`https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(sci)}+q:A`); if (r.ok) { const d = await r.json(); const x = (d.recordings || [])[0]; if (x && x.file) { result = { url: x.file.startsWith('http') ? x.file : 'https:' + x.file, attribution: 'Xeno-canto · ' + (x.rec || 'contributor'), source: 'xeno-canto' }; } } } catch (_) {}
  }
  try { await db.kvSet(ck, result); } catch (_) {}
  return result;
}
