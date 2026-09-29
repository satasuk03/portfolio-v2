/*
 * DIRECTION CONTRACT — play (/play)
 *
 * THESIS: The same record as /, loaded into a machine. / is the
 *   reading edition of the same hangar; this is the unit itself. Every fact
 *   is imported from src/content — nothing here may say something / does not.
 * OWN-WORLD: A hard-surface field unit standing on a sci-fi desk, in a dark
 *   hangar. The desk is bigger than the frame — graphite plates, power
 *   conduits and a few greebles, lit by one lamp, running off into the dark.
 *   Beige moulded plastic and gunmetal (the retro-hardware flat lay), a
 *   vertical HUD masthead (the survey poster), and CBRPNK-style rounded cards
 *   in solid spot colours for the panels. / shares the palette and card
 *   system; this route adds the 3D unit, bloom and glow.
 * STORY: Seven cartridges lie on the desk in lit pads: the six home sections
 *   in reading order, then the uplink. Pick one; it lifts, flies to the slot,
 *   is fed in and latches, the camera goes in to the unit's display, and its
 *   panel opens. Hold the core to overcharge it.
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
