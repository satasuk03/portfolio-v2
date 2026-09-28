/*
 * THE TOPO FIELD — the home hero's live contour map. Framework-free: one raw
 * WebGL1 context, one fullscreen triangle, one fragment shader. No three.js on
 * `/`; the noise is the same GLSL /play's map table uses (shaders.ts).
 *
 * All animation policy lives here, so the React wrapper is a bridge only:
 *   - 30fps fixed step. A contour map drifting at 60fps looks identical and
 *     costs double.
 *   - Renders only while the canvas is on screen (IntersectionObserver) and
 *     the tab is visible (visibilitychange). Off screen it costs nothing.
 *   - Reduced motion renders one composed frame and stops. The pointer still
 *     moves the reticle (a response to the visitor, not ambient motion), but
 *     only on an event, never on a loop.
 *   - The backing store is capped at 1.5× on fine pointers and 1.25× on
 *     coarse ones. Contour lines are antialiased with fwidth, so they stay
 *     crisp at a sub-device ratio, and a phone GPU pays for ~60% fewer pixels.
 *
 * The pointer raises the terrain under it, so contours bunch into a lens
 * around the reticle; a click drops a ripple that runs outward through the
 * lines. Both are uniforms, not geometry.
 */

import { noiseGLSL } from "@/components/play/engine/shaders";

const VERT = /* glsl */ `
  attribute vec2 aPos;
  void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uDpr;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform vec4 uRipples[3];
  uniform float uIntro;
  ${noiseGLSL}

  float contour(float v, float width){
    float fw = fwidth(v);
    return 1.0 - smoothstep(0.0, fw * width, abs(fract(v + 0.5) - 0.5));
  }

  void main(){
    vec2 frag = gl_FragCoord.xy;
    // Height-normalised, so the terrain keeps its scale on any aspect ratio.
    vec2 p = (frag - 0.5 * uRes) / uRes.y;
    vec2 pp = (uPointer - 0.5 * uRes) / uRes.y;
    float dp = length(p - pp);

    float rip = 0.0;
    for(int i = 0; i < 3; i++){
      float age = uTime - uRipples[i].z;
      if(age > 0.0 && age < 2.6){
        vec2 c = (uRipples[i].xy - 0.5 * uRes) / uRes.y;
        float d = length(p - c);
        float r = age * 0.55;
        rip += exp(-pow((d - r) * 18.0, 2.0)) * (1.0 - age / 2.6) * uRipples[i].w;
      }
    }

    vec2 q = p * 1.35 + vec2(uTime * 0.010, -uTime * 0.007);
    float h = fbm(q + fbm(q * 1.7 + 3.1) * 0.38);
    float lens = exp(-dp * dp * 26.0) * uPointerOn;
    h += lens * 0.06 + rip * 0.035;

    float v = h * 19.0;
    float minor = contour(v, 1.1);
    float major = contour(v / 5.0, 1.5);

    // Survey crosses on a 96-CSS-px lattice: f is the distance, in CSS px,
    // to the nearest lattice point on each axis.
    vec2 f = abs(fract(frag / (96.0 * uDpr) + 0.5) - 0.5) * 96.0;
    float cross = max(step(f.x, 0.55) * step(f.y, 5.0), step(f.y, 0.55) * step(f.x, 5.0));

    // A slow horizontal scan band, the one moving light on the plate.
    float scan = exp(-pow((p.y - (fract(uTime * 0.035) * 1.6 - 0.8)) * 9.0, 2.0));

    vec3 lineC = vec3(0.13, 0.29, 0.86);
    vec3 majorC = vec3(0.30, 0.56, 1.00);
    vec3 cyan = vec3(0.12, 0.76, 0.93);

    vec3 col = lineC * minor * 0.42 + majorC * major * 0.85;
    col *= 0.62 + scan * 0.55 + lens * 0.9;
    col += vec3(0.91, 0.89, 0.84) * cross * 0.10;
    col += cyan * rip * (minor * 1.6 + 0.12);

    // Reticle: a thin ring and a tick cross at the pointer.
    float px = 1.0 / uRes.y * uDpr;
    float ring = 1.0 - smoothstep(0.0, 1.3 * px, abs(dp - 0.052));
    vec2 dv = abs(p - pp);
    float ticks = step(dv.x, 0.7 * px) * step(0.064, dv.y) * step(dv.y, 0.09)
                + step(dv.y, 0.7 * px) * step(0.064, dv.x) * step(dv.x, 0.09);
    col += cyan * (ring * 0.85 + ticks) * uPointerOn;

    // Vignette, then keep the left third quieter — that is where the copy sits.
    vec2 uv = frag / uRes;
    float vig = smoothstep(1.2, 0.35, length((uv - vec2(0.62, 0.5)) * vec2(1.1, 1.35)));
    col *= mix(0.35, 1.0, vig);

    // Intro: the map inks outward from the right, once.
    float reveal = smoothstep(uIntro * 2.2 - 0.3, uIntro * 2.2 - 0.9, length(p - vec2(0.55, -0.1)));
    col *= reveal;

    vec3 base = vec3(0.016, 0.020, 0.028);
    gl_FragColor = vec4(base + col, 1.0);
  }
`;

export type TopoOptions = {
  reduced: boolean;
  coarse: boolean;
};

export class TopoField {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private raf = 0;
  private last = 0;
  private acc = 0;
  private t = 0;
  private visible = false;
  private dpr = 1;
  private w = 1;
  private h = 1;
  private pointer = { x: -9999, y: -9999, on: 0, target: 0 };
  private ripples = new Float32Array(12);
  private rippleIdx = 0;
  private intro = 0;
  private io: IntersectionObserver;
  private ro: ResizeObserver;
  private dead = false;

  /** Returns null when the device offers no WebGL1 or no derivatives. */
  static create(canvas: HTMLCanvasElement, opts: TopoOptions): TopoField | null {
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });
    if (!gl || !gl.getExtension("OES_standard_derivatives")) return null;
    try {
      return new TopoField(canvas, gl, opts);
    } catch (err) {
      console.warn("[topo] disabled:", err);
      return null;
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    private opts: TopoOptions,
  ) {
    this.gl = gl;
    this.prog = this.link(VERT, FRAG);
    gl.useProgram(this.prog);
    for (const name of ["uRes", "uTime", "uDpr", "uPointer", "uPointerOn", "uRipples", "uIntro"])
      this.u[name] = gl.getUniformLocation(this.prog, name);

    // One oversized triangle covers the viewport with no diagonal seam.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.intro = opts.reduced ? 1 : 0;

    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.schedule();
    });
    this.io.observe(canvas);
    this.ro = new ResizeObserver(() => {
      this.measure();
      this.draw();
    });
    this.ro.observe(canvas);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.measure();
    this.draw();
  }

  private link(vs: string, fs: string) {
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
    return p;
  }

  private onVisibility = () => this.schedule();

  private measure() {
    const r = this.canvas.getBoundingClientRect();
    const cap = this.opts.coarse ? 1.25 : 1.5;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.w = Math.max(1, Math.round(r.width * this.dpr));
    this.h = Math.max(1, Math.round(r.height * this.dpr));
    if (this.canvas.width !== this.w || this.canvas.height !== this.h) {
      this.canvas.width = this.w;
      this.canvas.height = this.h;
    }
    this.gl.viewport(0, 0, this.w, this.h);
  }

  private get animating() {
    return !this.opts.reduced && this.visible && !document.hidden && !this.dead;
  }

  private schedule() {
    if (this.animating && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (!this.animating) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    const step = 1 / 30;
    if (this.acc >= step) {
      this.t += this.acc;
      this.intro = Math.min(1, this.intro + this.acc / 2.4);
      // The reticle eases in and out rather than popping.
      this.pointer.on += (this.pointer.target - this.pointer.on) * Math.min(1, this.acc * 8);
      this.acc = 0;
      this.draw();
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw() {
    if (this.dead) return;
    const gl = this.gl;
    const u = this.u;
    gl.uniform2f(u.uRes, this.w, this.h);
    // Reduced motion freezes the drift on a composed moment, not t = 0.
    gl.uniform1f(u.uTime, this.opts.reduced ? 40 : this.t + 40);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform2f(u.uPointer, this.pointer.x * this.dpr, this.h - this.pointer.y * this.dpr);
    gl.uniform1f(u.uPointerOn, this.pointer.on);
    gl.uniform4fv(u.uRipples, this.ripples);
    gl.uniform1f(u.uIntro, this.intro);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Pointer in canvas-local CSS pixels; `null` hides the reticle. */
  setPointer(x: number | null, y = 0) {
    if (x === null) {
      this.pointer.target = 0;
    } else {
      this.pointer.x = x;
      this.pointer.y = y;
      this.pointer.target = 1;
    }
    if (this.opts.reduced) {
      this.pointer.on = this.pointer.target;
      this.draw();
    }
  }

  /** A ripple from a click, in canvas-local CSS pixels. */
  ripple(x: number, y: number, strength = 1) {
    if (this.opts.reduced) return;
    const i = this.rippleIdx++ % 3;
    this.ripples[i * 4] = x * this.dpr;
    this.ripples[i * 4 + 1] = this.h - y * this.dpr;
    this.ripples[i * 4 + 2] = this.t + 40;
    this.ripples[i * 4 + 3] = strength;
  }

  dispose() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.io.disconnect();
    this.ro.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
