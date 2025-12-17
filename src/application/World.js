// src/application/World.js
import * as THREE from "three";
import vertexShader from "../shaders/vertex.glsl?raw";
import fragmentShader from "../shaders/fragment.glsl?raw";

export function setupWorld(scene) {
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

  return { grassMat };
}
