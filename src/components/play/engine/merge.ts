/*
 * Static merging. The case and the props are built from dozens of little
 * primitives so they can be authored with plain transforms, but the GPU wants
 * few draw calls — and every shadow-casting mesh is drawn twice. After the
 * parts are placed, they are baked into one mesh per (material, casts-shadow)
 * bucket under the same root. Parts too small to throw a shadow worth seeing
 * are left out of the shadow pass.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function mergeStatic(root: THREE.Object3D, meshes: THREE.Mesh[], shadowMin = 0.14) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const rel = new THREE.Matrix4();
  const sphere = new THREE.Sphere();
  const buckets = new Map<string, { mat: THREE.Material; cast: boolean; geos: THREE.BufferGeometry[] }>();
  for (const m of meshes) {
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(rel.copy(inv).multiply(m.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    g.computeBoundingSphere();
    sphere.copy(g.boundingSphere!);
    const cast = sphere.radius > shadowMin;
    const mat = m.material as THREE.Material;
    const key = `${mat.uuid}:${cast}`;
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { mat, cast, geos: [] }));
    b.geos.push(g);
    m.parent?.remove(m);
  }
  for (const { mat, cast, geos } of buckets.values()) {
    const merged = mergeGeometries(geos)!;
    geos.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}
