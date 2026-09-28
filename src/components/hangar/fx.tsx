"use client";

/*
 * THE MOTION LAYER — one controller for every effect on `/`, mounted once.
 *
 * It owns five things, all found by data attribute (see hud.tsx):
 *   reveals      [data-reveal] cards land with squash-and-stretch as they enter
 *   decode       [data-decode] text resolves from glyph noise, once
 *   target lock  [data-lock] cards take the bracket frame on hover / focus
 *   sparks       a burst from any press on something interactive
 *   motes        a few particles orbiting [data-orbit] while it is on screen
 *
 * Rules it keeps:
 *   - Additive only. Server HTML is complete and visible. A card is hidden for
 *     its entrance ONLY if it is below the fold when this runs, so nothing the
 *     visitor can already see ever blinks out; decode paints over real text
 *     that never leaves the DOM. With JS off, nothing here exists.
 *   - GSAP is dynamic-imported after hydration: it is never on the critical
 *     path, and a visitor on a slow connection reads the page before it lands.
 *   - No idle loops on content. Every tween ends by clearing its transform, and
 *     a new state overwrites the old tween (`overwrite: "auto"`), so nothing
 *     jitters or breathes, and nothing is left half-scaled after a state change.
 *   - The particle loop runs only while particles are alive.
 *   - Reduced motion keeps the lock frame (it answers the visitor) without its
 *     animation, and drops reveals, decode, sparks and motes. Layout is never
 *     touched either way: every effect is transform, opacity or an overlay.
 */

import { useEffect, useRef } from "react";
import { Particles } from "@/components/play/engine/particles";
import { sound } from "./sound";

const GLYPHS = "▚▞▛▜▙▟#/\\<>01░▒";
const CYAN = "#1fc3ec";
const INTERACTIVE = "a, button, [data-lock], [data-field]";

type Gsap = typeof import("gsap").default;

/** Decode text into place — random glyphs resolving left to right. */
function scramble(gsap: Gsap, el: HTMLElement, text: string, dur: number, onChar?: () => void) {
  const p = { t: 0 };
  let last = -1;
  return gsap.to(p, {
    t: 1,
    duration: dur,
    ease: "power2.out",
    onUpdate: () => {
      const n = Math.floor(p.t * text.length);
      let out = text.slice(0, n);
      for (let i = n; i < Math.min(text.length, n + 7); i++)
        out += text[i] === " " || text[i] === "\n" ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (onChar && n !== last && n % 2 === 0) onChar();
      last = n;
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
}

export function HangarFx() {
  const fxRef = useRef<HTMLCanvasElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const loadedAt = performance.now();
    let dead = false;
    const off: (() => void)[] = [];
    const on = <K extends keyof DocumentEventMap>(
      target: Document | Window,
      type: K | string,
      fn: (e: never) => void,
      opts?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, fn as EventListener, opts);
      off.push(() => target.removeEventListener(type, fn as EventListener, opts));
    };

    (async () => {
      const gsap = (await import("gsap")).default;
      if (dead) return;

      // ── particles ────────────────────────────────────────────────────────
      const canvas = fxRef.current!;
      const fx = new Particles(canvas, 420);
      fx.density = coarse ? 0.6 : 1;
      const resize = () => fx.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 1.5));
      resize();
      on(window, "resize", resize);

      let orbitEl: HTMLElement | null = document.querySelector("[data-orbit]");
      let orbitOn = false;
      const orbitC = { x: 0, y: 0, r: 100 };
      const measureOrbit = () => {
        if (!orbitEl) return;
        const r = orbitEl.getBoundingClientRect();
        orbitC.x = r.left + r.width / 2;
        orbitC.y = r.top + r.height / 2;
        orbitC.r = Math.max(r.width, r.height) / 2;
      };

      let raf = 0;
      let last = 0;
      const loop = (t: number) => {
        const dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        if (orbitOn) measureOrbit();
        fx.update(dt);
        fx.draw();
        raf = fx.active > 0 ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => {
        if (reduced || raf) return;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      };
      off.push(() => cancelAnimationFrame(raf));

      const spotOf = (el: Element | null) =>
        (el?.closest("[data-color]") as HTMLElement | null)?.dataset.color ?? CYAN;

      // ── motes: a handful, only while their anchor is on screen ─────────────
      if (!reduced && orbitEl) {
        let emitTimer = 0;
        const emit = () => {
          if (!orbitOn || dead) return;
          measureOrbit();
          const r = orbitC.r;
          fx.orbit(() => orbitC, {
            count: coarse ? 5 : 8,
            colors: ["#1fc3ec", "#ece6d6", "#f2913d"],
            radius: [r * 1.02, r * 1.18],
            tilt: 0.34,
            life: [5, 9],
          });
          kick();
          emitTimer = window.setTimeout(emit, 4200);
        };
        const oio = new IntersectionObserver(([e]) => {
          const was = orbitOn;
          orbitOn = e.isIntersecting && !document.hidden;
          if (orbitOn && !was) emit();
          if (!orbitOn) clearTimeout(emitTimer);
        });
        oio.observe(orbitEl);
        off.push(() => {
          oio.disconnect();
          clearTimeout(emitTimer);
          orbitEl = null;
        });
      }

      // ── sparks on press ──────────────────────────────────────────────────
      on(document, "pointerdown", (e: PointerEvent) => {
        const hit = (e.target as Element | null)?.closest(INTERACTIVE);
        if (!hit) return;
        sound.play((s) => s.click());
        if (reduced) return;
        const c = spotOf(hit);
        const field = hit.matches("[data-field]") && !hit.closest("a, button, [data-lock]");
        fx.sparks(e.clientX, e.clientY, {
          count: field ? 16 : 24,
          colors: [c, "#ffffff", "#ffc400"],
          speed: field ? 520 : 640,
          gravity: 1200,
          life: 0.7,
        });
        fx.ring(e.clientX, e.clientY, { color: c, radius: field ? 90 : 56, life: 0.5, width: 3 });
        kick();
      }, { passive: true });

      // ── reveals ──────────────────────────────────────────────────────────
      if (!reduced) {
        const vh = window.innerHeight;
        const pending = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
          (el) => el.getBoundingClientRect().top > vh * 0.96,
        );
        for (const el of pending) {
          gsap.set(el, { opacity: 0, y: 64, scaleX: 0.975, scaleY: 1.05, transformOrigin: "50% 100%" });
          const chips = el.querySelectorAll(".chips-pop > li");
          if (chips.length) gsap.set(chips, { opacity: 0, scale: 0.6, y: 8 });
        }

        const land = (el: HTMLElement, delay: number) => {
          // Wide cards squash less: the same scale on a 1300px card moves its
          // edges 20px, which reads as a wobble rather than as weight.
          const amp = Math.min(1, Math.max(0.3, 520 / Math.max(1, el.offsetWidth)));
          const tl = gsap.timeline({
            delay,
            onComplete: () => void gsap.set(el, { clearProps: "transform,opacity" }),
          });
          tl.to(el, { opacity: 1, y: -7, scaleX: 1, scaleY: 1, duration: 0.42, ease: "power3.out" })
            .to(el, { y: 0, scaleX: 1 + 0.02 * amp, scaleY: 1 - 0.03 * amp, duration: 0.09, ease: "power2.in" })
            .to(el, { scaleX: 1, scaleY: 1, duration: 0.75, ease: "elastic.out(1.1, 0.4)" });
          const chips = el.querySelectorAll(".chips-pop > li");
          if (chips.length)
            tl.to(chips, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2.6)", stagger: 0.018, clearProps: "transform,opacity" }, 0.3);
          tl.call(() => sound.play((s) => s.tick()), [], 0.42);
        };

        const rio = new IntersectionObserver(
          (entries) => {
            const entering = entries
              .filter((e) => e.isIntersecting)
              .map((e) => e.target as HTMLElement)
              .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
            entering.forEach((el, i) => {
              rio.unobserve(el);
              land(el, i * 0.075);
            });
          },
          { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
        );
        pending.forEach((el) => rio.observe(el));
        off.push(() => rio.disconnect());
      }

      // ── decode ───────────────────────────────────────────────────────────
      if (!reduced) {
        const decode = (el: HTMLElement) => {
          if (el.dataset.decoded) return;
          el.dataset.decoded = "true";
          const text = el.textContent ?? "";
          const overlay = document.createElement("span");
          overlay.className = "decode-fx";
          overlay.setAttribute("aria-hidden", "true");
          overlay.style.color = getComputedStyle(el).color;
          el.classList.add("decoding");
          el.appendChild(overlay);
          const dur = Math.min(0.9, 0.35 + text.length * 0.022);
          scramble(gsap, overlay, text, dur, () => sound.play((s) => s.type())).then(() => {
            overlay.remove();
            el.classList.remove("decoding");
          });
          // An opener landing throws a few sparks off its § tag.
          const tag = el.closest(".opener")?.querySelector(".tag");
          if (tag) {
            const r = tag.getBoundingClientRect();
            fx.sparks(r.left + r.width / 2, r.top + r.height / 2, {
              count: 12,
              colors: [spotOf(el), "#ffffff"],
              speed: 420,
              angle: -Math.PI / 2,
              spread: Math.PI * 0.9,
              gravity: 900,
              life: 0.6,
            });
            fx.ring(r.left + r.width / 2, r.top + r.height / 2, { color: spotOf(el), radius: 44, life: 0.45, width: 2 });
            kick();
            sound.play((s) => s.engage(0));
          }
        };
        const dio = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              dio.unobserve(e.target);
              decode(e.target as HTMLElement);
            }
          },
          { rootMargin: "0px 0px -12% 0px" },
        );
        document.querySelectorAll<HTMLElement>("[data-decode]").forEach((el) => dio.observe(el));
        off.push(() => dio.disconnect());
      }

      // ── hero intro: only on a fresh load, and only on decoration ──────────
      if (!reduced && loadedAt < 2500) {
        const corners = document.querySelectorAll(".hero .corners i");
        gsap.from(corners, { scale: 1.8, duration: 0.9, ease: "elastic.out(1.1, 0.4)", stagger: 0.06, clearProps: "transform" });
        gsap.from(document.querySelectorAll(".hero .tri"), { y: (i) => (i % 2 ? 10 : -10), duration: 0.8, ease: "back.out(2.4)", stagger: 0.04, clearProps: "transform" });
      }

      // ── target lock ──────────────────────────────────────────────────────
      const lock = lockRef.current!;
      const label = labelRef.current!;
      let target: HTMLElement | null = null;
      let placeRaf = 0;
      const PAD = 9;
      // While locked the frame re-measures every frame: the card it holds may
      // still be landing, bumping or squashing, and a stale rect drifts off it.
      const place = () => {
        placeRaf = 0;
        if (!target) return;
        placeRaf = requestAnimationFrame(place);
        const r = target.getBoundingClientRect();
        lock.style.left = `${r.left - PAD}px`;
        lock.style.top = `${r.top - PAD}px`;
        lock.style.width = `${r.width + PAD * 2}px`;
        lock.style.height = `${r.height + PAD * 2}px`;
        // Near the top edge the label would sit off screen; hang it below.
        lock.dataset.below = r.top < 64 ? "true" : "false";
      };
      const schedulePlace = () => {
        if (target && !placeRaf) placeRaf = requestAnimationFrame(place);
      };
      const stopPlace = () => {
        cancelAnimationFrame(placeRaf);
        placeRaf = 0;
      };
      on(window, "scroll", schedulePlace, { passive: true });
      on(window, "resize", schedulePlace);

      const engage = (el: HTMLElement) => {
        if (target === el) return;
        target = el;
        stopPlace();
        place();
        const c = el.dataset.color ?? CYAN;
        lock.style.setProperty("--lock", c);
        const text = el.dataset.lock ?? "";
        if (reduced) {
          label.textContent = text;
          gsap.set(lock, { opacity: 1, scale: 1 });
          return;
        }
        scramble(gsap, label, text, 0.32);
        gsap.fromTo(lock, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2.6)", overwrite: "auto" });
        // A bump on acquisition, as if the card took the hit. Skipped while the
        // card is still landing, so the two tweens never fight.
        if (!gsap.isTweening(el)) {
          const amp = Math.min(1, Math.max(0.25, 480 / Math.max(1, el.offsetWidth)));
          gsap.fromTo(
            el,
            { scaleX: 1 + 0.012 * amp, scaleY: 1 - 0.018 * amp },
            { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1.2, 0.35)", overwrite: "auto", clearProps: "transform" },
          );
        }
        sound.play((s) => s.hover(Number(el.dataset.pitch ?? 0)));
      };
      const release = () => {
        if (!target) return;
        target = null;
        stopPlace();
        if (reduced) gsap.set(lock, { opacity: 0 });
        else gsap.to(lock, { opacity: 0, scale: 0.94, duration: 0.16, ease: "power2.in", overwrite: "auto" });
      };

      on(document, "pointerover", (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const el = (e.target as Element | null)?.closest<HTMLElement>("[data-lock]");
        if (el) engage(el);
      });
      on(document, "pointerout", (e: PointerEvent) => {
        if (!target || e.pointerType !== "mouse") return;
        const to = e.relatedTarget as Node | null;
        if (!to || !target.contains(to)) release();
      });
      on(document, "pointermove", (e: PointerEvent) => {
        if (!target || e.pointerType !== "mouse") return;
        const r = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${e.clientX - r.left}px`);
        target.style.setProperty("--my", `${e.clientY - r.top}px`);
      }, { passive: true });
      on(document, "focusin", (e: FocusEvent) => {
        const t = e.target as HTMLElement;
        const el = t.closest<HTMLElement>("[data-lock]");
        if (el && t.matches(":focus-visible")) engage(el);
        else release();
      });
      on(document, "focusout", (e: FocusEvent) => {
        const to = e.relatedTarget as Node | null;
        if (target && (!to || !target.contains(to))) release();
      });

      // Squash on press, elastic on release.
      on(document, "pointerdown", (e: PointerEvent) => {
        if (reduced) return;
        const el = (e.target as Element | null)?.closest<HTMLElement>("[data-lock]");
        if (!el || gsap.isTweening(el)) return;
        const amp = Math.min(1, Math.max(0.25, 480 / Math.max(1, el.offsetWidth)));
        gsap.to(el, { scaleX: 1 + 0.014 * amp, scaleY: 1 - 0.024 * amp, duration: 0.08, ease: "power2.out", overwrite: "auto" });
        const up = () => {
          gsap.to(el, { scaleX: 1, scaleY: 1, duration: 0.65, ease: "elastic.out(1.3, 0.35)", overwrite: "auto", clearProps: "transform" });
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
        };
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      }, { passive: true });

      off.push(() => cancelAnimationFrame(placeRaf));
    })();

    return () => {
      dead = true;
      off.forEach((f) => f());
    };
  }, []);

  return (
    <>
      <canvas ref={fxRef} aria-hidden className="fx-layer" />
      <div ref={lockRef} aria-hidden className="lock">
        <i className="lk tl" />
        <i className="lk tr" />
        <i className="lk bl" />
        <i className="lk br" />
        <span ref={labelRef} className="lk-label" />
      </div>
    </>
  );
}
