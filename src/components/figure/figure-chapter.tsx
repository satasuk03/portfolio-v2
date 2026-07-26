"use client";

/*
 * THE TURNING FIGURE — the site's one piece of choreography.
 *
 * Architecture, and why not the reference site's: zigma pins a `position: fixed`
 * viewport and drives it with invisible 10×–15× viewport spacer divs. That makes
 * a page unskimmable, unlinkable and un-find-in-page-able, which loses directly
 * to Product Principle 1 (a recruiter skimming for thirty seconds on a phone).
 *
 * So: one `position: sticky` canvas layer with zero layout height, and the real
 * content scrolls over it in normal document flow. Consequences worth having —
 * the figure turns while the reader reads the actual retrieval write-ups rather
 * than invented taglines, nothing is gated behind scroll depth, and find-in-page,
 * anchor links and keyboard scrolling all keep working.
 *
 * Progress goes straight to the WebGL uniform via a ref. It is deliberately not
 * React state: that would re-render this subtree on every scroll frame to
 * achieve nothing.
 */

import { useEffect, useRef, type ReactNode } from "react";
import type { FigureHandle } from "./engine";

export function FigureChapter({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let figure: FigureHandle | null = null;
    let disposed = false;
    let raf = 0;

    function progress() {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / travel));
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        figure?.setProgress(progress());
      });
    }

    function onResize() {
      figure?.resize();
      figure?.setProgress(progress());
    }

    /* three.js is imported here and nowhere else, so routes without the figure
       — /log, /arcade — never download it. */
    import("./engine")
      .then(({ createFigure }) => {
        if (disposed) return;
        figure = createFigure(canvas, { reducedMotion: reduced });
        onResize();
      })
      .catch(() => {
        /* No WebGL, or the chunk failed to load. Every word on the page is on
           paper and stays legible; only the line work behind it is missing. */
      });

    if (!reduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      figure?.dispose();
    };
  }, []);

  return (
    <div ref={trackRef} className="relative">
      {/* The figure layer. `sticky` holds it; the negative margin on the content
          below pulls the page back over it so this costs no height.

          Deliberately NOT switched to `absolute` under reduced motion: that
          takes it out of flow while the content keeps its -100svh margin, so the
          whole chapter shifts up a viewport and the hero disappears above the
          top of the document. Reduced motion changes what the figure *does*
          (one static frame, set in engine.ts), never the layout around it. */}
      <div aria-hidden className="pointer-events-none sticky top-0 h-svh">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="-mt-[100svh]">{children}</div>
    </div>
  );
}
