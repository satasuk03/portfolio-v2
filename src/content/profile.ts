import { projects, workProjects } from "./projects";

export const profile = {
  name: "Satasuk Viparksinlapin",
  short: "Ze",
  /* Corrected 2026-07-25 on Ze's own instruction: he was never formally a
     Technical Lead. That title reached research/00-synthesis.md and
     research/02-profile-and-radiant.md only through his own Obsidian notes and
     LinkedIn self-description ("grew into Technical Lead"), never a real
     appointment. Every ownership fact underneath it is kept; the title is not
     asserted anywhere on the site. */
  /* Kept in step with `hero.tail` below — the running head and the line under
     the knockout word are both in the first viewport, so they cannot disagree.
     Change one, change the other. */
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
 * The first viewport. `word` is knocked out of the paper sheet and `tail`
 * completes the sentence beneath it, so the two must read as one line. `spoken`
 * is what a screen reader gets, since the knockout is decorative SVG.
 */
export const hero = {
  word: "SATASUK",
  /* Renders uppercase (.title, The Uppercase Ceiling Rule), so it stays a
     label — the warm first-person line lives in `home.standfirst` below,
     where sentence-case prose belongs. */
  tail: "— senior software engineer, AI Solutionist.",
  spoken: "Satasuk Viparksinlapin — senior software engineer, AI Solutionist.",
  /* Unnumbered — the photo plate carries Fig. 00, and one figure number may
     only ever point at one thing. */
  figureCaption: "The builder",
} as const;

/**
 * The standfirst. First person and in his own voice — the giant knockout above
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
    "Hi, I'm Zeze. I'm a senior software engineer with a passion for AIs and creativity. I specialize in backend development, building robust and scalable systems that power great user experiences. I'm a fast learner, and highly adaptive. I believe in simplicity and clarity.",
} as const;

/**
 * The readout stack in Fig. 01, filling the column the 68ch prose measure
 * leaves empty on desktop. The Mono Owns Measurement Rule: these are the
 * site's only large numerals outside /arcade.
 *
 * Two of the four are DERIVED from the arrays that render § 04 and § 05, so a
 * project added or removed can never leave a stale count on the page. Do not
 * hard-code them back.
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
  {
    value: String(projects.length).padStart(2, "0"),
    label: "Public repos",
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
    "I'm a senior software engineer in Bangkok. Specialize in: backend, AI, agent workflow orchestration, and the layer where a product's promises meet its data.",
    "The through-line of my career is the same skill applied further up each time. I built a quest engine by hand, then owned architecture and incident triage across a 70+ module codebase, and now I direct agents to ship a live consumer AI product — specifying and reviewing far more than I type. Each step needed the same thing: knowing what good looks like before it exists.",
    "I've also watched two markets disappear underneath a product I was building, and rebuilt through both. That's taught me more about engineering judgment than any green-field project has.",
    "I like simple things that hold up. I'd rather delete a system than defend it.",
  ],
  /* Closes Fig. 01, directly under the "I'd rather delete a system than defend
     it" line — his own vernacular for the idea, then the canonical source for
     it. Set sentence case, not uppercase: The Uppercase Ceiling Rule reserves
     caps for display, titles, captions and tags, and this is quoted prose. */
  epigraph: {
    text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
    attribution: "Antoine de Saint-Exupéry",
  },
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

/** The closer. An invitation to ask, then LinkedIn, GitHub and Instagram. */
export const closer = {
  title: "Hiring, or just curious?",
  body: "I'm open to remote roles. The fastest way to find out whether I'm useful to you is to ask me about one of the projects above — I'll tell you what actually happened.",
} as const;
