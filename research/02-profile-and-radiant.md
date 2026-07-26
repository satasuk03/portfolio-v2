# Profile & Radiant/GuildFi Deep Dive — Extraction

> Source files (read in full):
> - `/Users/satasuk/Desktop/Obsidian/office-work/me/profile.md` (as-of 2026-04)
> - `/Users/satasuk/Desktop/Obsidian/office-work/me/radiant-experience.md` (as-of 2026-04, condensed version)
> - `/Users/satasuk/Desktop/Obsidian/office-work/me/radiant-guildfi-deep-dive.md` (as-of 2026-04, full technical history)
>
> Supplementary files checked but **not usable** (no career content): `/Users/satasuk/Desktop/Obsidian/office-work/xoxona/TODO.md` (empty template), `/Users/satasuk/Desktop/Obsidian/office-work/journal/*` (journal system templates, no accomplishment content).
>
> Trust note from source: profile.md explicitly states the portfolio repo's old `/resume` route contains "embellished content" and that **these Obsidian notes are the trusted record.**

---

## 1. Identity

- **Full name:** Satasuk Viparksinlapin
- **Preferred name / goes by:** Ze
- **Location:** Bangkok, Thailand
- **Title(s):** Software Engineer → Technical Lead (current, at Cryptomind Group / Zentry, on Radiant.gg)
- **Phone:** (+66) 80 941 5693
- **Email (personal):** satasuk03@gmail.com
- **Email (work):** satasuk@zentry.com
- **LinkedIn:** linkedin.com/in/satasukVip (http://www.linkedin.com/in/satasukVip)
- **GitLab:** https://gitlab.com/satasuk01
- **Languages:** Not explicitly stated in source (presumed Thai native / English professional — not confirmed in text, do not assert on site without checking).

## 2. Bio / Positioning

No dedicated "about me" bio section exists in the source — the closest quotable framing comes from the professional-experience summary and the Radiant docs. Strongest verbatim lines:

- "Full Stack Engineer and Feature Lead on Radiant.gg (formerly GuildFi) — 100k+ users, ~25k daily actives (as of April 2026)."
- "Started as quest-system engineer, grew into Technical Lead owning architecture, production incidents, and mentorship across the platform."
- "Sole owner of the quest system from its first line to its Temporal-based redesign."
- "Grew from feature engineer to technical lead across a 70+ module backend, 5 apps, and multiple microservices."
- "Drove the technical pivot from a Web3 scholarship platform to a real-time PC gaming engagement product."
- On career-wide skill framing: "Backend at scale: Temporal.io, gRPC/tRPC, PostgreSQL, Redis, RabbitMQ, Kubernetes."

## 3. Skills (grouped, with stated proficiency where noted)

**From profile.md — explicit proficiency levels:**
- **Advanced:** Python, JavaScript, TypeScript, Node.js, React.js, Next.js
- **Intermediate:** SQL, database design, software engineering practice

**Backend at scale (no explicit level, but called out as a distinct competency cluster):**
Temporal.io, gRPC, tRPC, PostgreSQL, Redis, RabbitMQ, Kubernetes

**Additional skills implied by Radiant tech stack (deep-dive docs), grouped by category:**

| Category | Technologies |
|---|---|
| **Languages** | TypeScript, JavaScript, Python, Go, Solidity |
| **Backend frameworks** | Node.js 20, Express.js, TypeORM, tRPC v10, gRPC |
| **Frontend frameworks** | Next.js 16, React 19, Tailwind CSS, TanStack React Query, React Hook Form |
| **Workflow orchestration** | Temporal.io (workflows, activities, workers, interceptors) |
| **Databases / data layer** | PostgreSQL, Redis (ioredis), MongoDB, Neo4j, Typesense |
| **Messaging / real-time** | RabbitMQ, Socket.IO, Centrifuge |
| **Blockchain** | ethers.js v5 (wallet signing, on-chain holdings validation), Solidity/Hardhat (Renewable Energy Certificate PoC) |
| **Auth / identity** | Passport.js, OAuth (Discord, Twitter/X, Google, Facebook, Steam, Epic Games, Razer), Cloudflare Turnstile |
| **Desktop** | Electron (ow-electron — Overwolf's fork), Overwolf GEP SDK, IPC |
| **Observability** | Datadog APM, OpenTelemetry, Winston logging |
| **Feature management** | GrowthBook feature flags |
| **Infrastructure** | Docker, Kubernetes (GKE), Turborepo + Yarn Workspaces, GitHub Actions CI/CD |
| **Data / ML (from education + side work)** | Pandas, Selenium, SQLAlchemy, Tableau; random forest, XGBoost, LightGBM, CatBoost, SVM (senior thesis) |
| **Email/notifications** | SendGrid, Novu, Reloadly |

*Note: "AI" tooling is not explicitly present as a skill category in these source docs — no mention of LLM/AI product work by Ze personally (only ML algorithms in the university senior project). Flagging this gap since the extraction brief asked for an AI category.*

## 4. Work Experience Timeline (reverse-chronological, exact dates as given)

1. **Cryptomind Group | Zentry — Software Engineer → Technical Lead**
   *Dec 2021 – present, Bangkok*
   Full Stack Engineer and Feature Lead on Radiant.gg (formerly GuildFi). Started as quest-system engineer; grew into Technical Lead. Currently also working on XOXONA (separate internal project, no substantive content found in Obsidian notes beyond an empty TODO template).

2. **Blockfint — Software Engineer (BA / SA / Dev / QA)**
   *May 2020 – Dec 2021, Bangkok*
   Core-banking projects: Savings, Lending, and Certificate of Deposit systems.
   - **Lending Interim Solution (CLI)** — Dev Lead. Interest/fee calculation, billing, payment processing built in response to new lending regulations. Delivered in **two months** with a **team of three**; mentored **two junior developers**. Stack: Go, PostgreSQL.
   - **Core Banking — Certificate of Deposit** — fixed-savings system, inter-bank transfers via API, General Ledger interfacing, reports, deposits/withdrawals. Wore BA, SA, and developer hats.
   - **Loan Origination** — digital loan-origination form; React Native (mobile) + React.js (desktop).

3. **Blockfint — Front-end Developer (part-time)**
   *Feb 2020 – May 2020, Bangkok*
   React.js websites and React Native mobile apps.

4. **Phatra Asset Management — Data Engineer (part-time)**
   *Jun 2019 – May 2020, Bangkok*
   ETL and automated data management in the Research Department: scraping/extracting/transforming data into databases, Tableau visualization, data pipeline improvements. Notable: ETL pipeline extracting Thai dam water levels (Python, Pandas, Selenium, SQLAlchemy).

**Education (reverse-chronological):**
- **Chulalongkorn University** — B.Eng. Computer Engineering, 2016–2020, GPA 3.15. Senior project: predicting cancer types from tumour DNA signatures with a reduced gene set (random forest, XGBoost, LightGBM, CatBoost, SVM).
- **Debsirin School** — Math-Science program, 2013–2015, GPA 3.74.

**Extracurricular / side work (not full roles, listed separately):**
- Renewable Energy Certificate (PoC) — blockchain token incentivizing green energy generation; Go, Solidity/Hardhat, PostgreSQL (Blockfint, Nov 2021)
- Flutter apps — e-commerce Shop App (Flutter + FastAPI + PostgreSQL) and Personal Expenses app (2021, Udemy course work)
- Blockfint Hackathon (2020) — strategic-planning team on hiring strategy and employer branding

**Outsource / side projects (with years):**

| Project | Year | Role & Notes |
|---|---|---|
| peahackathon2026.riseaccel.com | 2026 | Official website for PEA Hackathon 2026 (PEA × RISE Accel, "MOVE for Growth" — energy innovation PoCs in Grid Operation and Logistics & Supply Chain) |
| agrowth.nia.or.th | 2025 | Official website for NIA's AGROWTH — Thailand's first AgTech accelerator (12-week program pairing deep-tech agri startups with corporate partners) |
| Salak Mabin | 2023 | SWE/BA/SA — lottery-selling web app: DB schema, payment gateway, cart & shop backend. Stack: PostgreSQL, Redis, TypeScript, Next.js |

## 5. Radiant / GuildFi Deep Dive

### 5.1 What the products were

- **GuildFi (2021–2022)** — a **Web3 guild and scholarship platform** built during the play-to-earn (P2E) boom. Business model: GuildFi acquired NFTs/tokens from partner game studios and lent them to "scholars" (players) who couldn't afford buy-in; scholars played and shared a percentage of earnings back to GuildFi. Partners: **Axie Infinity** (turn-based monster battle; Axie NFTs, SLP tokens), **Pegaxy** (horse racing P2E; Pega NFTs), **Cyball** (football card P2E; CyBall NFTs, CBT tokens).
- **Radiant (2023–present)** — after the GameFi collapse (2022–2023), the product pivoted to a **gaming engagement platform for PC gamers**. It integrates the **Overwolf SDK / Game Events Provider (GEP)** to capture real in-game activity (kills, matches, ranks) from titles like Fortnite, Valorant, League of Legends, CS2, and Apex Legends, and ties this to quests, achievements, battle passes, leaderboards, a shop, and a reward economy. Spans a web app, a native Electron+Overwolf desktop app, and a multi-microservice backend with Temporal orchestration.

### 5.2 Architecture

**Monorepo:** Turborepo (Yarn workspaces), structure:
```
radiant-app/
├── backend/                  # Core Node.js API server (70+ modules)
├── frontend-radiant/         # Next.js user-facing web app (port 3003)
├── admin-radiant/            # Next.js admin dashboard (port 3004)
├── radiant-desktop-app/      # Electron desktop app (Overwolf integration)
├── overwolf-svc/             # Overwolf game transaction sidecar service
├── game-tracker-svc/         # gRPC game stats tracking service
├── recommend-svc/            # gRPC recommendation service
├── partner-game/             # Partner game integration module
├── e2e/                      # Playwright end-to-end tests
├── packages/                 # @radiant/class, types, ui, hooks, utils, email, i18n, constant; @guildfi-svc-api
```

**Request flow (backend):** Web/desktop → Next.js frontend → tRPC → Express backend → {PostgreSQL (TypeORM), Redis, Typesense, MongoDB, Neo4j, RabbitMQ} → Temporal Workers (shop, quest, battlepass, leaderboard, referral) → gRPC service clients (money, reward, item, game, user, buff, ...) → external APIs (Discord, Twitter, Steam, Epic, Overwolf, Reloadly).

**Desktop flow:** Electron app → Overwolf GEP SDK → game events (Fortnite, Valorant, LoL, CS2...) → gRPC → `game-tracker-svc` → `overwolf-svc` → backend (quest/achievement triggers).

**Temporal workers (separately deployed processes):**

| Worker | Task Queue | Responsibility |
|---|---|---|
| `shop` | `shop` | Product purchases, inventory transactions |
| `quest` | `quest` | Quest pack claims, streaks, rerolls, challenges |
| `battlepass` | `battlepass` | Season progression, tier unlocks |
| `leaderboard` | `leaderboard` | Ranking updates, season endings, reward distribution |
| `referral` | `referral` | Referral milestone processing |

**Backend module count:** 70+ modules across core infra, auth/identity, user/progression, game systems, reward economy, engagement, communication/notifications, content/admin. (Full module tables are in the source file if needed for detail — key ones: `questNext`, `achievement`, `battlepass`, `leaderboardV2`, `engagementEngine`, `dailyLogin`, `gxp`, `reward`, `inventory`, `shop`, `lootbox`, `crafting`, `giftCode`, `monetary`, `buff`, `staking`, `realTimeMessaging`, `realTimeNotification`.)

### 5.3 Ze's specific ownership and role

- Joined as **Quest System Engineer** on GuildFi — designed and built the entire Quest System (the platform's engagement/validation layer) from scratch: Discord verification, Twitter/X verification, external partner API validation, on-chain wallet validation via `ethers.js`.
- As GameFi collapsed and the product pivoted to Overwolf/Radiant, grew into **Technical Lead** — owning: architectural decisions before implementation, reviewing/approving significant technical changes platform-wide, debugging production incidents across systems he didn't originally write, driving cross-service consistency (quest ↔ shop ↔ battlepass ↔ leaderboard ↔ achievement), infrastructure decisions (Temporal adoption, gRPC vs tRPC, DB selection), technical onboarding/mentoring, and acting as the eng↔product liaison for technical feasibility.
- Verbatim: "Sole owner of the quest system from its first line to its Temporal-based redesign."
- Verbatim: "Drove the technical pivot from a Web3 scholarship platform to a real-time PC gaming engagement product."

### 5.4 Systems built (quest system in depth — Ze's signature system)

**Old (GuildFi) quest system:** stateless, binary completion checks; 4 validation types (Discord, Twitter, External API, On-chain); no partial progress, no real-time tracking.

**New quest system — `questNext` (Radiant era):** Full redesign built on **Temporal.io**, supporting:
- Real-time game-event-driven quest completion
- Partial progress tracking (e.g., "get 10 kills" increments)
- Multi-step quest packs (ordered objective groups)
- Streaks (consecutive completion bonuses) with retroactive streak repair
- Rerolls (pay cost to replace an objective)
- Passive challenges (long-running accumulating missions)
- Buffs (multipliers/discounts on rewards and costs)

Module structure: `challenge/`, `questPack/` (with workflows: `claim-quest-pack`, `repair-streak-and-claim-quest-pack`, `reroll-quest-pack`), `questStreak/`, `questBuff/`, `objective/`, `games/config/` (per-game quest configs).

Key workflows: `claim-quest-pack`, `repair-streak-and-claim-quest-pack`, `reroll-quest-pack`, `claim-challenge`, `claim-bonus-reward`.

### 5.5 Technical challenges solved (7 total, per deep-dive §12)

1. **Quest system redesign for real-time game events** — full rebuild on Temporal to support partial progress, time-bounded quests, rerolls, streak repair, buff modifiers (vs. the old stateless binary system).
2. **Overwolf per-game event normalization** — Overwolf's GEP SDK is per-game/non-standardized (e.g., Fortnite's kill event differs between standard and Zero Build modes; some games drop/delay events under load). Solved with per-game adapters, schema validation, idempotent event ingestion. "Multiple PRs in the git history address this specifically."
3. **Production memory leak — stateful singleton in distributed workers** (flagship incident, see §6 below for full detail).
4. **Temporal adoption/operational complexity** — worker identity management, task queue isolation (misconfiguration silently misroutes tasks), OpenTelemetry trace propagation across workflow/activity boundaries (a missing interceptor silently breaks tracing), debugging via Temporal execution history rather than app logs.
5. **Multi-database consistency** — a single quest completion must atomically touch PostgreSQL (quest state), Redis (GXP balance + leaderboard ZSET), and RabbitMQ (notification); solved via Redlock distributed locks, the Outbox Pattern, and row-level locking (`SELECT ... FOR UPDATE`).
6. **Multi-provider identity & account linking** — 7+ identity providers (Discord, Google, Twitter, Steam, Epic, Razer, Zentry, wallet) each double as quest-validation sources; challenges include account merge conflicts, OAuth token refresh (Twitter tokens cached with 30-minute refresh cycles), quest attribution across linked accounts, and on-chain nonce management to prevent replay attacks.
7. **Monorepo scale and build performance** — 70+ backend modules, 5 frontend/desktop apps, 10+ shared packages; required TypeScript project references for incremental compilation, Turborepo task graph to avoid redundant builds, and running 5–6 dev processes concurrently.

### 5.6 The production memory-leak incident (flagship war story — good portfolio material)

- **Root cause:** `initOverwolf()` starts a perpetual 1-second heartbeat loop against PostgreSQL, intended to run once as a singleton in the backend HTTP server. It was mistakenly being invoked inside **every** Temporal worker pod (shop, quest, etc.) as well.
- **Mechanics of the failure:**
  - `heartbeat()` uses `setTimeout` self-scheduling, always rescheduling in `finally` — a perpetual timer chain.
  - The timer holds a closure over the DB connection pool and a rollback function registry, which are never garbage-collected.
  - With **5+ pods per worker type** across multiple worker types, this produced **dozens of concurrent heartbeat loops** all hammering the same `transaction_outbox` table.
  - This exhausted the PostgreSQL connection pool, causing pending `pool.connect()` promises to queue in memory indefinitely (the actual memory leak).
  - Race conditions on `setTransactionOutboxFinalizedOnce()` meant N-1 pods threw errors every cycle, each accumulating error state.
- **Fix:** Removed `initOverwolf()` from all Temporal workers; heartbeat now runs exclusively as a true singleton in the backend HTTP server.
- **Lesson (verbatim):** "Stateful singleton services must never be instantiated inside horizontally scaled stateless processes. Temporal workers are designed to be state-free executors."

### 5.7 Scale / metrics numbers

- **100k+ users** on Radiant.gg (as of April 2026)
- **~25k daily actives** (as of April 2026)
- **70+ backend modules**
- **5 apps** (backend, frontend-radiant, admin-radiant, radiant-desktop-app, plus microservices) — quoted as "70+ module backend, 5 apps, and multiple microservices"
- **5+ pods per worker type** in the memory-leak incident, multiplied across "N worker types" → "dozens" of concurrent heartbeat loops
- **5 different data stores** in the data layer (PostgreSQL, Redis, MongoDB, Neo4j, Typesense)
- **7+ identity providers** (Discord, Twitter/X, Google, Steam, Epic Games, Razer, crypto wallet, Zentry, Facebook)
- **1-second (1000ms) heartbeat loop** interval (both as designed, and as the leak mechanism)
- **30-minute refresh cycle** for cached Twitter OAuth tokens
- No explicit TPS, transaction volume, cost-savings-in-dollars, or latency numbers are given anywhere in these three source docs — flagging this as a gap versus the extraction brief's ask for such figures. If needed for the portfolio, these would need to come from another source or be reconfirmed with Ze directly.

### 5.8 Migrations

- **GuildFi → Radiant rebrand/pivot** (2022–2023): Web3 wallet identity → Steam/Epic/game-account identity; static partner quests → real-time in-game event-driven quests; simple reward claims → full engagement engine (battle passes, loot boxes, daily logins, achievements, leaderboards, crafting, shops); manual scholarship assignment → automated game-tracking pipelines; single PostgreSQL DB → multi-database architecture (PostgreSQL + MongoDB + Redis + Neo4j + Typesense); monolithic Express app → monorepo with distributed microservices + Temporal orchestration.
- **Quest system migration**: stateless/binary GuildFi quest system → Temporal-based `questNext` engine (full redesign, not incremental).
- **Ad-hoc async logic → Temporal.io**: before Temporal, shop purchases/reward distribution/quest claiming used ad-hoc async code, Redis locks, and manual retry logic — leading to partial-failure inconsistent states and no visibility into long-running operations. Temporal introduced durable execution, built-in retries, full execution-history visibility, and exactly-once semantics via workflow IDs.

### 5.9 Team size / leadership

- No explicit headcount numbers for the current Radiant team are given (unlike the Blockfint CLI project, which explicitly states "team of three," "mentored two junior developers").
- Leadership scope for the Technical Lead role: "cross a 70+ module backend, 5 apps, and multiple microservices" — i.e., platform-wide technical ownership, not a stated direct-report count.
- Responsibilities as Technical Lead: architecture design, code/change review and approval authority, cross-system incident triage, cross-service consistency enforcement, infra decision-making, mentoring, and product-liaison duties.

### 5.10 Timeline of phases

| Phase | Period | Description |
|---|---|---|
| **Phase 1 — GuildFi (Web3 Guild Platform)** | 2021–2022 (peak P2E era) | Built quest system; NFT/token lending model with Axie Infinity, Pegaxy, Cyball |
| **Phase 2 — Pivot to Overwolf (GameFi collapse)** | Late 2022 – 2023 | GameFi collapse forced pivot; built native desktop app on Overwolf GEP; rebrand to Radiant |
| **Phase 3 — Technical Lead** | 2023–present | Scope expansion; Ze becomes Technical Lead across architecture, incidents, mentorship |
| Ze's tenure at Cryptomind Group/Zentry overall | Dec 2021 – present | Spans all three phases above |

## 6. Quantified Achievements (every hard number found, with context)

| Number | Context |
|---|---|
| **100k+** | Users on Radiant.gg (as of April 2026) |
| **~25k** | Daily active users on Radiant.gg (as of April 2026) |
| **70+** | Backend modules in the Radiant monorepo, owned/overseen as Technical Lead |
| **5** | Apps in the platform (backend, frontend-radiant, admin-radiant, radiant-desktop-app + microservices) |
| **5** | Different data stores used (PostgreSQL, Redis, MongoDB, Neo4j, Typesense) |
| **7+** | Identity/auth providers integrated (Discord, Twitter/X, Google, Steam, Epic, Razer, wallet, Facebook, Zentry) |
| **5+ pods per worker type** | Scale at which the production memory-leak incident manifested (dozens of concurrent heartbeat loops) |
| **1 second (1000ms)** | Heartbeat loop interval in `overwolf-svc` (transaction outbox/log processing) |
| **30 minutes** | Twitter OAuth token cache/refresh cycle for quest validation |
| **2 months** | Delivery time for the Blockfint Lending Interim Solution (CLI) |
| **3** | Team size (as Dev Lead) for the Lending Interim Solution project |
| **2** | Junior developers mentored on that project |
| **12 weeks** | Length of NIA AGROWTH's AgTech accelerator program (context for the site Ze built, not his own metric) |
| **3.15** | GPA, B.Eng. Computer Engineering, Chulalongkorn University (2016–2020) |
| **3.74** | GPA, Debsirin School Math-Science program (2013–2015) |
| **May 2020 – Dec 2021** | Tenure at Blockfint as Software Engineer (~19 months) |
| **Dec 2021 – present** | Tenure at Cryptomind Group/Zentry (ongoing, ~4.5+ years as of source date April 2026) |

## 7. Notable Projects (portfolio case-study candidates, one-line pitch each)

1. **Radiant.gg (formerly GuildFi)** — Led the technical pivot of a Web3 play-to-earn guild platform into a 100k+ user real-time PC gaming engagement product, owning the quest engine end-to-end through a full Temporal-based redesign.
2. **The Production Memory Leak Fix** — Diagnosed and resolved a subtle distributed-systems bug where a singleton heartbeat service, mistakenly instantiated across every Temporal worker pod, exhausted the database connection pool at scale — a strong "war story" for demonstrating debugging depth.
3. **Quest System Architecture (Temporal-based redesign)** — Designed a durable-workflow quest engine supporting partial progress, streak repair, rerolls, and buff modifiers, replacing a stateless binary system — good case study in workflow-orchestration design.
4. **Overwolf Game-Event Normalization Pipeline** — Built per-game adapters to normalize Overwolf's non-standardized GEP event schemas (Fortnite, Valorant, LoL, CS2, Apex) into a single quest/achievement engine.
5. **Blockfint Lending Interim Solution (CLI)** — As Dev Lead, delivered a regulation-driven interest/billing/payment system in two months with a 3-person team while mentoring two juniors (Go, PostgreSQL).
6. **Thai Dam Water Level ETL Pipeline** (Phatra Asset Management) — Automated scraping/ETL pipeline for Thai dam water level data into Tableau-visualized databases (Python, Pandas, Selenium, SQLAlchemy).
7. **PEA Hackathon 2026 website** (peahackathon2026.riseaccel.com) — Official site for a PEA × RISE Accel energy-innovation hackathon ("MOVE for Growth"), covering Grid Operation and Logistics & Supply Chain tracks.
8. **NIA AGROWTH website** (agrowth.nia.or.th) — Official site for Thailand's first AgTech accelerator, a 12-week program pairing deep-tech agri startups with corporate partners.
9. **Salak Mabin** (2023) — Lottery-selling web app where Ze covered SWE/BA/SA roles: DB schema, payment gateway integration, and cart/shop backend (PostgreSQL, Redis, TypeScript, Next.js).
10. **Cancer type prediction from tumor DNA (senior thesis)** — Predicted cancer types from tumor DNA signatures using a reduced gene set across five ML models (random forest, XGBoost, LightGBM, CatBoost, SVM) — good if the portfolio wants a data-science angle.

## 8. Sensitive Content — DO NOT publish as-is on a public site

- **Personal contact info**: phone number `(+66) 80 941 5693` and personal email `satasuk03@gmail.com` appear in profile.md. A public portfolio should likely omit the phone number entirely and consider using only a contact form or the work email, per the user's preference.
- **Internal codebase/architecture detail**: The deep-dive doc exposes fairly granular internal system design — specific module names (`questNext`, `overwolf-svc`, `game-tracker-svc`), internal service/task-queue names, DB table names (`transaction_outbox`, `transaction_log`), function names (`initOverwolf()`, `setTransactionOutboxFinalizedOnce()`), and a specific production incident with root-cause detail. This is good **portfolio narrative material** in generalized form (the memory-leak story, the quest redesign) but the very granular internals (exact table/function names, internal module directory structure) may be considered proprietary to Zentry/Cryptomind and should probably be abstracted/genericized rather than reproduced verbatim on a public site. Recommend checking with Ze/employer before publishing exact internal naming.
- **Partner/business relationship specifics**: GuildFi's partnerships with Axie Infinity, Pegaxy, and Cyball, and the revenue-share business model ("took a share of in-game earnings") are described in some detail. This is publicly-known information about GuildFi's business (it was a known Web3 project), so likely fine, but flagging since it touches on a former employer's business model/financials in general terms (no exact revenue/financial figures are given, so no hard financial confidentiality issue found).
- **No credentials, API keys, salary figures, or named third-party individuals** were found anywhere in the three source documents — this is a clean, individual-focused technical record with no leaked secrets or private personal data about others.
- **profile.md's own internal warning**: The note explicitly flags that the *old* portfolio's `/resume` route contained "embellished content" that should not be trusted — worth keeping in mind if any old portfolio copy is reused; these Obsidian notes are the authoritative source per the user.
- **XOXONA project**: mentioned as a current project but the only file found (`xoxona/TODO.md`) is an empty template with no real content — nothing sensitive, but also nothing usable for the portfolio from this source.
