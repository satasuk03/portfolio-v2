/*
 * The manual's furniture. Every content container on the site is a *figure*: a
 * heavy ink frame with a mono tag sitting on its top-left corner, and an
 * optional caption under the bottom rule.
 *
 * The figure number is load-bearing, not decoration — prose elsewhere on the
 * page refers to figures by number, which is the whole reason a manual numbers
 * them. That is also why figures are not all the same size: a figure is sized by
 * its contents, so this is explicitly not a grid of equal cards.
 */

import type { ReactNode } from "react";
import { lampCopy, type LampState } from "@/content/systems";

type FigureProps = {
  /** Rendered as "FIG. 01". Referenced by prose, so it must be stable. */
  tag: string;
  /** Sits beside the tag on the frame's top rule. */
  label?: string;
  caption?: string;
  children: ReactNode;
  className?: string;
  /** Board tint for inset regions; paper is the default stock. */
  tone?: "paper" | "board";
};

export function Figure({
  tag,
  label,
  caption,
  children,
  className = "",
  tone = "paper",
}: FigureProps) {
  return (
    <figure className={className}>
      <div
        className={`frame relative ${
          tone === "board" ? "bg-board" : "bg-paper"
        }`}
      >
        {/* The tag straddles the top rule, the way a printed callout does. */}
        <div className="absolute -top-px left-0 flex translate-y-[-50%] items-center gap-step-2 pl-step-3">
          <span className="figure-tag bg-ink px-step-2 py-[0.2rem] text-paper">
            Fig. {tag}
          </span>
          {label && (
            <span className="caption bg-paper px-step-2 text-ink-mid">
              {label}
            </span>
          )}
        </div>

        <div className="px-step-4 pb-step-5 pt-step-6 sm:px-step-6 sm:pb-step-6">
          {children}
        </div>
      </div>

      {caption && (
        <figcaption className="readout-sm mt-step-3 text-ink-mid">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * A section opener. Deliberately not an eyebrow-over-every-heading: it pairs a
 * mono sequence with a display line and appears at most a handful of times.
 */
export function SectionOpener({
  seq,
  title,
  lede,
  id,
}: {
  seq: string;
  title: string;
  lede?: string;
  id?: string;
}) {
  return (
    <header id={id} className="mb-step-6 scroll-mt-step-7">
      <div className="flex items-baseline gap-step-4">
        {/* Cyan Deep, not Print Cyan: this is 11px type, and Print Cyan is only
            cleared for large text and UI. Not aria-hidden either — if the
            sequence is load-bearing enough to print, it is load-bearing enough
            to announce. */}
        <span className="figure-tag text-cyan-deep">{seq}</span>
        <div className="h-[2px] flex-1 bg-ink" aria-hidden />
      </div>
      <h2 className="display mt-step-4 text-ink">{title}</h2>
      {lede && (
        <p className="measure body-copy mt-step-4 text-ink-mid">
          {lede}
        </p>
      )}
    </header>
  );
}

const STATE_STYLE: Record<LampState, string> = {
  /* The Red Means Over Rule + The Ink Fill Rule — a state is a filled field
     with type knocked out of it, never a coloured hairline. */
  live: "bg-print-cyan text-paper",
  sunset: "bg-magenta text-paper",
  closed: "bg-halftone text-ink",
};

export function StateChip({ state }: { state: LampState }) {
  return (
    <span
      className={`figure-tag inline-block px-step-2 py-[0.2rem] ${STATE_STYLE[state]}`}
    >
      {lampCopy[state]}
    </span>
  );
}

/** The Yellow Is A Highlighter Rule — a marker stroke behind ink type. */
export function Marker({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-marker-yellow px-[0.15em] text-ink">{children}</mark>
  );
}

/** Diagonal speed stripes at a section boundary. Never behind prose. */
export function SpeedBreak({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`stripes h-step-4 border-y-2 border-ink opacity-90 ${className}`}
    />
  );
}

/** A run of ink-on-paper stack chips. */
export function StackRow({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-step-4 flex flex-wrap gap-step-2">
      {items.map((item) => (
        <li
          key={item}
          className="readout-sm border-2 border-ink px-step-2 py-[0.15rem] text-ink"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
