
varying vec2 vUv;
varying vec3 vColor;
varying float vLight;

void main() {
    // 1. Blade Shape (Tapered)
    float width = (1.0 - vUv.y) * 0.5; 
    width = pow(width, 0.7) * 0.8; 
    if (abs(vUv.x - 0.5) > width) discard;

    // 2. Apply Lighting
    // Multiply color by the light value calculated in vertex
    vec3 finalColor = vColor * vLight;

    // 3. Specular Highlight (Shiny tips)
    // If it's the tip of the grass, make it brighter (like sun reflecting)
    float shine = smoothstep(0.8, 1.0, vUv.y) * 0.2;
    finalColor += vec3(shine);

    gl_FragColor = vec4(finalColor, 1.0);
}
