/* ─────────────────────────────────────────────────────────────────────────────
   THE DITHER WAVE — engine. Framework-free; the React wrapper is wave-field.tsx.

   Three summed sines → height field 0…1 → pow(v, gamma) → ordered Bayer-8
   threshold → 4 levels: bare paper → yellow → cyan → magenta. Written into an
   ImageData at cell resolution and blown up with smoothing off, so the
   per-frame cost is a typed-array walk plus one drawImage.

   Two failure modes, both hit while building the design mockup — do not
   "fix" either:

   1. INKS is declared lightest-first. The field inks UP: paper → yellow →
      cyan → magenta as the wave rises. Declaring darkest-first — the natural
      order, since magenta has the lowest luminance — puts ~50% magenta on the
      page at the quietest setting.

   2. Coverage is a gamma, never a multiplier. v * 0.5 compresses the field
      inside one ink band, and a band held near 50% renders the Bayer matrix
      itself — a flat checkerboard with no wave in it. pow(v, g) keeps the
      field spanning every band, so the ink boundaries stay visible as
      contours and the surface still reads as moving.

   Measured coverage table and the full rationale: REDESIGN-PLAN.md §1.
   ────────────────────────────────────────────────────────────────────────── */

export const INKS = [
  [255, 196, 0], // yellow  #FFC400 — luma 0.607
  [0, 146, 184], // cyan    #0092B8 — luma 0.240
  [232, 25, 91], // magenta #E8195B — luma 0.186
] as const;

export const PAPER = [250, 250, 247] as const; // #FAFAF7

const BAYER8: number[][] = (() => {
  const build = (n: number): number[][] => {
    if (n === 1) return [[0]];
    const s = build(n / 2);
    const h = n / 2;
    const out: number[][] = [];
    for (let y = 0; y < n; y++) {
      out[y] = [];
      for (let x = 0; x < n; x++) {
        out[y][x] =
          s[y % h][x % h] * 4 + (y < h ? (x < h ? 0 : 2) : x < h ? 3 : 1);
      }
    }
    return out;
  };
  return build(8);
})();

export type WaveOptions = {
  /** CSS px per dither cell. Default 5. */
  cell?: number;
  /** Coverage gamma — 2.6 is Quiet, the default. Higher is quieter. */
  gamma?: number;
  /** Field clock multiplier. Default 0.35 (Drift). */
  speed?: number;
  /** Phase offset — gives each field its own slice of the one surface. */
  seed?: number;
};

/** Height of the summed-sine surface at one cell, after the coverage gamma. */
export function fieldValue(
  x: number,
  y: number,
  time: number,
  gamma: number,
): number {
  const sx = x * 0.033;
  const sy = y * 0.055;
  const v =
    Math.sin(sx + time) +
    Math.sin(sy * 1.35 - time * 0.72) +
    Math.sin((sx + sy) * 0.72 + time * 1.24);
  return Math.pow((v / 3 + 1) * 0.5, gamma);
}

/** Ordered threshold: the ink level one cell takes. 0 = paper, 1…3 = INKS[idx-1]. */
export function inkIndex(v: number, x: number, y: number): number {
  const N = INKS.length;
  const lvl = v * N;
  const base = Math.floor(lvl);
  const th = (BAYER8[y & 7][x & 7] + 0.5) / 64;
  return lvl - base > th ? base + 1 : base;
}

export class WaveField {
  readonly canvas: HTMLCanvasElement;
  cell: number;
  gamma: number;
  speed: number;
  seed: number;

  private ctx: CanvasRenderingContext2D;
  private buf: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private img: ImageData | null = null;
  private cols = 0;
  private rows = 0;

  constructor(canvas: HTMLCanvasElement, opts: WaveOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("wave: canvas has no 2d context");
    this.ctx = ctx;
    this.buf = document.createElement("canvas");
    const bctx = this.buf.getContext("2d");
    if (!bctx) throw new Error("wave: buffer canvas has no 2d context");
    this.bctx = bctx;
    this.cell = opts.cell ?? 5;
    this.gamma = opts.gamma ?? 2.6;
    this.speed = opts.speed ?? 0.35;
    this.seed = opts.seed ?? 0;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Force the next frame to re-measure — call after a resize. */
  invalidate() {
    this.cols = 0;
  }

  private measure() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    /* Cells are sized in CSS pixels but the backing store is in device pixels —
       otherwise the browser resamples the plate and every cell edge goes soft,
       which is the one thing a dither cannot survive. */
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cols = Math.max(4, Math.ceil(w / this.cell));
    const rows = Math.max(2, Math.ceil(h / this.cell));
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (cols === this.cols && rows === this.rows && this.canvas.width === bw)
      return;
    this.cols = cols;
    this.rows = rows;
    this.canvas.width = bw;
    this.canvas.height = bh;
    this.buf.width = cols;
    this.buf.height = rows;
    this.img = this.bctx.createImageData(cols, rows);
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Paint the field at clock time `t`. */
  frame(t: number) {
    this.measure();
    if (!this.img) return;
    const { cols, rows } = this;
    const d = this.img.data;
    const time = t * this.speed + this.seed;
    const N = INKS.length;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = fieldValue(x, y, time, this.gamma);
        const idx = inkIndex(v, x, y);
        const ink = idx >= N ? INKS[N - 1] : idx <= 0 ? PAPER : INKS[idx - 1];
        const i = (y * cols + x) * 4;
        d[i] = ink[0];
        d[i + 1] = ink[1];
        d[i + 2] = ink[2];
        d[i + 3] = 255;
      }
    }
    this.bctx.putImageData(this.img, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(
      this.buf,
      0,
      0,
      cols,
      rows,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
  }
}

/* ── the shared clock ───────────────────────────────────────────────────────
   One rAF loop at 30fps for every field on the page — a print plate does not
   need 60 — so the hero and the section ramps are slices of the same moving
   surface. Paints only what an IntersectionObserver can see, pauses on
   visibilitychange, and under prefers-reduced-motion renders one composed
   frame and stops. Behaviour changes; layout never does.
   ────────────────────────────────────────────────────────────────────────── */

const STILL_TIME = 0.6; // the composed frame reduced motion and stills share

export class WaveClock {
  private fields = new Map<HTMLCanvasElement, WaveField>();
  private visible = new Set<WaveField>();
  private io: IntersectionObserver | null = null;
  private t = STILL_TIME;
  private acc = 0;
  private prev = 0;
  private raf: number | null = null;
  private readonly reduced: boolean;

  constructor() {
    this.reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver !== "undefined") {
      this.io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            const f = this.fields.get(en.target as HTMLCanvasElement);
            if (!f) continue;
            if (en.isIntersecting) {
              this.visible.add(f);
              f.frame(this.t); // paint on entry — never a blank plate
            } else {
              this.visible.delete(f);
            }
          }
        },
        { rootMargin: "150px" },
      );
    }

    if (typeof document !== "undefined" && !this.reduced) {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.fields.size > 0) this.start();
      });
    }

    if (typeof window !== "undefined") {
      let rt: ReturnType<typeof setTimeout>;
      window.addEventListener("resize", () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
          this.fields.forEach((f) => f.invalidate());
          this.repaint();
        }, 160);
      });
    }
  }

  add(field: WaveField) {
    this.fields.set(field.canvas, field);
    if (this.reduced) {
      field.frame(STILL_TIME); // one composed frame, then nothing moves
      return;
    }
    if (this.io) this.io.observe(field.canvas);
    else this.visible.add(field);
    this.start();
  }

  remove(field: WaveField) {
    this.io?.unobserve(field.canvas);
    this.visible.delete(field);
    this.fields.delete(field.canvas);
    if (this.fields.size === 0) this.stop();
  }

  private repaint() {
    this.fields.forEach((f) => f.frame(this.reduced ? STILL_TIME : this.t));
  }

  private start() {
    if (this.raf !== null) return;
    this.prev = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  private tick = (now: number) => {
    this.raf = null;
    this.acc += now - this.prev;
    this.prev = now;
    if (this.acc < 33) {
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    this.acc = 0;
    this.t += 0.033; // fixed step: the wave does not race a fast display
    this.visible.forEach((f) => f.frame(this.t));
    if (!document.hidden) this.raf = requestAnimationFrame(this.tick);
  };
}

let clock: WaveClock | null = null;

/** The page's one clock. Client-side only — wave-field.tsx calls this. */
export function waveClock(): WaveClock {
  if (!clock) clock = new WaveClock();
  return clock;
}

/** Paint one still frame — the seeded stand-in for a project screenshot. */
export function paintStill(canvas: HTMLCanvasElement, opts: WaveOptions = {}) {
  new WaveField(canvas, opts).frame(STILL_TIME);
}
