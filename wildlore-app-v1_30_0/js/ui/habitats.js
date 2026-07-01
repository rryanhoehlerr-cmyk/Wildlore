/* Habitats — a continuous, pannable living world per biome, populated with the collection in the
   unified vector language (or a hand-illustrated version per species the user "places"). Animals
   move with ecology-true behaviour at believable relative sizes, and in Curate mode can be
   selected, resized, dragged to reposition, or hidden. Calm, performant, reduced-motion aware. */
import { el, go, spinner, toast } from './components.js';
import { silSVG, categoryOf } from './illustrations.js';
import * as store from '../core/store.js';
import * as places from './places.js';
import * as scenes from './scenes.js';
import * as artwork from '../features/artwork.js';

const BIOMES = [
  { id: 'forest', name: 'Forest', target: 14 },
  { id: 'meadow', name: 'Meadow', target: 10 },
  { id: 'wetland', name: 'Wetland', target: 10 },
  { id: 'reef', name: 'Coral Reef', target: 14 },
  { id: 'ocean', name: 'Open Ocean', target: 10 }
];
const OPEN_OCEAN = new Set(['shark', 'ray', 'whale', 'seal', 'jelly']);
const WETLAND_CAT = new Set(['duck', 'heron', 'frog', 'salamander', 'croc', 'turtle']);
const MEADOW_CAT = new Set(['butterfly', 'bee', 'dragonfly', 'flower', 'hummingbird']);
function biomeOf(sp, cat) {
  if (sp.realm === 'marine') return OPEN_OCEAN.has(cat) ? 'ocean' : 'reef';
  if (WETLAND_CAT.has(cat)) return 'wetland';
  if (MEADOW_CAT.has(cat)) return 'meadow';
  return 'forest';
}
const BEHAVIOUR = {
  swim: new Set(['fish', 'shark', 'ray', 'seahorse', 'octopus', 'seal', 'whale', 'turtle']),
  fly: new Set(['songbird', 'raptor', 'owl', 'duck', 'heron', 'bat']),
  flutter: new Set(['butterfly', 'bee', 'dragonfly', 'hummingbird']),
  pulse: new Set(['jelly']),
  crawl: new Set(['crab', 'nudibranch']),
  sway: new Set(['coral', 'seastar', 'urchin', 'shell', 'tree', 'fern', 'flower', 'mushroom'])
};
function behaviourOf(cat) { for (const b in BEHAVIOUR) if (BEHAVIOUR[b].has(cat)) return b; return 'walk'; }
const BAND = { fly: [8, 38], flutter: [22, 52], swim: [32, 76], pulse: [16, 66], walk: [68, 86], crawl: [82, 91], sway: [76, 92] };
const DUR = { swim: [12, 24], fly: [10, 18], flutter: [3.6, 7], pulse: [5, 10], walk: [16, 28], crawl: [13, 22], sway: [5, 11] };
const SIZE = {
  whale: 2.0, shark: 1.5, ray: 1.3, seal: 1.15, turtle: 1.0, octopus: 1.0, seahorse: 0.5, fish: 0.58, jelly: 0.85,
  crab: 0.6, nudibranch: 0.5, seastar: 0.62, urchin: 0.55, shell: 0.45, coral: 0.95,
  raptor: 1.15, owl: 1.0, heron: 1.2, duck: 0.9, songbird: 0.55, hummingbird: 0.42, bat: 0.6,
  bigcat: 1.45, bear: 1.6, deer: 1.3, fox: 0.95, rabbit: 0.62, rodent: 0.45,
  lizard: 0.55, snake: 0.85, croc: 1.5, frog: 0.5, salamander: 0.5,
  butterfly: 0.55, bee: 0.4, dragonfly: 0.55, beetle: 0.42, tree: 1.4, fern: 0.9, flower: 0.7, mushroom: 0.6
};
const BASE = 58;
const timeTint = () => { const h = new Date().getHours(); if (h < 6 || h >= 20) return 'night'; if (h < 9) return 'dawn'; if (h >= 17) return 'dusk'; return 'day'; };

function backdrop(biome, count) {
  const wrap = el('div', { class: 'habitat-bg' });
  const art = document.createElement('div'); art.className = 'scene-art'; art.innerHTML = scenes.backdrop(biome, count); wrap.append(art);
  const pc = (biome === 'reef' || biome === 'ocean') ? 'bubble' : 'pollen';
  for (let i = 0; i < 9; i++) { const sp = el('span', { class: 'particle ' + pc }); sp.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 45}%;--p:${(6 + Math.random() * 8).toFixed(1)}s;--pd:${(-Math.random() * 8).toFixed(1)}s;`; wrap.append(sp); }
  return wrap;
}

let editing = false, selectedKey = null;

export async function view() {
  editing = false; selectedKey = null;
  const root = el('div', { class: 'pad' });
  const placesBtn = el('button', { class: 'curate-pill', onclick: () => render('places') }, 'Photo habitats');
  const curate = el('button', { class: 'curate-pill', 'aria-label': 'Curate habitat', onclick: () => { editing = !editing; selectedKey = null; curate.classList.toggle('on', editing); curate.textContent = editing ? 'Done' : 'Curate'; render(current); } }, 'Curate');
  root.append(el('div', { class: 'masthead' }, el('div', { class: 'mast-kicker' }, 'Living collection'), el('div', { class: 'mast-title' }, 'Habitats'), el('div', { class: 'mast-meta' }, el('span', {}, 'Pan to explore'), el('div', { class: 'mast-actions' }, placesBtn, curate))));
  const seg = el('div', { class: 'seg seg-scroll' });
  BIOMES.forEach((b, i) => seg.append(el('div', { class: i === 0 ? 'on' : '', dataset: { b: b.id } }, b.name)));
  seg.append(el('div', { dataset: { b: 'places' }, class: 'places-chip' }, 'My Places'));
  root.append(seg);
  const scene = el('div', { class: 'habitat-scene forest ' + timeTint() }, spinner('Gathering your creatures…')); root.append(scene);
  const meter = el('div', { class: 'habitat-meter' }, el('div', { class: 'hm-row' }, el('span', { id: 'hm-label' }, ''), el('b', { id: 'hm-pct' }, '')), el('div', { class: 'bar' }, el('i', { id: 'hm-bar', style: 'width:0%' }))); root.append(meter);
  const manage = el('div', { class: 'manage-bar', id: 'manage' }); root.append(manage);

  const col = await store.getCollection();
  let hidden = new Set(await store.getHabitatHidden());
  let scales = await store.getAnimalScales();
  let posMap = await store.getAnimalPositions();
  let placed = await store.getPlacedArt();
  let artMap = await artwork.artMapFor(col);
  const byBiome = {}; BIOMES.forEach((b) => (byBiome[b.id] = []));
  col.forEach((sp) => { const cat = categoryOf({ class: sp.cls, order: sp.order, realm: sp.realm }); byBiome[biomeOf(sp, cat)].push({ sp, cat }); });
  let current = 'forest';

  const sizeFor = (it) => BASE * (SIZE[it.cat] || 0.8) * (scales[it.sp.taxonKey] || 1);
  async function hide(key) { hidden.add(key); selectedKey = null; await store.hideFromHabitat(key); render(current); toast('Hidden · still in your collection'); }
  async function restoreAll() { for (const k of [...hidden]) await store.showInHabitat(k); hidden = new Set(); render(current); toast('All animals restored'); }
  const persistPos = (key, pos) => store.setAnimalPos(key, pos);

  function selectControl(it) {
    manage.innerHTML = '';
    const s = scales[it.sp.taxonKey] || 1;
    const slider = el('input', { type: 'range', min: '0.45', max: '2.6', step: '0.05', value: String(s), 'aria-label': 'Resize animal' });
    slider.addEventListener('input', () => { const v = parseFloat(slider.value); const node = scene.querySelector(`[data-key="${it.sp.taxonKey}"]`); if (node) node.style.setProperty('--sz', (BASE * (SIZE[it.cat] || 0.8) * v).toFixed(0) + 'px'); });
    slider.addEventListener('change', async () => { const v = parseFloat(slider.value); scales[it.sp.taxonKey] = v; await store.setAnimalScale(it.sp.taxonKey, v); });
    manage.append(el('div', { class: 'animal-ctl' },
      el('div', { class: 'ac-name' }, it.sp.commonName || ''),
      el('div', { class: 'ac-hint' }, 'Drag the animal to move it · slider to resize'),
      el('div', { class: 'ac-row' }, el('span', {}, 'Size'), slider),
      el('div', { class: 'ac-actions' },
        el('button', { class: 'link-btn', onclick: () => go('#/species/' + it.sp.taxonKey) }, 'Open'),
        el('button', { class: 'link-btn', onclick: () => hide(it.sp.taxonKey) }, 'Hide'),
        el('button', { class: 'link-btn', onclick: () => { selectedKey = null; scene.querySelectorAll('.selected').forEach((n) => n.classList.remove('selected')); baseManage(); } }, 'Done'))));
  }
  function baseManage() {
    manage.innerHTML = '';
    if (hidden.size) manage.append(el('span', { class: 'mb-note' }, `${hidden.size} hidden`), el('button', { class: 'link-btn', onclick: restoreAll }, 'Restore all'));
    if (editing) manage.append(el('span', { class: 'mb-note' }, 'Tap an animal to move, resize, or hide it'));
  }

  function render(bid) {
    current = bid;
    seg.querySelectorAll('div').forEach((d) => d.classList.toggle('on', d.dataset.b === bid));
    if (bid === 'places') { meter.style.display = 'none'; manage.style.display = 'none'; curate.style.display = 'none'; scene.className = 'habitat-places'; scene.innerHTML = ''; places.mount(scene); return; }
    meter.style.display = ''; manage.style.display = ''; curate.style.display = '';
    const biome = BIOMES.find((b) => b.id === bid);
    scene.className = 'habitat-scene ' + bid + ' ' + timeTint() + (editing ? ' editing' : ''); scene.innerHTML = '';
    const all = byBiome[bid]; const shown = all.filter((it) => !hidden.has(it.sp.taxonKey));
    const span = Math.min(2.6, Math.max(1, 1 + shown.length * 0.06));
    const world = el('div', { class: 'habitat-world', style: `width:${(span * 100).toFixed(0)}%` }); scene.append(world);
    world.append(backdrop(bid, shown.length));
    const pct = Math.min(100, Math.round(shown.length / biome.target * 100));
    root.querySelector('#hm-label').textContent = `Habitat richness · ${shown.length} species`;
    root.querySelector('#hm-pct').textContent = pct + '%';
    root.querySelector('#hm-bar').style.width = pct + '%';
    if (!selectedKey) baseManage();
    if (!all.length) { world.append(el('div', { class: 'habitat-empty' }, el('p', {}, 'This habitat is waiting for life.'), el('button', { class: 'btn', style: 'width:auto;margin:0', onclick: () => go('#/capture') }, 'Go discover'))); return; }
    if (!shown.length) { world.append(el('div', { class: 'habitat-empty' }, el('p', {}, 'Every animal here is hidden.'), el('button', { class: 'btn', style: 'width:auto;margin:0', onclick: restoreAll }, 'Restore them'))); return; }
    placeCreatures(world, shown, { sizeFor, posMap, placed, artMap, persistPos,
      get editing() { return editing; },
      onSelect: (node, it) => { scene.querySelectorAll('.selected').forEach((n) => n.classList.remove('selected')); node.classList.add('selected'); selectedKey = it.sp.taxonKey; selectControl(it); } });
  }
  seg.querySelectorAll('div').forEach((d) => d.addEventListener('click', () => render(d.dataset.b)));
  render('forest');
  return root;
}

function attachDrag(outer, it, world, ctx) {
  let active = false;
  outer.addEventListener('pointerdown', (e) => { if (!ctx.editing) return; e.preventDefault(); active = true; try { outer.setPointerCapture(e.pointerId); } catch (_) {} outer.classList.add('dragging'); });
  outer.addEventListener('pointermove', (e) => { if (!active) return; const r = world.getBoundingClientRect(); let x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100; x = Math.max(2, Math.min(96, x)); y = Math.max(5, Math.min(92, y)); outer.style.left = x.toFixed(1) + '%'; outer.style.top = y.toFixed(1) + '%'; outer._pos = { x, y }; });
  const end = (e) => { if (!active) return; active = false; try { outer.releasePointerCapture(e.pointerId); } catch (_) {} outer.classList.remove('dragging'); if (outer._pos) { ctx.posMap[it.sp.taxonKey] = outer._pos; ctx.persistPos(it.sp.taxonKey, outer._pos); } };
  outer.addEventListener('pointerup', end); outer.addEventListener('pointercancel', end);
}

function placeCreatures(world, list, ctx) {
  const cluster = { x: 24 + Math.random() * 50, y: 44 + Math.random() * 20 };
  list.slice(0, 40).forEach((it) => {
    const key = it.sp.taxonKey;
    const beh = behaviourOf(it.cat);
    const useArt = ctx.placed[key] && ctx.artMap[key];
    const outer = el('button', { class: 'habitat-creature roam-' + beh + (useArt ? ' has-art' : ''), dataset: { key }, title: it.sp.commonName || '', 'aria-label': it.sp.commonName || 'animal' });
    const face = el('div', { class: 'creature-face face-' + beh }); face.innerHTML = useArt ? `<img class="creature-art" src="${ctx.artMap[key]}" alt="">` : silSVG(it.cat, 'specimen'); outer.append(face);
    const [b0, b1] = BAND[beh] || [60, 85];
    const size = ctx.sizeFor(it) * (useArt ? 1.4 : 1);
    let left, top; const saved = ctx.posMap[key];
    if (saved) { left = saved.x; top = saved.y; }
    else if (beh === 'swim' && it.cat === 'fish') { left = cluster.x + (Math.random() * 22 - 11); top = cluster.y + (Math.random() * 16 - 8); }
    else { left = 3 + Math.random() * 92; top = b0 + Math.random() * (b1 - b0); }
    const [d0, d1] = DUR[beh] || [10, 18]; const dur = d0 + Math.random() * (d1 - d0); const delay = -Math.random() * dur;
    const behind = (beh === 'swim' || beh === 'crawl' || beh === 'walk') && Math.random() < 0.3;
    const z = behind ? 4 : 10 + Math.round(top / 8);
    outer.style.cssText = `--sz:${size.toFixed(0)}px;width:var(--sz);height:var(--sz);left:${Math.max(2, Math.min(96, left)).toFixed(1)}%;top:${Math.max(5, Math.min(92, top)).toFixed(1)}%;--dur:${dur.toFixed(1)}s;--delay:${delay.toFixed(1)}s;z-index:${z};`;
    outer.addEventListener('click', () => { if (!ctx.editing) go('#/species/' + key); else ctx.onSelect(outer, it); });
    attachDrag(outer, it, world, ctx);
    world.append(outer);
  });
}
