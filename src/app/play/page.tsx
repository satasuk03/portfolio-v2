/*
 * DIRECTION CONTRACT — play (/play)
 *
 * THESIS: The same record as /, loaded into a machine. / is the
 *   reading edition of the same hangar; this is the unit itself. Every fact
 *   is imported from src/content — nothing here may say something / does not.
 * OWN-WORLD: A hard-surface field unit on a live topographic map table, in a
 *   dark hangar. Beige moulded plastic and gunmetal (the retro-hardware flat
 *   lay), topo contours and a vertical HUD masthead (the survey poster), and
 *   CBRPNK-style rounded cards in solid spot colours for the panels. / shares
 *   the palette and card system; this route adds the 3D unit, bloom and glow.
 * STORY: Seven cartridges orbit the unit: the six home sections in reading
 *   order, then the uplink. Pick one; it launches, flips, slams into the bay,
 *   and its panel opens. Hold the core to overcharge it.
 * FEEL: Every motion anticipates, overshoots and rebounds. Impacts hit-stop,
 *   shake (trauma²), flash and ripple the map. All sound is synthesised live.
 * FORM: Canvas-first, with the module bay as the DOM path in — every panel is
 *   reachable by button and by keys 1–7 without touching the 3D.
 */

import type { Metadata } from "next";
import { PlayExperience } from "@/components/play/play-experience";

export const metadata: Metadata = {
  title: "Satasuk Viparksinlapin — Play edition",
  description:
    "The playable edition of Satasuk's portfolio: a hard-surface field unit, seven data cartridges, and the same record as the reading edition.",
};

export default function PlayPage() {
  return <PlayExperience />;
}
