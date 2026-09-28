/*
 * /play — the playable edition. Module list and HUD copy only; every word of
 * the record itself is imported from the same content files the print edition
 * uses, so the two editions can never disagree about the facts.
 *
 * One cartridge per home section, in the home page's reading order, plus the
 * uplink. `id` matches `sections` in nav.ts for the six that mirror it.
 *
 * `color` is the cartridge label and the panel's header card. Dark ink sits on
 * every one of them (black on #e8195b is the tightest pairing, ~4.6:1).
 */

export type PlayModule = {
  id: string;
  n: string;
  label: string;
  /** The system name printed on the cartridge label. */
  code: string;
  color: string;
  /** One line under the panel title. Mirrors the print edition's ledes. */
  lede: string;
};

export const playModules: PlayModule[] = [
  { id: "about", n: "01", label: "About", code: "OPERATOR", color: "#f2913d", lede: "The short version." },
  { id: "skills", n: "02", label: "Skills", code: "LOADOUT", color: "#ffc400", lede: "Grouped by what it's for, not by logo count. Everything here is something I've shipped with." },
  { id: "experience", n: "03", label: "Experience", code: "SERVICE RECORD", color: "#e8195b", lede: "Grouped by company, newest first. 2019 to now." },
  { id: "work", n: "04", label: "Work", code: "DEPLOYMENTS", color: "#1fc3ec", lede: "Private codebases, kept short on purpose — the detail is interview material, not website copy." },
  { id: "personal", n: "05", label: "Personal", code: "SIDE OPS", color: "#9cc27f", lede: "Public, solo, hand-built. Every employer codebase is private, so this is where you can read the actual code." },
  { id: "off-the-clock", n: "06", label: "Off the clock", code: "R & R", color: "#c4c2b8", lede: "Three things I do that aren't engineering." },
  { id: "uplink", n: "07", label: "Contact", code: "UPLINK", color: "#ece6d6", lede: "LinkedIn and GitHub. Instagram rides along." },
];

export const playCopy = {
  unit: "FIELD UNIT S-03",
  edition: "Play edition",
  bootTitle: "Initialize",
  bootHint: "Click, tap or press Enter. Sound on.",
  loading: "Loading unit",
  hints: {
    desktop: "Drag to spin · Click a module · Hold the core",
    touch: "Swipe to spin · Tap a module · Hold the core",
  },
  printEdition: "Print edition",
  eject: "Eject",
  status: { nominal: "SYS NOMINAL", charging: "CHARGING", overcharge: "DISCHARGE" },
  /* Bangkok, to four places — decoration that is also true. */
  coords: "13.7563°N  100.5018°E",
} as const;
