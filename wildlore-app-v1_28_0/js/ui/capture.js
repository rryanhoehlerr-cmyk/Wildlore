import { el, go, spinner, toast, titleCase, haptic } from './components.js';
import { plate, categoryOf, categoryLabel } from './illustrations.js';
import { CONFIG } from '../config.js';
import * as identify from '../features/identify.js';
import * as vision from '../features/vision.js';
import * as catalog from '../data/catalog.js';
import * as store from '../core/store.js';
import * as artwork from '../features/artwork.js';
let geo = { lat: null, lng: null };
let pendingPhoto = null;
export async function view() {
  const q = (location.hash.split('?')[1] || ''); const presetTaxon = new URLSearchParams(q).get('taxon');
  tryGeo(); pendingPhoto = null;
  const root = el('div', { class: 'pad capture-view' });
  root.append(el('div', { class: 'back-head' }, el('button', { class: 'back-btn', 'aria-label': 'Back', onclick: () => go('#/home') }, '‹'), el('div', {}, el('h1', { class: 'h-title' }, 'Identify a species'), el('div', { class: 'greet' }, 'Photo AI + GBIF'))));
  const modes = el('div', { class: 'seg' }, segBtn('photo', 'Photo', true), segBtn('name', 'By name'), segBtn('sound', 'Sound'));
  root.append(modes);
  const panel = el('div', { class: 'cap-panel' }); const result = el('div', { class: 'cap-result' }); root.append(panel, result);
  let mode = 'photo';
  modes.querySelectorAll('div').forEach((d) => d.addEventListener('click', () => { mode = d.dataset.m; modes.querySelectorAll('div').forEach((x) => x.classList.toggle('on', x === d)); renderPanel(); }));
  function renderPanel() { panel.innerHTML = ''; result.innerHTML = ''; pendingPhoto = null; if (mode === 'name') renderName(); else if (mode === 'photo') renderPhoto(); else renderSound(); }

  function renderName() {
    const input = el('input', { class: 'search', type: 'search', placeholder: 'Type a species name (e.g. sea otter, blue jay)' });
    const btn = el('button', { class: 'btn', onclick: () => runName(input.value.trim(), 'name') }, 'Identify');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    panel.append(el('p', { class: 'muted small' }, 'Resolves against the GBIF backbone: tens of thousands of species, marine included.'), input, btn);
  }
  function renderPhoto() {
    const file = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    const hint = el('input', { class: 'search', type: 'search', placeholder: 'Optional: what do you think it is?' });
    const drop = el('button', { class: 'cap-drop', onclick: () => file.click() }, el('span', { html: '<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6.5" width="19" height="13.5" rx="2.5" stroke-width="1.6"/><circle cx="12" cy="13.2" r="3.6" stroke-width="1.6"/><path d="M8 6.5l1.4-2.2h5.2L16 6.5" stroke-width="1.6"/></svg>' }), el('span', {}, 'Take a photo or upload one'));
    const prev = el('div', { class: 'cap-prev' });
    file.addEventListener('change', async () => {
      const f = file.files?.[0]; if (!f) return; let b64; try { b64 = await toB64(f); } catch (e) { toast('Could not read that image'); return; }
      pendingPhoto = b64; prev.innerHTML = '';
      prev.append(buildFramer(b64, (cropped) => analyzePhoto(cropped, hint.value.trim())));
    });
    panel.append(el('p', { class: 'muted small' }, 'Take or upload a photo. If you have a hunch, type it to guide the AI.'), hint, drop, file, prev);
  }
  function renderSound() {
    const file = el('input', { type: 'file', accept: 'audio/*', style: 'display:none' });
    const drop = el('button', { class: 'cap-drop', onclick: () => file.click() }, el('span', { html: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke-width="1.6"/><path d="M6 11a6 6 0 0012 0M12 17v4" stroke-width="1.6" stroke-linecap="round"/></svg>' }), el('span', {}, 'Record or upload a call'));
    const input = el('input', { class: 'search', type: 'search', placeholder: 'Heard a bird? Type its name' });
    const btn = el('button', { class: 'btn', onclick: () => runName(input.value.trim(), 'sound') }, 'Identify');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    file.addEventListener('change', () => { result.innerHTML = ''; result.append(el('div', { class: 'note' }, 'Birdsong AI is not enabled yet. Name the bird you heard and we will log it as a heard encounter.')); });
    panel.append(el('p', { class: 'muted small' }, 'Record or upload a call, then name what you heard.'), drop, file, input, btn);
  }

  async function analyzePhoto(b64, hint) {
    result.innerHTML = ''; result.append(spinner('Analyzing the subject…'));
    result.append(el('p', { class: 'muted small center', style: 'margin-top:10px' }, 'Comparing against species photos…'));
    let cands = []; let source = null; let similarImages = [];
    if (CONFIG.identify.visionEndpoint) { try { const ve = await visionEndpoint(b64); cands = ve.candidates; similarImages = ve.similarImages || []; if (cands.length) source = engineLabel(ve.source); } catch (_) { cands = []; } }
    if (!cands.length && CONFIG.identify.onDeviceVision) { try { cands = await vision.identifyImage(b64); if (cands.length) source = 'On-device guess (offline) \u00b7 add a vision key for sharper matches'; } catch (_) { cands = []; } }
    if (hint) { try { const h = await catalog.matchName(hint); if (h[0]) { cands = [{ ...h[0], score: Math.max(0.97, h[0].score || 0) }, ...cands.filter((c) => c.taxonKey !== h[0].taxonKey)]; source = 'Led by your guess' + (source ? ', ' + source.toLowerCase() : ''); } } catch (_) {} }
    showGate(cands, { photoB64: b64, mode: 'photo', source, similarImages });
  }
  async function visionEndpoint(b64) {
    const res = await fetch(CONFIG.identify.visionEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: b64, lat: geo.lat, lng: geo.lng }) });
    if (!res.ok) throw new Error('vision ' + res.status);
    const data = await res.json(); const out = []; const seen = new Set();
    for (const c of (data.candidates || []).slice(0, 8)) { let m = []; try { m = await catalog.matchName(c.name || c.common); } catch (_) {} if (m[0] && !seen.has(m[0].taxonKey)) { seen.add(m[0].taxonKey); out.push({ ...m[0], score: c.score ?? m[0].score }); } }
    return { candidates: out, similarImages: data.similarImages || [], source: data.source || '' };
  }
  async function runName(name, mode) {
    if (!name) { toast('Type a name to identify'); return; }
    result.innerHTML = ''; result.append(spinner('Identifying…'));
    let cands = []; try { cands = await catalog.matchName(name); } catch (e) { result.innerHTML = ''; result.append(el('div', { class: 'note' }, 'Search failed: ' + e.message)); return; }
    showGate(cands, { mode });
  }
  function showGate(candidates, ctx) {
    result.innerHTML = '';
    if (!candidates.length) {
      result.append(el('div', { class: 'note' }, 'No confident match. Type what you think it is and we will find it.'));
      const input = el('input', { class: 'search', type: 'search', placeholder: 'What is it? Type the name' });
      const btn = el('button', { class: 'btn', onclick: () => runWithPhoto(input.value.trim(), ctx) }, 'Identify');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
      result.append(input, btn);
      if (ctx && ctx.similarImages && ctx.similarImages.length) { result.append(el('div', { class: 'muted small', style: 'margin-top:14px' }, 'Similar photos from the web — tap to open')); result.append(webStrip(ctx.similarImages)); }
      return;
    }
    const top = candidates[0]; const gate = identify.gateFor(top.score);
    result.append(el('div', { class: 'gate-h' }, gate === identify.Gate.HIGH ? 'Best match — compare the photos' : gate === identify.Gate.MEDIUM ? 'Likely matches — pick the closest' : 'Possible matches — pick the closest'));
    if (ctx?.source) result.append(el('div', { class: 'muted small', style: 'margin:-2px 0 12px' }, ctx.source));
    candidates.slice(0, 5).forEach((c) => result.append(candRow(c, ctx, candidates)));
    const more = el('div', { class: 'gate-more' });
    const altSearch = el('button', { class: 'link-btn', onclick: () => { if (more.querySelector('.alt-box')) return; const box = el('div', { class: 'alt-box' }); const i = el('input', { class: 'search', type: 'search', placeholder: 'Search a different species' }); const b = el('button', { class: 'btn ghost', onclick: () => runWithPhoto(i.value.trim(), ctx) }, 'Search'); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') b.click(); }); box.append(i, b); more.append(box); i.focus(); } }, 'None of these · search by name');
    more.append(altSearch);
    if (ctx && ctx.mode === 'photo') more.append(el('button', { class: 'link-btn', onclick: () => panel.querySelector('input[type=file]') && panel.querySelector('input[type=file]').click() }, 'Try another photo'));
    result.append(more);
  }
  async function runWithPhoto(name, ctx) { if (!name) { toast('Type a name'); return; } result.innerHTML = ''; result.append(spinner('Identifying…')); let c = []; try { c = await catalog.matchName(name); } catch (_) {} showGate(c, ctx); }
  function candRow(cand, ctx, candidates) {
    const thumb = el('div', { class: 'cand-thumb' });
    identify.resolve(cand.taxonKey).then((rec) => { const u = rec?.media?.[0]?.url; if (u) thumb.style.backgroundImage = `url("${u}")`; }).catch(() => {});
    return el('button', { class: 'cand', onclick: () => showCompare(cand, ctx, candidates) }, thumb, el('div', { class: 'cand-main' }, el('div', { class: 'cand-n' }, titleCase(cand.name)), el('div', { class: 'cand-s' }, cand.scientificName || '')), el('div', { class: 'cand-score' }, Math.round((cand.score || 0) * 100) + '%'));
  }
  function webStrip(urls) { const strip = el('div', { class: 'cmp-strip' }); urls.slice(0, 8).forEach((u) => { const t = el('button', { class: 'cmp-thumb', onclick: () => window.open(u, '_blank', 'noopener') }); t.style.backgroundImage = `url("${u}")`; strip.append(t); }); return strip; }
  async function inatRefPhotos(sci) {
    if (!sci) return [];
    try { const r = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sci)}&per_page=1`); if (!r.ok) return []; const d = await r.json(); const t = (d.results || [])[0]; if (!t) return []; const out = []; if (t.default_photo) out.push(t.default_photo.medium_url || t.default_photo.url); (t.taxon_photos || []).forEach((tp) => { const u = tp.photo && (tp.photo.medium_url || tp.photo.url); if (u) out.push(u); }); return [...new Set(out)].filter(Boolean).slice(0, 8); } catch (_) { return []; }
  }
  async function showCompare(cand, ctx, candidates) {
    result.innerHTML = ''; result.append(spinner('Loading photos to compare…'));
    const rec = await identify.resolve(cand.taxonKey).catch(() => null);
    result.innerHTML = '';
    if (!rec) { result.append(el('div', { class: 'note' }, 'Could not load that species.'), el('button', { class: 'link-btn', onclick: () => showGate(candidates, ctx) }, '\u2039 Back to matches')); return; }
    const wrap = el('div', { class: 'compare' });
    wrap.append(el('button', { class: 'link-btn', onclick: () => showGate(candidates, ctx) }, '\u2039 Back to matches'));
    wrap.append(el('div', { class: 'compare-name' }, titleCase(rec.commonName || rec.canonicalName)));
    if (rec.scientificName) wrap.append(el('button', { class: 'sp-sn-toggle', onclick: (e) => { const t = e.currentTarget; const o = t.classList.toggle('open'); t.textContent = o ? rec.scientificName : 'Show scientific name'; } }, 'Show scientific name'));
    const grid = el('div', { class: 'compare-grid' });
    const yours = (ctx && ctx.photoB64) || pendingPhoto;
    if (yours) grid.append(el('figure', { class: 'cmp' }, el('img', { src: yours, alt: '', loading: 'lazy', decoding: 'async' }), el('figcaption', {}, 'Your photo')));
    let refs = await inatRefPhotos(rec.scientificName || rec.canonicalName); if (!refs.length) refs = (rec.media || []).map((m) => m.url).filter(Boolean);
    const bigImg = el('img', { class: 'cmp-big', src: refs[0] || '', alt: '', decoding: 'async' });
    grid.append(el('figure', { class: 'cmp' }, bigImg, el('figcaption', {}, 'Reference')));
    wrap.append(grid);
    if (refs.length > 1) { wrap.append(el('div', { class: 'muted small' }, 'More photos of this species — tap to compare')); const strip = el('div', { class: 'cmp-strip' }); refs.slice(0, 8).forEach((u) => { const t = el('button', { class: 'cmp-thumb', onclick: () => { bigImg.src = u; } }); t.style.backgroundImage = `url("${u}")`; strip.append(t); }); wrap.append(strip); }
    if (ctx && ctx.similarImages && ctx.similarImages.length) { wrap.append(el('div', { class: 'muted small' }, 'Similar photos from the web')); wrap.append(webStrip(ctx.similarImages)); }
    wrap.append(el('div', { class: 'compare-act' }, el('button', { class: 'btn accent', onclick: () => confirmCandidate(cand, ctx, candidates, rec) }, 'Yes — this is it'), el('button', { class: 'btn ghost', onclick: () => showGate(candidates, ctx) }, 'Not quite — back')));
    result.append(wrap);
  }
  async function confirmCandidate(cand, ctx, candidates, rec) {
    result.innerHTML = ''; result.append(spinner('Saving your find…'));
    if (!rec) rec = await identify.resolve(cand.taxonKey).catch(() => null);
    if (!rec) { result.innerHTML = ''; result.append(el('div', { class: 'note' }, 'Could not load that species. Try again.')); return; }
    const encounterType = (ctx?.mode === 'sound') ? 'audio' : 'wild';
    const photoUrl = pendingPhoto || ctx?.photoB64 || rec.media?.[0]?.url || null;
    const out = await store.recordDiscovery({ record: rec, encounterType, confidence: cand.score, lat: geo.lat, lng: geo.lng, photoUrl });
    const { evaluate } = await import('../features/gamify.js'); await evaluate();
    reveal(rec, out, { onUndo: async () => { await store.undoLastDiscovery({ discoveryId: out.discoveryId, taxonKey: rec.taxonKey, xpGain: out.xpGain, scoreGain: out.scoreGain }); toast('Record undone'); showGate(candidates || [], ctx); } });
  }
  if (presetTaxon) {
    document.querySelector('.seg div[data-m="name"]').click();
    result.append(spinner('Loading…'));
    const rec = await identify.resolve(Number(presetTaxon)).catch(() => null); result.innerHTML = '';
    if (rec) showGate([{ taxonKey: rec.taxonKey, name: rec.commonName || rec.canonicalName, scientificName: rec.scientificName, score: 1 }], { mode: 'name' });
  } else { renderPanel(); }
  return root;
}
function engineLabel(src) { src = src || ''; if (src.includes('inaturalist')) return 'Identified by iNaturalist\u2019s vision model'; if (src.includes('ai-vision')) return 'Identified by AI vision'; if (src.includes('google')) return 'Matched via web image search'; return 'Compared against reference photos'; }
function segBtn(m, label, on) { return el('div', { class: on ? 'on' : '', dataset: { m } }, label); }
function reveal(rec, out, opts = {}) {
  const pl = plate(categoryOf(rec), { locked: true }); pl.classList.add('reveal-plate');
  const ov = el('div', { class: 'reveal' }, el('div', { class: 'reveal-card' },
    el('div', { class: 'reveal-k' }, out.first ? 'New to the journal' : 'Recorded again'), pl,
    el('div', { class: 'reveal-n' }, titleCase(rec.commonName || rec.canonicalName)), el('div', { class: 'reveal-sn' }, categoryLabel(categoryOf(rec))),
    el('div', { class: 'reveal-meta' }, reward('+' + out.xpGain, 'Experience'), reward('+' + (out.scoreGain || 0), 'Discovery'), reward(rec.rarityTier, 'Rarity')),
    el('div', { class: 'reveal-cta' }, el('button', { class: 'btn accent', onclick: () => { ov.remove(); go('#/species/' + rec.taxonKey); } }, 'Open the entry'), el('a', { onclick: () => { ov.remove(); go('#/collection'); } }, 'Back to collection'),
    opts.onUndo ? el('a', { class: 'reveal-undo', onclick: async () => { ov.remove(); await opts.onUndo(); } }, 'Not the right match? Undo') : null)));
  document.body.append(ov);
  requestAnimationFrame(() => setTimeout(() => { pl.classList.remove('locked'); pl.classList.add('revealed'); chime(out.first); haptic(out.first ? [14, 40, 22] : 16); }, 520));
}
function reward(v, k) { return el('div', { class: 'rm' }, el('div', { class: 'rv' }, v), el('div', { class: 'rk' }, k)); }
function toB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
function buildFramer(b64, onIdentify) {
  const box = el('div', { class: 'framer' });
  const imgWrap = el('div', { class: 'framer-img' });
  const img = el('img', { src: b64, alt: '', decoding: 'async' });
  const ring = el('div', { class: 'framer-ring', style: 'display:none' });
  imgWrap.append(img, ring); let cropped = b64;
  imgWrap.addEventListener('click', async (e) => { const rect = img.getBoundingClientRect(); const rx = (e.clientX - rect.left) / rect.width, ry = (e.clientY - rect.top) / rect.height; if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return; ring.style.display = 'block'; ring.style.left = rx * 100 + '%'; ring.style.top = ry * 100 + '%'; cropped = await cropAround(b64, rx, ry); });
  const go = el('button', { class: 'btn', onclick: () => onIdentify(cropped) }, 'Identify');
  box.append(el('p', { class: 'muted small' }, 'Tap the animal to focus on it (optional), then identify.'), imgWrap, go);
  return box;
}
function cropAround(b64, rx, ry) { return new Promise((res) => { const i = new Image(); i.onload = () => { const W = i.naturalWidth, H = i.naturalHeight; const side = Math.round(Math.min(W, H) * 0.72); let x = Math.round(rx * W - side / 2), y = Math.round(ry * H - side / 2); x = Math.max(0, Math.min(W - side, x)); y = Math.max(0, Math.min(H - side, y)); const c = document.createElement('canvas'); c.width = side; c.height = side; c.getContext('2d').drawImage(i, x, y, side, side, 0, 0, side, side); try { res(c.toDataURL('image/jpeg', 0.9)); } catch (_) { res(b64); } }; i.onerror = () => res(b64); i.src = b64; }); }
function tryGeo() { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition((p) => { geo = { lat: p.coords.latitude, lng: p.coords.longitude }; import('../data/collections.js').then((m) => m.rememberCoords(geo.lat, geo.lng)).catch(() => {}); }, () => {}, { timeout: 4000, maximumAge: 600000 }); }
function chime(big) { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const notes = big ? [523.25, 659.25, 783.99, 1046.5] : [392, 523.25]; notes.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination); const t = ac.currentTime + i * 0.1; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.start(t); o.stop(t + 0.55); }); } catch (_) {} }
