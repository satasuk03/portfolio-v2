# Portfolio v2 — Consolidated Content Source of Truth

> Synthesized from three extractions:
> - `01-old-portfolio.md` — old site at `~/Desktop/dev/portfolio`
> - `02-profile-and-radiant.md` — Obsidian notes (`office-work/me/`)
> - `03-github.md` — GitHub inventory (ZentryHQ 104 repos + personal 46 repos)

## 0. Decisions locked (from Ze, 2026-07-25)

| Decision | Choice |
|---|---|
| **Primary goal** | Hiring-focused (senior/staff/lead), with personality visible but secondary |
| **Sensitivity** | **Genericize** — keep the stories, drop internal names. Radiant/Zentry/XOXONA *may* be named |
| **Design** | **Dark instrument panel** — see §9 for the full spec |
| **Scope** | **Engineering only** for v1 — photography, travel, and @3DZeeGee deferred ("will add later on") |
| **Radiant framing** | **Own the full arc** — GuildFi died in the 2022 GameFi collapse → Ze drove the pivot to Radiant → Radiant sunset 2026. Two market collapses, twice rebuilt. Presented as adaptability under real constraint, not a gap |
| **Commit statistics** | ❌ **Do not publish.** Describe scope in words only — "one of three core engineers", "sole owner of the quest engine", "four years in a large multi-team codebase". No numbers from private employer repos |

**Two corrections from Ze that reshape the content (2026-07-25):**

1. **Radiant has been terminated.** The product is shut down — it is *past* work, not current. Corroborated by
   the repo: `radiant-app`'s last push was **2026-04-24**, and the Obsidian notes are dated April 2026, which is
   when they were the current record. All Radiant copy must be **past tense**: "served 100k+ users", not "serves".
   Ze remains at Zentry — `xoxona` was pushed today — so XOXONA is now the current work by default, not by choice
   of emphasis.
2. **AI-heavy development applies to XOXONA only.** Everything else — Radiant, and the personal projects
   (`philm`, `wenfang-chinese-toolbox`, `micro-gfx`, `auto-backtesting`, `riko-chrome-companion`) — is
   hand-crafted. *This resolves the framing tension cleanly:* Radiant and the public personal repos carry the
   hand-built craft credibility, and XOXONA is honestly the AI-leveraged one. The site does not have to choose
   between "I can build" and "I can direct agents" — it has separate, verifiable evidence for each.

## 0b. Source precedence rule

`profile.md` explicitly warns the old portfolio's `/resume` route contained **"embellished content"** and that the
Obsidian notes are the trusted record. Therefore:

| Rank | Source | Trust it for |
|---|---|---|
| 1 | **Obsidian notes** | Dates, titles, metrics, achievements, architecture, incidents |
| 2 | **GitHub metadata** | Repo existence, tech stack, activity windows, authorship share, links |
| 3 | **Old portfolio copy** | Design tokens, brand, personal-project copy |

Claims appearing **only** in the old resume are quarantined in §11.

> **Attribution caveat that matters:** Ze's commits are often authored as `satasuk@zentry.com` with display names
> "Zeze Vip" / "Zeze" / "Satasuk Viparksinlapin", *not* linked to the `satasuk03` GitHub login. GitHub's
> `?author=satasuk03` filter and `/contributors` endpoint therefore under-report his work — several repos return 0
> for the login filter despite substantial authorship. All shares below were re-derived from raw commit author names.

---

## 1. Identity

- **Legal name:** Satasuk Viparksinlapin
- **Goes by:** Ze — old site's public brand was **"Zeze Vip"** (with the aside *"vip is from my last name"*)
- **Location:** Bangkok, Thailand
- **Current title:** Software Engineer → **Technical Lead**, Cryptomind Group / Zentry
- **Work email:** satasuk@zentry.com
- **LinkedIn:** linkedin.com/in/satasukVip · **GitHub:** github.com/satasuk03 · **GitLab:** gitlab.com/satasuk01
- **Deferred personas:** `@3DZeeGee` (3D art — Patreon/YouTube/X/Bluesky/IG), `zezethewanderer` (IG, travel/photo)
- **Withheld from the site:** personal phone, personal Gmail (§12)

## 2. Positioning

**Recommended through-line:** *systems judgment earned at scale, now applied at a higher level of abstraction* —
hand-built a quest engine → led 70+ modules as Technical Lead → now directs AI agents to ship production product
at ~11 commits/day. Each step is the same skill (knowing what good architecture looks like) applied further up.
That arc is far more distinctive than "full-stack engineer", and every stage is evidenced.

Verbatim lines available from Obsidian:
- "Full Stack Engineer and Feature Lead on Radiant.gg (formerly GuildFi) — 100k+ users, ~25k daily actives."
- "Started as quest-system engineer, grew into Technical Lead owning architecture, production incidents, and mentorship across the platform."
- "Sole owner of the quest system from its first line to its Temporal-based redesign."
- "Drove the technical pivot from a Web3 scholarship platform to a real-time PC gaming engagement product."

Old-site About copy (softer, reusable):
> I'm a software engineer with a passion for creativity and problem-solving. I specialize in backend development,
> building robust and scalable systems that power great user experiences. I'm a fast learner, and highly adaptive.
> I believe in simplicity and clarity.

Old hero tagline: *"Turning complex challenges into elegant solutions, one line of code at a time."*
Old eyebrow: *FULLSTACK ENGINEER · PROBLEM SOLVER · CODE CRAFTSMAN*
Old quote: *"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."* — Antoine de Saint-Exupéry

## 3. Skills

**Verified — Obsidian explicit proficiency:**
- Advanced: Python, JavaScript, TypeScript, Node.js, React.js, Next.js
- Intermediate: SQL, database design, software engineering practice

**Verified — corroborated by Obsidian + GitHub:**

| Category | Technologies |
|---|---|
| Languages | **TypeScript** (60% of 150 repos), JavaScript, Python, Go, Solidity |
| Backend | Node.js, Express, **NestJS 11** (xoxona), Hono, tRPC, gRPC, TypeORM, Drizzle |
| Frontend | Next.js (App Router), React 19, Tailwind v4, shadcn/ui, TanStack Query, React Hook Form, next-intl |
| Orchestration | **Temporal.io** — workflows, activities, workers, interceptors, task-queue isolation |
| Data stores | PostgreSQL (+ PLpgSQL), Redis, MongoDB, Neo4j, Typesense, PGLite |
| Messaging / realtime | RabbitMQ, BullMQ, Socket.IO, Centrifuge |
| **AI / LLM** | Anthropic Claude, Google Gemini, OpenAI, LangChain + **LangGraph**, Vercel AI SDK, agentic dev workflows, Claude Agent Skills, MCP-style tool layers, TTS (ElevenLabs / Fish Audio), Silero VAD |
| Blockchain | ethers.js, viem, Solidity + Hardhat / Foundry, ERC-721 |
| Auth | Passport.js, better-auth, JWT in httpOnly cookies, OAuth (Discord, X, Google, Facebook, Steam, Epic, Razer), Cloudflare Turnstile |
| Desktop | Electron (ow-electron), Tauri v2, Overwolf GEP SDK |
| Observability | Datadog APM, OpenTelemetry, Winston |
| Infra | Docker, Kubernetes (GKE), Turborepo, pnpm, Bun, GitHub Actions, Cloudflare Pages/R2, ArgoCD/Helm (exposure) |
| Feature mgmt | GrowthBook |
| Data / ML | Pandas, Selenium, SQLAlchemy, Tableau; RandomForest, XGBoost, LightGBM, CatBoost, SVM |

**AI is a genuine, current specialization — not a bolt-on.** GitHub shows a consistent AI-companion /
conversational-agent thread across xoxona, kobo-backend, zai, radiant-query-api, plus personal riko-chrome-companion
and the zeze-* predecessors. The team's standing pattern is Claude + Gemini via AI SDK / LangChain / LangGraph.
Ze's personal repos add a whole **agent-tooling** layer (Claude Agent Skills, sub-agent orchestration, Kimi bridges).

**Not supported — do not claim:** RAG, vector databases (§11).

## 4. Canonical experience timeline

1. **Cryptomind Group | Zentry** — Software Engineer → **Technical Lead** — *Dec 2021 – present*, Bangkok
   - GuildFi → Radiant.gg, *Dec 2021 – ~Apr 2026* — **product now terminated** (repo last pushed 2026-04-24)
   - zentry-data ("zData"), *Sep 2025 – Jun 2026*
   - **XOXONA**, *Mar 2026 – present* — current work
2. **Blockfint** — Software Engineer (BA / SA / Dev / QA) — *May 2020 – Dec 2021*, Bangkok
   Core banking: Savings, Lending, Certificate of Deposit.
3. **Blockfint** — Front-end Developer *(part-time)* — *Feb 2020 – May 2020*, Bangkok
4. **Phatra Asset Management** — Data Engineer *(part-time)* — *Jun 2019 – May 2020*, Bangkok

**Education**
- Chulalongkorn University — B.Eng. Computer Engineering, 2016–2020, GPA 3.15.
  Senior project: predicting cancer type from tumour DNA signatures on a reduced gene set (RF, XGBoost, LightGBM, CatBoost, SVM).
- Debsirin School — Math-Science, 2013–2015, GPA 3.74.

> The old site's accordion merged both Blockfint roles into one "FEB 2020 – DEC 2021" entry. The split above is correct.

## 5. Case studies, ranked (hiring-focused ordering)

### C1 — XOXONA · AI roleplay chat platform *(current work — live at https://xoxona.ai/)*

**Confirmed from the live site (2026-07-25):** a **Thai-language AI roleplay chat platform** — headline
*"แชท Roleplay คุยกับ AI ตามสไตล์ของคุณ!"* ("Chat roleplay — talk with AI in your own style"). Users converse
with AI characters in a personalized style. Credits / top-up monetization (freemium). Currently at **public
testing** stage. Minimalist UI, Thai-first with EN/TH i18n in the codebase.

**Ze's role is broader than SWE:** he describes himself as a **product engineer** — part of the **research team**,
discussing and shaping features with the product team, not just implementing them. This is a real positioning
asset for a lead-level site: product judgment plus engineering.

Repo created **2026-03-20**, still shipping daily. pnpm + Turborepo monorepo:
`apps/backend` (NestJS 11 REST), `apps/frontend` (Next.js 16 + React 19), `apps/scripts`, `packages/dal`
(MongoDB direct driver, no ORM), `packages/objects` (shared DTOs), `packages/logger` (Winston).
Stack: MongoDB 8, LangChain + Google AI, Tailwind v4, shadcn/ui, next-intl (EN/TH), JWT-in-httpOnly-cookies +
Google OAuth, Cloudflare R2, Docker Compose with a Mongo replica set.
**Ze: #2 contributor, 1,465 / 4,426 commits (33%)**, on a 3-person core team.

**The AI-leverage case study — and the only one that is.** Ze's own words: *"XOXONA is the app I mostly used AI,
I haven't touched much of the code — normally working on the terminal commanding Claude."* Repo data: #2
contributor, 1,465 / 4,426 commits (33%), ~11.5 commits/day sustained over ~127 days. Both are true — Claude's
output commits under Ze's git identity.

Because Radiant and the personal projects are hand-crafted (§0), this can be told **honestly and without
defensiveness**: the craft is evidenced elsewhere, so XOXONA gets to be the story about *leverage* — what a
Technical Lead's output looks like when eight years of systems judgment is spent on specs, architecture, and
review instead of typing. The claim that survives interview scrutiny is *"I directed this and I can defend every
architectural decision in it"*, not *"I wrote this line by line."* Worth writing in Ze's own voice.
*Private — describe, don't link. Would benefit from a screenshot or demo video.*

### C2 — Radiant.gg / GuildFi *(flagship scale story — private, product terminated ~Apr 2026)*
Web3 play-to-earn guild platform → real-time PC gaming engagement platform. **Served 100k+ users, ~25k DAU** at
peak. Write in past tense throughout.
Overwolf GEP captures live in-game activity (Fortnite, Valorant, LoL, CS2, Apex) driving quests, achievements,
battle passes, leaderboards, loot boxes, crafting, shop. Turborepo monorepo: 70+ backend modules, 5 apps, gRPC
microservices, Temporal workers, five-store data layer, GKE + Datadog + OpenTelemetry.
Repo created **2021-08-11**, **36,616 commits** over ~4.5 years, ~20 contributors.
**Ze: top-5 contributor, 3,087 commits (8.4%)** — plus Technical Lead scope. Languages: TypeScript 14.6M chars,
PLpgSQL 766K, Go 105K.
*Value for hiring: sustained work in a large, long-lived, multi-team codebase — not a green-field toy.*

### C3 — Quest engine redesign on Temporal *(the signature system)*
Old: stateless, binary completion, 4 validation types (Discord, X, partner API, on-chain via ethers.js), no
partial progress. New: durable Temporal workflows supporting partial progress, multi-step quest packs, streaks
**with retroactive streak repair**, rerolls (pay to replace an objective), passive long-running challenges, and
buff multipliers on rewards and costs. Workers isolated per task queue (shop, quest, battlepass, leaderboard,
referral). Ze was **sole owner from first line through the redesign.**
*Genericize: describe the capabilities and the design reasoning, not internal module names.*

### C4 — The production memory leak *(best war story)*
A singleton heartbeat service — a self-rescheduling 1-second timer loop against Postgres, holding a closure over
the connection pool and a rollback registry — was being started inside **every worker pod** rather than once in
the HTTP server. At 5+ pods per worker type across multiple worker types, dozens of concurrent loops hammered the
same outbox table, exhausted the Postgres connection pool, and left `pool.connect()` promises queued in memory
indefinitely — the actual leak. Races on the finalize-once guard meant N−1 pods threw every cycle, accumulating
error state. Fix: run it as a true singleton in the HTTP server only.
**Lesson:** *stateful singletons must never be instantiated inside horizontally scaled stateless processes;
workflow workers are designed to be state-free executors.*
*Genericize: drop real function and table names. The story is fully intact without them.*

### C5 — Overwolf per-game event normalization
Overwolf's Game Events Provider is per-game and non-standardized — Fortnite's kill event differs between standard
and Zero Build modes; some games drop or delay events under load. Solved with per-game adapters, schema
validation, and idempotent event ingestion feeding one unified quest/achievement engine. 5 games live.

### C6 — zentry-data ("zData") *(private)*
The org's data-intelligence layer: aggregates fragmented on-chain, social, gaming, and lifestyle signals into
structured, permissioned, monetizable insights that power Zentry's AI agents and apps — ETL pipelines, synthetic
data generation, dev-facing APIs/SDKs. TurboRepo, Node ≥20, TypeScript 99.8%.
**Ze: #2 contributor, 518 / 2,403 commits (21.5%).** Good "data platform for AI consumers" story.

### C7 — Blockfint Lending Interim Solution (CLI)
Dev Lead. Interest/fee calculation, bill generation, payment processing, driven by new lending regulations.
**Shipped in 2 months, team of 3, mentored 2 juniors.** Go + PostgreSQL.

### Secondary work credits (use as supporting evidence, not features)
- **kobo-backend** *(private, Ze 158 commits / 13.5%)* — sibling AI-companion product with an unusually
  interesting stack: Bun + Hono + Effect-TS, MongoDB + PGLite/Drizzle, Redis/BullMQ, Claude + Gemini via
  AI SDK/LangGraph, ElevenLabs & Fish Audio TTS, Silero VAD (ONNX) voice input, Tauri v2 + Rust + Unity 3D
  desktop client, LINE bot. Useful to show range.
- **radiant-query-api** *(private, **Ze 17/22 commits — 77%, lead author**)* — "tools for AI agents to access user
  gaming data." Small but fully owned; the cleanest example of Ze-as-sole-architect on an AI tool layer.
- **rolg-data-integration** *(private, **Ze 4/4 — 100%**)* — Temporal-orchestrated ETL for a Zentry gaming property.
- **zai** *(private, Ze 139 commits / 2.4%)* — minor credit, probably skip.
- **Core Banking — Certificate of Deposit** (Blockfint) — fixed savings, inter-bank transfers via API, GL
  interfacing, reports, deposits/withdrawals. BA + SA + dev.
- **Loan Origination** (Blockfint) — React Native + React digital loan-origination form.
- **Thai dam water-level ETL** (Phatra) — Python, Pandas, Selenium, SQLAlchemy → DB → Tableau.
- **Renewable Energy Certificate PoC** (Blockfint, Nov 2021) — REC token minted on green-energy generation; Go, Solidity, Hardhat.
- **Cancer-type prediction from tumour DNA** (senior thesis) — 5-model ML comparison.

> **Explicitly NOT Ze's work** (verified zero commits — do not claim): card-vault, hikari, drawdy, z-neobank,
> zentry-infrastructure, zdata-cms, datahub-web, radiant-backend, radiant-temporal, common, zentry-token, and the
> entire "Alicia" 3D-companion family. ~80 further ZentryHQ repos were not commit-audited.

## 6. Freelance / client work

| Project | Year | Notes |
|---|---|---|
| **peahackathon2026.riseaccel.com** | 2026 | Official site for PEA Hackathon 2026 (PEA × RISE Accel, "MOVE for Growth") — Grid Operation + Logistics & Supply Chain tracks |
| **agrowth.nia.or.th** | 2025 | Official site for NIA AGROWTH — Thailand's first AgTech accelerator, 12-week program. Unused images `agrowth-1.webp` / `agrowth-2.webp` exist in the old repo |
| **Salak Mabin** | 2023 | Online lottery e-commerce — DB schema, cart/checkout, shop backend, payment gateway. SWE + BA + SA. Next.js, TypeScript, PostgreSQL, Redis |

## 7. Personal projects — all public and linkable

The old site listed only 3 of these. GitHub shows 46 repos, all solo-authored — and per Ze, **hand-crafted**
(unlike XOXONA). That makes this section load-bearing: it is the public, linkable, inspectable proof that Ze
builds, which is exactly what lets the XOXONA AI-leverage story be told without hedging. Two coherent threads:

**Thread A — AI / agent tooling** *(strongly on-market for a 2026 hiring audience)*
1. **fable-dev-skill** (Jul 2026) — "dev-fable": a Claude Code skill that turns Claude into an orchestrator, planning and delegating dev work across sub-agents (deep-reasoner / fast-worker / explorer) with dual-perspective synthesis for high-stakes calls. *Pairs directly with the XOXONA narrative — this is Ze building his own leverage.*
2. **thai-personal-finance-planner** (May 2026) — a Claude Agent Skill turning Claude into a Thailand-specific financial planner: tax filing (ภงด. 90/91), SSF/RMF/Thai ESG, social-security tiers, retirement projection. Bilingual, MIT-licensed, 7-round interview workflow producing HTML dashboards. Strong domain modeling + prompt engineering.
3. **auto-backtesting** (Feb 2026, Python) — "let an LLM be your quant": describe a trading strategy in English, an LLM generates the Python strategy, the engine backtests it against cached Binance OHLCV with interactive charts.
4. **riko-chrome-companion** (Mar 2026) — Manifest V3 Chrome extension: a draggable pixel-art anime companion you chat with across tabs. OpenAI + Anthropic + Gemini, Shadow DOM isolation, emotional sprite states, "social detox" nudges, time tracking. Ships demo GIFs and a packaged release. *Most demo-friendly.*
5. **kimi-sub-agents**, **kimi-plugin-cc**, **media-gen-skills** (Apr–Jul 2026) — further agent-tooling: sub-agent delegation for token reduction, Kimi↔Claude Code bridging, AI media-generation skills.

**Thread B — polished craft apps**
6. **philm** (May 2026) — browser photo darkroom: upload a photo, apply `.cube` LUT film emulation, frame/sticker/export PNG. Next.js static export; trilinear LUT interpolation in a **Web Worker** with a Safari fallback. *Real color science + performance engineering, and visually demoable.*
7. **wenfang-chinese-toolbox** (May 2026) — 文房 Wénfáng, bilingual TH/EN Chinese-study tool (flashcards + stroke-order lookup). Astro 5 static + Tailwind v4 + strict TS, deployed to Cloudflare Pages, with i18n-parity checks and a full lint/format/typecheck pipeline. *Best engineering hygiene of the set.*
8. **micro-gfx** (Jul 2026) — dependency-free SVG generator for "hand-drawn technical instrument" graphics (telemetry cards, spec labels, contact-sheet posters); seeded/reproducible, PNG+SVG export, zero build step. *Generative-design piece with a distinctive aesthetic — could supply visual assets for the site itself.*
9. **go-clean-architecture** — Go clean-architecture boilerplate; useful evidence of Go beyond the TS day job.

**Also present, lower priority:** florify, chutas-bakery, bakery-crm, pdf-ai-companion (Svelte), novel-translator,
investment-notify (Jupyter), zeze-chrome-companion, zeze-oracle-app(+backend), 3js-learning ×2,
godot-survival-game, godot-top-down-shooter, space-shooter-playground, grok-browser-use-automation,
vox-style-video-prompt-creator. Two forks (`log-ow-electron`, `generative_agents`) — exclude.

**From the old site, keep this copy verbatim:**
- **From Chuta** — fromchuta.com — *"A website for a home bakery — showcasing freshly baked goods made with love. Built for my mother's bakery business."*
- **You in Fantasy World** — magic.zeze.app — *"Ever wondered who you'd be in a fantasy world? Court Jester? Goblin Accountant? Discover your hilarious fate with our magical (and mildly ridiculous) fantasy career predictor! — Powered by nothing but your phone number!"*

## 8. Deferred to a later phase (Ze: "will add later on")

- **Photography** — old page was a stub reusing the projects component. Only one real asset exists in the whole old repo: `public/images/photos/sanddune.webp`. Needs source assets before it can be built.
- **Travel** — old page was a coordinate-only dotted world map, unlinked from nav. Places plotted: **South Korea, South Africa, Croatia, Australia, Taiwan, India, Japan (Tokyo), Hong Kong, Macau, Singapore**, hub Thailand. Cheap to port when wanted (`dotted-map` package).
- **@3DZeeGee** — 3D-art persona: Patreon (`/c/3DZeeGee`), YouTube (`@3dzeegee`), X, Bluesky, Instagram — "3D modeling tutorials & timelapses", all free.
- Personality that *should* still appear in v1 per the goal choice: **climbing 🧗** and **photography 📸** as interests, and the more human voice of the old About copy.

## 9. Design notes

### DECIDED: Dark instrument panel

Data-dense and precise, in the register of good observability tooling. Case studies presented as **incident
reports** — symptom → diagnosis → fix — which is the native shape of the memory-leak story and suits the
quest-engine redesign too.

```
bg        #0b0c0e        text     #e7e7e4
panel     #14161a        rule     #24272e
accent    #ffb020        (amber — single accent, used sparingly)

type      JetBrains Mono — readouts, labels, all numerics
          Inter          — headings + body

landing   sparse hero, then a panel of real readouts:
            USERS SERVED   100,000+
            PEAK DAU         ~25,000
            MODULES              70+
            DATA STORES            5
          then timeline → case studies

motion    quick, mechanical, ~120ms; counters tick up once
          must honor prefers-reduced-motion
```

**Consequences to handle:**
- Metrics are **historical** (Radiant is sunset) — readouts must be labelled as such ("served", "peak"), never as live values.
- `/resume` needs a **separate light/print theme** built deliberately; the dark panel cannot carry it. This is known extra work.
- Numbers shown are the verified §10 set **minus commit statistics** (§0).
- `micro-gfx` can still supply generated instrument graphics as real assets — it fits this direction well.
- Accessibility: amber `#ffb020` on `#0b0c0e` passes for large text and UI; verify contrast for any small text before shipping.

> **Strongest design input available: Ze's own `micro-gfx`.** It generates "hand-drawn technical instrument"
> graphics — telemetry cards, spec labels, contact-sheet posters — seeded and reproducible, SVG + PNG, zero build
> step. This is an aesthetic Ze already authored, and it can produce real assets for the site rather than borrowed
> decoration. A diagram-forward or instrument-panel direction becomes an extension of his own work instead of an
> arbitrary moodboard. Strongly recommend building the visual language on it.

**Hard constraints on any direction:**
- Static export (`output: "export"`) — no server routes, no runtime image optimization, no dynamic OG generation.
- The `/resume` route is a **light/print** theme with `@media print`. A dark-only direction needs an explicit answer for that page.
- Local toolchain has **no bun** (Node 24.15, pnpm 10.33) — don't design around a Bun-based setup.

**Old identity (for reference — being replaced, not inherited):**
- Brand gradient `#ff2975 → #17ffb3` (hot pink → mint); palette `terminal-black-800 #141413` (bg), `#252422`, `#393938`, `terminal-white #ededea`, `#57bcc7`
- Fonts via Google CDN `@import`: **Abel** (body), **Poppins** (headings), **Architects Daughter** (hero name only)
- Signature interactions: terminal boot animation on `/`, `BoxReveal` mask reveal, `Lens` cursor magnifier, `ExpandableProjectCard` shared-`layoutId` expand-to-modal, animated nav underline, `WorldMap` path drawing

**Worth carrying over regardless of visual direction:**
- Next.js App Router + React 19 + TypeScript, Tailwind v4 (CSS-first `@theme`, no config file)
- Static export (`output: "export"`, `images: { unoptimized: true }`) — trivial hosting
- `cn()` = clsx + tailwind-merge; `motion` v12 for animation; lucide-react + simple-icons
- The separate **light/print `/resume` route** — genuinely useful, ~800px column, `@media print`, "Print / Save as PDF"
- `useOutsideClick`, `useDebounce` hooks
- Toolchain available locally: Node 24.15, pnpm 10.33, yarn 1.22, npm 11.12 (no bun)

**Drop from the old repo:** fantasy-job components (MysticCard, TarotCard, StarrySkyBg, Particles,
PhoneNumberInput) — they reference missing assets and undefined gold/dark-purple tokens; unused `Card`/`HoverEffect`
and `ShineBorder`; default Next starter SVGs.

**Structure implied by the content:** the Radiant and XOXONA material easily justifies per-project long-form case
study routes rather than one dense page. Recommend: landing → work timeline → case-study routes ×3–4 → projects
index → `/resume`.

## 10. Metrics (verified, with context)

| Number | Context |
|---|---|
| 100k+ | Radiant.gg registered users (Apr 2026) |
| ~25k | Radiant.gg daily active users (Apr 2026) |
| 70+ | Backend modules in the Radiant monorepo |
| 36,616 | Total commits in the Radiant repo over ~4.5 years |
| 3,087 (8.4%) | Ze's commits in Radiant — top-5 of ~20 contributors |
| 4,426 | Total commits in XOXONA since 2026-03-20 |
| 1,465 (33%) | Ze's commits in XOXONA — #2 of a 3-person core team |
| ~11.5 / day | Ze's sustained XOXONA commit rate over ~127 days (the AI-leverage number) |
| 518 (21.5%) | Ze's commits in zentry-data — #2 contributor |
| 77% | Ze's authorship share of radiant-query-api (17/22) — lead author |
| 5 | Apps in the Radiant platform |
| 5 | Data stores (PostgreSQL, Redis, MongoDB, Neo4j, Typesense) |
| 5 | Games with live event integration (Fortnite, Valorant, LoL, CS2, Apex) |
| 5 | Temporal workers / isolated task queues |
| 7+ | Identity/auth providers integrated |
| 1s | Heartbeat interval (design intent + leak mechanism) |
| 30 min | Cached X/Twitter OAuth token refresh cycle |
| 2 months | Blockfint lending solution delivery |
| 3 / 2 | Team size / juniors mentored on that project |
| 46 / 104 | Personal repos / ZentryHQ repos |
| 3.15 | University GPA |

| **10** | Radiant team size at peak (confirmed by Ze) |

**Still missing** (would have to come from Ze): TPS, request volume, p99 latency, uptime/SLO, cost savings, revenue.

## 11. Needs verification — resolved and outstanding

| # | Claim | Status |
|---|---|---|
| 1 | "**6+ years** of experience" | ⚠️ This phrasing came from the file `profile.md` calls embellished. **Recommend not stating a year count at all** — give the start year (2019 / 2020) and let the reader do the arithmetic. Unfalsifiable and reads more confident. |
| 2 | **RAG, Vector Databases** | ❌ **Unsupported.** Absent from Obsidian and from every audited repo. kobo uses LLM *tool-calling* memory, not retrieval. **Omit.** |
| 3 | **NestJS** | ✅ **Confirmed** — NestJS 11 is the XOXONA backend. (Radiant is Express; the old resume conflated the two.) |
| 4 | **FastAPI** | ⚠️ Only evidence is 2021 Udemy Flutter coursework. Too weak to headline; drop or demote. |
| 5 | Blockfint dates as one role | ✅ **Resolved** — use the two-role split in §4. |
| 6 | "AI-integrated applications" | ✅ **Confirmed and then some** — LangChain/LangGraph, Claude/Gemini/OpenAI, agent skills, MCP-style tool layers. Now a headline strength, not a stretch. |
| 7 | Work-code location (GitLab vs GitHub) | ✅ **Resolved** — work is on **GitHub** (ZentryHQ). GitLab holds only 2021 Udemy-era side projects. No GitLab inventory needed. |
| 8 | Ze's XOXONA involvement vs. "barely touched the code" | ✅ **Resolved.** AI-authored commits under Ze's identity. Told as a leverage story, with craft evidenced separately by hand-built Radiant + personal repos. Only remaining sub-question: are the commit numbers publishable (§12.2)? |
| 9 | Radiant team headcount | ❓ ~20 contributors over the repo's lifetime; team size at any given moment unknown. Ask Ze before stating a number. |
| 10 | Radiant termination — how public? | ❓ The product is shut down. Dates and past tense are non-negotiable for honesty, but whether to *say* "the product was sunset" or simply end the date range is Ze's call. See §13 Q2. |

## 12. Sensitivity — settled and remaining

**Settled:** genericize internal detail. Concretely, that means:
- ✅ Name Radiant / GuildFi / Zentry / XOXONA / zentry-data, describe architecture at the pattern level, cite user and scale metrics.
- ❌ Do **not** publish internal function names, DB table names, service/module names, task-queue names, or the monorepo directory tree.
- The memory-leak and quest-engine stories lose nothing genericized — "a singleton heartbeat service instantiated per worker pod" carries the same weight.

**Settled:**
1. **Contact = LinkedIn + GitHub only.** No phone, no email, no contact form.
2. **Commit statistics: not published** (§0).

**Remaining / notes:**
3. **GuildFi business model** (NFT/token lending to scholars for a share of earnings; Axie Infinity, Pegaxy, Cyball) — publicly known, low risk, but it does describe a former employer's model.
4. **XOXONA is an AI roleplay/companion product.** Legitimate and public (Character.AI category), and it's Ze's employer's shipping product, so describing it factually is fine. Worth knowing only that some hiring audiences read the category differently than others — the neutral framing ("consumer AI product, Thai-language, credits model, public testing") carries the engineering substance without leaning on the theme. Ze's call if he wants it more or less prominent.

## 13. Open questions — status

**Answered (2026-07-25):**
- XOXONA → live at https://xoxona.ai/, public testing, Thai AI roleplay chat, credits model. Ze = product engineer on the research team.
- Contact → LinkedIn + GitHub only.
- Freelance sites → all still live, OK to link/screenshot.
- Radiant peak team → **10 members**.
- Design inspiration → impeccable.style; using the `impeccable` skill.

**Still open:**
- TPS / latency / uptime / revenue figures — none available; the readout panel will use the verified set in §10.

## 13b. Superseded question list (kept for reference)

1. **XOXONA** — what does it actually do for users, who is it for, what stage (private beta? launched?), and is there a public URL or screenshots? It's now the lead case study and Obsidian has nothing on it.
2. **AI-orchestration framing** — how prominent, and how do you want it worded? Options range from a quiet skills-section mention to it being the site's whole thesis. And are the commit-velocity numbers publishable?
3. **Which case studies get long-form pages?** Recommend: XOXONA, Radiant (with the quest engine + memory leak as its two technical set-pieces), zentry-data. Blockfint stays a timeline entry.
4. **Any real numbers to add?** TPS, latency, uptime, team size — the site would be stronger with even one or two.
5. **Contact preference** — work email, form, or LinkedIn only?
6. **`/resume` route** — port it into v2? (Recommend yes; it's genuinely useful and cheap.)
7. **Are the freelance sites still live and OK to link/screenshot?** (peahackathon2026.riseaccel.com, agrowth.nia.or.th, fromchuta.com, magic.zeze.app)
