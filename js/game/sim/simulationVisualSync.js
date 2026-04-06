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
  root.rotation.z = (entity.angleDeg * Math.PI) / 180 - Math.PI / 2;
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
