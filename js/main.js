import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { vertexShader } from "../shaders/vertex.js";
import { fragmentShader } from "../shaders/fragment.js";
import { initInputs, updatePhysics } from "./carControls.js";

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0xaaccff, 0.005);

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

// --- LIGHTS & ENV ---
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr",
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
    document.getElementById("loading").style.display = "none";
  }
);

const dirLight = new THREE.DirectionalLight(0xfffaed, 3);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);

// --- ROAD & FLOOR ---
const texLoader = new THREE.TextureLoader();
const roadDiff = texLoader.load("/texture/diffuse.jpg");
const roadNor = texLoader.load("/texture/normal.jpg");
const roadRough = texLoader.load("/texture/roughness.jpg");

[roadDiff, roadNor, roadRough].forEach((t) => {
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 100);
});

const roadMat = new THREE.MeshStandardMaterial({
  map: roadDiff,
  normalMap: roadNor,
  roughnessMap: roadRough,
  roughness: 0.9,
  side: THREE.DoubleSide,
});
const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 2500), roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

// Dark Green Base Floor
const baseFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x052603, roughness: 1.0 })
);
baseFloor.rotation.x = -Math.PI / 2;
baseFloor.position.y = -0.05;
baseFloor.receiveShadow = true;
scene.add(baseFloor);

// Curbs
function getCurbTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ff0000";
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

// --- GRASS ---
const instanceCount = 2500000;
const grassGeo = new THREE.PlaneGeometry(0.15, 0.8, 1, 3);
grassGeo.translate(0, 0.4, 0);

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
  } // Avoid Road

  dummy.position.set(x, 0, z);
  dummy.rotation.y = Math.random() * Math.PI;
  dummy.scale.setScalar(0.7 + Math.random() * 0.6);
  dummy.updateMatrix();
  grassMesh.setMatrixAt(i, dummy.matrix);
}
grassMesh.receiveShadow = true;
scene.add(grassMesh);

// --- CAR LOADING ---
let carModel, steeringWheelMesh;
const wheels = { LF: null, RF: null, LR: null, RR: null };

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

// ... existing imports

// ... existing setup code ...

const loader = new GLTFLoader();
loader.load(
  "model.glb",
  (gltf) => {
    carModel = gltf.scene;
    carModel.scale.set(2.5, 2.5, 2.5);

    carModel.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.envMapIntensity = 1;
      }
    });

    // Setup Wheels
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

    scene.add(carModel);
    initInputs();

    // --- REMOVE F1 LOADER ---
    const loaderEl = document.getElementById("f1-loader");
    if (loaderEl) {
      // Fade out effect
      loaderEl.style.opacity = "0";
      setTimeout(() => {
        loaderEl.style.display = "none";
      }, 500); // Wait for fade out transition
    }
  },
  // Optional: Progress updates (if you want to log it)
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // Optional: Error handling
  (error) => {
    console.error("An error happened", error);
  }
);

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  grassMat.uniforms.time.value = time;

  if (carModel) {
    // Update Physics
    const state = updatePhysics();

    // Update Grass LOD Position
    grassMat.uniforms.playerPos.value.copy(carModel.position);

    // Apply Car Transform
    carModel.position.set(state.x, 0, state.z);
    carModel.rotation.y = state.rotation;

    // Visuals (Wheels)
    const spin = state.speed * 1.5;
    if (wheels.LF) {
      wheels.LF.hub.rotation.y = state.steeringAngle;
      wheels.LF.mesh.rotation.x -= spin;
    }
    if (wheels.RF) {
      wheels.RF.hub.rotation.y = state.steeringAngle;
      wheels.RF.mesh.rotation.x -= spin;
    }
    if (wheels.LR) wheels.LR.mesh.rotation.x -= spin;
    if (wheels.RR) wheels.RR.mesh.rotation.x -= spin;
    if (steeringWheelMesh)
      steeringWheelMesh.rotation.z = -state.steeringAngle * 4;

    // Camera Follow
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
