/**
 * Acciones de secuencia de lanzamiento (THROTTLE, SEPARATE, SPIN, ENGSPINY, ENGSPINZ).
 */

import { scene } from '../../scene/setup.js';
import { getPadRocketGroup } from '../../scene/rocketPad.js';
import { ROCKET_MESH_VISUAL_SCALE } from '../../scene/rocketMesh.js';
import { getActiveBottomPhase } from '../rocketPhases.js';
import { removeFuelTanksForSeparatedPhase, recomputeEntityMass } from '../fuelTanks.js';
import { pushSeparatedDebris } from './simulationDebris.js';

/**
 * @param {{
 *   rocketEntity: any,
 *   getPlan: () => ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null
 * }} deps
 * @returns {(raw: string) => void}
 */
export function createApplySequenceAction(deps) {
  return (raw) => {
    const s = raw.trim();
    let m = s.match(/^THROTTLE\s+(\d+)\s+(\d+(?:\.\d+)?)\s*%$/i);
    if (m) {
      const phase = Number(m[1]);
      const pct = Math.max(0, Math.min(100, Number(m[2])));
      deps.rocketEntity.throttleByPhase[phase] = pct / 100;
      return;
    }

    m = s.match(/^SEPARATE\s+(\d+)$/i);
    if (m) {
      separatePhaseNumber(Number(m[1]), deps.rocketEntity, deps.getPlan);
      return;
    }

    m = s.match(/^SPIN\s+([-+]?\d+)$/i);
    if (m) {
      const angle = Number(m[1]);
      const active = getActiveBottomPhase(deps.rocketEntity.separatedPhases, deps.rocketEntity.maxPhase);
      if (active !== null) {
        deps.rocketEntity.pendingEngineSpinYDegByPhase[active] =
          (deps.rocketEntity.pendingEngineSpinYDegByPhase[active] ?? 0) + angle;
      }
      return;
    }

    // ENGSPINY
    m = s.match(/^ENGSPINY\s+(\d+)\s+([-+]?\d+(?:\.\d+)?)d$/i);
    if (m) {
      const phase = Number(m[1]);
      const angle = Number(m[2]);
      if (phase < 1 || phase > deps.rocketEntity.maxPhase || deps.rocketEntity.separatedPhases.has(phase)) return;
      deps.rocketEntity.pendingEngineSpinYDegByPhase[phase] =
        (deps.rocketEntity.pendingEngineSpinYDegByPhase[phase] ?? 0) + angle;
      return;
    }

    // ENGSPINZ
    m = s.match(/^ENGSPINZ\s+(\d+)\s+([-+]?\d+(?:\.\d+)?)d$/i);
    if (!m) return;
    const phase = Number(m[1]);
    const angle = Number(m[2]);
    if (phase < 1 || phase > deps.rocketEntity.maxPhase || deps.rocketEntity.separatedPhases.has(phase)) return;
    deps.rocketEntity.pendingEngineSpinZDegByPhase[phase] =
      (deps.rocketEntity.pendingEngineSpinZDegByPhase[phase] ?? 0) + angle;
  };
}

/**
 * @param {number} phaseNum
 * @param {any} entity
 * @param {() => ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null} getPlan
 */
function separatePhaseNumber(phaseNum, entity, getPlan) {
  const root = getPadRocketGroup();
  if (!root || !root.userData.phaseGroups) return;
  if (entity.separatedPhases.has(phaseNum)) return;

  /** @type {THREE.Group[]} */
  const groups = root.userData.phaseGroups;
  const idx = phaseNum - 1;
  if (idx < 0 || idx >= groups.length) return;

  const pg = groups[idx];
  const h = pg.userData.phaseHeight ?? 0;
  scene.attach(pg);
  pushSeparatedDebris(pg, entity.velocity);

  for (const ch of root.children) {
    ch.position.y -= h;
  }
  groups.splice(idx, 1);
  entity.separatedPhases.add(phaseNum);
  removeFuelTanksForSeparatedPhase(entity, phaseNum);
  recomputeEntityMass(entity, getPlan());
  entity.position.y += h * ROCKET_MESH_VISUAL_SCALE;
}
