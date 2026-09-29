/*
 * THE CASE — where the cartridges live when nobody is holding one.
 *
 * A hard-shell field case, lid propped open behind the row. The cartridges
 * stand on edge in a foam rack, front to back in reading order, each slot one
 * step higher than the one before it, so every card shows the top of its face
 * — its number and its code word — over the shoulder of the card in front.
 * From the wide shot that is a staircase of seven spot colours, which is the
 * whole invitation: open me.
 *
 * Case-local coordinates: origin at the centre of the floor, y up, the row
 * running along z with slot 0 at the +z (front) end, every card facing +z.
 * The stage places the case in the world; `slot()` answers where a card sits
 * in WORLD space, for as long as the case's matrixWorld is current.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { PlayModule } from "@/content/play";
import { CART, glow, setGlow, type Mats } from "./models";
import { SLOT_PITCH, caseDims } from "./layout";
import { canvas, hazard, barcode, roundRect, tex, rng, type Fonts } from "./textures";
import { mergeStatic } from "./merge";

/**
 * Front wall height, floor thickness, and the step between neighbouring slots.
 * The rack is a ramp: each slot sits `RISE` higher than the one in front of it,
 * so from above every card shows a strip of its face over the shoulder of the
 * card before it. The strip has to clear the bare plastic above a label and
 * reach the number and the code word (about 0.33 in screen height), which
 * takes both the pitch and the step — see SLOT_PITCH in layout.ts.
 */
const HT = 0.46;
const FLOOR = 0.08;
export const RISE = 0.1;
const FOAM = 0.05;
/** The lid, stood up and leaned back. */
const LID = { h: 1.4, lean: 0.2 };

/** World-ish height of a card's centre in slot `i`, case-local. */
export const slotY = (i: number) => FLOOR + FOAM + 0.625 + i * RISE;

function box(w: number, h: number, d: number, r = 0.016) {
  // A one-segment bevel catches a highlight on every edge, which is all a box needs.
  const seg = 1;
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
}

// ── decals ──────────────────────────────────────────────────────────────────

function sideDecal(modules: PlayModule[], fonts: Fonts, aniso: number) {
  const W = 1536;
  const H = 384;
  const [c, ctx] = canvas(W, H);
  ctx.clearRect(0, 0, W, H);
  const ink = "#e9e4d6";
  // Stencil block.
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.86;
  ctx.font = `900 150px ${fonts.display}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("CARTRIDGE CASE", 40, 175);
  ctx.globalAlpha = 0.6;
  ctx.font = `700 40px ${fonts.mono}`;
  ctx.fillText(`S-03 · ${String(modules.length).padStart(2, "0")} × MOD · FIELD ISSUE`, 46, 240);
  ctx.globalAlpha = 1;
  // Colour chips, one per module, in slot order.
  modules.forEach((m, i) => {
    ctx.fillStyle = m.color;
    roundRect(ctx, 46 + i * 62, 272, 50, 26, 6);
    ctx.fill();
  });
  // Hazard band and serial.
  hazard(ctx, 0, H - 58, W, 58, "#ffc400", "#101010", 26);
  barcode(ctx, W - 470, 250, 400, 50, 7, ink);
  ctx.fillStyle = ink;
  ctx.font = `600 30px ${fonts.mono}`;
  ctx.textAlign = "right";
  ctx.fillText("SN 0003-BKK", W - 74, 226);
  return tex(c, aniso);
}

function endDecal(n: number, fonts: Fonts, aniso: number) {
  const W = 512;
  const H = 256;
  const [c, ctx] = canvas(W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#e9e4d6";
  ctx.font = `900 170px ${fonts.display}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(n).padStart(2, "0"), 26, 190);
  ctx.font = `700 34px ${fonts.mono}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText("MODULES", 250, 120);
  ctx.fillText("LIFT LID", 250, 166);
  ctx.globalAlpha = 1;
  hazard(ctx, 250, 190, 230, 26, "#ffc400", "#101010", 12);
  return tex(c, aniso);
}

/** The lid's inside face: an index card for the cartridges below it. */
function lidFace(modules: PlayModule[], fonts: Fonts, aniso: number) {
  const W = 640;
  const H = 1400;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#15171b";
  ctx.fillRect(0, 0, W, H);
  // Foam texture: fine dark speckle.
  const r = rng(4242);
  for (let i = 0; i < 5200; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.03})`;
    ctx.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  ctx.strokeStyle = "rgba(233,228,214,0.22)";
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, W - 48, H - 48, 26);
  ctx.stroke();

  ctx.fillStyle = "#e9e4d6";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 30px ${fonts.mono}`;
  ctx.globalAlpha = 0.6;
  ctx.fillText("FIELD UNIT S-03 // CASE INDEX", 60, 90);
  ctx.globalAlpha = 1;
  ctx.font = `900 108px ${fonts.display}`;
  ctx.fillText("MODULES", 56, 196);
  ctx.fillRect(60, 224, W - 120, 5);

  const rows = modules.length;
  const top = 270;
  const rowH = 122;
  modules.forEach((m, i) => {
    const y = top + i * rowH;
    ctx.fillStyle = m.color;
    roundRect(ctx, 60, y, W - 120, rowH - 20, 20);
    ctx.fill();
    ctx.fillStyle = "#101010";
    ctx.font = `800 64px ${fonts.display}`;
    ctx.fillText(m.n, 84, y + 76);
    ctx.font = `800 40px ${fonts.display}`;
    ctx.fillText(m.label.toUpperCase(), 196, y + 50);
    ctx.font = `700 22px ${fonts.mono}`;
    ctx.fillText(m.code, 198, y + 78);
  });
  const fy = top + rows * rowH + 24;
  hazard(ctx, 60, fy, W - 120, 46, "#ffc400", "#101010", 20);
  ctx.fillStyle = "#e9e4d6";
  barcode(ctx, 60, fy + 76, W - 120, 56, 91, "#e9e4d6");
  ctx.font = `600 24px ${fonts.mono}`;
  ctx.globalAlpha = 0.6;
  ctx.fillText("HANDLE WITH CARE · DO NOT EXPOSE TO MAGNETIC FIELDS", 60, fy + 172);
  return tex(c, aniso);
}

// ── the build ───────────────────────────────────────────────────────────────

export function buildCase(modules: PlayModule[], fonts: Fonts, aniso: number, mats: Mats) {
  const n = modules.length;
  const { w: W, l: L, wall, inner } = caseDims(n);
  const root = new THREE.Group();
  root.name = "case";

  const hullMat = new THREE.MeshStandardMaterial({ color: "#2b2f36", metalness: 0.72, roughness: 0.4 });
  const capMat = mats.dullChrome;
  const foamMat = new THREE.MeshStandardMaterial({ color: "#0d0e10", metalness: 0, roughness: 0.94 });
  const solids: THREE.Mesh[] = [];
  const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    solids.push(mesh);
    return mesh;
  };

  // Floor, a wedge-shaped pair of side walls that follow the ramp, and the two
  // end walls (the back one is as tall as the ramp is by the time it gets there).
  const rise = (RISE / SLOT_PITCH) * L;
  const HB = HT + rise;
  add(box(W, FLOOR, L, 0.02), hullMat, 0, FLOOR / 2, 0);
  const wedge = new THREE.Shape();
  wedge.moveTo(-L / 2, 0);
  wedge.lineTo(L / 2, 0);
  wedge.lineTo(L / 2, HT);
  wedge.lineTo(-L / 2, HB);
  wedge.closePath();
  const bev = 0.012;
  const wallGeo = new THREE.ExtrudeGeometry(wedge, { depth: wall - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: 1 });
  wallGeo.translate(0, 0, bev);
  // Shape x → world z, extrusion → -x; the same solid serves both sides.
  wallGeo.rotateY(-Math.PI / 2);
  wallGeo.computeVertexNormals();
  for (const sx of [-1, 1]) add(wallGeo, hullMat, sx > 0 ? W / 2 : -W / 2 + wall, 0, 0);
  add(box(W - wall * 2 + 0.02, HT, wall, 0.02), hullMat, 0, HT / 2, L / 2 - wall / 2);
  add(box(W - wall * 2 + 0.02, HB, wall, 0.02), hullMat, 0, HB / 2, -L / 2 + wall / 2);
  // A rail along each sloped edge, and a lip across the front.
  const slopeLen = Math.hypot(L, HB - HT);
  const slopeA = Math.atan2(HB - HT, L);
  for (const sx of [-1, 1]) {
    const rail = add(box(wall + 0.03, 0.03, slopeLen, 0.012), mats.gunmetal, sx * (W / 2 - wall / 2), (HT + HB) / 2 + 0.006, 0);
    rail.rotation.x = slopeA;
  }
  add(box(W - wall * 2 + 0.02, 0.03, wall + 0.03, 0.012), mats.gunmetal, 0, HT + 0.005, L / 2 - wall / 2);
  add(box(W - wall * 2 + 0.02, 0.03, wall + 0.03, 0.012), mats.gunmetal, 0, HB + 0.005, -L / 2 + wall / 2);

  // Corner caps, and their screws.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const hh = sz > 0 ? HT : HB;
      add(box(0.15, hh + 0.03, 0.15, 0.028), capMat, sx * (W / 2 - 0.05), (hh + 0.03) / 2, sz * (L / 2 - 0.05));
      const screw = add(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 8), mats.screw, sx * (W / 2 - 0.05), hh + 0.036, sz * (L / 2 - 0.05));
      screw.castShadow = false;
    }

  // The foam rack: one block per slot, each a step higher than the last.
  const zSlot = (i: number) => inner / 2 - 0.08 - SLOT_PITCH / 2 - i * SLOT_PITCH;
  for (let i = 0; i < n; i++) {
    const h = FOAM + i * RISE;
    add(box(W - wall * 2 - 0.03, h, SLOT_PITCH - 0.012, 0.008), foamMat, 0, FLOOR + h / 2, zSlot(i));
  }

  // Latches on the long sides, hinges at the back.
  for (const sx of [-1, 1])
    for (const z of [-L * 0.3, L * 0.3]) {
      const zy = HT * 0.5 + ((L / 2 - z) / L) * rise;
      add(box(0.05, 0.19, 0.13, 0.012), mats.chrome, sx * (W / 2 + 0.02), zy, z);
      add(box(0.02, 0.07, 0.07, 0.006), mats.darkMetal, sx * (W / 2 + 0.05), zy, z);
    }
  for (const sx of [-1, 1]) {
    const barrel = new THREE.CylinderGeometry(0.048, 0.048, 0.2, 14);
    barrel.rotateZ(Math.PI / 2);
    add(barrel, mats.chrome, sx * 0.4, HB + 0.03, -L / 2 + 0.03);
  }

  // Decals: the long sides, the front end.
  const sideTex = sideDecal(modules, fonts, aniso);
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, transparent: true, roughness: 0.6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  const sideGeo = new THREE.PlaneGeometry(1.5, 0.375);
  for (const sx of [-1, 1]) {
    const d = new THREE.Mesh(sideGeo, sideMat);
    // The decal is parented to a tilted holder so it follows the ramp.
    const holder = new THREE.Group();
    holder.position.set(sx * (W / 2 + 0.0015), (HT + HB) / 2 - 0.03, 0);
    holder.rotation.order = "YXZ";
    holder.rotation.y = sx * (Math.PI / 2);
    holder.rotation.x = 0;
    holder.rotation.z = sx * slopeA;
    holder.add(d);
    root.add(holder);
  }
  const endMat = new THREE.MeshStandardMaterial({ map: endDecal(n, fonts, aniso), transparent: true, roughness: 0.6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  const end = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.43), endMat);
  end.position.set(0, HT * 0.5, L / 2 + 0.0015);
  root.add(end);

  // The lid, propped open behind the row.
  const pivot = new THREE.Group();
  pivot.position.set(0, HB + 0.03, -L / 2 + 0.05);
  pivot.rotation.x = -LID.lean;
  root.add(pivot);
  add(box(W, LID.h, 0.07, 0.022), hullMat, 0, LID.h / 2, 0, pivot);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.12, LID.h - 0.12),
    new THREE.MeshStandardMaterial({ map: lidFace(modules, fonts, aniso), roughness: 0.82, metalness: 0 }),
  );
  face.position.set(0, LID.h / 2, 0.037);
  pivot.add(face);
  for (const sx of [-1, 1]) add(box(0.06, 0.16, 0.1, 0.012), mats.chrome, sx * (W / 2 - 0.02), LID.h - 0.09, -0.02, pivot);

  // Per-slot indicator LEDs on both wall tops, and an accent bar on the front lip.
  const leds = modules.map((m) => glow(m.color, 0.3));
  modules.forEach((_, i) => {
    const parts = [-1, 1].map((sx) => {
      const g = new THREE.BoxGeometry(0.05, 0.012, 0.13);
      g.rotateX(slopeA);
      g.translate(sx * (W / 2 - wall / 2), HT + 0.023 + ((L / 2 - zSlot(i)) / L) * rise, zSlot(i));
      return g;
    });
    root.add(new THREE.Mesh(mergeGeometries(parts)!, leds[i]));
  });
  const stripe = glow("#1fc3ec", 0.9);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 0.42, 0.012, 0.034), stripe);
  bar.position.set(0, HT + 0.023, L / 2 - wall / 2);
  root.add(bar);

  mergeStatic(root, solids);
  for (const m of [face, end]) m.receiveShadow = true;

  // Click volume: the tray and the cards standing in it.
  const hitH = HB + CART.h * 0.7 + 0.2;
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, hitH, L + 0.1), mats.hit);
  hit.position.y = hitH / 2;
  root.add(hit);

  // Tiny per-card variation so the row looks handled, not extruded.
  const jitter = rng(77);
  const roll = modules.map(() => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (jitter() - 0.5) * 0.026));
  const local = new THREE.Vector3();

  return {
    root,
    hit,
    /** Half extents of the click volume, case-local. */
    hitHalf: { x: (W + 0.1) / 2, y: hitH / 2, z: (L + 0.1) / 2 },
    leds,
    stripe,
    dims: { w: W, l: L, wall, inner },
    /** World pose of the card in slot `i`. The case's matrixWorld must be current. */
    slot(i: number, pos: THREE.Vector3, quat?: THREE.Quaternion) {
      local.set(0, slotY(i), zSlot(i));
      pos.copy(local).applyMatrix4(root.matrixWorld);
      if (quat) {
        root.getWorldQuaternion(quat);
        quat.multiply(roll[i]);
      }
    },
    /** The four top corners of the case plus the cards' tops, case-local, for framing. */
    frame() {
      const top = HB + LID.h * 0.9;
      const pts: THREE.Vector3[] = [];
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          for (const y of [0, top]) pts.push(new THREE.Vector3(sx * (W / 2 + 0.05), y, sz * (L / 2 + 0.05)));
      return pts;
    },
    setLed(i: number, k: number) {
      setGlow(leds[i], modules[i].color, k);
    },
  };
}
export type Case = ReturnType<typeof buildCase>;
