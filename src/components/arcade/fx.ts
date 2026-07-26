/*
 * Arena FX — particles, lightning, beams, rings and slashes on a 2D canvas
 * sitting over the fighters.
 *
 * The rAF loop is started on the first effect and stops itself once the last
 * one dies, so an idle arena costs nothing — this page is otherwise a static
 * document and should not hold a frame loop open waiting for a click.
 *
 * Everything is composited "source-over" as solid inks on paper. (The dark
 * room composited additively — a CRT emits light, so overlapping effects got
 * brighter. On paper that math washes every overlap to white; ink does not
 * add, it covers. Where the neon effects had a white-hot core, the print
 * effect has an ink core.) Motion and decay are scaled by elapsed time, not
 * frames — a 120Hz display would otherwise burn every effect twice as fast.
 * `flash` fills the whole arena and is the one effect gated on
 * prefers-reduced-motion; the bolt's crackle is re-randomized per frame
 * unless motion is reduced.
 */

type Point = { x: number; y: number };

/* The print core of every effect — where the neon build used white-hot
   centers, the paper build uses ink. Matches --color-ink. */
const INK = "#111111";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  /** Life lost per 60fps-frame, scaled by real elapsed time. */
  decay: number;
  radius: number;
  gravity: number;
  color: string;
};

type Shape =
  | { kind: "bolt"; from: Point; to: Point; pts: Point[]; life: number; decay: number; color: string }
  | { kind: "beam"; from: Point; to: Point; life: number; decay: number; color: string }
  | { kind: "ring"; at: Point; life: number; decay: number; color: string }
  | { kind: "arc"; at: Point; spin: number; life: number; decay: number; color: string }
  | { kind: "flash"; life: number; decay: number; color: string; alpha: number }
  | { kind: "head"; from: Point; to: Point; t: number; step: number; color: string };

export type FxHandle = {
  /** Radial hit sparks. */
  burst: (x: number, y: number, color: string, count: number) => void;
  /** Sparks that float upward — repairs, not impacts. */
  rise: (x: number, y: number, color: string, count: number) => void;
  /** A crackling lightning strike between two points. */
  bolt: (x1: number, y1: number, x2: number, y2: number, color: string) => void;
  /** A full-length beam that lands with a ring and a burst at the far end. */
  beam: (x1: number, y1: number, x2: number, y2: number, color: string) => void;
  /** A sweeping crescent — the melee slash. */
  slash: (x: number, y: number, color: string) => void;
  /** An expanding shockwave. */
  ring: (x: number, y: number, color: string) => void;
  /** A projectile head that sheds a spark trail as it travels. */
  shot: (x1: number, y1: number, x2: number, y2: number, color: string) => void;
  /** A full-arena tint, gone in a blink. */
  flash: (color: string, alpha?: number) => void;
  resize: () => void;
  dispose: () => void;
};

export function createFx(canvas: HTMLCanvasElement): FxHandle {
  const ctx = canvas.getContext("2d");
  const particles: Particle[] = [];
  const shapes: Shape[] = [];
  let raf = 0;
  let disposed = false;
  let dpr = 1;
  let lastFrame = 0;

  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** A jagged path between two points — regenerated per frame for the crackle. */
  function boltPath(from: Point, to: Point): Point[] {
    const segs = 7;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const pts: Point[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const off = i === 0 || i === segs ? 0 : (Math.random() - 0.5) * len * 0.18;
      pts.push({ x: from.x + dx * t + nx * off, y: from.y + dy * t + ny * off });
    }
    return pts;
  }

  function strokePath(pts: Point[], width: number, style: string, alpha: number) {
    if (!ctx) return;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(0.1, width);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }

  function frame(now: number) {
    if (disposed || !ctx) return;

    /* Decay constants are tuned per 60fps frame; scaling by real elapsed time
       keeps every effect the same length on any refresh rate. */
    const dt = lastFrame ? Math.min(3, (now - lastFrame) / 16.667) : 1;
    lastFrame = now;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.globalCompositeOperation = "source-over";

    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];

      // Projectile heads move and shed trail instead of fading in place.
      if (s.kind === "head") {
        s.t += s.step * dt;
        const x = s.from.x + (s.to.x - s.from.x) * Math.min(s.t, 1);
        const y = s.from.y + (s.to.y - s.from.y) * Math.min(s.t, 1);
        for (let k = 0; k < 2; k++) {
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.9,
            vy: (Math.random() - 0.5) * 0.9,
            life: 0.6,
            decay: 0.05,
            radius: 1.2 + Math.random() * 1.6,
            gravity: 0,
            color: s.color,
          });
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (s.t >= 1) shapes.splice(i, 1);
        continue;
      }

      s.life -= s.decay * dt;
      if (s.life <= 0) {
        shapes.splice(i, 1);
        continue;
      }

      if (s.kind === "flash") {
        ctx.globalAlpha = s.alpha * s.life;
        ctx.fillStyle = s.color;
        ctx.fillRect(0, 0, rect.width, rect.height);
      } else if (s.kind === "bolt") {
        if (!reduced) s.pts = boltPath(s.from, s.to);
        strokePath(s.pts, 3.5, s.color, 0.9 * s.life);
        strokePath(s.pts, 1.25, INK, 0.9 * s.life);
      } else if (s.kind === "beam") {
        strokePath([s.from, s.to], 12 * s.life + 1, s.color, 0.9 * s.life);
        strokePath([s.from, s.to], 3 * s.life + 0.5, INK, 0.95 * s.life);
      } else if (s.kind === "ring") {
        ctx.globalAlpha = 0.85 * s.life;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max(0.5, 3 * s.life);
        ctx.beginPath();
        ctx.arc(s.at.x, s.at.y, 6 + (1 - s.life) * 44, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.kind === "arc") {
        const sweep = (1 - s.life) * 2.4;
        ctx.globalAlpha = s.life;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 4.5 * s.life + 0.5;
        ctx.beginPath();
        ctx.arc(s.at.x, s.at.y, 22 + (1 - s.life) * 12, s.spin + sweep, s.spin + sweep + 1.7);
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.4 * s.life + 0.3;
        ctx.beginPath();
        ctx.arc(s.at.x, s.at.y, (22 + (1 - s.life) * 12) * 0.78, s.spin + sweep, s.spin + sweep + 1.7);
        ctx.stroke();
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.radius * p.life), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (particles.length > 0 || shapes.length > 0) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      lastFrame = 0;
    }
  }

  function wake() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }

  resize();

  return {
    burst(x, y, color, count) {
      if (disposed) return;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          decay: 0.025,
          radius: 2 + Math.random() * 3,
          gravity: 0.15,
          color,
        });
      }
      wake();
    },
    rise(x, y, color, count) {
      if (disposed) return;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 34,
          y: y + Math.random() * 14,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(1 + Math.random() * 1.8),
          life: 1,
          decay: 0.018,
          radius: 1.4 + Math.random() * 2.2,
          gravity: -0.012,
          color,
        });
      }
      wake();
    },
    bolt(x1, y1, x2, y2, color) {
      if (disposed) return;
      const from = { x: x1, y: y1 };
      const to = { x: x2, y: y2 };
      shapes.push({ kind: "bolt", from, to, pts: boltPath(from, to), life: 1, decay: 0.085, color });
      wake();
    },
    beam(x1, y1, x2, y2, color) {
      if (disposed) return;
      shapes.push({ kind: "beam", from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, life: 1, decay: 0.05, color });
      shapes.push({ kind: "ring", at: { x: x2, y: y2 }, life: 1, decay: 0.05, color });
      // The landing burst is part of the beam — one call, full punctuation.
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
          x: x2,
          y: y2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          decay: 0.022,
          radius: 2 + Math.random() * 3.5,
          gravity: 0.15,
          color,
        });
      }
      wake();
    },
    slash(x, y, color) {
      if (disposed) return;
      shapes.push({ kind: "arc", at: { x, y }, spin: Math.random() * Math.PI * 2, life: 1, decay: 0.07, color });
      wake();
    },
    ring(x, y, color) {
      if (disposed) return;
      shapes.push({ kind: "ring", at: { x, y }, life: 1, decay: 0.045, color });
      wake();
    },
    shot(x1, y1, x2, y2, color) {
      if (disposed) return;
      shapes.push({ kind: "head", from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, t: 0, step: 1 / 14, color });
      wake();
    },
    flash(color, alpha = 0.2) {
      if (disposed || reduced) return;
      shapes.push({ kind: "flash", life: 1, decay: 0.11, color, alpha });
      wake();
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      particles.length = 0;
      shapes.length = 0;
    },
  };
}
