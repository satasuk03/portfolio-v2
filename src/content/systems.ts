export type LampState = "live" | "sunset" | "closed";

export type System = {
  /** Logbook sequence — assigned in order of occurrence, oldest first. */
  seq: string;
  slug?: string;
  name: string;
  span: string;
  org: string;
  role: string;
  state: LampState;
  /** One line. What it was and what he owned. No consultant-speak. */
  summary: string;
  /** The home page version: twelve words at most, no clauses. */
  brief: string;
  stack: string[];
};

/** Stored oldest-first so sequence numbers read true; rendered newest-first. */
export const systems: System[] = [
  {
    seq: "001",
    name: "Phatra Asset Management",
    span: "2019–2020",
    org: "Phatra Asset Management",
    role: "Data Engineer, part-time",
    state: "closed",
    summary:
      "ETL and automated data management for the investment research desk — scraping and transforming market and alternative data into relational stores, and Tableau reporting on top.",
    brief:
      "ETL and reporting for an investment research desk.",
    stack: ["Python", "Pandas", "Selenium", "SQLAlchemy", "Tableau"],
  },
  {
    seq: "002",
    name: "Blockfint",
    span: "2020–2021",
    org: "Blockfint",
    role: "Software Engineer — BA / SA / Dev / QA",
    state: "closed",
    summary:
      "Core banking: savings, lending, and certificate of deposit for enterprise bank clients. Dev lead on a regulation-driven lending system — interest and fee calculation, billing, payment processing — shipped in two months with a team of three while mentoring two juniors.",
    brief:
      "Core banking — savings, lending, deposits. Dev lead on lending.",
    stack: ["Go", "PostgreSQL", "React", "React Native"],
  },
  {
    seq: "003",
    slug: "radiant",
    name: "Radiant / GuildFi",
    span: "2021–2026",
    org: "Cryptomind Group · Zentry",
    /* No lead title is claimed here — see the note in profile.ts. The scope
       below is what the record actually supports, and reads as senior work
       without an appointment behind it. */
    role: "Software Engineer — quest systems",
    state: "sunset",
    summary:
      "A play-to-earn guild platform that became a PC gaming engagement platform. Served 100k+ players at peak. Sole owner of the quest engine from its first line through a full durable-workflow redesign; reviewed architecture and debugged production incidents across a 70+ module backend, five apps, and several services I had not written.",
    brief:
      "100k+ players. Owned the quest engine end to end.",
    stack: [
      "TypeScript",
      "Node.js",
      "Temporal.io",
      "tRPC",
      "gRPC",
      "PostgreSQL",
      "Redis",
      "MongoDB",
      "Neo4j",
      "Typesense",
      "RabbitMQ",
      "Electron",
      "Kubernetes",
    ],
  },
  {
    seq: "004",
    slug: "zentry-data",
    name: "zentry-data",
    span: "2025–2026",
    org: "Cryptomind Group · Zentry",
    role: "Core contributor",
    state: "closed",
    summary:
      "The data intelligence layer beneath the company's AI products — refining fragmented on-chain, social, and gaming signals into structured, permissioned datasets, with ETL pipelines and developer-facing APIs. Built the news search and indexing layer, and the retrieval a deep-research agent ran its queries through.",
    brief:
      "The data layer under the company\u2019s AI products.",
    stack: [
      "TypeScript",
      "Turborepo",
      "ETL",
      "Node.js",
      "Search & indexing",
      "RAG",
    ],
  },
  {
    seq: "005",
    slug: "xoxona",
    name: "XOXONA",
    span: "2026—",
    org: "Cryptomind Group · Zentry",
    role: "Product engineer, research team",
    state: "live",
    summary:
      "A Thai-language AI roleplay platform where readers and writers build storylines with AI characters. Live in public testing. Built the knowledge-book system — the retrieval layer that selects which lore a character actually needs for the current turn. On the research team, shaping what gets built with product, and the one codebase here deliberately built by directing agents rather than typing.",
    brief:
      "Thai AI roleplay platform, in public testing. Built by directing agents.",
    stack: [
      "NestJS",
      "Next.js",
      "React 19",
      "MongoDB",
      "LangChain",
      "Google AI",
      "RAG",
      "Cloudflare R2",
    ],
  },
];

export const systemsNewestFirst = [...systems].reverse();

export const lampCopy: Record<LampState, string> = {
  live: "Live",
  sunset: "Sunset",
  closed: "Closed",
};
