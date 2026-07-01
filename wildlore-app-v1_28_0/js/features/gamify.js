import * as store from '../core/store.js';
export const ACHIEVEMENTS = [
  { id: 'first_find', name: 'First Find', test: (s) => s.count >= 1 },
  { id: 'ten', name: '10 Species', test: (s) => s.count >= 10 },
  { id: 'fifty', name: '50 Species', test: (s) => s.count >= 50 },
  { id: 'hundred', name: '100 Species', test: (s) => s.count >= 100 },
  { id: 'birder', name: 'Birder', test: (s) => s.byClass['Aves'] >= 10 },
  { id: 'mammalogist', name: 'Mammalogist', test: (s) => s.byClass['Mammalia'] >= 10 },
  { id: 'marine', name: 'Marine Explorer', test: (s) => s.marine >= 10 },
  { id: 'nudibranch', name: 'Nudibranch Hunter', test: (s) => s.byOrder['Nudibranchia'] >= 3 },
  { id: 'rare_hunter', name: 'Rare Hunter', test: (s) => s.rare >= 5 },
  { id: 'legendary', name: 'Legendary Encounter', test: (s) => s.legendary >= 1 },
  { id: 'conservation', name: 'Conservation Champion', test: (s) => s.threatened >= 5 },
  { id: 'streak10', name: 'Streak x10', test: (s) => s.streak >= 10 }
];
export async function evaluate() {
  const collection = await store.getCollection(); const streak = store.getStreak();
  const stats = { count: collection.length, streak: streak.current, byClass: {}, byOrder: {}, marine: 0, rare: 0, legendary: 0, threatened: 0 };
  for (const sp of collection) { if (sp.realm === 'marine') stats.marine++; if (sp.rarityTier === 'Rare' || sp.rarityTier === 'Legendary') stats.rare++; if (sp.rarityTier === 'Legendary') stats.legendary++; }
  const newly = [];
  for (const a of ACHIEVEMENTS) { try { if (a.test(proxy(stats, collection))) { if (await store.unlockAchievement(a.id, { name: a.name })) newly.push(a); } } catch (_) {} }
  return newly;
}
function proxy(base, collection) { return new Proxy(base, { get(t, p) { if (p === 'byClass') return countBy(collection, 'cls'); if (p === 'byOrder') return countBy(collection, 'order'); if (p === 'threatened') return collection.filter((c) => ['VU', 'EN', 'CR'].includes((c.iucnCategory || '').toUpperCase())).length; return t[p]; } }); }
function countBy(arr, key) { const o = {}; for (const it of arr) { const k = it[key]; if (k) o[k] = (o[k] || 0) + 1; } return o; }
