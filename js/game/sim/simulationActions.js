import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from '../../scene/setup.js';
import { getPadRocketGroup } from '../../scene/rocketPad.js';
import { ROCKET_MESH_VISUAL_SCALE } from '../../scene/rocketMesh.js';
import { getActiveBottomPhase } from '../rocketPhases.js';
import { removeFuelTanksForSeparatedPhase, recomputeEntityMass } from '../fuelTanks.js';
import { pushSeparatedDebris, pushReleasedPayload } from './simulationDebris.js';

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

    // YAW
    m = s.match(/^YAW\s+([-+]?\d+(?:\.\d+)?)\s*d?$/i);
    if (m) {
      const active = getActiveBottomPhase(deps.rocketEntity.separatedPhases, deps.rocketEntity.maxPhase);
      const angle = Number(m[1]);
      if (active !== null) {
        deps.rocketEntity.pendingEngineSpinYDegByPhase[active] =
          (deps.rocketEntity.pendingEngineSpinYDegByPhase[active] ?? 0) + angle;
      }
      return;
    }

    // PITCH
    m = s.match(/^PITCH\s+([-+]?\d+(?:\.\d+)?)\s*d?$/i);
    if (m) {
      const active = getActiveBottomPhase(deps.rocketEntity.separatedPhases, deps.rocketEntity.maxPhase);
      const angle = Number(m[1]);
      if (active !== null) {
        deps.rocketEntity.pendingEngineSpinZDegByPhase[active] =
          (deps.rocketEntity.pendingEngineSpinZDegByPhase[active] ?? 0) + angle;
      }
      return;
    }

    // RELEASE
    m = s.match(/^RELEASE$/i);
    if (m) {
      releasePayload(deps.rocketEntity);
      return;
    }
  };
}

/**
 * @param {number} phaseNum
 * @param {any} entity
 * @param {() => ReturnType<import('../rocketPhases.js').buildPhasePlanFromSpec> | null} getPlan
 */
export function separatePhaseNumber(phaseNum, entity, getPlan) {
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

/**
 * Libera la carga útil (satélite) del cohete.
 */
export function releasePayload(entity) {
  const root = getPadRocketGroup();
  if (!root || !root.userData.payloadMesh) {
    console.warn("Payload mesh not found in rocket group.");
    return;
  }

  const pm = root.userData.payloadMesh;
  
  // THREE.scene.attach maneja automáticamente la transición de coordenadas locales a mundiales
  // incluyendo escala y rotación.
  scene.attach(pm);
  
  // Prevenir múltiples liberaciones
  root.userData.payloadMesh = null; 

  // Agregar a la lista de debris con velocidad física heredada
  pushReleasedPayload(pm, entity.velocity);
  console.log("Payload released successfully.");
}
