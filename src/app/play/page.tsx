/*
 * DIRECTION CONTRACT — play (/play)
 *
 * THESIS: The same record as /, loaded into a machine. / is the
 *   reading edition of the same hangar; this is the unit itself. Every fact
 *   is imported from src/content — nothing here may say something / does not.
 * OWN-WORLD: A hard-surface field unit standing on a sci-fi desk, in a dark
 *   hangar, turned toward a case of cartridges and seen from a leaning angle
 *   (the wide shot has a yaw and a roll; the close-up is square and level).
 *   The desk is bigger than the frame — graphite plates, power conduits and a
 *   few greebles, lit by one lamp, running off into the dark — with a few
 *   things left on it. Beige moulded plastic and gunmetal (the retro-hardware
 *   flat lay), a vertical HUD masthead (the survey poster), and CBRPNK-style
 *   rounded cards in solid spot colours for the panels. / shares the palette
 *   and card system; this route adds the 3D unit, bloom and glow.
 * STORY: Seven cartridges stand in an open case on the desk: the six home
 *   sections in reading order, then the uplink. Open the case and they lift
 *   out and fan in front of you, the one in focus turning slowly. Browse,
 *   choose one; it flies to the reader's slot, is fed in and latches, the
 *   camera goes in to the unit's display, and its panel opens. Eject and it
 *   goes home to the case. Hold the core to overcharge it.
 * FEEL: Every motion anticipates, overshoots and rebounds. Impacts hit-stop,
 *   shake (trauma²), flash, and surge out along the desk's conduits. Every cue
 *   is synthesised live; the one audio file is the music bed.
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
