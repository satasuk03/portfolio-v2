"use client";

/*
 * THE SOUND HINT — a one-time callout that points at SND on a first visit.
 *
 * Sound stays off by default on every visit (see sound.ts); this only tells a
 * new visitor the page has any. What persists is that the hint was shown,
 * never the sound state itself: storage holds one flag, written the moment the
 * hint appears, so it shows once per browser. Where storage throws (private
 * mode, blocked site data) it falls back to once per page load.
 *
 * Rules it keeps:
 *   - Additive. It renders nothing on the server and nothing until the hero
 *     intro has played, and it is a fixed overlay, so no box on the page moves.
 *   - It never takes focus. It sits in the DOM straight after the toggle, so
 *     Tab from SND reaches its buttons, and the toggle is described by it
 *     while it is up.
 *   - It gets out of the way on its own: any answer, Escape, a click
 *     elsewhere, scrolling on by most of a viewport, or a quiet timeout
 *     (paused while the pointer or focus is on it). Sound turned on from
 *     anywhere dismisses it.
 *   - "Turn on" calls sound.toggle() from its own click handler, which is a
 *     user gesture, so the AudioContext rule in sound.ts still holds.
 *   - Its motion is CSS, finite (the ping runs three times), and collapses to
 *     a plain appear under reduced motion via the global duration rule.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { hudCopy } from "@/content/hud";
import { sound } from "./sound";

const KEY = "hangar:snd-hint";
/* After the hero's authored intro (~2.4s) so the two never compete. */
const SHOW_AT = 2800;
const LINGER = 15000;
const LINGER_AFTER_HOVER = 6000;
const EXIT = 220;
const EDGE = 16;
const GAP = 14;
const PAD = 5;

let shownThisLoad = false;

function seen() {
  try {
    return window.localStorage.getItem(KEY) !== null;
  } catch {
    return shownThisLoad;
  }
}

function markSeen() {
  shownThisLoad = true;
  try {
    window.localStorage.setItem(KEY, "seen");
  } catch {
    /* Storage blocked: the module flag keeps it to once per load. */
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Phase = "idle" | "shown" | "leaving" | "gone";

export function SoundHint({ anchor }: { anchor: RefObject<HTMLButtonElement | null> }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const boxRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const bodyId = `${id}-body`;
  const titleId = `${id}-title`;

  const dismiss = useCallback(() => {
    setPhase((p) => (p === "shown" ? "leaving" : p));
  }, []);

  // Arm: first visit, sound still off, tab visible, after the hero intro.
  useEffect(() => {
    if (seen() || sound.on) return;
    let timer = 0;
    const arm = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", arm);
      timer = window.setTimeout(() => {
        const b = anchor.current;
        if (sound.on || seen() || !b || b.getBoundingClientRect().width === 0) return;
        markSeen();
        setPhase("shown");
      }, Math.max(0, SHOW_AT - performance.now()));
    };
    if (document.hidden) document.addEventListener("visibilitychange", arm);
    else arm();
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [anchor]);

  // While shown: keep it hung off the toggle, and listen for every way out.
  // A layout effect, so the first paint already has it in place.
  useLayoutEffect(() => {
    if (phase !== "shown") return;
    const box = boxRef.current;
    const lock = lockRef.current;
    const b = anchor.current;
    if (!box || !lock || !b) return;

    const place = () => {
      const r = b.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const w = box.offsetWidth;
      const cx = r.left + r.width / 2;
      // Right-hang the card from the toggle, clamped inside the gutter; the
      // notch follows the toggle's centre wherever the card lands.
      const left = clamp(cx - w + 34, EDGE, Math.max(EDGE, vw - w - EDGE));
      box.style.left = `${left}px`;
      box.style.top = `${r.bottom + GAP}px`;
      box.style.setProperty("--notch", `${clamp(cx - left, 20, w - 20)}px`);
      lock.style.left = `${r.left - PAD}px`;
      lock.style.top = `${r.top - PAD}px`;
      lock.style.width = `${r.width + PAD * 2}px`;
      lock.style.height = `${r.height + PAD * 2}px`;
    };
    place();

    let raf = 0;
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), place()));
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(b);
    ro.observe(box);

    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > window.innerHeight * 0.8) dismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    // Click, not pointerdown: a touch that starts a scroll is not an answer,
    // and a keyboard activation elsewhere (the menu button) still counts.
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (t && !box.contains(t) && !b.contains(t)) dismiss();
    };

    let linger = window.setTimeout(dismiss, LINGER);
    const hold = () => clearTimeout(linger);
    const resume = () => {
      if (box.matches(":hover") || box.contains(document.activeElement)) return;
      clearTimeout(linger);
      linger = window.setTimeout(dismiss, LINGER_AFTER_HOVER);
    };
    const onFocusOut = () => requestAnimationFrame(resume);

    const unsub = sound.subscribe((on) => on && dismiss());
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    box.addEventListener("pointerenter", hold);
    box.addEventListener("pointerleave", resume);
    box.addEventListener("focusin", hold);
    box.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(linger);
      ro.disconnect();
      unsub();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      box.removeEventListener("pointerenter", hold);
      box.removeEventListener("pointerleave", resume);
      box.removeEventListener("focusin", hold);
      box.removeEventListener("focusout", onFocusOut);
    };
  }, [phase, anchor, dismiss]);

  // Describe the toggle while the hint is up.
  useEffect(() => {
    const b = anchor.current;
    if (!b || phase !== "shown") return;
    b.setAttribute("aria-describedby", bodyId);
    return () => b.removeAttribute("aria-describedby");
  }, [phase, anchor, bodyId]);

  // Leave: hand focus back to the toggle if it was inside, then unmount after
  // the exit animation.
  useEffect(() => {
    if (phase !== "leaving") return;
    if (boxRef.current?.contains(document.activeElement)) anchor.current?.focus({ preventScroll: true });
    const t = window.setTimeout(() => setPhase("gone"), EXIT);
    return () => clearTimeout(t);
  }, [phase, anchor]);

  if (phase === "idle" || phase === "gone") return null;

  const copy = hudCopy.soundHint;
  const state = phase === "leaving" ? "out" : "in";
  return (
    <>
      <div ref={lockRef} aria-hidden className="snd-hint-lock" data-state={state}>
        <i className="tl" />
        <i className="tr" />
        <i className="bl" />
        <i className="br" />
      </div>
      <div
        ref={boxRef}
        role="group"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="snd-hint"
        data-state={state}
        data-color="#1fc3ec"
      >
        <p className="snd-hint-head">
          <span className="tag tag-cyan">{copy.tag}</span>
          <span className="hud-label hud-dim">{copy.kicker}</span>
        </p>
        <p id={titleId} className="snd-hint-title">
          {copy.title}
        </p>
        <p id={bodyId} className="snd-hint-body">
          {copy.body}
        </p>
        <div className="snd-hint-actions">
          <button
            type="button"
            className="snd-hint-btn snd-hint-on"
            onClick={() => {
              if (!sound.on) void sound.toggle();
              dismiss();
            }}
          >
            <span className="eq" data-on="true" aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="hud-label">{copy.on}</span>
          </button>
          <button type="button" className="snd-hint-btn snd-hint-no" onClick={dismiss}>
            <span className="hud-label">{copy.dismiss}</span>
          </button>
        </div>
      </div>
    </>
  );
}
