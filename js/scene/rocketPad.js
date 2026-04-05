/**
 * Cohete desplegado en la plataforma de lanzamiento 3D.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './setup.js';
import { buildRocketMeshPhased } from './rocketMeshPhased.js';

export const PAD_X = -265;
export const PAD_Z = 100;
export const PAD_Y = 5;
export const PAD_SURFACE_Y = PAD_Y + 1;

/** @type {THREE.Group | null} */
let padRocketGroup = null;

/**
 * @returns {THREE.Group | null}
 */
export function getPadRocketGroup() {
  return padRocketGroup;
}

/**
 * Coloca o quita el modelo del cohete sobre la plataforma (malla por fases para simulación).
 * @param {unknown} spec - segmentos de ensamblaje o `string[]` legacy
 */
export function placeRocketOnPad(spec) {
  if (padRocketGroup) {
    scene.remove(padRocketGroup);
    padRocketGroup = null;
  }
  if (!spec || !Array.isArray(spec) || spec.length === 0) return;
  const { root } = buildRocketMeshPhased(spec);
  padRocketGroup = root;
  padRocketGroup.position.set(PAD_X, PAD_SURFACE_Y, PAD_Z);
  scene.add(padRocketGroup);
}
