export const flameVertexShader = `
varying vec2 vUv;
varying float vNoise;

uniform float time;

// Fast pseudo-random noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Simple 2D Noise
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

void main() {
    vUv = uv;

    vec3 pos = position;

    // HIGH SPEED FLOW
    // We scroll noise along the Y axis (length of cylinder) very fast
    float flow = time * 20.0; 
    
    // Calculate noise value
    float n = noise(vec2(uv.x * 10.0, uv.y * 5.0 - flow));
    vNoise = n; // Pass to fragment for color variation

    // EXPANSION & WOBBLE
    // The trail gets wider and wobblier towards the end (uv.y 0.0 is base, 1.0 is tip)
    // Note: Cylinder geometry mapping might be inverted, usually 0 is bottom.
    
    // Squeeze the base (nozzle)
    float shape = smoothstep(0.0, 1.2, uv.y); 
    
    // Wobble effect increases with distance
    float wobble = sin(uv.y * 10.0 - time * 30.0) * 0.1 * uv.y;
    
    pos.x += wobble + (n * 0.1 * uv.y);
    pos.z += wobble + (n * 0.1 * uv.y);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
