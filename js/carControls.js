// Configuration for Physics
export const carConfig = {
    speed: 0, 
    maxSpeed: 0.80, 
    acceleration: 0.05, 
    friction: 0.99, 
    brake: 0.92,
    steeringAngle: 0, 
    maxSteer: 0.15, 
    turnSensitivity: 0.35, 
    x: 0, z: 0, rotation: 0
};

// Input State
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };

export function initInputs() {
    window.addEventListener('keydown', (e) => { 
        if(e.code === 'Space') keys.Space = true; 
        else if(keys.hasOwnProperty(e.code)) keys[e.code] = true; 
    });
    window.addEventListener('keyup', (e) => { 
        if(e.code === 'Space') keys.Space = false; 
        else if(keys.hasOwnProperty(e.code)) keys[e.code] = false; 
    });
}

// Main Physics Logic
export function updatePhysics() {
    if (keys.ArrowUp) carConfig.speed += carConfig.acceleration;
    else if (keys.ArrowDown) carConfig.speed -= carConfig.acceleration;
    
    if (keys.Space) carConfig.speed *= carConfig.brake;
    else carConfig.speed *= carConfig.friction;

    // Speed Limits
    if (carConfig.speed > carConfig.maxSpeed) carConfig.speed = carConfig.maxSpeed;
    if (carConfig.speed < -carConfig.maxSpeed/2) carConfig.speed = -carConfig.maxSpeed/2;
    
    // Steering
    if (keys.ArrowLeft) carConfig.steeringAngle -= 0.04; 
    else if (keys.ArrowRight) carConfig.steeringAngle += 0.04; 
    else carConfig.steeringAngle *= 0.85; 
    
    // Clamp Steering
    carConfig.steeringAngle = Math.max(-carConfig.maxSteer, Math.min(carConfig.maxSteer, carConfig.steeringAngle));

    // Calculate Position
    if (Math.abs(carConfig.speed) > 0.01) {
        carConfig.rotation -= carConfig.steeringAngle * carConfig.speed * carConfig.turnSensitivity;
    }
    
    carConfig.x += Math.sin(carConfig.rotation) * carConfig.speed;
    carConfig.z += Math.cos(carConfig.rotation) * carConfig.speed;

    return carConfig;
}