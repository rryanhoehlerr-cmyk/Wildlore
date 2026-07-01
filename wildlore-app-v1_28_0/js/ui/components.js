import { plate, categoryOf, categoryLabel } from './illustrations.js';
export const RARITY_COLOR = { Common: '#7e8b95', Uncommon: '#2f8c86', Notable: '#2f6e9c', Rare: '#5a5f9c', Legendary: '#9a7b3c' };
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v; else if (k === 'html') node.innerHTML = v; else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v); else if (k === 'dataset') Object.assign(node.dataset, v); else if (v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) { if (c == null) continue; node.append(c.nodeType ? c : document.createTextNode(c)); }
  return node;
}
export function go(hash) { location.hash = hash; }
export function goBack(fallback = '#/explore') { if (window.history.length > 1) window.history.back(); else location.hash = fallback; }
export function speciesCard(rec, { locked = false } = {}) {
  const cat = categoryOf(rec); const c = RARITY_COLOR[rec.rarityTier] || RARITY_COLOR.Common;
  const open = () => go('#/species/' + rec.taxonKey);
  const card = el('article', { class: 'spec' + (locked ? ' locked' : ''), role: 'button', tabindex: '0', 'aria-label': (rec.commonName || rec.canonicalName || 'Species'), onclick: open, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } });
  card.append(plate(cat, { locked }));
  if (!locked) { import('../features/artwork.js').then((A) => A.getArt(rec.taxonKey)).then((img) => { if (img) { const sil = card.querySelector('.sil'); if (sil) { const im = document.createElement('img'); im.className = 'spec-art-img'; im.src = img; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; sil.replaceWith(im); } } }).catch(() => {}); }
  card.append(el('div', { class: 'spec-cap' }, el('div', { class: 'spec-name' }, locked ? 'Unidentified' : titleCase(rec.commonName || rec.canonicalName || rec.scientificName)), el('div', { class: 'spec-sci' }, categoryLabel(cat))));
  card.append(el('span', { class: 'rar-tick', style: `background:${c}` }));
  return card;
}
const SHADOW_CATS = ['raptor', 'shark', 'nudibranch', 'octopus', 'deer', 'fish', 'jelly', 'seastar', 'frog', 'crab', 'owl', 'bigcat'];
let _si = 0;
export function shadowCard() { const cat = SHADOW_CATS[_si++ % SHADOW_CATS.length]; const card = el('article', { class: 'spec locked' }); card.append(plate(cat, { locked: true })); card.append(el('div', { class: 'spec-cap' }, el('div', { class: 'spec-name' }, 'Unidentified'), el('div', { class: 'spec-sci' }, 'Awaiting discovery'))); card.append(el('span', { class: 'rar-tick', style: 'background:#9aa7b0' })); return card; }
export function spinner(label = 'Loading') { return el('div', { class: 'loading' }, el('div', { class: 'spin' }), el('div', { class: 'loading-l' }, label)); }
export function emptyState(title, body, action) { const e = el('div', { class: 'empty' }, el('div', { class: 'empty-rule' }), el('h5', {}, title), el('p', {}, body)); if (action) e.append(el('button', { class: 'btn', onclick: action.onClick }, action.label)); return e; }
export function toast(msg) { let t = document.getElementById('toast'); if (!t) { t = el('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400); }
export const haptic = (p = 12) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {} };
export const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString());
const SMALL = new Set(['of','the','and','a','an','to','in','on','at','for','with','de','del']);
export const titleCase = (s) => { const w = String(s || '').toLowerCase().split(' '); return w.map((word, i) => (i > 0 && SMALL.has(word)) ? word : word.replace(/(^|[-'])([a-z])/g, (m, p, c) => p + c.toUpperCase())).join(' '); };
