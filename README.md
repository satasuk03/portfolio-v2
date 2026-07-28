# portfolio-v2

The personal site of Satasuk Viparksinlapin — AI Engineer, Bangkok. A static, two-route Next.js app
built as a printed game manual: near-white paper, heavy ink keylines, FIG-numbered figure frames, and
three spot inks used as whole fields.

Everything on the page is either type, a keyline, or a dithered canvas. There are no images beyond one
photograph, no UI library, and no runtime dependencies past React itself.

**Stack:** Next.js 15.5.4 (App Router, `output: "export"`) · React 19 · TypeScript (strict) ·
Tailwind CSS v4 (CSS-first, no config file) · Kanit / Archivo / Azeret Mono via `next/font`.

## Running it

Node 24.15, pnpm 10.33.

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm build               # static export → out/
pnpm exec tsc --noEmit   # typecheck
```

`pnpm build` writes a fully static site to `out/`, deployable to any static host. There is no server
component to run — no API routes, no runtime image optimization, no dynamic OG generation.

## Layout

```
src/app/          two routes: / (the manual) and /arcade (a boss battle)
  globals.css     the design tokens — @theme block, type utilities, the dither reveal
src/content/      all copy and data, as typed constants. No JSX in this directory.
src/components/
  manual.tsx      Figure, SectionOpener, Marker — the container primitives
  sections.tsx    one renderer per home section
  wave/           the Bayer-dither wave: field.ts is the engine, wave-field.tsx the wrapper
  arcade/         NEXUS-9: engine.ts is the turn logic, battle.tsx the rendering
  nav/            sticky section bar and dot rail, driven by one scroll computation
```

Copy lives in `src/content/` and layout lives in `src/components/` — the two are kept apart so text can
change without touching markup. The wave and the battle are both framework-free modules with thin React
wrappers around them, so neither runs its loop through React state.

### The wave

The field behind the hero word, and the ramps between sections, are one animated surface: three summed
sines thresholded through an ordered Bayer-8 dither into four levels — bare paper, yellow, cyan,
magenta. A single shared 30fps clock drives every canvas on the page, painting only what is on screen,
pausing on tab blur, and rendering one still frame under `prefers-reduced-motion`. The hero word itself
is an in-document SVG mask, so the live field shows through the letterforms.

## Design system

`DESIGN.md` documents the visual system — the figure-frame container, rule weights, the eight-step
spacing scale, the type hierarchy, and the halftone vocabulary. Note that its front-matter colour values
predate the current palette; the tokens actually in use are the `@theme` block in `src/app/globals.css`.

`PRODUCT.md` records who the site is for and what it may claim. `REDESIGN-PLAN.md` and `HANDOFF.md` are
the working notes behind the current build.

Guidance for AI coding agents is in `CLAUDE.md` (`AGENTS.md` symlinks to it).
