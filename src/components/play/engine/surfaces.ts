/*
 * Surface scans for the reader — the only image assets in the /play engine.
 *
 * Five flat, evenly-lit, seamlessly tiling scans in public/play/textures/:
 * rust, bare steel, cream enamel, grime (greyscale), gunmetal. They were
 * generated once (OpenRouter, openai/gpt-image-2.5-sunburst) and made
 * tileable by blending each with its half-period roll.
 *
 * They are never the whole look. weathering.ts still decides WHERE the paint
 * has chipped and rusted; the scans only supply what each zone looks like up
 * close. So they are sampled on the CPU, into the same canvases that write
 * colour, roughness and bump, and all the maps keep agreeing pixel for pixel.
 *
 * Additive: if a scan fails to load, its slot is null and every consumer falls
 * back to the procedural surface it had before the scans existed.
 */

import * as THREE from "three";

export type SurfaceName = "rust" | "steel" | "enamel" | "grime" | "gunmetal";

/** A scan resampled to a given tile size, ready for per-pixel lookups. */
export type Tile = {
  size: number;
  data: Uint8ClampedArray;
  /** Mean of each channel, so a scan can modulate a colour without shifting it. */
  mean: [number, number, number];
  /** Wrapped lookup, x/y non-negative canvas pixels. Returns the byte offset into data. */
  at: (x: number, y: number) => number;
};

export type Surfaces = {
  /** The scan resampled so one repeat spans `px` canvas pixels. Cached. */
  tile: (name: SurfaceName, px: number) => Tile | null;
  /** A repeating GPU texture of a scan, for parts that tile it directly. */
  texture: (name: SurfaceName, aniso: number) => THREE.Texture | null;
};

const NAMES: SurfaceName[] = ["rust", "steel", "enamel", "grime", "gunmetal"];

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadSurfaces(base = "/play/textures/"): Promise<Surfaces> {
  const imgs = new Map<SurfaceName, HTMLImageElement | null>();
  await Promise.all(NAMES.map(async (n) => imgs.set(n, await loadImage(`${base}${n}.webp`))));
  const tiles = new Map<string, Tile>();
  const textures = new Map<SurfaceName, THREE.Texture>();

  const tile = (name: SurfaceName, px: number): Tile | null => {
    const img = imgs.get(name);
    if (!img) return null;
    const size = Math.max(8, Math.round(px));
    const key = `${name}:${size}`;
    const hit = tiles.get(key);
    if (hit) return hit;
    // The browser's resampler does the minification: far better than
    // point-sampling a 1024² scan into a canvas that needs 300px of it.
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const mean: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      mean[0] += data[i];
      mean[1] += data[i + 1];
      mean[2] += data[i + 2];
    }
    const n = data.length / 4;
    mean[0] /= n;
    mean[1] /= n;
    mean[2] /= n;
    const t: Tile = {
      size,
      data,
      mean,
      // Hot path — called several times per pixel of every wear canvas.
      at: (x, y) => ((((y | 0) % size) * size + ((x | 0) % size)) << 2),
    };
    tiles.set(key, t);
    return t;
  };

  const texture = (name: SurfaceName, aniso: number) => {
    const img = imgs.get(name);
    if (!img) return null;
    let t = textures.get(name);
    if (!t) {
      t = new THREE.Texture(img);
      t.colorSpace = name === "grime" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = aniso;
      t.needsUpdate = true;
      textures.set(name, t);
    }
    return t;
  };

  return { tile, texture };
}
