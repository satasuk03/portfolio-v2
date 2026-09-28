"use client";

/*
 * The React bridge to topo-field.ts. It mounts the canvas, forwards the
 * pointer from the hero (the canvas itself takes no events, so it can never
 * sit between the visitor and a link), and fades the plate in on its first
 * frame. Without WebGL the canvas simply stays transparent over the hero's
 * CSS survey grid — nothing depends on it.
 */

import { useEffect, useRef } from "react";
import { TopoField } from "./topo-field";

export function TopoCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const field = TopoField.create(canvas, { reduced, coarse });
    if (!field) return;
    canvas.dataset.live = "true";

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const [x, y] = local(e);
      field.setPointer(x, y);
    };
    const leave = () => field.setPointer(null);
    const down = (e: PointerEvent) => {
      const [x, y] = local(e);
      field.ripple(x, y, e.pointerType === "mouse" ? 1 : 0.8);
    };
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointerdown", down, { passive: true });
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerdown", down);
      field.dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`topo ${className}`} />;
}
