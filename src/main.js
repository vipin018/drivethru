// src/main.js
import * as THREE from "three";
import { setupScene, setupCamera, setupRenderer, setupLighting } from "./application/Scene.js";
import { setupWorld } from "./application/World.js";
import { loadCar } from "./application/Car.js";
import { initInputs, updatePhysics } from "./application/Controls.js";

const scene = new THREE.Scene();
const camera = setupCamera();
const renderer = setupRenderer();

setupScene(scene);
setupLighting(scene);

const { grassMat } = setupWorld(scene);

let car, wheels, steeringWheelMesh, flame;

loadCar(scene).then((result) => {
  car = result.carModel;
  wheels = result.wheels;
  steeringWheelMesh = result.steeringWheelMesh;
  flame = result.flame;
});

initInputs();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  grassMat.uniforms.time.value = time;
  if(flame) {
    flame.innerMat.uniforms.time.value = time;
    flame.outerMat.uniforms.time.value = time;
  }
  
  updatePhysics(car, wheels, steeringWheelMesh, flame, grassMat, delta, camera);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});