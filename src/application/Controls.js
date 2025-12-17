// src/application/Controls.js
import * as THREE from 'three';

const carState = {
  speed: 0,
  maxSpeed: 0.8,
  acceleration: 0.01,
  friction: 0.99,
  brake: 0.92,
  steeringAngle: 0,
  maxSteer: 0.15,
  turnSensitivity: 0.35,
  x: 0,
  z: 0,
  rotation: 0,
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  Shift: false,
};

export function initInputs() {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") keys.Space = true;
    else if (e.shiftKey) keys.Shift = true;
    else if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") keys.Space = false;
    else if (e.key === "Shift") keys.Shift = false;
    else if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
  });
}

export function updatePhysics(carModel, wheels, steeringWheelMesh, flame, grassMat, delta, camera) {
  if (!carModel) return;

  // --- NITRO LOGIC ---
  let currentMaxSpeed = 0.8;
  let currentAccel = 0.05;
  if (keys.Shift && keys.ArrowUp) {
    currentMaxSpeed = 2.5;
    currentAccel = 0.15;
    
    flame.innerMat.uniforms.opacity.value = THREE.MathUtils.lerp(
      flame.innerMat.uniforms.opacity.value,
      1.0,
      0.1
    );
    flame.outerMat.uniforms.opacity.value = THREE.MathUtils.lerp(
      flame.outerMat.uniforms.opacity.value,
      0.6,
      0.1
    );

    const scaleFactor = 1.0 + (carState.speed / currentMaxSpeed) * 0.3;
    flame.group.scale.set(1, scaleFactor, 1);

    for (let i = 0; i < flame.particleCount; i++) {
      if (flame.particleLifetimes[i] <= 0) {
        flame.particlePositions[i * 3] = (Math.random() - 0.5) * 0.1;
        flame.particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        flame.particlePositions[i * 3 + 2] = 0;
        flame.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
        flame.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
        flame.particleVelocities[i * 3 + 2] = -(0.5 + Math.random() * 1.0);
        flame.particleLifetimes[i] = 0.5 + Math.random() * 1.0;
      } else {
        flame.particlePositions[i * 3] += flame.particleVelocities[i * 3] * delta;
        flame.particlePositions[i * 3 + 1] += flame.particleVelocities[i * 3 + 1] * delta;
        flame.particlePositions[i * 3 + 2] += flame.particleVelocities[i * 3 + 2] * delta;
        flame.particleLifetimes[i] -= delta;
      }
    }
    flame.particleGeo.attributes.position.needsUpdate = true;
  } else {
    flame.innerMat.uniforms.opacity.value = THREE.MathUtils.lerp(
      flame.innerMat.uniforms.opacity.value,
      0.0,
      0.1
    );
    flame.outerMat.uniforms.opacity.value = THREE.MathUtils.lerp(
      flame.outerMat.uniforms.opacity.value,
      0.0,
      0.1
    );
    flame.group.scale.set(1, 1, 1);
    for (let i = 0; i < flame.particleCount; i++) {
        if (flame.particleLifetimes[i] > 0) {
            flame.particlePositions[i * 3] += flame.particleVelocities[i * 3] * delta;
            flame.particlePositions[i * 3 + 1] += flame.particleVelocities[i * 3 + 1] * delta;
            flame.particlePositions[i * 3 + 2] += flame.particleVelocities[i * 3 + 2] * delta;
            flame.particleLifetimes[i] -= delta;
        }
    }
    flame.particleGeo.attributes.position.needsUpdate = true;
  }

  // --- PHYSICS UPDATE ---
  if (keys.ArrowUp) carState.speed += currentAccel;
  else if (keys.ArrowDown) carState.speed -= currentAccel;

  if (keys.Space) carState.speed *= carState.brake;
  else carState.speed *= carState.friction;

  if (carState.speed > currentMaxSpeed) carState.speed = currentMaxSpeed;
  if (carState.speed < -currentMaxSpeed / 2)
    carState.speed = -currentMaxSpeed / 2;

  if (keys.ArrowLeft) carState.steeringAngle -= 0.04;
  else if (keys.ArrowRight) carState.steeringAngle += 0.04;
  else carState.steeringAngle *= 0.85;
  carState.steeringAngle = Math.max(
    -carState.maxSteer,
    Math.min(carState.maxSteer, carState.steeringAngle)
  );

  if (Math.abs(carState.speed) > 0.01) {
    carState.rotation -=
      carState.steeringAngle * carState.speed * carState.turnSensitivity;
  }
  carState.x += Math.sin(carState.rotation) * carState.speed;
  carState.z += Math.cos(carState.rotation) * carState.speed;

  grassMat.uniforms.playerPos.value.copy(carModel.position);
  carModel.position.set(carState.x, 0, carState.z);
  carModel.rotation.y = carState.rotation;

  const spin = carState.speed * 1.5;
  if (wheels.LF) {
    wheels.LF.hub.rotation.y = carState.steeringAngle;
    wheels.LF.mesh.rotation.x -= spin;
  }
  if (wheels.RF) {
    wheels.RF.hub.rotation.y = carState.steeringAngle;
    wheels.RF.mesh.rotation.x -= spin;
  }
  if (wheels.LR) wheels.LR.mesh.rotation.x -= spin;
  if (wheels.RR) wheels.RR.mesh.rotation.x -= spin;
  if (steeringWheelMesh)
    steeringWheelMesh.rotation.z = -carState.steeringAngle * 4;

  const offset = new THREE.Vector3(0, 2.5, -6).applyMatrix4(
    carModel.matrixWorld
  );
  camera.position.lerp(offset, 0.1);
  camera.lookAt(carModel.position);
}
