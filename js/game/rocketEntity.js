/**
 * Cohete-entidad único: el que está en plataforma o en vuelo.
 */

import { PAD_X, PAD_Z, PAD_SURFACE_Y } from '../scene/rocketPad.js';
import { GRAVITY_SURFACE_MS2 } from './physics.js';

/**
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
 * @property {number} angleDeg - desde la horizontal (90 = hacia +Y)
 * @property {Record<number, number>} throttleByPhase - fase → 0..1
 * @property {Set<number>} separatedPhases - fases ya separadas (1-based)
 * @property {number} missionElapsed - s desde fin de cuenta atrás (T+0)
 * @property {number} dragRefAreaM2 - área ref. arrastre (m²)
 * @property {number} dragCoeff
 * @property {number} maxPhase - fases del montaje actual
 * @property {{ tankIndex: number, segmentIndex: number, phase: number, maxFuelKg: number, currentFuelKg: number, dryMassKg: number }[]} fuelTanks
 * @property {number} referenceMassKg - masa total del cohete completo en plataforma (referencia para %)
 */

/**
 * @returns {RocketEntityState}
 */
export function createRocketEntityState() {
  return {
    position: { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z },
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    mass: 50000,
    gravity: GRAVITY_SURFACE_MS2,
    angleDeg: 90,
    throttleByPhase: {},
    separatedPhases: new Set(),
    missionElapsed: 0,
    dragRefAreaM2: 14,
    dragCoeff: 0.45,
    maxPhase: 0,
    fuelTanks: [],
    referenceMassKg: 0,
  };
}

/**
 * @returns {RocketEntityState}
 */
export function resetRocketEntityToPad() {
  return {
    position: { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z },
    velocity: { x: 0, y: 0, z: 0 },
    acceleration: { x: 0, y: 0, z: 0 },
    mass: 50000,
    gravity: GRAVITY_SURFACE_MS2,
    angleDeg: 90,
    throttleByPhase: {},
    separatedPhases: new Set(),
    missionElapsed: 0,
    dragRefAreaM2: 14,
    dragCoeff: 0.45,
    maxPhase: 0,
    fuelTanks: [],
    referenceMassKg: 0,
  };
}
