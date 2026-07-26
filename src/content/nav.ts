/*
 * The six home sections, in reading order. One list consumed by both
 * navigation mechanisms — the top bar and the dot rail — so the two can
 * never disagree about what the sections are (REDESIGN-PLAN.md §4). The ids
 * are the SectionOpener ids in src/app/page.tsx.
 */
export const sections = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "personal", label: "Personal" },
  { id: "off-the-clock", label: "Off the clock" },
] as const;
