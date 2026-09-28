/*
 * Procedural wear for the reader's painted surfaces — the look of the
 * reference: cream enamel over steel, chipped at the edges and around every
 * control, rust blooming out of the chips, grime streaking down from screws.
 *
 * One pass writes three maps that agree pixel for pixel:
 *   color   enamel / rust halo / bare steel
 *   orm     packed per three's channel convention: R clearcoat (glossy enamel
 *           only — rust and steel are matte), G roughness, B metalness
 *   bump    chips sit below the paint, so edges catch light
 *
 * The masks — where paint has chipped, where rust has bloomed — are always
 * procedural. When the surface scans are loaded (surfaces.ts), each zone
 * samples its scan for the close-up detail: enamel grain and dirt, rust
 * scale, scratched steel. Without them the pass is fully procedural.
 *
 * Deterministic (seeded) and CPU-only; generated once at load.
 */

import * as THREE from "three";
import type { Surfaces } from "./surfaces";

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

/** Bilinear lookup into a coarse grid of row width cw, at cell gi. */
const lerp2 = (a: Float32Array, gi: number, cw: number, tx: number, ty: number) => {
  const a00 = a[gi];
  const a10 = a[gi + 1];
  const a01 = a[gi + cw];
  return a00 + (a10 - a00) * tx + (a01 - a00) * ty + (a00 - a10 - a01 + a[gi + cw + 1]) * tx * ty;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Extra wear around a point; a negative k protects it (printed legends). */
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
  /**
   * Canvas pixels per world unit. Keeps noise features and scan detail the
   * same physical size on every part; without it they scale with the canvas.
   */
  unit?: number;
  /** Only the top and bottom edges wear — for a side band that wraps in u. */
  rims?: boolean;
  /** Surface scans; null/undefined keeps the pass procedural. */
  surf?: Surfaces | null;
};

/** World size of one repeat of each scan, in units. */
const SCAN = { rust: 0.9, steel: 0.7, enamel: 0.8, grime: 1.7 };

export function weathered(o: WearOpts) {
  const { w: W, h: H } = o;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return [c, c.getContext("2d")!] as const;
  };
  const [colC, col] = mk();
  const [ormC, orm] = mk();
  const [bmpC, bmp] = mk();
  const cd = col.createImageData(W, H);
  const rd = orm.createImageData(W, H);
  const bd = bmp.createImageData(W, H);
  const { noise, fbm } = makeNoise(o.seed);
  const wear = o.wear ?? 0.75;
  const edgeW = o.edge ?? 0.06;
  const spots = o.spots ?? [];
  const streaks = o.streaks ?? 1;
  const [pr, pg, pb] = o.paint;
  const short = Math.min(W, H);
  // Keep feature size stable: in world units when the part says how big it
  // is, otherwise relative to the canvas.
  const sc = o.unit ? 540 / o.unit : 1024 / short;
  const unit = o.unit ?? short;
  const surf = o.surf ?? null;
  const tRust = surf?.tile("rust", unit * SCAN.rust) ?? null;
  const tSteel = surf?.tile("steel", unit * SCAN.steel) ?? null;
  const tEnamel = surf?.tile("enamel", unit * SCAN.enamel) ?? null;
  const tGrime = surf?.tile("grime", unit * SCAN.grime) ?? null;
  const enamelL = tEnamel ? tEnamel.mean[0] + tEnamel.mean[1] + tEnamel.mean[2] : 1;
  const grimeL = tGrime ? tGrime.mean[0] : 1;
  const rustL = tRust ? (tRust.mean[0] + tRust.mean[1] + tRust.mean[2]) * 2 : 1;
  // Scans are offset per part so neighbouring parts never show the same patch.
  const off = (o.seed * 131) % 997;

  // Slow fields — edge + spot mask, domain warp, mottle, grime — vary over
  // tens of pixels, so they are evaluated on a coarse grid and interpolated.
  // Only the sharp terms (chip edge, scans, streaks) run per pixel.
  const G = 4;
  const cw = Math.ceil(W / G) + 1;
  const ch = Math.ceil(H / G) + 1;
  const grid = (fn: (x: number, y: number) => number) => {
    const a = new Float32Array(cw * ch);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) a[j * cw + i] = fn(Math.min(i * G, W - 1), Math.min(j * G, H - 1));
    return a;
  };
  // Drip streaks: noise stretched hard along Y, so their grid is too.
  const SX = 2;
  const SY = 16;
  const sw = Math.ceil(W / SX) + 1;
  const sh = Math.ceil(H / SY) + 1;
  const gStreak = new Float32Array(sw * sh);
  if (streaks > 0)
    for (let j = 0; j < sh; j++)
      for (let i = 0; i < sw; i++) gStreak[j * sw + i] = Math.max(0, fbm(Math.min(i * SX, W - 1) * sc * 0.06 + 33, Math.min(j * SY, H - 1) * sc * 0.0035, 3) - 0.58) * 2.4 * streaks;
  const gMask = grid((x, y) => {
    const X = x * sc;
    const Y = y * sc;
    // Edge proximity in short-side units.
    const ed = (o.rims ? Math.min(y, H - 1 - y) : Math.min(x, W - 1 - x, y, H - 1 - y)) / short;
    // The edge band is broken up by slow noise, so rust gathers in patches
    // along an edge rather than as an even outline.
    const patch = smooth(0.35, 0.75, noise(X * 0.006 + 13, Y * 0.006 + 29));
    let mask = (1 - smooth(0, edgeW, ed)) * (0.12 + 0.5 * patch);
    for (const s of spots) {
      const dx = (x / W - s.x) * (W / short);
      const dy = (y / H - s.y) * (H / short);
      const d = Math.sqrt(dx * dx + dy * dy);
      mask += (1 - smooth(s.r * 0.6, s.r * 1.6, d)) * 0.4 * (s.k ?? 1);
    }
    return mask;
  });
  // Domain warp, so thresholded chip edges wander instead of following the
  // value-noise lattice.
  const gWarpX = grid((x, y) => (noise(x * sc * 0.017 + 71, y * sc * 0.017) - 0.5) * 60);
  const gWarpY = grid((x, y) => (noise(x * sc * 0.017, y * sc * 0.017 + 37) - 0.5) * 60);
  // The chip field's two slow octaves; its two fast ones run per pixel.
  const C0 = 0.011;
  const C1 = C0 * 2.03;
  const C2 = C1 * 2.03;
  const C3 = C2 * 2.03;
  const gChip = grid((x, y) => {
    const n = Math.round(y / G) * cw + Math.round(x / G);
    const wx = x * sc + gWarpX[n];
    const wy = y * sc + gWarpY[n];
    return noise(wx * C0, wy * C0) * 0.5 + noise(wx * C1, wy * C1) * 0.25;
  });
  const gMottle = grid((x, y) => noise(x * sc * 0.02 + 91, y * sc * 0.02) * 0.6);
  // Grime: gathers low on the part and in the noise's valleys.
  const gGrime = grid((x, y) => fbm(x * sc * 0.004 + 7, y * sc * 0.004 + 3, 3) * 0.5 + (y / H) * 0.35);

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const gy = y / G;
    const j0 = Math.floor(gy);
    const ty = gy - j0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const X = x * sc;
      const Y = y * sc;
      const gx = x / G;
      const i0 = Math.floor(gx);
      const tx = gx - i0;
      const gi = j0 * cw + i0;

      const mask = lerp2(gMask, gi, cw, tx, ty);
      const wx = X + lerp2(gWarpX, gi, cw, tx, ty);
      const wy = Y + lerp2(gWarpY, gi, cw, tx, ty);
      // With the rust scan loaded, its own flake structure breaks the chip
      // edge up at the finest scale.
      let fine: number;
      if (tRust) {
        const ri = tRust.at(x + off * 7, y + off * 2);
        fine = (tRust.data[ri] + tRust.data[ri + 1] + tRust.data[ri + 2]) / rustL;
      } else fine = noise(wx * 0.09, wy * 0.09);
      const oct = (lerp2(gChip, gi, cw, tx, ty) + noise(wx * C2, wy * C2) * 0.125 + noise(wx * C3, wy * C3) * 0.0625) / 0.9375;
      const chip = oct * 0.7 + fine * 0.3;
      const wv = chip + mask * wear - 0.74 + (wear - 0.75) * 0.25;

      // The enamel scan's grain stands in for the fine mottle when it is loaded.
      const mottle = lerp2(gMottle, gi, cw, tx, ty) + (tEnamel ? 0.2 : noise(X * 0.2, Y * 0.2) * 0.4);
      const grime = lerp2(gGrime, gi, cw, tx, ty);
      let streak = 0;
      if (streaks > 0) {
        const sx = x / SX;
        const sy = y / SY;
        const si0 = Math.floor(sx);
        const sj0 = Math.floor(sy);
        streak = lerp2(gStreak, sj0 * sw + si0, sw, sx - si0, sy - sj0);
      }

      let r: number, g: number, b: number, ro: number, bu: number;
      let coat = 0;
      let metal = 0;
      if (wv > 0.1) {
        // Bare steel, rusting from the middle of the chip out.
        const rust = fbm(X * 0.03 + 50, Y * 0.03 + 11, 3);
        const k = smooth(0.35, 0.7, rust);
        const pit = noise(X * 0.25, Y * 0.25);
        if (tRust && tSteel) {
          const ri = tRust.at(x + off, y + off);
          const si = tSteel.at(x + off * 2, y + off);
          r = tSteel.data[si] * (1 - k) + tRust.data[ri] * k;
          g = tSteel.data[si + 1] * (1 - k) + tRust.data[ri + 1] * k;
          b = tSteel.data[si + 2] * (1 - k) + tRust.data[ri + 2] * k;
          // Rust scale stands proud of the steel; its bright flakes most.
          const rl = (tRust.data[ri] + tRust.data[ri + 1]) / 510;
          bu = 0.16 + k * rl * 0.3;
        } else {
          r = 70 + (150 - 70) * k;
          g = 62 + (72 - 62) * k;
          b = 56 + (30 - 56) * k;
          r *= 0.8 + pit * 0.35;
          g *= 0.8 + pit * 0.3;
          b *= 0.8 + pit * 0.3;
          bu = 0.18 + pit * 0.1;
        }
        ro = 0.42 + k * 0.5;
        metal = 0.85 * (1 - k);
      } else if (wv > 0.035) {
        // Rust halo creeping under the paint edge.
        const t = (wv - 0.035) / 0.065;
        r = 196 - 40 * t;
        g = 120 - 50 * t;
        b = 70 - 35 * t;
        if (tRust) {
          const ri = tRust.at(x + off, y + off);
          r = r * 0.45 + tRust.data[ri] * 0.55;
          g = g * 0.45 + tRust.data[ri + 1] * 0.55;
          b = b * 0.45 + tRust.data[ri + 2] * 0.55;
        }
        ro = 0.82;
        bu = 0.75 - t * 0.3;
      } else {
        const m = 0.93 + mottle * 0.1;
        const gk = 1 - Math.max(0, grime - 0.55) * 0.45;
        r = pr * m * gk;
        g = pg * m * gk;
        b = pb * m * gk * 0.98;
        ro = 0.4 + mottle * 0.1 + Math.max(0, grime - 0.5) * 0.3;
        coat = 1;
        if (tEnamel) {
          // The scan's own grain, as a luminance ratio: the paint colour holds.
          const ei = tEnamel.at(x + off, y + off * 3);
          const l = (tEnamel.data[ei] + tEnamel.data[ei + 1] + tEnamel.data[ei + 2]) / enamelL;
          const f = 1 + (l - 1) * 1.6;
          r *= f;
          g *= f;
          b *= f;
        }
        if (tGrime) {
          // Dirt settles where the part is low and where the scan is dark.
          const gi = tGrime.at(x + off * 5, y + off);
          const dirt = Math.min(1, Math.max(0, (grimeL - tGrime.data[gi]) / grimeL) * 2.4) * (0.35 + v * 0.65);
          r = r * (1 - dirt * 0.38) + 92 * dirt * 0.38;
          g = g * (1 - dirt * 0.38) + 74 * dirt * 0.38;
          b = b * (1 - dirt * 0.38) + 54 * dirt * 0.38;
          ro += dirt * 0.3;
          coat *= 1 - dirt * 0.7;
        }
        bu = 1;
      }
      // Streaks stain everything, rust-brown.
      if (streak > 0) {
        const s = Math.min(0.55, streak);
        r = r * (1 - s) + 110 * s;
        g = g * (1 - s) + 70 * s;
        b = b * (1 - s) + 40 * s;
        ro = Math.min(1, ro + s * 0.3);
        coat *= 1 - s;
      }
      cd.data[i] = r;
      cd.data[i + 1] = g;
      cd.data[i + 2] = b;
      cd.data[i + 3] = 255;
      rd.data[i] = coat * 255;
      rd.data[i + 1] = Math.min(1, ro) * 255;
      rd.data[i + 2] = metal * 255;
      rd.data[i + 3] = 255;
      const B = bu * 255;
      bd.data[i] = bd.data[i + 1] = bd.data[i + 2] = B;
      bd.data[i + 3] = 255;
    }
  }
  col.putImageData(cd, 0, 0);
  orm.putImageData(rd, 0, 0);
  bmp.putImageData(bd, 0, 0);
  return { W, H, colC, col, ormC, orm, bmpC, bmp, noise };
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
  // Stickers are raised, rougher than enamel, and not clear-coated.
  wr.bmp.save();
  wr.bmp.translate(x + w / 2, y + h / 2);
  wr.bmp.rotate(rot);
  wr.bmp.fillStyle = "#ffffff";
  wr.bmp.fillRect(-w / 2, -h / 2, w, h);
  wr.bmp.restore();
  wr.orm.save();
  wr.orm.translate(x + w / 2, y + h / 2);
  wr.orm.rotate(rot);
  wr.orm.fillStyle = "rgb(40,200,0)";
  wr.orm.fillRect(-w / 2, -h / 2, w, h);
  wr.orm.restore();
  flecks(wr, x, y, w, h, 0.9);
}

/** Wrap the canvases as textures. `orm` feeds roughness, metalness and clearcoat. */
export function wearMaps(wr: Wear, aniso: number) {
  const map = new THREE.CanvasTexture(wr.colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = aniso;
  const orm = new THREE.CanvasTexture(wr.ormC);
  orm.anisotropy = aniso;
  const bumpMap = new THREE.CanvasTexture(wr.bmpC);
  bumpMap.anisotropy = aniso;
  return { map, orm, bumpMap };
}

/**
 * The material every weathered part wears. `hi` adds a clearcoat lobe masked
 * to the intact enamel, so paint reads semi-gloss next to matte rust — the
 * single biggest cue that it is paint on steel and not a printed picture.
 */
export function wearMaterial(wr: Wear, aniso: number, o: { hi: boolean; bumpScale?: number; coat?: number }) {
  const { map, orm, bumpMap } = wearMaps(wr, aniso);
  const base = { map, roughnessMap: orm, metalnessMap: orm, bumpMap, bumpScale: o.bumpScale ?? 3, roughness: 1, metalness: 1 };
  if (!o.hi) return new THREE.MeshStandardMaterial(base);
  return new THREE.MeshPhysicalMaterial({ ...base, clearcoat: o.coat ?? 0.35, clearcoatMap: orm, clearcoatRoughness: 0.42 });
}
