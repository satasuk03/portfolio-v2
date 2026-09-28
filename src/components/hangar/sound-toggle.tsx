"use client";

/*
 * The one sound control. Off on every visit; the AudioContext is created
 * inside a click handler — this one, or the first-visit hint's "Turn on",
 * which points here (see sound.ts, sound-hint.tsx).
 */

import { useEffect, useRef, useState } from "react";
import { hudCopy } from "@/content/hud";
import { sound } from "./sound";
import { SoundHint } from "./sound-hint";

export function SoundToggle() {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => sound.subscribe(setOn), []);
  return (
    <>
      <button
        ref={ref}
        type="button"
        className="hud-btn topbar-snd"
        aria-pressed={on}
        aria-label={on ? hudCopy.sound.labelOn : hudCopy.sound.labelOff}
        onClick={() => void sound.toggle()}
      >
        <span className="eq" data-on={on ? "true" : "false"} aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="hud-label">{on ? hudCopy.sound.on : hudCopy.sound.off}</span>
      </button>
      <SoundHint anchor={ref} />
    </>
  );
}
