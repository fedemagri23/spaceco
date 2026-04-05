/**
 * Objetos 3D que responden a raycasting (clic / hover).
 *
 * `registerClickable` marca mallas con `userData.type` y `userData.label` para que
 * `input/raycast.js` abra paneles o muestre tooltips. Ver docs/agregar-edificio.md.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

/** @type {THREE.Mesh[]} */
export const clickables = [];

/**
 * Registra una malla como interactiva en la escena principal.
 * @param {THREE.Mesh} mesh
 * @param {string} type - ej. 'launchpad' | 'warehouse' | 'store' | 'storage' | 'control_tower'
 * @param {string} label - texto del tooltip flotante
 * @returns {THREE.Mesh}
 */
export function registerClickable(mesh, type, label) {
  mesh.userData = { type, label };
  clickables.push(mesh);
  return mesh;
}
