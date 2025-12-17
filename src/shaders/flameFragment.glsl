varying vec2 vUv;
varying float vNoise;
uniform float opacity;
uniform float time;

void main() {
    float side = abs(vUv.x - 0.5) * 2.0;
    float core = 1.0 - side;
    core = pow(core, 2.8); // Slightly sharper core for focused highlights

    float tipFade = 1.0 - pow(vUv.y, 1.4);

    // ULTRA-VIBRANT NEON PURPLE/MAGENTA PALETTE
    vec3 deepMagenta = vec3(1.0, 0.0, 1.0);     // Pure saturated magenta base
    vec3 neonPurple  = vec3(1.0, 0.0, 0.95);    // Intense neon purple body (slight blue shift for depth)
    vec3 hotPink     = vec3(1.0, 0.05, 0.85);   // Vivid hot pink accents
    vec3 vibrantWhite= vec3(1.0, 0.4, 1.0);     // Strongly magenta-tinted bright core

    vec3 baseColor = mix(deepMagenta, neonPurple, vUv.y * 0.75);
    baseColor = mix(baseColor, hotPink, vUv.y * 0.85 + vNoise * 1.2 + sin(time * 9.0) * 0.35); // Heightened dynamic variation

    vec3 finalColor = mix(baseColor, vibrantWhite, core * 0.45); // Reduced white influence for sustained saturation

    finalColor *= 2.8; // Optimized boost for maximum neon intensity

    float alpha = tipFade * opacity * (1.0 - vNoise * 0.25);
    alpha *= smoothstep(1.0, 0.1, side); // Enhanced soft glowing edges
    if (vUv.y < 0.03) alpha = 0.0;

    gl_FragColor = vec4(finalColor, alpha);
}