/*
 * THE SELECTOR — the cartridges laid out for choosing.
 *
 * Opening the case lifts every cartridge out and fans them in front of the
 * lens: the one in focus at the centre, turning slowly; the ones before it
 * stacked on its left, the ones after it stacked on its right, each stack
 * turned to face the middle. It is a coverflow, and it is CONTINUOUS: a card's
 * pose is a smooth function of `dx`, its (fractional) distance from the focus,
 * so a card carried from the right stack to the centre passes through every
 * pose in between and a drag can scrub through them at any speed.
 *
 * Poses are in CAMERA space — x right, y up, z back from the lens — so the
 * fan sits in front of the lens whatever the wide shot is doing. Sizes are
 * solved from the viewport, in pixels, and turned into a distance: the centre
 * card is a fixed fraction of the screen, not a fixed distance from it.
 */

import { CART } from "./models";

export type SelLayout = {
  /** Distance from the lens to the centre card. */
  D: number;
  /** World units per screen pixel at that distance. */
  unit: number;
  /** Centre → first neighbour, then neighbour → neighbour, in world units. */
  g0: number;
  step: number;
  /** How far each stack is turned toward the middle (rad), pushed back, and shrunk. */
  ry: number;
  back: number;
  backStep: number;
  sideScale: number;
  /** Vertical offset of the whole fan (the HUD's top bar is heavier than its bottom). */
  yOff: number;
  /** Screen pixels between neighbouring cards along a drag, for scrubbing. */
  pxPerCard: number;
  /** How much a card rises at the middle of its trip out of the case. */
  arc: number;
};

export type SelPose = { x: number; y: number; z: number; yaw: number; scale: number };

export function selectorLayout(w: number, h: number, fovDeg: number): SelLayout {
  const tall = w / h < 0.9;
  const t = Math.tan((fovDeg * Math.PI) / 360);
  const aspectCard = CART.h / CART.w;
  // The centre card's height on screen.
  const cardPx = tall ? Math.min(h * 0.34, w * 0.6 * aspectCard) : Math.min(h * 0.46, w * 0.3 * aspectCard);
  const D = (CART.h * h) / (2 * t * cardPx);
  const unit = (2 * D * t) / h;
  const cardW = cardPx / aspectCard;
  const ry = tall ? 0.95 : 0.98;
  const sideScale = tall ? 0.9 : 0.86;
  const halfNear = 0.5 * cardW * Math.cos(ry) * sideScale;
  const g0px = tall ? cardW * 0.5 + 36 : cardW * 0.5 + halfNear + 26;
  const halfView = w / 2;
  const stepPx = tall ? 13 : Math.max(24, Math.min(66, (halfView * 0.86 - g0px) / 5.2));
  return {
    D,
    unit,
    g0: g0px * unit,
    step: stepPx * unit,
    ry,
    back: 0.55,
    backStep: 0.09,
    sideScale,
    yOff: (tall ? 0.03 : 0.045) * h * unit,
    pxPerCard: Math.max(70, stepPx * 2.4),
    arc: 0.9,
  };
}

/** The pose of the card `dx` places from the focus (negative: before it). */
export function selectorPose(dx: number, L: SelLayout, out: SelPose): SelPose {
  const s = Math.sign(dx);
  const a = Math.abs(dx);
  const near = Math.min(a, 1);
  const far = Math.max(a - 1, 0);
  const e = near * near * (3 - 2 * near);
  out.x = s * (e * L.g0 + far * L.step);
  out.y = L.yOff;
  out.z = -(e * L.back + far * L.backStep);
  out.yaw = -s * L.ry * e;
  out.scale = 1 - (1 - L.sideScale) * e;
  return out;
}

/** The centre card's turntable: hold the front for a while, then one slow full turn. */
export const SPIN = { dwell: 3.4, turn: 3.4 };
