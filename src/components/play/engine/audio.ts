/*
 * Every sound on /play is synthesised in real time — there is no audio file.
 *
 * Graph:  voices → sfxBus ─┬→ comp → master → destination
 *                          └→ reverbSend → convolver ┘
 *         ambient → ambBus ┘
 *
 * The AudioContext is created on the first user gesture (`init`), never on
 * load: browsers block it anyway, and a page that hums before you touch it is
 * rude. Every public method is a no-op until then, so callers never check.
 */

type Osc = OscillatorType;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private ambBus!: GainNode;
  private reverbSend!: GainNode;
  private noiseBuf!: AudioBuffer;
  private charge: { oscs: OscillatorNode[]; filter: BiquadFilterNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;
  private muted = false;
  private lastHover = 0;
  private lastTick = 0;

  get ready() {
    return this.ctx !== null;
  }

  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC({ latencyHint: "interactive" });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 5;
    comp.attack.value = 0.002;
    comp.release.value = 0.18;
    comp.connect(this.master);
    this.master.connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.8;
    this.sfxBus.connect(comp);

    this.ambBus = ctx.createGain();
    this.ambBus.gain.value = 0;
    this.ambBus.connect(comp);

    const convolver = ctx.createConvolver();
    convolver.buffer = this.impulse(2.8, 2.6);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.32;
    this.sfxBus.connect(this.reverbSend);
    this.reverbSend.connect(convolver);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    convolver.connect(wet);
    wet.connect(comp);

    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.startAmbient();

    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, t, 0.06);
  }

  // ── primitives ────────────────────────────────────────────────────────────

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        // Metallic early reflections, then a smooth tail — a hangar, not a hall.
        const t = i / len;
        const early = i < ctx.sampleRate * 0.06 && Math.random() < 0.004 ? 3 : 1;
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * early;
      }
    }
    return buf;
  }

  private env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  private tone(o: {
    type?: Osc;
    f: number;
    f2?: number;
    dur: number;
    gain: number;
    attack?: number;
    at?: number;
    detune?: number;
    pan?: number;
    lp?: number;
    dest?: AudioNode;
    glide?: "exp" | "lin";
  }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + (o.at ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2 !== undefined) {
      if (o.glide === "lin") osc.frequency.linearRampToValueAtTime(o.f2, t + o.dur);
      else osc.frequency.exponentialRampToValueAtTime(Math.max(o.f2, 1), t + o.dur);
    }
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    this.env(g, t, o.gain, o.attack ?? 0.004, o.dur);
    let node: AudioNode = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.lp;
      node.connect(f);
      node = f;
    }
    node.connect(g);
    if (o.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = o.pan;
      g.connect(p);
      p.connect(o.dest ?? this.sfxBus);
    } else g.connect(o.dest ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }

  private noise(o: {
    dur: number;
    gain: number;
    type?: BiquadFilterType;
    f: number;
    f2?: number;
    q?: number;
    attack?: number;
    at?: number;
    pan?: number;
    dest?: AudioNode;
  }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + (o.at ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.frequency.setValueAtTime(o.f, t);
    if (o.f2 !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(o.f2, 20), t + o.dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    this.env(g, t, o.gain, o.attack ?? 0.003, o.dur);
    src.connect(f);
    f.connect(g);
    if (o.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = o.pan;
      g.connect(p);
      p.connect(o.dest ?? this.sfxBus);
    } else g.connect(o.dest ?? this.sfxBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + o.dur + 0.05);
  }

  /** Two-operator FM — metal, bells, servos. */
  private fm(o: { f: number; ratio: number; index: number; dur: number; gain: number; at?: number; f2?: number; pan?: number }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + (o.at ?? 0);
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modG = ctx.createGain();
    car.frequency.setValueAtTime(o.f, t);
    mod.frequency.setValueAtTime(o.f * o.ratio, t);
    if (o.f2) {
      car.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
      mod.frequency.exponentialRampToValueAtTime(o.f2 * o.ratio, t + o.dur);
    }
    modG.gain.setValueAtTime(o.f * o.index, t);
    modG.gain.exponentialRampToValueAtTime(1, t + o.dur);
    mod.connect(modG);
    modG.connect(car.frequency);
    const g = ctx.createGain();
    this.env(g, t, o.gain, 0.002, o.dur);
    car.connect(g);
    if (o.pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = o.pan;
      g.connect(p);
      p.connect(this.sfxBus);
    } else g.connect(this.sfxBus);
    car.start(t);
    mod.start(t);
    car.stop(t + o.dur + 0.05);
    mod.stop(t + o.dur + 0.05);
  }

  // ── ambient bed ───────────────────────────────────────────────────────────

  private startAmbient() {
    const ctx = this.ctx!;
    // Sub drone: two detuned saws into a slow-breathing lowpass.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    lp.Q.value = 4;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 120;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    for (const [f, dt] of [
      [41.2, -6],
      [41.2, 7],
      [61.7, 0],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = dt;
      const g = ctx.createGain();
      g.gain.value = f > 60 ? 0.05 : 0.09;
      o.connect(g);
      g.connect(lp);
      o.start();
    }
    const droneG = ctx.createGain();
    droneG.gain.value = 0.5;
    lp.connect(droneG);
    droneG.connect(this.ambBus);

    // Room tone: filtered noise with a slow sweep — ventilation in a machine room.
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 520;
    bp.Q.value = 0.7;
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.045;
    const lfo2G = ctx.createGain();
    lfo2G.gain.value = 260;
    lfo2.connect(lfo2G);
    lfo2G.connect(bp.frequency);
    lfo2.start();
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    src.connect(bp);
    bp.connect(ng);
    ng.connect(this.ambBus);
    src.start();

    // Telemetry: sparse, quiet high blips in the distance.
    const blip = () => {
      if (!this.ctx) return;
      if (!document.hidden) {
        const base = [1760, 2093, 2637, 1568][Math.floor(Math.random() * 4)];
        const n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++)
          this.tone({ f: base, dur: 0.05, gain: 0.012, at: i * 0.08, pan: Math.random() * 1.6 - 0.8, dest: this.ambBus });
      }
      window.setTimeout(blip, 2500 + Math.random() * 5000);
    };
    window.setTimeout(blip, 3000);
  }

  ambientOn(level = 1, fade = 3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ambBus.gain.cancelScheduledValues(t);
    this.ambBus.gain.setTargetAtTime(0.55 * level, t, fade / 3);
  }

  // ── the vocabulary ────────────────────────────────────────────────────────

  hover(pitch = 0) {
    if (!this.ctx) return;
    const now = performance.now();
    if (now - this.lastHover < 45) return;
    this.lastHover = now;
    this.tone({ type: "square", f: 2400 + pitch * 180, f2: 1900 + pitch * 180, dur: 0.035, gain: 0.03, lp: 5000 });
    this.noise({ dur: 0.02, gain: 0.02, type: "highpass", f: 6000 });
  }

  /** Detent click as the carousel turns past a module. */
  tick() {
    if (!this.ctx) return;
    const now = performance.now();
    if (now - this.lastTick < 40) return;
    this.lastTick = now;
    this.noise({ dur: 0.025, gain: 0.09, type: "bandpass", f: 3200, q: 6 });
    this.tone({ type: "triangle", f: 900, f2: 500, dur: 0.03, gain: 0.03 });
  }

  click() {
    this.tone({ type: "square", f: 880, f2: 440, dur: 0.06, gain: 0.05, lp: 3000 });
    this.noise({ dur: 0.03, gain: 0.05, type: "highpass", f: 4000 });
  }

  select() {
    this.tone({ type: "square", f: 660, dur: 0.07, gain: 0.04, lp: 2600 });
    this.tone({ type: "square", f: 990, dur: 0.1, gain: 0.04, lp: 2600, at: 0.06 });
  }

  /** Anticipation — the latch releasing before the launch. */
  latch() {
    this.fm({ f: 190, ratio: 2.76, index: 3, dur: 0.12, gain: 0.12 });
    this.noise({ dur: 0.18, gain: 0.08, type: "highpass", f: 2500, f2: 7000 });
  }

  whoosh(dur = 0.55, up = true) {
    this.noise({ dur, gain: 0.16, type: "bandpass", f: up ? 300 : 2400, f2: up ? 3200 : 260, q: 1.6, attack: dur * 0.45 });
    this.tone({ type: "sawtooth", f: up ? 90 : 220, f2: up ? 260 : 70, dur, gain: 0.03, lp: 900, attack: dur * 0.5 });
  }

  /** Hydraulic servo run: a saw through a resonant bandpass, with wobble. */
  servo(dur = 0.5, up = true) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(up ? 70 : 150, t);
    o.frequency.exponentialRampToValueAtTime(up ? 150 : 70, t + dur);
    const w = ctx.createOscillator();
    w.frequency.value = 23;
    const wg = ctx.createGain();
    wg.gain.value = 9;
    w.connect(wg);
    wg.connect(o.frequency);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(up ? 1500 : 500, t + dur);
    bp.Q.value = 5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.04);
    g.gain.setValueAtTime(0.09, t + dur - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    w.start(t);
    o.stop(t + dur + 0.05);
    w.stop(t + dur + 0.05);
  }

  /** The slam. Sub drop + body + metal + transient, `k` 0..1 scales it. */
  impact(k = 1) {
    this.tone({ f: 150, f2: 34, dur: 0.55 * (0.6 + k * 0.4), gain: 0.55 * k + 0.15 });
    this.tone({ type: "triangle", f: 95, f2: 45, dur: 0.3, gain: 0.25 * k });
    this.noise({ dur: 0.35, gain: 0.35 * k, type: "lowpass", f: 2400, f2: 120 });
    this.noise({ dur: 0.02, gain: 0.3, type: "highpass", f: 3000 });
    this.fm({ f: 310, ratio: 1.414, index: 6, dur: 0.6, gain: 0.07 * k, pan: -0.2 });
    this.fm({ f: 467, ratio: 2.1, index: 4, dur: 0.45, gain: 0.05 * k, pan: 0.25 });
  }

  /** Lock-in confirmation after the slam: two chirps and a settle. */
  engage(pitch = 0) {
    const s = Math.pow(2, pitch / 12);
    this.tone({ type: "square", f: 523 * s, dur: 0.07, gain: 0.035, lp: 3000, at: 0.12 });
    this.tone({ type: "square", f: 784 * s, dur: 0.07, gain: 0.035, lp: 3000, at: 0.19 });
    this.tone({ type: "square", f: 1046 * s, dur: 0.16, gain: 0.035, lp: 3000, at: 0.26 });
    this.tone({ type: "sine", f: 1046 * s, f2: 1060 * s, dur: 0.9, gain: 0.02, at: 0.26 });
  }

  hiss(dur = 0.5) {
    this.noise({ dur, gain: 0.16, type: "highpass", f: 2600, f2: 5200, attack: 0.01 });
  }

  clunk() {
    this.tone({ f: 120, f2: 55, dur: 0.18, gain: 0.3 });
    this.fm({ f: 260, ratio: 1.5, index: 5, dur: 0.22, gain: 0.07 });
    this.noise({ dur: 0.06, gain: 0.12, type: "bandpass", f: 1400, q: 2 });
  }

  glitch(n = 6) {
    if (!this.ctx) return;
    for (let i = 0; i < n; i++) {
      const at = i * 0.028 + Math.random() * 0.02;
      this.tone({ type: "square", f: 200 + Math.random() * 2400, dur: 0.02 + Math.random() * 0.03, gain: 0.03, at, pan: Math.random() * 2 - 1 });
    }
  }

  /** Text decode — very quiet, rate-limited by the caller. */
  type() {
    if (!this.ctx) return;
    this.noise({ dur: 0.012, gain: 0.03, type: "highpass", f: 5000 + Math.random() * 3000 });
  }

  bootUp() {
    this.whoosh(1.4, true);
    const notes = [220, 277.2, 329.6, 440, 554.4, 659.3];
    notes.forEach((f, i) => this.fm({ f, ratio: 3.01, index: 1.5, dur: 0.5, gain: 0.05, at: 0.08 * i, pan: (i / 5) * 1.2 - 0.6 }));
    this.tone({ type: "sawtooth", f: 55, f2: 110, dur: 1.6, gain: 0.06, lp: 600, attack: 0.8 });
  }

  /** A refusal: two low square blips, the second flatter. */
  denied() {
    this.tone({ type: "square", f: 220, dur: 0.1, gain: 0.07, lp: 1400 });
    this.tone({ type: "square", f: 164, dur: 0.16, gain: 0.07, lp: 1400, at: 0.12 });
  }

  /** A detented knob spun by hand: a quick run of clicks, slowing down. */
  ratchet() {
    if (!this.ctx) return;
    let at = 0;
    for (let i = 0; i < 9; i++) {
      at += 0.018 + i * 0.006;
      this.noise({ dur: 0.012, gain: 0.08, type: "bandpass", f: 2600 + Math.random() * 800, q: 8, at });
    }
  }

  /** Small poke on the core — a quick tap without a hold. */
  poke() {
    this.fm({ f: 180, ratio: 2.4, index: 4, dur: 0.25, gain: 0.12 });
    this.tone({ f: 90, f2: 50, dur: 0.2, gain: 0.25 });
  }

  // ── overcharge: a continuous voice driven by charge 0..1 ──────────────────

  chargeStart() {
    const ctx = this.ctx;
    if (!ctx || this.charge) return;
    const t = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 9;
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.1, t + 0.15);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    const oscs = [0, 7, -12].map((semi, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "square" : "sawtooth";
      o.frequency.value = 110 * Math.pow(2, semi / 12);
      o.detune.value = i * 5;
      o.connect(filter);
      o.start(t);
      return o;
    });
    lfo.start(t);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    this.charge = { oscs, filter, gain, lfo, lfoGain };
  }

  chargeSet(v: number) {
    const c = this.charge;
    if (!c || !this.ctx) return;
    const t = this.ctx.currentTime;
    const base = 110 * Math.pow(2, v * 2.2);
    c.oscs.forEach((o, i) => o.frequency.setTargetAtTime(base * Math.pow(2, [0, 7, -12][i] / 12), t, 0.03));
    c.filter.frequency.setTargetAtTime(300 + v * v * 5200, t, 0.04);
    c.lfo.frequency.setTargetAtTime(6 + v * 22, t, 0.05);
    c.gain.gain.setTargetAtTime(0.08 + v * 0.07, t, 0.05);
  }

  chargeStop() {
    const c = this.charge;
    if (!c || !this.ctx) return;
    this.charge = null;
    const t = this.ctx.currentTime;
    c.gain.gain.cancelScheduledValues(t);
    c.gain.gain.setTargetAtTime(0.0001, t, 0.03);
    c.oscs.forEach((o) => o.stop(t + 0.2));
    c.lfo.stop(t + 0.2);
  }

  /** The release. Bigger than an impact, with a long tail through the reverb. */
  discharge(k: number) {
    this.impact(Math.min(1, 0.5 + k));
    this.tone({ f: 70, f2: 22, dur: 1.6, gain: 0.5 * k });
    this.noise({ dur: 1.8, gain: 0.25 * k, type: "lowpass", f: 5000, f2: 80, attack: 0.005 });
    this.noise({ dur: 0.9, gain: 0.12 * k, type: "bandpass", f: 6000, f2: 400, q: 3, attack: 0.005 });
    this.glitch(Math.round(4 + 8 * k));
  }
}
