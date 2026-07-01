import { CONFIG } from '../config.js';
import * as db from './db.js';
let _client = null, _user = null; const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((fn) => fn(_user)); }
async function supabase() { if (!CONFIG.supabase.enabled()) return null; if (_client) return _client; const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2'); _client = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey); return _client; }
export async function init() {
  const sb = await supabase();
  if (sb) { const { data } = await sb.auth.getSession(); if (data?.session?.user) _user = mapUser(data.session.user); sb.auth.onAuthStateChange((_e, s) => { _user = s?.user ? mapUser(s.user) : null; emit(); }); }
  else { _user = await db.kvGet('local_account', null); }
  return _user;
}
function mapUser(u) { return { id: u.id, email: u.email, displayName: u.user_metadata?.display_name || (u.email || 'Explorer').split('@')[0], mode: 'cloud' }; }
export function current() { return _user; }
export function isCloud() { return CONFIG.supabase.enabled(); }
export async function signInWithEmail(email) {
  const sb = await supabase();
  if (sb) { const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } }); if (error) throw error; return { magicLink: true }; }
  _user = { id: 'local-' + (await hash(email)), email, displayName: email.split('@')[0], mode: 'local' }; await db.kvSet('local_account', _user); emit(); return { magicLink: false };
}
export async function continueAsGuest() { _user = { id: 'guest', email: null, displayName: 'Explorer', mode: 'guest' }; await db.kvSet('local_account', _user); emit(); return _user; }
export async function signOut() { const sb = await supabase(); if (sb) await sb.auth.signOut(); _user = null; await db.del('kv', 'local_account'); emit(); }
async function hash(s) { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 6).map((x) => x.toString(16).padStart(2, '0')).join(''); }
export async function client() { return supabase(); }
