/*
 * The reader's LCD — an orange backlit panel, drawn into a canvas and
 * uploaded as a texture at a fixed rate (not every frame).
 *
 * Modes: off → idle ("INSERT MODULE") → reading → topic, and eject. Charge
 * and glitch are overlays on whatever mode is up. `power` is the backlight;
 * boot tweens it through a flicker.
 *
 * Realism is in three cheap layers: ghost segments (unlit ink faintly
 * visible), a pixel grid, and a backlight hot-spot + vignette.
 */

import * as THREE from "three";
import type { PlayModule } from "@/content/play";
import type { Fonts } from "./textures";

const INK = "#2a1203";
const INK_SOFT = "rgba(42,18,3,0.55)";
const GHOST = "rgba(42,18,3,0.07)";

type Mode = "off" | "idle" | "reading" | "topic" | "eject" | "denied";

export class ReaderScreen {
  readonly texture: THREE.CanvasTexture;
  private c: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: CanvasPattern | null;
  private W: number;
  private H: number;
  private acc = 0;
  private t = 0;
  private modeT = 0;
  mode: Mode = "off";
  module: PlayModule | null = null;
  power = 0;
  charge = 0;
  glitch = 0;
  private wave = new Float32Array(96);
  private hex: string[] = [];

  constructor(
    private fonts: Fonts,
    hi: boolean,
    private modulesCount: number,
  ) {
    this.W = hi ? 1024 : 640;
    this.H = Math.round(this.W / 1.7);
    this.c = document.createElement("canvas");
    this.c.width = this.W;
    this.c.height = this.H;
    this.ctx = this.c.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.c);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    // The LCD's pixel grid, as a repeating pattern.
    const g = document.createElement("canvas");
    const cell = hi ? 4 : 3;
    g.width = g.height = cell;
    const gc = g.getContext("2d")!;
    gc.fillStyle = "rgba(60,20,0,0.16)";
    gc.fillRect(cell - 1, 0, 1, cell);
    gc.fillRect(0, cell - 1, cell, 1);
    this.grid = this.ctx.createPattern(g, "repeat");
    for (let i = 0; i < 24; i++) this.hex.push(this.hexLine());
    this.draw();
  }

  set(mode: Mode, module: PlayModule | null = this.module) {
    this.mode = mode;
    this.module = module;
    this.modeT = 0;
  }

  private hexLine() {
    let s = "";
    for (let k = 0; k < 6; k++) s += Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0").toUpperCase() + " ";
    return s;
  }

  update(dt: number, fps: number) {
    this.t += dt;
    this.modeT += dt;
    this.acc += dt;
    for (let i = 0; i < this.wave.length - 1; i++) this.wave[i] = this.wave[i + 1];
    const live = this.mode === "topic" ? 1 : 0.35;
    this.wave[this.wave.length - 1] = (Math.sin(this.t * 7) * 0.5 + Math.sin(this.t * 17.3) * 0.3 + (Math.random() - 0.5) * 0.6) * live + this.charge * (Math.random() - 0.5) * 2;
    if (this.acc < 1 / fps) return;
    this.acc = 0;
    this.draw();
    this.texture.needsUpdate = true;
  }

  // ── drawing ───────────────────────────────────────────────────────────────

  private font(weight: number, px: number, kind: "display" | "mono" = "mono") {
    return `${weight} ${px}px ${kind === "display" ? this.fonts.display : this.fonts.mono}`;
  }

  private fit(text: string, weight: number, maxW: number, start: number, kind: "display" | "mono") {
    let px = start;
    this.ctx.font = this.font(weight, px, kind);
    while (this.ctx.measureText(text).width > maxW && px > 12) {
      px -= 2;
      this.ctx.font = this.font(weight, px, kind);
    }
    return px;
  }

  private wrap(text: string, x: number, y: number, maxW: number, lh: number, maxLines: number, chars = Infinity) {
    const ctx = this.ctx;
    const words = text.split(" ");
    let line = "";
    let used = 0;
    let n = 0;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        const vis = line.slice(0, Math.max(0, chars - used));
        ctx.fillText(vis, x, y + n * lh);
        used += line.length + 1;
        n++;
        line = w;
        if (n >= maxLines) return { x, y: y + n * lh, done: used >= chars };
      } else line = test;
    }
    const vis = line.slice(0, Math.max(0, chars - used));
    ctx.fillText(vis, x, y + n * lh);
    const endX = x + ctx.measureText(vis).width;
    return { x: endX, y: y + n * lh, done: used + line.length <= chars };
  }

  private draw() {
    const { ctx, W, H } = this;
    const u = W / 1024;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Backlight: warm orange with a hot spot, falling off to the corners.
    const bg = ctx.createRadialGradient(W * 0.45, H * 0.42, W * 0.05, W * 0.5, H * 0.5, W * 0.72);
    bg.addColorStop(0, "#ffb055");
    bg.addColorStop(0.55, "#ff8a26");
    bg.addColorStop(1, "#d25c10");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (this.mode !== "off") {
      ctx.textBaseline = "alphabetic";
      this.header(u);
      switch (this.mode) {
        case "idle":
          this.idle(u);
          break;
        case "reading":
          this.reading(u);
          break;
        case "topic":
          this.topic(u);
          break;
        case "eject":
          this.banner(u, "EJECTING", "▲ MODULE RELEASED ▲");
          break;
        case "denied":
          this.banner(u, "NO MODULE", "BAY EMPTY — PICK A CARTRIDGE");
          break;
      }
      if (this.charge > 0) this.chargeOverlay(u);
    }

    // Pixel grid and vignette.
    if (this.grid) {
      ctx.fillStyle = this.grid;
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(40,10,0,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // Glitch: horizontal slices torn sideways.
    if (this.glitch > 0.02) {
      const n = Math.round(3 + this.glitch * 8);
      for (let k = 0; k < n; k++) {
        const y = Math.random() * H;
        const h = 4 + Math.random() * 30 * u;
        const dx = (Math.random() - 0.5) * 120 * this.glitch * u;
        ctx.drawImage(this.c, 0, y, W, h, dx, y, W, h);
      }
    }

    // Backlight power: dark when off, flickers through boot.
    if (this.power < 1) {
      ctx.fillStyle = `rgba(8,4,2,${1 - Math.max(0, this.power) * 0.97})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  private header(u: number) {
    const { ctx, W } = this;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, 44 * u);
    ctx.fillStyle = "#ff9a3a";
    ctx.font = this.font(700, 22 * u);
    ctx.fillText("S-03 READER", 22 * u, 30 * u);
    const d = new Date(Date.now() + 7 * 3600e3);
    const p = (n: number) => String(n).padStart(2, "0");
    ctx.textAlign = "right";
    ctx.fillText(`BKK ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`, W - 110 * u, 30 * u);
    // Battery.
    ctx.strokeStyle = "#ff9a3a";
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(W - 92 * u, 12 * u, 60 * u, 22 * u);
    ctx.fillRect(W - 31 * u, 18 * u, 5 * u, 10 * u);
    const bars = 3 + (Math.floor(this.t * 0.5) % 2);
    for (let b = 0; b < bars; b++) ctx.fillRect(W - 88 * u + b * 14 * u, 16 * u, 10 * u, 14 * u);
    ctx.textAlign = "left";
  }

  private ghost(text: string, x: number, y: number, font: string) {
    const { ctx } = this;
    ctx.font = font;
    ctx.fillStyle = GHOST;
    ctx.fillText(text, x, y);
  }

  private idle(u: number) {
    const { ctx, W, H } = this;
    // A contour-ish survey trace in the background.
    ctx.strokeStyle = "rgba(42,18,3,0.22)";
    ctx.lineWidth = 2 * u;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16 * u) {
        const y = H * (0.35 + k * 0.11) + Math.sin(x / (90 * u) + k * 1.3 + this.t * 0.4) * 18 * u + Math.sin(x / (37 * u) + k) * 7 * u;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const blink = Math.floor(this.t * 2) % 2 === 0;
    const big = this.font(900, 118 * u, "display");
    this.ghost("INSERT", 40 * u, 190 * u, big);
    this.ghost("MODULE", 40 * u, 300 * u, big);
    ctx.fillStyle = INK;
    ctx.font = big;
    ctx.fillText("INSERT", 40 * u, 190 * u);
    if (blink) ctx.fillText("MODULE", 40 * u, 300 * u);
    // Arrow up to the slot.
    ctx.save();
    ctx.translate(W - 150 * u, 150 * u + Math.sin(this.t * 5) * 8 * u);
    ctx.beginPath();
    ctx.moveTo(0, -60 * u);
    ctx.lineTo(56 * u, 10 * u);
    ctx.lineTo(20 * u, 10 * u);
    ctx.lineTo(20 * u, 80 * u);
    ctx.lineTo(-20 * u, 80 * u);
    ctx.lineTo(-20 * u, 10 * u);
    ctx.lineTo(-56 * u, 10 * u);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = this.font(700, 24 * u);
    ctx.fillText(`${String(this.modulesCount).padStart(2, "0")} CARDS ON DECK · BAY OPEN`, 40 * u, 360 * u);
    this.waveform(40 * u, H - 120 * u, W - 80 * u, 70 * u, u);
    const tick = "  ·  SATASUK VIPARKSINLAPIN  ·  FIELD UNIT S-03  ·  BANGKOK UTC+7  ·  PICK A CARTRIDGE";
    ctx.font = this.font(700, 22 * u);
    const tw = ctx.measureText(tick).width;
    const off = (this.t * 90 * u) % tw;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H - 42 * u, W, 42 * u);
    ctx.clip();
    ctx.fillStyle = INK;
    ctx.fillRect(0, H - 42 * u, W, 42 * u);
    ctx.fillStyle = "#ff9a3a";
    ctx.fillText(tick + tick, -off, H - 13 * u);
    ctx.restore();
  }

  private reading(u: number) {
    const { ctx, W, H } = this;
    const m = this.module;
    const k = Math.min(1, this.modeT / 0.55);
    ctx.fillStyle = INK;
    ctx.font = this.font(900, 64 * u, "display");
    ctx.fillText(`READING MOD ${m?.n ?? "--"}`, 40 * u, 130 * u);
    // Progress blocks.
    const n = 24;
    const bw = (W - 80 * u) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i / n < k ? INK : GHOST;
      ctx.fillRect(40 * u + i * bw, 160 * u, bw - 5 * u, 44 * u);
    }
    ctx.font = this.font(500, 20 * u);
    ctx.fillStyle = INK_SOFT;
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      if (Math.random() < 0.3) this.hex[(r + Math.floor(this.modeT * 30)) % this.hex.length] = this.hexLine();
      ctx.fillText(this.hex[(r + Math.floor(this.modeT * 30)) % this.hex.length], 40 * u, 250 * u + r * 30 * u);
    }
    ctx.fillStyle = INK;
    ctx.font = this.font(700, 26 * u);
    ctx.fillText(`${Math.round(k * 100)}%`, W - 130 * u, H - 30 * u);
  }

  private topic(u: number) {
    const { ctx, W, H } = this;
    const m = this.module;
    if (!m) return;
    const T = this.modeT;
    // Section line.
    ctx.fillStyle = INK;
    ctx.font = this.font(700, 24 * u);
    ctx.fillText(`§ ${m.n}  ·  ${m.code}`, 40 * u, 88 * u);
    ctx.fillRect(40 * u, 102 * u, W - 80 * u, 3 * u);

    // Title — drops in with an overshoot.
    const drop = T < 0.35 ? 1 - Math.pow(1 - T / 0.35, 3) : 1;
    const settle = T < 0.35 ? 0 : Math.sin((T - 0.35) * 18) * Math.exp(-(T - 0.35) * 7) * 8 * u;
    const title = m.label.toUpperCase();
    // Leave the right column to the outlined module number.
    const px = this.fit(title, 900, W - 330 * u, 150 * u, "display");
    ctx.save();
    ctx.globalAlpha = drop;
    const ty = 108 * u + px * 0.92 - (1 - drop) * 50 * u + settle;
    this.ghost("8".repeat(Math.max(1, title.length)), 36 * u, ty, this.font(900, px, "display"));
    ctx.fillStyle = INK;
    ctx.font = this.font(900, px, "display");
    ctx.fillText(title, 36 * u, ty);
    ctx.restore();

    // The big module number, outline, top right.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3 * u;
    ctx.font = this.font(900, 150 * u, "display");
    ctx.textAlign = "right";
    ctx.strokeText(m.n, W - 34 * u, 108 * u + 150 * u * 0.9);
    ctx.textAlign = "left";

    // Lede, typed.
    const lede = m.lede;
    const chars = Math.floor(Math.max(0, T - 0.4) * 70);
    ctx.font = this.font(500, 25 * u);
    ctx.fillStyle = INK;
    const ly = Math.max(ty + 48 * u, 300 * u);
    const end = this.wrap(lede, 40 * u, ly, W - 80 * u, 34 * u, 3, chars);
    if (Math.floor(this.t * 3) % 2 === 0 || !end.done) ctx.fillRect(end.x + 6 * u, end.y - 22 * u, 14 * u, 26 * u);

    // Telemetry footer.
    this.waveform(40 * u, H - 92 * u, W * 0.55, 60 * u, u);
    ctx.font = this.font(700, 20 * u);
    ctx.fillText("LINK", W * 0.62, H - 62 * u);
    ctx.fillText("MOD", W * 0.62, H - 34 * u);
    ctx.font = this.font(700, 20 * u);
    ctx.fillText(Math.floor(T * 10) % 2 ? "●  LIVE" : "○  LIVE", W * 0.62 + 70 * u, H - 62 * u);
    ctx.fillText(`${m.n} / ${String(this.modulesCount).padStart(2, "0")}  #${m.color.slice(1).toUpperCase()}`, W * 0.62 + 70 * u, H - 34 * u);
    // Level bars.
    for (let b = 0; b < 8; b++) {
      const h = (0.3 + 0.7 * Math.abs(Math.sin(this.t * (2 + b * 0.7) + b))) * 60 * u;
      ctx.fillRect(W - 150 * u + b * 14 * u, H - 30 * u - h, 9 * u, h);
    }
  }

  private banner(u: number, big: string, small: string) {
    const { ctx, W, H } = this;
    const on = Math.floor(this.modeT * 6) % 2 === 0;
    if (on) {
      ctx.fillStyle = INK;
      ctx.fillRect(30 * u, H * 0.28, W - 60 * u, H * 0.42);
    }
    ctx.fillStyle = on ? "#ff9a3a" : INK;
    const px = this.fit(big, 900, W - 120 * u, 130 * u, "display");
    ctx.font = this.font(900, px, "display");
    ctx.textAlign = "center";
    ctx.fillText(big, W / 2, H * 0.28 + H * 0.21 + px * 0.34);
    ctx.fillStyle = INK;
    ctx.font = this.font(700, 24 * u);
    ctx.fillText(small, W / 2, H * 0.84);
    ctx.textAlign = "left";
  }

  private chargeOverlay(u: number) {
    const { ctx, W, H } = this;
    const c = this.charge;
    const flash = c > 0.75 && Math.floor(this.t * 14) % 2 === 0;
    ctx.fillStyle = flash ? "#ff9a3a" : INK;
    ctx.fillRect(0, H * 0.3, W, H * 0.4);
    // Hazard edges.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H * 0.3, W, 16 * u);
    ctx.rect(0, H * 0.7 - 16 * u, W, 16 * u);
    ctx.clip();
    ctx.fillStyle = flash ? INK : "#ff9a3a";
    for (let x = -40; x < W + 40; x += 36 * u) {
      ctx.beginPath();
      ctx.moveTo(x, H * 0.7);
      ctx.lineTo(x + 18 * u, H * 0.7);
      ctx.lineTo(x + 18 * u + H * 0.4, H * 0.3);
      ctx.lineTo(x + H * 0.4, H * 0.3);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = flash ? INK : "#ff9a3a";
    ctx.font = this.font(900, 84 * u, "display");
    ctx.fillText("OVERCHARGE", 40 * u, H * 0.5 + 10 * u);
    ctx.font = this.font(700, 40 * u);
    ctx.textAlign = "right";
    ctx.fillText(`${String(Math.round(c * 100)).padStart(3, "0")}%`, W - 40 * u, H * 0.5 + 10 * u);
    ctx.textAlign = "left";
    const bw = (W - 80 * u) * c;
    ctx.fillRect(40 * u, H * 0.5 + 34 * u, bw, 14 * u);
  }

  private waveform(x: number, y: number, w: number, h: number, u: number) {
    const { ctx } = this;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    const n = this.wave.length;
    for (let i = 0; i < n; i++) {
      const px = x + (i / (n - 1)) * w;
      const py = y + h / 2 - Math.max(-1, Math.min(1, this.wave[i])) * h * 0.45;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(42,18,3,0.25)";
    ctx.lineWidth = 1 * u;
    ctx.strokeRect(x, y, w, h);
  }
}
