---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

## Scope & Mode

The landing route (`/`), the **reading edition**. Visitor mode: **Persuade** — the visitor decides whether to
open a conversation. Sibling route: `/play`, the playable edition, is **Experience** (the artifact leads).
`/log` and `/arcade` no longer exist.

## Audience & Job

A hiring manager, engineering leader, or senior engineer arriving from LinkedIn, GitHub, or a résumé link. Two
reading speeds must both succeed on this one page: a 30-second mobile skim that resolves role, stack, scale and
location; and a 10-minute desktop read that finds evidence of judgment. The only action is a message on LinkedIn
or a look at GitHub; the secondary action is loading `/play`.

## Chosen Form

**The hangar** (2026-09-28) — `/` restyled to sit in `/play`'s hard sci-fi world, on Ze's brief: a field unit's
HUD over a live topographic survey map, CBRPNK cards in solid spot colours, weathered enamel plates. **The
direction roll was not run**: the brief pinned the world. The risk sits in the rendition — the neon-on-black
cyberpunk default is the safe neighbour this must not collapse into, so `/` carries no glow, commits its colour
as whole card fields, and keeps the reading path uninterrupted. Memorable moment: the vertical SATASUK masthead
over the contour field, with the reticle lensing the lines under the cursor.

## Proof & Content

Retrieval leads; the platform record is the depth underneath it (emphasis decided with Ze, 2026-07-25).

- Two production retrieval systems on two different problem shapes — `zentry-data` (news search and indexing under
  a deep-research agent, where freshness is the constraint) and XOXONA (knowledge-book selection against an
  unbounded history and a fixed context budget). Both private, neither linkable.
- Radiant — 100k+ users, ~25k peak DAU, 70+ modules, 10 engineers at peak, sole ownership of the quest engine,
  sunset 2026. Past tense throughout, carries the spot-red sunset mark.
- Nine public solo repos — the only place a reader can read actual code.
- The agent-directed-development statement, with a build-provenance table that includes this site.

## Constraints Specific To This Surface

- Contact is LinkedIn + GitHub only. Both actions must clear the fold on a 390px phone — the hero's min-height
  subtracts the running head's height for exactly this reason.
- **No lead title.** Ze was never formally a Technical Lead; the ownership facts are stated instead. See the note
  in `src/content/profile.ts`.
- No commit statistics. Radiant is past tense. Only the live product may carry the cyan Live/Current state.
- Static export. Imagery is the portrait, the three product covers and two hobby photos in `public/images/`; the rest is procedural (contour shader, enamel wear, barcodes).
- Native scroll only. Nothing may be gated behind scroll depth; Product Principle 1 outranks the scroll effect.

## Memorable Moment

**The survey poster.** SATASUK runs down the left edge as a vertical Kanit 900 masthead over a live contour map;
the pointer lenses the lines under a cyan reticle and a press ripples through them. Everything around it is HUD
furniture — corner brackets, BKK timecode, coordinates, the blue status tag. The field is raw WebGL1 and additive:
without it the hero is the same page on a static survey grid.

## Unresolved

- **Retrieval implementation detail is pending from Ze** and must not be guessed: vector store, embedding model,
  chunking, hybrid vs dense, reranking, context-budget allocation. Each entry in `src/content/retrieval.ts` carries
  its own `pending` list. This is the most interview-relevant material on the page.
- XOXONA and Radiant screenshots — Ze has both; paths not yet supplied. Radiant's are irreplaceable.
- The hangar was built unattended from Ze's written brief and references; he has not reviewed the render yet.
