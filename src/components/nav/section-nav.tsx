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

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex h-[var(--topbar-h)] max-w-spread items-center gap-step-4 overflow-x-auto px-step-5 sm:px-step-7">
          <Link href="/" className="title-sm shrink-0 text-ink">
            {profile.name}
          </Link>

          <nav
            aria-label="Sections"
            className="ml-auto flex shrink-0 items-center gap-[2px]"
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
        </div>
      </header>

      <DotRail active={active} />
    </>
  );
}
