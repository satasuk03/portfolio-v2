# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** hiring managers, engineering leaders, and senior engineers evaluating Satasuk "Ze" Viparksinlapin for
**remote / international** roles at three levels he is targeting simultaneously:

1. **AI Engineer** — retrieval systems, LLM product engineering, agent-directed development. *The headline
   identity as of 2026-07-25, and what the site leads with.*
2. **Senior backend / full-stack IC** — deep hands-on systems work. The depth underneath the AI framing.
3. **Product engineer / founding engineer** — ships product, shapes features, talks to the product team

*Explicitly not targeting Engineering Manager* — people-management evidence is the thinnest part of the record and
should not be foregrounded.

*Explicitly not claiming a lead title.* Ze confirmed on 2026-07-25 that he was **never formally a Technical
Lead**; the title entered `research/` only via his own Obsidian notes and LinkedIn self-description ("grew into
Technical Lead"). Every ownership fact beneath it stands and should be stated plainly — sole ownership of the quest
engine, architecture review and cross-system incident debugging across a 70+ module backend — but the title itself
must not appear anywhere on the site.

**Their situation:** two distinct reading modes, both of which must work.
- A recruiter or hiring manager skims for 30 seconds, often on mobile, often arriving from LinkedIn or a résumé PDF. They need level, stack, scale, and location resolved almost instantly.
- An engineer or eng leader reads for 10–15 minutes on desktop, looking for evidence of real judgment: how he decided, what broke, what he did about it.

**Their job:** decide whether to open a conversation. The site's only conversion is a message on LinkedIn or a
look at GitHub.

## Product Purpose

A personal portfolio that gets Ze into AI-engineer, senior backend, and product-engineer interviews at remote-first companies.
Success is a qualified inbound conversation, and — just as important — a site that makes the *first interview
easier* by pre-loading the interviewer with the right two or three stories.

## Positioning

The combination is the claim, and each part is independently verifiable. **Retrieval leads; the platform record is
the depth underneath it** (emphasis decided with Ze, 2026-07-25):

- **Two production retrieval systems, on two different problem shapes.** `zentry-data` — news search and indexing feeding a deep-research agent. XOXONA — a knowledge-book system that selects which long-form lore a roleplay character needs for the current turn, against an unbounded history and a fixed context budget. Different retrieval problems, not one pattern applied twice.
- **Four and a half years inside one large, long-lived, multi-team codebase** (~36.6k commits, 10 engineers at peak, 70+ backend modules) — with **sole ownership of its core engine** from first line through a full durable-workflow redesign. This is not green-field toy work.
- **Twice rebuilt a product through a market collapse.** GuildFi died in the 2022 GameFi collapse; Ze drove the technical pivot to Radiant; Radiant itself was sunset in 2026. Adaptability under genuine constraint.
- **Product engineer, not ticket-taker.** On XOXONA he sits on the research team and shapes features with product, on a live consumer AI product.
- **Two kinds of proof, held separately and honestly.** Radiant and nine public solo repos are hand-built craft. XOXONA is deliberately AI-leveraged. He can therefore talk about agent-directed development without it being a hedge against not being able to build.

A neighboring candidate can copy the stack list. They cannot copy the sunset-twice arc, the sole engine ownership,
or having both hand-built and AI-directed evidence side by side.

## Operating Context

- Arrives from LinkedIn, GitHub, a résumé PDF link, or a recruiter's ATS note.
- Must survive being skimmed on a phone in a hallway, and reward being read properly on a desktop.
- Radiant's product is **dead** — nothing can be verified by clicking through to a live app. Case studies must carry their own evidence: narrative, architecture, saved screenshots.
- XOXONA is live (https://xoxona.ai/) but **private-source** — describable and screenshottable, not linkable to code.
- The nine strongest personal repos are public and directly inspectable — the only place a reader can read Ze's actual code.
- A printable résumé is part of the real workflow: people save and forward PDFs.

## Capabilities and Constraints

**Technical**
- Next.js 15 App Router, React 19, TypeScript, Tailwind v4 (CSS-first `@theme`), static export (`output: "export"`, unoptimized images) — **no server routes, no runtime image optimization, no dynamic OG generation**.
- Local toolchain: Node 24.15, pnpm 10.33. **No bun.**
- English-only. No i18n layer for v1.

**Editorial — non-negotiable**
- **Contact is LinkedIn + GitHub only.** No phone, no email address, no contact form.
- **No commit statistics.** Scope is described in words ("one of three core engineers", "sole owner of the quest engine"). Nothing numeric lifted from private employer repos.
- **Internal detail is genericized.** Radiant, GuildFi, Zentry, XOXONA, and zentry-data may be named; internal function names, DB table names, service/module names, task-queue names, and the monorepo tree may not.
- **Radiant is past tense throughout** — "served 100k+ users", never "serves".
- **No fabricated metrics.** See *Evidence on Hand*.
- Do not state a total years-of-experience figure; give start years and let the reader do the arithmetic. (The "6+ years" phrasing came from a résumé the source notes call embellished.)

**Scope for v1**
- Engineering only. Photography, travel, and the `@3DZeeGee` 3D-art persona are explicitly deferred to a later phase.
- Climbing and photography may appear as interests — personality should be visible but secondary.

## Brand Commitments

- Name: **Satasuk Viparksinlapin**; goes by **Ze**. The prior site used the handle "Zeze Vip" — available, not binding.
- Bangkok, Thailand. Targeting remote/international.
- **Visual direction, decided 2026-07-25 and binding: "The Game Manual"** — a late-80s/early-90s Japanese game-manual print world. Cream stock `#F2EFE6`, soft black ink `#14120E`, three spot inks (print cyan `#0A7C93`, spot red `#E8332F`, marker yellow `#F5C518`), heavy black keylines, halftone dot fields, FIG-numbered figure frames. Kanit for display, Archivo for prose, Azeret Mono for all numerals. Retro is **structural, not costume** — no paper texture, scanlines, CRT curvature, or faked misregistration. Full system in DESIGN.md.
- **One deliberate inversion:** `/arcade` goes full dark neon (void `#0A0812`, neon cyan `#37E6FF`, magenta `#FF2E6B`, gold `#FFCB2B`) and houses a playable boss battle. It is the only dark surface, earned by the metaphor of walking into an arcade from daylight. Glow is permitted there and nowhere else.
- **Two spent anti-references**, neither to be revived: the *dark instrument-panel* world this replaced (console black `#0b0c0e`, engraved hairlines, amber caution lamp `#ffb020`, JetBrains Mono + Inter), and before it the pink→mint gradient `#ff2975 → #17ffb3` with Abel / Poppins / Architects Daughter and a terminal boot animation.
- **Scroll is native.** No smooth-scroll library, no scroll hijacking, no pinned-viewport-with-spacer architecture. Sticky sections plus a scroll-progress value, because Product Principle 1 (the 30-second mobile skim) outranks the scroll-story effect.
- User-supplied inspiration references: **impeccable.style**, and **zigma-frontend.vercel.app** for scroll-driven 3D and mask technique (mechanics only — its game-art maximalism is not the target).
- **`micro-gfx`** — Ze's own dependency-free generator for seeded "hand-drawn technical instrument" SVG graphics — is available to produce real assets for the site. Preferred over borrowed decoration, since it is his own work.

## Evidence on Hand

**Written source of truth** (in-repo):
- `research/00-synthesis.md` — consolidated, decision-annotated content record. **Use this, not the old site.**
- `research/01-old-portfolio.md`, `02-profile-and-radiant.md`, `03-github.md` — raw extractions.

**Verified facts available to publish:** Radiant served 100k+ users / ~25k peak DAU, 70+ backend modules, 5 apps,
5 data stores, 5 live game integrations, 5 Temporal workers, 7+ identity providers, **10 engineers at peak**;
Blockfint lending system shipped in 2 months with a team of 3 while mentoring 2 juniors; Chulalongkorn B.Eng.
Computer Engineering 2016–2020.

**Live and linkable:** xoxona.ai · peahackathon2026.riseaccel.com · agrowth.nia.or.th · fromchuta.com ·
magic.zeze.app — all confirmed still live. Nine public personal repos under github.com/satasuk03.

**Pending from Ze:** XOXONA screenshots and Radiant screenshots/recordings — he has both. Radiant's are
irreplaceable now the product is sunset. XOXONA's can alternatively be captured from the live site.

**Absences that must not be fabricated:** no TPS, no request volume, no p99 latency, no uptime/SLO, no cost
savings, no revenue. No testimonials, no press, no awards.

**Corrected 2026-07-25 — RAG experience is real.** An earlier version of this file asserted "no RAG or
vector-database experience … contradicted by every audited repo." That was wrong, and wrong for a structural
reason worth recording: the audit covered only the **public** repos, and both RAG systems live in **private**
employer codebases, so the method could not have seen them. Confirmed directly by Ze:
- **zentry-data** — news search and indexing, plus the retrieval layer a deep-research agent queried through.
- **XOXONA** — the knowledge-book system, retrieving long-form lore into a roleplay character's context per turn.

Treat "absent from the public repos" as evidence about the repos, never as evidence about Ze. Retrieval-specific
implementation detail (vector store, embedding model, chunking strategy, hybrid search, reranking) is **pending
from Ze** and must not be guessed at — see *Pending* above.

## Product Principles

1. **Two reading speeds, one page.** Every surface must resolve level/stack/scale to a 30-second skimmer and still reward a 15-minute reader. Neither audience gets a degraded version.
2. **Evidence over adjectives.** Prefer a number, a decision, or a link to inspectable code over a claim about ability. Where no evidence exists, say less rather than reaching.
3. **Incidents are the unit of proof.** What broke, how it was diagnosed, what changed as a result. This is how senior engineers actually assess each other, and it is the shape the strongest material already has.
4. **Honest about the machine.** The AI-leveraged work is labelled as such and separated from the hand-built work. The credibility of both depends on not blurring them.
5. **Dead products still count.** Radiant's sunset is part of the story, not something to route around. Two collapses survived is evidence of judgment, not a gap to hide.

## Accessibility & Inclusion

*Updated 2026-07-25 alongside the visual direction; the previous version of this section referred to the retired
instrument-panel palette, a counter component that no longer exists, and a `/resume` route that was never built.*

- Motion must honor `prefers-reduced-motion`. The scroll-driven figure freezes on one composed frame and every dither reveal renders fully inked — the page loses its choreography and keeps all of its content. Reduced motion may change behaviour but must never change layout.
- **Print Cyan `#0A7C93` is large-text-and-UI only** (`4.2:1` on paper). Anything at body size or below uses Cyan Deep `#08657A` (`5.7:1`). Spot Red `#E8332F` is `3.7:1` — fills and large text only. Marker Yellow `#F5C518` is `1.4:1` and can never set type, only sit behind ink. Verify any new pair before adding it; the ratios for every shipped pair are in DESIGN.md § Colors.
- The site is a **light** surface now, so `/resume` no longer needs a separate print theme — the existing world prints. A résumé route is still unbuilt and remains a real workflow need (people save and forward PDFs).
- Non-native English readers are a real part of the audience (remote/international hiring). Plain, direct sentences over idiom.
- The arcade at `/arcade` is the one dark surface and the one place glow is allowed. It must stay keyboard-operable, announce turn changes politely, and never be required to understand the site.
