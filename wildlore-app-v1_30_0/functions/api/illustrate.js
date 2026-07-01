/* Cloudflare Pages Function — per-species flat illustration (OpenAI image model, opt-in).
   Env: ART_API_KEY or OPENAI_API_KEY  ·  optional ART_MODEL (default gpt-image-1) */
const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
function housePrompt(subject, sci) {
  return `A flat, modern vector illustration of a single ${subject}${sci ? ` (${sci})` : ''}, shown full body in a clean side profile. Cute, friendly, characterful children's nature-book style: bold simple shapes, smooth clean outlines, flat colour fills with only soft minimal shading, one small simple eye. A limited, harmonious, natural colour palette. No background at all — the subject is fully isolated on a transparent background, tightly framed, sticker-like. No text, no border, no frame. Not photorealistic, not 3D, no heavy gradients, no painterly texture.`;
}
export async function onRequestGet() { return json({ ok: true, note: 'POST { commonName, scientificName } to illustrate' }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { commonName, scientificName } = await request.json();
    const key = env.ART_API_KEY || env.OPENAI_API_KEY; if (!key) return json({ available: false, reason: 'no_key' });
    const subject = commonName || scientificName || 'animal';
    const model = env.ART_MODEL || 'gpt-image-1';
    const body = /dall-e/i.test(model)
      ? { model, prompt: housePrompt(subject, scientificName), size: '1024x1024', response_format: 'b64_json', n: 1 }
      : { model, prompt: housePrompt(subject, scientificName), size: '1024x1024', quality: 'medium', background: 'transparent', n: 1 };
    const r = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const t = await r.text(); return json({ available: false, reason: 'gen_' + r.status, detail: t.slice(0, 200) }); }
    const d = await r.json(); const b64 = d.data?.[0]?.b64_json; if (!b64) return json({ available: false, reason: 'empty' });
    return json({ available: true, image: 'data:image/png;base64,' + b64 });
  } catch (e) { return json({ available: false, reason: String(e).slice(0, 160) }); }
}
