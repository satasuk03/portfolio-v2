---
name: Satasuk Viparksinlapin — Portfolio
description: The hangar. A field unit's HUD over a live survey map — hangar black, blue topographic contours, CBRPNK rounded cards in solid spot colours, and weathered cream enamel. `/` is the reading edition; `/play` is the playable one.
colors:
  void: "#040507"
  hull: "#0a0c10"
  graphite: "#1b1d22"
  bone: "#ece6d6"
  enamel: "#e2dccb"
  grey: "#c4c2b8"
  ink: "#101010"
  hud: "#e9e4d6"
  hud-dim: "#9d998f"
  orange: "#f2913d"
  yellow: "#ffc400"
  magenta: "#e8195b"
  cyan: "#1fc3ec"
  sage: "#9cc27f"
  blue: "#2f63e6"
  lcd: "#ff9a2e"
  contour-minor: "rgb(33 74 219)"
  contour-major: "rgb(77 143 255)"
typography:
  display:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 6.25rem)"
    fontWeight: 900
    lineHeight: 0.86
    textTransform: "uppercase"
  masthead:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(5.5rem, calc((100svh - 320px) / 4.8), 11rem)"
    fontWeight: 900
    lineHeight: 0.8
    writingMode: "vertical-rl (horizontal below 48rem)"
  hero-h1:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(2.35rem, 5.4vw, 5.25rem)"
    fontWeight: 900
    lineHeight: 0.9
    textTransform: "uppercase"
  title:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 2vw, 1.65rem)"
    fontWeight: 800
    lineHeight: 1.05
    textTransform: "uppercase"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem → 1rem from 40rem"
    fontWeight: 400
    lineHeight: 1.6
  lede:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.3vw, 1.1875rem)"
    lineHeight: 1.5
  hud-label:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  readout:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "clamp(2.4rem, 4.4vw, 3.6rem)"
    fontWeight: 700
    fontVariantNumeric: "tabular-nums"
  numeral:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(4.5rem, 8.5vw, 8rem)"
    fontWeight: 900
    lineHeight: 0.78
---

# The hangar

Rebuilt 2026-09-28 from the owner's four references, the same ones `/play` was built from: a black survey
poster (blue topographic contours, a giant vertical white masthead, HUD brackets, crosshairs, timecodes, a
TARGET LOCK box, ▲▼ triangles, a small blue label tag); a flat-lay of beige retro computers; a CBRPNK sheet
of rounded cards in solid orange, red, sage and grey with huge grotesk numerals, a ↗, barcodes and mono
specs; and a weathered, rust-chipped cream handheld with an orange LCD.

The previous world — the paper "game manual" with its Bayer-dither wave and dither-reveal mask — is
retired. Its code is deleted; git history has it.

## Overview

**Two editions, one world.** `/play` is the toy: a three.js field unit you load cartridges into. `/` is
the professional record a recruiter skims in thirty seconds and an engineer reads for fifteen minutes, so
on `/` the machine's furniture frames the record and never stands in front of it. Same palette, same
card system, same faces, same synthesised sound, same wear generator; `/` simply leaves out the 3D, the
bloom and the glow.

The first viewport is the survey poster: SATASUK as a vertical masthead down the left edge over the live
contour field, the role as the headline, the standfirst, the three links; on the right the ID-card photo
in the About orange and the play cartridge. Every section after it opens as a HUD readout and lays its
facts out on cards.

## Colors

### Ground
- **Void `#040507`** — the hangar floor, everywhere. Carries a static survey-cross tile (96px lattice,
  7.5% HUD) so the floor is never flat black.
- **Contours** — minor `rgb(33 74 219)`, major `rgb(77 143 255)`, only in the hero's live field.

### Stock (card fills)
- **Bone `#ece6d6`** and **Graphite `#1b1d22`** are the workhorses; **Grey `#c4c2b8`** and **Sage
  `#9cc27f`** are secondary stock.
- **Enamel `#e2dccb`** is the hard-surface plate, weathered at runtime.

### Module spots — one per section, owned by `src/content/nav.ts`
| Section | Spot | Where it appears |
|---|---|---|
| § 01 About | Orange `#f2913d` | Lead card, ID card, cartridge label |
| § 02 Skills | Yellow `#ffc400` | The AI & retrieval lead card |
| § 03 Experience | Magenta `#e8195b` | FIG tags and the dashed service rule only — never a body-text field |
| § 04 Work | Cyan `#1fc3ec` | The live product's card; also the primary action and "Current" |
| § 05 Personal | Sage `#9cc27f` | Lead project card |
| § 06 Off the clock | Grey `#c4c2b8` | Lead panel |
| Uplink | Bone `#ece6d6` | Console tag |

Each spot also colours its opener tag, its rail round, its tab when active, and the lock frame over its
cards.

### Signal
- **Status blue `#2f63e6`** — the one blue tag ("Open to remote roles"). Darker than `/play`'s `#3d7bff`
  so white type clears AA.
- **LCD `#ff9a2e`** with ink `#2a1203` — the cartridge window only.

### Measured contrast (WCAG 2.x)
| Pair | Ratio |
|---|---|
| HUD `#e9e4d6` on void | 16.1 |
| HUD-dim `#9d998f` on void (ledes, secondary) | 7.2 |
| HUD on graphite | 13.3 |
| Graphite dim `#a19d93` on graphite | 6.2 |
| Ink on bone / grey / sage / cyan / yellow / orange | 15.3 / 10.7 / 9.5 / 9.1 / 11.9 / 8.1 |
| Ink at 70% on orange (dim text on the lightest-dark spot) | 4.8 |
| Ink on magenta — **tags only, lifted** (`--spot-text-bg`, 12% toward white) | 4.3 → 4.8 |
| White on status blue | 5.2 |

### Named rules
- **The Spot Owns The Section Rule.** A section's spot appears in its own section and in its own
  navigation marks. It never decorates another section.
- **The Magenta Is A Tag Rule.** Magenta carries small type only when lifted, and never carries body copy.
- **The One Blue Rule.** Blue is the status tag and the contour field. Nothing else.

## Typography

Kanit (Cadson Demak, Bangkok) for display — its loopless-Thai-derived Latin is what gives 900 its squared
poster punch, and it sets the กรุงเทพฯ mark on the ID card. Archivo for prose. Azeret Mono for every HUD
label, date, count, coordinate and readout — measurement is the one job mono has.

### Hierarchy
- **Masthead** — SATASUK, vertical, sized from the viewport height so it fills the rail. Decorative
  (aria-hidden); the h1 opens with the full name for assistive tech.
- **Hero h1** — the role, uppercase, three lines at desktop.
- **Display** — section titles, uppercase, balanced, capped at 6.25rem.
- **Title / title-lg** — card headings. Company names use their own step (up to 5rem).
- **Lead** — the About lead paragraph in Kanit 700, sentence case.
- **Body / lede** — Archivo, 66ch measure.
- **HUD label / readout / numeral** — see front matter. Numerals are graphics and always aria-hidden;
  the number they show is printed elsewhere as text.

### Named rules
- **The Sentence Case Prose Rule.** Caps are for display, titles and HUD labels. Prose, quotes and the
  About lead are sentence case.

## Layout

- One container, `82.5rem`, with a `clamp(16px, 4vw, 56px)` gutter.
- Every section is a **bay**: a survey ruler mid-gap, the HUD opener (`§ 0N` tag in the spot · code ·
  ruled scale · `0N / 06` · ▼), the display title, the lede, then cards.
- **Cards are sized by their contents.** About: a 7-column lead beside 5 columns of readouts and the
  epigraph. Skills: a full-width lead, then cards whose `flex-grow` is their item count. Experience: one
  full-width card per company, roles two abreast from 75rem. Work: a double-width live card, two
  singles, a full-width client row. Personal: two wide, three narrow. Off the clock: one narrow, two
  wide. Never a grid of equals.
- Breakpoints: 48rem (phone → tablet: masthead turns horizontal), 64rem, 75rem (top-bar tabs, the section
  rail, three-column hero, two-column roles), 86rem (top-bar clock).

## Surfaces & depth

- **Cards**: solid fill, 24px radius, no border, no drop shadow. Graphite takes a 1px inset HUD hairline
  so it separates from the void. Depth comes from stock contrast, not elevation.
- **Plates** are the only elevated objects — a real offset shadow (`0 22px 44px -22px`), an inset top
  highlight and bottom lip, four screws, and the weathered enamel texture from `play/engine/weathering.ts`
  (cream paint over steel, rust chips at the edges, light grime streaks) generated once at idle time.
- **HUD furniture**: corner brackets, dashed reticle bracket, hazard hatch, ▲▼, barcodes (deterministic
  from a string), screws, the LCD's pixel grid and ghost segments.

## Motion

The one authored moment is the hero: the contour field inks outward from the right over ~2.4s, the
corner brackets snap in on an elastic, and the masthead decodes. After that, motion answers the visitor.

- **Contour field** — raw WebGL1, 30fps, pauses off screen and in background tabs. The pointer raises the
  terrain into a lens under a cyan reticle; a press drops a ripple through the lines.
- **Card landing** — as a card first enters: stretched in flight, a slight overshoot, a squash on landing,
  then an elastic settle. Wide cards squash less (amplitude scales with width). Chips in the lead cards
  pop in behind it.
- **Decode** — section titles resolve from glyph noise once, as an overlay over the real text.
- **Target lock** — hovering or keyboard-focusing a card snaps a bracket frame around it in its spot,
  with a decoded FIG label; the card takes a small bump. Pressing squashes it; release springs back.
  A soft sheen follows the cursor across the card.
- **Particles** — sparks and a ring from any press on something interactive; a few sparks off each
  opener's tag as it lands; up to eight motes orbiting the ID card while the hero is on screen.
- **Sound** — optional, off by default on every visit, one toggle in the top bar. `/play`'s synth: hover
  ticks, press clicks, a landing tick, decode chatter, a chirp on each opener, a low hangar bed.
  Until the visitor answers it, a callout hangs off SND ~0.7s into each visit (`sound-hint.tsx`) and
  stays through scrolling; "Not now", "Turn on" (or SND itself) and Escape answer it. It persists only
  the answer, never the sound state.
- **Rules.** Every effect is additive over complete server HTML: a card is hidden for its entrance only
  if it is below the fold when the controller starts. Tweens clear their transforms when done and new
  states overwrite old tweens — no looping jitter, no breathing. No CSS 3D flips. Native scroll only; the
  top bar's progress hairline is a CSS scroll-driven animation.
- **Reduced motion** keeps the lock frame (it answers the visitor) without its animation; drops reveals,
  decode, particles and the hero intro; freezes the contour field on one composed frame; drops the clock's
  frame digits. The reduced-motion CSS contains only durations.
- **Reduced motion must never change layout, only behaviour.** An earlier build switched a sticky layer to
  `position: absolute` under reduced motion; because the content below kept a `-100svh` margin to sit over
  that layer, removing it from flow shifted the whole chapter up a viewport and pushed the hero off the top
  of the document. Freeze what things *do*; leave the boxes alone.

## Do's and Don'ts

### Do:
- **Do** put facts on solid cards and let the HUD furniture sit around them.
- **Do** give every section a lead card in its spot and size the rest by their contents.
- **Do** keep every numeral, date, coordinate and count in Azeret Mono with `tabular-nums`.
- **Do** keep FIG designations stable; they are how interview notes point at a card.
- **Do** make every new effect additive, bounded (off screen = off) and reduced-motion aware.

### Don't:
- **Don't** add glow, bloom or neon to `/`. Glow is `/play`'s.
- **Don't** put three.js on `/`, or import anything that imports it.
- **Don't** set body copy on magenta, or white type on the status blue below 13px bold.
- **Don't** add a looping idle animation to content, or a colored `border-left` accent to a card.
- **Don't** build a grid of same-size cards, or put an eyebrow over every heading.
- **Don't** hijack scroll, add a smooth-scroll library, or gate content behind scroll depth. The
  30-second skimmer must reach every fact.
- **Don't** revive the retired worlds: the paper game manual, the dark instrument panel (console black,
  amber caution lamp), or the pink→mint gradient.
