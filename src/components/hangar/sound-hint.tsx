"use client";

/*
 * THE SOUND HINT — a one-time callout that points at SND on a first visit.
 *
 * Sound stays off by default on every visit (see sound.ts); this only tells a
 * new visitor the page has any. What persists is that the visitor answered it,
 * never the sound state itself: storage holds one flag, written on the answer,
 * so the hint comes back on each visit until they do. Where storage throws
 * (private mode, blocked site data) it falls back to once per page load.
 *
 * Rules it keeps:
 *   - Additive. It renders nothing on the server, arrives shortly after
 *     hydration, and is a fixed overlay, so no box on the page moves.
 *   - It never takes focus. It sits in the DOM straight after the toggle, so
 *     Tab from SND reaches its buttons, and the toggle is described by it
 *     while it is up.
 *   - It stays until answered, pinned under the bar while the visitor scrolls
 *     and reads: "Not now", "Turn on", or sound turned on from SND itself.
 *     Escape counts as "Not now" for keyboard users. It steps aside (hidden,
 *     not dismissed) while the phone menu is open over it — see the CSS.
 *   - "Turn on" calls sound.toggle() from its own click handler, which is a
 *     user gesture, so the AudioContext rule in sound.ts still holds.
 *   - Its motion is CSS, finite (the ping runs three times), and collapses to
 *     a plain appear under reduced motion via the global duration rule.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { hudCopy } from "@/content/hud";
import { sound } from "./sound";

const KEY = "hangar:snd-hint";
/* Early in the hero intro, not after it: a beat past first paint so it reads
   as arriving rather than as part of the layout. */
const SHOW_AT = 700;
const MIN_DELAY = 250;
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
    /* Storage blocked: the module flag keeps it answered for this load. */
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

  /* Every way out is an answer, so every way out records it. */
  const dismiss = useCallback(() => {
    markSeen();
    setPhase((p) => (p === "shown" ? "leaving" : p));
  }, []);

  // Arm: not yet answered, sound still off, tab visible.
  useEffect(() => {
    if (seen() || sound.on) return;
    let timer = 0;
    const arm = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", arm);
      timer = window.setTimeout(() => {
        const b = anchor.current;
        if (sound.on || seen() || !b || b.getBoundingClientRect().width === 0) return;
        setPhase("shown");
      }, Math.max(MIN_DELAY, SHOW_AT - performance.now()));
    };
    if (document.hidden) document.addEventListener("visibilitychange", arm);
    else arm();
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [anchor]);

  // While shown: keep it hung off the toggle, and listen for an answer.
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

    // Escape with the phone menu open belongs to the menu, not to the hint.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.getElementById("section-menu")) dismiss();
    };

    const unsub = sound.subscribe((on) => on && dismiss());
    window.addEventListener("resize", schedule);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("keydown", onKey);
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
