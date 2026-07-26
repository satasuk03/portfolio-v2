/*
 * THE FIGURE — the wireframe cutaway at the centre of the manual spread.
 *
 * Drawn, not rendered. Black line work on cream with no lighting, no material
 * shading and no post-processing, because a printed technical illustration has
 * none of those. That constraint is also why this is cheap: three LineSegments
 * and one Points cloud, no textures, no GLTF, no shadow map. `public/` is empty
 * and no art is coming, so every mark on screen has to be generated.
 *
 * WHAT IT DEPICTS, and why it is this shape rather than a decorative blob:
 *   the outer geodesic is a corpus, the dots are its documents, and as scroll
 *   progress advances a subset of those dots inks up cyan while the inner core
 *   grows — retrieval selecting from a body of text. The site's lead claim is
 *   retrieval, so the figure diagrams the lead claim.
 *
 * Scroll drives it and nothing else does. There is no autoplaying rotation:
 * stop scrolling and the figure holds still, the way a page does.
 */

import * as THREE from "three";

const INK = new THREE.Color("#14120e");
const CYAN = new THREE.Color("#0a7c93");
const HALFTONE = new THREE.Color("#b8b2a2");

export type FigureHandle = {
  /** 0 → 1 across the sticky chapter. */
  setProgress: (p: number) => void;
  resize: () => void;
  dispose: () => void;
};

type Options = {
  /** Renders a single composed frame and never animates again. */
  reducedMotion?: boolean;
};

const POINT_VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uProgress;
  uniform float uScale;
  varying float vOn;

  void main() {
    // A dot inks up once progress passes its seed, so the cloud resolves
    // unevenly — like a plate taking ink — instead of fading as one mass.
    vOn = step(aSeed, uProgress);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // gl_PointSize is in *device* pixels, so uScale carries the pixel ratio and
    // these land at roughly 1.9 / 4.2 CSS px — a halftone stipple, not a blob.
    gl_PointSize = uScale * (vOn > 0.5 ? 2.4 : 1.1) * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const POINT_FRAG = /* glsl */ `
  uniform vec3 uDim;
  uniform vec3 uOn;
  varying float vOn;

  void main() {
    // Round dots, hard edge. This is a halftone dot, not a soft sprite — a
    // gaussian falloff here would read as glow, which paper cannot do.
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    gl_FragColor = vec4(mix(uDim, uOn, vOn), 1.0);
  }
`;

export function createFigure(
  canvas: HTMLCanvasElement,
  { reducedMotion = false }: Options = {},
): FigureHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    /* Only the reduced-motion path needs this, and it genuinely needs it: with
       the default `false` the browser is free to discard the drawing buffer once
       it has composited, which is invisible while a rAF loop keeps refilling it
       every frame and fatal the moment the loop stops. A frozen figure without
       this goes blank — reproduced on the production static export, not just in
       dev. Kept off for the animated path, where it costs performance and buys
       nothing. */
    preserveDrawingBuffer: reducedMotion,
  });
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  /* The whole assembly tilts as one, so the figure reads as a single drawn
     object rather than three coincident shapes. */
  const rig = new THREE.Group();
  scene.add(rig);

  /* Radius 2.4 spans roughly three quarters of the frame width, so the line
     work reaches most of the letterforms it is seen through rather than sitting
     as a small ball behind the middle two glyphs. Detail 3 rather than 2 because
     WebGL cannot draw a line thicker than 1px — density is the only way to give
     the drawing weight. */
  // ── the corpus: outer geodesic shell ────────────────────────────────────
  const shellGeo = new THREE.IcosahedronGeometry(2.4, 3);
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(shellGeo),
    new THREE.LineBasicMaterial({
      color: INK,
      transparent: true,
      /* Low enough that prose sitting over the figure stays comfortable to
         read — this is a drawing behind the page, not a texture on it. */
      opacity: 0.3,
    }),
  );
  rig.add(shell);

  // ── the index: inner core, counter-rotating ─────────────────────────────
  const coreGeo = new THREE.IcosahedronGeometry(1, 1);
  const core = new THREE.LineSegments(
    new THREE.WireframeGeometry(coreGeo),
    new THREE.LineBasicMaterial({ color: CYAN }),
  );
  rig.add(core);

  // ── the query path: a tilted orbit, the manual's diagram convention ─────
  const orbitGeo = new THREE.TorusGeometry(2.62, 0.005, 3, 120);
  const orbit = new THREE.Mesh(
    orbitGeo,
    new THREE.MeshBasicMaterial({ color: INK }),
  );
  orbit.rotation.x = Math.PI * 0.5;
  rig.add(orbit);

  // ── the documents: halftone dot cloud on the shell's vertices ──────────
  const dotSource = new THREE.IcosahedronGeometry(2.4, 3);
  const positions = dotSource.getAttribute("position") as THREE.BufferAttribute;
  const count = positions.count;

  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Deterministic, so the reveal order is identical on every load and the
    // figure is the same drawing each time it is printed.
    seeds[i] = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  }

  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", positions.clone());
  dotGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const dotMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    uniforms: {
      uProgress: { value: 0 },
      uScale: { value: 1 },
      uDim: { value: HALFTONE },
      uOn: { value: CYAN },
    },
  });
  const dots = new THREE.Points(dotGeo, dotMat);
  rig.add(dots);

  dotSource.dispose();

  // ── scroll wiring ───────────────────────────────────────────────────────

  /* Reduced motion holds the at-rest composition — the same frame an animated
     visitor sees before scrolling, where the dome is lifted and framed by the
     hero's open field. Composing mid-chapter instead pushes the camera in and
     drops the rig, which strands the drawing behind the sheet. */
  let progress = 0;
  let frame = 0;
  let needsRender = true;

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    /* Narrow viewports pull the camera back and shrink the dot so the figure
       stays a whole object on a phone instead of being cropped into texture. */
    const narrow = w < 640;
    camera.position.z = narrow ? 8.4 : 6.6;
    dotMat.uniforms.uScale.value = dpr * (narrow ? 0.8 : 1);

    camera.updateProjectionMatrix();
    needsRender = true;
  }

  function compose() {
    const p = progress;

    // Camera dollies in as the chapter advances. Small move — a printed figure
    // is redrawn at a new angle between beats, it does not swoop.
    const narrow = canvas.getBoundingClientRect().width < 640;
    const base = narrow ? 8.4 : 6.6;
    camera.position.z = base - p * (narrow ? 1.8 : 2.2);

    /* The hero shows the figure through a band of type in the upper half of the
       viewport, so it starts lifted and settles to centre once the reader is
       past the hero and reading the retrieval figures instead. */
    rig.position.y = 0.42 * (1 - Math.min(1, p / 0.22));

    rig.rotation.y = -0.5 + p * 2.35;
    rig.rotation.x = 0.32 - p * 0.42;

    core.rotation.y = 0.4 - p * 3.1;
    core.rotation.z = p * 1.2;
    core.scale.setScalar(0.62 + p * 0.5);

    orbit.rotation.z = p * 1.6;

    // The shell recedes as the index asserts itself.
    (shell.material as THREE.LineBasicMaterial).opacity = 0.5 - p * 0.24;

    dotMat.uniforms.uProgress.value = p;

    camera.updateProjectionMatrix();
  }

  function render() {
    compose();
    renderer.render(scene, camera);
    needsRender = false;
  }

  /* Reduced motion runs the same loop, then stops itself. The divergent
     render-once path this replaces was subtly broken: its single render landed
     before the sticky container had its final height, so a reduced-motion
     visitor kept that stale frame forever and saw only the sliver of the drawing
     that happened to fall inside the headline. Same loop, same first frame, one
     less code path — it just shuts down once the layout has settled. */
  const REDUCED_FRAMES = 40;
  let framesRun = 0;

  function tick() {
    if (needsRender) render();

    framesRun += 1;
    if (reducedMotion && framesRun >= REDUCED_FRAMES) {
      frame = 0;
      return;
    }

    frame = requestAnimationFrame(tick);
  }

  layout();
  tick();

  return {
    setProgress(p) {
      const clamped = Math.min(1, Math.max(0, p));
      if (Math.abs(clamped - progress) < 0.0005) return;
      progress = clamped;
      needsRender = true;
    },
    resize() {
      layout();
      if (reducedMotion) render();
    },
    dispose() {
      cancelAnimationFrame(frame);
      shellGeo.dispose();
      coreGeo.dispose();
      orbitGeo.dispose();
      dotGeo.dispose();
      shell.geometry.dispose();
      core.geometry.dispose();
      (shell.material as THREE.Material).dispose();
      (core.material as THREE.Material).dispose();
      (orbit.material as THREE.Material).dispose();
      dotMat.dispose();
      renderer.dispose();
    },
  };
}
