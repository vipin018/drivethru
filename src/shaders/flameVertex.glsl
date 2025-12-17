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

    // High-speed flow
    float flow = time * 28.0;

    // Multi-octave noise
    float n = fbm(vec2(uv.x * 10.0, uv.y * 5.0 - flow), 5);
    vNoise = n * 1.1; // Balanced noise for color flicker

    // Expansion towards tip
    float expansion = uv.y * (0.6 + n * 0.4);
    pos.x *= 1.0 + expansion;
    pos.z *= 1.0 + expansion;

    // Wobble and distortion
    float wobble = sin(uv.y * 15.0 - time * 40.0) * 0.18 * uv.y;
    pos.x += wobble + (n * 0.2 * uv.y);
    pos.z += wobble + (n * 0.2 * uv.y);

    // Pulsing elongation
    pos.y *= 1.0 + 0.25 * sin(time * 12.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}