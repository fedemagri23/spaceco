/**
 * Cohete-entidad único: el que está en plataforma o en vuelo (futuro).
 * Estado cinemático / físico para simulación de lanzamiento.
 *
 * @typedef {Object} Vec3
 * @property {number} x
 * @property {number} y
 * @property {number} z
 *
 * @typedef {Object} RocketEntityState
 * @property {Vec3} position
 * @property {Vec3} velocity
 * @property {Vec3} acceleration
 * @property {number} mass
 * @property {number} gravity
 * @property {number} angleDeg - ángulo en grados
 */

import { PAD_X, PAD_Z, PAD_SURFACE_Y } from '../scene/rocketPad.js';

/**
 * @returns {RocketEntityState}
 */
export function createRocketEntityState() {
  return {
    position: { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z },
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    mass: 50000,
    gravity: 9.81,
    angleDeg: 90,
  };
}

/**
 * Alinea posición y cinemática con el cohete en plataforma (tras despliegue).
 */
export function resetRocketEntityToPad() {
  return {
    position: { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z },
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    mass: 50000,
    gravity: 9.81,
    angleDeg: 90,
  };
}
