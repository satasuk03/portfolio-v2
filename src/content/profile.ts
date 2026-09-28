import { workProjects } from "./projects";

export const profile = {
  name: "Satasuk Viparksinlapin",
  short: "Ze",
  /* Corrected 2026-07-25 on Ze's own instruction: he was never formally a
     Technical Lead. That title reached research/00-synthesis.md and
     research/02-profile-and-radiant.md only through his own Obsidian notes and
     LinkedIn self-description ("grew into Technical Lead"), never a real
     appointment. Every ownership fact underneath it is kept; the title is not
     asserted anywhere on the site. */
  /* The hero's visible h1 line. One string, so the top bar, the h1 and the
     footer cannot disagree. */
  role: "Senior Software Engineer, AI Solutionist",
  location: "Bangkok, Thailand",
  availability: "Remote",
  links: {
    linkedin: "https://www.linkedin.com/in/satasukVip",
    github: "https://github.com/satasuk03",
    /* Social, not a contact channel — added 2026-07-28 on Ze's instruction.
       The contact rule (LinkedIn + GitHub only, no email/phone/form) stands. */
    instagram: "https://www.instagram.com/zezethewanderer/",
  },
} as const;

/**
 * The first viewport. `word` is the giant vertical masthead — decorative, so
 * it is aria-hidden and `spoken` is what a screen reader gets as the h1's
 * opening. The visible h1 line under it is `profile.role`, so the masthead,
 * the running head and the headline can never disagree about the role.
 */
export const hero = {
  word: "SATASUK",
  spoken: "Satasuk Viparksinlapin —",
} as const;

/**
 * The standfirst. First person and in his own voice — the giant masthead beside
 * it prints the formal name, so "Hi, I'm Zeze" lands as the human gloss on it.
 *
 * If a seniority signal is ever wanted here, use a start year ("since 2019"),
 * not a total: PRODUCT.md forbids a years-of-experience number because the
 * "6+ years" phrasing came from a résumé the source notes call embellished.
 * A start year says the same thing, is checkable against the dated roles in
 * § 03, and cannot be argued down — Phatra, 2019, is the first job on record.
 */
export const home = {
  standfirst:
    "Hi, I'm Zeze. I'm a senior software engineer with a passion for AIs and creativity. I specialize in backend development, AI engineering and product engineering. I'm a fast learner, and highly adaptive. I believe in simplicity and clarity.",
} as const;

/**
 * The readout cards in § 01, beside the lead card. Mono owns measurement:
 * these are the page's only large mono numerals.
 *
 * The production-products count is DERIVED from the array that renders § 04,
 * so a project added or removed can never leave a stale count on the page. Do
 * not hard-code it back.
 *
 * A fourth readout, "Public repos" (`projects.length`), was cut 2026-08-26. It
 * read as inventory rather than achievement beside "100k+ players served", it
 * invited a ratio against the products count sitting directly above it, and
 * being derived it FELL whenever the personal-projects list was curated down —
 * a metric that punished the exact editing the epigraph below praises.
 *
 * `note` carries the provenance. That is the whole reason the years figure is
 * safe to print: PRODUCT.md bans a bare years-of-experience total because the
 * old "6+ years" came from a résumé the notes call embellished — but a number
 * shown next to the start year it was counted from is checkable against the
 * dated roles in § 03, which sit on the same page. Never print the value
 * without the note.
 */
export const homeStats = [
  { value: "07", label: "Years shipping", note: "since 2019" },
  {
    value: String(workProjects.length).padStart(2, "0"),
    label: "Production products",
  },
  /* Past tense, always — Radiant was sunset in 2026 (PRODUCT.md). */
  { value: "100k+", label: "Players served", note: "Radiant" },
] as const;

/**
 * § 01 About — four short paragraphs, first person, no adjective stacking
 * (REDESIGN-PLAN.md §5.3). The through-line: the same judgment applied
 * further up each time.
 */
export const about = {
  paragraphs: [
    "I'm a senior software engineer in Bangkok. Specialize in: backend, AI Engineering, agent workflow orchestration, and product engineering.",
    "From solo coding to ownership. I built a quest engine by hand. Then I owned a 70+ module codebase. Now I've started a consumer AI product of my own and shipped it live.",
  ],
  /* Closes § 01 — the canonical source for the idea the paragraphs apply. Set
     sentence case, not uppercase: caps are for display, titles and HUD tags,
     and this is quoted prose. */
  epigraph: {
    text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
    attribution: "Antoine de Saint-Exupéry",
  },
} as const;

/** The photograph plate in the hero — the ID card. The file ships full tone,
 *  the CRT glass is CSS. */
export const heroPlate = {
  src: "/images/me.webp",
  alt: "Satasuk Viparksinlapin",
  label: "Bondi, 2025",
  cells: [
    { term: "Based", value: "Bangkok · UTC+7", accent: false },
    { term: "Building", value: "██████", accent: true },
  ],
  lightbox: {
    enlarge: "Enlarge",
    close: "Close",
  },
} as const;

/** The closer. An invitation to ask, then LinkedIn, GitHub and Instagram. */
export const closer = {
  title: "Hiring, or just curious?",
  body: "I'm open to remote roles. The fastest way to find out whether I'm useful to you is to ask me about one of the projects above — I'll tell you what actually happened.",
} as const;
