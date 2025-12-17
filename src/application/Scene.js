// src/application/Scene.js
import * as THREE from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { HDRLoader } from "three/examples/jsm/Addons.js";

export function setupScene(scene) {
  scene.background = new THREE.Color(0x331100);
  scene.fog = new THREE.FogExp2(0x331100, 0.005);
}

export function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  return camera;
}

export function setupRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function setupLighting(scene) {
  const exrLoader = new EXRLoader();
  const hdrLoader = new HDRLoader();
  hdrLoader.load("/assets/hdri/env3.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
  });

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
}
