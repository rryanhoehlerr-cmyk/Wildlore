/* Personalized habitats — your photo becomes an illustrated environment in the SAME vector language
   as the built-in biomes, so it matches the creatures. We read the photo for its biome + colour
   mood; you can describe the place to auto-place fitting animals, hand-pick any creatures, drag them
   to arrange, and chain places into one continuous Connected Landscape. */
import { el, go, spinner, toast } from './components.js';
import { silSVG, categoryOf } from './illustrations.js';
import * as store from '../core/store.js';
import { buildSpec, composeScene, allowedBiomes, primaryBiome } from './composer.js';
import { analyzePhoto } from '../data/sceneanalyze.js';

const BIOME_NAME = { forest: 'Forest', meadow: 'Meadow', wetland: 'Wetland', reef: 'Coral Reef', ocean: 'Open Ocean' };
const specOf = (place) => buildSpec({ palette: place.palette, horizon: place.horizon, scene: place.sceneType, water: place.water }, place.description);
const BEHAVIOUR = {
  swim: new Set(['fish', 'shark', 'ray', 'seahorse', 'octopus', 'seal', 'whale', 'turtle']),
  fly: new Set(['songbird', 'raptor', 'owl', 'duck', 'heron', 'bat']),
  flutter: new Set(['butterfly', 'bee', 'dragonfly', 'hummingbird']),
  pulse: new Set(['jelly']), crawl: new Set(['crab', 'nudibranch']),
  sway: new Set(['coral', 'seastar', 'urchin', 'shell', 'tree', 'fern', 'flower', 'mushroom'])
};
function behaviourOf(cat) { for (const b in BEHAVIOUR) if (BEHAVIOUR[b].has(cat)) return b; return 'walk'; }
const BAND = { fly: [8, 38], flutter: [22, 52], swim: [32, 76], pulse: [16, 66], walk: [68, 86], crawl: [82, 91], sway: [76, 92] };
const ROAM = { swim: 'roam-swim', fly: 'roam-fly', flutter: 'roam-flutter', pulse: 'roam-pulse', crawl: 'roam-crawl', sway: 'roam-sway', walk: 'roam-walk' };
const FACEFLIP = { swim: 'face-swim', walk: 'face-walk', crawl: 'face-walk', pulse: 'face-pulse' };
const SIZE = { whale: 2.0, shark: 1.5, ray: 1.3, seal: 1.15, turtle: 1.0, octopus: 1.0, seahorse: 0.5, fish: 0.58, jelly: 0.85, crab: 0.6, nudibranch: 0.5, seastar: 0.62, urchin: 0.55, shell: 0.45, coral: 0.95, raptor: 1.15, owl: 1.0, heron: 1.2, duck: 0.9, songbird: 0.55, hummingbird: 0.42, bat: 0.6, bigcat: 1.45, bear: 1.6, deer: 1.3, fox: 0.95, rabbit: 0.62, rodent: 0.45, lizard: 0.55, snake: 0.85, croc: 1.5, frog: 0.5, salamander: 0.5, butterfly: 0.55, bee: 0.4, dragonfly: 0.55, beetle: 0.42 };
const BASE = 54;
const OPEN_OCEAN = new Set(['shark', 'ray', 'whale', 'seal', 'jelly']);
const WETLAND_CAT = new Set(['duck', 'heron', 'frog', 'salamander', 'croc', 'turtle']);
const MEADOW_CAT = new Set(['butterfly', 'bee', 'dragonfly', 'flower', 'hummingbird']);
const catOf = (sp) => categoryOf({ class: sp.cls, order: sp.order, realm: sp.realm });
function biomeForSp(sp) { const cat = catOf(sp); if (sp.realm === 'marine') return OPEN_OCEAN.has(cat) ? 'ocean' : 'reef'; if (WETLAND_CAT.has(cat)) return 'wetland'; if (MEADOW_CAT.has(cat)) return 'meadow'; return 'forest'; }
function rgba(c, a) { const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(c); return m ? `rgba(${m[1]},${m[2]},${m[3]},${a})` : c; }
function toB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
function biomeFromAnalysis(info, desc) {
  const d = (desc || '').toLowerCase();
  if (/reef|coral|tide ?pool|kelp|anemone/.test(d)) return 'reef';
  if (/ocean|sea|deep|pelagic|open water/.test(d)) return 'ocean';
  if (/wetland|marsh|pond|lake|river|swamp|lily|bog/.test(d)) return 'wetland';
  if (/meadow|field|grass|prairie|garden|flower/.test(d)) return 'meadow';
  if (/forest|wood|tree|jungle|trail|canopy/.test(d)) return 'forest';
  if (info && info.scene === 'water') return info.water ? 'reef' : 'ocean';
  if (info && info.scene === 'land') return 'forest';
  return 'meadow';
}
const KW = { bird: ['songbird', 'raptor', 'owl', 'duck', 'heron', 'hummingbird'], fish: ['fish'], shark: ['shark'], ray: ['ray'], whale: ['whale'], seal: ['seal'], otter: ['fox'], crab: ['crab'], turtle: ['turtle'], frog: ['frog'], salamander: ['salamander'], butterfly: ['butterfly'], bee: ['bee'], dragonfly: ['dragonfly'], coral: ['coral'], jelly: ['jelly'], jellyfish: ['jelly'], octopus: ['octopus'], 'sea star': ['seastar'], starfish: ['seastar'], urchin: ['urchin'], deer: ['deer'], fox: ['fox'], bear: ['bear'], lizard: ['lizard'], snake: ['snake'], nudibranch: ['nudibranch'] };
function descCats(desc) { const d = (desc || '').toLowerCase(); const cats = new Set(); for (const k in KW) if (d.includes(k)) KW[k].forEach((c) => cats.add(c)); return cats; }
function creaturesForPlace(place, col) {
  if (place.members && place.members.length) { const set = new Set(place.members); return col.filter((sp) => set.has(sp.taxonKey)); }
  const allowed = allowedBiomes(specOf(place)); const cats = descCats(place.description);
  return col.filter((sp) => allowed.has(biomeForSp(sp)) || cats.has(catOf(sp)));
}

export async function mount(container) { const wrap = el('div', { class: 'places' }); container.append(wrap); await renderGallery(wrap); }

function sceneThumb(place) { const d = el('div', { class: 'place-thumb scene-thumb' }); d.innerHTML = composeScene(specOf(place)); return d; }

async function renderGallery(wrap) {
  wrap.innerHTML = '';
  wrap.append(el('p', { class: 'places-intro' }, 'Upload a photo of a place you love. Wildlore turns it into an illustrated habitat in the same style as your animals, then fills it with the creatures that belong there.'));
  wrap.append(el('button', { class: 'place-create', onclick: () => startCreate(wrap) }, '＋  Create a habitat from a photo'));
  const places = await store.getPlaces();
  if (places.length >= 2) {
    const chain = (await store.getLandscape()).filter((id) => places.find((p) => p.id === id));
    const has = chain.length >= 2;
    wrap.append(el('div', { class: 'landscape-card' }, el('div', { class: 'lc-k' }, 'Connected landscape'), el('div', { class: 'lc-t' }, has ? `A continuous world of ${chain.length} places` : 'Connect places into one continuous world you can pan through'),
      el('div', { class: 'lc-actions' }, has ? el('button', { class: 'btn', style: 'width:auto;margin:0', onclick: () => openLandscape(wrap) }, 'View landscape') : null, el('button', { class: 'btn ghost', style: 'width:auto;margin:0', onclick: () => arrangeLandscape(wrap) }, has ? 'Edit' : 'Build landscape'))));
  }
  if (!places.length) { wrap.append(el('div', { class: 'places-empty' }, 'No places yet.')); return; }
  const grid = el('div', { class: 'places-grid' });
  places.slice().reverse().forEach((p) => {
    const card = el('button', { class: 'place-card', onclick: () => openScene(wrap, p) });
    card.append(sceneThumb(p));
    card.append(el('div', { class: 'place-cap' }, el('div', { class: 'place-name' }, p.name || 'My place'), el('div', { class: 'place-sub' }, BIOME_NAME[primaryBiome(specOf(p))] || 'Habitat')));
    grid.append(card);
  });
  wrap.append(grid);
}

function startCreate(wrap) {
  wrap.innerHTML = '';
  const file = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
  const drop = el('button', { class: 'cap-drop', onclick: () => file.click() }, el('span', { html: '<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6.5" width="19" height="13.5" rx="2.5" stroke-width="1.6"/><circle cx="12" cy="13.2" r="3.6" stroke-width="1.6"/><path d="M8 6.5l1.4-2.2h5.2L16 6.5" stroke-width="1.6"/></svg>' }), el('span', {}, 'Upload a nature photo'));
  const back = el('button', { class: 'link-btn', onclick: () => renderGallery(wrap) }, '‹ Back to my places');
  const stage = el('div', { class: 'place-create-stage' });
  wrap.append(back, el('p', { class: 'places-intro' }, 'Pick a landscape photo — a reef, lake, forest, meadow, or shoreline.'), drop, file, stage);
  file.addEventListener('change', async () => {
    const f = file.files && file.files[0]; if (!f) return;
    let b64; try { b64 = await toB64(f); } catch (_) { toast('Could not read that image'); return; }
    stage.innerHTML = ''; stage.append(spinner('Reading the scene…'));
    let info; try { info = await analyzePhoto(b64); } catch (_) { info = { palette: [], scene: 'open', water: false, horizon: 0.45 }; }
    showForm(wrap, info);
  });
}

async function showForm(wrap, info) {
  wrap.innerHTML = '';
  const col = await store.getCollection();
  wrap.append(el('button', { class: 'link-btn', onclick: () => renderGallery(wrap) }, '\u2039 Back to my places'));
  wrap.append(el('p', { class: 'places-intro' }, 'Describe your place and Wildlore builds it from scratch in the app\u2019s illustrated style, coloured by your photo. Add details or tap a tag.'));
  const preview = el('div', { class: 'place-preview' });
  const desc = el('input', { class: 'search', type: 'search', placeholder: 'e.g. snowy mountains with clouds and a lake' });
  const name = el('input', { class: 'search', type: 'search', placeholder: 'Name this place' });
  const tags = el('div', { class: 'biome-pick' });
  ['Mountains', 'Clouds', 'Lake', 'River', 'Forest', 'Meadow', 'Desert', 'Beach', 'Snow', 'Coral reef', 'Wetland', 'Sunset', 'Night'].forEach((t) => tags.append(el('button', { class: 'biome-chip', onclick: () => { const w = t.toLowerCase(); if (!desc.value.toLowerCase().includes(w)) desc.value = (desc.value ? desc.value + ', ' : '') + w; draw(); } }, t)));
  const placeObj = () => ({ palette: info.palette, horizon: info.horizon, sceneType: info.scene, water: info.water, description: desc.value });
  function draw() { preview.innerHTML = ''; preview.append(buildScene(placeObj(), col, { preview: true })); }
  desc.addEventListener('input', draw);
  const save = el('button', { class: 'btn accent', onclick: async () => { await store.addPlace({ name: name.value.trim() || 'My place', palette: info.palette || [], horizon: info.horizon, sceneType: info.scene, water: info.water, description: desc.value.trim(), members: null, positions: {} }); toast('Habitat created'); renderGallery(wrap); } }, 'Create this habitat');
  wrap.append(el('div', { class: 'land-section-h' }, 'Describe this place'), desc, tags, preview, name, save);
  draw();
}

async function openScene(wrap, place) {
  let arranging = false;
  async function rebuild() {
    wrap.innerHTML = '';
    const arrangeBtn = el('button', { class: 'link-btn', onclick: () => { arranging = !arranging; rebuild(); } }, arranging ? 'Done' : 'Arrange');
    wrap.append(el('div', { class: 'place-scene-bar' },
      el('button', { class: 'link-btn', onclick: () => renderGallery(wrap) }, '‹ My places'),
      el('div', { class: 'place-scene-title' }, place.name || 'My place'),
      arrangeBtn));
    const col = await store.getCollection();
    const scene = buildScene(place, col, { arranging, onChange: () => store.updatePlace(place.id, { positions: place.positions, members: place.members }) });
    wrap.append(scene);
    if (arranging) {
      wrap.append(el('p', { class: 'places-hint' }, 'Drag animals to move them. Add or remove any creature below.'));
      wrap.append(creaturePicker(place, col, () => { store.updatePlace(place.id, { members: place.members, positions: place.positions }); rebuild(); }));
      wrap.append(el('button', { class: 'link-btn danger', style: 'margin-top:10px', onclick: async () => { if (confirm('Remove this habitat? Your animals stay in your collection.')) { const c = (await store.getLandscape()).filter((id) => id !== place.id); await store.setLandscape(c); await store.removePlace(place.id); renderGallery(wrap); } } }, 'Delete habitat'));
    }
    if (!col.length) scene.append(el('div', { class: 'habitat-empty' }, el('p', {}, 'Discover animals and they will appear here.'), el('button', { class: 'btn', style: 'width:auto;margin:0', onclick: () => go('#/capture') }, 'Go discover')));
  }
  await rebuild();
}

function creaturePicker(place, col, onToggle) {
  const wrap = el('div', { class: 'creature-picker' });
  const auto = creaturesForPlace({ ...place, members: null }, col).map((s) => s.taxonKey);
  const isIn = (key) => place.members ? place.members.includes(key) : auto.includes(key);
  col.forEach((sp) => {
    const inHab = isIn(sp.taxonKey);
    const chip = el('button', { class: 'pick-chip' + (inHab ? ' on' : '') }, el('span', { class: 'pick-sil', html: silSVG(catOf(sp), 'specimen') }), el('span', {}, sp.commonName || ''));
    chip.onclick = () => { let m = place.members ? [...place.members] : [...auto]; if (m.includes(sp.taxonKey)) m = m.filter((k) => k !== sp.taxonKey); else m.push(sp.taxonKey); place.members = m; onToggle(); };
    wrap.append(chip);
  });
  return wrap;
}

function buildScene(place, col, opts) {
  const scene = el('div', { class: 'place-scene' + (opts.preview ? ' preview' : '') + (opts.arranging ? ' editing' : '') });
  const art = el('div', { class: 'scene-art' }); art.innerHTML = composeScene(specOf(place)); scene.append(art);
  const list = creaturesForPlace(place, col).slice(0, opts.preview ? 12 : 36);
  list.forEach((sp) => addCreature(scene, sp, place, opts));
  return scene;
}

function addCreature(container, sp, place, opts) {
  const cat = catOf(sp); const beh = behaviourOf(cat); const key = sp.taxonKey;
  const outer = el('button', { class: 'habitat-creature ' + (ROAM[beh] || 'roam-walk'), dataset: { key }, title: sp.commonName || '', 'aria-label': sp.commonName || 'animal' });
  const face = el('div', { class: 'creature-face ' + (FACEFLIP[beh] || '') }); face.innerHTML = silSVG(cat, 'specimen'); outer.append(face);
  const [b0, b1] = BAND[beh] || [60, 85];
  const saved = place.positions && place.positions[key];
  const left = saved ? saved.x : 4 + Math.random() * 90;
  const top = saved ? saved.y : b0 + Math.random() * (b1 - b0);
  const size = BASE * (SIZE[cat] || 0.8);
  const dur = 10 + Math.random() * 12; const delay = -Math.random() * dur;
  outer.style.cssText = `--sz:${size.toFixed(0)}px;width:var(--sz);height:var(--sz);left:${left.toFixed(1)}%;top:${Math.min(92, top).toFixed(1)}%;--dur:${dur.toFixed(1)}s;--delay:${delay.toFixed(1)}s;z-index:${Math.round(top)};`;
  if (opts.preview) { container.append(outer); return; }
  outer.addEventListener('click', () => { if (!opts.arranging) go('#/species/' + key); });
  if (opts.arranging) {
    let active = false;
    outer.addEventListener('pointerdown', (e) => { e.preventDefault(); active = true; try { outer.setPointerCapture(e.pointerId); } catch (_) {} outer.classList.add('dragging'); });
    outer.addEventListener('pointermove', (e) => { if (!active) return; const r = container.getBoundingClientRect(); let x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100; x = Math.max(2, Math.min(96, x)); y = Math.max(5, Math.min(92, y)); outer.style.left = x.toFixed(1) + '%'; outer.style.top = y.toFixed(1) + '%'; outer._pos = { x, y }; });
    const end = (e) => { if (!active) return; active = false; try { outer.releasePointerCapture(e.pointerId); } catch (_) {} outer.classList.remove('dragging'); if (outer._pos) { place.positions = place.positions || {}; place.positions[key] = outer._pos; opts.onChange && opts.onChange(); } };
    outer.addEventListener('pointerup', end); outer.addEventListener('pointercancel', end);
  }
  container.append(outer);
}

/* ---- Connected landscape (vector-scene panels) ---- */
async function openLandscape(wrap) {
  wrap.innerHTML = '';
  wrap.append(el('div', { class: 'place-scene-bar' }, el('button', { class: 'link-btn', onclick: () => renderGallery(wrap) }, '‹ My places'), el('div', { class: 'place-scene-title' }, 'Your landscape'), el('button', { class: 'link-btn', onclick: () => arrangeLandscape(wrap) }, 'Edit')));
  const all = await store.getPlaces(); const byId = Object.fromEntries(all.map((p) => [p.id, p]));
  const chain = (await store.getLandscape()).map((id) => byId[id]).filter(Boolean);
  if (chain.length < 2) { wrap.append(el('p', { class: 'places-intro' }, 'Add at least two places to build a connected landscape.'), el('button', { class: 'btn', onclick: () => arrangeLandscape(wrap) }, 'Build landscape')); return; }
  wrap.append(el('p', { class: 'places-hint' }, 'Scroll sideways to travel between your places.'));
  const col = await store.getCollection();
  const scroll = el('div', { class: 'landscape' }); const worldRow = el('div', { class: 'land-world' }); scroll.append(worldRow);
  chain.forEach((p, idx) => {
    const panel = el('div', { class: 'land-panel' + (idx > 0 ? ' seam' : '') });
    const art = el('div', { class: 'scene-art' }); art.innerHTML = composeScene(specOf(p)); panel.append(art);
    panel.append(el('div', { class: 'land-label' }, p.name || 'Place'));
    creaturesForPlace(p, col).slice(0, 16).forEach((sp) => addCreature(panel, sp, p, {}));
    worldRow.append(panel);
  });
  wrap.append(scroll);
}

async function arrangeLandscape(wrap) {
  wrap.innerHTML = '';
  const all = await store.getPlaces();
  let chain = (await store.getLandscape()).filter((id) => all.find((p) => p.id === id));
  const byId = Object.fromEntries(all.map((p) => [p.id, p]));
  wrap.append(el('button', { class: 'link-btn', onclick: () => renderGallery(wrap) }, '‹ Back to my places'));
  wrap.append(el('p', { class: 'places-intro' }, 'Add places to your landscape and order them. Scrolling travels from one into the next, blended at the seams.'));
  const chainStrip = el('div', { class: 'chain-strip' }); const pool = el('div', { class: 'places-grid' });
  function redraw() {
    chainStrip.innerHTML = '';
    if (!chain.length) chainStrip.append(el('div', { class: 'mb-note' }, 'No places in the landscape yet.'));
    chain.forEach((id, i) => { const p = byId[id]; chainStrip.append(el('div', { class: 'chain-item' }, sceneThumb(p), el('div', { class: 'chain-name' }, `${i + 1}. ${p.name || 'Place'}`), el('div', { class: 'chain-ctrls' }, el('button', { class: 'link-btn', 'aria-label': 'Move up', onclick: () => { if (i > 0) { [chain[i - 1], chain[i]] = [chain[i], chain[i - 1]]; redraw(); } } }, '↑'), el('button', { class: 'link-btn', 'aria-label': 'Move down', onclick: () => { if (i < chain.length - 1) { [chain[i + 1], chain[i]] = [chain[i], chain[i + 1]]; redraw(); } } }, '↓'), el('button', { class: 'link-btn danger', 'aria-label': 'Remove', onclick: () => { chain = chain.filter((x) => x !== id); redraw(); } }, '✕')))); });
    pool.innerHTML = '';
    all.forEach((p) => { const inChain = chain.includes(p.id); const card = el('button', { class: 'place-card' + (inChain ? ' added' : ''), onclick: () => { if (!inChain) { chain.push(p.id); redraw(); } } }); card.append(sceneThumb(p)); card.append(el('div', { class: 'place-cap' }, el('div', { class: 'place-name' }, p.name || 'Place'), el('div', { class: 'place-sub' }, inChain ? 'Added' : 'Tap to add'))); pool.append(card); });
  }
  redraw();
  wrap.append(el('div', { class: 'land-section-h' }, 'Your landscape (in order)'), chainStrip, el('button', { class: 'btn accent', onclick: async () => { await store.setLandscape(chain); toast('Landscape saved'); chain.length >= 2 ? openLandscape(wrap) : renderGallery(wrap); } }, 'Save & view'), el('div', { class: 'land-section-h' }, 'Tap to add'), pool);
}
