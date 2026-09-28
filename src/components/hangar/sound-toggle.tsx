"use client";

/*
 * The one sound control. Off on every visit; the AudioContext is created
 * inside this click handler and nowhere else (see sound.ts).
 */

import { useEffect, useState } from "react";
import { hudCopy } from "@/content/hud";
import { sound } from "./sound";

export function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => sound.subscribe(setOn), []);
  return (
    <button
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
  );
}
