/*
 * The three.js side of weathering.ts, kept apart so the generator itself stays
 * three-free (the home page uses it for its enamel plates).
 */

import * as THREE from "three";
import type { Wear } from "./weathering";

/** Wrap the canvases as textures. `orm` feeds roughness, metalness and clearcoat. */
export function wearMaps(wr: Wear, aniso: number) {
  const map = new THREE.CanvasTexture(wr.colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = aniso;
  const orm = new THREE.CanvasTexture(wr.ormC);
  orm.anisotropy = aniso;
  const bumpMap = new THREE.CanvasTexture(wr.bmpC);
  bumpMap.anisotropy = aniso;
  return { map, orm, bumpMap };
}

/**
 * The material every weathered part wears. `hi` adds a clearcoat lobe masked
 * to the intact enamel, so paint reads semi-gloss next to matte rust — the
 * single biggest cue that it is paint on steel and not a printed picture.
 */
export function wearMaterial(wr: Wear, aniso: number, o: { hi: boolean; bumpScale?: number; coat?: number }) {
  const { map, orm, bumpMap } = wearMaps(wr, aniso);
  const base = { map, roughnessMap: orm, metalnessMap: orm, bumpMap, bumpScale: o.bumpScale ?? 3, roughness: 1, metalness: 1 };
  if (!o.hi) return new THREE.MeshStandardMaterial(base);
  return new THREE.MeshPhysicalMaterial({ ...base, clearcoat: o.coat ?? 0.35, clearcoatMap: orm, clearcoatRoughness: 0.42 });
}
