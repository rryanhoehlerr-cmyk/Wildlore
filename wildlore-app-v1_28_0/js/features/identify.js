import { CONFIG } from '../config.js';
import * as catalog from '../data/catalog.js';
export const Gate = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
export function gateFor(s) { if (s >= CONFIG.identify.confidence.high) return Gate.HIGH; if (s >= CONFIG.identify.confidence.medium) return Gate.MEDIUM; return Gate.LOW; }
export const ManualMatch = { id: 'manual', available: () => true, async classify({ name }) { return name ? catalog.matchName(name) : []; } };
async function endpoint(url, body) { const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!res.ok) throw new Error('endpoint error'); const data = await res.json(); const out = []; for (const c of (data.candidates || []).slice(0, 5)) { const m = await catalog.matchName(c.name); if (m[0]) out.push({ ...m[0], score: c.score ?? m[0].score }); } return out; }
export const Vision = { id: 'vision', available: () => !!CONFIG.identify.visionEndpoint, classify: ({ imageBase64, lat, lng }) => endpoint(CONFIG.identify.visionEndpoint, { imageBase64, lat, lng }) };
export const Audio = { id: 'audio', available: () => !!CONFIG.identify.audioEndpoint, classify: ({ audioBase64, lat, lng }) => endpoint(CONFIG.identify.audioEndpoint, { audioBase64, lat, lng }) };
export function providersFor(mode) { if (mode === 'audio') return [Audio, ManualMatch]; if (mode === 'photo') return [Vision, ManualMatch]; return [ManualMatch]; }
export async function identify(mode, input) { for (const p of providersFor(mode)) { if (!p.available()) continue; try { const c = await p.classify(input); if (c && c.length) return { provider: p.id, candidates: c }; } catch (e) {} } return { provider: null, candidates: [] }; }
export async function resolve(taxonKey) { return catalog.getSpecies(taxonKey); }
export function audioReady() { return !!CONFIG.identify.audioEndpoint; }
export function visionReady() { return !!CONFIG.identify.visionEndpoint; }
