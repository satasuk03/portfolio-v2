/*
 * GLSL for /play. Output values above 1.0 are deliberate: the composer runs
 * in half-float, bloom thresholds at ~0.9 linear, and OutputPass tone-maps
 * last — so only things written hot here ever bloom.
 */

const noise = /* glsl */ `
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash21(i), hash21(i+vec2(1,0)), u.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for(int i=0;i<5;i++){ v += a*vnoise(p); p = r*p*2.03 + 17.1; a *= 0.5; }
    return v;
  }
`;

// ── the map table: topographic contours, radar sweep, impact ripples ───────

export const floorVert = /* glsl */ `
  varying vec2 vW;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const floorFrag = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uPower;
  uniform vec3 uLine;
  uniform vec3 uMajor;
  uniform vec3 uAccent;
  uniform vec4 uRipples[4];
  varying vec2 vW;
  ${noise}

  float contour(float v, float width){
    float fw = fwidth(v);
    return 1.0 - smoothstep(0.0, fw*width, abs(fract(v + 0.5) - 0.5));
  }

  void main(){
    vec2 p = vW;
    float d = length(p);

    // Ripples: each is (unused, unused, startTime, strength).
    float rip = 0.0;
    for(int i=0;i<4;i++){
      float age = uTime - uRipples[i].z;
      if(age > 0.0 && age < 3.2){
        float r = age * 8.5;
        float w = exp(-pow(d - r, 2.0) * 0.45);
        rip += w * (1.0 - age/3.2) * uRipples[i].w;
      }
    }

    // Terrain: slow-drifting fbm, a raised plateau under the unit.
    vec2 q = p*0.075 + vec2(uTime*0.0035, -uTime*0.0025);
    float h = fbm(q + fbm(q*1.7)*0.35);
    h += smoothstep(4.5, 0.0, d) * 0.22;
    h += rip * 0.05;

    float v = h * 16.0;
    float minor = contour(v, 1.2);
    float major = contour(v / 5.0, 1.6);

    // Survey crosses every 2 units.
    vec2 gp = abs(fract(p*0.5 + 0.5) - 0.5) * 2.0;
    float cross = max(step(gp.x, 0.018) * step(gp.y, 0.14), step(gp.y, 0.018) * step(gp.x, 0.14));

    // Radar sweep around the unit.
    float ang = atan(p.y, p.x);
    float sweep = fract(ang / 6.28318 + uTime * 0.06);
    float sweepGlow = pow(sweep, 10.0) * smoothstep(24.0, 3.0, d);

    float reveal = smoothstep(uReveal, uReveal - 4.0, d);
    float fade = smoothstep(30.0, 5.0, d);
    float shade = smoothstep(1.4, 3.6, d);

    vec3 col = uLine * minor * 0.5 + uMajor * major * 0.9;
    col *= 0.45 + sweepGlow * 2.2;
    col += uMajor * cross * 0.14;
    col += uAccent * rip * (minor * 2.5 + 0.35);
    col *= reveal * fade * shade * uPower;

    vec3 base = vec3(0.010, 0.012, 0.018) * (0.4 + 0.6 * shade);
    gl_FragColor = vec4(base + col, 1.0);
  }
`;

// ── additive holographic rings and the floor shockwave ─────────────────────

export const ringFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uDashes;
  uniform float uSpeed;
  varying vec2 vUv;
  void main(){
    // RingGeometry UVs are planar, so recover the angle and dash along it.
    float a = atan(vUv.y - 0.5, vUv.x - 0.5) / 6.28318 + 0.5;
    float dash = step(0.4, fract(a * uDashes - uTime * uSpeed));
    gl_FragColor = vec4(uColor * uOpacity * (0.15 + 0.85 * dash), 1.0);
  }
`;

export const uvVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

export const shockFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uLife;
  varying vec2 vUv;
  void main(){
    float r = length(vUv - 0.5) * 2.0;
    float front = smoothstep(0.78, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r));
    float inner = smoothstep(0.2, 0.97, r) * 0.25;
    float k = (1.0 - uLife);
    // Mask to the disc — the quad's corners sit past r = 1.
    gl_FragColor = vec4(uColor * (front * 3.0 + inner) * k * k * step(r, 1.0), 1.0);
  }
`;

// ── the final grade: aberration, glitch bands, scanlines, grain, flash ─────

export const finalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAberr: { value: 0 },
    uGlitch: { value: 0 },
    uFlash: { value: 0 },
    uFlashColor: { value: null },
    uRes: { value: null },
    uScan: { value: 0.18 },
    uGrain: { value: 0.05 },
  },
  vertexShader: uvVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAberr, uGlitch, uFlash, uScan, uGrain;
    uniform vec3 uFlashColor;
    uniform vec2 uRes;
    varying vec2 vUv;
    float h1(float n){ return fract(sin(n)*43758.5453); }
    float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv = vUv;
      if(uGlitch > 0.001){
        float band = floor(uv.y * 28.0) + floor(uTime * 24.0) * 7.0;
        if(h1(band) < uGlitch * 0.55) uv.x += (h1(band + 3.1) - 0.5) * 0.09 * uGlitch;
        if(h1(band + 9.7) < uGlitch * 0.2) uv.y += (h1(band) - 0.5) * 0.02;
      }
      vec2 c = uv - 0.5;
      float d2 = dot(c, c);
      vec2 off = c * (0.0008 + d2 * 0.006 + uAberr * 0.018);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + off).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - off).b;

      float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 1.5708);
      col *= 1.0 - uScan * 0.35 * scan;
      col += (h2(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * uGrain;
      float vig = smoothstep(1.05, 0.25, length(c * vec2(1.0, 1.15)) * 1.25);
      col *= mix(0.55, 1.0, vig);
      col = mix(col, uFlashColor, clamp(uFlash, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
