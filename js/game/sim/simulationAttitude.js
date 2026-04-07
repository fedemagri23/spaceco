/**
 * Dinámica de actitud (SPIN/ENGSPINY/ENGSPINZ) basada en empuje + inercia aproximada.
 */

import { PARTS } from '../../config/parts.js';
import {
  ATTITUDE_MAX_GIMBAL_DEG,
  ATTITUDE_DAMPING_FACTOR,
  ATTITUDE_MIN_LEVER_ARM_M,
  ATTITUDE_LEVER_ARM_RATIO,
} from '../../config/simTuning.js';

/**
 * @param {ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null} plan
 * @returns {number}
 */
function estimateRocketLengthM(plan) {
  if (!plan) return 20;
  let h = 0;
  plan.segments.forEach((seg) => {
    if (seg.kind === 'motors') {
      const p = PARTS[seg.engineId];
      if (p?.h) h += p.h;
      return;
    }
    const p = PARTS[seg.id];
    if (p?.h) h += p.h;
  });
  return Math.max(8, h || 20);
}

/**
 * @param {{
 *   entity: any,
 *   pendingSpinYDeg: number,
 *   pendingSpinZDeg: number,
 *   motorsOperational: boolean,
 *   thrustN: number,
 *   dt: number,
 *   plan: ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null,
 * }} args
 * @returns {{ y: number, z: number }} grados aplicados este frame en cada eje
 */
export function updateAttitudeStep({
  entity,
  pendingSpinYDeg,
  pendingSpinZDeg,
  motorsOperational,
  thrustN,
  dt,
  plan,
}) {
  const hasPendingY = Math.abs(pendingSpinYDeg) > 1e-4;
  const hasPendingZ = Math.abs(pendingSpinZDeg) > 1e-4;

  let appliedY = 0;
  let appliedZ = 0;

  // Procesar eje Y
  if (hasPendingY && motorsOperational && thrustN > 0) {
    const rocketLen = estimateRocketLengthM(plan);
    const inertiaApprox = Math.max(1, entity.mass * rocketLen * rocketLen / 12);
    const leverArm = Math.max(ATTITUDE_MIN_LEVER_ARM_M, rocketLen * ATTITUDE_LEVER_ARM_RATIO);
    const maxGimbalRad = (ATTITUDE_MAX_GIMBAL_DEG * Math.PI) / 180;
    const torque = thrustN * leverArm * Math.sin(maxGimbalRad);
    const angularAccDegS2 = (torque / inertiaApprox) * (180 / Math.PI);

    entity.angularVelocityYDegS += Math.sign(pendingSpinYDeg) * angularAccDegS2 * dt;
  } else if (!hasPendingY) {
    entity.angularVelocityYDegS = 0;
  }

  // Procesar eje Z
  if (hasPendingZ && motorsOperational && thrustN > 0) {
    const rocketLen = estimateRocketLengthM(plan);
    const inertiaApprox = Math.max(1, entity.mass * rocketLen * rocketLen / 12);
    const leverArm = Math.max(ATTITUDE_MIN_LEVER_ARM_M, rocketLen * ATTITUDE_LEVER_ARM_RATIO);
    const maxGimbalRad = (ATTITUDE_MAX_GIMBAL_DEG * Math.PI) / 180;
    const torque = thrustN * leverArm * Math.sin(maxGimbalRad);
    const angularAccDegS2 = (torque / inertiaApprox) * (180 / Math.PI);

    entity.angularVelocityZDegS += Math.sign(pendingSpinZDeg) * angularAccDegS2 * dt;
  } else if (!hasPendingZ) {
    entity.angularVelocityZDegS = 0;
  }

  // Aplicar damping solo si hay velocidad (después de sumar aceleración)
  const angDamp = Math.exp(-ATTITUDE_DAMPING_FACTOR * dt);
  entity.angularVelocityYDegS *= angDamp;
  entity.angularVelocityZDegS *= angDamp;

  // Calcular rotación en eje Y
  const freeDeltaY = entity.angularVelocityYDegS * dt;
  if (hasPendingY) {
    const minRotation = Math.sign(pendingSpinYDeg) * 0.01; // Mínimo 0.01° por frame si hay pendiente
    appliedY = Math.sign(pendingSpinYDeg) * Math.min(Math.abs(freeDeltaY), Math.abs(pendingSpinYDeg));
    // Si appliedY es muy pequeño pero hay pendiente, aplicar al menos el mínimo
    if (Math.abs(appliedY) < Math.abs(minRotation)) {
      appliedY = minRotation;
    }
  } else {
    appliedY = freeDeltaY;
  }

  // Calcular rotación en eje Z
  const freeDeltaZ = entity.angularVelocityZDegS * dt;
  if (hasPendingZ) {
    const minRotation = Math.sign(pendingSpinZDeg) * 0.01; // Mínimo 0.01° por frame si hay pendiente
    appliedZ = Math.sign(pendingSpinZDeg) * Math.min(Math.abs(freeDeltaZ), Math.abs(pendingSpinZDeg));
    // Si appliedZ es muy pequeño pero hay pendiente, aplicar al menos el mínimo
    if (Math.abs(appliedZ) < Math.abs(minRotation)) {
      appliedZ = minRotation;
    }
  } else {
    appliedZ = freeDeltaZ;
  }

  return { y: appliedY, z: appliedZ };
}
