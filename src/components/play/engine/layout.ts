/*
 * THE COMPOSITION — where things sit on the desk and how the wide camera looks
 * at them. The numbers live here, in one place, so the frame can be re-cut
 * without touching the engine.
 *
 * The reader stands at the origin facing +z. The camera does not look at it
 * square: it comes in from the side (`camYaw`) with a lean (`camRoll`), so the
 * reader is turned toward the case of cartridges and its base runs out of the
 * frame like a thing that is really on a table. The close-up undoes both — it
 * goes to the display head-on and level, which is what makes the push-in read
 * as "leaning in to read".
 */

export type LayoutMode = "wide" | "tall";
export type Spot = { x: number; z: number; yaw: number };

export type PropKind = "mug" | "driver" | "tape" | "coil" | "cells" | "bolts";
export type PropSpot = Spot & { kind: PropKind };

export type StageLayout = {
  /** The cartridge case: origin at the centre of its floor, its length along local z. */
  caseSpot: Spot;
  /** Wide-shot camera: orbit yaw and roll (radians) and elevation. */
  camYaw: number;
  camRoll: number;
  pitch: number;
  props: PropSpot[];
};

/** One slot per cartridge: the pitch between neighbours, along the case's length. */
export const SLOT_PITCH = 0.42;

/** The case's outer footprint for `n` cartridges. */
export function caseDims(n: number) {
  const inner = n * SLOT_PITCH + 0.16;
  const wall = 0.09;
  return { w: 1.3, l: inner + wall * 2, wall, inner };
}

export function stageLayout(mode: LayoutMode): StageLayout {
  if (mode === "wide") {
    return {
      caseSpot: { x: 3.55, z: 0.9, yaw: -0.32 },
      camYaw: -0.52,
      camRoll: 0.26,
      pitch: 0.62,
      props: [
        { kind: "mug", x: 3.85, z: -4.2, yaw: 0.6 },
        { kind: "driver", x: 0.85, z: 1.5, yaw: 0.5 },
        { kind: "tape", x: -1.3, z: 1.0, yaw: 0 },
        { kind: "coil", x: -2.3, z: -0.8, yaw: Math.PI },
        { kind: "cells", x: 1.9, z: -1.4, yaw: -0.3 },
        { kind: "bolts", x: -0.35, z: 1.75, yaw: 0 },
      ],
    };
  }
  return {
    caseSpot: { x: 0.35, z: 3.9, yaw: -0.5 },
    camYaw: -0.34,
    camRoll: 0.17,
    pitch: 0.74,
    props: [
      { kind: "mug", x: -1.9, z: 1.2, yaw: 0.6 },
      { kind: "driver", x: 1.9, z: 1.7, yaw: -0.4 },
      { kind: "tape", x: -1.6, z: 5.3, yaw: 0 },
      { kind: "cells", x: 2.2, z: 5.6, yaw: 0.2 },
    ],
  };
}
