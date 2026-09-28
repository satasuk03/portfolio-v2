/*
 * Every surface detail on the unit is drawn here, into canvases, at runtime —
 * panel seams, vents, hazard bands, cartridge labels. The only image assets
 * in the engine are the reader's surface scans (surfaces.ts), and
 * the labels are typeset in the site's own faces (Kanit / Azeret Mono), read
 * from the CSS variables next/font writes onto <html>.
 */

import * as THREE from "three";
import type { PlayModule } from "@/content/play";

export type Fonts = { display: string; mono: string; body: string };

export function readFonts(): Fonts {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    display: v("--font-kanit", "system-ui"),
    mono: v("--font-azeret-mono", "ui-monospace, monospace"),
    body: v("--font-archivo", "system-ui"),
  };
}

/** Deterministic PRNG so every label and decal is the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement, maxAniso: number) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  t.needsUpdate = true;
  return t;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function barcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, color: string) {
  const r = rng(seed);
  ctx.fillStyle = color;
  let cx = x;
  while (cx < x + w) {
    const bw = 1 + Math.floor(r() * 4);
    if (r() > 0.4) ctx.fillRect(cx, y, Math.min(bw, x + w - cx), h);
    cx += bw + 1 + Math.floor(r() * 2);
  }
}

function hazard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: string, b: string, step = 18) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = a;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = b;
  for (let i = -h; i < w + h; i += step * 2) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + step, y + h);
    ctx.lineTo(x + i + step + h, y);
    ctx.lineTo(x + i + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxW: number, start: number) {
  let px = start;
  ctx.font = font(px);
  while (ctx.measureText(text).width > maxW && px > 10) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

// ── cartridge label: the CBRPNK card, front face ───────────────────────────

export function cartridgeLabel(m: PlayModule, fonts: Fonts, aniso: number) {
  const W = 512;
  const H = 560;
  const [c, ctx] = canvas(W, H);
  const ink = "#101010";
  ctx.fillStyle = "#1a1b1e";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = m.color;
  roundRect(ctx, 6, 6, W - 12, H - 12, 34);
  ctx.fill();

  // Index + unit mark.
  ctx.fillStyle = ink;
  ctx.font = `700 46px ${fonts.mono}`;
  ctx.textBaseline = "top";
  ctx.fillText(m.n, 34, 30);
  ctx.font = `700 18px ${fonts.mono}`;
  ctx.textAlign = "right";
  ctx.fillText("S-03 // MOD", W - 70, 38);
  ctx.beginPath();
  ctx.arc(W - 46, 47, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#e8195b";
  if (m.color === "#e8195b") ctx.fillStyle = ink;
  ctx.fill();
  ctx.textAlign = "left";

  ctx.fillStyle = ink;
  ctx.fillRect(34, 96, W - 68, 4);

  // The code word — poster weight, fitted to the measure.
  const px = fitText(ctx, m.code, (p) => `900 ${p}px ${fonts.display}`, W - 68, 110);
  ctx.font = `900 ${px}px ${fonts.display}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(m.code, 30, 118 + px * 0.86);

  const yRow = 130 + px;
  ctx.font = `700 20px ${fonts.mono}`;
  ctx.fillText(`MODULE — ${m.label.toUpperCase()}`, 34, yRow + 18);

  // ADSR-style fader block, pure decoration.
  const r = rng(m.n.charCodeAt(1) * 97 + 13);
  const bx = 34;
  const by = yRow + 48;
  ctx.lineWidth = 3;
  ctx.strokeStyle = ink;
  for (let i = 0; i < 4; i++) {
    const x = bx + i * 42;
    ctx.strokeRect(x, by, 30, 150);
    const f = 0.25 + r() * 0.7;
    ctx.fillRect(x, by + 150 * (1 - f), 30, 150 * f);
  }
  ctx.font = `700 16px ${fonts.mono}`;
  ["S", "Y", "N", "C"].forEach((l, i) => ctx.fillText(l, bx + i * 42 + 9, by + 176));

  // The arrow — the reference card's signature glyph.
  ctx.save();
  ctx.translate(W - 150, by + 10);
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(80, 30);
  ctx.lineTo(80, 110);
  ctx.lineTo(62, 110);
  ctx.lineTo(62, 60);
  ctx.lineTo(10, 112);
  ctx.lineTo(-3, 99);
  ctx.lineTo(49, 47);
  ctx.lineTo(0, 47);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Footer: hex tag, barcode, hazard.
  const fy = H - 74;
  ctx.fillRect(34, fy - 14, W - 68, 3);
  ctx.font = `700 22px ${fonts.mono}`;
  ctx.fillText(`#${m.color.slice(1).toUpperCase()}`, 34, fy + 22);
  barcode(ctx, 190, fy + 2, 150, 30, m.n.charCodeAt(1) * 31, ink);
  hazard(ctx, 362, fy + 2, 116, 30, m.color, ink, 10);

  grain(ctx, W, H, 14, m.n.charCodeAt(1));
  return tex(c, aniso);
}

// ── cartridge back: service sticker on dark plastic ────────────────────────

export function cartridgeBack(m: PlayModule, fonts: Fonts, aniso: number) {
  const W = 512;
  const H = 560;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#cfc8b6";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1a1b1e";
  roundRect(ctx, 40, 40, W - 80, H - 80, 18);
  ctx.fill();
  ctx.fillStyle = m.color;
  ctx.fillRect(40, 40, 22, H - 80);
  ctx.fillStyle = "#e9e4d6";
  ctx.font = `700 22px ${fonts.mono}`;
  ctx.textBaseline = "top";
  const lines = [
    `MOD ${m.n} / 07`,
    m.code,
    "",
    "HANDLE WITH CARE",
    "DO NOT EXPOSE TO",
    "MAGNETIC FIELDS",
    "",
    "SATASUK / S-03",
    "BANGKOK · UTC+7",
  ];
  lines.forEach((l, i) => ctx.fillText(l, 90, 78 + i * 34));
  barcode(ctx, 90, H - 130, W - 180, 44, m.n.charCodeAt(1) * 7, "#e9e4d6");
  grain(ctx, W, H, 10, 99);
  return tex(c, aniso);
}

// ── pedestal band: hazard stripe wrapped round the plinth ──────────────────

export function plinthTexture(fonts: Fonts, aniso: number) {
  const W = 2048;
  const H = 128;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#24272d";
  ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 8; k++) {
    const x0 = (k * W) / 8;
    if (k % 2 === 0) hazard(ctx, x0 + 20, 34, 180, 60, "#ffc400", "#141414", 14);
    ctx.fillStyle = "rgba(233,228,214,0.8)";
    ctx.font = `700 26px ${fonts.mono}`;
    ctx.fillText(["S-03", "กรุงเทพฯ", "UTC+7", "MOD BAY", "PWR", "ZE", "2019→", "07"][k], x0 + (k % 2 === 0 ? 216 : 30), 74);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x0, 0, 3, H);
  }
  grain(ctx, W, H, 16, 11);
  const t = tex(c, aniso);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
