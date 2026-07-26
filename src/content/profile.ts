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
  figureCaption: "Fig. 00 — the dither wave, drifting",
} as const;

/**
 * The home page reads shorter than the log. One clause, not two.
 */
export const home = {
  standfirst:
    "I build the retrieval layer under AI products. Before that, the quest engine inside a platform that served 100k+ players.",
} as const;
