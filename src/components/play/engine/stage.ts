/*
 * The stage: one WebGL scene, one Canvas 2D particle layer, one clock.
 *
 * Clock — everything, including the render, runs on gsap.ticker, so a
 * timeline and the frame that draws it can never be a tick apart.
 *
 * Feel — three shared signals drive the juice:
 *   trauma   0..1, decays linearly; shake = trauma², so small hits stay small
 *   hitstop  freezes the global timeline for a few frames on every impact
 *   flash    / aberration / glitch are post uniforms, kicked and tweened out
 *
 * Loops — idle bob, needle jitter and charge tremble are per-frame terms with
 * an amplitude. On any state change the amplitude is killed and set to ZERO
 * immediately, then tweened back up once the new state settles; a loop is
 * never left running under a tween that is trying to stop it.
 *
 * Camera — a wide orbit rig and a close-up on the reader's LCD, blended by
 * `cam.close`. Seating a card pushes in; ejecting pulls back. The close-up is
 * fitted to whatever part of the viewport the DOM panel leaves free.
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
import { finalShader, floorFrag, floorVert, shockFrag, uvVert } from "./shaders";
import { readFonts } from "./textures";
import { CART, buildCartridge, buildFloorRings, makeMaterials, setGlow, type Cartridge } from "./models";
import { BODY, HOVER_Y, INSERT_Y, SCREEN_Y, SLOT_TOP, buildReader, type Reader } from "./reader";
import { loadSurfaces } from "./surfaces";

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
  mode: "ring" | "flight" | "seated";
  bob: { amp: number };
  hover: { v: number };
  knock: { r: number; roll: number };
  enter: { y: number };
};

type Hover = number | "core" | "eject" | "charge" | "toggle" | "knob0" | "knob1" | "knob2" | null;

const TAU = Math.PI * 2;
const IDLE_ACCENT = "#1fc3ec";
const RING_TILT = 0.1;
const RING_Y = 1.6;
const WIDE_TARGET = new THREE.Vector3(0, 2.3, 0);
/**
 * The close-up frames the reader's face from the EJECT / CHG buttons up to the
 * card's shoulders in the slot — the LCD reads, and the buttons stay in reach.
 */
const CLOSE_BOTTOM = BODY.base + BODY.h / 2 - 1.3;
const CLOSE_TOP = INSERT_Y + 0.05;
const CLOSE_TARGET = new THREE.Vector3(0, (CLOSE_BOTTOM + CLOSE_TOP) / 2, 0);
const CLOSE_HALF_H = (CLOSE_TOP - CLOSE_BOTTOM) / 2 + 0.06;
const CLOSE_HALF_W = BODY.w / 2 + 0.2;

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

export class Stage {
  // three
  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  private composer!: EffectComposer;
  private bloom!: UnrealBloomPass;
  private final!: ShaderPass;
  private floorMat!: THREE.ShaderMaterial;
  private floorRings!: ReturnType<typeof buildFloorRings>;
  private reader!: Reader;
  private carts: CartState[] = [];
  private dust!: THREE.Points;
  private shock!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private coreLight!: THREE.PointLight;
  private raycaster = new THREE.Raycaster();

  // 2d
  particles!: Particles;

  // layout
  private w = 1;
  private h = 1;
  private dpr = 1;
  private ringR = 4.1;
  private cartScale = 1;
  private baseFov = 30;
  private dist = 12;
  private cam = { dist: 1, yaw: 0, pitch: 0.4, fovKick: 0, shiftX: 0, shiftY: 0, zoom: 1, close: 0, visW: 1, visH: 1 };
  private parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  private camTarget = new THREE.Vector3();
  private camRig = new THREE.Vector3(0, 5, 14);

  // state
  private time = 0;
  private simScale = 1;
  private trauma = 0;
  private ringAngle = 0;
  private ringVel = 0;
  private ringSpread = { v: 0 };
  private autoSpin = 0.07;
  private frontIndex = -1;
  private seated = -1;
  private busy = false;
  private booted = false;
  private energy = { base: 0, kick: 0 };
  private fx = { vent: 0, flash: 0, aberr: 0, glitch: 0 };
  private accent = new THREE.Color(IDLE_ACCENT);
  private accentHex = IDLE_ACCENT;
  private charge = 0;
  private charging = false;
  private chargeHeld = 0;
  private chargeViaButton = false;
  private jitter = { amp: 0 };
  private needleJitter = { amp: 1 };
  private discharges = 0;
  private ripples: THREE.Vector4[] = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -99, 0));
  private rippleIdx = 0;
  private orbitClock = 0;
  private suckClock = 0;
  private linkClock = 0;
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
    // The reader's surface scans load while the fonts settle.
    const surfaces = loadSurfaces();
    await document.fonts.ready;
    const fonts = readFonts();
    // Canvas text only uses a face once it is loaded; ask for the exact weights.
    await Promise.all(
      [`900 64px ${fonts.display}`, `700 20px ${fonts.mono}`, `500 20px ${fonts.mono}`, `800 20px ${fonts.display}`].map((f) => document.fonts.load(f).catch(() => null)),
    );

    const r = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false });
    this.renderer = r;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.low ? 1.5 : 1.75);
    r.setPixelRatio(this.dpr);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setClearColor("#040507");
    r.domElement.className = "play-gl";
    this.container.prepend(r.domElement);

    const aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;
    this.scene.background = new THREE.Color("#040507");
    this.scene.fog = new THREE.FogExp2("#040507", 0.026);
    pmrem.dispose();

    this.buildLights();
    this.buildFloor();
    const mats = makeMaterials();
    this.reader = buildReader(fonts, aniso, mats, !this.low, this.modules.length, await surfaces);
    this.scene.add(this.reader.root);
    this.carts = this.modules.map((m) => {
      const c = buildCartridge(m, fonts, aniso, mats);
      this.scene.add(c.root);
      return { c, mode: "ring", bob: { amp: 0 }, hover: { v: 0 }, knock: { r: 0, roll: 0 }, enter: { y: 0 } } as CartState;
    });
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
    this.final.uniforms.uScan.value = this.low ? 0.1 : 0.18;
    this.composer.addPass(this.final);

    this.particles = new Particles(this.particleCanvas, this.low ? 700 : 1800);
    this.particles.density = (this.low ? 0.6 : 1) * (this.opts.reduced ? 0.5 : 1);

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.container);
    this.bindInput();

    this.prepareAssembly();
    // Standby: the map is live but dim, the reader is not yet built.
    this.floorMat.uniforms.uReveal.value = 7;
    this.floorMat.uniforms.uPower.value = 0.55;
    this.cam.dist = 1.7;
    this.cam.pitch = 0.62;
    this.cam.yaw = 0.5;

    gsap.ticker.lagSmoothing(250, 33);
    gsap.ticker.add(this.tick);
    // Compile every material now so the first boot frame does not hitch.
    r.compile(this.scene, this.camera);
  }

  private buildLights() {
    const key = new THREE.DirectionalLight("#fff1dc", 2.4);
    key.position.set(4, 9, 6);
    const fill = new THREE.HemisphereLight("#9ab8ff", "#0a0a10", 0.4);
    const rimC = new THREE.PointLight("#1fc3ec", 40, 18, 2);
    rimC.position.set(-5, 3.5, -3);
    const rimM = new THREE.PointLight("#e8195b", 34, 18, 2);
    rimM.position.set(5, 2.5, -3.5);
    const front = new THREE.PointLight("#ffd9b8", 5, 12, 2);
    front.position.set(-1.5, 4.5, 6);
    // Spills the accent colour from the reader's face onto the floor and cards.
    // Kept well back from the face: at 1 m, inverse-square falloff whites out the LCD
    // and the seated card in the close-up.
    this.coreLight = new THREE.PointLight(IDLE_ACCENT, 0, 12, 2);
    this.coreLight.position.set(0, SCREEN_Y - 0.6, 3.6);
    this.scene.add(key, fill, rimC, rimM, front, this.coreLight);
  }

  private buildFloor() {
    this.floorMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uPower: { value: 1 },
        uLine: { value: new THREE.Color("#2a64ff").multiplyScalar(0.9) },
        uMajor: { value: new THREE.Color("#5aa0ff") },
        uAccent: { value: new THREE.Color(IDLE_ACCENT) },
        uRipples: { value: this.ripples },
      },
      vertexShader: floorVert,
      fragmentShader: floorFrag,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    this.floorRings = buildFloorRings();
    this.scene.add(this.floorRings.group);
  }

  private buildDust() {
    const n = this.low ? 180 : 420;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = Math.random() * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(
      g,
      new THREE.PointsMaterial({ color: new THREE.Color("#8fd8ff").multiplyScalar(0.9), size: 0.03, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
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
    this.shock.rotation.x = -Math.PI / 2;
    this.shock.position.y = 0.03;
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

    const aspect = w / h;
    const portrait = aspect < 0.9;
    this.ringR = portrait ? 2.75 : aspect < 1.3 ? 3.5 : 4.1;
    this.cartScale = portrait ? 0.78 : 1;
    this.baseFov = portrait ? 44 : aspect < 1.3 ? 36 : 30;
    const t = Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2));
    // Portrait lets the side cartridges crop at the screen edge — the ring turns,
    // so nothing is lost for long, and the reader gets the size it needs.
    const halfW = portrait ? this.ringR * 0.78 + 0.3 : this.ringR * 1.02 + 0.75 * this.cartScale;
    const halfH = portrait ? 3.3 : 3.4;
    this.dist = Math.max(halfH / t, halfW / (t * aspect));
    this.camera.aspect = aspect;
  }

  /**
   * Slide the projection so the reader centres in the space a panel leaves.
   * `visW` / `visH` are the fractions of the viewport left visible — the
   * close-up is fitted to that region, not to the whole screen.
   */
  setFocus(shiftX: number, shiftY: number, zoom: number, visW = 1, visH = 1) {
    gsap.to(this.cam, { shiftX, shiftY, zoom, visW, visH, duration: 1.1, ease: "expo.inOut", overwrite: "auto" });
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
  private coreScreen = (): Vec => this.project(this.tmp.set(0, BODY.base + BODY.h * 0.5, 0.3));
  private slotScreen = (): Vec => this.project(this.tmp.set(0, SLOT_TOP, 0));
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

  /** The ring slot for cartridge i, in world space, at the current ring angle. */
  private ringPos(i: number, out: THREE.Vector3, knock = 0) {
    const a = this.ringAngle + (i / this.carts.length) * TAU;
    const R = this.ringR + knock + this.ringSpread.v * 3.2;
    const x = Math.sin(a) * R;
    const z = Math.cos(a) * R;
    // Tilt the ring plane about X: the front dips, the back rises.
    out.set(x, RING_Y - z * Math.sin(RING_TILT) - this.ringSpread.v * 0.6, z * Math.cos(RING_TILT));
    return a;
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
    if (this.ptr.dragging) this.ringVel += (dx / this.w) * (this.ptr.fine ? 9 : 14);
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
    this.carts.forEach((cs) => cs.mode === "ring" && targets.push(cs.c.hit));
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
    this.renderer.domElement.style.cursor = h !== null ? "pointer" : "";
    this.events.onHover(typeof h === "number" ? h : null);
  }

  /** Keyboard / UI spin, in radians of impulse. */
  nudge(v: number) {
    this.ringVel += v;
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

  private ripple(strength: number) {
    const r = this.ripples[this.rippleIdx++ % 4];
    r.set(0, 0, this.time, strength);
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
        this.floorMat.uniforms.uAccent.value.copy(this.accent);
        for (const hm of this.reader.haloMats) hm.uniforms.uColor.value.copy(this.accent);
        this.coreLight.color.copy(this.accent);
      },
    });
  }

  /** Push the camera in on the LCD (1) or pull back to the ring (0). */
  private closeUp(on: boolean, delay = 0) {
    gsap.to(this.cam, { close: on ? 1 : 0, duration: on ? 1.5 : 1.1, delay, ease: "expo.inOut", overwrite: false });
    gsap.to(this.ringSpread, { v: on ? 1 : 0, duration: on ? 1.3 : 1.1, delay: on ? delay : 0, ease: on ? "power3.inOut" : "back.out(1.4)", overwrite: true });
    if (on) window.setTimeout(() => this.sfx.servo(0.9, true), delay * 1000);
  }

  // ── boot: the reader assembles itself ─────────────────────────────────────

  private rest = new Map<THREE.Object3D, { p: THREE.Vector3; r: THREE.Euler; s: THREE.Vector3 }>();

  private prepareAssembly() {
    for (const a of this.reader.assembly) {
      const o = a.obj;
      this.rest.set(o, { p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() });
      o.visible = false;
    }
    for (const cs of this.carts) cs.c.root.visible = false;
  }

  boot(onHud: () => void): Promise<void> {
    return new Promise((resolve) => {
      const reduced = this.opts.reduced;
      const rd = this.reader;
      this.sfx.bootUp();
      this.sfx.ambientOn(1, 4);
      const tl = gsap.timeline({ onComplete: () => resolve() });
      this.flash("#bff6ff", 0.5, 0.6);
      this.kick("glitch", 1, 0.8);
      this.kick("aberr", 1.2, 1);

      // Camera settles from the high survey angle.
      tl.to(this.cam, { dist: 1, pitch: 0.4, yaw: 0, duration: 3.4, ease: "power3.inOut" }, 0);
      tl.to(this.floorMat.uniforms.uReveal, { value: 48, duration: 3.2, ease: "power2.in" }, 0.1);
      tl.to(this.floorMat.uniforms.uPower, { value: 1, duration: 1.2, ease: "power2.out" }, 0.1);
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

      // The dock lands.
      tl.call(() => {
        this.sfx.clunk();
        this.addTrauma(0.2);
        this.ripple(0.4);
      }, [], T(0) + 0.2);
      // The chassis drops into its cradle.
      tl.call(() => {
        this.sfx.impact(0.55);
        this.addTrauma(0.35);
        this.ripple(0.7);
        const c = this.coreScreen();
        this.particles.sparks(c.x, this.project(this.tmp.set(0, BODY.base, 0)).y, { count: 30, colors: ["#ffffff", "#ffd27a"], speed: 800, spread: 2.4, angle: -Math.PI / 2 });
      }, [], T(2) + 0.18);
      tl.fromTo(rd.body.scale, { x: 1.06, y: 0.9, z: 1.06 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1.2, 0.3)", immediateRender: false }, T(2) + 0.18);
      tl.call(() => this.sfx.servo(0.5, true), [], T(3));

      // The slot housing is order 6: its landing is the big one.
      const humpLand = T(6) + 0.2;
      tl.call(() => {
        this.hitstop(60);
        this.sfx.impact(0.8);
        this.addTrauma(0.5);
        this.flash("#ffffff", 0.25, 0.3);
        this.ripple(1);
        this.shockwave(IDLE_ACCENT, 16, 1.3);
        const s = this.slotScreen();
        this.particles.sparks(s.x, s.y, { count: 50, colors: ["#ffffff", "#bff6ff", IDLE_ACCENT], speed: 1000 });
        this.particles.ring(s.x, this.project(this.tmp.set(0, 0, 0)).y, { radius: this.screenRadius(4, 0), tilt: 0.3, color: IDLE_ACCENT, life: 0.8 });
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
      tl.to(this.coreLight, { intensity: 3, duration: 0.8 }, ign + 0.3);
      tl.call(() => {
        this.sfx.glitch(5);
        setGlow(rd.leds.pwr, "#7dff6a", 3.5);
        this.setAccent(IDLE_ACCENT, 0.01);
        this.particles.orbit(this.coreScreen, { count: 40, radius: [this.screenRadius(1.9), this.screenRadius(2.6)], colors: [IDLE_ACCENT, "#ffffff"] });
        // Needle self-test: full sweep and back, like a car dash.
        rd.gauge.v.target = 8;
        window.setTimeout(() => (rd.gauge.v.target = 0), 380);
      }, [], ign + 0.3);

      // Cartridges drop in one by one and land with a squash.
      const cartsAt = ign + 0.55;
      this.carts.forEach((cs, i) => {
        const t = cartsAt + i * 0.11;
        tl.call(() => {
          cs.c.root.visible = true;
        }, [], t);
        tl.fromTo(cs.enter, { y: 5 }, { y: 0, duration: 0.42, ease: "power3.in", immediateRender: false }, t);
        tl.call(() => {
          this.sfx.tick();
          this.sfx.clunk();
          this.addTrauma(0.06);
          const p = this.cartScreen(cs);
          this.particles.sparks(p.x, p.y + 30 * this.cartScale, { count: 12, colors: [cs.c.module.color, "#ffffff"], speed: 500, spread: 1.4, angle: -Math.PI / 2 });
        }, [], t + 0.42);
        tl.fromTo(cs.c.squash.scale, { x: 1.35, y: 0.62, z: 1.35 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1.2, 0.35)", immediateRender: false }, t + 0.42);
        tl.to(cs.bob, { amp: 1, duration: 1.2, ease: "sine.inOut" }, t + 0.7);
      });
      tl.to(this, { ringVel: reduced ? 0.4 : 1.6, duration: 0.01 }, cartsAt);
      tl.call(() => {
        this.booted = true;
        this.sfx.engage(0);
      }, [], cartsAt + this.carts.length * 0.11 + 0.5);
    });
  }

  // ── load: launch, flip, slam ──────────────────────────────────────────────

  load(i: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.busy || this.seated >= 0) return resolve();
      this.busy = true;
      const cs = this.carts[i];
      const m = cs.c.module;
      const { root, spin, squash } = cs.c;
      this.setHover(null);

      // Reset the loops on this cartridge to zero, now — not a frame later.
      gsap.killTweensOf([cs.bob, cs.hover, cs.knock]);
      cs.bob.amp = 0;
      cs.hover.v = 0;
      cs.knock.r = 0;
      cs.knock.roll = 0;
      spin.rotation.set(0, 0, 0);
      squash.rotation.set(0, 0, 0);
      cs.mode = "flight";

      const start = root.position.clone();
      const yaw0 = root.rotation.y;
      const yaw1 = Math.round(yaw0 / TAU) * TAU;
      const out = new THREE.Vector3(start.x, 0, start.z).normalize();
      const pulled = start.clone().addScaledVector(out, 0.45).setY(start.y - 0.12);
      const end = new THREE.Vector3(0, HOVER_Y, 0);
      const c1 = pulled.clone().addScaledVector(out, 0.6).setY(start.y + 1.9);
      const c2 = new THREE.Vector3(0, HOVER_Y + 0.8, 0).lerp(pulled, 0.3);

      const tl = gsap.timeline();
      // 1 · anticipation: the latch lets go, the cartridge sinks back and squashes.
      tl.call(() => this.sfx.latch(), [], 0);
      tl.to(root.position, { x: pulled.x, y: pulled.y, z: pulled.z, duration: 0.2, ease: "power2.out" }, 0);
      tl.to(squash.scale, { x: 1.18, y: 0.8, z: 1.18, duration: 0.2, ease: "power2.out" }, 0);
      tl.to(spin.rotation, { x: 0.35, duration: 0.2, ease: "power2.out" }, 0);
      tl.call(() => {
        this.reader.gauge.v.target = 0.5;
      }, [], 0);

      // 2 · launch on a curve, stretched, with a full WebGL flip.
      const L = 0.2;
      const p = { t: 0 };
      tl.call(() => {
        this.sfx.whoosh(0.7, true);
        const s = this.cartScreen(cs);
        this.particles.sparks(s.x, s.y, { count: 18, colors: ["#ffffff", m.color], speed: 600, spread: 1.2, angle: Math.PI / 2 });
      }, [], L);
      tl.to(p, {
        t: 1,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: () => {
          bez(pulled, c1, c2, end, p.t, root.position);
          root.rotation.y = yaw0 + (yaw1 - yaw0) * ease.p3io(p.t);
        },
      }, L);
      tl.to(root.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "power2.inOut" }, L);
      tl.fromTo(spin.rotation, { x: 0.35 }, { x: -TAU, duration: 0.8, ease: "power2.inOut", immediateRender: false }, L);
      tl.to(squash.scale, { x: 0.84, y: 1.3, z: 0.84, duration: 0.18, ease: "power3.out" }, L);
      tl.to(squash.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: "elastic.out(1, 0.5)" }, L + 0.3);
      tl.to(this.reader.haloGroup.scale, { x: 1.35, z: 1.35, duration: 0.5, ease: "back.out(3)" }, L + 0.3);
      tl.call(() => setGlow(cs.c.ledMat, m.color, 1.2), [], L + 0.5);

      // 3 · the hang: a tiny rise at the apex — the breath before the slam.
      const A = L + 0.8;
      tl.call(() => spin.rotation.set(0, 0, 0), [], A);
      tl.to(root.position, { y: HOVER_Y + 0.14, duration: 0.12, ease: "power1.out" }, A);
      tl.to(squash.scale, { x: 1.08, y: 0.92, z: 1.08, duration: 0.12, ease: "power1.out" }, A);

      // 4 · the drop.
      const D = A + 0.12;
      tl.to(root.position, { y: INSERT_Y, duration: 0.15, ease: "power4.in" }, D);
      tl.to(squash.scale, { x: 0.86, y: 1.22, z: 0.86, duration: 0.15, ease: "power4.in" }, D);
      tl.to(this.reader.haloGroup.scale, { x: 0.2, z: 0.2, duration: 0.15, ease: "power4.in" }, D);

      // 5 · IMPACT.
      const I = D + 0.15;
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
    this.addTrauma(0.62);
    this.flash(m.color, 0.22, 0.35);
    this.kick("aberr", 1.3, 0.6);
    this.kick("glitch", 0.35, 0.35);
    this.kick("vent", 0.09, 1.1, "elastic.out(1, 0.28)");
    gsap.fromTo(this.cam, { fovKick: -2.8 }, { fovKick: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: false });
    gsap.fromTo(cs.c.squash.scale, { x: 1.32, y: 0.64, z: 1.32 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1.3, 0.32)", overwrite: true });
    gsap.fromTo(rd.body.scale, { x: 1.06, y: 0.86, z: 1.06 }, { x: 1, y: 1, z: 1, duration: 0.95, ease: "elastic.out(1.2, 0.3)", overwrite: true });
    gsap.fromTo(this.energy, { kick: 5 }, { kick: 0, duration: 1.4, ease: "expo.out", overwrite: "auto" });
    gsap.fromTo(this.coreLight, { intensity: 9 }, { intensity: 3.5, duration: 1.2, ease: "expo.out" });
    gsap.to(rd.haloGroup.scale, { x: 1, z: 1, duration: 0.9, ease: "elastic.out(1, 0.4)", delay: 0.2 });
    setGlow(cs.c.ledMat, m.color, 5);
    this.setAccent(m.color, 0.25);
    this.ripple(1.1);
    this.shockwave(m.color, 10, 1);

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
    this.closeUp(true, 0.35);

    const s = this.slotScreen();
    const cols = ["#ffffff", m.color, "#ffd27a"];
    const k = this.cartScale;
    this.particles.sparks(s.x - 40 * k, s.y, { count: 34, colors: cols, speed: 1200, spread: 0.9, angle: Math.PI + 0.35 });
    this.particles.sparks(s.x + 40 * k, s.y, { count: 34, colors: cols, speed: 1200, spread: 0.9, angle: -0.35 });
    this.particles.sparks(s.x, s.y, { count: 20, colors: ["#ffffff"], speed: 700, spread: 1, angle: -Math.PI / 2, gravity: 900 });
    this.particles.debris(s.x, s.y, { count: 10, colors: ["#e9e4d6", m.color, "#6b727c"] });
    this.particles.embers(s.x, s.y, { count: 18, colors: [m.color, "#ffffff"], radius: 70 * k });
    this.particles.ring(s.x, s.y + 8, { radius: this.screenRadius(1.2, SLOT_TOP), tilt: 0.3, color: m.color, life: 0.55, width: 5 });
    const c = this.coreScreen();
    this.particles.ring(c.x, this.project(this.tmp.set(0, 0, 0)).y, { radius: this.screenRadius(6, 0), tilt: 0.3, color: m.color, life: 0.9, width: 3 });
  }

  // ── eject: pop, hiss, fly home ────────────────────────────────────────────

  eject(): Promise<void> {
    return new Promise((resolve) => {
      if (this.busy || this.seated < 0) return resolve();
      this.busy = true;
      const i = this.seated;
      const cs = this.carts[i];
      const rd = this.reader;
      const { root, spin, squash } = cs.c;
      cs.mode = "flight";
      rd.screen.set("eject");
      rd.gauge.v.target = 0;
      rd.drawSeg("-- -- --");
      setGlow(rd.eject.ringLight, "#ff3b2f", 0);
      this.closeUp(false);

      const tl = gsap.timeline({
        onComplete: () => {
          cs.mode = "ring";
          gsap.to(cs.bob, { amp: 1, duration: 1.2, ease: "sine.inOut" });
        },
      });
      // Anticipation: the reader crouches before it spits the card out.
      tl.call(() => {
        this.sfx.servo(0.3, false);
        this.sfx.hiss(0.7);
      }, [], 0);
      tl.to(rd.body.scale, { x: 1.03, y: 0.94, z: 1.03, duration: 0.13, ease: "power2.in" }, 0);
      tl.to(squash.scale, { x: 1.1, y: 0.88, z: 1.1, duration: 0.13, ease: "power2.in" }, 0);

      // Pop.
      tl.to(rd.body.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "elastic.out(1.2, 0.35)" }, 0.13);
      tl.to(root.position, { y: HOVER_Y + 0.2, duration: 0.42, ease: "back.out(2.2)" }, 0.13);
      tl.fromTo(squash.scale, { x: 0.82, y: 1.3, z: 0.82 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", immediateRender: false }, 0.13);
      tl.call(() => {
        this.addTrauma(0.2);
        this.kick("vent", 0.05, 0.8, "elastic.out(1, 0.3)");
        setGlow(cs.c.ledMat, cs.c.module.color, 0.35);
        this.setAccent(IDLE_ACCENT, 0.5);
        gsap.to(this.coreLight, { intensity: 3, duration: 0.6 });
        const s = this.slotScreen();
        this.particles.sparks(s.x, s.y, { count: 26, colors: ["#e9f6ff", "#9aa3ad", "#ffffff"], speed: 520, spread: 1.1, angle: -Math.PI / 2, gravity: -250, life: 1.2 });
        this.particles.embers(s.x, s.y - 20, { count: 14, colors: ["#cfd8e0", "#ffffff"], radius: 50 });
      }, [], 0.13);

      // Home: a live bezier to wherever its ring slot has turned to.
      const R = 0.5;
      const p = { t: 0 };
      const from = new THREE.Vector3();
      const target = new THREE.Vector3();
      const c1 = new THREE.Vector3();
      const c2 = new THREE.Vector3();
      tl.call(() => {
        from.copy(root.position);
        this.sfx.whoosh(0.6, false);
        // The bay is free the moment the card clears it: the next one can
        // launch while this one is still flying home.
        this.seated = -1;
        this.busy = false;
        window.setTimeout(() => {
          if (this.seated < 0 && rd.screen.mode === "eject") rd.screen.set("idle", null);
        }, 700);
        resolve();
      }, [], R);
      tl.to(p, {
        t: 1,
        duration: 0.85,
        ease: "power3.inOut",
        onStart: () => {
          root.rotation.y = 0;
        },
        onUpdate: () => {
          const ra = this.ringPos(i, target);
          const a = Math.atan2(this.camRig.x - target.x, this.camRig.z - target.z) + Math.sin(ra) * 0.18;
          c1.copy(from).setY(from.y + 1.4);
          c2.copy(target).multiplyScalar(1.2).setY(target.y + 1.2);
          bez(from, c1, c2, target, p.t, root.position);
          const e = ease.p2io(p.t);
          root.rotation.y = a * e;
          root.scale.setScalar(1 + (this.cartScale - 1) * e);
        },
      }, R);
      tl.fromTo(spin.rotation, { x: 0 }, { x: TAU, duration: 0.85, ease: "power2.inOut", immediateRender: false }, R);
      tl.call(() => {
        spin.rotation.set(0, 0, 0);
        this.sfx.clunk();
        this.addTrauma(0.05);
        const s = this.cartScreen(cs);
        this.particles.sparks(s.x, s.y, { count: 10, colors: [cs.c.module.color, "#ffffff"], speed: 400 });
      }, [], R + 0.85);
      tl.fromTo(squash.scale, { x: 1.25, y: 0.75, z: 1.25 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "elastic.out(1.2, 0.35)", immediateRender: false }, R + 0.85);
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
    this.ripple(0.35);
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
    gsap.fromTo(this.coreLight, { intensity: 16 * k }, { intensity: this.seated >= 0 ? 3.5 : 3, duration: 1.5, ease: "expo.out" });
    rd.screen.glitch = 1;
    gsap.to(rd.screen, { glitch: 0, duration: 1.1, ease: "power2.in" });
    rd.knobs.forEach((kn, n) => (kn.v.vel += (n % 2 ? -1 : 1) * 30 * k));
    rd.gauge.v.vel -= 80 * k;
    rd.meter.v.vel += 120 * k;

    // Blow the ring out; it springs back on its own tension.
    this.carts.forEach((cs, i) => {
      if (cs.mode !== "ring") return;
      gsap.killTweensOf(cs.knock);
      gsap.fromTo(cs.knock, { r: 1.8 * k, roll: (i % 2 ? 1 : -1) * 0.7 * k }, { r: 0, roll: 0, duration: 1.9, ease: "elastic.out(1, 0.3)" });
    });
    this.ringVel += (Math.random() < 0.5 ? -1 : 1) * 3 * k;
    this.ripple(1.6 * k);
    this.shockwave("#ffffff", 26, 1.5);

    const c = this.coreScreen();
    const R = Math.min(this.w, this.h);
    this.particles.scatter(c.x, c.y, 1500 * k);
    this.particles.sparks(c.x, c.y, { count: Math.round(160 * k), colors: ["#ffffff", this.accentHex, "#ffd27a", "#e8195b"], speed: 1700 * k });
    this.particles.debris(c.x, c.y, { count: 18, colors: ["#e9e4d6", "#6b727c", "#b85a22"], speed: 1000 });
    this.particles.ring(c.x, c.y, { radius: R * 0.55, color: "#ffffff", life: 0.6, width: 10 });
    this.particles.ring(c.x, c.y, { radius: R * 0.95, color: this.accentHex, life: 0.9, width: 4 });
    this.particles.ring(c.x, this.project(this.tmp.set(0, 0, 0)).y, { radius: this.screenRadius(9, 0), tilt: 0.3, color: this.accentHex, life: 1.1, width: 3 });
    this.particles.embers(c.x, c.y, { count: 30, colors: ["#ffc400", "#ffffff", this.accentHex], radius: 160 });
    this.events.onDischarge(this.discharges);
  }

  // ── panel link: packets stream from the bay to a DOM target ──────────────

  setLink(to: (() => Vec) | null, color = "#ffffff") {
    this.link = to ? { to, color } : null;
    if (to) this.particles.stream(this.slotScreen(), to, { count: 46, colors: [color, "#ffffff"], spread: 220, duration: 0.95, delay: 0.3 });
  }

  // ── the frame ─────────────────────────────────────────────────────────────

  private frame(rawDt: number) {
    if (this.disposed) return;
    const realDt = Math.min(rawDt, 0.05);
    const dt = realDt * this.simScale;
    this.time += dt;
    const t = this.time;
    const rd = this.reader;

    // Ring spin: drag impulse + inertia + a slow drift.
    this.ringVel *= Math.exp(-2.2 * realDt);
    this.ringAngle += (this.ringVel + this.autoSpin * (this.opts.reduced ? 0.3 : 1)) * dt;

    // Charge.
    if (this.charging) {
      this.charge = Math.min(1, this.charge + dt / 1.6);
      if (this.charge >= 1) this.chargeHeld += dt;
      this.sfx.chargeSet(this.charge);
      this.events.onCharge(this.charge);
      rd.screen.charge = this.charge;
      rd.gauge.v.target = this.charge * 8.3;
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
    // The LCD: fixed-rate redraw.
    if (rd.screen.mode !== "off" || rd.screen.power > 0) rd.screen.update(dt, this.low ? 20 : 30);

    rd.haloGroup.rotation.y += dt * 0.6;
    rd.haloGroup.position.y = HOVER_Y - 0.2 + Math.sin(t * 1.4) * 0.05;
    const haloOn = this.seated < 0 && !this.busy ? 1 : 0.1;
    for (const hm of rd.haloMats) hm.uniforms.uOpacity.value += (haloOn * (hm === rd.haloMats[0] ? 1.4 : 0.8) - hm.uniforms.uOpacity.value) * Math.min(1, realDt * 6);
    for (const hm of rd.haloMats) hm.uniforms.uTime.value = t;
    for (const fm of this.floorRings.mats) fm.uniforms.uTime.value = t;
    this.floorRings.group.rotation.y = t * 0.02;
    this.floorMat.uniforms.uTime.value = t;
    this.dust.rotation.y = t * 0.01;
    this.dust.position.y = Math.sin(t * 0.2) * 0.2;

    // Cartridges on the ring.
    let front = -1;
    let frontZ = -Infinity;
    for (let i = 0; i < this.carts.length; i++) {
      const cs = this.carts[i];
      const { root, spin, squash } = cs.c;
      if (cs.mode !== "ring") continue;
      const a = this.ringPos(i, root.position, cs.knock.r);
      const bob = cs.bob.amp;
      root.position.y += Math.sin(t * 1.3 + i * 1.7) * 0.07 * bob + cs.hover.v * 0.32 + cs.enter.y;
      // Face the lens (labels always read), with a little of the ring's own yaw.
      const face = Math.atan2(this.camRig.x - root.position.x, this.camRig.z - root.position.z);
      root.rotation.set(-0.06, face + Math.sin(a) * 0.18, 0, "YXZ");
      root.scale.setScalar(this.cartScale * (1 + cs.hover.v * 0.1));
      spin.rotation.x = -cs.hover.v * 0.16;
      squash.rotation.z = Math.sin(t * 0.9 + i) * 0.035 * bob + cs.knock.roll;
      if (root.position.z > frontZ) {
        frontZ = root.position.z;
        front = i;
      }
    }
    if (front !== this.frontIndex) {
      if (this.frontIndex !== -1 && this.booted && this.cam.close < 0.5) this.sfx.tick();
      this.frontIndex = front;
    }

    // Camera: wide orbit ⟷ close-up, + parallax + shake + punch.
    const par = this.parallax;
    const pk = this.ptr.fine ? 1 - this.cam.close * 0.6 : 0;
    par.x += (par.tx * pk - par.x) * Math.min(1, realDt * 2.5);
    par.y += (par.ty * pk - par.y) * Math.min(1, realDt * 2.5);
    const cl = this.cam.close;
    const ce = cl * cl * (3 - 2 * cl);
    this.camTarget.lerpVectors(WIDE_TARGET, CLOSE_TARGET, ce);
    const yaw = (this.cam.yaw + Math.sin(t * 0.11) * 0.05) * (1 - ce * 0.7) + par.x * 0.1;
    const pitch = this.cam.pitch + (0.1 - this.cam.pitch) * ce + Math.sin(t * 0.17) * 0.015 - par.y * 0.04;
    const wideD = this.dist * this.cam.dist * this.cam.zoom;
    const d = wideD + (this.closeDist() - wideD) * ce;
    const cam = this.camera;
    const T = this.camTarget;
    cam.position.set(T.x + Math.sin(yaw) * Math.cos(pitch) * d, T.y + Math.sin(pitch) * d, T.z + Math.cos(yaw) * Math.cos(pitch) * d);
    cam.lookAt(T);
    this.camRig.copy(cam.position);
    this.trauma = Math.max(0, this.trauma - realDt * 1.35);
    const shake = this.trauma * this.trauma * this.shakeScale;
    const sx = wob(t, 1.3) * shake;
    const sy = wob(t, 7.9) * shake;
    const sr = wob(t, 4.2) * shake;
    // Shake scales with distance, so the close-up doesn't become an earthquake.
    const sk = 0.32 * (d / (this.dist || 1));
    cam.translateX(sx * sk);
    cam.translateY(sy * sk);
    cam.rotateZ(sr * 0.045);
    cam.fov = this.baseFov + this.cam.fovKick;
    cam.clearViewOffset();
    if (this.cam.shiftX || this.cam.shiftY) cam.setViewOffset(this.w, this.h, this.cam.shiftX, this.cam.shiftY, this.w, this.h);
    cam.updateProjectionMatrix();
    this.scene.updateMatrixWorld();

    // Hover picking once per frame (fine pointers only; touch picks on down).
    if (this.booted && this.ptr.fine && !this.ptr.down) this.pick();

    // Idle orbit field around the reader — thinned out in the close-up.
    if (this.booted) {
      this.orbitClock += dt;
      if (cl < 0.5 && this.orbitClock > (this.low ? 0.22 : 0.12)) {
        this.orbitClock = 0;
        const r0 = this.screenRadius(1.95);
        this.particles.orbit(this.coreScreen, { count: 1, radius: [r0, r0 * 1.4], colors: [this.accentHex, "#ffffff"], tilt: 0.3 });
      }
      if (this.link) {
        this.linkClock += dt;
        if (this.linkClock > 0.3) {
          this.linkClock = 0;
          this.particles.stream(this.slotScreen(), this.link.to, { count: 2, colors: [this.link.color, "#ffffff"], spread: 160, duration: 1.1, delay: 0.1 });
        }
      }
    }

    // Post.
    const f = this.final.uniforms;
    f.uTime.value = t;
    f.uFlash.value = this.fx.flash;
    f.uAberr.value = this.fx.aberr + shake * 1.2 + this.charge * 0.5;
    f.uGlitch.value = this.opts.reduced ? 0 : Math.min(1, this.fx.glitch + (this.charge > 0.75 ? (this.charge - 0.75) * 1.6 : 0));
    // Bloom is for LEDs and sparks; the close-up reads text, so it backs off there.
    this.bloom.strength = (0.4 + this.charge * 0.35 + this.fx.flash * 0.3) * (1 - ce * 0.55);

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
