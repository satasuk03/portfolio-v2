# GitHub Work Inventory — Satasuk "Ze" Viparksinlapin

Gathered via `gh` CLI (authenticated as `satasuk03`) on 2026-07-25.

- **Org repos (ZentryHQ):** 104 total (96 private / 8 public, 7 archived)
- **Personal repos (satasuk03):** 46 total (2 forks)
- Deep-dived (README + languages + commit/contributor analysis): 18 org repos + 7 personal repos, chosen for size, recency, and relevance to zentry-data / radiant / xoxona families.

**A note on attribution:** GitHub's `?author=satasuk03` commit filter and the `/contributors` endpoint match by *verified GitHub login*, and many of Ze's commits are made under the git identity `satasuk@zentry.com` / display names "Zeze Vip", "Zeze", "zeze", or "Satasuk Viparksinlapin" — not always linked to the `satasuk03` login. Where that happened, I re-derived authorship from raw commit author names (`commit.author.name`) rather than trusting a 0-count from the login filter. Contributor counts below are lifetime counts from GitHub's contributor stats API; "Ze's share" is Ze-identified-name commits ÷ total repo commits.

---

## A. Work — ZentryHQ

### zentry-data family (data platform)

**zentry-data** — private, active (created 2025-09-01, last push 2026-06-05)
"zData" is described in its own README as "the foundational data intelligence layer of the Zentry platform, aggregating and refining fragmented inputs from on-chain activity, social signals, gaming, and lifestyle data into structured, permissioned, and monetizable insights" — powering Zentry's AI agents/apps via ETL pipelines, synthetic data generation, and dev-facing APIs/SDKs. TurboRepo monorepo (Node ≥20, pnpm).
- Stack: TypeScript 12.9M chars (99.8%), HTML 1.97M, negligible JS/Dockerfile/Shell.
- Total commits: 2,403. Contributors: palsp/Supasin Liulak 1,706 (71%, lead author), **Ze 518 (21.5%, #2 contributor)**, pakkaponwattanawaha 84, toey-sup 54, others small.
- Ze is a solid secondary contributor, not the lead.

**zdata-cms** — private, active (created 2025-08-13, pushed 2025-12-04)
Payload CMS-based service ("pnpm payload migrate:create" workflow); minimal README (setup only, no product description).
- Stack: TypeScript 66.8K, CSS 21.3K, Dockerfile, JS.
- Contributors: PassamonBoo 21, TisavaraSomboon 5. **No commits from Ze** — not his repo.

**datahub-web** — private, active (created 2025-05-20, pushed 2025-12-12)
Bare-bones Next.js app, README still the default `create-next-app` boilerplate (no product description recovered).
- Contributors: TisavaraSomboon 80, jakapatb 34, Kitipatteacha 1. **No commits from Ze.**

**rolg-data-integration** — private, low-activity (created 2025-05-20, pushed 2025-05-21)
ETL service that extracts data from "ROLG" (a Zentry gaming property) using Temporal for workflow orchestration/scheduling.
- Stack: TypeScript 18.7K, JS, Dockerfile.
- Contributors: **Ze only, 4/4 commits (100%)** — small but solely authored.

**rolg-marketplace-og-image** — private (not deep-dived; likely a small OG-image microservice for the ROLG marketplace, name-only from listing).

### radiant family (GuildFi / gaming data & rewards platform)

**radiant-app** — private, active, long-running (created **2021-08-11**, pushed 2026-04-24)
README identifies this as the original **GuildFi** application ("Hello and welcome to GuildFi!") — now internally called Radiant. A large, multi-year monorepo.
- Stack: TypeScript 14.6M chars, PLpgSQL 766K (Postgres-heavy), JS 545K, Go 105K, plus MDX/CSS/Dockerfile/Shell.
- Total commits: **36,616** (huge, ~4.5 years of history). Top contributors: jakapatb 4,380, Kitipatteacha 4,057, mickyngub 3,329, palsp 3,121, **Ze 3,087 (#5, ~8.4%)**, birdglove2 2,859, Khongchai 2,535, toey-sup 2,325, punchvv 2,309, pakkaponwattanawaha 2,004, plus 10 more contributors.
- Large long-lived team codebase; Ze is a top-5 contributor by volume but one of many on a big team.

**radiant-query-api** — private, small (created 2025-04-08, pushed one day later 2025-04-09)
"Tools for AI agents to access user gaming data" — a thin API/MCP-style tool layer.
- Stack: TypeScript 2.9K, HTML.
- Contributors: **Ze 17/22 commits (77%, lead author)**, code7551 5.
- Small repo but clearly Ze's own build — good "AI + gaming data" case study if it can be described without linking (private).

**radiant-backend** — private, archived, essentially inactive (created & pushed same day 2024-01-25). Contributors: Phureewat A only (3 commits). **Not Ze's work.**

**radiant-temporal** — private, essentially inactive (created & pushed same day 2024-03-29). Contributors: Phureewat A only (5 commits). **Not Ze's work.**

**radiant-extension-poc**, **radiant-pilot-env-pipeline** — listed in org but not deep-dived (proof-of-concept / infra pipeline repos, low signal from names alone).

### xoxona family (AI companion platform — current flagship project)

**xoxona** — private, the **most active repo in the whole org right now** (created 2026-03-20, pushed 2026-07-25 — today). This is clearly Ze's current main project.
"AI companion chat platform built with NestJS and Next.js." pnpm + Turborepo monorepo: `apps/backend` (NestJS 11 REST API), `apps/frontend` (Next.js 16 + React 19), `apps/scripts` (DB seeding), `packages/dal` (MongoDB data-access layer, no ORM), `packages/objects` (shared DTOs), `packages/logger` (Winston).
- Stack: NestJS 11, MongoDB 8 (direct driver), LangChain + Google AI, Next.js 16, React 19, Tailwind v4, shadcn/ui, next-intl (EN/TH), JWT-in-httpOnly-cookies + Google OAuth, Cloudflare R2 storage, Docker Compose (Mongo replica set).
- Languages: TypeScript 5.97M chars (93%), HTML 415K, CSS 42K, JS, Shell, Dockerfile, MDX.
- Total commits: 4,426. Contributors: punchvv 1,540 (35%), **Ze 1,465 (33%, #2)**, jakapatb 1,372 (combined with "Jakkapat Boonroj" alt-identity 239) → really jakapatb-family ≈1,611 (36%), Claude (bot/co-authored commits) 42, PassamonBoo 4, TisavaraSomboon 3.
- Effectively a 3-person core team (punchvv / Ze / jakapatb) building a modern AI-companion product end-to-end. **Strongest, most current, most balanced case study** — full-stack + AI integration + i18n + auth, and Ze is genuinely one of the primary authors, not a bystander.

No other repo names matched "xoxona" directly — this looks like a single, tightly-scoped monorepo rather than a multi-repo family.

### Other ZentryHQ repos of note

**kobo-backend** — private, active (created 2026-03-02, pushed 2026-06-05)
"Kobo" — AI companion platform: users chat with AI companions with persistent conversations, long-term memory (LLM tool-calling), token-budgeted usage. Desktop app (Tauri v2 + Rust + Unity 3D frontend), web app (Next.js 16), LINE bot, TUI test harness.
- Stack: Bun runtime, Hono, Effect-TS, MongoDB (cloud) + PGLite (local) with Drizzle ORM, Redis+BullMQ, Anthropic Claude + Google Gemini via AI SDK/LangChain+LangGraph, ElevenLabs/Fish Audio TTS, better-auth + Google OAuth, Silero VAD (ONNX) for voice, Biome/Ultracite lint, Vitest.
- Languages: TypeScript 2.57M, Rust 634K, small CSS/Shell/HTML.
- Contributors: jakapatb 911 (78%), **Ze 158 (13.5%)**, nae-zentry 79. Ze is a real but secondary contributor here — same AI-companion space as xoxona/kobo, suggesting this may be an earlier or sibling project to xoxona.

**zai** — private, active (created 2025-05-23, pushed 2026-06-09)
"zAI 2.0" — open-source-style AI chatbot template/monorepo (Bun workspaces, Next.js App Router, Hono backend, AI SDK, shadcn/ui, Neon Postgres, Vercel Blob, Auth.js), forked/adapted from Vercel's AI chatbot starter.
- Languages: TypeScript 3.59M, Mustache 45K (email templates likely), JS/CSS/Shell/Dockerfile.
- Contributors: jakapatb 1,563, punchvv 742, birdglove2 610, code7551 540, kerlos 159, teezentry 145, **Ze 139 (~2.4%, minor)**. Not a strong Ze credit.

**zentry-infrastructure** — private, very active by commit volume but almost entirely bot-driven (created 2023-12-14, pushed 2026-07-24). GitOps repo (ArgoCD/Helm templates for k8s). Contributors: github-actions[bot] 24,027 (automated), PassamonBoo 1,657, code7551 327. **No Ze commits** — infra owned by others/CI.

**card-vault** — private, very active (created 2026-05-07, pushed 2026-07-24)
Well-documented product: digital marketplace + pack-opening platform for physical PSA-graded Pokémon cards in a secure vault; ERC-721 cards on Monad, Stake-style commit-reveal randomness, NestJS/Next.js/Drizzle/tRPC/Privy stack. Genuinely interesting Web3+gaming product, but **contributors are pakkaponwattanawaha (715), birdglove2 (702), kerlos (77) — zero Ze commits.** Not his project.

**hikari** — private (created 2026-04-17, pushed 2026-04-27). Desktop VRM/Live2D avatar notification overlay (Electrobun+Bun, Three.js). Single contributor: kerlos (147). **Not Ze's.**

**drawdy** — private, very active (created 2026-02-11, pushed 2026-07-24). No README recovered. Contributors: Khongchai 751, Kitipatteacha 607, nae-zentry 73. **No Ze commits.**

**z-neobank** — private, active (created 2026-02-23, pushed 2026-07-24). Solidity/JS/TS-heavy (neobank/DeFi). Contributors: toey-sup 604, Kitipatteacha 162. **No Ze commits.**

**common** (public) — shared TS package library for the Zentry team. Contributors: Khongchai 17, phureewat29 1. **No Ze commits.**

**zentry-token** (public) — TypeScript+Solidity token repo. Contributors: jarindr 33, palsp 15, phureewat29 6. **No Ze commits.**

**Remaining ~86 ZentryHQ repos not deep-dived** (listed by name/language/activity only — see raw `gh repo list` output categories): zentry-nexus, zai-mcp, zentry-frontend, zentry-adrs, zentry-vault-backend, zentry-oft, zigma-pfp-foundry, z-hive(-magic-moments), pdpa-platform, z-service (archived), tts-server, alicia-3d / alicia-web / alicia-3d-electron / alicia-contracts / alicia (an "Alicia" AI-companion/3D family — parallel to xoxona/kobo/zai, worth a follow-up look), wallet-mcp, ZomeBot, swarm, charting-library, zai-watcher, zentry-vault, zentry-bridge-web, zigma-landing-page, see-a-i, zai-deep-research-bot, zai-cronjob, zai-eval-tests, coingecko-typescript, zigma, zentry-circulation, cryptopanic-scraper, zai-cli (public), game-indexer, azul-discord-bot, zentry-challenge (public), zoltan-shop, zentry-rolg-landsale, zentry-ccip (public), zai-code-executor, ai-agent-data-api, grok-chat, svc-pirate-nation-event-tracker, zentry-vault-claim, onchain-indexer (Rust), cmc-mcp-server, agents-studio (archived), ronin-market-sdk (public), blockchain-scripts, ai-game-caster, nexus-ai-fine-tuning/-test-runner, svc-steam-profile, zoltan-osat, zentry-staking-l2, zentry-cloud-infrastructure, virtuals-agentic-ai, FxTwitter, z-burndown-chart (archived), zentry-sdk-go (Go), zigma-pfp, guildfi-staking-v2, zentry-strapi, zentry-comingsoon, spectre-admin (archived), guildfi-grant-role-bot, gf-staking-autotask/-bot, guildfi-spirit-dao, gf-search-demo, binance-batch-withdraw, axie_scholarship_tracker, guildfi-discord-ninokuni, discord-quiz-bot-v2, appsmith-test, twitter-api-python, cryptomind-app (archived). Given time constraints these were not README/commit-audited; if any specific one matters for the portfolio, worth a targeted follow-up (the "Alicia" companion family in particular parallels xoxona/kobo and may be worth checking).

---

## B. Personal Projects (satasuk03)

All 46 personal repos are 100%-Ze-authored where checked (no other contributors appear — these are solo side projects). Sorted by portfolio strength:

1. **wenfang-chinese-toolbox** (public, active May 2026) — 文房 Wénfáng, a bilingual (Thai/English) Chinese-study tool (flashcards + stroke-order lookup). Astro 5 (static output) + Tailwind v4 + TypeScript strict, deployed to Cloudflare Pages, with i18n-parity checks and full quality tooling (astro check, ESLint, Prettier). Clean, polished, ships a real niche product. **Strong portfolio piece** — shows product taste + full ownership of a deployed app.

2. **philm** (public, May 2026) — "Philm," a browser-based photo darkroom: upload a photo, apply `.cube` LUT film emulation, frame/sticker/export PNG. Next.js static export, LUT math done via Web Trilinear interpolation in a Web Worker with Safari fallback. TypeScript/HTML/CSS. Technically interesting (color science + worker-based performance engineering) and visually demoable. **Strong pick.**

3. **auto-backtesting** (public, Feb 2026) — "Let an LLM be your quant": a backtesting engine where you describe a trading strategy in English, an LLM (via Claude Code) generates the Python strategy code, and the engine backtests it against cached Binance OHLCV data with interactive charts. Python. Clever, on-trend "AI + finance" idea with a real CLI workflow. **Good pick** — demonstrates AI-tool-building instinct.

4. **riko-chrome-companion** (public, Mar 2026) — Chrome extension: a draggable, chat-enabled anime companion (Manifest V3) powered by OpenAI/Anthropic/Gemini, with a "social detox" nudge feature, emotion system, and time-tracking. JavaScript/HTML/CSS, has demo GIFs and a packaged release. **Good, demo-friendly pick** — playful but technically complete (browser extension + multi-provider LLM integration + persistent UI state).

5. **micro-gfx** (public, Jul 2026) — MicroGfx: a tiny, dependency-free SVG generator for "hand-drawn technical instrument" graphics (fake telemetry cards/spec labels/contact-sheet posters), seeded/reproducible, exports PNG/SVG, zero build step. TypeScript/JS. A nice generative-design/creative-coding piece with a distinctive aesthetic — good visual portfolio asset.

6. **thai-personal-finance-planner** (public, May 2026) — A Claude Agent Skill that turns Claude into a Thailand-specific financial planner (tax filing ภงด. 90/91, SSF/RMF/Thai ESG, social security tiers, retirement projection), bilingual, MIT-licensed, ships a 7-round interview workflow producing HTML dashboards. Strong domain-modeling + prompt-engineering showcase, very "AI agent tooling" relevant to current market.

7. **fable-dev-skill** (public, Jul 2026) — "dev-fable," a Claude Code skill turning Claude into an orchestrator that plans/decomposes/delegates dev work across subagents (deep-reasoner/fast-worker/explorer), with dual-perspective synthesis for high-stakes decisions. Meta/tooling piece — demonstrates agent-orchestration design thinking, timely for an AI-engineering portfolio.

**Other notable personal repos (not deep-dived, from listing):**
- **kimi-sub-agents** (public, Jul 2026) — Kimi Code skill delegating routine work to sub-agents to cut token usage.
- **kimi-plugin-cc** (public, Jul 2026) — lets Kimi be invoked from Claude Code for delegated coding/reasoning.
- **media-gen-skills** (public, Apr 2026) — a collection of Claude/Kimi-compatible agent skills for AI-driven media generation.
- **grok-browser-use-automation** (private, Jul 2026, Python) — browser automation via Grok.
- **vox-style-video-prompt-creator** (private, Jul 2026, Python).
- **florify**, **chutas-bakery**, **bakery-crm** (TypeScript, small business-app-shaped projects, Apr–Jun 2026).
- **portfolio** (public, Apr 2026, TypeScript) — an earlier portfolio site (predecessor to this one).
- **zeze-chrome-companion** / **zeze-oracle-app(+backend)** — earlier iterations of the AI-companion concept (predates riko-chrome-companion), JS/TS.
- **go-clean-architecture** (public) — a Go clean-architecture boilerplate, shows backend/Go competency beyond the TS-heavy day job.
- **3js-learning / 3js-learning-2**, **godot-survival-game**, **godot-top-down-shooter**, **space-shooter-playground** — game-dev/graphics learning projects (Three.js, Godot/GDScript, C#/Unity-adjacent).
- **pdf-ai-companion** (Svelte), **novel-translator**, **investment-notify** (Jupyter) — smaller AI-utility experiments.
- 2 forks (`log-ow-electron`, `generative_agents`) — not original work, exclude from portfolio.

---

## C. Tech Stack Rollup (aggregate across all 150 repos)

**Primary language distribution (by repo count, all 150 repos):**
| Language | Repos | Share |
|---|---|---|
| TypeScript | 90 | 60% |
| None/Other (docs, config-only) | 17 | 11% |
| JavaScript | 12 | 8% |
| Python | 6 | 4% |
| Solidity | 3 | 2% |
| HTML | 3 | 2% |
| GDScript | 3 | 2% |
| C#, Go (2 each) | 4 | 3% |
| CSS, Jupyter Notebook (2 each) | 4 | 3% |
| Go Template, Rust, SCSS, HCL, Shell, MDX, Astro, Svelte (1 each) | 8 | 5% |

**Framework/tool rollup, weighted by how often they recur in deep-dived READMEs (rough, qualitative):**
- **Backend frameworks:** NestJS (xoxona, radiant-app-adjacent), Hono (kobo-backend, zai), Effect-TS (kobo-backend) — clear trend toward lightweight Bun/Hono/Effect over heavier Nest in newer projects.
- **Frontend:** Next.js (App Router) is the default across nearly every product repo (xoxona, kobo-backend, zai, card-vault, datahub-web, philm) — React 19, Tailwind v3/v4, shadcn/ui are the standard UI kit.
- **Runtime/package manager:** Bun is now the default runtime+package manager for new/current repos (kobo-backend, zai, card-vault); pnpm/Turborepo for monorepo orchestration (xoxona, zentry-data, card-vault).
- **Databases:** MongoDB (direct driver, no ORM) dominant for AI-companion products (xoxona, kobo-backend cloud side); Postgres via Drizzle ORM or PLpgSQL for financial/gaming-ledger products (card-vault, radiant-app, kobo-backend local); PGLite for embedded/local-first data.
- **AI/LLM stack:** Anthropic Claude + Google Gemini + AI SDK + LangChain/LangGraph recur across xoxona, kobo-backend, zai — this is the team's standing AI-integration pattern. ElevenLabs/Fish Audio for TTS, Silero VAD for voice input.
- **Web3:** viem, Foundry, Solidity 0.8.x, ERC-721 (card-vault); token/staking contracts elsewhere (zentry-token, z-neobank, guildfi-staking-v2).
- **Infra:** Docker Compose for local dev everywhere; ArgoCD/Helm/GitOps for prod (zentry-infrastructure, bot-automated); Tauri v2 + Rust for desktop apps (kobo-backend).
- **Personal-project stack:** Python for AI/data tooling (auto-backtesting, media-gen-skills), Astro for static/content sites (wenfang), vanilla JS/Chrome Extension APIs for browser tools (riko-chrome-companion), Godot/GDScript and Three.js for game/graphics experiments.

**Overall picture:** Ze operates as a TypeScript-first full-stack engineer (Next.js/React front end, Node/Bun/NestJS/Hono back end) with a consistent specialization in **AI-companion / conversational-agent products** (xoxona, kobo-backend, zai, plus personal riko-chrome-companion and zeze-* predecessors) and a secondary thread in **gaming/Web3 data platforms** (radiant-app/GuildFi, zentry-data, rolg-data-integration). Personal work skews toward **Claude/agent tooling and skills** (fable-dev-skill, thai-personal-finance-planner, kimi-plugin-cc, media-gen-skills) and small polished creative/utility apps (philm, micro-gfx, wenfang).

---

## D. Portfolio Recommendations — Top Picks

Ranked by genuine authorship + technical substance + how well it demos:

1. **xoxona** (ZentryHQ, private) — Current flagship. Full-stack AI-companion platform, Ze is #2 contributor at 33% of 4,426 commits, live and actively shipping (pushed today). Best "this is what I do at my day job" story: NestJS/Next.js/MongoDB/LangChain monorepo. *Private — describe only, no repo link; consider a screenshot/demo video instead.*

2. **radiant-app / GuildFi** (ZentryHQ, private) — 4.5-year, 36K-commit gaming-rewards platform. Ze is a top-5 contributor (3,087 commits, 8.4%) on a large team. Good evidence of sustained, large-codebase engineering (TypeScript + PLpgSQL + Go) rather than a green-field toy. *Private — describe only.*

3. **zentry-data** (ZentryHQ, private) — Data-intelligence layer aggregating on-chain/social/gaming data into an AI-agent-facing product. Ze is #2 contributor (518/2,403, 21.5%). Good "data engineering at scale" story. *Private — describe only.*

4. **kobo-backend** (ZentryHQ, private) — Sibling AI-companion product with a genuinely interesting stack (Effect-TS, Bun, Tauri+Unity desktop client, voice pipeline with Silero VAD, LangGraph). Ze at 13.5% is a real secondary contributor. *Private — describe only; useful to show range beyond xoxona.*

5. **radiant-query-api** (ZentryHQ, private) — Small but Ze-led (77% of commits): AI-agent tool layer for gaming data. Good if you want a small, fully-owned example rather than only big-team credits. *Private — describe only.*

6. **wenfang-chinese-toolbox** (personal, public) — Polished, deployed, bilingual static app with strong engineering hygiene (i18n parity checks, strict TS, full lint/format/typecheck pipeline). **Linkable.**

7. **philm** (personal, public) — Technically distinctive (Web Worker LUT color-math engine, Safari fallback handling), visually demoable. **Linkable.**

8. **auto-backtesting** (personal, public) — Clear "AI as collaborator" narrative (LLM writes/iterates strategy code, engine backtests it) — timely and easy to explain to non-technical reviewers. **Linkable.**

9. **riko-chrome-companion** (personal, public) — Most demo-friendly/visual (GIFs, packaged Chrome extension, multi-LLM-provider chat companion). **Linkable.**

10. **fable-dev-skill** or **thai-personal-finance-planner** (personal, public) — Pick one as the "agent orchestration / agent skill design" entry, since both showcase current AI-tooling thinking; thai-personal-finance-planner has the more complete, most "product-shaped" README and bilingual domain depth. **Linkable.**

**Private vs. public flag:** All ZentryHQ picks (#1–5) are private — write them up as case studies (screenshots, architecture diagrams, described stack) without a working repo link. All personal picks (#6–10) are public and can be linked directly.

**Follow-up check completed:** the "Alicia" AI-companion sub-family (alicia, alicia-web, alicia-3d, alicia-3d-electron, alicia-contracts) was audited after the initial pass — **zero Ze commits across all five repos** (authors are Jirayu Sukheepoj, Supasin Liulak, Vatunyoo Suwannapisit, nae-zentry). Confirmed not Ze's work; excluded from picks. The remaining ~80 un-audited ZentryHQ repos were not commit-checked given time constraints, but nothing in their names/descriptions suggests a stronger case than the picks above.
