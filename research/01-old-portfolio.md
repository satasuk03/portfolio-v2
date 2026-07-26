# Old Portfolio — Full Content & Architecture Extraction

Source repo: `/Users/satasuk/Desktop/dev/portfolio` (Next.js 15 / React 19, static export)

This document is a verbatim extraction of every piece of copy, data, and design detail in the old
portfolio codebase, for reuse in the portfolio-v2 rebuild.

---

## 1. Site structure / full route map

The app router lives at `src/app/`. Layout hierarchy:

```
src/app/
├── layout.tsx              (root layout — html/body, bg-terminal-black-800, React Query provider)
├── page.tsx                 → "/"            — landing terminal animation, CTA into /portfolio
├── link/page.tsx            → "/link"        — linktree-style social links page (branded "@3DZeeGee", 3D art persona — NOT the software-engineer persona)
├── resume/page.tsx          → "/resume"       — light-themed, printable resume (unlisted, no navbar)
└── portfolio/
    ├── layout.tsx            (adds NavBar + card chrome + footer social icons)
    ├── page.tsx              → "/portfolio"          — Hero + About + Skills + Recent Projects
    ├── work/page.tsx         → "/portfolio/work"      — Hero + WorkExperience accordion
    ├── photography/page.tsx  → "/portfolio/photography" — Hero + Recent Projects (NOTE: not an actual photo gallery, appears to be a stub/reused template — no unique photography content or images beyond one photo used elsewhere)
    └── travel/page.tsx       → "/portfolio/travel"    — Hero + WorldMap component with flight-path dots (NOT linked in NavBar; only reachable directly)
```

NavBar (`src/ui/shared/NavBar.tsx`) only links to two routes: **PROFILE** (`/portfolio`) and **WORK** (`/portfolio/work`). The `/portfolio/photography` and `/portfolio/travel` routes exist as pages but are **not** linked anywhere in the UI — they're orphaned/WIP routes. `/resume` is also unlinked from nav (by design, per the spec doc — accessible only via direct URL, with a small "← Portfolio" link back).

Footer (in `portfolio/layout.tsx`) has two social icons: Instagram → `https://www.instagram.com/zezethewanderer/`, GitHub → `https://github.com/satasuk03`.

### Photography & Travel — actual contents

- **Photography page** (`src/app/portfolio/photography/page.tsx`): renders `<MyHeroSection />` + `<MyProject />` — literally the same components as the homepage's project section. There is no gallery, no image grid, no captions. Effectively a placeholder/unfinished page.
- **Travel page** (`src/app/portfolio/travel/page.tsx`): renders `<MyHeroSection />` + a `<WorldMap>` component (dotted world map, SVG-based, from the `dotted-map` package) with animated flight-path arcs from Thailand to other countries. No captions/photos — purely a visual "places visited" map. Locations plotted (all as arcs from a home base):
  - **Thailand** → lat 13.736717, lng 103.523186 (used as hub/origin for most arcs)
  - Destinations: **South Korea**, **South Africa**, **Croatia**, **Australia**, **Taiwan**, **India**, **Tokyo (Japan)**, **Hong Kong**
  - Secondary arcs from **Hong Kong** → **Macau**, **Hong Kong** → **Singapore**
  - Coordinates use an `OFFSET_LAT = -15` applied to all real-world lat values (a visual/layout hack for the map projection, not real geography).
  - No image assets or captions accompany this — it's coordinates only.

Only one actual photo asset exists in the whole repo: `public/images/photos/sanddune.webp` ("sand dune at night"), used inside the About section (see below), not in a gallery.

---

## 2. Bio / About copy (verbatim)

From `src/ui/shared/About.tsx` (portfolio homepage "About me" section):

> Heading: **About me ... 🧑‍💻️ 🧗 📸**
>
> I'm a software engineer with a passion for creativity and problem-solving. I specialize in backend development, building robust and scalable systems that power great user experiences. I'm a fast learner, and highly adaptive. I believe in simplicity and clarity.

Quote block (paired with the sand-dune photo, zoom "Lens" effect):

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."
> — Antoine de Saint-Exupéry

### Hero section copy (`src/ui/shared/MyHeroSection.tsx`)

- Avatar image: `/images/me.webp`, alt `"Zeze Vip — Software Engineer"`, fallback initials **"SV"**
- Eyebrow line: **FULLSTACK ENGINEER · PROBLEM SOLVER · CODE CRAFTSMAN**
- Name / H1: **Zeze Vip**
- Sub-note: *vip is from my last name*
- Tagline: **Turning complex challenges into elegant solutions, one line of code at a time.**

### Skills badges (`src/ui/shared/Skills.tsx`)

Rendered as colored pill badges: **TypeScript**, **Python🐍**, **Backend/Architect**, **SQL**, **React**, **Climbing 🧗**, **Photography 📸**

### Landing-page terminal copy (`src/ui/shared/MyTerminal.tsx`, shown on `/`)

Typing/animated terminal sequence (title: `zeze-portfolio`):
```
> init zeze-portfolio
✔ Loading developer profile.
✔ Scanning engineeering skill matrix..     (sic — typo "engineeering" in source)
✔ Analyzing project history.
✔ Compiling experience database.
✔ Portfolio assets loaded successfully.
⚠ High creativity levels detected!
> Welcome to my digital workspace. I'm Zeze
```
Followed by a button: **"Explore My World 🌎"** → redirects to `/portfolio`.

---

## 3. Work Experience

### 3a. On-site version — `src/ui/WorkExperience.tsx` (accordion on `/portfolio/work`)

Three entries, most-recent-first, rendered as a DaisyUI accordion (`collapse-arrow`), first one expanded by default:

1. **DEC 2021 – PRESENT** — *Software Engineer at Zentry*
   > Working as a full-time Full Stack Engineer and a Feature Lead. Responsible for designing, developing and testing the Radiant web app which has over 100k users and 25k active users per day.

2. **FEB 2020 – DEC 2021** — *Software Engineer/BA/SA at Blockfint*
   > As a full-time Software Engineer specializing in the banking sector, I have worked on core-banking projects involving Savings, Lending, and Certificate of Deposit systems. My responsibilities included gathering requirements, designing, developing, and testing the systems to ensure they meet business and technical specifications.

3. **JUN 2019 – MAY 2020** — *Data Engineer at Phatra Asset Management*
   > As a part-time Data Engineer in the Research Department, I specialized in ETL processes and automated data management. My responsibilities included exploring, scraping, extracting, and transforming data from files or websites, and storing it in databases. Additionally, I utilized various tools, such as Tableau, for data visualization and worked on implementing and improving data pipelines.

### 3b. Full resume version — `src/app/resume/page.tsx` (much more detailed; this is the authoritative/current long-form copy)

**Header:**
- Name: **Satasuk Vip**
- Title: **Software Engineer**
- Contact (redacted in source file itself): Phone `(+66) XX XXX XXXX` placeholder, Email `[EMAIL_ADDRESS]` placeholder, LinkedIn `linkedin.com/in/satasukVip` → `https://www.linkedin.com/in/satasukVip`
  - **Real values found in `docs/SatasukViparksinlapin_April2026.md`:** phone `(+66) 80 941 5693`, email `satasuk03@gmail.com`. Full legal name: **Satasuk Viparksinlapin**.

**About Me:**
> Full-stack engineer and technical lead with 6+ years of experience designing, building, and scaling production systems across fintech, core banking, and consumer gaming. Specialized in distributed architecture, workflow orchestration, multi-database systems, and AI-integrated applications. Comfortable owning features end-to-end — from requirements and architecture to deployment and production operations — and leading engineering teams through complex product pivots.

**Skills (resume version, itemized):**
- Languages: TypeScript, JavaScript, Python, SQL, Solidity
- Frontend: React.js, Next.js, Tailwind CSS
- Backend: Node.js, NestJS, tRPC, FastAPI, Hardhat
- Databases: PostgreSQL, MongoDB, Redis
- AI / ML: LLM Integration, RAG (Retrieval-Augmented Generation), Vector Databases, Prompt Engineering, AI Agents, OpenAI & Anthropic APIs
- Infrastructure: RabbitMQ, Payment Gateway Integration
- Data & ETL: Pandas, Selenium, Tableau, Web Scraping
- Practices: System Design, Database Design, Feature Leadership, Requirements Gathering

**Professional Experience (verbatim, reverse-chronological):**

1. **Cryptomind Group | Zentry** — *Software Engineer → Technical Lead* — Dec 2021 – Present — Bangkok, Thailand
   > Technical Lead on Radiant (formerly GuildFi), a PC gaming engagement platform serving 100k+ users and 25k daily active users. Grew from quest system engineer into the Technical Lead role following the product's pivot from a Web3 guild platform to an Overwolf-integrated desktop gaming product. Own platform-wide architectural decisions, drive cross-service consistency, lead production incident triage, and mentor engineers across a distributed, multi-database system built on Temporal.io workflows and deployed on Kubernetes.

2. **Blockfint** — *Software Engineer (BA / SA / Dev / QA)* — May 2020 – Dec 2021 — Bangkok, Thailand
   > Full-stack engineer on core-banking systems covering Savings, Lending, and Certificate of Deposit products for enterprise banking clients. Delivered features end-to-end — requirements gathering, business and system analysis, backend development, and quality assurance — translating regulatory and business requirements into production-grade financial systems.

3. **Blockfint** — *Front-end Developer* — Feb 2020 – May 2020 — Bangkok, Thailand
   > Part-time front-end developer building responsive web interfaces in React.js and cross-platform mobile applications in React Native for early-stage client projects.

4. **Phatra Asset Management** — *Data Engineer* — Jun 2019 – May 2020 — Bangkok, Thailand
   > Data engineer in the Research Department supporting the investment research team. Designed and maintained ETL pipelines, built web-scraping automations in Python, Pandas, and Selenium to extract market and alternative data from files and public websites into relational databases, and delivered Tableau visualizations to support research workflows.

**Projects (resume section, verbatim):**

1. **Radiant.gg (formerly GuildFi)** — *Technical Lead — Cryptomind Group | Zentry* — 2021 – Present
   > PC gaming engagement platform with 100k+ users and 25k daily active users, tying real-time in-game activity across Fortnite, Valorant, League of Legends, CS2, and Apex Legends to a full reward economy of quests, achievements, battle passes, leaderboards, loot boxes, and crafting. Led the end-to-end architectural redesign following the product's pivot from the original Web3 guild platform — adopting Temporal.io for durable workflow orchestration across quest, shop, battlepass, leaderboard, and referral systems, and a five-store data layer (PostgreSQL, MongoDB, Redis, Neo4j, Typesense) tuned to each access pattern. Owned the core quest engine supporting partial progress tracking, streaks, rerolls, buff modifiers, and per-game event normalization from the Overwolf Game Events Provider SDK, along with an Electron desktop app built on ow-electron. Platform is a Turborepo monorepo of 70+ backend modules and 5+ apps, deployed on Kubernetes (GKE) with Datadog APM and OpenTelemetry-based distributed tracing. Tech stack: TypeScript, Node.js, Express, NestJS, tRPC, gRPC, TypeORM, Temporal.io, PostgreSQL, MongoDB, Redis, Neo4j, Typesense, RabbitMQ, Next.js, React, Socket.IO, Electron, Overwolf SDK.

2. **Peahackathon2026.riseaccel.com** — *Freelance* — 2026
   > Designed and delivered the official event website for PEA Hackathon 2026 — a joint initiative between the Provincial Electricity Authority (PEA) and RISE Accel connecting tech startups with PEA to co-create energy innovation solutions across Grid Operation and Logistics & Supply Chain.

3. **Agrowth.nia.or.th** — *Freelance* — 2025
   > Delivered the official website for NIA's AGROWTH — Thailand's first AgTech accelerator, a 12-week program pairing deep-tech agricultural startups with corporate partners for real-world PoC testing, mentorship, and funding access.

4. **Salak Mabin** — *Software Engineer / BA / SA — Freelance* — 2023
   > Designed and built an e-commerce platform for online lottery sales. Owned the database schema, backend cart and checkout flows, shop system, and payment gateway integration. Tech stack: Next.js, TypeScript, PostgreSQL, Redis.

5. **Lending Interim Solution (CLI)** — *Dev Lead — Blockfint* — 2020 – 2021
   > Led a three-engineer team delivering a lending interim solution for interest and fee calculation, bill generation, and payment processing in response to new lending regulations. Shipped in two months. Owned requirements gathering, analysis, technical direction, and on-time delivery. Tech stack: Go, PostgreSQL.

**Education:**
1. **Chulalongkorn University** — Bachelor of Computer Engineering — 2016 – 2020 — Bangkok, Thailand — GPA: 3.15
2. **Debsirin School** — High School, Math-Science — 2013 – 2015 — Bangkok, Thailand — GPA: 3.74

### 3c. Earlier/alternate resume draft — `docs/SatasukViparksinlapin_April2026.md`

This is a Google-Docs-exported markdown (older/parallel version of the resume, with real contact info and additional sections not in the live `/resume` page). Extra content not in the live resume page:

**Extracurricular Projects** (dropped from live resume per the design spec doc):
- **Renewable Energy Certificate (POC)** — Blockfint, Nov 2021 — blockchain project in Solidity + Hardhat; REC token generated when power plants produce green energy, used as production incentive.
- **Shop App** — June–July 2021 — E-commerce app (mobile + web); frontend Flutter, backend FastAPI + PostgreSQL; part of a Udemy Flutter course. Reference: `https://gitlab.com/satasuk01`
- **Personal Expenses** (Flutter) — May–June 2021 — personal expense tracker app, Web/Android/iOS, from a Udemy Flutter course.
- **Blockfint's Hackathon** — 2020 — worked on a strategic-planning team devising a new hiring strategy for new and experienced employees; practiced cross-functional roles and company-branding strategy.
- **Predicting cancer types from tumour DNA signatures (ML)** — Chulalongkorn University senior project, 2020 — tool to predict cancer type from a reduced gene set using Random Forest, XGBoost, LightGBM, CatBoost, and SVM.

**Also mentioned (but dropped from the live resume per the spec doc as "overlap with experience"):**
- **Core Banking [Certificate of Deposit]** — Software Engineer, Blockfint, 2020–2021 — fixed-savings core banking system: inter-bank fund transfers via API, General Ledger interfacing, report generation, deposits/withdrawals; roles: BA/SA/Dev.
- **Loan Origination** — Front-end, Blockfint, 2020 — React Native (mobile) + React.js (desktop) digital loan-origination form for borrowers and lenders/banks.
- **Web Scraping Projects** — Phatra Asset Management, 2019–2020 — ETL to extract Thai dam water-level data using Python, Pandas, Selenium, SQLAlchemy.

Certifications section: present as a heading but **empty** (no content).

### 3d. Deep-dive engineering narrative docs (context/interview material, not page copy)

Two long-form docs exist purely as reference material (not rendered anywhere in the site) — useful as raw material for case-study / project-detail writing in the new portfolio:

- `docs/RADIANT_EXP_INFO.md` — exhaustive technical deep-dive on the GuildFi → Radiant pivot: platform architecture (Turborepo monorepo structure, 70+ backend modules), the quest system rebuild on Temporal.io, Overwolf GEP SDK integration & desktop app (Electron/ow-electron), five-store data layer (PostgreSQL/Redis/MongoDB/Neo4j/Typesense), observability (Datadog APM, OpenTelemetry, GrowthBook flags), and **7 detailed "Challenges" write-ups** (quest redesign, per-game event normalization, a production memory-leak postmortem involving a stateful singleton heartbeat loop in Temporal workers, Temporal operational complexity, multi-DB consistency, multi-provider identity/account-linking, monorepo build performance).
- `docs/RADIANT_EXP_INFO_SHORT.md` — condensed version of the same narrative (project overview, 3-phase journey: GuildFi → Overwolf pivot → Technical Lead, platform-at-a-glance, tech stack table, 6 condensed key challenges, "Impact" bullet list).

These would be excellent source material for a detailed case-study/project page in the new site (e.g., a "Radiant" project deep-dive), since the current live site only ever summarizes this work in 1–2 sentences.

---

## 4. Projects (portfolio homepage "Recent Projects" section)

From `src/ui/shared/MyProjectSection.tsx`, rendered via the `ExpandableProjectCard` component (`src/ui/shared/ProjectList.tsx` — animated expand-on-click card list using `motion/react` shared layout animations):

1. **Riko Chrome Companion**
   - Category label: "Chrome Extension"
   - Image: `/images/riko.webp`
   - CTA: "Visit" → `https://github.com/satasuk03/riko-chrome-companion`
   - Copy: *A pixel-art anime companion for Chrome — drag her around and chat with her across browser tabs. Supports OpenAI, Anthropic, and Gemini APIs with retro-styled chat, emotional sprite states, and Shadow DOM isolation. Built with vanilla JS and Manifest V3.*

2. **From Chuta**
   - Category label: "Mom's Bakery Website"
   - Image: `/images/fromchuta.webp`
   - CTA: "Visit" → `https://fromchuta.com`
   - Copy: *A website for a home bakery — showcasing freshly baked goods made with love. Built for my mother's bakery business.*

3. **You in Fantasy World**
   - Category label: "Magic Project"
   - Image: `/images/fantasy-world.webp`
   - CTA: "Visit" → `https://magic.zeze.app`
   - Copy: *Ever wondered who you'd be in a fantasy world? Court Jester? Goblin Accountant? Discover your hilarious fate with our magical (and mildly ridiculous) fantasy career predictor! — Powered by nothing but your phone number!*

Card list is data-driven (`const cards = [...]` array of `{ description, title, src, ctaText, ctaLink, content }`), rendered in a responsive 2-column grid on desktop, single column on mobile, with a full-screen expand-on-click modal (Framer Motion `layoutId` shared-element transitions).

### Related project: `/link` page — "@3DZeeGee" social hub

Separate persona/brand page (not part of `/portfolio`), for a 3D-modeling/art content creator identity ("ZEZE" brand, gradient logo). Social links grid:

| Platform | URL | Description |
|---|---|---|
| Patreon | `https://www.patreon.com/c/3DZeeGee` | Tutorials & more (Free) |
| YouTube | `https://www.youtube.com/@3dzeegee` | 3D modeling tutorials & timelapses |
| X (Twitter) | `https://x.com/3dzeegee` | Daily 3D art updates & thoughts |
| Bluesky | `https://bsky.app/profile/3dzeegee.bsky.social` | Alternative social platform |
| Instagram | `https://instagram.com/3dzeegee` | Visual portfolio & behind-the-scenes |

Page header copy: **"@3DZeeGee"**, *"Connect with me across all platforms"*, *"All about 3D modeling & digital art"*; footer: *"All content is completely free to access and enjoy!"*

### The "Fantasy Job Generator" sub-project (`src/heads/ProphecyHead.tsx`)

Head/meta component for a phone-number-based "fantasy medieval job" generator (the `magic.zeze.app` project referenced above). Meta copy:
- Title: **"Fantasy Job Generator | Discover Your Magical Medieval Occupation"**
- Description: *"Turn your phone number into a hilarious fantasy-medieval job! Find out if you're a Goblin Tax Collector, Potion Sommelier, or Royal Jester with our stat-based fate generator."*
- OG description: *"Discover your fantasy-medieval job based on your stats. Will you be a bard or a blacksmith? Try now!"*
- Canonical URL: `https://magic.zeze.app/`

Supporting components in the repo clearly built for this fantasy-job sub-app (not the main portfolio, but present in the same codebase and available for reuse): `MysticCard`, `MysticButton`, `TarotCard` (3D tilt tarot-style card using a `card-frame.webp` asset — not present in `public/`), `StarrySkyBg` / `SkyBg` (particle backgrounds referencing `/images/starry_bg.webp` — also not present in `public/`), `Particles` (canvas particle field, configurable color/quantity/staticity), `PhoneNumberInput` (10-digit OTP-style phone entry using `react-otp-input` + debounce), `Card3D` (pointer-tracked 3D tilt wrapper), `ProgressBase` (Radix Progress).

---

## 5. Design & tech notes

### Stack (`package.json`)
- **Next.js 15.2.4** (App Router), **React 19**, **TypeScript 5**
- Static export: `next.config.ts` sets `output: "export"`, `images: { unoptimized: true }`, and a webpack alias `@` → `src/`
- **Tailwind CSS v4** (`@tailwindcss/postcss`) — CSS-first config via `@theme` in `globals.css`, no `tailwind.config.js`
- **DaisyUI v5** (`@plugin "daisyui" { themes: false; }`) — used for the `collapse`/`collapse-arrow` accordion in Work Experience
- **motion** (`motion/react`, i.e. Framer Motion's new package name) v12 — used pervasively for page/section fade-ins, shared-layout project-card expansion, nav underline, terminal typing animation, world-map path-drawing animation
- **Radix UI primitives**: `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-progress`
- **@tanstack/react-query** v5 — wraps the whole app in root layout, though no querying is visibly used in the extracted pages (likely wired for future data fetching)
- **lucide-react** — icon set (ArrowLeft, Mail, Phone, Linkedin, Printer, ArrowRight, X, Heart, Palette, Camera, Video, Users, ExternalLink, etc.)
- **@icons-pack/react-simple-icons** — brand icons (SiInstagram, SiGithub) used in the footer
- **dotted-map** — generates the SVG dotted world map for the travel page
- **react-otp-input** — used for the (unused-in-main-site) phone-number OTP-style input
- **clsx** + **tailwind-merge** — combined into a `cn()` utility (`src/ui/utils/cn.ts`)
- Package manager: **pnpm** (`pnpm@9.12.3`)

### Fonts
Loaded via Google Fonts `@import` at the top of `globals.css` (not next/font):
```
Abel, Architects Daughter, Poppins (weights 100–900, italic+normal)
```
Tailwind theme font tokens (`@theme` block):
- `--font-poppins: "Poppins", sans-serif` — used for headings, resume name/section headers, project card titles
- `--font-abel: "Abel", sans-serif` — primary body font across almost the entire dark-themed site
- `--font-architects-daughter: "Architects Daughter", cursive` — used only for the big gradient hero name ("Zeze Vip")

The `/resume` page overrides to `font-poppins` for name/headings and `font-abel` for body, on a plain white background (see below) — otherwise fonts are unused there vs. the dark theme.

### Color tokens (`@theme` in `globals.css`)
```css
--color-primary: var(--color-terminal-white);
--color-secondary: var(--color-redish-pink);   /* #ff2975 */
--color-redish-pink: #ff2975;
--color-blue-400: #57bcc7;
--color-terminal-white: #ededea;
--color-terminal-grey: #393938;
--color-terminal-black: #252422;
--color-terminal-black-800: #141413;           /* body background */
--color-dark-blue-800: #090b0c;
```
Signature brand gradient used everywhere (hero name, badges, dividers, buttons, nav active-indicator, box-reveal masks): **`from-[#ff2975] to-[#17ffb3]`** (hot pink → mint/spring green), often as `bg-gradient-to-br from-[#ff2975] from-35% to-[#17ffb3]`. A `.gradient-text` utility class wraps this as `bg-clip-text text-transparent bg-gradient-to-br ...`.

There's also a whole secondary, **unused-on-main-site** "mystic/fantasy" color vocabulary referenced by orphaned components (`gold-300/400`, `dark-purple-400/600/800`, `dark-orange`) — these aren't defined in the current `globals.css` `@theme` block (likely dead/legacy tokens from the fantasy-job sub-project, now producing unstyled/default Tailwind arbitrary values).

Custom animation: `--animate-fade-in-scale: fade-in-scale 0.3s ease-out` (opacity+scale keyframe, 0.5→1.05→1).

### Resume page — separate light theme
The `/resume` route deliberately breaks from the dark theme (per `docs/superpowers/specs/2026-04-11-resume-page-design.md`):
- White background (`bg-white`), near-black text (`text-neutral-900`), muted `neutral-500/600/700` for meta text
- No brand gradient — "neutral slate" thin `border-neutral-900` under section headings
- `font-poppins` for name/headings, `font-abel` for body
- Max-width ~800px centered container
- Print support via `<style jsx global>` + `@media print` (hides `.no-print` chrome, `@page { margin: 0.5in }`, forces color-adjust, avoids page-breaks inside `.avoid-break` entries)
- Unlisted route: no NavBar, accessible only via direct URL; has its own "← Portfolio" back-link and a "Print / Save as PDF" button calling `window.print()`

### Notable UI patterns / component inventory (`src/ui/components/`, `src/ui/shared/`)
- **BoxReveal** — Framer Motion "slide-away box mask" text reveal effect (used heavily on hero text lines, each with a different mask color matching the underlying content)
- **Lens** — mouse-following magnifier/zoom effect over an image (radial-gradient mask + scaled inner content), used on the avatar and the About-section photo
- **FadeInDiv** — simple opacity+translateY fade-in wrapper, used to stagger each homepage section in
- **ExpandableProjectCard** (in `ProjectList.tsx`) — click-to-expand project card using Framer Motion shared `layoutId` transitions into a centered modal, closes on outside-click or Escape
- **WorldMap** — SVG dotted map (via `dotted-map` package) with animated curved flight-path arcs and pulsing endpoint dots (used on `/portfolio/travel`)
- **Terminal / AnimatedSpan / TypingAnimation** — fake terminal UI with a real character-by-character typing effect and staggered animated log lines (used on the `/` landing page)
- **InteractiveHoverButton** — button with a dot that scales up to reveal a "swapped" label + arrow icon on hover
- **NavBar** — animated active-route underline using a shared `layoutId` (`nav-active-indicator`), sticky/blurred header container
- **Avatar / AvatarImage / AvatarFallback** — thin Radix wrapper, fallback initials "SV"
- **Badge** — small pill component with hover-lift + scale, used for skill tags
- **Card / HoverEffect** — a generic dark card + a "hovered background follows cursor between grid cells" effect (uses shared `layoutId="hoverBackground"`) — present in the codebase but not obviously wired into any live page in `portfolio/`
- **ShineBorder** — animated conic/radial shine border effect (masked padding trick) — present but not obviously used on a live page
- **Card3D** — pointer-tracked 3D tilt wrapper (perspective + rotateX/Y driven by CSS custom properties updated on `pointermove`)
- Fantasy-job-only, unrelated to core portfolio persona: **MysticCard**, **MysticButton**, **TarotCard**, **StarrySkyBg**, **SkyBg**, **Particles**, **PhoneNumberInput**, **ProphecyHead** — all reference either missing image assets (`card-frame.webp`, `starry_bg.webp`) or an undefined color palette (gold/dark-purple), so they're effectively legacy/orphaned in the current build, associated with the separate `magic.zeze.app` "fantasy job generator" side-project referenced in the Projects section.

### Hooks
- `useDebounce<T>(term, delay, getValue?)` — generic debounce hook
- `useOutsideClick(ref, callback)` — mousedown/touchstart outside-click detector, used to dismiss the expanded project-card modal

### Image manifest (`public/`)
```
public/
├── file.svg, globe.svg, next.svg, vercel.svg, window.svg   (default Next.js/Vercel starter assets, unused)
└── images/
    ├── me.webp                  — hero avatar
    ├── riko.webp                — Riko Chrome Companion project thumbnail
    ├── fromchuta.webp           — From Chuta project thumbnail
    ├── fantasy-world.webp       — You in Fantasy World project thumbnail
    ├── agrowth-1.webp           — (unused in extracted pages — likely intended for an Agrowth.nia.or.th case study/gallery not yet wired up)
    ├── agrowth-2.webp           — (same, unused)
    └── photos/
        └── sanddune.webp        — "sand dune at night", used once in About section
```
No fonts are self-hosted (all via Google Fonts CDN `@import`). No favicon/OG-image assets found besides the default Next.js SVGs.

### Git history signal (recent commits, most-recent-first)
`Add resume` → `add new project` → `update portfolio` → `add new recent project` → `update work experience` → `Hide sensitive Information` (this is where the resume's phone/email were redacted to placeholders) → `update h1` → `fix height` → `update link page` → `update scrollbar-gutter` → `add travel data` → `update skill badge` → `update ui to match other pages` → `add work section` → `fix about page` → `add github link` → `add instagram link` → `add about me section` → `fix margin` → `update todo`. This confirms the travel/photography pages and the `/link` page were built incrementally and are lower-priority/experimental relative to the core `/portfolio` and `/portfolio/work` pages.

---

## 6. Summary of what's reusable vs. what's stub/legacy for the rebuild

**Solid, ready-to-port content:**
- Full resume copy (experience, projects, education, skills) — most complete and current source of truth
- Homepage hero/about/skills/projects copy
- Work-experience accordion copy (shorter version, resume version is more detailed/current)
- Brand gradient (`#ff2975` → `#17ffb3`), font trio (Abel/Poppins/Architects Daughter), dark palette tokens
- Deep technical narrative on the Radiant/GuildFi project (two docs) — excellent material for an expanded case-study page not present in the old site

**Stub / incomplete / legacy (needs a decision for v2):**
- Photography page — no real content, just reuses the Projects component
- Travel page — only a coordinate-only world map, no photos/captions, not linked in nav
- `/link` page and fantasy-job-generator components — belong to a separate "3D art creator" persona (@3DZeeGee) and a separate app (magic.zeze.app), not the software-engineer portfolio persona; decide whether these are in scope for portfolio-v2 at all
- `agrowth-1.webp` / `agrowth-2.webp` — images present but not wired into any page (likely meant for a future Agrowth project case study)
- Several UI components (`Card`/`HoverEffect`, `ShineBorder`) exist but aren't used on any live route
