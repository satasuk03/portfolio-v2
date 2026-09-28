/*
 * Procedural hard-surface kit. Nothing is loaded — every part is built from
 * primitives here, chamfered (a one-segment bevel catches a highlight on every
 * edge, which is most of what makes a box read as machined) and dressed with
 * the canvas decals from textures.ts.
 *
 * Units: metres-ish. The floor is y = 0. The reader itself lives in reader.ts.
 */

import * as THREE from "three";
import type { PlayModule } from "@/content/play";
import { cartridgeBack, cartridgeLabel, type Fonts } from "./textures";
import { ringFrag, uvVert } from "./shaders";

export const CART = { w: 0.95, h: 1.2, d: 0.24 };

// ── geometry helpers ────────────────────────────────────────────────────────

/** A box with one-segment chamfered edges, and planar XY UVs in 0..1. */
export function chamferBox(w: number, h: number, d: number, b = 0.025) {
  const s = new THREE.Shape();
  const hw = w / 2 - b;
  const hh = h / 2 - b;
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, hh);
  s.lineTo(-hw, hh);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 1,
    curveSegments: 1,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** A cartridge silhouette: chamfered box with one clipped top corner. */
function cartridgeGeometry() {
  const { w, h, d } = CART;
  const b = 0.03;
  const hw = w / 2 - b;
  const hh = h / 2 - b;
  const clip = 0.16;
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, hh - clip);
  s.lineTo(hw - clip, hh);
  s.lineTo(-hw, hh);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  g.computeVertexNormals();
  return g;
}

// ── materials ───────────────────────────────────────────────────────────────

export function makeMaterials() {
  return {
    plastic: new THREE.MeshPhysicalMaterial({ color: "#d9d2c0", roughness: 0.52, clearcoat: 0.35, clearcoatRoughness: 0.45 }),
    plasticDark: new THREE.MeshPhysicalMaterial({ color: "#8f8a7e", roughness: 0.6, clearcoat: 0.2 }),
    gunmetal: new THREE.MeshStandardMaterial({ color: "#3a3f47", metalness: 0.78, roughness: 0.36 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: "#191b1f", metalness: 0.6, roughness: 0.5 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#dfe3e8", metalness: 1, roughness: 0.14 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#0e0f11", metalness: 0, roughness: 0.82 }),
    gold: new THREE.MeshStandardMaterial({ color: "#d1a647", metalness: 1, roughness: 0.28 }),
    void: new THREE.MeshBasicMaterial({ color: "#020203" }),
    screw: new THREE.MeshStandardMaterial({ color: "#8d8a84", metalness: 0.9, roughness: 0.45 }),
    dullChrome: new THREE.MeshStandardMaterial({ color: "#9a9ea4", metalness: 1, roughness: 0.32 }),
    orangePlastic: new THREE.MeshPhysicalMaterial({ color: "#e8742a", roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    redPlastic: new THREE.MeshPhysicalMaterial({ color: "#d4362a", roughness: 0.36, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    bone: new THREE.MeshStandardMaterial({ color: "#efe9da", roughness: 0.5 }),
    needle: new THREE.MeshStandardMaterial({ color: "#1a120a", roughness: 0.5, metalness: 0.3 }),
    /** Invisible raycast volumes — still hit-testable. */
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };
}
export type Mats = ReturnType<typeof makeMaterials>;

/** Emissive "light" material — HDR colour so bloom picks it up. */
export function glow(hex: string, k: number) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
  m.userData.base = hex;
  m.userData.k = k;
  return m;
}

export function setGlow(m: THREE.MeshBasicMaterial, hex: string, k: number) {
  m.color.set(hex).multiplyScalar(k);
  m.userData.base = hex;
  m.userData.k = k;
}

export function holoRingMaterial(hex: string, opacity: number, dashes = 64, speed = 0.02) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(hex) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
      uDashes: { value: dashes },
      uSpeed: { value: speed },
    },
    vertexShader: uvVert,
    fragmentShader: ringFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}



// ── cartridges ──────────────────────────────────────────────────────────────

export function buildCartridge(m: PlayModule, fonts: Fonts, aniso: number, mats: Mats) {
  const root = new THREE.Group(); // position + facing
  const spin = new THREE.Group(); // flips
  const squash = new THREE.Group(); // scale
  root.add(spin);
  spin.add(squash);

  const shell = new THREE.Mesh(cartridgeGeometry(), mats.plastic);
  squash.add(shell);

  const labelMat = new THREE.MeshStandardMaterial({ map: cartridgeLabel(m, fonts, aniso), roughness: 0.55, metalness: 0 });
  // Sized to clear the clipped corner: its top-right point sits under the chamfer.
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.788), labelMat);
  label.position.set(-0.03, 0.08, CART.d / 2 + 0.002);
  squash.add(label);

  const backMat = new THREE.MeshStandardMaterial({ map: cartridgeBack(m, fonts, aniso), roughness: 0.6 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.787), backMat);
  back.position.set(0, 0.06, -CART.d / 2 - 0.002);
  back.rotation.y = Math.PI;
  squash.add(back);

  // Grip grooves under the label.
  const groove = new THREE.BoxGeometry(0.035, 0.1, 0.02);
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Mesh(groove, mats.plasticDark);
    g.position.set(-0.3 + i * 0.075, -0.44, CART.d / 2 - 0.004);
    squash.add(g);
  }

  // Edge connector.
  const pins = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.07, 0.12), mats.gold);
  pins.position.y = -CART.h / 2 - 0.02;
  squash.add(pins);

  // Status LED — dark until the module is seated.
  const ledMat = glow(m.color, 0.35);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.02), ledMat);
  led.position.set(0.3, -0.53, CART.d / 2 + 0.004);
  squash.add(led);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.32, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
  squash.add(hit);

  return { module: m, root, spin, squash, ledMat, hit, labelMat };
}
export type Cartridge = ReturnType<typeof buildCartridge>;

// ── floor dressing: survey rings and ticks around the unit ─────────────────

export function buildFloorRings() {
  const g = new THREE.Group();
  const specs: [number, number, string, number, number, number][] = [
    [2.7, 2.72, "#1fc3ec", 0.9, 120, 0.004],
    [3.55, 3.62, "#3d7bff", 0.7, 36, -0.006],
    [5.9, 5.93, "#3d7bff", 0.45, 180, 0.002],
  ];
  const mats: THREE.ShaderMaterial[] = [];
  for (const [r0, r1, c, o, dashes, speed] of specs) {
    const mat = holoRingMaterial(c, o, dashes, speed);
    const mesh = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 160), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.012;
    g.add(mesh);
    mats.push(mat);
  }
  // Compass ticks.
  const pts: number[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r0 = 4.4;
    const r1 = i % 9 === 0 ? 4.85 : 4.58;
    pts.push(Math.sin(a) * r0, 0.015, Math.cos(a) * r0, Math.sin(a) * r1, 0.015, Math.cos(a) * r1);
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const ticks = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: new THREE.Color("#3d7bff").multiplyScalar(0.8), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(ticks);
  return { group: g, mats };
}
