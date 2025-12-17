export const vertexShader = `
varying vec2 vUv;
varying vec3 vColor;
varying float vLight; // Send lighting data to fragment

uniform float time;
uniform vec3 playerPos;

void main() {
    vUv = uv;
    
    // 1. EXTRACT INSTANCE
    vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

    // 2. LOD SCALE
    float distToPlayer = distance(instancePos.xz, playerPos.xz);
    float lodScale = 1.0 - smoothstep(40.0, 100.0, distToPlayer);

    // 3. BASE POSITION
    vec3 scaledPos = position * lodScale;
    vec4 mPosition = instanceMatrix * vec4(scaledPos, 1.0);
    vec3 worldPosition = mPosition.xyz;

    // 4. WIND & INTERACTION
    if (lodScale > 0.01) {
        // Wind
        float windStrength = 0.3;
        float windWave = sin(time * 2.0 + worldPosition.x * 0.5 + worldPosition.z * 0.3);
        // Add complexity to wind
        windWave += sin(time * 5.0 + worldPosition.x * 2.0) * 0.1; 
        
        mPosition.x += windWave * windStrength * uv.y * lodScale; 

        // Car Push
        float dist = distance(worldPosition.xz, playerPos.xz);
        float radius = 2.5;
        if(dist < radius) {
            vec2 dir = normalize(worldPosition.xz - playerPos.xz);
            float strength = (1.0 - dist / radius);
            strength = pow(strength, 2.0);
            mPosition.x += dir.x * strength * 2.0 * uv.y;
            mPosition.z += dir.y * strength * 2.0 * uv.y;
            mPosition.y -= strength * 0.5 * uv.y;
        }
    }

    gl_Position = projectionMatrix * viewMatrix * mPosition;
    
    // --- 5. REALISTIC COLOR & LIGHTING ---
    
    // Fake Normal vector for the grass blade (Pointing up and slightly forward)
    vec3 normal = normalize(vec3(0.0, 1.0, 0.2));
    
    // Sun Direction (Match your DirectionalLight position)
    vec3 sunDir = normalize(vec3(50.0, 100.0, 50.0));
    
    // Simple Diffuse Lighting (Dot Product)
    float diffuse = max(dot(normal, sunDir), 0.0);
    
    // Add Ambient Light (So shadows aren't pitch black)
    float ambient = 0.4;
    
    // Calculate final Light intensity
    // Top of grass gets full sun, bottom gets ambient occlusion (darker)
    vLight = (diffuse + ambient) * (0.5 + 0.5 * uv.y);

    // Color Variation (Perlin-ish noise)
    float noise = sin(instancePos.x * 0.1) * cos(instancePos.z * 0.1);
    
    // Color Palette: Dried yellow-green to Lush Green
    vec3 dryColor = vec3(0.2, 0.25, 0.1);
    vec3 lushColor = vec3(0.1, 0.5, 0.1);
    
    // Mix based on noise
    vec3 baseColor = mix(dryColor, lushColor, noise * 0.5 + 0.5);
    
    vColor = baseColor;
}
`;
