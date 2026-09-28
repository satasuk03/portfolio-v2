"use client";

/*
 * Enamel plates. The hard-surface panels on `/` (the play cartridge, the
 * uplink console) are painted with the same procedural wear /play's reader
 * uses — cream enamel over steel, chipped at the edges, rust blooming out of
 * the chips, grime streaks — generated once by weathering.ts and handed to CSS
 * as a blob URL in a custom property.
 *
 * Additive: until the texture exists a plate is flat bone (`.plate`'s own
 * background colour), which is also what a no-JS client sees. Generation is
 * CPU work (~100ms on a laptop), so it waits for idle time after load and
 * never competes with first paint. Wear is the look of the surface, not
 * motion, so reduced motion keeps it.
 */

import { useEffect } from "react";
import { weathered } from "@/components/play/engine/weathering";

type Plate = { name: string; w: number; h: number; seed: number; wear: number; edge: number };

/* Two aspect ratios, because the edge band is painted at the texture's own
   edges and the plate stretches it to fit: the card-shaped plate and the wide
   console. Each is generated at its aspect so the rust ring stays even. */
const PLATES: Plate[] = [
  { name: "--wear-card", w: 560, h: 400, seed: 7, wear: 0.58, edge: 0.07 },
  { name: "--wear-wide", w: 960, h: 360, seed: 23, wear: 0.55, edge: 0.06 },
];

export function WearPlates() {
  useEffect(() => {
    let dead = false;
    const urls: string[] = [];
    const idle = (fn: () => void) => {
      const w = window as Window & { requestIdleCallback?: Window["requestIdleCallback"] };
      if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 });
      else setTimeout(fn, 600);
    };

    const next = (i: number) => {
      if (dead || i >= PLATES.length) return;
      idle(() => {
        if (dead) return;
        const p = PLATES[i];
        const wr = weathered({
          w: p.w,
          h: p.h,
          seed: p.seed,
          paint: [236, 230, 214],
          wear: p.wear,
          edge: p.edge,
          streaks: 0.22,
        });
        wr.colC.toBlob((blob) => {
          if (!blob || dead) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          document.documentElement.style.setProperty(p.name, `url("${url}")`);
          next(i + 1);
        }, "image/webp", 0.86);
      });
    };
    next(0);

    return () => {
      dead = true;
      for (const p of PLATES) document.documentElement.style.removeProperty(p.name);
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);
  return null;
}
