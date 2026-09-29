/*
 * The stage: one WebGL scene, one Canvas 2D particle layer, one clock.
 *
 * The scene is a desk. The reader stands on a table that runs off into the
 * dark in every direction; the cards lie on the table in front of it, each
 * in its own lit pad. Picking a card lifts it, flies it to the slot, feeds it
 * in, and the camera goes in to the reader's display. Ejecting reverses it.
 *
 * Clock — everything, including the render, runs on gsap.ticker, so a
 * timeline and the frame that draws it can never be a tick apart.
 *
 * Feel — three shared signals drive the juice:
 *   trauma   0..1, decays linearly; shake = trauma², so small hits stay small
 *   hitstop  freezes the global timeline for a few frames on every impact
 *   flash    / aberration / glitch are post uniforms, kicked and tweened out
 * and the table carries a fourth: a surge that runs out along its conduits.
 *
 * Loops — needle jitter and charge tremble are per-frame terms with an
 * amplitude. On any state change the amplitude is killed and set to ZERO
 * immediately, then tweened back up once the new state settles; a loop is
 * never left running under a tween that is trying to stop it.
 *
 * Camera — a wide shot over the desk and a close-up on the reader's display,
 * blended by `cam.close`. The wide shot is FITTED, not tuned: on every resize
 * the distance and aim are solved so the reader and every pad land inside the
 * part of the viewport the HUD leaves free. The close-up is fitted to the
 * region the DOM panel leaves free.
 */

import * as THREE from "three";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { PlayModule } from "@/content/play";
import type { Sfx } from "./audio";
import { Particles, type Vec } from "./particles";
import { finalShader, shockFrag, uvVert } from "./shaders";
import { readFonts } from "./textures";
import { CART, buildCartridge, makeMaterials, setGlow, type Cartridge } from "./models";
import { BODY, HOVER_Y, INSERT_Y, SCREEN_Y, SLOT_TOP, buildReader, type Reader } from "./reader";
import { loadSurfaces } from "./surfaces";
import { PAD, buildTable, type LayoutMode, type Table } from "./table";

export type Rect = { x: number; y: number; w: number; h: number };
export type FrameInfo = {
  hover: { id: string; label: string; color: string; rect: Rect } | null;
  core: Vec;
  shake: { x: number; y: number; r: number };
};

export type StageEvents = {
  onHover: (i: number | null) => void;
  onPick: (i: number) => void;
  onEject: () => void;
  onToggleSound: (on: boolean) => void;
  onCharge: (v: number) => void;
  onDischarge: (count: number) => void;
  onFrame: (f: FrameInfo) => void;
};

type CartState = {
  c: Cartridge;
  /** pad: lying in its pad, posed by the frame · flight: a timeline owns it · seated: in the slot */
  mode: "pad" | "flight" | "seated";
  hover: { v: number };
  /** A hop off the pad — a surge passing, a discharge. y up, r yaw, tilt pitch. */
  hop: { y: number; r: number; tilt: number };
  enter: { y: number };
  blob: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};

type Hover = number | "core" | "eject" | "charge" | "toggle" | "knob0" | "knob1" | "knob2" | null;

const TAU = Math.PI * 2;
const IDLE_ACCENT = "#1fc3ec";
const FOG = 0.042;
/** The accent spill light at rest. */
const CORE_IDLE = 1.1;
/** A card lying in its pad: centre height. */
const REST_Y = PAD.h + CART.d / 2;
const FLAT = -Math.PI / 2;
/** World z of the reader's face. */
const FACE_Z = BODY.d / 2;
/** Pins-at-the-mouth height: the card's connector just inside the slot. */
const MOUTH_Y = SLOT_TOP + CART.h / 2 + 0.02;

/**
 * The close-up frames the display: the bezel and a margin, nothing else. The
 * panel carries the controls from there (its own EJECT, and Esc).
 */
const CLOSE_TARGET = new THREE.Vector3(0, SCREEN_Y, FACE_Z);
const CLOSE_HALF_H = 1.02 / 2 + 0.1;
const CLOSE_HALF_W = 1.66 / 2 + 0.12;
const CLOSE_PITCH = 0.05;

const bez = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, t: number, out: THREE.Vector3) => {
  const m = 1 - t;
  out.set(0, 0, 0)
    .addScaledVector(a, m * m * m)
    .addScaledVector(b, 3 * m * m * t)
    .addScaledVector(c, 3 * m * t * t)
    .addScaledVector(d, t * t * t);
  return out;
};

/** Cheap smooth noise for shake: three incommensurate sines. */
const wob = (t: number, s: number) => Math.sin(t * 23.1 + s) * 0.5 + Math.sin(t * 37.7 + s * 2.3) * 0.3 + Math.sin(t * 61.3 + s * 4.1) * 0.2;
const ease = {
  p3io: gsap.parseEase("power3.inOut"),
  p2io: gsap.parseEase("power2.inOut"),
};
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

/** A soft rounded-rect shadow, for contact darkening under the cards and the reader. */
function blobTexture() {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.filter = "blur(14px)";
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.roundRect(26, 26, S - 52, S - 52, 14);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}

export class Stage {
  // three
  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 160);
  private fitCam = new THREE.PerspectiveCamera(30, 1, 0.1, 160);
  private composer!: EffectComposer;
  private bloom!: UnrealBloomPass;
  private final!: ShaderPass;
  private table!: Table;
  private reader!: Reader;
  private carts: CartState[] = [];
  private dust!: THREE.Points;
  private shock!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private coreLight!: THREE.PointLight;
  private key!: THREE.SpotLight;
  private raycaster = new THREE.Raycaster();

  // 2d
  particles!: Particles;

  // layout
  private w = 1;
  private h = 1;
  private dpr = 1;
  private baseFov = 30;
  private mode: LayoutMode = "wide";
  /** The solved wide shot: aim, distance, pitch, and a pixel shift to centre it in the free region. */
  private wide = { target: new THREE.Vector3(0, 1.2, 1.6), dist: 14, pitch: 0.62, shiftX: 0, shiftY: 0 };
  private cam = { dist: 1, yaw: 0, pitch: 0, fovKick: 0, shiftX: 0, shiftY: 0, close: 0, visW: 1, visH: 1 };
  /** Drag to look round the desk: an offset in yaw that springs home. */
  private look = { yaw: 0, vel: 0 };
  private parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  private camTarget = new THREE.Vector3();

  // state
  private time = 0;
  private simScale = 1;
  private trauma = 0;
  private seated = -1;
  private busy = false;
  private booted = false;
  private energy = { base: 0, kick: 0 };
  private fx = { vent: 0, flash: 0, aberr: 0, glitch: 0 };
  private accent = new THREE.Color(IDLE_ACCENT);
  private accentHex = IDLE_ACCENT;
  /** The slot's lip lights: idle accent, the hovered card's colour, or a flare. */
  private slot = { k: 1.3, flare: 0, color: new THREE.Color(IDLE_ACCENT), target: new THREE.Color(IDLE_ACCENT) };
  private charge = 0;
  private charging = false;
  private chargeHeld = 0;
  private chargeViaButton = false;
  private jitter = { amp: 0 };
  private needleJitter = { amp: 1 };
  private discharges = 0;
  private linkClock = 0;
  private suckClock = 0;
  private deniedTimer = 0;
  private link: { to: () => Vec; color: string } | null = null;

  // input
  private ptr = { x: 0, y: 0, ndc: new THREE.Vector2(-9, -9), down: false, sx: 0, sy: 0, lx: 0, dragging: false, downOn: null as Hover, fine: true };
  private hovered: Hover = null;
  private pressTimer = 0;
  private tick = (_t: number, dtMs: number) => this.frame(dtMs / 1000);
  private ro!: ResizeObserver;
  private disposed = false;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private box = new THREE.Box3();
  private q = new THREE.Quaternion();

  readonly low: boolean;
  private shakeScale: number;

  constructor(
    private container: HTMLElement,
    private particleCanvas: HTMLCanvasElement,
    private modules: PlayModule[],
    private sfx: Sfx,
    private events: StageEvents,
    private opts: { reduced: boolean },
  ) {
    const coarse = matchMedia("(pointer: coarse)").matches;
    this.low = coarse || window.innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4;
    this.ptr.fine = !coarse;
    this.shakeScale = opts.reduced ? 0 : 1;
  }

  // ── setup ─────────────────────────────────────────────────────────────────

  async init() {
    // The surface scans load while the fonts settle.
    const surfaces = loadSurfaces();
    await document.fonts.ready;
    const fonts = readFonts();
    // Canvas text only uses a face once it is loaded; ask for the exact weights.
    await Promise.all(
      [`900 64px ${fonts.display}`, `700 20px ${fonts.mono}`, `500 20px ${fonts.mono}`, `800 20px ${fonts.display}`, `600 20px ${fonts.mono}`].map((f) => document.fonts.load(f).catch(() => null)),
    );

    const r = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false });
    this.renderer = r;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.low ? 1.5 : 1.75);
    r.setPixelRatio(this.dpr);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setClearColor("#040507");
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.domElement.className = "play-gl";
    this.container.prepend(r.domElement);

    const aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.38;
    this.scene.background = new THREE.Color("#040507");
    this.scene.fog = new THREE.FogExp2("#040507", FOG);
    pmrem.dispose();

    const surf = await surfaces;
    this.buildLights();
    this.table = buildTable({ fonts, aniso, hi: !this.low, surf, modules: this.modules, fogDensity: FOG });
    this.scene.add(this.table.root);
    const mats = makeMaterials();
    this.reader = buildReader(fonts, aniso, mats, !this.low, this.modules.length, surf);
    this.scene.add(this.reader.root);
    const blobTex = blobTexture();
    const blobMat = (o: number) => new THREE.MeshBasicMaterial({ map: blobTex, color: "#000", transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const readerBlob = new THREE.Mesh(new THREE.PlaneGeometry(BODY.w + 1.1, 1.9), blobMat(0.75));
    readerBlob.rotation.x = FLAT;
    readerBlob.position.y = 0.02;
    this.scene.add(readerBlob);
    this.carts = this.modules.map((m) => {
      const c = buildCartridge(m, fonts, aniso, mats);
      this.scene.add(c.root);
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(CART.w + 0.55, CART.h + 0.55), blobMat(0.7));
      blob.rotation.order = "YXZ";
      blob.renderOrder = 1;
      this.scene.add(blob);
      return { c, mode: "pad", hover: { v: 0 }, hop: { y: 0, r: 0, tilt: 0 }, enter: { y: 0 }, blob } as CartState;
    });
    // Everything solid casts and receives; glass and glows do neither.
    for (const o of [this.reader.root, ...this.carts.map((cs) => cs.c.root)]) {
      o.traverse((x) => {
        const m = x as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
        const solid = mat.visible && !mat.transparent && !(mat as THREE.MeshBasicMaterial).isMeshBasicMaterial;
        m.castShadow = solid;
        m.receiveShadow = solid;
      });
    }
    this.buildDust();
    this.buildShock();

    // Post: MSAA on the composer's own target — renderer AA does not reach it.
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: this.low ? 2 : 4 });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.35, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.final = new ShaderPass(finalShader);
    this.final.uniforms.uFlashColor.value = new THREE.Color("#ffffff");
    this.final.uniforms.uRes.value = new THREE.Vector2(1, 1);
    this.final.uniforms.uScan.value = this.low ? 0.08 : 0.14;
    this.composer.addPass(this.final);

    this.particles = new Particles(this.particleCanvas, this.low ? 700 : 1800);
    this.particles.density = (this.low ? 0.6 : 1) * (this.opts.reduced ? 0.5 : 1);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.bindInput();

    this.prepareAssembly();
    // Standby: the desk is dark, the network barely live, the reader not yet built.
    const u = this.table.uniforms;
    u.uReveal.value = 2.5;
    u.uPower.value = 0.5;
    this.key.intensity = 0;
    this.cam.dist = 1.5;
    this.cam.pitch = 0.3;
    this.cam.yaw = 0.45;

    gsap.ticker.lagSmoothing(250, 33);
    gsap.ticker.add(this.tick);
    // Compile every material now so the first boot frame does not hitch.
    r.compile(this.scene, this.camera);
  }

  private keyIntensity = 400;

  private buildLights() {
    // The desk lamp: a warm spot high to the left, the only shadow caster. Far
    // enough off the lens axis that shadows fall where the camera sees them —
    // to the right of each card and behind-right of the reader.
    const key = new THREE.SpotLight("#fff0dc", this.keyIntensity, 48, 0.46, 1, 1.7);
    key.position.set(-6.5, 12, 5.5);
    key.target.position.set(0.2, 0.6, 0.7);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(this.low ? 1024 : 2048);
    key.shadow.camera.near = 6;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = this.low ? 3 : 5;
    this.key = key;
    const fill = new THREE.HemisphereLight("#9ab8ff", "#0a0a10", 0.14);
    const rimC = new THREE.PointLight("#1fc3ec", 34, 20, 2);
    rimC.position.set(-5.5, 3.5, -3.5);
    const rimM = new THREE.PointLight("#e8195b", 26, 20, 2);
    rimM.position.set(5.5, 2.8, -4);
    const front = new THREE.PointLight("#ffd9b8", 1.2, 18, 2);
    front.position.set(2, 8, 10);
    // Spills the accent colour from the reader onto the deck at its feet. Low
    // and close to the face, and short-ranged, so it tints the table between
    // the reader and the cards without whiting out a card lifted through it.
    this.coreLight = new THREE.PointLight(IDLE_ACCENT, 0, 4.5, 2);
    this.coreLight.position.set(0, 0.55, 1.05);
    this.scene.add(key, key.target, fill, rimC, rimM, front, this.coreLight);
  }

  private buildDust() {
    const n = this.low ? 160 : 360;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = 0.2 + Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      g,
      new THREE.PointsMaterial({ color: new THREE.Color("#ffe6c4").multiplyScalar(0.8), size: 0.022, sizeAttenuation: true, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.scene.add(this.dust);
  }

  private buildShock() {
    const m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#ffffff") }, uLife: { value: 1 } },
      vertexShader: uvVert,
      fragmentShader: shockFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shock = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
    this.shock.rotation.x = FLAT;
    this.shock.position.y = 0.035;
    this.shock.visible = false;
    this.scene.add(this.shock);
  }

  // ── layout ────────────────────────────────────────────────────────────────

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.w = w;
    this.h = h;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.composer.setPixelRatio(this.dpr);
    this.composer.setSize(w, h);
    const bs = this.low ? 0.35 : 0.5;
    this.bloom.setSize(w * this.dpr * bs, h * this.dpr * bs);
    this.final.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
    this.particles.resize(w, h, Math.min(this.dpr, 1.5));
    this.table.setPixelScale(h * this.dpr * 0.5);

    const aspect = w / h;
    this.mode = aspect < 0.9 ? "tall" : "wide";
    this.table.setMode(this.mode);
    this.syncPads();
    this.baseFov = aspect < 0.9 ? 40 : aspect < 1.3 ? 34 : 30;
    this.camera.aspect = aspect;
    this.fitWide();
  }

  /** Pad lights follow their cards — also after a layout change rebuilds the pads. */
  private syncPads() {
    this.table.pads.forEach((p, i) => {
      const cs = this.carts[i];
      if (!cs) return;
      const k = !cs.c.root.visible ? 0.12 : cs.mode === "pad" ? 0.6 : 3;
      setGlow(p.light, cs.c.module.color, k);
    });
  }

  /**
   * Solve the wide shot. The pitch is fixed per layout; the distance is the
   * smallest that fits the reader (with a card seated) and every pad and its
   * label into the free region; the aim is nudged so the content sits in the
   * middle of that region, and what asymmetry is left (the left rail is wider
   * than the right margin) becomes a pixel shift of the projection.
   */
  private fitWide() {
    const w = this.w;
    const h = this.h;
    const narrow = w < 760;
    // The phone's masthead rail is decoration; the desk may run under it.
    const m = { l: narrow ? 22 : 150, r: narrow ? 18 : 64, t: narrow ? 96 : 84, b: narrow ? 120 : 104 };
    const regW = Math.max(80, w - m.l - m.r);
    const regH = Math.max(80, h - m.t - m.b);
    const pitch = this.mode === "tall" ? 0.74 : 0.6;
    const pts: THREE.Vector3[] = [];
    for (const x of [-BODY.w / 2 - 0.1, BODY.w / 2 + 0.1])
      for (const y of [0, SLOT_TOP + CART.h / 2 + 0.1]) for (const z of [-0.5, 0.5]) pts.push(new THREE.Vector3(x, y, z));
    for (const p of this.table.pads) {
      const c = Math.cos(p.spot.yaw);
      const s = Math.sin(p.spot.yaw);
      for (const [lx, lz] of [
        [-PAD.w / 2 - 0.08, -PAD.d / 2 - 0.08],
        [PAD.w / 2 + 0.08, -PAD.d / 2 - 0.08],
        [-PAD.w / 2 - 0.08, PAD.d / 2 + 0.3],
        [PAD.w / 2 + 0.08, PAD.d / 2 + 0.3],
      ])
        pts.push(new THREE.Vector3(p.spot.x + lx * c + lz * s, 0.25, p.spot.z - lx * s + lz * c));
    }
    const cam = this.fitCam;
    cam.fov = this.baseFov;
    cam.aspect = w / h;
    cam.clearViewOffset();
    cam.updateProjectionMatrix();
    const dir = new THREE.Vector3(0, Math.sin(pitch), Math.cos(pitch));
    const T = new THREE.Vector3(0, 1.0, 1.6);
    const bbox = (d: number) => {
      cam.position.copy(T).addScaledVector(dir, d);
      cam.lookAt(T);
      cam.updateMatrixWorld();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of pts) {
        this.tmp.copy(p).project(cam);
        const x = (this.tmp.x * 0.5 + 0.5) * w;
        const y = (-this.tmp.y * 0.5 + 0.5) * h;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      return { x0, x1, y0, y1 };
    };
    let d = 14;
    for (let pass = 0; pass < 3; pass++) {
      let lo = 3;
      let hi = 90;
      for (let k = 0; k < 26; k++) {
        d = (lo + hi) / 2;
        const b = bbox(d);
        if (b.x1 - b.x0 <= regW && b.y1 - b.y0 <= regH) hi = d;
        else lo = d;
      }
      d = hi;
      // Re-aim vertically so the content's centre is the region's centre.
      const b = bbox(d);
      const cy = (b.y0 + b.y1) / 2;
      const ry = m.t + regH / 2;
      const perPx = (2 * d * Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2))) / h;
      const up = new THREE.Vector3(0, Math.cos(pitch), -Math.sin(pitch));
      T.addScaledVector(up, -(cy - ry) * perPx);
    }
    const b = bbox(d);
    this.wide.target.copy(T);
    this.wide.dist = d;
    this.wide.pitch = pitch;
    this.wide.shiftX = (b.x0 + b.x1) / 2 - (m.l + regW / 2);
    this.wide.shiftY = 0;
  }

  /**
   * Slide the close-up's projection so the display centres in the space a
   * panel leaves. `visW` / `visH` are the fractions of the viewport left
   * visible — the close-up is fitted to that region, not to the whole screen.
   * The wide shot ignores all of it: it has its own solved framing.
   */
  setFocus(shiftX: number, shiftY: number, visW = 1, visH = 1) {
    gsap.to(this.cam, { shiftX, shiftY, visW, visH, duration: 1.1, ease: "expo.inOut", overwrite: "auto" });
  }

  private closeDist() {
    const t = Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2));
    const aspect = this.w / this.h;
    return Math.max(CLOSE_HALF_H / (t * this.cam.visH), CLOSE_HALF_W / (t * aspect * this.cam.visW));
  }

  // ── projection helpers ────────────────────────────────────────────────────

  project(v: THREE.Vector3): Vec {
    this.tmp2.copy(v).project(this.camera);
    return { x: (this.tmp2.x * 0.5 + 0.5) * this.w, y: (-this.tmp2.y * 0.5 + 0.5) * this.h };
  }
  private coreScreen = (): Vec => this.project(this.tmp.set(0, BODY.base + BODY.h * 0.5, FACE_Z));
  private slotScreen = (): Vec => this.project(this.tmp.set(0, SLOT_TOP, 0));
  /** The right edge of the display — where the panel link leaves from. */
  private displayScreen = (): Vec => this.project(this.tmp.set(0.72, SCREEN_Y, FACE_Z + 0.05));
  private screenRadius(worldR: number, y = BODY.base + BODY.h * 0.5) {
    const a = this.project(this.tmp.set(0, y, 0));
    const b = this.project(this.tmp.set(worldR, y, 0));
    return Math.abs(b.x - a.x);
  }

  /** Screen rect of a box of half-extents (hx, hy, hz) in an object's frame. */
  private rectOf(m: THREE.Matrix4, hx: number, hy: number, hz: number, cx = 0, cy = 0, cz = 0): Rect {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      this.tmp.set(cx + (i & 1 ? hx : -hx), cy + (i & 2 ? hy : -hy), cz + (i & 4 ? hz : -hz)).applyMatrix4(m);
      const p = this.project(this.tmp);
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  private hitRect(hit: THREE.Mesh): Rect {
    const g = hit.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    this.box.copy(g.boundingBox!);
    const c = this.box.getCenter(new THREE.Vector3());
    const s = this.box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    // Controls are shallow; lock on to their face, not the full hit depth.
    return this.rectOf(hit.matrixWorld, s.x * 0.8, s.y * 0.8, Math.min(s.z, 0.02), c.x, c.y, c.z);
  }

  private cartScreen(cs: CartState): Vec {
    cs.c.root.getWorldPosition(this.tmp);
    return this.project(this.tmp);
  }

  /** A card's resting pose in its pad. */
  private padPose(i: number, pos: THREE.Vector3, quat?: THREE.Quaternion) {
    const s = this.table.pads[i].spot;
    pos.set(s.x, REST_Y, s.z);
    if (quat) quat.setFromEuler(new THREE.Euler(FLAT, s.yaw, 0, "YXZ"));
    return s;
  }

  // ── input ─────────────────────────────────────────────────────────────────

  private bindInput() {
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    el.addEventListener("pointerleave", this.onLeave);
  }

  private setPtr(e: PointerEvent) {
    const r = this.container.getBoundingClientRect();
    this.ptr.x = e.clientX - r.left;
    this.ptr.y = e.clientY - r.top;
    this.ptr.ndc.set((this.ptr.x / this.w) * 2 - 1, -(this.ptr.y / this.h) * 2 + 1);
    this.parallax.tx = this.ptr.ndc.x;
    this.parallax.ty = this.ptr.ndc.y;
  }

  private onLeave = () => {
    if (!this.ptr.down) this.ptr.ndc.set(-9, -9);
  };

  private onDown = (e: PointerEvent) => {
    if (!this.booted) return;
    this.setPtr(e);
    // A mouse clicks what the target lock is showing; touch has no hover, so it picks now.
    if (!this.ptr.fine || e.pointerType !== "mouse") this.pick();
    this.ptr.down = true;
    this.ptr.sx = this.ptr.lx = e.clientX;
    this.ptr.sy = e.clientY;
    this.ptr.dragging = false;
    this.ptr.downOn = this.hovered;
    window.clearTimeout(this.pressTimer);
    if (this.hovered === "charge") {
      // The CHG button charges the moment it goes down, and stays down.
      this.chargeViaButton = true;
      this.pressButton(this.reader.charge, true);
      this.startCharge();
    } else if (this.hovered === "core") {
      this.pressTimer = window.setTimeout(() => {
        if (this.ptr.down && !this.ptr.dragging) this.startCharge();
      }, 170);
    } else if (this.hovered === "eject") {
      this.pressButton(this.reader.eject, true);
    }
  };

  private onMove = (e: PointerEvent) => {
    if (e.target !== this.renderer.domElement && !this.ptr.down) {
      // Over the HUD or a panel: no 3D hover underneath it.
      this.ptr.ndc.set(-9, -9);
      return;
    }
    this.setPtr(e);
    if (!this.ptr.down) return;
    const dx = e.clientX - this.ptr.lx;
    this.ptr.lx = e.clientX;
    const onControl = this.ptr.downOn === "charge" || this.ptr.downOn === "eject";
    if (!this.charging && !onControl && Math.hypot(e.clientX - this.ptr.sx, e.clientY - this.ptr.sy) > 7) {
      this.ptr.dragging = true;
      window.clearTimeout(this.pressTimer);
    }
    // Drag looks round the desk — only in the wide shot.
    if (this.ptr.dragging && this.cam.close < 0.5) this.look.vel -= (dx / this.w) * (this.ptr.fine ? 7 : 10);
  };

  private onUp = () => {
    if (!this.ptr.down) return;
    this.ptr.down = false;
    window.clearTimeout(this.pressTimer);
    const on = this.ptr.downOn;
    if (this.chargeViaButton) {
      this.chargeViaButton = false;
      this.pressButton(this.reader.charge, false);
    }
    if (this.charging) {
      this.releaseCharge();
      return;
    }
    if (this.ptr.dragging) return;
    if (typeof on === "number") this.events.onPick(on);
    else if (on === "eject") {
      this.pressButton(this.reader.eject, false);
      this.ejectPressed();
    } else if (on === "toggle") this.flipToggle();
    else if (on === "knob0" || on === "knob1" || on === "knob2") this.spinKnob(+on.slice(4));
    else if (on === "core") this.poke();
    if (!this.ptr.fine) this.ptr.ndc.set(-9, -9);
  };

  private pick() {
    if (this.ptr.ndc.x < -2) {
      this.setHover(null);
      return;
    }
    this.raycaster.setFromCamera(this.ptr.ndc, this.camera);
    const rd = this.reader;
    const targets: THREE.Object3D[] = [rd.eject.hit, rd.charge.hit, rd.toggle.hit, ...rd.knobs.map((k) => k.hit)];
    this.carts.forEach((cs) => cs.mode === "pad" && targets.push(cs.c.hit));
    targets.push(rd.hit);
    const hit = this.raycaster.intersectObjects(targets, false)[0];
    if (!hit) return this.setHover(null);
    const o = hit.object;
    if (o === rd.eject.hit) return this.setHover("eject");
    if (o === rd.charge.hit) return this.setHover("charge");
    if (o === rd.toggle.hit) return this.setHover("toggle");
    const k = rd.knobs.findIndex((kn) => kn.hit === o);
    if (k >= 0) return this.setHover(`knob${k}` as Hover);
    if (o === rd.hit) return this.setHover("core");
    const i = this.carts.findIndex((cs) => cs.c.hit === o);
    this.setHover(i >= 0 ? i : null);
  }

  private setHover(h: Hover) {
    if (h === this.hovered) return;
    const prev = this.hovered;
    this.hovered = h;
    if (typeof prev === "number") gsap.to(this.carts[prev].hover, { v: 0, duration: 0.35, ease: "power3.out", overwrite: true });
    const glowBtn = (b: Reader["eject"], on: boolean) => {
      const m = b.capMesh.material as THREE.MeshPhysicalMaterial;
      m.emissive.copy(m.color).multiplyScalar(on ? 0.35 : 0);
    };
    glowBtn(this.reader.eject, h === "eject");
    glowBtn(this.reader.charge, h === "charge");
    if (typeof h === "number") {
      gsap.to(this.carts[h].hover, { v: 1, duration: 0.55, ease: "elastic.out(1.1, 0.45)", overwrite: true });
      this.sfx.hover(h);
    } else if (h && h !== "core") this.sfx.hover(8);
    // The slot answers a hovered card in its colour: this is where it goes.
    if (this.seated < 0 && !this.busy) this.slot.target.set(typeof h === "number" ? this.carts[h].c.module.color : this.accentHex);
    this.renderer.domElement.style.cursor = h !== null ? "pointer" : "";
    this.events.onHover(typeof h === "number" ? h : null);
  }

  /** Keyboard look, in radians of impulse. */
  nudge(v: number) {
    if (this.cam.close < 0.5) this.look.vel += v * 0.8;
  }

  // ── the reader's controls ─────────────────────────────────────────────────

  private pressButton(b: Reader["eject"], down: boolean) {
    gsap.killTweensOf(b.press);
    if (down) {
      gsap.to(b.press, { z: -0.042, duration: 0.07, ease: "power3.in" });
      this.sfx.click();
    } else {
      gsap.to(b.press, { z: 0, duration: 0.6, ease: "elastic.out(1.2, 0.3)" });
    }
  }

  /** The red button. With a card seated it ejects; without, the LCD says so. */
  private ejectPressed() {
    this.addTrauma(0.06);
    if (this.busy) return;
    if (this.seated >= 0) {
      this.events.onEject();
      return;
    }
    this.sfx.denied();
    const scr = this.reader.screen;
    scr.set("denied");
    scr.glitch = 0.6;
    gsap.to(scr, { glitch: 0, duration: 0.4 });
    window.clearTimeout(this.deniedTimer);
    this.deniedTimer = window.setTimeout(() => {
      if (this.seated < 0 && scr.mode === "denied") scr.set("idle");
    }, 1400);
    gsap.fromTo(this.reader.body.position, { x: -0.03 }, { x: 0, duration: 0.5, ease: "elastic.out(1.4, 0.2)" });
  }

  private flipToggle() {
    const t = this.reader.toggle;
    this.setToggle(!t.on);
    this.sfx.clunk();
    this.addTrauma(0.05);
    this.events.onToggleSound(t.on);
  }

  /** Sync the lever with the HUD's sound button. */
  setToggle(on: boolean) {
    const t = this.reader.toggle;
    t.on = on;
    gsap.to(t.lever.rotation, { x: on ? 0.55 : -0.55, duration: 0.45, ease: "elastic.out(1.3, 0.35)", overwrite: true });
  }

  private spinKnob(k: number) {
    const kn = this.reader.knobs[k];
    kn.v.vel += (k === 2 ? 9 : 14) * (Math.random() < 0.5 ? 1 : -1);
    this.sfx.ratchet();
    const s = this.project(kn.g.getWorldPosition(this.tmp));
    this.particles.sparks(s.x, s.y, { count: 6, colors: ["#ffffff", this.accentHex], speed: 300 });
  }

  // ── feel primitives ───────────────────────────────────────────────────────

  private addTrauma(v: number) {
    this.trauma = Math.min(1, this.trauma + v);
  }

  private hitstop(ms: number) {
    if (this.opts.reduced) return;
    this.simScale = 0.02;
    gsap.globalTimeline.timeScale(0.02);
    window.setTimeout(() => {
      this.simScale = 1;
      gsap.globalTimeline.timeScale(1);
    }, ms);
  }

  private flash(hex: string, k: number, dur = 0.35) {
    const kk = this.opts.reduced ? k * 0.3 : k;
    (this.final.uniforms.uFlashColor.value as THREE.Color).set(hex);
    gsap.killTweensOf(this.fx, "flash");
    gsap.fromTo(this.fx, { flash: kk }, { flash: 0, duration: dur, ease: "expo.out" });
  }

  private kick(prop: "aberr" | "glitch" | "vent", from: number, dur: number, easeName = "expo.out") {
    gsap.killTweensOf(this.fx, prop);
    gsap.fromTo(this.fx, { [prop]: from }, { [prop]: 0, duration: dur, ease: easeName });
  }

  /** A surge out along the conduits; cards hop as its front passes their pad. */
  private surge(strength: number, hex: string, hop = 0) {
    const speed = 8;
    this.table.surge(this.time, strength, hex, speed);
    if (!hop || this.opts.reduced) return;
    this.carts.forEach((cs, i) => {
      if (cs.mode !== "pad") return;
      const s = this.table.pads[i].spot;
      const delay = Math.hypot(s.x, s.z) / speed;
      this.hopCard(cs, hop, delay);
    });
  }

  /** Bounce a card off its pad and back into it. */
  private hopCard(cs: CartState, k: number, delay = 0) {
    const h = cs.hop;
    gsap.killTweensOf(h);
    const up = 0.1 + k * 0.5;
    const r = (Math.random() - 0.5) * 0.5 * k;
    const tilt = (Math.random() - 0.5) * 0.45 * k;
    const air = 0.16 + k * 0.14;
    const tl = gsap.timeline({ delay });
    tl.to(h, { y: up, r, tilt, duration: air, ease: "power2.out" });
    tl.to(h, { y: 0, duration: air * 0.9, ease: "power2.in" });
    tl.to(h, { r: 0, tilt: 0, duration: 0.9, ease: "elastic.out(1.1, 0.4)" }, air * 1.9);
    tl.fromTo(cs.c.squash.scale, { x: 1, y: 1, z: 1 }, { x: 1 + 0.12 * k, y: 1 + 0.12 * k, z: 1 - 0.3 * k, duration: 0.06, ease: "power2.out", immediateRender: false }, air * 1.9);
    tl.to(cs.c.squash.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" }, air * 1.9 + 0.06);
    tl.call(() => {
      if (k > 0.3) this.sfx.tick();
    }, [], air * 1.9);
  }

  private shockwave(hex: string, size: number, dur: number) {
    const s = this.shock;
    s.visible = true;
    s.material.uniforms.uColor.value.set(hex);
    gsap.killTweensOf([s.scale, s.material.uniforms.uLife]);
    gsap.fromTo(s.scale, { x: 0.5, y: 0.5 }, { x: size, y: size, duration: dur, ease: "expo.out" });
    gsap.fromTo(s.material.uniforms.uLife, { value: 0 }, { value: 1, duration: dur, ease: "power1.in", onComplete: () => (s.visible = false) });
  }

  private setAccent(hex: string, dur = 0.3) {
    const from = this.accent.clone();
    const to = new THREE.Color(hex);
    this.accentHex = hex;
    const p = { t: 0 };
    gsap.to(p, {
      t: 1,
      duration: dur,
      ease: "power2.out",
      onUpdate: () => {
        this.accent.copy(from).lerp(to, p.t);
        const hexNow = `#${this.accent.getHexString()}`;
        for (const m of this.reader.accents) setGlow(m, hexNow, m.userData.k as number);
        this.table.uniforms.uAccent.value.copy(this.accent);
        this.coreLight.color.copy(this.accent);
      },
    });
  }

  /** Push the camera in on the display (1) or pull back to the desk (0). */
  private closeUp(on: boolean, delay = 0) {
    gsap.to(this.cam, { close: on ? 1 : 0, duration: on ? 1.6 : 1.2, delay, ease: on ? "expo.inOut" : "power3.inOut", overwrite: false });
    if (on) window.setTimeout(() => this.sfx.servo(0.9, true), delay * 1000);
  }

  // ── boot: the lamp comes on, the desk wakes, the reader assembles ────────

  private rest = new Map<THREE.Object3D, { p: THREE.Vector3; r: THREE.Euler; s: THREE.Vector3 }>();

  private prepareAssembly() {
    for (const a of this.reader.assembly) {
      const o = a.obj;
      this.rest.set(o, { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() });
      o.visible = false;
    }
    for (const cs of this.carts) {
      cs.c.root.visible = false;
      cs.blob.visible = false;
    }
  }

  boot(onHud: () => void): Promise<void> {
    return new Promise((resolve) => {
      const reduced = this.opts.reduced;
      const rd = this.reader;
      const u = this.table.uniforms;
      this.sfx.bootUp();
      this.sfx.musicOn(1, 4);
      const tl = gsap.timeline({ onComplete: () => resolve() });
      this.flash("#bff6ff", 0.4, 0.6);
      this.kick("glitch", 1, 0.8);
      this.kick("aberr", 1.2, 1);

      // The lamp strikes like a tube: two false starts, then it holds.
      const K = this.keyIntensity;
      tl.to(this.key, { intensity: K * 0.7, duration: 0.03 }, 0.15)
        .to(this.key, { intensity: 0, duration: 0.05 }, 0.2)
        .to(this.key, { intensity: K * 0.5, duration: 0.03 }, 0.34)
        .to(this.key, { intensity: K * 0.08, duration: 0.06 }, 0.39)
        .to(this.key, { intensity: K, duration: 0.6, ease: "power2.out" }, 0.52);
      tl.call(() => this.sfx.clunk(), [], 0.15);

      // Camera settles from the high survey angle.
      tl.to(this.cam, { dist: 1, pitch: 0, yaw: 0, duration: 3.4, ease: "power3.inOut" }, 0);
      // The network lights up from the reader outward.
      tl.to(u.uReveal, { value: 60, duration: 3.6, ease: "power2.in" }, 0.3);
      tl.to(u.uPower, { value: 1, duration: 1.2, ease: "power2.out" }, 0.3);
      tl.call(onHud, [], 1.2);

      const T = (order: number) => 0.45 + order * 0.2;
      const items = [...rd.assembly].sort((a, b) => a.order - b.order);
      let popN = 0;
      items.forEach((a, idx) => {
        const o = a.obj;
        const r = this.rest.get(o)!;
        let at = T(a.order) + (idx % 4) * 0.02;
        if (a.kind === "pop") at = T(a.order) + popN++ * 0.045;
        tl.call(() => {
          o.visible = true;
        }, [], at);
        if (a.kind === "drop") {
          tl.fromTo(o.position, { y: r.p.y + 5 + a.order * 0.3 }, { y: r.p.y, duration: 0.5, ease: "back.out(1.3)", immediateRender: false }, at);
          tl.fromTo(o.rotation, { y: r.r.y + (idx % 2 ? 1 : -1) * 0.5 }, { y: r.r.y, duration: 0.6, ease: "back.out(2)", immediateRender: false }, at);
        } else if (a.kind === "slide") {
          tl.fromTo(o.position, { z: r.p.z + 2.6, y: r.p.y + 0.4 }, { z: r.p.z, y: r.p.y, duration: 0.55, ease: "back.out(1.7)", immediateRender: false }, at);
          tl.fromTo(o.rotation, { x: -0.9, z: (idx % 2 ? 1 : -1) * 0.3 }, { x: r.r.x, z: r.r.z, duration: 0.7, ease: "back.out(2.2)", immediateRender: false }, at);
          tl.call(() => {
            this.sfx.clunk();
            this.addTrauma(0.12);
          }, [], at + 0.3);
        } else {
          tl.fromTo(o.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: r.s.x, y: r.s.y, z: r.s.z, duration: 0.5, ease: "back.out(3)", immediateRender: false }, at);
          if (a.order === 5 && popN % 2 === 0) tl.call(() => this.sfx.tick(), [], at + 0.1);
        }
      });

      // The feet land.
      tl.call(() => {
        this.sfx.clunk();
        this.addTrauma(0.15);
      }, [], T(1) + 0.2);
      // The chassis drops onto them.
      tl.call(() => {
        this.sfx.impact(0.55);
        this.addTrauma(0.35);
        this.surge(0.6, "#bff6ff");
        const c = this.coreScreen();
        this.particles.sparks(c.x, this.project(this.tmp.set(0, BODY.base, FACE_Z)).y, { count: 30, colors: ["#ffffff", "#ffd27a"], speed: 800, spread: 2.4, angle: -Math.PI / 2 });
      }, [], T(2) + 0.18);
      tl.fromTo(rd.body.scale, { x: 1.06, y: 0.9, z: 1.06 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1.2, 0.3)", immediateRender: false }, T(2) + 0.18);
      tl.call(() => this.sfx.servo(0.5, true), [], T(3));

      // The slot housing is order 6: its landing is the big one.
      const humpLand = T(6) + 0.2;
      tl.call(() => {
        this.hitstop(60);
        this.sfx.impact(0.8);
        this.addTrauma(0.5);
        this.flash("#ffffff", 0.22, 0.3);
        this.surge(1, IDLE_ACCENT);
        this.shockwave(IDLE_ACCENT, 12, 1.2);
        const s = this.slotScreen();
        this.particles.sparks(s.x, s.y, { count: 50, colors: ["#ffffff", "#bff6ff", IDLE_ACCENT], speed: 1000 });
      }, [], humpLand);
      tl.fromTo(rd.body.scale, { x: 1.05, y: 0.9, z: 1.05 }, { x: 1, y: 1, z: 1, duration: 0.9, ease: "elastic.out(1.2, 0.3)", immediateRender: false }, humpLand);

      // Power on: the LCD backlight flickers up like a tube.
      const ign = humpLand + 0.25;
      const scr = rd.screen;
      tl.call(() => scr.set("idle"), [], ign);
      tl.to(scr, { power: 1, duration: 0.04 }, ign)
        .to(scr, { power: 0.1, duration: 0.05 }, ign + 0.06)
        .to(scr, { power: 0.9, duration: 0.04 }, ign + 0.16)
        .to(scr, { power: 0.25, duration: 0.05 }, ign + 0.22)
        .to(scr, { power: 1, duration: 0.5, ease: "power2.out" }, ign + 0.3);
      tl.to(this.energy, { base: 1, duration: 0.6 }, ign + 0.3);
      tl.to(this.coreLight, { intensity: CORE_IDLE, duration: 0.8 }, ign + 0.3);
      tl.call(() => {
        this.sfx.glitch(5);
        setGlow(rd.leds.pwr, "#7dff6a", 3.5);
        this.setAccent(IDLE_ACCENT, 0.01);
        // Needle self-test: full sweep and back, like a car dash.
        rd.gauge.v.target = 8;
        window.setTimeout(() => (rd.gauge.v.target = 0), 380);
      }, [], ign + 0.3);

      // The cards are dealt: each drops into its pad and lands flat with a slap.
      const cartsAt = ign + 0.5;
      this.carts.forEach((cs, i) => {
        const t = cartsAt + i * 0.1;
        tl.call(() => {
          cs.c.root.visible = true;
          cs.blob.visible = true;
        }, [], t);
        tl.fromTo(cs.enter, { y: 3.2 }, { y: 0, duration: 0.38, ease: "power3.in", immediateRender: false }, t);
        tl.call(() => {
          this.sfx.tick();
          this.sfx.clunk();
          this.addTrauma(0.05);
          const p = this.cartScreen(cs);
          this.particles.sparks(p.x, p.y, { count: 10, colors: [cs.c.module.color, "#ffffff"], speed: 420, spread: 2.6, angle: -Math.PI / 2 });
          this.particles.debris(p.x, p.y, { count: 4, colors: ["#6b727c", "#e9e4d6"], speed: 260 });
          setGlow(this.table.pads[i].light, cs.c.module.color, 0.6);
        }, [], t + 0.38);
        tl.fromTo(cs.c.squash.scale, { x: 1.14, y: 1.14, z: 0.6 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: "elastic.out(1.2, 0.35)", immediateRender: false }, t + 0.38);
      });
      tl.call(() => {
        this.booted = true;
        this.sfx.engage(0);
      }, [], cartsAt + this.carts.length * 0.1 + 0.5);
      if (reduced) tl.timeScale(1.4);
    });
  }

  // ── load: lift, fly, align, feed, latch ───────────────────────────────────

  load(i: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.busy || this.seated >= 0) return resolve();
      this.busy = true;
      const cs = this.carts[i];
      const m = cs.c.module;
      const { root, spin, squash } = cs.c;
      const rd = this.reader;
      const pad = this.table.pads[i];
      this.setHover(null);

      // Reset the loops on this card to zero, now — not a frame later.
      gsap.killTweensOf([cs.hover, cs.hop, cs.enter]);
      cs.hover.v = 0;
      cs.hop.y = cs.hop.r = cs.hop.tilt = cs.enter.y = 0;
      spin.rotation.set(0, 0, 0);
      squash.rotation.set(0, 0, 0);
      cs.mode = "flight";
      root.rotation.order = "XYZ";

      const P0 = root.position.clone();
      const q0 = root.quaternion.clone();
      const toReader = new THREE.Vector3(-P0.x, 0, -P0.z).normalize();
      const P1 = P0.clone().addScaledVector(toReader, 0.25).setY(REST_Y + 0.75);
      // Lifted: top edge raised toward the lens, the way a hand picks a card up.
      const q1 = q0.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X_AXIS, 0.55));
      const qUp = new THREE.Quaternion();
      const PA = new THREE.Vector3(0, HOVER_Y, 0);
      const c1 = P1.clone().setY(P1.y + 1.6).addScaledVector(toReader, 0.4);
      const c2 = new THREE.Vector3(0, HOVER_Y + 1.1, 0.9);

      const tl = gsap.timeline();
      // 1 · press: the pad lets go, the card squashes into it.
      tl.call(() => {
        this.sfx.latch();
        setGlow(pad.light, m.color, 3);
        this.slot.target.set(m.color);
      }, [], 0);
      tl.to(squash.scale, { x: 1.05, y: 1.05, z: 0.78, duration: 0.09, ease: "power2.out" }, 0);
      tl.call(() => {
        rd.gauge.v.target = 0.5;
      }, [], 0);

      // 2 · lift, stretched along its thickness.
      const L = 0.09;
      tl.to(root.position, { x: P1.x, y: P1.y, z: P1.z, duration: 0.24, ease: "power3.out" }, L);
      tl.to(squash.scale, { x: 0.96, y: 0.96, z: 1.25, duration: 0.1, ease: "power2.out" }, L);
      tl.to(squash.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" }, L + 0.1);
      const pl = { t: 0 };
      tl.to(pl, { t: 1, duration: 0.24, ease: "power3.out", onUpdate: () => root.quaternion.slerpQuaternions(q0, q1, pl.t) }, L);
      tl.call(() => {
        const s = this.cartScreen(cs);
        this.particles.sparks(s.x, s.y + 12, { count: 8, colors: [m.color, "#ffffff"], speed: 260, spread: 2.8, angle: -Math.PI / 2, gravity: 400 });
      }, [], L);

      // 3 · flight: a swooping curve to the slot, turning upright, with one
      //     full turn on the way so the back label flashes past.
      const F = L + 0.24;
      const p = { t: 0 };
      tl.call(() => this.sfx.whoosh(0.6, true), [], F);
      tl.to(p, {
        t: 1,
        duration: 0.62,
        ease: "power2.inOut",
        onUpdate: () => {
          bez(P1, c1, c2, PA, p.t, root.position);
          const e = ease.p3io(p.t);
          root.quaternion.slerpQuaternions(q1, qUp, e);
          this.q.setFromAxisAngle(Y_AXIS, TAU * e);
          root.quaternion.premultiply(this.q);
        },
      }, F);
      tl.to(squash.scale, { x: 0.9, y: 1.16, z: 0.9, duration: 0.2, ease: "power3.out" }, F);
      tl.to(squash.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }, F + 0.34);
      tl.call(() => setGlow(cs.c.ledMat, m.color, 1.2), [], F + 0.4);

      // 4 · align: it settles over the slot; the slot flares in its colour.
      const A = F + 0.62;
      tl.call(() => {
        root.quaternion.identity();
        this.sfx.servo(0.25, true);
        gsap.fromTo(this.slot, { flare: 3 }, { flare: 0.8, duration: 0.5, ease: "power2.out" });
      }, [], A);
      tl.to(root.position, { y: HOVER_Y + 0.07, duration: 0.1, ease: "power1.out" }, A);
      tl.to(root.position, { y: HOVER_Y, duration: 0.12, ease: "power1.inOut" }, A + 0.1);

      // 5 · feed: pins into the mouth — a click, a beat of resistance — then
      //     the reader's own motor draws it the rest of the way.
      const M = A + 0.22;
      tl.to(root.position, { y: MOUTH_Y, duration: 0.11, ease: "power2.in" }, M);
      tl.call(() => {
        this.sfx.click();
        this.addTrauma(0.08);
        const s = this.slotScreen();
        this.particles.sparks(s.x, s.y, { count: 10, colors: ["#ffffff", m.color], speed: 380, spread: 1.4, angle: -Math.PI / 2 });
      }, [], M + 0.11);
      tl.to(squash.scale, { x: 1.04, y: 0.93, z: 1.04, duration: 0.07, ease: "power2.out" }, M + 0.11);
      tl.to(root.position, { y: MOUTH_Y - 0.03, duration: 0.09, ease: "power1.inOut" }, M + 0.11);
      tl.to(squash.scale, { x: 1, y: 1, z: 1, duration: 0.14, ease: "power2.out" }, M + 0.2);
      const D = M + 0.22;
      tl.call(() => {
        this.sfx.servo(0.32, false);
        rd.screen.glitch = 0.5;
      }, [], D);
      tl.to(root.position, { y: INSERT_Y, duration: 0.3, ease: "power1.in" }, D);
      tl.to(this.slot, { flare: 2.2, duration: 0.3, ease: "power1.in" }, D);

      // 6 · LATCH.
      const I = D + 0.3;
      tl.call(() => {
        cs.mode = "seated";
        this.seated = i;
        this.impact(cs, i);
      }, [], I);
      tl.call(() => {
        this.busy = false;
        resolve();
      }, [], I + 0.3);
    });
  }

  private impact(cs: CartState, i: number) {
    const m = cs.c.module;
    const rd = this.reader;
    this.hitstop(this.low ? 55 : 80);
    this.sfx.impact(1);
    this.sfx.engage(i * 2);
    this.addTrauma(0.55);
    this.flash(m.color, 0.2, 0.35);
    this.kick("aberr", 1.2, 0.6);
    this.kick("glitch", 0.35, 0.35);
    this.kick("vent", 0.09, 1.1, "elastic.out(1, 0.28)");
    gsap.fromTo(this.cam, { fovKick: -2.4 }, { fovKick: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: false });
    gsap.fromTo(cs.c.squash.scale, { x: 1.2, y: 0.8, z: 1.2 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: "elastic.out(1.3, 0.32)", overwrite: true });
    gsap.fromTo(rd.body.scale, { x: 1.05, y: 0.9, z: 1.05 }, { x: 1, y: 1, z: 1, duration: 0.95, ease: "elastic.out(1.2, 0.3)", overwrite: true });
    gsap.fromTo(this.energy, { kick: 5 }, { kick: 0, duration: 1.4, ease: "expo.out", overwrite: "auto" });
    gsap.fromTo(this.coreLight, { intensity: CORE_IDLE * 4 }, { intensity: CORE_IDLE * 1.3, duration: 1.2, ease: "expo.out" });
    gsap.fromTo(this.slot, { flare: 5 }, { flare: 0, duration: 1.2, ease: "expo.out", overwrite: true });
    setGlow(cs.c.ledMat, m.color, 5);
    this.setAccent(m.color, 0.25);
    this.surge(1.3, m.color, 0.28);
    this.shockwave(m.color, 9, 1);

    // The reader wakes up to the card: LCD reads it, gauge swings to its number.
    const scr = rd.screen;
    scr.set("reading", m);
    scr.glitch = 1;
    gsap.to(scr, { glitch: 0, duration: 0.5 });
    window.setTimeout(() => {
      if (this.seated === i) {
        scr.set("topic", m);
        this.sfx.engage(i * 2 + 5);
      }
    }, 620);
    rd.gauge.v.target = i + 1;
    rd.gauge.v.vel += 30;
    rd.drawSeg(`MOD ${m.n}`);
    setGlow(rd.eject.ringLight, "#ff3b2f", 3);
    this.closeUp(true, 0.4);

    const s = this.slotScreen();
    const cols = ["#ffffff", m.color, "#ffd27a"];
    const k = this.screenRadius(0.5, SLOT_TOP) / 60;
    this.particles.sparks(s.x - 40 * k, s.y, { count: 30, colors: cols, speed: 1100, spread: 0.9, angle: Math.PI + 0.35 });
    this.particles.sparks(s.x + 40 * k, s.y, { count: 30, colors: cols, speed: 1100, spread: 0.9, angle: -0.35 });
    this.particles.sparks(s.x, s.y, { count: 18, colors: ["#ffffff"], speed: 650, spread: 1, angle: -Math.PI / 2, gravity: 900 });
    this.particles.debris(s.x, s.y, { count: 8, colors: ["#e9e4d6", m.color, "#6b727c"] });
    this.particles.embers(s.x, s.y, { count: 16, colors: [m.color, "#ffffff"], radius: 70 * k });
    this.particles.ring(s.x, s.y + 6, { radius: this.screenRadius(1.1, SLOT_TOP), tilt: 0.3, color: m.color, life: 0.5, width: 5 });
  }

  // ── eject: pop, hiss, fly home, land flat ─────────────────────────────────

  eject(): Promise<void> {
    return new Promise((resolve) => {
      if (this.busy || this.seated < 0) return resolve();
      this.busy = true;
      const i = this.seated;
      const cs = this.carts[i];
      const rd = this.reader;
      const pad = this.table.pads[i];
      const { root, spin, squash } = cs.c;
      cs.mode = "flight";
      root.rotation.order = "XYZ";
      rd.screen.set("eject");
      rd.gauge.v.target = 0;
      rd.drawSeg("-- -- --");
      setGlow(rd.eject.ringLight, "#ff3b2f", 0);
      this.closeUp(false);

      const tl = gsap.timeline({
        onComplete: () => {
          cs.mode = "pad";
        },
      });
      // Anticipation: the reader crouches before it spits the card out.
      tl.call(() => {
        this.sfx.servo(0.3, false);
        this.sfx.hiss(0.7);
      }, [], 0);
      tl.to(rd.body.scale, { x: 1.03, y: 0.94, z: 1.03, duration: 0.13, ease: "power2.in" }, 0);
      tl.to(squash.scale, { x: 1.08, y: 0.9, z: 1.08, duration: 0.13, ease: "power2.in" }, 0);

      // Pop.
      tl.to(rd.body.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1.2, 0.35)" }, 0.13);
      tl.to(root.position, { y: HOVER_Y + 0.25, duration: 0.42, ease: "back.out(2.2)" }, 0.13);
      tl.fromTo(squash.scale, { x: 0.86, y: 1.24, z: 0.86 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", immediateRender: false }, 0.13);
      tl.call(() => {
        this.addTrauma(0.2);
        this.kick("vent", 0.05, 0.8, "elastic.out(1, 0.3)");
        setGlow(cs.c.ledMat, cs.c.module.color, 0.35);
        this.setAccent(IDLE_ACCENT, 0.5);
        this.slot.target.set(IDLE_ACCENT);
        gsap.to(this.coreLight, { intensity: CORE_IDLE, duration: 0.6 });
        const s = this.slotScreen();
        this.particles.sparks(s.x, s.y, { count: 24, colors: ["#e9f6ff", "#9aa3ad", "#ffffff"], speed: 480, spread: 1.1, angle: -Math.PI / 2, gravity: -250, life: 1.2 });
        this.particles.embers(s.x, s.y - 20, { count: 12, colors: ["#cfd8e0", "#ffffff"], radius: 50 });
      }, [], 0.13);

      // Home: a live curve to its pad, turning from upright to lying flat.
      const R = 0.5;
      const p = { t: 0 };
      const from = new THREE.Vector3();
      const target = new THREE.Vector3();
      const qFrom = new THREE.Quaternion();
      const qTo = new THREE.Quaternion();
      const c1 = new THREE.Vector3();
      const c2 = new THREE.Vector3();
      tl.call(() => {
        from.copy(root.position);
        qFrom.copy(root.quaternion);
        this.sfx.whoosh(0.6, false);
        // The bay is free the moment the card clears it: the next one can
        // go in while this one is still flying home.
        this.seated = -1;
        this.busy = false;
        window.setTimeout(() => {
          if (this.seated < 0 && rd.screen.mode === "eject") rd.screen.set("idle", null);
        }, 700);
        resolve();
      }, [], R);
      tl.to(p, {
        t: 1,
        duration: 0.78,
        ease: "power2.inOut",
        onUpdate: () => {
          this.padPose(i, target, qTo);
          c1.copy(from).setY(from.y + 1.1).setZ(from.z + 0.6);
          c2.copy(target).setY(target.y + 1.4);
          bez(from, c1, c2, target, p.t, root.position);
          const e = ease.p2io(p.t);
          root.quaternion.slerpQuaternions(qFrom, qTo, e);
        },
      }, R);
      tl.to(squash.scale, { x: 0.94, y: 1.1, z: 0.94, duration: 0.25, ease: "power2.out" }, R);
      tl.to(squash.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "power2.inOut" }, R + 0.4);
      // Slap.
      const H = R + 0.78;
      tl.call(() => {
        spin.rotation.set(0, 0, 0);
        this.sfx.clunk();
        this.sfx.tick();
        this.addTrauma(0.08);
        setGlow(pad.light, cs.c.module.color, 0.6);
        const s = this.cartScreen(cs);
        this.particles.sparks(s.x, s.y, { count: 12, colors: [cs.c.module.color, "#ffffff"], speed: 380, spread: 2.8, angle: -Math.PI / 2 });
        this.particles.debris(s.x, s.y, { count: 4, colors: ["#6b727c", "#e9e4d6"], speed: 240 });
      }, [], H);
      tl.fromTo(squash.scale, { x: 1.12, y: 1.12, z: 0.66 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1.2, 0.35)", immediateRender: false }, H);
    });
  }

  // ── the reader as a toy: poke, charge, discharge ──────────────────────────

  private poke() {
    this.sfx.poke();
    this.addTrauma(0.14);
    this.kick("vent", 0.04, 0.7, "elastic.out(1, 0.3)");
    gsap.fromTo(this.reader.body.scale, { x: 1.04, y: 0.93, z: 1.04 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: "elastic.out(1.2, 0.3)", overwrite: true });
    gsap.fromTo(this.energy, { kick: 2 }, { kick: 0, duration: 0.8, ease: "expo.out", overwrite: "auto" });
    this.reader.gauge.v.vel += 25;
    this.reader.meter.v.vel += 40;
    const scr = this.reader.screen;
    scr.glitch = 0.4;
    gsap.to(scr, { glitch: 0, duration: 0.25 });
    this.surge(0.35, this.accentHex);
    const c = this.coreScreen();
    this.particles.sparks(this.ptr.x || c.x, this.ptr.y || c.y, { count: 16, colors: ["#ffffff", this.accentHex], speed: 650 });
  }

  private startCharge() {
    this.charging = true;
    this.chargeHeld = 0;
    this.charge = 0;
    gsap.killTweensOf(this.jitter);
    this.jitter.amp = 1;
    // The idle needle wander is replaced by the charge — zero it, now.
    gsap.killTweensOf(this.needleJitter);
    this.needleJitter.amp = 0;
    this.sfx.chargeStart();
  }

  private releaseCharge() {
    const k = this.charge;
    const rd = this.reader;
    this.charging = false;
    this.charge = 0;
    this.chargeHeld = 0;
    gsap.killTweensOf(this.jitter);
    this.jitter.amp = 0;
    rd.root.position.set(0, 0, 0);
    rd.screen.charge = 0;
    rd.gauge.v.target = this.seated >= 0 ? this.seated + 1 : 0;
    setGlow(rd.leds.chg, "#ff3b2f", 0.2);
    this.sfx.chargeStop();
    this.events.onCharge(0);
    gsap.to(this.needleJitter, { amp: 1, duration: 1.2, delay: 0.8 });
    gsap.to(this.table.uniforms.uRush, { value: 0, duration: 0.8, ease: "power2.out", overwrite: true });
    if (k > 0.2) this.discharge(k);
  }

  private discharge(k: number) {
    const rd = this.reader;
    this.discharges++;
    this.hitstop(this.low ? 70 : 100);
    this.sfx.discharge(k);
    this.addTrauma(0.35 + k * 0.7);
    this.flash("#ffffff", 0.7 * k, 0.45);
    this.kick("glitch", 0.5 + k * 0.6, 1);
    this.kick("aberr", 2 * k, 1);
    this.kick("vent", 0.28 * k, 1.8, "elastic.out(1, 0.25)");
    gsap.fromTo(this.cam, { fovKick: 5 * k }, { fovKick: 0, duration: 1.2, ease: "elastic.out(1, 0.35)", overwrite: false });
    gsap.fromTo(rd.body.scale, { x: 0.93, y: 1.12, z: 0.93 }, { x: 1, y: 1, z: 1, duration: 1.1, ease: "elastic.out(1.3, 0.28)", overwrite: true });
    gsap.fromTo(this.energy, { kick: 9 * k }, { kick: 0, duration: 1.8, ease: "expo.out", overwrite: "auto" });
    gsap.fromTo(this.coreLight, { intensity: CORE_IDLE * 7 * k }, { intensity: this.seated >= 0 ? CORE_IDLE * 1.3 : CORE_IDLE, duration: 1.5, ease: "expo.out" });
    gsap.fromTo(this.slot, { flare: 6 * k }, { flare: 0, duration: 1.4, ease: "expo.out", overwrite: true });
    rd.screen.glitch = 1;
    gsap.to(rd.screen, { glitch: 0, duration: 1.1, ease: "power2.in" });
    rd.knobs.forEach((kn, n) => (kn.v.vel += (n % 2 ? -1 : 1) * 30 * k));
    rd.gauge.v.vel -= 80 * k;
    rd.meter.v.vel += 120 * k;

    // The desk jumps: every card off its pad, the network surges white.
    this.surge(2 * k, "#ffffff", 0.35 + k * 0.65);
    this.surge(1.2 * k, this.accentHex);
    this.shockwave("#ffffff", 22, 1.4);

    const c = this.coreScreen();
    const R = Math.min(this.w, this.h);
    this.particles.scatter(c.x, c.y, 1500 * k);
    this.particles.sparks(c.x, c.y, { count: Math.round(160 * k), colors: ["#ffffff", this.accentHex, "#ffd27a", "#e8195b"], speed: 1700 * k });
    this.particles.debris(c.x, c.y, { count: 18, colors: ["#e9e4d6", "#6b727c", "#b85a22"], speed: 1000 });
    this.particles.ring(c.x, c.y, { radius: R * 0.55, color: "#ffffff", life: 0.6, width: 10 });
    this.particles.ring(c.x, c.y, { radius: R * 0.95, color: this.accentHex, life: 0.9, width: 4 });
    this.particles.embers(c.x, c.y, { count: 30, colors: ["#ffc400", "#ffffff", this.accentHex], radius: 160 });
    this.events.onDischarge(this.discharges);
  }

  // ── panel link: packets stream from the display to a DOM target ──────────

  setLink(to: (() => Vec) | null, color = "#ffffff") {
    this.link = to ? { to, color } : null;
    if (to) this.particles.stream(this.displayScreen(), to, { count: 40, colors: [color, "#ffffff"], spread: 180, duration: 0.95, delay: 0.3 });
  }

  // ── the frame ─────────────────────────────────────────────────────────────

  private frame(rawDt: number) {
    if (this.disposed) return;
    const realDt = Math.min(rawDt, 0.05);
    const dt = realDt * this.simScale;
    this.time += dt;
    const t = this.time;
    const rd = this.reader;

    // Look: drag impulse, then a spring home.
    const lk = this.look;
    lk.yaw += lk.vel * realDt;
    lk.yaw = THREE.MathUtils.clamp(lk.yaw, -0.7, 0.7);
    const held = this.ptr.down && this.ptr.dragging;
    lk.vel += (held ? 0 : -lk.yaw * 9) * realDt;
    lk.vel *= Math.exp(-(held ? 6 : 4.2) * realDt);

    // Charge: the desk's current rushes into the reader.
    if (this.charging) {
      this.charge = Math.min(1, this.charge + dt / 1.6);
      if (this.charge >= 1) this.chargeHeld += dt;
      this.sfx.chargeSet(this.charge);
      this.events.onCharge(this.charge);
      rd.screen.charge = this.charge;
      rd.gauge.v.target = this.charge * 8.3;
      this.table.uniforms.uRush.value = this.charge;
      setGlow(rd.leds.chg, "#ff3b2f", Math.floor(t * (6 + this.charge * 14)) % 2 ? 4 : 0.2);
      this.trauma = Math.max(this.trauma, 0.1 + this.charge * 0.32);
      this.suckClock += dt * (18 + this.charge * 90);
      while (this.suckClock > 1) {
        this.suckClock -= 1;
        this.particles.suck(this.coreScreen, { count: 1, colors: [this.accentHex, "#ffffff"], strength: 4200 + this.charge * 5000 });
      }
      // Hold at full for a beat, then it goes on its own.
      if (this.chargeHeld > 0.45) {
        this.ptr.down = false;
        if (this.chargeViaButton) {
          this.chargeViaButton = false;
          this.pressButton(rd.charge, false);
        }
        this.releaseCharge();
      }
    }

    // The reader's moving parts.
    const jit = this.jitter.amp * this.charge;
    if (jit) rd.root.position.set((Math.random() - 0.5) * 0.04 * jit, 0, (Math.random() - 0.5) * 0.03 * jit);
    rd.hatch.position.z = BODY.d / 2 + this.fx.vent + this.charge * 0.035 + (jit ? (Math.random() - 0.5) * 0.02 * jit : 0);
    rd.eject.cap.position.z = 0.03 + rd.eject.press.z;
    rd.charge.cap.position.z = 0.03 + rd.charge.press.z;
    for (const kn of rd.knobs) {
      kn.v.a += kn.v.vel * dt;
      kn.v.vel *= Math.exp(-2.6 * dt);
      kn.spin.rotation.z = -kn.v.a;
    }
    // Needles: damped springs, so every change overshoots and settles.
    const nj = this.needleJitter.amp;
    const g = rd.gauge.v;
    const gT = g.target + nj * (Math.sin(t * 3.1) * 0.06 + Math.sin(t * 11.7) * 0.03) + (this.charging ? (Math.random() - 0.5) * 0.5 * this.charge : 0);
    g.vel += ((gT - g.val) * 110 - g.vel * 9) * dt;
    g.val += g.vel * dt;
    const gv = Math.max(-0.3, Math.min(8.6, g.val));
    rd.gauge.needle.rotation.z = -THREE.MathUtils.degToRad(-135 + (gv / 8) * 270);
    const mv = rd.meter.v;
    mv.target = 1.2 + Math.abs(Math.sin(t * 2.3)) * 1.5 * nj + this.trauma * 6 + this.charge * 7 + (this.seated >= 0 ? 2 : 0);
    mv.vel += ((mv.target - mv.val) * 160 - mv.vel * 12) * dt;
    mv.val += mv.vel * dt;
    rd.meter.needle.rotation.z = -THREE.MathUtils.degToRad(-60 + (Math.max(0, Math.min(10.5, mv.val)) / 10) * 120);
    // LEDs.
    const linkOn = this.seated >= 0 ? 2.5 + Math.sin(t * 6) * 1.2 : 0.25;
    setGlow(rd.leds.link, this.accentHex, linkOn + this.energy.kick * 0.5);
    if (this.seated >= 0) setGlow(rd.eject.ringLight, "#ff3b2f", 1.6 + Math.sin(t * 4) * 1.2);
    // The slot lips: ease toward their colour; a slow breath while the bay is empty.
    const sl = this.slot;
    sl.color.lerp(sl.target, Math.min(1, realDt * 8));
    const breath = this.seated < 0 && !this.busy ? 0.35 * (0.5 + 0.5 * Math.sin(t * 2.4)) : 0;
    const hoverBoost = typeof this.hovered === "number" ? 1.2 : 0;
    const slotK = (0.9 + breath + hoverBoost + sl.flare) * Math.min(1, this.energy.base + 0.001);
    rd.slotLights.color.copy(sl.color).multiplyScalar(slotK);
    // The LCD: fixed-rate redraw.
    if (rd.screen.mode !== "off" || rd.screen.power > 0) rd.screen.update(dt, this.low ? 20 : 30);

    this.table.update(t, dt);
    this.dust.rotation.y = t * 0.008;
    this.dust.position.y = Math.sin(t * 0.2) * 0.15;

    // Cards in their pads.
    for (let i = 0; i < this.carts.length; i++) {
      const cs = this.carts[i];
      const { root, spin, squash } = cs.c;
      if (cs.mode === "pad") {
        const s = this.padPose(i, root.position);
        const hv = cs.hover.v;
        root.position.y += hv * 0.16 + cs.hop.y + cs.enter.y;
        root.rotation.set(FLAT + hv * 0.16 + cs.hop.tilt, s.yaw + cs.hop.r, 0, "YXZ");
        spin.rotation.x = 0;
        squash.rotation.z = 0;
        // The empty pad's status light breathes a little with the hover.
        if (hv > 0.01) setGlow(this.table.pads[i].light, cs.c.module.color, 0.6 + hv * 1.6);
      }
      // Contact shadow: tight and dark on the pad, gone by the time it's in the air.
      const b = cs.blob;
      const y = root.position.y - REST_Y;
      const lift = THREE.MathUtils.clamp(y / 1.4, 0, 1);
      b.visible = root.visible && lift < 1 && cs.mode !== "seated";
      if (b.visible) {
        b.position.set(root.position.x, 0.018, root.position.z);
        b.rotation.set(FLAT, cs.mode === "pad" ? this.table.pads[i].spot.yaw + cs.hop.r : root.rotation.y, 0);
        b.material.opacity = 0.7 * (1 - lift) * (1 - lift);
        b.scale.setScalar(1 + lift * 0.6);
      }
    }

    // Camera: wide ⟷ close-up, + look + parallax + shake + punch.
    const par = this.parallax;
    const pk = this.ptr.fine ? 1 - this.cam.close * 0.6 : 0;
    par.x += (par.tx * pk - par.x) * Math.min(1, realDt * 2.5);
    par.y += (par.ty * pk - par.y) * Math.min(1, realDt * 2.5);
    const cl = this.cam.close;
    const ce = cl * cl * (3 - 2 * cl);
    const W = this.wide;
    this.camTarget.lerpVectors(W.target, CLOSE_TARGET, ce);
    const yaw = (this.cam.yaw + lk.yaw + Math.sin(t * 0.11) * 0.03) * (1 - ce) + par.x * 0.06;
    const pitch = THREE.MathUtils.lerp(W.pitch + this.cam.pitch, CLOSE_PITCH, ce) + Math.sin(t * 0.17) * 0.01 - par.y * 0.03;
    const wideD = W.dist * this.cam.dist;
    const d = wideD + (this.closeDist() - wideD) * ce;
    const cam = this.camera;
    const T = this.camTarget;
    cam.position.set(T.x + Math.sin(yaw) * Math.cos(pitch) * d, T.y + Math.sin(pitch) * d, T.z + Math.cos(yaw) * Math.cos(pitch) * d);
    cam.lookAt(T);
    this.trauma = Math.max(0, this.trauma - realDt * 1.35);
    const shake = this.trauma * this.trauma * this.shakeScale;
    const sx = wob(t, 1.3) * shake;
    const sy = wob(t, 7.9) * shake;
    const sr = wob(t, 4.2) * shake;
    // Shake scales with distance, so the close-up doesn't become an earthquake.
    const sk = 0.3 * (d / (W.dist || 1));
    cam.translateX(sx * sk);
    cam.translateY(sy * sk);
    cam.rotateZ(sr * 0.04);
    cam.fov = this.baseFov + this.cam.fovKick;
    cam.clearViewOffset();
    // The panel's focus shift belongs to the close-up; the wide shot keeps its own.
    const shX = W.shiftX * (1 - ce) + this.cam.shiftX * ce;
    const shY = W.shiftY * (1 - ce) + this.cam.shiftY * ce;
    if (shX || shY) cam.setViewOffset(this.w, this.h, shX, shY, this.w, this.h);
    cam.updateProjectionMatrix();
    this.scene.updateMatrixWorld();

    // Hover picking once per frame (fine pointers only; touch picks on down).
    if (this.booted && this.ptr.fine && !this.ptr.down) this.pick();

    if (this.booted && this.link) {
      this.linkClock += dt;
      if (this.linkClock > 0.3) {
        this.linkClock = 0;
        this.particles.stream(this.displayScreen(), this.link.to, { count: 2, colors: [this.link.color, "#ffffff"], spread: 140, duration: 1.1, delay: 0.1 });
      }
    }

    // Post.
    const f = this.final.uniforms;
    f.uTime.value = t;
    f.uFlash.value = this.fx.flash;
    f.uAberr.value = this.fx.aberr + shake * 1.2 + this.charge * 0.5;
    f.uGlitch.value = this.opts.reduced ? 0 : Math.min(1, this.fx.glitch + (this.charge > 0.75 ? (this.charge - 0.75) * 1.6 : 0));
    // Bloom is for LEDs, conduits and sparks; the close-up reads text, so it backs off there.
    this.bloom.strength = (0.45 + this.charge * 0.35 + this.fx.flash * 0.3) * (1 - ce * 0.55);

    this.composer.render(realDt);
    this.particles.update(realDt * (this.simScale < 1 ? 0.15 : 1));
    this.particles.draw();

    this.events.onFrame({ hover: this.hoverInfo(), core: this.coreScreen(), shake: { x: sx * 16, y: sy * 16, r: sr * 1.1 } });
  }

  private hoverInfo(): FrameInfo["hover"] {
    const h = this.hovered;
    const rd = this.reader;
    if (h === null || h === "core") return null;
    if (typeof h === "number") {
      const cs = this.carts[h];
      const m = cs.c.module;
      return { id: `m${h}`, label: `TARGET LOCK — ${m.n} ${m.code}`, color: m.color, rect: this.rectOf(cs.c.squash.matrixWorld, CART.w / 2, CART.h / 2, CART.d / 2) };
    }
    if (h === "eject") return { id: h, label: this.seated >= 0 ? "EJECT ⏏ — RELEASE MODULE" : "EJECT ⏏ — BAY EMPTY", color: "#ff3b2f", rect: this.hitRect(rd.eject.hit) };
    if (h === "charge") return { id: h, label: "HOLD — OVERCHARGE", color: "#f2913d", rect: this.hitRect(rd.charge.hit) };
    if (h === "toggle") return { id: h, label: rd.toggle.on ? "SND — ON" : "SND — OFF", color: "#e9e4d6", rect: this.hitRect(rd.toggle.hit) };
    const k = +h.slice(4);
    return { id: h, label: ["GAIN", "TUNE", "ROTARY"][k], color: "#e9e4d6", rect: this.hitRect(rd.knobs[k].hit) };
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.remove(this.tick);
    gsap.globalTimeline.timeScale(1);
    this.ro?.disconnect();
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    window.clearTimeout(this.deniedTimer);
    this.sfx.chargeStop();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        Object.values(x).forEach((v) => v instanceof THREE.Texture && v.dispose());
        x.dispose();
      });
    });
    this.composer?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
