# Redesign Plan — Portfolio v2, Direction A

> Authored 2026-07-26 from Ze's brief. Companion to `DESIGN.md` (visual system) and `PRODUCT.md`
> (audience, positioning, editorial rules). Where this file and those disagree, **this file wins for
> v2 and both should be amended afterwards** — see §9.

## 0. The brief, and what changed

Ze's instruction, in his words: the site should *"let people know about myself (and might recruit
me?)"*. Concretely:

| Change | Decision |
|---|---|
| **three.js** | Remove. The rotating wireframe figure goes. |
| **Colour** | Keep the family, adopt the brighter values from Ze's own style card. |
| **Shape language** | Unchanged. Print/manual chrome — zero radius, heavy keylines, FIG tags, halftone. Recolor only. |
| **Home page** | Six sections in a fixed order: About · Skills · Experience · Work projects · Personal projects · Off the clock. |
| **Experience** | Grouped **by company** (Zentry, BlockFint, Phatra), 3–5 lines each, roles nested. |
| **Projects** | Short descriptions only. *"No need to leak too much — we can show or tell that when I get the interview."* |
| **Navigation** | Sticky top bar **plus** right-edge dot rail. Redundant by design. |
| **`/log`** | Delete. It is 248 lines of incident detail and directly contradicts the no-leak instruction. |
| **`/arcade`** | Keep, but **recolor into the main palette**. The dark-neon inversion is retired. |
| **Photograph** | Ships **raw**, full tone, inside a keylined plate. Not dithered. |
| **Dither** | Moves to the background as an **animated three-ink wave**. |
| **Stat grid** | Cut. Numbers survive as prose inside experience copy. |

**Two positioning facts carried forward from `PRODUCT.md`, unchanged and non-negotiable:**

- **The title "Technical Lead" must not appear anywhere.** Ze confirmed he never formally held it.
  Every ownership fact underneath it stands and is stated plainly.
- **Contact is LinkedIn + GitHub only.** No email, no phone, no form.

---

## 1. What replaced the WebGL hero — and why it is the same idea

The shipped hero is a giant word knocked out of a paper sheet with a live WebGL canvas behind it, seen
only through the letterforms. Removing three.js appears to destroy that. It does not: **the knockout
machinery is renderer-agnostic.** `KnockoutWord` in `src/app/page.tsx` is an in-document SVG mask over
whatever paints behind it. Swap the canvas source and the signature move survives intact at a fraction
of the cost.

What paints behind it now: **an animated Bayer-dithered wave in the three spot inks.**

```
three summed sines  →  height field 0…1  →  pow(v, gamma)
                    →  ordered Bayer-8 threshold
                    →  4 levels: bare paper → yellow → cyan → magenta
```

### Two ways to get this wrong, both found by building it

**1. The ink ramp must be ordered lightest-first.** The field climbs from bare paper through pale
yellow, into cyan, and reaches magenta only at the crests. Declaring the inks darkest-first — which is
the natural way to write it, since magenta has the lowest luminance — puts **~50% magenta on the page
at the quietest setting.** Caught by simulating coverage before rendering anything.

**2. Coverage is a gamma, never a multiplier.** Scaling the field down (`v * 0.5`) compresses it
inside a single ink band, and a band held near 50% renders **the Bayer matrix itself** — a flat,
regular checkerboard with no wave visible in it. This one only showed up on screen; the coverage
numbers looked perfectly reasonable. A gamma (`pow(v, g)`) keeps the field spanning every band, so the
boundaries between inks stay visible as contours and the surface reads as moving.

Measured coverage across a full wave cycle, gamma mapping (re-measured against the shipped
engine in step 2, stable across sampling domains — the original table ran a few points hot):

| Coverage | gamma | paper | yellow | cyan | magenta |
|---|---|---|---|---|---|
| Whisper | `4.0` | 68% | 27% | 5% | 1% |
| **Quiet** (default) | `2.6` | 46% | 42% | 10% | 2% |
| Present | `1.7` | 25% | 51% | 21% | 3% |
| Full ink | `1.0` | 7% | 43% | 43% | 7% |

Yellow is `1.4:1` on the ground, so a yellow-dominant field reads as a warm risograph tint rather than
as decoration. Note that every setting keeps some cyan and magenta — that is the point, and it is why
the quiet settings still look like a wave rather than a texture. This is what makes an animated
full-bleed field survivable on a hiring page.

> Both faults are verified fixed in the published mockup, rendered in a real browser rather than
> reasoned about. Static validation — tag balance, JS parse, coverage arithmetic — passed on the
> checkerboard version.

### Where the field may and may not appear

- ✅ **Hero** — full-bleed, at full coverage, showing through the knockout word and the transparent band above it.
- ✅ **Section ramps** — 30px slices of the same field replacing the diagonal speed stripes.
- ✅ **Work-project cards** — a *still* frame, seeded per project, standing in for a screenshot. Recognisable as a plate, unreadable as a spec. **This turns the no-leak constraint into the aesthetic** rather than a promise to keep.
- ❌ **Never behind body copy.** DESIGN.md's existing rule and it holds without exception. Every paragraph sits on opaque paper. The one element that sits in the transparent hero band — the running head — gets its own paper sheet with a keyline.

### Cost and behaviour

One canvas, no dependencies, ~70 lines. It writes an `ImageData` at *cell* resolution and scales up
with `imageSmoothingEnabled = false`; a 1440-wide viewport at 5px cells is ~41k typed-array writes plus
one `drawImage` per frame, roughly 1–2 ms.

- Backing store must be sized in **device** pixels (`width = cssWidth × dpr`) while cells are sized in
  CSS pixels. Skip this and the browser resamples the plate and every cell edge goes soft — the one
  thing a dither cannot survive.
- 30fps cap. A print plate does not need 60.
- `IntersectionObserver` — only fields on screen are painted.
- Paused on `visibilitychange`.
- `prefers-reduced-motion`: render **one composed frame** and stop. Never change layout — only
  behaviour. (DESIGN.md records a real bug where reduced motion switched the sticky layer to
  `position: absolute` and pushed the hero off the document. Do not repeat it.)

---

## 2. Token swap

`src/app/globals.css`, the `@theme` block. Same token *names* wherever possible so component code is
untouched.

| Token | Old | New | Note |
|---|---|---|---|
| `--color-paper` | `#f2efe6` | `#fafaf7` | cream → near-white |
| `--color-board` | `#e6e1d2` | `#efeee7` | |
| `--color-ink` | `#14120e` | `#111111` | |
| `--color-ink-mid` | `#4a4640` | `#4a4a45` | |
| `--color-halftone` | `#b8b2a2` | `#b9b9b1` | |
| `--color-print-cyan` | `#0a7c93` | `#0092b8` | |
| `--color-cyan-deep` | `#08657a` | `#006e88` | body-size cyan |
| `--color-spot-red` | `#e8332f` | `#e8195b` | **rename to `--color-magenta`** — it is no longer red |
| `--color-marker-yellow` | `#f5c518` | `#ffc400` | |

### Measured contrast on the new ground (recompute before adding any pair)

| Pair | Ratio | Cleared for |
|---|---|---|
| Ink on paper | `18.1:1` | everything |
| Ink-mid on paper | `8.9:1` | secondary prose, captions |
| Cyan-deep `#006E88` on paper | `5.6:1` | **body-size cyan, links, FIG tags** |
| Cyan `#0092B8` on paper | `3.46:1` | large text ≥24px, fills, UI, focus ring |
| Magenta `#E8195B` on paper | `4.26:1` | large text and fills only |
| Ink on yellow | `12.6:1` | the highlighter |
| Yellow on paper | `1.4:1` | **never type — fill only** |

The brighter cyan drops from `4.2:1` to `3.46:1`, so the split between `print-cyan` and `cyan-deep`
becomes *more* important than it was, not less. Audit every existing `text-print-cyan` and move any at
body size to `text-cyan-deep`.

### The Red Means Over rule is retired

DESIGN.md's rule reserved spot red for terminated things. Two reasons it goes:

1. Ze chose *"just end the date range"* for Radiant's sunset — there is no sunset state to mark.
2. `#E8195B` is magenta, not red. It reads as a third ink, not a warning.

Magenta's new job: the one loud panel per page, and the crests of the wave.

---

## 3. Files

### Delete

```
src/components/figure/engine.ts        # the only `import * as THREE` in the repo
src/components/figure/figure-chapter.tsx
src/app/log/page.tsx                   # and the /log route
src/content/incidents.ts               # importer-checked: /log/page.tsx only. Safe.
```

`three` and `@types/three` come out of `package.json`. That is the entire dependency removal — the
arcade never used it.

**`ScalePanel` in `sections.tsx` also goes.** It *is* the four-readout stat grid Ze cut. Removing it
orphans `home.stats` and `secondaryReadouts` in `src/content/profile.ts` — strip both, but keep the
raw figures somewhere in `research/` since experience prose still cites them.

### Import graph — checked, not assumed

Deleting `figure-chapter.tsx` and `/log` has four consequences the file list above doesn't show:

| Fact | Consequence |
|---|---|
| `src/content/incidents.ts` ← only `/log/page.tsx` | safe to delete together |
| `src/content/retrieval.ts` ← `/log/page.tsx`, `page.tsx` (`method`), `sections.tsx` (`retrievalSystems`) | **survives.** `provenance` becomes orphaned when `/log` goes — remove that export only |
| `RetrievalFigures` was rendered *inside* `FigureChapter` | **needs rehoming, not deleting.** Its retrieval content is Ze's strongest technical material and the new page has no chapter to hold it. Fold it into §03's Zentry figure or give it a home under Work projects. |
| `<Link href="/log">` in **two** places | `src/app/page.tsx:143` *and* `src/components/actions.tsx:55` |

`src/components/actions.tsx` therefore moves off the "keep as-is" list — it needs the `/log` link
removed from its nav. Shipping a static export with a link to a deleted route is a 404, not a
degradation.

### Add

```
src/components/wave/field.ts           # the dither engine (framework-free class)
src/components/wave/wave-field.tsx      # 'use client' React wrapper + IO + reduced-motion
src/components/nav/section-nav.tsx      # sticky top bar
src/components/nav/dot-rail.tsx         # right-edge progress rail
src/content/experience.ts               # companies → roles, the new grouping
src/content/skills.ts                   # grouped skill sets
src/content/hobbies.ts                  # off-the-clock — placeholder copy, see §5
```

### Rewrite

```
src/app/page.tsx                       # six sections, new hero
src/components/sections.tsx            # ServiceRecord → company-grouped figures
src/app/globals.css                    # token swap + arcade recalibration
src/app/arcade/page.tsx                # recolor
src/components/arcade/fx.ts            # recolor
src/components/arcade/battle.tsx       # recolor
src/components/arcade/glyphs.tsx       # recolor
```

### Keep as-is

`src/components/manual.tsx` (Figure, Marker, SectionOpener), `src/components/reveal.tsx`,
`src/content/projects.ts`, `src/content/systems.ts` — these are token-driven and inherit the recolor
for free.

`src/content/retrieval.ts` and `src/content/profile.ts` survive but need edits (see the import graph
above). `src/components/actions.tsx` needs its `/log` link removed.

---

## 4. Home page structure

One page, native scroll, nothing gated. Numbering is real: the sections are a sequence Ze specified,
so `01…06` encodes reading order rather than decorating headings.

```
[topbar]  sticky · brand + 6 tabs + Arcade ↗        z-index above the field
[rail]    right edge · 6 dots · IntersectionObserver-driven

00  HERO      transparent band (field visible) · running head on its own paper sheet
              giant knockout word — the field shows through the letterforms
              opaque sheet: thesis line, standfirst, raw photo plate, LinkedIn/GitHub
~~~~ ramp ~~~~
01  ABOUT     one figure, four short paragraphs
02  SKILLS    8 grouped rows; the AI/retrieval row takes the yellow highlighter fill
~~~~ ramp ~~~~
03  EXPERIENCE   one figure per company, roles nested
                 03.1 Zentry — XOXONA / Radiant·GuildFi / zentry-data
                 03.2 BlockFint — SWE (BA·SA·dev·QA) / front-end part-time
                 03.3 Phatra — data engineer part-time
~~~~ ramp ~~~~
04  WORK PROJECTS     3 cards + a client-work chip row
05  PERSONAL PROJECTS 4 cards + an overflow paragraph
~~~~ ramp ~~~~
06  OFF THE CLOCK     4 panels
    CLOSER            LinkedIn + GitHub
```

**Company grouping resolves the BlockFint split for free.** `research/00-synthesis.md` §4 lists four
roles because BlockFint is two (front-end part-time Feb–May 2020, then SWE May 2020–Dec 2021). One
company figure with two nested roles keeps both without a confusing duplicate entry.

### Navigation

Both mechanisms read from **one** `IntersectionObserver` over the six section elements — a single
source of truth for "which section am I in", consumed by the top bar and the dot rail. Two observers
will drift.

- Anchor links (`href="#skills"`), not scroll hijacking. Find-in-page, keyboard scroll and deep links
  keep working. `scroll-margin-top` on each section equal to `--topbar-h` so anchors don't land under
  the bar.
- Dot rail is `aria-hidden` decorative; the top bar is the real navigation with
  `aria-current="true"` on the active tab.
- Rail hides below `48rem` — it has nowhere to live on a phone.

---

## 5. Content — structure now, wording later

Ze's instruction: *"let's create a plan first, we will fix the wording or information later on."*
That is a sequencing decision, and it has one architectural consequence worth stating plainly:

> **No user-visible string may live inside a component.** Every word ships from `src/content/*.ts`.
> The later wording pass then edits data files only — no JSX, no risk of breaking layout while
> rewriting a sentence, and no need to re-verify the build after a copy change.

The current codebase already does this (`profile.ts`, `projects.ts`, `systems.ts`, `retrieval.ts`) — the
new sections must not break the pattern. Build against the contracts below with whatever copy exists;
the shapes are what the components depend on, and they will not change when the words do.

### 5.1 Content contracts

```ts
// src/content/experience.ts — grouped by company, per Ze's brief
export type Role = {
  title: string;
  when: string;          // "2026 —"  · display string, never parsed
  body: string;          // 3–5 lines. The unit Ze asked for.
};
export type Company = {
  id: string;            // "zentry" · used for the FIG tag and anchors
  name: string;
  meta: string;          // "Cryptomind Group · Bangkok"
  when: string;          // "2021 — now"
  current?: boolean;     // drives the cyan "Current" chip. Only one may be true.
  roles: Role[];         // newest first
};
export const companies: Company[];   // newest first: zentry, blockfint, phatra

// src/content/skills.ts
export type SkillGroup = {
  key: string;           // "AI & retrieval"
  items: string[];
  lead?: boolean;        // takes the yellow highlighter fill. Exactly one.
};
export const skillGroups: SkillGroup[];

// src/content/hobbies.ts
export type Hobby = {
  n: string;             // "01"
  name: string;
  body: string;
  draft?: boolean;       // true = copy not yet from Ze. See 5.2.
};
export const hobbies: Hobby[];
```

Three details the components rely on and a copy pass must not quietly violate:

- `current` and `lead` are **single-selection** flags. Two `current: true` companies puts two live chips
  on the page and the cyan state stops meaning anything.
- `when` strings are for display only. Nothing parses them, so they can read however Ze wants — but
  that also means nothing will catch a typo'd year. Check them by eye.
- `Role.body` is one string, not an array of paragraphs. If a role needs two paragraphs, change the
  type rather than embedding `\n\n` and hoping the renderer copes.

### 5.2 Placeholder discipline

Placeholder copy that looks finished is how draft text ships. Two cheap guards:

- Any string not yet from Ze is marked `draft: true` (hobbies) or prefixed `TODO —` (anywhere else).
- The renderer shows a magenta `DRAFT` chip next to any `draft` entry — visible in dev, and impossible
  to miss in review. Add `grep -rn "TODO —\|draft: true" src/content/` to the §7 step-8 checklist so a
  release can't happen with drafts in it by accident.

**The hero word is one token.** `hero.word` in `src/content/profile.ts` — currently `"Retrieval"`, set
to `"SATASUK"` in the mockup. Whichever wins (see §8) is a one-line change to a data file, so it does
not need deciding before the build starts. It only needs deciding before the site is public.

### 5.3 Copy direction, for when the wording pass happens

Not required to build. Recorded now so the later pass doesn't start from a blank page.

**About** — first person, four short paragraphs, no adjective stacking. The through-line to state:
*the same judgment applied further up each time* — hand-built a quest engine → owned architecture and
incident triage across a 70+ module codebase → now directs agents on a live product. Say plainly that
two markets disappeared underneath products he was building and he rebuilt through both.

**Skills** — grouped by what it is for, not by logo count. AI & retrieval leads and takes the
highlighter. RAG and retrieval **are** claimable — `PRODUCT.md` records a correction: the earlier
"no RAG experience" claim was drawn from public repos only, and both retrieval systems are in private
employer codebases. Confirmed directly by Ze.

**Experience** — 3–5 lines per company as Ze asked. Numbers appear here, in sentences: *"served 100k+
players"*, *"70+ backend modules"*, *"shipped in two months with a team of three"*. Radiant is past
tense throughout. Date range ends at 2026 with no sunset commentary.

**Work projects** — short by instruction. Private codebases get a `Private · ask me` footer instead of
a dead link. The XOXONA entry states the agent-directed development plainly and without hedging;
`PRODUCT.md` Principle 4 requires the AI-leveraged work be labelled and separated from the hand-built
work, because the credibility of both depends on not blurring them.

**Personal projects** — the load-bearing section for craft. These are public, solo, hand-built, and the
only place a reader can read Ze's actual code. This is precisely what lets the XOXONA leverage story be
told without defensiveness.

**Closer** — an invitation to ask about a project, then LinkedIn and GitHub. Nothing else.

---

## 6. The arcade recolor

`/arcade` stops being a dark room. It keeps the palette and gains the wave.

| Old (dark neon) | New |
|---|---|
| `--color-arcade-void #0a0812` | `--color-paper #fafaf7` |
| `--color-arcade-panel #150f26` | `--color-board #efeee7` |
| `--color-arcade-cyan #37e6ff` | `--color-print-cyan #0092b8` |
| `--color-arcade-magenta #ff2e6b` | `--color-magenta #e8195b` |
| `--color-arcade-gold #ffcb2b` | `--color-marker-yellow #ffc400` |
| `--color-arcade-text #f0edff` | `--color-ink #111111` |
| `--color-arcade-green #38f5a8` | **needs a decision** — see below |

Consequences to handle deliberately:

1. **Glow was the arcade's entire depth model.** DESIGN.md permits bloom and saturation there and
   nowhere else, precisely because a CRT emits light and paper does not. On paper there is no glow, so
   emphasis in combat has to be re-solved with **keyline weight, ink fills and cell density** — a crit
   becomes a heavier frame and a magenta fill, not a brighter one. Budget real time for this; it is not
   a find-and-replace.
2. **Neon green has no print equivalent.** Either drop it and redistribute its role across the three
   inks, or admit a fourth ink to the system. Recommend dropping it — three inks plus paper is the
   system, and a fourth exists only in the arcade, which is how the dark room started.
3. **The Two Calibrations Rule dies.** It existed to keep neon values out of paper contexts. With one
   calibration it has no work to do. Delete it from DESIGN.md rather than leaving it as a rule nothing
   obeys.
4. **The floating combat numerals** (`arcade-heal`, `arcade-damage`, `arcade-cooldown`,
   `arcade-damage-crit`) keep their size relationships. Only their colours change.
5. Keyboard operation and polite turn announcements are unchanged requirements.

---

## 7. Build order

Each step leaves the site working. **Do not run `next build` while `next dev` is running** — it
corrupts `.next` and produces impossible results.

1. **Token swap.** `globals.css` only. Then grep every `print-cyan` usage and demote body-size ones to
   `cyan-deep`. The site should look recolored and otherwise identical. Verify against the contrast
   table in §2.
2. **Build `field.ts` standalone.** No React, no page changes, nothing deleted. Verify in isolation:
   coverage percentages against the table in §1, cell crispness at `devicePixelRatio` 1 and 2,
   reduced-motion single frame, `IntersectionObserver` pausing. The site is untouched and still
   working.
3. **Swap the renderer and delete three.js in one commit.** Wire `wave-field.tsx` behind the existing
   `KnockoutWord`, *then* delete `figure/engine.ts` and `figure-chapter.tsx` and drop the deps.
   Deleting `figure-chapter.tsx` while `page.tsx` still imports it is a **compile error, not a visual
   glitch** — it would also destroy the ability to verify step 1 independently. One commit, or the
   step-leaves-the-site-working principle is broken.
4. **Content restructure.** `experience.ts`, `skills.ts`, then rewrite `sections.tsx` for
   company-grouped figures. Delete `/log`, `incidents.ts` and `ScalePanel` here, and remove **both**
   `/log` links (`page.tsx`, `actions.tsx`) in the same step. Rehome `RetrievalFigures`.
5. **Navigation.** One observer, two consumers. Test with keyboard only, and with find-in-page. If
   `scroll-behavior: smooth` is used anywhere, guard it behind `prefers-reduced-motion` — smooth
   anchor jumps are motion too.
6. **Page assembly.** `page.tsx` with the six sections and the new hero.
7. **Arcade recolor.** Last, because it is self-contained and the most likely to need design iteration.
8. **Verify.** Stop the dev server, then `pnpm build`. Then:
   - `out/` contains `index.html` and `arcade/index.html` and **no `log/`**
   - `grep -rn "/log" out/` — catches a surviving link that would 404 on a static host
   - `grep -rn "TODO —\|draft: true" src/content/` — lists every string still awaiting Ze (§5.2).
     Expected to be non-empty at this stage; must be empty before the site goes public.
   - Mobile at 375px, keyboard-only traversal, reduced motion, and a contrast audit of shipped pairs.

> **This is not a git repository.** There is no `git checkout` if a step goes wrong, and no history to
> bisect. Each step above is small enough to undo by hand — keep them that way, and consider
> `git init` before starting.

---

## 8. Deferred to the content pass

**Nothing here blocks the build.** Every item is a string in a data file (§5.1), so the whole site can
be built, verified and reviewed with placeholder copy in place, and the wording pass lands afterwards
without touching a component. What follows is the checklist for that later pass, not a set of gates.

### Copy Ze still has to supply

Ze named five hobbies: Wing Chun practitioner, rock climber, AI builder, designer, photographer. Four
need a line each and `research/` has nothing on three of them. Ship them `draft: true` until then.

| Hobby | What is needed | What research has |
|---|---|---|
| Wing chun | lineage/school, how long, still training? | **nothing** |
| Rock climbing | boulder or lead, indoor/outdoor, grade if he wants it stated | the word "climbing 🧗" |
| Designer | UI? graphics? the `@3DZeeGee` 3D-art work? | a deferred 3D-art persona with Patreon/YouTube tutorials |
| Photography | what he shoots, film or digital | one asset, `sanddune.webp`; `philm` suggests film emulation |

**"AI Builder" is deliberately not in the hobby row.** It is the strongest hiring signal on the site —
XOXONA's leverage story, `dev-fable`, `thai-personal-finance-planner`, the agent-tooling repos — and a
hobby chip demotes the lead to an aside. It is carried by Personal Projects instead. **Ze can
overrule this**; it is a judgment call, not a constraint.

### The one decision that outranks wording

**What word is knocked out of the hero?** Technically it is `hero.word` — one token in one data file,
changeable in ten seconds. Editorially it is the largest piece of type on the site, and the two options
produce materially different sites:

- `SATASUK` — a personal site that contains an engineering record. Warmer; leads with a person. What Ze's *"let people know about myself"* brief points at, and what the mockup uses.
- `RETRIEVAL` — a positioning site that happens to be personal. Sharper for AI-engineer roles, and it preserves a **dated decision already in `PRODUCT.md`**: *"Retrieval leads; the platform record is the depth underneath it (emphasis decided with Ze, 2026-07-25)."*

The new brief changes the **audience framing**; it does not obviously reverse that positioning call. Flagged
here rather than settled by default — it is cheap to ask and expensive to get wrong, and it does not
block a single line of the build.

### Assumptions in force — proceed unless corrected

| # | Question | Assumed |
|---|---|---|
| 1 | Wave coverage + cell size | Quiet (gamma `2.6`) / 5px cell / Drift |
| 2 | Freelance client sites | chip row at the foot of Work Projects, not their own section |
| 3 | The numbers | kept as prose inside experience copy; not as a stat panel |
| 4 | Portrait | the Bondi photo works but its background is busy inside a keylined plate; a plain-background shot would sit better |
| 5 | `/log` content | deleted from the site, retained in `research/` as interview prep |
| 6 | Hobby row | four panels (wing chun, climbing, photography, design), "AI Builder" carried by Personal Projects instead |

### Order of passes

1. **This plan** — done.
2. **Build** — §7, steps 1–8, with placeholder copy. The site is complete, verified, and reviewable.
3. **Content pass** — data files only. Hobby lines, the hero word, and any rewording Ze wants.
4. **Docs pass** — §9. `DESIGN.md` and `PRODUCT.md` amended to match what shipped.

---

## 9. Docs to amend after the build

Both `DESIGN.md` and `PRODUCT.md` assert things this plan overturns. Leaving them stale is how a
design system stops being trusted.

**`DESIGN.md`:**
- Front-matter colour values → §2 of this file. Rename `spot-red` → `magenta`.
- Delete **The Two Calibrations Rule** (§6.3) and **The Red Means Over Rule** (§2).
- Rewrite the arcade colour section — it is no longer an inversion, and glow is no longer permitted
  anywhere.
- Replace the "turning figure" motion section with the wave: what it is, where it may appear, the
  never-behind-body-copy rule, the ink ramp order, and the reduced-motion behaviour.
- Keep the note about the reduced-motion layout bug. It is the most useful paragraph in the file.

**`PRODUCT.md`:**
- Brand Commitments still specifies the cream/print-ink palette and the dark `/arcade` inversion.
- Accessibility still quotes the old contrast ratios.
- Scope says photography is deferred; it is now in scope as one of four hobby panels.
- The visual direction line should record that the palette came from Ze's own `micro-gfx` output, which
  is a better provenance story than a moodboard.
