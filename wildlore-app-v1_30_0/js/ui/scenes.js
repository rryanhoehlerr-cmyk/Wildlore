/* Hand-built flat-design biome backdrops, now alive: drifting clouds, gliding birds, shimmering
   light shafts, slow water caustics, swaying foliage and kelp. Layered for depth (far hills → mid
   foliage → foreground), cohesive palettes, two-tone shading. Detail and life grow with the
   collection. All motion is gentle and respects prefers-reduced-motion (disabled in CSS). */
const W = 1200, H = 600;
const rnd = (a, b) => a + Math.random() * (b - a);
const clampN = (min, max, v) => Math.max(min, Math.min(max, v));
const spread = (n, x0, x1) => { const o = []; for (let i = 0; i < n; i++) o.push(x0 + (x1 - x0) * ((i + 0.5) / n) + rnd(-22, 22)); return o; };

// ---- foreground / scenery builders ----
function tree(x, gy, s) {
  const tw = 13 * s, th = 78 * s, cy = gy - th;
  const blob = (dx, dy, rx, ry, f) => `<ellipse cx="${(x + dx).toFixed(1)}" cy="${(cy + dy).toFixed(1)}" rx="${(rx * s).toFixed(1)}" ry="${(ry * s).toFixed(1)}" fill="${f}"/>`;
  return `<g><rect x="${(x - tw / 2).toFixed(1)}" y="${(gy - th).toFixed(1)}" width="${tw.toFixed(1)}" height="${th.toFixed(1)}" rx="${(tw / 2).toFixed(1)}" fill="#5b4029"/>`
    + blob(2, -6, 50, 44, '#34603a') + blob(-24, 4, 36, 32, '#3f6f40') + blob(24, 8, 32, 30, '#4c8049') + blob(0, -22, 34, 30, '#5d9456') + blob(-10, -8, 22, 20, '#6fa863') + `</g>`;
}
function bush(x, gy, s) { return `<g><ellipse cx="${x}" cy="${gy}" rx="${44 * s}" ry="${26 * s}" fill="#3f6f3e"/><ellipse cx="${x - 16 * s}" cy="${gy - 6 * s}" rx="${26 * s}" ry="${20 * s}" fill="#4c8049"/><ellipse cx="${x + 14 * s}" cy="${gy - 3 * s}" rx="${24 * s}" ry="${18 * s}" fill="#598c52"/></g>`; }
function rock(x, gy, s) { return `<g><path d="M${x - 34 * s} ${gy} q${6 * s} ${-30 * s} ${34 * s} ${-30 * s} q${30 * s} 0 ${36 * s} ${30 * s} Z" fill="#8a8475"/><path d="M${x - 34 * s} ${gy} q${6 * s} ${-30 * s} ${34 * s} ${-30 * s} q${4 * s} ${10 * s} ${-10 * s} ${16 * s} q${-18 * s} ${6 * s} ${-24 * s} ${14 * s} Z" fill="#a39c8b"/></g>`; }
function fern(x, gy, s) { let f = `<g class="scene-rooted" style="--deg:4deg;--dur:${rnd(5, 8).toFixed(1)}s;--delay:${rnd(-4, 0).toFixed(1)}s" stroke="#3f6f3e" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round">`; for (let i = -2; i <= 2; i++) f += `<path d="M${x} ${gy} q${i * 22 * s} ${-30 * s} ${i * 30 * s} ${-66 * s}"/>`; return f + `</g>`; }
function log(x, gy, s) { return `<g><rect x="${x - 60 * s}" y="${gy - 20 * s}" width="${120 * s}" height="${24 * s}" rx="${12 * s}" fill="#6b4a31"/><ellipse cx="${x - 60 * s}" cy="${gy - 8 * s}" rx="${10 * s}" ry="${12 * s}" fill="#8a6240"/><circle cx="${x - 60 * s}" cy="${gy - 8 * s}" r="${5 * s}" fill="#6b4a31"/></g>`; }
function flower(x, gy, s, c) { const p = (a) => `<ellipse cx="${(x + Math.cos(a) * 7 * s).toFixed(1)}" cy="${(gy - 30 * s + Math.sin(a) * 7 * s).toFixed(1)}" rx="${5 * s}" ry="${7 * s}" fill="${c}" transform="rotate(${(a * 57).toFixed(0)} ${x} ${(gy - 30 * s).toFixed(1)})"/>`; return `<g class="scene-rooted" style="--deg:2.5deg;--dur:${rnd(4, 7).toFixed(1)}s;--delay:${rnd(-4, 0).toFixed(1)}s"><rect x="${(x - 1.4 * s).toFixed(1)}" y="${(gy - 30 * s).toFixed(1)}" width="${2.8 * s}" height="${30 * s}" fill="#4c8049"/>${p(0)}${p(1.25)}${p(2.5)}${p(3.77)}${p(5.02)}<circle cx="${x}" cy="${gy - 30 * s}" r="${4 * s}" fill="#f3d24e"/></g>`; }
function grassTuft(x, gy, s) { return `<g stroke="#4c8049" stroke-width="${2.6 * s}" fill="none" stroke-linecap="round"><path d="M${x} ${gy} q${-4 * s} ${-18 * s} ${-12 * s} ${-26 * s}"/><path d="M${x} ${gy} q0 ${-20 * s} 0 ${-30 * s}"/><path d="M${x} ${gy} q${4 * s} ${-18 * s} ${12 * s} ${-26 * s}"/></g>`; }
function reed(x, by, s) { return `<g class="scene-rooted" style="--deg:3deg;--dur:${rnd(5, 8).toFixed(1)}s;--delay:${rnd(-4, 0).toFixed(1)}s" stroke-linecap="round"><path d="M${x} ${by} q${-3 * s} ${-40 * s} ${-2 * s} ${-92 * s}" stroke="#5d8a4a" stroke-width="${4 * s}" fill="none"/><path d="M${x + 6 * s} ${by} q${2 * s} ${-44 * s} ${5 * s} ${-86 * s}" stroke="#6f9a55" stroke-width="${4 * s}" fill="none"/><ellipse cx="${x - 2 * s}" cy="${by - 92 * s}" rx="${5 * s}" ry="${16 * s}" fill="#7a5230"/></g>`; }
function lily(x, y, s) { return `<g><path d="M${x} ${y} a${24 * s} ${10 * s} 0 1 0 ${0.1} 0 Z" fill="#4c8049"/><path d="M${x} ${y} l${22 * s} ${-2 * s}" stroke="#3f6f3e" stroke-width="2"/><ellipse cx="${x - 6 * s}" cy="${y - 4 * s}" rx="${4 * s}" ry="${5 * s}" fill="#e89ab8"/></g>`; }
function coral(x, gy, s, c1, c2) { const lobe = (dx, h, w, f) => `<path d="M${x + dx} ${gy} q${-w} ${-h} 0 ${-h * 1.25} q${w} ${h * 0.25} 0 ${h * 1.25} Z" fill="${f}"/>`; return `<g class="scene-rooted" style="--deg:1.6deg;--dur:${rnd(6, 9).toFixed(1)}s;--delay:${rnd(-5, 0).toFixed(1)}s">${lobe(-18 * s, 64 * s, 16 * s, c2)}${lobe(16 * s, 58 * s, 15 * s, c2)}${lobe(-2 * s, 84 * s, 18 * s, c1)}${lobe(-30 * s, 44 * s, 13 * s, c1)}${lobe(30 * s, 48 * s, 13 * s, c2)}<circle cx="${x - 2 * s}" cy="${gy - 84 * s}" r="${5 * s}" fill="${c1}"/></g>`; }
function seafan(x, gy, s, c) { let f = `<g class="scene-rooted" style="--deg:2.4deg;--dur:${rnd(6, 9).toFixed(1)}s" stroke="${c}" stroke-width="${3 * s}" fill="none" stroke-linecap="round">`; for (let i = -3; i <= 3; i++) f += `<path d="M${x} ${gy} q${i * 14 * s} ${-40 * s} ${i * 20 * s} ${-78 * s}"/>`; return f + `</g>`; }
function anemone(x, gy, s, c) { let f = `<g class="scene-rooted" style="--deg:3deg;--dur:${rnd(4, 7).toFixed(1)}s">`; for (let i = -4; i <= 4; i++) f += `<path d="M${x} ${gy} q${i * 6 * s} ${-26 * s} ${i * 9 * s} ${-40 * s}" stroke="${c}" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`; return f + `<ellipse cx="${x}" cy="${gy}" rx="${20 * s}" ry="${8 * s}" fill="${c}" opacity=".55"/></g>`; }
function kelp(x, by, s) { return `<g class="scene-rooted" style="--deg:5deg;--dur:${rnd(7, 11).toFixed(1)}s;--delay:${rnd(-5, 0).toFixed(1)}s"><path d="M${x} ${by} q${-30 * s} ${-110 * s} ${6 * s} ${-220 * s} q${30 * s} ${-90 * s} ${-4 * s} ${-200 * s}" stroke="#3c7a5a" stroke-width="${10 * s}" fill="none" stroke-linecap="round" opacity=".6"/></g>`; }
function cloud(x, y, s) { return `<g class="scene-cloud" style="--amp:${rnd(18, 40).toFixed(0)}px;--dur:${rnd(40, 70).toFixed(0)}s;--delay:${rnd(-30, 0).toFixed(0)}s"><ellipse cx="${x}" cy="${y}" rx="${52 * s}" ry="${20 * s}" fill="#fdfbf2" opacity=".9"/><ellipse cx="${x - 30 * s}" cy="${y + 4 * s}" rx="${30 * s}" ry="${16 * s}" fill="#fdfbf2" opacity=".85"/><ellipse cx="${x + 30 * s}" cy="${y + 5 * s}" rx="${28 * s}" ry="${15 * s}" fill="#fdfbf2" opacity=".8"/></g>`; }
function bird(x, y, s) { return `<g class="scene-bird" style="--amp:${rnd(30, 70).toFixed(0)}px;--dur:${rnd(26, 44).toFixed(0)}s;--delay:${rnd(-20, 0).toFixed(0)}s" stroke="#4a5a66" stroke-width="${2 * s}" fill="none" stroke-linecap="round" opacity=".5"><path d="M${x} ${y} q${5 * s} ${-5 * s} ${10 * s} 0 q${5 * s} ${-5 * s} ${10 * s} 0"/></g>`; }
function rays(o1, o2) { let r = `<g class="scene-rays" style="--o1:${o1};--o2:${o2};--dur:${rnd(8, 13).toFixed(0)}s">`; for (const [x, w, o] of [[160, 150, 1], [470, 200, .8], [820, 170, .9], [1080, 130, .7]]) r += `<polygon points="${x},-20 ${x + w},-20 ${x + w * 1.7},620 ${x + w * 0.7},620" fill="#ffffff" opacity="${(o * 0.18).toFixed(3)}"/>`; return r + '</g>'; }
function caustics(yTop) { let g = `<g class="scene-caustic" style="--amp:34px;--dur:${rnd(12, 18).toFixed(0)}s" stroke="#ffffff" stroke-width="3" fill="none" opacity=".22" stroke-linecap="round">`; for (let i = 0; i < 5; i++) { const y = yTop + 30 + i * 46 + rnd(-8, 8); g += `<path d="M${rnd(60, 200)} ${y} q120 ${rnd(-12, 12)} 240 0 q120 ${rnd(-12, 12)} 240 0"/>`; } return g + '</g>'; }
function school(x, y, n, c) { let s = '<g opacity=".4">'; for (let i = 0; i < n; i++) { const px = x + (i % 5) * 26 + rnd(-6, 6), py = y + Math.floor(i / 5) * 18 + rnd(-5, 5); s += `<path d="M${px} ${py} q10 -6 20 0 q-6 4 0 8 q-12 4 -20 0 Z" fill="${c}"/>`; } return s + '</g>'; }

const SVG = (defs, body) => `<svg class="scene-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
const lg = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

export function backdrop(biome, count) {
  const c = count || 0;
  if (biome === 'forest') {
    const defs = lg('fk', '#cfe2e6', '#e3eed9') + lg('fg', '#6f9a55', '#49773f');
    let b = `<rect width="${W}" height="${H}" fill="url(#fk)"/>`;
    b += `<g class="scene-sun" style="--o1:.45;--o2:.7;--dur:8s"><circle cx="980" cy="120" r="78" fill="#fdf6df"/><circle cx="980" cy="120" r="108" fill="#fdf6df" opacity=".4"/></g>`;
    b += cloud(260, 110, 1) + cloud(620, 80, 0.8) + cloud(900, 150, 0.7);
    b += bird(360, 150, 1) + bird(420, 138, 0.9) + bird(700, 120, 1);
    b += `<path d="M0 360 Q300 300 600 350 T1200 340 V600 H0 Z" fill="#a7c6bb" opacity=".5"/>`;
    b += `<path d="M0 410 Q360 350 720 400 T1200 395 V600 H0 Z" fill="#86b187" opacity=".85"/>`;
    b += spread(8, 40, 1160).map((x) => `<g opacity=".9">${tree(x, 430, 0.42)}</g>`).join('');
    b += `<path d="M0 452 Q400 420 800 452 T1200 450 V600 H0 Z" fill="url(#fg)"/>`;
    if (c >= 2) b += `<path d="M-20 560 Q300 520 560 552 Q820 584 1220 540 L1220 600 -20 600 Z" fill="#b9d8dc" opacity=".85"/>`;
    if (c >= 6) b += log(300, 588, 1.0);
    if (c >= 3) b += rock(940, 590, 1.15) + rock(150, 592, 0.9);
    b += spread(clampN(2, 5, 1 + Math.floor(c / 2)), 120, 1080).map((x) => bush(x, 575, rnd(0.85, 1.2))).join('');
    b += spread(clampN(2, 5, 2 + Math.floor(c / 3)), 70, 1130).map((x) => tree(x, 600, rnd(0.95, 1.35))).join('');
    b += spread(4, 80, 1120).map((x) => fern(x, 596, rnd(0.7, 1.0))).join('');
    return SVG(defs, b);
  }
  if (biome === 'meadow') {
    const cols = ['#e0698f', '#e8a23c', '#7b6fb0', '#d65b5b', '#f0d24e'];
    const defs = lg('mk', '#d7e9ee', '#eef4de') + lg('mg', '#9cc06a', '#76a44e');
    let b = `<rect width="${W}" height="${H}" fill="url(#mk)"/>`;
    b += `<g class="scene-sun" style="--o1:.7;--o2:.95;--dur:7s"><circle cx="220" cy="130" r="58" fill="#fdeec2"/><circle cx="220" cy="130" r="88" fill="#fdeec2" opacity=".35"/></g>`;
    b += cloud(520, 95, 0.9) + cloud(860, 130, 0.8) + cloud(1040, 80, 0.7);
    b += bird(620, 150, 1) + bird(680, 140, 0.9) + bird(360, 175, 0.9);
    b += `<path d="M0 380 Q300 330 620 372 T1200 360 V600 H0 Z" fill="#bcd6a4" opacity=".6"/>`;
    b += spread(6, 60, 1140).map((x) => `<g opacity=".85">${tree(x, 400, 0.34)}</g>`).join('');
    b += `<path d="M0 430 Q380 392 760 426 T1200 420 V600 H0 Z" fill="url(#mg)"/>`;
    b += spread(clampN(4, 14, 4 + Math.floor(c * 1.2)), 50, 1150).map((x, i) => flower(x, rnd(560, 596), rnd(0.8, 1.25), cols[i % cols.length])).join('');
    b += spread(10, 40, 1160).map((x) => grassTuft(x, rnd(584, 600), rnd(0.7, 1.1))).join('');
    return SVG(defs, b);
  }
  if (biome === 'wetland') {
    const defs = lg('wk', '#cfe2e6', '#dfeede') + lg('ww', '#a4cbc6', '#6f9f9a');
    let b = `<rect width="${W}" height="${H}" fill="url(#wk)"/>`;
    b += cloud(360, 90, 0.8) + cloud(820, 70, 0.7);
    b += `<path d="M0 320 Q300 286 620 314 T1200 308 V430 H0 Z" fill="#a9c79f" opacity=".55"/>`;
    b += `<rect y="372" width="${W}" height="${H - 372}" fill="url(#ww)"/>`;
    b += caustics(380);
    b += `<path d="M0 372 Q260 352 520 372 Q360 388 0 392 Z" fill="#6f5a44" opacity=".9"/>`;
    b += spread(clampN(2, 5, 1 + Math.floor(c / 3)), 200, 1000).map((x) => lily(x, rnd(460, 540), rnd(0.9, 1.3))).join('');
    b += spread(clampN(3, 7, 2 + Math.floor(c / 2)), 60, 1140).map((x) => reed(x, rnd(396, 430), rnd(0.85, 1.25))).join('');
    return SVG(defs, b);
  }
  if (biome === 'reef') {
    const cc = [['#e08a6a', '#c96f52'], ['#d98f4a', '#bd7636'], ['#c96f8e', '#aa5573'], ['#8e7bb0', '#6f5e96']];
    const defs = lg('rw', '#bfe3ea', '#4f93a8') + lg('rs', '#ece1c2', '#cdbf97');
    let b = `<rect width="${W}" height="${H}" fill="url(#rw)"/>` + rays(.4, .7) + caustics(120);
    b += `<path d="M0 470 Q300 430 640 466 T1200 458 V600 H0 Z" fill="#3f7d8c" opacity=".5"/>`;
    b += `<path d="M0 510 Q360 476 760 506 T1200 500 V600 H0 Z" fill="url(#rs)"/>`;
    b += spread(4, 120, 1080).map((x) => `<g opacity=".4">${coral(x, 520, 0.6, '#7f9aa0', '#6f8a90')}</g>`).join('');
    b += kelp(80, 600, 1.0) + kelp(1130, 600, 0.9);
    if (c >= 3) b += anemone(980, 560, 1.0, '#c96f8e') + anemone(180, 566, 0.85, '#d98f4a');
    if (c >= 4) b += seafan(640, 560, 1.0, '#aa5573');
    b += spread(clampN(3, 7, 2 + Math.floor(c / 2)), 80, 1120).map((x, i) => coral(x, rnd(560, 588), rnd(0.85, 1.25), cc[i % cc.length][0], cc[i % cc.length][1])).join('');
    return SVG(defs, b);
  }
  // ocean
  const defs = `<linearGradient id="ok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcdae8"/><stop offset="0.4" stop-color="#5f93b4"/><stop offset="0.75" stop-color="#306e90"/><stop offset="1" stop-color="#1f4d6b"/></linearGradient>`;
  let b = `<rect width="${W}" height="${H}" fill="url(#ok)"/>` + rays(.45, .75) + caustics(60);
  b += school(220, 180, 9, '#d8eaf2') + school(760, 120, 7, '#cfe2ec');
  if (c >= 3) b += school(520, 360, 10, '#bcd6e2');
  b += kelp(60, 600, 1.2) + kelp(1140, 600, 1.1);
  b += `<path d="M0 560 Q360 536 760 558 T1200 552 V600 H0 Z" fill="#173f57" opacity=".8"/>`;
  return SVG(defs, b);
}
