/*
 * THE TABLE — the surface the reader stands on and the case sits on.
 *
 * It is bigger than anything the camera can see, so it has no edge: a
 * graphite deck of machined plates that runs off into the fog. The stage in
 * the middle is kept clean — the reader, the case, the props. Everything
 * else is in the periphery: power conduits cut into the deck in parallel
 * bundles, and a few greebles where they meet — hubs, couplers, terminals,
 * vents. The cartridge case and the props are separate objects (case.ts,
 * props.ts) placed by the composition in layout.ts; this file only routes the
 * network round them.
 *
 * Energy is one shader. Every conduit core, and every little window on a
 * greeble that sits over one, carries `aD` — its distance along the network
 * from the reader. Packets travel down that distance toward the reader, so
 * the table visibly feeds the unit; a surge travels up it, so an insert or a
 * discharge ripples out across the deck. A window on a coupler shares its
 * lane's aD and seed, so it flashes exactly as a packet passes under it.
 *
 * Coordinates are world: the table top is y = 0, the reader stands at the
 * origin facing +z, and the wide camera looks from the +z side. The stage layout
 * (where the case and props go) depends on the viewport's shape, so the network is built per
 * layout and rebuilt when the shape class changes; the deck surface is not.
 */

import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PlayModule } from "@/content/play";
import type { Surfaces } from "./surfaces";
import { rng, type Fonts } from "./textures";
import { caseDims, stageLayout, type LayoutMode, type StageLayout } from "./layout";

// ── stage layout ────────────────────────────────────────────────────────────

export type { LayoutMode } from "./layout";

/** The reader's footprint, skids included, for the keep-out zone. */
const READER_FOOT = { hw: 1.1, z0: -0.62, z1: 0.62 };

/** How far the case reaches from the reader's axis, and how far toward the lens. */
function stageExtent(layout: StageLayout, n: number) {
  const { w, l } = caseDims(n);
  const { x, z, yaw } = layout.caseSpot;
  const hx = Math.abs(Math.cos(yaw)) * (w / 2) + Math.abs(Math.sin(yaw)) * (l / 2);
  const hz = Math.abs(Math.sin(yaw)) * (w / 2) + Math.abs(Math.cos(yaw)) * (l / 2);
  const props = layout.props;
  return {
    reach: Math.max(READER_FOOT.hw + 0.6, Math.abs(x) + hx, ...props.map((p) => Math.abs(p.x) + 0.5)),
    front: Math.max(z + hz, ...props.map((p) => p.z + 0.5)),
  };
}

// ── small geometry kit ──────────────────────────────────────────────────────

const Y_UP = new THREE.Vector3(0, 1, 0);

/** Clone into world space, non-indexed, with exactly position / normal / uv. */
function bake(g: THREE.BufferGeometry, m?: THREE.Matrix4) {
  const out = g.index ? g.toNonIndexed() : g.clone();
  if (m) out.applyMatrix4(m);
  if (!out.attributes.normal) out.computeVertexNormals();
  if (!out.attributes.uv) out.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2));
  for (const k of Object.keys(out.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") out.deleteAttribute(k);
  g.dispose();
  return out;
}

/** A box with chamfered edges, sitting on y = 0, centred on x/z. */
function block(w: number, h: number, d: number, b = 0.012) {
  const s = new THREE.Shape();
  const hw = w / 2 - b;
  const hd = d / 2 - b;
  s.moveTo(-hw, -hd);
  s.lineTo(hw, -hd);
  s.lineTo(hw, hd);
  s.lineTo(-hw, hd);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, b, 0);
  return g;
}

const at = (x: number, y: number, z: number, yaw = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y_UP, yaw), new THREE.Vector3(sx, sy, sz));

type V2 = THREE.Vector2;
const v2 = (x: number, y: number) => new THREE.Vector2(x, y);

/** Cut every corner sharper than ~15° back by `c`, PCB style. */
function chamfer(pts: V2[], c: number) {
  if (pts.length < 3) return pts.map((p) => p.clone());
  const out: V2[] = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const n = pts[i + 1];
    const d0 = b.clone().sub(a);
    const d1 = n.clone().sub(b);
    const turn = Math.acos(THREE.MathUtils.clamp(d0.clone().normalize().dot(d1.clone().normalize()), -1, 1));
    if (turn < 0.26) {
      out.push(b.clone());
      continue;
    }
    const k = Math.min(c, d0.length() * 0.45, d1.length() * 0.45);
    out.push(b.clone().addScaledVector(d0.normalize(), -k), b.clone().addScaledVector(d1.normalize(), k));
  }
  out.push(pts[pts.length - 1].clone());
  return out;
}

/** Left-hand normal of a direction in the XZ plane (x, z packed as x, y). */
const perp = (d: V2) => v2(-d.y, d.x);

/** Offset a polyline sideways by `o`, mitred at every vertex. */
function offsetLine(pts: V2[], o: number) {
  return pts.map((p, i) => {
    const dIn = i > 0 ? p.clone().sub(pts[i - 1]).normalize() : null;
    const dOut = i < pts.length - 1 ? pts[i + 1].clone().sub(p).normalize() : null;
    const nIn = dIn ? perp(dIn) : perp(dOut!);
    const nOut = dOut ? perp(dOut) : nIn;
    const m = nIn.clone().add(nOut).normalize();
    const k = 1 / Math.max(0.35, m.dot(nIn));
    return p.clone().addScaledVector(m, o * k);
  });
}

function lengths(pts: V2[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return cum;
}

/** Point and direction at distance s along a polyline. */
function sample(pts: V2[], cum: number[], s: number) {
  let i = 1;
  while (i < pts.length - 1 && cum[i] < s) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const t = THREE.MathUtils.clamp((s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), 0, 1);
  return { p: a.clone().lerp(b, t), d: b.clone().sub(a).normalize() };
}

/**
 * Sweep a cross-section (s across, y up) along a polyline in XZ, mitred.
 * Returns flat-shaded, creased triangles, plus per-vertex distance along.
 */
function sweep(pts: V2[], profile: [number, number][], d0 = 0) {
  const cum = lengths(pts);
  const frames = pts.map((p, i) => {
    const dIn = i > 0 ? p.clone().sub(pts[i - 1]).normalize() : null;
    const dOut = i < pts.length - 1 ? pts[i + 1].clone().sub(p).normalize() : null;
    const nIn = dIn ? perp(dIn) : perp(dOut!);
    const nOut = dOut ? perp(dOut) : nIn;
    const m = nIn.clone().add(nOut).normalize();
    return { p, m, k: 1 / Math.max(0.35, m.dot(nIn)) };
  });
  const pos: number[] = [];
  const dist: number[] = [];
  const P = (f: (typeof frames)[number], s: number, y: number) => [f.p.x + f.m.x * s * f.k, y, f.p.y + f.m.y * s * f.k];
  for (let i = 0; i < frames.length - 1; i++) {
    const A = frames[i];
    const B = frames[i + 1];
    for (let j = 0; j < profile.length - 1; j++) {
      const [s0, y0] = profile[j];
      const [s1, y1] = profile[j + 1];
      const a0 = P(A, s0, y0);
      const a1 = P(A, s1, y1);
      const b0 = P(B, s0, y0);
      const b1 = P(B, s1, y1);
      // Wound so the outside faces out for a profile listed left → right.
      pos.push(...a0, ...a1, ...b0, ...a1, ...b1, ...b0);
      dist.push(cum[i], cum[i], cum[i + 1], cum[i], cum[i + 1], cum[i + 1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return { g, dist: dist.map((d) => d + d0), length: cum[cum.length - 1] };
}

// ── the conduit network ─────────────────────────────────────────────────────

/** A lane: one conduit, flowing toward the reader (toward smaller d). */
type Lane = { pts: V2[]; d0: number; seed: number };
/** A bundle of parallel lanes sharing a centreline. */
type Bundle = { pts: V2[]; lanes: number; gap: number; d0: number; end?: boolean; couplers?: number[] };

const LANE = { core: 0.05, rail: 0.018, h: 0.024 };
/** Rails either side of a glowing core, all proud of the deck by LANE.h. */
const CHANNEL: [number, number][] = (() => {
  const c = LANE.core / 2;
  const o = c + LANE.rail;
  return [
    [-o - 0.006, 0],
    [-o, LANE.h - 0.006],
    [-o + 0.006, LANE.h],
    [-c - 0.004, LANE.h],
    [-c, 0.008],
    [c, 0.008],
    [c + 0.004, LANE.h],
    [o - 0.006, LANE.h],
    [o, LANE.h - 0.006],
    [o + 0.006, 0],
  ];
})();
const LANE_W = LANE.core + LANE.rail * 2 + 0.012;

/**
 * The hand-laid trunk lines for a layout. `side` is how far out the stage
 * reaches in x; everything is routed round it.
 */
function trunks(mode: LayoutMode, ext: { reach: number; front: number }): Bundle[] {
  const { reach, front } = ext;
  const side = mode === "wide" ? reach + 1.0 : reach + 0.75;
  const B: Bundle[] = [];
  // Rear feed: out of the reader's dock plate, straight back to the hub.
  B.push({ pts: [v2(0, READER_FOOT.z0 - 0.05), v2(0, -2.35)], lanes: 2, gap: 0.14, d0: 0 });
  // The cross main behind the stage, both ways from the hub, into the fog.
  const hubD = 1.7;
  for (const sx of [-1, 1]) {
    B.push({ pts: [v2(sx * 0.62, -2.35), v2(sx * (side + 1.4), -2.35), v2(sx * (side + 2.6), -3.55), v2(sx * 30, -3.55)], lanes: 3, gap: 0.14, d0: hubD, couplers: [0.3, 0.72] });
    // Side feeds: from the dock plate's flanks, out past the stage, then
    // forward down the sides of the frame.
    B.push({
      pts: [v2(sx * (READER_FOOT.hw + 0.12), 0.0), v2(sx * (side - 0.45), 0.0), v2(sx * side, 0.45), v2(sx * side, front + 0.8), v2(sx * (side + 1.2), front + 2.0), v2(sx * (side + 1.2), 30)],
      lanes: 2,
      gap: 0.14,
      d0: 0.15,
      couplers: [0.2],
    });
    // A far main, joined to the cross main by a riser.
    const rx = sx * (side + 4.2);
    B.push({ pts: [v2(rx, -3.55), v2(rx, -6.6)], lanes: 2, gap: 0.14, d0: hubD + side + 4.2, end: false });
    B.push({ pts: [v2(rx + sx * 0.5, -6.6), v2(sx * 34, -6.6)], lanes: 3, gap: 0.14, d0: hubD + side + 7.5, couplers: [0.25] });
    B.push({ pts: [v2(rx - sx * 0.5, -6.6), v2(sx * 1.2, -6.6), v2(0, -7.8), v2(0, -30)], lanes: 2, gap: 0.14, d0: hubD + side + 7.5, couplers: [0.5] });
  }
  return B;
}

/** Occupancy on a 0.5 grid, so generated traces never cross laid ones. */
class Grid {
  private cells = new Set<number>();
  constructor(private res = 0.5) {}
  private key(x: number, z: number) {
    return Math.round(x / this.res) * 100003 + Math.round(z / this.res);
  }
  markLine(pts: V2[], halfW: number) {
    const cum = lengths(pts);
    const L = cum[cum.length - 1];
    for (let s = 0; s <= L; s += this.res * 0.5) {
      const { p, d } = sample(pts, cum, s);
      const n = perp(d);
      for (let o = -halfW; o <= halfW + 1e-6; o += this.res * 0.5) this.cells.add(this.key(p.x + n.x * o, p.y + n.y * o));
    }
  }
  markRect(x0: number, z0: number, x1: number, z1: number) {
    for (let x = x0; x <= x1; x += this.res * 0.5) for (let z = z0; z <= z1; z += this.res * 0.5) this.cells.add(this.key(x, z));
  }
  free(x: number, z: number) {
    return !this.cells.has(this.key(x, z));
  }
}

/**
 * Fill the periphery with short generated traces: random walks on a grid,
 * mostly straight, turning 45° now and then, never crossing anything.
 */
function fillTraces(grid: Grid, keep: (x: number, z: number) => boolean, seed: number, count: number): Bundle[] {
  const r = rng(seed);
  const dirs = [v2(1, 0), v2(1, 1).normalize(), v2(0, 1), v2(-1, 1).normalize(), v2(-1, 0), v2(-1, -1).normalize(), v2(0, -1), v2(1, -1).normalize()];
  const out: Bundle[] = [];
  let tries = 0;
  while (out.length < count && tries++ < count * 30) {
    const x = Math.round((r() - 0.5) * 44);
    const z = Math.round(-22 + r() * 40);
    if (!keep(x, z) || !grid.free(x, z)) continue;
    const lanes = r() < 0.55 ? 1 : r() < 0.8 ? 2 : 3;
    const halfW = (lanes * 0.14) / 2 + 0.2;
    let dir = Math.floor(r() * 4) * 2;
    const pts = [v2(x, z)];
    let p = v2(x, z);
    const segs = 2 + Math.floor(r() * 4);
    for (let s = 0; s < segs; s++) {
      const len = 1.5 + Math.floor(r() * 5);
      const step = dirs[dir].clone().multiplyScalar(len);
      const q = p.clone().add(step);
      let ok = true;
      for (let t = 0.5; t <= len; t += 0.5) {
        const c = p.clone().addScaledVector(dirs[dir], t);
        if (!keep(c.x, c.y) || !grid.free(c.x, c.y)) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
      pts.push(q);
      p = q;
      dir = (dir + (r() < 0.5 ? 1 : 7)) % 8;
    }
    if (pts.length < 2) continue;
    grid.markLine(pts, halfW);
    out.push({ pts, lanes, gap: 0.14, d0: Math.hypot(x, z) + 2 });
  }
  return out;
}

// ── energy shader ───────────────────────────────────────────────────────────

const energyVert = /* glsl */ `
  attribute float aD;
  attribute float aS;
  attribute float aSeed;
  varying float vD;
  varying float vS;
  varying float vSeed;
  varying float vFog;
  void main(){
    vD = aD; vS = aS; vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFog = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const energyFrag = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uPower;
  uniform float uRush;
  uniform float uFogDensity;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform vec4 uSurge[4];
  uniform vec3 uSurgeColor[4];
  varying float vD;
  varying float vS;
  varying float vSeed;
  varying float vFog;
  float h11(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
  void main(){
    float core = 1.0 - smoothstep(0.25, 1.0, abs(vS));
    // Packets run down the network toward the reader (d decreasing).
    float speed = (1.3 + h11(vSeed) * 1.4) * (1.0 + uRush * 3.5);
    float spacing = 1.9 + h11(vSeed + 4.0) * 1.6;
    float s = vD / spacing + uTime * speed / spacing + vSeed * 13.0;
    float cell = floor(s);
    float f = fract(s);
    float on = step(h11(cell + vSeed * 31.0), 0.3 + uRush * 0.55);
    float head = smoothstep(0.0, 0.012, f) * exp(-f * 8.0);
    float pk = on * head;
    // Surges run up it, away from the reader.
    vec3 surge = vec3(0.0);
    for (int i = 0; i < 4; i++){
      float age = uTime - uSurge[i].x;
      if (age > 0.0 && age < 3.5){
        float r = age * uSurge[i].z;
        float front = exp(-pow((vD - r) * 1.6, 2.0));
        float wake = step(vD, r) * exp(-(r - vD) * 0.35) * 0.35;
        surge += uSurgeColor[i] * (front * 3.0 + wake) * uSurge[i].y * (1.0 - age / 3.5);
      }
    }
    float lit = smoothstep(uReveal, uReveal - 2.0, vD);
    vec3 idle = mix(uBase, uAccent, 0.25);
    vec3 col = idle * (0.22 + 0.25 * core) + mix(idle, vec3(1.0), 0.5) * pk * (4.2 + uRush * 2.5) * core + surge * core;
    col *= lit * uPower;
    // Match the scene's FogExp2 — the network fades with the deck.
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vFog * vFog);
    gl_FragColor = vec4(col * (1.0 - fog), 1.0);
  }
`;

// ── deck surface ────────────────────────────────────────────────────────────

/** One repeat of the deck is TILE × TILE world units. */
const TILE = 4;

function deckMaps(hi: boolean, fonts: Fonts, surf: Surfaces | null, aniso: number) {
  const S = hi ? 1024 : 512;
  const U = S / TILE;
  const r = rng(90210);
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    return [c, c.getContext("2d", { willReadFrequently: true })!] as const;
  };
  const [colC, col] = mk();
  const [ormC, orm] = mk();
  const [, hh] = mk();

  // Plates: each 2 × 2 quadrant is kept whole, halved or quartered.
  type R = { x: number; y: number; w: number; h: number };
  const plates: R[] = [];
  for (let qy = 0; qy < 2; qy++)
    for (let qx = 0; qx < 2; qx++) {
      const x = qx * 2;
      const y = qy * 2;
      const v = r();
      if (v < 0.34) plates.push({ x, y, w: 2, h: 2 });
      else if (v < 0.68) {
        if (r() < 0.5) plates.push({ x, y, w: 2, h: 1 }, { x, y: y + 1, w: 2, h: 1 });
        else plates.push({ x, y, w: 1, h: 2 }, { x: x + 1, y, w: 1, h: 2 });
      } else {
        plates.push({ x, y, w: 1, h: 1 }, { x: x + 1, y, w: 1, h: 1 }, { x, y: y + 1, w: 2, h: 1 });
      }
    }

  hh.fillStyle = "rgb(128,128,128)";
  hh.fillRect(0, 0, S, S);
  for (const p of plates) {
    const tone = 38 + r() * 5;
    const rough = 0.4 + r() * 0.1;
    col.fillStyle = `rgb(${tone | 0},${(tone + 2) | 0},${(tone + 6) | 0})`;
    col.fillRect(p.x * U, p.y * U, p.w * U, p.h * U);
    orm.fillStyle = `rgb(0,${(rough * 255) | 0},${(0.38 * 255) | 0})`;
    orm.fillRect(p.x * U, p.y * U, p.w * U, p.h * U);
    // A few plates sit a hair lower — the normal map gives them a lip.
    if (r() < 0.3) {
      hh.fillStyle = "rgb(112,112,112)";
      hh.fillRect(p.x * U + 0.08 * U, p.y * U + 0.08 * U, (p.w - 0.16) * U, (p.h - 0.16) * U);
    }
  }

  // Micro surface: the gunmetal scan, two repeats per tile, as a luminance modulation.
  const gm = surf?.tile("gunmetal", S / 2);
  if (gm) {
    const img = col.getImageData(0, 0, S, S);
    const d = img.data;
    const lm = (gm.mean[0] + gm.mean[1] + gm.mean[2]) / 3;
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const o = (y * S + x) << 2;
        const g = gm.at(x, y);
        const k = 0.72 + ((gm.data[g] + gm.data[g + 1] + gm.data[g + 2]) / 3 / lm) * 0.28;
        d[o] *= k;
        d[o + 1] *= k;
        d[o + 2] *= k;
      }
    col.putImageData(img, 0, 0);
  }

  // Seams, and the screws at each plate's corners.
  const sw = Math.max(2, 0.018 * U);
  for (const p of plates) {
    const x0 = p.x * U;
    const y0 = p.y * U;
    const x1 = (p.x + p.w) * U;
    const y1 = (p.y + p.h) * U;
    col.strokeStyle = "rgb(7,8,10)";
    col.lineWidth = sw;
    col.strokeRect(x0, y0, x1 - x0, y1 - y0);
    orm.strokeStyle = "rgb(0,230,90)";
    orm.lineWidth = sw * 1.6;
    orm.strokeRect(x0, y0, x1 - x0, y1 - y0);
    hh.strokeStyle = "rgb(40,40,40)";
    hh.lineWidth = sw * 1.4;
    hh.strokeRect(x0, y0, x1 - x0, y1 - y0);
    const inset = 0.1 * U;
    const sr = 0.028 * U;
    for (const [sx, sy] of [
      [x0 + inset, y0 + inset],
      [x1 - inset, y0 + inset],
      [x0 + inset, y1 - inset],
      [x1 - inset, y1 - inset],
    ]) {
      col.fillStyle = "rgb(58,61,68)";
      col.beginPath();
      col.arc(sx, sy, sr, 0, Math.PI * 2);
      col.fill();
      col.fillStyle = "rgb(14,15,17)";
      col.fillRect(sx - sr * 0.8, sy - sr * 0.14, sr * 1.6, sr * 0.28);
      const g = hh.createRadialGradient(sx, sy, 0, sx, sy, sr * 1.2);
      g.addColorStop(0, "rgb(190,190,190)");
      g.addColorStop(0.75, "rgb(165,165,165)");
      g.addColorStop(1, "rgba(128,128,128,0)");
      hh.fillStyle = g;
      hh.beginPath();
      hh.arc(sx, sy, sr * 1.2, 0, Math.PI * 2);
      hh.fill();
      orm.fillStyle = "rgb(0,110,240)";
      orm.beginPath();
      orm.arc(sx, sy, sr, 0, Math.PI * 2);
      orm.fill();
    }
  }

  // Survey marks every 2 units, printed, not lit — the hangar's grid, on a desk.
  col.strokeStyle = "rgba(120,150,210,0.2)";
  col.lineWidth = Math.max(1, 0.01 * U);
  for (const [cx, cy] of [
    [1, 1],
    [3, 1],
    [1, 3],
    [3, 3],
  ]) {
    const x = cx * U;
    const y = cy * U;
    const a = 0.07 * U;
    col.beginPath();
    col.moveTo(x - a, y);
    col.lineTo(x + a, y);
    col.moveTo(x, y - a);
    col.lineTo(x, y + a);
    col.stroke();
  }

  // Stencils, sparse and low contrast.
  col.fillStyle = "rgba(200,205,215,0.13)";
  col.font = `600 ${Math.round(0.07 * U)}px ${fonts.mono}`;
  const marks = ["DECK 03 · LOAD 40KG", "S-03 / GRID B", "▲ HV CONDUIT", "SERVICE · 0.8NM"];
  for (let i = 0; i < 2; i++) {
    const p = plates[Math.floor(r() * plates.length)];
    col.fillText(marks[Math.floor(r() * marks.length)], p.x * U + 0.16 * U, (p.y + p.h) * U - 0.17 * U);
  }

  // Height → tangent-space normal (OpenGL: +v is up the canvas).
  const hd = hh.getImageData(0, 0, S, S).data;
  const [nC, nx] = mk();
  const ni = nx.createImageData(S, S);
  const H = (x: number, y: number) => hd[((((y + S) % S) * S + ((x + S) % S)) << 2)] / 255;
  const k = 2.2;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * k;
      const dy = (H(x, y - 1) - H(x, y + 1)) * k;
      const l = Math.hypot(dx, dy, 1);
      const o = (y * S + x) << 2;
      ni.data[o] = (-dx / l) * 127.5 + 127.5;
      ni.data[o + 1] = (-dy / l) * 127.5 + 127.5;
      ni.data[o + 2] = (1 / l) * 127.5 + 127.5;
      ni.data[o + 3] = 255;
    }
  nx.putImageData(ni, 0, 0);

  const t = (c: HTMLCanvasElement, srgb: boolean) => {
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.anisotropy = aniso;
    return tx;
  };
  return { map: t(colC, true), orm: t(ormC, false), normal: t(nC, false) };
}

// ── the build ───────────────────────────────────────────────────────────────

const BASE = new THREE.Color("#2a64ff");

export function buildTable(opts: { fonts: Fonts; aniso: number; hi: boolean; surf: Surfaces | null; modules: PlayModule[]; fogDensity: number }) {
  const { fonts, aniso, hi, surf, modules } = opts;
  const root = new THREE.Group();
  root.name = "table";

  // The deck: one huge plane; the camera never sees its edge.
  const maps = deckMaps(hi, fonts, surf, aniso);
  const SIZE = 260;
  for (const tx of [maps.map, maps.orm, maps.normal]) tx.repeat.set(SIZE / TILE, SIZE / TILE);
  const grime = surf?.texture("grime", aniso)?.clone() ?? null;
  if (grime) {
    grime.channel = 0;
    grime.repeat.set(SIZE / 11, SIZE / 11);
    grime.needsUpdate = true;
  }
  const deckMat = new THREE.MeshStandardMaterial({
    map: maps.map,
    roughnessMap: maps.orm,
    metalnessMap: maps.orm,
    roughness: 1,
    metalness: 1,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    aoMap: grime,
    aoMapIntensity: 0.9,
    envMapIntensity: 0.28,
  });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), deckMat);
  deck.rotation.x = -Math.PI / 2;
  deck.receiveShadow = true;
  root.add(deck);

  const uniforms = {
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uPower: { value: 1 },
    uRush: { value: 0 },
    uFogDensity: { value: opts.fogDensity },
    uBase: { value: BASE.clone() },
    uAccent: { value: new THREE.Color("#1fc3ec") },
    uSurge: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(-99, 0, 7, 0)) },
    uSurgeColor: { value: [0, 1, 2, 3].map(() => new THREE.Color("#ffffff")) },
  };
  const energyMat = new THREE.ShaderMaterial({ uniforms, vertexShader: energyVert, fragmentShader: energyFrag, toneMapped: false });

  const railMat = new THREE.MeshStandardMaterial({ color: "#1a1c21", metalness: 0.85, roughness: 0.38 });
  const hullMat = new THREE.MeshStandardMaterial({ color: "#23262c", metalness: 0.8, roughness: 0.42, map: surf?.texture("gunmetal", aniso) ?? null });
  const darkMat = new THREE.MeshStandardMaterial({ color: "#0b0c0e", metalness: 0.4, roughness: 0.7 });
  const boltMat = new THREE.MeshStandardMaterial({ color: "#8d9098", metalness: 1, roughness: 0.35 });
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff9a2e").multiplyScalar(2.2), toneMapped: false });

  let layout: ReturnType<typeof buildLayout> | null = null;
  let surgeIdx = 0;
  let motes: ReturnType<typeof buildMotes> | null = null;

  function buildLayout(mode: LayoutMode) {
    const group = new THREE.Group();
    const stage = stageLayout(mode);
    const ext = stageExtent(stage, modules.length);
    const geo = { rail: [] as THREE.BufferGeometry[], hull: [] as THREE.BufferGeometry[], dark: [] as THREE.BufferGeometry[], bolt: [] as THREE.BufferGeometry[], lamp: [] as THREE.BufferGeometry[] };
    const energy = { pos: [] as number[], d: [] as number[], s: [] as number[], seed: [] as number[] };
    const vents: THREE.Vector3[] = [];
    let seedN = 1;

    /** An energy-lit quad, or a whole flat ribbon along a lane. */
    const energyQuad = (corners: number[][], d: number[], s: number[], seed: number) => {
      const idx = [0, 1, 2, 2, 1, 3];
      for (const i of idx) {
        energy.pos.push(...corners[i]);
        energy.d.push(d[i]);
        energy.s.push(s[i]);
        energy.seed.push(seed);
      }
    };

    const addLane = (lane: Lane) => {
      const sw = sweep(lane.pts, CHANNEL, lane.d0);
      geo.rail.push(sw.g);
      // The core ribbon, just under the rail tops.
      const cum = lengths(lane.pts);
      const L = offsetLine(lane.pts, -LANE.core / 2);
      const R = offsetLine(lane.pts, LANE.core / 2);
      for (let i = 0; i < lane.pts.length - 1; i++) {
        const y = 0.0095;
        energyQuad(
          [
            [L[i].x, y, L[i].y],
            [R[i].x, y, R[i].y],
            [L[i + 1].x, y, L[i + 1].y],
            [R[i + 1].x, y, R[i + 1].y],
          ],
          [cum[i] + lane.d0, cum[i] + lane.d0, cum[i + 1] + lane.d0, cum[i + 1] + lane.d0],
          [-1, 1, -1, 1],
          lane.seed,
        );
      }
    };

    const bolt = (x: number, z: number, y: number) => geo.bolt.push(bake(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 6), at(x, y + 0.006, z)));

    const addBundle = (b: Bundle) => {
      const c = chamfer(b.pts, 0.35);
      const cum = lengths(c);
      const total = cum[cum.length - 1];
      const seeds: number[] = [];
      for (let k = 0; k < b.lanes; k++) {
        const o = (k - (b.lanes - 1) / 2) * b.gap;
        const pts = offsetLine(c, o);
        const seed = seedN++ * 1.37;
        seeds.push(seed);
        addLane({ pts, d0: b.d0, seed });
      }
      const span = (b.lanes - 1) * b.gap + LANE_W;
      // Couplers: a clamp across the bundle, with a window per lane that
      // flashes as that lane's packet passes under it.
      for (const f of b.couplers ?? []) {
        const s = total * f;
        const { p, d } = sample(c, cum, s);
        const yaw = Math.atan2(d.x, d.y);
        geo.hull.push(bake(block(span + 0.14, 0.055, 0.3, 0.01), at(p.x, 0, p.y, yaw)));
        for (const sx of [-1, 1]) {
          const n = perp(d).multiplyScalar(sx * (span / 2 + 0.035));
          bolt(p.x + n.x + d.x * 0.08, p.y + n.y + d.y * 0.08, 0.055);
          bolt(p.x + n.x - d.x * 0.08, p.y + n.y - d.y * 0.08, 0.055);
        }
        seeds.forEach((seed, k) => {
          const o = (k - (b.lanes - 1) / 2) * b.gap;
          const n = perp(d);
          const cx = p.x + n.x * o;
          const cz = p.y + n.y * o;
          const hw = 0.022;
          const hl = 0.07;
          const y = 0.0565;
          const q = (a: number, l: number) => [cx + n.x * a + d.x * l, y, cz + n.y * a + d.y * l];
          energyQuad([q(-hw, -hl), q(hw, -hl), q(-hw, hl), q(hw, hl)], [s + b.d0, s + b.d0, s + b.d0, s + b.d0], [0, 0, 0, 0], seed);
        });
      }
      // Terminal on the outer end, if that end is in view at all.
      const endP = c[c.length - 1];
      if (b.end !== false && Math.hypot(endP.x, endP.y) < 26) {
        const d = c[c.length - 1].clone().sub(c[c.length - 2]).normalize();
        const yaw = Math.atan2(d.x, d.y);
        const tp = endP.clone().addScaledVector(d, 0.1);
        geo.hull.push(bake(block(span + 0.16, 0.075, 0.26, 0.014), at(tp.x, 0, tp.y, yaw)));
        geo.dark.push(bake(block(span - 0.02, 0.02, 0.12, 0.004), at(tp.x - d.x * 0.02, 0.075, tp.y - d.y * 0.02, yaw)));
        geo.lamp.push(bake(new THREE.BoxGeometry(0.05, 0.01, 0.03), at(tp.x + perp(d).x * (span / 2 - 0.02) + d.x * 0.08, 0.08, tp.y + perp(d).y * (span / 2 - 0.02) + d.y * 0.08, yaw)));
        vents.push(new THREE.Vector3(tp.x, 0.08, tp.y));
      }
      return c;
    };

    // Trunks first; they reserve the grid for the generated fill.
    const grid = new Grid();
    const laid = trunks(mode, ext);
    for (const b of laid) {
      const c = addBundle(b);
      grid.markLine(c, (b.lanes * b.gap) / 2 + 0.35);
    }

    // The stage stays clean: nothing generated inside it.
    const reach = ext.reach + 1.2;
    const front = ext.front + 2.2;
    grid.markRect(-reach, -3, reach, front);
    const keep = (x: number, z: number) => !(Math.abs(x) < reach && z > -3.2 && z < front) && Math.abs(x) < 24 && z > -24 && z < 20;
    for (const b of fillTraces(grid, keep, 777, hi ? 26 : 16)) addBundle(b);

    // The hub where the rear feed meets the cross main.
    geo.hull.push(bake(block(1.5, 0.11, 0.82, 0.02), at(0, 0, -2.35)));
    geo.dark.push(bake(block(1.26, 0.02, 0.58, 0.006), at(0, 0.11, -2.35)));
    for (const [x, z] of [
      [-0.66, -2.68],
      [0.66, -2.68],
      [-0.66, -2.02],
      [0.66, -2.02],
    ])
      bolt(x, z, 0.11);
    for (let k = 0; k < 5; k++) geo.lamp.push(bake(new THREE.BoxGeometry(0.1, 0.012, 0.035), at(-0.4 + k * 0.2, 0.13, -2.18)));
    // Its slatted vent reads the rear feed's flow.
    for (let k = 0; k < 6; k++) geo.rail.push(bake(block(1.1, 0.03, 0.035, 0.006), at(0, 0.11, -2.52 + k * 0.05)));
    vents.push(new THREE.Vector3(0, 0.14, -2.4));

    // Where the feeds reach the reader: a socket block at each skid, and one
    // behind it for the rear feed. No plate — the reader stands on the deck.
    for (const sx of [-1, 1]) {
      geo.hull.push(bake(block(0.16, 0.05, 0.42, 0.01), at(sx * (READER_FOOT.hw + 0.14), 0, 0)));
      bolt(sx * (READER_FOOT.hw + 0.14), 0.13, 0.05);
      bolt(sx * (READER_FOOT.hw + 0.14), -0.13, 0.05);
    }
    geo.hull.push(bake(block(0.5, 0.05, 0.16, 0.01), at(0, 0, READER_FOOT.z0 - 0.1)));

    // A few vent panels and capacitor rows off the trunks, never on the stage.
    const r = rng(mode === "wide" ? 31 : 37);
    const side = ext.reach + (mode === "wide" ? 1.0 : 0.75);
    const fixtures: [number, number, number, "vent" | "caps"][] = [
      [-(side + 1.3), -1.2, 0, "vent"],
      [side + 1.9, -1.35, 0, "caps"],
      [-2.9, -3.0, 0, "caps"],
      [3.1, -3.05, 0, "vent"],
      [-(side + 0.9), 0.9, Math.PI / 2, "caps"],
      [side + 0.9, 1.4, Math.PI / 2, "vent"],
      [-6.8, -5.0, 0, "vent"],
      [7.3, -5.1, 0, "caps"],
    ];
    for (const [x, z, yaw, kind] of fixtures) {
      if (kind === "vent") {
        geo.hull.push(bake(block(0.96, 0.03, 0.56, 0.01), at(x, 0, z, yaw)));
        geo.dark.push(bake(block(0.84, 0.01, 0.44, 0.004), at(x, 0.03, z, yaw)));
        for (let k = 0; k < 7; k++) {
          const off = new THREE.Vector3(0, 0, -0.18 + k * 0.06).applyAxisAngle(Y_UP, yaw);
          geo.rail.push(bake(block(0.8, 0.024, 0.022, 0.005), at(x + off.x, 0.03, z + off.z, yaw)));
        }
        vents.push(new THREE.Vector3(x, 0.06, z));
      } else {
        const n = 3 + Math.floor(r() * 3);
        geo.hull.push(bake(block(0.2 + n * 0.13, 0.02, 0.5, 0.006), at(x, 0, z, yaw)));
        for (let k = 0; k < n; k++) {
          const off = new THREE.Vector3(-((n - 1) * 0.13) / 2 + k * 0.13, 0, 0).applyAxisAngle(Y_UP, yaw);
          const cap = new THREE.CylinderGeometry(0.048, 0.048, 0.38, 16);
          cap.rotateX(Math.PI / 2);
          geo.bolt.push(bake(cap, at(x + off.x, 0.068, z + off.z, yaw)));
          const band = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
          band.rotateX(Math.PI / 2);
          geo.dark.push(bake(band, at(x + off.x, 0.068, z + off.z, yaw)));
        }
      }
    }

    const merged = (list: THREE.BufferGeometry[], mat: THREE.Material, shadow = true) => {
      if (!list.length) return;
      const g = toCreasedNormals(mergeGeometries(list)!, THREE.MathUtils.degToRad(35));
      list.forEach((x) => x.dispose());
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true;
      m.castShadow = shadow;
      group.add(m);
    };
    merged(geo.rail, railMat, false);
    merged(geo.hull, hullMat);
    merged(geo.dark, darkMat, false);
    merged(geo.bolt, boltMat);
    merged(geo.lamp, lampMat, false);

    const eg = new THREE.BufferGeometry();
    eg.setAttribute("position", new THREE.Float32BufferAttribute(energy.pos, 3));
    eg.setAttribute("aD", new THREE.Float32BufferAttribute(energy.d, 1));
    eg.setAttribute("aS", new THREE.Float32BufferAttribute(energy.s, 1));
    eg.setAttribute("aSeed", new THREE.Float32BufferAttribute(energy.seed, 1));
    const em = new THREE.Mesh(eg, energyMat);
    em.frustumCulled = false;
    group.add(em);

    return { mode, group, vents, stage };
  }

  function buildMotes(vents: THREE.Vector3[]) {
    const n = hi ? 90 : 44;
    const pos = new Float32Array(n * 3);
    const life = new Float32Array(n);
    const size = new Float32Array(n);
    const state = Array.from({ length: n }, (_, i) => ({ o: vents[i % vents.length] ?? new THREE.Vector3(), t: Math.random(), dur: 3 + Math.random() * 4, dx: 0, dz: 0, rise: 0.25 + Math.random() * 0.45 }));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uColor: uniforms.uAccent, uPx: { value: 1 }, uPower: uniforms.uPower },
      vertexShader: /* glsl */ `
        attribute float aLife; attribute float aSize; uniform float uPx;
        varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vA = sin(aLife * 3.14159);
          gl_PointSize = aSize * uPx / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uPower; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.0, d);
          gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.35) * a * a * vA * 1.6 * uPower, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    const reset = (s: (typeof state)[number], i: number) => {
      s.o = vents[(i * 7 + Math.floor(Math.random() * vents.length)) % vents.length] ?? s.o;
      s.t = 0;
      s.dur = 3 + Math.random() * 4;
      s.dx = (Math.random() - 0.5) * 0.5;
      s.dz = (Math.random() - 0.5) * 0.5;
      s.rise = 0.25 + Math.random() * 0.45;
      size[i] = 0.07 + Math.random() * 0.09;
    };
    state.forEach((s, i) => {
      reset(s, i);
      s.t = Math.random();
    });
    const update = (dt: number, rush: number) => {
      for (let i = 0; i < n; i++) {
        const s = state[i];
        s.t += (dt / s.dur) * (1 + rush * 2);
        if (s.t >= 1) reset(s, i);
        const k = s.t;
        pos[i * 3] = s.o.x + s.dx * k + Math.sin(k * 6 + i) * 0.05;
        pos[i * 3 + 1] = s.o.y + k * s.rise * 1.6;
        pos[i * 3 + 2] = s.o.z + s.dz * k + Math.cos(k * 5 + i) * 0.05;
        life[i] = k;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.aLife.needsUpdate = true;
      g.attributes.aSize.needsUpdate = true;
    };
    return { pts, update, mat: m };
  }

  const setMode = (mode: LayoutMode) => {
    if (layout?.mode === mode) return layout;
    if (layout) {
      root.remove(layout.group);
      layout.group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        const mat = m.material as THREE.Material;
        if (mat !== railMat && mat !== hullMat && mat !== darkMat && mat !== boltMat && mat !== lampMat && mat !== energyMat) {
          (mat as THREE.MeshStandardMaterial).map?.dispose();
          mat.dispose();
        }
      });
    }
    if (motes) {
      root.remove(motes.pts);
      motes.pts.geometry.dispose();
      motes.mat.dispose();
    }
    layout = buildLayout(mode);
    root.add(layout.group);
    motes = buildMotes(layout.vents);
    root.add(motes.pts);
    return layout;
  };

  return {
    root,
    uniforms,
    setMode,
    /** The composition for the current shape: where the case and props sit, how the wide camera leans. */
    get stage() {
      return layout!.stage;
    },
    get mode() {
      return layout!.mode;
    },
    setPixelScale(px: number) {
      if (motes) motes.mat.uniforms.uPx.value = px;
    },
    /** An energy wave out from the reader, along every lane. */
    surge(time: number, strength: number, hex: string, speed = 8) {
      const k = surgeIdx++ % 4;
      uniforms.uSurge.value[k].set(time, strength, speed, 0);
      uniforms.uSurgeColor.value[k].set(hex);
    },
    update(time: number, dt: number) {
      uniforms.uTime.value = time;
      motes?.update(dt, uniforms.uRush.value);
    },
  };
}

export type Table = ReturnType<typeof buildTable>;
