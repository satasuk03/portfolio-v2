/*
 * DESK PROPS — the things a person leaves on a bench. They are here so the
 * desk reads as used, and they are deliberately inert: darker and lower in
 * contrast than the cartridges, never on the click path, and kept out of the
 * case's and the reader's footprints by the layout.
 *
 * All primitives, no textures except the tape's hazard weave. Each prop is
 * built at the origin standing on y = 0 and placed by the stage.
 */

import * as THREE from "three";
import type { PropSpot } from "./layout";
import type { Mats } from "./models";
import { canvas, hazard } from "./textures";
import { mergeStatic } from "./merge";

function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, parent?: THREE.Object3D) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent?.add(o);
  return o;
}

function mug() {
  const g = new THREE.Group();
  const enamel = new THREE.MeshPhysicalMaterial({ color: "#d8d1bd", roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
  const profile = [
    [0.001, 0],
    [0.235, 0],
    [0.265, 0.03],
    [0.272, 0.34],
    [0.262, 0.362],
    [0.242, 0.35],
    [0.242, 0.07],
    [0.001, 0.07],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(profile, 24), enamel, 0, 0, 0, g);
  // Blue rim, like camp enamelware.
  const rim = mesh(new THREE.TorusGeometry(0.262, 0.0125, 5, 28), new THREE.MeshStandardMaterial({ color: "#20407a", roughness: 0.5 }), 0, 0.358, 0, g);
  rim.rotation.x = Math.PI / 2;
  const coffee = mesh(new THREE.CircleGeometry(0.242, 28), new THREE.MeshStandardMaterial({ color: "#1e120a", roughness: 0.18 }), 0, 0.27, 0, g);
  coffee.rotation.x = -Math.PI / 2;
  coffee.castShadow = false;
  const handle = mesh(new THREE.TorusGeometry(0.105, 0.028, 6, 12, Math.PI), enamel, 0.27, 0.19, 0, g);
  handle.rotation.z = -Math.PI / 2;
  return g;
}

function driver(mats: Mats) {
  const g = new THREE.Group();
  const handleGeo = new THREE.CylinderGeometry(0.05, 0.056, 0.36, 14);
  handleGeo.rotateZ(Math.PI / 2);
  mesh(handleGeo, mats.orangePlastic, -0.12, 0.054, 0, g);
  const collar = new THREE.CylinderGeometry(0.058, 0.058, 0.03, 14);
  collar.rotateZ(Math.PI / 2);
  mesh(collar, mats.darkMetal, 0.075, 0.054, 0, g);
  const shaft = new THREE.CylinderGeometry(0.013, 0.013, 0.44, 8);
  shaft.rotateZ(Math.PI / 2);
  mesh(shaft, mats.chrome, 0.31, 0.054, 0, g);
  const tip = new THREE.ConeGeometry(0.013, 0.05, 8);
  tip.rotateZ(-Math.PI / 2);
  mesh(tip, mats.chrome, 0.555, 0.054, 0, g);
  // Grip flutes.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const fl = new THREE.BoxGeometry(0.28, 0.012, 0.014);
    mesh(fl, mats.darkMetal, -0.14, 0.054 + Math.sin(a) * 0.052, Math.cos(a) * 0.052, g).rotation.x = a;
  }
  return g;
}

function tape() {
  const g = new THREE.Group();
  const [c, ctx] = canvas(512, 64);
  hazard(ctx, 0, 0, 512, 64, "#ffc400", "#141414", 22);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1);
  t.anisotropy = 4;
  const H = 0.17;
  mesh(new THREE.CylinderGeometry(0.235, 0.235, H, 48, 1, true), new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }), 0, H / 2, 0, g);
  const card = new THREE.MeshStandardMaterial({ color: "#8a7657", roughness: 0.9, side: THREE.DoubleSide });
  for (const y of [0.001, H - 0.001]) {
    const ring = mesh(new THREE.RingGeometry(0.095, 0.235, 48), card, 0, y, 0, g);
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = false;
  }
  mesh(new THREE.CylinderGeometry(0.095, 0.095, H, 32, 1, true), card, 0, H / 2, 0, g);
  return g;
}

function coil(mats: Mats) {
  const g = new THREE.Group();
  const rubber = new THREE.MeshStandardMaterial({ color: "#131417", roughness: 0.55, metalness: 0.1 });
  [0.31, 0.3, 0.29].forEach((R, i) => {
    const t = mesh(new THREE.TorusGeometry(R - i * 0.008, 0.032, 7, 32), rubber, 0, 0.032 + i * 0.058, 0, g);
    t.rotation.x = Math.PI / 2;
    t.rotation.z = i * 0.7;
  });
  // A wrap of tape round the coil, and the tail out to a plug.
  const wrap = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 10), mats.orangePlastic, 0.3, 0.09, 0, g);
  wrap.rotation.x = Math.PI / 2;
  wrap.scale.set(1.5, 1, 1.5);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.33, 0.03, 0.08), new THREE.Vector3(0.6, 0.03, 0.3), new THREE.Vector3(0.9, 0.03, 0.18), new THREE.Vector3(1.12, 0.045, 0.3)]);
  mesh(new THREE.TubeGeometry(curve, 20, 0.03, 6), rubber, 0, 0, 0, g);
  const plug = mesh(new THREE.BoxGeometry(0.2, 0.09, 0.12), mats.gunmetal, 1.2, 0.045, 0.32, g);
  plug.rotation.y = 0.3;
  mesh(new THREE.BoxGeometry(0.07, 0.05, 0.08), mats.chrome, 1.32, 0.045, 0.35, g).rotation.y = 0.3;
  return g;
}

function cells(mats: Mats) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: "#d9d2bf", roughness: 0.5 });
  [
    [0, 0, 0.05],
    [0.05, 0.21, -0.12],
  ].forEach(([x, z, yaw]) => {
    const cell = new THREE.Group();
    const b = new THREE.CylinderGeometry(0.088, 0.088, 0.4, 22);
    b.rotateZ(Math.PI / 2);
    mesh(b, body, 0, 0.088, 0, cell);
    const band = new THREE.CylinderGeometry(0.092, 0.092, 0.11, 22);
    band.rotateZ(Math.PI / 2);
    mesh(band, mats.orangePlastic, -0.06, 0.088, 0, cell);
    for (const s of [-1, 1]) {
      const cap = new THREE.CylinderGeometry(0.056, 0.056, 0.05, 16);
      cap.rotateZ(Math.PI / 2);
      mesh(cap, mats.chrome, s * 0.22, 0.088, 0, cell);
    }
    cell.position.set(x, 0, z);
    cell.rotation.y = yaw;
    g.add(cell);
  });
  return g;
}

function bolts(mats: Mats) {
  const g = new THREE.Group();
  const spots: [number, number, number][] = [
    [0, 0, 0.3],
    [0.13, 0.05, 1.1],
    [-0.08, 0.14, 2.0],
    [0.22, -0.11, 0.7],
  ];
  spots.forEach(([x, z, yaw], i) => {
    if (i < 2) {
      const nut = new THREE.CylinderGeometry(0.036, 0.036, 0.024, 6);
      mesh(nut, mats.screw, x, 0.012, z, g).rotation.y = yaw;
    } else {
      const screw = new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8);
      screw.rotateZ(Math.PI / 2);
      const s = mesh(screw, mats.chrome, x, 0.012, z, g);
      s.rotation.y = yaw;
      const head = new THREE.CylinderGeometry(0.03, 0.03, 0.018, 10);
      head.rotateZ(Math.PI / 2);
      const h = mesh(head, mats.screw, x + Math.cos(yaw) * 0.07, 0.016, z - Math.sin(yaw) * 0.07, g);
      h.rotation.y = yaw;
    }
  });
  return g;
}

export function buildProps(spots: PropSpot[], mats: Mats) {
  const root = new THREE.Group();
  root.name = "props";
  for (const s of spots) {
    const g = s.kind === "mug" ? mug() : s.kind === "driver" ? driver(mats) : s.kind === "tape" ? tape() : s.kind === "coil" ? coil(mats) : s.kind === "cells" ? cells(mats) : bolts(mats);
    const meshes: THREE.Mesh[] = [];
    g.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
    mergeStatic(g, meshes, 0.12);
    g.position.set(s.x, 0, s.z);
    g.rotation.y = s.yaw;
    root.add(g);
  }
  return root;
}
