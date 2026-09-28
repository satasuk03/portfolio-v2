"use client";

/*
 * Bangkok time as a timecode — HH:MM:SS:FF, frames at 30. A readout, so it
 * updates; under reduced motion it drops the frame digits and ticks once a
 * second, which changes what it does and not how wide it is (the frames field
 * holds "00" instead of disappearing).
 *
 * Server-renders a fixed placeholder so hydration never mismatches the clock.
 * Every instance shares one timer.
 */

import { useEffect, useRef } from "react";

const subs = new Set<(s: string) => void>();
let timer = 0;

function now(frames: boolean) {
  const d = new Date(Date.now() + 7 * 3600e3);
  const p = (n: number) => String(n).padStart(2, "0");
  const ff = frames ? p(Math.floor((d.getUTCMilliseconds() / 1000) * 30)) : "00";
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}:${ff}`;
}

function start() {
  if (timer) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tick = () => {
    if (document.hidden) return;
    const s = now(!reduced);
    subs.forEach((f) => f(s));
  };
  tick();
  timer = window.setInterval(tick, reduced ? 1000 : 1000 / 30);
}

export function Clock({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const set = (s: string) => {
      if (ref.current) ref.current.textContent = s;
    };
    subs.add(set);
    start();
    return () => {
      subs.delete(set);
      if (!subs.size) {
        clearInterval(timer);
        timer = 0;
      }
    };
  }, []);
  return (
    <span ref={ref} className={`tabular ${className}`} aria-hidden>
      --:--:--:--
    </span>
  );
}
