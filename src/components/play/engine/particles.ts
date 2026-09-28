/*
 * The 2D particle layer — a Canvas 2D overlay above the WebGL plate, drawn
 * with additive ("lighter") compositing so overlapping sparks bloom into white
 * the way light does.
 *
 * One flat pool, no allocation per frame. Five motions:
 *   ballistic — gravity + drag, the default (sparks, debris)
 *   pull      — accelerates toward a live target and dies on arrival (inward)
 *   curve     — rides a cubic bezier on an eased clock (data packets)
 *   orbit     — circles a live centre on a tilted ellipse (idle field)
 *   ring      — an expanding stroked circle (shockwaves)
 *
 * Targets are functions, not points, so a particle keeps homing on something
 * that moves — the projected core while the camera shakes, say.
 */

export type Vec = { x: number; y: number };
type Target = () => Vec;

const enum Mode {
  Ballistic,
  Pull,
  Curve,
  Orbit,
  Ring,
}

const enum Shape {
  Dot,
  Streak,
  Shard,
  Square,
}

type P = {
  alive: boolean;
  mode: Mode;
  shape: Shape;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  drag: number;
  gravity: number;
  life: number;
  max: number;
  size: number;
  size2: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  rot: number;
  vrot: number;
  // curve
  x0: number;
  y0: number;
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  target: Target | null;
  // orbit
  angle: number;
  omega: number;
  radius: number;
  tilt: number;
  wobble: number;
  // pull
  strength: number;
  flicker: number;
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class Particles {
  private ctx: CanvasRenderingContext2D;
  private pool: P[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  active = 0;
  /** Multiplies every emit count — the device tier and reduced motion set it. */
  density = 1;

  constructor(private canvas: HTMLCanvasElement, capacity: number) {
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    for (let i = 0; i < capacity; i++) this.pool.push(this.blank());
  }

  private blank(): P {
    return {
      alive: false, mode: Mode.Ballistic, shape: Shape.Dot,
      x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, ax: 0, ay: 0,
      drag: 0, gravity: 0, life: 0, max: 1, size: 1, size2: 0,
      r: 255, g: 255, b: 255, alpha: 1, rot: 0, vrot: 0,
      x0: 0, y0: 0, c1x: 0, c1y: 0, c2x: 0, c2y: 0, target: null,
      angle: 0, omega: 0, radius: 0, tilt: 1, wobble: 0, strength: 0, flicker: 0,
    };
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  private spawn(): P | null {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.alive) {
        const b = this.blank();
        Object.assign(p, b);
        p.alive = true;
        return p;
      }
    }
    return null;
  }

  private n(count: number) {
    return Math.max(1, Math.round(count * this.density));
  }

  private color(p: P, hex: string) {
    const [r, g, b] = hexToRgb(hex);
    p.r = r;
    p.g = g;
    p.b = b;
  }

  // ── emitters ──────────────────────────────────────────────────────────────

  /** Radial spark burst — streaks that stretch with speed and fall. */
  sparks(x: number, y: number, o: { count?: number; colors?: string[]; speed?: number; spread?: number; angle?: number; gravity?: number; life?: number; size?: number } = {}) {
    const count = this.n(o.count ?? 40);
    const colors = o.colors ?? ["#ffffff", "#ffd27a", "#ff9a3c"];
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      if (!p) return;
      const a = (o.angle ?? 0) + (o.spread !== undefined ? rand(-o.spread / 2, o.spread / 2) : rand(0, Math.PI * 2));
      const s = rand(0.35, 1) * (o.speed ?? 900);
      p.mode = Mode.Ballistic;
      p.shape = Shape.Streak;
      p.x = p.px = x;
      p.y = p.py = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.drag = rand(2.2, 4);
      p.gravity = o.gravity ?? 1400;
      p.max = rand(0.35, 1) * (o.life ?? 0.9);
      p.size = rand(1, 2.2) * (o.size ?? 1);
      p.flicker = Math.random() < 0.3 ? 1 : 0;
      this.color(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** Tumbling hard-surface shards — slower, heavier, spinning. */
  debris(x: number, y: number, o: { count?: number; colors?: string[]; speed?: number } = {}) {
    const count = this.n(o.count ?? 14);
    const colors = o.colors ?? ["#e9e4d6", "#9aa3ad"];
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      if (!p) return;
      const a = rand(-Math.PI, 0);
      const s = rand(200, o.speed ?? 700);
      p.mode = Mode.Ballistic;
      p.shape = Math.random() < 0.5 ? Shape.Shard : Shape.Square;
      p.x = p.px = x + rand(-20, 20);
      p.y = p.py = y + rand(-10, 10);
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.drag = 1.2;
      p.gravity = 1800;
      p.max = rand(0.7, 1.4);
      p.size = rand(2.5, 6);
      p.rot = rand(0, 6.28);
      p.vrot = rand(-18, 18);
      this.color(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** Soft motes drifting up — embers after an impact. */
  embers(x: number, y: number, o: { count?: number; colors?: string[]; radius?: number } = {}) {
    const count = this.n(o.count ?? 20);
    const colors = o.colors ?? ["#ffc400", "#ff7a2f"];
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      if (!p) return;
      const r = o.radius ?? 80;
      p.mode = Mode.Ballistic;
      p.shape = Shape.Dot;
      p.x = p.px = x + rand(-r, r);
      p.y = p.py = y + rand(-r * 0.4, r * 0.4);
      p.vx = rand(-40, 40);
      p.vy = rand(-160, -40);
      p.drag = 0.6;
      p.gravity = -60;
      p.max = rand(1, 2.4);
      p.size = rand(1, 2.6);
      p.flicker = 1;
      this.color(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** Inward pull — motes spawn on a ring and fall into `target`. */
  suck(target: Target, o: { count?: number; colors?: string[]; radius?: number; strength?: number } = {}) {
    const count = this.n(o.count ?? 24);
    const colors = o.colors ?? ["#7fe8ff", "#ffffff"];
    const t = target();
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      if (!p) return;
      const a = rand(0, Math.PI * 2);
      const r = rand(0.6, 1) * (o.radius ?? Math.max(this.w, this.h) * 0.55);
      p.mode = Mode.Pull;
      p.shape = Shape.Streak;
      p.x = p.px = t.x + Math.cos(a) * r;
      p.y = p.py = t.y + Math.sin(a) * r;
      // A tangential kick so they spiral in rather than fall straight.
      const tan = rand(0.4, 1) * (Math.random() < 0.5 ? -1 : 1);
      p.vx = -Math.sin(a) * 180 * tan;
      p.vy = Math.cos(a) * 180 * tan;
      p.target = target;
      p.strength = rand(0.7, 1.3) * (o.strength ?? 5200);
      p.drag = 1.4;
      p.max = 2.5;
      p.size = rand(0.8, 1.8);
      this.color(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** Curved flight — packets on a bezier from `from` to a live `to`. */
  stream(from: Vec, to: Target, o: { count?: number; colors?: string[]; spread?: number; duration?: number; delay?: number } = {}) {
    const count = this.n(o.count ?? 28);
    const colors = o.colors ?? ["#ffffff"];
    const t = to();
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      if (!p) return;
      const sp = o.spread ?? 260;
      p.mode = Mode.Curve;
      p.shape = Math.random() < 0.3 ? Shape.Square : Shape.Streak;
      p.x0 = from.x + rand(-12, 12);
      p.y0 = from.y + rand(-12, 12);
      p.x = p.px = p.x0;
      p.y = p.py = p.y0;
      p.c1x = from.x + rand(-sp, sp);
      p.c1y = from.y - rand(sp * 0.4, sp * 1.4);
      p.c2x = t.x + rand(-sp, sp) * 0.6;
      p.c2y = t.y + rand(-sp, sp) * 0.6;
      p.target = to;
      p.max = rand(0.7, 1.15) * (o.duration ?? 0.9);
      // Negative life is a stagger: the packet waits, invisible, before leaving.
      p.life = -rand(0, o.delay ?? 0.35);
      p.size = rand(1.4, 2.6);
      this.color(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** Orbit — a tilted ring of motes around a live centre. */
  orbit(center: Target, o: { count?: number; colors?: string[]; radius?: [number, number]; tilt?: number; life?: [number, number] } = {}) {
    const count = this.n(o.count ?? 30);
    const colors = o.colors ?? ["#7fe8ff", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const p = this.spawn();
      if (!p) return;
      const [r0, r1] = o.radius ?? [120, 220];
      const [l0, l1] = o.life ?? [2, 5];
      p.mode = Mode.Orbit;
      p.shape = Shape.Dot;
      p.target = center;
      p.angle = rand(0, Math.PI * 2);
      p.omega = rand(0.4, 1.4) * (Math.random() < 0.85 ? 1 : -1);
      p.radius = rand(r0, r1);
      p.tilt = o.tilt ?? 0.28;
      p.wobble = rand(0, 6.28);
      p.max = rand(l0, l1);
      p.size = rand(0.8, 2);
      const c = center();
      p.x = p.px = c.x + Math.cos(p.angle) * p.radius;
      p.y = p.py = c.y + Math.sin(p.angle) * p.radius * p.tilt;
      this.color(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** Stroked shockwave circle. */
  ring(x: number, y: number, o: { color?: string; radius?: number; life?: number; width?: number; tilt?: number } = {}) {
    const p = this.spawn();
    if (!p) return;
    p.mode = Mode.Ring;
    p.x = x;
    p.y = y;
    p.radius = o.radius ?? 300;
    p.max = o.life ?? 0.6;
    p.size = o.width ?? 6;
    p.tilt = o.tilt ?? 1;
    this.color(p, o.color ?? "#ffffff");
  }

  /** Blow every orbiting/pulled particle outward — the discharge. */
  scatter(cx: number, cy: number, force: number) {
    for (const p of this.pool) {
      if (!p.alive || p.mode === Mode.Ring || p.mode === Mode.Curve) continue;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      p.mode = Mode.Ballistic;
      p.shape = Shape.Streak;
      p.vx = (dx / d) * force * rand(0.6, 1.2);
      p.vy = (dy / d) * force * rand(0.6, 1.2);
      p.drag = 2.5;
      p.gravity = 300;
      p.life = 0;
      p.max = rand(0.5, 1);
    }
  }

  clear() {
    for (const p of this.pool) p.alive = false;
  }

  // ── simulation ────────────────────────────────────────────────────────────

  update(dt: number) {
    let active = 0;
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life += dt;
      if (p.life >= p.max) {
        p.alive = false;
        continue;
      }
      active++;
      if (p.life < 0) continue;
      p.px = p.x;
      p.py = p.y;
      switch (p.mode) {
        case Mode.Ballistic: {
          const k = Math.exp(-p.drag * dt);
          p.vx *= k;
          p.vy = p.vy * k + p.gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vrot * dt;
          break;
        }
        case Mode.Pull: {
          const t = p.target!();
          const dx = t.x - p.x;
          const dy = t.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 14) {
            p.alive = false;
            continue;
          }
          const a = p.strength / Math.max(d, 40);
          p.vx += (dx / d) * a * dt * 60;
          p.vy += (dy / d) * a * dt * 60;
          const k = Math.exp(-p.drag * dt);
          p.vx *= k;
          p.vy *= k;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        }
        case Mode.Curve: {
          const t = p.target!();
          const u = Math.min(1, p.life / p.max);
          // easeInOutCubic: a packet leaves slowly, rushes, and brakes on arrival.
          const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
          const m = 1 - e;
          p.x = m * m * m * p.x0 + 3 * m * m * e * p.c1x + 3 * m * e * e * p.c2x + e * e * e * t.x;
          p.y = m * m * m * p.y0 + 3 * m * m * e * p.c1y + 3 * m * e * e * p.c2y + e * e * e * t.y;
          if (p.life === dt) {
            p.px = p.x;
            p.py = p.y;
          }
          break;
        }
        case Mode.Orbit: {
          const c = p.target!();
          p.angle += p.omega * dt;
          p.wobble += dt * 1.7;
          const r = p.radius + Math.sin(p.wobble) * 8;
          p.x = c.x + Math.cos(p.angle) * r;
          p.y = c.y + Math.sin(p.angle) * r * p.tilt;
          break;
        }
        case Mode.Ring:
          break;
      }
    }
    this.active = active;
  }

  draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const p of this.pool) {
      if (!p.alive || p.life < 0) continue;
      const u = p.life / p.max;
      let a = p.alpha;
      switch (p.mode) {
        case Mode.Ring: {
          // easeOutExpo radius, fading width — the front outruns its own energy.
          const e = 1 - Math.pow(2, -8 * u);
          ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${(1 - u) * 0.9})`;
          ctx.lineWidth = p.size * (1 - u) + 0.5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, Math.max(1, p.radius * e), Math.max(1, p.radius * e * p.tilt), 0, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }
        case Mode.Orbit: {
          // Fade in and out so the field never pops; dim the far half of the ellipse.
          const edge = Math.min(1, u * 5, (1 - u) * 5);
          const front = Math.sin(p.angle) > 0 ? 1 : 0.35;
          a *= edge * front;
          break;
        }
        case Mode.Curve:
          a *= Math.min(1, u * 6) * (u > 0.85 ? (1 - u) / 0.15 : 1);
          break;
        default:
          a *= 1 - u * u;
      }
      if (p.flicker && Math.random() < 0.25) a *= 0.2;
      if (a <= 0.01) continue;
      const col = `rgba(${p.r},${p.g},${p.b},${a})`;
      switch (p.shape) {
        case Shape.Streak: {
          // Squash and stretch: the streak is as long as the frame's travel.
          const dx = p.x - p.px;
          const dy = p.y - p.py;
          const len = Math.hypot(dx, dy);
          ctx.strokeStyle = col;
          ctx.lineWidth = p.size * (len > 1 ? Math.max(0.55, 1 - len / 90) : 1);
          ctx.beginPath();
          ctx.moveTo(p.px - dx * 0.8, p.py - dy * 0.8);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          if (len < 1) {
            ctx.fillStyle = col;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
          break;
        }
        case Shape.Dot: {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case Shape.Square: {
          ctx.fillStyle = col;
          const s = p.size * 1.6;
          ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
          break;
        }
        case Shape.Shard: {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = col;
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(-s, -s * 0.4);
          ctx.lineTo(s * 1.2, -s * 0.1);
          ctx.lineTo(-s * 0.2, s * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
}
