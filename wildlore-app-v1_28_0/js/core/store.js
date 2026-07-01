import * as db from './db.js';
import * as auth from './auth.js';
const bus = new EventTarget();
export const on = (t, fn) => { bus.addEventListener(t, fn); return () => bus.removeEventListener(t, fn); };
const emit = (t, d) => bus.dispatchEvent(new CustomEvent(t, { detail: d }));
const DEFAULT_PROFILE = () => ({ level: 1, xp: 0, xpToNext: 200, discoveryScore: 0, rank: 'Novice Naturalist', homeRegion: null, plus: false });
const DEFAULT_STREAK = () => ({ current: 0, longest: 0, freezes: 1, lastActive: null });
let profile, streak, achievements, regionProgress;
export async function load() {
  profile = await db.kvGet('profile', null) || DEFAULT_PROFILE();
  streak = await db.kvGet('streak', null) || DEFAULT_STREAK();
  achievements = await db.kvGet('achievements', null) || {};
  regionProgress = await db.kvGet('regionProgress', null) || {};
  return snapshot();
}
export function snapshot() { return { profile: { ...profile }, streak: { ...streak }, achievements: { ...achievements }, regionProgress: { ...regionProgress } }; }
export const getProfile = () => ({ ...profile });
export const getStreak = () => ({ ...streak });
export const getRegionProgress = () => ({ ...regionProgress });
export const getAchievements = () => ({ ...achievements });
export async function getCollection() { return db.all('user_species'); }
export async function isFound(k) { return !!(await db.get('user_species', k)); }
export async function collectionCount() { return db.count('user_species'); }
export async function getDiscoveries() { const a = await db.all('discoveries'); return a.sort((x, y) => (y.capturedAt || 0) - (x.capturedAt || 0)); }
export async function recordDiscovery({ record, encounterType = 'wild', confidence = null, note = '', lat = null, lng = null, photoUrl = null }) {
  const taxonKey = record.taxonKey; const existing = await db.get('user_species', taxonKey); const first = !existing; const now = Date.now();
  if (record.sensitive && lat != null) { lat = Math.round(lat * 4) / 4; lng = Math.round(lng * 4) / 4; }
  const discovery = { taxonKey, scientificName: record.scientificName, commonName: record.commonName, encounterType, confidence, note, lat, lng, photoUrl: photoUrl || (record.media?.[0]?.url || null), capturedAt: now, isFirstEncounter: first, userId: auth.current()?.id || 'local' };
  const id = await db.add('discoveries', discovery);
  const agg = existing || { taxonKey, commonName: record.commonName, scientificName: record.scientificName, cls: record.class, order: record.order, realm: record.realm, rarityTier: record.rarityTier, timesSeen: 0, firstFoundAt: now, firstDiscoveryId: id, bestPhoto: discovery.photoUrl };
  agg.timesSeen += 1; await db.put('user_species', agg);
  const scoreGain = (encounterType === 'wild' || encounterType === 'audio') ? record.discoveryScore : 0;
  const xpGain = (encounterType === 'captive') ? 25 : (encounterType === 'evidence') ? 15 : record.xp;
  if (first || scoreGain) profile.discoveryScore += scoreGain;
  addXp(xpGain); bumpStreak(); await persist();
  await enqueue({ kind: 'discovery', payload: discovery });
  emit('discovery', { record, first, xpGain, scoreGain }); emit('change', snapshot());
  return { first, xpGain, scoreGain, discoveryId: id };
}
function addXp(a) { profile.xp += a; while (profile.xp >= profile.xpToNext) { profile.xp -= profile.xpToNext; profile.level += 1; profile.xpToNext = Math.round(profile.xpToNext * 1.25); emit('levelup', { level: profile.level }); } profile.rank = rankFor(profile.level); }
function rankFor(l) { return l >= 30 ? 'Wildlife Master' : l >= 20 ? 'Field Expert' : l >= 10 ? 'Field Naturalist' : l >= 4 ? 'Naturalist' : 'Novice Naturalist'; }
function bumpStreak() { const today = new Date().toDateString(); if (streak.lastActive === today) return; const y = new Date(Date.now() - 864e5).toDateString(); if (streak.lastActive === y || streak.lastActive == null) streak.current += 1; else if (streak.freezes > 0) { streak.freezes -= 1; streak.current += 1; } else streak.current = 1; streak.longest = Math.max(streak.longest, streak.current); streak.lastActive = today; }
export async function setRegionProgress(id, found, total) { regionProgress[id] = { found, total, pct: total ? Math.round((found / total) * 100) : 0, updated: Date.now() }; await db.kvSet('regionProgress', regionProgress); emit('change', snapshot()); }
export async function unlockAchievement(id, meta = {}) { if (achievements[id]?.done) return false; achievements[id] = { done: true, at: Date.now(), ...meta }; await db.kvSet('achievements', achievements); await enqueue({ kind: 'achievement', payload: { id } }); emit('achievement', { id }); emit('change', snapshot()); return true; }
export async function addToWishlist(k) { const w = await db.kvGet('wishlist', []); if (!w.includes(k)) { w.push(k); await db.kvSet('wishlist', w); } emit('change', snapshot()); }
export async function getWishlist() { return db.kvGet('wishlist', []); }
// --- Habitat curation: hide/restore a species from the living diorama (never removes it from the collection) ---
export async function getHabitatHidden() { return db.kvGet('habitatHidden', []); }
export async function hideFromHabitat(k) { const h = await db.kvGet('habitatHidden', []); if (!h.includes(k)) { h.push(k); await db.kvSet('habitatHidden', h); } emit('change', snapshot()); }
export async function showInHabitat(k) { let h = await db.kvGet('habitatHidden', []); h = h.filter((x) => x !== k); await db.kvSet('habitatHidden', h); emit('change', snapshot()); }
export async function resetHabitats() { await db.kvSet('habitatHidden', []); emit('change', snapshot()); }

// --- Per-animal positions (drag to move in Curate) ---
export async function getAnimalPositions() { return db.kvGet('animalPos', {}); }
export async function setAnimalPos(taxonKey, pos) { const m = await db.kvGet('animalPos', {}); if (!pos) delete m[taxonKey]; else m[taxonKey] = pos; await db.kvSet('animalPos', m); emit('change', snapshot()); }

// --- Species the user has chosen to render as their AI illustration inside habitats ---
export async function getPlacedArt() { return db.kvGet('placedArt', {}); }
export async function isPlacedInHabitat(taxonKey) { const m = await db.kvGet('placedArt', {}); return !!m[taxonKey]; }
export async function setPlacedArt(taxonKey, on) { const m = await db.kvGet('placedArt', {}); if (on) m[taxonKey] = 1; else delete m[taxonKey]; await db.kvSet('placedArt', m); emit('change', snapshot()); }

// --- Per-animal size overrides (resize one animal without affecting others) ---
export async function getAnimalScales() { return db.kvGet('animalScale', {}); }
export async function setAnimalScale(taxonKey, v) { const m = await db.kvGet('animalScale', {}); if (v == null || Math.abs(v - 1) < 0.001) delete m[taxonKey]; else m[taxonKey] = v; await db.kvSet('animalScale', m); emit('change', snapshot()); }

// --- Habitat creature display size ---
export async function getCreatureScale() { return db.kvGet('creatureScale', 1); }
export async function setCreatureScale(v) { await db.kvSet('creatureScale', v); emit('change', snapshot()); }

// --- Connected landscape: an ordered chain of places that scroll as one continuous world ---
export async function getLandscape() { return db.kvGet('landscape', []); }
export async function setLandscape(ids) { await db.kvSet('landscape', ids || []); emit('change', snapshot()); }

// --- Personalized habitats (places created from a user's own photo) ---
export async function getPlaces() { return db.kvGet('customHabitats', []); }
export async function addPlace(place) { const list = await db.kvGet('customHabitats', []); place.id = 'p' + Date.now(); place.createdAt = Date.now(); list.push(place); await db.kvSet('customHabitats', list); emit('change', snapshot()); return place; }
export async function updatePlace(id, patch) { const list = await db.kvGet('customHabitats', []); const i = list.findIndex((p) => p.id === id); if (i >= 0) { list[i] = { ...list[i], ...patch }; await db.kvSet('customHabitats', list); emit('change', snapshot()); } }
export async function removePlace(id) { let list = await db.kvGet('customHabitats', []); list = list.filter((p) => p.id !== id); await db.kvSet('customHabitats', list); emit('change', snapshot()); }

// --- Undo a just-made record (correct a mis-identification) ---
function subXp(a) { profile.xp -= a; while (profile.xp < 0 && profile.level > 1) { profile.level -= 1; profile.xpToNext = Math.round(profile.xpToNext / 1.25); profile.xp += profile.xpToNext; } if (profile.xp < 0) profile.xp = 0; profile.rank = rankFor(profile.level); }
export async function undoLastDiscovery({ discoveryId, taxonKey, xpGain = 0, scoreGain = 0 }) {
  if (discoveryId != null) { try { await db.del('discoveries', discoveryId); } catch (_) {} }
  const remaining = (await db.all('discoveries')).filter((d) => d.taxonKey === taxonKey);
  if (!remaining.length) { try { await db.del('user_species', taxonKey); } catch (_) {} }
  else { const agg = await db.get('user_species', taxonKey); if (agg) { agg.timesSeen = remaining.length; await db.put('user_species', agg); } }
  profile.discoveryScore = Math.max(0, profile.discoveryScore - (scoreGain || 0)); subXp(xpGain || 0);
  await persist(); emit('change', snapshot());
}
async function persist() { await db.kvSet('profile', profile); await db.kvSet('streak', streak); }
async function enqueue(m) { await db.add('sync_queue', { ...m, queuedAt: Date.now() }); if (navigator.onLine) syncNow(); }
export async function syncNow() {
  if (!auth.isCloud() || !navigator.onLine) return; const sb = await auth.client(); if (!sb) return;
  const pending = await db.all('sync_queue');
  for (const m of pending) { try { if (m.kind === 'discovery') await sb.from('discoveries').insert(toRemote(m.payload)); if (m.kind === 'achievement') await sb.from('achievements').upsert({ user_id: auth.current().id, achievement_id: m.payload.id, completed_at: new Date().toISOString() }); await db.del('sync_queue', m.id); } catch (e) { break; } }
  try { await sb.from('profiles').upsert({ id: auth.current().id, level: profile.level, xp: profile.xp, discovery_score: profile.discoveryScore, naturalist_rank: profile.rank }); } catch (_) {}
}
function toRemote(d) { return { user_id: auth.current().id, taxon_key: d.taxonKey, scientific_name: d.scientificName, photo_url: d.photoUrl, captured_at: new Date(d.capturedAt).toISOString(), ai_confidence: d.confidence, encounter_type: d.encounterType, journal_note: d.note, lat: d.lat, lng: d.lng, is_first_encounter: d.isFirstEncounter }; }
window.addEventListener('online', syncNow);
