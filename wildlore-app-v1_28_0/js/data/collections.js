import * as gbif from './gbif.js';
import * as db from '../core/db.js';
export const SETS = {
  backyard: { id: 'backyard', name: 'Backyard Starter', blurb: 'Common species you can find from home or a nearby park. A first collection you can actually complete.', names: ['Columba livia', 'Passer domesticus', 'Turdus migratorius', 'Cardinalis cardinalis', 'Zenaida macroura', 'Corvus brachyrhynchos', 'Anas platyrhynchos', 'Sciurus carolinensis', 'Apis mellifera', 'Danaus plexippus', 'Hippodamia convergens', 'Bombus impatiens', 'Haemorhous mexicanus', 'Taraxacum officinale'] },
  citybirds: { id: 'citybirds', name: 'City Birds', blurb: 'The birds that share our streets, parks, and rooftops.', names: ['Columba livia', 'Passer domesticus', 'Sturnus vulgaris', 'Corvus brachyrhynchos', 'Zenaida macroura', 'Turdus migratorius', 'Hirundo rustica', 'Falco peregrinus', 'Buteo jamaicensis', 'Haemorhous mexicanus'] },
  pollinators: { id: 'pollinators', name: 'Garden Pollinators', blurb: 'The bees and butterflies that keep gardens alive.', names: ['Apis mellifera', 'Bombus impatiens', 'Danaus plexippus', 'Papilio polyxenes', 'Vanessa cardui', 'Pieris rapae', 'Vanessa atalanta', 'Xylocopa virginica', 'Bombus terrestris'] },
  tidepool: { id: 'tidepool', name: 'Tidepool Life', marine: true, blurb: 'The strange, beautiful creatures of the rocky intertidal zone.', names: ['Pisaster ochraceus', 'Strongylocentrotus purpuratus', 'Anthopleura elegantissima', 'Pagurus samuelis', 'Mytilus californianus', 'Pollicipes polymerus', 'Haliotis rufescens', 'Pachygrapsus crassipes', 'Cancer productus'] },
  afterdark: { id: 'afterdark', name: 'After Dark', blurb: 'The creatures that come out at night. Look and listen after sunset.', names: ['Bubo virginianus', 'Tyto alba', 'Megascops asio', 'Eptesicus fuscus', 'Procyon lotor', 'Didelphis virginiana', 'Mephitis mephitis', 'Vulpes vulpes', 'Actias luna', 'Photinus pyralis', 'Hemidactylus turcicus'] },
  nudibranchs: { id: 'nudibranchs', name: 'Nudibranchs of the World', marine: true, blurb: 'For the curious diver: sea slugs that look hand-painted. A rare, advanced collection.', names: ['Glaucus atlanticus', 'Flabellina iodinea', 'Hermissenda crassicornis', 'Chromodoris willani', 'Hypselodoris bullockii', 'Jorunna parva', 'Phyllidia varicosa', 'Nembrotha kubaryana', 'Felimare californiensis'] }
};
export const THEMED = ['citybirds', 'pollinators', 'tidepool', 'afterdark'];
export const NICHE = ['nudibranchs'];
export async function resolveSet(set) {
  const key = 'set:' + set.id; const cached = await db.kvGet(key, null); if (cached && cached.length) return cached;
  const out = []; for (const name of set.names) { try { const m = await gbif.match(name); if (m && m.usageKey) out.push({ taxonKey: m.usageKey, commonName: m.canonicalName, canonicalName: m.canonicalName, scientificName: m.scientificName || m.canonicalName, class: m.class, phylum: m.phylum, order: m.order, kingdom: m.kingdom }); } catch (_) {} }
  if (out.length) await db.kvSet(key, out); return out;
}
export async function setMembers(set) { if (set.dynamic) return (set.keys || []).map((k) => ({ taxonKey: k, dynamic: true })); return resolveSet(set); }
export async function setProgress(set, foundSet) { const members = await setMembers(set); const found = members.filter((m) => foundSet.has(m.taxonKey)).length; return { members, found, total: members.length, pct: members.length ? Math.round(found / members.length * 100) : 0 }; }
export async function buildNearby(lat, lng, radiusKm = 30) {
  const d = radiusKm / 111; const wkt = `POLYGON((${lng - d} ${lat - d},${lng + d} ${lat - d},${lng + d} ${lat + d},${lng - d} ${lat + d},${lng - d} ${lat - d}))`;
  const data = await gbif.occurrenceSearch({ geometry: wkt, hasCoordinate: true, mediaType: 'StillImage', facet: 'speciesKey', facetLimit: 20, limit: 0 });
  const keys = (data.facets?.[0]?.counts || []).map((c) => Number(c.name)).filter(Boolean).slice(0, 14);
  const set = { id: 'nearby', name: 'Near You', dynamic: true, keys, blurb: 'The most-recorded species around your current location. A local collection to complete.', coords: { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 }, at: Date.now() };
  await db.kvSet('set:nearby', set); await rememberCoords(lat, lng); return set;
}
export const getNearby = () => db.kvGet('set:nearby', null);
export const rememberCoords = (lat, lng) => db.kvSet('lastCoords', { lat, lng, at: Date.now() });
export const getLastCoords = () => db.kvGet('lastCoords', null);
export const setById = (id) => (id === 'nearby' ? getNearby() : Promise.resolve(SETS[id] || null));
