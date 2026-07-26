"use client";

/* ─────────────────────────────────────────────────────────────────────────────
   THE DITHER WAVE — React wrapper. The engine (field.ts) is framework-free;
   this component is the whole bridge: one canvas, one WaveField, registered
   with the page's shared clock for animated fields, or painted once for the
   seeded stills that stand in for project screenshots. All animation policy —
   30fps, IntersectionObserver, visibilitychange, reduced motion — lives in the
   clock, so every canvas on the page behaves the same way.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import {
  WaveField,
  paintStill,
  waveClock,
  type WaveOptions,
} from "./field";

export function WaveCanvas({
  cell,
  gamma,
  speed,
  seed,
  still = false,
  className,
}: WaveOptions & { still?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    /* A still is one composed frame — no clock registration, nothing moves.
       Reduced-motion handling for animated fields is the clock's job. */
    if (still) {
      paintStill(canvas, { cell, gamma, speed, seed });
      return;
    }

    const field = new WaveField(canvas, { cell, gamma, speed, seed });
    const clock = waveClock();
    clock.add(field);
    return () => clock.remove(field);
  }, [cell, gamma, speed, seed, still]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
