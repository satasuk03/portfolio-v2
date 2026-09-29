/*
 * THE READER — the handheld card reader the cartridges slot into. Modelled
 * on the reference: a cream enamel chassis gone to rust at the edges, an
 * orange LCD in a screwed-down bezel, a yellow analog gauge, knobs, a
 * stickered service hatch, round CHG / EJECT buttons, and a slot housing on
 * top.
 *
 * Everything is primitives + canvas maps; the canvases sample the surface
 * scans in surfaces.ts for close-up detail. Coordinates in this file are
 * CHASSIS-LOCAL: origin at the chassis centre, +z out of the front face.
 * The chassis sits in `body`, whose origin is the chassis bottom — that is
 * the squash pivot, so a slam compresses the reader onto its feet.
 *
 * The face is laid out in `L`, and in development every control, dial,
 * legend and screw registers a footprint that is checked against every other
 * and against the face outline (checkLayout). A layout edit that makes two
 * parts collide warns in the console instead of shipping.
 *
 * Working controls (raycast targets, see Stage.pick):
 *   eject   red round button — presses in, springs back, ejects
 *   charge  orange round button — hold to overcharge
 *   toggle  red lever — sound on/off
 *   knobs   two small knobs + the big rotary — click to spin
 */

import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { chamferBox, glow, type Mats } from "./models";
import { ReaderScreen } from "./screen";
import type { Surfaces } from "./surfaces";
import type { Fonts } from "./textures";
import { rng } from "./textures";
import { wearMaterial } from "./wear-maps";
import { flecks, seam, sticker, weathered, wornText, type WearSpot } from "./weathering";

export const BODY = { w: 1.9, h: 2.9, d: 0.56, base: 0.1 };
/** The feet the chassis stands on: they set BODY.base. */
const SKID = { w: 0.3, h: BODY.base, d: 0.92, pad: 0.02 };
const F = BODY.d / 2; // front face z
/**
 * The slot housing: a rounded-profile block that SITS ON the chassis top,
 * sunk a little into it, and narrower than the chassis front to back — so it
 * never reaches over the face.
 */
const HOUSING = { len: 1.3, d: 0.46, h: 0.3, r: 0.07, sink: 0.05 };
/** World y of the slot mouth on top of the housing. */
export const SLOT_TOP = BODY.base + BODY.h + HOUSING.h - HOUSING.sink;
/** Inserted cartridge centre: ~0.64 of it stands proud of the slot. */
export const INSERT_Y = SLOT_TOP + 0.04;
/** Where a card lines up over the slot before it goes in: pins just clear. */
export const HOVER_Y = SLOT_TOP + 0.95;
/** World-space centre of the LCD — the close-up camera frames on it. */
export const SCREEN_Y = BODY.base + BODY.h / 2 + 0.72;

// ── layout (chassis-local) ─────────────────────────────────────────────────
//
// The flat face is 1.8 × 2.8 with 0.16 corners (the bevel takes the rest).
// Bands, top to bottom:
//   1.23 … 1.40   legends and the top screws
//   0.21 … 1.23   bezel + LCD
//   0.13 / -0.40  the control deck, between two seams
//  -0.40 … -1.40  service hatch (left) | control plate (right), split at x=0.07

const FACE = { w: BODY.w - 0.1, h: BODY.h - 0.1, r: 0.16 };

const L = {
  screen: { x: 0, y: 0.72, w: 1.42, h: 0.84 },
  bezel: { w: 1.66, h: 1.02 },
  legendY: 1.315,
  deck: { top: 0.13, bottom: -0.4 },
  row: -0.135,
  modeBtn: { x: -0.64, w: 0.3, h: 0.15 },
  toggle: { x: -0.38 },
  knobA: { x: -0.14, r: 0.085 },
  knobB: { x: 0.1, r: 0.085 },
  gauge: { x: 0.57, r: 0.2 },
  plateX: 0.07,
  leds: { y: -0.52, xs: [0.22, 0.36, 0.5] },
  meter: { x: 0.72, y: -0.56, r: 0.065 },
  rotary: { x: 0.47, y: -0.88, r: 0.1 },
  chg: { x: 0.28, y: -1.19, r: 0.1 },
  eject: { x: 0.68, y: -1.19, r: 0.1 },
  hatch: { x: -0.4, y: -0.89, w: 0.82, h: 0.84 },
  // No bottom-left screw: the hatch recess owns that corner, with its own four.
  screws: [
    [-0.82, 1.32],
    [0.82, 1.32],
    [0.82, -1.32],
  ] as const,
};

/** Dial housings are r + 0.045 at the back; the chrome ring reaches r + 0.036. */
const DIAL_RIM = 0.045;
const KNOB_SKIRT = 1.4;
const BTN_COLLAR = 1.38;

// ── layout check (development only) ────────────────────────────────────────

type Foot = { id: string; x: number; y: number; r?: number; w?: number; h?: number; seam?: boolean };

function checkLayout(feet: Foot[]) {
  const CLEAR = 0.008;
  const problems: string[] = [];
  const box = (f: Foot) =>
    f.r !== undefined ? { x0: f.x - f.r, x1: f.x + f.r, y0: f.y - f.r, y1: f.y + f.r } : { x0: f.x - f.w! / 2, x1: f.x + f.w! / 2, y0: f.y - f.h! / 2, y1: f.y + f.h! / 2 };
  const gap = (a: Foot, b: Foot) => {
    if (a.r !== undefined && b.r !== undefined) return Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
    if (a.r === undefined && b.r === undefined) {
      const A = box(a);
      const B = box(b);
      const dx = Math.max(A.x0 - B.x1, B.x0 - A.x1);
      const dy = Math.max(A.y0 - B.y1, B.y0 - A.y1);
      return dx > 0 && dy > 0 ? Math.hypot(dx, dy) : Math.max(dx, dy);
    }
    const c = a.r !== undefined ? a : b;
    const R = box(a.r !== undefined ? b : a);
    const dx = Math.max(R.x0 - c.x, 0, c.x - R.x1);
    const dy = Math.max(R.y0 - c.y, 0, c.y - R.y1);
    const inside = dx === 0 && dy === 0;
    return inside ? -c.r! : Math.hypot(dx, dy) - c.r!;
  };
  for (let i = 0; i < feet.length; i++) {
    const a = feet[i];
    // Inside the flat face, corners included.
    const B = box(a);
    const hx = FACE.w / 2 - CLEAR;
    const hy = FACE.h / 2 - CLEAR;
    if (!a.seam && (B.x0 < -hx || B.x1 > hx || B.y0 < -hy || B.y1 > hy)) problems.push(`${a.id} leaves the face`);
    const cx = FACE.w / 2 - FACE.r;
    const cy = FACE.h / 2 - FACE.r;
    for (const [px, py] of [
      [B.x0, B.y0],
      [B.x1, B.y0],
      [B.x0, B.y1],
      [B.x1, B.y1],
    ]) {
      if (!a.seam && Math.abs(px) > cx && Math.abs(py) > cy && Math.hypot(Math.abs(px) - cx, Math.abs(py) - cy) > FACE.r - CLEAR) {
        problems.push(`${a.id} crosses a rounded corner`);
        break;
      }
    }
    for (let j = i + 1; j < feet.length; j++) {
      const b = feet[j];
      if (a.seam && b.seam) continue;
      const g = gap(a, b);
      if (g < CLEAR) problems.push(`${a.id} × ${b.id} (${g.toFixed(3)})`);
    }
  }
  if (problems.length) console.warn(`[reader] layout overlaps:\n  ${problems.join("\n  ")}`);
}

// ── helpers ─────────────────────────────────────────────────────────────────

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

const CURVE_SEGS = 10;

/**
 * Arc-length along a shape's outline (and then its holes), for any point
 * near it — the u coordinate of a slab's side walls.
 */
function perimeterParam(shape: THREE.Shape) {
  const { shape: outer, holes } = shape.extractPoints(CURVE_SEGS);
  const loops = [outer, ...holes].map((pts) => {
    const cum = [0];
    for (let i = 1; i <= pts.length; i++) cum.push(cum[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]));
    return { pts, cum };
  });
  const total = loops[0].cum[loops[0].cum.length - 1];
  const at = (x: number, y: number) => {
    let best = Infinity;
    let s = 0;
    let base = 0;
    for (const { pts, cum } of loops) {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const ex = b.x - a.x;
        const ey = b.y - a.y;
        const l2 = ex * ex + ey * ey || 1e-9;
        const t = Math.min(1, Math.max(0, ((x - a.x) * ex + (y - a.y) * ey) / l2));
        const d = (a.x + ex * t - x) ** 2 + (a.y + ey * t - y) ** 2;
        if (d < best) {
          best = d;
          s = base + cum[i] + Math.sqrt(l2) * t;
        }
      }
      base += cum[cum.length - 1];
    }
    return s;
  };
  return { at, total };
}

type SideUV = (s: number, v01: number) => [number, number];

/**
 * Extrude with a soft multi-segment bevel, and UVs that respect each face:
 *   group 0  front cap   planar over (w, h) — the part's own painted canvas
 *   group 1  side walls  (arc-length, depth) via `side` — never the front
 *                        canvas smeared through the depth
 *   group 2  back cap    planar
 * Normals are creased, so the bevel is smooth and the cap edges stay crisp.
 */
function slab(shape: THREE.Shape, w: number, h: number, d: number, b: number, segs = 3, side?: SideUV) {
  const src = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: segs, curveSegments: CURVE_SEGS });
  src.translate(0, 0, -(d - 2 * b) / 2);
  const per = perimeterParam(shape);
  const sideUV: SideUV = side ?? ((s, v) => [s / SIDE_BAND.len, v]);
  const P = src.attributes.position;
  const capGroup = src.groups.find((g) => g.materialIndex === 0)!;
  const tris: { front: number[]; side: number[]; back: number[] } = { front: [], side: [], back: [] };
  for (let t = 0; t < P.count / 3; t++) {
    const v0 = t * 3;
    const inCap = v0 >= capGroup.start && v0 < capGroup.start + capGroup.count;
    if (!inCap) tris.side.push(t);
    else (P.getZ(v0) > 0 ? tris.front : tris.back).push(t);
  }
  const order = [...tris.front, ...tris.side, ...tris.back];
  const pos = new Float32Array(order.length * 9);
  const uv = new Float32Array(order.length * 6);
  order.forEach((t, k) => {
    const isSide = k >= tris.front.length && k < tris.front.length + tris.side.length;
    for (let j = 0; j < 3; j++) {
      const i = t * 3 + j;
      const x = P.getX(i);
      const y = P.getY(i);
      const z = P.getZ(i);
      pos.set([x, y, z], (k * 3 + j) * 3);
      const [u, v] = isSide ? sideUV(per.at(x, y), z / d + 0.5) : [x / w + 0.5, y / h + 0.5];
      uv.set([u, v], (k * 3 + j) * 2);
    }
  });
  src.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.addGroup(0, tris.front.length * 3, 0);
  g.addGroup(tris.front.length * 3, tris.side.length * 3, 1);
  g.addGroup((tris.front.length + tris.side.length) * 3, tris.back.length * 3, 2);
  return toCreasedNormals(g, THREE.MathUtils.degToRad(40));
}

/** The chassis side band wraps every slab edge: u in arc-length, v in depth. */
const SIDE_BAND = { len: 10 };

/** A cylinder whose axis points along +z (front), cap facing the viewer. */
function frontCyl(rTop: number, rBot: number, h: number, segs = 32) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, segs);
  g.rotateX(Math.PI / 2);
  return g;
}

/** A domed push-button cap by lathe, axis along +z. */
function buttonCap(r: number, h: number) {
  // Bottom to top: LatheGeometry's faces point outward only in this order.
  const pts = [
    new THREE.Vector2(r, 0),
    new THREE.Vector2(r, h * 0.4),
    new THREE.Vector2(r * 0.98, h * 0.7),
    new THREE.Vector2(r * 0.85, h * 0.9),
    new THREE.Vector2(r * 0.55, h * 0.98),
    new THREE.Vector2(0.0001, h),
  ];
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Deterministic, so the slots don't reshuffle on every visit. */
const screwAngle = rng(4242);

function screw(mats: Mats, r = 0.028) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(frontCyl(r * 0.92, r, 0.018, 20), mats.screw);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, r * 0.28, 0.006), mats.darkMetal);
  slot.position.z = 0.009;
  slot.rotation.z = screwAngle() * Math.PI;
  g.add(head, slot);
  return g;
}

function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return { t, ctx, c };
}

// ── the build ───────────────────────────────────────────────────────────────

export type Assembly = { obj: THREE.Object3D; order: number; kind: "drop" | "slide" | "pop" };

export function buildReader(fonts: Fonts, aniso: number, mats: Mats, hi: boolean, modulesCount: number, surf: Surfaces | null = null) {
  const { w: W, h: H, d: D } = BODY;
  const root = new THREE.Group();
  root.name = "reader";
  const assembly: Assembly[] = [];
  const accents: THREE.MeshBasicMaterial[] = [];
  const feet: Foot[] = [];
  const add = (parent: THREE.Object3D, o: THREE.Object3D, order: number, kind: Assembly["kind"] = "drop") => {
    parent.add(o);
    assembly.push({ obj: o, order, kind });
    return o;
  };

  // Reader-own metals: the scans give them a surface instead of a flat CG sheen.
  const gunTex = surf?.texture("gunmetal", aniso) ?? null;
  const steelTex = surf?.texture("steel", aniso) ?? null;
  const gunmetal = gunTex
    ? new THREE.MeshStandardMaterial({ color: "#c9ced6", map: gunTex, metalness: 0.72, roughness: 0.55 })
    : mats.gunmetal;
  // Brushed chrome: a steel scan as the roughness map breaks the mirror up,
  // which also keeps it under the bloom threshold instead of starring.
  const chrome = steelTex ? new THREE.MeshStandardMaterial({ color: "#d8dce2", metalness: 1, roughness: 0.62, roughnessMap: steelTex }) : mats.chrome;
  const dullChrome = steelTex ? new THREE.MeshStandardMaterial({ color: "#a2a6ac", metalness: 1, roughness: 0.9, roughnessMap: steelTex }) : mats.dullChrome;
  /** Tiled-metal side walls, world-scaled: one repeat per 0.6 units. */
  const tiledSide = (depth: number): SideUV => (s, v) => [s / 0.6, (v * depth) / 0.6];

  // ── stance: two skids, so the unit stands on the table by itself ──────────
  // No plinth, no cradle: the chassis rests on a pair of machined feet that
  // run front to back under it, rubber-padded where they meet the table.
  const stance = new THREE.Group();
  add(root, stance, 1);
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - SKID.w / 2 - 0.08);
    const skid = new THREE.Mesh(chamferBox(SKID.w, SKID.h - SKID.pad, SKID.d, 0.028), gunmetal);
    skid.position.set(x, SKID.pad + (SKID.h - SKID.pad) / 2, 0.04);
    stance.add(skid);
    for (const z of [-SKID.d / 2 + 0.1, SKID.d / 2 - 0.02]) {
      const pad = new THREE.Mesh(chamferBox(SKID.w - 0.03, SKID.pad, 0.14, 0.008), mats.rubber);
      pad.position.set(x, SKID.pad / 2, z);
      stance.add(pad);
    }
    // The chassis is bolted down through the skid's front toe.
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 6), chrome);
    bolt.position.set(x, SKID.h + 0.007, SKID.d / 2 - 0.06 + 0.04);
    stance.add(bolt);
  }

  // ── body: squash pivot at the chassis bottom ──────────────────────────────
  const body = new THREE.Group();
  body.position.y = BODY.base;
  add(root, body, 2);
  const chassis = new THREE.Group();
  chassis.position.y = H / 2;
  body.add(chassis);

  // Enamel, weathered around every control.
  const TW = hi ? 1024 : 560;
  const TH = Math.round(TW * (H / W));
  const unit = TW / W;
  const px = (x: number) => (x / W + 0.5) * TW;
  const py = (y: number) => (0.5 - y / H) * TH;
  const uvSpot = (x: number, y: number, r: number, k = 1): WearSpot => ({ x: x / W + 0.5, y: 0.5 - y / H, r: r / W, k });
  const wear = weathered({
    w: TW,
    h: TH,
    seed: 7,
    paint: [222, 214, 196],
    wear: 0.78,
    edge: 0.06,
    streaks: 1,
    unit,
    surf,
    spots: [
      uvSpot(L.modeBtn.x, L.row, 0.14),
      uvSpot(L.toggle.x, L.row, 0.08),
      uvSpot(L.knobA.x, L.row, 0.09),
      uvSpot(L.knobB.x, L.row, 0.09),
      uvSpot(L.gauge.x, L.row, 0.26, 0.8),
      uvSpot(L.rotary.x, L.rotary.y, 0.15),
      uvSpot(L.chg.x, L.chg.y, 0.14, 1.2),
      uvSpot(L.eject.x, L.eject.y, 0.14, 1.3),
      uvSpot(0, L.screen.y + 0.55, 0.3, 0.6),
      uvSpot(-0.85, -1.3, 0.25, 0.8),
      uvSpot(0.86, 1.1, 0.2, 0.7),
      // Handled less up here: keep the edge rust off the printed legends.
      uvSpot(-0.46, L.legendY, 0.2, -0.7),
      uvSpot(0.54, L.legendY, 0.16, -0.5),
    ],
  });

  // Seams: the control deck, the plate split, the hatch recess.
  const S = (x: number, y: number): [number, number] => [px(x), py(y)];
  const k = TW / 900;
  const seamW = Math.max(2, 2 * k);
  seam(wear, [S(-0.93, L.deck.top), S(0.93, L.deck.top)], false, seamW);
  seam(wear, [S(-0.93, L.deck.bottom), S(0.93, L.deck.bottom)], false, seamW);
  seam(wear, [S(L.plateX, L.deck.bottom), S(L.plateX, -1.45)], false, seamW);
  feet.push(
    { id: "seam:deck-top", x: 0, y: L.deck.top, w: 1.86, h: 0.004, seam: true },
    { id: "seam:deck-bottom", x: 0, y: L.deck.bottom, w: 1.86, h: 0.004, seam: true },
    { id: "seam:plate", x: L.plateX, y: (L.deck.bottom - 1.45) / 2, w: 0.004, h: 1.45 + L.deck.bottom, seam: true },
  );
  const hr = { x0: L.hatch.x - L.hatch.w / 2 - 0.025, x1: L.hatch.x + L.hatch.w / 2 + 0.025, y0: L.hatch.y - L.hatch.h / 2 - 0.025, y1: L.hatch.y + L.hatch.h / 2 + 0.025 };
  seam(wear, [S(hr.x0, hr.y1), S(hr.x1, hr.y1), S(hr.x1, hr.y0), S(hr.x0, hr.y0)], true, seamW);
  feet.push({ id: "hatch", x: L.hatch.x, y: L.hatch.y, w: hr.x1 - hr.x0, h: hr.y1 - hr.y0 });

  // Printed legends, each registered at its measured size.
  const ink = "#2a2621";
  const text = (t: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign, opts: { emboss?: boolean; wear?: number } = {}) => {
    wear.col.font = font;
    const tw = wear.col.measureText(t).width / unit;
    const th = parseFloat(/(\d+)px/.exec(font)![1]) / unit;
    const cx = align === "center" ? x : align === "right" ? x - tw / 2 : x + tw / 2;
    feet.push({ id: `legend:${t}`, x: cx, y, w: tw, h: th * 0.8 });
    wornText(wear, t, px(x), py(y), font, color, { align, ...opts });
  };
  text("SATASUK", -0.72, L.legendY, `900 ${Math.round(52 * k)}px ${fonts.display}`, ink, "left", { emboss: true, wear: 0.6 });
  text("FIELD UNIT · S-03", 0.72, L.legendY, `700 ${Math.round(20 * k)}px ${fonts.mono}`, ink, "right", { wear: 0.3 });
  const legend = (t: string, x: number, y: number, size = 15, color = ink) => text(t, x, y, `700 ${Math.round(size * k)}px ${fonts.mono}`, color, "center", { wear: 0.35 });
  const under = L.row - 0.135;
  legend("MODE", L.modeBtn.x, under);
  legend("SND", L.toggle.x, under);
  legend("GAIN", L.knobA.x, under);
  legend("TUNE", L.knobB.x, under);
  legend("PWR", L.leds.xs[0], L.leds.y - 0.075, 13);
  legend("LINK", L.leds.xs[1], L.leds.y - 0.075, 13);
  legend("CHG", L.leds.xs[2], L.leds.y - 0.075, 13);
  legend("LVL", L.meter.x, L.meter.y - 0.135, 13);
  legend("HOLD · CHG", L.chg.x, L.chg.y - 0.17, 14);
  legend("EJECT ⏏", L.eject.x, L.eject.y - 0.17, 15, "#8a1c12");
  // Rotary scale ticks, clear of the knob's chrome skirt.
  const rc = { x: px(L.rotary.x), y: py(L.rotary.y) };
  const tick0 = L.rotary.r * KNOB_SKIRT + 0.02;
  wear.col.strokeStyle = ink;
  for (let i = 0; i <= 10; i++) {
    const a = (-135 + i * 27) * (Math.PI / 180);
    const r0 = tick0 * unit;
    const r1 = r0 + (i % 5 === 0 ? 0.028 : 0.016) * unit;
    wear.col.lineWidth = 2 * k;
    wear.col.beginPath();
    wear.col.moveTo(rc.x + Math.sin(a) * r0, rc.y - Math.cos(a) * r0);
    wear.col.lineTo(rc.x + Math.sin(a) * r1, rc.y - Math.cos(a) * r1);
    wear.col.stroke();
  }
  feet.push({ id: "rotary", x: L.rotary.x, y: L.rotary.y, r: tick0 + 0.028 });
  // Red warning diamonds either side of EJECT, as on the reference.
  wear.col.fillStyle = "#b32a1c";
  for (const dx of [-0.105, 0.105]) {
    const cx = px(L.eject.x + dx);
    const cy = py(L.eject.y - 0.17);
    const s = 0.014 * unit;
    feet.push({ id: `diamond ${dx}`, x: L.eject.x + dx, y: L.eject.y - 0.17, r: 0.014 });
    wear.col.beginPath();
    wear.col.moveTo(cx, cy - s);
    wear.col.lineTo(cx + s * 0.7, cy);
    wear.col.lineTo(cx, cy + s);
    wear.col.lineTo(cx - s * 0.7, cy);
    wear.col.fill();
  }

  const paint = wearMaterial(wear, aniso, { hi, bumpScale: 3 });

  // The side band: same enamel, rusted along both rims where hands and the
  // table wear it, with louvre slots on each flank.
  const chassisShape = roundedRectShape(FACE.w, FACE.h, FACE.r);
  const chassisPer = perimeterParam(chassisShape);
  const BW = hi ? 2048 : 1024;
  const bandUnit = BW / SIDE_BAND.len;
  const BH = Math.round(bandUnit * D);
  const band = weathered({ w: BW, h: BH, seed: 12, paint: [222, 214, 196], wear: 0.8, edge: 0.3, rims: true, streaks: 0.4, unit: bandUnit, surf });
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const y = -0.1 - i * 0.065;
      const s = chassisPer.at(sx * (FACE.w / 2 + 0.05), y) * bandUnit;
      band.col.fillStyle = "rgba(16,12,9,0.92)";
      band.col.fillRect(s - 0.012 * bandUnit, BH * 0.3, 0.024 * bandUnit, BH * 0.4);
      band.bmp.fillStyle = "#101010";
      band.bmp.fillRect(s - 0.012 * bandUnit, BH * 0.3, 0.024 * bandUnit, BH * 0.4);
    }
  }
  const sideMat = wearMaterial(band, aniso, { hi, bumpScale: 2 });
  const map = sideMat.map!;
  map.wrapS = THREE.RepeatWrapping;
  sideMat.roughnessMap!.wrapS = THREE.RepeatWrapping;
  sideMat.bumpMap!.wrapS = THREE.RepeatWrapping;

  // The back panel: the same enamel, its own wear, and a louvred grille —
  // seen when the desk is looked round, and in every cast shadow's outline.
  // Symmetric, because the back cap's UVs read mirrored from behind.
  const BKW = hi ? 384 : 256;
  const BKH = Math.round(BKW * (H / W));
  const bu = BKW / W;
  const backWear = weathered({ w: BKW, h: BKH, seed: 31, paint: [222, 214, 196], wear: 0.72, edge: 0.06, streaks: 0.9, unit: bu, surf });
  for (let i = 0; i < 9; i++) {
    const y = (0.5 - (0.55 - i * 0.075) / H) * BKH;
    for (const [c, ctx] of [
      ["rgba(16,12,9,0.9)", backWear.col],
      ["#101010", backWear.bmp],
    ] as const) {
      ctx.fillStyle = c;
      ctx.fillRect(BKW / 2 - 0.5 * bu, y, 1.0 * bu, 0.03 * bu);
    }
  }
  const backMat = wearMaterial(backWear, aniso, { hi: false, bumpScale: 3 });

  const chassisMesh = new THREE.Mesh(slab(chassisShape, W, H, D, 0.05), [paint, sideMat, backMat]);
  chassis.add(chassisMesh);

  // Side ribs and strap lugs, clear of the louvres.
  for (const sx of [-1, 1]) {
    for (const y of [0.95, 0.35]) {
      const rib = new THREE.Mesh(chamferBox(0.05, 0.08, 0.42, 0.012), gunmetal);
      rib.position.set(sx * (W / 2 + 0.015), y, 0);
      chassis.add(rib);
    }
    const lug = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), gunmetal);
    lug.position.set(sx * (W / 2 + 0.02), H / 2 - 0.3, -0.05);
    lug.rotation.y = Math.PI / 2;
    chassis.add(lug);
  }
  for (const [x, y] of L.screws) {
    const s = screw(mats, 0.026);
    s.position.set(x, y, F + 0.004);
    chassis.add(s);
    feet.push({ id: `screw ${x},${y}`, x, y, r: 0.026 });
  }

  // ── screen: bezel, LCD, glass ─────────────────────────────────────────────
  const screenGroup = new THREE.Group();
  screenGroup.position.set(L.screen.x, L.screen.y, 0);
  add(chassis, screenGroup, 3, "slide");
  const bw = L.bezel.w;
  const bh = L.bezel.h;
  feet.push({ id: "bezel", x: L.screen.x, y: L.screen.y, w: bw, h: bh });
  const bezelShape = roundedRectShape(bw, bh, 0.08);
  bezelShape.holes.push(roundedRectShape(L.screen.w + 0.02, L.screen.h + 0.02, 0.05) as unknown as THREE.Path);
  const bwear = weathered({ w: hi ? 720 : 400, h: hi ? 442 : 246, seed: 21, paint: [74, 76, 78], wear: 0.6, edge: 0.05, streaks: 0.6, unit: (hi ? 720 : 400) / bw, surf });
  const bezelSide = gunTex ? new THREE.MeshStandardMaterial({ color: "#8d9096", map: gunTex, metalness: 0.5, roughness: 0.6 }) : mats.darkMetal;
  const BEZ_D = 0.085;
  const bezel = new THREE.Mesh(slab(bezelShape, bw, bh, BEZ_D, 0.022, 2, tiledSide(BEZ_D)), [wearMaterial(bwear, aniso, { hi, bumpScale: 2, coat: 0.35 }), bezelSide, bezelSide]);
  bezel.position.z = F + 0.03;
  screenGroup.add(bezel);
  // A black well behind the LCD so its edge reads as depth.
  const well = new THREE.Mesh(new THREE.PlaneGeometry(L.screen.w + 0.04, L.screen.h + 0.04), mats.void);
  well.position.z = F + 0.004;
  screenGroup.add(well);
  const screen = new ReaderScreen(fonts, hi, modulesCount);
  const screenMat = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false });
  // Just under the bloom threshold — the LCD must stay readable up close.
  screenMat.color.setScalar(0.92);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(L.screen.w, L.screen.h), screenMat);
  lcd.position.z = F + 0.012;
  screenGroup.add(lcd);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(L.screen.w + 0.02, L.screen.h + 0.02),
    // Slightly frosted: a pinpoint reflection stars under bloom and sits on the text.
    new THREE.MeshStandardMaterial({ color: "#1b1410", transparent: true, opacity: 0.16, roughness: 0.2, metalness: 0.1, depthWrite: false }),
  );
  glass.position.z = F + 0.05;
  screenGroup.add(glass);
  for (const [x, y] of [
    [-bw / 2 + 0.06, bh / 2 - 0.06],
    [bw / 2 - 0.06, bh / 2 - 0.06],
    [-bw / 2 + 0.06, -bh / 2 + 0.06],
    [bw / 2 - 0.06, -bh / 2 + 0.06],
  ] as const) {
    const s = screw(mats, 0.024);
    s.position.set(x, y, F + 0.074);
    screenGroup.add(s);
  }

  // ── the control deck ──────────────────────────────────────────────────────
  const Z = F + 0.004;
  const pops: THREE.Object3D[] = [];
  const pop = (o: THREE.Object3D) => {
    pops.push(o);
    return o;
  };

  const modeBtn = pop(new THREE.Group());
  modeBtn.position.set(L.modeBtn.x, L.row, Z);
  const modeCap = new THREE.Mesh(chamferBox(L.modeBtn.w - 0.04, L.modeBtn.h - 0.04, 0.08, 0.02), mats.orangePlastic);
  modeCap.position.z = 0.03;
  const modeBase = new THREE.Mesh(chamferBox(L.modeBtn.w, L.modeBtn.h, 0.03, 0.01), mats.darkMetal);
  modeBtn.add(modeBase, modeCap);
  feet.push({ id: "mode", x: L.modeBtn.x, y: L.row, w: L.modeBtn.w, h: L.modeBtn.h });

  // The sound toggle: a lever on a chrome boss.
  const toggle = pop(new THREE.Group());
  toggle.position.set(L.toggle.x, L.row, Z);
  const boss = new THREE.Mesh(frontCyl(0.05, 0.06, 0.04, 24), chrome);
  boss.position.z = 0.02;
  const plate = new THREE.Mesh(chamferBox(0.1, 0.16, 0.012, 0.004), mats.darkMetal);
  const lever = new THREE.Group();
  lever.position.z = 0.04;
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.13, 12), chrome);
  stalk.position.y = 0.065;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), mats.redPlastic);
  tip.position.y = 0.13;
  lever.add(stalk, tip);
  lever.rotation.x = 0.55; // up and toward the viewer = ON
  toggle.add(plate, boss, lever);
  const toggleHit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.2), mats.hit);
  toggleHit.position.set(0, 0.03, 0.06);
  toggle.add(toggleHit);
  // The lever's tip reaches ~0.14 above the pivot, seen from the front.
  feet.push({ id: "toggle", x: L.toggle.x, y: L.row + 0.035, w: 0.12, h: 0.25 });

  // Knurled knobs.
  const knurl = canvasTex(256, 16, (ctx) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 256, 16);
    ctx.fillStyle = "#000";
    for (let i = 0; i < 64; i++) ctx.fillRect(i * 4, 0, 2, 16);
  }, false);
  knurl.t.wrapS = THREE.RepeatWrapping;
  const knobSide = new THREE.MeshStandardMaterial({ color: "#16171a", roughness: 0.45, metalness: 0.1, bumpMap: knurl.t, bumpScale: 4 });
  const knobTop = new THREE.MeshStandardMaterial({ color: "#1d1e22", roughness: 0.35, metalness: 0.2 });
  const makeKnob = (r: number, h: number, skirt: boolean) => {
    const g = new THREE.Group();
    const spin = new THREE.Group();
    g.add(spin);
    const cyl = new THREE.Mesh(frontCyl(r * 0.92, r, h, 40), [knobSide, knobTop, knobTop]);
    cyl.position.z = h / 2 + (skirt ? 0.02 : 0);
    spin.add(cyl);
    if (skirt) {
      const sk = new THREE.Mesh(frontCyl(r * 1.35, r * KNOB_SKIRT, 0.02, 40), chrome);
      sk.position.z = 0.01;
      spin.add(sk);
    }
    const mark = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.7, 0.006), mats.bone);
    mark.position.set(0, r * 0.45, h + (skirt ? 0.02 : 0) + 0.003);
    spin.add(mark);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.3, r * 1.3, 0.2, 12), mats.hit);
    hit.rotation.x = Math.PI / 2;
    hit.position.z = 0.08;
    g.add(hit);
    return { g, spin, hit, v: { a: Math.random() * 3, vel: 0 } };
  };
  const knobs = [makeKnob(L.knobA.r, 0.07, false), makeKnob(L.knobB.r, 0.07, false), makeKnob(L.rotary.r, 0.09, true)];
  knobs[0].g.position.set(L.knobA.x, L.row, Z);
  knobs[1].g.position.set(L.knobB.x, L.row, Z);
  knobs[2].g.position.set(L.rotary.x, L.rotary.y, Z);
  knobs.forEach((kn) => pop(kn.g));
  feet.push({ id: "gain", x: L.knobA.x, y: L.row, r: L.knobA.r }, { id: "tune", x: L.knobB.x, y: L.row, r: L.knobB.r });

  // Dials: the small level meter and the big yellow module gauge.
  const glassMat = new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.07, roughness: 0.08, metalness: 0, depthWrite: false, envMapIntensity: 0.6 });
  const makeDial = (r: number, face: (ctx: CanvasRenderingContext2D, S: number) => void, needleColor: THREE.Material) => {
    const g = new THREE.Group();
    const housing = new THREE.Mesh(frontCyl(r + 0.035, r + DIAL_RIM, 0.06, 48), mats.darkMetal);
    housing.position.z = 0.03;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.014, 0.022, 12, 56), dullChrome);
    ring.position.z = 0.062;
    const S = hi ? 512 : 256;
    const ft = canvasTex(S, S, (ctx) => face(ctx, S));
    ft.t.anisotropy = aniso;
    const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ map: ft.t, roughness: 0.7 }));
    faceMesh.position.z = 0.061;
    const needle = new THREE.Group();
    needle.position.z = 0.068;
    const nm = new THREE.Mesh(new THREE.BoxGeometry(r * 0.05, r * 0.9, 0.006), needleColor);
    nm.position.y = r * 0.35;
    needle.add(nm);
    const cap = new THREE.Mesh(frontCyl(r * 0.1, r * 0.1, 0.012, 16), mats.darkMetal);
    cap.position.z = 0.072;
    const glassM = new THREE.Mesh(new THREE.CircleGeometry(r + 0.004, 48), glassMat);
    glassM.position.z = 0.08;
    g.add(housing, ring, faceMesh, needle, cap, glassM);
    return { g, needle, v: { val: 0, vel: 0, target: 0 } };
  };
  const agedFace = (ctx: CanvasRenderingContext2D, S: number, base: string) => {
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.fill();
    const gr = ctx.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S / 2);
    gr.addColorStop(0, "rgba(255,255,255,0.10)");
    gr.addColorStop(0.8, "rgba(80,50,10,0.10)");
    gr.addColorStop(1, "rgba(60,30,0,0.45)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, S, S);
    const r = rng(S);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(90,60,20,${0.05 + r() * 0.08})`;
      ctx.beginPath();
      ctx.arc(r() * S, r() * S, 1 + r() * S * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const gauge = makeDial(
    L.gauge.r,
    (ctx, S) => {
      agedFace(ctx, S, "#e6bd38");
      const c = S / 2;
      ctx.strokeStyle = "#1c1408";
      ctx.fillStyle = "#1c1408";
      const R = S * 0.4;
      // Red over-range arc.
      ctx.lineWidth = S * 0.035;
      ctx.strokeStyle = "#b8281a";
      ctx.beginPath();
      ctx.arc(c, c, R, ((-90 + 100) * Math.PI) / 180, ((-90 + 135) * Math.PI) / 180);
      ctx.stroke();
      ctx.strokeStyle = "#1c1408";
      for (let i = 0; i <= 40; i++) {
        const a = ((-135 + (i / 40) * 270) * Math.PI) / 180;
        const major = i % 5 === 0;
        ctx.lineWidth = S * (major ? 0.012 : 0.006);
        ctx.beginPath();
        ctx.moveTo(c + Math.sin(a) * R, c - Math.cos(a) * R);
        ctx.lineTo(c + Math.sin(a) * (R - S * (major ? 0.07 : 0.04)), c - Math.cos(a) * (R - S * (major ? 0.07 : 0.04)));
        ctx.stroke();
        if (major) {
          ctx.font = `700 ${Math.round(S * 0.075)}px ${fonts.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i / 5), c + Math.sin(a) * (R - S * 0.13), c - Math.cos(a) * (R - S * 0.13));
        }
      }
      ctx.font = `900 ${Math.round(S * 0.09)}px ${fonts.display}`;
      ctx.fillText("MOD", c, c + S * 0.17);
      ctx.font = `700 ${Math.round(S * 0.045)}px ${fonts.mono}`;
      ctx.fillText("S-03 · ×1", c, c + S * 0.26);
    },
    mats.needle,
  );
  gauge.g.position.set(L.gauge.x, L.row, Z);
  pop(gauge.g);
  feet.push({ id: "gauge", x: L.gauge.x, y: L.row, r: L.gauge.r + DIAL_RIM });
  const meter = makeDial(
    L.meter.r,
    (ctx, S) => {
      agedFace(ctx, S, "#efe8d6");
      const c = S / 2;
      const R = S * 0.4;
      ctx.strokeStyle = "#222";
      for (let i = 0; i <= 10; i++) {
        const a = ((-60 + i * 12) * Math.PI) / 180;
        ctx.lineWidth = S * 0.02;
        ctx.strokeStyle = i > 7 ? "#b8281a" : "#222";
        ctx.beginPath();
        ctx.moveTo(c + Math.sin(a) * R, c - Math.cos(a) * R);
        ctx.lineTo(c + Math.sin(a) * R * 0.8, c - Math.cos(a) * R * 0.8);
        ctx.stroke();
      }
      ctx.fillStyle = "#222";
      ctx.font = `700 ${Math.round(S * 0.16)}px ${fonts.mono}`;
      ctx.textAlign = "center";
      ctx.fillText("dB", c, c + S * 0.22);
    },
    mats.needle,
  );
  meter.g.position.set(L.meter.x, L.meter.y, Z);
  pop(meter.g);
  feet.push({ id: "meter", x: L.meter.x, y: L.meter.y, r: L.meter.r + DIAL_RIM });

  // LEDs.
  const led = (x: number, hex: string, k0: number, id: string) => {
    const g = new THREE.Group();
    g.position.set(x, L.leds.y, Z);
    const bezelL = new THREE.Mesh(frontCyl(0.03, 0.034, 0.02, 20), chrome);
    bezelL.position.z = 0.01;
    const m = glow(hex, k0);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.018;
    g.add(bezelL, lens);
    pop(g);
    feet.push({ id: `led:${id}`, x, y: L.leds.y, r: 0.034 });
    return m;
  };
  const leds = {
    pwr: led(L.leds.xs[0], "#7dff6a", 0.2, "pwr"),
    link: led(L.leds.xs[1], "#1fc3ec", 0.2, "link"),
    chg: led(L.leds.xs[2], "#ff3b2f", 0.2, "chg"),
  };
  accents.push(leds.link);

  // Round buttons: CHG (orange, hold) and EJECT (red).
  const makeButton = (x: number, y: number, r: number, mat: THREE.Material, id: string) => {
    const g = new THREE.Group();
    g.position.set(x, y, Z);
    const collar = new THREE.Mesh(frontCyl(r * 1.3, r * BTN_COLLAR, 0.035, 40), mats.darkMetal);
    collar.position.z = 0.017;
    const ringLight = glow("#ff3b2f", 0);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(r * 1.12, 0.008, 8, 48), ringLight);
    halo.position.z = 0.037;
    const cap = new THREE.Group();
    cap.position.z = 0.03;
    const capMesh = new THREE.Mesh(buttonCap(r, 0.07), mat);
    cap.add(capMesh);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.35, r * 1.35, 0.2, 16), mats.hit);
    hit.rotation.x = Math.PI / 2;
    hit.position.z = 0.08;
    g.add(collar, halo, cap, hit);
    pop(g);
    feet.push({ id, x, y, r: r * BTN_COLLAR });
    return { g, cap, capMesh, hit, ringLight, press: { z: 0 } };
  };
  const chgBtn = makeButton(L.chg.x, L.chg.y, L.chg.r, mats.orangePlastic.clone(), "chg");
  const ejectBtn = makeButton(L.eject.x, L.eject.y, L.eject.r, mats.redPlastic.clone(), "eject");

  // Every control pops on in the boot, after the screen.
  for (const o of pops) add(chassis, o, 5, "pop");

  // ── service hatch: stickers + segment display ─────────────────────────────
  const hatch = new THREE.Group();
  hatch.position.set(L.hatch.x, L.hatch.y, F);
  add(chassis, hatch, 4, "slide");
  const HW = hi ? 640 : 360;
  const HH = Math.round(HW * (L.hatch.h / L.hatch.w));
  const hw = weathered({ w: HW, h: HH, seed: 33, paint: [224, 218, 202], wear: 0.7, edge: 0.06, streaks: 0.7, unit: HW / L.hatch.w, surf, spots: [{ x: 0.1, y: 0.95, r: 0.15 }] });
  const hk = HW / 560;
  // Yellow ID sticker — the reference's "V囧K 5X65" block.
  sticker(hw, 30 * hk, 92 * hk, 230 * hk, 130 * hk, "#f2c230", (ctx) => {
    ctx.fillStyle = "#141414";
    ctx.font = `900 ${Math.round(74 * hk)}px ${fonts.display}`;
    ctx.textBaseline = "top";
    ctx.fillText("ZE·03", 12 * hk, 2 * hk);
    ctx.font = `900 ${Math.round(46 * hk)}px ${fonts.display}`;
    ctx.fillText("5X-07", 14 * hk, 70 * hk);
  }, -0.02);
  // Spec label.
  // Paper stays near 0.8 albedo, like real paper — whiter clips and blooms under the key light.
  sticker(hw, 300 * hk, 70 * hk, 220 * hk, 150 * hk, "#e4dfd2", (ctx) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.font = `700 ${Math.round(17 * hk)}px ${fonts.mono}`;
    ctx.textBaseline = "top";
    ["MODEL   S-03", "SERIAL  0107", "INPUT   5V ⎓ 2A", "MADE IN BANGKOK", "MFD     2019"].forEach((l, i) => ctx.fillText(l, 12 * hk, (12 + i * 26) * hk));
  }, 0.015);
  // Barcode tag.
  sticker(hw, 32 * hk, 250 * hk, 170 * hk, 70 * hk, "#e4dfd2", (ctx) => {
    const r = rng(77);
    ctx.fillStyle = "#111";
    let x = 10 * hk;
    while (x < 160 * hk) {
      const w = (1 + Math.floor(r() * 3)) * hk;
      if (r() > 0.35) ctx.fillRect(x, 8 * hk, w, 40 * hk);
      x += w + hk;
    }
    ctx.font = `700 ${Math.round(12 * hk)}px ${fonts.mono}`;
    ctx.fillText("0107 2019 0303", 12 * hk, 62 * hk);
  }, 0.03);
  // Red stamp — the reference's red kanji, here the city.
  const stamp = hw.col;
  stamp.save();
  stamp.translate(360 * hk, 300 * hk);
  stamp.rotate(-0.07);
  stamp.strokeStyle = "rgba(178,38,26,0.85)";
  stamp.fillStyle = "rgba(178,38,26,0.85)";
  stamp.lineWidth = 4 * hk;
  stamp.strokeRect(-110 * hk, -44 * hk, 220 * hk, 88 * hk);
  stamp.font = `800 ${Math.round(52 * hk)}px ${fonts.display}, "Thonburi", "Tahoma", sans-serif`;
  stamp.textAlign = "center";
  stamp.textBaseline = "middle";
  stamp.fillText("กรุงเทพฯ", 0, 2 * hk);
  stamp.restore();
  flecks(hw, 250 * hk, 250 * hk, 230 * hk, 100 * hk, 1.4);
  // The segment display window.
  hw.col.fillStyle = "#1e1c1a";
  hw.col.fillRect(70 * hk, HH - 130 * hk, 420 * hk, 80 * hk);
  seam(hw, [[70 * hk, HH - 130 * hk], [490 * hk, HH - 130 * hk], [490 * hk, HH - 50 * hk], [70 * hk, HH - 50 * hk]], true, 2);
  const HATCH_D = 0.05;
  const hatchSlab = new THREE.Mesh(
    slab(roundedRectShape(L.hatch.w - 0.04, L.hatch.h - 0.04, 0.05), L.hatch.w, L.hatch.h, HATCH_D, 0.015, 2),
    [wearMaterial(hw, aniso, { hi, bumpScale: 3 }), sideMat, sideMat],
  );
  hatchSlab.position.z = 0.02;
  hatch.add(hatchSlab);
  for (const [x, y] of [
    [-L.hatch.w / 2 + 0.05, L.hatch.h / 2 - 0.05],
    [L.hatch.w / 2 - 0.05, L.hatch.h / 2 - 0.05],
    [-L.hatch.w / 2 + 0.05, -L.hatch.h / 2 + 0.05],
    [L.hatch.w / 2 - 0.05, -L.hatch.h / 2 + 0.05],
  ] as const) {
    const s = screw(mats, 0.022);
    s.position.set(x, y, 0.045);
    hatch.add(s);
  }
  // Segment LCD, updated when the module changes.
  const seg = canvasTex(hi ? 512 : 256, hi ? 96 : 48, () => undefined);
  const segMat = new THREE.MeshBasicMaterial({ map: seg.t, toneMapped: false });
  segMat.color.setScalar(0.9);
  const segW = (420 / 560) * L.hatch.w * 0.94;
  const segH = segW * (seg.c.height / seg.c.width);
  const segMesh = new THREE.Mesh(new THREE.PlaneGeometry(segW, segH), segMat);
  segMesh.position.set(((70 + 210) / 560 - 0.5) * L.hatch.w, (0.5 - (HH - 90 * hk) / HH) * L.hatch.h, 0.047);
  hatch.add(segMesh);
  const drawSeg = (text: string) => {
    const { ctx, c } = seg;
    ctx.fillStyle = "#9aa887";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.font = `700 ${Math.round(c.height * 0.7)}px ${fonts.mono}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(20,30,15,0.10)";
    ctx.fillText("88:88:88", c.width * 0.06, c.height * 0.54);
    ctx.fillStyle = "#18200f";
    ctx.fillText(text, c.width * 0.06, c.height * 0.54);
    seg.t.needsUpdate = true;
  };
  drawSeg("-- -- --");

  // ── slot housing on top ───────────────────────────────────────────────────
  // A rounded profile (depth × height) extruded along x. It sits on the
  // chassis top, sunk HOUSING.sink into it, so from the front it rises above
  // the top edge and never covers the face.
  const hump = new THREE.Group();
  hump.position.y = H / 2 - HOUSING.sink + HOUSING.h / 2;
  add(chassis, hump, 6);
  const profile = roundedRectShape(HOUSING.d, HOUSING.h, HOUSING.r);
  const profPer = perimeterParam(profile);
  // Canvas: x across the housing's length, y round its profile (front at the middle band).
  const HUW = hi ? 560 : 320;
  const HUH = Math.round(HUW * (profPer.total / HOUSING.len));
  const huUnit = HUW / HOUSING.len;
  const humpWear = weathered({ w: HUW, h: HUH, seed: 55, paint: [176, 176, 170], wear: 0.72, edge: 0.05, streaks: 0.4, unit: huUnit, surf });
  // Arc-length → canvas row (canvas top is v = 1).
  const rowOf = (s: number) => (1 - s / profPer.total) * HUH;
  const frontRow = rowOf(profPer.at(HOUSING.d / 2, 0));
  humpWear.col.font = `700 ${Math.round(0.055 * huUnit)}px ${fonts.mono}`;
  humpWear.col.textAlign = "center";
  humpWear.col.textBaseline = "middle";
  wornText(humpWear, "▼  INSERT MODULE  ▼", HUW / 2, frontRow, humpWear.col.font, "#1a1a1a", { align: "center", wear: 0.4 });
  // A fine hazard band along the front's lower edge.
  const hzRow = rowOf(profPer.at(HOUSING.d / 2, -HOUSING.h / 2 + 0.06));
  const hzH = 0.022 * huUnit;
  humpWear.col.save();
  humpWear.col.beginPath();
  humpWear.col.rect(HUW * 0.08, hzRow - hzH / 2, HUW * 0.84, hzH);
  humpWear.col.clip();
  humpWear.col.fillStyle = "#e2b12c";
  humpWear.col.fillRect(0, hzRow - hzH / 2, HUW, hzH);
  humpWear.col.fillStyle = "#1a1a1a";
  for (let x = -hzH; x < HUW; x += hzH * 1.6) {
    humpWear.col.beginPath();
    humpWear.col.moveTo(x, hzRow + hzH / 2);
    humpWear.col.lineTo(x + hzH * 0.8, hzRow + hzH / 2);
    humpWear.col.lineTo(x + hzH * 1.8, hzRow - hzH / 2);
    humpWear.col.lineTo(x + hzH, hzRow - hzH / 2);
    humpWear.col.fill();
  }
  humpWear.col.restore();
  flecks(humpWear, HUW * 0.08, hzRow - hzH / 2, HUW * 0.84, hzH, 1.2);
  const humpMat = wearMaterial(humpWear, aniso, { hi, bumpScale: 2, coat: 0.4 });
  // Extrusion z runs along world −x after the turn, so u = 1 − v01.
  const humpGeo = slab(profile, HOUSING.d, HOUSING.h, HOUSING.len, 0.012, 2, (s, v01) => [1 - v01, s / profPer.total]);
  humpGeo.rotateY(-Math.PI / 2);
  const humpMesh = new THREE.Mesh(humpGeo, [gunmetal, humpMat, gunmetal]);
  hump.add(humpMesh);
  // End plates: the same profile a little proud, in gunmetal, with hex hubs.
  const capProfile = roundedRectShape(HOUSING.d + 0.04, HOUSING.h + 0.03, HOUSING.r + 0.02);
  const CAP_T = 0.06;
  const capGeo = slab(capProfile, HOUSING.d + 0.04, HOUSING.h + 0.03, CAP_T, 0.012, 2, tiledSide(CAP_T));
  capGeo.rotateY(Math.PI / 2);
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(capGeo, [gunmetal, gunmetal, gunmetal]);
    cap.position.x = sx * (HOUSING.len / 2 + CAP_T / 2 - 0.005);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 6), chrome);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = sx * (HOUSING.len / 2 + CAP_T + 0.01);
    hump.add(cap, hub);
  }
  const mouth = new THREE.Mesh(chamferBox(1.12, 0.04, 0.34, 0.012), mats.darkMetal);
  mouth.position.y = HOUSING.h / 2 + 0.015;
  hump.add(mouth);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.02, 0.27), mats.void);
  hole.position.y = HOUSING.h / 2 + 0.03;
  hump.add(hole);
  // The slot's lip lights are driven by the stage, not the accent sweep: they
  // answer a hovered card in its colour and flare as one goes in.
  const lipMat = glow("#1fc3ec", 1.3);
  for (const z of [-0.138, 0.138]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.014, 0.01), lipMat);
    l.position.set(0, HOUSING.h / 2 + 0.037, z);
    hump.add(l);
  }

  // Hold-to-charge volume: the whole chassis.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, H + 0.2, D + 0.2), mats.hit);
  hit.position.y = BODY.base + H / 2;
  root.add(hit);

  if (process.env.NODE_ENV !== "production") checkLayout(feet);

  return {
    root,
    body,
    chassis,
    hatch,
    screenGroup,
    screen,
    assembly,
    accents,
    slotLights: lipMat,
    hit,
    eject: ejectBtn,
    charge: chgBtn,
    toggle: { hit: toggleHit, lever, on: true },
    knobs,
    gauge,
    meter,
    leds,
    drawSeg,
  };
}

export type Reader = ReturnType<typeof buildReader>;
