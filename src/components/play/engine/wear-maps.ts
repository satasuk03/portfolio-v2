/*
 * The three.js side of weathering.ts, kept apart so the generator itself stays
 * three-free (the home page uses it for its enamel plates).
 */

import * as THREE from "three";
import type { Wear } from "./weathering";

/** Wrap the three canvases as textures for a MeshStandardMaterial. */
export function wearMaps(wr: Wear, aniso: number) {
  const map = new THREE.CanvasTexture(wr.colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = aniso;
  const roughnessMap = new THREE.CanvasTexture(wr.rouC);
  roughnessMap.anisotropy = aniso;
  const bumpMap = new THREE.CanvasTexture(wr.bmpC);
  bumpMap.anisotropy = aniso;
  return { map, roughnessMap, bumpMap };
}
