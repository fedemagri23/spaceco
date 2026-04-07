/**
 * Sincronización visual del cohete (transform + llamas).
 */

import { getActiveBottomPhase } from '../rocketPhases.js';
import { activeStageCanProduceThrust } from '../fuelTanks.js';
import { updatePhaseFlames } from '../../scene/rocketFlames.js';

/**
 * @param {THREE.Group} root
 * @param {any} entity
 */
export function syncRocketTransform(root, entity) {
  root.position.set(entity.position.x, entity.position.y, entity.position.z);
  // Usar orden XYZ (X primero, luego Z lateral).
  root.rotation.order = 'XYZ';
  root.rotation.x = ((90 - entity.angleDeg) * Math.PI) / 180; // Pitch: Mueve la nariz hacia el eje Z
  root.rotation.y = 0; // Roll no usado
  root.rotation.z = -(entity.angleZDeg * Math.PI) / 180;      // Yaw: Mueve la nariz hacia el eje X
}

/**
 * @param {THREE.Group | null} root
 * @param {any} entity
 * @param {ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null} plan
 * @param {number} timeSec
 */
export function updateFlamesVisual(root, entity, plan, timeSec) {
  if (!root || !root.userData.phaseGroups || !plan) return;
  const active = getActiveBottomPhase(entity.separatedPhases, entity.maxPhase);
  root.userData.phaseGroups.forEach((pg) => {
    const orig = pg.userData.originalPhaseIndex ?? pg.userData.phaseIndex;
    const th = entity.throttleByPhase[orig] ?? 0;
    const on = active === orig && th > 0 && activeStageCanProduceThrust(entity, plan, orig);
    updatePhaseFlames(pg, th, on, timeSec);
  });
}
