/**
 * Dinámica de actitud (SPIN/ENGSPIN) basada en empuje + inercia aproximada.
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
 *   pendingSpinDeg: number,
 *   motorsOperational: boolean,
 *   thrustN: number,
 *   dt: number,
 *   plan: ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null,
 * }} args
 * @returns {number} grados aplicados este frame
 */
export function updateAttitudeStep({
  entity,
  pendingSpinDeg,
  motorsOperational,
  thrustN,
  dt,
  plan,
}) {
  if (Math.abs(pendingSpinDeg) > 1e-4 && motorsOperational && thrustN > 0) {
    const rocketLen = estimateRocketLengthM(plan);
    const inertiaApprox = Math.max(1, entity.mass * rocketLen * rocketLen / 12);
    const leverArm = Math.max(ATTITUDE_MIN_LEVER_ARM_M, rocketLen * ATTITUDE_LEVER_ARM_RATIO);
    const maxGimbalRad = (ATTITUDE_MAX_GIMBAL_DEG * Math.PI) / 180;
    const torque = thrustN * leverArm * Math.sin(maxGimbalRad);
    const angularAccDegS2 = (torque / inertiaApprox) * (180 / Math.PI);
    entity.angularVelocityDegS += Math.sign(pendingSpinDeg) * angularAccDegS2 * dt;
  }

  const angDamp = Math.exp(-ATTITUDE_DAMPING_FACTOR * dt);
  entity.angularVelocityDegS *= angDamp;
  const freeDeltaAngle = entity.angularVelocityDegS * dt;
  if (Math.abs(pendingSpinDeg) < 1e-4) return freeDeltaAngle;
  return Math.sign(pendingSpinDeg) * Math.min(Math.abs(freeDeltaAngle), Math.abs(pendingSpinDeg));
}
