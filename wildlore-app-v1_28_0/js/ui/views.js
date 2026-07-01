import { el, go, goBack, speciesCard, shadowCard, spinner, emptyState, toast, fmt } from './components.js';
import { silSVG, groupCategory } from './illustrations.js';
import * as store from '../core/store.js';
import { CONFIG } from '../config.js';
import * as session from '../core/auth.js';
import * as catalog from '../data/catalog.js';
import { REGIONS, regionSpecies, regionProgress, nearestRegions } from '../data/regions.js';
import { SETS, THEMED, NICHE, setProgress, setMembers, buildNearby, getNearby, setById, getLastCoords, rememberCoords } from '../data/collections.js';
const sectionH = (title, link, onClick) => el('div', { class: 'section-h' }, el('h3', {}, title), link ? el('a', { onclick: onClick }, link) : null);
const backHeader = (title) => el('div', { class: 'back-head' }, el('button', { class: 'back-btn', 'aria-label': 'Back', onclick: () => goBack() }, '‹'), el('h1', { class: 'h-title' }, title));
const emblem = (cat) => { const s = document.createElement('span'); s.className = 'cat-emblem'; s.innerHTML = silSVG(cat, 'emblem'); return s.firstElementChild; };
const memberCard = (agg) => speciesCard({ taxonKey: agg.taxonKey, commonName: agg.commonName, scientificName: agg.scientificName, class: agg.cls, order: agg.order, realm: agg.realm, rarityTier: agg.rarityTier });
export async function home() {
  const p = store.getProfile(); const user = session.current(); const count = await store.collectionCount();
  const root = el('div', { class: 'pad' });
  root.append(el('div', { class: 'masthead' }, el('div', { class: 'mast-kicker' }, 'Field Journal'), el('div', { class: 'mast-title' }, 'Wildlore'), el('div', { class: 'mast-meta' }, el('span', { class: 'who' }, user ? `${user.displayName}, ${p.rank}` : p.rank), el('span', { class: 'num' }, `${count} specimens recorded`))));
  root.append(sectionH('Start here', 'Open', () => go('#/set/backyard')));
  root.append(el('div', { class: 'journal', role: 'button', tabindex: '0', onclick: () => go('#/set/backyard') }, el('div', { class: 'j-k' }, 'Starter collection'), el('div', { class: 'j-t' }, SETS.backyard.name), el('div', { class: 'j-s' }, SETS.backyard.blurb), el('div', { class: 'progress' }, el('div', { class: 'p-row' }, el('span', {}, 'Common species near home'), el('b', { id: 'starter-pct' }, '...')), el('div', { class: 'bar' }, el('i', { id: 'starter-bar', style: 'width:0%' })))));
  const starterRail = el('div', { class: 'rail' }, spinner('Gathering the starter set…')); root.append(starterRail); loadStarter(starterRail, root);
  const near = el('button', { class: 'btn ghost', style: 'margin-top:14px' }, 'Build a collection near me'); near.addEventListener('click', () => findNearbySet(near)); root.append(near);
  const rp = store.getRegionProgress(); const best = Object.entries(rp).sort((a, b) => (b[1].pct || 0) - (a[1].pct || 0))[0]; const fid = (best && REGIONS[best[0]]) ? best[0] : 'yosemite'; const fr = REGIONS[fid]; const frp = best ? best[1] : null;
  root.append(sectionH('Continue your survey', 'Regions', () => go('#/explore')));
  root.append(el('div', { class: 'journal', role: 'button', tabindex: '0', onclick: () => go('#/region/' + fid) }, el('div', { class: 'j-k' }, fr.realm === 'marine' ? 'Marine region' : 'Region'), el('div', { class: 'j-t' }, fr.name), el('div', { class: 'j-s' }, fr.sub), el('div', { class: 'progress' }, el('div', { class: 'p-row' }, el('span', {}, frp ? `${frp.found} of ${frp.total} species` : 'Open to begin recording'), el('b', {}, frp ? `${frp.pct}%` : '-')), el('div', { class: 'bar' }, el('i', { style: `width:${frp ? frp.pct : 0}%` })))));
  root.append(sectionH('Latest entries', 'Collection', () => go('#/collection')));
  const latest = el('div', { class: 'rail' }, spinner('Reading the journal…')); root.append(latest);
  store.getDiscoveries().then((ds) => { latest.innerHTML = ''; if (!ds.length) { latest.replaceWith(el('p', { class: 'lede' }, 'Your journal is empty. Identify your first specimen to begin the collection.')); return; } ds.slice(0, 8).forEach((d) => latest.append(speciesCard({ taxonKey: d.taxonKey, commonName: d.commonName, scientificName: d.scientificName, class: d.cls, realm: d.realm, rarityTier: d.rarityTier }))); });
  root.append(sectionH('Living collection', 'Enter', () => go('#/habitats')));
  root.append(el('div', { class: 'journal', role: 'button', tabindex: '0', style: 'margin-bottom:12px', onclick: () => go('#/habitats') }, el('div', { class: 'j-k' }, 'Habitats' ), el('div', { class: 'j-t' }, 'Visit your habitats'), el('div', { class: 'j-s' }, 'See the species you have found drifting in their biomes. Tap any to open its entry.')));
  root.append(sectionH('Showcase', 'View', () => go('#/rare')));
  root.append(el('div', { class: 'journal', role: 'button', tabindex: '0', role: 'button', tabindex: '0', onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (() => go('#/rare'))(); } }, onclick: () => go('#/rare') }, el('div', { class: 'j-k' }, 'Rare finds'), el('div', { class: 'j-t' }, 'Your rarest discoveries'), el('div', { class: 'j-s' }, 'The standout species you have recorded, gathered to show off.')));
  root.append(el('button', { class: 'btn', style: 'margin-top:26px', onclick: () => go('#/capture') }, 'Identify a specimen'));
  root.append(el('div', { style: 'height:8px' }));
  return root;
}
async function loadStarter(rail, root) {
  try { const col = await store.getCollection(); const found = new Set(col.map((c) => c.taxonKey)); const aggById = Object.fromEntries(col.map((c) => [c.taxonKey, c])); const prog = await setProgress(SETS.backyard, found);
    const pct = root.querySelector('#starter-pct'), bar = root.querySelector('#starter-bar'); if (pct) pct.textContent = `${prog.found} of ${prog.total}`; if (bar) bar.style.width = prog.pct + '%';
    rail.innerHTML = ''; if (!prog.members.length) { rail.append(el('p', { class: 'lede' }, 'Could not load the starter set. Check your connection.')); return; }
    prog.members.forEach((m) => { const agg = aggById[m.taxonKey]; rail.append(agg ? memberCard(agg) : speciesCard(m, { locked: true })); });
  } catch (e) { rail.innerHTML = ''; rail.append(el('p', { class: 'lede' }, 'Could not load the starter set.')); }
}
function findNearbySet(btn) {
  if (!navigator.geolocation) { toast('Location is not available on this device'); return; }
  const label = btn.textContent; btn.disabled = true; btn.textContent = 'Finding species near you';
  navigator.geolocation.getCurrentPosition(async (pos) => { try { await buildNearby(pos.coords.latitude, pos.coords.longitude); go('#/set/nearby'); } catch (e) { toast('Could not load nearby species'); btn.disabled = false; btn.textContent = label; } }, () => { toast('Location permission denied'); btn.disabled = false; btn.textContent = label; }, { timeout: 9000, maximumAge: 600000 });
}
export async function collection() {
  const root = el('div', { class: 'pad' }); const count = await store.collectionCount();
  root.append(el('div', { class: 'masthead' }, el('div', { class: 'mast-kicker' }, 'The Collection'), el('div', { class: 'mast-title' }, count ? `${count} specimens` : 'Begin collecting'), el('div', { class: 'mast-meta' }, el('span', {}, 'Every find, pressed into the journal'), el('span', {}, ''))));
  root.append(searchBar());
  const items = await store.getCollection();
  if (items.length) { root.append(sectionH('Recorded', null)); const grid = el('div', { class: 'grid' }); items.sort((a, b) => (b.firstFoundAt || 0) - (a.firstFoundAt || 0)); items.forEach((sp) => grid.append(memberCard(sp))); root.append(grid); }
  else root.append(el('p', { class: 'empty-inline' }, 'No specimens yet. The collections below are small enough to actually finish.'));
  root.append(sectionH('Your collections', null));
  const found = new Set(items.map((i) => i.taxonKey)); const near = await getNearby();
  if (near) root.append(setRow(near, found, 'Near you'));
  root.append(setRow(SETS.backyard, found));
  THEMED.forEach((id) => root.append(setRow(SETS[id], found, SETS[id].marine ? 'Themed · marine' : 'Themed collection')));
  root.append(el('div', { class: 'journal', role: 'button', tabindex: '0', style: 'margin-bottom:12px', onclick: () => go('#/explore') }, el('div', { class: 'j-k' }, 'Regions of the world'), el('div', { class: 'j-t' }, 'Explore by place'), el('div', { class: 'j-s' }, 'From your coast to the Amazon and beyond. Open Explore to find regional collections.')));
  if (NICHE.length) { const moreWrap = el('div', {}); const moreBtn = el('a', { class: 'more-link', onclick: () => { moreBtn.remove(); NICHE.forEach((id) => moreWrap.append(setRow(SETS[id], found, 'For the curious'))); } }, 'More collections'); root.append(moreBtn); root.append(moreWrap); }
  root.append(el('div', { class: 'data-note' }, el('p', {}, 'The full catalogue of life is searchable above. Species you have not encountered stay out of the way until you find them, so the collection always feels within reach.')));
  return root;
}
function searchBar() {
  const input = el('input', { class: 'search', type: 'search', placeholder: 'Search the catalogue (live, GBIF)' }); const results = el('div', { class: 'grid' }); let t;
  input.addEventListener('input', () => { clearTimeout(t); const q = input.value.trim(); if (q.length < 3) { results.innerHTML = ''; return; } t = setTimeout(async () => { results.innerHTML = ''; results.append(spinner('Searching GBIF…')); try { const { items } = await catalog.searchSpecies(q, { limit: 12 }); results.innerHTML = ''; if (!items.length) { results.append(emptyState('No matches', `Nothing catalogued for "${q}".`)); return; } items.forEach((it) => results.append(speciesCard(it))); } catch (e) { results.innerHTML = ''; results.append(emptyState('Search unavailable', 'Check your connection and try again.')); } }, 350); });
  return el('div', {}, input, results);
}
function setRow(set, foundSet, kicker) {
  const bar = el('i', { style: 'width:0%' }); const lab = el('b', {}, '...');
  setProgress(set, foundSet).then((p) => { lab.textContent = `${p.found} of ${p.total}`; bar.style.width = p.pct + '%'; }).catch(() => { lab.textContent = '-'; });
  return el('div', { class: 'journal', role: 'button', tabindex: '0', style: 'margin-bottom:12px', onclick: () => go('#/set/' + set.id) }, el('div', { class: 'j-k' }, kicker || (set.id === 'backyard' ? 'Starter collection' : 'Collection')), el('div', { class: 'j-t' }, set.name), el('div', { class: 'progress' }, el('div', { class: 'p-row' }, el('span', {}, 'Tap to view'), lab), el('div', { class: 'bar' }, bar)));
}
function renderSetMembers(grid, members, found, aggById) {
  grid.innerHTML = ''; if (!members.length) { grid.append(emptyState('Could not load', 'Check your connection and try again.')); return; }
  members.forEach((m) => { if (m.dynamic) { const ph = el('article', { class: 'spec skeleton' }, el('div', { class: 'plate' }), el('div', { class: 'spec-cap' })); grid.append(ph); catalog.getSpecies(m.taxonKey, { enrich: false }).then((rec) => { if (rec) ph.replaceWith(speciesCard(rec, { locked: !found.has(rec.taxonKey) })); else ph.remove(); }).catch(() => ph.remove()); } else { const agg = aggById[m.taxonKey]; grid.append(agg ? memberCard(agg) : speciesCard(m, { locked: true })); } });
}
export async function setView(id) {
  const root = el('div', { class: 'pad' }); const set = await setById(id);
  if (!set) { root.append(backHeader('Near You')); root.append(emptyState('No local collection yet', 'Open Home and tap "Build a collection near me" to create one from species recorded around you.', { label: 'Go home', onClick: () => go('#/home') })); return root; }
  root.append(backHeader(set.name)); root.append(el('p', { class: 'lede' }, set.blurb));
  const prog = el('div', { class: 'progress', style: 'margin-bottom:18px' }, el('div', { class: 'p-row' }, el('span', {}, 'Your completion'), el('b', { id: 'set-pct' }, '...')), el('div', { class: 'bar' }, el('i', { id: 'set-bar', style: 'width:0%' }))); root.append(prog);
  const grid = el('div', { class: 'grid' }, spinner('Composing the plates…')); root.append(grid);
  try { const col = await store.getCollection(); const found = new Set(col.map((c) => c.taxonKey)); const aggById = Object.fromEntries(col.map((c) => [c.taxonKey, c])); const members = await setMembers(set); const fnd = members.filter((m) => found.has(m.taxonKey)).length; const pct = members.length ? Math.round(fnd / members.length * 100) : 0; root.querySelector('#set-pct').textContent = pct + '%'; root.querySelector('#set-bar').style.width = pct + '%'; renderSetMembers(grid, members, found, aggById); }
  catch (e) { grid.innerHTML = ''; grid.append(emptyState('Could not load', e.message)); }
  return root;
}
export async function explore() {
  const root = el('div', { class: 'pad' });
  root.append(el('div', { class: 'masthead' }, el('div', { class: 'mast-kicker' }, 'Explore'), el('div', { class: 'mast-title' }, 'The living world'), el('div', { class: 'mast-meta' }, el('span', {}, 'Browse by lineage, or by region'), el('span', {}, ''))));
  root.append(sectionH('Orders of life', null));
  const cats = el('div', { class: 'cat-grid' });
  catalog.TAXON_GROUPS.forEach((g) => { const cat = groupCategory(g.id); cats.append(el('button', { class: 'cat-card' + (g.realm === 'marine' ? ' marine' : ''), onclick: () => go('#/taxon/' + g.id) }, emblem(cat), el('div', {}, el('div', { class: 'cat-label' }, g.label), el('div', { class: 'cat-realm' }, g.realm)))); });
  root.append(cats);
  const coords = await getLastCoords(); const all = Object.values(REGIONS); let featured, rest;
  if (coords) { featured = nearestRegions(coords.lat, coords.lng, 4); const fset = new Set(featured.map((r) => r.id)); rest = all.filter((r) => !fset.has(r.id)); } else { featured = all.filter((r) => r.featured); rest = all.filter((r) => !r.featured); }
  root.append(sectionH(coords ? 'Regions near you' : 'Regions', null));
  if (!coords) { const useLoc = el('button', { class: 'btn ghost', style: 'margin:0 0 14px' }, 'Use my location to show regions near you'); useLoc.addEventListener('click', () => { if (!navigator.geolocation) { toast('Location is not available'); return; } useLoc.disabled = true; useLoc.textContent = 'Locating'; navigator.geolocation.getCurrentPosition(async (pos) => { await rememberCoords(pos.coords.latitude, pos.coords.longitude); const m = await import('./shell.js'); m.render(); }, () => { toast('Location permission denied'); useLoc.disabled = false; useLoc.textContent = 'Use my location to show regions near you'; }, { timeout: 9000, maximumAge: 600000 }); }); root.append(useLoc); }
  const list = el('div', { class: 'reg-list' }); root.append(list);
  const moreWrap = el('div', { class: 'reg-list', style: 'margin-top:14px' }); const moreBtn = rest.length ? el('button', { class: 'btn ghost', style: 'margin-top:16px' }, `Browse all hotspots (${rest.length})`) : null; if (moreBtn) { root.append(moreBtn); root.append(moreWrap); }
  store.getCollection().then((col) => { const found = new Set(col.map((c) => c.taxonKey)); featured.forEach((r) => list.append(regionItem(r, found))); if (moreBtn) moreBtn.addEventListener('click', () => { moreBtn.remove(); moreWrap.before(sectionH('Biodiversity hotspots of the world', null)); rest.forEach((r) => moreWrap.append(regionItem(r, found))); }); });
  return root;
}
function regionEmblem(realm) { const s = document.createElement('span'); s.className = 'reg-emblem'; s.innerHTML = realm === 'marine' ? '<svg viewBox="0 0 48 48"><path d="M4 30c4 0 4-4 10-4s6 4 10 4 4-4 10-4 6 4 10 4M4 38c4 0 4-4 10-4s6 4 10 4 4-4 10-4 6 4 10 4"/></svg>' : '<svg viewBox="0 0 48 48"><path d="M4 40 20 14l10 16 6-9 8 19zM20 14l10 16-6 3-6-10z"/></svg>'; return s.firstElementChild; }
function regionItem(r, found) {
  const lab = el('b', {}, '...'); const bar = el('i', { style: 'width:0%' }); const ft = el('div', { class: 'reg-ft' }, 'Loading checklist');
  regionProgress(r, found).then((p) => { lab.textContent = p.pct + '%'; bar.style.width = p.pct + '%'; ft.textContent = `${p.found} of ${p.total} species`; }).catch(() => { lab.textContent = '-'; ft.textContent = 'Tap to open'; });
  return el('div', { class: 'reg-item', onclick: () => go('#/region/' + r.id) }, el('div', { class: 'reg-top' }, el('div', {}, el('div', { class: 'reg-n' }, r.name), el('div', { class: 'reg-d' }, r.sub)), regionEmblem(r.realm)), el('div', { class: 'reg-foot' }, el('div', { class: 'rf-row' }, ft, lab), el('div', { class: 'bar' }, bar)));
}
export async function taxonGroup(groupId) {
  const g = catalog.TAXON_GROUPS.find((x) => x.id === groupId); const root = el('div', { class: 'pad' }); root.append(backHeader(g ? g.label : 'Browse'));
  if (!g) { root.append(emptyState('Unknown group', '')); return root; }
  root.append(el('p', { class: 'lede', id: 'tg-info' }, g.realm === 'marine' ? 'Marine lineage' : 'Terrestrial lineage'));
  const grid = el('div', { class: 'grid' }, spinner('Drawing the plates from GBIF…')); root.append(grid);
  try { const node = await catalog.resolveGroupKey(g); const { items, total } = await catalog.listSpeciesInTaxon(node.gbifKey, { limit: 24 }); root.querySelector('#tg-info').textContent = `${fmt(total)} species in the backbone. A selection follows.`; grid.innerHTML = ''; if (!items.length) { grid.append(emptyState('Nothing here yet', 'Try another lineage.')); return root; } items.forEach((it) => grid.append(speciesCard(it))); }
  catch (e) { grid.innerHTML = ''; grid.append(emptyState('Could not load', e.message)); }
  return root;
}
export async function region(regionId) {
  const r = REGIONS[regionId]; const root = el('div', { class: 'pad' }); if (!r) { root.append(emptyState('Unknown region', '')); return root; }
  root.append(backHeader(r.name)); root.append(el('p', { class: 'lede' }, r.sub + (r.realm === 'marine' ? '. A marine region.' : '.')));
  const grid = el('div', { class: 'grid' }, spinner('Pulling the live checklist…')); root.append(sectionH('Recorded here', null), grid);
  try { const list = await regionSpecies(r, 30); const found = new Set((await store.getCollection()).map((c) => c.taxonKey)); grid.innerHTML = ''; if (!list.speciesKeys.length) { grid.append(emptyState('No records', 'No occurrences catalogued in this area yet.')); return root; }
    const fnd = list.speciesKeys.filter((s) => found.has(s.taxonKey)).length; const pct = Math.round(fnd / list.speciesKeys.length * 100); await store.setRegionProgress(r.id, fnd, list.speciesKeys.length);
    grid.before(el('div', { class: 'progress', style: 'margin-bottom:18px' }, el('div', { class: 'p-row' }, el('span', {}, 'Your completion'), el('b', {}, `${pct}%`)), el('div', { class: 'bar' }, el('i', { style: `width:${pct}%` }))));
    list.speciesKeys.slice(0, 30).forEach((s) => { const ph = el('article', { class: 'spec skeleton' }, el('div', { class: 'plate' }), el('div', { class: 'spec-cap' })); grid.append(ph); catalog.getSpecies(s.taxonKey, { enrich: false }).then((rec) => { if (rec) ph.replaceWith(speciesCard(rec, { locked: !found.has(rec.taxonKey) })); else ph.remove(); }).catch(() => ph.remove()); });
  } catch (e) { grid.innerHTML = ''; grid.append(emptyState('Could not load region', e.message)); }
  return root;
}
const ACH_ICON = { first_find: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>', ten: '<path d="M5 12l4 4 10-10"/>', fifty: '<path d="M5 12l4 4 10-10"/>', hundred: '<path d="M5 12l4 4 10-10"/>', birder: '<path d="M5 14c5-1 7-5 11-5s4 3 6 2c-1 4-5 7-10 7-4 0-6-2-7-4z"/>', mammalogist: '<circle cx="9" cy="9" r="2.4"/><circle cx="15" cy="9" r="2.4"/><path d="M6 17c0-3 2.5-5 6-5s6 2 6 5"/>', marine: '<path d="M4 14c4 0 4-4 8-4s4 4 8 4M4 18c4 0 4-4 8-4s4 4 8 4"/>', nudibranch: '<path d="M5 15c0-4 5-7 12-7 4 0 7 2 7 4 0 2-2 3-4 3M9 9v-3M13 9v-3"/>', rare_hunter: '<path d="M12 3l3 6 6 .5-4.5 4 1.5 6L12 16l-6 3.5 1.5-6L3 9.5 9 9z"/>', legendary: '<path d="M12 3l3 6 6 .5-4.5 4 1.5 6L12 16l-6 3.5 1.5-6L3 9.5 9 9z"/>', conservation: '<path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/>', streak10: '<path d="M12 3c1 4-2 5-2 8a2 2 0 004 0c0-1 0-2-1-3 3 1 4 4 4 6a5 5 0 11-10 0c0-4 4-6 5-11z"/>' };
export async function profile() {
  const p = store.getProfile(); const user = session.current(); const count = await store.collectionCount(); const ach = store.getAchievements(); const root = el('div', { class: 'pad' });
  root.append(el('div', { class: 'phead' }, el('div', { class: 'p-monogram' }, (user?.displayName || 'E')[0].toUpperCase()), el('div', { class: 'pname' }, user?.displayName || 'Explorer'), el('div', { class: 'prank' }, p.rank), el('div', { class: 'pmode' }, session.isCloud() ? (user?.mode === 'cloud' ? 'Synced to your account' : 'Cloud ready') : 'Stored on this device')));
  root.append(el('div', { class: 'p-ledger' }, led(count, 'Species'), led(fmt(p.discoveryScore), 'Score'), led('Lvl ' + p.level, 'Rank'), led(Object.values(ach).filter((a) => a.done).length, 'Seals')));
  root.append(sectionH('Field seals', null));
  const grid = el('div', { class: 'ach-grid' });
  import('../features/gamify.js').then(({ ACHIEVEMENTS }) => { ACHIEVEMENTS.forEach((a) => grid.append(el('div', { class: 'ach ' + (ach[a.id]?.done ? 'done' : 'locked') }, el('div', { class: 'ach-seal', html: `<svg viewBox="0 0 24 24" fill="none">${ACH_ICON[a.id] || ACH_ICON.first_find}</svg>` }), el('div', { class: 'ach-n' }, a.name)))); });
  root.append(grid);
  root.append(sectionH('Account', null));
  if (user) root.append(el('div', { class: 'menu-row' }, el('div', {}, el('div', { class: 'mt' }, user.email || 'Guest session'), el('div', { class: 'ms' }, session.isCloud() ? 'Cloud account' : 'On this device')), el('button', { class: 'btn ghost', style: 'width:auto;margin:0;padding:10px 16px', onclick: async () => { await session.signOut(); go('#/auth'); } }, 'Sign out')));
  else root.append(el('button', { class: 'btn', onclick: () => go('#/auth') }, 'Sign in'));
  root.append(el('div', { class: 'data-note' }, el('p', {}, `Species names, taxonomy, and conservation status are live from GBIF; marine data via OBIS (NOAA-affiliated). Illustrations are Wildlore originals. Your collection is stored ${session.isCloud() ? 'in your account' : 'on this device'} and works offline.`)));
  root.append(el('div', { class: 'version-tag' }, 'Wildlore v' + CONFIG.app.version));
  root.append(el('div', { style: 'height:8px' }));
  return root;
}
const led = (v, k) => el('div', { class: 'pl' }, el('div', { class: 'v' }, String(v)), el('div', { class: 'k' }, k));
export async function auth() {
  const root = el('div', { class: 'pad auth-screen' });
  root.append(el('div', { class: 'auth-mark' }), el('h1', { class: 'auth-title' }, 'Wildlore'), el('p', { class: 'auth-sub' }, 'A field guide to the living world. Your discoveries are pressed into a journal that follows you across devices, online or off.'));
  const email = el('input', { class: 'search', type: 'email', placeholder: 'you@email.com', autocomplete: 'email' });
  const signIn = el('button', { class: 'btn', onclick: async () => { const v = email.value.trim(); if (!v) { toast('Enter your email'); return; } signIn.disabled = true; signIn.textContent = 'Working'; try { const res = await session.signInWithEmail(v); toast(res.magicLink ? 'Check your email for a magic link' : 'Signed in'); if (!res.magicLink) go('#/home'); } catch (e) { toast(e.message || 'Sign-in failed'); } signIn.disabled = false; signIn.textContent = session.isCloud() ? 'Send magic link' : 'Continue'; } }, session.isCloud() ? 'Send magic link' : 'Continue');
  root.append(el('div', { class: 'auth-form' }, email, signIn, el('button', { class: 'btn ghost', onclick: async () => { await session.continueAsGuest(); go('#/home'); } }, 'Continue as guest'), el('p', { class: 'muted small center', style: 'margin-top:16px' }, session.isCloud() ? 'Cloud accounts enabled.' : 'Your account lives on this device until cloud keys are added.')));
  return root;
}

export async function rare() {
  const root = el('div', { class: 'pad' });
  root.append(backHeader('Rare Finds'));
  root.append(el('p', { class: 'lede' }, 'Your rarest discoveries — the finds worth showing off.'));
  const items = (await store.getCollection()).filter((c) => ['Rare', 'Legendary'].includes(c.rarityTier));
  if (!items.length) { root.append(emptyState('No rare finds yet', 'Rare and Legendary species you record will be showcased here. Most common species are easy; the rare ones are the trophies.', { label: 'Identify a specimen', onClick: () => go('#/capture') })); return root; }
  const grid = el('div', { class: 'grid' });
  items.sort((a, b) => (b.rarityTier === 'Legendary' ? 1 : 0) - (a.rarityTier === 'Legendary' ? 1 : 0) || (b.firstFoundAt || 0) - (a.firstFoundAt || 0));
  items.forEach((sp) => grid.append(memberCard(sp)));
  root.append(grid);
  root.append(el('div', { class: 'data-note' }, el('p', {}, 'A community showcase, where everyone can browse the rarest finds people upload, unlocks when cloud accounts are enabled.')));
  return root;
}
