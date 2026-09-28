/*
 * /play — the playable edition. Module list and HUD copy only; every word of
 * the record itself is imported from the same content files the home page
 * uses, so the two editions can never disagree about the facts.
 *
 * One cartridge per home section, in the home page's reading order, plus the
 * uplink. The six that mirror a home section are DERIVED from `sections` in
 * nav.ts — id, number, label, code and colour — so a section renamed or
 * recoloured there changes on both routes at once. Only the ledes differ, and
 * only where the cartridge panel has no "above" to point at.
 *
 * `color` is the cartridge label and the panel's header card. Dark ink sits on
 * every one of them (black on #e8195b is the tightest pairing, ~4.6:1).
 */

import { sections } from "./nav";

export type PlayModule = {
  id: string;
  n: string;
  label: string;
  /** The system name printed on the cartridge label. */
  code: string;
  color: string;
  /** One line under the panel title. Mirrors the home page's ledes. */
  lede: string;
};

/* Where a panel's lede must differ from the home opener's. § 05 on / says
   "every employer codebase above"; a cartridge panel has no "above". */
const ledeOverride: Partial<Record<string, string>> = {
  personal:
    "Public, solo, hand-built. Every employer codebase is private, so this is where you can read the actual code.",
};

export const playModules: PlayModule[] = [
  ...sections.map((s) => ({
    id: s.id,
    n: s.n,
    label: s.label,
    code: s.code,
    color: s.color,
    lede: ledeOverride[s.id] ?? s.lede,
  })),
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
  /* The link back to /. It was "Print edition" while / was the printed
     manual; / is now the reading edition of the same hangar. */
  homeEdition: "Reading edition",
  homeFallback: "The reading edition works everywhere ↗",
  eject: "Eject",
  status: { nominal: "SYS NOMINAL", charging: "CHARGING", overcharge: "DISCHARGE" },
  /* Bangkok, to four places — decoration that is also true. */
  coords: "13.7563°N  100.5018°E",
} as const;
