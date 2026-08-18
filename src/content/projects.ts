export type Project = {
  name: string;
  /** Native script kept where the project has one. */
  nativeName?: string;
  year: string;
  /** One of the five cards in § 05; the rest are the overflow paragraph. */
  featured?: boolean;
  pitch: string;
  detail: string;
  stack: string[];
  /** The repository. Every project here has one — that is the point of § 05. */
  href: string;
  /** A running deployment, where there is one. Renders beside the repo link. */
  live?: string;
  /** Bare host, § 04's link convention. Required whenever `live` is set. */
  liveLabel?: string;
  /** Two threads: agent tooling, and craft apps. */
  thread: "tooling" | "craft";
};

/**
 * Public, solo-authored, hand-built. This section is load-bearing: it is the
 * only place a reader can read the actual code, which is what earns the right
 * to talk plainly about the one project that was agent-built.
 */
/*
 * Array order is render order: `featured` is filtered, never sorted, so the
 * five cards appear in the order Ze picked them.
 *
 * The five without `featured` render NOWHERE — the "Also public: …" overflow
 * paragraph was cut on 2026-07-28, so § 05 is the five cards and nothing else.
 * They are kept as the bench: promote one by adding `featured: true`, and drop
 * another, or the two-column grid gains a third orphan row.
 */
export const projects: Project[] = [
  {
    name: "florify",
    year: "2026",
    featured: true,
    pitch: "A chill tree-planting game in the browser.",
    detail:
      "Plant, water and harvest 405 tree species across three rarity tiers, on a water-drop economy with daily missions, streaks and combos. Bilingual Thai and English down to the per-species lore, and installable as a PWA. The species art is not hand-drawn — a generation pipeline in the monorepo produces it.",
    stack: ["Next.js", "Zustand", "PWA", "Game economy", "Asset pipeline"],
    href: "https://github.com/satasuk03/florify",
    live: "https://florify.zeze.app/",
    liveLabel: "florify.zeze.app ↗",
    thread: "craft",
  },
  {
    name: "wenfang-chinese-toolbox",
    nativeName: "文房",
    year: "2026",
    featured: true,
    pitch: "The Chinese study tool I wanted, so I built it.",
    detail:
      "I'm learning Chinese and wanted flashcards and stroke-order lookup that worked the way I study, so I made my own and kept using it. Bilingual Thai and English throughout: Astro static output on Cloudflare Pages, strict TypeScript, and a CI check that fails the build when the two locales fall out of parity.",
    stack: ["Astro", "Tailwind", "TypeScript", "Cloudflare Pages"],
    href: "https://github.com/satasuk03/wenfang-chinese-toolbox",
    live: "https://wenfang.zeze.app/",
    liveLabel: "wenfang.zeze.app ↗",
    thread: "craft",
  },
  {
    name: "thai-personal-finance-planner",
    year: "2026",
    featured: true,
    pitch: "An agent skill that plans Thai personal finances.",
    detail:
      "Models Thai tax filing, SSF/RMF/Thai ESG allowances, and social security tiers, then runs a seven-round interview and emits an HTML dashboard. Bilingual, MIT licensed.",
    stack: ["Agent skill", "Domain modelling", "Prompt design"],
    href: "https://github.com/satasuk03/thai-personal-finance-planner",
    thread: "tooling",
  },
  {
    name: "chutas-bakery",
    year: "2026",
    featured: true,
    pitch: "My mum's bakery, on the internet.",
    detail:
      "My mother's bakery. Menu and story pages with the copy authored in MDX rather than hard-coded, so the words are data and the components stay dumb. Next.js App Router on Cloudflare, sitemap and robots generated at build.",
    stack: ["Next.js", "MDX", "Tailwind", "Cloudflare"],
    href: "https://github.com/satasuk03/chutas-bakery",
    live: "https://fromchuta.com/",
    liveLabel: "fromchuta.com ↗",
    thread: "craft",
  },
  {
    name: "riko-chrome-companion",
    year: "2026",
    featured: true,
    pitch: "A pixel-art companion that lives in your browser.",
    detail:
      "A draggable anime companion you chat with across tabs, on OpenAI, Anthropic, or Gemini. Manifest V3, Shadow DOM isolation so no page can style it, emotional sprite states, and a social-detox nudge.",
    stack: ["JavaScript", "Manifest V3", "Shadow DOM", "Multi-provider LLM"],
    href: "https://github.com/satasuk03/riko-chrome-companion",
    thread: "tooling",
  },
  {
    name: "philm",
    year: "2026",
    pitch: "A photo darkroom in the browser.",
    detail:
      "Upload a photo, apply .cube LUT film emulation, frame it, export a PNG. Trilinear LUT interpolation runs in a Web Worker to keep the main thread free, with a fallback path for Safari.",
    stack: ["Next.js", "TypeScript", "Web Workers", "Colour science"],
    href: "https://github.com/satasuk03/philm",
    thread: "craft",
  },
  {
    name: "micro-gfx",
    year: "2026",
    pitch: "A generator for hand-drawn technical instrument graphics.",
    detail:
      "Dependency-free and seeded, so any output is reproducible from its key. Emits SVG and PNG with no build step. The visual language of this site is descended from it.",
    stack: ["TypeScript", "SVG", "Generative"],
    href: "https://github.com/satasuk03/micro-gfx",
    thread: "craft",
  },
  {
    name: "dev-fable",
    year: "2026",
    pitch: "An orchestrator that delegates dev work to sub-agents.",
    detail:
      "Plans a task, decomposes it, and routes the pieces to reasoning, worker, and explorer agents, synthesising two independent perspectives when a decision is high-stakes.",
    stack: ["Agent orchestration", "TypeScript"],
    href: "https://github.com/satasuk03/fable-dev-skill",
    thread: "tooling",
  },
  {
    name: "auto-backtesting",
    year: "2026",
    pitch: "Let an LLM be your quant.",
    detail:
      "Describe a trading strategy in English; a model writes the Python implementation; the engine backtests it against cached Binance OHLCV data and charts the result.",
    stack: ["Python", "LLM codegen", "Backtesting"],
    href: "https://github.com/satasuk03/auto-backtesting",
    thread: "tooling",
  },
  {
    name: "go-clean-architecture",
    year: "2025",
    pitch: "A Go clean-architecture boilerplate.",
    detail:
      "Layered structure for Go services — kept public as a reference for backend work outside the TypeScript day job.",
    stack: ["Go"],
    href: "https://github.com/satasuk03/go-clean-architecture",
    thread: "craft",
  },
];

/**
 * § 04 Work projects — deliberately short, per Ze: "No need to leak too much
 * about the project — we can show or tell that when I get the interview."
 * Private codebases get a "Private · ask me" footer instead of a dead link.
 *
 * Covers are the products' own key art, not screenshots — they say what the
 * thing is without leaking a line of the codebase, which is the same
 * constraint the seeded wave was solving before Ze supplied them. `seed` is
 * still the fallback for any card that has no cover.
 */
export type WorkProject = {
  name: string;
  /** "Live" or a date range. */
  chip: string;
  /** Cyan chip, mirroring the Current chip in § 03. */
  live?: boolean;
  body: string;
  foot: string;
  href?: string;
  /** Product key art under /public. Omit and the card falls back to `seed`. */
  cover?: string;
  /** Required whenever `cover` is set — these carry logos, so not decorative. */
  coverAlt?: string;
  /** Wave-still seed — each card gets its own slice of the field. */
  seed: number;
};

export const workProjects: WorkProject[] = [
  {
    name: "XOXONA",
    chip: "Live",
    live: true,
    body: " AI roleplay platform. Pick a character, step into the story as whoever you want to be, and shape what happens next. Thousands of storylines from writers and fandoms, from slow-burn romance to fantasy epics. Or build your own story and let everyone else play it.",
    foot: "xoxona.ai ↗",
    href: "https://xoxona.ai/",
    cover: "/images/covers/xoxona.webp",
    coverAlt: "XOXONA key art — the wordmark beside a character illustration.",
    seed: 101,
  },
  {
    name: "Radiant / GuildFi",
    chip: "2021 — 2026",
    body: "Real-time PC gaming engagement platform, 100k+ players. Radiant overlays directly onto popular video games. By playing their favorite mainstream games, users unlock loot boxes, rewards, in-game discounts, and Web3 assets seamlessly, without needing prior crypto experience.",
    foot: "Private · ask me",
    cover: "/images/covers/radiant.webp",
    coverAlt: "Radiant key art — the Radiant wordmark over game characters.",
    seed: 207,
  },
  {
    name: "zentry-data",
    chip: "2025 — 2026",
    body: "Datasource of AI agents to query Crypto-currency related information. Including deep-research reports and news aggregator",
    foot: "Private · ask me",
    cover: "/images/covers/zentry-data.webp",
    coverAlt: "Zentry Terminal key art — an iridescent sphere beside the wordmark.",
    seed: 311,
  },
];

/**
 * Freelance, as one chip row at the foot of § 04 — breadth, not depth
 * (placement decided: REDESIGN-PLAN.md §8, assumption 2). No href means no
 * live URL to point at.
 */
export const clientChips: { name: string; href?: string }[] = [
  { name: "PEA Hackathon 2026", href: "https://peahackathon2026.riseaccel.com" },
  { name: "NIA AGROWTH", href: "https://agrowth.nia.or.th" },
  /* "From Chuta" was removed here on 2026-07-28: it is Ze's mother's bakery,
     not a client, and it now has its own § 05 card. Listing it under "Shipped
     for clients" was both a duplicate and the wrong claim. */
  { name: "Salak Mabin" },
  { name: "You in Fantasy World", href: "https://magic.zeze.app" },
];

/* `personalOverflow` — the "Also public: …" line — was deleted on 2026-07-28
   with the paragraph that rendered it. `kimi-sub-agents` was the one entry with
   no `Project` counterpart, so it is now unmentioned anywhere on the site; the
   other five are the unfeatured entries above. Recover from git if wanted. */
