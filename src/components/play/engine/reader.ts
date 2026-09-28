/*
 * THE READER — the handheld card reader the cartridges slot into. Modelled
 * on the reference: a cream enamel chassis gone to rust at the edges, an
 * orange LCD in a screwed-down bezel, a yellow analog gauge, knobs, a
 * stickered service hatch, round CHG / EJECT buttons, and a slot housing on
 * top.
 *
 * Everything is primitives + canvas maps. Coordinates in this file are
 * CHASSIS-LOCAL: origin at the chassis centre, +z out of the front face.
 * The chassis sits in `body`, whose origin is the chassis bottom — that is
 * the squash pivot, so a slam compresses the reader into its cradle.
 *
 * Working controls (raycast targets, see Stage.pick):
 *   eject   red round button — presses in, springs back, ejects
 *   charge  orange round button — hold to overcharge
 *   toggle  red lever — sound on/off
 *   knobs   two small knobs + the big rotary — click to spin
 */

import * as THREE from "three";
import { chamferBox, glow, holoRingMaterial, type Mats } from "./models";
import { ReaderScreen } from "./screen";
import type { Fonts } from "./textures";
import { plinthTexture, rng } from "./textures";
import { flecks, seam, sticker, wearMaps, weathered, wornText, type WearSpot } from "./weathering";

export const BODY = { w: 1.9, h: 2.9, d: 0.56, base: 0.5 };
const F = BODY.d / 2; // front face z
const HUMP_R = 0.3;
/** World y of the slot mouth on top of the housing. */
export const SLOT_TOP = BODY.base + BODY.h - 0.02 + HUMP_R;
/** Inserted cartridge centre: ~0.64 of it stands proud of the slot. */
export const INSERT_Y = SLOT_TOP + 0.04;
export const HOVER_Y = SLOT_TOP + 1.45;
/** World-space centre of the LCD — the close-up camera frames on it. */
export const SCREEN_Y = BODY.base + BODY.h / 2 + 0.72;

// ── layout (chassis-local) ─────────────────────────────────────────────────

const L = {
  screen: { x: 0, y: 0.72, w: 1.42, h: 0.84 },
  bezel: { w: 1.66, h: 1.08 },
  row: -0.04,
  modeBtn: { x: -0.66 },
  toggle: { x: -0.4 },
  knobA: { x: -0.17 },
  knobB: { x: 0.05 },
  meter: { x: 0.21, r: 0.075 },
  gauge: { x: 0.64, y: -0.02, r: 0.25 },
  hatch: { x: -0.43, y: -0.84, w: 0.9, h: 1.02 },
  leds: { y: -0.39, xs: [0.24, 0.42, 0.6] },
  rotary: { x: 0.49, y: -0.68, r: 0.13 },
  chg: { x: 0.3, y: -1.08, r: 0.12 },
  eject: { x: 0.7, y: -1.08, r: 0.12 },
};

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

/** Extrude with a soft multi-segment bevel and planar UVs over (w, h). */
function softSlab(shape: THREE.Shape, w: number, h: number, d: number, b: number, segs = 3) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: segs, curveSegments: 10 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

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

function screw(mats: Mats, r = 0.028) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(frontCyl(r, r * 1.05, 0.018, 16), mats.screw);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, r * 0.28, 0.006), mats.darkMetal);
  slot.position.z = 0.011;
  slot.rotation.z = Math.random() * Math.PI;
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

export function buildReader(fonts: Fonts, aniso: number, mats: Mats, hi: boolean, modulesCount: number) {
  const { w: W, h: H, d: D } = BODY;
  const root = new THREE.Group();
  root.name = "reader";
  const assembly: Assembly[] = [];
  const accents: THREE.MeshBasicMaterial[] = [];
  const add = (parent: THREE.Object3D, o: THREE.Object3D, order: number, kind: Assembly["kind"] = "drop") => {
    parent.add(o);
    assembly.push({ obj: o, order, kind });
    return o;
  };

  // ── dock: the plinth from the print edition's unit, and a cradle ────────
  const OCT = Math.PI / 8;
  const plinthMat = new THREE.MeshStandardMaterial({ color: "#2c3037", metalness: 0.7, roughness: 0.42, map: plinthTexture(fonts, aniso) });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.68, 0.34, 8), [plinthMat, mats.darkMetal, mats.darkMetal]);
  plinth.position.y = 0.17;
  plinth.rotation.y = OCT;
  add(root, plinth, 0);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(1.71, 1.71, 0.035, 8, 1, true), glow("#1fc3ec", 2.2));
  lip.position.y = 0.03;
  lip.rotation.y = OCT;
  accents.push(lip.material as THREE.MeshBasicMaterial);
  add(root, lip, 0);
  const step = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.42, 0.14, 8), mats.gunmetal);
  step.position.y = 0.41;
  step.rotation.y = OCT;
  add(root, step, 1);

  const cradle = new THREE.Group();
  add(root, cradle, 1);
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(chamferBox(0.16, 0.72, 0.74, 0.03), mats.gunmetal);
    arm.position.set(sx * (W / 2 + 0.07), BODY.base + 0.3, 0);
    cradle.add(arm);
    const pad = new THREE.Mesh(chamferBox(0.05, 0.5, 0.5, 0.012), mats.rubber);
    pad.position.set(sx * (W / 2 + 0.005), BODY.base + 0.32, 0);
    cradle.add(pad);
    for (const z of [-0.22, 0.22]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 6), mats.chrome);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(sx * (W / 2 + 0.16), BODY.base + 0.42, z);
      cradle.add(bolt);
    }
  }
  const foot = new THREE.Mesh(chamferBox(W * 0.8, 0.06, 0.5, 0.02), mats.darkMetal);
  foot.position.set(0, BODY.base - 0.02, 0);
  cradle.add(foot);

  // ── body: squash pivot at the chassis bottom ──────────────────────────────
  const body = new THREE.Group();
  body.position.y = BODY.base;
  add(root, body, 2);
  const chassis = new THREE.Group();
  chassis.position.y = H / 2;
  body.add(chassis);

  // Enamel, weathered around every control.
  const TW = hi ? 900 : 540;
  const TH = Math.round(TW * (H / W));
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
    spots: [
      uvSpot(L.modeBtn.x, L.row, 0.14),
      uvSpot(L.toggle.x, L.row, 0.08),
      uvSpot(L.knobA.x, L.row, 0.09),
      uvSpot(L.knobB.x, L.row, 0.09),
      uvSpot(L.gauge.x, L.gauge.y, 0.3, 0.8),
      uvSpot(L.rotary.x, L.rotary.y, 0.15),
      uvSpot(L.chg.x, L.chg.y, 0.14, 1.2),
      uvSpot(L.eject.x, L.eject.y, 0.14, 1.3),
      uvSpot(0, L.screen.y + 0.55, 0.3, 0.6),
      uvSpot(-0.85, -1.3, 0.25, 0.8),
      uvSpot(0.86, 1.1, 0.2, 0.7),
    ],
  });

  // Seams: the hatch recess, the screen deck line, the right control plate.
  const S = (x: number, y: number): [number, number] => [px(x), py(y)];
  seam(wear, [S(-0.93, 0.12), S(0.93, 0.12)]);
  seam(wear, [S(-0.93, -0.24), S(0.93, -0.24)]);
  seam(wear, [S(0.08, -0.24), S(0.08, -1.42)]);
  seam(wear, [S(L.hatch.x - L.hatch.w / 2 - 0.03, L.hatch.y + L.hatch.h / 2 + 0.03), S(L.hatch.x + L.hatch.w / 2 + 0.03, L.hatch.y + L.hatch.h / 2 + 0.03), S(L.hatch.x + L.hatch.w / 2 + 0.03, L.hatch.y - L.hatch.h / 2 - 0.03), S(L.hatch.x - L.hatch.w / 2 - 0.03, L.hatch.y - L.hatch.h / 2 - 0.03)], true);

  // Printed legends.
  const k = TW / 900;
  const ink = "#2a2621";
  wornText(wear, "SATASUK", px(-0.8), py(1.33), `900 ${Math.round(58 * k)}px ${fonts.display}`, ink, { emboss: true, wear: 0.6 });
  wornText(wear, "FIELD UNIT · S-03", px(0.8), py(1.33), `700 ${Math.round(18 * k)}px ${fonts.mono}`, ink, { align: "right", wear: 0.5 });
  const legend = (t: string, x: number, y: number, size = 15, color = ink) => wornText(wear, t, px(x), py(y), `700 ${Math.round(size * k)}px ${fonts.mono}`, color, { align: "center", wear: 0.35 });
  legend("MODE", L.modeBtn.x, L.row - 0.13);
  legend("SND", L.toggle.x, L.row - 0.13);
  legend("GAIN", L.knobA.x, L.row - 0.13);
  legend("TUNE", L.knobB.x, L.row - 0.13);
  legend("LVL", L.meter.x, L.row - 0.13);
  legend("PWR", L.leds.xs[0], L.leds.y - 0.08, 13);
  legend("LINK", L.leds.xs[1], L.leds.y - 0.08, 13);
  legend("CHG", L.leds.xs[2], L.leds.y - 0.08, 13);
  legend("HOLD · CHG", L.chg.x, L.chg.y - 0.19, 14);
  legend("EJECT ⏏", L.eject.x, L.eject.y - 0.19, 15, "#8a1c12");
  legend("MFD 2019 · BKK", 0.52, -1.37, 12);
  // Rotary scale ticks.
  const rc = { x: px(L.rotary.x), y: py(L.rotary.y) };
  wear.col.strokeStyle = ink;
  for (let i = 0; i <= 10; i++) {
    const a = (-135 + i * 27) * (Math.PI / 180);
    const r0 = (L.rotary.r + 0.03) / W * TW;
    const r1 = r0 + (i % 5 === 0 ? 12 : 7) * k;
    wear.col.lineWidth = 2 * k;
    wear.col.beginPath();
    wear.col.moveTo(rc.x + Math.sin(a) * r0, rc.y - Math.cos(a) * r0);
    wear.col.lineTo(rc.x + Math.sin(a) * r1, rc.y - Math.cos(a) * r1);
    wear.col.stroke();
  }
  // Red diamond warning marks, as on the reference hatch.
  wear.col.fillStyle = "#b32a1c";
  for (const [x, y] of [[-0.43, -0.24 + 0.07]] as const) {
    const cx = px(x);
    const cy = py(y);
    wear.col.beginPath();
    wear.col.moveTo(cx, cy - 10 * k);
    wear.col.lineTo(cx + 7 * k, cy);
    wear.col.lineTo(cx, cy + 10 * k);
    wear.col.lineTo(cx - 7 * k, cy);
    wear.col.fill();
  }
  // Side vent slots near the top right edge.
  for (let i = 0; i < 6; i++) {
    wear.col.fillStyle = "rgba(20,16,12,0.85)";
    wear.col.fillRect(px(0.62), py(1.2 - i * 0.06), px(0.86) - px(0.62), 4 * k);
  }
  flecks(wear, px(0.6), py(1.22), px(0.88) - px(0.6), 60 * k, 0.8);

  const bodyMaps = wearMaps(wear, aniso);
  const paint = new THREE.MeshStandardMaterial({ ...bodyMaps, bumpScale: 3, metalness: 0.18, roughness: 1 });
  const chassisMesh = new THREE.Mesh(softSlab(roundedRectShape(W - 0.1, H - 0.1, 0.16), W, H, D, 0.05), paint);
  chassis.add(chassisMesh);

  // Side ribs and strap lugs.
  for (const sx of [-1, 1]) {
    for (const y of [0.95, 0.35]) {
      const rib = new THREE.Mesh(chamferBox(0.05, 0.08, 0.42, 0.012), mats.gunmetal);
      rib.position.set(sx * (W / 2 + 0.015), y, 0);
      chassis.add(rib);
    }
    const lug = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), mats.gunmetal);
    lug.position.set(sx * (W / 2 + 0.02), H / 2 - 0.3, -0.05);
    lug.rotation.y = Math.PI / 2;
    chassis.add(lug);
  }
  // Body corner screws.
  for (const [x, y] of [
    [-0.8, 1.2],
    [0.8, 0.14 + 0.05],
    [-0.8, -1.33],
    [0.82, -1.33],
  ] as const) {
    const s = screw(mats, 0.026);
    s.position.set(x, y, F + 0.004);
    chassis.add(s);
  }

  // ── screen: bezel, LCD, glass ─────────────────────────────────────────────
  const screenGroup = new THREE.Group();
  screenGroup.position.set(L.screen.x, L.screen.y, 0);
  add(chassis, screenGroup, 3, "slide");
  const bw = L.bezel.w;
  const bh = L.bezel.h;
  const bezelShape = roundedRectShape(bw, bh, 0.08);
  bezelShape.holes.push(roundedRectShape(L.screen.w + 0.02, L.screen.h + 0.02, 0.05) as unknown as THREE.Path);
  const bwear = weathered({ w: hi ? 640 : 400, h: hi ? 420 : 262, seed: 21, paint: [74, 76, 78], wear: 0.6, edge: 0.05, streaks: 0.6 });
  const bezel = new THREE.Mesh(softSlab(bezelShape, bw, bh, 0.085, 0.022, 2), new THREE.MeshStandardMaterial({ ...wearMaps(bwear, aniso), bumpScale: 2, metalness: 0.45, roughness: 1 }));
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
    new THREE.MeshStandardMaterial({ color: "#1b1410", transparent: true, opacity: 0.16, roughness: 0.06, metalness: 0.1, depthWrite: false }),
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

  // ── the control row ───────────────────────────────────────────────────────
  const Z = F + 0.004;
  const pops: THREE.Object3D[] = [];
  const pop = (o: THREE.Object3D) => {
    pops.push(o);
    return o;
  };

  const modeBtn = pop(new THREE.Group());
  modeBtn.position.set(L.modeBtn.x, L.row, Z);
  const modeCap = new THREE.Mesh(chamferBox(0.28, 0.13, 0.08, 0.02), mats.orangePlastic);
  modeCap.position.z = 0.03;
  const modeBase = new THREE.Mesh(chamferBox(0.32, 0.17, 0.03, 0.01), mats.darkMetal);
  modeBtn.add(modeBase, modeCap);

  // The sound toggle: a lever on a chrome boss.
  const toggle = pop(new THREE.Group());
  toggle.position.set(L.toggle.x, L.row, Z);
  const boss = new THREE.Mesh(frontCyl(0.05, 0.06, 0.04, 24), mats.chrome);
  boss.position.z = 0.02;
  const plate = new THREE.Mesh(chamferBox(0.1, 0.16, 0.012, 0.004), mats.darkMetal);
  const lever = new THREE.Group();
  lever.position.z = 0.04;
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.13, 12), mats.chrome);
  stalk.position.y = 0.065;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), mats.redPlastic);
  tip.position.y = 0.13;
  lever.add(stalk, tip);
  lever.rotation.x = 0.55; // up and toward the viewer = ON
  toggle.add(plate, boss, lever);
  const toggleHit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.2), mats.hit);
  toggleHit.position.set(0, 0.03, 0.06);
  toggle.add(toggleHit);

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
      const sk = new THREE.Mesh(frontCyl(r * 1.35, r * 1.4, 0.02, 40), mats.chrome);
      sk.position.z = 0.01;
      spin.add(sk);
    }
    const mark = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.7, 0.006), mats.bone);
    mark.position.set(0, r * 0.45, h + (skirt ? 0.02 : 0) + 0.003);
    spin.add(mark);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.2, 12), mats.hit);
    hit.rotation.x = Math.PI / 2;
    hit.position.z = 0.08;
    g.add(hit);
    return { g, spin, hit, v: { a: Math.random() * 3, vel: 0 } };
  };
  const knobs = [makeKnob(0.085, 0.07, false), makeKnob(0.085, 0.07, false), makeKnob(L.rotary.r, 0.09, true)];
  knobs[0].g.position.set(L.knobA.x, L.row, Z);
  knobs[1].g.position.set(L.knobB.x, L.row, Z);
  knobs[2].g.position.set(L.rotary.x, L.rotary.y, Z);
  knobs.forEach((kn) => pop(kn.g));

  // Dials: the small level meter and the big yellow module gauge.
  const makeDial = (r: number, face: (ctx: CanvasRenderingContext2D, S: number) => void, needleColor: THREE.Material) => {
    const g = new THREE.Group();
    const housing = new THREE.Mesh(frontCyl(r + 0.035, r + 0.045, 0.06, 48), mats.darkMetal);
    housing.position.z = 0.03;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.014, 0.022, 12, 56), mats.dullChrome);
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
    const glassM = new THREE.Mesh(new THREE.CircleGeometry(r + 0.004, 48), new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.08, roughness: 0.04, metalness: 0, depthWrite: false }));
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
  gauge.g.position.set(L.gauge.x, L.gauge.y, Z);
  pop(gauge.g);
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
  meter.g.position.set(L.meter.x, L.row, Z);
  pop(meter.g);

  // LEDs.
  const led = (x: number, hex: string, k0: number) => {
    const g = new THREE.Group();
    g.position.set(x, L.leds.y, Z);
    const bezelL = new THREE.Mesh(frontCyl(0.03, 0.034, 0.02, 20), mats.chrome);
    bezelL.position.z = 0.01;
    const m = glow(hex, k0);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.018;
    g.add(bezelL, lens);
    pop(g);
    return m;
  };
  const leds = { pwr: led(L.leds.xs[0], "#7dff6a", 0.2), link: led(L.leds.xs[1], "#1fc3ec", 0.2), chg: led(L.leds.xs[2], "#ff3b2f", 0.2) };
  accents.push(leds.link);

  // Round buttons: CHG (orange, hold) and EJECT (red).
  const makeButton = (x: number, y: number, r: number, mat: THREE.Material) => {
    const g = new THREE.Group();
    g.position.set(x, y, Z);
    const collar = new THREE.Mesh(frontCyl(r * 1.3, r * 1.38, 0.035, 40), mats.darkMetal);
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
    return { g, cap, capMesh, hit, ringLight, press: { z: 0 } };
  };
  const chgBtn = makeButton(L.chg.x, L.chg.y, L.chg.r, mats.orangePlastic.clone());
  const ejectBtn = makeButton(L.eject.x, L.eject.y, L.eject.r, mats.redPlastic.clone());

  // Every control pops on in the boot, after the screen.
  for (const o of pops) add(chassis, o, 5, "pop");

  // ── service hatch: stickers + segment display ─────────────────────────────
  const hatch = new THREE.Group();
  hatch.position.set(L.hatch.x, L.hatch.y, F);
  add(chassis, hatch, 4, "slide");
  const HW = hi ? 560 : 360;
  const HH = Math.round(HW * (L.hatch.h / L.hatch.w));
  const hw = weathered({ w: HW, h: HH, seed: 33, paint: [232, 226, 210], wear: 0.7, edge: 0.06, streaks: 0.7, spots: [{ x: 0.1, y: 0.95, r: 0.15 }] });
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
  sticker(hw, 300 * hk, 70 * hk, 220 * hk, 150 * hk, "#f4f1e8", (ctx) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.font = `700 ${Math.round(17 * hk)}px ${fonts.mono}`;
    ctx.textBaseline = "top";
    ["MODEL   S-03", "SERIAL  0107", "INPUT   5V ⎓ 2A", "MADE IN BANGKOK", "SATASUK V."].forEach((l, i) => ctx.fillText(l, 12 * hk, (12 + i * 26) * hk));
  }, 0.015);
  // Barcode tag.
  sticker(hw, 32 * hk, 250 * hk, 170 * hk, 70 * hk, "#f4f1e8", (ctx) => {
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
  const hatchMat = new THREE.MeshStandardMaterial({ ...wearMaps(hw, aniso), bumpScale: 3, metalness: 0.15, roughness: 1 });
  const hatchSlab = new THREE.Mesh(softSlab(roundedRectShape(L.hatch.w - 0.04, L.hatch.h - 0.04, 0.05), L.hatch.w, L.hatch.h, 0.05, 0.015, 2), hatchMat);
  hatchSlab.position.z = 0.02;
  hatch.add(hatchSlab);
  for (const [x, y] of [
    [-L.hatch.w / 2 + 0.05, L.hatch.h / 2 - 0.05],
    [L.hatch.w / 2 - 0.05, L.hatch.h / 2 - 0.05],
    [-L.hatch.w / 2 + 0.05, -L.hatch.h / 2 + 0.05],
    [L.hatch.w / 2 - 0.05, -L.hatch.h / 2 + 0.05],
  ] as const) {
    const s = screw(mats, 0.022);
    s.position.set(x, y, 0.046);
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
  const hump = new THREE.Group();
  hump.position.y = H / 2 - 0.02;
  add(chassis, hump, 6);
  const humpWear = weathered({ w: hi ? 512 : 320, h: hi ? 256 : 160, seed: 55, paint: [176, 176, 170], wear: 0.7, edge: 0.04, streaks: 0.4 });
  for (const u0 of [0.18, 0.68]) {
    humpWear.col.fillStyle = "#1a1a1a";
    humpWear.col.font = `700 ${Math.round(humpWear.H * 0.12)}px ${fonts.mono}`;
    humpWear.col.fillText("INSERT ▼ MODULE", humpWear.W * u0, humpWear.H * 0.3);
  }
  const humpMat = new THREE.MeshStandardMaterial({ ...wearMaps(humpWear, aniso), bumpScale: 2, metalness: 0.35, roughness: 1 });
  const humpMesh = new THREE.Mesh(new THREE.CylinderGeometry(HUMP_R, HUMP_R, 1.34, 40, 1, true), humpMat);
  humpMesh.rotation.z = Math.PI / 2;
  hump.add(humpMesh);
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(HUMP_R + 0.02, HUMP_R + 0.02, 0.07, 40), mats.gunmetal);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = sx * 0.7;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 6), mats.chrome);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = sx * 0.745;
    hump.add(cap, hub);
  }
  const mouth = new THREE.Mesh(chamferBox(1.12, 0.05, 0.34, 0.015), mats.darkMetal);
  mouth.position.y = HUMP_R - 0.005;
  hump.add(mouth);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.02, 0.27), mats.void);
  hole.position.y = HUMP_R + 0.013;
  hump.add(hole);
  const lipMat = glow("#1fc3ec", 1.3);
  accents.push(lipMat);
  for (const z of [-0.138, 0.138]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.014, 0.01), lipMat);
    l.position.set(0, HUMP_R + 0.02, z);
    hump.add(l);
  }

  // The insertion guide — a hologram halo over the slot.
  const haloGroup = new THREE.Group();
  haloGroup.position.y = HOVER_Y - 0.2;
  root.add(haloGroup);
  const haloMat = holoRingMaterial("#1fc3ec", 1.4, 24, 0.12);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.76, 64), haloMat);
  halo.rotation.x = -Math.PI / 2;
  const halo2Mat = holoRingMaterial("#1fc3ec", 0.8, 8, -0.2);
  const halo2 = new THREE.Mesh(new THREE.RingGeometry(0.84, 0.9, 64), halo2Mat);
  halo2.rotation.x = -Math.PI / 2;
  haloGroup.add(halo, halo2);
  assembly.push({ obj: haloGroup, order: 8, kind: "pop" });

  // Cables off the dock.
  for (const [a, len, r] of [
    [2.4, 6.5, 0.07],
    [3.35, 8, 0.05],
    [4.2, 5.5, 0.06],
    [-2.6, 7, 0.08],
  ] as const) {
    const s = new THREE.Vector3(Math.sin(a) * 1.55, 0.14, Math.cos(a) * 1.55);
    const mid = new THREE.Vector3(Math.sin(a + 0.12) * 2.4, 0.03, Math.cos(a + 0.12) * 2.4);
    const e = new THREE.Vector3(Math.sin(a + 0.3) * len, r, Math.cos(a + 0.3) * len);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([s, mid, e]), 40, r, 8), mats.rubber);
    add(root, tube, 0, "pop");
  }

  // Hold-to-charge volume: the whole chassis.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, H + 0.2, D + 0.2), mats.hit);
  hit.position.y = BODY.base + H / 2;
  root.add(hit);

  return {
    root,
    body,
    chassis,
    hatch,
    screenGroup,
    screen,
    assembly,
    accents,
    haloGroup,
    haloMats: [haloMat, halo2Mat],
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
