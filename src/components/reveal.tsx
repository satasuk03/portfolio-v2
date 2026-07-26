"use client";

/*
 * The dither reveal, applied once per element as it enters.
 *
 * Starts from an already-visible default: `--reveal` is registered with an
 * initial value of 1, so the server render, a no-JS client, and any browser
 * without `@property` all show solid content. This component only *removes* ink
 * and then puts it back — the effect is additive, and its absence is never a
 * blank region.
 */

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger within a group, in ms. */
  delay?: number;
  as?: ElementType;
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.inked = "true";
      return;
    }

    // Pull the ink out only now that we know we can put it back.
    el.style.setProperty("--reveal", "0");
    el.style.transitionDelay = `${delay}ms`;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.style.removeProperty("--reveal");
          el.dataset.inked = "true";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={`dither-reveal ${className}`}>
      {children}
    </Tag>
  );
}
