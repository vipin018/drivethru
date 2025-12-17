export const fragmentShader = `
varying vec2 vUv;
varying vec3 vColor;

void main() {
    // Pointy Tip Logic
    float width = (1.0 - vUv.y) * 0.5; 
    width = pow(width, 0.7) * 0.8; 
    
    // Discard pixels outside the blade shape
    if (abs(vUv.x - 0.5) > width) discard;

    gl_FragColor = vec4(vColor, 1.0);
}
`;