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
        title: "XOXONA — Engineer Lead + Senior AI Engineer",
        when: "2026 —",
        body: "A live consumer AI product. I'm the initiator and lead engineer. I built the first version myself, pitched it, and got it greenlit. I designed the architecture myself. I crafted the knowledge system that decides which long-form lore a character needs for the current turn, against an unbounded history and a fixed context budget.",
        href: "https://xoxona.ai/",
        hrefLabel: "xoxona.ai ↗",
      },
      {
        title: "zentry-data — AI Engineer",
        when: "2025 — 2026",
        body: "The data and retrieval layer behind zTerminal, Zentry's consumer crypto research terminal. I built the news pipeline from the first commit: multi-source ingestion, embedding, and hybrid retrieval that scores semantic similarity and keyword matching together under a recency window, because news is only worth retrieving while it's current. I'm the primary author of the deep-research agent: a graph that classifies whether a question is worth researching, plans it into parallel tasks, runs them across news, web and social retrieval, and writes a cited report. It runs on durable workflows, on a schedule and on demand.",
      },
      {
        title: "Radiant / GuildFi — software engineer",
        when: "2021 — 2026",
        body: "Four and a half years in one large, long-lived, multi-team codebase with 70+ backend modules, five apps, a platform that served 100k+ players. I was sole owner of the quest engine from its first line through a full rebuild onto durable workflows. I drove the technical pivot from a Web3 scholarship platform to a real-time PC gaming product. Integrated five mainstream game titles (Dota2, LoL, CS2, Valorant and Fortnite).",
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
        title: "Core Banking System — Business & System Analyst → Software Engineer",
        when: "2020 — 2021",
        body: "Core banking system: savings, lending, and certificates of deposit for enterprise bank clients. I started as the business and system analyst and ended as a software engineer, and I stayed with the system through every phase: requirements gathering, analysis, build, test, release and maintenance. I led three engineers on a regulation-driven interest and billing system, delivered in two months..",
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
        body: "ETL and automation in the research department, supporting the investment team. Scraping and transforming market and alternative data into databases. My first job, and where I learned that real data arrives broken.",
      },
    ],
  },
];
