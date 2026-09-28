/*
 * The six home sections, in reading order. One list consumed by everything
 * that needs to know what the sections are — the sticky top bar, the right-edge
 * section rail, the section openers on `/`, and the cartridges on `/play` — so
 * none of them can disagree. The ids are the anchor ids on the page.
 *
 * `color` is the section's module spot. On `/` it paints the opener tag, the
 * section's lead card and its rail tick; on `/play` it is the cartridge label.
 * Dark ink (#101010) sits on every one of them — magenta is the tightest pair
 * at ~4.6:1, so magenta never carries body-size type, only tags and display.
 *
 * `code` is the HUD designation printed beside the § number. Shared with /play.
 */
export const sections = [
  {
    id: "about",
    n: "01",
    label: "About",
    title: "About me",
    code: "OPERATOR",
    color: "#f2913d",
    lede: "The short version.",
  },
  {
    id: "skills",
    n: "02",
    label: "Skills",
    title: "Skills",
    code: "LOADOUT",
    color: "#ffc400",
    lede: "Grouped by what it's for, not by logo count. Everything here is something I've shipped with.",
  },
  {
    id: "experience",
    n: "03",
    label: "Experience",
    title: "Work experience",
    code: "SERVICE RECORD",
    color: "#e8195b",
    /* The old print lede said "three companies, four roles" — § 03 renders six
       roles, so the count was wrong. The count is gone rather than derived: a
       reader can see the companies, and "2019 to now" is the checkable part. */
    lede: "Grouped by company, newest first. 2019 to now.",
  },
  {
    id: "work",
    n: "04",
    label: "Work",
    title: "Work projects",
    code: "DEPLOYMENTS",
    color: "#1fc3ec",
    lede: "Private codebases, kept short on purpose — the detail is interview material, not website copy.",
  },
  {
    id: "personal",
    n: "05",
    label: "Personal",
    title: "Personal projects",
    code: "SIDE OPS",
    color: "#9cc27f",
    lede: "Public, solo, hand-built. Every employer codebase above is private, so this is the only place you can read the actual code.",
  },
  {
    id: "off-the-clock",
    n: "06",
    label: "Off the clock",
    title: "Off the clock",
    code: "R & R",
    color: "#c4c2b8",
    lede: "Three things I do that aren't engineering.",
  },
] as const;

export type Section = (typeof sections)[number];
export type SectionId = Section["id"];

export function section(id: SectionId): Section {
  return sections.find((s) => s.id === id)!;
}
