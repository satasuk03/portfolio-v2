# Handoff — Portfolio v2 redesign

**Written 2026-07-26.** For an agent picking this up cold. Do §0 first, then read this file, then
`REDESIGN-PLAN.md`, then start at §7 step 1 of that plan.

---

## 0. Do this first: put it under version control

**This directory is not a git repository.** Nothing here has any history — not the existing build, not
the planning documents, not the design reference. Every step of the redesign touches or deletes files
in a tree with no undo, and `REDESIGN-PLAN.md` §7 deletes five files outright. Fix that before doing
anything else.

`.gitignore` already exists and correctly covers `node_modules`, `.next`, `out`, `*.tsbuildinfo`,
`next-env.d.ts` and `.DS_Store`, so this is safe to run as-is:

```bash
cd /Users/satasuk/Desktop/dev/portfolio-v2
git init

# Commit 1 — the build exactly as it stands today, with none of the planning layer
# mixed in. This is the baseline every redesign step gets diffed against.
git add -A -- ':!HANDOFF.md' ':!REDESIGN-PLAN.md' ':!design-reference'
git commit -m "Baseline: the Game Manual build (three.js hero, cream palette)"

# Commit 2 — the planning layer, separately, so the baseline stays clean.
git add -A
git commit -m "Plan the Direction A redesign: build spec, handoff, design reference"
```

Two commits rather than one is deliberate: it means the first line of the redesign can be diffed
against a pure pre-redesign tree, which is exactly what you want when the plan's first step is a
global colour swap.

Then **commit after each numbered step in `REDESIGN-PLAN.md` §7.** The steps are sized so each one
leaves a working site; one commit each turns that property into an actual undo point. Step 3 in
particular *must* be a single commit — it swaps the hero's renderer and deletes three.js together,
because doing either alone leaves the tree uncompilable.

No remote is configured, and none is needed for the build. Add one if Ze wants it backed up.

---

## 1. State in one paragraph

The site currently on disk is the **"Game Manual"** build: cream stock, heavy black keylines, and a
three.js wireframe figure that rotates behind a giant knockout word in the hero. Ze has asked for a
redesign: **drop three.js, adopt a brighter palette from his own style card, restructure the home page
into six named sections, add sticky + dot-rail navigation, delete `/log`, and recolor `/arcade` into the
main palette.** The visual *shape* language (zero radius, keylines, FIG tags, halftone) is explicitly
unchanged — this is a recolor plus a restructure, not a new design system.

**Design is decided. Planning is complete. No source file under `src/` has been modified yet.** Ze's
last instruction was *"let's create a plan first, we will fix the wording or information later on"* —
so the build proceeds with placeholder copy and a content pass lands afterwards.

---

## 2. Read these, in this order

| File | What it is | Trust it for |
|---|---|---|
| **`REDESIGN-PLAN.md`** | The build spec. Written this session. | **Everything about v2.** Colours, file-level changes, build order, content contracts. Where it disagrees with anything below, it wins. |
| `DESIGN.md` | The shipped visual system. | Shape language, typography, layout grid, halftone, the do/don't list. **Partly stale — see §3.** |
| `PRODUCT.md` | Audience, positioning, editorial rules. | Who the site is for, what may and may not be claimed. **Partly stale on visuals — see §3.** |
| `research/00-synthesis.md` | Consolidated content record. | Dates, roles, projects, metrics. **Two known landmines — see §4.** |
| `design-reference/direction-a-mockup.html` | The approved design, rendered. | What the result should look like. Open it in a browser. |

`research/01-old-portfolio.md`, `02-profile-and-radiant.md`, `03-github.md` are the raw extractions
behind the synthesis. Only go there for detail the synthesis dropped.

### Seeing the target

`design-reference/direction-a-mockup.html` is a **single self-contained file** — open it directly, no
server needed. It has the full home page in the new palette, the animated wave with live controls, and
Ze's photograph embedded. It is a *design reference*, not code to copy: it is plain HTML/CSS with
inline styles and system fonts, whereas the real site is Next.js + Tailwind v4 + Kanit/Archivo/Azeret
Mono. Treat it as a rendering of intent.

Also published at https://claude.ai/code/artifact/7e3cf344-29db-4299-bb10-2f150e0e468e (same content).

---

## 3. `DESIGN.md` and `PRODUCT.md` are partly stale — do not follow them blindly

Both were written for the build now being replaced. `REDESIGN-PLAN.md` §9 lists the amendments to make
*after* the build. Until then, these specific claims are **wrong**:

**`DESIGN.md`:**
- All colour values in the front matter. Superseded by `REDESIGN-PLAN.md` §2.
- **The Two Calibrations Rule** (every hue exists as a print value and a neon value) — dead. There is one calibration now.
- **The Red Means Over Rule** (spot red marks what ended) — dead. Ze chose to signal Radiant's sunset with the date range alone, and `#E8195B` is magenta, not red.
- The arcade section describing a dark neon inversion with permitted glow — the arcade is being recolored into the main light palette.
- The Motion section's "turning figure" — that is the three.js hero being removed. Replaced by the dither wave.

**Still authoritative in `DESIGN.md`**, and the reason to keep reading it: the figure-frame container
system, rule weights, the eight-step spacing scale, the type hierarchy and its named rules, the
halftone/speed-stripe vocabulary, "there is no elevation", and the whole Do/Don't list. Also the
paragraph recording a real reduced-motion layout bug — that one is load-bearing, see §5.

**`PRODUCT.md`:**
- Brand Commitments still specifies the cream palette and the dark arcade.
- Accessibility still quotes the old contrast ratios. Use `REDESIGN-PLAN.md` §2.
- Scope says photography is deferred; it is now in scope as one of four hobby panels.

**Fully authoritative in `PRODUCT.md`** — the editorial rules in §4 below come from here and none of
them are negotiable.

---

## 4. Landmines

### Two places `research/` contradicts `PRODUCT.md` — `PRODUCT.md` wins

1. **RAG and vector databases.** `research/00-synthesis.md` §3 says *"Not supported — do not claim: RAG,
   vector databases"* and §11 calls it "unsupported". **That is wrong and `PRODUCT.md` explains why:** the
   audit covered only *public* repos, and both retrieval systems live in *private* employer codebases,
   so the method could not have seen them. Confirmed directly by Ze. **RAG and retrieval are claimable
   and they lead the skills section.** (Retrieval *implementation* detail — vector store, embedding
   model, chunking, reranking — is still unknown and must not be invented.)

2. **The title "Technical Lead."** It appears throughout `research/` because it came from Ze's own
   Obsidian notes and LinkedIn self-description. Ze confirmed on 2026-07-25 he **never formally held
   it.** The title must not appear anywhere on the site. Every ownership fact underneath it stands and
   should be stated plainly — sole ownership of the quest engine, architecture review, cross-system
   incident debugging across a 70+ module backend.

### Editorial rules that are not negotiable

- **Contact is LinkedIn + GitHub only.** No email, no phone, no contact form.
- **No commit statistics.** Scope is described in words — "sole owner of the quest engine", "one of three core engineers". Nothing numeric lifted from private employer repos.
- **Radiant is past tense throughout.** "Served 100k+ users", never "serves". Its date range ends at 2026 with no sunset commentary — that was Ze's explicit choice.
- **Internal detail stays genericized.** Radiant, GuildFi, Zentry, XOXONA, zentry-data may be named. Internal function names, DB table names, service/module names, task-queue names and the monorepo tree may not.
- **No fabricated metrics.** There is no TPS, request volume, p99, uptime/SLO, cost saving or revenue figure available. Do not produce one.
- **Never state a total years-of-experience number.** Give start years. The "6+ years" phrasing came from a résumé the source notes call embellished.
- **Work projects stay short.** Ze: *"No need to leak too much about the project — we can show or tell that when I get the interview."*

### Two spent anti-references — do not revive either

The dark instrument-panel world (console black `#0b0c0e`, engraved hairlines, amber caution lamp
`#ffb020`, JetBrains Mono + Inter), and before it the pink→mint gradient `#ff2975 → #17ffb3` with a
terminal boot animation. Both were tried and rejected. Also refused: near-black-plus-one-neon-accent
with glowing edges, which is where generated interfaces land by default.

---

## 5. Things that will bite you, discovered the hard way

**The wave has two failure modes, both documented in `REDESIGN-PLAN.md` §1 with the fix.** Short version:
declare the ink array **lightest-first** (yellow, cyan, magenta), and make the coverage control a
**gamma** (`pow(v, g)`), never a multiplier. A multiplier compresses the field inside one ink band and
renders the Bayer matrix itself — a flat checkerboard with no wave in it. The first fault was caught by
simulating coverage; the second only appeared on screen, after static validation had passed. The
working implementation is in `design-reference/direction-a-mockup.html` — search for `var INKS`.

**Canvas backing store must be sized in device pixels** (`width = cssWidth × dpr`) while cells stay
sized in CSS pixels. Skip it and the browser resamples the plate, softening every cell edge — the one
thing a dither cannot survive.

**Never run `next build` while `next dev` is running.** It corrupts `.next` and produces impossible
results. Stop the dev server first.

**Reduced motion may change behaviour but never layout.** `DESIGN.md` records a real bug where reduced
motion switched the sticky figure layer to `position: absolute`; because content below kept a `-100svh`
margin to sit over that layer, removing it from flow shifted the whole chapter up a viewport and pushed
the hero off the top of the document. Freeze what things *do*; leave the boxes alone.

**`mask-image: none` over a sticky canvas breaks painting in Chromium.** If a mask ever needs disabling,
flatten it rather than removing it.

**There is no version control until you create it.** See §0 — do it before touching a single file. The
build order in `REDESIGN-PLAN.md` §7 is sequenced so each step leaves a working site; commit after each
one and that property becomes a real undo point.

---

## 6. Facts about the codebase you would otherwise have to rediscover

- **Exactly one file imports three.js:** `src/components/figure/engine.ts`. `/arcade`'s boss battle is canvas-2D and does not touch it, so removing three.js costs the hero and nothing else.
- **`ScalePanel` in `src/components/sections.tsx` *is* the four-readout stat grid Ze cut.** Deleting it orphans `home.stats` and `secondaryReadouts` in `src/content/profile.ts`.
- **`RetrievalFigures` was rendered inside `FigureChapter`**, which is being deleted. It needs *rehoming*, not deleting — its retrieval content is the strongest technical material on the site.
- **There are two `/log` links, not one:** `src/app/page.tsx:143` and `src/components/actions.tsx:55`. Missing the second ships a 404 on a static export.
- **`src/content/incidents.ts` is imported only by `/log/page.tsx`** — safe to delete together. `src/content/retrieval.ts` has three importers and survives; only its `provenance` export becomes orphaned.
- **The hero's knockout is renderer-agnostic.** `KnockoutWord` in `src/app/page.tsx` is an in-document SVG mask over whatever paints behind it. `background-clip: text` cannot use a live canvas and a `mask-image` data-URI cannot load the webfont — the SVG mask has neither problem. Swap the canvas source and the signature move survives.
- **Ze's photograph is not in this repo.** It lives at `~/Desktop/dev/portfolio/public/images/me.webp` (146 KB) in the old portfolio, along with `photos/sanddune.webp` and three project thumbnails. `public/` here is currently empty.
- **Toolchain:** Node 24.15, pnpm 10.33. **No bun.** Static export (`output: "export"`, `images: { unoptimized: true }`) — no server routes, no runtime image optimization, no dynamic OG generation.
- **Tailwind v4, CSS-first.** Tokens live in an `@theme` block in `src/app/globals.css`. There is no `tailwind.config.js`.

---

## 7. What has been verified vs. asserted

Worth knowing so you don't re-verify the wrong things, or trust the wrong things.

**Verified:**
- Three.js import surface — grepped.
- Content-module import graph and both `/log` links — grepped.
- Contrast ratios in `REDESIGN-PLAN.md` §2 — computed from the hex values, not estimated.
- Wave ink coverage at all four gamma settings — simulated over a full wave cycle.
- The mockup renders correctly in a real browser: the SVG mask resolves, the knockout word shows the live field through its letterforms, the wave reads as a wave, the photograph loads.

**Asserted, not verified:**
- The wave's ~1–2 ms/frame cost. Reasoned from operation count, never profiled. Measure it on real hardware during step 2.
- That the arcade recolor is achievable without redesigning its combat feedback. It probably is not a find-and-replace: glow was the arcade's entire depth model, and on paper there is no glow, so emphasis has to be re-solved with keyline weight and ink fills. Budget real time. See `REDESIGN-PLAN.md` §6.
- Every word of copy in the mockup. It is drafted from `research/`, it is factually grounded, and Ze has **not** signed off on any of it.

---

## 8. Open decisions

None of these block the build. `REDESIGN-PLAN.md` §8 has the full list; these are the two that matter.

**The hero knockout word.** `hero.word` in `src/content/profile.ts` — one token. Currently `"Retrieval"`
in code, `"SATASUK"` in the mockup. `SATASUK` follows Ze's *"let people know about myself"* brief;
`RETRIEVAL` preserves a dated decision in `PRODUCT.md` (*"Retrieval leads; the platform record is the
depth underneath it"*, agreed with Ze 2026-07-25). Ask before the site goes public. Do not settle it by
default.

**Four hobby lines.** Wing chun (lineage, how long), climbing (boulder or lead, grade), photography
(what he shoots), design (UI, graphics, or the `@3DZeeGee` 3D work). `research/` has nothing on three of
them. Ship `draft: true` until Ze supplies them. Note "AI Builder" was deliberately left *out* of the
hobby row — it is the strongest hiring signal on the site and a hobby chip demotes it, so the
agent-tooling repos carry it under Personal Projects instead. Ze can overrule that.

---

## 9. Start here

1. **§0 — `git init` and the two baseline commits.** Not optional; the plan deletes files.
2. Open `design-reference/direction-a-mockup.html` in a browser. Scroll the whole thing. That is the target.
3. Read `REDESIGN-PLAN.md` end to end. It is 515 lines and all of it is load-bearing.
4. Begin at §7 step 1 — the token swap in `src/app/globals.css`, which is self-contained and leaves the site working. Commit it.

Do not start with the arcade or the content. The token swap first means every later step is judged
against the right colours.
