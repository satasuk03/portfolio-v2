/*
 * DIRECTION CONTRACT — home (/)
 *
 * THESIS: An engineer's record printed as the manual that came in the box. It
 *   refuses the portfolio hero-plus-equal-card-grid: containers are numbered
 *   figures sized by their contents, and the prose points at them by number.
 * OWN-WORLD: Near-white paper #FAFAF7, soft black ink, three spot inks used as
 *   whole fields. Heavy keylines, halftone dot fields, FIG-tagged frames. Kanit
 *   poster display, Archivo prose, Azeret Mono on every numeral. No shadow, no
 *   glow, no paper texture — the retro is structural.
 * STORY: Two retrieval systems on two different problem shapes, a platform that
 *   served 100k+ and is now sunset, the code you can actually read, an honest
 *   line about which codebase was agent-directed — then LinkedIn or GitHub.
 * FIRST VIEWPORT: RETRIEVAL knocked out of the paper with the three-ink dither
 *   wave moving through the letterforms; the sentence completes beneath it; role,
 *   location and availability above; both actions below the fold line on mobile.
 * FORM: The game manual. Brief-pinned by Ze over three rounds (light arcade →
 *   Japanese arcade print → structural intensity), so the direction roll was not
 *   run: a pinned direction beats the roll. Staging: native scroll, nothing
 *   gated.
 */

import Link from "next/link";
import { ActionLinks, Colophon, Topbar } from "@/components/actions";
import { Figure, Marker, SectionOpener, SpeedBreak } from "@/components/manual";
import { Reveal } from "@/components/reveal";
import { WaveCanvas } from "@/components/wave/wave-field";
import {
  ArcadeDoor,
  ClientSites,
  ProjectIndex,
  RetrievalFigures,
  ScalePanel,
  ServiceRecord,
} from "@/components/sections";
import { method } from "@/content/retrieval";
import { hero, home, profile } from "@/content/profile";

export default function Home() {
  return (
    <>
      <Topbar />

      <main>
        {/* ── the hero: the knockout word over the dither wave ────────────── */}
        <Hero />

        {/* ── the lead claim — rehomed from the deleted sticky chapter; step 4
               gives it its permanent place ────────────────────────────────── */}
        <section className="py-step-8">
          <RetrievalFigures />
        </section>

        <SpeedBreak />

        {/* ── the depth under the lead claim ─────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="scale"
            seq="§ 02"
            title="The platform underneath"
            lede="Before the retrieval work: four and a half years in one long-lived codebase, and sole ownership of the engine at the middle of it. The product is dead, so these figures are the evidence rather than a link."
          />
          {/* Home numbering: 00 hero · 01–02 retrieval · 03 scale · 04 method. */}
          <ScalePanel tag="03" />
        </Spread>

        <Spread>
          <SectionOpener
            seq="§ 03"
            title="Service record"
            lede="Newest first. Radiant carries the sunset mark because it is over; only XOXONA is live."
          />
          <ServiceRecord />
        </Spread>

        {/* ── the honest bit ─────────────────────────────────────────────── */}
        <Spread>
          <Reveal>
            <Figure tag="04" label="Method" tone="board">
              <h2 className="title text-ink">{method.title}</h2>
              <div className="measure mt-step-4 flex flex-col gap-step-4 body-copy text-ink-mid">
                {method.body.map((para) => (
                  <p key={para.slice(0, 24)}>{para}</p>
                ))}
              </div>
              <dl className="mt-step-6 grid gap-step-5 border-t-2 border-ink pt-step-4 sm:grid-cols-2">
                <div>
                  <dt className="caption text-cyan-deep">
                    What I can defend in an interview
                  </dt>
                  <dd className="title-sm mt-step-2 text-ink">
                    {method.defensible}
                  </dd>
                </div>
                <div>
                  <dt className="caption text-magenta">
                    What I will not claim
                  </dt>
                  <dd className="title-sm mt-step-2 text-ink">
                    {method.refused}
                  </dd>
                </div>
              </dl>
            </Figure>
          </Reveal>
        </Spread>

        <SpeedBreak />

        {/* ── inspectable code ───────────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="work"
            seq="§ 05"
            title="Public work"
            lede="Solo, hand-built, readable. Every employer codebase above is private, so this is the only place the actual code is."
          />
          <ProjectIndex />
        </Spread>

        <Spread>
          <SectionOpener seq="§ 06" title="Shipped for other people" />
          <ClientSites />
        </Spread>

        {/* ── the long version ───────────────────────────────────────────── */}
        <Spread>
          <Reveal>
            <div className="frame flex flex-wrap items-center justify-between gap-step-5 bg-paper px-step-5 py-step-6 sm:px-step-7">
              <div>
                <p className="title text-ink">
                  Three incidents, written up in full.
                </p>
                <p className="measure mt-step-3 body-copy text-ink-mid">
                  What broke, how it was diagnosed, and what changed as a result
                  — including{" "}
                  <Marker>
                    the singleton that leaked a connection pool across every
                    worker pod
                  </Marker>
                  .
                </p>
              </div>
              <Link
                href="/log"
                className="caption inline-flex items-center gap-step-2 bg-ink px-step-5 py-step-3 text-paper transition-colors duration-150 hover:bg-print-cyan"
              >
                Open the log
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </Spread>

        {/* ── the door ───────────────────────────────────────────────────── */}
        <Spread>
          <ArcadeDoor />
        </Spread>
      </main>

      <Colophon />
    </>
  );
}

/** One column of the spread, at the shared rhythm. */
function Spread({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-spread px-step-5 py-step-8 sm:px-step-7">
      {children}
    </section>
  );
}

/**
 * The first viewport, built as three stacked bands over one wave canvas:
 *
 *   [ open field ] transparent — the wave is seen plainly
 *   [ the word   ] paper with the word cut out — the wave shows through it
 *   [ sentence   ] opaque paper — occludes the wave
 *
 * The canvas is absolutely positioned behind all three bands, so the sheet
 * reads as covering the lower half of the hero with the headline cut out of
 * its top edge. Scrolling simply carries the sheet away — no scroll wiring.
 *
 * Two things had to be deliberate. The word's band is sized by an invisible copy
 * of the word rather than by a viewport percentage: a percentage measured against
 * the viewport does not line up with content laid out in flow, and the two
 * silently collide. And the hero's min-height subtracts the running head, or a
 * full-height first viewport overflows the fold by exactly the bar's height.
 */
function Hero() {
  return (
    <div className="relative flex min-h-[calc(100svh-var(--topbar-h)-var(--topbar-rule))] flex-col">
      {/* The dither wave, full-bleed behind all three bands. Absolute, not
          sticky — the field belongs to the hero alone. */}
      <WaveCanvas className="absolute inset-0 h-full w-full" />

      {/* All the slack sits here, above the word, and this band is transparent so
          the wave fills it — otherwise a phone opens on several hundred pixels
          of blank paper, and the field is the reason to look. The running head
          is the one element in this band, so it gets its own paper sheet with a
          keyline: the field never sits behind copy. */}
      <div className="relative z-10 flex flex-1 flex-col px-step-5 pt-step-6 sm:px-step-7">
        <div className="mx-auto w-full max-w-spread">
          <p className="caption frame-inner inline-block bg-paper px-step-3 py-step-2 text-ink-mid">
            {profile.name}
            <span aria-hidden className="text-halftone">
              {" · "}
            </span>
            {profile.role}
            <span aria-hidden className="text-halftone">
              {" · "}
            </span>
            {profile.location}
            <span aria-hidden className="text-halftone">
              {" · "}
            </span>
            <span className="text-cyan-deep">{profile.availability}</span>
          </p>
        </div>
      </div>

      {/* The band the wave is seen through. The invisible word sets its
          height; the SVG overlays it and centres the real glyphs on the same box. */}
      <div className="relative shrink-0">
        <span aria-hidden className="display-giant invisible block">
          {hero.word}
        </span>
        <KnockoutWord word={hero.word} />
      </div>

      <div className="relative z-10 shrink-0 bg-paper px-step-5 pb-step-6 pt-step-4 sm:px-step-7">
        <div className="mx-auto w-full max-w-spread">
          <p className="figure-tag text-ink-mid">{hero.figureCaption}</p>
        </div>

        <div className="mx-auto w-full max-w-spread pt-step-6">
          <h1>
            {/* The knocked-out word is decorative SVG, so the whole sentence
                lives here once, in full, for assistive tech and for search. */}
            <span className="sr-only">{hero.spoken}</span>
            <span aria-hidden className="title block text-ink">
              {hero.tail}
            </span>
          </h1>

          <p className="measure mt-step-4 body-copy text-ink">
            {home.standfirst}
          </p>

          <ActionLinks className="mt-step-5" />
        </div>
      </div>
    </div>
  );
}

/**
 * The giant word, knocked out of a sheet of paper so the dither wave behind it
 * shows through the letterforms only.
 *
 * Implemented as an in-document SVG mask, and the alternatives were tried first:
 * `background-clip: text` cannot use a live canvas as its paint source, and a
 * `mask-image` data-URI cannot load the webfont. An in-document SVG mask has
 * neither problem — the glyphs are real text in the real Kanit face, SVG masking
 * is SVG 1.1 so support is universal, and the type still reflows with the CSS
 * clamp because no viewBox is involved. The mask is renderer-agnostic: the
 * canvas behind it was swapped from WebGL to the wave without touching this.
 */
function KnockoutWord({ word }: { word: string }) {
  /* Shared by both mask and outline, so the hole and the stroke can never
     drift apart. */
  const glyph = {
    className: "display-giant",
    x: "50%",
    y: "50%",
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
  };

  return (
    /* Bleeds a hair past the band so subpixel flex rounding cannot leave a seam
       of bare canvas between this sheet and the opaque bands either side. */
    <svg
      aria-hidden
      className="absolute inset-x-0 -bottom-px -top-px h-[calc(100%+2px)] w-full"
    >
      <defs>
        {/* Everywhere except the letters. */}
        <mask id="hero-knockout" maskContentUnits="userSpaceOnUse">
          <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
          <text {...glyph} fill="#000">
            {word}
          </text>
        </mask>
      </defs>

      {/* The sheet. The wave itself fills the letterforms — a dithered field is
          dense enough to read as type, where the old wireframe needed a halftone
          overlay to give the glyphs mass. */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="var(--color-paper)"
        mask="url(#hero-knockout)"
      />

      {/* An ink outline last, so the word is unambiguous whatever is behind it. */}
      <text
        {...glyph}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={2.5}
      >
        {word}
      </text>
    </svg>
  );
}
