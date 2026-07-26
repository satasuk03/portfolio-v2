export type Project = {
  name: string;
  /** Native script kept where the project has one. */
  nativeName?: string;
  year: string;
  /** One of the four cards in § 05; the rest are the overflow paragraph. */
  featured?: boolean;
  pitch: string;
  detail: string;
  stack: string[];
  href: string;
  /** Two threads: agent tooling, and craft apps. */
  thread: "tooling" | "craft";
};

/**
 * Public, solo-authored, hand-built. This section is load-bearing: it is the
 * only place a reader can read the actual code, which is what earns the right
 * to talk plainly about the one project that was agent-built.
 */
export const projects: Project[] = [
  {
    name: "philm",
    year: "2026",
    featured: true,
    pitch: "A photo darkroom in the browser.",
    detail:
      "Upload a photo, apply .cube LUT film emulation, frame it, export a PNG. Trilinear LUT interpolation runs in a Web Worker to keep the main thread free, with a fallback path for Safari.",
    stack: ["Next.js", "TypeScript", "Web Workers", "Colour science"],
    href: "https://github.com/satasuk03/philm",
    thread: "craft",
  },
  {
    name: "wenfang-chinese-toolbox",
    nativeName: "文房",
    year: "2026",
    pitch: "A bilingual Chinese study tool.",
    detail:
      "Flashcards and stroke-order lookup in Thai and English. Astro static output on Cloudflare Pages, strict TypeScript, and a CI check that fails the build when the two locales fall out of parity.",
    stack: ["Astro", "Tailwind", "TypeScript", "Cloudflare Pages"],
    href: "https://github.com/satasuk03/wenfang-chinese-toolbox",
    thread: "craft",
  },
  {
    name: "micro-gfx",
    year: "2026",
    featured: true,
    pitch: "A generator for hand-drawn technical instrument graphics.",
    detail:
      "Dependency-free and seeded, so any output is reproducible from its key. Emits SVG and PNG with no build step. The visual language of this site is descended from it.",
    stack: ["TypeScript", "SVG", "Generative"],
    href: "https://github.com/satasuk03/micro-gfx",
    thread: "craft",
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
    name: "riko-chrome-companion",
    year: "2026",
    pitch: "A pixel-art companion that lives in your browser.",
    detail:
      "A draggable anime companion you chat with across tabs, on OpenAI, Anthropic, or Gemini. Manifest V3, Shadow DOM isolation so no page can style it, emotional sprite states, and a social-detox nudge.",
    stack: ["JavaScript", "Manifest V3", "Shadow DOM", "Multi-provider LLM"],
    href: "https://github.com/satasuk03/riko-chrome-companion",
    thread: "tooling",
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
    name: "dev-fable",
    year: "2026",
    featured: true,
    pitch: "An orchestrator that delegates dev work to sub-agents.",
    detail:
      "Plans a task, decomposes it, and routes the pieces to reasoning, worker, and explorer agents, synthesising two independent perspectives when a decision is high-stakes.",
    stack: ["Agent orchestration", "TypeScript"],
    href: "https://github.com/satasuk03/fable-dev-skill",
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
 * The seeded wave still stands in for a screenshot: recognisable as a plate,
 * unreadable as a spec — the no-leak constraint turned into the aesthetic.
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
  /** Wave-still seed — each card gets its own slice of the field. */
  seed: number;
};

export const workProjects: WorkProject[] = [
  {
    name: "XOXONA",
    chip: "Live",
    live: true,
    body: "Consumer AI product, Thai-first. I built the retrieval and knowledge system, and shape features with the research team. Agent-directed development, on purpose.",
    foot: "xoxona.ai ↗",
    href: "https://xoxona.ai/",
    seed: 101,
  },
  {
    name: "Radiant / GuildFi",
    chip: "2021 — 2026",
    body: "Real-time PC gaming engagement platform, 100k+ players. Sole owner of the quest engine through a full rebuild onto durable workflows.",
    foot: "Private · ask me",
    seed: 207,
  },
  {
    name: "zentry-data",
    chip: "2025 — 2026",
    body: "News search, indexing, and the retrieval layer behind a deep-research agent.",
    foot: "Private · ask me",
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
  { name: "From Chuta", href: "https://fromchuta.com" },
  { name: "Salak Mabin" },
  { name: "You in Fantasy World", href: "https://magic.zeze.app" },
];

/**
 * § 05's overflow paragraph: the public work that is not one of the four
 * cards. `note` renders after the name, in parentheses.
 */
export const personalOverflow: { name: string; note?: string }[] = [
  {
    name: "wenfang",
    note: "bilingual Chinese-study tool, Astro, strictest pipeline of the set",
  },
  {
    name: "riko-chrome-companion",
    note: "pixel-art companion extension, three LLM providers, Shadow DOM isolation",
  },
  {
    name: "auto-backtesting",
    note: "describe a trading strategy in English, an LLM writes and backtests it",
  },
  { name: "go-clean-architecture" },
  { name: "kimi-sub-agents" },
];
