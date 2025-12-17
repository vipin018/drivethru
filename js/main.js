// main.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js"; // IMPORT EXR LOADER
import { vertexShader } from "../shaders/vertex.js";
import { fragmentShader } from "../shaders/fragment.js";
import { flameVertexShader } from "../shaders/flameVertex.js";
import { flameFragmentShader } from "../shaders/flameFragment.js";
import { initInputs, updatePhysics } from "./carControls.js";
// --- 1. SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x331100);
scene.fog = new THREE.FogExp2(0x331100, 0.005);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
// --- 2. LIGHTS & ENV ---
// *** FIX: Use EXRLoader for .exr files, NOT RGBELoader ***
const exrLoader = new EXRLoader();
exrLoader.load("/assets/hdri/environment.exr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture; // This fixes the dark car issue!
});
// Warm Sunlight
const dirLight = new THREE.DirectionalLight(0xffaa33, 3);
dirLight.position.set(50, 30, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);
const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
scene.add(ambientLight);
// --- 3. ROAD & FLOOR ---
const texLoader = new THREE.TextureLoader();
const roadDiff = texLoader.load("/assets/textures/diffuse.jpg");
const roadNor = texLoader.load("/assets/textures/normal.jpg");
const roadRough = texLoader.load("/assets/textures/roughness.jpg");
[roadDiff, roadNor, roadRough].forEach((t) => {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 80);
});
const roadMat = new THREE.MeshStandardMaterial({
  map: roadDiff,
  normalMap: roadNor,
  roughnessMap: roadRough,
  roughness: 0.9,
  color: 0x888888,
});
const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 2500), roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);
const baseFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x052603, roughness: 1.0 })
);
baseFloor.rotation.x = -Math.PI / 2;
baseFloor.position.y = -0.5;
baseFloor.receiveShadow = true;
scene.add(baseFloor);
function getCurbTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#b30000";
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(0, 256, 64, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 40);
  return t;
}
const curbMat = new THREE.MeshStandardMaterial({
  map: getCurbTexture(),
  roughness: 0.8,
});
const lCurb = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2500), curbMat);
lCurb.rotation.x = -Math.PI / 2;
lCurb.position.set(-7.4, 0.01, 0);
scene.add(lCurb);
const rCurb = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2500), curbMat);
rCurb.rotation.x = -Math.PI / 2;
rCurb.position.set(7.4, 0.01, 0);
scene.add(rCurb);
// --- 4. GRASS ---
const instanceCount = 2800000;
const grassGeo = new THREE.PlaneGeometry(0.15, 0.8, 1, 3);
grassGeo.translate(0, 0.3, 0);
const grassUniforms = {
  time: { value: 0 },
  playerPos: { value: new THREE.Vector3(0, 0, 0) },
};
const grassMat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: grassUniforms,
  side: THREE.DoubleSide,
});
const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, instanceCount);
grassMesh.frustumCulled = false;
const dummy = new THREE.Object3D();
for (let i = 0; i < instanceCount; i++) {
  const x = (Math.random() - 0.5) * 200;
  const z = (Math.random() - 0.5) * 2500;
  if (x > -8.5 && x < 8.5) {
    i--;
    continue;
  }
  dummy.position.set(x, 0, z);
  dummy.rotation.y = Math.random() * Math.PI;
  dummy.scale.setScalar(0.7 + Math.random() * 0.6);
  dummy.updateMatrix();
  grassMesh.setMatrixAt(i, dummy.matrix);
}
grassMesh.receiveShadow = true;
scene.add(grassMesh);
// --- 5. FLAME SHADER & MESH ---
// Using Cylinder for a long trail.
// RadiusTop: 0.05 (Slight point), RadiusBottom: 0.15 (Nozzle), Height: 7.5 (Long trail)
const flameGeo = new THREE.CylinderGeometry(0.05, 0.15, 5.5, 32, 32, true);
// Shift the geometry so the wider base (nozzle) is at the origin (0,0,0)
flameGeo.translate(0, 2.25, 0); // Negative half-height to pivot at base
// Rotate to horizontal: align length along positive Z, then flip to negative Z
flameGeo.rotateX(Math.PI);
// flameGeo.rotateX(Math.PI);
const flameUniforms = { time: { value: 0 }, opacity: { value: 0.0 } };
const flameMat = new THREE.ShaderMaterial({
  vertexShader: flameVertexShader,
  fragmentShader: flameFragmentShader,
  uniforms: flameUniforms,
  transparent: true,
  depthWrite: false, // Important for glow overlap
  blending: THREE.AdditiveBlending, // Key for "Bright" look
  side: THREE.DoubleSide,
});
// Create layered flames for depth (inner hot core, outer soft glow)
const innerFlameGeo = flameGeo.clone();
innerFlameGeo.scale(0.8, 0.8, 0.8); // Smaller inner
const innerFlameMat = flameMat.clone();
const innerFlameMesh = new THREE.Mesh(innerFlameGeo, innerFlameMat);
const outerFlameGeo = flameGeo.clone();
outerFlameGeo.scale(1.2, 1.2, 1.2); // Larger outer
const outerFlameMat = flameMat.clone();
outerFlameMat.uniforms.opacity.value = 0.6; // Softer outer
const outerFlameMesh = new THREE.Mesh(outerFlameGeo, outerFlameMat);
const flameGroup = new THREE.Group();
flameGroup.add(innerFlameMesh);
flameGroup.add(outerFlameMesh);
// Particle system for sparks/embers
const particleCount = 3000;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = new Float32Array(particleCount * 3);
const particleLifetimes = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = 0;
  particlePositions[i * 3 + 1] = 0;
  particlePositions[i * 3 + 2] = 0;
  particleLifetimes[i] = 0;
}
particleGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(particlePositions, 3)
);
const particleMat = new THREE.PointsMaterial({
  color: 0xff8800,
  size: 0.05,
  transparent: true,
  blending: THREE.AdditiveBlending,
});
const particles = new THREE.Points(particleGeo, particleMat);
flameGroup.add(particles);
// We don't add to scene yet, we add to car later
// --- 6. CAR LOADING ---
let carModel, steeringWheelMesh, nitroMesh;
const wheels = { LF: null, RF: null, LR: null, RR: null };
// Physics State
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
// Input Handling
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  Shift: false,
};
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
function setupWheel(model, name, extras = []) {
  const mesh = model.getObjectByName(name);
  if (!mesh) return null;
  if (mesh.geometry) {
    mesh.geometry.computeBoundingBox();
    const c = mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    mesh.geometry.translate(-c.x, -c.y, -c.z);
    mesh.position.add(c);
  }
  const hub = new THREE.Group();
  hub.position.copy(mesh.position);
  hub.rotation.copy(mesh.rotation);
  hub.scale.copy(mesh.scale);
  mesh.parent.add(hub);
  hub.add(mesh);
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  extras.forEach((n) => {
    const p = model.getObjectByName(n);
    if (p) hub.attach(p);
  });
  return { hub, mesh };
}
new GLTFLoader().load("/assets/model.glb", (gltf) => {
  carModel = gltf.scene;
  carModel.scale.set(2.5, 2.5, 2.5);
  carModel.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material) o.material.envMapIntensity = 1;
    }
  });
  wheels.LF = setupWheel(carModel, "WHEEL_LF_38_69", [
    "SUSP_LF_47_80",
    "SUS_ROD_FL_172_292",
  ]);
  wheels.RF = setupWheel(carModel, "WHEEL_RF_62_102", [
    "SUSP_RF_56_91",
    "SUS_ROD_FR_175_297",
  ]);
  wheels.LR = setupWheel(carModel, "WHEEL_LR_82_134");
  wheels.RR = setupWheel(carModel, "WHEEL_RR_68_113");
  steeringWheelMesh = carModel.getObjectByName("STEER_HR_148_167");
  // ATTACH FLAME TO REAR WING
  nitroMesh = carModel.getObjectByName("rearwing_top006_SUB4_153_263");
  if (nitroMesh) {
    nitroMesh.add(flameGroup);
    // Adjust flame position relative to the wing if needed
    flameGroup.position.set(0, 0, 0.5);
  }
  scene.add(carModel);
  const loaderEl = document.getElementById("f1-loader");
  if (loaderEl) {
    loaderEl.style.opacity = "0";
    setTimeout(() => {
      loaderEl.style.display = "none";
    }, 500);
  }
});
// --- 7. ANIMATION LOOP ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  const delta = clock.getDelta();
  grassMat.uniforms.time.value = time;
  // Update flame animation for layers
  innerFlameMat.uniforms.time.value = time;
  outerFlameMat.uniforms.time.value = time;
  if (carModel) {
    // --- NITRO LOGIC ---
    let currentMaxSpeed = 0.8;
    let currentAccel = 0.05;
    // Toggle Flame Opacity
    if (keys.Shift && keys.ArrowUp) {
      currentMaxSpeed = 2.5;
      currentAccel = 0.15;
      // Smoothly turn on flame
      innerFlameMat.uniforms.opacity.value = THREE.MathUtils.lerp(
        innerFlameMat.uniforms.opacity.value,
        1.0,
        0.1
      );
      outerFlameMat.uniforms.opacity.value = THREE.MathUtils.lerp(
        outerFlameMat.uniforms.opacity.value,
        0.6,
        0.1
      );
      // Elongate flame based on speed
      const scaleFactor = 1.0 + (carState.speed / currentMaxSpeed) * 0.3;
      flameGroup.scale.set(1, scaleFactor, 1);
      // Emit particles
      for (let i = 0; i < particleCount; i++) {
        if (particleLifetimes[i] <= 0) {
          // Reset particle at nozzle
          particlePositions[i * 3] = (Math.random() - 0.5) * 0.1;
          particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
          particlePositions[i * 3 + 2] = 0;
          // Random velocity backwards
          particleVelocities[i * 3] = (Math.random() - 0.5) * 0.2;
          particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
          particleVelocities[i * 3 + 2] = -(0.5 + Math.random() * 1.0);
          particleLifetimes[i] = 0.5 + Math.random() * 1.0; // Lifetime in seconds
        } else {
          // Update position
          particlePositions[i * 3] += particleVelocities[i * 3] * delta;
          particlePositions[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta;
          particlePositions[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta;
          particleLifetimes[i] -= delta;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
    } else {
      // Smoothly turn off flame
      innerFlameMat.uniforms.opacity.value = THREE.MathUtils.lerp(
        innerFlameMat.uniforms.opacity.value,
        0.0,
        0.1
      );
      outerFlameMat.uniforms.opacity.value = THREE.MathUtils.lerp(
        outerFlameMat.uniforms.opacity.value,
        0.0,
        0.1
      );
      flameGroup.scale.set(1, 1, 1);
      // Fade particles
      for (let i = 0; i < particleCount; i++) {
        if (particleLifetimes[i] > 0) {
          particlePositions[i * 3] += particleVelocities[i * 3] * delta;
          particlePositions[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta;
          particlePositions[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta;
          particleLifetimes[i] -= delta;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
    }
    // --- PHYSICS UPDATE ---
    if (keys.ArrowUp) carState.speed += currentAccel;
    else if (keys.ArrowDown) carState.speed -= currentAccel;
    if (keys.Space) carState.speed *= carState.brake;
    else carState.speed *= carState.friction;
    // Cap Speed
    if (carState.speed > currentMaxSpeed) carState.speed = currentMaxSpeed;
    if (carState.speed < -currentMaxSpeed / 2)
      carState.speed = -currentMaxSpeed / 2;
    // Steering
    if (keys.ArrowLeft) carState.steeringAngle -= 0.04;
    else if (keys.ArrowRight) carState.steeringAngle += 0.04;
    else carState.steeringAngle *= 0.85;
    carState.steeringAngle = Math.max(
      -carState.maxSteer,
      Math.min(carState.maxSteer, carState.steeringAngle)
    );
    // Movement
    if (Math.abs(carState.speed) > 0.01) {
      carState.rotation -=
        carState.steeringAngle * carState.speed * carState.turnSensitivity;
    }
    carState.x += Math.sin(carState.rotation) * carState.speed;
    carState.z += Math.cos(carState.rotation) * carState.speed;
    // Apply to Model
    grassMat.uniforms.playerPos.value.copy(carModel.position);
    carModel.position.set(carState.x, 0, carState.z);
    carModel.rotation.y = carState.rotation;
    // Wheel Visuals
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
    // Camera
    const offset = new THREE.Vector3(0, 2.5, -6).applyMatrix4(
      carModel.matrixWorld
    );
    camera.position.lerp(offset, 0.1);
    camera.lookAt(carModel.position);
  }
  renderer.render(scene, camera);
}
animate();
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
