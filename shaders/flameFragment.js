export const flameFragmentShader = `
varying vec2 vUv;
varying float vNoise;
uniform float opacity;
uniform float time; // For flickering

void main() {
    // 1. Core Beam Logic (The hot center)
    float side = abs(vUv.x - 0.5) * 2.0;
    float core = 1.0 - side;
    core = pow(core, 3.0); // Slightly sharper core for brighter highlight

    // 2. Length Fade (Fade out at tip)
    float tipFade = 1.0 - pow(vUv.y, 1.2);

    // 3. SATURATED & BRIGHT FIRE COLOR PALETTE
    vec3 vividBlue   = vec3(0.0, 0.5, 1.0);   // Intense nitro blue at base
    vec3 brightOrange = vec3(1.0, 0.4, 0.0);  // Saturated outer edges
    vec3 intenseYellow = vec3(1.0, 0.9, 0.2); // Vivid hot body
    vec3 pureWhite   = vec3(1.0, 1.0, 1.0);   // Bright core

    // Gradient: Strong blue at nozzle, transitioning to orange/yellow
    vec3 baseColor = mix(vividBlue, brightOrange, vUv.y * 0.6);
    baseColor = mix(baseColor, intenseYellow, vUv.y * 0.8 + vNoise * 0.7 + sin(time * 6.0) * 0.15);

    // Strong white-hot core
    vec3 finalColor = mix(baseColor, pureWhite, core * 0.95);

    // Boost overall brightness and saturation
    finalColor *= 2.08; // Increase for glowing effect (adjust 1.5–2.5 as needed)

    // 4. Alpha Calculation
    float alpha = tipFade * opacity * (1.0 - vNoise * 0.15);
    alpha *= smoothstep(1.0, 0.25, side); // Softer but brighter edges
    if (vUv.y < 0.03) alpha = 0.0; // Clean nozzle cut

    gl_FragColor = vec4(finalColor, alpha);
}
`;
