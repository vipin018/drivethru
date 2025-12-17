// flameVertexShader.js
export const flameVertexShader = `
varying vec2 vUv;
varying float vNoise;
uniform float time;

// Improved noise with fBM for turbulence
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vUv = uv;
    vec3 pos = position;

    // High-speed flow with faster scrolling
    float flow = time * 25.0;

    // Multi-octave noise for turbulent shape
    float n = fbm(vec2(uv.x * 8.0, uv.y * 4.0 - flow), 4); // 4 octaves
    vNoise = n;

    // Expansion: Wider towards tip
    float expansion = uv.y * (0.5 + n * 0.3);
    pos.x *= 1.0 + expansion;
    pos.z *= 1.0 + expansion;

    // Wobble and distortion: Stronger at tip
    float wobble = sin(uv.y * 12.0 - time * 35.0) * 0.15 * uv.y;
    pos.x += wobble + (n * 0.15 * uv.y);
    pos.z += wobble + (n * 0.15 * uv.y);

    // Slight pulsing elongation
    pos.y *= 1.0 + 0.2 * sin(time * 10.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
