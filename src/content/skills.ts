/*
 * Skills, grouped by what it is for — not by logo count. Everything listed is
 * something Ze has shipped with (research/00-synthesis.md §3).
 *
 * AI & retrieval leads and takes the yellow highlighter fill. RAG and
 * retrieval ARE claimable — PRODUCT.md records the correction: the earlier
 * "no RAG experience" claim was drawn from public repos only, and both
 * retrieval systems live in private employer codebases. Confirmed by Ze.
 *
 * `lead` is single-selection (REDESIGN-PLAN.md §5.1) — exactly one row gets
 * the highlighter.
 */

export type SkillGroup = {
  key: string;
  items: string[];
  /** Takes the yellow highlighter fill. Exactly one. */
  lead?: boolean;
};

export const skillGroups: SkillGroup[] = [
  {
    key: "AI & retrieval",
    lead: true,
    items: [
      "Claude",
      "Gemini",
      "OpenAI",
      "LangChain",
      "LangGraph",
      "Vercel AI SDK",
      "RAG / retrieval",
      "Agent tooling",
      "Claude Agent Skills",
    ],
  },
  {
    key: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "Go", "SQL", "Solidity"],
  },
  {
    key: "Backend",
    items: [
      "Node.js",
      "NestJS",
      "Express",
      "Hono",
      "tRPC",
      "gRPC",
      "TypeORM",
      "Drizzle",
    ],
  },
  {
    key: "Orchestration",
    items: ["Temporal.io", "RabbitMQ", "BullMQ", "Socket.IO"],
  },
  {
    key: "Data",
    items: ["PostgreSQL", "MongoDB", "Redis", "Neo4j", "Typesense", "Pandas"],
  },
  {
    key: "Frontend",
    items: ["Next.js", "React 19", "Tailwind v4", "shadcn/ui", "TanStack Query"],
  },
  {
    key: "Infra & ops",
    items: [
      "Docker",
      "Kubernetes (GKE)",
      "Turborepo",
      "GitHub Actions",
      "Datadog",
      "OpenTelemetry",
    ],
  },
  {
    key: "Practice",
    items: [
      "System design",
      "Database design",
      "Incident triage",
      "BA / SA",
      "Mentoring",
    ],
  },
];
