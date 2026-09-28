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

There are five planning documents at the repo root and one under `.impeccable/`. Two redesigns have
shipped since most of them were written: Direction A (the paper "game manual", `936887d` back to
`9038681`) and then, on 2026-09-28, **the hangar** — `/` rebuilt in the hard sci-fi world of `/play`.
The paper palette, the Bayer-dither wave and the `.dither-reveal` mask are all gone. So:

**The source of truth for design tokens is the `@theme` block in `src/app/globals.css`,** nothing else.
Hangar black `#040507`, graphite `#1b1d22`, bone `#ece6d6`, enamel `#e2dccb`, grey `#c4c2b8`, ink `#101010`,
HUD text `#e9e4d6` / `#9d998f`, the status blue `#2f63e6`, the LCD orange `#ff9a2e`, and five module
spots. **Which section wears which spot lives in `src/content/nav.ts`**, not in CSS. `DESIGN.md` was
rewritten for the hangar and describes the system; where it and `globals.css` disagree, the CSS wins.

| Document | Trust it for | Do not trust |
|---|---|---|
| `DESIGN.md` | The hangar system as shipped: card stock, plates, HUD furniture, type roles, motion rules, contrast table, and the reduced-motion layout-bug history. | Nothing known to be stale as of 2026-09-28. |
| `PRODUCT.md` | Audience, positioning, and the editorial rules below — all non-negotiable. | The quoted accessibility ratios (they are for the retired paper palette — `DESIGN.md` has the current ones). Anything about the arcade — the route is gone. |
| `HANDOFF.md` | §4 landmines and §5 "things that will bite you" still hold. §8 open decisions are still open. | §0 — the repo is under version control now. **§6 predates both redesigns**: three.js on `/`, `src/components/figure/`, `ScalePanel`, both `/log` links, `src/content/incidents.ts` and "`public/` is empty" are all wrong. |
| `REDESIGN-PLAN.md` | The rationale behind Direction A, especially §1. | It describes the paper edition, which `/` no longer is. §7 and §9 are history. |
| `.impeccable/surfaces/src-app-page-tsx.md` | Audience and reading-mode framing; updated for the hangar. | — |

The current, accurate intent for each route lives in the `DIRECTION CONTRACT` header comment at the top
of `src/app/page.tsx` and `src/app/play/page.tsx`.

## Architecture

**Two routes, one world.** `/` (`src/app/page.tsx`) is the **reading edition** — the professional
record, built for a 30-second recruiter skim and a 15-minute engineer read. `/play`
(`src/app/play/page.tsx`) is the **playable edition** — a three.js + GSAP field unit whose panels import
the same `src/content` data. Both are set in the same hangar: black ground, blue topographic contours,
CBRPNK rounded cards in solid spot colours, weathered cream enamel. `/` reads first; `/play` is the toy.
`/play`'s centrepiece is the card reader in `play/engine/reader.ts` (procedural weathering in
`weathering.ts`, live LCD in `screen.ts`); its EJECT, CHG, SND lever and knobs are real raycast controls,
and every panel is also reachable from the DOM module bay and keys 1–7. Its tokens live in `play.css`,
scoped under `.play-root`. `/arcade` and its NEXUS-9 boss battle were deleted on 2026-08-25.
Static export — `output: "export"`, `images: { unoptimized: true }`, `trailingSlash: true` — so there are
no server routes, no runtime image optimization and no dynamic OG generation. `@/*` maps to `./src/*`.

**`/` never loads three.js.** Its one WebGL canvas is `components/hangar/topo-field.ts`: raw WebGL1, one
fullscreen triangle, the contour shader built from `/play`'s own GLSL noise (`noiseGLSL`, exported from
`play/engine/shaders.ts`). GSAP is dynamic-imported after hydration by the motion layer. `/play`'s engine
is dynamic-imported by `/play` only. Things `/` borrows from `/play`, deliberately kept three-free so the
import is cheap: `engine/particles.ts` (Canvas 2D sparks and motes), `engine/audio.ts` (the Web Audio
synth, itself dynamic-imported the first time sound is turned on), and `engine/weathering.ts` (the
enamel wear generator — its three.js wrapper was split out into `engine/wear-maps.ts` for this reason; do
not add a three import back to `weathering.ts`).

**Content is data, never JSX.** Every file in `src/content/` exports plain typed constants and no
markup. `src/components/sections.tsx` holds one exported renderer per home section (`AboutRecord`,
`SkillsLoadout`, `ServiceRecord`, `Deployments`, `SideOps`, `OffDuty`), and `src/app/page.tsx` composes
them in a fixed order, each in a `Bay` behind a HUD `SectionOpener` numbered `§ 01`…`§ 06`, then the
uplink closer. Copy changes go in `src/content/`; layout changes go in `sections.tsx`. HUD furniture copy
(status tag, coordinates, the play-entry card) is in `src/content/hud.ts`; `/play`'s is in `play.ts`.

**Navigation has one source of truth.** `src/content/nav.ts` is the single ordered section list — id,
number, label, title, lede, HUD code and module colour. Its ids *are* the opener anchors on `/`, and
`play.ts` derives its six cartridges from it. `nav/section-nav.tsx` runs one rAF-throttled scroll
computation to decide the active section and passes it to both the sticky top bar and
`nav/section-rail.tsx` — deliberately not an IntersectionObserver, which goes stale across anchor jumps.
Anchor links only; no scroll hijacking, no smooth-scroll library.

**One motion controller, found by data attribute.** `components/hangar/fx.tsx` (`HangarFx`, mounted once)
owns every effect on `/`, and finds its targets by attribute, never by class:
`data-reveal` (squash-and-stretch landing on entry), `data-decode` (glyph decode on headings),
`data-lock="LABEL"` + `data-color` (the target-lock bracket frame on hover and keyboard focus, press
squash, cursor sheen), `data-orbit` (a few particle motes while on screen). Framework-free engines keep
their loops out of React state, because a loop driven by `setState` re-renders the tree every tick:
`topo-field.ts` owns its own animation policy (30fps, IntersectionObserver, `visibilitychange`,
reduced-motion still frame, DPR cap 1.5 fine / 1.25 coarse); the particle loop runs only while particles
are alive. The BKK timecode (`hangar/clock.tsx`) is one shared interval writing to refs.

**Sound on `/` is off by default, every visit.** `hangar/sound.ts` is the only door: the `Sfx` class is
dynamic-imported and its AudioContext created inside the top-bar toggle's click handler, never on load.
Every cue is a no-op while off. There are no audio files anywhere in the repo.

**Tailwind v4, CSS-first.** There is no `tailwind.config.js`. Tokens, the `step-1`…`step-8` spacing
scale and the type utilities (`.display`, `.title-lg`, `.title`, `.body-copy`, `.lede`, `.pull-quote`,
`.hud-label`, `.readout`, `.readout-sm`, `.numeral`) are defined in `src/app/globals.css`, along with the
card, plate, furniture and layout classes. `/play` keeps its own scoped copy of the palette in
`play.css` under `.play-root`. Use the named utilities rather than re-deriving their literal values.

**The furniture** is `components/hud.tsx`: `SectionOpener`, `Arrow`, `Barcode`, `Hatch`, `Corners`,
`Tag`, `StackRow`, `Redacted`. Cards are `.card` plus a stock class (`card-bone`, `card-graphite`,
`card-grey`, `card-sage`, `card-spot`); a card sets `--fg/--bg/--fg-dim/--line/--focus` and everything
inside reads them. Hard-surface pieces are `.plate` (the play cartridge, the uplink console), painted by
`hangar/wear.tsx`. FIG numbers survive as each card's designation (`Fig. 03.2`) and lock label — keep
them stable. Cards are intentionally *not* uniform: each is sized by its contents and every section
mixes a lead card with smaller ones. Do not turn any section into a grid of equal cards.

## Invariants that look like bugs — do not "fix" these

Each is commented in place; the comment is the full rationale.

- **Every effect on `/` is additive.** Server HTML is complete and visible. `fx.tsx` hides a card for its
  entrance *only* if it is below the fold when the controller runs, so nothing already visible blinks
  out; decode paints an overlay over real text that never leaves the DOM (or the accessibility tree).
  The topo canvas starts transparent over a CSS survey grid, and plates are flat enamel until the wear
  texture lands. A no-JS client sees the whole page.
- **Reduced motion may change behaviour but never layout.** `DESIGN.md` records the real bug this came
  from. Freeze what things *do*; leave the boxes alone. The reduced-motion CSS block contains only
  durations. Verified on 2026-09-28: every section and card box is pixel-identical between normal,
  reduced-motion and no-JS at 1440 and 390.
- **Tweens end by clearing their transform** (`clearProps`) and a new state overwrites the old tween
  (`overwrite: "auto"`). There are no idle loops on content — no breathing, no jitter. The one ambient
  motion is the hero's contour field (and its motes), and both stop off screen.
- **The target-lock frame re-measures every frame while held.** The card it holds may still be landing
  or squashing; a one-shot measurement leaves the frame hanging off it.
- **`--spot-text-bg` lifts a spot 12% toward white wherever it carries small ink type.** Every spot clears
  AA with ink except magenta (4.3:1 → 4.8:1 lifted). Fills without type keep the pure spot.
- **The status tag is `#2f63e6`, not `/play`'s `#3d7bff`** — white 13px type on `#3d7bff` is 3.9:1.
- **`weathering.ts` must stay three-free** (see Architecture).

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

- `src/content/systems.ts` has **zero importers** — orphaned by the first redesign.
- `src/content/retrieval.ts` has **zero importers** — Ze cut Figs. 04.4, 04.5 and 04.6 (the two retrieval
  system figures and the Method figure) from § 04 on 2026-07-28 as duplicated against § 03. The content is
  kept: it is the most interview-relevant material in the tree, including the `pending` authoring
  checklists, and the removal was about placement, not accuracy.
- `hudCopy.status` ("Open to remote roles") is the hero's blue tag, drawn from the closer's own line. If Ze
  stops looking, change it there.
- **Open:** `hero.word` in `src/content/profile.ts` is currently `"SATASUK"` — now the vertical masthead.
  `"RETRIEVAL"` preserves an earlier positioning decision. Ze has not settled it; do not settle it by
  default (`HANDOFF.md` §8).
