/* Cloudflare Pages Function — wildlife identification.
   Engines (in order): Gemini (free) -> OpenAI GPT-4o (paid) -> Google Vision web detection.
   Env vars (Cloudflare Pages -> Settings -> Environment variables):
     GEMINI_API_KEY  (free, from aistudio.google.com)  ·  optional GEMINI_MODEL (default gemini-2.0-flash)
     OPENAI_API_KEY or ART_API_KEY (paid)  ·  optional GOOGLE_VISION_KEY */
const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
export async function onRequestGet() { return json({ ok: true, note: 'POST { imageBase64, lat, lng } to identify' }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { imageBase64, lat, lng } = await request.json();
    if (!imageBase64) return json({ candidates: [], note: 'no-image' });
    let candidates = []; let similarImages = []; const sources = [];
    if (!candidates.length) { try { const g = await geminiVision(env, imageBase64, lat, lng); if (g && g.length) { candidates = g; sources.push('gemini'); } } catch (_) {} }
    if (!candidates.length) { try { const ai = await openaiVision(env, imageBase64, lat, lng); if (ai && ai.length) { candidates = ai; sources.push('ai-vision'); } } catch (_) {} }
    try { const gw = await googleWeb(env, imageBase64); if (gw) { similarImages = gw.similar || []; const have = new Set(candidates.map((c) => (c.common || c.name || '').toLowerCase())); gw.names.forEach((n) => { const k = n.name.toLowerCase(); if (!have.has(k)) { have.add(k); candidates.push({ name: n.name, common: n.name, score: n.score }); } }); if (gw.names.length || gw.similar.length) sources.push('google-web'); } } catch (_) {}
    return json({ candidates, similarImages, source: sources.join('+') || 'none' });
  } catch (e) { return json({ candidates: [], error: String(e) }); }
}
async function geminiVision(env, b64, lat, lng) {
  const key = env.GEMINI_API_KEY; if (!key) return null;
  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  const loc = (lat != null && lng != null) ? ` The photo was taken near latitude ${lat}, longitude ${lng}; prefer species that actually occur there.` : '';
  const data = String(b64).split(',').pop();
  const body = { contents: [{ parts: [ { text: `You are an expert field naturalist. Identify the single most prominent wild organism in this photo.${loc} Respond ONLY as JSON: {"candidates":[{"common_name":"...","scientific_name":"...","confidence":0.0}]} with up to 5 entries, most likely first, using widely accepted English common names and binomial scientific names.` }, { inline_data: { mime_type: 'image/jpeg', data } } ] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) return null;
  const d = await r.json(); const txt = d.candidates?.[0]?.content?.parts?.[0]?.text; if (!txt) return null;
  let parsed; try { parsed = JSON.parse(txt); } catch (_) { return null; }
  return (parsed.candidates || []).slice(0, 5).map((c) => ({ name: c.scientific_name || c.common_name, common: c.common_name || null, score: typeof c.confidence === 'number' ? Math.max(0.3, Math.min(0.99, c.confidence)) : 0.7 })).filter((c) => c.name);
}
async function openaiVision(env, b64, lat, lng) {
  const key = env.OPENAI_API_KEY || env.ART_API_KEY; if (!key) return null;
  const model = env.IDENT_MODEL || 'gpt-4o-mini';
  const loc = (lat != null && lng != null) ? ` The photo was taken near latitude ${lat}, longitude ${lng}; prefer species that actually occur there.` : '';
  const url = String(b64).startsWith('data:') ? b64 : 'data:image/jpeg;base64,' + b64;
  const body = { model, temperature: 0.2, max_tokens: 500, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: [ { type: 'text', text: `You are an expert field naturalist. Identify the single most prominent wild organism in this photo.${loc} Respond ONLY as JSON: {"candidates":[{"common_name":"...","scientific_name":"...","confidence":0.0}]} with up to 5 entries, most likely first, using widely accepted English common names.` }, { type: 'image_url', image_url: { url, detail: 'low' } } ] }] };
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) return null;
  const d = await r.json(); let parsed; try { parsed = JSON.parse(d.choices?.[0]?.message?.content || '{}'); } catch (_) { return null; }
  return (parsed.candidates || []).slice(0, 5).map((c) => ({ name: c.scientific_name || c.common_name, common: c.common_name || null, score: typeof c.confidence === 'number' ? Math.max(0.3, Math.min(0.99, c.confidence)) : 0.7 })).filter((c) => c.name);
}
async function googleWeb(env, b64) {
  const key = env.GOOGLE_VISION_KEY; if (!key) return null;
  const content = String(b64).split(',').pop();
  const r = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + key, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requests: [{ image: { content }, features: [{ type: 'WEB_DETECTION', maxResults: 10 }] }] }) });
  if (!r.ok) return null;
  const d = await r.json(); const w = (d.responses && d.responses[0] && d.responses[0].webDetection) || {};
  const names = []; (w.bestGuessLabels || []).forEach((b) => { if (b.label) names.push({ name: b.label, score: 0.9 }); });
  (w.webEntities || []).forEach((e) => { if (e.description && e.score > 0.3) names.push({ name: e.description, score: Math.min(0.85, (e.score || 0.6) / 2) }); });
  const similar = (w.visuallySimilarImages || []).map((i) => i.url).filter(Boolean);
  return { names, similar };
}
