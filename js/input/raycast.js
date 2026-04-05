/**
 * Raycasting desde la cámara hacia `clickables`: hover muestra tooltip de edificio,
 * clic izquierdo abre el panel asociado al `userData.type`.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { camera, renderer } from '../scene/setup.js';
import { clickables } from '../scene/interaction.js';
import { openPanel } from '../ui/panels.js';

const ray = new THREE.Raycaster();
const mpos = new THREE.Vector2();

/**
 * Normaliza coordenadas de pantalla a NDC para Three.js.
 * @param {number} x
 * @param {number} y
 */
function setMouse(x, y) {
  mpos.x = (x / window.innerWidth) * 2 - 1;
  mpos.y = -(y / window.innerHeight) * 2 + 1;
}

/**
 * Hover sobre edificios: tooltip textual y cursor pointer.
 * @param {number} x
 * @param {number} y
 */
export function doHover(x, y) {
  setMouse(x, y);
  ray.setFromCamera(mpos, camera);
  const hits = ray.intersectObjects(clickables);
  const tip = document.getElementById('tooltip');
  const cv = renderer.domElement;
  if (hits.length && hits[0].object.userData.label && tip) {
    tip.textContent = hits[0].object.userData.label;
    tip.classList.add('on');
    cv.style.cursor = 'pointer';
  } else if (tip) {
    tip.classList.remove('on');
    cv.style.cursor = 'default';
  }
}

/**
 * Clic en el mundo: abre panel según tipo de edificio.
 * @param {number} x
 * @param {number} y
 */
export function doClick(x, y) {
  setMouse(x, y);
  ray.setFromCamera(mpos, camera);
  const hits = ray.intersectObjects(clickables);
  if (!hits.length) return;
  const type = hits[0].object.userData.type;
  if (type === 'launchpad') openPanel('launch-panel');
  if (type === 'warehouse') openPanel('warehouse-panel');
  if (type === 'store') openPanel('store-panel');
}
