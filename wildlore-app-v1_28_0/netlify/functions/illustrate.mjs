/* Netlify Function: Wildlore per-species AI illustration pass.
   Generates ONE unique, house-style illustration per species in a consistent field-guide aesthetic,
   layered on top of the built-in vector art. Caches in Netlify Blobs (shared across users) when the
   runtime provides it; the app also caches per-device. No key -> {available:false} and the app keeps
   its vector illustration, so nothing breaks.
   Env: ART_API_KEY (OpenAI key, required)  ·  optional ART_MODEL (default gpt-image-1; dall-e-3 also works) */
function json(o) { return new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
function housePrompt(subject, sci) {
  return `A flat, modern vector illustration of a single ${subject}${sci ? ` (${sci})` : ''}, shown full body in a clean side profile. Cute, friendly, characterful children's nature-book style: bold simple shapes, smooth clean outlines, flat colour fills with only soft minimal shading, one small simple eye, gentle expression. A limited, harmonious, natural colour palette. No background at all — the subject is fully isolated on a transparent background, tightly framed with only a small margin, sticker-like. No text, no words, no border, no frame, no collage. Modern editorial flat-design wildlife illustration with personality and charm. Not photorealistic, not 3D, no heavy gradients, no painterly texture, no rendered fur.`;
}
async function blobsGet(key) { try { const { getStore } = await import('@netlify/blobs'); return (await getStore('wildlore-art').get(key, { type: 'text' })) || null; } catch (_) { return null; } }
async function blobsSet(key, val) { try { const { getStore } = await import('@netlify/blobs'); await getStore('wildlore-art').set(key, val); } catch (_) {} }

export default async (req) => {
  try {
    const { taxonKey, commonName, scientificName } = await req.json();
    const blobKey = 'sp-' + (taxonKey || scientificName || commonName);
    const cached = (taxonKey != null) ? await blobsGet(blobKey) : null;
    if (cached) return json({ available: true, image: cached, cached: true });
    const key = process.env.ART_API_KEY;
    if (!key) return json({ available: false, reason: 'no_key' });
    const subject = commonName || scientificName || 'animal';
    const model = process.env.ART_MODEL || 'gpt-image-1';
    const body = /dall-e/i.test(model)
      ? { model, prompt: housePrompt(subject, scientificName), size: '1024x1024', response_format: 'b64_json', n: 1 }
      : { model, prompt: housePrompt(subject, scientificName), size: '1024x1024', quality: 'medium', background: 'transparent', n: 1 };
    const r = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const t = await r.text(); return json({ available: false, reason: 'gen_' + r.status, detail: t.slice(0, 200) }); }
    const d = await r.json(); const b64 = d.data?.[0]?.b64_json;
    if (!b64) return json({ available: false, reason: 'empty' });
    const dataUrl = 'data:image/png;base64,' + b64;
    if (taxonKey != null) await blobsSet(blobKey, dataUrl);
    return json({ available: true, image: dataUrl });
  } catch (e) { return json({ available: false, reason: String(e).slice(0, 160) }); }
};
