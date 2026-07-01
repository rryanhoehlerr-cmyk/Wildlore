/* Netlify Function: identifies a photo with the iNaturalist Computer Vision API (compares the
   photo against iNaturalist's species image database). Permanent setup uses an iNaturalist
   "application" so it mints fresh tokens itself; a single INAT_API_TOKEN also works for testing.
   Env (permanent): INAT_CLIENT_ID, INAT_CLIENT_SECRET, INAT_USERNAME, INAT_PASSWORD
   Env (quick test): INAT_API_TOKEN
   No creds at all -> returns empty so the app falls back to on-device AI. */
let _cache = { jwt: null, exp: 0 };
async function getJwt() {
  if (process.env.INAT_API_TOKEN) return process.env.INAT_API_TOKEN;
  if (_cache.jwt && Date.now() < _cache.exp) return _cache.jwt;
  const { INAT_CLIENT_ID, INAT_CLIENT_SECRET, INAT_USERNAME, INAT_PASSWORD } = process.env;
  if (!(INAT_CLIENT_ID && INAT_CLIENT_SECRET && INAT_USERNAME && INAT_PASSWORD)) return null;
  const body = new URLSearchParams({ client_id: INAT_CLIENT_ID, client_secret: INAT_CLIENT_SECRET, grant_type: 'password', username: INAT_USERNAME, password: INAT_PASSWORD });
  const tok = await fetch('https://www.inaturalist.org/oauth/token', { method: 'POST', body });
  if (!tok.ok) return null;
  const { access_token } = await tok.json();
  const jt = await fetch('https://www.inaturalist.org/users/api_token', { headers: { Authorization: 'Bearer ' + access_token } });
  if (!jt.ok) return null;
  const { api_token } = await jt.json();
  _cache = { jwt: api_token, exp: Date.now() + 12 * 3600 * 1000 };
  return api_token;
}
export default async (req) => {
  try {
    const { imageBase64, lat, lng } = await req.json();
    if (!imageBase64) return json({ candidates: [], note: 'no-image' });
    let candidates = []; let similarImages = []; const sources = [];
    // 1) iNaturalist computer vision (best for organisms)
    const jwt = await getJwt();
    if (jwt) {
      try {
        const buf = Buffer.from(String(imageBase64).split(',').pop(), 'base64');
        const form = new FormData(); form.append('image', new Blob([buf], { type: 'image/jpeg' }), 'photo.jpg');
        if (lat != null) form.append('lat', String(lat)); if (lng != null) form.append('lng', String(lng));
        const r = await fetch('https://api.inaturalist.org/v1/computervision/score_image', { method: 'POST', headers: { Authorization: 'Bearer ' + jwt }, body: form });
        if (r.ok) { const data = await r.json(); candidates = (data.results || []).slice(0, 8).map((x) => ({ name: x.taxon?.name, common: x.taxon?.preferred_common_name || null, score: (x.combined_score != null ? x.combined_score / 100 : (x.vision_score || 0)) })).filter((c) => c.name); if (candidates.length) sources.push('inaturalist'); }
      } catch (_) {}
    }
    // 2) AI vision (GPT-4o) — strong generalist, no access gate; reuses the OpenAI key
    if (!candidates.length) {
      try { const ai = await openaiVision(imageBase64, lat, lng); if (ai && ai.length) { candidates = ai; sources.push('ai-vision'); } } catch (_) {}
    }
    // 3) Google Vision Web Detection (reverse-image-search): supplements matches + returns similar web photos
    try {
      const g = await googleWeb(imageBase64);
      if (g) { similarImages = g.similar || []; const have = new Set(candidates.map((c) => (c.common || c.name || '').toLowerCase())); g.names.forEach((n) => { const k = n.name.toLowerCase(); if (!have.has(k)) { have.add(k); candidates.push({ name: n.name, common: n.name, score: n.score }); } }); if (g.names.length || g.similar.length) sources.push('google-web'); }
    } catch (_) {}
    return json({ candidates, similarImages, source: sources.join('+') || 'none' });
  } catch (e) { return json({ candidates: [], error: String(e) }); }
};
async function openaiVision(b64, lat, lng) {
  const key = process.env.OPENAI_API_KEY || process.env.ART_API_KEY; if (!key) return null;
  const model = process.env.IDENT_MODEL || 'gpt-4o-mini';
  const loc = (lat != null && lng != null) ? ` The photo was taken near latitude ${lat}, longitude ${lng}; prefer species that actually occur there.` : '';
  const url = String(b64).startsWith('data:') ? b64 : 'data:image/jpeg;base64,' + b64;
  const body = { model, temperature: 0.2, max_tokens: 500, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: [
    { type: 'text', text: `You are an expert field naturalist. Identify the single most prominent wild organism in this photo.${loc} Respond ONLY as JSON: {"candidates":[{"common_name":"...","scientific_name":"...","confidence":0.0}]} with up to 5 entries, most likely first, using widely accepted English common names and binomial scientific names. If unsure, include plausible alternatives. No prose.` },
    { type: 'image_url', image_url: { url, detail: 'low' } }
  ] }] };
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) return null;
  const d = await r.json(); let parsed; try { parsed = JSON.parse(d.choices?.[0]?.message?.content || '{}'); } catch (_) { return null; }
  return (parsed.candidates || []).slice(0, 5).map((c) => ({ name: c.scientific_name || c.common_name, common: c.common_name || null, score: typeof c.confidence === 'number' ? Math.max(0.3, Math.min(0.99, c.confidence)) : 0.7 })).filter((c) => c.name);
}
async function googleWeb(b64) {
  const key = process.env.GOOGLE_VISION_KEY; if (!key) return null;
  const content = String(b64).split(',').pop();
  const r = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + key, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requests: [{ image: { content }, features: [{ type: 'WEB_DETECTION', maxResults: 10 }] }] }) });
  if (!r.ok) return null;
  const d = await r.json(); const w = (d.responses && d.responses[0] && d.responses[0].webDetection) || {};
  const names = [];
  (w.bestGuessLabels || []).forEach((b) => { if (b.label) names.push({ name: b.label, score: 0.9 }); });
  (w.webEntities || []).forEach((e) => { if (e.description && e.score > 0.3) names.push({ name: e.description, score: Math.min(0.85, (e.score || 0.6) / 2) }); });
  const similar = (w.visuallySimilarImages || []).map((i) => i.url).filter(Boolean);
  return { names, similar };
}
function json(obj) { return new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
