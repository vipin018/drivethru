export const vertexShader = `
varying vec2 vUv;
varying vec3 vColor;

uniform float time;
uniform vec3 playerPos;

void main() {
    vUv = uv;
    
    // 1. EXTRACT INSTANCE POSITION
    vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

    // 2. LOD CALCULATION (Distance scaling)
    float distToPlayer = distance(instancePos.xz, playerPos.xz);
    
    // Start fading out at 70m, gone at 200m
    float lodScale = 1.0 - smoothstep(70.0, 200.0, distToPlayer);

    // 3. APPLY SCALE
    vec3 scaledPos = position * lodScale;
    vec4 mPosition = instanceMatrix * vec4(scaledPos, 1.0);
    vec3 worldPosition = mPosition.xyz;

    // 4. WIND & INTERACTION (Only if visible)
    if (lodScale > 0.01) {
        float windStrength = 0.3;
        float windWave = sin(time * 3.0 + worldPosition.x * 0.8 + worldPosition.z * 0.5);
        mPosition.x += windWave * windStrength * uv.y * lodScale; 

        // Interactive Bending
        float dist = distance(worldPosition.xz, playerPos.xz);
        float radius = 3.0;
        float bendForce = 2.0;

        if(dist < radius) {
            vec2 dir = normalize(worldPosition.xz - playerPos.xz);
            float strength = (1.0 - dist / radius);
            strength = pow(strength, 2.0);
            
            mPosition.x += dir.x * strength * bendForce * uv.y;
            mPosition.z += dir.y * strength * bendForce * uv.y;
            mPosition.y -= strength * 0.5 * uv.y;
        }
    }

    gl_Position = projectionMatrix * viewMatrix * mPosition;
    
    // Color Logic
    vec3 bottomColor = vec3(0.02, 0.15, 0.01);
    vec3 topColor = vec3(0.15, 0.5, 0.05);
    float noise = sin(instancePos.x * 1.0) * cos(instancePos.z * 1.0);
    vColor = mix(bottomColor, topColor, vUv.y + noise * 0.1);
}
`;