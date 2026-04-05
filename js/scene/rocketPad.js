/**
 * Cohete desplegado en la plataforma de lanzamiento 3D.
 * Coordenadas alineadas con `createBuildings()` (PAD_X, PAD_Z, altura de superficie).
 */

import { scene } from './setup.js';
import { buildRocketMesh } from './rocketMesh.js';

export const PAD_X = 55;
export const PAD_Z = 0;
export const PAD_Y = 5;
export const PAD_SURFACE_Y = PAD_Y + 1;

/** @type {THREE.Group | null} */
let padRocketGroup = null;

/**
 * Coloca o quita el modelo del cohete sobre la plataforma.
 * @param {string[] | null | undefined} parts
 */
export function placeRocketOnPad(parts) {
  if (padRocketGroup) {
    scene.remove(padRocketGroup);
    padRocketGroup = null;
  }
  if (!parts || parts.length === 0) return;
  padRocketGroup = buildRocketMesh(parts);
  padRocketGroup.position.set(PAD_X, PAD_SURFACE_Y, PAD_Z);
  scene.add(padRocketGroup);
}
