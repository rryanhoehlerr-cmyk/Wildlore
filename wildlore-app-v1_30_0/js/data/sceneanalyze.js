/* Lightweight, on-device photo analysis for personalized habitats.
   No AI segmentation (which is slow and uncanny) — instead we read the photo's *soul*:
   its colour palette, its horizon/water line, and whether the lower scene reads as water or land.
   The photo becomes a softened backdrop; the app's own illustrated creatures are the stage. */
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

export async function analyzePhoto(dataUrl) {
  const img = await loadImg(dataUrl);
  const iw = img.naturalWidth || 1200, ih = img.naturalHeight || 800;
  // downscaled, compressed copy for storage + display
  const maxW = 1280; const scale = Math.min(1, maxW / iw);
  const w = Math.round(iw * scale), h = Math.round(ih * scale);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  let downscaled; try { downscaled = c.toDataURL('image/jpeg', 0.82); } catch (_) { downscaled = dataUrl; }
  // small sample for analysis
  const sw = 64, sh = Math.max(20, Math.round(64 * ih / iw));
  const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
  const sx = sc.getContext('2d'); sx.drawImage(img, 0, 0, sw, sh);
  let data; try { data = sx.getImageData(0, 0, sw, sh).data; } catch (_) { return { downscaled, palette: ['#3a5a52'], horizon: 0.45, water: false, scene: 'land' }; }
  // dominant palette via coarse quantization
  const buckets = {};
  for (let i = 0; i < data.length; i += 4) { const r = data[i], g = data[i + 1], b = data[i + 2]; const k = (r >> 5) + '-' + (g >> 5) + '-' + (b >> 5); const o = buckets[k] || (buckets[k] = { n: 0, r: 0, g: 0, b: 0 }); o.n++; o.r += r; o.g += g; o.b += b; }
  const palette = Object.values(buckets).sort((a, b) => b.n - a.n).slice(0, 5).map((o) => `rgb(${Math.round(o.r / o.n)},${Math.round(o.g / o.n)},${Math.round(o.b / o.n)})`);
  // per-row average → find horizon (largest vertical colour shift) + classify lower zone
  const rows = [];
  for (let y = 0; y < sh; y++) { let r = 0, g = 0, b = 0; for (let x = 0; x < sw; x++) { const i = (y * sw + x) * 4; r += data[i]; g += data[i + 1]; b += data[i + 2]; } rows.push({ r: r / sw, g: g / sw, b: b / sw }); }
  let horizon = 0.45, best = -1;
  for (let y = 2; y < sh - 2; y++) { const d = Math.abs(rows[y].b - rows[y - 2].b) + Math.abs(rows[y].g - rows[y - 2].g) + Math.abs(rows[y].r - rows[y - 2].r); if (d > best) { best = d; horizon = y / sh; } }
  horizon = Math.max(0.22, Math.min(0.7, horizon));
  const lower = rows.slice(Math.floor(sh * 0.6)); const n = lower.length || 1;
  const lr = lower.reduce((a, o) => a + o.r, 0) / n, lg = lower.reduce((a, o) => a + o.g, 0) / n, lb = lower.reduce((a, o) => a + o.b, 0) / n;
  const water = lb > lr + 6 && lb > lg - 6;
  const green = lg > lr + 6 && lg > lb + 2;
  const scene = water ? 'water' : green ? 'land' : 'open';
  return { downscaled, palette, horizon, water, scene };
}
