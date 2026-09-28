"use client";

/*
 * THE SECTION NAV — the sticky HUD bar plus the section rail, reading from ONE
 * scroll-driven computation over the six section openers: the active section
 * is the last opener above the reading line. The bar is the real navigation
 * (aria-current on the active tab); the rail is decorative and receives the
 * same state.
 *
 * Computed on scroll (rAF-throttled) rather than from an IntersectionObserver:
 * an observer with a narrow band only notifies on crossings, which leaves the
 * active tab stale across instant anchor jumps and fast flicks that skip the
 * band entirely.
 *
 * Anchor links, not scroll hijacking — find-in-page, keyboard scroll and deep
 * links keep working. The openers carry scroll-margin-top, so anchors never
 * land under the bar. No smooth scrolling anywhere.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Arrow } from "@/components/hud";
import { Clock } from "@/components/hangar/clock";
import { SoundToggle } from "@/components/hangar/sound-toggle";
import { hudCopy } from "@/content/hud";
import { profile } from "@/content/profile";
import { sections } from "@/content/nav";
import { SectionRail } from "./section-rail";

export function SectionNav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const line = () => window.innerHeight * 0.22;
    const update = () => {
      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line()) current = section.id;
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

  /* Escape closes the mobile menu. Link clicks close it too (below). */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const activeSection = sections.find((s) => s.id === active);

  return (
    <>
      <header className="topbar" style={activeSection ? { ["--spot" as string]: activeSection.color } : undefined}>
        <div className="topbar-in">
          <Link href="/" className="topbar-name">
            {profile.name}
          </Link>

          {/* Inline tabs only where they fit; below 64rem the menu button takes
              over and the same links live in the drop-down panel. */}
          <nav aria-label="Sections" className="topbar-tabs">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                className="topbar-tab"
                style={{ ["--spot" as string]: section.color }}
                data-lock={`§ ${section.n} ${section.code}`}
                data-color={section.color}
              >
                <span className="topbar-tab-n">{section.n}</span>
                {section.label}
              </a>
            ))}
          </nav>

          <div className="topbar-tools">
            <span className="topbar-clock hud-label">
              <span className="hud-dim">{hudCopy.zone}</span> <Clock />
            </span>
            <SoundToggle />
            <Link href="/play/" className="hud-btn hud-btn-play" data-color="#f2913d">
              <span className="hud-label">{hudCopy.playEntry.short}</span>
              <Arrow />
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="section-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="hud-btn topbar-menu"
            >
              <span aria-hidden="true" className="burger" data-open={open ? "true" : "false"}>
                <i />
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>

        {/* Section progress: a hairline under the bar in the active spot. */}
        <span aria-hidden className="topbar-progress" />

        {open && (
          <nav id="section-menu" aria-label="Sections" className="topbar-panel">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                onClick={() => setOpen(false)}
                className="topbar-panel-link"
                style={{ ["--spot" as string]: section.color }}
              >
                <span className="tag tag-spot">§ {section.n}</span>
                <span className="topbar-panel-label">{section.label}</span>
                <span aria-hidden className="hud-label hud-dim">
                  {section.code}
                </span>
              </a>
            ))}
            <Link href="/play/" className="topbar-panel-link topbar-panel-play" onClick={() => setOpen(false)}>
              <span className="tag tag-spot" style={{ ["--spot" as string]: "#f2913d" }}>
                {hudCopy.unit}
              </span>
              <span className="topbar-panel-label">{hudCopy.playEntry.title}</span>
              <Arrow />
            </Link>
          </nav>
        )}
      </header>

      <SectionRail active={active} />
    </>
  );
}
