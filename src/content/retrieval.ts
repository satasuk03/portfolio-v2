/*
 * The retrieval systems. This is the lead section of the site, so the bar for
 * what may appear here is the highest on the page.
 *
 * WHAT IS KNOWN, and therefore what is written: that both systems exist, which
 * products they belong to, and what retrieval problem each one solves. Both are
 * private employer codebases, so nothing here is linkable.
 *
 * WHAT IS NOT KNOWN, and therefore absent from the page: the vector store, the
 * embedding model, chunk sizes, whether search was hybrid or dense-only, and
 * whether anything was reranked. Ze has not supplied these. They are the most
 * interview-relevant details in the whole section, and guessing at them would be
 * the single easiest way to get him caught out.
 *
 * Each entry therefore carries a `pending` list. It is an authoring checklist,
 * NOT rendered — a portfolio that advertises which of its own details are
 * undocumented is worse than one that simply states less. The same list is in
 * the surface brief so the next session cannot miss it.
 */

export type RetrievalSystem = {
  seq: string;
  /** The product it lives inside. */
  product: string;
  name: string;
  span: string;
  /** One line a skimmer can leave with. */
  brief: string;
  /** The retrieval problem, stated as a problem rather than a feature. */
  problem: string;
  /** What was actually built. Only verified scope. */
  built: string;
  /** Why this one is not the same job as the other one. */
  distinct: string;
  stack: string[];
  /** Authoring checklist — detail Ze still owes. Not rendered; see the note above. */
  pending: string[];
};

export const retrievalSystems: RetrievalSystem[] = [
  {
    seq: "04.4",
    product: "zentry-data",
    name: "News search & deep research",
    span: "2025–2026",
    brief: "Indexing and retrieval under a deep-research agent.",
    problem:
      "An agent asked to research a topic has to search across sources that were never designed to be searched together — news, on-chain activity, social, gaming signals — each arriving in its own shape, on its own schedule, at its own level of trustworthiness.",
    built:
      "The search and indexing layer over those sources, sitting on top of ETL pipelines that refined fragmented feeds into structured, permissioned datasets. The deep-research agent ran its queries through this layer rather than against the raw sources.",
    distinct:
      "Freshness is the hard constraint here. News is only useful while it is current, so the index is continuously invalidated and rebuilt — the opposite of a static corpus you embed once.",
    stack: ["TypeScript", "Node.js", "Turborepo", "ETL", "Search & indexing"],
    pending: [
      "Vector store and index topology",
      "Embedding model",
      "Whether retrieval was hybrid (lexical + dense) or dense-only",
      "Chunking strategy for articles",
      "Freshness / re-index cadence",
    ],
  },
  {
    seq: "04.5",
    product: "XOXONA",
    name: "The knowledge-book system",
    span: "2026—",
    brief: "Choosing which lore a character needs for this turn.",
    problem:
      "A roleplay conversation grows without bound; a model's context does not. Writers author knowledge books — canon about characters, places, and history — and by the tenth hour of a storyline there is far more canon than will ever fit in a prompt. The system has to decide, every single turn, which entries actually matter now.",
    built:
      "The knowledge-book retrieval layer: authoring and storage for the books, and the selection step that assembles the relevant entries into a character's context at generation time.",
    distinct:
      "Relevance here is narrative, not factual. The correct answer depends on what is happening in the scene, which entries the story has already established, and what the writer intended to be canon — so ranking by similarity to the last message alone is not enough.",
    stack: ["NestJS", "MongoDB", "LangChain", "Google AI", "TypeScript"],
    pending: [
      "Vector store and how books are indexed",
      "Embedding model",
      "How the context budget is allocated per turn",
      "Whether entries are reranked, and against what signal",
      "How recency in the conversation is weighted against book relevance",
    ],
  },
];

/**
 * Sits under the two entries. The honest framing of how this work gets done —
 * kept because it is the site's most distinctive claim, and because blurring it
 * would cost the credibility of both halves.
 */
export const method = {
  title: "How this gets built",
  body: [
    "On XOXONA I work from a terminal, directing agents. I write the spec, decide the architecture, review what comes back, and reject what is wrong. Much of the implementation was not typed by me.",
    "The two halves depend on each other. Directing an agent well is a review problem, and reviewing well is the thing four years of production incidents actually teaches you.",
  ],
  defensible: "Every architectural decision in it.",
  refused: "That I wrote it line by line.",
} as const;
