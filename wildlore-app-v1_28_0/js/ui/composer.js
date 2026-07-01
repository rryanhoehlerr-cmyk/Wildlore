/* Procedural scene composer — builds a bespoke illustrated environment from a photo's colour mood
   plus a text description, in the app's flat vector language. Not limited to preset biomes: it
   layers modular elements (sky, sun/moon, clouds, mountains, hills, water, forests, meadows,
   deserts, beaches, snow, wetlands, reefs) into a unique scene per place. Free — no image gen. */
const W = 1200, H = 600;
const rnd = (a, b) => a + Math.random() * (b - a);
const spread = (n, x0, x1) => { const o = []; for (let i = 0; i < n; i++) o.push(x0 + (x1 - x0) * ((i + 0.5) / n) + rnd(-24, 24)); return o; };
function toRGB(c) { if (!c) return [130, 140, 150]; let m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.exec(c); if (m) return [+m[1], +m[2], +m[3]]; m = /#?([0-9a-f]{6})/i.exec(c); if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; } return [130, 140, 150]; }
function mix(a, b, t) { const x = toRGB(a), y = toRGB(b); return `rgb(${Math.round(x[0] + (y[0] - x[0]) * t)},${Math.round(x[1] + (y[1] - x[1]) * t)},${Math.round(x[2] + (y[2] - x[2]) * t)})`; }
function shade(c, f) { const x = toRGB(c); return `rgb(${Math.max(0, Math.min(255, Math.round(x[0] * f)))},${Math.max(0, Math.min(255, Math.round(x[1] * f)))},${Math.max(0, Math.min(255, Math.round(x[2] * f)))})`; }

export function buildSpec(info, desc) {
  const d = (desc || '').toLowerCase(); const pal = (info && info.palette) || []; const dom = pal[0] || 'rgb(120,140,150)';
  const has = (...k) => k.some((x) => d.includes(x));
  const feat = new Set();
  if (has('mountain', 'peak', 'ridge', 'alps', 'cliff', 'summit')) feat.add('mountains');
  if (has('snow', 'glacier', 'winter', 'snowy', 'frost')) feat.add('snow');
  if (has('cloud', 'overcast', 'misty', 'fog', 'cloudy')) feat.add('clouds');
  if (has('lake', 'pond', 'river', 'waterfall', 'stream', 'water', 'sea', 'ocean', 'coast', 'beach', 'shore', 'bay')) feat.add('water');
  if (has('beach', 'shore', 'coast', 'sand', 'dune bay')) feat.add('beach');
  if (has('desert', 'dune', 'cactus', 'arid', 'canyon')) feat.add('desert');
  if (has('forest', 'wood', 'tree', 'jungle', 'pine', 'trail')) feat.add('forest');
  if (has('meadow', 'field', 'grass', 'flower', 'prairie', 'garden', 'valley')) feat.add('meadow');
  if (has('wetland', 'marsh', 'swamp', 'reed', 'lily', 'bog')) feat.add('wetland');
  const underwater = has('reef', 'coral', 'underwater', 'under the sea', 'kelp forest', 'seafloor');
  const night = has('night', 'stars', 'moon', 'nocturnal');
  const sunset = has('sunset', 'sunrise', 'dawn', 'dusk', 'golden hour');
  if (!feat.size && !underwater) { if (info && info.scene === 'water') feat.add('water'); else if (info && info.scene === 'land') feat.add('forest'); else feat.add('meadow'); }
  return { feat, underwater, night, sunset, dom, pal, horizon: Math.max(0.4, Math.min(0.68, (info && info.horizon) || 0.56)) };
}

export function primaryBiome(spec) {
  if (spec.underwater) return 'reef';
  if (spec.feat.has('wetland')) return 'wetland';
  if (spec.feat.has('meadow') && !spec.feat.has('forest') && !spec.feat.has('mountains')) return 'meadow';
  if (spec.feat.has('water') && !spec.feat.has('forest') && !spec.feat.has('mountains') && !spec.feat.has('desert')) return 'wetland';
  return 'forest';
}
export function allowedBiomes(spec) {
  const s = new Set([primaryBiome(spec)]);
  if (spec.underwater) { s.add('reef'); s.add('ocean'); }
  if (spec.feat.has('water')) { s.add('wetland'); if (spec.feat.has('beach') || spec.feat.has('reef')) { s.add('reef'); s.add('ocean'); } }
  if (spec.feat.has('meadow')) s.add('meadow');
  if (spec.feat.has('forest') || spec.feat.has('mountains')) s.add('forest');
  return s;
}

// ---- element builders ----
function sun(x, y, warm) { const c = warm ? '#f6c26b' : '#fdf3d4'; return `<g class="scene-sun" style="--o1:.55;--o2:.85;--dur:8s"><circle cx="${x}" cy="${y}" r="58" fill="${c}"/><circle cx="${x}" cy="${y}" r="86" fill="${c}" opacity=".4"/></g>`; }
function moon(x, y) { let s = `<g class="scene-sun" style="--o1:.7;--o2:.95;--dur:9s"><circle cx="${x}" cy="${y}" r="44" fill="#eef3f7"/><circle cx="${x + 16}" cy="${y - 8}" r="44" fill="#dfe7ef" opacity=".0"/></g>`; for (let i = 0; i < 26; i++) s += `<circle cx="${rnd(40, W - 40)}" cy="${rnd(20, H * 0.5)}" r="${rnd(0.8, 2)}" fill="#eef3f7" opacity="${rnd(.4, .9).toFixed(2)}"/>`; return s; }
function cloud(x, y, s) { return `<g class="scene-cloud" style="--amp:${rnd(18, 40).toFixed(0)}px;--dur:${rnd(44, 74).toFixed(0)}s;--delay:${rnd(-30, 0).toFixed(0)}s"><ellipse cx="${x}" cy="${y}" rx="${52 * s}" ry="${20 * s}" fill="#fdfbf2" opacity=".92"/><ellipse cx="${x - 30 * s}" cy="${y + 4 * s}" rx="${30 * s}" ry="${16 * s}" fill="#fdfbf2" opacity=".85"/><ellipse cx="${x + 30 * s}" cy="${y + 5 * s}" rx="${28 * s}" ry="${15 * s}" fill="#fbf6ea" opacity=".8"/></g>`; }
function ridge(baseY, amp, step, fill) { let p = `M0 ${baseY} `; let up = true; for (let x = 0; x <= W; x += step) { const y = baseY - Math.abs(Math.sin(x * 0.9)) * 0 - (up ? amp * rnd(.7, 1) : amp * rnd(.2, .45)); p += `L${x} ${(baseY - (up ? amp * rnd(.75, 1.05) : amp * rnd(.2, .5))).toFixed(0)} `; up = !up; } p += `L${W} ${baseY} Z`; return `<path d="${p}" fill="${fill}"/>`; }
function mountains(horizonY, snow, base) {
  let g = '';
  g += ridge(horizonY - 30, 150, 150, mix(base, '#8fa6b8', .5));      // far
  g += ridge(horizonY - 6, 210, 190, mix(base, '#5f7a8e', .35));      // mid
  const near = mix(base, '#40586a', .3);
  g += ridge(horizonY + 18, 250, 240, near);                          // near
  if (snow) { // snow caps on near peaks
    for (const x of [180, 470, 760, 1030]) g += `<path d="M${x - 46} ${horizonY - 150} L${x} ${horizonY - 232} L${x + 46} ${horizonY - 150} L${x + 22} ${horizonY - 158} L${x} ${horizonY - 196} L${x - 22} ${horizonY - 158} Z" fill="#f4f8fb" opacity=".92"/>`; }
  return g;
}
function hills(baseY, c1, c2) { return `<path d="M0 ${baseY} Q300 ${baseY - 44} 600 ${baseY - 14} T1200 ${baseY - 20} V600 H0 Z" fill="${c1}" opacity=".6"/><path d="M0 ${baseY + 34} Q360 ${baseY - 8} 760 ${baseY + 26} T1200 ${baseY + 20} V600 H0 Z" fill="${c2}" opacity=".9"/>`; }
function waterPlane(y, c) { let g = `<rect y="${y}" width="${W}" height="${H - y}" fill="${c}"/>`; g += `<g class="scene-caustic" style="--amp:30px;--dur:15s" stroke="#ffffff" stroke-width="3" fill="none" opacity=".2" stroke-linecap="round">`; for (let i = 0; i < 4; i++) { const yy = y + 26 + i * 40; g += `<path d="M${rnd(60, 200)} ${yy} q120 ${rnd(-10, 10)} 240 0 q120 ${rnd(-10, 10)} 240 0"/>`; } return g + '</g>'; }
function ground(y, c1, c2) { return `<path d="M0 ${y} Q360 ${y - 26} 760 ${y + 6} T1200 ${y} V600 H0 Z" fill="${c1}"/><path d="M0 ${y + 30} Q400 ${y + 8} 820 ${y + 30} T1200 ${y + 26} V600 H0 Z" fill="${c2}"/>`; }
function pine(x, gy, s) { const c1 = '#33603c', c2 = '#28503010'; return `<g><rect x="${x - 3 * s}" y="${gy - 20 * s}" width="${6 * s}" height="${22 * s}" fill="#5b4029"/><path d="M${x} ${gy - 96 * s} L${x - 26 * s} ${gy - 40 * s} L${x + 26 * s} ${gy - 40 * s} Z" fill="${c1}"/><path d="M${x} ${gy - 70 * s} L${x - 30 * s} ${gy - 18 * s} L${x + 30 * s} ${gy - 18 * s} Z" fill="#3c6f45"/></g>`; }
function tree(x, gy, s) { const cy = gy - 70 * s; const b = (dx, dy, r, f) => `<ellipse cx="${x + dx}" cy="${cy + dy}" rx="${r * s}" ry="${r * 0.9 * s}" fill="${f}"/>`; return `<g><rect x="${x - 5 * s}" y="${gy - 66 * s}" width="${10 * s}" height="${66 * s}" rx="${5 * s}" fill="#5b4029"/>${b(0, -4, 42, '#34603a')}${b(-20, 4, 30, '#4c8049')}${b(20, 6, 27, '#5d9456')}${b(0, -16, 26, '#6fa863')}</g>`; }
function cactus(x, gy, s) { return `<g fill="#4f8a52"><rect x="${x - 7 * s}" y="${gy - 70 * s}" width="${14 * s}" height="${70 * s}" rx="${7 * s}"/><rect x="${x - 26 * s}" y="${gy - 50 * s}" width="${10 * s}" height="${26 * s}" rx="${5 * s}"/><rect x="${x - 26 * s}" y="${gy - 50 * s}" width="${20 * s}" height="${10 * s}" rx="${5 * s}"/><rect x="${x + 16 * s}" y="${gy - 58 * s}" width="${10 * s}" height="${30 * s}" rx="${5 * s}"/><rect x="${x + 6 * s}" y="${gy - 58 * s}" width="${20 * s}" height="${10 * s}" rx="${5 * s}"/></g>`; }
function reed(x, by, s) { return `<g class="scene-rooted" style="--deg:3deg;--dur:${rnd(5, 8).toFixed(1)}s" stroke-linecap="round"><path d="M${x} ${by} q${-3 * s} ${-40 * s} ${-2 * s} ${-90 * s}" stroke="#5d8a4a" stroke-width="${4 * s}" fill="none"/><ellipse cx="${x - 2 * s}" cy="${by - 90 * s}" rx="${5 * s}" ry="${15 * s}" fill="#7a5230"/></g>`; }
function flower(x, gy, s, c) { return `<g class="scene-rooted" style="--deg:2.5deg;--dur:${rnd(4, 7).toFixed(1)}s"><rect x="${x - 1.4 * s}" y="${gy - 28 * s}" width="${2.8 * s}" height="${28 * s}" fill="#4c8049"/><circle cx="${x}" cy="${gy - 30 * s}" r="${6 * s}" fill="${c}"/><circle cx="${x}" cy="${gy - 30 * s}" r="${2.6 * s}" fill="#f3d24e"/></g>`; }
function grass(x, gy, s) { return `<g stroke="#4c8049" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"><path d="M${x} ${gy} q${-4 * s} ${-16 * s} ${-10 * s} ${-24 * s}"/><path d="M${x} ${gy} q0 ${-18 * s} 0 ${-26 * s}"/><path d="M${x} ${gy} q${4 * s} ${-16 * s} ${10 * s} ${-24 * s}"/></g>`; }
function rays() { let r = '<g class="scene-rays" style="--o1:.4;--o2:.7;--dur:11s">'; for (const [x, w] of [[160, 150], [470, 200], [820, 170], [1080, 130]]) r += `<polygon points="${x},-20 ${x + w},-20 ${x + w * 1.7},620 ${x + w * 0.7},620" fill="#ffffff" opacity=".14"/>`; return r + '</g>'; }
function coral(x, gy, s, c1, c2) { const lobe = (dx, h, w, f) => `<path d="M${x + dx} ${gy} q${-w} ${-h} 0 ${-h * 1.25} q${w} ${h * 0.25} 0 ${h * 1.25} Z" fill="${f}"/>`; return `<g class="scene-rooted" style="--deg:1.6deg;--dur:${rnd(6, 9).toFixed(1)}s">${lobe(-16 * s, 60 * s, 15 * s, c2)}${lobe(14 * s, 54 * s, 14 * s, c2)}${lobe(-2 * s, 80 * s, 17 * s, c1)}</g>`; }
function kelp(x, by, s) { return `<g class="scene-rooted" style="--deg:5deg;--dur:${rnd(7, 11).toFixed(1)}s"><path d="M${x} ${by} q${-28 * s} ${-110 * s} ${6 * s} ${-220 * s} q${28 * s} ${-90 * s} ${-4 * s} ${-200 * s}" stroke="#3c7a5a" stroke-width="${10 * s}" fill="none" stroke-linecap="round" opacity=".6"/></g>`; }
function particlesLayer(kind) { let g = ''; for (let i = 0; i < 8; i++) g += `<circle class="scene-cloud" cx="${rnd(0, W)}" cy="${rnd(60, 520)}" r="${kind === 'snow' ? rnd(2, 4) : rnd(1.5, 3)}" fill="${kind === 'snow' ? '#ffffff' : 'rgba(255,240,200,.7)'}" style="--amp:${rnd(20, 60)}px;--dur:${rnd(10, 22)}s"/>`; return g; }

const SVG = (defs, body) => `<svg class="scene-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
const lg = (id, a, b, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/>${c ? `<stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/>` : `<stop offset="1" stop-color="${b}"/>`}</linearGradient>`;

export function composeScene(spec) {
  const dom = spec.dom;
  if (spec.underwater) {
    const defs = lg('uw', mix('#bfe3ea', dom, .18), mix('#4f93a8', dom, .25), mix('#245b71', dom, .2)) + lg('us', mix('#ece1c2', dom, .12), mix('#cdbf97', dom, .18));
    let b = `<rect width="${W}" height="${H}" fill="url(#uw)"/>` + rays();
    b += `<path d="M0 470 Q300 430 640 466 T1200 458 V600 H0 Z" fill="${mix('#3f7d8c', dom, .2)}" opacity=".5"/>`;
    b += `<path d="M0 510 Q360 476 760 506 T1200 500 V600 H0 Z" fill="url(#us)"/>`;
    b += kelp(80, 600, 1) + kelp(1130, 600, .9);
    const cc = [['#e08a6a', '#c96f52'], ['#d98f4a', '#bd7636'], ['#c96f8e', '#aa5573'], ['#8e7bb0', '#6f5e96']];
    spread(6, 90, 1110).forEach((x, i) => { b += coral(x, rnd(560, 588), rnd(.85, 1.2), cc[i % 4][0], cc[i % 4][1]); });
    return SVG(defs, b);
  }
  const horizonY = H * spec.horizon;
  let skyA, skyB;
  if (spec.night) { skyA = mix('#1c2b45', dom, .18); skyB = mix('#33465f', dom, .2); }
  else if (spec.sunset) { skyA = mix('#f2cf92', dom, .22); skyB = mix('#e79a6b', dom, .3); }
  else { skyA = mix('#cfe3ef', dom, .16); skyB = mix('#e9eef0', dom, .24); }
  const defs = lg('sky', skyA, skyB);
  let b = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  b += spec.night ? moon(rnd(820, 1040), rnd(90, 150)) : sun(spec.sunset ? rnd(760, 1000) : rnd(200, 1000), rnd(90, 150), spec.sunset);
  if (spec.feat.has('clouds') || (!spec.feat.has('desert') && !spec.night)) { spread(spec.feat.has('clouds') ? 4 : 2, 120, 1080).forEach((x) => { b += cloud(x, rnd(70, 160), rnd(.7, 1.1)); }); }
  // distant terrain
  if (spec.feat.has('mountains')) b += mountains(horizonY, spec.feat.has('snow'), dom);
  else b += hills(horizonY, mix('#a7c6bb', dom, .3), mix('#86b187', dom, .25));
  // ground vs water
  if (spec.feat.has('water')) {
    const wc = spec.feat.has('beach') ? mix('#7fc0cf', dom, .2) : mix('#5f9fb2', dom, .22);
    b += waterPlane(horizonY + 6, wc);
    if (spec.feat.has('beach')) b += `<path d="M0 ${horizonY - 6} Q300 ${horizonY - 20} 700 ${horizonY} T1200 ${horizonY - 8} V${horizonY + 40} H0 Z" fill="${mix('#e6d6ad', dom, .2)}"/>`;
  } else {
    let g1, g2;
    if (spec.feat.has('snow')) { g1 = '#eef3f7'; g2 = '#dde6ec'; }
    else if (spec.feat.has('desert')) { g1 = mix('#e3c489', dom, .2); g2 = mix('#cda869', dom, .25); }
    else { g1 = mix('#6f9a55', dom, .18); g2 = mix('#4d7a42', dom, .18); }
    b += ground(horizonY + 8, g1, g2);
  }
  // foreground detail
  if (spec.feat.has('desert')) { spread(4, 120, 1080).forEach((x) => { b += cactus(x, rnd(576, 596), rnd(.8, 1.2)); }); }
  if (spec.feat.has('forest') || spec.feat.has('mountains')) { spread(spec.feat.has('mountains') ? 6 : 4, 60, 1140).forEach((x) => { b += (spec.feat.has('mountains') ? pine(x, rnd(582, 600), rnd(.9, 1.4)) : tree(x, rnd(582, 600), rnd(.95, 1.35))); }); }
  if (spec.feat.has('meadow') && !spec.feat.has('water')) { const cols = ['#e0698f', '#e8a23c', '#7b6fb0', '#d65b5b', '#f0d24e']; spread(9, 50, 1150).forEach((x, i) => { b += flower(x, rnd(560, 596), rnd(.8, 1.2), cols[i % 5]); }); spread(8, 40, 1160).forEach((x) => { b += grass(x, rnd(584, 600), rnd(.7, 1.0)); }); }
  if (spec.feat.has('wetland')) { spread(5, 60, 1140).forEach((x) => { b += reed(x, rnd(horizonY + 30, horizonY + 70), rnd(.85, 1.2)); }); }
  if (spec.night) b += particlesLayer('firefly');
  if (spec.feat.has('snow')) b += particlesLayer('snow');
  return SVG(defs, b);
}
