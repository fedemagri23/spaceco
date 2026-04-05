/**
 * Renderer Three.js secundario para pintar miniaturas 3D dentro de canvas 2D del DOM
 * (lista de cohetes, tarjetas de piezas, preview de ensamblaje).
 *
 * Cada frame, `renderUICanvases()` recorre `activeUICanvases`, centra el grupo,
 * rota y copia el resultado al canvas destino vía `drawImage`.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

const uiRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
const uiScene = new THREE.Scene();
const uiCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
uiScene.add(new THREE.AmbientLight(0xffffff, 0.8));
const uiDirLight = new THREE.DirectionalLight(0xffffff, 1.2);
uiDirLight.position.set(5, 10, 7);
uiScene.add(uiDirLight);

/**
 * @typedef {{ canvas: HTMLCanvasElement, group: THREE.Group, isDiagonal: boolean }} UICanvasEntry
 */

/** @type {UICanvasEntry[]} */
export const activeUICanvases = [];

/**
 * Inicializa el renderer UI (no requiere DOM mount; solo renderiza a textura interna).
 */
export function initUI3D() {
  // Reservado por si en el futuro hay ajustes globales del mini-renderer.
}

/**
 * Renderiza todos los canvas UI registrados que sigan en el documento.
 */
export function renderUICanvases() {
  const filtered = activeUICanvases.filter((obj) => document.body.contains(obj.canvas));
  activeUICanvases.length = 0;
  activeUICanvases.push(...filtered);

  activeUICanvases.forEach((obj) => {
    const wrapper = new THREE.Group();
    wrapper.add(obj.group);

    const box = new THREE.Box3().setFromObject(wrapper);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.group.position.sub(center);

    if (obj.isDiagonal) wrapper.rotation.z = -Math.PI / 4;
    wrapper.rotation.y = (Date.now() * 0.001) % (Math.PI * 2);

    uiScene.add(wrapper);
    uiCamera.position.set(0, 0, maxDim * 1.3 + 2);
    uiCamera.lookAt(0, 0, 0);

    uiRenderer.setSize(obj.canvas.width, obj.canvas.height, false);
    uiRenderer.render(uiScene, uiCamera);

    const ctx = obj.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, obj.canvas.width, obj.canvas.height);
      ctx.drawImage(uiRenderer.domElement, 0, 0);
    }

    uiScene.remove(wrapper);
  });
}
