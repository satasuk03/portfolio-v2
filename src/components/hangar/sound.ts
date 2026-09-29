/*
 * Sound on `/` — off by default, one toggle. The only audio file is the
 * music bed, and it loads the first time the visitor turns sound on.
 *
 * The synth is /play's `Sfx` (engine/audio.ts), dynamic-imported the first
 * time the visitor turns sound on, so a visitor who never does downloads none
 * of it. `Sfx.init()` creates the AudioContext, and it is only ever called from
 * inside a click handler — the toggle's, or the first-visit hint's "Turn on"
 * (sound-hint.tsx) — a user gesture, as browsers require.
 *
 * Every cue is a no-op while sound is off, so callers never check. The state
 * is not persisted: the page opens silent on every visit. (The hint persists
 * only that it has been shown, never whether sound was on.)
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
      sfx = new Sfx("/audio/hangar-home.mp3");
    }
    if (next && sfx) {
      sfx.init();
      sfx.setMuted(false);
      // The music bed, well under the cues — the page is for reading.
      sfx.musicOn(0.8, 2.5);
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
