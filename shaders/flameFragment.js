export const flameFragmentShader = `
varying vec2 vUv;
varying float vNoise;

uniform float opacity;

void main() {
    // 1. Core Beam Logic (The hot center)
    float side = abs(vUv.x - 0.5) * 2.0;
    float core = 1.0 - side;
    core = pow(core, 4.0); // Thin sharp core

    // 2. Length Fade (Fade out at tip)
    float tipFade = 1.0 - vUv.y;
    tipFade = pow(tipFade, 1.5);

    // 3. FIRE COLOR PALETTE
    // Realistic Fire Gradient
    vec3 redOrange = vec3(1.0, 0.2, 0.0);   // Outer edges (Cooler)
    vec3 brightYellow = vec3(1.0, 0.9, 0.0); // Inner body (Hot)
    vec3 whiteHot = vec3(1.0, 1.0, 0.8);    // Center core (Hottest)

    // Mix based on noise and position
    // As noise increases, it flickers between Red/Orange and Yellow
    vec3 baseColor = mix(redOrange, brightYellow, vUv.y + vNoise * 0.5);
    
    // Mix the White Core into the center
    vec3 finalColor = mix(baseColor, whiteHot, core * 0.8);

    // 4. Alpha Calculation
    float alpha = tipFade * opacity;
    
    // Soft edges so it doesn't look like a solid tube
    alpha *= smoothstep(1.0, 0.2, side); 

    // Hard cut at nozzle (bottom)
    if(vUv.y < 0.02) alpha = 0.0;

    gl_FragColor = vec4(finalColor, alpha);
}
`;
