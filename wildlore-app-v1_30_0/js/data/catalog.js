import { CONFIG } from '../config.js';
import * as db from '../core/db.js';
import * as gbif from './gbif.js';
import * as obis from './obis.js';
export const TAXON_GROUPS = [
  { id: 'mammals', label: 'Mammals', sci: 'Mammalia', realm: 'terrestrial' },
  { id: 'birds', label: 'Birds', sci: 'Aves', realm: 'terrestrial' },
  { id: 'reptiles', label: 'Reptiles', sci: 'Reptilia', realm: 'terrestrial' },
  { id: 'amphibians', label: 'Amphibians', sci: 'Amphibia', realm: 'terrestrial' },
  { id: 'insects', label: 'Insects', sci: 'Insecta', realm: 'terrestrial' },
  { id: 'fish', label: 'Ray-finned Fish', sci: 'Actinopterygii', realm: 'marine' },
  { id: 'sharks', label: 'Sharks & Rays', sci: 'Chondrichthyes', realm: 'marine' },
  { id: 'cetacea', label: 'Whales & Dolphins', sci: 'Cetacea', realm: 'marine' },
  { id: 'cephalopods', label: 'Cephalopods', sci: 'Cephalopoda', realm: 'marine' },
  { id: 'nudibranchs', label: 'Nudibranchs & Sea Slugs', sci: 'Nudibranchia', realm: 'marine' },
  { id: 'corals', label: 'Corals & Anemones', sci: 'Anthozoa', realm: 'marine' },
  { id: 'jellyfish', label: 'Jellyfish', sci: 'Scyphozoa', realm: 'marine' },
  { id: 'echinoderms', label: 'Sea Stars & Urchins', sci: 'Echinodermata', realm: 'marine' },
  { id: 'crustaceans', label: 'Crustaceans', sci: 'Malacostraca', realm: 'marine' },
  { id: 'molluscs', label: 'Molluscs', sci: 'Mollusca', realm: 'marine' },
  { id: 'plants', label: 'Plants', sci: 'Plantae', realm: 'terrestrial' },
  { id: 'fungi', label: 'Fungi', sci: 'Fungi', realm: 'terrestrial' }
];
const RARITY = ['Common', 'Uncommon', 'Notable', 'Rare', 'Legendary'];
const RARITY_SCORE = { Common: 20, Uncommon: 45, Notable: 70, Rare: 110, Legendary: 200 };
const RARITY_XP = { Common: 70, Uncommon: 120, Notable: 160, Rare: 220, Legendary: 360 };
export function deriveRarity(occ, iucnCat) {
  let idx; if (occ == null) idx = 2; else if (occ > 100000) idx = 0; else if (occ > 10000) idx = 1; else if (occ > 1000) idx = 2; else if (occ > 100) idx = 3; else idx = 4;
  const cat = (iucnCat || '').toUpperCase(); if (['VU', 'NT', 'EN'].includes(cat)) idx += 1; else if (['CR', 'EW', 'EX'].includes(cat)) idx += 2;
  return RARITY[Math.max(0, Math.min(4, idx))];
}
export function deriveDifficulty(occ) { if (occ == null) return 'Medium'; if (occ > 50000) return 'Easy'; if (occ > 5000) return 'Medium'; if (occ > 500) return 'Hard'; return 'Very Hard'; }
export async function resolveGroupKey(group) {
  const cacheKey = 'group:' + group.id; const cached = await db.get('taxa', cacheKey); if (cached) return cached;
  const m = await gbif.match(group.sci); const key = m.usageKey || m[`${(m.rank || '').toLowerCase()}Key`] || m.classKey || m.phylumKey || m.kingdomKey;
  const node = { key: cacheKey, gbifKey: key, name: group.label, rank: m.rank, realm: group.realm }; if (key) await db.put('taxa', node); return node;
}
export async function listSpeciesInTaxon(gbifKey, o = {}) { const data = await gbif.searchSpecies('', { highertaxonKey: gbifKey, rank: 'SPECIES', limit: o.limit || 24, offset: o.offset || 0 }); return { total: data.count || 0, items: (data.results || []).filter((r) => r.key).map(light) }; }
export async function searchSpecies(q, o = {}) { const data = await gbif.searchSpecies(q, { rank: o.rank, limit: o.limit || 24, offset: o.offset || 0 }); return { total: data.count || 0, items: (data.results || []).filter((r) => r.key).map(light) }; }
function light(r) { return { taxonKey: r.nubKey || r.key, scientificName: r.scientificName || r.canonicalName, canonicalName: r.canonicalName, commonName: (r.vernacularNames || []).find((v) => v.language === 'eng')?.vernacularName || r.canonicalName, rank: r.rank, class: r.class, phylum: r.phylum, order: r.order, family: r.family, kingdom: r.kingdom, realm: realmFromTax(r), iucnCategory: (r.threatStatuses || [])[0] || null }; }
function realmFromTax(t) { const p = (t.phylum || '').toLowerCase(); const c = (t.class || '').toLowerCase(); if (['mollusca', 'cnidaria', 'echinodermata', 'porifera', 'ctenophora', 'annelida', 'arthropoda'].includes(p)) { if (['insecta', 'arachnida', 'collembola'].includes(c)) return 'terrestrial'; return 'marine'; } if (['actinopterygii', 'chondrichthyes', 'cephalopoda', 'malacostraca', 'anthozoa', 'scyphozoa', 'hydrozoa'].includes(c)) return 'marine'; if (c === 'mammalia' && ['cetacea', 'sirenia'].includes((t.order || '').toLowerCase())) return 'marine'; return null; }
export async function getSpecies(taxonKey, opts = {}) {
  const enrich = opts.enrich !== false; const cached = await db.get('species', taxonKey);
  if (cached && Date.now() - (cached._cachedAt || 0) < CONFIG.cache.speciesTtl) return cached;
  const [tax, vern, media, profile, iucnCat] = await Promise.all([ gbif.taxon(taxonKey).catch(() => null), gbif.vernacularNames(taxonKey).catch(() => ({ results: [] })), gbif.speciesMedia(taxonKey).catch(() => ({ total: 0, photos: [] })), gbif.speciesProfiles(taxonKey).catch(() => ({ results: [] })), gbif.iucn(taxonKey).catch(() => null) ]);
  if (!tax) return cached || null;
  const desc = await gbif.descriptions(taxonKey).catch(() => ({ results: [] }));
  const commonName = (vern.results || []).filter((v) => v.language === 'eng')[0]?.vernacularName || tax.canonicalName || tax.scientificName;
  const realm = realmFromProfile(profile.results) || realmFromTax(tax);
  const occ = media.total || null; const iucn = iucnCat?.category || (tax.threatStatuses || [])[0] || null; const rarity = deriveRarity(occ, iucn);
  const rec = { taxonKey, acceptedTaxonKey: tax.acceptedKey || taxonKey, scientificName: tax.scientificName, canonicalName: tax.canonicalName, commonName, rank: tax.rank, kingdom: tax.kingdom, phylum: tax.phylum, class: tax.class, order: tax.order, family: tax.family, genus: tax.genus, species: tax.species, kingdomKey: tax.kingdomKey, phylumKey: tax.phylumKey, classKey: tax.classKey, orderKey: tax.orderKey, familyKey: tax.familyKey, genusKey: tax.genusKey, vernacularNames: dedupe(vern.results), description: clean(desc.results?.find((d) => d.description)?.description) || null, habitat: profile.results?.[0]?.habitat || null, realm: realm || null, iucnCategory: iucn, occurrenceCount: occ, media: media.photos, rarityTier: rarity, discoveryDifficulty: deriveDifficulty(occ), discoveryScore: RARITY_SCORE[rarity], xp: RARITY_XP[rarity], sensitive: ['EN', 'CR', 'EW'].includes((iucn || '').toUpperCase()), sources: [{ name: 'GBIF', url: `https://www.gbif.org/species/${taxonKey}`, fetchedAt: Date.now() }], _cachedAt: Date.now() };
  if (enrich && rec.realm === 'marine') { const m = await obis.enrich(rec).catch(() => null); if (m) { rec.marine = m; rec.sources.push(m.source); } }
  await db.put('species', rec); return rec;
}
function realmFromProfile(ps) { const p = ps?.find((x) => x.marine || x.terrestrial || x.freshwater); if (!p) return null; if (p.marine) return 'marine'; if (p.freshwater) return 'freshwater'; if (p.terrestrial) return 'terrestrial'; return null; }
function dedupe(list) { const s = new Set(); const o = []; for (const v of list || []) { const k = (v.vernacularName || '').toLowerCase(); if (v.language === 'eng' && !s.has(k)) { s.add(k); o.push(v.vernacularName); } } return o.slice(0, 6); }
function clean(html) { return html ? html.replace(/<[^>]+>/g, '').trim().slice(0, 600) : null; }
export async function matchName(name) {
  if (!name) return []; const out = []; const seen = new Set(); const q = name.trim().toLowerCase();
  // exact scientific match first (when the user types a Latin name)
  try { const m = await gbif.match(name); if (m && m.usageKey && m.matchType !== 'NONE' && (m.kingdom || '') !== 'Viruses') { out.push({ taxonKey: m.usageKey, name: m.canonicalName || m.scientificName, scientificName: m.scientificName, kingdom: m.kingdom, class: m.class, order: m.order, score: Math.min(0.99, (m.confidence || 95) / 100) }); seen.add(m.usageKey); } } catch (_) {}
  // vernacular / full-text search, ranked toward the real animal the user means
  try {
    const data = await gbif.searchSpecies(name, { rank: 'SPECIES', limit: 12 });
    const scored = [];
    for (const r of data.results || []) {
      const key = r.nubKey || r.key; if (!key || seen.has(key) || r.synonym) continue;
      const king = r.kingdom || '';
      if (['Viruses', 'Bacteria', 'Archaea'].includes(king)) continue;
      const verns = (r.vernacularNames || []).filter((v) => v.language === 'eng').map((v) => v.vernacularName);
      const common = verns[0] || r.canonicalName;
      const vlow = verns.map((v) => (v || '').toLowerCase());
      let s = 0.6;
      if (vlow.includes(q)) s += 0.32; else if (vlow.some((v) => v.includes(q))) s += 0.18;
      if (king === 'Animalia') s += 0.08;
      scored.push({ key, item: { taxonKey: key, name: common, scientificName: r.scientificName, kingdom: king, class: r.class, order: r.order }, s });
    }
    scored.sort((a, b) => b.s - a.s);
    let i = 0; for (const sc of scored) { if (seen.has(sc.key)) continue; seen.add(sc.key); out.push({ ...sc.item, score: Math.min(0.95, sc.s - i * 0.02) }); i++; }
  } catch (_) {}
  return out.slice(0, 6);
}
