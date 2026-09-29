/*
 * GLSL for /play. Output values above 1.0 are deliberate: the composer runs
 * in half-float, bloom thresholds at ~0.9 linear, and OutputPass tone-maps
 * last — so only things written hot here ever bloom.
 */

/** Value noise + fbm. Shared with the home page's raw-WebGL topo field. */
export const noiseGLSL = /* glsl */ `
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

// ── the shockwave across the table ─────────────────────────────────────────

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
    float inner = smoothstep(0.55, 0.97, r) * 0.12;
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
