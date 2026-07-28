# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Never run `next build` while `next dev` is running.** It corrupts `.next` and produces impossible
results. Stop the dev server first.

```bash
pnpm dev                 # next dev
pnpm build               # next build → static export into out/
pnpm exec tsc --noEmit   # the only working verification loop in this repo
```

Toolchain is Node 24.15 / pnpm 10.33 — **pnpm only, no bun.**

- **`pnpm lint` is broken.** The script is a bare `eslint`, and there is no eslint dependency and no
  eslint config in the tree; it fails with `command not found`. Either wire it up or don't rely on it.
- **There is no test framework.** No runner, no test files. `tsc --noEmit` is the check that exists.
- `pnpm start` is not usable: `output: "export"` means there is no server to start. `pnpm build` emits
  `out/`; serve that directory with any static server.

## The document layer is partly stale — read this before trusting it

There are five planning documents at the repo root and one under `.impeccable/`. The Direction A
redesign (git history, `936887d` back to `9038681`) shipped and **`REDESIGN-PLAN.md` §9 — the list of
doc amendments to make afterwards — was never applied.** So:

**The source of truth for design tokens is the `@theme` block in `src/app/globals.css`,** nothing else.
Near-white paper `#fafaf7`, board `#efeee7`, soft-black ink `#111111`, and three spot inks — print-cyan
`#0092b8` / cyan-deep `#006e88`, magenta `#e8195b`, marker-yellow `#ffc400`. **One calibration:**
`/arcade` shares the paper palette. There is no glow anywhere and no dark surface on the site.

| Document | Trust it for | Do not trust |
|---|---|---|
| `DESIGN.md` | Figure-frame container system, rule weights, the eight-step spacing scale, type hierarchy and its named rules, halftone vocabulary, "there is no elevation", the whole Do/Don't list, and the reduced-motion layout-bug paragraph. | Every colour in the front matter (cream `#F2EFE6`, `spot-red`, the `arcade-*` neon block). **The Two Calibrations Rule and The Red Means Over Rule are dead.** The "turning figure" motion section — that renderer was deleted with three.js. |
| `PRODUCT.md` | Audience, positioning, and the editorial rules below — all non-negotiable. | Brand Commitments (still the cream palette + dark arcade) and the quoted accessibility ratios. |
| `HANDOFF.md` | §4 landmines and §5 "things that will bite you" still hold. §8 open decisions are still open. | §0 — the repo is under version control now. **§6 predates the redesign**: three.js and `src/components/figure/`, `ScalePanel`, both `/log` links, `src/content/incidents.ts` and "`public/` is empty" are all wrong now. |
| `REDESIGN-PLAN.md` | The rationale behind what shipped, especially §1 (the wave's two failure modes). | §7's build order is finished. §9 is **outstanding work**, not history. |
| `.impeccable/surfaces/src-app-page-tsx.md` | Audience and reading-mode framing. | Stale throughout — it references `/log` (deleted), a dark `/arcade`, the `RETRIEVAL` hero word, and a wireframe geodesic that no longer exists. |

The current, accurate per-route intent lives in the `DIRECTION CONTRACT` header comments at the top of
`src/app/page.tsx` and `src/app/arcade/page.tsx`. Those were written against what shipped.

## Architecture

**Two routes.** `/` (`src/app/page.tsx`) and `/arcade` (`src/app/arcade/page.tsx`). Static export —
`output: "export"`, `images: { unoptimized: true }`, `trailingSlash: true` — so there are no server
routes, no runtime image optimization and no dynamic OG generation. `@/*` maps to `./src/*`.

**Content is data, never JSX.** Every file in `src/content/` exports plain typed constants and no
markup. `src/components/sections.tsx` holds one exported renderer per home section (`AboutFigure`,
`SkillsTable`, `ExperienceRecord`, `WorkProjectCards`, `ClientChips`,
`PersonalProjects`, `OffTheClock`), and `src/app/page.tsx` composes them in a fixed order behind
`SectionOpener`s numbered `§ 01`…`§ 06`. Copy changes go in `src/content/`; layout changes go in
`sections.tsx`.

**Navigation has one source of truth.** `src/content/nav.ts` is the single ordered section list, and its
ids *are* the `SectionOpener` ids on the page. `nav/section-nav.tsx` runs one rAF-throttled scroll
computation to decide the active section and passes it to both the sticky top bar and `nav/dot-rail.tsx`
— deliberately not an IntersectionObserver, which goes stale across anchor jumps. Anchor links only; no
scroll hijacking, no smooth-scroll library.

**Two framework-free engines with thin React wrappers.** Both keep their game/animation loop out of
React state, because a loop driven by `setState` re-renders the tree every tick for nothing:

- `components/wave/field.ts` (the Bayer-dither wave) + `wave-field.tsx`. **All animation policy lives in
  the one shared `WaveClock`** — 30fps fixed step, IntersectionObserver visibility, `visibilitychange`
  pausing, reduced-motion still frame — so every canvas on the page (hero field, `WaveRamp` section
  boundaries, seeded stills) behaves identically and shares one rAF loop.
- `components/arcade/engine.ts` (turn logic) + `battle.tsx` (rendering) + `fx.ts` (canvas particle FX) +
  `glyphs.tsx` (hand-drawn SVG paths, deliberately not emoji). All engine scheduling goes through
  `schedule()` so `dispose()` can cancel every pending beat on unmount.

**Tailwind v4, CSS-first.** There is no `tailwind.config.js`. Tokens, the `step-1`…`step-8` spacing
scale, and the type utilities (`.display-giant`, `.display`, `.title`, `.body-copy`, `.caption`,
`.figure-tag`, `.readout`, `.mono`) are all defined in `src/app/globals.css`. Use the named utilities
rather than re-deriving their literal values.

**The manual's furniture** is `components/manual.tsx`: `Figure` (the FIG-tagged frame that is the site's
only container primitive), `SectionOpener`, `Marker`, `StackRow`. Figure numbers are load-bearing — prose
refers to them — so they must stay stable, and figures are intentionally *not* uniform: each is sized by
its contents. Do not turn any section into a grid of equal cards.

## Invariants that look like bugs — do not "fix" these

Each is commented in place; the comment is the full rationale.

- **`INKS` in `wave/field.ts` is declared lightest-first** (yellow → cyan → magenta). Reordering by
  luminance puts ~50% magenta on the page.
- **Wave coverage is `pow(v, gamma)`, never a multiplier.** A multiplier compresses the field inside one
  ink band and renders the Bayer matrix itself — a flat checkerboard with no wave in it.
- **Canvas backing stores are sized in device pixels while cells stay in CSS pixels** (`WaveField.measure`).
  Skip it and the browser resamples the plate, softening every cell edge.
- **`.dither-reveal[data-inked="true"]` sets `--reveal: 1.4` rather than `mask-image: none`.** Dropping
  the mask changes Chromium's layer tree and elements behind it stop painting. Flatten a mask; never
  remove it.
- **`.dither-reveal` pairs `padding-top: step-3` with an equal negative `margin-top`.** It looks like
  two edits that cancel, and they do cancel *in layout* — that is the point. The padding reserves the
  ~9.5px the figure tag straddles above the frame, so the tag is masked inside the border box instead of
  in the unclipped overflow, where Chromium leaves a stale dot raster mid-scroll and the tag tears along
  the top rule. Deleting either half brings the tear back.
- **Reduced motion may change behaviour but never layout.** `DESIGN.md` records the real bug this came
  from. Freeze what things *do*; leave the boxes alone.
- **`--reveal` is `@property`-registered with `initial-value: 1`.** Every reveal is additive — a client
  with no JS or no `@property` support sees fully-inked content, never a blank region.

## Editorial constraints (from `PRODUCT.md`, non-negotiable)

Copy edits violate these by accident. They are about a real person's professional record.

- Contact is **LinkedIn + GitHub only**. No email, no phone, no contact form.
- The title **"Technical Lead" must not appear anywhere.** Ze never formally held it. State the ownership
  facts underneath it instead. See the note in `src/content/profile.ts`.
- **Radiant is past tense throughout** — "served 100k+ users", never "serves".
- **No commit statistics and no fabricated metrics.** There is no TPS, p99, uptime, cost or revenue
  figure available; do not produce one. Scope is described in words.
- **Never state a total years-of-experience number.** Give start years.
- **Internal detail stays genericized.** Radiant, GuildFi, Zentry, XOXONA and `zentry-data` may be named;
  internal function, table, service, module and task-queue names may not.
- **RAG and retrieval are claimable and lead the skills section** — `research/` says otherwise and is
  wrong (it audited public repos only; both systems are in private employer codebases). Retrieval
  *implementation* detail — vector store, embedding model, chunking, reranking — is genuinely unknown and
  must not be invented.

## Known dead code and open decisions

- `src/content/systems.ts` has **zero importers** — orphaned by the redesign.
- `src/content/retrieval.ts` has **zero importers** — Ze cut Figs. 04.4, 04.5 and 04.6 (the two retrieval
  system figures and the Method figure) from § 04 on 2026-07-28 as duplicated against § 03. The content is
  kept: it is the most interview-relevant material in the tree, including the `pending` authoring
  checklists, and the removal was about placement, not accuracy. `RetrievalFigures` and its § 04 block were
  deleted with it.
- `StackRow` in `src/components/manual.tsx:110` is **never called** — `RetrievalFigures` was its only
  consumer. It is still part of the furniture vocabulary; keep it until the § 04 question is settled.
- `Topbar` in `src/components/actions.tsx:38` is **never rendered**; `nav/section-nav.tsx` ships its own
  `<header>`.
- **Open:** `hero.word` in `src/content/profile.ts` is currently `"SATASUK"`. `"RETRIEVAL"` preserves an
  earlier positioning decision. Ze has not settled it; do not settle it by default (`HANDOFF.md` §8).
