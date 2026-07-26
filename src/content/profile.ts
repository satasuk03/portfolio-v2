export const profile = {
  name: "Satasuk Viparksinlapin",
  short: "Ze",
  /* Corrected 2026-07-25 on Ze's own instruction: he was never formally a
     Technical Lead. That title reached research/00-synthesis.md and
     research/02-profile-and-radiant.md only through his own Obsidian notes and
     LinkedIn self-description ("grew into Technical Lead"), never a real
     appointment. Every ownership fact underneath it is kept; the title is not
     asserted anywhere on the site. */
  role: "AI Engineer",
  location: "Bangkok, Thailand",
  availability: "Remote",
  links: {
    linkedin: "https://www.linkedin.com/in/satasukVip",
    github: "https://github.com/satasuk03",
  },
} as const;

/**
 * The first viewport. `word` is knocked out of the paper sheet and `tail`
 * completes the sentence beneath it, so the two must read as one line. `spoken`
 * is what a screen reader gets, since the knockout is decorative SVG.
 */
export const hero = {
  word: "Retrieval",
  tail: "— systems for news, research and long-form lore.",
  spoken:
    "Satasuk Viparksinlapin, AI Engineer. Retrieval systems for news, research and long-form lore.",
  figureCaption: "Fig. 00 — the index, turning as you scroll",
} as const;

/**
 * The home page reads shorter than the log. One clause, not two.
 */
export const home = {
  standfirst:
    "I build the retrieval layer under AI products. Before that, the quest engine inside a platform that served 100k+ players.",
  /** Counted, so the numeral stays separate from its unit. */
  stats: [
    { label: "Users served", value: 100, unit: "K+", attention: true },
    { label: "Peak daily actives", value: 25, unit: "K" },
    { label: "Backend modules", value: 70, unit: "+" },
    { label: "Engineers at peak", value: 10 },
  ] as { label: string; value: number; unit?: string; attention?: boolean }[],
  scaleCaption:
    "Figures are historical. Radiant was sunset in 2026 — nothing here can be verified by clicking through to a live product.",
} as const;

export type Readout = {
  label: string;
  value: string;
  unit?: string;
  note?: string;
};

/**
 * The second tier of the scale panel — breadth rather than headline numbers.
 * Historical by nature, since Radiant is sunset, so every label reads as a peak.
 */
export const secondaryReadouts: Readout[] = [
  {
    label: "Data stores",
    value: "5",
    note: "Postgres, Redis, Mongo, Neo4j, Typesense",
  },
  {
    label: "Live game integrations",
    value: "5",
    note: "Fortnite, Valorant, LoL, CS2, Apex",
  },
  {
    label: "Identity providers",
    value: "7",
    unit: "+",
    note: "OAuth + on-chain",
  },
  { label: "Workflow queues", value: "5", note: "Isolated per domain" },
];
