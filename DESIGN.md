---
name: Satasuk Viparksinlapin — Portfolio
description: A 1990s Japanese game manual — cream stock, heavy black keylines, three screaming spot inks, and a wireframe figure that turns as you read.
colors:
  paper: "#F2EFE6"
  board: "#E6E1D2"
  ink: "#14120E"
  ink-mid: "#4A4640"
  halftone: "#B8B2A2"
  print-cyan: "#0A7C93"
  cyan-deep: "#08657A"
  spot-red: "#E8332F"
  marker-yellow: "#F5C518"
  arcade-void: "#0A0812"
  arcade-cyan: "#37E6FF"
  arcade-magenta: "#FF2E6B"
  arcade-gold: "#FFCB2B"
  arcade-green: "#38F5A8"
  arcade-text: "#F0EDFF"
typography:
  display:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 9vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.03em"
    textTransform: "uppercase"
  display-giant:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(3rem, 15.5vw, 16rem)"
    fontWeight: 900
    lineHeight: 0.82
    letterSpacing: "-0.045em"
    textTransform: "uppercase"
  title:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    textTransform: "uppercase"
  title-small:
    fontFamily: "Kanit, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    textTransform: "uppercase"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  body-wide:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.09em"
    textTransform: "uppercase"
  figure-tag:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.12em"
    textTransform: "uppercase"
  readout:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariantNumeric: "tabular-nums"
  readout-small:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    fontVariantNumeric: "tabular-nums"
  arcade-heal:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
  arcade-damage:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
  arcade-cooldown:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
  arcade-damage-crit:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
rounded:
  none: "0px"
  chip: "999px"
keyline:
  hair: "1px"
  rule: "2px"
  frame: "3px"
  heavy: "5px"
spacing:
  step-1: "0.25rem"
  step-2: "0.5rem"
  step-3: "0.75rem"
  step-4: "1rem"
  step-5: "1.5rem"
  step-6: "2.5rem"
  step-7: "4rem"
  step-8: "6.5rem"
components:
  figure-frame:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.ink}"
    borderWidth: "{keyline.frame}"
    rounded: "{rounded.none}"
  figure-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.figure-tag}"
    padding: "0.25rem 0.5rem"
  board-panel:
    backgroundColor: "{colors.board}"
    borderColor: "{colors.ink}"
    borderWidth: "{keyline.rule}"
    textColor: "{colors.ink}"
  action-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.caption}"
    padding: "0.875rem 1.5rem"
    rounded: "{rounded.none}"
  action-primary-hover:
    backgroundColor: "{colors.print-cyan}"
  action-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    borderWidth: "{keyline.rule}"
    typography: "{typography.caption}"
    padding: "0.875rem 1.5rem"
  marker:
    backgroundColor: "{colors.marker-yellow}"
    textColor: "{colors.ink}"
  state-live:
    backgroundColor: "{colors.print-cyan}"
    textColor: "{colors.paper}"
  state-sunset:
    backgroundColor: "{colors.spot-red}"
    textColor: "{colors.paper}"
  state-closed:
    backgroundColor: "{colors.halftone}"
    textColor: "{colors.ink}"
---

# Design System: Satasuk Viparksinlapin — Portfolio

## Overview

**Creative North Star: "The Game Manual"**

The printed booklet that came in the box — a late-80s/early-90s Japanese game manual or arcade flyer, the kind
whose spreads mixed dense technical diagrams with violently saturated spot colour. Cream uncoated stock. Heavy
black keylines boxing everything. Numbered figures with callout labels. Halftone dot fields where a photograph was
too expensive to print. Diagonal speed stripes. And in the middle of the spread, a wireframe cutaway of the
machine, rotating as you turn the page.

The subject is an engineer whose record is retrieval systems, a quest engine he owned end to end, and the
incidents that taught him how it breaks. A manual is exactly the artifact that material wants to be: it explains a
system to someone about to operate it, it is unembarrassed about density, and it is *fun* without being frivolous.
Numbered figures are load-bearing here rather than an eyebrow motif — a figure number exists so the prose can point
at the diagram.

This world is **loud**. That is the point, and it is where the execution risk sits. Cream paper plus a tasteful
serif is a different, much safer world that this is not; the manual's own materials are chunky poster type, ink that
covers whole panels, and colour used at full strength. Restraint here comes from *how few* moves are in the system,
never from turning any of them down.

**Structural, not costume.** The retro lives in the palette, the type, the keylines, the halftone and the wireframe
rendering. There is no paper texture image, no scanline overlay, no CRT curvature, no chromatic fringing, no faked
ink misregistration. Those are filters applied to a design; this is a design.

Two confirmed anti-references: the instrument-panel world this replaced (console black, engraved hairlines, amber
caution lamp), and before it a hot-pink-to-mint gradient with a terminal boot animation. Also refused:
near-black-plus-one-neon-accent with glowing edges, where generated interfaces land by default — this site goes
dark in exactly one room and pays for the privilege with a metaphor.

**Key Characteristics:**
- Cream ground, black keylines, three spot inks used at full strength across whole fields
- Everything is boxed: content lives inside framed figures tagged in the corner
- Halftone dots do the work a photograph would, and double as the mask language
- The 3D figure is *drawn*, not rendered — black wireframe on cream, like a technical cutaway
- Display type is heavy, condensed, uppercase, and set large enough to crop
- One authored motion moment: the figure turns as you scroll. Nothing else drifts.

## Colors

Newsprint cream, one soft black, three spot inks. The spots are *inks*: they fill regions and knock type out of
themselves. They are not accents sprinkled over a neutral.

### Primary
- **Ink** (`#14120E`): a soft black, never `#000`. Every keyline, every frame, all display type, all body text. The most-used value in the system by a wide margin.
- **Paper** (`#F2EFE6`): warm uncoated cream. The ground of every surface except the arcade.

### Secondary
- **Print Cyan** (`#0A7C93`): the working accent. Wireframe edges, figure keylines, active navigation, the live state, hover fills. **Large text and UI only.** For cyan at body size or below use **Cyan Deep** (`#08657A`).
- **Spot Red** (`#E8332F`): the terminated state, and the one loud panel. Large text and fills only. Ink knocked out of red clears AA at large sizes, so red panels carry ink type, never paper type at small sizes.
- **Marker Yellow** (`#F5C518`): a highlighter. **Fill only, never type.** Ink on yellow is the most legible pair in the system, which is exactly what makes it the emphasis device.

### Neutral
- **Board** (`#E6E1D2`): one step down from paper. Panel fills, table stripes, inset regions. Every ratio drops slightly on board, so it gets its own column below.
- **Ink Mid** (`#4A4640`): secondary prose and captions.
- **Halftone** (`#B8B2A2`): dot fields, ticks, hairline rules, and the closed/archived state. Never sets type of any size.

### Measured contrast

Computed for the pairs actually shipped, on both grounds. `AA` needs `4.5:1` for body and `3:1` for large text
(≥24px, or ≥18.66px bold).

| Foreground | on Paper `#F2EFE6` | on Board `#E6E1D2` | Cleared for |
|---|---|---|---|
| Ink `#14120E` | `16.3:1` | `14.3:1` | everything |
| Ink Mid `#4A4640` | `7.8:1` | `6.9:1` | everything |
| Cyan Deep `#08657A` | `5.7:1` | `5.0:1` | everything |
| Print Cyan `#0A7C93` | `4.2:1` | `3.7:1` | **large text and UI only** |
| Spot Red `#E8332F` | `3.7:1` | `3.3:1` | **large text and fills only** |
| Halftone `#B8B2A2` | `1.8:1` | `1.7:1` | **never type** |
| Marker Yellow `#F5C518` | `1.4:1` | `1.3:1` | **never type — fill only** |
| Ink on Spot Red | `4.4:1` | — | large text on a red fill |
| Ink on Marker Yellow | `11.5:1` | — | everything |
| Paper on Ink | `16.3:1` | — | everything |

Print Cyan failing body size is the one that bites: `figure-tag` is 11px, so tags and sequence numbers take Cyan
Deep. Anything new goes in this table before it ships.

### Arcade (one room only)
`/arcade` inverts: **Void** (`#0A0812`) ground with **Neon Cyan** (`#37E6FF`), **Neon Magenta** (`#FF2E6B`),
**Gold** (`#FFCB2B`), **Neon Green** (`#38F5A8`) and **Arcade Text** (`#F0EDFF`). Glow, bloom and saturation are
permitted here and nowhere else. This is one colour identity at a second calibration, not a second brand: print
cyan and neon cyan are the same idea under different light.

### Named Rules
- **The Two Calibrations Rule.** Every hue exists twice — a print value for paper, a neon value for the arcade. Never use a neon value on paper or a print value in the arcade.
- **The Ink Fill Rule.** A spot colour either fills a whole region or does not appear. No 1px coloured accent bars, no tinted text on tinted grounds, no spot colour as a hover tint on a neutral surface.
- **The Yellow Is A Highlighter Rule.** Marker Yellow is only ever a fill behind ink type, at roughly the size of a marker stroke. Never a border, never type, never a large field.
- **The Red Means Over Rule.** Spot Red marks what has ended — sunset products, faults, closed roles. It is not a general-purpose accent, and a live system may never carry it.

## Typography

Three families, each with one job. Display is a poster face, body is a workhorse grotesque, numerals get a squared
mono because a manual's tables and scores are set in one.

- **Kanit** (800 / 900) — display, titles, giant masked type, figure numbers. From Cadson Demak, a Bangkok foundry;
  its Latin derives from loopless Thai letterforms, which gives the heavy weights a squared, poster-ready punch a
  standard condensed grotesque lacks. The subject is a Thai engineer, so the face has a reason beyond its shape.
- **Archivo** (400 / 500 / 600) — all running prose, labels, captions, navigation. Enough width range to stay
  readable at length while sitting comfortably beneath very heavy display type.
- **Azeret Mono** (500 / 700) — every numeral, stat, coordinate, figure tag, score and unit. Squared and
  industrial; reads like a scoreboard.

### Hierarchy
`display-giant` (masked hero type, cropped) → `display` (section openers) → `title` (figure and entry titles) →
`title-small` (list entries, running head) → `body` → `body-small` → `caption` (tracked uppercase, sparingly) →
`figure-tag` (mono, in a frame's corner).

Prose ships as one utility, `.body-copy`, which is `body` (`0.9375rem`) on a phone and `body-wide` (`1rem`) from
`40rem` up. Use it rather than writing either literal — the responsive step is the ramp, not two separate sizes.

The four `arcade-*` steps exist only for floating combat numerals in `/arcade`. Damage, crit, heal and cooldown are
sized against each other so a crit reads as roughly half again the size of a normal hit; they never appear on paper.

### Named Rules
- **The Mono Owns Measurement Rule.** Numerals, units, dates, sequence numbers, stats and scores are Azeret Mono with `tabular-nums`. Prose is never mono, and mono never carries a sentence. Mono is not a costume for "technical".
- **The Crop Rule.** `display-giant` is set large enough that its frame may optically crop it. It is a printed headline, not a centred hero line — it can bleed off an edge, and it should.
- **The Uppercase Ceiling Rule.** Uppercase belongs to display, titles, captions and tags. Body copy is sentence case always.
- **The No Eyebrow Grammar Rule.** A tracked uppercase kicker above a heading appears at most twice per page, and only where it names something. The figure tag does that job structurally and makes the eyebrow redundant.

## Layout

- 12-column grid inside a `max-width: 82.5rem` (1320px) spread, generous outer margin, `1.5rem` gutter.
- **Everything is boxed.** The primary container is a *figure*: a `3px` ink frame with a mono tag sitting on its
  top-left corner and an optional caption below the bottom rule. Figures nest at most one level, and the inner
  frame drops to `2px`.
- Rule weight carries meaning: `1px` halftone for table dividers, `2px` ink for panel edges and section breaks,
  `3px` ink for figure frames, `5px` ink for the top-of-page and end-of-page anchors.
- Eight-step spacing scale. More space above a heading than below it, always. A dense figure earns the quiet band
  that follows it.
- Prose measure caps at `68ch`. Tables and figures may run the full spread.

## Elevation & Depth

There is no elevation. This is printed matter: ink either sits on the paper or it does not. Depth comes from
keyline weight, from the single tonal step between paper and board, and from halftone density. **No `box-shadow`,
no blur, no glass, no glow — on paper.** The arcade room is the sole exception and uses glow deliberately, because
a CRT emits light and paper does not.

## Halftone & Pattern

The manual's substitute for a photograph, and this site's mask language.

- **Dot field:** a tiled `radial-gradient` of halftone dots. Density encodes emphasis — a coarser dot reads as more
  ink. Used as section fills, figure backgrounds, and the reveal mask.
- **Bayer dither:** an ordered 4×4 dither driving the hero figure's scroll transitions and the wireframe's state
  changes. This is the signature transition: content resolves from dots into solid, the way a printing plate inks
  up.
- **Speed stripes:** diagonal `repeating-linear-gradient` bars at 45°, ink on paper or knocked out of a spot fill.
  Section boundaries and the arcade entrance. Never behind body copy.

## Motion

One authored moment plus fast functional feedback. Nothing loops, breathes, or parallaxes for decoration.

- **The turning figure.** A sticky chapter holds the wireframe figure while the reader scrolls; scroll progress
  drives its rotation and the camera dolly, and each narrative beat resolves through a Bayer-dither mask. This is
  the site's only choreography, and it is scroll-scrubbed, never autoplaying.
- **Native scroll only.** No smooth-scroll hijacking, no scroll library, no pinned-viewport-with-spacers
  architecture. Sticky positioning plus a scroll-progress value. Find-in-page, anchor links and keyboard scrolling
  all keep working.
- Functional transitions settle in `120–180ms` on an exponential ease-out, from an already-visible default.
- Under `prefers-reduced-motion` the figure freezes on one composed frame (the at-rest angle, not a mid-chapter
  one), every dither reveal is fully inked, and the hero's open field takes a paper fill so the drawing is seen
  only through the letterforms. The page loses its choreography and keeps all of its content.
- **Reduced motion must never change layout, only behaviour.** An earlier build switched the sticky figure layer to
  `position: absolute` under reduced motion; because the content below keeps a `-100svh` margin to sit over that
  layer, removing it from flow shifted the whole chapter up a viewport and pushed the hero off the top of the
  document. Freeze what things *do*; leave the boxes alone.

## Do's and Don'ts

### Do:
- **Do** box content in framed figures with a mono tag, and let nearby prose reference the figure number.
- **Do** use spot inks as whole fields with type knocked out of them.
- **Do** set display type large enough to crop against its frame.
- **Do** put every numeral, unit and date in Azeret Mono with `tabular-nums`.
- **Do** use halftone density and Bayer dither as the transition and mask language.
- **Do** mark Radiant with Spot Red and past-tense copy; only XOXONA may carry the live cyan state.
- **Do** keep the arcade's neon strictly inside `/arcade`, and make entering it feel like a door.

### Don't:
- **Don't** apply a paper texture image, scanlines, CRT curvature, chromatic fringing or faked misregistration. The retro is structural.
- **Don't** use `box-shadow`, blur, glass or glow anywhere on the paper surface.
- **Don't** set Marker Yellow as type or as a border, and don't set body copy in Print Cyan — use Cyan Deep.
- **Don't** put a spot colour on a 1px accent bar or use it as a decorative hover tint. Inks fill regions.
- **Don't** let Spot Red touch a live system, or Print Cyan mark something that has ended.
- **Don't** build a grid of same-size icon-heading-text cards. The figure frame is the container, and figures differ in size because their contents differ.
- **Don't** put a tracked uppercase eyebrow above every section; the figure tag already does that job.
- **Don't** reintroduce the instrument-panel world (console black, engraved hairlines, amber caution lamp) or the terminal-boot conceit. Both are spent.
- **Don't** hijack scroll, add a smooth-scroll library, or gate content behind scroll depth. The 30-second skimmer must reach every fact.
