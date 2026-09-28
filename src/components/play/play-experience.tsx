"use client";

/*
 * /play — the React shell around the engine.
 *
 * React owns the DOM that has to be readable (HUD, module bay, panels) and the
 * selection controller; the engine owns the frame. Per-frame values — shake,
 * the target-lock box, the clock, the charge meter — are written straight to
 * refs from engine callbacks, never through state, so a 60fps signal never
 * re-renders the tree.
 *
 * Sequencing lives in one place, `select`: close panel → eject → load → open
 * panel, each awaited. A click that arrives mid-sequence is queued, not
 * dropped and not interleaved.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { playCopy, playModules } from "@/content/play";
import { profile } from "@/content/profile";
import type { Stage, FrameInfo } from "./engine/stage";
import type { Sfx } from "./engine/audio";
import { Arrow, panelBodies } from "./panels";
import "./play.css";

type Phase = "loading" | "standby" | "booting" | "live" | "failed";

const GLYPHS = "▚▞▛▜▙▟#/\\<>01░▒";

/** Decode text into place — random glyphs resolving left to right. */
function scramble(el: HTMLElement, text: string, dur: number, sfx?: Sfx | null) {
  const p = { t: 0 };
  let last = 0;
  return gsap.to(p, {
    t: 1,
    duration: dur,
    ease: "power2.out",
    onUpdate: () => {
      const n = Math.floor(p.t * text.length);
      let out = text.slice(0, n);
      for (let i = n; i < Math.min(text.length, n + 6); i++) out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (sfx && n !== last && n % 2 === 0) sfx.type();
      last = n;
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
}

export function PlayExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const lockLabelRef = useRef<HTMLSpanElement>(null);
  const crossRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const clockVRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelHeadRef = useRef<HTMLDivElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  const stage = useRef<Stage | null>(null);
  const sfx = useRef<Sfx | null>(null);
  const phaseRef = useRef<Phase>("loading");
  const seatedRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const queuedRef = useRef<number | null | undefined>(undefined);
  const lockOn = useRef<string | null>(null);
  const lockBox = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const keyboardRef = useRef(false);

  const [phase, setPhaseState] = useState<Phase>("loading");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [seated, setSeated] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [touch, setTouch] = useState(false);

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  // ── per-frame DOM writes from the engine ─────────────────────────────────

  const onFrame = useCallback((f: FrameInfo) => {
    const hud = hudRef.current;
    if (hud) hud.style.transform = f.shake.x || f.shake.y ? `translate3d(${f.shake.x.toFixed(2)}px, ${f.shake.y.toFixed(2)}px, 0) rotate(${f.shake.r.toFixed(3)}deg)` : "";
    const lock = lockRef.current;
    if (!lock) return;
    if (f.hover) {
      const pad = 12;
      const t = { x: f.hover.rect.x - pad, y: f.hover.rect.y - pad, w: f.hover.rect.w + pad * 2, h: f.hover.rect.h + pad * 2 };
      const b = lockBox.current;
      if (lockOn.current !== f.hover.id || lockLabelRef.current?.dataset.label !== f.hover.label) {
        const fresh = lockOn.current !== f.hover.id;
        lockOn.current = f.hover.id;
        if (fresh) Object.assign(b, t);
        if (lockLabelRef.current) {
          lockLabelRef.current.dataset.label = f.hover.label;
          scramble(lockLabelRef.current, f.hover.label, 0.35);
        }
        lock.style.setProperty("--lock", f.hover.color);
        if (fresh)
          gsap.fromTo(lock, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)", overwrite: true });
      } else {
        b.x += (t.x - b.x) * 0.45;
        b.y += (t.y - b.y) * 0.45;
        b.w += (t.w - b.w) * 0.45;
        b.h += (t.h - b.h) * 0.45;
      }
      lock.style.left = `${b.x}px`;
      lock.style.top = `${b.y}px`;
      lock.style.width = `${b.w}px`;
      lock.style.height = `${b.h}px`;
    } else if (lockOn.current !== null) {
      lockOn.current = null;
      gsap.to(lock, { opacity: 0, scale: 0.85, duration: 0.18, ease: "power2.in", overwrite: true });
    }
  }, []);

  const onCharge = useCallback((v: number) => {
    const st = statusRef.current;
    const m = meterRef.current;
    if (m) m.style.transform = `scaleX(${v})`;
    if (!st) return;
    if (v > 0) {
      st.textContent = `${playCopy.status.charging} ${String(Math.round(v * 100)).padStart(3, "0")}%`;
      st.parentElement?.setAttribute("data-mode", v >= 1 ? "hot" : "charging");
    } else if (st.parentElement?.getAttribute("data-mode") === "charging" || st.parentElement?.getAttribute("data-mode") === "hot") {
      st.textContent = playCopy.status.nominal;
      st.parentElement?.setAttribute("data-mode", "nominal");
    }
  }, []);

  const onDischarge = useCallback((n: number) => {
    const st = statusRef.current;
    if (st) {
      st.parentElement?.setAttribute("data-mode", "hot");
      scramble(st, `${playCopy.status.overcharge} ×${String(n).padStart(2, "0")}`, 0.3);
      window.setTimeout(() => {
        if (st.parentElement?.getAttribute("data-mode") !== "hot") return;
        st.parentElement?.setAttribute("data-mode", "nominal");
        scramble(st, playCopy.status.nominal, 0.4);
      }, 1800);
    }
    const hud = rootRef.current?.querySelectorAll("[data-kick]");
    if (hud?.length) gsap.fromTo(hud, { scale: 1.12 }, { scale: 1, duration: 0.8, ease: "elastic.out(1.2, 0.35)", stagger: 0.02, overwrite: true, clearProps: "transform" });
  }, []);

  // ── selection controller ─────────────────────────────────────────────────

  const focusFor = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w >= 900) {
      const pw = Math.min(600, w * 0.44) + 22;
      // The free band runs from the left HUD rail (~160px) to the panel.
      const rail = 160;
      return { x: (pw - rail) / 2 + 8, y: 0, zoom: 1.04, visW: (w - pw - rail - 30) / w, visH: 0.8 };
    }
    // The bottom sheet: the reader lives in the band above it.
    const sheet = Math.min(h * 0.58, 620) + 84;
    return { x: 0, y: sheet / 2, zoom: 1.28, visW: 0.92, visH: (h - sheet - 24) / h };
  };

  const closePanel = () =>
    new Promise<void>((resolve) => {
      const el = panelRef.current;
      if (!el) return resolve();
      const cards = el.querySelectorAll("[data-card]");
      sfx.current?.whoosh(0.3, false);
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(cards, { y: -24, opacity: 0, duration: 0.16, stagger: 0.015, ease: "power2.in" }, 0);
      tl.to(el, { scaleY: 0.02, duration: 0.24, ease: "back.in(2.2)" }, 0.08);
      tl.to(el, { scaleX: 0, duration: 0.14, ease: "power3.in" }, 0.32);
    });

  const select = useCallback(async (i: number | null) => {
    const s = stage.current;
    if (!s || phaseRef.current !== "live") return;
    if (busyRef.current) {
      queuedRef.current = i;
      return;
    }
    busyRef.current = true;
    sfx.current?.select();
    const current = seatedRef.current;
    if (current !== null) {
      s.setLink(null);
      await closePanel();
      setOpenIdx(null);
      s.setFocus(0, 0, 1);
      await s.eject();
      seatedRef.current = null;
      setSeated(null);
    }
    if (i !== null && i !== current) {
      const f = focusFor();
      s.setFocus(f.x, f.y, f.zoom, f.visW, f.visH);
      await s.load(i);
      seatedRef.current = i;
      setSeated(i);
      setOpenIdx(i);
    }
    busyRef.current = false;
    const q = queuedRef.current;
    queuedRef.current = undefined;
    if (q !== undefined && q !== seatedRef.current) void select(q);
  }, []);

  // Panel open choreography: squash in, stretch out, cards on elastic.
  useLayoutEffect(() => {
    if (openIdx === null) return;
    const el = panelRef.current;
    const s = stage.current;
    if (!el || !s) return;
    const m = playModules[openIdx];
    const cards = el.querySelectorAll("[data-card]");
    const mobile = window.innerWidth < 900;
    el.scrollTop = 0;
    const body = el.querySelector(".pp-scroll");
    if (body) body.scrollTop = 0;
    const tl = gsap.timeline();
    gsap.set(el, { transformOrigin: mobile ? "50% 100%" : "100% 50%" });
    tl.fromTo(el, { scaleX: 0.5, scaleY: 0.02, opacity: 1 }, { scaleX: 1.05, duration: 0.16, ease: "power3.out" }, 0);
    tl.to(el, { scaleY: 1, duration: 0.6, ease: "expo.out" }, 0.1);
    tl.to(el, { scaleX: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" }, 0.18);
    tl.fromTo(cards, { y: 70, opacity: 0, rotation: -1.5 }, { y: 0, opacity: 1, rotation: 0, duration: 0.75, ease: "back.out(1.6)", stagger: 0.055 }, 0.26);
    const head = panelHeadRef.current;
    if (head) tl.fromTo(head, { y: -20, scaleY: 0.6 }, { y: 0, scaleY: 1, duration: 0.7, ease: "elastic.out(1.1, 0.4)" }, 0.16);
    tl.call(() => {
      if (panelTitleRef.current) scramble(panelTitleRef.current, m.label, 0.5, sfx.current);
    }, [], 0.2);
    const ticks = Math.min(cards.length, 6);
    for (let k = 0; k < ticks; k++) tl.call(() => sfx.current?.tick(), [], 0.3 + k * 0.055);
    tl.call(() => {
      s.setLink(() => {
        const r = panelHeadRef.current?.getBoundingClientRect();
        const root = rootRef.current?.getBoundingClientRect();
        if (!r || !root) return { x: 0, y: 0 };
        return mobile ? { x: r.left - root.left + r.width * 0.5, y: r.top - root.top + 8 } : { x: r.left - root.left + 10, y: r.top - root.top + r.height * 0.5 };
      }, m.color);
    }, [], 0.3);
    if (keyboardRef.current) tl.call(() => panelTitleRef.current?.focus({ preventScroll: true }), [], 0.4);
    return () => {
      tl.kill();
    };
  }, [openIdx]);

  // ── engine lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    let dead = false;
    const html = document.documentElement;
    html.classList.add("play-lock");
    setTouch(matchMedia("(pointer: coarse)").matches);

    // A believable loader: eases toward 90% while the engine builds, then snaps.
    const prog = { v: 0 };
    const progTween = gsap.to(prog, {
      v: 0.9,
      duration: 2.2,
      ease: "power2.out",
      onUpdate: () => {
        if (progressRef.current) progressRef.current.textContent = `${String(Math.round(prog.v * 100)).padStart(3, "0")}%`;
      },
    });

    (async () => {
      try {
        const [{ Stage }, { Sfx }] = await Promise.all([import("./engine/stage"), import("./engine/audio")]);
        if (dead) return;
        const audio = new Sfx();
        sfx.current = audio;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const st = new Stage(stageRef.current!, fxRef.current!, playModules, audio, {
          onHover: (i) => setHover(i),
          onPick: (i) => void select(i),
          onEject: () => void select(null),
          onToggleSound: (on) => {
            audio.setMuted(!on);
            if (on) audio.click();
            setMuted(!on);
          },
          onCharge,
          onDischarge,
          onFrame,
        }, { reduced });
        await st.init();
        if (dead) {
          st.dispose();
          return;
        }
        stage.current = st;
        progTween.kill();
        gsap.to(prog, {
          v: 1,
          duration: 0.3,
          onUpdate: () => {
            if (progressRef.current) progressRef.current.textContent = `${String(Math.round(prog.v * 100)).padStart(3, "0")}%`;
          },
        });
        setPhase("standby");
      } catch (err) {
        console.error(err);
        if (!dead) setPhase("failed");
      }
    })();

    return () => {
      dead = true;
      progTween.kill();
      stage.current?.dispose();
      stage.current = null;
      html.classList.remove("play-lock");
    };
  }, [select, onCharge, onDischarge, onFrame]);

  // Clock: Bangkok time with a 30fps frame counter, like a timecode.
  useEffect(() => {
    const tick = () => {
      const d = new Date(Date.now() + 7 * 3600e3);
      const p = (n: number) => String(n).padStart(2, "0");
      const ff = p(Math.floor((d.getUTCMilliseconds() / 1000) * 30));
      const s = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}:${ff}`;
      if (clockRef.current) clockRef.current.textContent = s;
      if (clockVRef.current) clockVRef.current.textContent = `${p(d.getUTCMonth() + 1)}:${s}`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Crosshair follows fine pointers.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const c = crossRef.current;
      if (c) c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // ── boot ─────────────────────────────────────────────────────────────────

  const hudIn = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const tl = gsap.timeline();
    tl.fromTo(root.querySelectorAll("[data-bracket]"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "elastic.out(1.1, 0.4)", stagger: 0.06, clearProps: "transform" }, 0);
    tl.fromTo(root.querySelectorAll("[data-hud-in]"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.05, clearProps: "transform" }, 0.1);
    tl.fromTo(root.querySelectorAll("[data-rail]"), { opacity: 0, x: (i) => (i % 2 ? 40 : -40) }, { opacity: 1, x: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, clearProps: "transform" }, 0.2);
    tl.fromTo(root.querySelectorAll(".bay-btn"), { y: 60, opacity: 0, scaleY: 0.4 }, { y: 0, opacity: 1, scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.5)", stagger: 0.05, clearProps: "transform" }, 0.5);
    root.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el, k) => {
      const text = el.dataset.scramble ?? "";
      tl.call(() => void scramble(el, text, 0.6), [], 0.15 + k * 0.07);
    });
  }, []);

  const boot = useCallback(() => {
    if (phaseRef.current !== "standby" || !stage.current) return;
    const audio = sfx.current!;
    audio.init();
    audio.setMuted(muted);
    stage.current.setToggle(!muted);
    audio.click();
    setPhase("booting");
    const b = bootRef.current;
    const btn = b?.querySelector(".boot-btn");
    const tl = gsap.timeline();
    if (btn) {
      tl.to(btn, { scaleX: 1.25, scaleY: 0.7, duration: 0.08, ease: "power2.out" });
      tl.to(btn, { scaleX: 0.9, scaleY: 1.2, duration: 0.1, ease: "power2.in" });
    }
    if (b) {
      // CRT power-off: collapse to a line, then to a point.
      tl.to(b, { scaleY: 0.004, filter: "brightness(3)", duration: 0.22, ease: "expo.in" }, 0.12);
      tl.to(b, { scaleX: 0, duration: 0.16, ease: "expo.in" }, 0.34);
      tl.set(b, { display: "none" });
    }
    tl.call(() => {
      void stage.current!.boot(hudIn).then(() => setPhase("live"));
    }, [], 0.2);
  }, [hudIn, muted]);

  // Keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (phaseRef.current === "standby" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        boot();
        return;
      }
      if (phaseRef.current !== "live") return;
      const n = Number(e.key);
      if (n >= 1 && n <= playModules.length) {
        keyboardRef.current = true;
        void select(n - 1);
      } else if (e.key === "Escape" && seatedRef.current !== null) {
        void select(null);
      } else if (e.key === "ArrowLeft") stage.current?.nudge(-1.2);
      else if (e.key === "ArrowRight") stage.current?.nudge(1.2);
      else if (e.key === "m" || e.key === "M") toggleMute();
    };
    const onPointer = () => (keyboardRef.current = false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  });

  const toggleMute = () => {
    setMuted((m) => {
      sfx.current?.setMuted(!m);
      if (m) sfx.current?.click();
      // Keep the reader's SND lever in step with the HUD button.
      stage.current?.setToggle(m);
      return !m;
    });
  };

  const openModule = openIdx !== null ? playModules[openIdx] : null;
  const Body = openModule ? panelBodies[openModule.id] : null;

  return (
    <div ref={rootRef} className="play-root" data-phase={phase} data-open={openIdx !== null ? "true" : "false"} data-touch={touch ? "true" : "false"}>
      <div ref={stageRef} className="play-stage">
        <canvas ref={fxRef} className="play-fx" aria-hidden />
      </div>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      <div ref={hudRef} className="play-hud">
        <span data-bracket className="hud-corner tl" />
        <span data-bracket className="hud-corner tr" />
        <span data-bracket className="hud-corner bl" />
        <span data-bracket className="hud-corner br" />

        <div className="hud-brand" data-hud-in>
          <span className="hud-mono hud-dim" data-scramble={playCopy.unit}>
            {playCopy.unit}
          </span>
          <span className="hud-name">{profile.name}</span>
          <span className="hud-mono" data-scramble={`${profile.role} · ${playCopy.edition}`}>
            {profile.role} · {playCopy.edition}
          </span>
        </div>

        <div className="hud-top-right" data-hud-in>
          <span className="hud-mono hud-clock">
            BKK <span ref={clockRef}>00:00:00:00</span>
          </span>
          <button type="button" className="hud-btn" onClick={toggleMute} aria-pressed={!muted} aria-label={muted ? "Sound off — turn on" : "Sound on — turn off"}>
            <span className="eq" data-muted={muted ? "true" : "false"}>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="hud-mono">{muted ? "SND OFF" : "SND ON"}</span>
          </button>
          <Link href="/" className="hud-btn hud-print">
            <span className="hud-mono">{playCopy.printEdition}</span>
            <Arrow />
          </Link>
        </div>

        {/* Left rail — the vertical masthead from the reference sheet. */}
        <div className="hud-rail-l" data-rail>
          <div className="rail-main">
            <span className="rail-bracket">
              <i />
            </span>
            <span className="rail-hatch" />
            <span className="rail-word" data-kick>
              SATASUK
            </span>
            <span className="rail-hatch" />
          </div>
          <div className="rail-side">
            <span className="rail-inv">S-03</span>
            <span className="hud-mono rail-v" ref={clockVRef}>
              00:00:00:00:00
            </span>
            <span className="rail-lock hud-mono">TARGET LOCK</span>
            <span className="rail-ammo" aria-hidden>
              {playModules.map((m, i) => (
                <i key={m.id} data-spent={seated === i ? "true" : "false"} style={{ ["--c" as string]: m.color }} />
              ))}
            </span>
            <span className="rail-badge hud-mono">07</span>
          </div>
        </div>

        {/* Right rail — survey marks and the coordinates. */}
        <div className="hud-rail-r" data-rail>
          <span className="tri up" />
          <span className="tri up" />
          <span className="tri up" />
          <span className="hud-mono rail-n">N</span>
          <span className="hud-mono rail-coords">{playCopy.coords}</span>
          <span className="tri down" />
          <span className="tri down" />
          <span className="tri down" />
        </div>

        <div className="hud-status" data-mode="nominal" data-hud-in data-kick>
          <span ref={statusRef}>{playCopy.status.nominal}</span>
          <span className="meter">
            <span ref={meterRef} />
          </span>
        </div>

        <p className="hud-hint hud-mono" data-hud-in>
          {touch ? playCopy.hints.touch : playCopy.hints.desktop}
          <span className="hud-keys"> · 1–7 · Esc</span>
        </p>

        <div ref={lockRef} className="hud-lock">
          <i className="lk tl" />
          <i className="lk tr" />
          <i className="lk bl" />
          <i className="lk br" />
          <span ref={lockLabelRef} className="hud-mono lk-label" />
        </div>
      </div>

      {/* ── module bay: the accessible way in, and the phone's primary one ── */}
      <nav className="bay" aria-label="Modules">
        {playModules.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className="bay-btn"
            style={{ ["--c" as string]: m.color }}
            data-active={seated === i ? "true" : "false"}
            data-hover={hover === i ? "true" : "false"}
            aria-pressed={seated === i}
            disabled={phase !== "live"}
            onPointerEnter={() => sfx.current?.hover(i)}
            onClick={() => void select(i)}
          >
            <span className="bay-n">{m.n}</span>
            <span className="bay-l">{m.label}</span>
          </button>
        ))}
      </nav>

      {/* ── the panel ───────────────────────────────────────────────────── */}
      {openModule && Body ? (
        <section ref={panelRef} className="play-panel" style={{ ["--mod" as string]: openModule.color }} aria-labelledby="pp-title">
          <div ref={panelHeadRef} className="pp-head">
            <div className="pp-head-row">
              <span className="pp-mono">§ {openModule.n}</span>
              <span className="pp-mono">{openModule.code}</span>
              <button type="button" className="pp-eject" onClick={() => void select(null)}>
                <span className="pp-mono">{playCopy.eject}</span>
                <span aria-hidden>⏏</span>
              </button>
            </div>
            <h2 id="pp-title" ref={panelTitleRef} className="pp-title" tabIndex={-1}>
              {openModule.label}
            </h2>
            <div className="pp-head-row pp-head-foot">
              <p className="pp-lede">{openModule.lede}</p>
              <Arrow />
            </div>
            <span className="pp-hatch" aria-hidden />
          </div>
          <div className="pp-scroll">
            <Body />
            <p className="pp-end pp-mono" data-card>
              END OF MODULE {openModule.n} · <button type="button" onClick={() => void select(null)}>{playCopy.eject} ⏏</button>
            </p>
          </div>
        </section>
      ) : null}

      {/* ── boot screen ─────────────────────────────────────────────────── */}
      <div ref={bootRef} className="play-boot" data-ready={phase === "standby" ? "true" : "false"}>
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />
        <div className="boot-core">
          <span className="hud-mono hud-dim">{playCopy.unit} · {profile.location.toUpperCase()}</span>
          <h1 className="boot-word" data-text="SATASUK">
            SATASUK
          </h1>
          <span className="hud-mono">— {playCopy.edition} —</span>
          {phase === "failed" ? (
            <p className="boot-fail">
              This unit needs WebGL, and this browser did not give it one.{" "}
              <Link href="/">The print edition works everywhere ↗</Link>
            </p>
          ) : (
            <button type="button" className="boot-btn" onClick={boot} disabled={phase !== "standby"}>
              <span className="boot-hatch" aria-hidden />
              <span className="boot-label">{phase === "standby" ? `▶ ${playCopy.bootTitle}` : playCopy.loading}</span>
              <span className="hud-mono boot-pct" ref={progressRef}>
                000%
              </span>
            </button>
          )}
          <span className="hud-mono hud-dim boot-hint">{playCopy.bootHint}</span>
        </div>
        <span className="boot-scan" aria-hidden />
      </div>

      <div ref={crossRef} className="hud-cross" aria-hidden>
        <i />
      </div>
    </div>
  );
}
