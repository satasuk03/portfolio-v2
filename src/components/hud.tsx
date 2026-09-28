/*
 * The hangar's furniture — the small, repeated pieces every section is built
 * from. Server components, no state. The motion layer (hangar/fx.tsx) finds
 * them by data attributes, never by class name:
 *
 *   data-reveal         a card that lands with squash-and-stretch on entry
 *   data-decode         text that decodes into place on entry (overlay only —
 *                       the real text never leaves the DOM)
 *   data-lock="LABEL"   a card that takes the target-lock brackets on hover
 *                       or keyboard focus; data-color tints lock and sparks
 *
 * Nothing here hides anything. Every effect is added by the motion layer
 * after hydration, and only to things the visitor has not seen yet.
 */

import type { CSSProperties, ReactNode } from "react";
import type { Section } from "@/content/nav";
import { sections } from "@/content/nav";

/** The ↗ from the CBRPNK sheet. */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`arrow ${className}`}>
      <path d="M5 5h14v14h-3.2V10.5L6.3 20 4 17.7l9.5-9.5H5z" fill="currentColor" />
    </svg>
  );
}

/**
 * A barcode, deterministic from its value, so every card's code is stable
 * across builds. Decorative: the value is printed beside it where it matters.
 */
export function Barcode({ value, className = "" }: { value: string; className?: string }) {
  let h = 2166136261;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < 34; i++) {
    h ^= value.charCodeAt(i % value.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    const w = 1 + (h % 3);
    if ((h >> 3) % 3 !== 0) bars.push({ x, w });
    x += w + 1;
  }
  return (
    <svg viewBox={`0 0 ${x} 20`} preserveAspectRatio="none" aria-hidden className={`barcode ${className}`}>
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y={0} width={b.w} height={20} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Diagonal hazard hatch. */
export function Hatch({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`hatch ${className}`} />;
}

/** The four corner brackets of a HUD frame. */
export function Corners({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`corners ${className}`}>
      <i className="tl" />
      <i className="tr" />
      <i className="bl" />
      <i className="br" />
    </span>
  );
}

/** A pill tag. `tone` is a card class that sets its fill. */
export function Tag({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span className={`tag ${className}`} style={style}>
      {children}
    </span>
  );
}

/** A run of stack chips. */
export function StackRow({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`chips ${className}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/*
 * Renders copy that may carry a redaction bar. Content writes the bar as a
 * run of █ so it stays plain data; here each run is hidden from assistive tech
 * and replaced with spoken text, or a screen reader reads "full block" once per
 * character.
 */
export function Redacted({ text }: { text: string }) {
  return text.split(/(█+)/).map((part, i) =>
    part.startsWith("█") ? (
      <span key={i}>
        <span aria-hidden="true" className="redact">
          {part}
        </span>
        <span className="sr-only">name withheld</span>
      </span>
    ) : (
      part
    ),
  );
}

/** Card-stock class for a module spot colour, so a section's lead card and
 *  its opener tag can never drift from nav.ts. */
export function spotStyle(s: Section): CSSProperties {
  return { ["--spot" as string]: s.color };
}

/**
 * A section opener, as a HUD readout: the § tag in the module's spot, its
 * designation, a ruled scale with ticks, the position in the run, then the
 * title and lede. The id is nav.ts's — anchors and the scroll spy read it.
 */
export function SectionOpener({ section }: { section: Section }) {
  return (
    <header id={section.id} className="opener" style={spotStyle(section)}>
      <div className="opener-row">
        {/* Not aria-hidden: if the sequence is load-bearing enough to print, it
            is load-bearing enough to announce. */}
        <span className="tag tag-spot">§ {section.n}</span>
        <span className="hud-label">{section.code}</span>
        <span aria-hidden className="opener-scale" />
        <span aria-hidden className="hud-label hud-dim">
          {section.n} / {String(sections.length).padStart(2, "0")}
        </span>
        <span aria-hidden className="tri tri-down" />
      </div>
      <h2 id={`${section.id}-title`} className="display mt-step-4" data-decode>
        {section.title}
      </h2>
      <p className="measure lede mt-step-4">{section.lede}</p>
    </header>
  );
}
