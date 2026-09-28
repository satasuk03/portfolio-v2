/*
 * Sound on `/` — off by default, one toggle, no audio files.
 *
 * The synth is /play's `Sfx` (engine/audio.ts), dynamic-imported the first
 * time the visitor turns sound on, so a visitor who never does downloads none
 * of it. `Sfx.init()` creates the AudioContext, and it is only ever called from
 * inside the toggle's click handler — a user gesture, as browsers require.
 *
 * Every cue is a no-op while sound is off, so callers never check. The state
 * is not persisted: the page opens silent on every visit.
 */

import type { Sfx } from "@/components/play/engine/audio";

let sfx: Sfx | null = null;
let on = false;
const subs = new Set<(on: boolean) => void>();

export const sound = {
  get on() {
    return on;
  },
  subscribe(fn: (on: boolean) => void) {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
  /** Call from a click handler only. */
  async toggle() {
    const next = !on;
    if (next && !sfx) {
      const { Sfx } = await import("@/components/play/engine/audio");
      sfx = new Sfx();
    }
    if (next && sfx) {
      sfx.init();
      sfx.setMuted(false);
      // The hangar bed, well under the cues — the page is for reading.
      sfx.ambientOn(0.35, 2.5);
    } else sfx?.setMuted(true);
    on = next;
    if (on) sfx?.select();
    subs.forEach((f) => f(on));
  },
  /** Run a cue only while sound is on. */
  play(cue: (s: Sfx) => void) {
    if (on && sfx) cue(sfx);
  },
};
