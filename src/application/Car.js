// src/application/Car.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import flameVertexShader from "../shaders/flameVertex.glsl?raw";
import flameFragmentShader from "../shaders/flameFragment.glsl?raw";

export function loadCar(scene) {
  return new Promise((resolve) => {
    let carModel, steeringWheelMesh, nitroMesh;
    const wheels = { LF: null, RF: null, LR: null, RR: null };

    // --- FLAME SHADER & MESH ---
    const flameGeo = new THREE.CylinderGeometry(0.05, 0.15, 5.5, 32, 32, true);
    flameGeo.translate(0, 2.25, 0);
    flameGeo.rotateX(Math.PI);
    const flameUniforms = { time: { value: 0 }, opacity: { value: 0.0 } };
    const flameMat = new THREE.ShaderMaterial({
      vertexShader: flameVertexShader,
      fragmentShader: flameFragmentShader,
      uniforms: flameUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const innerFlameGeo = flameGeo.clone();
    innerFlameGeo.scale(0.8, 0.8, 0.8);
    const innerFlameMat = flameMat.clone();
    const innerFlameMesh = new THREE.Mesh(innerFlameGeo, innerFlameMat);

    const outerFlameGeo = flameGeo.clone();
    outerFlameGeo.scale(1.2, 1.2, 1.2);
    const outerFlameMat = flameMat.clone();
    outerFlameMat.uniforms.opacity.value = 0.6;
    const outerFlameMesh = new THREE.Mesh(outerFlameGeo, outerFlameMat);

    const flameGroup = new THREE.Group();
    flameGroup.add(innerFlameMesh);
    flameGroup.add(outerFlameMesh);

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

      nitroMesh = carModel.getObjectByName("rearwing_top006_SUB4_153_263");
      if (nitroMesh) {
        nitroMesh.add(flameGroup);
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

      resolve({
        carModel,
        wheels,
        steeringWheelMesh,
        flame: {
          group: flameGroup,
          innerMat: innerFlameMat,
          outerMat: outerFlameMat,
          particleGeo,
          particlePositions,
          particleVelocities,
          particleLifetimes,
          particleCount,
        },
      });
    });
  });
}
