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
  word: "SATASUK",
  tail: "— systems for news, research and long-form lore.",
  spoken:
    "Satasuk Viparksinlapin, AI Engineer — systems for news, research and long-form lore.",
  /* Unnumbered — the photo plate carries Fig. 00, and one figure number may
     only ever point at one thing. */
  figureCaption: "The dither wave, drifting",
} as const;

/**
 * The home page reads shorter than the log. One clause, not two.
 */
export const home = {
  standfirst:
    "I build the retrieval layer under AI products. Before that, the quest engine inside a platform that served 100k+ players.",
} as const;

/**
 * § 01 About — four short paragraphs, first person, no adjective stacking
 * (REDESIGN-PLAN.md §5.3). The through-line: the same judgment applied
 * further up each time.
 */
export const about = {
  paragraphs: [
    "I'm a software engineer in Bangkok who ended up specialising in the parts of a system nobody sees: retrieval, workflow orchestration, and the layer where a product's promises meet its data.",
    "The through-line of my career is the same skill applied further up each time. I built a quest engine by hand, then owned architecture and incident triage across a 70+ module codebase, and now I direct agents to ship a live consumer AI product — specifying and reviewing far more than I type. Each step needed the same thing: knowing what good looks like before it exists.",
    "I've also watched two markets disappear underneath a product I was building, and rebuilt through both. That's taught me more about engineering judgment than any green-field project has.",
    "I like simple things that hold up. I'd rather delete a system than defend it.",
  ],
} as const;

/** The raw photograph plate in the hero's opaque sheet. Ships full tone. */
export const heroPlate = {
  src: "/images/me.webp",
  alt: "Satasuk Viparksinlapin",
  label: "Bondi, 2025",
  cells: [
    { term: "Based", value: "Bangkok · UTC+7", accent: false },
    { term: "Building", value: "XOXONA", accent: true },
  ],
  lightbox: {
    enlarge: "Enlarge",
    close: "Close",
  },
} as const;

/** The closer. An invitation to ask, then LinkedIn and GitHub. Nothing else. */
export const closer = {
  title: "Hiring, or just curious?",
  body: "I'm open to remote roles. The fastest way to find out whether I'm useful to you is to ask me about one of the projects above — I'll tell you what actually happened.",
} as const;
