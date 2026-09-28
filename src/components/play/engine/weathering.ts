/*
 * Procedural wear for the reader's painted surfaces — the look of the
 * reference: cream enamel over steel, chipped at the edges and around every
 * control, rust blooming out of the chips, grime streaking down from screws.
 *
 * One pass writes three maps that agree pixel for pixel:
 *   color      enamel / rust halo / bare steel
 *   roughness  enamel 0.5, rust 0.9, steel 0.35
 *   bump       chips sit below the paint, so edges catch light
 *
 * Deterministic (seeded) and CPU-only; generated once at load.
 */

import * as THREE from "three";

// ── value noise ─────────────────────────────────────────────────────────────

function makeNoise(seed: number) {
  const p = new Uint8Array(512);
  let s = seed >>> 0 || 1;
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const j = (s >>> 0) % (i + 1);
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  const v = (x: number, y: number) => p[(p[x & 255] + (y & 255)) & 511] / 255;
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const w = yf * yf * (3 - 2 * yf);
    const a = v(xi, yi);
    const b = v(xi + 1, yi);
    const c = v(xi, yi + 1);
    const d = v(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x: number, y: number, oct = 4) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let i = 0; i < oct; i++) {
      sum += noise(x * f, y * f) * amp;
      f *= 2.03;
      amp *= 0.5;
    }
    return sum / (1 - Math.pow(0.5, oct));
  };
  return { noise, fbm };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type WearSpot = { x: number; y: number; r: number; k?: number };

export type WearOpts = {
  w: number;
  h: number;
  seed: number;
  /** Paint colour. */
  paint: [number, number, number];
  /** How much wear overall, ~0.5 light … 1 heavy. */
  wear?: number;
  /** Edge band width as a fraction of the short side. */
  edge?: number;
  /** Extra wear around controls, in 0..1 UV. */
  spots?: WearSpot[];
  /** Drip streak strength. */
  streaks?: number;
};

export function weathered(o: WearOpts) {
  const { w: W, h: H } = o;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return [c, c.getContext("2d")!] as const;
  };
  const [colC, col] = mk();
  const [rouC, rou] = mk();
  const [bmpC, bmp] = mk();
  const cd = col.createImageData(W, H);
  const rd = rou.createImageData(W, H);
  const bd = bmp.createImageData(W, H);
  const { noise, fbm } = makeNoise(o.seed);
  const wear = o.wear ?? 0.75;
  const edgeW = o.edge ?? 0.06;
  const spots = o.spots ?? [];
  const streaks = o.streaks ?? 1;
  const [pr, pg, pb] = o.paint;
  const short = Math.min(W, H);
  const sc = 1024 / short; // keep feature size stable across resolutions

  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const i = (y * W + x) * 4;
      const X = x * sc;
      const Y = y * sc;

      // Edge proximity in short-side units.
      const ed = Math.min(x, W - 1 - x, y, H - 1 - y) / short;
      // The edge band is broken up by slow noise, so rust gathers in patches
      // along an edge rather than as an even outline.
      const patch = smooth(0.35, 0.75, noise(X * 0.006 + 13, Y * 0.006 + 29));
      let mask = (1 - smooth(0, edgeW, ed)) * (0.12 + 0.5 * patch);
      for (const s of spots) {
        const dx = (u - s.x) * (W / short);
        const dy = (v - s.y) * (H / short);
        const d = Math.sqrt(dx * dx + dy * dy);
        mask += (1 - smooth(s.r * 0.6, s.r * 1.6, d)) * 0.4 * (s.k ?? 1);
      }
      const chip = fbm(X * 0.011, Y * 0.011, 4) * 0.7 + noise(X * 0.09, Y * 0.09) * 0.3;
      const wv = chip + mask * wear - 0.74 + (wear - 0.75) * 0.25;

      const mottle = noise(X * 0.02 + 91, Y * 0.02) * 0.6 + noise(X * 0.2, Y * 0.2) * 0.4;
      // Grime: gathers low on the part and in the noise's valleys.
      const grime = fbm(X * 0.004 + 7, Y * 0.004 + 3, 3) * 0.5 + v * 0.35;
      // Drip streaks: noise stretched hard along Y.
      const st = fbm(X * 0.06 + 33, Y * 0.0035, 3);
      const streak = Math.max(0, st - 0.58) * 2.4 * streaks;

      let r: number, g: number, b: number, ro: number, bu: number;
      if (wv > 0.1) {
        // Bare steel, rusting from the middle of the chip out.
        const rust = fbm(X * 0.03 + 50, Y * 0.03 + 11, 3);
        const k = smooth(0.35, 0.7, rust);
        r = 70 + (150 - 70) * k;
        g = 62 + (72 - 62) * k;
        b = 56 + (30 - 56) * k;
        const pit = noise(X * 0.25, Y * 0.25);
        r *= 0.8 + pit * 0.35;
        g *= 0.8 + pit * 0.3;
        b *= 0.8 + pit * 0.3;
        ro = 0.45 + k * 0.45;
        bu = 0.18 + pit * 0.1;
      } else if (wv > 0.035) {
        // Rust halo creeping under the paint edge.
        const t = (wv - 0.035) / 0.065;
        r = 196 - 40 * t;
        g = 120 - 50 * t;
        b = 70 - 35 * t;
        ro = 0.8;
        bu = 0.75 - t * 0.3;
      } else {
        const m = 0.93 + mottle * 0.1;
        const gk = 1 - Math.max(0, grime - 0.55) * 0.45;
        r = pr * m * gk;
        g = pg * m * gk;
        b = pb * m * gk * 0.98;
        ro = 0.48 + mottle * 0.12 + Math.max(0, grime - 0.5) * 0.3;
        bu = 1;
      }
      // Streaks stain everything, rust-brown.
      if (streak > 0) {
        const s = Math.min(0.55, streak);
        r = r * (1 - s) + 110 * s;
        g = g * (1 - s) + 70 * s;
        b = b * (1 - s) + 40 * s;
        ro = Math.min(1, ro + s * 0.3);
      }
      cd.data[i] = r;
      cd.data[i + 1] = g;
      cd.data[i + 2] = b;
      cd.data[i + 3] = 255;
      const R = ro * 255;
      rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = R;
      rd.data[i + 3] = 255;
      const B = bu * 255;
      bd.data[i] = bd.data[i + 1] = bd.data[i + 2] = B;
      bd.data[i + 3] = 255;
    }
  }
  col.putImageData(cd, 0, 0);
  rou.putImageData(rd, 0, 0);
  bmp.putImageData(bd, 0, 0);
  return { W, H, colC, col, rouC, rou, bmpC, bmp, noise };
}

export type Wear = ReturnType<typeof weathered>;

/** A panel seam, engraved: dark groove, light lip, recessed in the bump map. */
export function seam(wr: Wear, pts: [number, number][], closed = false, width = 2) {
  const path = (ctx: CanvasRenderingContext2D, dx: number, dy: number) => {
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)));
    if (closed) ctx.closePath();
  };
  wr.col.lineWidth = width;
  wr.col.strokeStyle = "rgba(255,250,235,0.35)";
  path(wr.col, 1.2, 1.2);
  wr.col.stroke();
  wr.col.strokeStyle = "rgba(30,22,14,0.75)";
  path(wr.col, 0, 0);
  wr.col.stroke();
  wr.bmp.lineWidth = width + 1;
  wr.bmp.strokeStyle = "#202020";
  path(wr.bmp, 0, 0);
  wr.bmp.stroke();
}

/** Stamped/printed text that has worn: printed, then flecked away by noise. */
export function wornText(
  wr: Wear,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  opts: { align?: CanvasTextAlign; emboss?: boolean; wear?: number; rotate?: number } = {},
) {
  const ctx = wr.col;
  ctx.save();
  ctx.translate(x, y);
  if (opts.rotate) ctx.rotate(opts.rotate);
  ctx.font = font;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "middle";
  if (opts.emboss) {
    ctx.fillStyle = "rgba(255,250,235,0.45)";
    ctx.fillText(text, 1.5, 1.5);
    wr.bmp.save();
    wr.bmp.translate(x, y);
    if (opts.rotate) wr.bmp.rotate(opts.rotate);
    wr.bmp.font = font;
    wr.bmp.textAlign = ctx.textAlign;
    wr.bmp.textBaseline = "middle";
    wr.bmp.fillStyle = "#606060";
    wr.bmp.fillText(text, 0, 0);
    wr.bmp.restore();
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  const tw = ctx.measureText(text).width;
  const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? "20");
  ctx.restore();
  const x0 = opts.align === "center" ? x - tw / 2 : opts.align === "right" ? x - tw : x;
  flecks(wr, x0, y - size / 2, tw, size, opts.wear ?? 0.5);
}

/** Paint flecks knocked out of a region — printed graphics wear like the enamel. */
export function flecks(wr: Wear, x: number, y: number, w: number, h: number, k: number) {
  const n = Math.round(Math.max(6, w * h * 0.0012) * k);
  for (let i = 0; i < n; i++) {
    const px = x + wr.noise(i * 1.7, 3.1) * w * 1.3 - w * 0.15;
    const py = y + wr.noise(5.3, i * 1.3) * h * 1.3 - h * 0.15;
    const r = 0.6 + wr.noise(i * 0.7, i * 0.3) * 2.2;
    wr.col.fillStyle = `rgba(${150 + (i % 3) * 20},${95 + (i % 5) * 6},60,0.85)`;
    wr.col.beginPath();
    wr.col.arc(px, py, r, 0, Math.PI * 2);
    wr.col.fill();
  }
}

/** A sticker: its own paper, curled-up dirty edges, worn print. */
export function sticker(
  wr: Wear,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  draw: (ctx: CanvasRenderingContext2D) => void,
  rot = 0,
) {
  const ctx = wr.col;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rot);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = "rgba(20,14,8,0.35)";
  ctx.fillRect(2, 3, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  draw(ctx);
  // Grime pooled at the edges and a couple of scuffs.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(90,60,30,0.10)");
  g.addColorStop(0.7, "rgba(90,60,30,0.0)");
  g.addColorStop(1, "rgba(90,60,30,0.25)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(80,50,25,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.restore();
  // Stickers are raised, and rougher than enamel.
  wr.bmp.save();
  wr.bmp.translate(x + w / 2, y + h / 2);
  wr.bmp.rotate(rot);
  wr.bmp.fillStyle = "#ffffff";
  wr.bmp.fillRect(-w / 2, -h / 2, w, h);
  wr.bmp.restore();
  wr.rou.save();
  wr.rou.translate(x + w / 2, y + h / 2);
  wr.rou.rotate(rot);
  wr.rou.fillStyle = "#c8c8c8";
  wr.rou.fillRect(-w / 2, -h / 2, w, h);
  wr.rou.restore();
  flecks(wr, x, y, w, h, 0.9);
}

/** Wrap the three canvases as textures for a MeshStandardMaterial. */
export function wearMaps(wr: Wear, aniso: number) {
  const map = new THREE.CanvasTexture(wr.colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = aniso;
  const roughnessMap = new THREE.CanvasTexture(wr.rouC);
  roughnessMap.anisotropy = aniso;
  const bumpMap = new THREE.CanvasTexture(wr.bmpC);
  bumpMap.anisotropy = aniso;
  return { map, roughnessMap, bumpMap };
}
