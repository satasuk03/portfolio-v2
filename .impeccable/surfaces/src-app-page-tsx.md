---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

## Scope & Mode

The landing route (`/`). Visitor mode: **Persuade** — the visitor decides whether to open a conversation.

Sibling routes: `/log` is **Read** (comprehension and wayfinding outrank expression). `/arcade` is **Experience**
(the artifact leads; it is the only dark surface on the site).

## Audience & Job

A hiring manager, engineering leader, or senior engineer arriving from LinkedIn, GitHub, or a résumé link. Two
reading speeds must both succeed on this one page: a 30-second mobile skim that resolves role, stack, scale and
location; and a 10-minute desktop read that finds evidence of judgment. The only action is a message on LinkedIn
or a look at GitHub.

## Chosen Form

**The game manual** — a late-80s/early-90s Japanese game-manual print world. Content lives in FIG-numbered figure
frames sized by their contents, and prose refers to figures by number.

**The direction roll was not run.** Ze pinned this world explicitly across three rounds of questions (arcade →
light arcade → Japanese arcade print, then structural intensity over full period pastiche). A user-pinned direction
beats the roll. The execution risk sits in the rendition, not the selection: cream paper plus a tasteful serif is
the safe neighbour this must not collapse into, so the render commits to heavy keylines, halftone at figure density,
and spot inks used as whole fields.

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
- No commit statistics. Radiant is past tense. Only XOXONA may carry the live cyan state.
- Static export, so the figure is procedural — `public/` is empty and no art is coming.
- Native scroll only. Nothing may be gated behind scroll depth; Product Principle 1 outranks the scroll effect.

## Memorable Moment

**The knockout.** `RETRIEVAL` is cut out of a full-bleed sheet of paper, halftone-filled, with a wireframe geodesic
turning behind it — the figure is visible plainly in the open field above the word and through its letterforms. It
is built from three stacked bands and one in-document SVG mask, so it needs no JavaScript: scrolling carries the
opaque band away and reveals the whole drawing.

## Unresolved

- **Retrieval implementation detail is pending from Ze** and must not be guessed: vector store, embedding model,
  chunking, hybrid vs dense, reranking, context-budget allocation. Each entry in `src/content/retrieval.ts` carries
  its own `pending` list. This is the most interview-relevant material on the page.
- XOXONA and Radiant screenshots — Ze has both; paths not yet supplied. Radiant's are irreplaceable.
- Three rendered comps were never generated (image generation spends Ze's own grok quota); the direction was
  approved from ASCII palette previews instead.
