"use client";

/*
 * THE SECTION NAV — the sticky top bar plus the dot rail, reading from ONE
 * scroll-driven computation over the six section openers: the active section
 * is the last opener above the reading line (REDESIGN-PLAN.md §4 calls for a
 * single source of truth for "which section am I in"; this is it). The bar
 * is the real navigation (aria-current on the active tab); the rail is
 * decorative and receives the same state.
 *
 * Anchor links, not scroll hijacking — find-in-page, keyboard scroll and
 * deep links keep working. The openers carry scroll-margin-top, so anchors
 * never land under the bar. No smooth scrolling anywhere, so there is
 * nothing to guard behind prefers-reduced-motion.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { profile } from "@/content/profile";
import { sections } from "@/content/nav";
import { DotRail } from "./dot-rail";

export function SectionNav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    /* Which opener has the reading line passed? The line sits a fifth of the
       way down the viewport; the active section is the last opener above it.
       Computed on scroll (rAF-throttled) rather than from an
       IntersectionObserver: an observer with a narrow rootMargin band only
       notifies on band crossings, which leaves the active tab stale across
       instant anchor jumps and fast flicks that skip the band entirely. One
       computation, one source of truth — same contract as the plan's single
       observer, without the blind spot. */
    const line = () => window.innerHeight * 0.22;
    const update = () => {
      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line())
          current = section.id;
      }
      setActive(current);
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* Escape closes the mobile menu. No outside-click handler: the panel is
     modal-free, and the first tap outside it either scrolls or follows a
     link — both of which already dismiss it (link clicks close it below). */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex h-[var(--topbar-h)] max-w-spread items-center gap-step-4 px-step-5 sm:px-step-7">
          <Link href="/" className="title-sm shrink-0 text-ink">
            {profile.name}
          </Link>

          {/* Inline tabs only where they fit. The name plus seven captions is
              ~54rem wide, so below 56rem the old bar silently scrolled
              horizontally and the links ran off the edge. There the hamburger
              takes over and the same links live in the drop-down panel. */}
          <nav
            aria-label="Sections"
            className="ml-auto hidden shrink-0 items-center gap-[2px] min-[56rem]:flex"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                className={`caption px-step-2 py-step-1 whitespace-nowrap transition-colors duration-150 ${
                  active === section.id
                    ? "bg-ink text-paper"
                    : "text-ink-mid hover:text-ink"
                }`}
              >
                {section.label}
              </a>
            ))}
            <Link
              href="/arcade"
              className="caption px-step-2 py-step-1 whitespace-nowrap text-cyan-deep transition-colors duration-150 hover:text-print-cyan"
            >
              Arcade ↗
            </Link>
          </nav>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="section-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink text-ink min-[56rem]:hidden"
          >
            <span aria-hidden="true" className="relative block h-[10px] w-4">
              <span
                className={`absolute top-0 left-0 h-[2px] w-full bg-current transition-transform duration-150 motion-reduce:transition-none ${
                  open ? "translate-y-[4px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute top-[4px] left-0 h-[2px] w-full bg-current transition-opacity duration-150 motion-reduce:transition-none ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute top-[8px] left-0 h-[2px] w-full bg-current transition-transform duration-150 motion-reduce:transition-none ${
                  open ? "-translate-y-[4px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {/* The mobile panel. No elevation (DESIGN.md): it separates from the
            page with the same 2px rule the bar uses, nothing else. Rows are
            numbered § 01… like the openers they jump to. */}
        {open && (
          <nav
            id="section-menu"
            aria-label="Sections"
            className="absolute inset-x-0 top-full border-b-2 border-ink bg-paper min-[56rem]:hidden"
          >
            <div className="mx-auto flex max-w-spread flex-col px-step-5 py-step-3 sm:px-step-7">
              {sections.map((section, i) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={active === section.id ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={`caption flex items-baseline gap-step-3 px-step-2 py-step-3 transition-colors duration-150 ${
                    active === section.id
                      ? "bg-ink text-paper"
                      : "text-ink-mid hover:text-ink"
                  }`}
                >
                  <span aria-hidden="true" className="mono">
                    § 0{i + 1}
                  </span>
                  {section.label}
                </a>
              ))}
              <Link
                href="/arcade"
                onClick={() => setOpen(false)}
                className="caption mt-step-1 border-t-2 border-ink px-step-2 py-step-3 text-cyan-deep transition-colors duration-150 hover:text-print-cyan"
              >
                Arcade ↗
              </Link>
            </div>
          </nav>
        )}
      </header>

      <DotRail active={active} />
    </>
  );
}
