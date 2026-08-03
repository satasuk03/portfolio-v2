/*
 * Experience, grouped by company — Ze's brief. One company figure with nested
 * roles resolves the BlockFint split for free (front-end part-time Feb–May
 * 2020, then SWE May 2020–Dec 2021): both roles keep their own dates without
 * a confusing duplicate company entry.
 *
 * Copy is the draft from design-reference/direction-a-mockup.html, grounded in
 * research/00-synthesis.md §4–5. Ze has not signed off on any of it — the
 * wording pass edits this file only.
 *
 * Rules the renderer relies on (REDESIGN-PLAN.md §5.1):
 * - `current` is single-selection. Two live chips and the cyan stops meaning
 *   anything.
 * - `when` strings are display-only; nothing parses them, so nothing catches
 *   a typo'd year. Check by eye.
 * - `Role.body` is one string. Two paragraphs means changing the type, not
 *   embedding \n\n.
 */

export type Role = {
  title: string;
  when: string;
  body: string;
  /** Public product link, when the work has one. Private roles omit it. */
  href?: string;
  /** Link label — the § 04 card convention, e.g. "xoxona.ai ↗". */
  hrefLabel?: string;
};

export type Company = {
  /** Used for the FIG tag and anchors. */
  id: string;
  name: string;
  meta: string;
  when: string;
  /** Drives the cyan "Current" chip. Only one may be true. */
  current?: boolean;
  /** Newest first. */
  roles: Role[];
};

/** Newest first: zentry, blockfint, phatra. */
export const companies: Company[] = [
  {
    id: "zentry",
    name: "Zentry",
    meta: "Cryptomind Group · Bangkok",
    when: "2021 — now",
    current: true,
    roles: [
      {
        title: "XOXONA — Product + Senior AI Engineer",
        when: "2026 —",
        body: "A live consumer AI product. I'm the lead engineer, which means I shape features with product rather than receiving them. I built the knowledge system that decides which long-form lore a character needs for the current turn, against an unbounded history and a fixed context budget. It's also the one codebase I've built agent-directed on purpose — I specify, architect and review far more than I type, and every decision in it is one I can defend.",
        href: "https://xoxona.ai/",
        hrefLabel: "xoxona.ai ↗",
      },
      {
        title: "Radiant / GuildFi — software engineer",
        when: "2021 — 2026",
        body: "Four and a half years in one large, long-lived, multi-team codebase — 70+ backend modules, five apps, a platform that served 100k+ players. I was sole owner of the quest engine from its first line through a full rebuild onto durable workflows: partial progress, streak repair, rerolls, buff modifiers. I drove the technical pivot from a Web3 scholarship platform to a real-time PC gaming product when the market for the first one collapsed, normalised event streams from five game titles into one engine, and spent a lot of nights debugging systems I hadn't written.",
      },
      {
        title: "zentry-data — retrieval & pipelines",
        when: "2025 — 2026",
        body: "News search and indexing, and the retrieval layer a deep-research agent queried through. Second-largest contributor on a small team.",
      },
    ],
  },
  {
    id: "blockfint",
    name: "BlockFint",
    meta: "Core banking · Bangkok",
    when: "2020 — 2021",
    roles: [
      {
        title: "Software engineer — BA / SA / dev / QA",
        when: "2020 — 2021",
        body: "Core banking — savings, lending, and certificates of deposit — for enterprise bank clients. The team was small enough that you gathered the requirements, analysed them, built the thing and tested it yourself, which is where I learned to write a spec I'd be willing to implement. I led three engineers delivering a regulation-driven interest and billing system in two months, and mentored two juniors through it. Regulation is a good teacher: the requirements aren't negotiable and the arithmetic has to be right.",
      },
      {
        title: "Front-end developer — part time",
        when: "early 2020",
        body: "React and React Native work on client projects while finishing my degree. How I got in the door.",
      },
    ],
  },
  {
    id: "phatra",
    name: "Phatra",
    meta: "Asset management · Bangkok",
    when: "2019 — 2020",
    roles: [
      {
        title: "Data engineer — part time",
        when: "2019 — 2020",
        body: "ETL and automation in the research department, supporting the investment team. Scraping and transforming market and alternative data into databases and Tableau — including a pipeline tracking Thai dam water levels, which is a genuinely useful signal if you trade agriculture. My first job, and where I learned that real data arrives broken.",
      },
    ],
  },
];
