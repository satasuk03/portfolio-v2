/*
 * DIRECTION CONTRACT — play (/play)
 *
 * THESIS: The same record as /, loaded into a machine. The print edition is a
 *   manual; this is the unit the manual came with. Every fact is imported from
 *   src/content — nothing here is allowed to say something / does not.
 * OWN-WORLD: A hard-surface field unit on a live topographic map table, in a
 *   dark hangar. Beige moulded plastic and gunmetal (the retro-hardware flat
 *   lay), topo contours and a vertical HUD masthead (the survey poster), and
 *   CBRPNK-style rounded cards in solid spot colours for the panels. The one
 *   dark surface in the site, on purpose — this is the other edition.
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
    "The playable edition of Satasuk's portfolio: a hard-surface field unit, seven data cartridges, and the same record as the print edition.",
};

export default function PlayPage() {
  return <PlayExperience />;
}
