import { el, go, goBack, spinner, toast, fmt, RARITY_COLOR, titleCase } from './components.js';
import { plate, categoryOf, categoryLabel } from './illustrations.js';
import * as catalog from '../data/catalog.js';
import * as store from '../core/store.js';
import { CONFIG } from '../config.js';
import * as artwork from '../features/artwork.js';
import * as sounds from '../features/sounds.js';
const IUCN = { LC: ['Least Concern', '#2f8c86', 1], NT: ['Near Threatened', '#7a8a3a', 2], VU: ['Vulnerable', '#b58a2f', 3], EN: ['Endangered', '#b56a2f', 4], CR: ['Critically Endangered', '#a23a2f', 5], DD: ['Data Deficient', '#7a8a96', 0] };
export async function view(taxonKey) {
  const root = el('div', {}); root.append(spinner('Turning to the entry…'));
  let rec; try { rec = await catalog.getSpecies(Number(taxonKey)); } catch (e) { return errState(root, 'Could not load', e.message + '. Check your connection and try again.', taxonKey); }
  if (!rec) return errState(root, 'Not found', 'No entry for this specimen.', taxonKey);
  root.innerHTML = '';
  const cat = categoryOf(rec); const c = RARITY_COLOR[rec.rarityTier] || RARITY_COLOR.Common; const found = await store.isFound(rec.taxonKey);
  const [statusName, statusCol, statusLvl] = IUCN[(rec.iucnCategory || 'DD').toUpperCase()] || IUCN.DD;
  const hero = el('div', { class: 'entry-hero' }, el('button', { class: 'sp-back', 'aria-label': 'Back', onclick: () => goBack() }, '‹'));
  const pl = plate(cat, { locked: !found, plateNo: (rec.taxonKey % 1000) }); pl.classList.add('entry-plate'); hero.append(pl);
  hero.append(el('div', { class: 'sp-plateno' }, found ? 'Recorded specimen' : 'Unidentified silhouette'));
  hero.append(el('div', { class: 'sp-cn' }, titleCase(rec.commonName || rec.canonicalName)));
  if (rec.scientificName) hero.append(el('button', { class: 'sp-sn-toggle', onclick: (e) => { const t = e.currentTarget; const open = t.classList.toggle('open'); t.textContent = open ? rec.scientificName : 'Show scientific name'; } }, 'Show scientific name'));
  hero.append(el('div', { class: 'sp-rarline' }, el('i', { style: `background:${c}` }), `${rec.rarityTier} · ${categoryLabel(cat)}`));
  root.append(hero);
  const body = el('div', { class: 'sp-body' }); root.append(body); body.append(el('div', { class: 'sp-rule' }));
  if (rec.sensitive) body.append(el('div', { class: 'sensitive', style: 'margin-bottom:22px' }, el('span', {}, 'Protected species. Precise localities are withheld in Wildlore to keep it safe. Observe from a distance.')));
  if (rec.description) body.append(el('p', { class: 'sp-lead' }, rec.description));
  if (found) await placeHabitatControl(rec, hero, body);
  const dl = el('div', {});
  if (rec.habitat) dl.append(def('Habitat', rec.habitat));
  dl.append(def('Realm', rec.realm || 'Unknown'));
  if (rec.marine?.depthRange) dl.append(def('Depth', `${rec.marine.depthRange.min} to ${rec.marine.depthRange.max} m`));
  dl.append(def('Difficulty', rec.discoveryDifficulty)); dl.append(def('GBIF records', fmt(rec.occurrenceCount)));
  body.append(el('div', { class: 'sp-sec' }, el('h4', {}, 'At a glance'), dl));
  const bars = el('div', { class: 'cbar' }); [1, 2, 3, 4, 5].forEach((i) => bars.append(el('i', { style: `background:${i <= statusLvl ? statusCol : 'var(--rule)'}` })));
  body.append(el('div', { class: 'sp-sec' }, el('h4', {}, 'Conservation status'), el('div', { class: 'cons' }, bars, el('div', { class: 'clabel', style: `color:${statusCol}` }, statusName))));
  const ladder = el('div', { class: 'tax-ladder' });
  [['Kingdom', rec.kingdom], ['Phylum', rec.phylum], ['Class', rec.class], ['Order', rec.order], ['Family', rec.family], ['Genus', rec.genus], ['Species', rec.canonicalName]].filter((r) => r[1]).forEach(([k, v]) => ladder.append(el('div', { class: 'tax-row' }, el('span', { class: 'tax-rank' }, k), el('span', { class: 'tax-name' }, v))));
  body.append(el('div', { class: 'sp-sec' }, el('h4', {}, 'Classification'), ladder));
  const soundSec = el('div', { class: 'sp-sec' }, el('h4', {}, 'Calls & sounds'));
  const soundBody = el('div', { class: 'sound-body' });
  const playBtn = el('button', { class: 'btn ghost', onclick: async () => { playBtn.disabled = true; playBtn.textContent = 'Finding a recording\u2026'; let snd = null; try { snd = await sounds.findSound(rec); } catch (_) {} playBtn.style.display = 'none'; if (!snd) { soundBody.append(el('p', { class: 'muted small' }, 'No verified recording for this species yet.')); return; } soundBody.append(el('audio', { controls: '', autoplay: '', preload: 'none', src: snd.url }), el('div', { class: 'sound-cred' }, snd.attribution)); } }, 'Play a recording');
  soundSec.append(playBtn, soundBody);
  body.append(soundSec);
  if (found) {
    const ds = (await store.getDiscoveries()).filter((d) => d.taxonKey === rec.taxonKey); const first = ds[ds.length - 1]; const agg = (await store.getCollection()).find((x) => x.taxonKey === rec.taxonKey);
    body.append(el('div', { class: 'sp-sec' }, el('div', { class: 'entry-record' }, el('div', { class: 'er-h' }, 'Your record'), def('First recorded', first ? new Date(first.capturedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '-'), def('Times seen', agg?.timesSeen || ds.length), def('Method', first?.encounterType || 'wild'))));
    const yourPhoto = ds.find((d) => d.photoUrl)?.photoUrl;
    if (yourPhoto) body.append(el('div', { class: 'sp-sec' }, el('h4', {}, 'Your photograph'), el('div', { class: 'ref-photo' }, el('img', { src: yourPhoto, loading: 'lazy', decoding: 'async', alt: '' }), el('div', { class: 'ref-cap' }, 'Recorded by you'))));
  } else {
    body.append(el('button', { class: 'btn accent', onclick: () => go('#/capture?taxon=' + rec.taxonKey) }, 'Record this specimen'));
    body.append(el('button', { class: 'btn ghost', onclick: async () => { await store.addToWishlist(rec.taxonKey); toast('Added to your wishlist'); } }, 'Add to wishlist'));
  }
  const photo = rec.media?.[0]?.url;
  if (photo) body.append(el('div', { class: 'sp-sec' }, el('h4', {}, 'Reference photograph'), el('div', { class: 'ref-photo' }, el('img', { src: photo, loading: 'lazy', decoding: 'async', alt: rec.commonName || rec.scientificName }), el('div', { class: 'ref-cap' }, `Field photograph via GBIF · ${rec.media[0].creator || 'contributor'}`))));
  body.append(el('div', { class: 'data-note' }, el('p', {}, `Source: GBIF #${rec.taxonKey}${rec.marine ? ' · marine data via OBIS' : ''}.`)));
  body.append(el('div', { style: 'height:18px' }));
  return root;
}
function errState(root, title, msg, taxonKey) { root.innerHTML = ''; root.append(el('div', { class: 'pad' }, el('div', { class: 'back-head' }, el('button', { class: 'back-btn', 'aria-label': 'Back', onclick: () => goBack() }, '‹'), el('h1', { class: 'h-title' }, title)), el('p', { class: 'lede' }, msg), el('button', { class: 'btn', onclick: () => go('#/species/' + taxonKey) }, 'Try again'), el('button', { class: 'btn ghost', onclick: () => goBack() }, 'Go back'))); return root; }
const def = (k, v) => el('div', { class: 'def' }, el('span', { class: 'dk' }, k), el('span', { class: 'dv' }, String(v)));

function swapHero(hero, img) { const plate = hero.querySelector('.entry-plate'); if (plate) { const fig = el('figure', { class: 'ai-hero' }); fig.append(el('img', { src: img, alt: '', loading: 'lazy', decoding: 'async' })); plate.replaceWith(fig); } }
async function placeHabitatControl(rec, hero, body) {
  let placed = await store.isPlacedInHabitat(rec.taxonKey);
  let cached = await artwork.getArt(rec.taxonKey);
  if (placed && cached) swapHero(hero, cached);
  const sec = el('div', { class: 'sp-sec habitat-place' });
  const note = el('p', { class: 'muted small' }, placed ? 'This animal appears in your habitat as a hand-illustrated version.' : 'Generate a hand-illustrated version of this animal and place it in your habitat. Uses your AI key.');
  const btn = el('button', { class: 'btn ghost' });
  const setLabel = () => { btn.textContent = placed ? 'Remove illustration from habitat' : (cached ? 'Place in habitat' : 'Draw \u0026 place in habitat'); };
  setLabel();
  btn.onclick = async () => {
    if (placed) { placed = false; await store.setPlacedArt(rec.taxonKey, false); note.textContent = 'Removed. Your habitat shows the field-guide silhouette for this animal.'; setLabel(); return; }
    btn.disabled = true; btn.textContent = cached ? 'Placing…' : 'Drawing the illustration… (this can take a moment)';
    if (!cached) cached = await artwork.ensureArt(rec);
    btn.disabled = false;
    if (!cached) { note.textContent = 'Could not generate artwork — check that your AI key is set and has credits.'; setLabel(); return; }
    swapHero(hero, cached); placed = true; await store.setPlacedArt(rec.taxonKey, true); note.textContent = 'Placed. This animal now appears illustrated in your habitat.'; setLabel(); toast('Placed in your habitat');
  };
  sec.append(el('h4', {}, 'Habitat illustration'), note, btn); body.append(sec);
}
