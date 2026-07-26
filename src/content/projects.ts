export type Project = {
  name: string;
  /** Native script kept where the project has one. */
  nativeName?: string;
  year: string;
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
    pitch: "An agent skill that plans Thai personal finances.",
    detail:
      "Models Thai tax filing, SSF/RMF/Thai ESG allowances, and social security tiers, then runs a seven-round interview and emits an HTML dashboard. Bilingual, MIT licensed.",
    stack: ["Agent skill", "Domain modelling", "Prompt design"],
    href: "https://github.com/satasuk03/thai-personal-finance-planner",
    thread: "tooling",
  },
  {
    name: "fable-dev-skill",
    year: "2026",
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

export type ClientSite = {
  name: string;
  href: string;
  year: string;
  detail: string;
};

export const clientSites: ClientSite[] = [
  {
    name: "PEA Hackathon 2026",
    href: "https://peahackathon2026.riseaccel.com",
    year: "2026",
    detail:
      "Official site for the Provincial Electricity Authority's hackathon with RISE Accel — energy innovation across grid operation and supply chain.",
  },
  {
    name: "NIA AGROWTH",
    href: "https://agrowth.nia.or.th",
    year: "2025",
    detail:
      "Official site for Thailand's first AgTech accelerator — a twelve-week programme pairing deep-tech agricultural startups with corporate partners.",
  },
  {
    name: "From Chuta",
    href: "https://fromchuta.com",
    year: "2025",
    detail: "A website for a home bakery. Built for my mother's business.",
  },
];
