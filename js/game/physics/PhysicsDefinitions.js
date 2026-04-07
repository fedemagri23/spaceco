/**
 * Pure physics definitions for the SpaceCo flight simulation.
 * These functions are stateless and used by the SimulationLoop to calculate the rocket's update.
 */

import { getEngineSimulation } from '../../config/partSimulation.js';

export const EARTH_RADIUS_M = 6_371_000;
export const GRAVITY_SURFACE_MS2 = 9.80665;
export const EARTH_GM = GRAVITY_SURFACE_MS2 * EARTH_RADIUS_M * EARTH_RADIUS_M;
export const AIR_DENSITY_SEA_LEVEL = 1.225;
const AIR_SCALE_HEIGHT = 8500;

/**
 * Calculates gravity magnitude at a given altitude.
 * g(h) = g0 * (R / (R + h))^2
 */
export function calculateGravity(altitudeM) {
  const h = Math.max(0, altitudeM);
  const ratio = EARTH_RADIUS_M / (EARTH_RADIUS_M + h);
  return GRAVITY_SURFACE_MS2 * ratio * ratio;
}

/**
 * Calculates air density at a given altitude using exponential decay model.
 */
export function calculateAirDensity(altitudeM) {
  return AIR_DENSITY_SEA_LEVEL * Math.exp(-Math.max(0, altitudeM) / AIR_SCALE_HEIGHT);
}

/**
 * Calculates drag acceleration vector based on velocity and air density.
 */
export function calculateDragAcceleration(massKg, velocity, rho, dragCoeff, refAreaM2) {
  if (massKg <= 0) return { x: 0, y: 0, z: 0 };
  const { x: vx, y: vy, z: vz } = velocity;
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (speed < 1e-6) return { x: 0, y: 0, z: 0 };

  const dragForceMag = 0.5 * rho * speed * speed * dragCoeff * refAreaM2;
  const aMag = dragForceMag / massKg;
  const invSpeed = 1 / speed;
  
  return {
    x: -vx * invSpeed * aMag,
    y: -vy * invSpeed * aMag,
    z: -vz * invSpeed * aMag
  };
}

/**
 * Calculates thrust acceleration vector based on rocket's attitude (pitch and yaw).
 */
export function calculateThrustAcceleration(thrustN, massKg, pitchDeg, yawDeg) {
  if (massKg <= 0) return { x: 0, y: 0, z: 0 };
  
  // Convertimos de esféricas a Ejes Euler Independientes.
  // pitchDeg empieza en 90. thetaX inclina hacia el eje Z.
  const thetaX = ((90 - pitchDeg) * Math.PI) / 180;
  // yawDeg es la inclinación lateral (sobre el eje Z), inclina hacia el eje X.
  const thetaZ = (yawDeg * Math.PI) / 180;

  const a = thrustN / massKg;

  // Vector base vertical: rotado en X y luego en Z
  const vy = Math.cos(thetaX);
  const vz = Math.sin(thetaX);

  return {
    x: a * (vy * Math.sin(thetaZ)),
    y: a * (vy * Math.cos(thetaZ)),
    z: a * vz
  };
}

/**
 * Calculates wind force based on wind intensity and altitude.
 */
export function calculateWindForce(altitudeM, windIntensity, windDirectionDeg) {
  const heightFactor = Math.min(1, altitudeM / 10000);
  const currentIntensity = windIntensity * heightFactor;
  const rad = (windDirectionDeg * Math.PI) / 180;
  
  return {
    x: currentIntensity * Math.sin(rad),
    y: 0,
    z: currentIntensity * Math.cos(rad)
  };
}

/**
 * Calculates required horizontal velocity for a circular orbit at a given altitude.
 */
export function calculateOrbitalVelocity(altitudeM) {
  const r = EARTH_RADIUS_M + Math.max(0, altitudeM);
  return Math.sqrt(EARTH_GM / r);
}

/**
 * Calculates total thrust produced by a cluster of engines.
 */
export function calculateClusterThrust(motorCount, throttle01, engineId) {
  const { thrustN: perMotor } = getEngineSimulation(engineId);
  return perMotor * motorCount * Math.max(0, Math.min(1, throttle01));
}

/**
 * Euler integration step.
 */
export function integrateEuler(position, velocity, acceleration, dt) {
  velocity.x += acceleration.x * dt;
  velocity.y += acceleration.y * dt;
  velocity.z += acceleration.z * dt;

  position.x += velocity.x * dt;
  position.y += velocity.y * dt;
  position.z += velocity.z * dt;
}
