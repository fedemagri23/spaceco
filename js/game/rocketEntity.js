/**
 * RocketEntity represents the active rocket in the simulation.
 * It encapsulates physical state, mass, fuel, and engine properties.
 */

import { PAD_X, PAD_Z, PAD_SURFACE_Y } from '../scene/rocketPad.js';
import { GRAVITY_SURFACE_MS2 } from './physics/PhysicsDefinitions.js';

export class RocketEntity {
  constructor() {
    this.reset();
  }

  /**
   * Resets rocket state to pad defaults.
   */
  reset() {
    this.position = { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    
    this.mass = 50000;
    this.gravity = GRAVITY_SURFACE_MS2;
    this.angleDeg = 90; // vertical (pitch)
    this.angleZDeg = 0; // horizontal (yaw)
    
    this.angularVelocityYDegS = 0;
    this.angularVelocityZDegS = 0;

    this.throttleByPhase = {}; // phase -> 0..1
    this.separatedPhases = new Set();
    this.missionElapsed = 0;
    
    this.dragRefAreaM2 = 14;
    this.dragCoeff = 0.45;
    this.maxPhase = 0;
    this.fuelTanks = [];
    this.referenceMassKg = 0;

    // Control parameters for engine gimbaling (SPIN/ENGINE SPIN)
    this.pendingEngineSpinYDegByPhase = {};
    this.pendingEngineSpinZDegByPhase = {};
    
    // Mission specific state
    this.payloadId = null;
    this.isSatelliteReleased = false;
  }

  /**
   * Sets the throttle for a specific phase.
   * @param {number} phase - 1-indexed phase number
   * @param {number} throttle01 - 0 to 1
   */
  setThrottle(phase, throttle01) {
    if (this.separatedPhases.has(phase)) return;
    this.throttleByPhase[phase] = Math.max(0, Math.min(1, throttle01));
  }

  getThrottle(phase) {
    return this.throttleByPhase[phase] ?? 0;
  }

  /**
   * Signals a phase separation. Use the actual separation logic provided by the sim or scene.
   * @param {number} phase - 1-indexed phase number
   */
  separate(phase) {
    if (this.separatedPhases.has(phase)) return;
    this.separatedPhases.add(phase);
    // Note: External logic usually handles mass recomputation and model updates.
  }

  /**
   * Adds a spin command for a phase.
   */
  addSpin(phase, degrees, axis = 'Y') {
    if (this.separatedPhases.has(phase)) return;
    const key = axis === 'Y' ? 'pendingEngineSpinYDegByPhase' : 'pendingEngineSpinZDegByPhase';
    this[key][phase] = (this[key][phase] ?? 0) + degrees;
  }

  /**
   * Returns current altitude AGL (Above Ground Level).
   */
  getAltitude() {
    return this.position.y - PAD_SURFACE_Y;
  }

  /**
   * Updates internal physics integration state.
   */
  updatePosition(pos, vel, acc) {
    this.position = { ...pos };
    this.velocity = { ...vel };
    this.acceleration = { ...acc };
  }

  /**
   * Sets common parameters from a build spec.
   */
  initializeFromSpec(spec, initialMass) {
    this.reset();
    this.mass = initialMass;
    this.referenceMassKg = initialMass;
    // Further initialization via simulation setup...
  }

  /**
   * Checks if payload is in orbit conditions.
   * Typically: Altitude > 180km, Velocity > 7500 m/s (horizontal)
   */
  checkOrbitalStatus() {
    const alt = this.getAltitude();
    const vx = this.velocity.x;
    const vz = this.velocity.z;
    const horizSpeed = Math.sqrt(vx * vx + vz * vz);
    
    // Orbital mechanics: very rough simplification for the game.
    // Near circular orbit at 200km is ~7.8 km/s.
    const isSuitableAlt = alt > 180_000;
    const isSuitableSpeed = horizSpeed > 7500;
    
    return isSuitableAlt && isSuitableSpeed;
  }
}
