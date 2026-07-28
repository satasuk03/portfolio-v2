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
 * STORY: Six sections in a fixed order — About, Skills, Experience, Work
 *   projects, Personal projects, Off the clock — then the closer. Numbering is
 *   real: 01…06 encodes reading order, not decoration.
 * FIRST VIEWPORT: RETRIEVAL knocked out of the paper with the three-ink dither
 *   wave moving through the letterforms; the sentence completes beneath it on
 *   an opaque sheet with the thesis line, the raw photo plate, and the two
 *   actions; role, location and availability on a keylined slip above.
 * FORM: The game manual. Brief-pinned by Ze over three rounds (light arcade →
 *   Japanese arcade print → structural intensity), so the direction roll was
 *   not run: a pinned direction beats the roll. Staging: native scroll,
 *   nothing gated.
 */

import { ActionLinks, Colophon } from "@/components/actions";
import { HeroPlate } from "@/components/hero-plate";
import { SectionOpener } from "@/components/manual";
import { SectionNav } from "@/components/nav/section-nav";
import { Reveal } from "@/components/reveal";
import { WaveCanvas, WaveRamp } from "@/components/wave/wave-field";
import {
  AboutFigure,
  ClientChips,
  ExperienceRecord,
  OffTheClock,
  PersonalProjects,
  SkillsTable,
  WorkProjectCards,
} from "@/components/sections";
import { closer, hero, home, profile } from "@/content/profile";

export default function Home() {
  return (
    <>
      <SectionNav />

      <main>
        {/* ── 00 · the hero: the knockout word over the dither wave ──────── */}
        <Hero />

        <WaveRamp seed={11} />

        {/* ── 01 · about ─────────────────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="about"
            seq="§ 01"
            title="About me"
            lede="The short version."
          />
          <AboutFigure />
        </Spread>

        <WaveRamp seed={19} />

        {/* ── 02 · skills ────────────────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="skills"
            seq="§ 02"
            title="Skills"
            lede="Grouped by what it's for, not by logo count. Everything here is something I've shipped with."
          />
          <SkillsTable />
        </Spread>

        <WaveRamp seed={27} />

        {/* ── 03 · experience ────────────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="experience"
            seq="§ 03"
            title="Work experience"
            lede="Grouped by company, newest first. Three companies, four roles, 2019 to now."
          />
          <ExperienceRecord />
        </Spread>

        <WaveRamp seed={43} />

        {/* ── 04 · work projects ─────────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="work"
            seq="§ 04"
            title="Work projects"
            lede="Three private codebases, kept short on purpose — the detail is interview material, not website copy."
          />
          <WorkProjectCards />
          <div className="mt-step-7">
            <ClientChips />
          </div>
        </Spread>

        {/* ── 05 · personal projects ─────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="personal"
            seq="§ 05"
            title="Personal projects"
            lede="Public, solo, hand-built. Every employer codebase above is private, so this is the only place you can read the actual code."
          />
          <PersonalProjects />
        </Spread>

        <WaveRamp seed={59} />

        {/* ── 06 · off the clock ─────────────────────────────────────────── */}
        <Spread>
          <SectionOpener
            id="off-the-clock"
            seq="§ 06"
            title="Off the clock"
            lede="Four things I do that aren't engineering."
          />
          <OffTheClock />
        </Spread>

        {/* ── the closer: an invitation, then LinkedIn, GitHub and Instagram ── */}
        <Spread>
          <Reveal>
            <h2 className="display text-ink">{closer.title}</h2>
            <p className="measure mt-step-4 body-copy text-ink-mid">
              {closer.body}
            </p>
            <ActionLinks className="mt-step-5" />
          </Reveal>
        </Spread>
      </main>

      <Colophon />
    </>
  );
}

/**
 * One column of the spread, at the shared rhythm.
 *
 * Both axes step down on mobile. Two adjacent Spreads stack their padding, so a
 * flat step-8 puts 13rem of paper between sections — fine at a boundary that
 * carries a WaveRamp, half a viewport of nothing at § 04 → § 05, which doesn't.
 */
function Spread({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-spread px-step-5 py-step-7 sm:px-step-7 sm:py-step-8">
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
          keyline: the field never sits behind copy. The min-height guarantees
          the wave a real share of the first viewport even now that the photo
          plate makes the sheet below tall enough to eat all the slack. */}
      <div className="relative z-10 flex min-h-[18svh] flex-1 flex-col px-step-5 pt-step-6 sm:px-step-7">
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

        <div className="mx-auto grid w-full max-w-spread gap-step-6 pt-step-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div>
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

          {/* The raw photograph — full tone, in a keylined plate, cut to the
              left column's height on desktop. Click it and it re-plates:
              HeroPlate carries the expand-and-dither toy. */}
          <HeroPlate />
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
