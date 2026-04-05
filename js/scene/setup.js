/**
 * Inicializa Three.js: escena, cámara perspectiva, renderer WebGL y niebla.
 * Exporta referencias vivas (`scene`, `camera`, `renderer`) que el resto de módulos
 * importan después de llamar a `initScene(appContainerEl)`.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

/** @type {THREE.Scene} */
export let scene;
/** @type {THREE.PerspectiveCamera} */
export let camera;
/** @type {THREE.WebGLRenderer} */
export let renderer;

/**
 * Crea la escena principal y monta el canvas en `#app` (o el elemento indicado).
 * @param {HTMLElement} appEl
 */
export function initScene(appEl) {
  const W = window.innerWidth;
  const H = window.innerHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(52, W / H, 1, 6000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x5ecfff);
  appEl.appendChild(renderer.domElement);

  scene.fog = new THREE.FogExp2(0x8ad8ff, 0.0007);

  const sun = new THREE.DirectionalLight(0xffeecc, 1.5);
  sun.position.set(350, 500, 250);
  sun.castShadow = true;
  Object.assign(sun.shadow, { mapSize: new THREE.Vector2(2048, 2048) });
  sun.shadow.camera.left = -600;
  sun.shadow.camera.right = 600;
  sun.shadow.camera.top = 600;
  sun.shadow.camera.bottom = -600;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 2000;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xaaddff, 0.55));
  scene.add(new THREE.HemisphereLight(0x88ccff, 0x44aa33, 0.45));
}

/**
 * Ajusta cámara y renderer al redimensionar la ventana.
 */
export function bindResize() {
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
